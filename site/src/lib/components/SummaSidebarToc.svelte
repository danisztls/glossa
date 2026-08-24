<script lang="ts">
	/**
	 * The Summa reader's sidebar: where this question sits in its part, and
	 * what is inside it.
	 *
	 * A SEPARATE COMPONENT FROM `StructureSidebarToc`, for the reason
	 * `summaToc.ts` states at length: the Summa's outline is a flat
	 * `SummaNode` list, not the `StructureNode` tree that component walks, and
	 * the two would only meet by inventing bounds the corpus does not carry.
	 * What IS shared is the visual language -- `.sidebar-toc-heading`,
	 * `.sidebar-toc-list` and `.kind-label` are app.css classes both use, so
	 * the two sidebars look like one feature rather than two.
	 *
	 * ONLY THE READER'S OWN BRANCH EXPANDS, the same rule and the same reason
	 * as the structure sidebar: II-II carries 189 questions, and rendering all
	 * of them under all ten treatises would bury the handful that say where
	 * the reader actually is. So a treatise lists its questions only when the
	 * current question is one of them, and the current question lists its
	 * articles only when it is the current one. Everything collapsed is still
	 * one click away, because every treatise row is itself a link to its first
	 * question -- no disclosure state, and it works with JavaScript off.
	 *
	 * THE ARTICLES ARE FRAGMENTS, NOT PAGES (`/summa/ii-ii/184#a3`), so their
	 * rows are in-page anchors while everything above them is a route. That
	 * asymmetry is the addressing scheme showing through, not an inconsistency.
	 */
	import { browser } from '$app/environment';
	import type { SummaNode } from '$lib/types';
	import type { SummaQuestionMeta } from '$lib/corpus-index';
	import { summaTocGroups } from './summaToc';
	import { summaTitleFor } from '$lib/corpus';
	import { summaHeadingTitle, summaQuestionLabel } from '$lib/summa-titles';

	interface Props {
		/** This part's headings, `summaHeadingsForPart`'s output. Empty under
		    the Latin edition, which prints none — see `summaToc.ts`. */
		headings: SummaNode[];
		/** This part's questions, in number order. */
		questions: SummaQuestionMeta[];
		/** The question the reader is on. */
		currentN: number;
		/** Its article numbers, from the loaded question rather than the index,
		    so the rows match the text on the page in the edition actually
		    shown. Empty for the two article-less questions (I q. 71, q. 72). */
		articles: number[];
		/** `i`, `i-ii`, … — the part's URL slug, for building question hrefs. */
		partSlug: string;
		/** The part these questions belong to, for looking a borrowed title up
		    by address. */
		part: string;
		/** The edition being read, so a title borrowed from another one can be
		    told apart from this edition's own. */
		lang: string;
		/** Visible heading and the `<nav>`'s accessible name, one string doing
		    both jobs exactly as in `StructureSidebarToc`. */
		heading: string;
		/** The ABBREVIATED question and article labels ("Q", "Art."), passed in
		    rather than read from i18n here so this component stays a pure view
		    of what it is handed. Abbreviated because the word is repeated on
		    every row of a 17rem column and says nothing the position does not. */
		questionLabel: string;
		articleLabel: string;
		/** Tooltip for a borrowed title, with `{lang}` still to substitute. */
		borrowedTitleLabel: string;
		/** Language tag -> display name, for that tooltip. */
		languageName: (lang: string) => string;
	}

	let {
		headings,
		questions,
		currentN,
		articles,
		partSlug,
		part,
		lang,
		heading,
		questionLabel,
		articleLabel,
		borrowedTitleLabel,
		languageName
	}: Props = $props();

	/**
	 * The row's title and where it came from. Under Latin every one of these
	 * is borrowed, because the Leonine text prints no question titles at all
	 * (`summaTitleFor`) -- without this the whole sidebar would be a column of
	 * bare numbers.
	 */
	function titleOf(n: number) {
		return summaTitleFor(lang, part, n);
	}

	const groups = $derived(summaTocGroups(headings, questions));

	const CURRENT_ID = 'summa-toc-current';
	const HEADING_ID = 'summa-toc-heading';

	/** Whether a group contains the reader's current question. */
	function holdsCurrent(group: { questions: SummaQuestionMeta[] }): boolean {
		return group.questions.some((q) => q.n === currentN);
	}

	// Scrolls the current row into the aside's own scroll container on
	// arrival, matching `StructureSidebarToc`. Browser-only for the same
	// belt-and-braces reason stated there.
	$effect(() => {
		if (!browser) return;
		// Read `currentN` so the effect re-runs on navigation.
		void currentN;
		document.getElementById(CURRENT_ID)?.scrollIntoView({ block: 'nearest' });
	});
</script>

<nav aria-labelledby={HEADING_ID} data-link-preview="off">
	<h2 id={HEADING_ID} class="sidebar-toc-heading">{heading}</h2>

	<ol class="sidebar-toc-list toc-level">
		{#each groups as group, gi (group.title ?? `leading-${gi}`)}
			{@const onPath = holdsCurrent(group)}
			{@const first = group.questions[0]}
			<li class:on-path={onPath}>
				{#if group.title !== null}
					{#if first}
						<a href={`/summa/${partSlug}/${first.n}`} class="treatise">
							{summaHeadingTitle(group.title)}
						</a>
					{:else}
						<!-- A heading the source prints but no question opens on.
						     Kept as text rather than dropped — see `summaToc.ts`. -->
						<span class="treatise unlinked">{summaHeadingTitle(group.title)}</span>
					{/if}
				{/if}

				<!-- An untitled leading group has no row of its own, so its
				     questions render at the top level. That is also the whole
				     Latin edition's shape: one group, no heading, a flat list. -->
				{#if group.title === null || onPath}
					<ol class="sidebar-toc-list toc-level questions">
						{#each group.questions as q (q.n)}
							{@const isCurrent = q.n === currentN}
							{@const named = titleOf(q.n)}
							<li>
								<a
									id={isCurrent ? CURRENT_ID : undefined}
									href={`/summa/${partSlug}/${q.n}`}
									class:current={isCurrent}
									aria-current={isCurrent ? 'page' : undefined}
								>
									<span class="kind-label">{questionLabel}{q.n}</span>
									{#if named}
										<span
											class="q-title"
											class:borrowed={named.borrowed}
											lang={named.borrowed ? named.lang : undefined}
											title={named.borrowed
												? borrowedTitleLabel.replace('{lang}', languageName(named.lang))
												: undefined}>{summaQuestionLabel(named.title)}</span
										>
									{/if}
								</a>

								{#if isCurrent && articles.length > 0}
									<ol class="sidebar-toc-list toc-level articles">
										{#each articles as a (a)}
											<li><a href={`#a${a}`}>{articleLabel} {a}</a></li>
										{/each}
									</ol>
								{/if}
							</li>
						{/each}
					</ol>
				{/if}
			</li>
		{/each}
	</ol>
</nav>

<style>
	nav {
		font-size: 0.85rem;
	}

	/* Same compounding indent as `StructureSidebarToc` — one rule, applied per
	   level of real DOM nesting, so no depth counter is needed anywhere. */
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
		border-radius: 0.3rem;
		line-height: 1.35;
	}

	.treatise {
		font-weight: 700;
	}

	.unlinked {
		color: var(--color-text-muted);
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
	}

	.on-path > .treatise {
		color: var(--color-accent);
	}

	/* Declared after `.on-path` so the solid highlight wins on the one row
	   that is both. */
	a.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		font-weight: 600;
	}

	/* The number reads as a label attached to the title, not as its first
	   word — same treatment `.kind-label` gets in the structure sidebar. */
	.kind-label {
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.72em);
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--color-text-muted);
		margin-inline-end: 0.4em;
		white-space: nowrap;
	}

	/* `.kind-label` sets its own colour, so it would otherwise stay muted on
	   top of the solid accent background — a near-miss rather than a contrast
	   pair, since that token was never chosen against this one. */
	a.current .kind-label {
		color: inherit;
	}

	/*
	 * A title this edition does not itself print, shown so the sidebar is not
	 * a column of bare numbers (`summaTitleFor`). Set apart by weight and a
	 * dotted underline rather than by a badge: it is an aid to finding the
	 * right question, not a second thing to read, and the `lang` attribute on
	 * the element is what actually tells a screen reader it changed language.
	 */
	.q-title.borrowed {
		font-style: italic;
		text-decoration: underline dotted;
		text-decoration-color: var(--color-border);
		text-underline-offset: 0.15em;
	}

	/* The articles are in-page anchors within the question already open, so
	   they read as its contents rather than as more navigation. */
	.articles {
		color: var(--color-text-muted);
	}

	.articles a {
		color: var(--color-text-muted);
	}
</style>
