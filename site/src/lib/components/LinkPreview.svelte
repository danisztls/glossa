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
	 * has to remember this feature exists to get it. Which links those are, and
	 * which of hover and tap each one answers, is `citation-links.ts`'s
	 * `data-link-preview` marker — read there, not here. Navigation contexts
	 * opt out on the link OR any ancestor, which keeps a TOC from previewing
	 * every destination and lets chapter readers exempt a unit-number link when
	 * the very same unit is already on screen.
	 *
	 * ONE REUSABLE OVERLAY, not one instance per link: at most one preview is
	 * ever relevant (the reader has one pointer and one focus), so a single
	 * fixed-position node reused across every hover avoids mounting/unmounting
	 * a component on every pointer move.
	 *
	 * `popover="manual"` AND NOT `auto`, for one reason: the top layer. A
	 * citation's own card (`CitationDisclosure`) is an `auto` popover, and
	 * anything in the top layer paints above the whole ordinary document
	 * however high its `z-index` — so while this was a plain `z-index: 70`
	 * div, a preview raised from a link INSIDE an open citation rendered
	 * behind the card that raised it, and the links in there had to be opted
	 * out of previewing altogether. In the top layer the two are ordered by
	 * when they were shown, and this is always shown second. `manual` is what
	 * makes that safe: an `auto` popover would light-dismiss the citation it
	 * was opened from, and this component already owns every path that closes
	 * it — a timer, a pointer leaving, Escape, a scroll. It wants the layer
	 * and none of the behaviour.
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
	 * shell with `ssr = false` (`+layout.ts`, site/docs/shell.md)
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
	import type { PreviewTarget } from '$lib/address';
	import { citationLink } from '$lib/citation-links';
	import { resolvePreview, type ResolvedPreview } from '$lib/linkPreviewContent';
	import { computePanelPosition, canHover, HOVER_OPEN_MS, HOVER_CLOSE_MS } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';

	// The two delays and the pointer-capability test live in `floating.ts`,
	// shared with the footnote marker's own hover card: the same gesture over
	// the same prose, which cannot want two different numbers.
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
		resolvePreview(matchedTarget)
			.then((r) => {
				if (anchorEl !== el) return; // the pointer moved on while this was in flight
				if (!r) {
					onMissing();
					return;
				}
				resolved = r;
				phase = 'shown';
			})
			// A READ THAT THREW IS A PREVIEW THAT RESOLVED TO NOTHING, and the
			// two want the same answer: dismiss on hover, navigate on tap — at
			// which point the route says what happened. Without this the card
			// sits in `loading` for ever and the rejection reaches nothing.
			// Rare while the only cause was a network already gone; routine
			// since offline mode, where hovering a citation to a chapter this
			// device does not hold is an ordinary thing to do.
			.catch(() => {
				if (anchorEl === el) onMissing();
			});
	}

	function beginShow(el: HTMLAnchorElement, matchedTarget: PreviewTarget) {
		if (anchorEl === el) {
			// Already tracking this exact link (pending, loading, or shown) — but
			// the pointer may be arriving BACK on it from the card, which
			// scheduled a hide on its way out. Coming home cancels that, exactly
			// as arriving in the card cancels the one the link scheduled.
			if (hideTimer) {
				clearTimeout(hideTimer);
				hideTimer = undefined;
			}
			return;
		}
		dismiss();
		anchorEl = el;
		target = matchedTarget;
		showTimer = setTimeout(() => {
			// Re-check identity: `dismiss()` may have run (a later hover, an
			// Escape, a scroll) between this timer being scheduled and firing.
			if (anchorEl !== el) return;
			load(el, matchedTarget, dismiss);
		}, HOVER_OPEN_MS);
	}

	/**
	 * Whether the reader is part-way through copying out of the card.
	 *
	 * A selection is a piece of work in progress and the pointer has no more to
	 * say about it: the hand that dragged across the passage now goes to the
	 * keyboard, and a card that vanished on the way would take the selection
	 * with it. So the grace period re-arms instead of firing while one stands,
	 * and the card is left to the paths that mean it — Escape, a scroll, or
	 * another link.
	 */
	function selecting(): boolean {
		if (!overlayEl) return false;
		const sel = window.getSelection();
		if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false;
		return overlayEl.contains(sel.getRangeAt(0).commonAncestorContainer);
	}

	function scheduleHide(el: HTMLAnchorElement) {
		if (anchorEl !== el) return;
		if (phase === 'pending') {
			dismiss(); // never became visible — nothing to grace-period
			return;
		}
		if (hideTimer) clearTimeout(hideTimer);
		hideTimer = setTimeout(() => {
			if (anchorEl !== el) return;
			if (selecting()) {
				scheduleHide(el);
				return;
			}
			dismiss();
		}, HOVER_CLOSE_MS);
	}

	/**
	 * THE CARD IS PART OF THE REGION ITS LINK IS, which is WCAG 2.1's
	 * "hoverable" under 1.4.13 and, long before it was a criterion, the only
	 * way a preview is worth anything: the passage in it names further
	 * references, and its text is there to be read and copied. While the card
	 * could not be entered at all, the pointer crossing the `GAP` to reach it
	 * was a departure like any other and the grace period ran out underneath
	 * the reader. `NoteCard` has answered this since the footnote card existed
	 * (`sidenotes.svelte.ts`, "entering the card counts as entering the
	 * marker"); this is the same arrangement, written out here because the two
	 * panels keep their own state machines.
	 *
	 * The TAP card stands down: it is dismissed by its own click handler and
	 * by a tap anywhere else, and it is open on a pointer that cannot hover.
	 */
	function onOverlayEnter() {
		if (openedByTap || !anchorEl) return;
		if (hideTimer) {
			clearTimeout(hideTimer);
			hideTimer = undefined;
		}
	}

	function onOverlayLeave() {
		if (openedByTap || !anchorEl) return;
		scheduleHide(anchorEl);
	}

	// --- Pointer path — gated behind a hover-capable, fine pointer -----------

	function onPointerOver(e: PointerEvent) {
		if (!canHover()) return;
		const match = citationLink(e.target);
		if (!match) return;
		beginShow(match.el, match.target);
	}

	function onPointerOut(e: PointerEvent) {
		if (!anchorEl) return;
		const leaving = citationLink(e.target);
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
	// worth taking for a citation specifically: these links name a passage
	// inside something the reader is in the middle of, and the common intent
	// is to glance, not to leave. The costs are paid down deliberately below —
	// the peek is instant (no hover delay to sit through), the whole card is
	// the follow-through target (not a second precise tap on a four-character
	// link), and the card says so.
	//
	// Escape hatches, so a reader who wanted to navigate is never trapped:
	// tapping the same link again goes there, and so does a tap on a link
	// whose content turns out not to be previewable.

	function onClickCapture(e: MouseEvent) {
		// A click inside the TAP overlay is the follow-through: the card's own
		// anchor handles it (real link, real SvelteKit navigation), this just
		// gets the preview out of the way first. Checked before anything else
		// because that anchor's href is itself previewable and would otherwise
		// match below and re-open the preview it was dismissing.
		//
		// Inside the HOVER card it is the end of a drag across the text, and
		// dismissing there would throw away the selection the drag just made.
		// Nothing in that card is clickable, so doing nothing is the whole of
		// the right answer.
		if (overlayEl && e.target instanceof Node && overlayEl.contains(e.target)) {
			if (openedByTap) dismiss();
			return;
		}
		if (canHover()) return;
		// `detail === 0` is a synthetic activation — Enter/Space on a focused
		// link, or a screen reader's activate gesture. Those users are on the
		// keyboard/focus path already (which has its own preview) and are
		// expecting activation to activate; only a real tap gets intercepted.
		if (e.detail === 0) return;
		// Open-in-new-tab and friends. Rare on touch, free to honour.
		if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

		const match = citationLink(e.target);
		// A destination — a jump-box result, a reading pick, a bookmark row —
		// was chosen in order to GO there. It previews under a cursor, which
		// costs nothing, and never under a thumb, which costs the tap.
		if (!match || match.kind !== 'citation') {
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
		// No HOVER_OPEN_MS: a tap is a deliberate request, and the delay
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
		const match = citationLink(e.target);
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
			if (overlayEl?.matches(':popover-open')) overlayEl.hidePopover();
			return;
		}
		// SHOWN BEFORE IT IS MEASURED, and the order is forced: a closed
		// popover is `display: none`, so its own box — half of what
		// `computePanelPosition` needs — reads as zero until it is open. The
		// frame between is not visible, because `.visible` (and with it the
		// opacity this fades in from) is driven by `coords`, which is set in
		// the same synchronous turn.
		if (!overlayEl.matches(':popover-open')) overlayEl.showPopover();
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

	"No interactive elements" stays true of the hover card because there is
	nothing interactive IN it — two paragraphs of text — and not because the
	pointer is kept out. It used to be kept out, by a blanket
	`pointer-events: none`, and that is what made the card unreachable: the
	reader could not cross the `GAP` to read the rest of a passage, follow a
	reference it named, or select a line to copy, because the pointer leaving
	the link was a departure and the card was not anywhere to arrive. The
	stylesheet now grants pointer events for exactly as long as the card is
	placed and opaque (`.visible`), which also keeps a card mid-fade from
	swallowing a click meant for the page behind it.

	ALL OF WHICH APPLIES TO THE HOVER CARD ONLY. The tap card is the same box
	wearing a different hat: an ordinary `<a>` filling it, no tooltip role, no
	`aria-describedby`, pointer events back on. It is a real link, not a
	div with a handler, so it navigates through SvelteKit's own router, works
	under a long-press "open in new tab", and announces itself as a link — none
	of which a synthetic click handler would have given us.
-->
<!-- The card has to SAY it is a way through, or the second tap is a thing the
     reader has to guess at — but it says so at the end of the text it is
     about rather than in a bordered row of its own. Floated to the end of the
     last line, it reads as a quiet trailing marker instead of a second target
     competing with the passage; the whole card is the tap target either way,
     which is what lets the label be this small. No arrow: the word carries
     the meaning, and small caps in the link colour are already saying
     "affordance" without a glyph pointing off the edge of the card. -->
{#snippet openMarker()}<span class="link-preview-open">{t('ref.preview.open')}</span>{/snippet}

<div
	bind:this={overlayEl}
	id={TOOLTIP_ID}
	popover="manual"
	onpointerenter={onOverlayEnter}
	onpointerleave={onOverlayLeave}
	class="panel-surface floating-panel link-preview"
	class:visible={coords !== undefined}
	class:tappable={openedByTap}
	role={openedByTap ? undefined : 'tooltip'}
	style={coords ? `top:${coords.top}px; left:${coords.left}px;` : undefined}
>
	{#if openedByTap && tapHref}
		<a class="link-preview-content link-preview-link" href={tapHref}>
			{#if phase === 'shown' && resolved}
				<p class="link-preview-title">{resolved.title}</p>
				<p class="link-preview-body">{resolved.body}{@render openMarker()}</p>
			{:else if phase === 'loading'}
				<p class="link-preview-body">{t('ref.tooltip.loading')}{@render openMarker()}</p>
			{/if}
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
	 *
	 * The card itself — fill, hairline, corner, shadow, sans face — is
	 * `.floating-panel` in app.css, shared with the two popovers that are the
	 * same object seen from elsewhere. What is left here is what only a
	 * preview has: it is hidden until placed, and it fades.
	 *
	 * PLACED AND OPAQUE IS EXACTLY WHEN IT TAKES THE POINTER. A card the
	 * reader can reach is the point of it (see the comment above the markup),
	 * but `visibility` and the discrete `display` both flip at the END of the
	 * exit transition, so a card that kept its pointer events throughout would
	 * go on eating clicks for 120ms after it had visually gone. Tying them to
	 * `.visible` — the class that drives the fade — makes it inert on the
	 * frame the fade starts.
	 */
	.link-preview {
		pointer-events: none;
		max-width: min(24rem, calc(100vw - 1rem));
		padding: 0.6rem 0.8rem;
		font-size: 0.85rem;
		line-height: 1.5;
		color: var(--color-text);
		opacity: 0;
		visibility: hidden;
		transform: translateY(-2px);
	}

	@media (prefers-reduced-motion: no-preference) {
		.link-preview {
			/* `display` and `overlay` are discrete properties, and a popover
			   drops out of the top layer the instant it is hidden — so without
			   `allow-discrete` on both, the card would vanish rather than fade
			   and only the entrance would animate. */
			transition:
				opacity 120ms ease,
				transform 120ms ease,
				visibility 120ms,
				overlay 120ms allow-discrete,
				display 120ms allow-discrete;
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
		pointer-events: auto;
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
		/* Contains the floated "Open" marker, so a card whose last line has no
		   room for it grows rather than letting the marker hang out of the box. */
		display: flow-root;
	}

	/* Tap card only. */
	.link-preview.tappable {
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

	/* Floated rather than given a row of its own: placed after all of the
	   paragraph's text, a float lands on the last line it occurs in, at that
	   line's end — which is where a trailing marker belongs, and it costs the
	   card no height at all when the line has room. Logical `inline-end`, so it
	   follows the direction of the text it trails. */
	.link-preview-open {
		float: inline-end;
		/* A float's top aligns with the top of the line box it lands in, so a
		   label this much smaller than the body would ride high against the
		   last line. The block nudge is half the difference between the two
		   boxes, which centres it on that line. */
		margin-block-start: 0.24rem;
		margin-inline-start: 0.75rem;
		color: var(--color-link);
		font-size: 0.66rem;
		font-weight: 600;
		/* Uppercased in CSS and not in the dictionaries: the fourteen strings
		   stay sentence case for every other consumer, and a locale whose
		   script has no case (ar) is left alone by the property rather than
		   having a shouting translation written for it. */
		text-transform: uppercase;
		letter-spacing: 0.08em;
		white-space: nowrap;
	}
</style>
