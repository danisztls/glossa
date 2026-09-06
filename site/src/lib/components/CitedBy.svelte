<script lang="ts">
	/**
	 * The "Cited in" panel: one row per address in the work being read, each
	 * carrying the places elsewhere in the corpus that cite it.
	 *
	 * ONE COMPONENT BECAUSE THERE IS ONE SHAPE, and it took two callers to see
	 * it. The Bible chapter page built this first, over verses; the document
	 * page needs the identical thing over sections, and the CCC page will need
	 * it over paragraphs. What varies between them is only what an address is
	 * CALLED and whether it can be jumped to — the grouping rule (a work's
	 * name said once, its references beside it), the two-column alignment, and
	 * the quiet-label-loud-numbers treatment are the same argument every time.
	 * A second copy of it would be the fourth `blockProse` (see
	 * `scripts/build-xrefs.mjs`), and this one is CSS, which drifts fastest.
	 *
	 * GROUPING RATHER THAN REPEATING is what keeps a heavily-cited address
	 * readable. Matthew 25 draws 237 document references across its verses and
	 * Lumen Gentium §22 is cited by 26 places; naming each reference's work
	 * separately would be most of the panel.
	 */
	import { SvelteSet } from 'svelte/reactivity';
	import { CITED_BY_FAMILIES, type CitedByFamily, type CitedByRow } from '$lib/cited-by';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/** The panel's own heading — `t('refs.citedIn')` at every call site so
		 *  far, but passed rather than read so no caller has to agree with any
		 *  other on what this panel is called. */
		heading: string;
		/** Unique within the page: two panels on one page would otherwise share
		 *  an `aria-labelledby` target. */
		headingId?: string;
		rows: CitedByRow[];
	}

	let { heading, headingId = 'cited-in-heading', rows }: Props = $props();

	/**
	 * The families this panel actually holds, in the library's order.
	 *
	 * DERIVED FROM THE ROWS AND NOT FIXED, because a button that filters
	 * nothing is a button that teaches the reader the filter does nothing: a
	 * Catechism paragraph cited only by the Summa would otherwise offer six
	 * toggles with one outcome between them.
	 */
	const families = $derived(
		CITED_BY_FAMILIES.filter((family) =>
			rows.some((row) => row.sources.some((source) => source.family === family.key))
		)
	);

	/**
	 * COMMENTARY STARTS SWITCHED OFF, and it is the only family that does.
	 *
	 * It is 36,995 of the reverse index's 84,775 citers — more than the
	 * Catechism, the documents and the Summa together — so a heavily annotated
	 * verse answers "who cites this" mostly with one edition's footnotes, which
	 * is not what the panel is opened for. It is also the one family already on
	 * the page: the reader's own notes hang off the verses above under their
	 * own marks, so a row here repeats what is a scroll away. Switched on, it
	 * stays on for the next chapter.
	 */
	const HIDDEN_BY_DEFAULT: readonly CitedByFamily[] = ['commentary'];

	/**
	 * Which families are switched OFF, rather than which are on.
	 *
	 * Storing the off side is what makes the filter additive-free: a family
	 * appearing in the corpus later shows up without anyone having opted into
	 * it, and the one default that is not "on" is written down in one place
	 * rather than implied by an omission. Kept across navigations within a
	 * route — a reader who has just hidden the magisterium means it for the
	 * next chapter too, not only for this one.
	 */
	let hidden = $state(new SvelteSet<CitedByFamily>(HIDDEN_BY_DEFAULT));

	/**
	 * THE CONTROL IS DRAWN EXACTLY WHEN PRESSING IT WOULD CHANGE SOMETHING,
	 * and the filter runs exactly when the control is drawn — so the panel can
	 * never hide a row behind a button that is not on the page. A lone family
	 * needs no filter unless it is the one that starts off, in which case it
	 * needs the button most: without it a chapter annotated and cited by
	 * nothing else would show an empty panel with no way to open it.
	 */
	const filtering = $derived(
		families.length > 1 || families.some((family) => hidden.has(family.key))
	);

	const shown = $derived(
		filtering
			? rows
					.map((row) => ({
						...row,
						sources: row.sources.filter((source) => !hidden.has(source.family))
					}))
					.filter((row) => row.sources.length > 0)
			: rows
	);

	const total = $derived(
		shown.reduce((sum, row) => sum + row.sources.reduce((n, s) => n + s.refs.length, 0), 0)
	);

	function toggle(family: CitedByFamily) {
		if (hidden.has(family)) hidden.delete(family);
		else hidden.add(family);
	}
</script>

<section class="cited-in" aria-labelledby={headingId}>
	<h2 id={headingId} class="label-micro">
		{heading}
		<span class="count">{total}</span>
	</h2>
	{#if filtering}
		<!--
			Toggles, not a single-choice control: the reader is narrowing a list
			they can already see, and narrowing it to two shelves is as ordinary
			as narrowing it to one. `aria-pressed` carries the state, which is
			why each button keeps one label in both — the same rule the plate
			zoom follows.
		-->
		<div class="filters" role="group" aria-labelledby={headingId}>
			{#each families as family (family.key)}
				<button
					type="button"
					class="filter"
					aria-pressed={!hidden.has(family.key)}
					onclick={() => toggle(family.key)}>{t(family.labelKey)}</button
				>
			{/each}
		</div>
	{/if}
	<ul>
		{#each shown as row (row.key)}
			<li>
				<span class="address">
					{#if row.href}
						<a href={row.href}>{row.label}</a>
					{:else if row.note}
						<span class="address-absent" title={row.note}>{row.label}</span>
					{:else}
						{row.label}
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
								>({#each source.refs as ref, i (ref.key)}{#if i > 0}<span
											class="sep"
											aria-hidden="true">·</span
										><wbr />{/if}<a href={ref.href}>{ref.label}</a>{/each})</span
							>
						</span>
					{/each}
				</span>
			</li>
		{/each}
	</ul>
</section>

<style>
	.cited-in {
		margin-top: 2.5rem;
		padding-top: 1rem;
		border-top: 1px solid var(--color-border);
		font-size: 0.85rem;
	}

	/* Our label for the panel, not a heading the work wrote — interface face,
	   like every other uppercase letterspaced label. */
	.cited-in h2 {
		margin: 0 0 0.6rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.count {
		font-variant-numeric: tabular-nums;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0 0.3rem;
		letter-spacing: 0;
	}

	.filters {
		display: flex;
		flex-wrap: wrap;
		gap: 0.3rem;
		margin: 0 0 0.7rem;
	}

	/* NOT the solid-accent `.on` the sidebars and `/documenta`'s facets use,
	   and the difference is which way the default runs. There one row out of
	   many is current, so the accent marks the exception; here every family
	   starts switched on, so that treatment would paint the whole row solid
	   and make the loudest thing in an apparatus footer the control rather
	   than the citations. On is the plain state; off is what is marked. */
	.filter {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0.1rem 0.5rem;
		background: none;
		font: inherit;
		font-size: 0.8rem;
		color: var(--color-text);
		cursor: pointer;
	}

	.filter:hover {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	/* Switched off: still legible, so the reader can see what they have put
	   away and press it again — greying it to the point of disappearing would
	   make the filter a one-way door on a touch screen. */
	.filter[aria-pressed='false'] {
		color: var(--color-text-muted);
		border-style: dashed;
		text-decoration: line-through;
		text-decoration-thickness: 1px;
	}

	ul {
		list-style: none;
		margin: 0;
		padding: 0;
		display: grid;
		/* The address in a fixed column so the reference lists line up, which
		   is what makes a long concordance scannable rather than a wall. */
		grid-template-columns: max-content minmax(0, 1fr);
		gap: 0.3rem 0.9rem;
	}

	li {
		display: contents;
	}

	.address {
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	.address-absent {
		cursor: help;
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	/* Groups are laid out as units so one work's references sit together. A
	   work's name can never end a line with its own references orphaned onto
	   the next one, whatever wraps: there is no whitespace between the label
	   and the `(` that follows it, so there is nothing to break on. */
	.sources {
		display: flex;
		flex-wrap: wrap;
		gap: 0.15rem 0.7rem;
	}

	/* A group breaks only at the `<wbr />` after each separator, so a work's
	   name and its first reference stay together (there is no whitespace
	   between them to break on) while a long run of numbers wraps instead of
	   running off a phone's right edge. `nowrap` here was the overflow: the
	   CCC cites some Bible verses twenty times, and that is one line. */
	.source {
		font-variant-numeric: tabular-nums;
	}

	/* The work's name, said once per group. Quiet relative to the numbers
	   beside it: those are the links, this is the label that tells you what
	   they are. */
	.source-label {
		color: var(--color-text-muted);
	}

	/* Only labels that actually shorten something get the affordance, so the
	   dotted underline means "there is more to read here" rather than
	   decorating every row. Same signal as `.address-absent` above and
	   `SiglumGloss`'s `.siglum-trigger` -- which is where this rule was applied
	   on 2026-09-02, `RefText` having drawn it over every unlinkable segment
	   until then. Note what those two still are and this is not: a `title`,
	   which never fires on a tap. */
	.source-label.named {
		cursor: help;
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	.refs {
		margin-inline-start: 0.3em;
	}

	.sep {
		margin-inline: 0.3em;
		color: var(--color-text-muted);
	}

	a {
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}
</style>
