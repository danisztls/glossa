/**
 * Appearance settings — the light/dark mode, the sepia paper tint, the OLED
 * true-black ground and the monochrome palette — persisted to localStorage.
 *
 * FOUR AXES, NOT N THEMES. This used to be a single `Theme` of
 * auto/light/dark/sepia, which forced two unrelated questions through one
 * value: "do I want dark?" and "do I want warm paper?". A reader on sepia
 * could not also follow the system's dark preference at night — picking
 * sepia meant opting out of `prefers-color-scheme` entirely, with nothing
 * in the UI saying so. They are now independent, and the two later settings
 * joined them as axes of their own rather than as values of the first:
 *
 *   `mode`   'auto' (follow prefers-color-scheme) | 'on' | 'off'
 *   `sepia`  a boolean paper tint
 *   `oled`   a boolean true-black ground
 *   `mono`   a boolean single-hue palette
 *
 * SEPIA IS A LIGHT-MODE TINT and goes inert whenever dark is actually
 * showing — there is no dark-sepia palette, and a warm dark would be a new
 * design, not a combination of two existing ones. It goes inert under
 * monochrome too, and for a sharper reason: a paper tint is a hue, and
 * monochrome is the claim that the page has none. `sepiaActive` is what the
 * DOM follows; `sepia` stays as the reader left it, so switching either of
 * those back off restores their tint rather than silently clearing it. The
 * menu greys the toggle out and says why while it is inert.
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
 * `mono` IS THE ONE THAT NEVER GOES INERT, and that is the whole difference
 * between it and the two above. Sepia and OLED each belong to one half of
 * the light/dark axis and yield outside it; monochrome has a palette for
 * both halves and yields to nothing — it is the axis that suspends, rather
 * than the axis that is suspended. There is deliberately no `monoActive`
 * mirroring `sepiaActive`/`oledActive`: nothing can turn it off but the
 * reader, so the stored value and the applied value are the same value.
 * `app.css` carries the greys and the measurement behind them.
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
const MONO_KEY = 'glossa:mono';
/** The single-valued key the axes above replaced; read once, then cleared. */
const LEGACY_KEY = 'glossa:theme';

export const DARK_MODES: DarkMode[] = ['auto', 'on', 'off'];
const DEFAULT_MODE: DarkMode = 'auto';

const DARK_QUERY = '(prefers-color-scheme: dark)';

export interface Stored {
	mode: DarkMode;
	sepia: boolean;
	oled: boolean;
	mono: boolean;
}

/** What the legacy single-valued key can express — it predates both flags. */
export type LegacyStored = Omit<Stored, 'oled' | 'mono'>;

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
	const rawMono = readStoredString(MONO_KEY);
	// The legacy key is only consulted when NONE of the current ones exist:
	// a reader who has any of these preferences has plainly touched the
	// setting since the split, so there is nothing left to migrate.
	if (
		rawMode === undefined &&
		rawSepia === undefined &&
		rawOled === undefined &&
		rawMono === undefined
	) {
		const migrated = migrateLegacyTheme(readStoredString(LEGACY_KEY));
		if (migrated) return { ...migrated, oled: false, mono: false };
	}
	return {
		mode: DARK_MODES.includes(rawMode as DarkMode) ? (rawMode as DarkMode) : DEFAULT_MODE,
		sepia: rawSepia === '1',
		oled: rawOled === '1',
		mono: rawMono === '1'
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
	/** Unlike the two above, this one is never suspended, so there is no
	 *  `monoActive` to read instead of it — it does the suspending. */
	mono: boolean = $state(initial.mono);

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

	/**
	 * Whether something other than the reader's own choice is holding the
	 * sepia tint off: dark, which has no sepia palette, or monochrome, which
	 * has no hue at all. Separate from `sepiaActive` because the menu needs
	 * exactly this and not that — a reader with sepia OFF in light mode has
	 * no active tint either, and their switch must stay usable.
	 */
	get sepiaSuspended(): boolean {
		return this.dark || this.mono;
	}

	/** Whether the sepia tint is actually showing. */
	get sepiaActive(): boolean {
		return this.sepia && !this.sepiaSuspended;
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

	setMono(mono: boolean) {
		this.mono = mono;
		this.#apply();
	}

	toggleMono() {
		this.setMono(!this.mono);
	}

	/**
	 * Writes all four axes to `<html>` and to storage. `data-theme` carries only
	 * light/dark now (absent = auto, i.e. let `prefers-color-scheme` decide);
	 * `data-sepia`, `data-oled` and `data-mono` are separate presence-only
	 * attributes, which is what lets `app.css` order the sepia palette between
	 * light and dark and have dark win by cascade order alone, and put OLED
	 * after both dark blocks so it wins over them. `data-mono` comes after all
	 * of those and outranks them by selector.
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
			if (this.mono) {
				root.setAttribute('data-mono', '');
			} else {
				root.removeAttribute('data-mono');
			}
		}
		writeStoredString(MODE_KEY, this.mode);
		writeStoredString(SEPIA_KEY, this.sepia ? '1' : undefined);
		writeStoredString(OLED_KEY, this.oled ? '1' : undefined);
		writeStoredString(MONO_KEY, this.mono ? '1' : undefined);
		// Any write means the newer keys are now authoritative; leaving the
		// old one behind would only be a second source of truth.
		writeStoredString(LEGACY_KEY, undefined);
	}
}

export const appearance = new AppearanceStore();
