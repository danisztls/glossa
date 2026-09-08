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
 * ever nudges it up or down.
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

export const MIN_FONT_SCALE = 0.8;
export const MAX_FONT_SCALE = 1.8;
export const FONT_SCALE_STEP = 0.1;
export const DEFAULT_FONT_SCALE = 1;

import { readStoredString, writeStoredString } from './storage';

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

	reset() {
		this.set(DEFAULT_FONT_SCALE);
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
