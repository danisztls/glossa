import { beforeEach, describe, expect, it } from 'vitest';
import { addressResolves, citationFor } from './citation-label';
import { parseHref } from './address';
import { content } from './content.svelte';
import { i18n } from './i18n.svelte';

/**
 * The citation a `/signata` row prints, and whether the row is dead.
 *
 * FIXTURES CARRY FOUR WORKS AND NOT EIGHT — Genesis and John in four Bible
 * editions, the Catechism and its Compendium in EN and PT, the Summa in EN and
 * LA. So the assertions below split in two on purpose: the four that HAVE a
 * fixture assert the citation AND that the address resolves; the four that do
 * not (documents, prayers, the Social Doctrine, the Code) assert the fallback,
 * which is the branch a reader actually meets when their language carries no
 * edition of a work. That is the more interesting half to pin down anyway: a
 * citation nobody can read is still better than a blank row.
 */
const at = (href: string) => citationFor(parseHref(href)!);
const lives = (href: string) => addressResolves(parseHref(href)!);

beforeEach(async () => {
	await i18n.set('en');
	content.set('bible', null);
	content.set('catechism', null);
	content.set('compendium', null);
});

describe('citationFor', () => {
	it('abbreviates a Bible book and punctuates it as the edition does', () => {
		expect(at('/scriptura/genesis/1')).toBe('Gn 1');
		expect(at('/scriptura/genesis/1#v3')).toBe('Gn 1:3');
		expect(at('/scriptura/genesis/1?v=1-3')).toBe('Gn 1:1-3');
	});

	// THE MARK IS THE READER'S EDITION'S, not the interface's and not a
	// literal — `citation-style.ts` says why at length, and this is the
	// assertion that would fail if someone typed a colon.
	it('takes the chapter mark from the reader’s own edition', async () => {
		await i18n.set('pt');
		expect(at('/scriptura/genesis/1#v3')).toBe('Gn 1,3');
	});

	it('cites the Catechism and its Compendium by the reader’s own siglum', async () => {
		expect(at('/catechismus/1213')).toBe('CCC 1213');
		expect(at('/catechismus/compendium/578')).toBe('Comp. 578');
		await i18n.set('pt');
		expect(at('/catechismus/1213')).toBe('CIC 1213');
	});

	// A division is cited by the number it is ADDRESSED by, which is the
	// paragraph it opens at. The heading is what the preview card carries.
	it('cites a chapter by the number that addresses it', () => {
		expect(at('/catechismus/caput/1210')).toBe('CCC 1210');
		expect(at('/catechismus/compendium/caput/166')).toBe('Comp. 166');
		expect(at('/doctrina-socialis/caput/60')).toBe('CSDC 60');
		expect(at('/ius-canonicum/titulus/204')).toBe('Can. 204');
	});

	it('cites the Summa in the short scholastic form, article and all', () => {
		expect(at('/doctores/summa/ii-ii/189')).toBe('STh II-II, 189');
		expect(at('/doctores/summa/ii-ii/189#a3')).toBe('STh II-II, 189, 3');
	});

	it('cites the Code and the Social Doctrine by their own sigla', async () => {
		expect(at('/ius-canonicum/204')).toBe('Can. 204');
		expect(at('/doctrina-socialis/8')).toBe('CSDC 8');
		await i18n.set('pt');
		expect(at('/ius-canonicum/204')).toBe('Cân. 204');
	});

	// The document and the prayer are the two that have no edition here, so
	// this is the fallback: the slug, never a blank.
	it('falls back to the slug where the reader’s language carries no edition', () => {
		expect(at('/documenta/dilexit-nos')).toBe('dilexit-nos');
		expect(at('/documenta/dilexit-nos#s12')).toBe('dilexit-nos 12');
		expect(at('/preces/our-father')).toBe('our-father');
	});
});

describe('addressResolves', () => {
	it('accepts what the fixture corpus carries', () => {
		expect(lives('/scriptura/genesis/1')).toBe(true);
		expect(lives('/scriptura/genesis/1#v3')).toBe(true);
		expect(lives('/catechismus/27')).toBe(true);
		expect(lives('/doctores/summa/i/1')).toBe(true);
	});

	it('refuses a chapter, a verse and a paragraph the corpus does not have', () => {
		expect(lives('/scriptura/genesis/999')).toBe(false);
		expect(lives('/scriptura/genesis/1?v=900-901')).toBe(false);
		expect(lives('/catechismus/99999')).toBe(false);
	});

	// A book the fixture editions do not carry — the ordinary shape of "not in
	// the edition you are reading", and the one a reader sees after switching
	// language rather than after a corpus defect. The citation still prints,
	// out of the grammar's own table rather than the edition's.
	it('refuses a book this edition does not carry, and still cites it', () => {
		expect(lives('/scriptura/exodus/1')).toBe(false);
		expect(at('/scriptura/exodus/1')).toBe('Ex 1');
	});

	it('refuses an address whose work has no edition at all here', () => {
		expect(lives('/documenta/dilexit-nos')).toBe(false);
		expect(lives('/preces/our-father')).toBe(false);
	});
});
