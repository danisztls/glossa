<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import {
		baseLang,
		compareColumnLabel,
		getAdjacentChapterAcrossBooks,
		getCccCitationsForChapter,
		getDocumentCitationsForChapter,
		getBook,
		getWork,
		listEditions
	} from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { setPosition } from '$lib/reading-position';
	// Drop cap on the chapter's opening verse only, and only when no section
	// heading precedes it — a cap immediately under a heading collides with
	// it, and the heading is already doing the work of marking the opening.
	import AnnotatedText from '$lib/components/AnnotatedText.svelte';
	import { chapterNoteOffsets } from '$lib/sidenotes.svelte';
	import { chapterArgument } from '$lib/chapter-argument';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import ReferenceNumber from '$lib/components/ReferenceNumber.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import CitedBy from '$lib/components/CitedBy.svelte';
	import Plate from '$lib/components/Plate.svelte';
	import { DORE_WORK_ID, getPlates } from '$lib/plates.svelte';
	import { plateCredits } from '$lib/corpus-index';
	import { placePlates } from '$lib/plates';
	import { documentCitedSource, type CitedByRow, type CitedBySource } from '$lib/cited-by';
	import CompareField from '$lib/components/CompareField.svelte';
	import CompareCopyrightField from '$lib/components/CompareCopyrightField.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import UnitNav from '$lib/components/UnitNav.svelte';
	import { alignByNumber, numberSetsDiffer, pickComparisonEdition } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { t } from '$lib/i18n.svelte';
	import type { Verse } from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * Which embedded edition to render. The URL no longer says (see
	 * `+page.ts`), so this is the reader's own preference, read reactively —
	 * switching edition or interface language re-renders this page in place,
	 * with no navigation and no refetch.
	 *
	 * Falls back to whichever edition IS present when the preferred one has no
	 * text for this chapter, rather than showing a blank page: the same
	 * "degrade, don't 404 a page with real content" posture `ccc/[n]` and
	 * `documents/[slug]` already take.
	 */
	const availableWorkIds = $derived(Object.keys(data.byWorkId));

	/**
	 * Chapter 0: this book's introduction rather than a chapter of scripture
	 * (`+page.ts`, docs/corpus-schema.md §Book introductions). Everything below
	 * that reads `current` is scripture-shaped — verses, compare alignment,
	 * cited-in — and none of it applies, so the markup branches on this once
	 * near the top rather than each of those guarding itself.
	 */
	const introMode = $derived(data.introByLang !== undefined);

	const workId = $derived(
		(() => {
			const preferred = content.workIdFor('bible');
			// In intro mode there are no editions in route data to fall back
			// through: the reader's own edition is what names the book and drives
			// the picker and the chapter nav, whether or not its LANGUAGE has an
			// introduction to show.
			if (introMode) return preferred ?? listEditions('bible')[0]?.id;
			return preferred && data.byWorkId[preferred] ? preferred : availableWorkIds[0];
		})()
	);
	const current = $derived(data.byWorkId[workId]);

	/**
	 * The introduction in the reader's own language, and nothing else.
	 *
	 * NO FALLBACK TO ANOTHER LANGUAGE, deliberately, and this is the one place
	 * this route departs from how it treats an absent chapter. A chapter absent
	 * from one edition falls back to an edition that has it, because all three
	 * are the same verses of the same book and showing one instead of another
	 * is a translation choice. An introduction is different: today only English
	 * has any, and quietly showing English prose to a reader who asked for
	 * Portuguese would not be a translation choice but a language failure
	 * wearing one. So a language with no introduction gets an honest "not yet"
	 * — the same shape as any other absent chapter.
	 */
	const introLang = $derived(content.langFor('bible'));
	const intro = $derived(data.introByLang?.[introLang]);
	const introWork = $derived(getWork(`bible-intro.${introLang}`));
	/** The book's name in the reader's edition — index-tier, no fetch. */
	const introBookName = $derived(getBook(workId, data.osis)?.name ?? data.osis);

	/**
	 * The canonical, edition-free address of this chapter and of one of its
	 * verses — what a bookmark stores and what the anchor popover copies.
	 * Built here rather than taken from `page.url` because the number's own
	 * href is the in-page `#v{n}`, and because a bookmark must never carry the
	 * `?v=` span or `?compare=` of the moment: `/scriptura/exod/3#v12` is the
	 * verse, not the way this reader happened to arrive at it.
	 */
	const chapterHref = $derived(hrefFor({ kind: 'bible', osis: data.osis, chapter: data.chapterN }));
	const verseHref = (n: number) => `${chapterHref}#v${n}`;

	/**
	 * Compare mode: the same chapter, a second edition, aligned verse by
	 * verse — see `$lib/compare.ts`'s module docblock for why alignment is by
	 * verse NUMBER and for what the real corpus measurement found about how
	 * often these two editions actually disagree on what a verse number
	 * means (30 of 1,333 common chapters, three distinct causes).
	 *
	 * `data.byWorkId` already embeds EVERY edition (`+page.ts`'s own
	 * docblock) because `load` fetches every edition up front — so, unlike
	 * `documents/[slug]`, comparing here costs nothing extra: no fetch,
	 * no loading state, the second column's text is already resolved by the
	 * time this component renders.
	 */

	/** Every embedded edition except the one being read as the primary — what
	 *  the picker in the comparison column's header (`ComparisonEditionMenu`)
	 *  offers, and the universe `compare.resolveTarget` checks the reader's
	 *  stored pick against. */
	const otherEditions = $derived(
		listEditions('bible').filter((w) => availableWorkIds.includes(w.id) && w.id !== workId)
	);

	/** What this chapter compares against with no reader override — preferring
	 *  a different-language edition, same as every other route offering this
	 *  feature (`pickComparisonEdition`'s own docblock). Feeds
	 *  `compare.resolveTarget`'s `fallback`, which is what a stored `AUTO`
	 *  preference — or a stored pick this chapter doesn't have — degrades to. */
	const fallbackWorkId = $derived(
		pickComparisonEdition(
			workId,
			otherEditions.map((w) => ({ id: w.id, lang: baseLang(w.language) }))
		)?.id
	);

	/** Adopts an incoming `?compare=…` into the stored reading preference —
	 *  browser-only for the same reason `citedRange` below is, and the reason
	 *  the preference rather than the URL is what makes compare mode survive a
	 *  plain link to the next chapter. See `compare-nav.svelte.ts`. */
	adoptCompareFromUrl();

	const secondaryWorkId = $derived(
		compare.resolveTarget(
			otherEditions.map((w) => w.id),
			fallbackWorkId
		)
	);
	const secondary = $derived(secondaryWorkId ? data.byWorkId[secondaryWorkId] : undefined);
	const compareActive = $derived(current !== undefined && secondary !== undefined);

	const compareRows = $derived(
		current && secondary ? alignByNumber(current.chapter.verses, secondary.chapter.verses) : []
	);

	/** See `$lib/compare.ts`'s `numberSetsDiffer` — surfaced as a plain
	 *  advisory note rather than silently trusted, because a verse number
	 *  present on both sides is not a guarantee its two editions printed the
	 *  same sentence at it (Psalm 13 is the clean example — see module
	 *  docblock). */
	const compareVersesDiffer = $derived(
		current && secondary
			? numberSetsDiffer(
					current.chapter.verses.map((v) => v.n),
					secondary.chapter.verses.map((v) => v.n)
				)
			: false
	);

	const prev = $derived(getAdjacentChapterAcrossBooks(workId, data.osis, data.chapterN, 'prev'));
	const next = $derived(getAdjacentChapterAcrossBooks(workId, data.osis, data.chapterN, 'next'));

	/**
	 * Every heading printed before a verse, in the order the source sets them.
	 *
	 * PLURAL SINCE 2026-08-25, when the Matos Soares edition arrived with a
	 * hierarchy: "PRIMEIRA PARTE" / "I - CRIAÇÃO DO MUNDO" / "Principio." all
	 * precede Genesis 1:1. The pipeline already emits them in level order, so
	 * this filters and does not sort — re-sorting here would silently disagree
	 * with the corpus about two headings of the same level, whose order is the
	 * source's own and not derivable (see `heading_units` in the pipeline).
	 */
	function headingsBefore(verseN: number) {
		return current?.chapter.headings?.filter((h) => h.before_verse === verseN) ?? [];
	}

	/** Where each unit's notes start in the chapter's lettered run — see
	 *  `chapterNoteOffsets`, which is the reading-order rule this depends on.
	 *
	 *  ONE PER EDITION, because the lettering is a property of the chapter
	 *  being read and the two columns are two different chapters: the
	 *  Douay-Rheims annotates John 3 twenty-one times where Matos Soares
	 *  annotates it four, so a single run of letters shared between them would
	 *  label the right column out of its own sequence. */
	const noteOffsets = $derived(
		current ? chapterNoteOffsets(current.chapter) : new Map<string, number>()
	);
	const secondaryNoteOffsets = $derived(
		secondary ? chapterNoteOffsets(secondary.chapter) : new Map<string, number>()
	);

	/**
	 * The passage a citation pointed at, as `?v=1-7`.
	 *
	 * A reference like "Jn 1:1-7" names a span, not a point. Linking only to
	 * `#v1` drops half of what it said: the reader lands correctly and then
	 * has no idea whether the citation covered one verse or twenty. This
	 * marks the whole span so the extent is visible on arrival.
	 *
	 * Read from the URL rather than passed as page data because it is a
	 * property of how the reader GOT here, not of the chapter — one route
	 * instance for `/scriptura/{book}/{chapter}` serves every citation that
	 * points into it, whatever `?v=` it carries. Reading `page.url`
	 * reactively also means following a second citation to the same chapter
	 * re-marks the new span without a reload.
	 *
	 * Deliberately tolerant: a malformed, reversed, or out-of-range `v` marks
	 * nothing rather than throwing or guessing. It is a display hint, and a
	 * reader who hand-edits it should get the chapter, not an error page.
	 *
	 * BROWSER-ONLY. This dates from when every route was prerendered, when
	 * SvelteKit was right to insist on it: reading `searchParams` during
	 * prerendering threw, because one prerendered file had to serve every
	 * query string that points at it. `/scriptura/john/1` was built once and
	 * the highlight was applied on top of it per-visit, so the guard stated
	 * the design rather than working around a restriction, and the chapter
	 * rendered complete without JavaScript, with only the passage marking
	 * needing it. Since the site became one SPA shell with `ssr = false`
	 * (`+layout.ts`, docs/decisions.md §The site) no route component runs
	 * during the build at all — the whole chapter now needs JavaScript to
	 * render, not just the highlight — so the guard is no longer load-bearing
	 * against a prerendering throw; it stays because it still states the
	 * actual requirement, reading the address bar, which only exists in a
	 * browser.
	 */
	const citedRange = $derived.by(() => {
		if (!browser) return undefined;
		const raw = page.url.searchParams.get('v');
		if (!raw) return undefined;
		const m = /^(\d{1,3})-(\d{1,3})$/.exec(raw);
		if (!m) return undefined;
		const from = Number(m[1]);
		const to = Number(m[2]);
		return to > from ? { from, to } : undefined;
	});

	/** What to print under the chapter number, which is the stored argument
	    unless it merely reads out the chapter's own rubrics — see
	    `chapterArgument`. */
	const argument = $derived(current ? chapterArgument(current.chapter) : undefined);

	/**
	 * A direct verse link (`#v5`) is a highlight too, but it must be derived
	 * from SvelteKit's current URL rather than CSS's `:target` pseudo-class.
	 *
	 * The reader component is reused while navigating between chapters. In
	 * that case the router replaces its verse spans in place, and browsers can
	 * leave `:target` matched on the reused `#v5` element even after the new,
	 * hashless chapter URL has been installed. Making the fragment an ordinary
	 * reactive input scopes the mark to the current URL: navigating from a
	 * linked verse to another book has no fragment and therefore no highlight.
	 */
	const directVerse = $derived.by(() => {
		if (!browser) return undefined;
		const match = /^#v(\d{1,3})$/.exec(page.url.hash);
		return match ? Number(match[1]) : undefined;
	});

	function isCited(verseN: number): boolean {
		return citedRange !== undefined && verseN >= citedRange.from && verseN <= citedRange.to;
	}

	function isHighlighted(verseN: number): boolean {
		return isCited(verseN) || verseN === directVerse;
	}

	/**
	 * The reverse half of the flagship CCC-Bible cross-linking: which
	 * Catechism paragraphs cite the verses on this page.
	 *
	 * Rendered as ONE summary at the foot of the chapter rather than as a
	 * marker on each verse. The marker version was the obvious first idea and
	 * is wrong for this text: some chapters are cited very heavily (John 1
	 * and Matthew 5 among them), and sprinkling superscripts through the verse
	 * flow would turn the reading column into an apparatus — this site's
	 * stated purpose is reading, and the footnote markers already in the text
	 * are as much interruption as it should carry. At the foot, the reader who
	 * wants the concordance gets all of it, and the reader who wants the
	 * chapter never has it in their way.
	 *
	 * Derived from the corpus, not the page data, so it costs nothing in this
	 * route's data: the xrefs index is part of the INDEX tier, eager-inlined
	 * into the client bundle already (`corpus.ts`'s docblock, "THE SPLIT THIS
	 * LEADS TO") rather than fetched per page.
	 */
	const cccCitations = $derived(getCccCitationsForChapter(data.osis, data.chapterN));

	/**
	 * Verse-keyed rows, in verse order, with the whole-chapter bucket (0)
	 * first, and each row flagged with whether the verse it names actually
	 * exists in the edition being rendered.
	 *
	 * IT SOMETIMES DOESN'T, and the flag is load-bearing rather than
	 * defensive: validation caught `/scriptura/luke/2#v61` pointing at a
	 * chapter that ends at verse 52. Measured across the corpus, 19 of the
	 * ~3,800 references in `xrefs/ccc-bible.json` name a verse outside its
	 * chapter, from two unrelated causes —
	 *
	 *   - dropped-hyphen parse artifacts in the citation grammar ("Dt 6:4-5"
	 *     read as 6:45, "Mt 2:5-6" as 2:56, "Rom 6:3-4" as 6:34), and one
	 *     verse 0; and
	 *   - genuine Hebrew-versus-Vulgate divergence in books the versification
	 *     table does not yet cover — Exodus 40 (Vulgate ends at 36, Hebrew has
	 *     38), Zechariah 2 (13 vs 17), 2 Corinthians 13 (13 vs 14).
	 *
	 * Both are real defects worth fixing upstream, and neither is fixable
	 * here. What this page must not do is invent a link to a verse that isn't
	 * on it, so the citation is still shown — the Catechism really does cite
	 * something here, and hiding that would lose information — but the verse
	 * label is rendered as plain text rather than as an anchor. Same
	 * "degrade, don't fabricate" rule as `.related-unresolved` on the CCC page
	 * and `.unavailable` in the chapter picker.
	 */
	const chapterVerseNumbers = $derived(new Set(current?.chapter.verses.map((v) => v.n) ?? []));

	/**
	 * Doré's engravings for this chapter, keyed by the verse each sits before.
	 *
	 * `getPlates()` returns the whole collection and starts its fetch on the
	 * first ask — reading it here registers the dependency, so this re-runs
	 * once when the list lands and the plates appear without the page
	 * awaiting anything. 241 plates over 195 chapters means this is empty for
	 * five chapters in six.
	 *
	 * `placePlates` is handed THIS edition's verse numbers because the anchors
	 * were decided against the Douay-Rheims and the editions disagree about
	 * verse numbering in 31 chapters; see its docblock for where a homeless
	 * plate goes.
	 *
	 * Not drawn in compare mode: two half-width columns of verse against a
	 * full-measure engraving is not a layout, and a reader who has asked to
	 * set two texts side by side is doing something the picture is not part of.
	 */
	const chapterPlates = $derived.by(() => {
		if (!current) return new Map();
		const here = getPlates().filter(
			(plate) => plate.osis === data.osis && plate.chapter === data.chapterN
		);
		return here.length > 0
			? placePlates(
					here,
					current.chapter.verses.map((v) => v.n)
				)
			: new Map();
	});

	/**
	 * The engravings' attribution, as the tooltip on each plate carries it.
	 *
	 * Composed HERE rather than in `Plate.svelte` because no component in
	 * `$lib/components/` reads the i18n store — every one of them takes its
	 * strings as props — and because the record is index tier, so it is
	 * already in hand and costs nothing to read on a chapter with no plates.
	 *
	 * Two lines: the picture's own provenance, then whose scan this is. The
	 * colophon says all of it at length; this is what a reader gets without
	 * leaving the chapter.
	 */
	const plateCredit = $derived.by(() => {
		const credit = plateCredits[DORE_WORK_ID];
		if (!credit) return undefined;
		return (
			`${credit.artist}, ${credit.edition}\n` +
			`${credit.reproduction} — ${t('plates.scansBy')} ${credit.provider}`
		);
	});

	const documentCitations = $derived(getDocumentCitationsForChapter(data.osis, data.chapterN));

	/**
	 * One row per cited verse, carrying every work that cites it — the
	 * Catechism first, then the documents by display title. The verse scaffold
	 * is built once and shared, which is the whole point of a single panel:
	 * the reader looks up a verse, not a work.
	 *
	 * Verse 0 is the corpus's whole-chapter citation sentinel (`verses: []`):
	 * the work cited the chapter, not a verse in it, and saying so is more
	 * honest than picking a verse or expanding across all of them. It gets no
	 * `href` for the same reason — there is nothing in the page to scroll to.
	 */
	const citedInRows: CitedByRow[] = $derived(
		[...new Set([...cccCitations.keys(), ...documentCitations.keys()])]
			.sort((a, b) => a - b)
			.map((verse) => {
				const paragraphs = cccCitations.get(verse) ?? [];
				const ccc: CitedBySource[] = paragraphs.length
					? [
							{
								key: 'ccc',
								label: t('bible.cccAbbrev'),
								fullTitle: t('ccc.landing.title'),
								refs: paragraphs.map((n) => ({
									key: n,
									label: `¶${n}`,
									href: hrefFor({ kind: 'ccc', n })
								}))
							}
						]
					: [];
				const documents = (documentCitations.get(verse) ?? [])
					.map((entry) => documentCitedSource(entry.slug, entry.sections))
					.filter((source): source is CitedBySource => source !== null)
					.sort((a, b) => a.label.localeCompare(b.label));
				const present = chapterVerseNumbers.has(verse);
				return {
					key: verse,
					label: verse === 0 ? t('bible.wholeChapter') : `${t('bible.verseAbbrev')}\u00a0${verse}`,
					...(verse !== 0 && present ? { href: `#v${verse}` } : {}),
					...(verse !== 0 && !present ? { note: t('bible.verseNotInEdition') } : {}),
					sources: [...ccc, ...documents]
				};
			})
			.filter((row) => row.sources.length > 0)
	);

	// Reactive rather than onMount: the edition can now change without a
	// navigation (the URL no longer names one), so "continue reading" has to
	// re-record when it does, or it would keep pointing at the edition the
	// reader happened to arrive in.
	$effect(() => {
		if (introMode) {
			// An introduction is a real place to be resumed to, so it records a
			// position like any chapter — labelled by name rather than by "0",
			// which would read as a numbering bug in "continue reading".
			setPosition(workId, `${introBookName} — ${t('bible.introduction')}`, page.url.pathname);
		} else if (current) {
			setPosition(workId, `${current.book.name} ${current.chapter.n}`, page.url.pathname);
		}
	});
</script>

<!--
	THE SITE'S NAME AND NOT THE EDITION'S, which is what this said until
	2026-08-28 (`current?.work.short_title`, i.e. "Catholic Public Domain
	Version"). The address is deliberately edition-free — which edition renders
	here is the reader's standing preference, never the link's to decide (see
	`hrefFor`) — so a title naming one contradicted the URL under it and changed
	whenever the reader switched edition at an address that had not moved. It
	was also the one route in the site that suffixed with anything but
	`home.title`.

	Kept in the shape the edge writes for the same address (`shell-head.ts`), so
	the title does not visibly rearrange as the app boots over it.
-->
<svelte:head>
	{#if introMode}
		<title>{introBookName}: {t('bible.introduction')} — {t('home.title')}</title>
	{:else}
		<title>{current?.book.name} {data.chapterN} — {t('home.title')}</title>
	{/if}
</svelte:head>

<!-- No verse number in here any more: it used to be rendered once per cell,
     which meant two triggers opening two popovers built from the same
     `verseHref` and offering byte-identical actions. The number is the ROW's
     now, printed once in the gutter between the columns — see `CompareUnit`
     in `$lib/compare.ts`, and the `unit` prop passed to `CompareGrid` below
     for this route's addresses. -->

<!--
	A verse as a compare cell. TWO SNIPPETS RATHER THAN ONE, because the two
	columns are two editions: each note is written in its own edition's
	language, resolves its references against its own work id (Challoner writes
	"2 Kings 24" for 2 Samuel 24 — `bible.douay-rheims.en` is in `WORK_CONFIGS`
	for it) and takes its label from its own chapter's run of letters. A single
	shared cell could carry none of that, which is why this printed
	`verse.text` and nothing else.

	IT PRINTED THE TEXT AND DROPPED THE APPARATUS, and that was the one place
	on the site where comparing cost the reader something the single column
	gave them: an annotated edition's whole point is the annotation, and this
	is exactly where a reader has reason to want it — Challoner explaining why
	his verse says what the column beside it does not. It is restored now that
	a note is a card rather than a block: a gloss opening in the flow would
	have pushed one column's verses out of alignment with the other's, which
	is the one thing a comparison cannot survive. The card costs the grid no
	layout at all.

	No drop cap: the single-column reader promotes the chapter's first letter,
	and two of them side by side read as two beginnings rather than one.
-->
{#snippet leftVerseCell(verse: Verse)}
	<p class="compare-verse">
		<AnnotatedText
			text={verse.text}
			textMarked={verse.text_marked}
			notes={verse.notes}
			lang={current?.work.language ?? 'en'}
			work={workId}
			noteOffset={noteOffsets.get(`v${verse.n}`) ?? 0}
		/>
	</p>
{/snippet}

{#snippet rightVerseCell(verse: Verse)}
	<p class="compare-verse">
		<AnnotatedText
			text={verse.text}
			textMarked={verse.text_marked}
			notes={verse.notes}
			lang={secondary?.work.language ?? 'en'}
			work={secondaryWorkId}
			noteOffset={secondaryNoteOffsets.get(`v${verse.n}`) ?? 0}
		/>
	</p>
{/snippet}

<!-- Written once and rendered twice, the way every other reading route
     renders its table of contents (`TocMenu`): as the desktop sidebar at the
     foot of each branch below, and as the reading bar's panel at the widths
     where that sidebar is hidden. A second call would be a second list to keep
     in step by hand, and the panel is exactly where a divergence would go
     unseen. -->
{#snippet bookList()}
	<BookChapterPicker
		currentWorkId={workId}
		currentOsis={data.osis}
		currentChapter={data.chapterN}
		variant="panel"
	/>
{/snippet}

{#if introMode}
	<!-- Chapter 0: the book's introduction. A single column always — there is
	     nothing to compare (no verse numbers to align by, and one introduction
	     is shared across a language's editions), so the compare toggle, the
	     comparison picker and the cited-in panel are all absent rather than
	     disabled. The reading bar keeps the bookmark, print and roll
	     controls — an introduction is still a page of scripture to roll away
	     from. -->
	<div class="reading-layout">
		<article class="content-column">
			<ReadingBar
				toc={{ label: t('bible.pickBook'), content: bookList }}
				bookmarkHref={chapterHref}
				canCompare={false}
				compareActive={false}
				randomVerse
			/>

			{#if intro && introWork}
				<p class="edition-label label-micro">{introWork.title}</p>
				<p class="copyright-notice"><CopyrightNotice manifest={introWork} /></p>
			{/if}
			<h1>{introBookName}</h1>
			<p class="intro-kicker">{t('bible.introduction')}</p>

			{#if intro}
				<div class="reading-text" lang={introLang}>
					{#each intro.blocks as block, i (i)}
						<p class="intro-block">{block.text}</p>
					{/each}
				</div>
				<!-- Said plainly, once, under the text. These are Challoner's
				     prefaces, not scripture, and a reader arriving at "chapter 0"
				     of Genesis should not have to infer that from the typography. -->
				<p class="intro-note">{t('bible.introSource')}</p>
			{:else}
				<p class="intro-note">{t('bible.introUnavailable')}</p>
			{/if}

			<UnitNav
				ariaLabel="Chapter navigation"
				prev={prev && {
					href: hrefFor({ kind: 'bible', osis: prev.osis, chapter: prev.chapter }),
					label: t('unitNav.previous'),
					full: t('bible.prevChapter')
				}}
				next={next && {
					href: hrefFor({ kind: 'bible', osis: next.osis, chapter: next.chapter }),
					label: t('unitNav.next'),
					full: t('bible.nextChapter')
				}}
			/>
		</article>

		<aside class="reading-aside desktop-picker" aria-label={t('bible.pickBook')} role="navigation">
			<BookChapterPicker
				currentWorkId={workId}
				currentOsis={data.osis}
				currentChapter={data.chapterN}
				variant="sidebar"
			/>
		</aside>
	</div>
{:else if current}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<!-- Edition, comparison, bookmark, print and the random-verse roll, in
			     that order and in both modes — see `ReadingBar`. Everything it
			     carries used to be spread across the breadcrumb row, the title row
			     and the site header. -->
			<ReadingBar
				toc={{ label: t('bible.pickBook'), content: bookList }}
				bookmarkHref={chapterHref}
				canCompare={otherEditions.length > 0}
				{compareActive}
				onToggleCompare={toggleCompare}
				randomVerse
				comparison={{
					editions: otherEditions,
					current: secondaryWorkId,
					onselect: chooseComparisonEdition,
					editionStyle: true
				}}
			/>
			{#if compareActive && secondary}
				<!-- Compare mode's WHOLE header is per-edition, merged into one
				     two-column block, same reasoning as `documents/[slug]`: the
				     edition label, copyright notice, book/chapter heading and
				     edition picker all differ by edition, so a single
				     primary-edition-only copy was always showing the second column a
				     header that wasn't its own. -->
				<!-- One row per field (`.compare-unit-header`, app.css). Nothing here
				     ever collapses, and that is the right outcome rather than an
				     oversight: two editions have different titles and different
				     copyright notices by definition, and the book name is translated
				     ("Genesis 1" against "Génesis 1"). This is the route that shows the
				     collapse rule correctly declining to fire. -->
				<div class="compare-unit-header">
					<CompareField leftLang={current.work.language} rightLang={secondary.work.language}>
						{#snippet left()}<p class="edition-label label-micro">{current.work.title}</p>{/snippet}
						{#snippet right()}<p class="edition-label label-micro">
								{secondary.work.title}
							</p>{/snippet}
					</CompareField>

					<CompareCopyrightField left={current.work} right={secondary.work} />

					<CompareField leftLang={current.work.language} rightLang={secondary.work.language}>
						{#snippet left()}<h1>{current.book.name} {current.chapter.n}</h1>{/snippet}
						{#snippet right()}<h1>{secondary.book.name} {secondary.chapter.n}</h1>{/snippet}
					</CompareField>
				</div>
			{:else}
				<!-- No breadcrumb on this route to share a line with (unlike
				     documents/CCC/Compendium/prayers) — the edition label is the
				     topmost line here, so the bookmark/compare-toggle controls join
				     it instead of taking a row of their own. -->
				<p class="edition-label label-micro">{current.work.title}</p>
				<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>
				<h1>{current.book.name} {current.chapter.n}</h1>
				<!-- The chapter argument: an annotated edition's summary of what
				     the chapter contains, which the Douay-Rheims prints under the
				     chapter number for all but 27 of its 1,334 chapters. Set as an
				     unlabelled paragraph because that is how the editions print it
				     — the label exists only for assistive technology, which needs
				     to be told this is apparatus rather than the chapter's opening
				     words. In the edition's own language, never the reader's.

				     Not `current.chapter.summary` directly: Matos Soares writes his
				     argument as the chapter's own rubrics joined together, so on
				     1,131 of his 1,279 chapters this paragraph was the next screen
				     of headings read out in advance. See `chapterArgument`. -->
				{#if argument}
					<p
						class="chapter-argument"
						lang={current.work.language}
						aria-label={t('bible.chapterArgument')}
					>
						{argument}
					</p>
				{/if}
			{/if}

			{#if compareActive && secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={current.work.language}
					rightLang={secondary.work.language}
					leftLabel={compareColumnLabel(current.work, true)}
					rightLabel={compareColumnLabel(secondary.work, true)}
					left={leftVerseCell}
					right={rightVerseCell}
					unit={(n) => ({
						href: `#v${n}`,
						canonicalHref: verseHref(n),
						label: `${t('bible.verseAbbrev')} ${n}`,
						anchorId: `v${n}`,
						// An arriving citation (`?v=1-7`) marked its passage in the
						// single-column reader and marked nothing at all here, so a
						// link INTO a comparison landed with no indication of which
						// verses it had named. Same wash, one row at a time.
						emphasized: isHighlighted(n)
					})}
					note={compareVersesDiffer ? t('compare.versificationNote') : undefined}
				/>
			{:else}
				<div class="reading-text" lang={current.work.language}>
					<!-- A plate that resolved to no verse belongs to the chapter, and
					     is drawn before the first verse. `placePlates` keys those 0;
					     none of the 241 land there today. -->
					{#each chapterPlates.get(0) ?? [] as plate (plate.id)}
						<Plate {plate} credit={plateCredit} />
					{/each}
					{#each current.chapter.verses as verse, i (verse.n)}
						<!-- Before the verse, not after: an engraving is read as the
						     scene the sentence under it describes. -->
						{#each chapterPlates.get(verse.n) ?? [] as plate (plate.id)}
							<Plate {plate} credit={plateCredit} />
						{/each}
						<!-- A heading can carry apparatus of its own: Lamentations 1
						     opens with Jeremias's prologue, which the Douay-Rheims prints
						     before verse 1 with a note saying he did not write it. Keyed
						     `h{n}.{i}` so its notes stay distinct both from the verse it
						     precedes and from a sibling heading at another level, since
						     every one of them numbers its notes from 1. -->
						{#each headingsBefore(verse.n) as heading, hi (`${verse.n}-${hi}`)}
							<svelte:element
								this={`h${Math.min((heading.level ?? 4) + 1, 6)}`}
								class="section-heading"
								class:section-heading-1={(heading.level ?? 4) === 1}
								class:section-heading-2={(heading.level ?? 4) === 2}
								class:section-heading-3={(heading.level ?? 4) === 3}
								class:section-heading-4={(heading.level ?? 4) >= 4}
							>
								<AnnotatedText
									text={heading.text}
									textMarked={heading.text_marked}
									notes={heading.notes}
									lang={current.work.language}
									work={current.work.id}
									noteOffset={noteOffsets.get(`h${verse.n}.${hi}`) ?? 0}
								/>
							</svelte:element>
						{/each}
						<span
							id={`v${verse.n}`}
							class="verse"
							class:bookmarked={bookmarks.has(verseHref(verse.n))}
							class:highlighted={isHighlighted(verse.n)}
						>
							<ReferenceNumber
								n={verse.n}
								href={`#v${verse.n}`}
								canonicalHref={verseHref(verse.n)}
								label={`${t('bible.verseAbbrev')} ${verse.n}`}
								placement="inline"
								emphasized={isHighlighted(verse.n)}
							/><AnnotatedText
								text={verse.text}
								textMarked={verse.text_marked}
								notes={verse.notes}
								lang={current.work.language}
								work={current.work.id}
								dropCap={i === 0 && headingsBefore(verse.n).length === 0}
								noteOffset={noteOffsets.get(`v${verse.n}`) ?? 0}
							/>
						</span>
					{/each}
				</div>
			{/if}

			{#if citedInRows.length > 0}
				<CitedBy heading={t('refs.citedIn')} rows={citedInRows} />
			{/if}

			<UnitNav
				ariaLabel="Chapter navigation"
				prev={prev && {
					href: hrefFor({ kind: 'bible', osis: prev.osis, chapter: prev.chapter }),
					label: t('unitNav.previous'),
					full: t('bible.prevChapter')
				}}
				next={next && {
					href: hrefFor({ kind: 'bible', osis: next.osis, chapter: next.chapter }),
					label: t('unitNav.next'),
					full: t('bible.nextChapter')
				}}
			/>
		</article>

		<!-- Hidden below 80rem (app.css), where `bookList` above stands in for
	     it inside the reading bar's contents panel. Both variants abbreviate
	     and tile; `variant="sidebar"` packs the same books tighter, since it
	     is fitting all 73 into a 17rem column with no scrollbar where the
	     panel is a scroll box already (BookChapterPicker's `.book-grid.panel`
	     carries the arithmetic for both); both hang
	     their open chapter panel off the viewport with `position: fixed`
	     rather than `'grid'`'s `absolute` (BookChapterPicker's own docblock),
	     because this sticky column and that panel's body are each their own
	     `overflow-y: auto` scroll container and would clip it. Omitted
	     entirely in compare mode — see app.css's `.reading-layout.compare`
	     docblock: the second text column takes the room the sidebar would
	     have used, at every width, rather than the other way around. -->
		<aside class="reading-aside desktop-picker" aria-label={t('bible.pickBook')} role="navigation">
			<BookChapterPicker
				currentWorkId={workId}
				currentOsis={data.osis}
				currentChapter={data.chapterN}
				variant="sidebar"
			/>
		</aside>
	</div>
{/if}

<style>
	.edition-label {
		margin: 0;
		font-size: 0.85rem;
	}

	.copyright-notice {
		margin: 0.15rem 0 0;
	}

	/* "Introduction", under the book's name — the counterpart of the chapter
	   number in an ordinary chapter's `<h1>`, set as a kicker rather than
	   folded into the heading so the heading stays the book's own name. */
	.intro-kicker {
		margin: 0.1rem 0 0;
		/* The comment above says it: this stands in for the chapter number,
		   and the chapter number is an identifier. It is also our word rather
		   than the edition's, which the heading above it is not. */
		font-family: var(--font-sans);
		font-size: 1.05rem;
		color: var(--color-text-muted);
	}

	.intro-block {
		margin: 0 0 0.85em;
	}

	.intro-block:last-child {
		margin-bottom: 0;
	}

	.intro-note {
		margin-top: 1.5rem;
		font-size: 0.85rem;
		color: var(--color-text-muted);
	}

	h1 {
		font-family: var(--font-serif);
		margin-top: 0.25rem;
	}

	/* Compare-mode verse cell (`verseCell` snippet, CompareGrid) — plainer
	   than `.verse` because everything that used to make it richer now
	   belongs to the row rather than to the cell: the number lives in the
	   gutter and the cited-range wash is `.compare-row.highlighted`'s
	   (app.css). There is still no drop cap while comparing. Font, size and
	   line-height come from `.reading-text` on the cell itself
	   (CompareGrid.svelte) — this only resets the paragraph margin. */
	.compare-verse {
		margin: 0;
	}

	/*
	 * A heading the edition prints inside a chapter. FOUR LEVELS, because an
	 * annotated edition sets a hierarchy: the Matos Soares Bible puts a part
	 * title, a section title and a pericope line all above Genesis 1:1.
	 *
	 * THEY DESCEND IN PROMINENCE WITHOUT GROWING, which is the constraint that
	 * shapes all four. The chapter's own `<h1>` is the largest thing on the
	 * page and a level-1 section heading sits under it, so the range runs from
	 * just above the reading size downward — separation is carried by letter-
	 * spacing, case and weight rather than by size, which there is no room for.
	 * Level 4 is the innermost line (a Psalm's Latin incipit, a Matos Soares
	 * caption) and is deliberately the quietest: it recurs every few verses,
	 * and at that frequency anything emphatic reads as clutter.
	 */
	.section-heading {
		font-family: var(--font-serif);
		/* em, not rem: scales with .reading-text's own font-size (which
		   carries --reading-scale, owned by app.css) instead of fighting it. */
		font-size: 1.1em;
		font-weight: 600;
		margin: 1.5rem 0 0.5rem;
	}

	.section-heading-1 {
		/* A part title — "PRIMEIRA PARTE". Small caps and tracking rather than
		   size: it is the most prominent of the four and still must not compete
		   with the chapter number above it. */
		font-size: 0.82em;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-block-start: 2.5rem;
		padding-block-end: 0.4rem;
		border-block-end: 1px solid var(--color-border);
	}

	.section-heading-2 {
		font-size: 1.05em;
		letter-spacing: 0.02em;
		margin-block-start: 2rem;
	}

	.section-heading-3 {
		font-size: 1em;
		margin-block-start: 1.75rem;
	}

	.section-heading-4 {
		/* The innermost line. Italic and muted, at the reading size — it marks
		   a pericope rather than announcing a division. */
		font-size: 0.95em;
		font-weight: 500;
		font-style: italic;
		color: var(--color-text-muted);
		margin-block: 1.25rem 0.4rem;
	}

	.verse {
		margin-inline-end: 0.25em;
	}

	/* A passage a citation pointed at (`?v=1-7`), or a single verse opened by
	   its `#v{n}` address. A wash rather than a border or a block: the verses
	   run together as continuous prose, so anything with edges would break the
	   paragraph into boxes. `box-decoration-break` keeps the wash continuous
	   when a verse wraps across lines, which is most of them.

	   Colour-mixed from the accent rather than hard-coded so it follows all
	   four themes; at 12% it stays under the text rather than fighting it. */
	/* The reader's own mark on a verse, and deliberately written BEFORE
	   `.highlighted` so that an arriving citation's wash wins the background
	   when a verse is both. Nothing is lost when it does: the verse number
	   itself stays gold (ReferenceNumber's `.bookmarked`, which is written
	   after its own `.emphasized` for exactly this reason), so each of the two
	   states always has one visible cue. */
	.verse.bookmarked {
		background: color-mix(in srgb, var(--color-bookmark) 14%, transparent);
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		border-radius: 0.15em;
		padding-block: 0.05em;
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
	}

	.verse.highlighted {
		background: color-mix(in srgb, var(--color-accent) 12%, transparent);
		box-decoration-break: clone;
		-webkit-box-decoration-break: clone;
		border-radius: 0.15em;
		padding-block: 0.05em;
		/* Browsers drop background colour from print output by default (the
		   "background graphics" checkbox, off by default) — without this the
		   whole point of a printed citation, showing WHICH verses it covers,
		   disappears silently. `exact` forces the wash through regardless of
		   that setting; it has no effect on screen. */
		print-color-adjust: exact;
		-webkit-print-color-adjust: exact;
	}

	/* The highlight is information, not decoration — but a reader who has
	   asked for less motion has not asked for less information, so only the
	   transition goes. */
	@media (prefers-reduced-motion: no-preference) {
		.verse {
			transition: background-color 300ms ease;
		}
	}

	/* Set as apparatus, not as reading text: sans-serif, small, muted, and
	   below the chapter — deliberately not competing with the text it
	   annotates (see the cccCitations docblock for why this is a footer
	   summary rather than per-verse markers). One panel for every work that
	   cites the chapter, not one per work type: the reader looks up a verse,
	   so the verse scaffold is built once and each work names itself inside
	   the row. */
	/* The narrow-screen picker is no longer here to hide: it moved into the
	   reading bar's contents panel (`TocMenu`), which app.css shows and hides
	   against the same handover as `.reading-aside` — including the wider
	   boundary compare mode moves it to, which this rule never knew about.
	   Two BookChapterPicker instances are still mounted at once and swapped by
	   breakpoint rather than one whose variant is decided in JS; that part of
	   the arrangement is unchanged, and its reasoning now lives with the CSS
	   that performs it. */
</style>
