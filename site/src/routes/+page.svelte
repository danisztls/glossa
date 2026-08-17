<script lang="ts">
	/**
	 * Home page. Rewritten 2026-08-16 to lead with the TEXT's structure —
	 * books & chapters, parts & sections, pontificates & councils — rather
	 * than with editions and copyright, which is what it showed before (one
	 * row per work, titled by its short title/language/copyright label). A
	 * reader arriving here should see what there is to read and be able to
	 * click straight into it; which edition they're reading is now a quiet
	 * footnote under each section (`CopyrightNotice`), not the subject.
	 *
	 * Every section below shows the reader's EFFECTIVE edition only — one
	 * entry per work, never one per language (2026-08-15 decision: with
	 * ~460 works across languages once the encyclical sweep finishes,
	 * listing every language for every work would roughly double this page
	 * and make it unusable). "Effective" is resolved the same way every
	 * reading route resolves it — through the content store
	 * (`content.workIdFor`/`content.documentLangFor`), never by filtering on
	 * `i18n.lang` directly — so a reader who has explicitly overridden an
	 * edition (e.g. reading the Portuguese Bible under an English interface)
	 * sees the edition they actually chose here too, not whatever the
	 * interface language implies.
	 */
	import { onMount } from 'svelte';
	import { content } from '$lib/content.svelte';
	import {
		getCccStructure,
		getCompendiumStructure,
		getWork,
		listDocuments,
		listPrayerGroups
	} from '$lib/corpus';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	import { displayTitle } from '$lib/titles';
	import { formatPromulgated } from '$lib/dates';
	import { listPositions, type ReadingPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import type { CccNode, DocumentManifest, WorkType } from '$lib/types';

	const bibleWork = $derived.by(() => {
		const id = content.workIdFor('bible');
		return id ? getWork(id) : undefined;
	});
	const cccWork = $derived.by(() => {
		const id = content.workIdFor('catechism');
		return id ? getWork(id) : undefined;
	});
	const compendiumWork = $derived.by(() => {
		const id = content.workIdFor('compendium');
		return id ? getWork(id) : undefined;
	});
	const prayerWork = $derived.by(() => {
		const id = content.workIdFor('prayer');
		return id ? getWork(id) : undefined;
	});

	// --- Bible: books & chapters -----------------------------------------------
	//
	// `BookChapterPicker` already IS the Bible's table of contents (the
	// `/bible` landing route renders the identical component the identical
	// way) — every book/chapter link goes straight to the reading page, so
	// there is nothing left for this section to add beyond the picker and a
	// quiet edition note.

	// --- Catechism & Compendium: one shared table of contents ------------------
	//
	// The CCC and its Compendium are not presented as two parallel trees.
	// The real corpus (checked against every `structure.json`, both `en` and
	// `pt`) shows they share a top level: both split into exactly FOUR Parts
	// of the same name, and both Parts split into exactly the same TWO
	// Sections, in the same order — because the Compendium's own structure
	// literally condenses the CCC's, part-by-part and section-by-section.
	// That is not a coincidence to work around; it is the corpus telling us
	// this is one table of contents wearing two bindings, so each row below
	// offers two entry points (the full Catechism, the Compendium's shorter
	// treatment) into the same doctrinal ground instead of forcing the
	// reader to pick a tree first.
	//
	// PAIRED BY ORDINAL POSITION, NEVER BY TITLE TEXT. The printed titles
	// are close but not identical between the two works — different quote
	// characters, different casing, the Compendium prints extra subtitle
	// text where the CCC's own heading is a bare "SECTION TWO" — and they
	// diverge again in Portuguese. Matching on title strings would be
	// fragile and would break silently the moment either source's wording
	// drifts. Position within the tree is the invariant that actually
	// holds: "the Nth part" and "the Nth section of that part" name the same
	// ground in either work by construction.
	//
	// DEGRADE, DON'T ASSUME THE PARALLEL HOLDS. `pairByPosition` zips
	// whatever length the two arrays actually are — not a hardcoded 4 or 8 —
	// so a future edition, or a partial build missing one of the two works,
	// produces a row with only the side that exists rather than a wrong
	// pairing. The CCC's Prologue (¶1–25) is exactly this case TODAY: it has
	// no Compendium counterpart, so it renders CCC-only rather than being
	// paired with whatever the Compendium's first Part happens to be.
	interface CccCompendiumRow {
		ccc?: CccNode;
		compendium?: CccNode;
	}

	function pairByPosition(cccNodes: CccNode[], compendiumNodes: CccNode[]): CccCompendiumRow[] {
		const length = Math.max(cccNodes.length, compendiumNodes.length);
		return Array.from({ length }, (_, i) => ({ ccc: cccNodes[i], compendium: compendiumNodes[i] }));
	}

	const cccLang = $derived(content.langFor('catechism'));
	const compendiumLang = $derived(content.langFor('compendium'));

	// --- Prayers: a compact pointer, not a sixth table of contents --------------
	//
	// 24 prayers across 5 sections is not a fifth pillar next to the Bible,
	// Catechism, Compendium and Magisterium — each of those runs to hundreds or
	// thousands of pages, this to two dozen. So this section is deliberately
	// small: a tagline, the 5 section names as chips (the same visual language
	// as the CCC/Compendium row's chips above), and one link into the full
	// listing — not a repeat of `/prayers`' own grouped list of every prayer.
	const prayerLang = $derived(content.langFor('prayer'));
	const prayerGroups = $derived(prayerWork ? listPrayerGroups(prayerLang) : []);

	// Gated on the work actually existing in this corpus — a partial build
	// or the vitest fixtures may have one of the two and not the other; an
	// absent work's tree degrades to `[]`, which flows through
	// `pairByPosition` as "this side is always the shorter one," never a
	// crash.
	const cccRoot = $derived(cccWork ? getCccStructure(cccLang) : []);
	const compendiumRoot = $derived(compendiumWork ? getCompendiumStructure(compendiumLang) : []);

	const cccPrologue = $derived(cccRoot.find((n) => n.kind === 'prologue'));
	const partRows = $derived(
		pairByPosition(
			cccRoot.filter((n) => n.kind === 'part'),
			compendiumRoot.filter((n) => n.kind === 'part')
		)
	);

	/** Section-level pairing within one already-paired Part — the same
	 *  position rule, one level down. */
	function sectionRows(part: CccCompendiumRow): CccCompendiumRow[] {
		return pairByPosition(
			(part.ccc?.children ?? []).filter((n) => n.kind === 'section'),
			(part.compendium?.children ?? []).filter((n) => n.kind === 'section')
		);
	}

	/**
	 * The row's own heading text. Prefers the CCC's title whenever the CCC
	 * side of the pair exists: the CCC is the work being condensed, so its
	 * title is the doctrinally primary one, and `displayTitle` already
	 * normalizes its ALL-CAPS source casing to match the Compendium's
	 * already-mixed-case titles — so both sides land in the same visual
	 * register with no extra normalization needed here. Falls back to the
	 * Compendium's own title only for a row with no CCC side at all (not
	 * something today's corpus produces, but the pairing is positional and
	 * must not assume that never changes).
	 */
	function rowTitleText(row: CccCompendiumRow): string | undefined {
		if (row.ccc) return displayTitle(row.ccc, cccLang).title;
		if (row.compendium) return displayTitle(row.compendium, compendiumLang).title;
		return undefined;
	}

	function rangeLabel(node: CccNode | undefined, prefix: string): string | undefined {
		if (!node) return undefined;
		const [from, to] = node.paragraphs;
		if (!Number.isFinite(from)) return undefined;
		return from === to ? `${prefix}${from}` : `${prefix}${from}–${to}`;
	}

	// --- Magisterium: grouped by pontiff/council --------------------------------
	//
	// Mirrors `routes/documents/+page.svelte`'s grouping (by
	// `pontiff_or_council`, reverse chronological) at summary depth rather
	// than importing it: that route groups to build a full nested list (doc
	// rows inside collapsible groups); this one only ever needs the GROUPS
	// themselves — name, count, most recent date — to link into `/documents`,
	// which is little enough logic that sharing it would mean exporting a
	// bespoke type from a route module. The one number this page adds beyond
	// what documents/+page.svelte computes is `mostRecent`, used only to sort
	// groups and to find the single newest document below.
	interface MagisteriumDocRow {
		slug: string;
		manifest: DocumentManifest;
	}

	const magisteriumDocs = $derived.by(() => {
		const out: MagisteriumDocRow[] = [];
		for (const group of listDocuments()) {
			const lang = content.documentLangFor(group.slug);
			const manifest = group.manifests[lang];
			if (manifest) out.push({ slug: group.slug, manifest });
		}
		return out;
	});

	interface PontiffSummary {
		pontiff: string;
		count: number;
		mostRecent: string;
	}

	// REVERSE chronological, same reasoning as documents/+page.svelte: a
	// library that opens on Leo XIII is ordered for the archivist, not the
	// reader — recent documents are both the most-sought and the
	// most-linked.
	const magisteriumGroups = $derived.by(() => {
		const byPontiff = new Map<string, MagisteriumDocRow[]>();
		for (const row of magisteriumDocs) {
			const list = byPontiff.get(row.manifest.pontiff_or_council);
			if (list) list.push(row);
			else byPontiff.set(row.manifest.pontiff_or_council, [row]);
		}
		const out: PontiffSummary[] = [...byPontiff.entries()].map(([pontiff, rows]) => ({
			pontiff,
			count: rows.length,
			mostRecent: rows.reduce(
				(max, r) => (r.manifest.promulgated > max ? r.manifest.promulgated : max),
				rows[0].manifest.promulgated
			)
		}));
		out.sort((a, b) => b.mostRecent.localeCompare(a.mostRecent));
		return out;
	});

	// The single most recently promulgated document across every group,
	// named directly rather than left buried inside its group's bare count.
	// A reader landing here has no way to tell from a count alone whether a
	// pontificate's group includes something from last month or from 1891 —
	// naming just the newest document gives the section one concrete, timely
	// foothold without turning it into a second `/documents` listing (the
	// groups below stay groups, not an excerpt of the full library).
	const mostRecentDoc = $derived.by(() => {
		if (magisteriumDocs.length === 0) return undefined;
		return [...magisteriumDocs].sort((a, b) =>
			b.manifest.promulgated.localeCompare(a.manifest.promulgated)
		)[0];
	});

	// --- Continue reading --------------------------------------------------------
	//
	// One "continue reading" row per work TYPE (most recently touched
	// edition/document of it), not one per exact edition or exact document: a
	// reader who has opened both the English and Portuguese Bible would
	// otherwise get two separate Bible rows here, which reads as clutter
	// rather than as two genuinely different shortcuts — the ~450 individual
	// documents collapse the same way, to whichever one was read most
	// recently. `positions` is already sorted most-recent-first, so `.find`
	// picks the latest.
	let positions: ReadingPosition[] = $state([]);

	onMount(() => {
		positions = listPositions();
	});

	const CONTINUE_TYPES: WorkType[] = ['bible', 'catechism', 'compendium', 'document'];
	const continueItems = $derived(
		CONTINUE_TYPES.map((type) =>
			positions.find((pos) => getWork(pos.workId)?.type === type)
		).filter((pos): pos is ReadingPosition => pos !== undefined)
	);
</script>

<div class="content-column">
	<!-- The wordmark IS the h1's text — see Wordmark.svelte. `home.title` stays
	     the plain-text form of the same name, used in every page's <title>. -->
	<h1 class="site-title"><Wordmark /></h1>
	<p class="tagline">{t('home.tagline')}</p>

	{#if continueItems.length > 0}
		<section aria-labelledby="continue-heading">
			<h2 id="continue-heading">{t('home.continueReading')}</h2>
			<ul class="positions">
				{#each continueItems as pos (pos.workId)}
					<li><a href={pos.href}>{pos.label}</a></li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if bibleWork}
		<section aria-labelledby="bible-heading">
			<h2 id="bible-heading">{t('nav.bible')}</h2>
			<BookChapterPicker currentWorkId={bibleWork.id} collapsible={false} />
			<p class="edition-note">{bibleWork.title} — <CopyrightNotice manifest={bibleWork} /></p>
		</section>
	{/if}

	{#if partRows.length > 0 || cccPrologue}
		<section aria-labelledby="ccc-heading">
			<h2 id="ccc-heading">{t('home.ccc.heading')}</h2>
			<ol class="ccc-toc">
				{#if cccPrologue}
					{@const dt = displayTitle(cccPrologue, cccLang)}
					{@const anchor = cccPrologue.paragraphs[0]}
					<li class="ccc-row">
						<div class="ccc-row-title">{dt.title}</div>
						<div class="ccc-row-links">
							{#if Number.isFinite(anchor)}
								<a class="ccc-link" href={`/ccc/${anchor}`}>
									{t('nav.ccc')} <span class="ccc-range">{rangeLabel(cccPrologue, '¶')}</span>
								</a>
							{/if}
							<span class="ccc-link ccc-link-empty">{t('home.ccc.noCounterpart')}</span>
						</div>
					</li>
				{/if}
				{#each partRows as part, i (i)}
					{@const title = rowTitleText(part)}
					{@const cccAnchor = part.ccc?.paragraphs[0]}
					{@const compendiumAnchor = part.compendium?.paragraphs[0]}
					<li class="ccc-row ccc-row-part">
						{#if title}<div class="ccc-row-title">{title}</div>{/if}
						<div class="ccc-row-links">
							{#if part.ccc && Number.isFinite(cccAnchor)}
								<a class="ccc-link" href={`/ccc/${cccAnchor}`}>
									{t('nav.ccc')} <span class="ccc-range">{rangeLabel(part.ccc, '¶')}</span>
								</a>
							{:else}
								<span class="ccc-link ccc-link-empty">{t('home.ccc.noCounterpart')}</span>
							{/if}
							{#if part.compendium && Number.isFinite(compendiumAnchor)}
								<a class="ccc-link" href={`/compendium/${compendiumAnchor}`}>
									{t('nav.compendium')}
									<span class="ccc-range">{rangeLabel(part.compendium, 'Q')}</span>
								</a>
							{:else}
								<span class="ccc-link ccc-link-empty">{t('home.ccc.noCounterpart')}</span>
							{/if}
						</div>

						{#if sectionRows(part).length > 0}
							<ol class="ccc-sections">
								{#each sectionRows(part) as section, j (j)}
									{@const stitle = rowTitleText(section)}
									{@const sCccAnchor = section.ccc?.paragraphs[0]}
									{@const sCompendiumAnchor = section.compendium?.paragraphs[0]}
									<li class="ccc-row ccc-row-section">
										{#if stitle}<div class="ccc-row-title">{stitle}</div>{/if}
										<div class="ccc-row-links">
											{#if section.ccc && Number.isFinite(sCccAnchor)}
												<a class="ccc-link" href={`/ccc/${sCccAnchor}`}>
													{t('nav.ccc')}
													<span class="ccc-range">{rangeLabel(section.ccc, '¶')}</span>
												</a>
											{:else}
												<span class="ccc-link ccc-link-empty">{t('home.ccc.noCounterpart')}</span>
											{/if}
											{#if section.compendium && Number.isFinite(sCompendiumAnchor)}
												<a class="ccc-link" href={`/compendium/${sCompendiumAnchor}`}>
													{t('nav.compendium')}
													<span class="ccc-range">{rangeLabel(section.compendium, 'Q')}</span>
												</a>
											{:else}
												<span class="ccc-link ccc-link-empty">{t('home.ccc.noCounterpart')}</span>
											{/if}
										</div>
									</li>
								{/each}
							</ol>
						{/if}
					</li>
				{/each}
			</ol>

			{#if cccWork}
				<p class="edition-note">{cccWork.title} — <CopyrightNotice manifest={cccWork} /></p>
			{/if}
			{#if compendiumWork}
				<p class="edition-note">
					{compendiumWork.title} — <CopyrightNotice manifest={compendiumWork} />
				</p>
			{/if}
		</section>
	{/if}

	{#if magisteriumGroups.length > 0}
		<section aria-labelledby="magisterium-heading">
			<h2 id="magisterium-heading">{t('nav.magisterium')}</h2>

			{#if mostRecentDoc}
				<p class="magisterium-recent">
					<span class="magisterium-recent-label">{t('home.magisterium.mostRecent')}</span>
					<a href={`/documents/${mostRecentDoc.slug}`}>{mostRecentDoc.manifest.title}</a>
					<span class="magisterium-recent-meta">
						{mostRecentDoc.manifest.pontiff_or_council}
						<span aria-hidden="true">·</span>
						<time datetime={mostRecentDoc.manifest.promulgated}>
							{formatPromulgated(
								mostRecentDoc.manifest.promulgated,
								mostRecentDoc.manifest.language
							)}
						</time>
					</span>
				</p>
			{/if}

			<ul class="magisterium-groups">
				{#each magisteriumGroups as group (group.pontiff)}
					<li>
						<a href="/documents" class="magisterium-group-link">
							<span class="magisterium-pontiff">{group.pontiff}</span>
							<span class="magisterium-count">{group.count}</span>
						</a>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	{#if prayerGroups.length > 0}
		<section aria-labelledby="prayers-heading">
			<h2 id="prayers-heading">{t('home.prayers.heading')}</h2>
			<p class="prayers-tagline">{t('home.prayers.tagline')}</p>
			<ul class="prayers-groups">
				{#each prayerGroups as group (group.id)}
					<li>
						<a class="prayers-chip" href={`/prayers#${group.id}`}>{group.title}</a>
					</li>
				{/each}
			</ul>
			<a class="prayers-browse-all" href="/prayers">{t('home.prayers.browseAll')} &rarr;</a>
			{#if prayerWork}
				<p class="edition-note">{prayerWork.title} — <CopyrightNotice manifest={prayerWork} /></p>
			{/if}
		</section>
	{/if}
</div>

<style>
	/*
	 * The h1 is a container for the wordmark, so it carries none of its own
	 * type: size and leading live in Wordmark.svelte, where the two lines are
	 * proportioned against each other. Only the block spacing belongs here —
	 * the mark's own line-height is under 1, so the default h1 margin would
	 * leave the tagline sitting too close under "Catholica".
	 */
	.site-title {
		margin-block: 0 0.8rem;
		font-size: inherit;
		line-height: inherit;
	}

	/*
	 * Sized up alongside the mark. This is the one line that says what the site
	 * holds, to a reader who has just met a name in blackletter and has no idea
	 * yet — at the old 1.05rem it read as a caption under a logo rather than as
	 * the answer to "what is this".
	 */
	.tagline {
		color: var(--color-text-muted);
		font-size: 1.35rem;
		line-height: 1.4;
		margin-block: 0 2rem;
		text-wrap: balance;
	}

	section {
		margin: 2.25rem 0;
	}

	section h2 {
		font-family: var(--font-serif);
		font-size: 1.3rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
		margin: 0 0 1rem;
	}

	.positions {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.positions li {
		padding: 0.35rem 0;
	}

	/* Quiet edition/copyright line under a section — the reader can still
	   tell which edition they're looking at, but it no longer heads the
	   page the way a per-row metadata line used to (see this route's
	   module docblock). `CopyrightNotice` still reproduces the rights
	   holder's exact required wording; only its PLACEMENT changed. */
	.edition-note {
		margin: 0.75rem 0 0;
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	/* --- Catechism & Compendium ------------------------------------------- */

	.ccc-toc {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.ccc-row {
		padding: 0.75rem 0;
		border-bottom: 1px solid var(--color-border);
	}

	.ccc-row-part > .ccc-row-title {
		font-size: 1.1rem;
		font-weight: 700;
	}

	.ccc-row-title {
		font-family: var(--font-serif);
		color: var(--color-text);
		margin-bottom: 0.4rem;
	}

	.ccc-row-links {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	/* Chip-styled links, same visual language as the Magisterium kind/count
	   badges below and `documents/+page.svelte`'s `.doc-kind` — a small
	   bordered tag reads as "pick one of these" more clearly than a bare
	   inline link would when there are two of them side by side. */
	.ccc-link {
		display: inline-flex;
		align-items: baseline;
		gap: 0.3rem;
		font-size: 0.85rem;
		text-decoration: none;
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
		padding: 0.2rem 0.55rem;
	}

	a.ccc-link:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	/* A row whose pairing has no counterpart on this side — the CCC's
	   Prologue today, and degradation ground for anything similar in a
	   future edition (see module docblock). Dashed border + muted text
	   matches the site's existing "marked, not hidden" convention for an
	   intentionally-absent link (`documents/+page.svelte`'s
	   `.doc-unpublished`, `ccc/+page.svelte`'s `.unlinked`). */
	.ccc-link-empty {
		border-style: dashed;
		color: var(--color-text-muted);
	}

	.ccc-range {
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
	}

	.ccc-sections {
		list-style: none;
		margin: 0.6rem 0 0;
		padding-inline-start: 1rem;
		border-inline-start: 1px solid var(--color-border);
	}

	.ccc-row-section {
		padding: 0.5rem 0;
	}

	.ccc-row-section:last-child {
		border-bottom: none;
	}

	.ccc-row-section > .ccc-row-title {
		font-size: 0.95rem;
		font-weight: 600;
	}

	/* --- Magisterium -------------------------------------------------------- */

	.magisterium-recent {
		margin: 0 0 1.25rem;
		padding-bottom: 1.1rem;
		border-bottom: 1px solid var(--color-border);
	}

	.magisterium-recent-label {
		display: block;
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		margin-bottom: 0.2rem;
	}

	.magisterium-recent a {
		font-family: var(--font-serif);
		font-size: 1.1rem;
	}

	.magisterium-recent-meta {
		display: block;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 0.15rem;
	}

	.magisterium-groups {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.magisterium-groups li {
		border-bottom: 1px solid var(--color-border);
	}

	.magisterium-group-link {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 1rem;
		padding: 0.65rem 0;
		text-decoration: none;
	}

	.magisterium-pontiff {
		font-family: var(--font-serif);
		font-size: 1.05rem;
		color: var(--color-text);
	}

	.magisterium-count {
		flex-shrink: 0;
		font-size: 0.75rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		padding: 0 0.35rem;
	}

	/* --- Prayers --------------------------------------------------------- */

	.prayers-tagline {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		margin: 0 0 0.9rem;
	}

	.prayers-groups {
		list-style: none;
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin: 0 0 0.9rem;
		padding: 0;
	}

	/* Same chip language as `.ccc-link` above -- a bordered tag reads as "one
	   of several entry points" more clearly than a bare inline link list
	   would for 5 section names sitting side by side. */
	.prayers-chip {
		display: inline-flex;
		font-size: 0.85rem;
		text-decoration: none;
		color: var(--color-text);
		border: 1px solid var(--color-border);
		border-radius: 0.3rem;
		padding: 0.3rem 0.65rem;
	}

	a.prayers-chip:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.prayers-browse-all {
		display: inline-block;
		font-size: 0.9rem;
		text-decoration: none;
	}

	/* Mobile: chip links wrap onto their own line under a long title rather
	   than squeezing, and the two chips stack full-width so the tap target
	   stays a comfortable size instead of shrinking to fit two per row. */
	@media (max-width: 30rem) {
		.ccc-link {
			flex: 1 1 auto;
			justify-content: space-between;
		}
	}
</style>
