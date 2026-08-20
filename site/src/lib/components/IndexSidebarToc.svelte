<script lang="ts">
	/**
	 * Compact, in-page table of contents for library indexes. Unlike the
	 * reader's structure sidebar, this only lists the index's major divisions:
	 * its purpose is to make a long landing page skimmable without repeating
	 * the entire index a second time beside it.
	 */
	interface Props {
		heading: string;
		items: { href: string; label: string }[];
	}

	let { heading, items }: Props = $props();
</script>

<nav class="index-sidebar-toc" aria-label={heading} data-link-preview="off">
	<h2 class="sidebar-toc-heading">{heading}</h2>
	<ol class="sidebar-toc-list">
		{#each items as item (item.href)}
			<li><a href={item.href}>{item.label}</a></li>
		{/each}
	</ol>
</nav>

<style>
	.index-sidebar-toc {
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
</style>
