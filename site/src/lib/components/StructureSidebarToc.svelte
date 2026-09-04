<script lang="ts">
	/**
	 * Table of contents for the reading sidebar (`.reading-aside`, app.css),
	 * shared by every route that has one: `/catechismus/[n]`,
	 * `/catechismus/caput/[n]`, `/catechismus/compendium/[n]`,
	 * `/catechismus/compendium/caput/[n]`, `/documenta/[slug]`.
	 * All four walk the same node shape — `CccNode`/`StructureNode` are
	 * literally the same type (`$lib/types.ts`) — parametrized by which
	 * flattened structure, which routing scheme, and (CCC/Compendium only)
	 * which kind-floor the caller passes in.
	 *
	 * THIS FILE MERGES TWO COMPONENTS TWO AGENTS BUILT IN PARALLEL
	 * (`StructureSidebarToc`, for CCC/Compendium, and `DocumentToc`, for
	 * documents) THAT TURNED OUT TO SOLVE THE SAME PROBLEM. Neither was a
	 * strict subset of the other; merging meant picking a winner on each
	 * point where they'd actually diverged, not just deleting one file:
	 *
	 *  - ANCHOR MODE. `/documents/[slug]` is the whole document on one
	 *    page, so its TOC has to link to `#s{n}` fragments instead of a
	 *    separate route. Genuine requirement, kept as `linkMode="anchor"`
	 *    below — `rowHref` (structureToc.ts) is the one place that decides
	 *    between that and the row's own address.
	 *
	 *  - WHICH NODE KINDS RENDER. The CCC/Compendium version rendered only
	 *    prologue/part/section/chapter — a "chapter-sized" floor measured
	 *    against the real corpus at 32-33 nodes, small enough to show fully
	 *    expanded in a 17rem column forever. The document version rendered
	 *    every kind, unfiltered, because a document's depth and size vary
	 *    too much for any one floor to be universal. Both are real
	 *    requirements, not an oversight either side — kept as the optional
	 *    `outlineKinds` prop (`outlineChildren`, structureToc.ts): pass
	 *    `OUTLINE_KINDS` for the CCC/Compendium floor, omit it for a
	 *    document's full tree.
	 *
	 *  - HOW THE TREE IS WALKED. Follows directly from the point above: the
	 *    CCC/Compendium version walked `node.children` recursively (nested
	 *    `<ol>` per level) because pruned-out kinds would otherwise leave
	 *    gaps in a flat depth count; the document version, never pruning
	 *    anything, could get away with trusting the flat `depth` its caller
	 *    already computed and skip the recursion. Once both share one
	 *    `outlineKinds`-aware walk, that shortcut is no longer available OR
	 *    needed — recursing via `.children` is correct for both, and
	 *    documents pick up genuinely nested `<ol>`s along the way, which is
	 *    the semantically correct shape for a tree and reads as one to
	 *    assistive tech, unlike a flat list whose nesting was only ever a
	 *    CSS indent.
	 *
	 *  - WHICH ROW IS "CURRENT". The CCC/Compendium version distinguished
	 *    the exact matching row (`isCurrent`: solid highlight,
	 *    `aria-current="page"`) from its ancestors (`onPath`: accent text
	 *    only); the document version marked every ancestor identically, no
	 *    row more so than another. The distinction wins here (`rowState`,
	 *    structureToc.ts) — a document's tree runs deeper than the
	 *    CCC/Compendium's fixed floor (part → chapter → article → sub), so
	 *    knowing *which* ancestor is the actual leaf matters more on a
	 *    document's sidebar, not less.
	 *
	 *  - THE ORDINAL MARKER. The CCC/Compendium version showed
	 *    `kindOrdinalLabel`'s abbreviated, kind-disambiguated form
	 *    ("Ch. 3", "Part 1") instead of a bare number, precisely so a tree
	 *    several levels deep doesn't show "1." at every level with nothing
	 *    to tell them apart (see that function's own docblock). The document
	 *    version showed `displayTitle`'s bare ordinal ("3.") for every kind.
	 *    Picking the label alone would have silently dropped numbering for
	 *    `sub` nodes — a document's fifth heading level
	 *    (`read/+page.svelte`'s `headingTag`) — since `kindOrdinalLabel` has
	 *    no "Sub" entry. `marker()` (structureToc.ts) keeps both: the label
	 *    where one exists, the bare ordinal where it doesn't.
	 *
	 *    Since then, a document heading's own printed marker ("CHAPTER TWO")
	 *    has also picked up a sidebar-only abbreviated form ("Ch. 2"), for
	 *    the same column-width reason `kindOrdinalLabel` abbreviates in the
	 *    first place — passing this snippet's own `nodes` and `i` into
	 *    `marker()` below is what lets it derive that form from the row's
	 *    position among its siblings rather than parsing the source text
	 *    (see `marker()`'s own docblock, structureToc.ts).
	 *
	 *  - VISIBLE HEADING vs. ARIA-ONLY LABEL. The document version rendered
	 *    a visible "Table of Contents" heading above the list; the
	 *    CCC/Compendium version had no visible label at all, only an
	 *    `aria-label` on the `<nav>` (duplicated onto the wrapping `<aside>`
	 *    by every CCC/Compendium route, for reasons lost to history — two
	 *    nested landmarks both announcing the same string). The visible
	 *    heading is a plain usability win for sighted readers too, not just
	 *    assistive tech, so it's kept for all three corpora; the `<nav>` now
	 *    takes its accessible name from that one heading via
	 *    `aria-labelledby` instead of a second, separate `aria-label`, and
	 *    the callers' `<aside>` wrappers no longer set `role`/`aria-label`
	 *    of their own (see the route files' `<aside class="reading-aside">`
	 *    — this component is now the sidebar's one landmark).
	 *
	 *  - SCROLL-INTO-VIEW. The CCC/Compendium version scrolled the reader's
	 *    current row into view within the aside's own scroll container on
	 *    arrival; the document version didn't. Kept, unconditionally: gated
	 *    on `currentN !== undefined`, which is already false throughout
	 *    `linkMode="anchor"` (nothing is "current" when the whole document
	 *    is already on screen), so nothing needed to change to extend it —
	 *    and a document's unfiltered, unfloor'd tree can run considerably
	 *    longer than the CCC/Compendium's capped 32-33 rows, so keeping the
	 *    active row in view matters at least as much here.
	 *
	 *  - ROW FONT. The document version set its rows in the serif reading
	 *    face; the CCC/Compendium version left them at the inherited sans
	 *    (`body`'s default, app.css). Sans wins: `.reading-aside` is UI
	 *    chrome, not `.reading-text` — the breadcrumb and every other control
	 *    in the reading layout is sans by the same inheritance, and this
	 *    sidebar reads as one more control among them, not as a second body
	 *    of prose next to the one `--reading-scale` actually governs.
	 *
	 *  - UNLINKED-ROW TOOLTIP. The document version put
	 *    `title="No section number in this corpus"` on an unaddressable
	 *    row's `<span>`; the CCC/Compendium version didn't. Kept for all
	 *    three — cheap, and there's no reason to withhold it from two of the
	 *    three corpora that can hit the same null-bound case
	 *    (docs/corpus-schema.md).
	 */
	import { browser } from '$app/environment';
	import type { StructureNode } from '$lib/types';
	import { displayTitle, inlineTitleNodes } from '$lib/titles';
	import { revealRow } from '$lib/reveal-row';
	import Icon from './Icon.svelte';
	import InlineText from './InlineText.svelte';
	import {
		currentIndex,
		rowHref,
		marker,
		outlineChildren,
		rowState,
		type LinkMode
	} from './structureToc';

	interface Props {
		/** `flattenCccStructure`/`flattenCompendiumStructure`/
		    `flattenDocumentStructure`'s raw return. Only the depth-0 entries
		    are read directly, to seed the walk below as roots — everything
		    under them is walked via `node.children`, which `flattenTree`
		    (corpus.ts) populates on the SAME node objects it flattened, not
		    copies, so the two views of the tree never disagree. */
		structure: { node: StructureNode; depth: number }[];
		/** Paragraph (CCC) / question (Compendium) / section (document)
		    number the reader is currently on. Nothing is marked current when
		    this is undefined — same "degrade, don't fabricate" posture as
		    the rest of the site, rather than guessing a position. Always
		    undefined on `linkMode="anchor"`, where the whole document is
		    "current" and no one row is more so than another. */
		currentN: number | undefined;
		lang: string;
		/** A caveat true of every row in this list, hung on an info glyph
		    beside the heading and shown on hover as its `title` — the same
		    "the long form is one hover away" the copyright notice uses for the
		    source's own boilerplate. Only the Summa passes one: the Corpus
		    Thomisticum prints no question or article titles, so under Latin
		    every row is another edition's words. Saying that once above the
		    list beats marking 611 rows that have nothing to be marked against;
		    saying it as a line of prose beside them, which is what this
		    replaced, spends four lines of a 17rem column on a caveat the
		    reader needs once. Undefined leaves the heading exactly as it was.

		    The glyph carries the note visually-hidden as well, because a
		    `title` is not reliably announced; the heading's own text is in its
		    own span so the `<nav>`'s accessible name stays the heading alone.

		    THE HOVER IS NO LONGER THE WHOLE ANSWER. This used to read "hover is
		    desktop-only and so is this sidebar, so nothing is lost on a phone
		    that was ever offered there" — true while `.reading-aside` was the
		    only place these rows rendered, and false the moment `TocMenu` put
		    the same list in the reading bar's panel. Where the pointer cannot
		    hover, the glyph is hidden and the note is set as prose under the
		    heading instead; see `.sidebar-toc-note-prose` (app.css). */
		headingNote?: string;
		/** Rendered as both the sidebar's visible heading and its `<nav>`'s
		    accessible name (`aria-labelledby`) — one string doing both jobs.
		    The existing `ccc.tableOfContents`/`compendium.tableOfContents`/
		    `document.tableOfContents` i18n keys already cover it. */
		heading: string;
		/** `/ccc`, `/catechismus/compendium`, or `/documents/{slug}` — combined with a
		    node's own first paragraph/question/section number to build its
		    href. Unused, may be omitted, when `linkMode` is `"anchor"`.

		    A FUNCTION, not a base path: it is the caller's `hrefFor` from
		    `address.ts`, so a row's address is written where every other one
		    is. Concatenating a prop here is how the Compendium's move left
		    four 404s that no grep for the old prefix could have found. */
		routeHref?: (n: number) => string;
		/** `"route"` (default): each row links to its own page. `"anchor"`:
		    each row links to `#s{n}` on the current page instead — see the
		    docblock's ANCHOR MODE note. */
		linkMode?: LinkMode;
		/** Restricts which child kinds are descended into (and rendered) at
		    every level, along with everything beneath a pruned-out child.
		    Pass `OUTLINE_KINDS` (structureToc.ts) for the CCC/Compendium
		    floor; omit it to render every kind present in the tree, which is
		    what a document wants (see the docblock's WHICH NODE KINDS
		    RENDER note). */
		outlineKinds?: Set<StructureNode['kind']>;
		/** In `"route"` mode, the in-page fragment (no `#`) a row should land
		    on once its route has loaded, or `undefined` for the page top.
		    Only a route whose page holds MORE than one row needs this — the
		    CCC's whole-chapter view, where the chapter's articles are all on
		    the same page and would otherwise share one address. Left unset,
		    every row links to the page top exactly as before. */
		anchorFor?: (node: StructureNode) => string | undefined;
		/** Tooltip for a row whose title was borrowed from another edition
		 *  (`StructureNode.titleLang`), given that edition's language tag.
		 *  Passed in rather than read from i18n here so this component stays
		 *  a pure view of what it is handed — the same reason the heading is.
		 *  Only the Summa has such rows.
		 *
		 *  IT IS A TOOLTIP AND A `lang`, AND NOTHING VISIBLE. Borrowed rows
		 *  used to be set in italic here as well; that mark cost the reader a
		 *  convention to know and repaid it only where borrowed and unborrowed
		 *  rows sat side by side, which never happens — an edition prints
		 *  titles or it does not, so under Latin the italic was the whole
		 *  sidebar and distinguished nothing. The page that knows every row is
		 *  borrowed says so in words instead (`summa.titlesFromEdition`). */
		borrowedTitleLabel?: (lang: string) => string;
		/**
		 * Whether a printed division label may be replaced by the short form
		 * whose NUMBER is derived from position — `CHAPTER FIVE` → `Ch. 5`.
		 *
		 * On by default, because that abbreviation is what makes a labelled
		 * document tree fit a 17rem column (see THE ORDINAL MARKER above). Off
		 * for the Compendium of the Social Doctrine, where it is not an
		 * abbreviation but a different number: that work runs its twelve
		 * chapters straight through three parts, so Chapter Five — the first
		 * child of Part Two — came out `Ch. 1`, and its seven siblings were
		 * numbered 1 to 7 under a heading that names none of them. Position
		 * among tree siblings is the right basis wherever a part restarts its
		 * chapter numbering (Gaudium et Spes does) and the wrong one wherever
		 * it does not, and nothing in the tree says which. Where it is known,
		 * the caller says so, and the label is printed as the source prints
		 * it.
		 */
		deriveMarkers?: boolean;
		/** Rows the PAGE renders a heading for even though they bound no
		 *  numbered unit — a document's tail matter, whose text is unnumbered
		 *  (docs/corpus-schema.md §appendix.json). Without this they fall to
		 *  the unlinked branch below and a reader gets a table of contents
		 *  listing text that is on the page and unreachable from it. Absent
		 *  for the CCC and Compendium, which have no such rows. */
		linkableAnchors?: Set<string>;
		/** Rewrites a row's printed label before it is shown — the Code of
		 *  Canon Law abbreviates the division noun and keeps the source's own
		 *  numeral (`canonLawLabelText`), which is what `deriveMarkers` cannot
		 *  do for it: that form renumbers, and the Code restarts `TITLE I`
		 *  inside every book. Absent everywhere else, where the label either
		 *  fits or is already handled by `deriveMarkers`. */
		markerText?: (label: string) => string;
		/** Rewrites a row's stored title before it is cased and rendered,
		 *  applied to `titleHtml` as well as to the plain form so the two
		 *  cannot disagree. The Code strips the canon range its editions print
		 *  inside a heading (`canonLawTitleText`) — and BEFORE the casing, not
		 *  after, because `normalizeCase` rewrites a heading only when it is
		 *  ALL-CAPS and `(Cann. 35 - 93)` is not. */
		titleText?: (title: string) => string;
	}

	let {
		structure,
		currentN,
		lang,
		heading,
		headingNote,
		routeHref,
		linkMode = 'route',
		outlineKinds,
		anchorFor,
		borrowedTitleLabel,
		linkableAnchors,
		deriveMarkers = true,
		markerText,
		titleText
	}: Props = $props();

	const roots = $derived(structure.filter((row) => row.depth === 0).map((row) => row.node));

	/*
	 * PER-INSTANCE, BECAUSE THERE ARE TWO INSTANCES NOW. These were the
	 * literals `reading-toc-current`/`reading-toc-heading`, which was fine
	 * while the sidebar was the only place this rendered — and is what
	 * `/documenta` cited as the reason it wrote its narrow-screen table of
	 * contents (`.toc-inline`) as separate markup rather than a second copy
	 * of this component.
	 *
	 * `TocMenu` is that second copy: the reading bar's narrow-screen panel
	 * renders this alongside the sidebar's own hidden instance, and two
	 * elements sharing an id make `aria-labelledby` ambiguous and
	 * `getElementById` below answer for whichever came first — which, the
	 * aside being last in source order, would have been the panel scrolling
	 * the sidebar's hidden row into view and never its own.
	 *
	 * `$props.id()` is Svelte's own per-instance id, so the two never
	 * collide and neither has to be told which one it is.
	 */
	const uid = $props.id();
	const CURRENT_ID = `${uid}-current`;
	const HEADING_ID = `${uid}-heading`;

	/* Keeps the reader's current row visible inside the list's OWN scroll
	   container — the aside, the reading bar's panel, or `/documenta`'s inline
	   contents, whichever this instance rendered into.

	   DELIBERATELY NOT `scrollIntoView`, and the reason is `currentN`: on half
	   the routes that render this list it is `spy.current`, so this effect
	   fires WHILE the page is scrolling. `scrollIntoView` scrolls every
	   scrollable ancestor up to the viewport, and performing a scroll on the
	   viewport aborts a smooth scroll already running on it — so a keyboard
	   reference step (`Shortcuts.svelte`) that crossed a section boundary had
	   its animation cancelled mid-glide by the sidebar keeping its own place.
	   `$lib/reveal-row` moves one container's `scrollTop` and cannot touch the
	   page; `IndexSidebarToc` and `TocMenu` had both already reached the same
	   conclusion by their own routes.

	   Browser-only: `document` doesn't exist outside a browser. That guarded
	   against a prerendering throw; since `ssr = false` (`+layout.ts`,
	   site/docs/shell.md) no route ever renders server-side at all now, so the
	   guard is belt-and-braces rather than load-bearing — kept because it
	   still states the actual requirement, and every route this component
	   serves still renders a complete, navigable tree without this effect
	   running. */
	$effect(() => {
		if (!browser || currentN === undefined) return;
		const row = document.getElementById(CURRENT_ID);
		if (row) revealRow(row);
	});
</script>

{#snippet level(nodes: StructureNode[])}
	{@const cur = currentIndex(nodes, currentN, outlineKinds)}
	<ol class="sidebar-toc-list toc-level">
		{#each nodes as node, i (node.anchor ?? node.title + node.paragraphs.join('-'))}
			{@const shown = titleText ? { ...node, title: titleText(node.title) } : node}
			{@const shownHtml = node.titleHtml && titleText ? titleText(node.titleHtml) : node.titleHtml}
			{@const dt = displayTitle(shown, lang)}
			{@const printed = deriveMarkers ? marker(node, lang, nodes, i) : marker(node, lang)}
			{@const label = printed && markerText ? markerText(printed) : printed}
			{@const anchor = node.paragraphs[0]}
			{@const kids = outlineChildren(node, outlineKinds)}
			{@const raw = rowState(node, currentN, outlineKinds)}
			{@const state = { onPath: raw.onPath, isCurrent: raw.isCurrent && i === cur }}
			<li class={`kind-${node.kind}`} class:on-path={state.onPath}>
				{#if Number.isFinite(anchor) || (node.anchor && linkableAnchors?.has(node.anchor))}
					<a
						id={state.isCurrent ? CURRENT_ID : undefined}
						href={rowHref(node, anchor as number, linkMode, routeHref, anchorFor?.(node))}
						class:current={state.isCurrent}
						aria-current={state.isCurrent ? 'page' : undefined}
					>
						{#if label}<span class="kind-label label-micro">{label}</span>{/if}
						<span
							class="row-title"
							lang={node.titleLang}
							title={node.titleLang ? borrowedTitleLabel?.(node.titleLang) : undefined}
							><InlineText nodes={inlineTitleNodes(dt.title, shownHtml, lang)} /></span
						>
					</a>
				{:else}
					<!-- Null bounds: real structure the corpus knows about but no
					     paragraph/question/section number addresses — text, not a
					     link, same convention as `/ccc/+page.svelte`,
					     `/catechismus/compendium/+page.svelte` and `/documents/[slug]/+page.svelte`'s
					     own tables of contents. -->
					<span class="row-title unlinked" title="No section number in this corpus">
						{#if label}<span class="kind-label label-micro">{label}</span>{/if}
						<InlineText nodes={inlineTitleNodes(dt.title, shownHtml, lang)} />
					</span>
				{/if}
				<!-- ONLY THE READER'S OWN BRANCH IS EXPANDED. A row's children
				     render when that row contains the current position — which
				     covers both the ancestors leading down to it and the current
				     row itself, so the reader always sees the level they are on
				     plus what is inside it, and nothing from branches they are
				     not in.

				     This replaces rendering the whole tree at every level. That
				     was defensible for the CCC and Compendium, whose trees were
				     measured at 32-33 rows, and wrong for documents, which carry
				     no such floor: an unfiltered four-level encyclical tree ran
				     to hundreds of rows in a 17rem column, burying the handful
				     that say where the reader actually is.

				     Collapsed branches are not hidden content — every one of
				     them is still reachable, because its own top-level ancestor
				     is still a link, and following it expands that branch in
				     turn. Nothing needs client-side disclosure state, which is
				     also why this keeps working with JavaScript off. -->
				{#if kids.length > 0 && state.onPath}
					{@render level(kids)}
				{/if}
			</li>
		{/each}
	</ol>
{/snippet}

<nav aria-labelledby={HEADING_ID} data-link-preview="off">
	<h2 class="sidebar-toc-heading">
		<span id={HEADING_ID}>{heading}</span>
		{#if headingNote}
			<span class="sidebar-toc-note" title={headingNote}>
				<Icon name="info" />
				<span class="visually-hidden">{headingNote}</span>
			</span>
		{/if}
	</h2>
	<!-- The same note as prose, for a reader who cannot hover — see
	     `.sidebar-toc-note-prose` (app.css). Exactly one of the two is ever
	     rendered, so nothing is announced twice; a `<p>` rather than a third
	     span inside the `<h2>`, whose content model does not allow one. -->
	{#if headingNote}
		<p class="sidebar-toc-note-prose">{headingNote}</p>
	{/if}
	{@render level(roots)}
</nav>

<style>
	/*
	 * The sidebar takes the interface face, and it is the one table of
	 * contents that does. The line is where the list stands rather than what
	 * it holds: this one sits outside the reading column, is present on every
	 * unit of the work, and its rows are addresses to jump to. The index page
	 * (`StructureIndex`) and a document's inline list (`.toc-inline`) sit in
	 * the reading column and read as a page of the book, so they keep
	 * `--font-serif` and say so explicitly.
	 *
	 * Declared rather than inherited from `body`, even though `body` already
	 * carries `--font-sans`: every surface that stays in the text face names
	 * `--font-serif`, so a surface that means to be in the interface face
	 * should name that too. Inheritance here would read as an omission.
	 */
	nav {
		font-family: var(--font-sans);
		font-size: 0.85rem;
	}

	/* Compounds naturally with each level of real DOM nesting (`.toc-level`
	   inside `.toc-level` inside `.toc-level` …), so a document's deeper
	   tree indents progressively without this component tracking a depth
	   number anywhere. */
	.toc-level .toc-level {
		margin-inline-start: 0.6rem;
		padding-inline-start: 0.65rem;
		border-inline-start: 1px solid var(--color-border);
	}

	a,
	.unlinked {
		display: block;
		text-decoration: none;
		color: var(--color-text);
		padding: 0.2rem 0.35rem;
		border-radius: var(--radius-md);
		line-height: 1.35;
	}

	.unlinked {
		color: var(--color-text-muted);
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	/* A row big enough to hit with a thumb, and only where there is a thumb —
	   the same rule and the same 0.5rem `/documenta`'s `.toc-disclosure`
	   summary takes. This list was desktop-only when it was written, so the
	   0.2rem above was sized for a mouse and nothing else; `TocMenu` now puts
	   the identical rows on a phone. Applied to the component rather than to
	   the panel because it is a fact about the rows, not about where they are:
	   a touchscreen laptop taps the sidebar with the same thumb.

	   `.unlinked` grows too, though nothing taps it. Its rows are interleaved
	   with real ones, and a list whose untappable entries are visibly shorter
	   reads as a rendering fault rather than as a distinction. */
	@media (pointer: coarse) {
		a,
		.unlinked {
			padding-block: 0.5rem;
		}
	}

	.kind-part > a,
	.kind-part > .unlinked,
	.kind-prologue > a,
	.kind-prologue > .unlinked,
	.kind-chapter > a,
	.kind-chapter > .unlinked {
		font-weight: 700;
	}

	.kind-section > a,
	.kind-section > .unlinked {
		font-weight: 600;
	}

	/* Every document heading renders as `kind-sub` (`corpus.ts`'s
	   `buildDocumentOutline` — a document node carries no real `kind`), so
	   this component can't lean on `--color-text-muted` to demote a genuine
	   sub-bullet the way the CCC/Compendium version could: there is no
	   separate `kind-chapter`/`kind-part` left to contrast it against, and
	   `--color-text-muted` reads as too faint once it's carrying the WHOLE
	   sidebar's body text rather than just the occasional secondary row.
	   Every row keeps full `--color-text` contrast; hierarchy comes from
	   weight and indentation instead. `:has(.kind-label)` — whether a row
	   got a marker at all, checked the same way a reader would rather than
	   by depth, which a document's nesting doesn't reliably track (see the
	   marker() docblock, structureToc.ts) — is what tells an actual chapter
	   heading ("Ch. 2") from a plain nested bullet, and earns it the same
	   bold treatment `.kind-chapter` gets on the CCC/Compendium. */
	.kind-sub:has(.kind-label) > a,
	.kind-sub:has(.kind-label) > .unlinked {
		font-weight: 600;
	}

	/* Set in the sans face at a smaller size, matching `/ccc/+page.svelte`'s
	   own `.kind-label` treatment, so it reads as a label attached to the
	   title rather than as the title's first word — used uniformly for
	   `kindOrdinalLabel`'s abbreviated form AND `marker()`'s bare-ordinal
	   fallback (see the docblock's THE ORDINAL MARKER note), so a "3." on a
	   document's unlabeled `sub` row gets the same small, muted treatment a
	   "Ch. 3" gets everywhere else rather than looking like stray text. */
	.kind-label {
		font-size: max(var(--font-size-min), 0.72em);
		margin-inline-end: 0.4em;
		white-space: nowrap;
	}

	/* Ancestors of the reader's current row (not the row itself — `.current`
	   below wins on those) pick up the accent as a lightweight "you are
	   somewhere under here" cue, cheaper than a second visual language. */
	.on-path > a,
	.on-path > .unlinked {
		color: var(--color-accent);
	}

	/* Declared after `.on-path > a` so its background/color wins the cascade
	   on a row that's both on the path and the current one (every ancestor
	   qualifies for both simultaneously — see `rowState` in structureToc.ts). */
	a.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		font-weight: 600;
	}

	/* `.kind-label` sets its OWN color, so it doesn't just inherit `a.current`'s
	   contrast color the way the rest of the row's text does — left alone,
	   "CH. 4" renders in `--color-text-muted` on top of the solid accent
	   background, which is a dark-on-dark (or, in some themes, light-on-light)
	   near-miss rather than an actual contrast pair, since that token was
	   never chosen against this background. Inheriting the row's own
	   already-correct contrast color is simpler than picking a second color
	   that happens to also work here. */
	a.current .kind-label {
		color: inherit;
	}
</style>
