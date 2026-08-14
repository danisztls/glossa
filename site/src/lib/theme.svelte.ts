/**
 * Theme (light / dark / sepia) selection, persisted to localStorage.
 * When nothing is stored, `data-theme` is left unset and CSS falls back
 * to `prefers-color-scheme` (see `src/app.css`) — "respecting
 * prefers-color-scheme by default" per docs/decisions.md.
 *
 * `app.html` also runs a tiny inline script that applies any stored theme
 * before the app hydrates, to avoid a flash of the wrong theme.
 */

export type Theme = 'light' | 'dark' | 'sepia';

const STORAGE_KEY = 'depositum:theme';
const THEMES: Theme[] = ['light', 'dark', 'sepia'];

function readStored(): Theme | null {
	if (typeof localStorage === 'undefined') return null;
	const value = localStorage.getItem(STORAGE_KEY);
	return THEMES.includes(value as Theme) ? (value as Theme) : null;
}

class ThemeStore {
	/** `null` means "follow system preference". */
	current: Theme | null = $state(readStored());

	set(theme: Theme | null) {
		this.current = theme;
		if (typeof document !== 'undefined') {
			if (theme) {
				document.documentElement.setAttribute('data-theme', theme);
			} else {
				document.documentElement.removeAttribute('data-theme');
			}
		}
		if (typeof localStorage !== 'undefined') {
			if (theme) localStorage.setItem(STORAGE_KEY, theme);
			else localStorage.removeItem(STORAGE_KEY);
		}
	}

	/** Cycle light → dark → sepia → light, starting from whatever is active now. */
	cycle() {
		const from = this.current ?? 'light';
		const idx = THEMES.indexOf(from);
		this.set(THEMES[(idx + 1) % THEMES.length]);
	}
}

export const themeStore = new ThemeStore();
