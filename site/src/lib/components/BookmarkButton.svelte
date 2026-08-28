<!--
	The page-level bookmark control, for the addresses that have no unit number
	to hang `AnchorMenu` off: a whole prayer, a whole document, a Bible
	chapter, a CCC/Compendium chapter, and the single-unit reading pages where
	the URL already names the unit and no number is printed.

	A toggle rather than a menu, because there is only ever one action here —
	copy and open are meaningless for the page the reader is already on, and
	the address is in their address bar.
-->
<script lang="ts">
	import { t } from '$lib/i18n.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import Icon from './Icon.svelte';

	interface Props {
		/** The page's own canonical address. */
		href: string;
	}

	let { href }: Props = $props();

	const bookmarked = $derived(bookmarks.has(href));
	const label = $derived(bookmarked ? t('bookmark.remove') : t('bookmark.add'));
</script>

<button
	type="button"
	class="bookmark-button"
	class:bookmarked
	aria-pressed={bookmarked}
	aria-label={label}
	title={label}
	onclick={() => bookmarks.toggle(href)}
>
	<Icon name="bookmark" filled={bookmarked} />
</button>

<style>
	.bookmark-button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
	}

	.bookmark-button:hover {
		color: var(--color-accent);
		border-color: var(--color-accent);
	}

	.bookmark-button.bookmarked {
		color: var(--color-bookmark);
		border-color: var(--color-bookmark);
	}
</style>
