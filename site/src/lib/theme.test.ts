import { beforeEach, describe, expect, it } from 'vitest';
import { appearance, migrateLegacyTheme } from './theme.svelte';

// The store is a module-level singleton, so tests must not leak state into
// each other — same reasoning as `compare-pref.test.ts`. There is no
// `localStorage` in this environment (vitest runs in node), so every case
// starts from whatever these calls set, not from disk.
beforeEach(() => {
	appearance.setMode('auto');
	appearance.setSepia(false);
	appearance.systemDark = false;
});

describe('migrateLegacyTheme', () => {
	it('splits the old single theme value into the two axes it collapsed', () => {
		expect(migrateLegacyTheme('auto')).toEqual({ mode: 'auto', sepia: false });
		expect(migrateLegacyTheme('light')).toEqual({ mode: 'off', sepia: false });
		expect(migrateLegacyTheme('dark')).toEqual({ mode: 'on', sepia: false });
	});

	// The one mapping that isn't a transliteration: old sepia never yielded to
	// a dark system, so migrating it to `auto` would turn a returning reader's
	// screen dark at night — something they had never asked for.
	it("maps sepia to dark-mode 'off', not 'auto'", () => {
		expect(migrateLegacyTheme('sepia')).toEqual({ mode: 'off', sepia: true });
	});

	it('ignores an absent or unrecognised value, leaving the defaults to apply', () => {
		expect(migrateLegacyTheme(undefined)).toBeUndefined();
		expect(migrateLegacyTheme('')).toBeUndefined();
		expect(migrateLegacyTheme('solarized')).toBeUndefined();
	});
});

describe('AppearanceStore.dark', () => {
	it("follows the system only in 'auto'", () => {
		appearance.systemDark = true;
		expect(appearance.dark).toBe(true);
		appearance.setMode('off');
		expect(appearance.dark).toBe(false);
		appearance.setMode('on');
		expect(appearance.dark).toBe(true);
	});

	it("stays light in 'auto' under a light system", () => {
		expect(appearance.dark).toBe(false);
	});
});

describe('AppearanceStore.sepiaActive', () => {
	it('shows the tint in light', () => {
		appearance.toggleSepia();
		expect(appearance.sepia).toBe(true);
		expect(appearance.sepiaActive).toBe(true);
	});

	// Suspended, not cleared: the stored preference survives so that turning
	// dark back off restores the reader's tint.
	it('suspends the tint while dark is showing, without forgetting it', () => {
		appearance.setSepia(true);
		appearance.setMode('on');
		expect(appearance.sepiaActive).toBe(false);
		expect(appearance.sepia).toBe(true);

		appearance.setMode('off');
		expect(appearance.sepiaActive).toBe(true);
	});

	it("suspends the tint in 'auto' too, once the system turns dark", () => {
		appearance.setSepia(true);
		expect(appearance.sepiaActive).toBe(true);
		appearance.systemDark = true;
		expect(appearance.sepiaActive).toBe(false);
	});
});
