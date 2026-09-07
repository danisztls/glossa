/**
 * The page's own scroll animation, for every movement the site computes
 * itself: a keyboard step from one reference number to the next, the way back
 * to the top, and the fragment jumps `anchor-scroll.ts` replays.
 *
 * The step is the one that SHAPED it, and the rest of this docblock argues
 * from it — it is the hardest case, being the one whose target moves while the
 * animation is running. The other two go through `glideScrollTo` below, which
 * is this with a cap on how much travel it will show.
 *
 * WHY NOT `behavior: 'smooth'`, WHICH THIS REPLACES. The native animation is
 * a fixed curve of the browser's choosing, and it has one property this
 * control cannot live with: a second `scrollTo` while the first is running
 * RESTARTS it. Holding a step key repeats at the keyboard's rate — thirty
 * times a second on a normal setting — so every frame began a fresh
 * animation from a standing start, and what the reader felt was not a glide
 * but a stack of little lurches. The step is exactly the case where the
 * target moves faster than any single animation can finish.
 *
 * SO THE MOTION IS A CRITICALLY DAMPED SPRING, which is the shape that
 * answers that: the target may move at any moment and the position and
 * VELOCITY both stay continuous across the change. Nothing restarts, because
 * nothing was a fixed curve in the first place — there is only ever a point
 * being pulled toward wherever the target now is. Critically damped is the
 * specific choice among springs: it is the fastest approach that does not
 * overshoot, and a reading page that sailed past the paragraph and came back
 * would be worse than a hard jump.
 *
 * It also gives the single press what the native curve gives it — a soft
 * start and a soft stop, since the spring begins at rest and arrives at rest
 * — and it does so on a longer, gentler settle than any browser's default.
 *
 * THE STEP IS SOLVED, NOT INTEGRATED. `stepSpring` is the closed form of the
 * critically damped equation, so it is exact at any `dt` and cannot go
 * unstable on a dropped frame or a background tab that wakes up half a second
 * later. A Euler integrator would have needed a clamp on `dt` and a comment
 * apologising for it.
 */

/** Where the page is and how fast it is going, in CSS pixels and px/s. */
export interface SpringState {
	position: number;
	velocity: number;
}

/**
 * How hard the spring pulls, in radians per second. THE ONE NUMBER TO TURN.
 *
 * A critically damped spring is within a percent of its target after about
 * `6.6 / omega` seconds, so 14 settles in a bit under half a second — slower
 * and gentler than Chrome's native curve for the distances a reference step
 * covers, which is the whole point of doing this by hand, and still short of
 * the point where a single press starts to feel like waiting.
 *
 * Peak speed is `omega * distance / e`, so it scales with how far the step
 * has to go rather than being a constant the short steps have to live with.
 */
const OMEGA = 14;

/** Close enough, and slow enough, to stop pretending: half a pixel is below
 *  what any display can show, and 20px/s is a millimetre a second. */
const SNAP_DISTANCE = 0.5;
const SNAP_VELOCITY = 20;

/**
 * How far the page may be from where this module last put it before the
 * animation concludes somebody else is scrolling and gets out of the way.
 *
 * ONE CHECK RATHER THAN A SET OF LISTENERS, and it is the more complete
 * answer: a wheel, a trackpad, a scrollbar drag, Space or Page Down, a
 * find-in-page match, an anchor jump — every one of them moves the page, and
 * every one of them is caught here. Cancelling on `wheel` and `touchstart`
 * alone would have left the keys, which is the input most likely to arrive
 * while a keyboard reader is stepping.
 *
 * Two pixels rather than zero because the value read back is not always the
 * value written: the page clamps at its ends and rounds to device pixels.
 */
const DRIFT_TOLERANCE = 2;

/**
 * Advance a critically damped spring by `dt` seconds — the closed form of
 * `x'' = -2ω x' - ω²(x - target)`, which is why it takes no integrator and no
 * step-size limit.
 *
 * `a` is the displacement left to cover and `b` the coefficient the initial
 * velocity contributes; the whole solution is `(a + b·t)·e^(-ω·t)` measured
 * from the target. At `dt = 0` it returns its input unchanged, which is the
 * property that makes it safe to call on a frame the browser served twice.
 */
export function stepSpring(
	state: SpringState,
	target: number,
	dt: number,
	omega: number = OMEGA
): SpringState {
	const a = state.position - target;
	const b = state.velocity + omega * a;
	const decay = Math.exp(-omega * dt);
	const offset = a + b * dt;
	return {
		position: target + offset * decay,
		velocity: (b - omega * offset) * decay
	};
}

/** True when the spring is near enough its target to stop drawing frames. */
export function hasSettled(state: SpringState, target: number): boolean {
	return (
		Math.abs(state.position - target) < SNAP_DISTANCE && Math.abs(state.velocity) < SNAP_VELOCITY
	);
}

/**
 * How much travel a glide may actually SHOW, in viewport heights.
 *
 * The spring settles in a constant time whatever the distance, so peak speed
 * is `ω·distance/e` and scales without limit — over a whole part of the
 * Catechism that is a strobe of text nobody reads, at a frame cost nobody
 * asked for. A jump covers the surplus and the spring covers the last leg.
 *
 * A viewport and a half rather than one: at exactly one screen the reader
 * sees a page of text they have not read scroll past and nothing of where
 * they were, which is a cut with a delay in front of it rather than a move.
 */
export const GLIDE_VIEWPORTS = 1.5;

/**
 * Where a glide to `to` should begin, given the page is at `from`.
 *
 * Inside the limit it is `from` — nothing is skipped, and the short hops
 * (a heading two screens down) glide the whole way. Past it, the start is
 * pulled to the limit on the SIDE the reader is coming from, so the direction
 * of travel is still the direction they moved.
 */
export function glideStart(from: number, to: number, viewport: number): number {
	const distance = from - to;
	const limit = viewport * GLIDE_VIEWPORTS;
	return Math.abs(distance) <= limit ? from : to + Math.sign(distance) * limit;
}

/* ------------------------------------------------------------------------ *
 * The DOM half. One animation at a time, because there is one document
 * scrollport and a second spring pulling at it would be two hands on the
 * same page.
 * ------------------------------------------------------------------------ */

let frame = 0;
let target = 0;
let state: SpringState = { position: 0, velocity: 0 };
let lastFrameTime = 0;
/** What this module last asked the page to be, for the drift check. */
let written = 0;
/** The element a glide is following, if it was given one. */
let anchor: HTMLElement | null = null;
/** How far the scroll offset that SHOWS `anchor` sits from `anchor`'s own top
 *  in the document — the browser's own answer to where a fragment lands
 *  (`scroll-padding-top`, in practice), kept as a difference so that it stays
 *  true wherever the element moves to. */
let anchorOffset = 0;

/**
 * Glide the page to `top`.
 *
 * CALLING IT AGAIN RETARGETS RATHER THAN RESTARTS — that is the whole reason
 * this module exists, so the second call deliberately does not touch
 * `state`: the page keeps the speed it already had and simply starts being
 * pulled somewhere else.
 *
 * A reader who has asked their system for less motion gets the position and
 * none of the travel. The check is made here rather than by each caller so
 * there is one place it can be got wrong.
 */
export function springScrollTo(top: number): void {
	target = top;
	anchor = null;

	if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
		cancelSpringScroll();
		window.scrollTo({ top, behavior: 'auto' });
		return;
	}

	if (frame) return;
	state = { position: window.scrollY, velocity: 0 };
	written = state.position;
	lastFrameTime = performance.now();
	frame = requestAnimationFrame(tick);
}

/**
 * `springScrollTo` with the travel capped — the form to reach for whenever the
 * distance is the reader's to choose rather than a step of one reference
 * number, which is the only caller small enough not to need it.
 *
 * The jump and the spring's first frame land in one rendering update, so the
 * page is never painted at the intermediate position.
 */
export function glideScrollTo(top: number): void {
	const start = glideStart(window.scrollY, top, window.innerHeight);
	if (start !== window.scrollY) window.scrollTo({ top: start, behavior: 'auto' });
	springScrollTo(top);
}

/**
 * `glideScrollTo`, but to an ELEMENT — the form every fragment jump wants.
 *
 * `top` is where the destination is right now, which the caller has from the
 * browser: it is what the browser itself scrolled to, so the whole of
 * `scroll-padding-top` and any `scroll-margin` on the element is already in it
 * and nothing here has to re-derive them. What is stored is the DIFFERENCE
 * between that offset and the element's own place in the document, which is
 * the part that stays true if the element moves.
 */
export function glideScrollToElement(el: HTMLElement, top: number): void {
	glideScrollTo(top);
	// Nothing is animating: a reader who asked for less motion is already
	// there, and there is no frame in which to follow anything.
	if (!frame) return;
	anchor = el;
	anchorOffset = top - (el.getBoundingClientRect().top + window.scrollY);
}

/**
 * Is this module driving the scrollport right now?
 *
 * For the scroll-position consumers that answer "where is the READER" — the
 * scroll spy, and anything else that reads a position to decide what to show.
 * A scroll the site is performing has a destination that was already chosen,
 * and every offset on the way to it is one nobody asked a question about, so
 * reporting them is work with no reader behind it.
 */
export function springScrolling(): boolean {
	return frame !== 0;
}

/** Stop wherever the page has got to. */
export function cancelSpringScroll(): void {
	if (frame) cancelAnimationFrame(frame);
	frame = 0;
	anchor = null;
}

function tick(now: number): void {
	frame = 0;

	// A GLIDE THAT WAS GIVEN AN ELEMENT FOLLOWS THE ELEMENT. The offset a
	// fragment lands at is computed once, before any of the travel has
	// happened, and half a second is long enough for the page to stop agreeing
	// with it: a font arriving and swapping re-measures every line above the
	// target, and the reader ends up at a neighbouring heading. Worse, the
	// browser's own scroll anchoring compensates for that shift by moving the
	// scrollport — which reads here as somebody else scrolling, so the drift
	// check below would abandon the glide mid-flight rather than merely land
	// short. Re-deriving the target from the element each frame answers both:
	// the destination is the element, not the number it stood at.
	if (anchor) {
		const want = anchor.getBoundingClientRect().top + window.scrollY + anchorOffset;
		if (want !== target) {
			// The page moved because the DOCUMENT moved, so adopt the new
			// position rather than reading it as the reader taking over —
			// carrying the spring's own position along by the same amount, or
			// the next write would yank the page back by the shift.
			state.position += window.scrollY - written;
			written = window.scrollY;
			target = want;
		}
	}

	// Somebody else moved the page — see DRIFT_TOLERANCE. Their scroll wins;
	// this one is abandoned where it stands rather than fought for a frame.
	if (Math.abs(window.scrollY - written) > DRIFT_TOLERANCE) return;

	const dt = (now - lastFrameTime) / 1000;
	lastFrameTime = now;
	state = stepSpring(state, target, dt);

	if (hasSettled(state, target)) {
		window.scrollTo({ top: target, behavior: 'auto' });
		anchor = null;
		return;
	}

	// `left` is deliberately absent: the two-argument form would reset the
	// inline scroll offset to 0, and a wide table mid-pan is not this
	// function's to move.
	window.scrollTo({ top: state.position, behavior: 'auto' });
	// Read back rather than trusting the write: the page clamps at its ends
	// and rounds to device pixels, and both would otherwise read as drift on
	// the next frame and cancel the animation.
	written = window.scrollY;
	frame = requestAnimationFrame(tick);
}
