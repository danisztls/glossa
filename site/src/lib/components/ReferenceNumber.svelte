<!--
	The small, copyable unit number used in the reading text: CCC paragraphs,
	Compendium questions, document sections, and Scripture verses.  Keeping it
	as a real link is important: the number is the address of the text beside
	it, not decoration.

	`placement="margin"` is for independently-addressable blocks in a continuous
	reader, AND IT ASKS SOMETHING OF ITS CALLER: the number is
	`position: absolute` at a negative inline start, so the block it belongs to
	must be `position: relative` or it hangs off the initial containing block
	instead — every number on the page piling up off the top-left corner, out of
	the viewport, with no error anywhere. Two routes were written from a third
	and took the markup without that one declaration
	(`/doctrina-socialis/caput/[n]`, `/doctores/summa/[part]/[q]`), and both
	rendered their whole text with no numbers at all until 2026-09-02.
	`placement="inline"` keeps Bible verse numbers in the prose flow;
	`placement="gutter"` is compare mode's, where the number sits in the track
	BETWEEN the two columns and rides the divider running down it (see
	`.compare-gutter` in app.css, and `CompareUnit` in `$lib/compare.ts` for why
	a comparison row gets one number rather than one per column). Its opaque
	background is what punches the number through that rule; it is the page
	background rather than the row's because a saved row's wash is painted on
	the two text cells only, exactly as the margin number in the single-column
	reader hangs outside the `.section` the wash covers.
	The component owns the interaction and responsive treatment so the four
	readers cannot slowly acquire different conventions for the same affordance.

	A PLAIN CLICK NOW OPENS `AnchorMenu` rather than navigating, because the
	address is worth more than one action (copy, copy link, open, bookmark —
	see that component). The element stays an `<a href>` rather than becoming a
	button: that is what keeps ⌘/ctrl-click, middle-click, "open in new tab"
	and the native context menu working, and what keeps the number meaningful
	to anything reading the page rather than clicking it. Only the unmodified
	primary click is intercepted.
-->
<script lang="ts">
	import { bookmarks } from '$lib/bookmarks.svelte';
	import AnchorMenu from './AnchorMenu.svelte';
	import { Menu } from './menu.svelte';

	interface Props {
		n: number;
		/** Where the number links, and where the popover's `Open` goes — an
		 *  in-page `#v{n}` for a verse, the unit's own page for a CCC ¶. */
		href: string;
		/** The unit's full canonical address, fragment and all. Passed rather
		 *  than derived from the current pathname so this component never
		 *  depends on which of the parallel route trees rendered it. */
		canonicalHref: string;
		label: string;
		placement: 'inline' | 'margin' | 'gutter';
		/** A verse named by the arriving citation receives the same emphasis as its passage. */
		emphasized?: boolean;
	}

	let { n, href, canonicalHref, label, placement, emphasized = false }: Props = $props();

	const menu = new Menu();
	const bookmarked = $derived(bookmarks.has(canonicalHref));

	/**
	 * Whether this number's panel was already open when the pointer went down
	 * — which is the whole of what a click has to know, and cannot find out by
	 * itself.
	 *
	 * `AnchorMenu` is a native `popover`, so the browser light-dismisses it,
	 * and light dismissal lands on **pointerup**: by the time this element's
	 * `click` fires, the panel the reader clicked the number to close is
	 * already closed and `menu.open` already `false`. Toggling blindly there
	 * would reopen it, and the number would read as inert. The spec exempts a
	 * declared invoker (`popovertarget`) from exactly this, but that attribute
	 * is `<button>`-only and this stays an `<a href>`; so the state is sampled
	 * one event earlier instead.
	 *
	 * Assigned rather than cleared on every pointerdown, so a stale `true` —
	 * pressed on an open number, then dragged away without a click — cannot
	 * outlive the next press on the same one.
	 */
	let openAtPointerDown = false;

	function onClick(e: MouseEvent) {
		// Anything that isn't a plain primary click is the browser's to handle:
		// a new tab, a new window, a download, a paste-and-go. Intercepting
		// those would take away the one thing the href is for.
		if (e.defaultPrevented || e.button !== 0) return;
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		e.preventDefault();
		if (openAtPointerDown) {
			// Light dismiss already did the closing. Nothing left to toggle.
			openAtPointerDown = false;
			return;
		}
		menu.toggle();
	}
</script>

<a
	bind:this={menu.triggerEl}
	class="reference-number {placement}"
	class:emphasized
	class:bookmarked
	{href}
	aria-label={label}
	aria-haspopup="menu"
	aria-expanded={menu.open}
	data-link-preview="off"
	onpointerdown={() => (openAtPointerDown = menu.open)}
	onclick={onClick}>{n}</a
>
{#if menu.open}
	<AnchorMenu {menu} {canonicalHref} navHref={href} />
{/if}

<style>
	/*
	 * There is no wrapper element. There used to be a `display: contents` span
	 * around the pair, for one reason only: `Menu`'s outside-click handler
	 * measured DOM containment, so the trigger and the panel needed a common
	 * ancestor to both be "inside" of. Light dismiss made that handler
	 * redundant (see `AnchorMenu.svelte`), and the span with it — the panel is
	 * simply the number's next sibling now, which is also the DOM order Tab
	 * follows into it.
	 */
	.reference-number {
		color: var(--color-apparatus);
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.75em);
		font-weight: 650;
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'tnum';
		line-height: 1;
		text-decoration: none;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.18em;
		border-radius: 0.15em;
		cursor: pointer;
	}

	.reference-number:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.reference-number:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		color: var(--color-accent);
	}

	/*
	 * `position: relative` IS LOAD-BEARING, for the reason `.gutter` gives
	 * below and against a different neighbour. A note marker's tap target is a
	 * positioned overlay 44px across (`.note-trigger::after`), and a
	 * commentary's dagger is set at the END of a verse — which puts this
	 * number, the first thing in the NEXT verse, inside it. Positioned boxes
	 * paint above unpositioned ones whatever the tree says, so the overlay took
	 * the click and the number was inert: pressing a verse number opened the
	 * note beside it. Positioning the number puts the two in the same layer,
	 * where tree order decides, and the number comes later.
	 */
	.reference-number.inline {
		position: relative;
		display: inline-block;
		vertical-align: super;
		margin-inline-end: 0.22em;
		user-select: none;
	}

	.reference-number.margin {
		position: absolute;
		inset-inline-start: -3.25rem;
		top: 0.2em;
		width: 2.75rem;
		text-align: end;
	}

	/*
	 * `position: relative` is load-bearing, not incidental: the divider it sits
	 * on is `.compare-gutter::before`, an absolutely-positioned pseudo that
	 * paints above ordinary in-flow content. Making the number positioned puts
	 * it in the same layer, where tree order (the pseudo comes first) settles it
	 * in the number's favour and the opaque background can do its job.
	 */
	.reference-number.gutter {
		position: relative;
		display: inline-block;
		padding-inline: 0.3rem;
		padding-block: 0.15rem;
		background: var(--color-bg);
	}

	.reference-number.emphasized {
		color: var(--color-accent);
	}

	/*
	 * Written AFTER `.emphasized` on purpose. The two states say different
	 * things — the passage wash says "you arrived here from a citation", the
	 * number says "you saved this" — and a unit that is both would otherwise
	 * lose the saved cue entirely, since the wash is what emphasis already
	 * carries. Cascade order alone decides it, the same way `app.css` lets
	 * dark beat sepia.
	 */
	.reference-number.bookmarked {
		color: var(--color-bookmark);
	}

	@media (max-width: 60rem) {
		.reference-number.margin {
			position: static;
			display: block;
			width: auto;
			margin-bottom: 0.2rem;
			text-align: start;
		}
	}
</style>
