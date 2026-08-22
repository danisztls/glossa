/**
 * Reading font-size preference, persisted to localStorage.
 *
 * Represented as a multiplier (`--reading-scale`, default `1`) rather than
 * an absolute font size: `app.css` sets the actual base
 * reading size in `rem`/`em` and multiplies it by this custom property, so
 * this module never needs to know or care what that base size is — it only
 * ever nudges it up or down.
 *
 * `app.html`'s pre-hydration script applies the stored scale (alongside the
 * stored theme, see `theme.svelte.ts`) before first paint, so reading text
 * doesn't visibly jump size right after load.
 */

export const MIN_FONT_SCALE = 0.8;
export const MAX_FONT_SCALE = 1.8;
export const FONT_SCALE_STEP = 0.1;
export const DEFAULT_FONT_SCALE = 1;

import { writeStoredString } from './storage';

const STORAGE_KEY = 'glossa:font-scale';

/** Round to the same precision as `FONT_SCALE_STEP` to avoid float drift (0.1 + 0.1 + 0.1 …). */
function roundToStep(value: number): number {
	const decimals = (FONT_SCALE_STEP.toString().split('.')[1] ?? '').length;
	return Number(value.toFixed(decimals));
}

function clamp(value: number): number {
	return Math.min(MAX_FONT_SCALE, Math.max(MIN_FONT_SCALE, roundToStep(value)));
}

/**
 * Reads via raw `localStorage.getItem` rather than the shared
 * `readStoredString` — this is the one call site in the codebase where
 * `raw === null` (key absent) and `raw === ''` (key present but empty)
 * genuinely mean different things: `Number('')` is `0`, a finite and
 * otherwise-valid scale, whereas an absent key falls through to
 * `DEFAULT_FONT_SCALE`. `readStoredString` collapses both into `undefined`
 * and would blur that distinction, so it stays out of this one read.
 */
function readStored(): number {
	if (typeof localStorage === 'undefined') return DEFAULT_FONT_SCALE;
	const raw = localStorage.getItem(STORAGE_KEY);
	const parsed = raw === null ? NaN : Number(raw);
	return Number.isFinite(parsed) ? clamp(parsed) : DEFAULT_FONT_SCALE;
}

function apply(value: number) {
	if (typeof document !== 'undefined') {
		document.documentElement.style.setProperty('--reading-scale', String(value));
	}
	writeStoredString(STORAGE_KEY, String(value));
}

class FontScaleStore {
	value: number = $state(readStored());

	set(v: number) {
		this.value = clamp(v);
		apply(this.value);
	}

	increase() {
		this.set(this.value + FONT_SCALE_STEP);
	}

	decrease() {
		this.set(this.value - FONT_SCALE_STEP);
	}
}

export const fontScale = new FontScaleStore();
