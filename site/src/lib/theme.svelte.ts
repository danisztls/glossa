/**
 * Theme (auto / light / dark / sepia) selection, persisted to localStorage.
 * `'auto'` is the default and removes `data-theme` from `<html>` so CSS
 * falls back to `prefers-color-scheme` (see `src/app.css`) — "respecting
 * prefers-color-scheme by default" per docs/decisions.md.
 *
 * `'auto'` is persisted explicitly, the same as any other value, rather
 * than treating "nothing in localStorage" as the only way to be in auto
 * mode. That's deliberate: a reader who picked 'light' and wants to go
 * back to following the system needs a real, storable choice to return
 * to — not just "clear your storage".
 *
 * `app.html` also runs a tiny inline script that applies any stored theme
 * (and font scale, see `prefs.svelte.ts`) before the app hydrates, to
 * avoid a flash of the wrong theme.
 */

export type Theme = 'auto' | 'light' | 'dark' | 'sepia';

const STORAGE_KEY = 'glossa:theme';
const THEMES: Theme[] = ['auto', 'light', 'dark', 'sepia'];
const DEFAULT_THEME: Theme = 'auto';

function readStored(): Theme {
	if (typeof localStorage === 'undefined') return DEFAULT_THEME;
	const value = localStorage.getItem(STORAGE_KEY);
	return THEMES.includes(value as Theme) ? (value as Theme) : DEFAULT_THEME;
}

class ThemeStore {
	current: Theme = $state(readStored());

	set(theme: Theme) {
		this.current = theme;
		if (typeof document !== 'undefined') {
			if (theme === 'auto') {
				document.documentElement.removeAttribute('data-theme');
			} else {
				document.documentElement.setAttribute('data-theme', theme);
			}
		}
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, theme);
		}
	}

	/** Cycle auto → light → dark → sepia → auto, starting from whatever is active now. */
	cycle() {
		const idx = THEMES.indexOf(this.current);
		this.set(THEMES[(idx + 1) % THEMES.length]);
	}
}

export const themeStore = new ThemeStore();
