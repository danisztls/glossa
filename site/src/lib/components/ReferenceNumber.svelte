<!--
	The small, copyable unit number used in the reading text: CCC paragraphs,
	Compendium questions, document sections, and Scripture verses.  Keeping it
	as a real link is important: the number is the address of the text beside
	it, not decoration.

	`placement="margin"` is for independently-addressable blocks in a continuous
	reader; `placement="inline"` keeps Bible verse numbers in the prose flow.
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
		placement: 'inline' | 'margin';
		/** A verse named by the arriving citation receives the same emphasis as its passage. */
		emphasized?: boolean;
	}

	let { n, href, canonicalHref, label, placement, emphasized = false }: Props = $props();

	const menu = new Menu();
	const bookmarked = $derived(bookmarks.has(canonicalHref));

	function onClick(e: MouseEvent) {
		// Anything that isn't a plain primary click is the browser's to handle:
		// a new tab, a new window, a download, a paste-and-go. Intercepting
		// those would take away the one thing the href is for.
		if (e.defaultPrevented || e.button !== 0) return;
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
		e.preventDefault();
		menu.toggle();
		// NOT `stopPropagation`: when one number's popover is already open,
		// this click has to keep travelling to the window so THAT popover's
		// outside-click listener closes it. The listener this click is about to
		// create cannot catch its own opening click — `AnchorMenu` mounts in a
		// microtask, after the synchronous dispatch has finished.
	}
</script>

<span class="anchor-menu" bind:this={menu.containerEl}>
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
		onclick={onClick}>{n}</a
	>
	{#if menu.open}
		<AnchorMenu {menu} {canonicalHref} navHref={href} />
	{/if}
</span>

<style>
	/*
	 * The wrapper exists only to give `Menu` an element that contains both the
	 * trigger and the panel, so an outside click can be measured against it
	 * (DOM containment, which `display: contents` does not affect). It
	 * generates no box, so neither the inline number's baseline nor the margin
	 * number's `position: absolute` — which resolves against the unit's own
	 * `position: relative` block, not against this — changes at all.
	 */
	.anchor-menu {
		display: contents;
	}

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

	.reference-number.inline {
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
