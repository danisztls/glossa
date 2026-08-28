<script lang="ts">
	/**
	 * Home page. Rewritten 2026-08-16 to lead with the TEXT's structure —
	 * books & chapters, parts & sections, pontificates & councils — rather
	 * than with editions and copyright, which is what it showed before (one
	 * row per work, titled by its short title/language/copyright label). A
	 * reader arriving here should see what there is to read and be able to
	 * click straight into it; which edition they're reading is now a quiet
	 * footnote under each section, not the subject. (2026-08-23: the
	 * footnote is the edition title only — the copyright notice itself
	 * lives on the reading pages and `/colophon`, not here.)
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
	import { hrefFor } from '$lib/address';
	import {
		getCccStructure,
		getCompendiumStructure,
		getWork,
		listDocuments,
		listPrayerGroups
	} from '$lib/corpus';
	import BookChapterPicker from '$lib/components/BookChapterPicker.svelte';
	import BookText from '@lucide/svelte/icons/book-text';
	import MessageCircleQuestionMark from '@lucide/svelte/icons/message-circle-question-mark';
	import StructureIndex from '$lib/components/StructureIndex.svelte';
	import Wordmark from '$lib/components/Wordmark.svelte';
	import { catechismRowLinks } from '$lib/components/catechismRows';
	import { pairDivisionsCached } from '$lib/toc-pairing';
	import { displayTitle } from '$lib/titles';
	import { formatPromulgated } from '$lib/dates';
	import { listPositions, type ReadingPosition } from '$lib/reading-position';
	import { t } from '$lib/i18n.svelte';
	import type { DocumentManifest, StructureNode, WorkType } from '$lib/types';

	const bibleWork = $derived.by(() => {
		const id = content.workIdFor('bible');
		return id ? getWork(id) : undefined;
	});
	// The Catechism and its Compendium resolve through ONE language, not two —
	// the rule `/catechismus` applies and for the same reason: a reader whose
	// language carries one of the two gets that one, never an English column
	// beside their own. See `content.catechismPairLang`.
	const cccLang = $derived(content.catechismPairLang());
	const cccWork = $derived(getWork(`ccc.${cccLang}`));
	const compendiumWork = $derived(getWork(`compendium.${cccLang}`));
	const prayerWork = $derived.by(() => {
		const id = content.workIdFor('prayer');
		return id ? getWork(id) : undefined;
	});

	// --- Bible: books & chapters -----------------------------------------------
	//
	// `BookChapterPicker` already IS the Bible's table of contents (the
	// `/scriptura` landing route renders the identical component the identical
	// way) — every book/chapter link goes straight to the reading page, so
	// there is nothing left for this section to add beyond the picker and a
	// quiet edition note.

	// --- Catechism & Compendium: one shared table of contents ------------------
	//
	// The CCC and its Compendium are not two parallel trees. They are one
	// outline published at two lengths — both split into the same four Parts
	// and the same eight Sections, in the same order, because the Compendium's
	// structure literally condenses the CCC's — so each row below offers two
	// entry points into the same ground instead of making the reader pick a
	// tree first.
	//
	// THE SAME COMPONENT AND THE SAME RESOLVER `/catechismus` USES, at
	// `maxDepth={2}`: parts and their sections here, everything down to the 67
	// articles there. This section used to pair the two works itself, by
	// ordinal position, in ~90 lines of markup written three times over — and
	// that pairing predated `toc-pairing.ts`, which does the same thing across
	// every division kind, refuses to pair when the counts disagree rather
	// than zipping whatever it is given, and is checked over all 80 edition
	// pairs on every sync.
	//
	// Its one visible gain: the Prologue is no longer a row with an empty
	// slot. Nothing STRUCTURALLY pairs it — the Compendium has no Prologue —
	// but the condensation vote knows its ¶1-25 are what question 1 condenses,
	// and `catechismRows.ts` falls back to that.

	// --- Prayers: a compact pointer, not a sixth table of contents --------------
	//
	// 28 prayers across 7 sections is not a fifth pillar next to the Bible,
	// Catechism, Compendium and Magisterium — each of those runs to hundreds or
	// thousands of pages, this to two dozen. So this section is deliberately
	// small: a tagline, the 5 section names as chips (the same visual language
	// as the CCC/Compendium row's chips above), and one link into the full
	// listing — not a repeat of `/preces`' own grouped list of every prayer.
	const prayerLang = $derived(content.langFor('prayer'));
	const prayerGroups = $derived(prayerWork ? listPrayerGroups(prayerLang) : []);

	// Gated on the work actually existing in this corpus — a partial build or
	// the vitest fixtures may have one of the two and not the other. An absent
	// work's tree degrades to `[]`, which `pairDivisionsCached` reads as "no
	// divisions to pair with" and every row then falls through to the
	// condensation vote, never a crash.
	const cccRoot = $derived(
		cccWork ? getCccStructure(cccLang) : compendiumWork ? getCompendiumStructure(cccLang) : []
	);
	const compendiumRoot = $derived(compendiumWork ? getCompendiumStructure(cccLang) : []);
	const pairs = $derived(
		cccWork && compendiumWork ? pairDivisionsCached(cccRoot, compendiumRoot) : new Map()
	);

	// The same one-language rule `/catechismus` applies, and for the same
	// reason: a language carrying one of the two works gets that work's column
	// and not the other's — never a link into an edition the reader did not
	// ask for. See `content.catechismPairLang`.
	const cccColumns = $derived([
		...(cccWork ? (['ccc'] as const) : []),
		...(compendiumWork ? (['compendium'] as const) : [])
	]);

	const cccLinks = $derived((node: StructureNode) =>
		catechismRowLinks(node, {
			tree: cccWork ? 'ccc' : 'compendium',
			lang: cccLang,
			columns: cccColumns,
			pairs,
			labels: {
				cccTitle: t('ccc.landing.title'),
				compendiumTitle: t('compendium.landing.title')
			}
		})
	);

	// --- Magisterium: grouped by pontiff/council --------------------------------
	//
	// Mirrors `routes/documenta/+page.svelte`'s grouping (by
	// `pontiff_or_council`, reverse chronological) at summary depth rather
	// than importing it: that route groups to build a full nested list (doc
	// rows inside collapsible groups); this one only ever needs the GROUPS
	// themselves — name, count, most recent date — to link into `/documenta`,
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
	// foothold without turning it into a second `/documenta` listing (the
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
			<p class="edition-note">{bibleWork.title}</p>
		</section>
	{/if}

	{#if cccRoot.length > 0}
		<section aria-labelledby="ccc-heading">
			<h2 id="ccc-heading">{t('home.ccc.heading')}</h2>
			<!-- Parts and their sections. `/catechismus` renders the identical
			     index with no depth limit and the sub-heading disclosures on. -->
			<StructureIndex
				tree={cccRoot}
				lang={cccLang}
				links={cccLinks}
				maxDepth={2}
				subsections={false}
				workColumns={cccColumns.map((column) =>
					column === 'ccc'
						? { label: t('nav.ccc'), icon: BookText }
						: { label: t('nav.compendium'), icon: MessageCircleQuestionMark }
				)}
				noCounterpartLabel={t('ccc.noCounterpart')}
			/>
		</section>
	{/if}

	{#if prayerGroups.length > 0}
		<section aria-labelledby="prayers-heading">
			<h2 id="prayers-heading">{t('home.prayers.heading')}</h2>
			<ul class="prayers-groups">
				{#each prayerGroups as group (group.id)}
					<li>
						<a class="prayers-chip" href={`/preces#${group.id}`}>{group.title}</a>
					</li>
				{/each}
			</ul>
			<a class="prayers-browse-all" href="/preces">{t('home.prayers.browseAll')} &rarr;</a>
			{#if prayerWork}
				<p class="edition-note">{prayerWork.title}</p>
			{/if}
		</section>
	{/if}

	{#if magisteriumGroups.length > 0}
		<section aria-labelledby="magisterium-heading">
			<h2 id="magisterium-heading">{t('nav.magisterium')}</h2>

			{#if mostRecentDoc}
				<p class="magisterium-recent">
					<span class="magisterium-recent-label">{t('home.magisterium.mostRecent')}</span>
					<a href={hrefFor({ kind: 'document', slug: mostRecentDoc.slug })}>
						{mostRecentDoc.manifest.title}
					</a>
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
						<a href="/documenta" class="magisterium-group-link">
							<span class="magisterium-pontiff">{group.pontiff}</span>
							<span class="magisterium-count">{group.count}</span>
						</a>
					</li>
				{/each}
			</ul>
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

	/* Quiet edition line under a section — the reader can still tell which
	   edition they're looking at, but it no longer heads the page the way a
	   per-row metadata line used to (see this route's module docblock). */
	.edition-note {
		margin: 0.75rem 0 0;
		font-size: 0.78rem;
		color: var(--color-text-muted);
	}

	/* --- Catechism & Compendium ------------------------------------------- */

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
</style>
