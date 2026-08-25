<!--
	Previous/next along a work's own sequence — the last thing on every reading
	page that has a neighbour: Bible chapter, CCC paragraph, Compendium
	question, Summa question, prayer.

	SIX COPIES OF THIS EXISTED, differing only in the href shape and the words.
	Each rebuilt the same skeleton, including the one part of it that is not
	obvious and that every copy had got right by transcription rather than by
	knowing why: the `<span></span>` standing in for an absent `prev`. Without
	it, `.unit-nav`'s `justify-content: space-between` puts a lone `next` on the
	LEFT, so the first chapter of a book advertises its "next" where every other
	page shows its "previous" and the link appears to move as you read. The
	placeholder is load-bearing layout, not markup noise, and it now lives in
	one place where that can be said once.

	`detail` is the number or title printed after the label ("· ¶2461",
	"· The Angelus"). Optional because the Bible has none: a chapter's
	neighbour is named by the picker and the breadcrumb above, and repeating
	"Genesis 2" here said nothing the reader did not just read.

	The ARROWS ARE FIXED TO THE VISUAL EDGES, not to `prev`/`next`, and that is
	deliberately not logical-property behaviour: `←` means "back" beside a
	link on the left in every script this site is published in, including the
	right-to-left one, because the reading order of the PAGE is what a nav row
	sits in, not the reading order of a sentence. `.unit-nav` itself is a
	flex row and so already mirrors under `dir="rtl"`, which puts `prev` on the
	right — where an RTL reader looks for it — with its arrow pointing there.
-->
<script lang="ts">
	export interface UnitNavLink {
		href: string;
		/** "Previous chapter", "Next question" — already translated. */
		label: string;
		/** The neighbour's own number or title, printed after a separator. */
		detail?: string;
	}

	interface Props {
		prev?: UnitNavLink;
		next?: UnitNavLink;
		/** Names the landmark: "Chapter navigation", "Prayer navigation". */
		ariaLabel: string;
	}

	let { prev, next, ariaLabel }: Props = $props();
</script>

<nav class="unit-nav" aria-label={ariaLabel}>
	{#if prev}
		<a href={prev.href} rel="prev">
			&larr; {prev.label}{#if prev.detail}<span class="detail"> · {prev.detail}</span>{/if}
		</a>
	{:else}
		<!-- Keeps `next` at the right-hand edge — see the docblock. -->
		<span></span>
	{/if}
	{#if next}
		<a href={next.href} rel="next">
			{next.label}{#if next.detail}<span class="detail"> · {next.detail}</span>{/if} &rarr;
		</a>
	{/if}
</nav>

<style>
	/* `.unit-nav` and its links are app.css's, shared with everything else that
	   ends a reading page. Only the neighbour's own name is this component's,
	   and only because a long prayer title should not push the arrow off the
	   line. */
	.detail {
		white-space: nowrap;
	}
</style>
