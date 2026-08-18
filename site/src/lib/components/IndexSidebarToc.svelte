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

<nav class="index-sidebar-toc" aria-label={heading}>
	<h2>{heading}</h2>
	<ol>
		{#each items as item (item.href)}
			<li><a href={item.href}>{item.label}</a></li>
		{/each}
	</ol>
</nav>

<style>
	.index-sidebar-toc {
		font-size: 0.85rem;
	}

	h2 {
		margin: 0 0 0.5rem;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.03em;
		color: var(--color-text-muted);
		border-bottom: 1px solid var(--color-border);
		padding-bottom: 0.4rem;
	}

	ol {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	li {
		margin: 0.1rem 0;
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
