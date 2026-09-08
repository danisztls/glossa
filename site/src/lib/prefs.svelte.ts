/**
 * HOW THE READING TEXT IS SET: its size, and which of the two faces it is set
 * in. Both persisted to localStorage, both applied before first paint.
 *
 * The size is here in full; the face is the second half of the file, under
 * `ReadingFace`. They share this module because they share a control
 * (`components/TypeMenu.svelte`) and a failure mode — either one applied late
 * is a page that visibly changes shape after it has been painted.
 *
 * The size, in detail:
 *
 * Represented as a multiplier (`--reading-scale`, default `1`) rather than
 * an absolute font size: `app.css` sets the actual base
 * reading size in `rem`/`em` and multiplies it by this custom property, so
 * this module never needs to know or care what that base size is — it only
 * ever multiplies it.
 *
 * `app.html`'s pre-hydration script applies the stored scale (alongside the
 * stored theme, see `theme.svelte.ts`) before first paint, so reading text
 * doesn't visibly jump size right after load.
 *
 * The control is in the reading bar and not in the header's settings panel.
 * What reads `--reading-scale` is
 * `.reading-text`'s `font-size` and the two lengths measured against it
 * (`--content-width`, `--compare-gutter` in `styles/tokens.css`) — all of
 * them a reading column's — so on a route that sets no reading text the
 * setting moves nothing a reader can see.
 */

/**
 * FOUR SIZES ON A RAIL, NOT ELEVEN STEPS ON A STEPPER.
 *
 * It was `[−] 120% [+]` over 0.8–1.8 in steps of 0.1, and the arithmetic that
 * makes this site's column a MEASURE is what made that shape wrong. The
 * reading column is `--measure-cpl` characters wide, so it grows with the
 * setting — 24.6rem at the bottom of the range and 55.3rem at the top — and
 * the grid centres it, so every press moved the column's start edge, and the
 * bar packed against it, and the panel hanging off the bar, about 25px
 * sideways. A reader crossing the range chased their own button through ten
 * presses and a quarter of the viewport.
 *
 * A ladder is one click. The travel is still there — it has to be, the column
 * IS the size — but a reader arrives in one gesture rather than pursuing the
 * control through every intermediate one on the way.
 *
 * THE RANGE IS UNCHANGED AND ONLY THE MIDDLE IS COARSER. 1.8 is the largest
 * size that still holds the measure — `--content-width`'s 56rem ceiling starts
 * binding at 1.83 (`styles/tokens.css`) — and 0.8 is the floor the stepper
 * already had. What is gone is the eight values between, which existed because
 * a stepper has to have a step and not because anybody wanted 1.1.
 *
 * ORDER IS THE CONTRACT: `TypeMenu` lays these out left to right along the
 * rail and steps between neighbours with the arrow keys, so this array is the
 * control's geometry, not just its values.
 */
export const FONT_SIZES = [
	{ name: 'small', scale: 0.8 },
	{ name: 'medium', scale: 1 },
	{ name: 'large', scale: 1.3 },
	{ name: 'xlarge', scale: 1.8 }
] as const;

export type FontSizeName = (typeof FONT_SIZES)[number]['name'];

export const DEFAULT_FONT_SCALE = 1;

import { readStoredString, writeStoredString } from './storage';

const STORAGE_KEY = 'glossa:font-scale';

/** The rung nearest `value`. Every scale this module admits is one of the
 *  four, so this is the clamp and the quantiser at once: out-of-range lands on
 *  the end it ran past, and anything between rungs lands on the closer. */
function snap(value: number): number {
	// `reduce<number>` rather than an inferred accumulator: the ladder is
	// `as const`, so every `scale` is its own literal type and the inferred
	// fold would be an accumulator that only ever admits 0.8.
	return FONT_SIZES.reduce<number>(
		(best, size) => (Math.abs(size.scale - value) < Math.abs(best - value) ? size.scale : best),
		FONT_SIZES[0].scale
	);
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
	if (!Number.isFinite(parsed)) return DEFAULT_FONT_SCALE;
	const snapped = snap(parsed);
	// A SCALE FROM THE STEPPER ERA IS MIGRATED, NOT RE-APPLIED. `app.html` has
	// already painted whatever was stored — 1.4, say — and re-applying the
	// nearest rung here would resize the page after first paint, which is the
	// one failure this module is built to avoid. So the new value is written to
	// storage and the reader keeps the size they had for this visit; the next
	// load paints the rung. The rail marks it as current meanwhile, and the
	// discrepancy it is lying about is at most 0.15 of a scale, for one visit,
	// once ever.
	if (snapped !== parsed) writeStoredString(STORAGE_KEY, String(snapped));
	return snapped;
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
		this.value = snap(v);
		apply(this.value);
	}
}

export const fontScale = new FontScaleStore();

/**
 * WHICH FACE THE READING TEXT IS SET IN.
 *
 * `serif` is EB Garamond, the text face this site is designed in and the
 * default; `sans` is Source Sans 3, already downloaded on every visit for the
 * chrome. The reason for offering the second is legibility rather than taste
 * — see the `:root[data-face='sans']` block in `styles/tokens.css`, which
 * carries the argument and the metrics the choice moves.
 *
 * AN ATTRIBUTE ON `<html>`, NOT A CUSTOM PROPERTY, which is the shape the
 * theme axes already use (`theme.svelte.ts`) and the only one that works
 * here. The face changes `--prose-char-advance`, and `--content-width` is
 * declared on `:root` and resolves against `:root`'s value of it — so the
 * switch has to land on the document element or the column stays measured
 * for the other face. `styles/tokens.css` says the same thing from the CSS
 * side, at more length.
 *
 * THE DEFAULT IS THE ABSENT ATTRIBUTE, so a first-ever visit needs no
 * storage read to be correct and the serif never waits on JavaScript. Only
 * `sans` is ever written; choosing the serif back REMOVES the key rather
 * than storing `'serif'`. That is a deliberate difference from
 * `calendar-pref.ts`, which stores its default explicitly because "never
 * chose" and "chose the general calendar" are different states there and it
 * guesses at the first. Nothing guesses here: there is one default and it is
 * the same for everybody.
 */
export type ReadingFace = 'serif' | 'sans';

const FACE_KEY = 'glossa:face';

class FaceStore {
	value: ReadingFace = $state(readStoredString(FACE_KEY) === 'sans' ? 'sans' : 'serif');

	set(face: ReadingFace) {
		this.value = face;
		if (typeof document !== 'undefined') {
			if (face === 'sans') document.documentElement.setAttribute('data-face', 'sans');
			else document.documentElement.removeAttribute('data-face');
		}
		writeStoredString(FACE_KEY, face === 'sans' ? 'sans' : undefined);
	}
}

export const readingFace = new FaceStore();
