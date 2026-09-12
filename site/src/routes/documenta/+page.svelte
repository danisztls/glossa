<script lang="ts">
	/**
	 * The Magisterium library — every document in the corpus (docs/corpus-
	 * schema.md §Documents).
	 *
	 * ## It was a table of contents until 2026-08-31, and 272 documents is
	 * past where that helps
	 *
	 * The page grouped by `pontiff_or_council` into twelve collapsible
	 * sections with a sidebar of anchors into them, which was the right shape
	 * for the sixteen Vatican II texts it was written for and survived the
	 * encyclicals landing behind them. What it could not do is the question a
	 * reader actually arrives with, which is never "what did Leo XIII write"
	 * alone: it is some conjunction of who wrote it, what kind of document it
	 * is, and what it is about. An anchor list answers the first and has no
	 * way to express the other two.
	 *
	 * So the aside is now a facet panel and the list is flat and
	 * reverse-chronological. Three consequences worth knowing:
	 *
	 *  - THE PONTIFICATE HEADINGS ARE GONE, and with them the twelve `#`
	 *    anchors `pontiffAnchor` minted. Nothing linked to them from outside
	 *    this page — they were fragments into an index, not addresses — but
	 *    `address.ts` still exports the helper for the document reader's own
	 *    masthead, so it is not dead.
	 *  - WITHIN A FACET THE VALUES ARE OR-ED, ACROSS FACETS AND-ED. Choosing
	 *    two authors widens; choosing an author and a kind narrows. That is
	 *    what a faceted list means everywhere else, and doing it the other way
	 *    would make a second click on the same facet always empty the page.
	 *  - THE FILTERS ARE NOT IN THE URL, deliberately. Nothing in this app
	 *    reads or writes the client-side URL — the address grammar is
	 *    pathname-only, and `worker.ts` decides a page's STATUS from the
	 *    pathname alone — so a shareable `?auctor=` would be the first query
	 *    string in the system and would want modelling in the sitemap, the
	 *    route manifest and the usage beacon before it earned its keep. A
	 *    filter here is a way of looking at one page, not a place.
	 *
	 * ## The search box, and why the subject vocabulary could then be cut
	 *
	 * The panel leads with a box that reads a document's whole metadata —
	 * title, author, kind, description, tags — AND-ed with the facets. It is
	 * what made it safe to cut the subject vocabulary from an open 232 terms
	 * to a curated 53 (`site/document-tags.json`): the terms that went were
	 * every region name and every occasion word, and every one of them is in
	 * the description this box reads. A facet row is for BROWSING an axis; the
	 * search is for everything else, and the two answer different questions.
	 *
	 * MATCHING AND MARKING ARE ONE FUNCTION, not two. `filterByQuery` and
	 * `highlight` in `$lib/highlight` share a fold and a set of tiers, so a row
	 * is on this list exactly when there is something on it to mark. That is
	 * what stops the list from showing a result with no visible reason for
	 * being there, which is the failure mode a separately-written matcher
	 * produces and which nothing but a reader ever notices. It is why the
	 * marker is asked for `loose` marks: the list can now hold rows that were
	 * read loosely, and a row admitted by a guess has to be able to show it.
	 *
	 * A MISSPELLED QUERY IS ANSWERED, AND ONLY WHEN NOTHING ELSE IS. `rermnvrum`
	 * reaches Rerum Novarum; `labour` goes on returning exactly the documents
	 * that print the word, because it returns some. `$lib/highlight` argues the
	 * rule and carries the measurement.
	 *
	 * THE HAYSTACK IS JOINED WITH NEWLINES rather than spaces, so no token can
	 * run across the seam between two fields and match `xiiiencyclical` — a
	 * constraint the loose tier has to honour too, and does by walking one
	 * field at a time.
	 *
	 * ## What is read reactively and what is fetched
	 *
	 * Like `catechismus/+page.svelte`, the registry (`listDocuments()`) is
	 * index-tier and already inlined, so there is nothing to fetch for the
	 * list itself and no `+page.ts`. The two things that ARE fetched — the
	 * translated descriptions and the subject tags — arrive after first paint
	 * and are both absent-by-default: the page renders its author and kind
	 * facets immediately and grows the subject facet when the tags land.
	 */
	import {
		baseLang,
		contentLangChain,
		languageDisplayName,
		listDocuments,
		loadDocumentTags,
		loadTranslatedDescriptions
	} from '$lib/corpus';
	import { ChipRuler, fitChips } from '$lib/chip-fit';
	import { preferredDescription } from '$lib/document-description';
	import { nearLanguages } from '$lib/document-langs';
	import { filterByQuery, highlight } from '$lib/highlight';
	import DocumentFilters, { type Facet } from '$lib/components/DocumentFilters.svelte';
	import DocumentSearch from '$lib/components/DocumentSearch.svelte';
	import { content } from '$lib/content.svelte';
	import { hrefFor } from '$lib/address';
	import { documentAuthorKey, documentKindKey, documentKindLabel } from '$lib/document-labels';
	import { formatPromulgated } from '$lib/dates';
	import { i18n, t } from '$lib/i18n.svelte';
	import { pontificate } from '$lib/pontificates';
	import { tick, untrack } from 'svelte';
	import type { DocumentManifest } from '$lib/types';

	interface Row {
		slug: string;
		manifest: DocumentManifest;
		/** The bare language of the manifest above — what this row's own title
		 *  and description are written in. */
		lang: string;
		/** Every bare language the document has an edition in, the row's own
		 *  included. One row is one document (see below), so this is the only
		 *  place the other editions are named at all. */
		langs: string[];
		/** As written, for display. */
		tags: string[];
		/** Lower-cased, for matching — the key the facets are built on. */
		tagKeys: string[];
	}

	/** Everything about a document the search box reads, newline-joined. Built
	 *  per row per query-dependent input rather than cached: 272 rows against a
	 *  handful of short fields is nothing, and a cache here would have to be
	 *  invalidated by the description fetch and the language switch both. */
	function haystack(row: Row): string {
		return [
			row.manifest.title,
			row.manifest.pontiff_or_council,
			documentKindLabel(row.manifest.document_kind),
			describe(row) ?? '',
			...row.tags
		].join('\n');
	}

	/**
	 * Descriptions translated into the reader's interface language, `document
	 * slug -> text`. One request, for every document at once, made only when the
	 * language is one something has been translated into — a reader of the
	 * language a description was WRITTEN in never issues it, because that
	 * sentence is already on the manifest.
	 *
	 * `$state` + `$effect` rather than an `await` in the template: the list
	 * must paint immediately with the descriptions the manifests already
	 * carry, and swap in translated ones when they arrive. A reader who
	 * changes language mid-page re-runs the effect and gets the same
	 * treatment, which is why this is not a `load()`.
	 */
	let translated = $state<Record<string, string>>({});
	$effect(() => {
		const lang = i18n.lang;
		let stale = false;
		loadTranslatedDescriptions(lang).then((byWork) => {
			if (!stale) translated = byWork;
		});
		return () => {
			stale = true;
		};
	});

	/**
	 * Subject tags, `document slug -> [tag, …]` (`site/document-tags.json`).
	 *
	 * Language-independent, so unlike the descriptions above this is fetched
	 * once and never re-fetched: a tag describes the document, and every
	 * edition of it is the same document. `{}` until it arrives and `{}`
	 * forever under fixtures, which the facet panel reads as "no subject
	 * facet" rather than as an empty one.
	 */
	let tagsBySlug = $state<Record<string, string[]>>({});
	$effect(() => {
		let stale = false;
		loadDocumentTags().then((bySlug) => {
			if (!stale) tagsBySlug = bySlug;
		});
		return () => {
			stale = true;
		};
	});

	/**
	 * The description to show for a row, in the reader's language where we
	 * have one and the work's own language otherwise. `preferredDescription`
	 * carries the rule and why it is ordered that way; a whole-document link
	 * preview shows the same sentence through the same function.
	 */
	function describe(row: Row): string | null {
		return preferredDescription(row.manifest, i18n.lang, translated, row.slug) ?? null;
	}

	/** The reader's content-language chain, read once for the whole list rather
	 *  than per row: it is the same question about the same table 272 times,
	 *  and it moves only when the interface language does. `document-langs.ts`
	 *  is what a row does with it. */
	const langChain = $derived(contentLangChain(i18n.lang));

	// One row per document SLUG, in the reader's effective language for that
	// document — not one row per language edition. Two editions per document
	// showing up as two rows here would double this list and make it
	// unreadable, the same "one entry per work" principle the home page's
	// Library section applies. The per-document language override
	// (`EditionMenu` on `/documenta/{slug}`) is what lets a reader pick a
	// different edition once they're actually reading one; this list just
	// shows their current default.
	//
	// EVERY document gets a row, including one whose text this build does not
	// have: `/documenta/{slug}` redirects that reader to the source page
	// instead of showing them nothing (docs/decisions.md §Posture), so the
	// row leads somewhere either way and the library needs no second state.
	//
	// REVERSE CHRONOLOGICAL. A library that opens on Leo XIII and needs
	// hundreds of rows of scrolling to reach anything a reader is likely to
	// have heard of is ordered for the archivist, not the reader; recent
	// documents are both the most-sought and the most-linked. The title is the
	// tiebreak so that a day carrying several documents is at least stable.
	const rows = $derived.by(() => {
		const out: Row[] = [];
		for (const group of listDocuments()) {
			const lang = content.documentLangFor(group.slug);
			const manifest = group.manifests[lang] ?? Object.values(group.manifests)[0];
			if (!manifest) continue;
			const tags = tagsBySlug[group.slug] ?? [];
			out.push({
				slug: group.slug,
				manifest,
				lang: baseLang(manifest.language),
				langs: Object.keys(group.manifests),
				tags,
				tagKeys: tags.map((tag) => tag.toLowerCase())
			});
		}
		out.sort(
			(a, b) =>
				b.manifest.promulgated.localeCompare(a.manifest.promulgated) ||
				a.manifest.title.localeCompare(b.manifest.title)
		);
		return out;
	});

	/**
	 * Whether the card's foot is at the width where the languages take a line of
	 * their own — the one number the subjects' budget turns on, since below it
	 * they have the whole line and above it they share it.
	 *
	 * TRACKED RATHER THAN READ ONCE, the reason `sidenoteRoom` tracks its own
	 * query: a resize across the breakpoint changes how many chips a row prints,
	 * and a value read at mount would leave the row cut for a width the reader
	 * has left. It is `false` through the prerender — effects do not run there —
	 * so the written document holds the wide cut, which is the one a crawler and
	 * a reader with no script should get.
	 */
	const NARROW_QUERY = '(max-width: 40rem)';
	let narrow = $state(false);
	$effect(() => {
		const query = window.matchMedia(NARROW_QUERY);
		narrow = query.matches;
		const onChange = (event: MediaQueryListEvent) => (narrow = event.matches);
		query.addEventListener('change', onChange);
		return () => query.removeEventListener('change', onChange);
	});

	/**
	 * The subjects' run, in pixels: the whole row on a phone, where the
	 * languages have a line of their own, and half of it above that, where they
	 * share one. The half IS the criterion — a row of chips that reaches the
	 * languages at the far end has stopped being a line of facts under a title.
	 *
	 * The list's own box, watched rather than read once: the aside arrives at
	 * 80rem and the reading column changes width under it, so a width read at
	 * mount would cut every row for a layout the reader has left.
	 */
	let listEl = $state<HTMLElement | undefined>(undefined);
	let listWidth = $state(0);
	$effect(() => {
		const el = listEl;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) => (listWidth = entry.contentRect.width));
		observer.observe(el);
		return () => observer.disconnect();
	});

	const tagRoom = $derived(narrow ? listWidth : listWidth / 2);

	/**
	 * Every subject's chip width, measured on the probe and kept by label.
	 *
	 * THE VOCABULARY IS CLOSED AND SMALL (`site/document-tags.json`), so this
	 * is a few dozen measurements for 272 rows — the whole reason the ruler is
	 * per LABEL. It runs when the tags land and again when a font does: a width
	 * measured in the fallback face is wrong by whatever the two faces differ
	 * by, and `document.fonts.ready` is the page's own signal for that.
	 */
	let probe = $state<HTMLElement | undefined>(undefined);
	let probeList = $state<HTMLElement | undefined>(undefined);
	let chipWidths = $state<Record<string, number>>({});
	let countWidth = $state(0);
	/** The space after a chip, asked of the list's own `gap` rather than
	 *  written down here: the rule is one line of CSS away from this file and a
	 *  second copy of it would be wrong the first time anybody tuned it. */
	let chipGap = $state(0);
	let facesReady = $state(false);
	$effect(() => {
		document.fonts.ready.then(() => (facesReady = true));
	});
	$effect(() => {
		const el = probe;
		// Read as dependencies: the tags arriving and the faces settling are the
		// two things that change an answer here.
		const vocabulary = rows.flatMap((row) => row.tags);
		facesReady;
		if (!el) return;
		const ruler = new ChipRuler(el);
		const widths: Record<string, number> = {};
		for (const tag of vocabulary) widths[tag] ||= ruler.width(tag);
		untrack(() => {
			chipWidths = widths;
			// `+99` rather than each row's own figure: one measurement for the
			// page, and being a shade wide only ever cuts a chip early.
			countWidth = ruler.width('+99', 'more');
			chipGap = probeList ? parseFloat(getComputedStyle(probeList).columnGap) || 0 : 0;
		});
	});

	/**
	 * How many of a row's subjects are printed, the rest being behind its count.
	 *
	 * IT DOES NOT READ `tagsOpen`, AND IT DID FOR A DAY. A fit that answers
	 * "all of them" while the row is open is a fit that says there is nothing
	 * behind the count — so the control drew itself only while it was shut and
	 * vanished the moment it was used, leaving the row expanded with no way
	 * back. What the reader opened is a property of the ROW's state, not of
	 * what fits on its line: this answers where the cut FALLS, and the template
	 * decides how much of it to obey.
	 *
	 * TWO THINGS PRINT THE LOT, and they are one rule: the row has to be able
	 * to show what it is on this list FOR. A live query marks the words it
	 * matched, and a subject it matched behind a count is a row with no visible
	 * reason for being there — the failure this page's own matcher is arranged
	 * to prevent (`highlight.ts`) — while a CHOSEN subject is the filter the
	 * reader set, and `liveTags` keeps one visible in the panel for the same
	 * reason. A live query forcing a fold open is `fold-state.svelte.ts`'s rule
	 * for a folded index, met again a row at a time.
	 *
	 * A THIRD PRINTS THE LOT AND IS NOT A DECISION: nothing measured yet. That
	 * is every row until the first `ResizeObserver` callback, and every row of
	 * the prerendered document, where there is no browser to ask — so what the
	 * written page holds is the full list, and the cut arrives with hydration.
	 */
	function tagsShown(row: Row): number {
		if (query.trim() !== '') return row.tags.length;
		if (row.tagKeys.some((key) => selectedTags.includes(key))) return row.tags.length;
		if (tagRoom <= 0) return row.tags.length;
		const widths = row.tags.map((tag) => chipWidths[tag] ?? 0);
		if (widths.some((width) => width === 0)) return row.tags.length;
		return fitChips(
			widths.map((width) => width + chipGap),
			tagRoom,
			countWidth + chipGap
		);
	}

	/**
	 * What an open count reads instead of its figure.
	 *
	 * `×` (U+00D7) and not `x`: it is the close mark every panel on the web
	 * uses, it is in the core Latin subset both text faces already ship, and it
	 * is a SYMBOL rather than a letter, so no face renders it as the letter
	 * beside the codes next to it. Read by nobody — it is `aria-hidden` and the
	 * button's words are beside it — since a screen reader announcing "times"
	 * is what a glyph standing in for a verb always costs.
	 *
	 * A COUNT THAT IS OPEN COUNTS NOTHING (by direction): `+13` beside the
	 * thirteen it was standing for is a number claiming there are thirteen
	 * more. What it costs is the chip's width, which changes between the two
	 * states and shifts the chips beside it by a few pixels — the control still
	 * keeps the EDGE its line is anchored to, which is the half of "it must not
	 * move under the press" that a reader's finger is on.
	 */
	const CLOSE_MARK = '×';

	/** Which rows have their remaining subjects open, by slug — `langsOpen`'s
	 *  twin, and separate from it because a reader who wanted one of a row's two
	 *  counts opened did not ask for the other. */
	let tagsOpen = $state<Record<string, boolean>>({});

	/**
	 * Which rows have their remaining languages open, by slug.
	 *
	 * Keyed by SLUG rather than by position, so a row keeps its state through a
	 * filter or a search that moves it — and it is local to this page load
	 * rather than stored: opening a count is a look at one row, not a
	 * preference about documents, which is the same line `fold-state` draws for
	 * a folded index and the filters draw for themselves.
	 */
	let langsOpen = $state<Record<string, boolean>>({});

	let query = $state('');
	let selectedAuthors = $state<string[]>([]);
	let selectedKinds = $state<string[]>([]);
	let selectedLangs = $state<string[]>([]);
	let selectedTags = $state<string[]>([]);

	const selected = $derived({
		authors: selectedAuthors,
		kinds: selectedKinds,
		langs: selectedLangs,
		tags: selectedTags
	});

	function toggle(facet: 'authors' | 'kinds' | 'langs' | 'tags', value: string) {
		const lists = {
			authors: selectedAuthors,
			kinds: selectedKinds,
			langs: selectedLangs,
			tags: selectedTags
		};
		const next = lists[facet].includes(value)
			? lists[facet].filter((v) => v !== value)
			: [...lists[facet], value];
		if (facet === 'authors') selectedAuthors = next;
		else if (facet === 'kinds') selectedKinds = next;
		else if (facet === 'langs') selectedLangs = next;
		else selectedTags = next;
	}

	function clearAll() {
		query = '';
		selectedAuthors = [];
		selectedKinds = [];
		selectedLangs = [];
		selectedTags = [];
	}

	/* The three predicates, kept apart so each facet's counts can be taken
	   against the pool its own semantics need — see `tagFacets` below and
	   `DocumentFilters`'s docblock. An empty selection matches everything, which
	   is what makes the unfiltered page fall out of the same code rather than
	   needing a branch.

	   AUTHOR AND KIND ADD, SUBJECT SUBTRACTS, and the asymmetry is the arity of
	   the field rather than an inconsistency to tidy away. A document has
	   exactly one author and exactly one kind, so AND-ing two of either is an
	   empty list by construction and the only thing a second choice can mean is
	   "and these as well". A document carries three subjects on average, so a
	   second subject has the other reading available — the documents about BOTH
	   — and that is the one a reader narrowing 272 titles is asking for. Note
	   `every` needs no empty-selection branch, unlike the two above it. */
	const byAuthor = (row: Row) =>
		selectedAuthors.length === 0 ||
		selectedAuthors.includes(documentAuthorKey(row.manifest.pontiff_or_council));
	/* FOLDED, like the author above it — `documentKindKey` files the doctrinal
	   office's six varieties under the three that partition. The predicate and
	   the facet have to fold the same way or a selection would match nothing. */
	const byKind = (row: Row) =>
		selectedKinds.length === 0 ||
		selectedKinds.includes(documentKindKey(row.manifest.document_kind));
	/* ADDS, though a document has several languages and so could AND them like
	   a subject. The arity allows it and the meaning refuses it: nobody reads a
	   document twice, so a second language is a second way IN — a reader who
	   picks French and Italian reads French and Italian, and asking for the
	   documents held in BOTH answers a question about the library rather than
	   about them. It is the row chips' own rule as a filter: `langs` holds
	   every language the document is in, not the one this row is written in. */
	const byLang = (row: Row) =>
		selectedLangs.length === 0 || selectedLangs.some((lang) => row.langs.includes(lang));
	const byTag = (row: Row) => selectedTags.every((tag) => row.tagKeys.includes(tag));
	/* The fifth axis, and the only one that is a SET rather than a predicate.

	   `filterByQuery` decides, for the list as a whole, whether the query was
	   read literally or had to be guessed at — a decision no per-row predicate
	   can make, and one that has to be made ONCE. Taken per facet pool instead,
	   the author counts could be answering out of the literal band while the
	   kind counts answered out of the loose one, and the two numbers on screen
	   would be describing different lists.

	   IT IS TAKEN AGAINST THE WHOLE CORPUS, not against the facet selection.
	   Otherwise narrowing to one author would make a word that is spelled
	   correctly elsewhere start behaving like a typo, and the reader would see
	   guesses appear as they clicked a facet that has nothing to do with
	   spelling. An empty query keeps every row, so this needs no branch of its
	   own — and it is AND-ed with the facets like any other, because a reader
	   who has typed a word and chosen an author means both. */
	const searched = $derived(new Set(filterByQuery(rows, haystack, query).map((row) => row.slug)));
	const bySearch = (row: Row) => searched.has(row.slug);

	const visible = $derived(
		rows.filter((row) => byAuthor(row) && byKind(row) && byLang(row) && byTag(row) && bySearch(row))
	);

	/**
	 * How many rows are drawn, and the button that asks for more.
	 *
	 * 432 documents is 432 titles, 432 descriptions and some three thousand
	 * chips in one list — a page a phone lays out for a reader who is going to
	 * read the first twenty of them. A page is 100 rows where the aside fits
	 * beside the list and 50 where it does not, which is the same reasoning the
	 * subjects' own count runs on: what the row and the list can carry is a
	 * question about the width in front of the reader.
	 *
	 * A SEARCH IS NOT PAGED, by direction and for a reason the page already
	 * states elsewhere: a reader who has typed a word has asked a question of
	 * the whole corpus, and an answer cut at fifty is an answer that lies about
	 * how many there were. The facets do not bypass it — those NARROW, and a
	 * narrowed list is still a list somebody is scrolling.
	 *
	 * THE PRERENDERED DOCUMENT IS CUT TOO, which is the one cost worth naming:
	 * a crawler reading `/documenta` meets 100 of the documents rather than all
	 * of them. Every one of them is in `sitemap.xml` and in `works.json`, which
	 * is where discovery has always come from here — this page's job is to be
	 * read.
	 */
	const PAGE_WIDE = 100;
	const PAGE_NARROW = 50;
	const pageSize = $derived(narrow ? PAGE_NARROW : PAGE_WIDE);
	let pages = $state(1);
	const searching = $derived(query.trim() !== '');
	const drawn = $derived(searching ? visible : visible.slice(0, pages * pageSize));
	const held = $derived(visible.length - drawn.length);

	/* Back to the first page whenever the list itself changes. Without it a
	   reader who loaded four pages and then picked an author would meet four
	   pages of a list they had just cut to thirty — and the cap would only ever
	   be reached again by luck. The write is untracked so this effect cannot
	   re-run itself. */
	$effect(() => {
		selectedAuthors;
		selectedKinds;
		selectedLangs;
		selectedTags;
		query;
		untrack(() => (pages = 1));
	});

	/**
	 * Another page, and the focus goes to the first row of it.
	 *
	 * The button is the last thing in the list's flow, so loading pushes it down
	 * and — on the last page — takes it off the document entirely, which leaves
	 * a keyboard reader's focus on nothing and their next Tab at the top of the
	 * page. The first new row is where the button was standing, so moving focus
	 * there is both the repair and the answer to "where was I": `preventScroll`
	 * because the row is already under the reader's eye and a scroll would be
	 * the page jumping for no reason.
	 */
	async function loadMore() {
		const first = drawn.length;
		pages += 1;
		await tick();
		listEl?.querySelectorAll<HTMLAnchorElement>('.doc-link')[first]?.focus({
			preventScroll: true
		});
	}

	/* A FRACTION ONLY ONCE THERE IS SOMETHING TO COMPARE. Unfiltered, both
	   halves are the same number and `298 / 298` is a ratio saying nothing —
	   worse than nothing, since a reader arriving at a page that opens with a
	   fraction reads it as a state they are already in. The denominator earns
	   its place the moment the set is narrowed and not before. */
	const countLabel = $derived(
		visible.length === rows.length ? `${rows.length}` : `${visible.length} / ${rows.length}`
	);

	/**
	 * Build one facet's options.
	 *
	 * ORDER COMES FROM THE WHOLE CORPUS AND COUNTS FROM THE FILTERED SET, on
	 * purpose: a list that re-sorted itself on every click would move the
	 * option under the reader's cursor as they used it. `rank` decides the
	 * order once, `pool` supplies the numbers.
	 */
	function buildFacet(
		pool: Row[],
		keysOf: (row: Row) => string[],
		labelOf: (key: string) => string,
		rank: (a: [string, number], b: [string, number]) => number
	): Facet[] {
		const overall = new Map<string, number>();
		for (const row of rows) {
			for (const key of keysOf(row)) overall.set(key, (overall.get(key) ?? 0) + 1);
		}
		const here = new Map<string, number>();
		for (const row of pool) {
			for (const key of keysOf(row)) here.set(key, (here.get(key) ?? 0) + 1);
		}
		return [...overall.entries()]
			.sort(rank)
			.map(([key]) => ({ value: key, label: labelOf(key), count: here.get(key) ?? 0 }));
	}

	/** Newest document first, matching the list beside it. Computed from the
	 *  whole corpus so the order is fixed. */
	const authorRecency = $derived.by(() => {
		const latest = new Map<string, string>();
		for (const row of rows) {
			const key = documentAuthorKey(row.manifest.pontiff_or_council);
			const seen = latest.get(key);
			if (!seen || row.manifest.promulgated > seen) latest.set(key, row.manifest.promulgated);
		}
		return latest;
	});

	/* The years each author held office, attached after the fact rather than
	   threaded through `buildFacet`: the other two facets have no note, and a
	   parameter only one of three callers passes is a parameter that will be
	   forgotten by the fourth. `pontificates.ts` says why the span is a table
	   and not something derived from these very documents. */
	const authorFacets = $derived(
		buildFacet(
			rows.filter((row) => byKind(row) && byLang(row) && byTag(row) && bySearch(row)),
			// FOLDED, so a body that has been renamed is one option and not two —
			// see `documentAuthorKey`. The row's own masthead still prints the
			// name the document was issued under.
			(row) => [documentAuthorKey(row.manifest.pontiff_or_council)],
			(key) => key,
			([a], [b]) => (authorRecency.get(b) ?? '').localeCompare(authorRecency.get(a) ?? '')
		).map((facet) => ({ ...facet, note: pontificate(facet.value) }))
	);

	const kindFacets = $derived(
		buildFacet(
			rows.filter((row) => byAuthor(row) && byLang(row) && byTag(row) && bySearch(row)),
			(row) => [documentKindKey(row.manifest.document_kind)],
			(key) => documentKindLabel(key),
			([, a], [, b]) => b - a
		)
	);

	/**
	 * The languages, the reader's own chain first and the rest by weight.
	 *
	 * THE SAME ORDER THE ROW CHIPS ARE IN, which is the point: a reader meeting
	 * `PT ES EN LA` at the end of every row finds those four at the head of the
	 * facet, and the panel is then where the codes are learnt — each option is
	 * the language's own name with its tag as the note, the fact about the
	 * VALUE `Facet.note` is for.
	 *
	 * Weight decides the tail rather than the alphabet, because below the chain
	 * the question is which languages this library actually holds much of; ties
	 * go to the tag so the sequence is fixed whatever the corpus does. The
	 * chain's own half cannot move under a reader at all — it is a table, and
	 * their language chose it.
	 */
	const langFacets = $derived(
		buildFacet(
			rows.filter((row) => byAuthor(row) && byKind(row) && byTag(row) && bySearch(row)),
			(row) => row.langs,
			(key) => languageDisplayName(key),
			([ka, a], [kb, b]) => chainRank(ka) - chainRank(kb) || b - a || ka.localeCompare(kb)
		).map((facet) => ({ ...facet, note: facet.value.toUpperCase() }))
	);

	/** Where a language sits in the reader's chain, and past its end for one it
	 *  does not name. */
	function chainRank(lang: string): number {
		const at = langChain.indexOf(lang);
		return at === -1 ? langChain.length : at;
	}

	/** The written form of each tag key, for display. `sync-corpus.mjs`
	 *  refuses two tags differing only in case, so every key has exactly one
	 *  written form and picking the first one seen is picking the only one. */
	const tagLabels = $derived.by(() => {
		const labels = new Map<string, string>();
		for (const row of rows) {
			row.tags.forEach((tag, i) => {
				const key = row.tagKeys[i];
				if (!labels.has(key)) labels.set(key, tag);
			});
		}
		return labels;
	});

	/* The one facet counted against the FULLY filtered set, itself included,
	   because it is the one that AND-s: a term's count here is exactly the
	   number of documents left if you add it, which is what a subtractive facet
	   has to promise, and a term sharing no document with the current selection
	   reads 0. The other two exclude themselves for the mirror-image reason —
	   adding a second author only ever widens, so counting one against the
	   authors already chosen would print 0 beside every one of them.

	   ALPHABETICAL, where the other two rank by recency and by count, because
	   the panel draws this one as a cloud and the size already says the weight.
	   What ordering has to buy instead is the thing size cannot: a term the
	   reader already has in mind, found by scanning. It is also the most stable
	   order there is, which matters here more than anywhere — the chips resize
	   on every click, so their widths move; ranking them by a number that also
	   moves would send them past one another as well. The keys are lower-cased,
	   so a plain compare is already the case-insensitive one. */
	const tagFacets = $derived(
		buildFacet(
			visible,
			(row) => row.tagKeys,
			(key) => tagLabels.get(key) ?? key,
			([ka], [kb]) => ka.localeCompare(kb)
		)
	);
</script>

<svelte:head>
	<title>{t('nav.magisterium')} — {t('home.title')}</title>
</svelte:head>

<!--
	THE THIRD PAGE SHAPE, and this is the one page that takes it.

	`.reading-layout.index` in `styles/layout.css`, which carries the argument:
	the reading grid is a measure — 62.4 characters of prose — and a list of
	document titles is not prose, while `.landing-column` on its own has
	nowhere to put the facets. So this is the reading grid with the measure
	replaced by `--index-width` and the apparatus lane dropped, since an index
	has no margin notes and no hanging numbers to set in one.

	THE `index` IS LOAD-BEARING AND WAS MISSING FOR A DAY. Without it the grid
	places `.content-column` and nothing else, so the `.landing-column` below
	was auto-placed into track 1 — the apparatus lane, 21.5rem — and the whole
	Magisterium set in 344px with the 56rem reading track empty beside it.
	Nothing errored; a mis-placed grid child still renders.
-->
<div class="reading-layout index">
	<div class="landing-column">
		<h1>{t('nav.magisterium')}</h1>
		<p class="page-tagline landing-measure">{t('document.library.tagline')}</p>

		<!--
			The controls a reader gets where the aside is not — below the grid
			breakpoint, where `.index-aside` is `display: none` (styles/layout.css).
			`/documenta/{slug}` hands its table of contents over the same way and
			at the same width; see `.filters-inline` below.

			THE SEARCH BOX IS OUTSIDE THE DISCLOSURE AND THE FACETS ARE INSIDE IT,
			which is the whole shape of this. The panel is `<details>` for the
			reasons that file also gives — the browser owns the keyboard handling
			and the ARIA, and find-in-page can open a closed one — and it is closed
			by default, because it holds controls OVER the index and a phone reader
			should meet the documents first. The search box cannot live under that
			rule: it is the instrument a reader who knows a word reaches for
			FIRST, and a control that has to be opened before it can be used is
			one most readers never find. So it sits above the panel, always shown,
			where `/quaestiones` keeps its own box for the same reason.
		-->
		<div class="search-inline">
			<DocumentSearch bind:query />
		</div>

		<details class="filters-inline fold">
			<summary>
				<h2>{t('document.filter.heading')}</h2>
				<span class="chip">{visible.length}</span>
			</summary>
			<DocumentFilters
				authors={authorFacets}
				kinds={kindFacets}
				langs={langFacets}
				tags={tagFacets}
				{selected}
				{query}
				onToggle={toggle}
				onClear={clearAll}
			/>
		</details>

		<!--
			Every string the search reads is drawn through this, so a result can
			always show why it is one. `highlight` returns a single unmarked
			segment when nothing matched and `[]` for empty text, which is why
			there is no branch here for "no query".

			WRITTEN WITHOUT A LINE BREAK INSIDE THE `{#each}`, deliberately:
			Svelte preserves whitespace between template nodes, so formatting
			this across lines inserts a space before and after every mark and
			the marked words drift apart from the words either side of them.
		-->
		<!--
			ONE LANGUAGE, AS A CODE FOR THE EYE AND A NAME FOR EVERYTHING ELSE.
			The tag in capitals is the one form that is the same width in every
			language and does not set a Latin scrap beside an Arabic one; the
			language's own name is the `title`, for a reader who cannot tell SK
			from SL, and is visually hidden inside the chip so a screen reader
			says "Slovenčina" rather than spelling two letters — a code is not an
			accessible name. `EditionMenu` prints the pair side by side, having a
			row each to do it in.
		-->
		{#snippet langChip(lang: string)}
			<span class="doc-lang" title={languageDisplayName(lang)}
				><span aria-hidden="true">{lang.toUpperCase()}</span><span class="visually-hidden"
					>{languageDisplayName(lang)}</span
				></span
			>
		{/snippet}

		{#snippet marked(
			text: string
		)}{#each highlight(text, query, { loose: true }) as segment}{#if segment.hit}<mark
						>{segment.text}</mark
					>{:else}{segment.text}{/if}{/each}{/snippet}

		<!-- One subject. A control, not decoration: seeing what a document is
		     filed under and being unable to ask for the rest of that shelf is the
		     worse half of a tag. It takes the row rather than the tag so the
		     lower-cased key stays beside the written form — `tagKeys` is what the
		     facets match on and the two are parallel arrays. -->
		{#snippet tagChip(row: Row, tag: string, i: number)}
			<li>
				<button
					type="button"
					class="doc-tag"
					class:on={selectedTags.includes(row.tagKeys[i])}
					aria-pressed={selectedTags.includes(row.tagKeys[i])}
					onclick={() => toggle('tags', row.tagKeys[i])}>{@render marked(tag)}</button
				>
			</li>
		{/snippet}

		<!-- Digits, not a sentence: a count needs no translation and no plural
		     rule. The name it is owed is a visually-hidden span rather than an
		     `aria-label`, which is only reliably exposed on interactive elements
		     and on elements with a role — a bare `<p>` is neither, so the label
		     is silently dropped by several screen readers.

		     IT SITS ON THE LINE THAT OPENS THE LIST rather than under the
		     tagline, because it is a fact about the rows and not about the
		     page: floating between the two it belonged to neither, and a
		     number with nothing under it reads as a stray. -->
		<p class="result-count">
			<span class="visually-hidden">{t('document.filter.results')}: </span>{countLabel}
		</p>

		{#if visible.length === 0}
			<p class="no-results">{t('document.filter.noResults')}</p>
		{:else}
			<!-- `"hover"` because a row here is a destination the reader picked in
			     order to GO to it. It needed no marker until 2026-09-07, when
			     `PreviewTarget` stopped refusing an unanchored document: the
			     refusal WAS the marker, and a tap that peeked instead of opening
			     would have been the whole index. -->
			<!--
				THE RULER'S OWN CHIP, and it is in the markup rather than built in
				script because what it has to answer for is the CSS: a probe made
				with `createElement` carries none of this component's scoped
				classes, so it would be measuring a browser default and reporting
				it as a subject. Hidden with `visibility` and taken out of the
				flow, so it is laid out — an element with `display: none` has no
				box to measure — and read by nobody: `aria-hidden`, and it holds
				no text between measurements.
			-->
			<ul class="doc-tags chip-probe" aria-hidden="true" bind:this={probeList}>
				<li><span class="doc-tag" bind:this={probe}></span></li>
			</ul>

			<ul class="docs index-list" data-link-preview="hover" bind:this={listEl}>
				{#each drawn as row (row.slug)}
					{@const description = describe(row)}
					{@const langs = nearLanguages(row.langs, langChain, row.lang)}
					{@const tagFit = tagsShown(row)}
					<li class="index-row">
						<!--
							THE CARD IS FIVE STACKED BLOCKS, each taking the row's whole
							width: title and kind on one line, then date and author, then
							the description, then the subjects and the languages sharing a
							last line at either end of it.

							THE RAIL IS GONE (2026-09-06, by direction). Date, author and
							kind rode the end of the title's line for a day, on the
							argument that the right half of the row was empty because the
							description kept a 60ch measure. That read the emptiness as a
							placement problem when it was a WIDTH one: the answer the page
							wanted was the description filling the column, and with it
							filling there is no empty half for the three facts to be
							moved into. Under the rail they were also read twice — once at
							the end of a title and once as a column down the page — where
							a line of their own is read once.

							THE KIND STAYS AT THE END OF THE TITLE'S LINE, which is not
							the rail: it is `.index-link`'s own title-and-chip shape, the
							one `/preces`, `/doctores/summa` and `/colophon` all take, and
							the hover that answers on both ends of the row is written for
							it (styles/components.css).

							Date and author, no "Promulgated" label: in a list where every
							row carries one, the label is hundreds of repetitions of a word
							that the date's own format already implies. The AUTHOR earns
							its place by the list going flat — with the pontificate
							headings gone it is the one fact a row would otherwise have
							lost.

							No copyright line. Every document in this corpus is under the
							identical Libreria Editrice Vaticana notice, so repeating it per
							row is pure noise — it stays on the reading pages, where it is
							attached to the text it actually governs.

							`describe()` prefers a description in the reader's own language
							over the one on the manifest, which is written in the WORK's
							language: a reader of Italian looking at an English edition wants
							the Italian sentence about it, and the English one is the
							fallback rather than the default.
						-->
						<a href={hrefFor({ kind: 'document', slug: row.slug })} class="doc-link index-link">
							<span class="doc-title index-title">{@render marked(row.manifest.title)}</span>
							<span class="doc-kind chip"
								>{@render marked(documentKindLabel(row.manifest.document_kind))}</span
							>
						</a>
						<p class="doc-meta label-micro">
							<time datetime={row.manifest.promulgated}>
								{formatPromulgated(row.manifest.promulgated, row.manifest.language)}
							</time>
							<span class="doc-author">{@render marked(row.manifest.pontiff_or_council)}</span>
						</p>
						{#if description}
							<p class="doc-description">{@render marked(description)}</p>
						{/if}
						<!--
							THE FIFTH BLOCK IS TWO GROUPS AND ONE LINE: what the document is
							about at the start of it, what it can be read in at the end.
							They are the row's two lists of scraps and neither is worth a
							line of its own — the subjects wrap and the languages follow at
							the far end of whatever line is left, which is the row's bottom
							corner at every width the aside allows.

							A LANGUAGE IS NOT A CONTROL AND THE COUNT BEHIND THEM IS. A
							subject is a facet of this page, so clicking one narrows the
							list; a language is a property of the document, and the place to
							choose one is the edition picker on the document's own page —
							the reader gets their own by default, which is what
							`document-langs.ts` prints first. What the count does is show
							the rest of its own row, which is the only thing it could ever
							do and the only reason it is pressable.
						-->
						{#if row.tags.length > 0 || langs.shown.length > 0}
							<div class="doc-foot">
								{#if row.tags.length > 0}
									<!--
										THE SUBJECTS HAVE A COUNT OF THEIR OWN, on the languages'
										argument and a different cut: theirs is the reader's chain,
										a fact about who is reading; this one is WIDTH, a fact
										about the row. Eight subjects under a two-line description
										is a row that has stopped being a title with facts under it
										(`chip-fit.ts` estimates the width and says why it
										estimates rather than measures).

										THE REVEALED SUBJECTS COME AFTER THE COUNT, where the
										languages' come before it, and both are the same rule: the
										control keeps the edge the line is anchored to and the
										chips go where the line grows. This list runs from the
										start edge, so growing it moves everything to the right of
										the count — and nothing to its left.
									-->
									<ul class="doc-tags">
										{#each row.tags as tag, i (tag)}
											{#if i < tagFit}{@render tagChip(row, tag, i)}{/if}
										{/each}
										<!-- The control is drawn by what does not FIT and never by
										     what is shown, so opening the row cannot take away the
										     one thing that closes it again. -->
										{#if tagFit < row.tags.length}
											<li>
												<button
													type="button"
													class="doc-tag more"
													aria-expanded={tagsOpen[row.slug] === true}
													onclick={() => (tagsOpen[row.slug] = !tagsOpen[row.slug])}
													>{#if tagsOpen[row.slug]}<span aria-hidden="true">{CLOSE_MARK}</span><span
															class="visually-hidden">{t('document.subjects.fewer')}</span
														>{:else}+{row.tags.length - tagFit}<span class="visually-hidden">
															{t('document.subjects.more')}</span
														>{/if}</button
												>
											</li>
											{#if tagsOpen[row.slug]}
												{#each row.tags as tag, i (tag)}
													{#if i >= tagFit}{@render tagChip(row, tag, i)}{/if}
												{/each}
											{/if}
										{/if}
									</ul>
								{/if}
								{#if langs.shown.length > 0}
									<!-- A `<p>` and not a list: these are three or four scraps
									     read as one line, where the subjects are a list because
									     each of them is a button. The name it is owed is a
									     visually-hidden span for the reason the count above the
									     list carries one — an `aria-label` on an element with
									     neither a role nor a handler is dropped. -->
									<p class="doc-langs">
										<span class="visually-hidden">{t('document.languages.label')}: </span>
										{#each langs.shown as lang (lang)}{@render langChip(lang)}{/each}
										{#if langsOpen[row.slug]}
											{#each langs.rest as lang (lang)}{@render langChip(lang)}{/each}
										{/if}
										{#if langs.rest.length > 0}
											<!--
												THE COUNT IS A DISCLOSURE, and a `title` is why it had to
												become one: the names behind it were a hover, which is
												nothing at all on a phone — the reader who most needs the
												count is the one who could not open it. It is the
												subjects' own argument one list over, that a scrap saying
												what is there and refusing to show it is the worse half of
												a scrap.

												IT OPENS LEFTWARDS, INTO THE EMPTY HALF OF THE LINE (by
												direction). The line is already right-aligned and the
												space beside the subjects is already empty, so the
												revealed codes fill it and NOTHING BELOW THE CARD MOVES —
												where a line of their own cost every row under this one a
												reflow, for a look at one row. The chip keeps the line's
												end, keeps its text at `+13` and takes the accent the way
												a chosen subject does, so the thing a reader pressed is
												where they left it. `aria-expanded` says which way it is,
												and is why the hidden word stays "more languages" in both
												states.

												WHAT IT CANNOT PROMISE IS A NARROW SCREEN, where fourteen
												codes are wider than the line and the group wraps like
												any other. That is the honest limit of a row that grows:
												it costs a line where there is no line to spare, and the
												reader asked for it there too.

												NO `aria-controls`, which is optional on a disclosure and
												would be a reference to an id that is not in the document
												while the row is shut: what it controls is the next thing
												in reading order, and rendering all of it hidden on 272
												rows to hold the id honest is thousands of scraps nobody
												asked for.
											-->
											<button
												type="button"
												class="doc-lang more"
												aria-expanded={langsOpen[row.slug] === true}
												onclick={() => (langsOpen[row.slug] = !langsOpen[row.slug])}
												>{#if langsOpen[row.slug]}<span aria-hidden="true">{CLOSE_MARK}</span><span
														class="visually-hidden">{t('document.languages.fewer')}</span
													>{:else}+{langs.rest.length}<span class="visually-hidden">
														{t('document.languages.more')}</span
													>{/if}</button
											>
										{/if}
									</p>
								{/if}
							</div>
						{/if}
					</li>
				{/each}
			</ul>
			{#if held > 0}
				<!-- NO COUNT ON IT (2026-09-12, by direction). It carried how many
				     rows were still behind it, and a figure beside a button is read
				     as what the button will DO — so `332` promised a press that
				     brought 332 rows and delivered a hundred. The number that
				     answers "how many are there" is already on the line that opens
				     the list, where it is a fact about the list rather than a
				     promise about a control. -->
				<div class="load-more">
					<button type="button" onclick={loadMore}>{t('document.loadMore')}</button>
				</div>
			{/if}
		{/if}
	</div>
	<aside class="index-aside">
		<DocumentSearch bind:query />
		<DocumentFilters
			authors={authorFacets}
			kinds={kindFacets}
			langs={langFacets}
			tags={tagFacets}
			{selected}
			{query}
			onToggle={toggle}
			onClear={clearAll}
		/>
	</aside>
</div>

<style>
	/* Both of these mirror `.index-aside` in styles/layout.css: exactly where
	   that rule takes the aside away, they appear, and where the aside is back
	   they go. One width, not the pair `/documenta/{slug}` needs, because an
	   index page never enters compare mode and so never has the aside pulled
	   out from under it a second time. Getting the pairing wrong in either
	   direction shows two search boxes or none. */
	@media (min-width: 80rem) {
		.search-inline {
			display: none;
		}
	}

	.search-inline {
		max-width: 40rem;
	}

	/* THE COLOUR IS THE ROW'S AND IS DECLARED HERE, not on the summary and not
	   on the `h2`: `--fold-ink` is what `.fold`'s hover and focus answer reads
	   (components.css), and either of the other two spellings silently wins
	   against it. */
	.filters-inline {
		margin: 0 0 1.25rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: 0.5rem 0.75rem;
		--fold-ink: var(--color-text-muted);
	}

	@media (min-width: 80rem) {
		.filters-inline {
			display: none;
		}
	}

	.filters-inline summary h2 {
		font-family: var(--font-sans);
		font-size: 0.8rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: inherit;
		margin: 0;
	}

	/* THE PLACEMENT ALONE IS THIS PANEL'S. The summary is a bordered box rather
	   than a page-wide row, so the chip rides its end where `IndexSection`'s
	   sits beside the heading; the figures are `.chip`'s own. */
	.filters-inline summary .chip {
		margin-inline-start: auto;
	}

	.filters-inline :global(.doc-filters) {
		margin-top: 0.75rem;
	}

	/*
	 * THE SEARCH FIELD HOLDS THE TOP OF THE ASIDE'S SCROLLPORT.
	 *
	 * `.index-aside` is its own scroll container (styles/layout.css) and this
	 * panel is taller than one — sixteen authors, twelve kinds and a cloud of
	 * subjects — so a reader who scrolled down to the subjects had scrolled
	 * the one control they might want to type into off the top of it.
	 *
	 * ON THE ASIDE'S COPY AND NOT ON THE COMPONENT, because the same field is
	 * rendered in `.search-inline` above the list at narrower widths, where
	 * there is no scroll container of its own: sticky there resolves against
	 * the PAGE's scrollport, and the field would ride down the document over
	 * 298 rows. `:global()` reaches into the component's scope; `.index-aside`
	 * is this route's own element, so the pair is still scoped to this page.
	 *
	 * The ground is opaque because a sticky element does not clip what passes
	 * under it, and the band is what carries it — see the component, where the
	 * gap below the field is padding for exactly this reason.
	 */
	.index-aside :global(.doc-search-band) {
		position: sticky;
		top: 0;
		z-index: 1;
		background: var(--color-bg);
	}

	/* The site's second `<mark>` — `JumpBox` has the other, and the argument
	   there applies here too: a wash behind the letters rather than a change of
	   colour, because recolouring the matched words in 272 rows of serif titles
	   would read as damage rather than as emphasis. `color: inherit` because
	   the browser default repaints mark text near-black, which the dark and
	   sepia themes both lose. */
	mark {
		background: color-mix(in srgb, var(--color-accent) 22%, transparent);
		color: inherit;
		border-radius: 2px;
	}

	/* Forced-colors drops the wash entirely, so the mark has to be carried by
	   something the mode does paint. */
	@media (forced-colors: active) {
		mark {
			background: Mark;
			color: MarkText;
		}
	}

	/* On the list's own opening rule, drawn here rather than by a
	   `border-top` on the first `.index-row`: the rows carry a bottom border
	   each (components.css), so the line that CLOSES the list is a row's and
	   the line that opens it has to belong to something. This is that
	   something, and it is also the count. */
	.result-count {
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		color: var(--color-text-muted);
		margin: 1.5rem 0 0;
		padding-block-end: 0.4rem;
		border-block-end: 1px solid var(--color-border);
	}

	.no-results {
		color: var(--color-text-muted);
		margin: 1.5rem 0;
	}

	/* The ruler's chip. Out of the flow and invisible, but laid out — a
	   `display: none` box has no width to read — and never a reader's business.
	   `nowrap` because a shrink-to-fit box in a narrow column would break a
	   two-word subject and report half of it. */
	.chip-probe {
		position: absolute;
		visibility: hidden;
		pointer-events: none;
		white-space: nowrap;
	}

	/* The way on, at the foot of the list. Centred and full width: it is the
	   one thing under 100 rows and a button hugging the start edge reads as
	   another row's control rather than as the list's own. */
	.load-more {
		display: flex;
		justify-content: center;
		margin: 1.5rem 0 0;
	}

	.load-more button {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		padding: 0.45rem 1.1rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text);
		cursor: pointer;
	}

	.load-more button:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/* The list, its rows, the row-filling link, its title and its kind chip are
	   all `styles/components.css` — `.index-list`, `.index-row`, `.index-link`,
	   `.index-title`, `.chip` — including the hover that answers on both ends
	   of the row. This page is the shape those primitives were named after, so
	   the only thing left to say is how big a document's title is set: larger
	   than the other index pages', because here the title IS the row and the
	   date and description hang beneath it. */
	.doc-title {
		font-size: 1.15rem;
	}

	/* Tabular figures so dates align down the column; the author follows behind
	   a separator drawn in CSS rather than typed into the markup, so it
	   vanishes with the element it belongs to. */
	.doc-meta {
		margin: 0.3rem 0 0;
		font-variant-numeric: tabular-nums;
	}

	.doc-author::before {
		content: '·';
		margin-inline: 0.45em;
		color: var(--color-border);
	}

	/*
	 * NO MAX-WIDTH, WHICH IS THE POINT OF THE BLOCK (2026-09-06, by
	 * direction). It was 60ch, then briefly 34rem beside a column of chips,
	 * and both were a measure held inside a track more than twice as wide —
	 * so every row ended in an empty half, and the two attempts to fill that
	 * half moved things into it instead of letting the text have it.
	 *
	 * The description now runs the row, which is `--index-width` (62rem) once
	 * the aside is beside it and `--landing-width` in the band below that.
	 * That IS a long line by the reading grid's standard, and it is not the
	 * reading grid: this is two or three sentences under a title in an index,
	 * read as a block to decide whether to open a document, not a page of
	 * prose read line after line. `--measure-cpl` governs the works
	 * themselves; nothing here is set in it.
	 */
	.doc-description {
		margin: 0.35rem 0 0;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}

	/*
	 * THE LAST LINE HOLDS BOTH LISTS, THE LANGUAGES AT ITS END. The subjects
	 * take the space (`flex: 1`) and wrap inside it; the languages keep the far
	 * end of the line whatever the subjects do. `margin-inline-start: auto`
	 * rather than `justify-content: space-between`, which puts a lone list at
	 * whichever end it happens to be — a row with no subjects would open with
	 * its languages. Logical, so the card's bottom RIGHT is its bottom left in
	 * Arabic and Hebrew.
	 *
	 * `align-items: flex-end` and not `baseline`, which is the same answer
	 * until the subjects take a second line: both kinds of scrap are set at one
	 * size in one box, so the two agree exactly wherever the row is one line
	 * high, and where it is not the languages belong at the bottom of it.
	 */
	.doc-foot {
		display: flex;
		flex-wrap: wrap;
		align-items: flex-end;
		gap: 0.3rem 1rem;
		margin-top: 0.45rem;
	}

	.doc-tags {
		display: flex;
		flex: 1 1 auto;
		flex-wrap: wrap;
		gap: 0.3rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.doc-tag {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		line-height: 1.4;
		padding: 0.1rem 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.doc-tag:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.doc-tag.on {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	/* The subjects' count, wearing the languages' count exactly: dotted, so
	   the one pressable scrap that is not itself a subject says so, and lit
	   when open the way a chosen subject is lit. One idiom for both lists —
	   a reader learns `+5` once. */
	.doc-tag.more {
		border-style: dotted;
		font-variant-numeric: tabular-nums;
	}

	.doc-tag.more[aria-expanded='true'] {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	.doc-langs {
		display: flex;
		flex-wrap: wrap;
		justify-content: flex-end;
		gap: 0.3rem;
		margin: 0;
		margin-inline-start: auto;
	}

	/*
	 * ON A PHONE THERE IS NO EMPTY HALF TO OPEN INTO (2026-09-12, by direction),
	 * so the languages stop sharing the subjects' line and take one of their
	 * own, from the start edge. The count is then the last chip rather than the
	 * line's end, and pressing it grows the row to the RIGHT — which is the same
	 * bargain the wide layout makes, read in the other direction: a disclosure
	 * opens into whatever space the line actually has.
	 *
	 * 40rem is where the card's own line stops holding a run of subjects and
	 * four codes at once; it is well below `.index-aside`'s 80rem, this being a
	 * question about the row's width and not about the page's shape.
	 */
	@media (max-width: 40rem) {
		.doc-langs {
			flex: 0 0 100%;
			justify-content: flex-start;
			margin-inline-start: 0;
		}
	}

	/*
	 * A SUBJECT'S CLOTHES WITHOUT ITS AFFORDANCE: same size, same outline, same
	 * radius as `.doc-tag`, and no hover, no cursor and no pressed state — the
	 * two lists are the same kind of scrap and only one of them does anything.
	 * `.chip` is the other candidate and is the wrong one here: it is the
	 * bordered scrap at the END OF A ROW'S LINK, and the hover that answers on
	 * both ends of the row is written for it.
	 *
	 * THE TAG IN CAPITALS, where the edition picker and the language switch
	 * write the name out. Four names in their own scripts are four widths and
	 * up to three scripts in a corner of a card the eye passes over; four codes
	 * are one shape, and the name is a hover and a screen reader's alternative
	 * away. Tracking because two capitals set tight read as one word.
	 */
	.doc-lang {
		font-family: var(--font-sans);
		font-size: 0.7rem;
		line-height: 1.4;
		letter-spacing: 0.04em;
		padding: 0.1rem 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		color: var(--color-text-muted);
	}

	/* The count of the languages the chain above did not reach, and the control
	   that shows them. Tabular for the reason `.chip` is — a column of counts
	   down the page's edge whose digits change — and dotted, which is the one
	   thing separating it from the inert codes beside it: solid says a
	   language, dotted says there is something behind this. */
	.doc-lang.more {
		border-style: dotted;
		font-variant-numeric: tabular-nums;
		background: none;
		cursor: pointer;
	}

	.doc-lang.more:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	/* OPEN IS THE SUBJECT'S OWN PRESSED STATE, and the text keeps reading
	   `+13` so the chip is exactly as wide in both — a control that resized
	   itself would move the next press out from under the finger. */
	.doc-lang.more[aria-expanded='true'] {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-contrast);
	}
</style>
