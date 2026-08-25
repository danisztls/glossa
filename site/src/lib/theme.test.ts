import { beforeEach, describe, expect, it } from 'vitest';
import { appearance, migrateLegacyTheme } from './theme.svelte';

// The store is a module-level singleton, so tests must not leak state into
// each other — same reasoning as `compare-pref.test.ts`. There is no
// `localStorage` in this environment (vitest runs in node), so every case
// starts from whatever these calls set, not from disk.
beforeEach(() => {
	appearance.setMode('auto');
	appearance.setSepia(false);
	appearance.setOled(false);
	appearance.setMono(false);
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

// The exact mirror of the sepia rules above: OLED needs dark rather than
// yielding to it. Kept as its own block rather than folded into those cases,
// because the pair being symmetrical is the claim worth failing on.
describe('AppearanceStore.oledActive', () => {
	it('shows the true-black ground in dark', () => {
		appearance.setMode('on');
		appearance.toggleOled();
		expect(appearance.oled).toBe(true);
		expect(appearance.oledActive).toBe(true);
	});

	it('suspends it while light is showing, without forgetting it', () => {
		appearance.setOled(true);
		expect(appearance.oledActive).toBe(false);
		expect(appearance.oled).toBe(true);

		appearance.setMode('on');
		expect(appearance.oledActive).toBe(true);
	});

	it("follows the system in 'auto', the way dark itself does", () => {
		appearance.setOled(true);
		expect(appearance.oledActive).toBe(false);
		appearance.systemDark = true;
		expect(appearance.oledActive).toBe(true);
	});

	// Neither tint can reach the other's half of the light/dark axis, so a
	// reader may leave both switched on and will still only ever see one.
	it('never shows at the same time as sepia, whatever the reader stores', () => {
		appearance.setSepia(true);
		appearance.setOled(true);
		for (const [mode, systemDark] of [
			['auto', false],
			['auto', true],
			['on', false],
			['off', true]
		] as const) {
			appearance.setMode(mode);
			appearance.systemDark = systemDark;
			expect(appearance.sepiaActive && appearance.oledActive).toBe(false);
		}
	});
});

// The third switch, and the one that is NOT a mirror of the other two:
// monochrome has a palette for both halves of the light/dark axis, so nothing
// suspends it — it is the axis that suspends something else. These cases exist
// to fail if someone ever gives it a `monoActive`.
describe('AppearanceStore.mono', () => {
	it('is off until the reader asks for it', () => {
		expect(appearance.mono).toBe(false);
	});

	it('toggles, and stays where it was put', () => {
		appearance.toggleMono();
		expect(appearance.mono).toBe(true);
		appearance.toggleMono();
		expect(appearance.mono).toBe(false);
	});

	it('shows in every theme, unlike sepia and OLED', () => {
		appearance.setMono(true);
		for (const [mode, systemDark] of [
			['auto', false],
			['auto', true],
			['on', false],
			['off', true]
		] as const) {
			appearance.setMode(mode);
			appearance.systemDark = systemDark;
			expect(appearance.mono).toBe(true);
		}
	});

	it('is independent of the OLED switch', () => {
		appearance.setMono(true);
		appearance.setOled(true);
		expect(appearance.mono).toBe(true);
		appearance.setOled(false);
		expect(appearance.mono).toBe(true);
	});

	// A tint is a hue, so it cannot survive a palette that has none — the same
	// suspension dark performs, arriving from the other axis.
	it('suspends sepia in light, without forgetting it', () => {
		appearance.setSepia(true);
		expect(appearance.sepiaActive).toBe(true);

		appearance.setMono(true);
		expect(appearance.sepiaSuspended).toBe(true);
		expect(appearance.sepiaActive).toBe(false);
		expect(appearance.sepia).toBe(true);

		appearance.setMono(false);
		expect(appearance.sepiaActive).toBe(true);
	});

	// `sepiaSuspended` is about the OTHER axes, never about the reader's own
	// choice — a reader with sepia off must still be able to switch it on.
	it('leaves the sepia switch usable when the reader simply has it off', () => {
		expect(appearance.sepia).toBe(false);
		expect(appearance.sepiaActive).toBe(false);
		expect(appearance.sepiaSuspended).toBe(false);
	});
});
