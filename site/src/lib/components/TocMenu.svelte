<!--
	The reading bar's table of contents: the narrow-screen counterpart to the
	sidebar (`.reading-aside`, app.css), which is desktop-only and has been
	since it was written.

	WHY THE BAR AND NOT THE COLUMN. Two answers to this already existed in the
	tree and both put the list IN the reading column — `/preces` leads with the
	aside in source order, `/documenta` opens with `.toc-inline`, a closed
	`<details>` above the first word. Both spend the top of the page on
	navigation, and both are only reachable from the top of the page: a reader
	at section 200 of an encyclical has to scroll back through everything to
	reach the thing that would have taken them somewhere else. This bar is
	already sticky, is already where every other reading control lives
	(`ReadingBar`'s docblock), and costs the text no vertical space at all — so
	the control that says "where else can I go" is reachable at any depth,
	which is the whole reason a reader wants a table of contents mid-text.

	IT IS THE FIRST CONTROL IN THE ROW. `ReadingBar` runs from what is being
	read to how it is being read; this is the furthest thing in the row from
	"how" — it does not act on the page at all, it leaves it. Bookmark, print
	and roll act on the page in view; the edition controls change what that
	page is made of. Navigation sits ahead of both.

	NOT A `role="menu"`, unlike the four pickers beside it. Those offer a fixed
	set of commands and are driven with the arrow keys; this is a tree of links
	to elsewhere in the work, so it stays ordinary navigation — a button with
	`aria-expanded` opening a panel whose content is the same `<nav>` the
	sidebar renders, named by the same heading. Giving it menu semantics would
	promise arrow-key roving that a nested list of anchors does not have.

	IT RENDERS THE SAME COMPONENT THE SIDEBAR DOES, passed in as a snippet
	rather than rebuilt from props. The call has ten arguments and five of them
	differ per route (which tree, which routing scheme, which kind-floor,
	which anchor function, which borrowed-title label); `comparison` became
	props because eight copies of it differed only in where an array came from,
	and this is the case that argument was distinguishing itself against. The
	route writes the call once and renders it in both places.
-->
<script lang="ts">
	import type { Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';
	import { keepInViewport } from '$lib/floating';

	interface Props {
		/** The list's own heading — the trigger's accessible name too, so the
		    button and the panel it opens say the same word. The routes already
		    hold this string for `StructureSidebarToc`'s `heading`; passing it
		    rather than deriving one here keeps the two from drifting. */
		label: string;
		/** The table of contents itself, rendered only while the panel is
		    open. Deliberately not rendered closed: this is the second instance
		    of a tree that runs to 189 rows in the Summa's Secunda Secundae,
		    and there is nothing a hidden copy of it does for anyone. */
		content: Snippet;
	}

	let { label, content }: Props = $props();

	const menu = new Menu();

	/* Names the panel for `aria-controls`, so the trigger's `aria-expanded`
	   says what it expanded rather than only that something did. Per-instance
	   for the same reason `StructureSidebarToc`'s own ids are: two reading
	   layouts never coexist today, but a fixed literal here would be one more
	   thing that only holds while that stays true. */
	const uid = $props.id();
	const panelId = `${uid}-panel`;

	/**
	 * Escape, from wherever focus happens to be.
	 *
	 * The four header pickers hang `onPanelKeydown` on the panel element, which
	 * only fires once focus is already inside it — and clicking a trigger
	 * leaves focus on the trigger, which is the panel's SIBLING inside `.menu`,
	 * so the key never reaches the handler. On the window it does, and the
	 * `open` guard is what keeps this from acting on anyone else's Escape.
	 */
	const onWindowKeydown = (e: KeyboardEvent) => {
		if (!menu.open || e.key !== 'Escape') return;
		e.preventDefault();
		menu.closeAndRefocus();
	};

	/**
	 * A panel whose rows are links has to close when one is followed, and
	 * `onWindowClick` cannot do it: a click on a row is INSIDE the container,
	 * which is exactly what that handler treats as "leave it open".
	 *
	 * An action rather than an `onclick` on the panel `<div>`, because a click
	 * handler on a non-interactive element is what
	 * `a11y_no_static_element_interactions` is about, and the warning would be
	 * right — the div is not the thing being clicked, the anchor inside it is.
	 *
	 * Modified clicks are left alone. ⌘/Ctrl/shift-click opens the row in a new
	 * tab or window and this page does not move, so closing the panel would
	 * take away the list a reader is opening several rows from.
	 */
	function closeOnFollow(node: HTMLElement) {
		const onclick = (e: MouseEvent) => {
			if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			if (e.target instanceof Element && e.target.closest('a[href]')) menu.close();
		};
		node.addEventListener('click', onclick);
		return { destroy: () => node.removeEventListener('click', onclick) };
	}
</script>

<svelte:window onclick={menu.onWindowClick} onkeydown={onWindowKeydown} />

<div class="menu toc-menu" bind:this={menu.containerEl}>
	<button
		type="button"
		bind:this={menu.triggerEl}
		class="menu-trigger"
		aria-expanded={menu.open}
		aria-controls={panelId}
		aria-label={label}
		title={label}
		onclick={menu.toggle}
	>
		<Icon name="table-of-contents" />
	</button>
	{#if menu.open}
		<div id={panelId} class="menu-panel toc-panel" use:keepInViewport use:closeOnFollow>
			{@render content()}
		</div>
	{/if}
</div>

<style>
	/*
	 * Wider and taller than the `.menu-panel` default, which is sized for a
	 * handful of one-line rows. This holds a nested tree whose rows are
	 * sentence-length titles, so a 14rem panel would set nearly every one of
	 * them over three lines; 22rem is the sidebar's own 17rem plus the room
	 * the indent of a fourth level needs. `inline-size` rather than
	 * `min-inline-size` so the panel is the same width on every unit of the
	 * work instead of breathing with whichever titles the reader's branch
	 * happens to contain.
	 */
	.toc-panel {
		inline-size: min(22rem, 88vw);
		max-inline-size: none;
		max-block-size: min(30rem, 70vh);
		/* The panel scrolls; the page behind it must not scroll with it once
		   the list hits its end. Same rule both sidebars take (app.css). */
		overscroll-behavior: contain;
		padding: 0.6rem 0.7rem;
	}
</style>
