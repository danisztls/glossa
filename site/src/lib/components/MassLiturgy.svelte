<script lang="ts">
	/**
	 * The day's Mass readings with their text, for `/calendarium/liturgia`.
	 *
	 * `DayReadings` is the other renderer of the same data and the two are
	 * deliberately not one component: that one is a LIST OF CITATIONS on a card
	 * that also carries the day's name, its rank and its colour, and this is the
	 * passages themselves on a page whose whole subject they are. A single
	 * component with a `full` flag would have been two layouts and two type
	 * scales behind one boolean.
	 *
	 * THE CAVEAT IS BEHIND THE SAME `i` IT IS BEHIND ON THE CARD, and the two
	 * surfaces agree deliberately. It is the site's one arrangement for a line
	 * that QUALIFIES something rather than saying it — `ArtFigure`'s, and
	 * `DayReadings`' — and a page of Scripture is where a paragraph of small
	 * print set over the first reading would be least read, not most. Paper
	 * still gets it unconditionally and under the list, because a popover never
	 * prints and the printed copy is the one whose reader cannot press
	 * anything.
	 *
	 * WHICH EDITION IS THE SECOND LINE OF THAT NOTE, for the same reason the
	 * first is in it: it qualifies the passages rather than saying them. The
	 * card has no such line because it sets out no text. On screen the reading
	 * bar's picker is the other place it is stated, and that is a control a
	 * reader has to open; on paper the picker is gone and the note is the only
	 * place left.
	 *
	 * THE TEXT IS THE READER'S OWN EDITION AND CARRIES NONE OF ITS APPARATUS.
	 * `AnnotatedText` renders a chapter's footnote marks on `/scriptura`, and
	 * nothing here does: a pericope is set out to be read through, and a
	 * translator's note on the third verse is a different act from reading the
	 * passage. The whole chapter, with its notes, is one link away — which is
	 * what the citation above each passage is.
	 */
	import { content } from '$lib/content.svelte';
	import { chapterVerseSep } from '$lib/citation-style';
	import { getWork } from '$lib/corpus';
	import { i18n, t } from '$lib/i18n.svelte';
	import HintNote from './HintNote.svelte';
	import { slotKey, type MassReadings, type Pericope } from '$lib/lectionary';
	import { localizeCite } from '$lib/lectionary/cite';
	import { loadPassage, runIsBroken, type PassageResult, type PassageRun } from '$lib/liturgy';
	import { hrefFor } from '$lib/address';
	import ReferenceNumber from './ReferenceNumber.svelte';
	import RefText from './RefText.svelte';

	interface Props {
		masses: MassReadings[];
	}
	let { masses }: Props = $props();

	/**
	 * The Bible edition's language and not the interface's — `DayReadings` has
	 * the argument in full. It decides both halves here: how the citation is
	 * written, and which grammar the passage is resolved under, which must be
	 * the same one or the text below a citation could come from a chapter the
	 * link above it does not open.
	 */
	const citeLang = $derived(content.langFor('bible'));
	const bibleWorkId = $derived(content.workIdFor('bible'));

	/**
	 * The edition itself, for the line paper gets in place of the picker.
	 *
	 * The bar names it on screen and prints nothing: `print.css` drops the bar
	 * because a reading page's copyright notice names its edition underneath,
	 * and this page has no such notice — its subject is a day rather than a
	 * work. Without this the passages come off the printer as anonymous
	 * Scripture.
	 *
	 * `title` and not `short_title`, the chapter reader's `.edition-label`
	 * being set the same way: a sheet carried to Mass is read away from
	 * anything that would gloss "CPDV".
	 *
	 * The prayers under it need no such line — `DayPrayers` links to them and
	 * sets out no text, so one edition's words are all this page prints.
	 */
	const bibleWork = $derived(bibleWorkId ? getWork(bibleWorkId) : undefined);
	const cite = (text: string) => localizeCite(text, citeLang, t('lectionary.cf'));

	/**
	 * Resolved passages, by edition and citation.
	 *
	 * KEYED BY THE EDITION AS WELL AS THE CITATION, because a reader switching
	 * from the Vulgate to the Douay-Rheims mid-page must not keep the verses
	 * they were shown before — the numbering itself can differ. The key is the
	 * same shape `linkPreviewContent.ts`'s cache uses and for the same reason.
	 *
	 * `started` is a plain `Set` and not state: it exists so the effect below
	 * can tell "not asked for" from "asked for and still in flight" without
	 * reading the map it writes, which would make the effect its own trigger.
	 */
	let passages = $state<Record<string, PassageResult>>({});
	const started = new Set<string>();

	const keyFor = (text: string) => `${bibleWorkId ?? ''} :: ${text}`;

	/** Every citation on the page, in render order — the effect's whole input,
	 *  so that a change of edition or of day is one recomputation. */
	const citations = $derived(
		masses.flatMap((mass) => mass.readings.filter((r) => r.cite).map((r) => cite(r.cite).text))
	);

	$effect(() => {
		if (!bibleWorkId) return;
		for (const text of citations) {
			const key = keyFor(text);
			if (started.has(key)) continue;
			started.add(key);
			// A dropped fetch is `withheld` and the citation stands alone, which is
			// the same posture the card takes toward a fact it does not have: the
			// page answers with the day, the schedule and the address either way.
			void loadPassage(text, { bibleWorkId, lang: citeLang }).then(
				(passage) => (passages = { ...passages, [key]: passage }),
				() => (passages = { ...passages, [key]: { kind: 'withheld' } })
			);
		}
	});

	function label(p: Pericope, readings: Pericope[]): string {
		const key = slotKey(p, readings);
		return key ? t(key) : (p.label ?? '');
	}

	/**
	 * Where a verse number leads, and what its anchor menu copies.
	 *
	 * THE BIBLE'S OWN ADDRESS AND NOT ONE ON THIS PAGE, which is the one place
	 * this differs from `/scriptura`: there the number is an in-page `#v{n}`
	 * because the chapter is on the screen. Here it is not — the page holds
	 * nine verses of it — so the number is a way INTO the chapter, at the verse
	 * it names. `hrefFor` owns the spelling, as everywhere.
	 */
	const verseHref = (run: PassageRun, n: number) =>
		`${hrefFor({ kind: 'bible', osis: run.osis, chapter: run.chapter })}#v${n}`;
</script>

<section class="mass-liturgy" aria-labelledby="liturgy-readings">
	<div class="head">
		<h2 id="liturgy-readings">{t('lectionary.heading')}</h2>
		<!-- `children` AND NOT `text`, which is the difference between this note
		     and the card's: `DayReadings` qualifies a list of citations and has
		     one sentence to do it with, and this qualifies the passages
		     themselves, which are an edition's words before they are anything
		     else. `HintNote` takes a line of small print as `text` and anything
		     longer as markup the consumer sets, so the type of these two is
		     below. -->
		<HintNote label={t('lectionary.about')}>
			<span class="note-caveat">{t('lectionary.caveat')}</span>
			{#if bibleWork}
				<!-- A field label and its value, `CopyrightNotice`'s shape, because
				     the title is set in the edition's own language and a sentence
				     wrapped around it would put English word order in the
				     dictionary. -->
				<span class="note-edition"
					>{t('liturgy.editionLabel')}:
					<span lang={bibleWork.language}>{bibleWork.title}</span></span
				>
			{/if}
		</HintNote>
	</div>

	{#each masses as mass (mass.olm)}
		<article class="mass">
			{#if mass.label}
				<!-- Named only where the day has more than one Mass to tell apart;
				     the source names it, and this does not invent one. -->
				<h3 class="mass-label">{mass.label}</h3>
			{/if}

			{#each mass.readings as reading, i (i)}
				{@const main = reading.cite ? cite(reading.cite) : undefined}
				{@const passage = main ? passages[keyFor(main.text)] : undefined}
				<section class="pericope">
					<h4 lang={i18n.lang}>{label(reading, mass.readings)}</h4>
					{#if main}
						<p class="cite">
							<RefText text={main.text} lang={main.lang} />
							{#each reading.orElse ?? [] as alt (alt)}
								{@const other = cite(alt)}
								<span class="alt">
									<span class="or">{t('lectionary.or')}</span>
									<RefText text={other.text} lang={other.lang} />
								</span>
							{/each}
						</p>
						{#if passage?.kind === 'passage'}
							<div class="passage reading-text" lang={citeLang}>
								{#each passage.runs as run, r (r)}
									{@const previous = passage.runs[r - 1]}
									<!-- A CHAPTER MARK ONLY WHERE THE VERSE NUMBERS WOULD LIE.
									     Every run but the first restarts its numbering somewhere
									     the citation above cannot be read for — `…31 1 So the
									     heavens…` is two chapters and looks like one — so a run
									     that opens a chapter the previous one did not is headed
									     by its number. The first run is not: the citation over
									     the passage has just said which chapter it is. -->
									{@const opensChapter =
										previous !== undefined &&
										(previous.chapter !== run.chapter || previous.osis !== run.osis)}
									<!-- The span around each verse carries nothing but its
									     address, for the popover a highlight raises
									     (`SelectionMenu`): the passage is one `.reading-text`
									     and the verses inside it are bare text, so without it a
									     highlight here would resolve to the whole day's
									     readings or to nothing. It is what the chapter reader
									     already wraps every verse in. -->
									<p class="run" class:broken={runIsBroken(passage.runs, r)}>
										{#if opensChapter}<span class="chapter-mark" aria-hidden="true"
												>{run.chapter}</span
											>{/if}{#each run.verses as verse (verse.n)}<span
												data-unit-href={verseHref(run, verse.n)}
												><ReferenceNumber
													n={verse.n}
													href={verseHref(run, verse.n)}
													canonicalHref={verseHref(run, verse.n)}
													label={`${run.book} ${run.chapter}${chapterVerseSep()}${verse.n}`}
													placement="inline"
												/>{verse.text}</span
											>{' '}{/each}
									</p>
								{/each}
							</div>
						{:else if passage?.kind === 'withheld'}
							<!-- Said rather than left blank: a citation whose passage this
							     edition cannot give WHOLE prints no text at all (`$lib/
							     liturgy`), and a reader looking at a bare citation under a
							     page of passages deserves to know which of the two it is. -->
							<p class="unresolved">{t('liturgy.passageWithheld')}</p>
						{/if}
					{:else}
						<!-- Christmas Day's acclamation, the Easter sequences: the source
						     prints the words and no address, so there is nothing to resolve
						     and the words are the lectionary's own. `lectionary.textMissing`
						     argues why the line names the absence rather than the text. -->
						<p class="text-missing">{t('lectionary.textMissing')}</p>
					{/if}
				</section>
			{/each}
		</article>
	{/each}

	<!-- Paper gets it unconditionally and at the foot, `DayReadings`' reasoning
	     word for word: a popover never prints — top layer, and closed besides —
	     and this is the one copy whose reader cannot press anything.
	     `aria-hidden` so it is not read twice. -->
	<p class="caveat-print" aria-hidden="true">{t('lectionary.caveat')}</p>
	{#if bibleWork}
		<!-- The note's second line, in the note's own order: the caveat above
		     qualifies the schedule, and this answers the question it raises —
		     which edition "this site's own editions" turned out to mean. -->
		<p class="edition-print" aria-hidden="true">
			{t('liturgy.editionLabel')}: <span lang={bibleWork.language}>{bibleWork.title}</span>
		</p>
	{/if}
</section>

<style>
	.mass-liturgy {
		margin-top: 2rem;
	}
	/* The heading and its mark on one line, the mark sized to the heading and
	   not to the page — `DayReadings`' own `.head`, at this one's type size. */
	.head {
		display: flex;
		align-items: center;
		gap: 0.3rem;
	}
	h2 {
		margin: 0;
		font-size: 1.05rem;
	}
	/* `.menu-trigger` is the site's button and this adds only its size: the
	   header's 2.25rem square is a control in a bar, and this one stands beside
	   the heading it qualifies. */
	/* `SiglumGloss`'s card at this one's measure: where it goes is
	   `.floating-panel` in app.css, and what is left here is that a sentence and
	   a half wants a narrower column than a paragraph of commentary. */
	/* WHAT `text` WOULD HAVE SET, set here because these are `children`:
	   `HintNote`'s panel brings its measure and its padding and the consumer
	   brings the note, so a note of two lines carries its own type — the same
	   small muted setting every other surface's one-liner gets from the
	   component. */
	.note-caveat,
	.note-edition {
		display: block;
		font-size: 0.8rem;
		line-height: 1.5;
		color: var(--color-text-muted);
	}
	.note-edition {
		margin-block-start: 0.4rem;
	}
	.caveat-print,
	.edition-print {
		display: none;
	}
	.mass {
		margin-top: 1.5rem;
	}
	.mass-label {
		margin: 0 0 0.75rem;
		font-size: 0.95rem;
		font-weight: 600;
	}
	.pericope {
		margin-top: 1.5rem;
	}
	.pericope h4 {
		margin: 0;
		font-size: 0.8rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		hyphens: auto;
	}
	.cite {
		margin: 0.15rem 0 0;
		font-size: 0.95rem;
		font-weight: 600;
	}
	.or {
		color: var(--color-text-muted);
		font-style: italic;
		font-weight: 400;
		margin: 0 0.15rem 0 0.35rem;
	}
	.alt {
		white-space: nowrap;
		font-weight: 400;
	}
	/* Face, size and leading are `.reading-text`'s (layout.css) — the same
	   setting a chapter of Genesis is read in, and the same one the reader's
	   own size adjustment reaches. Nothing about the type is declared here; the
	   measure is the column's. */
	.passage {
		margin-top: 0.5rem;
	}
	.run {
		margin: 0;
	}
	/* A run the citation did not join to the one before it. The rule says so
	   without inventing an ellipsis the source never printed — a "…" would read
	   as elided WORDS, and what is missing here is verses. */
	.run.broken {
		margin-top: 0.6rem;
		padding-top: 0.6rem;
		border-top: 1px solid var(--color-border);
	}
	/*
	 * The chapter number heading a run that opens one, set the way the Bible's
	 * own reading column would set it: the apparatus colour and the sans face
	 * of `.reference-number`, a size up from a verse number, sitting on the
	 * text's own baseline rather than raised. It is `aria-hidden` because every
	 * verse number beside it already carries the chapter in its accessible
	 * name.
	 */
	.chapter-mark {
		margin-inline-end: 0.35em;
		color: var(--color-apparatus);
		font-family: var(--font-sans);
		font-size: 1.05em;
		font-weight: 650;
		font-variant-numeric: tabular-nums;
	}
	.unresolved,
	.text-missing {
		margin: 0.35rem 0 0;
		font-size: 0.85rem;
		font-style: italic;
		color: var(--color-text-muted);
	}

	@media print {
		.caveat-print,
		.edition-print {
			display: block;
			font-size: 0.75rem;
			line-height: 1.45;
			color: var(--color-text-muted);
		}
		/* The rule belongs to the foot as a whole, so it stays on whichever of
		   the two opens it — the caveat, which is unconditional. */
		.caveat-print {
			margin: 1.5rem 0 0;
			padding-top: 0.7rem;
			border-top: 1px solid var(--color-border);
		}
		.edition-print {
			margin: 0.35rem 0 0;
		}
	}
</style>
