import { beforeEach, describe, expect, it } from 'vitest';
import { content } from './content.svelte';
import { i18n } from './i18n.svelte';

// Both stores are module-level singletons, so tests must not leak state into
// each other — same reasoning as `theme.test.ts`.
const EN = 'bible.douay-rheims.en';
const PT = 'bible.matos-soares.pt';
const LA = 'bible.clementina.la';

beforeEach(async () => {
	await i18n.set('en');
	content.set('bible', null);
	content.set('catechism', null);
});

describe('edition override lifecycle', () => {
	it('follows the UI language when the reader has picked nothing', async () => {
		expect(content.workIdFor('bible')).toBe(EN);
		await i18n.set('pt');
		expect(content.workIdFor('bible')).toBe(PT);
	});

	it('honours an explicit pick under the language it was made in', async () => {
		content.set('bible', LA);
		expect(content.workIdFor('bible')).toBe(LA);
		expect(content.langFor('bible')).toBe('la');
	});

	// The 2026-08-15 "content language follows UI language" rule, unchanged.
	// An override is stamped with the UI language it was made under and goes
	// dormant while the interface is elsewhere — it is not deleted, so
	// returning to that language revives it.
	it('puts an override in a UI language to sleep while the interface is elsewhere', async () => {
		await i18n.set('pt');
		content.set('bible', PT);
		expect(content.workIdFor('bible')).toBe(PT);

		await i18n.set('en');
		expect(content.workIdFor('bible')).toBe(EN); // dormant — the EN default wins

		await i18n.set('pt');
		expect(content.workIdFor('bible')).toBe(PT); // and it wakes up again
	});

	// Latin used to be exempt from the rule above, because no UI language
	// defaulted to the Clementine and so no UI event could mean "they changed
	// their mind about Latin". Latin is a UI language now (2026-08-24), which
	// is a better answer to the same problem, so the exemption is gone and a
	// Latin pick sleeps and wakes exactly like a Portuguese one.
	it('treats a Latin override like every other, since Latin became a UI language', async () => {
		await i18n.set('pt');
		content.set('bible', LA);
		expect(content.workIdFor('bible')).toBe(LA);

		await i18n.set('en');
		expect(content.workIdFor('bible')).toBe(EN);
		await i18n.set('pt');
		expect(content.workIdFor('bible')).toBe(LA);
	});

	// And the reader who wants Latin no longer needs an override to keep it:
	// the interface language carries it, for the Bible and for the Summa.
	it('gives a Latin interface the Latin editions with no override at all', async () => {
		await i18n.set('la');
		expect(content.workIdFor('bible')).toBe(LA);
		expect(content.langFor('bible')).toBe('la');
		expect(content.langFor('summa')).toBe('la');
	});

	// The Catechism has no Latin edition in the corpus, so a Latin reader
	// falls through `CONTENT_LANG_FALLBACK` to English like a Portuguese
	// reader falls through it for the Summa.
	it('falls back to English for a work the corpus has no Latin edition of', async () => {
		await i18n.set('la');
		expect(content.workIdFor('catechism')).toBe('ccc.en');
	});

	it('still lets the reader leave Latin explicitly', async () => {
		content.set('bible', LA);
		content.set('bible', PT);
		expect(content.workIdFor('bible')).toBe(PT);

		content.set('bible', LA);
		content.set('bible', null);
		expect(content.workIdFor('bible')).toBe(EN);
	});
});

/**
 * `/catechismus` and the home page's Catechism section both resolve through
 * ONE language, and it is not `langFor` of either work — see
 * `catechismPairLang`. These pin both halves of that: the language that has a
 * work keeps it, and the language that has neither gets a fallback rather
 * than a blank page.
 */
describe('the Catechism/Compendium pair language', () => {
	it("takes the reader's own language when it carries either work", async () => {
		await i18n.set('pt');
		expect(content.catechismPairLang()).toBe('pt');
	});

	// THE REGRESSION. This returned `i18n.lang` outright until 2026-08-31, so
	// a language carrying neither work resolved to itself, `getWork` answered
	// undefined for both columns, and the page rendered nothing at all — with
	// no edition menu on it, because that is guarded on the same manifest.
	// Twenty-two of the thirty-four interface languages were in that state.
	it('falls through the content chain when it carries neither', async () => {
		await i18n.set('he');
		expect(content.catechismPairLang()).toBe('en');
	});

	// An explicit pick still wins outright — the chain is only consulted when
	// the reader has not chosen.
	it('prefers an explicit choice over the chain', async () => {
		await i18n.set('he');
		content.set('catechism', 'ccc.pt');
		expect(content.catechismPairLang()).toBe('pt');
		content.set('catechism', null);
	});
});
