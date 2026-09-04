import { describe, expect, it } from 'vitest';
import { hasSettled, stepSpring, type SpringState } from './smooth-scroll';

const AT_REST = (position: number): SpringState => ({ position, velocity: 0 });

/** Run the spring at a steady 60fps for `ms`, the way a healthy frame loop
 *  would, and hand back where it ended up. */
function run(from: SpringState, target: number, ms: number, omega?: number): SpringState {
	let state = from;
	for (let t = 0; t < ms; t += 1000 / 60) state = stepSpring(state, target, 1 / 60, omega);
	return state;
}

describe('stepSpring', () => {
	it('is the identity at dt = 0, so a frame served twice cannot move the page', () => {
		const state = { position: 120, velocity: 400 };
		expect(stepSpring(state, 900, 0)).toEqual(state);
	});

	it('leaves at rest, so the first frame is a nudge and not a jump', () => {
		// A tenth of the way would be a lurch; the spring covers a fortieth,
		// which is the soft start `behavior: 'smooth'` also gives.
		const first = stepSpring(AT_REST(0), 1000, 1 / 60);
		expect(first.position).toBeGreaterThan(0);
		expect(first.position).toBeLessThan(1000 / 20);
	});

	it('arrives, and arrives stopped', () => {
		const settled = run(AT_REST(0), 1000, 800);
		expect(settled.position).toBeCloseTo(1000, 0);
		// A couple of pixels a second: below what a display can show, and well
		// under the speed `hasSettled` is willing to stop at.
		expect(Math.abs(settled.velocity)).toBeLessThan(5);
	});

	it('never overshoots from rest — critically damped is the point', () => {
		let state = AT_REST(0);
		for (let t = 0; t < 1500; t += 1000 / 60) {
			state = stepSpring(state, 1000, 1 / 60);
			expect(state.position).toBeLessThanOrEqual(1000);
		}
	});

	it('runs the same distance upward as downward', () => {
		const down = run(AT_REST(0), 500, 200);
		const up = run(AT_REST(0), -500, 200);
		expect(down.position).toBeCloseTo(-up.position, 6);
	});

	it('is exact rather than integrated: one long step matches many short ones', () => {
		const stepwise = run(AT_REST(0), 1000, 500);
		let coarse = AT_REST(0);
		// The same half second in three ragged frames — a dropped frame, or a
		// tab the browser stopped drawing.
		for (const dt of [0.31, 0.12, 0.07]) coarse = stepSpring(coarse, 1000, dt);
		expect(coarse.position).toBeCloseTo(stepwise.position, 0);
	});

	it('keeps its velocity when the target moves, which is what a held key does', () => {
		const moving = run(AT_REST(0), 1000, 100);
		expect(moving.velocity).toBeGreaterThan(0);
		// Retargeting is just the next call with a different target: the state
		// carries over untouched, so there is no standing start to feel.
		const retargeted = stepSpring(moving, 2000, 1 / 60);
		expect(retargeted.velocity).toBeGreaterThan(moving.velocity);
	});

	it('settles faster with a stiffer spring', () => {
		const soft = run(AT_REST(0), 1000, 200, 7);
		const stiff = run(AT_REST(0), 1000, 200, 21);
		expect(stiff.position).toBeGreaterThan(soft.position);
	});
});

describe('hasSettled', () => {
	it('is false while there is anything left to see', () => {
		expect(hasSettled({ position: 0, velocity: 0 }, 1000)).toBe(false);
		expect(hasSettled({ position: 999.9, velocity: 400 }, 1000)).toBe(false);
	});

	it('needs both halves: near the target AND slow', () => {
		expect(hasSettled({ position: 1000.1, velocity: 5 }, 1000)).toBe(true);
		expect(hasSettled({ position: 1000.1, velocity: 900 }, 1000)).toBe(false);
	});

	it('agrees with the spring: a settled run reports settled', () => {
		expect(hasSettled(run(AT_REST(0), 1000, 800), 1000)).toBe(true);
	});
});
