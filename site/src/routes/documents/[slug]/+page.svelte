<script lang="ts">
	/**
	 * One document, whole, on one page.
	 *
	 * THIS ROUTE ABSORBED TWO OTHERS on 2026-08-17 (docs/decisions.md §The site): the
	 * former `documents/[slug]/read` (continuous full text) and
	 * `documents/[slug]/[n]` (one prerendered page per numbered section). The
	 * per-section route alone was 9,315 of the deployment's 15,256 files — 61%
	 * of it — at ~21 KB each to carry a few hundred bytes of text apiece; the
	 * remainder was this same chrome, repeated. Section addresses survive as
	 * fragments (`/documents/{slug}#s{n}`) against the `id="s{n}"` anchors the
	 * continuous view already carried for exactly that purpose.
	 *
	 * What that costs, recorded so nobody rediscovers it as a bug: a section no
	 * longer has its own `<title>` or its own Open Graph tags, so a link to one
	 * unfurls as the whole document. That was weighed and accepted — the value
	 * here is the reading tool, and every one of these texts is a reproduction
	 * of a vatican.va page that outranks us for its own words anyway.
	 *
	 * Unlike a CCC chapter, a document's structure tree has real headings worth
	 * keeping in the flow (Parts, Chapters, Articles) rather than one flat run
	 * of numbered sections — `headingsByStart` threads
	 * `flattenDocumentStructure`'s rows back in immediately before the section
	 * each one starts at, so a long encyclical still reads with its own
	 * divisions intact instead of as an undifferentiated wall of prose.
	 */
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import CopyrightNotice from '$lib/components/CopyrightNotice.svelte';
	import ProseBlocks from '$lib/components/ProseBlocks.svelte';
	import StructureSidebarToc from '$lib/components/StructureSidebarToc.svelte';
	import ReferenceNumber from '$lib/components/ReferenceNumber.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import CitedBy from '$lib/components/CitedBy.svelte';
	import { documentCitedSource, type CitedByRow, type CitedBySource } from '$lib/cited-by';
	import CompareField from '$lib/components/CompareField.svelte';
	import CompareCopyrightField from '$lib/components/CompareCopyrightField.svelte';
	import CompareGrid from '$lib/components/CompareGrid.svelte';
	import ReadingBar from '$lib/components/ReadingBar.svelte';
	import { alignByNumber } from '$lib/compare';
	import { compare } from '$lib/compare-pref.svelte';
	import {
		adoptCompareFromUrl,
		chooseComparisonEdition,
		toggleCompare
	} from '$lib/compare-nav.svelte';
	import { useScrollSpy } from '$lib/scroll-spy.svelte';
	import { setPosition } from '$lib/reading-position';
	import { displayDocumentTitle, inlineTitleNodes } from '$lib/titles';
	import InlineText from '$lib/components/InlineText.svelte';
	import { documentKindLabel } from '$lib/document-labels';
	import { formatPromulgated } from '$lib/dates';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import {
		compareColumnLabel,
		flattenDocumentStructure,
		documentOutline,
		documentTailNumber,
		getDocumentCitations,
		getDocumentSectionsAsync,
		getDocumentAppendixAsync
	} from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import type {
		Citer,
		DocumentAppendixUnit,
		DocumentSection,
		DocumentNode,
		DocumentManifest
	} from '$lib/types';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	/**
	 * LANGUAGE SWITCHING ON A PAGE THAT ONLY EMBEDS ONE LANGUAGE.
	 *
	 * `+page.ts` embeds exactly one language's sections rather than every
	 * language's, because this route's payload is a whole document — see that
	 * module's docblock for why, and for why `embeddedLang` is fixed at build
	 * time. The consequence lands here: the CCC/Compendium single-unit routes
	 * can switch language by pure re-render, and this one cannot, because the
	 * other language's text simply isn't in the page.
	 *
	 * So a mismatch is resolved by fetching, through the same memoized
	 * `getDocumentSectionsAsync` the loader itself used.
	 *
	 * WHILE THE FETCH IS IN FLIGHT THE EMBEDDED TEXT STAYS ON SCREEN. Blanking
	 * the page or showing a spinner would trade a complete, readable document
	 * for an empty one in service of a preference the reader can already see
	 * is being applied — the text swaps when it arrives. Same "degrade, don't
	 * 404 a page with real content" posture the rest of the site takes.
	 *
	 * `preferred` may name a language this document has no edition of at all
	 * (a v1 EN/PT asymmetry), in which case there is nothing to fetch and the
	 * embedded language stays — deliberately, rather than rendering an empty
	 * document for a language that doesn't exist.
	 */
	const preferred = $derived(content.documentLangFor(data.slug));
	const targetLang = $derived(
		data.manifestsByLang[preferred] ? preferred : (data.embeddedLang ?? preferred)
	);

	/** Sections fetched for a language other than the embedded one. Keyed by
	 *  slug as well as language so a client-side navigation to a DIFFERENT
	 *  document can never render the previous document's text under the new
	 *  document's headings while its own fetch is still in flight. */
	let fetched = $state<
		| {
				slug: string;
				lang: string;
				sections: DocumentSection[];
				appendix: DocumentAppendixUnit[];
		  }
		| undefined
	>(undefined);

	$effect(() => {
		const slug = data.slug;
		const want = targetLang;
		// The embedded copy already IS the wanted language — the common case
		// (no stored override), and the reason `+page.ts` picks `embeddedLang`
		// the way it does.
		if (want === data.embeddedLang) return;
		const manifest = data.manifestsByLang[want];
		if (!manifest) return;
		// `untrack`: this effect must depend on slug/target/manifest, NOT on
		// its own result, or assigning `fetched` below would re-trigger it.
		const have = untrack(() => fetched);
		if (have?.slug === slug && have.lang === want) return;

		let cancelled = false;
		// Both together: an edition that numbers nothing has EMPTY sections and
		// all its text in the appendix, so fetching only the sections would
		// switch such a document's language to a blank page.
		Promise.all([
			getDocumentSectionsAsync(manifest.id),
			getDocumentAppendixAsync(manifest.id)
		]).then(([sections, appendix]) => {
			// Discard a response the reader has already navigated away from, or
			// switched language again during — otherwise a slow first fetch can
			// land after a fast second one and overwrite it.
			if (!cancelled) fetched = { slug, lang: want, sections, appendix };
		});
		return () => {
			cancelled = true;
		};
	});

	/** Whether `fetched` is for what's currently being asked for; a stale
	 *  entry (wrong slug, or a language switched away from again) counts as
	 *  absent rather than as content. */
	const fetchedIsCurrent = $derived(
		fetched !== undefined && fetched.slug === data.slug && fetched.lang === targetLang
	);

	const lang = $derived(fetchedIsCurrent ? targetLang : (data.embeddedLang ?? preferred));
	const work = $derived(data.embeddedLang ? data.manifestsByLang[lang] : undefined);
	const current = $derived(
		work
			? {
					work,
					sections: fetchedIsCurrent ? fetched!.sections : (data.embeddedSections ?? [])
				}
			: undefined
	);

	/**
	 * Metadata to head the page with — the manifest of the edition being read.
	 * There is no second source for it any more: `+page.ts` 404s a document
	 * with no readable edition, so if this page renders at all, some edition's
	 * text is behind it (docs/decisions.md §Posture).
	 */
	const appendixUnits = $derived(
		fetchedIsCurrent ? fetched!.appendix : (data.embeddedAppendix ?? [])
	);

	const normTitle = (s: string | undefined) => (s ?? '').replace(/\s+/g, ' ').trim().toLowerCase();

	/**
	 * The document's tail: headings that anchor no numbered section, paired
	 * with the unnumbered text under each.
	 *
	 * Both halves already exist and neither could reach the reader alone. The
	 * heading is in `structure.json` with `before: null`, which is why both
	 * tables of contents rendered it as unlinked text — there was no `h{i}` in
	 * the body to link to, because `headingsByStart` only emits a heading that
	 * opens a numbered section. The text is in `appendix.json`, which knows
	 * its own title but not which structure row that title came from.
	 * Rejoining them here restores the ordinary anchor (`#h{i}`) rather than
	 * inventing a second scheme, so the TOC rows need no special href.
	 *
	 * Matched on title, first unclaimed row wins, so a document that prints
	 * the same tail heading twice still pairs them in order. A unit whose
	 * title matches nothing (the untitled run that can open an appendix)
	 * still renders, with no heading of its own.
	 */
	const tailRows = $derived.by(() => {
		const rows = structureRows;
		let lastAnchored = -1;
		rows.forEach((row, i) => {
			if (Number.isFinite(row.node.before)) lastAnchored = i;
		});
		const tail = rows
			.map((row, i) => ({ row, i }))
			.filter(({ row, i }) => i > lastAnchored && !Number.isFinite(row.node.before));
		const claimed = new Set<number>();
		const out: { anchor?: string; node?: DocumentNode; unit?: DocumentAppendixUnit }[] = [];
		for (const { row } of tail) {
			const key = normTitle(row.node.title);
			const hit = appendixUnits.findIndex(
				(u, ui) => !claimed.has(ui) && key !== '' && normTitle(u.title) === key
			);
			if (hit >= 0) claimed.add(hit);
			out.push({
				anchor: row.anchor,
				node: row.node,
				unit: hit >= 0 ? appendixUnits[hit] : undefined
			});
		}
		// Anything the tail headings did not claim, in corpus order.
		appendixUnits.forEach((unit, ui) => {
			if (!claimed.has(ui)) out.push({ unit });
		});
		return out;
	});

	/** Structure rows the body renders a heading for, so the two tables of
	 *  contents can link exactly those and leave the rest as plain text. */
	const linkableAnchors = $derived(
		new Set(tailRows.map((r) => r.anchor).filter((a): a is string => Boolean(a)))
	);

	const metaManifest = $derived(current?.work);

	/** The work id of the edition being read, handed to every surface that
	 *  linkifies its text. Two English encyclicals here — Aeterni Patris and
	 *  Diuturnum — number the books of Kings the Douay way, and are read one
	 *  book off without it (`refs-grammar.ts`'s `WORK_CONFIGS`). Named
	 *  `workId` because `work` above is already this edition's manifest. */
	const workId = $derived(current?.work.id);

	// Structure trees are INDEX tier (eager-inlined, synchronous — corpus.ts's
	// "Documents" section), so unlike `current.sections` this needs no
	// `+page.ts` load step: it's read reactively here.
	const structureRows = $derived(current ? flattenDocumentStructure(current.work.id) : []);

	// The shared sidebar walks `children` and reads `paragraphs`, so it gets
	// the derived nested outline rather than the flat corpus rows the inline
	// table of contents renders. See `documentOutline` in corpus.ts.
	const sidebarRows = $derived(
		current ? documentOutline(current.work.id).map((node) => ({ node, depth: 0 })) : []
	);

	// Index structure rows by the section number they open at, so the template
	// can ask "which headings belong right before section N" in O(1) while it
	// walks `current.sections` in corpus order below. A single section number
	// can open more than one heading at once (a Part and its first Chapter
	// commonly share a start), and `flattenDocumentStructure` already yields
	// them in pre-order (ancestor before descendant), so appending to each
	// bucket in iteration order keeps them correctly nested without a sort.
	type StructureRow = { node: DocumentNode; depth: number; anchor: string };

	function indexByStart(rows: StructureRow[]): Map<number, StructureRow[]> {
		const map = new Map<number, StructureRow[]>();
		for (const row of rows) {
			const start = row.node.before;
			// Unnumbered front/back matter (docs/corpus-schema.md's null-bound
			// convention) has no section to anchor itself before — nothing wrong
			// with the node, just nowhere in the numbered flow it belongs.
			if (!Number.isFinite(start)) continue;
			const bucket = map.get(start as number);
			if (bucket) bucket.push(row);
			else map.set(start as number, [row]);
		}
		return map;
	}

	const headingsByStart = $derived(indexByStart(structureRows));

	/*
	 * Which sections open a division big enough to earn an illuminated
	 * initial. A document is one page, so unlike the CCC's chapter view — one
	 * chapter per page, one cap at the top — capping only `sections[0]` gives
	 * a nine-chapter constitution a single initial on page one and nothing at
	 * any chapter after it.
	 *
	 * The tier is `headingTag`'s: the kinds it sets as h2 or h3 (part,
	 * section, chapter, and the prologue that falls through to h3) open a
	 * division; article and sub do not. Deriving it from the same function
	 * keeps the two from drifting — a cap marks exactly what the document
	 * prints as a major heading. Measured against the corpus, that is one cap
	 * for 301 of 339 documents (they have no chapter-level structure at all),
	 * up to 18 for Gaudium et Spes, which really does have two parts, nine
	 * chapters and seven sections.
	 */
	const DIVISION_TAGS = new Set(['h2', 'h3']);
	const divisionStarts = $derived.by(() => {
		const out = new Set<number>();
		for (const [start, rows] of headingsByStart) {
			if (rows.some((row) => DIVISION_TAGS.has(headingTag(row.node.level)))) out.add(start);
		}
		return out;
	});

	/**
	 * COMPARE MODE'S SECOND COLUMN — UNLIKE EVERY OTHER ROUTE THIS FEATURE
	 * TOUCHES, IT COSTS A REAL FETCH HERE, because this route embeds only ONE
	 * language (see `+page.ts`). Reuses the same `getDocumentSectionsAsync`
	 * call and the same "embedded text stays on screen while the fetch is in
	 * flight" posture as the language-switch effect above, but as a SEPARATE
	 * effect/state pair: compare mode wants both languages SIMULTANEOUSLY, not
	 * one replacing the other. Fetching a language the switch effect already
	 * fetched costs nothing — `corpus.ts`'s `readContent` memoizes by path.
	 */
	const otherEditions = $derived(
		Object.keys(data.manifestsByLang)
			.filter((l) => l !== lang)
			.map((l) => ({ lang: l, work: data.manifestsByLang[l] }))
	);
	const fallbackWorkId = $derived(otherEditions[0]?.work.id);

	adoptCompareFromUrl();

	const secondaryWorkId = $derived(
		compare.resolveTarget(
			otherEditions.map((e) => e.work.id),
			fallbackWorkId
		)
	);
	/** Defined exactly when the reader's resolved preference names a language
	 *  this document actually has — which is also exactly when compare mode
	 *  should be on, so this doubles as `compareActive` below. */
	const secondaryLang = $derived(otherEditions.find((e) => e.work.id === secondaryWorkId)?.lang);
	const compareActive = $derived(secondaryLang !== undefined);

	let compareFetched = $state<
		{ slug: string; lang: string; sections: DocumentSection[] } | undefined
	>(undefined);

	$effect(() => {
		const slug = data.slug;
		const want = secondaryLang;
		if (!want) return;
		const manifest = data.manifestsByLang[want];
		if (!manifest) return;
		// `untrack`: depend on slug/want/manifest, not on this effect's own
		// result — same discipline the language-switch effect above uses.
		const have = untrack(() => compareFetched);
		if (have?.slug === slug && have.lang === want) return;

		let cancelled = false;
		getDocumentSectionsAsync(manifest.id).then((sections) => {
			if (!cancelled) compareFetched = { slug, lang: want, sections };
		});
		return () => {
			cancelled = true;
		};
	});

	/** `compareFetched` for the CURRENT slug/language, or `undefined` while
	 *  loading — stale-entry discipline mirrors `fetchedIsCurrent`. */
	const compareSecondarySections = $derived(
		compareFetched && compareFetched.slug === data.slug && compareFetched.lang === secondaryLang
			? compareFetched.sections
			: undefined
	);

	const compareRows = $derived(
		current && compareSecondarySections
			? alignByNumber(current.sections, compareSecondarySections)
			: []
	);

	/**
	 * THE SECOND COLUMN'S OWN DIVISIONS. Compare mode used to render sections
	 * only, dropping every Part/Chapter/Article heading on the grounds that a
	 * heading is not a number `alignByNumber` can align. That was true of the
	 * heading and false of the document: a nine-chapter constitution became one
	 * undifferentiated run of prose, which is the state the single-column
	 * reader's `headingsByStart` exists to prevent.
	 *
	 * A heading does carry a number — `before`, the section it opens at — and
	 * that is a perfectly good key. So each language's structure tree is
	 * indexed on it independently and a band is emitted wherever EITHER has
	 * one, which is the same union-and-leave-a-gap rule `alignByNumber` applies
	 * to the sections themselves. That matters because the two trees genuinely
	 * do diverge in where they fall (docs/decisions.md): a band with one side
	 * empty says so honestly, where forcing the pair to agree would have to
	 * invent a heading or hide one.
	 *
	 * Structure is INDEX tier, so the second language's tree is read
	 * synchronously here — unlike its SECTIONS, which cost the fetch above.
	 */
	const secondaryStructureRows = $derived(
		secondaryWorkId && compareActive ? flattenDocumentStructure(secondaryWorkId) : []
	);
	const secondaryHeadingsByStart = $derived(indexByStart(secondaryStructureRows));

	/** Where the masthead band rides — see `compareHeadingsLeft`. `undefined`
	 *  for a document with no sections, which is also a document with no grid
	 *  to put a band in. */
	const firstSectionN = $derived(current?.sections[0]?.n);
	const hasMasthead = $derived(
		Boolean(
			current?.work.header ||
			(secondaryLang ? data.manifestsByLang[secondaryLang]?.header : undefined)
		)
	);

	// Part/Section headings read as the document's own top-level divisions;
	// Chapter/Article/Sub nest progressively smaller. `h1` is the document
	// title above, so this starts at `h2` rather than mirroring `kind` depth
	// 1-for-1 (a document's tree can run four levels deep, and HTML only has
	// five heading levels below `h1` to spend on it).
	function headingTag(level: number): string {
		// The document's own <h1> is its title, so a level-1 heading is an h2
		// and so on, clamped at h6. `level` is contiguous per document
		// (docs/corpus-schema.md, amended 2026-08-21), so this no longer has
		// to map a taxonomy onto a depth — the depth is what was recorded.
		return `h${Math.min(level + 1, 6)}`;
	}

	/**
	 * Who cites this document, from the reverse citation index
	 * (`scripts/build-xrefs.mjs`, docs/link-surface.md #12). The forward
	 * direction has rendered for a while — a footnote reading "LG 12" becomes a
	 * link to this page's §12 — and this is the half a reader standing here
	 * could not otherwise get at.
	 *
	 * ONE ROW PER SECTION rather than a note under each section's text. A
	 * document is one page (see this file's header), so a per-section note
	 * would interrupt the reading of a text that is meant to be read straight
	 * through, and the reader who wants the concordance wants it as a
	 * concordance — Lumen Gentium has 66 cited addresses and 479 citers, which
	 * is a table, not an aside.
	 *
	 * The `null` key holds the citations that name this document without
	 * naming a section it has, and it leads the panel, labelled with the
	 * document's own name — the row says "Lumen Gentium: cited by …" and means
	 * exactly that. Its label needs no translation for the same reason the
	 * title needs none: it is the work's own Latin incipit.
	 */
	const citations = $derived(getDocumentCitations(data.slug));

	function citedSources(citers: Citer[]): CitedBySource[] {
		const paragraphs = citers.filter((c) => c.kind === 'ccc').map((c) => c.n);
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
		const bySlug = new Map<string, number[]>();
		for (const citer of citers) {
			if (citer.kind !== 'document' || !citer.slug) continue;
			const list = bySlug.get(citer.slug);
			if (list) list.push(citer.n);
			else bySlug.set(citer.slug, [citer.n]);
		}
		const documents = [...bySlug]
			.map(([slug, sections]) => documentCitedSource(slug, sections))
			.filter((source): source is CitedBySource => source !== null)
			.sort((a, b) => a.label.localeCompare(b.label));
		return [...ccc, ...documents];
	}

	const citedInRows: CitedByRow[] = $derived(
		[...citations.keys()]
			.sort((a, b) => (a === null ? -1 : b === null ? 1 : a - b))
			.map((n) => ({
				key: n ?? 'work',
				label:
					n === null ? (metaManifest?.short_title ?? metaManifest?.title ?? data.slug) : `§${n}`,
				...(n === null ? {} : { href: `#s${n}` }),
				sources: citedSources(citations.get(n) ?? [])
			}))
			.filter((row) => row.sources.length > 0)
	);

	/**
	 * Which section the reader has scrolled to. The whole document is one page,
	 * so there is no `n` in the URL to tell the sidebar where they are —
	 * without this the table of contents can only show top-level divisions and
	 * never marks or expands the one being read (see `structureToc.ts`'s
	 * `rowState`, whose `onPath` flag keys entirely off a current position).
	 *
	 * Fed the same `id="s{n}"` anchors the sections carry for `#s{n}` deep
	 * links, in corpus order — so the spy needs no separate registry and cannot
	 * disagree with what is actually on the page. Browser-only by construction
	 * (`useScrollSpy` runs inside `$effect`), so this changes nothing about the
	 * initial render.
	 */
	const spy = useScrollSpy(() => {
		const sections = (current?.sections ?? []).map(
			(section) => [`s${section.n}`, section.n] as const
		);
		// The tail's headings carry `#h{i}` ids and sit past the last section,
		// so they extend the same ordered list rather than needing a second
		// mechanism. Without them the sidebar stops marking anything the moment
		// the reader scrolls into an appendix — and on an edition that numbers
		// nothing, it never marks anything at all, because there is no `s{n}`
		// on the page to find.
		const lastN = sections.length ? sections[sections.length - 1][1] : null;
		const tail = tailRows
			.map((row, k) => [row.anchor, documentTailNumber(lastN, k)] as const)
			.filter((t): t is readonly [string, number] => typeof t[0] === 'string');
		return [...sections, ...tail];
	});

	// Reactive rather than `onMount`: re-records the position whenever the
	// reader toggles the document's language mid-read too.
	$effect(() => {
		if (current) setPosition(current.work.id, current.work.short_title, page.url.pathname);
	});
</script>

<svelte:head>
	<title>{metaManifest?.short_title ?? metaManifest?.title ?? data.slug} — {t('home.title')}</title>
</svelte:head>

{#snippet leftCell(section: DocumentSection)}
	<ProseBlocks unit={section} {lang} work={workId} />
{/snippet}

<!-- The document's masthead line: kind, author, date. Written once and
     rendered three times — the plain heading and the compare header's two
     columns, which carry different manifests and, in the date, different
     languages: the plain line formats in the READER's language, a compare cell
     in the edition's own, because there the two sit side by side and a date in
     the reader's language over a Portuguese column would be describing one
     edition in another's terms.

     Compared as a whole and always split in practice: the kind badge is an
     interface-language label and so matches, but the pontiff's name and the
     promulgation date are both translated. Splitting the line further to
     collapse the badge alone would turn one line into two and cost more height
     than the duplicate badge does. -->
{#snippet subtitle(manifest: DocumentManifest, dateLang: string)}
	<p class="subtitle">
		<span class="doc-kind">{documentKindLabel(manifest.document_kind)}</span>
		<span class="sep">·</span>
		{manifest.pontiff_or_council}
		<span class="sep">·</span>
		<!-- Bare date, no "Promulgated" label — matching the /documents list.
		     In a subtitle already reading "Encyclical · Francis · <date>",
		     the only date a document has needs no naming. -->
		<time class="promulgated" datetime={manifest.promulgated}>
			{formatPromulgated(manifest.promulgated, dateLang)}
		</time>
	</p>
{/snippet}

{#snippet rightCell(section: DocumentSection)}
	<ProseBlocks unit={section} lang={secondaryLang ?? lang} work={secondaryWorkId ?? workId} />
{/snippet}

<!--
	The document's own divisions, threaded into the reading flow immediately
	before the section each one starts at. One snippet for all three callers —
	the single-column reader and compare mode's two columns — so a heading is
	typeset the same wherever it appears.

	`withIds` is false for the SECOND column only, and the reason is that
	`documentHeadingAnchor` numbers headings by their index into one flat
	structure array (corpus.ts): the Portuguese tree's fourth heading is `h3`
	just as the English tree's is, so emitting both would put a duplicate id on
	the page. The primary edition keeps them, which is what the inline table of
	contents and the sidebar — both built from the primary work's rows — link
	into.
-->
{#snippet structureHeadings(rows: StructureRow[], hlang: string, withIds: boolean)}
	{#each rows as { node, depth, anchor } (anchor)}
		{@const dt = displayDocumentTitle(node.title, hlang)}
		<svelte:element
			this={headingTag(node.level)}
			id={withIds ? anchor : undefined}
			class="structure-heading"
			style={`--depth: ${depth}`}
		>
			<!-- Identifier, name and subtitle are three printed lines of ONE
			     heading (docs/corpus-schema.md). The corpus keeps them apart
			     precisely so they can be typeset apart here; folding them into one
			     string is what a reader's table of contents used to show as three
			     separate rows. -->
			{#if node.label}<span class="heading-label">{node.label}</span>{/if}
			{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
			<!-- `title_html` keeps the emphasis the source set inside the heading —
			     an encyclical name, a scripture reference, a Latin phrase. Absent
			     on the great majority, where this renders the plain title
			     unchanged. -->
			<span class="heading-name"
				><InlineText nodes={inlineTitleNodes(node.title, node.title_html, hlang)} /></span
			>
			{#if node.subtitle}<span class="heading-subtitle"
					>{displayDocumentTitle(node.subtitle, hlang).title}</span
				>{/if}
		</svelte:element>
	{/each}
{/snippet}

<!--
	THE MASTHEAD RIDES IN THE GRID, NOT IN THE HEADER BLOCK.

	It used to be the last field of `.compare-unit-header`, stacked under the
	title, subtitle, copyright and picker, and between them they put roughly
	440px of chrome between the top of the page and the document's first word.
	But the masthead is not chrome: it is TEXT FROM THE SOURCE, scraped
	verbatim (`narrow_html` in pipeline/scrapers/vatican_docs.py) and
	translated — "ENCYCLICAL LETTER" against "CARTA ENCÍCLICA" is precisely the
	kind of divergence compare mode exists to show. Everything above it is our
	metadata ABOUT the document.

	So it moves across the boundary those two categories should be separated
	by: it now opens the first band of the aligned grid, under the same
	divider, in the same two columns, as the text it introduces. The header
	block shrinks to title, one metadata line and the copyright notices, and
	the page reaches its first word far sooner.

	It rides the first section's band rather than getting a row of its own,
	because that band already means "everything that precedes this section" —
	which the document's own title page does, ahead of any Part or Chapter
	heading that also opens there.
-->
{#snippet compareHeadingsLeft(n: number)}
	{#if current?.work.header && n === firstSectionN}
		<div class="document-masthead">{@html current.work.header}</div>
	{/if}
	{@render structureHeadings(headingsByStart.get(n) ?? [], lang, true)}
{/snippet}

{#snippet compareHeadingsRight(n: number)}
	{@const secondaryHeader = secondaryLang ? data.manifestsByLang[secondaryLang]?.header : undefined}
	{#if secondaryHeader && n === firstSectionN}
		<div class="document-masthead">{@html secondaryHeader}</div>
	{/if}
	{@render structureHeadings(secondaryHeadingsByStart.get(n) ?? [], secondaryLang ?? lang, false)}
{/snippet}

{#if metaManifest}
	{@const secondaryManifest = secondaryLang ? data.manifestsByLang[secondaryLang] : undefined}
	<div class="reading-layout" class:compare={compareActive}>
		<article class="content-column">
			<div class="breadcrumb-row">
				<nav class="breadcrumb" aria-label="Breadcrumb" data-link-preview="off">
					<a href="/documenta">{t('nav.magisterium')}</a>
				</nav>
			</div>

			<!-- Edition, comparison, bookmark and print, in that order and in both
			     modes — see `ReadingBar`. Everything it carries used to be spread
			     across this breadcrumb row, the title row below and the site
			     header. -->
			<ReadingBar
				bookmarkHref={hrefFor({ kind: 'document', slug: data.slug })}
				canCompare={current !== undefined && otherEditions.length > 0}
				{compareActive}
				onToggleCompare={toggleCompare}
				comparison={{
					editions: otherEditions.map((e) => e.work),
					current: secondaryWorkId,
					onselect: chooseComparisonEdition
				}}
			/>

			{#if current && compareActive && secondaryManifest}
				<!-- Compare mode's header is per-language: the subtitle and the
				     copyright notice both differ by edition, so a single
				     primary-language-only block was always showing the second column
				     a header that wasn't its own. Tracks match `.compare-row` so it
				     lines up with the aligned rows beneath it.

				     WHAT IS NO LONGER HERE: the two edition pickers, which moved to
				     the sticky bar, and the source masthead, which moved into the
				     grid (see `compareHeadingsLeft` above for why it belongs on the
				     content side of that boundary). Between them they were most of
				     this block's height.

				     ONE ROW PER FIELD, not one column per language — see
				     `.compare-unit-header` in app.css. The TITLE is why: an
				     encyclical is addressed by its Latin incipit, which is the same
				     string in every language, so this used to set `Magnifica
				     Humanitas` as an `<h1>` twice, side by side, above a subtitle
				     that genuinely did differ. Nothing here decides that centrally;
				     the field simply asks whether the two strings match. -->
				<div class="compare-unit-header">
					<!-- An encyclical is addressed by its Latin incipit, which is the same
					     string in every language, so this used to set `Magnifica Humanitas`
					     as an `<h1>` twice, side by side, above a subtitle that genuinely
					     did differ. -->
					<CompareField
						shared={current.work.title === secondaryManifest.title}
						leftLang={current.work.language}
						rightLang={secondaryManifest.language}
					>
						{#snippet left()}<h1>{current.work.title}</h1>{/snippet}
						{#snippet right()}<h1>{secondaryManifest.title}</h1>{/snippet}
					</CompareField>

					<CompareField leftLang={current.work.language} rightLang={secondaryManifest.language}>
						{#snippet left()}{@render subtitle(current.work, current.work.language)}{/snippet}
						{#snippet right()}{@render subtitle(
								secondaryManifest,
								secondaryManifest.language
							)}{/snippet}
					</CompareField>

					<CompareCopyrightField left={current.work} right={secondaryManifest} />
				</div>
			{:else}
				<h1>{metaManifest.title}</h1>

				{@render subtitle(metaManifest, lang)}

				<p class="copyright-notice"><CopyrightNotice manifest={metaManifest} /></p>

				<!-- The source page's own masthead, verbatim per language.
				     `{@html}` is safe here specifically: this string is produced by
				     the scraper's closed tag allowlist (i/b/br/sup/blockquote), not
				     passed through from the source -- see `narrow_html` in
				     pipeline/scrapers/vatican_docs.py. -->
				{#if current?.work.header}
					<div class="document-masthead" lang={current.work.language}>
						{@html current.work.header}
					</div>
				{/if}
			{/if}

			{#if current}
				<!-- NARROW-SCREEN TABLE OF CONTENTS. Below 80rem `.reading-layout`
				     stops being a grid (app.css) and `.reading-aside` falls to the
				     bottom of the document — which on a 287-section encyclical is
				     past everything, i.e. nowhere. Before these routes merged, a
				     phone reader got the TOC first because the landing page WAS a
				     table of contents and the text lived one tap further on. This
				     restores that: the aside is hidden below 80rem and this takes
				     over, as plain markup rather than a second
				     `StructureSidebarToc`. The reason used to be that that
				     component owned fixed element ids and could not be rendered
				     twice in one document; it takes `$props.id()` now, and the
				     other reading routes do render it twice (`TocMenu`). What
				     keeps this list its own markup is the LIST, not the ids:
				     this one is a flat walk of every heading the document has,
				     and the sidebar's is a tree with only the reader's own
				     branch expanded. On a phone, where there is no second
				     column to keep short, the whole list is the useful one. -->
				<!-- IT IS A DISCLOSURE, AND CLOSED IS THE RIGHT DEFAULT HERE. Open,
				     Magnifica Humanitas' 60-odd headings are several phone screens of
				     list standing between the masthead and the document's first word —
				     a reader who arrived to READ has to scroll past the whole apparatus
				     to reach the text, every time. Closed, the row still says a table
				     of contents exists, says how long it is, and is one tap from the
				     full list: the same "text is one tap further on" shape the
				     pre-merge landing page had, with the tap on the other side.
				     `<details>` rather than a `$state` boolean because the browser
				     already owns this widget's keyboard handling, ARIA and
				     find-in-page behaviour (Chrome/Firefox search open a closed one),
				     and none of that is worth reimplementing for a chevron.
				     The `<nav>` stays outside it: a landmark that vanishes when
				     collapsed is a landmark a screen-reader user cannot find. -->
				{#if structureRows.length > 0}
					<nav
						class="toc-inline"
						aria-label={t('document.tableOfContents')}
						data-link-preview="off"
					>
						<details class="toc-disclosure">
							<!-- The count lives INSIDE the heading because `<summary>`'s
							     content model allows phrasing content OR one heading, not a
							     heading plus a sibling span. It is a bare numeral rather than
							     "60 sections" so it needs no translation, and it is the one
							     thing the collapsed row can say that the label cannot: how
							     much is behind it. -->
							<summary>
								<h2 class="toc-inline-heading">
									{t('document.tableOfContents')}
									<span class="toc-count">{structureRows.length}</span>
								</h2>
							</summary>
							<ol>
								{#each structureRows as { node, depth, anchor } (anchor)}
									{@const dt = displayDocumentTitle(node.title, lang)}
									{@const titleNodes = inlineTitleNodes(node.title, node.title_html, lang)}
									<li style={`--depth: ${depth}`} class={`level-${node.level}`}>
										<!-- `before` decides whether this heading is RENDERED at all
									     (`headingsByStart` drops the unanchored ones), but the link
									     goes to the heading's own id, not to `#s{before}` — the
									     section behind it. Same rule as the sidebar; the two tables
									     of contents on this page must not address differently. -->
										{#if Number.isFinite(node.before) || linkableAnchors.has(anchor)}
											<a href={`#${anchor}`}>
												{#if node.label}<span class="ordinal">{node.label}</span>{/if}
												{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
												<InlineText nodes={titleNodes} />
											</a>
										{:else}
											<!-- Same null-bound convention as the CCC/Compendium
										     structure trees: unnumbered front/back matter the
										     structure knows about but no section number
										     addresses — nothing to link to. -->
											<span class="unlinked" title="No section number in this corpus">
												{#if dt.ordinal}<span class="ordinal">{dt.ordinal}</span>{/if}
												<InlineText nodes={titleNodes} />
											</span>
										{/if}
									</li>
								{/each}
							</ol>
						</details>
					</nav>
				{/if}

				{#if compareActive && secondaryManifest && compareSecondarySections}
					<!-- `interlude` carries the structure headings across into compare
					     mode. They used to be dropped here, on the grounds that a
					     Part/Chapter title is not a numbered unit `alignByNumber` can
					     align — true of the heading, false of the document: a
					     nine-chapter constitution read as one undifferentiated run of
					     prose, exactly what `headingsByStart` exists to prevent in the
					     single-column view below. A heading does carry `before`, the
					     section it opens at, and that aligns fine; the two languages'
					     trees genuinely diverging (docs/decisions.md) is handled the
					     same way a diverging section is, by emitting the band wherever
					     EITHER side has one and leaving the other column empty. -->
					<!-- `anchorId` restores the `s{n}` addresses the single-column
					     branch below carries: a `#s42` deep link, and the scroll spy
					     driving the sidebar at >= 100rem, both had nothing to find
					     while comparing. Same `§{n}` label and same canonical address
					     as the margin number down there, from one place. -->
					<CompareGrid
						rows={compareRows}
						leftLang={current.work.language}
						rightLang={secondaryManifest.language}
						leftLabel={compareColumnLabel(current.work)}
						rightLabel={compareColumnLabel(secondaryManifest)}
						left={leftCell}
						right={rightCell}
						unit={(n) => ({
							href: `#s${n}`,
							canonicalHref: hrefFor({ kind: 'document', slug: data.slug, n }),
							label: `§${n}`,
							anchorId: `s${n}`
						})}
						interlude={{
							has: (n) =>
								(hasMasthead && n === firstSectionN) ||
								headingsByStart.has(n) ||
								secondaryHeadingsByStart.has(n),
							left: compareHeadingsLeft,
							right: compareHeadingsRight
						}}
					/>
				{:else}
					{#if compareActive}
						<p class="compare-note">{t('compare.loading')}</p>
					{/if}
					<div class="reading-text document-body" lang={current.work.language}>
						{#each current.sections as section, i (section.n)}
							{@render structureHeadings(headingsByStart.get(section.n) ?? [], lang, true)}
							{@const sectionHref = hrefFor({ kind: 'document', slug: data.slug, n: section.n })}
							<section
								class="section"
								id={`s${section.n}`}
								class:unit-bookmarked={bookmarks.has(sectionHref)}
							>
								<!-- The number links to its own anchor: this is what a reader
								     copies to cite the section, and it is now the section's
								     only address — the per-section route it used to point at
								     is gone (see this file's header). It used to be a
								     hand-rolled `<a class="section-n">` carrying a near-verbatim
								     copy of ReferenceNumber's margin CSS; sharing the component
								     is what stops the two drifting, which is the reason that
								     component's docblock gives for owning this treatment. -->
								<ReferenceNumber
									n={section.n}
									href={`#s${section.n}`}
									canonicalHref={sectionHref}
									label={`§${section.n}`}
									placement="margin"
								/>
								<div class="section-text">
									<ProseBlocks
										unit={section}
										{lang}
										work={workId}
										dropCap={i === 0 || divisionStarts.has(section.n)}
									/>
								</div>
							</section>
						{/each}
						<!-- Matter the source prints with no number on it. Two very
						     different things arrive here and both render the same way,
						     which is the point: the appendix a numbered document adds
						     after its last paragraph (Lumen Gentium's Nota Explicativa
						     Praevia), and the WHOLE text of an edition that numbers
						     nothing anywhere — eight of them in this corpus. Neither
						     gets a §n in the margin, because neither has one to give;
						     each unit is addressed by position instead, which is an
						     address for scrolling and linking, not for citing. -->
						{#each tailRows as row, i (row.anchor ?? `u${i}`)}
							{#if row.node && row.anchor}
								{@render structureHeadings(
									[{ node: row.node, depth: row.node.level - 1, anchor: row.anchor }],
									lang,
									true
								)}
							{/if}
							{#if row.unit}
								<section class="section appendix-unit">
									<div class="section-text">
										<ProseBlocks
											unit={row.unit}
											{lang}
											work={workId}
											dropCap={i === 0 && current.sections.length === 0}
										/>
									</div>
								</section>
							{/if}
						{/each}
					</div>
					{#if citedInRows.length > 0}
						<CitedBy heading={t('refs.citedIn')} rows={citedInRows} />
					{/if}
				{/if}
			{/if}
		</article>

		{#if current}
			<!-- Omitted entirely in compare mode — see app.css's
			     `.reading-layout.compare` docblock — and below 80rem, where
			     `.toc-inline` above does this job instead. -->
			<aside class="reading-aside">
				<StructureSidebarToc
					structure={sidebarRows}
					currentN={spy.current}
					{lang}
					heading={t('document.tableOfContents')}
					linkMode="anchor"
					{linkableAnchors}
				/>
			</aside>
		{/if}
	</div>
{/if}

<style>
	h1 {
		font-family: var(--font-serif);
		margin: 0 0 0.5rem;
	}

	.subtitle {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		margin: 0 0 0.5rem;
	}

	/* The source's own masthead. Set quieter than the reading text and
	   centred the way the printed page sets it, so it reads as the
	   document's title page rather than as its first paragraph. */
	.document-masthead {
		color: var(--color-text-muted);
		font-size: 0.95rem;
		line-height: 1.5;
		text-align: center;
		text-wrap: balance;
		margin: 1.25rem 0 1.5rem;
	}

	/* `:global` ON THE ANCESTOR because the cell is `CompareField`'s element,
	   not this route's, and Svelte scopes an ancestor selector with a HARD
	   class rather than `:where` — `.compare-unit-field.svelte-A .subtitle`
	   simply stops matching when the div carrying that class is compiled under
	   hash B. The subtitle itself is still this component's, so it still gets
	   scoped and this rule still cannot reach another route's. */
	:global(.compare-unit-field) .subtitle {
		margin: 0 0 0.5rem;
	}

	.subtitle .sep {
		margin: 0 0.4em;
	}

	.promulgated {
		font-variant-numeric: tabular-nums;
		letter-spacing: 0.04em;
		text-transform: uppercase;
		font-size: max(var(--font-size-min), 0.85em);
	}

	.doc-kind {
		font-size: 0.75rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-accent);
		border: 1px solid var(--color-accent);
		border-radius: 0.25rem;
		padding: 0.1rem 0.4rem;
	}

	.copyright-notice {
		margin: 0 0 2rem;
	}

	/* See the markup comment: this replaces the sidebar below the grid
	   breakpoint, where the aside would otherwise land past the whole text. */
	.toc-inline {
		margin: 0 0 2rem;
	}

	/* The whole closed state is this one row, so it carries the rule that used
	   to sit under the heading — and it is the only rule left in the list.
	   `list-style: none` is what removes the default disclosure triangle in
	   Chrome/Firefox (a `summary` is a list item); the `::-webkit-` line is the
	   same removal for older Safari, which ignores it. The chevron below
	   replaces both, because the native marker sizes with the font and cannot
	   be given the transition that makes open/closed legible at a glance. */
	.toc-disclosure > summary {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		cursor: pointer;
		list-style: none;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	.toc-disclosure > summary::-webkit-details-marker {
		display: none;
	}

	/* A 44px-tall tap target on a phone without a 44px-tall row on a laptop:
	   the padding grows only where the pointer is coarse. */
	@media (pointer: coarse) {
		.toc-disclosure > summary {
			padding-block: 0.5rem;
		}
	}

	/* The list's own label — "Table of Contents", ours — so it takes the
	   interface face like the sidebar's heading and the index pages', even
	   though the rows below it stay in the text face. */
	.toc-inline-heading {
		font-family: var(--font-sans);
		font-size: 1.05rem;
		margin: 0;
		flex: 1;
		min-width: 0;
	}

	.toc-count {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		font-weight: 400;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
	}

	/* Points down when closed, up when open — the standard direction, i.e. "the
	   list will come down from here". Drawn from two borders on a rotated
	   square rather than a glyph so it inherits `currentColor` and needs no
	   icon import for one 8px mark. */
	.toc-disclosure > summary::after {
		content: '';
		flex: none;
		width: 0.45rem;
		height: 0.45rem;
		border-inline-end: 1.5px solid var(--color-text-muted);
		border-bottom: 1.5px solid var(--color-text-muted);
		transform: translateY(-0.15em) rotate(45deg);
		transition: transform 0.15s ease;
	}

	.toc-disclosure[open] > summary::after {
		transform: translateY(0.1em) rotate(-135deg);
	}

	@media (prefers-reduced-motion: reduce) {
		.toc-disclosure > summary::after {
			transition: none;
		}
	}

	.toc-inline ol {
		list-style: none;
		margin: 0.25rem 0 0;
		padding: 0;
	}

	/*
	 * STREAMLINED, WHICH HERE MEANS FEWER LINES RATHER THAN SHORTER ONES. The
	 * rows used to carry a hairline each, so a 60-heading contents was 60
	 * horizontal rules — more ink than the titles they separated, and the
	 * indent they were supposed to make legible was the thing they cut across.
	 * Indentation alone carries the hierarchy now, at a smaller step (0.9rem,
	 * from 1.25rem) so a level-4 heading still has most of a phone's width to
	 * set its title in. Titles wrap rather than truncate: a TOC row clipped
	 * mid-word is a row you cannot use.
	 */
	.toc-inline li {
		padding: 0.3rem 0 0.3rem calc(var(--depth) * 0.9rem);
		font-size: 0.95rem;
		line-height: 1.35;
		text-wrap: pretty;
	}

	.toc-inline a {
		text-decoration: none;
		font-family: var(--font-serif);
	}

	.toc-inline .unlinked {
		font-family: var(--font-serif);
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	/* `.level-1`, NOT `.kind-chapter`: this list's rows carry `level-{n}` from
	   `flattenDocumentStructure` (depth is `level - 1`, so level 1 is the top),
	   and never a `kind-` class at all — that vocabulary belongs to
	   `StructureSidebarToc`/`StructureIndex`, whose nodes are a different
	   shape. The old selector matched nothing, so the top-level headings this
	   was meant to weight have been reading flat the whole time. Svelte does
	   not flag it because the class is set from an expression it cannot
	   evaluate. */
	.toc-inline .level-1 > a,
	.toc-inline .level-1 > .unlinked {
		font-weight: 700;
	}

	/* The gap that the deleted hairlines used to imply: a new top-level
	   division starts a little away from the previous one's last child. Only
	   between rows, so the first entry doesn't hang off the summary. */
	.toc-inline li + .level-1 {
		margin-top: 0.5rem;
	}

	/* Sans even here, where the row's title stays in the text face: the
	   ordinal is the same label the heading itself prints in the sans,
	   and the sidebar sets its own markers (`.kind-label`) the same way. */
	.toc-inline .ordinal {
		font-family: var(--font-sans);
		color: var(--color-text-muted);
		margin-inline-end: 0.35em;
	}

	/*
	 * The inline table of contents stands in for the sidebar wherever the
	 * sidebar isn't, and compare mode moves that boundary. Normally the aside
	 * arrives at 80rem and this yields to it; while comparing, the aside is
	 * suppressed until 100rem (app.css, `.reading-layout.compare >
	 * .reading-aside`), and hiding this at 80rem regardless left a 20rem band
	 * where a 287-section encyclical had NO navigation at all — no sidebar, no
	 * inline list. So the handover width follows whichever one is actually
	 * coming back.
	 */
	@media (min-width: 80rem) {
		.reading-layout:not(.compare) .toc-inline {
			display: none;
		}
	}

	@media (min-width: 100rem) {
		.toc-inline {
			display: none;
		}
	}

	/* Document body headings, threaded into the reading flow between sections
	   (see `headingsByStart`) — sized by level, never by literal `--depth`
	   indent: unlike the TOC's list rows, prose headings read better centred in
	   the measure than staircased across it. */
	.structure-heading {
		font-family: var(--font-serif);
		font-weight: 700;
		margin: 2.25rem 0 1rem;
		color: var(--color-text);
	}

	/* The label, not the title: the interface face, like every other
	   marker that says where the reader is rather than what they are reading. */
	.structure-heading .ordinal {
		font-family: var(--font-sans);
		color: var(--color-text-muted);
		margin-inline-end: 0.4em;
	}

	/* The label sits ABOVE the name, smaller and quieter, the way the
	   source prints it — it names the division's place in a sequence, not its
	   subject, and reading it inline with the title makes one long shout. The
	   subtitle sits below on its own line for the mirror reason. */
	.structure-heading .heading-label {
		display: block;
		font-family: var(--font-sans);
		font-size: 0.75em;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin-bottom: 0.35rem;
	}

	.structure-heading .heading-subtitle {
		display: block;
		font-size: 0.85em;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-top: 0.3rem;
	}

	:global(h2.structure-heading) {
		font-size: 1.4rem;
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.5rem;
	}

	:global(h3.structure-heading) {
		font-size: 1.15rem;
	}

	:global(h4.structure-heading),
	:global(h5.structure-heading) {
		font-size: 1rem;
		color: var(--color-text-muted);
	}

	/* Section numbers hang in the left margin where there's room for them,
	   exactly the CCC chapter reader's paragraph-reference treatment. */
	.section {
		position: relative;
		margin-bottom: 1.1rem;
	}
</style>
