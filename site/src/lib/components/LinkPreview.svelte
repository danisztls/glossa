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
	 * (`Element.closest('a[href]')`), and asks `address.ts` whether
	 * that href names previewable content. Every existing internal link gets a
	 * preview for free, and so does every link any future page adds — nobody
	 * has to remember this feature exists to get it. Navigation contexts can
	 * opt out with `data-link-preview="off"` on the link OR any ancestor. That
	 * keeps a TOC from previewing every destination and lets chapter readers
	 * exempt a unit-number link when the very same unit is already on screen.
	 *
	 * ONE REUSABLE OVERLAY, not one instance per link: at most one preview is
	 * ever relevant (the reader has one pointer and one focus), so a single
	 * fixed-position node reused across every hover avoids mounting/unmounting
	 * a component on every pointer move.
	 *
	 * SSR / no-JS: this dates from when every route was prerendered, when
	 * this component's `<script>` ran during that pass too (every Svelte
	 * component's did), so every `window`/`document` read below had to
	 * either live inside an event handler (never invoked server-side — there
	 * is no event loop) or inside `$effect` (Svelte 5: effects only run in
	 * the browser) to avoid throwing during the build. The template renders
	 * one static, empty, invisible root div unconditionally, which used to
	 * matter doubly: present in the prerendered HTML, hydration had nothing
	 * to attach that wasn't already there. Since the site became one SPA
	 * shell with `ssr = false` (`+layout.ts`, docs/decisions.md §The site)
	 * this component's `<script>` never runs outside the browser at all, so
	 * neither guard is load-bearing against a build-time throw any more —
	 * they are kept because the discipline (touch `window`/`document` only
	 * from an event handler or `$effect`) is still the right one regardless.
	 * No link's href, target, or click behaviour changes: this only ever
	 * ADDS an overlay that isn't part of the normal navigation flow, which
	 * was originally required so the site would still read perfectly with
	 * JavaScript disabled — a constraint the SPA shell no longer meets site
	 * wide (the shell's HTML carries no content until the client hydrates),
	 * but this component still costs nothing extra if that constraint is
	 * ever true again for some part of the site.
	 */
	import { goto } from '$app/navigation';
	import { previewTarget, type PreviewTarget } from '$lib/address';
	import { resolvePreview, type ResolvedPreview } from '$lib/linkPreviewContent';
	import { computePanelPosition } from '$lib/floating';
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

	// The one place this component knows anything about a specific link, and
	// the reason is that the touch path is not free the way the hover path is.
	// Hovering costs the reader nothing, so it previews every internal content
	// link the site emits; tapping costs a tap, so it previews only the links
	// where a glance is the likely intent — inline citations inside prose
	// (`RefText.svelte`'s `.ref-link`, `ProseBlocks.svelte`'s
	// `.inline-ref`). Table-of-contents entries, prev/next nav and jump-box
	// results are the opposite case: the reader picked them in order to GO
	// there, and taxing that with a peek would be an obstacle, not a feature.
	// They keep their plain one-tap navigation, and still preview on hover.
	const TAP_PREVIEW_SELECTOR = 'a.ref-link, a.inline-ref';

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
	// Set only on the touch path (see `onClickCapture`). It changes what the
	// overlay IS, not merely how it was opened: a tap preview is a thing the
	// reader deliberately asked for and can act on — it stays until dismissed,
	// it takes pointer events, and it wraps its content in a real anchor. A
	// hover preview is none of those.
	let openedByTap = $state(false);
	// Captured at open time rather than read back off `anchorEl` in the
	// template: the overlay's own anchor must point at exactly the href that
	// was tapped, and reading it lazily would resolve against whatever
	// `anchorEl` happens to be by render time.
	let tapHref: string | undefined = $state();

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
		openedByTap = false;
		tapHref = undefined;
	}

	function findMatch(
		start: EventTarget | null
	): { el: HTMLAnchorElement; target: PreviewTarget } | undefined {
		if (!(start instanceof Element)) return undefined;
		const a = start.closest('a[href]');
		if (!(a instanceof HTMLAnchorElement)) return undefined;
		// A preview is supplementary reading context, not navigation chrome.
		// The marker is intentionally inherited: a TOC can opt out once on its
		// `<nav>` rather than making every row remember this global feature.
		if (a.closest('[data-link-preview="off"]')) return undefined;
		const parsed = previewTarget(a.getAttribute('href'));
		return parsed ? { el: a, target: parsed } : undefined;
	}

	/**
	 * Flip to 'loading' and fetch. `onMissing` is what to do when the href
	 * looked previewable but resolved to nothing (withheld work, missing
	 * verse, ... — see `linkPreviewContent.ts`): on hover that's simply
	 * `dismiss`, but on tap it must be a real navigation, because the reader
	 * already spent the tap that would otherwise have taken them there and a
	 * tap that does nothing at all reads as a broken link.
	 */
	function load(el: HTMLAnchorElement, matchedTarget: PreviewTarget, onMissing: () => void) {
		phase = 'loading';
		// Only the hover/focus card is a tooltip describing the link it hangs
		// off; the tap card is a thing in its own right, with its own link
		// inside it, and pointing `aria-describedby` at it would both be a lie
		// and put interactive content inside a `role="tooltip"`.
		if (!openedByTap) attachDescribedBy(el);
		resolvePreview(matchedTarget).then((r) => {
			if (anchorEl !== el) return; // the pointer moved on while this was in flight
			if (!r) {
				onMissing();
				return;
			}
			resolved = r;
			phase = 'shown';
		});
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
			load(el, matchedTarget, dismiss);
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

	// --- Touch path — the mirror image, gated on NOT having hover ------------
	//
	// A hover preview is free: the pointer was passing over the link anyway,
	// and the click still does what a click does. There is no equivalent on a
	// touch screen — no state between "not touching" and "activated" — so the
	// preview can only come out of the tap itself, which means the first tap
	// on a citation peeks and a second tap follows through. That trade is
	// worth taking for THIS content specifically: these links are dense
	// inline citations ("cf. 1212", "Jn 3:5") inside something the reader is
	// in the middle of, and the common intent is to glance, not to leave. The
	// costs are paid down deliberately below — the peek is instant (no hover
	// delay to sit through), the whole card is the follow-through target (not
	// a second precise tap on a four-character link), and the card says so.
	//
	// Escape hatches, so a reader who wanted to navigate is never trapped:
	// tapping the same link again goes there, and so does a tap on a link
	// whose content turns out not to be previewable.

	function onClickCapture(e: MouseEvent) {
		// A click inside the overlay is the follow-through: the card's own
		// anchor handles it (real link, real SvelteKit navigation), this just
		// gets the preview out of the way first. Checked before anything else
		// because that anchor's href is itself previewable and would otherwise
		// match below and re-open the preview it was dismissing.
		if (overlayEl && e.target instanceof Node && overlayEl.contains(e.target)) {
			dismiss();
			return;
		}
		if (supportsHoverPreview()) return;
		// `detail === 0` is a synthetic activation — Enter/Space on a focused
		// link, or a screen reader's activate gesture. Those users are on the
		// keyboard/focus path already (which has its own preview) and are
		// expecting activation to activate; only a real tap gets intercepted.
		if (e.detail === 0) return;
		// Open-in-new-tab and friends. Rare on touch, free to honour.
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

		const match = findMatch(e.target);
		if (!match || !match.el.matches(TAP_PREVIEW_SELECTOR)) {
			dismiss(); // a tap anywhere else closes the peek
			return;
		}
		// Second tap on the same link: they've seen the preview (or waited
		// through it) and tapped again anyway. Let it navigate.
		if (anchorEl === match.el && openedByTap) {
			dismiss();
			return;
		}

		e.preventDefault();
		e.stopPropagation(); // before SvelteKit's own delegated link handler sees it

		const href = match.el.getAttribute('href');
		dismiss();
		anchorEl = match.el;
		target = match.target;
		openedByTap = true;
		tapHref = href ?? undefined;
		// No SHOW_DELAY_MS: a tap is a deliberate request, and the delay
		// exists only to keep a travelling cursor from strobing popups.
		load(match.el, match.target, () => {
			// Nothing to preview after all — honour the tap as the navigation
			// it originally was.
			const to = tapHref;
			dismiss();
			if (to) goto(to);
		});
	}

	// --- Keyboard path — always on, no pointer-capability gate ---------------
	//
	// Both handlers stand down while a tap preview is open: tapping a link
	// focuses it, so an unguarded `focusin` would race the tap path for the
	// same anchor, and the `focusout` fired by tapping the card itself would
	// grace-period the card away underneath the tap that was following it.

	function onFocusIn(e: FocusEvent) {
		if (openedByTap) return;
		const match = findMatch(e.target);
		if (!match) return;
		beginShow(match.el, match.target);
	}

	function onFocusOut(e: FocusEvent) {
		if (openedByTap) return;
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

	$effect(() => {
		if (!anchorEl || phase === 'pending' || !overlayEl) {
			coords = undefined;
			return;
		}
		coords = computePanelPosition(
			anchorEl.getBoundingClientRect(),
			overlayEl.getBoundingClientRect()
		);
	});
</script>

<svelte:window
	onpointerover={onPointerOver}
	onpointerout={onPointerOut}
	onfocusin={onFocusIn}
	onfocusout={onFocusOut}
	onkeydown={onKeyDown}
	onclickcapture={onClickCapture}
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

	ALL OF WHICH APPLIES TO THE HOVER CARD ONLY. The tap card is the same box
	wearing a different hat: an ordinary `<a>` filling it, no tooltip role, no
	`aria-describedby`, pointer events back on. It is a real link, not a
	div with a handler, so it navigates through SvelteKit's own router, works
	under a long-press "open in new tab", and announces itself as a link — none
	of which a synthetic click handler would have given us.
-->
<div
	bind:this={overlayEl}
	id={TOOLTIP_ID}
	class="link-preview"
	class:visible={coords !== undefined}
	class:tappable={openedByTap}
	role={openedByTap ? undefined : 'tooltip'}
	style={coords ? `top:${coords.top}px; left:${coords.left}px;` : undefined}
>
	{#if openedByTap && tapHref}
		<a class="link-preview-content link-preview-link" href={tapHref}>
			{#if phase === 'shown' && resolved}
				<p class="link-preview-title">{resolved.title}</p>
				<p class="link-preview-body">{resolved.body}</p>
			{:else if phase === 'loading'}
				<p class="link-preview-body">{t('ref.tooltip.loading')}</p>
			{/if}
			<!-- The card has to SAY it is a way through, or the second tap is a
			     thing the reader has to guess at. Decorative arrow only — the
			     word carries the meaning. -->
			<p class="link-preview-open">{t('ref.preview.open')} <span aria-hidden="true">→</span></p>
		</a>
	{:else}
		<div class="link-preview-content" aria-live="polite">
			{#if phase === 'shown' && resolved}
				<p class="link-preview-title">{resolved.title}</p>
				<p class="link-preview-body">{resolved.body}</p>
			{:else if phase === 'loading'}
				<p class="link-preview-body">{t('ref.tooltip.loading')}</p>
			{/if}
		</div>
	{/if}
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

	/* Tap card only. `pointer-events` goes back to `auto` on exactly the
	   variant whose whole point is being touchable — the hover card keeps the
	   `none` above, so it still cannot intercept a cursor. */
	.link-preview.tappable {
		pointer-events: auto;
		/* A card the reader is meant to hit deserves to be hittable: the
		   anchored width above can collapse to a few characters around a short
		   Bible verse, which is fine to read and awkward to aim at. */
		min-width: min(16rem, calc(100vw - 1rem));
	}

	.link-preview-link {
		display: block;
		color: inherit;
		text-decoration: none;
		/* Compensates the container's own padding so the tap target reaches the
		   card's edges rather than stopping short of them. */
		margin: -0.6rem -0.8rem;
		padding: 0.6rem 0.8rem;
		border-radius: inherit;
	}

	.link-preview-open {
		margin: 0.5rem 0 0;
		padding-top: 0.4rem;
		border-top: 1px solid var(--color-border);
		color: var(--color-link);
		font-weight: 600;
		font-size: 0.8rem;
	}
</style>
