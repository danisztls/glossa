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

	THE VISIBLE LABEL IS ONE WORD -- "Next", "Zurück" -- and the same word on
	every route, because the row it sits in cannot shrink. `.unit-nav` is a
	flex row of two links that no longer say which of them is which, and
	nothing in the stylesheet caps a page's horizontal scroll, so a label pair
	wider than the viewport scrolled the whole document sideways rather than
	looking cramped. Romanian's Compendium was the worst of them:
	"Întrebarea precedentă" and "Întrebarea următoare" are 41 characters plus
	two icons before the content column's own padding. The CCC route had
	printed the bare word since it was written; this is the other four
	catching up with it.

	WHAT IS BEING STEPPED THROUGH still reaches the reader, as `full` -- the
	whole phrase, "Next question 43", "Previous prayer · The Angelus" -- on
	both `aria-label` and `title`. It is required rather than optional
	because `aria-label` REPLACES a link's text for a screen reader: a `full`
	that omitted the number would announce less than the visible row prints.
	So the caller composes it out of the same per-route noun it used to print,
	and those dictionary strings are now read by assistive technology and a
	tooltip and nothing else.

	`detail` is the number printed after the label ("· ¶2461"). Optional
	because the Bible has none: a chapter's neighbour is named by the picker
	and the breadcrumb above, and repeating "Genesis 2" here said nothing the
	reader did not just read. The PRAYERS route dropped its title from here
	for a harder reason -- see the `.detail` rule below.

	The ARROWS ARE FIXED TO THE VISUAL EDGES, not to `prev`/`next`, and that is
	deliberately not logical-property behaviour: an arrow pointing left means
	"back" beside a link on the left in every script this site is published in,
	including the right-to-left one, because the reading order of the PAGE is
	what a nav row sits in, not the reading order of a sentence. `.unit-nav`
	itself is a flex row and so already mirrors under `dir="rtl"`, which puts
	`prev` on the right — where an RTL reader looks for it — and the `:dir(rtl)`
	rule below turns its arrow to point there.

	THEY WERE THE CHARACTERS `&larr;`/`&rarr;` until they became `Icon`s, and
	the mirroring is the part of that swap worth stating. Those characters are
	`Bidi_Mirrored`, so the browser was flipping them for free inside an RTL
	row; an `<svg>` is a box, not a character, and nothing flips it. Hence the
	explicit rule — without it the Arabic interface would keep pointing "back"
	at the page's outward edge. Drawing them instead of typing them is what
	makes the arrow here the same mark ToTopButton draws (`arrow-up`, the same
	shape rotated) rather than whichever glyph each reader's font happens to
	carry for U+2190 — EB Garamond has none, so the arrows were already falling
	back to a different family from the words beside them.

	NO LINK PREVIEW HERE. `data-link-preview="off"` on the nav opts both links
	out of the hover overlay, the same way every table of contents on the site
	does. `LinkPreview`'s own note has the rule: a preview is worth a peek at a
	destination the reader is deciding ABOUT, and these two are not that — a
	reader at the foot of §1868 who reaches for "Next · ¶1869" has already
	decided, and the panel that opens is then something to wait out rather than
	something to read. Worse at the foot of a page than anywhere else, too:
	`computePanelPosition` puts the overlay ABOVE an anchor with no room below
	it, so previewing the next paragraph covered the one just read.
-->
<script lang="ts">
	import Icon from './Icon.svelte';

	export interface UnitNavLink {
		href: string;
		/** The one word printed — `t('unitNav.next')`. Same on every route. */
		label: string;
		/** The neighbour's own number, printed after a separator. */
		detail?: string;
		/**
		 * The whole phrase, naming both what is stepped through and which one
		 * — "Next question 43". Reaches `aria-label` and `title`, never the
		 * page, and must include whatever `detail` prints.
		 */
		full: string;
	}

	interface Props {
		prev?: UnitNavLink;
		next?: UnitNavLink;
		/** Names the landmark: "Chapter navigation", "Prayer navigation". */
		ariaLabel: string;
	}

	let { prev, next, ariaLabel }: Props = $props();
</script>

<nav class="unit-nav" aria-label={ariaLabel} data-link-preview="off">
	{#if prev}
		<a href={prev.href} rel="prev" aria-label={prev.full} title={prev.full}
			><Icon name="arrow-left" class="unit-nav-arrow back" />{prev.label}{#if prev.detail}<span
					class="detail">&nbsp;· {prev.detail}</span
				>{/if}</a
		>
	{:else}
		<!-- Keeps `next` at the right-hand edge — see the docblock. -->
		<span></span>
	{/if}
	{#if next}
		<a href={next.href} rel="next" aria-label={next.full} title={next.full}
			>{next.label}{#if next.detail}<span class="detail">&nbsp;· {next.detail}</span>{/if}<Icon
				name="arrow-right"
				class="unit-nav-arrow onward"
			/></a
		>
	{/if}
</nav>

<style>
	/* `.unit-nav` and its links are app.css's, shared with everything else that
	   ends a reading page. Only the neighbour's own number is this
	   component's.

	   `nowrap` IS WHY THE PRAYER TITLE LEFT. A flex item cannot shrink below
	   its min-content, and this rule makes the whole of `detail` one
	   unbreakable word, so the Portuguese prayers route printed "Oração de
	   «Adeus ao Altar», antes de deixar a Igreja após a liturgia" as 67
	   characters that no viewport could contain and no label shortening could
	   help. The title is now `full`'s business alone. What is left here is
	   numbers, which is what the rule was always for: "¶1868" and "· 43" have
	   nowhere to break anyway, and the point is that they do not break from
	   the separator that introduces them.

	   The separator's leading space is `&nbsp;` because Svelte trims the
	   whitespace at the start of an element's children, and the plain space
	   written here since the six copies were merged never survived: the row
	   read "Previous· ¶1867". `nowrap` above would have kept an ordinary space
	   from breaking, so this is about the space EXISTING, not about where it
	   may break. */
	.detail {
		white-space: nowrap;
	}

	/* The links carry no underline (app.css), so putting one back is the whole
	   hover state — the same affordance every other link on the site already
	   has by default. `:focus-visible` gets it too, on top of the global focus
	   ring rather than instead of it. There is no colour to shift to as well:
	   `--color-accent` and `--color-link` are the same value in all four
	   themes, so an accent rule here would compile to nothing visible. */
	.unit-nav a:hover,
	.unit-nav a:focus-visible {
		text-decoration: underline;
		text-underline-offset: 0.2em;
	}

	/* Sized and dropped the way CopyrightNotice sizes its `.ext` glyph, and for
	   the same reason: an inline <svg> sits its BOX on the baseline, and
	   lucide's 24x24 viewBox insets the drawn mark, so a 1em icon floats above
	   the x-height of the words beside it. */
	.unit-nav a :global(.unit-nav-arrow) {
		width: 0.9em;
		height: 0.9em;
		vertical-align: -0.09em;
	}

	.unit-nav a :global(.back) {
		margin-inline-end: 0.4em;
	}

	.unit-nav a :global(.onward) {
		margin-inline-start: 0.4em;
	}

	/* See the docblock: the row mirrors, so the arrows must too. */
	.unit-nav a :global(.unit-nav-arrow):dir(rtl) {
		transform: scaleX(-1);
	}
</style>
