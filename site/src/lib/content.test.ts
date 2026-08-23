import { beforeEach, describe, expect, it } from 'vitest';
import { content } from './content.svelte';
import { i18n } from './i18n.svelte';

// Both stores are module-level singletons, so tests must not leak state into
// each other — same reasoning as `theme.test.ts`.
const EN = 'bible.cpdv.en';
const PT = 'bible.matos-soares.pt';
const LA = 'bible.clementina.la';

beforeEach(() => {
	i18n.set('en');
	content.set('bible', null);
	content.set('catechism', null);
});

describe('edition override lifecycle', () => {
	it('follows the UI language when the reader has picked nothing', () => {
		expect(content.workIdFor('bible')).toBe(EN);
		i18n.set('pt');
		expect(content.workIdFor('bible')).toBe(PT);
	});

	it('honours an explicit pick under the language it was made in', () => {
		content.set('bible', LA);
		expect(content.workIdFor('bible')).toBe(LA);
		expect(content.langFor('bible')).toBe('la');
	});

	// The 2026-08-15 "content language follows UI language" rule, unchanged.
	// An override is stamped with the UI language it was made under and goes
	// dormant while the interface is elsewhere — it is not deleted, so
	// returning to that language revives it.
	it('puts an override in a UI language to sleep while the interface is elsewhere', () => {
		i18n.set('pt');
		content.set('bible', PT);
		expect(content.workIdFor('bible')).toBe(PT);

		i18n.set('en');
		expect(content.workIdFor('bible')).toBe(EN); // dormant — the EN default wins

		i18n.set('pt');
		expect(content.workIdFor('bible')).toBe(PT); // and it wakes up again
	});

	// The Latin case, and the whole reason `#stillApplies` exists. No UI
	// language will ever default to the Latin Bible, so no UI-language event
	// can be read as the reader changing their mind about it. Contrast the
	// test above, where the identical sequence drops back to a default.
	it('keeps an override whose language is not a UI language, across UI switches', () => {
		i18n.set('pt');
		content.set('bible', LA);
		expect(content.workIdFor('bible')).toBe(LA);

		i18n.set('en');
		expect(content.workIdFor('bible')).toBe(LA);
		i18n.set('pt');
		expect(content.workIdFor('bible')).toBe(LA);
	});

	it('still lets the reader leave Latin explicitly', () => {
		content.set('bible', LA);
		content.set('bible', PT);
		expect(content.workIdFor('bible')).toBe(PT);

		content.set('bible', LA);
		content.set('bible', null);
		expect(content.workIdFor('bible')).toBe(EN);
	});

	// The rule keys on the picked edition's language, not on the work type,
	// so a type with no non-UI-language edition keeps the old behaviour whole.
	it('leaves work types with no non-UI-language edition alone', () => {
		i18n.set('pt');
		content.set('catechism', 'ccc.pt');
		expect(content.workIdFor('catechism')).toBe('ccc.pt');

		i18n.set('en');
		expect(content.workIdFor('catechism')).toBe('ccc.en');
	});
});
