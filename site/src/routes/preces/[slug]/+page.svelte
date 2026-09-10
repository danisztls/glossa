<script lang="ts">
	/**
	 * One prayer's reading page: a standalone `.content-column`, and now every
	 * prayer the same shape. The Rosary was the one exception, taking the
	 * shared `.reading-layout` for a sidebar to hold a table of contents over
	 * its four mystery sets — `PrayerMysteries` shows one set at a time, so
	 * there is no four-part text left to navigate and nothing for a second
	 * column to do.
	 *
	 * THE SECOND COLUMN IS A CHOICE HERE TOO, and it used to be hardcoded to
	 * Latin. The reasoning for that was sound as far as it went — a prayer's
	 * `latin` is a FIELD on the one canonical work (docs/corpus-schema.md
	 * "Prayers": "Latin is a field, not an edition"), so there is no second
	 * `WorkManifest` for it — but it answered the wrong question. That Latin
	 * is not an edition explains why it cannot be the ONLY thing offered; it
	 * never explained why the OTHER vernacular could not be. `+page.ts`
	 * already embeds every language's copy of the slug, so English against
	 * Português was one line of markup away the whole time, and a reader who
	 * compares translations everywhere else on the site arrived here to find
	 * the picker replaced by the word "Latina".
	 *
	 * So this route now resolves a target like every other one
	 * (`compare.resolveTarget`), over every OTHER language's copy of this
	 * same slug — all of them real works with real ids.
	 *
	 * SO IS THE UK WORDING. The source prints one English appendix in which
	 * five prayers appear twice, headed "UK VERSION" and "USA VERSION"; this
	 * route used to render both, boxed and labelled, one above the other, so a
	 * reader who wanted the Te Deum had to choose between two regional labels
	 * before reading a word. That is an edition boundary, and is now built as
	 * one: `prayer.common.en` is the collection and prints the USA wording,
	 * `prayer.common.en-gb` is those five prayers in the UK wording and
	 * nothing else (site/docs/addresses.md). The reader picks once, in
	 * the same menu as every other work, and `variants` is gone from the
	 * schema rather than carried for five entries.
	 *
	 * WHICH MEANS THE UK EDITION IS ABSENT FROM 23 OF THESE PAGES, and nothing
	 * here announces that. `byLang` simply has no `en-gb` entry for the Our
	 * Father, `resolveEditionTag` lands on `en`, and the reader gets the only
	 * English text there is — the one their own source prints under the same
	 * heading. A notice would be telling them they are reading a fallback when
	 * what they are reading is the text.
	 *
	 * LATIN IS ONE OF THEM TOO. It used to be the exception this file existed
	 * to accommodate: a fabricated `prayer.latin` target whose manifest was
	 * the vernacular work's with `id` and `language` overwritten, because the
	 * schema held that "Latin is a field, not an edition". That ruling is
	 * reversed (docs/decisions.md) and `prayer.common.la` is a real work, so
	 * the fabrication and the second cell shape it needed are both gone —
	 * every column on this page is now a whole `Prayer` from a whole edition.
	 * The `latin` FIELD stays in the corpus, unchanged: it is what the source
	 * prints, and it is what the Latin edition was derived from.
	 *
	 * Latin sorts first among the alternatives, so it stays what `AUTO` picks
	 * and what a reader who has expressed no preference sees — `/preces`' own
	 * tagline is "Prayers with the Latin text alongside", and that remains the
	 * default reading of the page.
	 *
	 * A ROW IS A PRINTED LINE, NOT THE PRAYER — see `compareRows`, which holds
	 * the argument for zipping the two columns by position and what it costs.
	 * A prayer's own `n` never enters it: `n` is print order WITHIN ITS OWN
	 * LANGUAGE'S list, and what makes two entries the same prayer is the SLUG,
	 * which this page already IS.
	 *
	 * BLOCKS ARE STILL THE WRONG UNIT TO ZIP, and lines are not blocks. The
	 * Angelus has 14 vernacular blocks (its versicle/response lines kept
	 * separate) against 10 Latin ones, because the Latin source collapses each
	 * repeated "Hail Mary" into one fused "Ave, María..." line — a per-block zip
	 * pairs the second block with the second block and is wrong from there down.
	 * Flattening to lines does not make those two editions agree either; what it
	 * does is make the disagreement a line's worth rather than a block's, and
	 * visible where it happens rather than as an accumulating drift.
	 */
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import {
		pairPrayerLines,
		plainLine,
		prayerLines,
		prayerTexts,
		type PrayerRow
	} from '$lib/prayer-lines';
	import { compare } from '$lib/compare-pref.svelte';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import {
		compareColumnLabel,
		getPrayerMeta,
		type PrayerMeta,
		prayerCommentariesAt,
		resolveEditionTag
	} from '$lib/corpus';
	import {
		apparatusPrefs,
		commentaryDefaultsOn,
		commentaryFamily
	} from '$lib/apparatus-prefs.svelte';
	import { prayerNotesFor } from '$lib/commentary.svelte';
	import { prayerReferences } from '$lib/corpus-index';
	import { placePrayerCommentary, type CommentaryEntry } from '$lib/commentary-placement';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { slotted } from '$lib/rosary';
	import CompareField from '$lib/components/CompareField.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import UnitNav from '$lib/components/UnitNav.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import CompareCopyrightHeader from '$lib/components/CompareCopyrightHeader.svelte';
	import PrayerBlocks from '$lib/components/PrayerBlocks.svelte';
	import PrayerMysteries from '$lib/components/PrayerMysteries.svelte';
	import PrayerReferences from '$lib/components/PrayerReferences.svelte';
	import { setPosition } from '$lib/reading-position';
	import { i18n, t } from '$lib/i18n.svelte';
	import type { Prayer, WorkManifest } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/** `tagFor`, not `langFor`: `byLang` is keyed on full tags now that English
	 *  has two editions, and the bare form cannot tell them apart. */
	let lang = $derived(resolveEditionTag(Object.keys(data.byLang), content.tagFor('prayer')) ?? '');
	let current = $derived(data.byLang[lang]);

	/**
	 * The commentaries offered beside THIS prayer in THIS edition.
	 *
	 * `commentariesAt`'s twin one work type over, and everything the chapter
	 * route says about it holds: the lookup is synchronous off the index tier,
	 * so the control is settled before the page paints, and it is keyed on the
	 * address AND the edition, because a headword quotes one text. Switching
	 * edition can therefore empty the panel — which is the honest reading of
	 * what exists, since `commentary.preces.*` is written for fifteen of the
	 * collection's twenty editions and reaches two of its thirty-five prayers.
	 *
	 * There is no edition row beside it: a prayer carries no apparatus of its
	 * own, so `ApparatusChoices.edition` stays absent and the panel is the
	 * commentary switch alone.
	 */
	const commentaries = $derived(prayerCommentariesAt(data.slug, current?.work.id));

	/**
	 * Every second column this page can offer, in menu order: each OTHER
	 * language's edition of this same slug, Latin included.
	 *
	 * LATIN SORTS FIRST rather than alphabetically among the rest, and that
	 * is the one thing here that is a choice rather than a listing. `/preces`
	 * is published as "Prayers with the Latin text alongside", so Latin is
	 * what `AUTO` must keep landing on for a reader who has expressed no
	 * preference — a sibling vernacular winning that slot because its tag
	 * happens to sort earlier would quietly change what the collection is.
	 *
	 * NOT EVERY PRAYER HAS A LATIN EDITION. Seven of the twenty-eight are
	 * printed with no Latin anywhere in the source (the two Creeds, the Our
	 * Father, the three Eastern prayers, the Litany of Loreto), so
	 * `prayer.common.la` genuinely has no entry for them and `+page.ts`
	 * simply never puts one in `byLang`. Those pages offer the other
	 * vernacular instead, which is the ordinary "hide, don't disable"
	 * outcome rather than a case to handle.
	 */
	const comparisons = $derived.by(() => {
		if (!current) return [];
		const langs = Object.keys(data.byLang)
			.filter((other) => other !== lang)
			.sort((a, b) => (a === 'la' ? -1 : b === 'la' ? 1 : a.localeCompare(b)));
		return langs.map((other) => {
			const entry = data.byLang[other];
			return { work: entry.work, title: entry.prayer.title, prayer: entry.prayer };
		});
	});

	adoptCompareFromUrl();

	/** Latin first — see the module docblock on why `AUTO` must keep landing
	 *  there rather than on whichever sibling language sorts first. */
	const compareTarget = $derived(
		compare.resolveTarget(
			comparisons.map((c) => c.work.id),
			comparisons[0]?.work.id
		)
	);
	const secondary = $derived(comparisons.find((c) => c.work.id === compareTarget));
	const compareActive = $derived(secondary !== undefined);

	/** The same question asked of the SECOND column, which is another edition
	 *  and therefore another commentary work — which is what
	 *  `prayerCommentariesAt` taking an edition is for. Nothing is fetched
	 *  until it is read; `prayerNotesFor` starts the load. */
	const secondaryCommentaries = $derived(
		compareActive ? prayerCommentariesAt(data.slug, secondary?.work.id) : []
	);

	/**
	 * ONE SWITCH, THOUGH A COMPARED PAGE HOLDS TWO COMMENTARY WORKS. The choice
	 * is stored per FAMILY (`commentaryFamily`), so the two already move
	 * together and listing both would print one title twice. The reader's own
	 * edition is named where it has a commentary, and the second column's
	 * stands in for a prayer the reader's edition does not gloss — which is the
	 * case the switch would otherwise be missing from entirely, with marks in
	 * the other column and nothing to turn them off.
	 */
	const apparatusCommentaries = $derived.by(() => {
		const out: WorkManifest[] = [];
		for (const work of [...commentaries, ...secondaryCommentaries]) {
			const family = commentaryFamily(work.id);
			if (!out.some((seen) => commentaryFamily(seen.id) === family)) out.push(work);
		}
		return out;
	});

	/**
	 * The notes to set inside ONE column, one entry per switched-on commentary.
	 *
	 * BOTH COLUMNS ARE GLOSSED WHILE COMPARING, each out of its own edition's
	 * commentary (2026-09-05). That is what keying the apparatus on the edition
	 * was always for: a lemma quotes the wording of the edition it was written
	 * on, so the Latin Ave's notes are the ones that can anchor in the Latin
	 * column and the English ones in the English. The marks do not correspond
	 * across a row — the Catechism quotes different clauses in each language,
	 * eight in the English Our Father against five in the Hungarian — and that
	 * is each edition's own apparatus rather than a misalignment.
	 *
	 * IT WAS SUPPRESSED HERE UNTIL THEN, on the chapter route's reason read
	 * across: there the second column takes the width the apparatus was using.
	 * This route has no such lane to spend — the mark is inline and its card is
	 * anchored to it (`CommentaryGloss` sets nothing in the margin at any
	 * width) — so all the suppression bought was a switch reading "on" over two
	 * texts carrying no marks.
	 */
	function commentaryFor(works: WorkManifest[]): CommentaryEntry[] {
		const out: CommentaryEntry[] = [];
		for (const work of works) {
			if (!enabled(work)) continue;
			const notes = prayerNotesFor(work.id, data.slug);
			if (notes.length > 0) out.push({ work, notes });
		}
		return out;
	}

	/**
	 * Each column's printed lines, and where its commentary's marks fall.
	 *
	 * PLACED OVER THE WHOLE PRAYER AND HANDED DOWN, because a compare cell is a
	 * single line and the anchoring is not a per-line question: the cursor walks
	 * the lines once, and a lemma the edition set across a break spans two of
	 * them. `PrayerBlocks` cuts the line it is given and looks its marks up by
	 * `line.n`, which means the same thing in both arrangements.
	 */
	const primaryLines = $derived(current ? prayerLines(current.prayer.blocks) : []);
	const secondaryLines = $derived(secondary ? prayerLines(secondary.prayer.blocks) : []);
	const primaryPlacement = $derived(
		placePrayerCommentary(prayerTexts(primaryLines), commentaryFor(commentaries))
	);
	const secondaryPlacement = $derived(
		placePrayerCommentary(prayerTexts(secondaryLines), commentaryFor(secondaryCommentaries))
	);

	/** One open-mark array per COLUMN, held here because a compare cell is one
	 *  line: a quotation crossing a break lights two lines, which are two cells,
	 *  and neither could light the other from state of its own. */
	const primaryOpen: (boolean | undefined)[] = $state([]);
	const secondaryOpen: (boolean | undefined)[] = $state([]);

	/** ON UNLESS THE READER TURNED IT OFF, which `default_on` says and no other
	 *  commentary in the corpus does — `CommentaryManifest.default_on` carries
	 *  the argument. Read through one function because the enabled test and the
	 *  panel's switch have to ask the same question with the same default. */
	function enabled(work: WorkManifest): boolean {
		return apparatusPrefs.commentaryEnabled(work.id, commentaryDefaultsOn(work));
	}

	/**
	 * The passages under the text: where the Gospel prints this prayer and
	 * where the two books treat it whole.
	 *
	 * NEITHER THE APPARATUS'S SWITCH NOR ITS FETCH, since 2026-09-05. They
	 * were both for a day, on the argument that they are what the unanchored
	 * notes became — but a note is one book read in one language and this is
	 * an address, the same address for every reader. Tied to the apparatus
	 * they were absent wherever it was: the Hindi, Vietnamese and Chinese
	 * collections have no Catechism and no Compendium, and their readers saw
	 * nothing under any prayer. They are index tier now and always present.
	 */
	const references = $derived(prayerReferences[data.slug] ?? []);

	/**
	 * A ROW PER PRINTED LINE WHERE THE TWO EDITIONS BREAK ALIKE, and the whole
	 * prayer in one row where they do not (2026-09-03). `pairPrayerLines` is the
	 * rule and carries the measurement; what belongs here is why the row is the
	 * lever at all.
	 *
	 * It was one row holding each side's whole prayer. `CompareGrid` sizes each
	 * ROW to its taller cell — that is the whole of how it keeps two columns
	 * level — so a single row aligned nothing inside itself: the two columns
	 * flowed independently and stayed level only for as long as neither wrapped
	 * a line. Line-for-line alignment is therefore a row per line, which is what
	 * `prayerLines` exists to make available.
	 *
	 * `alignByNumber` is not used and is not the tool here. It aligns on numbers
	 * the two sides CARRY, over their union; a line carries only its position,
	 * and pairing by position is a claim about the source that has to be tested
	 * rather than a key to look up.
	 */
	const compareRows = $derived.by(() => {
		if (!current || !secondary) return [];
		return pairPrayerLines(primaryLines, secondaryLines);
	});

	/** Whether EITHER column has anything to put in the band above the first row
	 *  — a rubric, mystery groups, directions. An empty band is not free: its
	 *  cells carry the grid's own block padding, so it would open a gap over
	 *  every compared prayer that has none of the three, which is most of them
	 *  (English and Portuguese print no rubric at all). */
	const hasPreamble = $derived(
		[current?.prayer, secondary?.prayer].some(
			(p) => p && (p.rubric || p.groups?.length || p.instructions)
		)
	);

	/**
	 * The three prayers a decade is made of, as links.
	 *
	 * BY SLUG, NOT BY MATCHING THE SOURCE'S WORDS. The directions name them
	 * in running prose — `the "Our Father", ten "Hail Marys" and the "Glory
	 * be to the Father"`, `um Pai Nosso, dez Ave Marias e um Glória ao Pai` —
	 * and linkifying that text would mean a per-language table of prayer
	 * names, in singular and plural, to recover addresses the corpus already
	 * assigns. Slugs are language-invariant, so the same three constants find
	 * the right prayer in every edition, and each link's TITLE comes from
	 * that edition's own index rather than from anything written here.
	 *
	 * Rendered beside the directions rather than inside them: the source's
	 * sentences stay exactly as printed, and the reader still gets somewhere
	 * to go. A slug the current edition lacks is dropped rather than rendered
	 * dead — `prayer.common.la` has all three, but nothing here assumes that.
	 */
	/** The three prayers of a decade WITH HOW MANY TIMES EACH IS SAID. The
	 *  source states the counts in a sentence ("the 'Our Father', ten 'Hail
	 *  Marys' and the 'Glory be'"); a reader following along needs them as a
	 *  column they can look down while praying, and ten is the only one of the
	 *  three anybody gets wrong. */
	const DECADE: { slug: string; times: number }[] = [
		{ slug: 'our-father', times: 1 },
		{ slug: 'hail-mary', times: 10 },
		{ slug: 'glory-be', times: 1 }
	];
	const DECADE_SLUGS = DECADE.map((d) => d.slug);

	/**
	 * THE TWO PRAYERS THE FINISH STEP NAMES, in the order its `{0}`/`{1}` holes
	 * expect them.
	 *
	 * The source's last direction ends the Rosary with "the Loreto Litany or
	 * some other Marian prayer", and its concluding section opens "Hail, Holy
	 * Queen, etc. as above" — a cross-reference to the Compendium's appendix,
	 * where the Salve Regina is printed a few pages up. There is no "above"
	 * here: this route serves one prayer per address, so a reader following
	 * that line was being sent to something the page neither prints nor points
	 * at. The walkthrough names both, and each name is the link to it.
	 */
	const FINISH_SLOTS = ['hail-holy-queen', 'litany-of-loreto'];

	/** A prayer's own title in this edition, falling back to English. The
	 *  walkthrough is written here and falls back to English key by key, so a
	 *  name inside one of its sentences degrades the same way rather than
	 *  leaving a hole in a sentence. The href is the slug either way — the
	 *  address is edition-free, and `/preces/{slug}` resolves whichever edition
	 *  holds it. */
	function prayerTitle(slug: string): string | undefined {
		return (getPrayerMeta(lang, slug) ?? getPrayerMeta('en', slug))?.title;
	}

	function namedPrayerLinks(slugs: string[]): { slug: string; meta: PrayerMeta }[] {
		return slugs
			.map((slug) => ({ slug, meta: getPrayerMeta(lang, slug) }))
			.filter((p): p is { slug: string; meta: PrayerMeta } => p.meta !== undefined);
	}

	const decadePrayers = $derived(
		namedPrayerLinks(DECADE_SLUGS).map((p) => ({
			...p,
			times: DECADE.find((d) => d.slug === p.slug)?.times ?? 1
		}))
	);

	onMount(() => {
		if (current) setPosition('prayer.common.' + lang, current.prayer.title, page.url.pathname);
	});
</script>

<svelte:head>
	<title>{current?.prayer.title ?? data.slug} — {t('home.title')}</title>
</svelte:head>

<!-- A prayer named inside a written sentence, as the link to it. There is no
     separate list of these anywhere on the page: a name a reader meets in a
     sentence is where they want to follow it from, and a row of the same names
     underneath is the page saying them twice. -->
{#snippet prayerLink(slug: string)}
	{@const title = prayerTitle(slug)}
	{#if title}<a href={hrefFor({ kind: 'prayer', slug })}>{title}</a>{/if}
{/snippet}

<!-- A sentence written here whose prayer names are holes — see `slotted`. -->
{#snippet withPrayerLinks(text: string, slugs: string[])}
	{#each slotted(text) as piece, i (i)}
		{#if 'text' in piece}{piece.text}{:else if slugs[piece.slot]}{@render prayerLink(
				slugs[piece.slot]
			)}{/if}
	{/each}
{/snippet}

{#snippet prayerPreamble(p: Prayer, bodyLang: string)}
	{#if p.rubric}
		<p class="prayer-rubric">{p.rubric}</p>
	{/if}

	<!--
	     THE DIRECTIONS ARE A HOW-TO, AND THE SOURCE ALREADY WROTE THEM AS ONE.
	     They were rendered as five undifferentiated paragraphs, which is what
	     `PrayerBlocks` is for and what hid the shape: the FIRST block is not a
	     direction at all but the opening prayer itself, the words a reader
	     says out loud — sign of the cross, "O God come to my aid", the Glory
	     be — and the remaining four are the numbered steps that follow it.
	     Setting them apart is not editorializing; it is printing the
	     difference the source's own text states.

	     THE TEXT ITSELF IS UNTOUCHED. No sentence is rewritten, split, joined
	     or renumbered — the blocks are the corpus's, in the corpus's order,
	     through the same `PrayerBlocks` renderer. What changed is the frame
	     around them: a label over the first, an ordered list around the rest,
	     and links beside them to the three prayers a decade is made of, which
	     the directions name but a reader had no way to reach from here.

	     IT IS FIRST ON THE PAGE, AND IT WAS UNDER THE MYSTERIES UNTIL
	     2026-09-08. That order was the corpus's file order and nothing else,
	     and it put the words a reader says FIRST — the sign of the cross, "O
	     God come to my aid" — below the twenty-odd lines they are said before.
	     Somebody who does not already know how to pray the Rosary met five
	     meditations, then the instructions for beginning, then the prayer for
	     ending. The page now runs in the order of the prayer: begin, meditate,
	     conclude.

	     IT IS A DISCLOSURE, AND CLOSED, because the two readers want opposite
	     things from it and only one of them wants it every time. Read once, it
	     is a page and a half of directions standing between the reader and the
	     text they came back for; never read, it is the one thing on the page
	     they need before anything else. A closed row at the top is the whole
	     of that: it is the first thing the eye lands on and it costs one line.
	     `<summary>` takes ONE heading and not a heading with a sibling beside
	     it, so the section's source line moves inside — the same rule
	     `/documenta`'s and `CitedBy`'s disclosures met. -->
	{#if p.instructions}
		{@const opening = p.instructions.blocks.length > 1 ? p.instructions.blocks[0] : undefined}
		<details class="prayer-instructions fold" id="prayer-instructions">
			<summary>
				<!-- The same mark the three sections below wear, because this is
				     a fourth one of them: the row a reader meets first, at the
				     top level of a page whose top level is the order of the
				     prayer. It was the one serif heading among them, which made
				     the directions look like the largest thing on a page they
				     are the optional part of. -->
				<h2 class="label-micro">{t('prayers.rosary.howTo')}</h2>
			</summary>

			<div class="prayer-instructions-body">
				<!--
					OUR OWN WALKTHROUGH, AND IT IS THE ONLY ONE ON THE PAGE.
					Everywhere else under /preces this site prints what its source
					printed and adds nothing; here it explains, because the
					source's four directions are addressed to somebody who already
					prays the Rosary. They name a "decade" without saying what one
					is, tell the reader to "announce the mystery" without saying to
					whom, and state the counts of a decade inside a sentence rather
					than as the list a person follows while counting. Somebody
					meeting the prayer for the first time cannot begin from them,
					and this page is the one a search for "how to pray the Rosary"
					lands on.

					THOSE FOUR SENTENCES ARE NOT PRINTED UNDER THIS, and were for
					one revision. Every claim in them is in the three steps above
					— announce the mystery, the three prayers and their counts, the
					optional invocation after each decade, the Litany of Loreto at
					the end — so keeping them was a second, terser copy of the same
					instructions under a label explaining that it was the same
					instructions, in a fold that is meant to be read once. What the
					source has that this does not is its TEXT, and the text of the
					Rosary is the rest of this page.

					The opening prayer is the one thing in `instructions` that is
					not a direction, and it is printed whole, below.
				-->
				<p class="rosary-lead">{t('prayers.rosary.howTo.lead')}</p>

				<ol class="rosary-walkthrough">
					<li>
						<p class="rosary-step-name">{t('prayers.rosary.howTo.begin')}</p>
						<p>{t('prayers.rosary.howTo.beginBody')}</p>
					</li>
					<li>
						<p class="rosary-step-name">{t('prayers.rosary.howTo.decades')}</p>
						<p>{t('prayers.rosary.howTo.decadesBody')}</p>
						<!-- THE DECADE AS A COLUMN, not as the sentence the source
						     writes it in. It is the one part of the Rosary a reader
						     has to keep count of, and the count is what a sentence
						     is worst at carrying — the links are the same three the
						     directions name, so the reader reaches the words as
						     well as the number. -->
						{#if decadePrayers.length > 0}
							<!-- Named for assistive technology and not on the page:
							     the sentence above it already introduces the list,
							     and a heading between "then say:" and the three
							     prayers would interrupt the one instruction the
							     reader is mid-way through reading. -->
							<ul class="rosary-decade" aria-label={t('prayers.rosary.decadePrayers')}>
								{#each decadePrayers as entry (entry.slug)}
									<li>
										<a href={hrefFor({ kind: 'prayer', slug: entry.slug })}>{entry.meta.title}</a>
										<span class="rosary-times">×{entry.times}</span>
									</li>
								{/each}
							</ul>
						{/if}
						<p>{t('prayers.rosary.howTo.decadesAfter')}</p>
					</li>
					<li>
						<p class="rosary-step-name">{t('prayers.rosary.howTo.finish')}</p>
						<p>
							{@render withPrayerLinks(t('prayers.rosary.howTo.finishBody'), FINISH_SLOTS)}
						</p>
					</li>
				</ol>
			</div>
		</details>

		<!--
			THE OPENING PRAYER IS OUT OF THE FOLD, because it is not a direction.
			It is the words a reader says out loud to begin — the sign of the
			cross, "O God come to my aid", the Glory be — and the source files it
			with its directions only because its page had nowhere else to put it.
			Folded away with the how-to, the first thing to be SAID was behind the
			same disclosure as the explanation of what saying it means, so a
			reader who had read the directions once and come back to pray had to
			open them again to find the first line.
		-->
		{#if opening}
			<!-- NO SECOND SOURCE LINE HERE. A section carried one while the
			     page's own notice named the Compendium appendix and the
			     sections under it came from the Holy Rosary micro-site — two
			     provenances on one page, and the smaller one was true of most
			     of what was on screen. The six editions that have the
			     mysteries now cite the micro-site's own index, in their own
			     language, as the prayer's source (`Prayer.sources`), so the
			     line at the top of the page is the answer for every part of
			     it and a second copy beside one heading could only disagree
			     with it. -->
			<section class="prayer-section">
				<h2 class="prayer-section-name label-micro">
					{t('prayers.rosary.openingPrayer')}
				</h2>
				<!-- No rule and no indent beside it. It carried a marginal rule
				     to mark it as words to SAY rather than to read — which was
				     one section wearing a device the other two do not, in a page
				     whose whole shape is now three sections that open alike. The
				     label above it already says what it is. -->
				<div lang={bodyLang}>
					<PrayerBlocks lines={prayerLines([opening])} />
				</div>
			</section>
		{/if}
	{/if}

	<!-- Groups (the Rosary alone, v1) render as their own named list, never
	     flattened into prose -- see PrayerBlocks.svelte's docblock and
	     docs/corpus-schema.md "Prayers" on why. Rendered BEFORE `blocks`:
	     the source's own `blocks` for a group-kind prayer document how to
	     CONCLUDE it (the Rosary's closing prayer starts "Prayer concluding
	     the Rosary"), which only makes sense read after the groups
	     themselves. -->
	{#if p.groups && p.groups.length > 0}
		<section class="prayer-section">
			<h2 class="prayer-section-name label-micro">{t('prayers.rosary.mysteries')}</h2>
			<PrayerMysteries groups={p.groups} lang={bodyLang} />
		</section>
	{/if}
{/snippet}

<!-- The whole prayer in one flow: what the SINGLE column renders. Compare mode
     splits the same two halves apart — the preamble into `CompareGrid`'s band
     above the first row, the lines into a row each.

     THE INITIALS GO ON THE BLOCKS ONLY WHERE THE BLOCKS OPEN THE READING,
     which for every prayer but one they do. A group prayer's `blocks` are its
     CONCLUSION — the preamble's own comment says so, and it is why they render
     last — so an initial there would fall halfway down the Rosary. `kind` is
     `'group'` exactly when `groups` is present (types.ts), and no prayer in any
     edition carries `instructions` without them, so the one test covers both. -->
{#snippet prayerBody(p: Prayer, bodyLang: string)}
	{@render prayerPreamble(p, bodyLang)}
	<!-- `primaryLines` and not `p`'s own: this snippet renders the reader's
	     edition and nothing else (compare mode goes through the cells below), so
	     the lines here are the ones its placement was taken over. -->
	<!--
	     A GROUP PRAYER'S BLOCKS ARE ITS ENDING, and the source says so in their
	     first line. Every edition that has a conclusion heads it — "Prayer
	     concluding the Rosary", "Schlussgebet", "Oración tras el rosario",
	     "Preghiera alla fine del S. Rosario" — and the page printed that line
	     in the same measure, face and colour as the meditations above it, so
	     the last thing on the page read as a sixth mystery.

	     SO THE SECTION'S NAME IS THE SOURCE'S OWN LINE, not a string of ours.
	     Writing "Concluding prayer" above it would set our words over an
	     identical heading in every edition that has one; taking theirs costs no
	     translation, cannot disagree with the text under it, and is what the
	     line already was.

	     THE CUT IS AT THE LINE AND NOT AT THE BLOCK, because Italian stores its
	     whole conclusion as one block whose first line is that heading while
	     the other seven give it a block of its own. `prayerLines` has already
	     flattened both to the same shape, and every line keeps its own `n`, so
	     the commentary placement handed to the rest is unaffected by the slice.

	     Single column only: `compareRows` zips the whole of `primaryLines`
	     against the other edition's, and a heading lifted out of one side would
	     put the two columns a row apart from there down. -->
	{#if p.kind === 'group' && primaryLines.length > 0}
		<section class="prayer-section" lang={bodyLang}>
			<h2 class="prayer-section-name label-micro">{plainLine(primaryLines[0])}</h2>
			<PrayerBlocks lines={primaryLines.slice(1)} placement={primaryPlacement} />
		</section>
	{:else}
		<PrayerBlocks lines={primaryLines} dropCap={p.kind !== 'group'} placement={primaryPlacement} />
	{/if}
	<!-- Under the whole text and not under a block: these name the prayer, the
	     way the notes name its clauses. `bodyLang` rather than the reader's
	     interface language, because a siglum is the SOURCE work's own short
	     title and that work is the one this edition is annotated by. -->
	<PrayerReferences {references} lang={bodyLang} />
{/snippet}

<!-- A CELL IS ONE PRINTED LINE, which is what makes the two columns stay level
     line by line rather than only at the top (see `compareRows`). It is still
     the one renderer the single column uses — handed a list of one.

     NO TITLE HERE. The secondary side carries its own `title`, and printing it
     at the top of the right cell is what made the two columns start at
     different heights and in different weights: the vernacular column has no
     title of its own — the page's `<h1>` IS its title — so the right column
     opened one line lower with a bold line the left column had no counterpart
     for. Both titles sit in the `.compare-unit-header` below, which is where
     every other compare route puts the pair, and where an identical pair
     collapses to one instead of being set twice. -->
{#snippet leftCell(row: PrayerRow)}<PrayerBlocks
		lines={row.lines}
		dropCap={current?.prayer.kind !== 'group'}
		placement={primaryPlacement}
		openMarks={primaryOpen}
	/>{/snippet}

{#snippet rightCell(row: PrayerRow)}<PrayerBlocks
		lines={row.lines}
		dropCap={secondary?.prayer.kind !== 'group'}
		placement={secondaryPlacement}
		openMarks={secondaryOpen}
	/>{/snippet}

<!-- EVERYTHING THAT IS NOT A LINE, in the band above the first row.
     `CompareGrid`'s interlude is for content that divides the units rather
     than being one of them, and a rubric, the Rosary's four mystery groups and
     its directions are exactly that here: they precede the prayer's own lines,
     each column prints its own, and none of them is a line to pair with a line
     opposite. Each side renders whatever it has, which may be nothing —
     `prayerPreamble` emits a rubric only where the source printed one, so the
     band is empty for most prayers and costs an empty row.

     This is also what keeps a Latin column able to show a rubric or a group if
     that edition ever prints one, rather than silently dropping it the way the
     old field-shaped cell had to. -->
{#snippet leftPreamble()}{#if current}{@render prayerPreamble(
			current.prayer,
			current.work.language
		)}{/if}{/snippet}

{#snippet rightPreamble()}{#if secondary}{@render prayerPreamble(
			secondary.prayer,
			secondary.work.language
		)}{/if}{/snippet}

{#if current}
	<div
		class="prayer-reading-layout"
		class:compare={compareActive}
		class:group={current.prayer.kind === 'group'}
	>
		<div class="content-column" class:compare={compareActive}>
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
					<a href="/preces">{t('nav.prayers')}</a>
					{#if current.group}
						<span class="sep">›</span>
						<a href={`/preces#${current.group.id}`}>{current.group.title}</a>
					{/if}
				</nav>
			</div>

			<!-- A prayer has no numbered sub-unit to hang the anchor popover off
			     (PrayerBlocks renders no anchors at all), so the whole prayer is
			     what `bookmarkHref` marks.

			     No `enterLabel`/`exitLabel` any more. They said "Show/Hide Latin
			     text", which was the accurate wording while Latin was the only
			     second column this route had; now that the reader picks, the
			     generic "Compare editions" the toggle defaults to is the accurate
			     one, and a button that promises Latin while showing Português
			     would be worse than one that promises nothing in particular. -->
			<ReadingBar
				bookmarkHref={hrefFor({ kind: 'prayer', slug: data.slug })}
				canCompare={comparisons.length > 0}
				{compareActive}
				onToggleCompare={toggleCompare}
				apparatus={{ commentaries: apparatusCommentaries }}
				comparison={{
					editions: comparisons.map((c) => c.work),
					current: compareTarget,
					onselect: chooseComparisonEdition
				}}
			/>

			{#if compareActive && secondary}
				<!-- One row per field (`.compare-unit-header`, app.css), same as the
				     CCC/Compendium/document readers. The TITLE collapses whenever the
				     two match, which happens whenever the prayer is known by its
				     Latin incipit in both languages ("Memorare", "Magnificat") and
				     not when it is translated ("Hail Mary" against "Ave Maria") —
				     the field asks, nothing here decides centrally. -->
				<div class="compare-unit-header">
					<CompareField
						shared={secondary.title === current.prayer.title}
						leftLang={current.work.language}
						rightLang={secondary.work.language}
						leftTag={compareColumnLabel(current.work)}
						rightTag={compareColumnLabel(secondary.work)}
					>
						{#snippet left()}<h1>{current.prayer.title}</h1>{/snippet}
						{#snippet right()}<h1>{secondary.title}</h1>{/snippet}
					</CompareField>
				</div>
			{:else}
				<h1>{current.prayer.title}</h1>
			{/if}

			<!-- TWO NOTICES WHILE COMPARING, like every other compare route, and
			     the reason this route no longer has its own rule here is that it
			     no longer has its own second column. It used to print ONE, on the
			     grounds that `latin` was a field on the same array entry from the
			     same scraped page, so a second notice would have been the same
			     sentence twice rather than provenance. `prayer.common.la` is a
			     real edition with a real manifest now, and its sources are not
			     the vernacular's: it cites BOTH Compendium pages, because the
			     English one is where its text was transcribed and the Portuguese
			     one is where five of these prayers break into stanzas. Two
			     notices linking to different source lists is exactly the case
			     `CopyrightNotice` exists to make checkable.

			     AND THE SOURCE IS THE PRAYER'S, NOT THE WORK'S. The manifest
			     lists eight pages for English and cannot say which prayer came
			     from which, so the notice linked `sources[0]` — the Compendium
			     appendix — under all twenty-eight, including the four that are
			     not from it at all (the two Creeds, the Our Father, the Litany
			     of Loreto) and the Rosary, whose twenty mysteries are from four
			     pages the Compendium does not contain. `Prayer.sources` is the
			     per-address answer; the mysteries and the directions carry their
			     own, printed beside the sections they belong to. -->
			{#if compareActive && secondary}
				<CompareCopyrightHeader
					left={current.work}
					right={secondary.work}
					leftSources={current.prayer.sources}
					rightSources={secondary.prayer.sources}
				/>
			{:else}
				<p class="copyright-notice">
					<CopyrightNotice manifest={current.work} sources={current.prayer.sources} />
				</p>
			{/if}

			<!-- `{#if secondary}` rather than `{#if compareActive}`, which is the
			     same condition: the derived boolean is what the layout classes and
			     `ReadingBar` want, but only the object itself narrows here.

			     Both column labels come from `compareColumnLabel`, so the Latin
			     column is tagged "Latina" — the content language's own name, like
			     every other tag on the site — and never "Latin"/"Latim", which is
			     the READER's-language name and belongs on controls, not on a label
			     that names what the column holds. -->
			{#if secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={current.work.language}
					rightLang={secondary.work.language}
					leftLabel={compareColumnLabel(current.work)}
					rightLabel={compareColumnLabel(secondary.work)}
					left={leftCell}
					right={rightCell}
					interlude={{
						has: (n) => hasPreamble && n === compareRows[0]?.n,
						left: leftPreamble,
						right: rightPreamble
					}}
				/>
			{:else}
				<div class="reading-text prayer-body" lang={current.work.language}>
					{@render prayerBody(current.prayer, current.work.language)}
				</div>
			{/if}

			<UnitNav
				ariaLabel="Prayer navigation"
				prev={current.prev && {
					href: hrefFor({ kind: 'prayer', slug: current.prev.slug }),
					label: t('unitNav.previous'),
					full: `${t('prayers.prevPrayer')} · ${current.prev.title}`
				}}
				next={current.next && {
					href: hrefFor({ kind: 'prayer', slug: current.next.slug }),
					label: t('unitNav.next'),
					full: `${t('prayers.nextPrayer')} · ${current.next.title}`
				}}
			/>
		</div>
	</div>
{/if}

<style>
	/*
	 * PRAYERS ARE SET LARGER THAN THE REST OF THE READING TEXT, AT THE SAME
	 * COLUMN WIDTH.
	 *
	 * `--reading-base` (app.css) is 1.3rem, tuned for running prose — a
	 * Catechism paragraph, an encyclical section, a chapter of Kings, all read
	 * in long unbroken stretches where 62.4 characters per line is the point.
	 * A prayer is not that. It is short, it is often set in versicle/response
	 * or stanza lines that break well before the measure, and it is a text
	 * people read ALOUD and from memory — the two things that make a larger
	 * face useful rather than merely bigger.
	 *
	 * A GROUP PRAYER IS THE EXCEPTION AND TAKES THE ORDINARY BASE. The Rosary
	 * is not a prayer of that shape: it is a page of directions, twenty
	 * meditations each with its own Scripture, and a collect — read down like
	 * a chapter and not said off one screen. The enlargement was written for
	 * what a short prayer needs and applied to the one text on the route that
	 * is long, where it bought nothing and cost a third of the page's height.
	 * `kind === 'group'` is the test because that is what makes a prayer long
	 * here (types.ts), not a character count that would have to be tuned.
	 *
	 * 1.1x (`--reading-base-prayer`, app.css), and the number is bounded rather
	 * than chosen by eye. `--content-width` is declared on `:root` and
	 * therefore resolves against `:root`'s `--reading-base`, so overriding the
	 * base HERE moves the type without moving the column — which is exactly
	 * the ask, and also what makes the multiplier a decision about characters
	 * per line. 62.4 / 1.1 = 56.7 cpl, inside the 55-65 band `--measure-cpl`'s
	 * own comment names as where this type sets well. 1.15x would put it at
	 * 54.3 and outside it.
	 *
	 * Scale-invariant: both the column and the type carry `--reading-scale`,
	 * so the reader's own size setting cancels out of that ratio and 56.7
	 * holds across all eleven steps.
	 *
	 * It is set on the LAYOUT, not on `.prayer-body`, because compare mode
	 * renders the same text through `CompareGrid`'s cells instead — both
	 * columns and the gutter's unit number are `.reading-text`, and a rule
	 * scoped to the single-column class would silently stop applying the
	 * moment a reader opened the Latin alongside.
	 */
	.prayer-reading-layout:not(.group) {
		--reading-base: var(--reading-base-prayer);
	}

	.copyright-notice {
		margin: 0.5rem 0 1.25rem;
	}

	.prayer-rubric {
		font-style: italic;
		color: var(--color-text-muted);
		margin: 0 0 1rem;
	}

	/* The rule is UNDER it now that it opens the page: closed, it is one row
	   between the copyright notice and the mysteries, and the line says which
	   side of it the directions are on. A rule above would have ruled off the
	   notice instead. */
	.prayer-instructions {
		margin: 0 0 1.5rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--color-border);
	}

	/* Closed, this row IS one of the section names, so its rule sits where
	   theirs do (`.prayer-section-name`); open, the same rule is closing a
	   panel and takes the wider gap. */
	.prayer-instructions:not([open]) {
		padding-bottom: 0.35rem;
	}

	.prayer-instructions h2 {
		margin: 0;
	}

	/* The gap belongs to the OPEN state: closed, it would be a panel's worth of
	   space under a single row. */
	.prayer-instructions-body {
		margin-top: 0.75rem;
	}

	/*
	 * THE WALKTHROUGH IS SANS AND THE PRAYER IS NOT. Everything in this fold
	 * that is ours is set in the interface face at the interface size, and
	 * everything of the source's keeps the reading face — which is the same
	 * distinction the whole site draws between chrome and text, made here
	 * between an explanation and the thing explained. It is also why nothing
	 * in this block reads `--reading-base`: a reader who enlarged the prayer
	 * did not ask for a larger set of instructions.
	 */
	.rosary-lead,
	.rosary-walkthrough {
		font-family: var(--font-sans);
		font-size: 0.92rem;
	}

	.rosary-lead {
		margin: 0 0 1rem;
	}

	.rosary-walkthrough {
		margin: 0 0 0.75rem;
		padding-inline-start: 1.4rem;
	}

	.rosary-walkthrough > li {
		margin: 0 0 1rem;
	}

	.rosary-walkthrough p {
		margin: 0 0 0.35rem;
	}

	.rosary-step-name {
		font-weight: 600;
	}

	/* The one part of the page a reader looks at WHILE praying rather than
	   before it, so the three rows are a column with the counts aligned down
	   the far edge — a count that has to be found inside a line is a count
	   that gets lost. `max-content` on the first track keeps the two columns
	   together whatever the prayer names are called in this language, instead
	   of stretching the row to the fold's whole width. */
	.rosary-decade {
		display: grid;
		grid-template-columns: max-content max-content;
		gap: 0.15rem 1.25rem;
		margin: 0.5rem 0 0.75rem;
		padding: 0.6rem 0.9rem;
		list-style: none;
		border-inline-start: 2px solid var(--color-border);
	}

	.rosary-decade li {
		display: contents;
	}

	.rosary-times {
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		text-align: end;
	}

	/*
	 * THE THREE PARTS OF THE ROSARY, EACH UNDER ITS OWN NAME: the opening
	 * prayer, the mysteries, the conclusion. Together they are the reason the
	 * page can be followed at all — the reader was previously handed the words
	 * to begin with, twenty meditations and a collect in one unbroken column,
	 * with only a change of type size saying where one ended and the next
	 * began.
	 *
	 * The names are `.label-micro`, the site's small letterspaced interface
	 * label, and not headings at the prayer's own size. What they mark is
	 * STRUCTURE, and a structure marker set at reading size is a fourth voice
	 * arguing with the set names, the mystery names and the text. It is also
	 * what lets them cost less vertical space than the one rule they replace.
	 * The how-to disclosure above wears the same mark: it opens the page at
	 * the same level they do.
	 */
	.prayer-section {
		margin: 0 0 1.75rem;
	}

	/* A NAME AND A RULE UNDER IT, and nothing else on the row. It was a
	   two-ended flex row while a provenance line sat at the far end of one of
	   the three, which is a layout for a row that no longer has two ends. */
	.prayer-section-name {
		margin: 0 0 0.6rem;
		padding-bottom: 0.35rem;
		border-bottom: 1px solid var(--color-border);
	}

	/* A compared prayer needs two full reading measures. This was the
	   non-Rosary rule while the Rosary took the equivalent shared app.css one
	   through `.reading-layout`; with the sidebar gone every prayer on this
	   route is the same shape and takes this. */
	.content-column.compare {
		max-width: calc(var(--content-width) * 2 + var(--compare-gutter));
	}
</style>
