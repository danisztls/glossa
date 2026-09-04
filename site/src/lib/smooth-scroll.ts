/**
 * The page's own scroll animation, for the one movement the site computes
 * itself: a keyboard step from one reference number to the next.
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

/** Stop wherever the page has got to. */
export function cancelSpringScroll(): void {
	if (frame) cancelAnimationFrame(frame);
	frame = 0;
}

function tick(now: number): void {
	frame = 0;

	// Somebody else moved the page — see DRIFT_TOLERANCE. Their scroll wins;
	// this one is abandoned where it stands rather than fought for a frame.
	if (Math.abs(window.scrollY - written) > DRIFT_TOLERANCE) return;

	const dt = (now - lastFrameTime) / 1000;
	lastFrameTime = now;
	state = stepSpring(state, target, dt);

	if (hasSettled(state, target)) {
		window.scrollTo({ top: target, behavior: 'auto' });
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
