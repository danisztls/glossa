<script lang="ts">
	/**
	 * Compact, in-page table of contents for library indexes. Unlike the
	 * reader's structure sidebar, this only lists the index's major divisions:
	 * its purpose is to make a long landing page skimmable without repeating
	 * the entire index a second time beside it.
	 *
	 * ## Why it tracks scroll position and the structure sidebar does not
	 *
	 * Every item here is a FRAGMENT into the page beside it, not a link to
	 * somewhere else — so "which one am I looking at" is a question the
	 * component can answer, and the reader's position moves continuously
	 * rather than only on navigation. `StructureSidebarToc` is told its
	 * current unit by the route (or by the same spy, run by the continuous
	 * views); a flat list of anchors has no route to be told by, which is why
	 * this one had no highlight at all and scrolling a long index left the
	 * sidebar looking inert.
	 *
	 * `useScrollSpy` wants `[elementId, number]` pairs, and the number here is
	 * simply the item's index: these divisions carry no unit numbering of
	 * their own, and the spy only ever hands the number back.
	 */
	import { browser } from '$app/environment';
	import { useScrollSpy, type SpyTarget } from '$lib/scroll-spy.svelte';

	interface Props {
		heading: string;
		items: { href: string; label: string }[];
	}

	let { heading, items }: Props = $props();

	/* Only same-page fragments can be spied on. An item pointing anywhere else
	   is kept in the list and simply never becomes current, rather than
	   shifting every later item's index by one. */
	const targets = $derived(
		items
			.map((item, i): SpyTarget | undefined =>
				item.href.startsWith('#') ? [item.href.slice(1), i] : undefined
			)
			.filter((target): target is SpyTarget => target !== undefined)
	);

	const spy = useScrollSpy(() => targets);
	const currentIndex = $derived(spy.current);

	const CURRENT_ID = 'index-toc-current';

	/* Keep the highlighted row visible inside the aside's OWN scroll container
	   (`.index-aside` is `overflow-y: auto` — app.css) on a list long enough to
	   overflow it. Deliberately NOT `scrollIntoView`: that walks every
	   scrollable ancestor up to the viewport, and this effect fires on scroll,
	   so any window movement it caused would feed straight back into the spy
	   that triggered it. Setting one container's `scrollTop` cannot move the
	   page. */
	$effect(() => {
		if (!browser || currentIndex === undefined) return;
		const row = document.getElementById(CURRENT_ID);
		const box = row?.closest<HTMLElement>('.index-aside');
		if (!row || !box) return;
		// Measured, not `offsetTop`-derived: whether the aside is the row's
		// `offsetParent` depends on it being positioned, which it is only above
		// the grid breakpoint (below it the aside is `display: none` anyway).
		// Two rects need no such case analysis.
		const rowBox = row.getBoundingClientRect();
		const asideBox = box.getBoundingClientRect();
		if (rowBox.top < asideBox.top) box.scrollTop -= asideBox.top - rowBox.top;
		else if (rowBox.bottom > asideBox.bottom) box.scrollTop += rowBox.bottom - asideBox.bottom;
	});
</script>

<nav class="index-sidebar-toc" aria-label={heading} data-link-preview="off">
	<h2 class="sidebar-toc-heading">{heading}</h2>
	<ol class="sidebar-toc-list">
		{#each items as item, i (item.href)}
			{@const isCurrent = i === currentIndex}
			<li>
				<a
					id={isCurrent ? CURRENT_ID : undefined}
					href={item.href}
					class:current={isCurrent}
					aria-current={isCurrent ? 'location' : undefined}>{item.label}</a
				>
			</li>
		{/each}
	</ol>
</nav>

<style>
	/* Interface face, for the reason `StructureSidebarToc`'s `nav` rule gives
	   at length: a sidebar is navigation standing outside the reading column,
	   not a page of the book. Named rather than inherited for the same reason
	   it is named there. */
	.index-sidebar-toc {
		font-family: var(--font-sans);
		font-size: 0.85rem;
	}

	a {
		display: block;
		padding: 0.2rem 0.35rem;
		border-radius: 0.3rem;
		color: var(--color-text);
		line-height: 1.35;
		text-decoration: none;
	}

	a:hover {
		color: var(--color-accent);
		background: var(--color-bg-elevated);
	}

	/* Same solid-accent treatment the structure sidebar gives its current row,
	   so "where I am" reads identically in both sidebars. Declared after
	   `a:hover` so pointing at the current row doesn't drop it back to the
	   hover pair. */
	a.current {
		background: var(--color-accent);
		color: var(--color-accent-contrast);
		font-weight: 600;
	}
</style>
