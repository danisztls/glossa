<script module lang="ts">
	/** One value a facet offers.
	 *
	 *  Declared in the MODULE block, not the instance one, because the route
	 *  builds these and needs the type: a `<script lang="ts">` declaration is
	 *  local to one instance and is not a named export of the component. */
	export interface Facet {
		/** Match key — the raw `pontiff_or_council`, the `document_kind`, or a
		 *  lower-cased tag. What `selected` holds and what `onToggle` sends. */
		value: string;
		/** What the reader sees. Equal to `value` for an author (corpus data,
		 *  never translated), a translated label for a kind, and the tag as it
		 *  was written for a subject. */
		label: string;
		count: number;
	}
</script>

<script lang="ts">
	/**
	 * The `/documenta` facet panel: author, kind and subject, each a list of
	 * values with the number of documents that value would leave standing.
	 *
	 * ## Why buttons and not checkboxes
	 *
	 * This component is rendered TWICE on the same page — once in the aside
	 * for the grid layout and once inside a `<details>` above the list for
	 * everything narrower, which is how `/documenta/{slug}` already hands its
	 * table of contents across that breakpoint (`.toc-inline` there). Two
	 * instances of a checkbox facet are two elements claiming one `id`, and a
	 * `<label for>` then points at whichever the parser saw first — so a tap
	 * on the mobile panel toggles a control in the hidden desktop one. An
	 * `aria-pressed` toggle needs no id and no label element, which removes
	 * the collision rather than working around it.
	 *
	 * ## Author and kind ADD, subject SUBTRACTS
	 *
	 * A document has one author and one kind, so a second choice in either can
	 * only mean "and these as well" — AND-ing them is an empty list by
	 * construction. A document carries several subjects, so a second subject has
	 * the other reading available, the documents about BOTH, and that is the one
	 * a reader narrowing 272 titles wants. The route holds the predicates; two
	 * things here follow from them.
	 *
	 * ## Which is why the counts come from two different pools
	 *
	 * `facets` arrives already reduced (see the route). An author or a kind is
	 * counted against the OTHER facets, so its number says how many documents
	 * remain if you add it to what is already chosen and the column adds up;
	 * counting those against the fully filtered set would print 0 beside every
	 * author but the selected one, which is true and useless. A subject is
	 * counted against everything, itself included: its number is exactly what
	 * survives the click, and a term sharing no document with the current
	 * selection reads 0 — which `liveTags` then drops rather than greys.
	 *
	 * ## The search box is the panel's first control, and it is not a facet
	 *
	 * It reads the whole of a document's metadata — title, author, kind,
	 * description, tags — and the route AND-s it with the three facets below.
	 * It sits at the top because it is the coarse instrument: a reader who
	 * knows a word reaches for it first, and the facets are what they narrow
	 * WITH afterwards, not instead.
	 *
	 * It also carries the weight the subject facet used to. That vocabulary
	 * was open and 232 terms wide for a day; it is a curated 58 now
	 * (`site/document-tags.json`), and the terms cut from it — every region
	 * name, every occasion word — are still reachable here, because all of
	 * them are in the descriptions this box reads.
	 *
	 * ## The subject facet is a cloud, and that is what retired the truncation
	 *
	 * 58 stacked rows is about 1,390px in a 17rem aside, so the list showed
	 * eighteen of them behind a "Show all". A cloud flows the terms inline and
	 * says each one's weight with its size, which fits the whole vocabulary in
	 * roughly 600px — more than the truncated list took, and far less than the
	 * full one. The aside already scrolls; the truncation was only ever a
	 * workaround for a list being the wrong shape for 58 short labels.
	 *
	 * **Size follows the LIVE count**, so the cloud is a picture of what is
	 * currently left rather than of the corpus, and every click resizes every
	 * chip. That is the accepted cost, and alphabetical order (set in the route)
	 * is what pays it: widths move, the sequence never does, so a term stays
	 * findable by scanning the way an index is. If the reflow ever reads badly,
	 * `CLOUD_SIZE_MAX` is the one constant to turn down — the height barely
	 * responds to it, because chip count dominates.
	 */
	import { t } from '$lib/i18n.svelte';
	import { buildTagCloud } from '$lib/tag-cloud';

	interface Props {
		authors: Facet[];
		kinds: Facet[];
		tags: Facet[];
		selected: { authors: string[]; kinds: string[]; tags: string[] };
		/** The route's search text. A PROP and not local state, because this
		 *  component is on the page twice and the two boxes are one control:
		 *  typing in the phone panel must leave the desktop one saying the same
		 *  thing when the viewport widens. */
		query: string;
		onQuery: (query: string) => void;
		onToggle: (facet: 'authors' | 'kinds' | 'tags', value: string) => void;
		onClear: () => void;
	}

	let { authors, kinds, tags, selected, query, onQuery, onToggle, onClear }: Props = $props();

	/* The query counts: "Clear" has to reach it, or a reader who typed
	   something and then pressed Clear is left looking at a list still narrowed
	   by a box they have stopped thinking about. */
	const anySelected = $derived(
		selected.authors.length + selected.kinds.length + selected.tags.length > 0 ||
			query.trim() !== ''
	);

	/** The terms still worth clicking. Subject subtracts, so a count of 0 means
	 *  the term shares no document with what is already chosen, and one selection
	 *  zeroes most of a 58-term vocabulary. Pruning matters MORE in a cloud than
	 *  it did in the list: a dead term has no weight to draw, so it would render
	 *  at the floor size and be indistinguishable from the smallest live term —
	 *  a chip that looks available and does nothing. A selected term is always
	 *  live, so filtering can never make a filter unreachable. */
	const liveTags = $derived(
		tags.filter((tag) => tag.count > 0 || selected.tags.includes(tag.value))
	);

	/* Sizes attached, order untouched — `tag-cloud.ts` says why it does not
	   sort, and the route's `tagFacets` is where the order is decided. */
	const cloudTags = $derived(buildTagCloud(liveTags));
</script>

<div class="doc-filters">
	<!-- `type="search"` for the clear affordance browsers give it; the
	     accessible name is an `aria-label` because a visible label would only
	     repeat the placeholder. `value` + `oninput` rather than `bind:`, since
	     the text belongs to the route — see `query` in Props. -->
	<input
		type="search"
		class="doc-search"
		value={query}
		oninput={(event) => onQuery(event.currentTarget.value)}
		placeholder={t('document.filter.search')}
		aria-label={t('document.filter.search')}
	/>

	<div class="filters-head">
		<h2>{t('document.filter.heading')}</h2>
		{#if anySelected}
			<button type="button" class="clear" onclick={onClear}>{t('document.filter.clear')}</button>
		{/if}
	</div>

	{#snippet facetList(
		heading: string,
		facet: 'authors' | 'kinds' | 'tags',
		items: Facet[],
		chosen: string[]
	)}
		<section class="facet">
			<h3>{heading}</h3>
			<ul>
				{#each items as item (item.value)}
					{@const isOn = chosen.includes(item.value)}
					<li>
						<button
							type="button"
							class="facet-option"
							class:on={isOn}
							aria-pressed={isOn}
							disabled={item.count === 0 && !isOn}
							onclick={() => onToggle(facet, item.value)}
						>
							<span class="facet-label">{item.label}</span>
							<span class="facet-count">{item.count}</span>
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{/snippet}

	{@render facetList(t('document.filter.author'), 'authors', authors, selected.authors)}
	{@render facetList(t('document.filter.kind'), 'kinds', kinds, selected.kinds)}

	{#if cloudTags.length > 0}
		<section class="facet">
			<h3>{t('document.filter.subject')}</h3>
			<!-- The count is the one thing size cannot carry to a reader who is
			     not looking, so it goes in a visually-hidden span INSIDE the
			     button, where it joins the label to make the accessible name
			     ("education, 34 magisterial documents"). Not `aria-hidden`, and
			     not a `title`: a tooltip is not an accessible name. -->
			<ul class="tag-cloud">
				{#each cloudTags as item (item.value)}
					{@const isOn = selected.tags.includes(item.value)}
					<li>
						<button
							type="button"
							class="tag-chip"
							class:on={isOn}
							aria-pressed={isOn}
							style:--cloud-size={`${item.fontSize}rem`}
							onclick={() => onToggle('tags', item.value)}
							>{item.label}<span class="visually-hidden"
								>, {item.count} {t('colophon.countDocuments')}</span
							></button
						>
					</li>
				{/each}
			</ul>
		</section>
	{/if}
</div>

<style>
	/* Interface face throughout, the same reason `IndexSidebarToc` names one:
	   this is navigation standing outside the reading column, not a page of
	   the book. Named rather than inherited, since the panel also renders
	   inside the content column below the grid breakpoint. */
	.doc-filters {
		font-family: var(--font-sans);
		font-size: 0.85rem;
	}

	.filters-head {
		display: flex;
		align-items: baseline;
		gap: 0.6rem;
		margin-bottom: 0.75rem;
	}

	.filters-head h2 {
		font-family: var(--font-sans);
		font-size: 0.75rem;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--color-text-muted);
		margin: 0;
	}

	.clear {
		margin-inline-start: auto;
		background: none;
		border: none;
		padding: 0;
		font: inherit;
		font-size: 0.8rem;
		color: var(--color-accent);
		cursor: pointer;
	}

	.clear:hover {
		text-decoration: underline;
	}

	.facet {
		margin-bottom: 1.25rem;
	}

	.facet h3 {
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--color-text);
		margin: 0 0 0.35rem;
	}

	.facet ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.facet-option {
		display: flex;
		align-items: baseline;
		gap: 0.5rem;
		width: 100%;
		background: none;
		border: none;
		border-radius: var(--radius-md);
		padding: 0.2rem 0.35rem;
		font: inherit;
		color: var(--color-text);
		text-align: start;
		line-height: 1.35;
		cursor: pointer;
	}

	.facet-option:hover:not(:disabled) {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	/* Same solid-accent treatment the two sidebars give their current row, so
	   "this one is on" reads the same everywhere in the chrome. Declared after
	   `:hover` so pointing at a selected row doesn't drop it back. */
	.facet-option.on {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		font-weight: 600;
	}

	.facet-option:disabled {
		color: var(--color-text-muted);
		opacity: 0.5;
		cursor: default;
	}

	.facet-label {
		flex: 1;
	}

	.facet-count {
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.facet-option.on .facet-count {
		color: inherit;
	}

	/* The panel's first control, so it is set a size up from the facet rows
	   under it — this is the one thing here a reader types into, and it has to
	   read as an entry field rather than as another row of the list. */
	.doc-search {
		width: 100%;
		box-sizing: border-box;
		margin-bottom: 1rem;
		padding: 0.35rem 0.5rem;
		font: inherit;
		font-size: 0.85rem;
		color: var(--color-text);
		background: var(--color-bg-elevated);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
	}

	.doc-search:focus-visible {
		border-color: var(--color-accent);
	}

	/* The subject cloud. Its visual language is `.doc-tag`'s over on the
	   document rows — same border, same radius, same accent fill when on — so
	   that a subject reads as the same kind of thing in the sidebar and on the
	   row it filters to. What it adds is the size, and `align-items: baseline`
	   is what keeps mixed sizes sitting on a line rather than looking like a
	   ransom note. */
	.tag-cloud {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.3rem 0.35rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.tag-chip {
		font-family: var(--font-sans);
		/* The repo's idiom for a size that scales but must stay legible. The
		   scale's own floor is the same number; this is the guarantee, and if
		   the token ever moves the token wins. */
		font-size: max(var(--font-size-min), var(--cloud-size));
		line-height: 1.3;
		/* em, not rem: padding and corner have to grow with the chip they are
		   on, or the small terms end up looking like buttons and the large ones
		   like text. */
		padding: 0.2em 0.5em;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-muted);
		cursor: pointer;
	}

	.tag-chip:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.tag-chip.on {
		background: var(--color-accent);
		border-color: var(--color-accent);
		color: var(--color-accent-contrast);
	}

	/* Forced colors strips the accent fill, and size is not a selection
	   signal — so without this the one chip that is ON is the one thing on the
	   panel with no way to say so. `Highlight` and not `Mark`: this is a chosen
	   item, not a search hit. */
	@media (forced-colors: active) {
		.tag-chip.on {
			forced-color-adjust: none;
			background: Highlight;
			color: HighlightText;
			border-color: HighlightText;
		}
	}

	/* Sizes change on every click, so the reflow is worth easing. Opt-in, the
	   pattern the rest of the codebase uses. */
	@media (prefers-reduced-motion: no-preference) {
		.tag-chip {
			transition:
				font-size 140ms ease,
				background-color 120ms ease,
				border-color 120ms ease,
				color 120ms ease;
		}
	}
</style>
