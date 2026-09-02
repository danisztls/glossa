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
	import type { CitedByRow } from '$lib/cited-by';

	interface Props {
		/** The panel's own heading — `t('refs.citedIn')` at every call site so
		 *  far, but passed rather than read so the component needs no i18n. */
		heading: string;
		/** Unique within the page: two panels on one page would otherwise share
		 *  an `aria-labelledby` target. */
		headingId?: string;
		rows: CitedByRow[];
	}

	let { heading, headingId = 'cited-in-heading', rows }: Props = $props();

	const total = $derived(
		rows.reduce((sum, row) => sum + row.sources.reduce((n, s) => n + s.refs.length, 0), 0)
	);
</script>

<section class="cited-in" aria-labelledby={headingId}>
	<h2 id={headingId} class="label-micro">
		{heading}
		<span class="count">{total}</span>
	</h2>
	<ul>
		{#each rows as row (row.key)}
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
