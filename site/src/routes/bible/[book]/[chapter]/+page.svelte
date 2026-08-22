<script lang="ts">
	import { browser } from '$app/environment';
	import { page } from '$app/state';
	import {
		baseLang,
		getAdjacentChapterAcrossBooks,
		getCccCitationsForChapter,
		getDocumentCitationsForChapter,
		getDocumentGroup,
		listEditions
	} from '$lib/corpus';
	import { content } from '$lib/content.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import { setPosition } from '$lib/reading-position';
	// Drop cap on the chapter's opening verse only, and only when no section
	// heading precedes it — a cap immediately under a heading collides with
	// it, and the heading is already doing the work of marking the opening.
	import { splitDropCap } from '$lib/dropcap';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import ReferenceNumber from '$lib/components/ReferenceNumber.svelte';
	import CompareToggle from '$lib/components/CompareToggle.svelte';
	import EditionMenu from '$lib/components/EditionMenu.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ComparisonEditionMenu from '$lib/components/ComparisonEditionMenu.svelte';
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
	const workId = $derived(
		(() => {
			const preferred = content.workIdFor('bible');
			return preferred && data.byWorkId[preferred] ? preferred : availableWorkIds[0];
		})()
	);
	const current = $derived(data.byWorkId[workId]);

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

	function headingBefore(verseN: number) {
		return current?.chapter.headings?.find((h) => h.before_verse === verseN);
	}

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
	 * (`+layout.ts`, docs/decisions.md 2026-08-18) no route component runs
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

	const documentCitations = $derived(getDocumentCitationsForChapter(data.osis, data.chapterN));

	/**
	 * A source group inside one verse's row: the work's name once, then every
	 * place in it that cites this verse — "CCC (¶425 · ¶1108)", "Lumen Gentium
	 * (§8 · §22)". Grouping rather than repeating the name per reference is
	 * what keeps a heavily-cited verse readable; Matthew 25 draws on 237
	 * document references across its verses, and naming each one's work
	 * separately would be most of the panel.
	 */
	interface CitingSource {
		key: string;
		/** The short name shown in the row — "CCC", "Lumen Gentium". */
		label: string;
		/** The work's full name, shown on hover; null when it adds nothing. */
		fullTitle: string | null;
		refs: { n: number; label: string; href: string }[];
	}

	/**
	 * The document's name in the edition this reader would actually open, and
	 * its short title where the manifest has one — "Lumen Gentium" rather than
	 * "Dogmatic Constitution on the Church Lumen Gentium". A slug with no
	 * manifest at all is skipped rather than shown raw: it can only mean the
	 * index outlived the work (a takedown between builds), and a bare slug is
	 * not something to put in front of a reader.
	 */
	function documentSource(slug: string, sections: number[]): CitingSource | null {
		const group = getDocumentGroup(slug);
		if (!group) return null;
		const lang = content.documentLangFor(slug);
		const manifest = group.manifests[lang] ?? Object.values(group.manifests)[0];
		if (!manifest) return null;
		const label = manifest.short_title || manifest.title;
		return {
			key: `doc:${slug}`,
			label,
			fullTitle: manifest.title !== label ? manifest.title : null,
			// A section is an anchor on the document's single page, not a page
			// of its own — the same `#s{n}` target `refs.ts` links to. It is
			// also a previewable address (`linkPreviewHref.ts`), so hovering a
			// section number shows the text itself, not just its number.
			refs: sections.map((n) => ({ n, label: `§${n}`, href: `/documenta/${slug}#s${n}` }))
		};
	}

	/**
	 * One row per cited verse, carrying every work that cites it — the
	 * Catechism first, then the documents by display title. The verse scaffold
	 * is built once and shared, which is the whole point of a single panel:
	 * the reader looks up a verse, not a work.
	 */
	const citedInRows = $derived(
		[...new Set([...cccCitations.keys(), ...documentCitations.keys()])]
			.sort((a, b) => a - b)
			.map((verse) => {
				const paragraphs = cccCitations.get(verse) ?? [];
				const ccc: CitingSource[] = paragraphs.length
					? [
							{
								key: 'ccc',
								label: t('bible.cccAbbrev'),
								fullTitle: t('ccc.landing.title'),
								refs: paragraphs.map((n) => ({
									n,
									label: `¶${n}`,
									href: `/catechismus/${n}`
								}))
							}
						]
					: [];
				const documents = (documentCitations.get(verse) ?? [])
					.map((entry) => documentSource(entry.slug, entry.sections))
					.filter((source): source is CitingSource => source !== null)
					.sort((a, b) => a.label.localeCompare(b.label));
				return {
					verse,
					present: verse === 0 || chapterVerseNumbers.has(verse),
					sources: [...ccc, ...documents]
				};
			})
			.filter((row) => row.sources.length > 0)
	);

	const citedInTotal = $derived(
		citedInRows.reduce(
			(sum, row) => sum + row.sources.reduce((n, source) => n + source.refs.length, 0),
			0
		)
	);

	// Reactive rather than onMount: the edition can now change without a
	// navigation (the URL no longer names one), so "continue reading" has to
	// re-record when it does, or it would keep pointing at the edition the
	// reader happened to arrive in.
	$effect(() => {
		if (current) {
			setPosition(workId, `${current.book.name} ${current.chapter.n}`, page.url.pathname);
		}
	});
</script>

<svelte:head>
	<title>{current?.book.name} {data.chapterN} — {current?.work.short_title}</title>
</svelte:head>

{#snippet verseCell(verse: Verse)}
	<p class="compare-verse">
		<ReferenceNumber
			n={verse.n}
			href={`#v${verse.n}`}
			label={`${t('bible.verseAbbrev')} ${verse.n}`}
			placement="inline"
		/>
		{verse.text}
	</p>
{/snippet}

{#if current}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<p class="edition-label">{current.work.title}</p>
			<p class="copyright-notice"><CopyrightNotice manifest={current.work} /></p>
			<div class="title-row">
				<h1>{current.book.name} {current.chapter.n}</h1>
				<div class="compare-toolbar">
					<!-- While comparing, EditionMenu moves into the left column's own
					     header (`leftHeaderExtra` below) next to the comparison
					     picker on the right — there's only one column for it up here
					     once compare mode is off. -->
					{#if !compareActive}<EditionMenu />{/if}
					{#if otherEditions.length > 0}
						<CompareToggle active={compareActive} onclick={toggleCompare} />
					{/if}
				</div>
			</div>

			<!-- Kept exactly as it was before the sidebar existed — collapsed
		     behind `<summary>`, right under the heading. Hidden at >= 80rem
		     (see `.mobile-picker` below) in favour of the always-open copy in
		     `.reading-aside`, but below that width nothing here changes: a
		     reader on a narrow viewport gets the identical picker in the
		     identical place they always have. Shown in compare mode too —
		     navigation isn't a compare-mode concern. -->
			<div class="mobile-picker">
				<BookChapterPicker
					currentWorkId={workId}
					currentOsis={data.osis}
					currentChapter={data.chapterN}
				/>
			</div>

			{#if compareActive && secondary}
				<CompareGrid
					rows={compareRows}
					leftLang={current.work.language}
					rightLang={secondary.work.language}
					leftLabel={current.work.short_title}
					rightLabel={secondary.work.short_title}
					left={verseCell}
					right={verseCell}
					note={compareVersesDiffer ? t('compare.versificationNote') : undefined}
				>
					{#snippet leftHeaderExtra()}
						<EditionMenu />
					{/snippet}
					{#snippet rightHeaderExtra()}
						<ComparisonEditionMenu
							editions={otherEditions}
							current={secondaryWorkId}
							onselect={chooseComparisonEdition}
							editionStyle
						/>
					{/snippet}
				</CompareGrid>
			{:else}
				<div class="reading-text" lang={current.work.language}>
					{#each current.chapter.verses as verse, i (verse.n)}
						{@const heading = headingBefore(verse.n)}
						{#if heading}
							<h2 class="section-heading">{heading.text}</h2>
						{/if}
						<span id={`v${verse.n}`} class="verse" class:highlighted={isHighlighted(verse.n)}>
							<ReferenceNumber
								n={verse.n}
								href={`#v${verse.n}`}
								label={`${t('bible.verseAbbrev')} ${verse.n}`}
								placement="inline"
								emphasized={isHighlighted(verse.n)}
							/>{#if i === 0 && !heading}{@const cap = splitDropCap(verse.text)}{#if cap.first}<span
										class="drop-cap-letter"
										>{#if cap.lead}<span class="drop-cap-lead">{cap.lead}</span
											>{/if}{cap.first}</span
									>{cap.rest}{:else}{verse.text}{/if}{:else}{verse.text}{/if}
						</span>
					{/each}
				</div>
			{/if}

			{#if citedInRows.length > 0}
				<section class="cited-in" aria-labelledby="cited-in-heading">
					<h2 id="cited-in-heading">
						{t('bible.citedIn')}
						<span class="count">{citedInTotal}</span>
					</h2>
					<ul>
						{#each citedInRows as row (row.verse)}
							<li>
								<!-- Verse 0 is the corpus's whole-chapter citation sentinel
						     (`verses: []`) — the work cited the chapter, not a verse
						     in it, and saying so is more honest than picking a verse
						     or expanding across all of them. -->
								<span class="verse-ref">
									{#if row.verse === 0}
										{t('bible.wholeChapter')}
									{:else if row.present}
										<a href={`#v${row.verse}`}>{t('bible.verseAbbrev')}&nbsp;{row.verse}</a>
									{:else}
										<span class="verse-absent" title={t('bible.verseNotInEdition')}>
											{t('bible.verseAbbrev')}&nbsp;{row.verse}
										</span>
									{/if}
								</span>
								<span class="sources">
									{#each row.sources as source (source.key)}
										<span class="source">
											<span
												class="source-label"
												class:named={source.fullTitle !== null}
												title={source.fullTitle ?? undefined}>{source.label}</span
											><span class="refs"
												>({#each source.refs as ref, i (ref.n)}{#if i > 0}<span
															class="sep"
															aria-hidden="true">·</span
														>{/if}<a href={ref.href}>{ref.label}</a>{/each})</span
											>
										</span>
									{/each}
								</span>
							</li>
						{/each}
					</ul>
				</section>
			{/if}

			<nav class="unit-nav" aria-label="Chapter navigation">
				{#if prev}
					<a href={`/scriptura/${prev.osis}/${prev.chapter}`} rel="prev">
						&larr; {t('bible.prevChapter')}
					</a>
				{:else}
					<span></span>
				{/if}
				{#if next}
					<a href={`/scriptura/${next.osis}/${next.chapter}`} rel="next">
						{t('bible.nextChapter')} &rarr;
					</a>
				{/if}
			</nav>
		</article>

		<!-- Hidden below 80rem — `.mobile-picker` above is this component's
	     mobile-unchanged counterpart. `variant="sidebar"` lays books out as a
	     vertical list with in-flow chapter panels (BookChapterPicker's own
	     docblock) rather than the wrapped grid + popover the mobile copy
	     still uses, since a 17rem sticky column can neither fit nor safely
	     clip that popover. Omitted entirely in compare mode — see app.css's
	     `.reading-layout.compare` docblock: the second text column takes the
	     room the sidebar would have used, at every width, rather than the
	     other way around. -->
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
		color: var(--color-text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.copyright-notice {
		margin: 0.15rem 0 0;
	}

	h1 {
		font-family: var(--font-serif);
		margin-top: 0.25rem;
	}

	.title-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
	}

	/* `.compare-toolbar` (app.css) is itself flex/justify-end, so nesting it
	   in `.title-row`'s flex row just needs it to not stretch — the h1 above
	   already keeps its own margin-top, this only cancels the toolbar's. */
	.title-row .compare-toolbar {
		margin: 0;
	}

	/* Compare-mode verse cell (`verseCell` snippet, CompareGrid) — the
	   `.reading-text .verse` treatment doesn't apply here (no cited-range
	   highlight, no drop cap in compare mode; see the snippet's own
	   reasoning), so this is deliberately a plainer rule than `.verse`.
	   Font/size/line-height come from `.reading-text` on the cell itself
	   (CompareGrid.svelte) — this only resets the paragraph margin. */
	.compare-verse {
		margin: 0;
	}

	.section-heading {
		font-family: var(--font-serif);
		/* em, not rem: scales with .reading-text's own font-size (which
		   carries --reading-scale, owned by app.css) instead of fighting it. */
		font-size: 1.1em;
		font-weight: 600;
		margin: 1.5rem 0 0.5rem;
	}

	.verse {
		margin-right: 0.25em;
	}

	/* A passage a citation pointed at (`?v=1-7`), or a single verse opened by
	   its `#v{n}` address. A wash rather than a border or a block: the verses
	   run together as continuous prose, so anything with edges would break the
	   paragraph into boxes. `box-decoration-break` keeps the wash continuous
	   when a verse wraps across lines, which is most of them.

	   Colour-mixed from the accent rather than hard-coded so it follows all
	   four themes; at 12% it stays under the text rather than fighting it. */
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
	.cited-in {
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	.cited-in h2 {
		margin: 0 0 0.6rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.cited-in .count {
		font-variant-numeric: tabular-nums;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		padding: 0 0.3rem;
		letter-spacing: 0;
	}

	.cited-in ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		/* Verse label in a fixed column so the paragraph lists line up, which
		   is what makes a long concordance scannable rather than a wall. */
		grid-template-columns: max-content 1fr;
		gap: 0.3rem 0.9rem;
	}

	.cited-in li {
		display: contents;
	}

	.cited-in .verse-ref {
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.cited-in .verse-absent {
		cursor: help;
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	/* Groups wrap as a unit — a work's name must never end a line with its
	   own references orphaned onto the next one. */
	.cited-in .sources {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.7rem;
	}

	.cited-in .source {
		white-space: nowrap;
		font-variant-numeric: tabular-nums;
	}

	/* The work's name, said once per group. Quiet relative to the numbers
	   beside it: those are the links, this is the label that tells you what
	   they are. */
	.cited-in .source-label {
		color: var(--color-text-muted);
	}

	/* Only labels that actually shorten something get the affordance, so the
	   dotted underline means "there is more to read here" rather than
	   decorating every row. Same signal as `.verse-absent` above and
	   `RefText`'s `.ref-unresolved`. */
	.cited-in .source-label.named {
		cursor: help;
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	.cited-in .refs {
		margin-inline-start: 0.3em;
	}

	.cited-in .sep {
		margin-inline: 0.3em;
		color: var(--color-text-muted);
	}

	.cited-in a {
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	/* `.unit-nav` (app.css) covers everything else; this route alone keeps a
	   larger top margin than the other three unit-nav callers. */
	.unit-nav {
		margin-top: 2.5rem;
	}

	/* Two BookChapterPicker instances, CSS-swapped by breakpoint rather than
	   one instance whose variant is decided in JS: a JS-decided swap would
	   have to pick a default before hydration resolves the real viewport,
	   then possibly relocate the picker across the page once it does — this
	   used to also matter for reading without JavaScript at all, back when
	   every route was prerendered (see `citedRange`'s docblock above, which
	   no longer makes that claim now that `ssr = false` means the whole
	   chapter needs JavaScript to render), which is both a layout jump and
	   a NOOP on a viewport where the guess was already right. Two static
	   instances plus a boundary that exactly matches `.reading-layout`'s own
	   80rem (app.css) cost one extra hidden DOM subtree instead. */
	@media (min-width: 80rem) {
		.mobile-picker {
			display: none;
		}
	}

	@media (max-width: 79.9375rem) {
		.desktop-picker {
			display: none;
		}
	}
</style>
