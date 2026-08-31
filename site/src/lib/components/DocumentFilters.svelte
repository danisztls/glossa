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
	 * ## The counts are computed against the OTHER facets, not against this one
	 *
	 * `facets` arrives already reduced that way (see the route). A count
	 * beside "Pius XII" says how many documents remain if you add him to the
	 * authors you have already chosen — so within one facet the numbers add
	 * up, and a value that would empty the list reads 0 rather than looking
	 * available. Counting against the fully filtered set instead would show 0
	 * beside every author but the one already selected, which is true and
	 * useless.
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
	 * was open and 232 terms wide for a day; it is a curated 53 now
	 * (`site/document-tags.json`), and the terms cut from it — every region
	 * name, every occasion word — are still reachable here, because all of
	 * them are in the descriptions this box reads. `VISIBLE_TAGS` is what is
	 * left of the tail problem, and at 53 it is a convenience rather than a
	 * necessity: a selected term stays visible past the cut, because a filter
	 * you cannot see is a filter you cannot turn off.
	 */
	import { t } from '$lib/i18n.svelte';

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

	/** How many subject terms the panel shows before "Show all". Enough that
	 *  the head of the distribution — the terms that actually partition the
	 *  corpus — is all there, short enough that the panel is still a panel. */
	const VISIBLE_TAGS = 18;

	let tagsExpanded = $state(false);

	/* The query counts: "Clear" has to reach it, or a reader who typed
	   something and then pressed Clear is left looking at a list still narrowed
	   by a box they have stopped thinking about. */
	const anySelected = $derived(
		selected.authors.length + selected.kinds.length + selected.tags.length > 0 ||
			query.trim() !== ''
	);

	const shownTags = $derived.by(() => {
		if (tagsExpanded) return tags;
		const head = tags.slice(0, VISIBLE_TAGS);
		// A selected term below the cut stays on screen — see the docblock.
		const missing = tags.filter((tag) => selected.tags.includes(tag.value) && !head.includes(tag));
		return [...head, ...missing];
	});

	const tagsHidden = $derived(tags.length - shownTags.length);
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

	{#if tags.length > 0}
		<section class="facet">
			<h3>{t('document.filter.subject')}</h3>
			<ul>
				{#each shownTags as item (item.value)}
					{@const isOn = selected.tags.includes(item.value)}
					<li>
						<button
							type="button"
							class="facet-option"
							class:on={isOn}
							aria-pressed={isOn}
							disabled={item.count === 0 && !isOn}
							onclick={() => onToggle('tags', item.value)}
						>
							<span class="facet-label">{item.label}</span>
							<span class="facet-count">{item.count}</span>
						</button>
					</li>
				{/each}
			</ul>
			{#if tagsHidden > 0 || tagsExpanded}
				<button type="button" class="more" onclick={() => (tagsExpanded = !tagsExpanded)}>
					{tagsExpanded ? t('document.filter.showFewer') : t('document.filter.showAll')}
					{#if !tagsExpanded}<span class="facet-count">{tagsHidden}</span>{/if}
				</button>
			{/if}
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

	.more {
		display: flex;
		align-items: baseline;
		gap: 0.4rem;
		margin-top: 0.2rem;
		padding: 0.2rem 0.35rem;
		background: none;
		border: none;
		font: inherit;
		font-size: 0.8rem;
		color: var(--color-accent);
		cursor: pointer;
	}

	.more:hover {
		text-decoration: underline;
	}
</style>
