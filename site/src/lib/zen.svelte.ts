/**
 * Focus mode: the reading page with everything but the text taken away,
 * persisted to localStorage.
 *
 * A FIFTH AXIS ON `<html>`, written exactly as `theme.svelte.ts` writes its
 * four (`data-theme`, `data-sepia`, `data-oled`, `data-mono`) and for the
 * same reason: what is hidden is a question for the stylesheet, and a
 * presence-only attribute on the root is the one place every component's
 * scoped CSS can be reached from. `styles/zen.css` is the whole of the
 * behaviour; nothing in this module knows what a header is.
 *
 * IT IS CALLED `zen` HERE AND "FOCUS" ON SCREEN. The editors that popularised
 * the arrangement call it Zen Mode and that is the name a developer searches
 * for, so it is the name in the code; but this site publishes the Catechism
 * and the Code of Canon Law, and a Buddhist school of meditation is not the
 * register its chrome is written in. `zen.enter`/`zen.exit` carry the
 * reader-facing wording, and the two are allowed to differ.
 *
 * THE ATTRIBUTE ALONE IS NOT THE FEATURE — see `styles/zen.css`, which gates
 * every rule on `:has(.reading-bar)`. Nothing here needs to know which route
 * is showing, and deliberately cannot: the preference outlives a navigation
 * (a reader working through a 287-section encyclical crosses many), and the
 * stylesheet is what declines to apply it on a page with no way back out.
 *
 * `app.html` applies the stored value before first paint, alongside the theme
 * and the font scale, so a returning reader does not watch the site header
 * appear and then vanish. That copy carries no migration and no default:
 * absent means off.
 */

import { readStoredString, writeStoredString } from './storage';

const STORAGE_KEY = 'glossa:zen';

class ZenStore {
	/** Read once at module load. Not applied here — `app.html` has already
	 *  put the attribute on `<html>`, and re-writing it would only be a
	 *  second source of truth for the same value. */
	on: boolean = $state(readStoredString(STORAGE_KEY) === '1');

	set(on: boolean) {
		this.on = on;
		this.#apply();
	}

	toggle() {
		this.set(!this.on);
	}

	/** Presence-only, like `data-sepia` and the two beside it: the attribute
	 *  records the reader's choice and `styles/zen.css` decides where it
	 *  applies. Removed rather than set to `0` when off, so the selector is
	 *  `[data-zen]` and never `[data-zen='1']`. */
	#apply() {
		if (typeof document !== 'undefined') {
			const root = document.documentElement;
			if (this.on) {
				root.setAttribute('data-zen', '');
			} else {
				root.removeAttribute('data-zen');
			}
		}
		writeStoredString(STORAGE_KEY, this.on ? '1' : undefined);
	}
}

export const zen = new ZenStore();
