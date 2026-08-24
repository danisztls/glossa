import { describe, expect, it } from 'vitest';
import {
	defaultSummaWorkId,
	defaultWorkId,
	editionInLang,
	listEditions,
	summaArticleExists,
	summaQuestionExists,
	summaWorkIdFor,
	summaTitleFor,
	getSummaQuestionAsync
} from './corpus';
import { parseRefs, refHref } from './refs';
import { isCanonicalPath, summaPartFromSlug, summaPartSlug } from './route-manifest';
import type { RefSegment } from './refs-grammar';

/**
 * The Summa is the first work with no edition in one of the two interface
 * languages, and the first whose two editions cover different PARTS. Both
 * facts are permanent (docs/decisions.md, 2026-08-23): Portuguese is under
 * copyright until 2055, and the Corpus Thomisticum publishes no Latin
 * Supplement. So these are not tests of a temporary corpus state.
 *
 * The fixtures carry exactly that shape — `summa.en` has a Supplement
 * question, `summa.la` cannot — which is what makes the fallback assertions
 * below mean something.
 */

function summaSegments(text: string): Extract<RefSegment, { kind: 'summa' }>[] {
	return parseRefs(text).filter((s) => s.kind === 'summa');
}

describe('edition fallback: the reader’s language, then English, then Latin', () => {
	it('gives a Portuguese reader English, for a work with no Portuguese edition', () => {
		expect(defaultWorkId('summa', 'pt')).toBe('summa.en');
		expect(defaultSummaWorkId('pt')).toBe('summa.en');
	});

	it('gives each reader their own language where it exists', () => {
		expect(defaultSummaWorkId('en')).toBe('summa.en');
		expect(defaultSummaWorkId('la')).toBe('summa.la');
	});

	it('prefers English over Latin — not whichever id sorts first', () => {
		// The old rule took `editions[0]` and got English by alphabetical
		// accident (`en` < `la`). Reversing the list must not change the answer.
		const reversed = [...listEditions('summa')].reverse();
		expect(editionInLang(reversed, 'pt')?.id).toBe('summa.en');
	});

	it('falls back per ADDRESS, not just per work', () => {
		// A Latin-preferring reader keeps Latin where it exists...
		expect(summaWorkIdFor('la', 'I', 1)).toBe('summa.la');
		// ...but the Supplement exists only in English, so a citation to it
		// must still resolve rather than dying on the reader's preference.
		expect(summaWorkIdFor('la', 'Suppl', 77)).toBe('summa.en');
		expect(summaWorkIdFor('pt', 'Suppl', 77)).toBe('summa.en');
	});

	it('returns undefined for an address no edition has', () => {
		expect(summaWorkIdFor('en', 'I', 9999)).toBeUndefined();
	});
});

describe('citation grammar', () => {
	it('reads the English forms', () => {
		expect(summaSegments('St. Thomas Aquinas, STh II-II, 184, 3.')[0]).toMatchObject({
			part: 'II-II',
			question: 184,
			article: 3
		});
		expect(summaSegments('St. Thomas Aquinas, S Th I, 1, 10.')[0]).toMatchObject({
			part: 'I',
			question: 1,
			article: 10
		});
		expect(summaSegments('St. Thomas, Summa Theol., I, q. 25, a. 6, ad 4.')[0]).toMatchObject({
			part: 'I',
			question: 25,
			article: 6
		});
	});

	it('reads the Portuguese Arabic-numbered form', () => {
		// The PT Catechism prints parts in Arabic and appends the Leonine
		// edition's volume and page.
		expect(
			summaSegments('São Tomás de Aquino, Summa theologiae, 1-2, q. 79, a. 1: Ed. Leon. 7, 76.')[0]
		).toMatchObject({ part: 'I-II', question: 79, article: 1 });
	});

	it('reads the OCR damage the Portuguese archive actually contains', () => {
		// `11-II` for `II-II` and `a. l` for `a. 1` are both in the corpus.
		expect(
			summaSegments('Summa theologiae 11-II, q. 1. a. 2. ad 2: Ed Leon. 8. 11.')[0]
		).toMatchObject({ part: 'II-II', question: 1, article: 2 });
	});

	it('does not mistake Esther for the Summa', () => {
		// An unbounded `S\.?\s*Th` matches the `sth` inside `Esth`.
		expect(summaSegments('Wis 11:21; cf. Esth 4:17b; Prov 21:1.')).toHaveLength(0);
	});

	it('links a question with no article', () => {
		expect(summaSegments('Cf. S. Th. II-II, 184.')[0]).toMatchObject({
			part: 'II-II',
			question: 184,
			article: null
		});
	});
});

describe('refHref', () => {
	const ctx = { lang: 'pt' };

	it('links an article as a fragment on its question’s page', () => {
		const [seg] = summaSegments('STh II-II, 184, 3');
		expect(refHref(seg, ctx)).toBe('/summa/ii-ii/184#a3');
	});

	it('is edition-free, so a Portuguese reader gets a live link', () => {
		const [seg] = summaSegments('Summa theologiae, 1, q. 1, a. 1');
		expect(refHref(seg, { lang: 'pt' })).toBe(refHref(seg, { lang: 'en' }));
	});

	it('degrades to the question page when the article does not exist', () => {
		const [seg] = summaSegments('STh II-II, 184, 97');
		expect(refHref(seg, ctx)).toBe('/summa/ii-ii/184');
	});

	it('emits no link at all for a question no edition has', () => {
		const [seg] = summaSegments('STh II-II, 900, 1');
		expect(refHref(seg, ctx)).toBeUndefined();
	});

	it('links the Supplement, which only English has', () => {
		const [seg] = summaSegments('STh Suppl, 77, 4');
		expect(refHref(seg, ctx)).toBe('/summa/suppl/77#a4');
	});
});

describe('addresses', () => {
	it('round-trips part slugs', () => {
		for (const part of ['I', 'I-II', 'II-II', 'III', 'Suppl']) {
			expect(summaPartFromSlug(summaPartSlug(part))).toBe(part);
		}
	});

	it('rejects an unknown part rather than inventing a slug', () => {
		expect(() => summaPartSlug('IV')).toThrow();
	});

	it('counts existence across editions, not within one', () => {
		expect(summaQuestionExists('Suppl', 77)).toBe(true); // EN only
		expect(summaQuestionExists('I', 1)).toBe(true); // both
		expect(summaQuestionExists('I', 4242)).toBe(false);
		expect(summaArticleExists('II-II', 184, 1)).toBe(true);
		expect(summaArticleExists('II-II', 184, 97)).toBe(false);
	});

	it('blesses a question address at the edge and refuses a made-up one', () => {
		const manifest = {
			version: 1 as const,
			workCount: 2,
			contentAssetCount: 2,
			bible: {},
			ccc: [],
			cccChapters: [],
			compendium: [],
			compendiumChapters: [],
			documents: [],
			prayers: [],
			summa: { i: [1, 71], 'ii-ii': [184], suppl: [77] }
		};
		expect(isCanonicalPath('/summa/ii-ii/184', manifest)).toBe(true);
		expect(isCanonicalPath('/summa/suppl/77', manifest)).toBe(true);
		expect(isCanonicalPath('/summa/ii-ii/999', manifest)).toBe(false);
		expect(isCanonicalPath('/summa/iv/1', manifest)).toBe(false);
		// An article is a fragment, never a path segment.
		expect(isCanonicalPath('/summa/ii-ii/184/3', manifest)).toBe(false);
	});
});

describe('content tier', () => {
	it('reads a question, divisions and all', async () => {
		const question = await getSummaQuestionAsync('summa.en', 'II-II', 184);
		expect(question?.title).toBeTruthy();
		expect(question?.articles[0].divisions.map((d) => d.kind)).toContain('objection');
	});

	it('carries the article-less question’s divisions on the question itself', async () => {
		// I q. 71 and q. 72 have no articles in EITHER source; their objections
		// hang off the question. Nothing invents an `a. 1` for them.
		const question = await getSummaQuestionAsync('summa.en', 'I', 71);
		expect(question?.articles).toHaveLength(0);
		expect(question?.divisions?.length).toBeGreaterThan(0);
	});

	it('has no Latin Supplement to read', async () => {
		expect(await getSummaQuestionAsync('summa.la', 'Suppl', 77)).toBeUndefined();
	});
});

/**
 * The Corpus Thomisticum's Leonine text heads each question `Quaestio 1` and
 * states its subject inside the prooemium prose instead, so `summa.la` has an
 * empty title for every question and every article — the fixtures carry that
 * shape exactly. Rendered verbatim, a Latin reader's table of contents is a
 * column of bare numbers, which is faithful and useless.
 */
describe('borrowed question titles', () => {
	it('returns an edition’s own title unborrowed', () => {
		const named = summaTitleFor('en', 'II-II', 184);
		expect(named).toEqual({
			title: 'OF THE STATE OF PERFECTION IN GENERAL (EIGHT ARTICLES)',
			lang: 'en',
			borrowed: false
		});
	});

	it('borrows the English title for a Latin reader, and says so', () => {
		const named = summaTitleFor('la', 'II-II', 184);
		expect(named?.borrowed).toBe(true);
		expect(named?.lang).toBe('en');
		expect(named?.title).toBe('OF THE STATE OF PERFECTION IN GENERAL (EIGHT ARTICLES)');
	});

	it('borrows for every question a Latin reader can reach', () => {
		// The whole point: not one convenient question, but the entire outline.
		const borrowed = [1, 71].map((n) => summaTitleFor('la', 'I', n));
		expect(borrowed.every((b) => b?.borrowed === true)).toBe(true);
		expect(borrowed.every((b) => (b?.title ?? '').length > 0)).toBe(true);
	});

	it('is undefined when no edition has a title for the address', () => {
		expect(summaTitleFor('en', 'I', 9999)).toBeUndefined();
	});

	it('does not invent a Latin title for the Supplement, which has no Latin', () => {
		// Falls through to English, the only edition that carries the address.
		const named = summaTitleFor('la', 'Suppl', 77);
		expect(named === undefined || named.lang === 'en').toBe(true);
	});
});
