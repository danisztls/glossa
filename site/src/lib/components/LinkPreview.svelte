<script lang="ts">
	/**
	 * Hover/focus content preview for internal links — mounted ONCE in
	 * `+layout.svelte`, never imported anywhere else.
	 *
	 * WHY ONE GLOBAL LISTENER AND NOT A WRAPPER COMPONENT: the site's internal
	 * content links (a CCC footnote's scripture citations via `RefText.svelte`,
	 * in-prose "cf." links via `linkifyProse`, the Bible reader's CCC-citation
	 * footer, table-of-contents entries, prev/next nav, the jump box's results)
	 * are generated in something like a dozen different places, and wrapping
	 * every one of them in a `<LinkPreview>`-per-link component would mean
	 * editing all dozen — which is both a lot of surface area to get wrong and
	 * a guaranteed collision with the other agents already mid-edit on
	 * `RefText.svelte`, route templates, and `corpus.ts` this session. Instead
	 * this component attaches ONE set of delegated listeners at the window
	 * level, inspects whatever `<a>` the event bubbled through
	 * (`Element.closest('a[href]')`), and asks `linkPreviewHref.ts` whether
	 * that href names previewable content. Every existing internal link gets a
	 * preview for free, and so does every link any future page adds — nobody
	 * has to remember this feature exists to get it.
	 *
	 * ONE REUSABLE OVERLAY, not one instance per link: at most one preview is
	 * ever relevant (the reader has one pointer and one focus), so a single
	 * fixed-position node reused across every hover avoids mounting/unmounting
	 * a component on every pointer move.
	 *
	 * SSR / no-JS: this component's `<script>` runs during prerendering (every
	 * Svelte component's does), but every `window`/`document` read below either
	 * lives inside an event handler (never invoked server-side — there is no
	 * event loop) or inside `$effect` (Svelte 5: effects only run in the
	 * browser). The template renders one static, empty, invisible root div
	 * unconditionally — present in the prerendered HTML so hydration has
	 * nothing to attach that wasn't already there, but inert until a real
	 * pointer or keyboard event fires. No link's href, target, or click
	 * behaviour changes: this only ever ADDS an overlay that isn't part of the
	 * normal navigation flow, per the task's "must read perfectly with
	 * JavaScript disabled" constraint.
	 */
	import { parsePreviewHref, type PreviewTarget } from '$lib/linkPreviewHref';
	import { resolvePreview, type ResolvedPreview } from '$lib/linkPreviewContent';
	import { t } from '$lib/i18n.svelte';

	// Long enough that a pointer merely crossing a citation-dense paragraph
	// (RefText.svelte renders a handful of links per footnote line) never
	// strobes a popup per link; short enough that a reader who actually pauses
	// on one doesn't feel a lag. 350ms sits between the ~150-200ms UI convention
	// for "acknowledge instantly" and the ~500ms+ that starts to feel unresponsive.
	const SHOW_DELAY_MS = 350;
	// Deliberately shorter than SHOW_DELAY_MS: this only has to survive the
	// gap between leaving one link and entering an adjacent one (two citations
	// separated by a comma and a space), not a real pause to read.
	const HIDE_GRACE_MS = 200;
	const TOOLTIP_ID = 'link-preview-tooltip';

	// The tracked anchor IS the state machine's key: `undefined` means nothing
	// is being previewed, and comparing a newly-hovered element against this
	// one (rather than a separate boolean) is what lets `beginShow` ignore a
	// second `pointerover` for the same link the pointer is still inside of —
	// `pointerover` refires from every descendant element it bubbles through,
	// including every inline `<a>` a citation-dense sentence wraps text
	// around.
	let anchorEl: HTMLAnchorElement | undefined = $state();
	let target: PreviewTarget | undefined = $state();
	// 'pending': timer running, nothing rendered yet (a leave here needs no
	//   grace period — there is nothing on screen to leave gracefully).
	// 'loading': delay elapsed, fetch in flight, "Loading…" showing.
	// 'shown': resolved content showing.
	let phase: 'pending' | 'loading' | 'shown' = $state('pending');
	let resolved: ResolvedPreview | undefined = $state();
	let coords: { top: number; left: number } | undefined = $state();

	let overlayEl: HTMLDivElement | undefined = $state();

	let showTimer: ReturnType<typeof setTimeout> | undefined;
	let hideTimer: ReturnType<typeof setTimeout> | undefined;

	function clearTimers() {
		if (showTimer) clearTimeout(showTimer);
		if (hideTimer) clearTimeout(hideTimer);
		showTimer = undefined;
		hideTimer = undefined;
	}

	/**
	 * `aria-describedby` is set on the REAL anchor element — a DOM node this
	 * component doesn't own and didn't render — for exactly as long as the
	 * preview is relevant to it. Any pre-existing value is saved and restored
	 * rather than clobbered: nothing on the site sets one today, but a global
	 * listener that silently deletes an attribute it didn't put there would be
	 * a landmine for whatever adds one later.
	 */
	function attachDescribedBy(el: HTMLAnchorElement) {
		const prev = el.getAttribute('aria-describedby');
		if (prev !== null) el.dataset.previewPrevDescribedby = prev;
		el.setAttribute('aria-describedby', TOOLTIP_ID);
	}

	function detachDescribedBy(el: HTMLAnchorElement) {
		const prev = el.dataset.previewPrevDescribedby;
		if (prev !== undefined) {
			el.setAttribute('aria-describedby', prev);
			delete el.dataset.previewPrevDescribedby;
		} else {
			el.removeAttribute('aria-describedby');
		}
	}

	/** Full reset: cancels any pending timer/fetch-in-flight relevance and
	 *  hides the overlay. Safe to call whether or not anything is currently
	 *  tracked. */
	function dismiss() {
		clearTimers();
		if (anchorEl) detachDescribedBy(anchorEl);
		anchorEl = undefined;
		target = undefined;
		phase = 'pending';
		resolved = undefined;
		coords = undefined;
	}

	function findMatch(
		start: EventTarget | null
	): { el: HTMLAnchorElement; target: PreviewTarget } | undefined {
		if (!(start instanceof Element)) return undefined;
		const a = start.closest('a[href]');
		if (!(a instanceof HTMLAnchorElement)) return undefined;
		const parsed = parsePreviewHref(a.getAttribute('href'));
		return parsed ? { el: a, target: parsed } : undefined;
	}

	function beginShow(el: HTMLAnchorElement, matchedTarget: PreviewTarget) {
		if (anchorEl === el) return; // already tracking this exact link (pending, loading, or shown)
		dismiss();
		anchorEl = el;
		target = matchedTarget;
		showTimer = setTimeout(() => {
			// Re-check identity: `dismiss()` may have run (a later hover, an
			// Escape, a scroll) between this timer being scheduled and firing.
			if (anchorEl !== el) return;
			phase = 'loading';
			attachDescribedBy(el);
			resolvePreview(matchedTarget).then((r) => {
				if (anchorEl !== el) return; // the pointer moved on while this was in flight
				if (!r) {
					dismiss(); // resolvable-looking href, but nothing to show (withheld work, missing verse, ...) — see linkPreviewContent.ts
					return;
				}
				resolved = r;
				phase = 'shown';
			});
		}, SHOW_DELAY_MS);
	}

	function scheduleHide(el: HTMLAnchorElement) {
		if (anchorEl !== el) return;
		if (phase === 'pending') {
			dismiss(); // never became visible — nothing to grace-period
			return;
		}
		hideTimer = setTimeout(() => {
			if (anchorEl === el) dismiss();
		}, HIDE_GRACE_MS);
	}

	// --- Pointer path — gated behind a hover-capable, fine pointer -----------
	//
	// Checked on every `pointerover` rather than cached once at mount: the
	// capability can change mid-session (a mouse plugged into a tablet), and
	// `matchMedia(...).matches` is cheap enough that re-checking it here costs
	// nothing measurable next to the DOM walk `findMatch` already does.

	function supportsHoverPreview(): boolean {
		return window.matchMedia('(hover: hover) and (pointer: fine)').matches;
	}

	function onPointerOver(e: PointerEvent) {
		if (!supportsHoverPreview()) return;
		const match = findMatch(e.target);
		if (!match) return;
		beginShow(match.el, match.target);
	}

	function onPointerOut(e: PointerEvent) {
		if (!anchorEl) return;
		const leaving = findMatch(e.target);
		if (!leaving || leaving.el !== anchorEl) return;
		// Moving between two inline fragments the *same* link's text wraps
		// across (a multi-line citation) fires pointerout/pointerover pairs
		// that never actually leave the anchor — `relatedTarget` is where the
		// pointer is headed, and if that's still inside `anchorEl` this isn't
		// a real departure.
		const to = e.relatedTarget;
		if (to instanceof Node && anchorEl.contains(to)) return;
		scheduleHide(anchorEl);
	}

	// --- Keyboard path — always on, no pointer-capability gate ---------------

	function onFocusIn(e: FocusEvent) {
		const match = findMatch(e.target);
		if (!match) return;
		beginShow(match.el, match.target);
	}

	function onFocusOut(e: FocusEvent) {
		if (!anchorEl || e.target !== anchorEl) return;
		scheduleHide(anchorEl);
	}

	function onKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape' && anchorEl) dismiss();
	}

	// A preview anchored to a link's on-screen position is a lie the moment
	// the page scrolls out from under it; rather than track scroll and
	// reposition every frame (this overlay is supplementary, not worth a
	// scroll-linked animation budget), it just disappears. `capture: true`
	// (Svelte 5's `oneventcapture` form) is required, not optional: `scroll`
	// doesn't bubble, so a non-capturing window listener would never see the
	// reading aside's own internal scrolling (`.reading-aside` is its own
	// `overflow-y: auto` container per app.css) — only the capture phase
	// reaches every scrollable ancestor on the way down to it.
	function onScrollCapture() {
		if (anchorEl) dismiss();
	}

	function onResize() {
		if (anchorEl) dismiss();
	}

	// --- Positioning -----------------------------------------------------------
	//
	// Re-measured whenever the tracked anchor or the overlay's own rendered
	// size changes — `phase` flipping 'loading' -> 'shown' swaps a short
	// "Loading…" line for the real title+body, which is very often a
	// different height, so re-running this only on `anchorEl` changing would
	// leave the box mispositioned for the second half of every preview.

	function computePosition(anchor: DOMRect, box: DOMRect): { top: number; left: number } {
		const GAP = 8;
		let top = anchor.bottom + GAP;
		if (top + box.height > window.innerHeight - GAP) {
			const above = anchor.top - GAP - box.height;
			top = above >= GAP ? above : Math.max(GAP, window.innerHeight - box.height - GAP);
		}
		let left = anchor.left;
		if (left + box.width > window.innerWidth - GAP) left = window.innerWidth - box.width - GAP;
		left = Math.max(GAP, left);
		return { top, left };
	}

	$effect(() => {
		if (!anchorEl || phase === 'pending' || !overlayEl) {
			coords = undefined;
			return;
		}
		coords = computePosition(anchorEl.getBoundingClientRect(), overlayEl.getBoundingClientRect());
	});
</script>

<svelte:window
	onpointerover={onPointerOver}
	onpointerout={onPointerOut}
	onfocusin={onFocusIn}
	onfocusout={onFocusOut}
	onkeydown={onKeyDown}
	onscrollcapture={onScrollCapture}
	onresize={onResize}
/>

<!--
	`role="tooltip"` + `aria-describedby` (set on the real anchor above, not
	here) is the standard association for "supplementary text describing the
	currently-focused/-hovered element" (WAI-ARIA APG's tooltip pattern) — and
	it fits: this text genuinely describes where the link goes, the same job a
	native tooltip does for an icon button, just longer. A plain
	`aria-live="polite"` region was the other option and was rejected because
	it isn't TIED to the element a keyboard user just focused — a screen
	reader user tabbing through a paragraph of citations would hear preview
	text with no indication which of several nearby links it belonged to.

	The one place `aria-describedby` alone falls short: content that arrives
	ASYNCHRONOUSLY after the association is announced. Most assistive tech
	reads `aria-describedby`'s target once, at focus time — if the fetch is
	still in flight, "Loading…" is what gets announced and the eventual real
	text goes unheard. `aria-live="polite"` on the inner content wrapper below
	(not the outer `role="tooltip"` element) is the belt-and-suspenders fix:
	AT that honours live-region updates gets a second, correct announcement
	once the real content lands, and sighted users see exactly the same
	loading -> content swap either way. Neither mechanism alone was honest
	about how this actually behaves; the combination is.

	`pointer-events: none` (in the stylesheet below) is what makes "no
	interactive elements" actually true rather than merely asserted — nothing
	inside can ever receive a click or a hover of its own, so there is no
	separate mechanism needed to keep it non-interactive.
-->
<div
	bind:this={overlayEl}
	id={TOOLTIP_ID}
	class="link-preview"
	class:visible={coords !== undefined}
	role="tooltip"
	style={coords ? `top:${coords.top}px; left:${coords.left}px;` : undefined}
>
	<div class="link-preview-content" aria-live="polite">
		{#if phase === 'shown' && resolved}
			<p class="link-preview-title">{resolved.title}</p>
			<p class="link-preview-body">{resolved.body}</p>
		{:else if phase === 'loading'}
			<p class="link-preview-body">{t('ref.tooltip.loading')}</p>
		{/if}
	</div>
</div>

<style>
	/*
	 * Chrome, not reading matter: fixed UI size, NOT `--reading-base`/
	 * `--reading-scale` (app.css: that pair is scoped to `.reading-text`
	 * on purpose, "never applied to chrome"). A reader who has bumped their
	 * font size up for a long Bible chapter did that for the text they're
	 * reading, not for a glance-sized popup that's gone in a few seconds —
	 * scaling this with it would also make the overlay's own viewport-relative
	 * positioning math (computePosition, sized off the ALREADY-RENDERED box)
	 * fight a font size that changes independently of anything this component
	 * observes.
	 */
	.link-preview {
		position: fixed;
		z-index: 70; /* above .menu-panel (50) and .chapters (20) — a preview opened from inside either must not render behind it */
		inset-block-start: 0;
		inset-inline-start: 0;
		pointer-events: none;
		max-width: min(24rem, calc(100vw - 1rem));
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		box-shadow: 0 10px 30px rgb(0 0 0 / 25%);
		padding: 0.6rem 0.8rem;
		font-family: var(--font-sans);
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text);
		opacity: 0;
		visibility: hidden;
		transform: translateY(-2px);
	}

	@media (prefers-reduced-motion: no-preference) {
		.link-preview {
			transition:
				opacity 120ms ease,
				transform 120ms ease,
				visibility 120ms;
		}
	}

	/* No entrance animation at all under reduced motion — not even the
	   transition's end state changing abruptly counts as "no animation" if
	   the transition itself still runs, so this drops it rather than merely
	   shortening it. */
	@media (prefers-reduced-motion: reduce) {
		.link-preview {
			transition: none;
		}
	}

	.link-preview.visible {
		opacity: 1;
		visibility: visible;
		transform: none;
	}

	.link-preview-title {
		margin: 0 0 0.25rem;
		font-weight: 600;
		color: var(--color-accent);
		font-size: 0.8rem;
	}

	.link-preview-body {
		margin: 0;
		color: var(--color-text);
		overflow-wrap: break-word;
	}
</style>
