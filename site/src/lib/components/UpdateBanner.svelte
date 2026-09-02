<!--
	The update offer: a slim bar telling the reader a newer edition has finished
	installing and is waiting for permission to take over.

	WHY THERE HAS TO BE ONE. `src/service-worker.ts` deliberately does not call
	`skipWaiting()` — a reader mid-chapter should not have assets swapped under
	them. The browser's own rule for when the waiting worker takes over is
	"once every client on the old version has gone", and that is not a thing a
	reader can do on purpose: a plain reload does not release the old worker,
	and an installed PWA may never be fully closed. So a waiting version waits
	indefinitely unless something moves it. Because the corpus index ships
	inside the app bundle, that means a stale table of contents — new works and
	corrections that exist on the server and cannot be reached.

	IT IS THE THIRD PATH NOW, NOT THE ONLY ONE. Since 2026-08-28 the update is
	taken without asking at the two moments it costs nothing — the tab hidden,
	and the reader following a link away from this page — which is moments 1
	and 2 of `$lib/sw.svelte.ts`'s docblock. What is left for this bar is the
	reader who is neither: parked on one chapter, reading, not navigating. That
	is the one case where the ground genuinely would move under someone, and it
	is the case consent was always the right answer to. Expect to see this
	rarely; that is the design working, not the banner failing.

	SAME SHAPE AS `InstallHint`, and for the same reasons: not a dialog, no
	backdrop, no focus trap, the page behind it stays fully usable, and a reader
	who ignores it loses nothing but freshness. Interrupting someone's reading
	of the Psalms with a modal to announce a deploy would be absurd.

	It differs from `InstallHint` in two ways, both deliberate:

	  - It appears as soon as the update is ready rather than waiting for a
	    navigation. `InstallHint` waits because it fires on a timer and could
	    otherwise materialise under a reader's thumb mid-paragraph; this one is
	    rare (a deploy), and the offer is worth making while the reader is
	    still in a position to accept it. Waiting for a navigation would also
	    now be waiting for something that resolves itself: a navigation takes
	    the update on its own, and there would be nothing left to offer.

	  - Dismissal is for this page only, not remembered. A reader saying "not
	    now" is answering about this moment; the offer should come back on the
	    next visit, because the alternative is a reader who has permanently
	    opted out of ever seeing new text.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import { serviceWorker } from '$lib/sw.svelte';
	import { t } from '$lib/i18n.svelte';

	let dismissed = $state(false);
	const visible = $derived(serviceWorker.updateReady && !dismissed);
</script>

{#if visible}
	<aside class="update-banner" aria-label={t('update.label')}>
		<div class="text">
			<p class="title">{t('update.title')}</p>
			<p class="body">{t('update.body')}</p>
		</div>
		<button type="button" class="apply" onclick={() => serviceWorker.applyUpdate()}>
			{t('update.action')}
		</button>
		<button
			type="button"
			class="dismiss"
			aria-label={t('update.dismiss')}
			title={t('update.dismiss')}
			onclick={() => (dismissed = true)}
		>
			<Icon name="x" />
		</button>
	</aside>
{/if}

<style>
	.update-banner {
		position: fixed;
		inset-inline: 0;
		/* Top, not bottom: `InstallHint` owns the bottom bar, and the two can
		   be eligible at once on an iPhone. Stacking them would hide one behind
		   the other; opposite edges keeps both readable and keeps the more
		   ambient of the two (the install hint) out of the way of this one. */
		top: 0;
		/* Above both the site header and the reading bar — neither is fixed, so
		   this overlays whichever of them the top edge is showing — but below
		   every panel the reader opens on purpose — `.menu-panel` (50), the link preview
		   (70), the jump box's suggestions (100). Same courtesy `InstallHint`
		   extends, for the same reason: this is ambient, those are answers to
		   a deliberate action. */
		z-index: 45;
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.6rem 1rem;
		padding-top: calc(0.6rem + env(safe-area-inset-top, 0px));
		background: var(--color-bg-elevated);
		border-bottom: 1px solid var(--color-border);
		box-shadow: 0 2px 14px rgb(0 0 0 / 0.1);
	}

	.text {
		flex: 1;
		min-width: 0;
	}

	.title {
		margin: 0;
		font-weight: 600;
		font-size: 0.95rem;
	}

	.body {
		margin: 0.15rem 0 0;
		font-size: max(var(--font-size-min), 0.85rem);
		color: var(--color-text-muted);
	}

	/* Bordered, unlike `InstallHint`'s dismiss — here the primary action IS on
	   this bar, so it should look like the thing to press. */
	.apply {
		flex: none;
		/* 0.425rem rather than 0.35 holds the button at the height it had
		   while it was being sized by the body's line box, which is what keeps
		   it level with `.dismiss` beside it. */
		padding: 0.425rem 0.9rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		background: var(--color-bg);
		color: var(--color-text);
		font: inherit;
		font-size: 0.9rem;
		/* Restated because `font: inherit` above leaves a length, not a ratio
		   — styles/base.css says why. */
		line-height: 1.5;
		cursor: pointer;
	}

	.apply:hover {
		border-color: var(--color-accent);
		color: var(--color-accent);
	}

	.dismiss {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: none;
		border-radius: var(--radius-md);
		background: none;
		color: var(--color-text-muted);
		font-size: 1rem;
		line-height: 1;
		cursor: pointer;
	}

	.dismiss:hover {
		color: var(--color-accent);
	}
</style>
