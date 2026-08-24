/**
 * Appearance settings — the light/dark mode, the sepia paper tint and the
 * OLED true-black ground — persisted to localStorage.
 *
 * THREE AXES, NOT N THEMES. This used to be a single `Theme` of
 * auto/light/dark/sepia, which forced two unrelated questions through one
 * value: "do I want dark?" and "do I want warm paper?". A reader on sepia
 * could not also follow the system's dark preference at night — picking
 * sepia meant opting out of `prefers-color-scheme` entirely, with nothing
 * in the UI saying so. They are now independent, and OLED joined them as a
 * third rather than as a fourth value of the first:
 *
 *   `mode`   'auto' (follow prefers-color-scheme) | 'on' | 'off'
 *   `sepia`  a boolean paper tint
 *   `oled`   a boolean true-black ground
 *
 * SEPIA IS A LIGHT-MODE TINT and goes inert whenever dark is actually
 * showing — there is no dark-sepia palette, and a warm dark would be a new
 * design, not a combination of two existing ones. `sepiaActive` is what the
 * DOM follows; `sepia` stays as the reader left it, so switching dark back
 * off restores their tint rather than silently clearing it. The menu greys
 * the toggle out and says why while it is inert.
 *
 * OLED IS THE SAME SHAPE MIRRORED — a dark-mode-only modifier, inert in
 * light — and is deliberately a modifier rather than a fourth `mode` value.
 * "Do I want dark?" and "should dark's ground be pure black?" are the same
 * two-questions-in-one-value mistake the old `Theme` made: as a mode it
 * could not be combined with 'auto', so a reader who wanted true black at
 * night would have had to give up following the system to get it. As a flag
 * it composes with all three. `oledActive`/`sepiaActive` are exact mirrors,
 * and the two can never both be showing, since each yields to the other's
 * half of the light/dark axis.
 *
 * `'auto'` is persisted explicitly, the same as any other value, rather
 * than treating "nothing in localStorage" as the only way to be in auto
 * mode. That's deliberate: a reader who picked 'off' and wants to go back
 * to following the system needs a real, storable choice to return to — not
 * just "clear your storage". It is also what stops `migrateLegacyTheme`
 * below from firing a second time once the reader has touched the setting.
 *
 * `app.html` also runs a tiny inline script that applies these (and the
 * font scale, see `prefs.svelte.ts`) before the app hydrates, to avoid a
 * flash of the wrong theme. It carries the same legacy migration.
 */

import { readStoredString, writeStoredString } from './storage';

export type DarkMode = 'auto' | 'on' | 'off';

const MODE_KEY = 'glossa:dark-mode';
const SEPIA_KEY = 'glossa:sepia';
const OLED_KEY = 'glossa:oled';
/** The single-valued key the axes above replaced; read once, then cleared. */
const LEGACY_KEY = 'glossa:theme';

export const DARK_MODES: DarkMode[] = ['auto', 'on', 'off'];
const DEFAULT_MODE: DarkMode = 'auto';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export interface Stored {
	mode: DarkMode;
	sepia: boolean;
	oled: boolean;
}

/** What the legacy single-valued key can express, which predates `oled`. */
export type LegacyStored = Omit<Stored, 'oled'>;

/**
 * Maps the old single `glossa:theme` value onto the two axes it collapsed,
 * preserving what the reader actually sees. Note `'sepia'` becomes mode
 * `'off'`, not `'auto'`: under the old model sepia never yielded to a dark
 * system, so 'off' is the setting that keeps that reader's screen unchanged.
 *
 * Exported and pure so it can be tested without a `localStorage` to seed —
 * and because `app.html`'s pre-hydration script carries the same mapping by
 * hand (it cannot import this), so the table is worth pinning in one place
 * the other copy can be checked against.
 */
export function migrateLegacyTheme(legacy: string | undefined): LegacyStored | undefined {
	switch (legacy) {
		case 'auto':
			return { mode: 'auto', sepia: false };
		case 'light':
			return { mode: 'off', sepia: false };
		case 'dark':
			return { mode: 'on', sepia: false };
		case 'sepia':
			return { mode: 'off', sepia: true };
		default:
			return undefined;
	}
}

function readStored(): Stored {
	const rawMode = readStoredString(MODE_KEY);
	const rawSepia = readStoredString(SEPIA_KEY);
	const rawOled = readStoredString(OLED_KEY);
	// The legacy key is only consulted when NONE of the current ones exist:
	// a reader who has an `oled` preference has plainly touched the setting
	// since the split, so there is nothing left to migrate.
	if (rawMode === undefined && rawSepia === undefined && rawOled === undefined) {
		const migrated = migrateLegacyTheme(readStoredString(LEGACY_KEY));
		if (migrated) return { ...migrated, oled: false };
	}
	return {
		mode: DARK_MODES.includes(rawMode as DarkMode) ? (rawMode as DarkMode) : DEFAULT_MODE,
		sepia: rawSepia === '1',
		oled: rawOled === '1'
	};
}

function systemPrefersDark(): boolean {
	if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
	return window.matchMedia(DARK_QUERY).matches;
}

const initial = readStored();

class AppearanceStore {
	mode: DarkMode = $state(initial.mode);
	/** The reader's stored preference, which is NOT the same as what is on
	 *  screen while dark is active — see `sepiaActive`. */
	sepia: boolean = $state(initial.sepia);
	/** Likewise suspended rather than cleared while light is showing — see
	 *  `oledActive`. */
	oled: boolean = $state(initial.oled);

	/**
	 * Tracked, not just read once, because `mode: 'auto'` means the menu's
	 * sepia row has to go inert the moment the OS flips to dark at sunset —
	 * with nothing but CSS watching, the store would still believe it was
	 * light and the toggle would claim to do something it doesn't.
	 */
	systemDark: boolean = $state(systemPrefersDark());

	constructor() {
		if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
			window.matchMedia(DARK_QUERY).addEventListener('change', (e) => {
				this.systemDark = e.matches;
			});
		}
	}

	/** Whether the dark palette is what the reader is actually looking at. */
	get dark(): boolean {
		return this.mode === 'on' || (this.mode === 'auto' && this.systemDark);
	}

	/** Whether the sepia tint is actually showing (it yields to dark). */
	get sepiaActive(): boolean {
		return this.sepia && !this.dark;
	}

	/** Whether the true-black ground is actually showing (it needs dark). */
	get oledActive(): boolean {
		return this.oled && this.dark;
	}

	setMode(mode: DarkMode) {
		this.mode = mode;
		this.#apply();
	}

	setSepia(sepia: boolean) {
		this.sepia = sepia;
		this.#apply();
	}

	toggleSepia() {
		this.setSepia(!this.sepia);
	}

	setOled(oled: boolean) {
		this.oled = oled;
		this.#apply();
	}

	toggleOled() {
		this.setOled(!this.oled);
	}

	/**
	 * Writes all three axes to `<html>` and to storage. `data-theme` carries only
	 * light/dark now (absent = auto, i.e. let `prefers-color-scheme` decide);
	 * `data-sepia` and `data-oled` are separate presence-only attributes,
	 * which is what lets `app.css` order the sepia palette between light and
	 * dark and have dark win by cascade order alone, and put OLED after both
	 * dark blocks so it wins over them.
	 *
	 * Note it writes `sepia`/`oled`, not `sepiaActive`/`oledActive`: the
	 * attribute records the reader's choice and the stylesheet decides when it
	 * applies, so nothing here has to re-run when the OS changes its mind
	 * about dark.
	 */
	#apply() {
		if (typeof document !== 'undefined') {
			const root = document.documentElement;
			if (this.mode === 'auto') {
				root.removeAttribute('data-theme');
			} else {
				root.setAttribute('data-theme', this.mode === 'on' ? 'dark' : 'light');
			}
			if (this.sepia) {
				root.setAttribute('data-sepia', '');
			} else {
				root.removeAttribute('data-sepia');
			}
			if (this.oled) {
				root.setAttribute('data-oled', '');
			} else {
				root.removeAttribute('data-oled');
			}
		}
		writeStoredString(MODE_KEY, this.mode);
		writeStoredString(SEPIA_KEY, this.sepia ? '1' : undefined);
		writeStoredString(OLED_KEY, this.oled ? '1' : undefined);
		// Any write means the two new keys are now authoritative; leaving the
		// old one behind would only be a second source of truth.
		writeStoredString(LEGACY_KEY, undefined);
	}
}

export const appearance = new AppearanceStore();
