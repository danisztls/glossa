<!--
	The iOS "Add to Home Screen" hint: a slim bar along the bottom of the
	viewport, shown once a reader has spent fifteen visible minutes reading (the
	gate lives in `$lib/install.svelte`) and dismissible for good.

	NOT A DIALOG, deliberately. There is no backdrop, no focus trap and no
	forced choice: the page behind it stays scrollable and fully usable, and a
	reader who ignores it entirely loses nothing. A modal would be the one
	pattern that cannot be ignored gracefully, which is the wrong trade on a
	site whose whole job is uninterrupted reading — and it would be a strange
	thing to interrupt someone's reading of the Psalms with.

	WHY IT WAITS FOR A NAVIGATION. Eligibility is reached on a timer, so the bar
	could otherwise materialise under the reader's thumb mid-paragraph. Instead
	the effect below tracks only `page.url.pathname` and reads the store
	untracked, so the bar appears at the next page the reader opens — by which
	point they have just moved anyway, and nothing has moved out from under
	them. In a work that is read chapter by chapter, that costs no reach at all.
-->
<script lang="ts">
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import Icon from './Icon.svelte';
	import { install } from '$lib/install.svelte';
	import { t } from '$lib/i18n.svelte';

	let visible = $state(false);

	// Measured rather than hard-coded: the bar's height depends on how the
	// instruction wraps, which depends on the language and the reader's text
	// size. See the spacer below.
	let height = $state(0);

	/*
	 * TESTING THIS THING. It is gated on the platform, on fifteen minutes of
	 * reading and on never having been dismissed, which between them make it
	 * nearly impossible to look at on purpose. Two query parameters open it up,
	 * on any page:
	 *
	 *   ?install-hint         show the bar right now, on any browser, ignoring
	 *                         every gate — the only way to see it on a desktop
	 *                         at all, since `isIosLike` is otherwise fatal
	 *   ?install-hint=reset   forget the dismissal and the banked time, then
	 *                         behave normally again
	 *
	 * These ship rather than being stripped from production builds: the whole
	 * effect of the first is to show a dismissible bar to somebody who typed
	 * out a query string asking for it, and being able to check the real
	 * deployed site on a real iPhone is worth more than the nothing it costs.
	 */
	const override = $derived(page.url.searchParams.get('install-hint'));

	// `page.url` is the ONLY tracked dependency: `iosHintEligible` reads the
	// engagement counter, which ticks every 15s, and tracking that would make
	// this run on the timer — precisely what it exists to avoid.
	$effect(() => {
		if (override === 'reset') {
			untrack(() => install.resetHint());
			return;
		}
		if (override !== null) {
			visible = true;
			return;
		}
		page.url.pathname;
		if (untrack(() => install.iosHintEligible)) visible = true;
	});

	function dismiss() {
		visible = false;
		// A forced preview closes without recording anything: the tester is
		// looking at the bar, not answering it, and a dismissal written here
		// would quietly switch off the real hint on their own phone.
		if (override === null) install.dismissHint();
	}
</script>

{#if visible}
	<aside class="install-hint" aria-label={t('install.hint.label')} bind:clientHeight={height}>
		<div class="text">
			<p class="title">{t('install.hint.title')}</p>
			<p class="body">
				{t('install.hint.stepBefore')}
				<Icon name="share" class="share-glyph" />
				{t('install.hint.stepAfter')}
			</p>
		</div>
		<button type="button" class="dismiss" aria-label={t('install.hint.dismiss')} onclick={dismiss}>
			<Icon name="x" />
		</button>
	</aside>

	<!--
		The bar is `position: fixed`, so it is out of flow and would otherwise
		sit on top of the last thing on the page — in practice the colophon link
		in the footer. This claims the equivalent height back at the very end of
		the document (the component is rendered after `.app-shell` closes), which
		is both simpler and less brittle than reaching across files to pad the
		footer: a global rule for that would have to out-specify the footer's own
		scoped styles, which is a fight over stylesheet order, not layout.
	-->
	<div class="spacer" aria-hidden="true" style:height="{height}px"></div>
{/if}

<style>
	.install-hint {
		position: fixed;
		inset-inline: 0;
		bottom: 0;
		/* Below `.menu-panel` (50), the link preview (70) and the jump box's
		   suggestions (100). Every one of those is opened by the reader on
		   purpose; this bar is ambient, so it yields to all of them. */
		z-index: 40;
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		padding: 0.7rem 1rem;
		/* The iPhone home indicator sits in the bottom inset; without this the
		   second line of the instruction ends up underneath it. */
		padding-bottom: calc(0.7rem + env(safe-area-inset-bottom, 0px));
		background: var(--color-bg-elevated);
		border-top: 1px solid var(--color-border);
		box-shadow: 0 -2px 14px rgb(0 0 0 / 0.1);
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

	/* Sits in the middle of a sentence, so it wants the baseline treatment a
	   word would get rather than the block alignment of a standalone icon. */
	.body :global(.share-glyph) {
		vertical-align: -0.15em;
		margin-inline: 0.1em;
		color: var(--color-text);
	}

	.dismiss {
		flex: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		/* A 2.25rem hit target, as the header controls use — but borderless and
		   transparent, because a bordered button here would read as the bar's
		   primary action, and the primary action is the reader's own Share
		   button, which is not on this bar at all. */
		width: 2.25rem;
		height: 2.25rem;
		padding: 0;
		border: none;
		border-radius: 0.4rem;
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
