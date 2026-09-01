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
		/** A quiet second line of type beside the label, for a fact about the
		 *  VALUE rather than about the filtering — the author facet fills it
		 *  with the pontificate's years. Optional because only that facet has
		 *  one: a kind and a subject are their own whole description. */
		note?: string;
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
							{#if item.note}
								<!-- `dir="ltr"` because the string is entirely neutral
								     characters and digits: in an Arabic or Hebrew interface
								     the bidi algorithm resolves the dash between two number
								     runs to the paragraph direction and prints 1903-1878. -->
								<span class="facet-note" dir="ltr">{item.note}</span>
							{/if}
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
							style:--cloud-weight={item.weight}
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
		/* Only ever seen between a label and its note — the count takes the end
		   of the row with an auto margin — so it is set for that pair, which
		   has to read as one thing. */
		gap: 0.4rem;
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

	/* Deliberately NOT `flex: 1`. The note follows the label and has to read
	   as part of it, so the label takes the width it needs and no more, and
	   the count claims the end of the row on its own. */
	.facet-label {
		min-width: 0;
	}

	/* Smaller and muted, so the row is read as a name first. Tabular figures
	   because the years then line up down the column, which is most of what
	   makes a list of twelve reigns legible at a glance.

	   DELIBERATELY BELOW `--font-size-min`, which is the only place on the
	   site that is. The floor is set for prose, and this is nine tabular
	   digits and a dash with no lowercase in it — the shapes that survive
	   being set small — sitting beside a name that carries the row. Read it
	   as the size the annotation has to be to stay an annotation: at the
	   floor it competed with the count, which is a different fact. */
	.facet-note {
		font-variant-numeric: tabular-nums;
		font-size: 0.65rem;
		/* A step past `--color-text-muted`, which the count beside it uses, so
		   the two secondary facts on the row are not the same grey.

		   MIXED TOWARD `--color-bg` AND NOT TOWARD A LITERAL, for the reason
		   the tag cloud mixes between two tokens: in dark mode the background
		   is the dark one, so fading toward it is fading in every theme
		   rather than in half of them.

		   90% IS A CEILING, NOT A TASTE. At this size WCAG AA wants 4.5:1,
		   and the token starts at 5.78:1 in the light theme — 90% spends
		   almost all of that (4.63:1) and 88% is already under. Sepia is the
		   exception and it is not this rule's fault: `--color-text-muted`
		   there is 4.45:1 before anything is mixed into it, so every muted
		   string in that theme is already below the line. */
		color: color-mix(in srgb, var(--color-text-muted) 90%, var(--color-bg));
		white-space: nowrap;
	}

	.facet-count {
		margin-inline-start: auto;
		font-variant-numeric: tabular-nums;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}

	.facet-option.on .facet-count,
	.facet-option.on .facet-note {
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

	/* The subject cloud, and it is UNBORDERED on purpose. 58 outlined pills is
	   58 boxes, and at that count the boxes are what the eye reads first — the
	   chrome competes with the words it is drawn around, which is the opposite
	   of what a cloud is for. Without them the terms read as a run of words
	   whose size is the only thing being said.

	   So it rhymes with the facet ROWS above it rather than with `.doc-tag` on
	   the document rows: same hover (accent on an elevated ground), same solid
	   accent when on. The row chips keep their borders, because three or four
	   of them sitting inside a paragraph do need an edge to be picked out of
	   it — 58 in a column do not.

	   `align-items: baseline` is what keeps the mixed sizes sitting on a line
	   rather than looking like a ransom note. */
	.tag-cloud {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		gap: 0.15rem 0.25rem;
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
		line-height: 1.35;
		/* em, not rem: the padding has to grow with the chip it is on, both so
		   the selected fill sits evenly around any size and so the space
		   between two words scales with them. It is most of the separation
		   now that no border draws an edge, which is why `gap` is small. */
		padding: 0.14em 0.36em;
		border: none;
		border-radius: var(--radius-sm);
		background: none;
		/* THE SECOND CHANNEL, and it is free where the first one is not. The
		   size range cannot widen much without the cloud outgrowing the panel
		   around it, so a 1.27x spread is all the weight size can carry across
		   58 terms; colour adds a whole axis and costs no space at all. Both
		   are read off the same `weight`, so they cannot disagree.

		   Mixed BETWEEN TWO TOKENS rather than toward a literal black, which is
		   what keeps it true in every theme: in dark mode `--color-text` is the
		   light one, so "heavier is closer to the text colour" still means
		   heavier stands out. Toward black it would have meant heavier
		   DISAPPEARS. */
		color: color-mix(
			in srgb,
			var(--color-text) calc(var(--cloud-weight) * 100%),
			var(--color-text-muted)
		);
		cursor: pointer;
	}

	/* With no border there is nothing to say "this is a control" at rest, so
	   the hover has to do it — the same ground the facet rows use, so pointing
	   at either reads the same. `:focus-visible` is the global outline in
	   `base.css`, which survives the border going. */
	.tag-chip:hover {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	.tag-chip.on {
		background: var(--color-accent);
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
		}
	}

	/* Sizes change on every click, so the reflow is worth easing. Opt-in, the
	   pattern the rest of the codebase uses. */
	@media (prefers-reduced-motion: no-preference) {
		.tag-chip {
			transition:
				font-size 140ms ease,
				background-color 120ms ease,
				color 120ms ease;
		}
	}
</style>
