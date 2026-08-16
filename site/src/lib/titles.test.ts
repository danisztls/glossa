import { describe, expect, it } from 'vitest';
import { displayTitle, normalizeCase } from './titles';
import type { StructureNode } from './types';

function node(kind: StructureNode['kind'], n: number | null, title: string) {
	return { kind, n, title };
}

describe('displayTitle — contract table', () => {
	it('part, 1, "PART ONE: THE PROFESSION OF FAITH" (en)', () => {
		expect(displayTitle(node('part', 1, 'PART ONE: THE PROFESSION OF FAITH'), 'en')).toEqual({
			ordinal: '1.',
			title: 'The Profession of Faith'
		});
	});

	it('section, 1, \'SECTION ONE "I BELIEVE" - "WE BELIEVE"\' (en)', () => {
		expect(
			displayTitle(node('section', 1, 'SECTION ONE "I BELIEVE" - "WE BELIEVE"'), 'en')
		).toEqual({
			ordinal: '1.',
			title: '"I Believe" - "We Believe"'
		});
	});

	it('chapter, 1, "CHAPTER ONE MAN\'S CAPACITY FOR GOD" (en)', () => {
		expect(displayTitle(node('chapter', 1, "CHAPTER ONE MAN'S CAPACITY FOR GOD"), 'en')).toEqual({
			ordinal: '1.',
			title: "Man's Capacity for God"
		});
	});

	it('article, 1, "Article 1 THE REVELATION OF GOD" (en)', () => {
		expect(displayTitle(node('article', 1, 'Article 1 THE REVELATION OF GOD'), 'en')).toEqual({
			ordinal: '1.',
			title: 'The Revelation of God'
		});
	});

	it('sub, 1, "Paragraph 1. I BELIEVE IN GOD" (en)', () => {
		expect(displayTitle(node('sub', 1, 'Paragraph 1. I BELIEVE IN GOD'), 'en')).toEqual({
			ordinal: '1.',
			title: 'I Believe in God'
		});
	});

	it('sub, 1, "I. The Desire for God" (en) — roman-numeral marker, left untouched', () => {
		expect(displayTitle(node('sub', 1, 'I. The Desire for God'), 'en')).toEqual({
			ordinal: null,
			title: 'I. The Desire for God'
		});
	});

	it('part, 1, "PRIMEIRA PARTE A PROFISSÃO DA FÉ" (pt)', () => {
		expect(displayTitle(node('part', 1, 'PRIMEIRA PARTE A PROFISSÃO DA FÉ'), 'pt')).toEqual({
			ordinal: '1.',
			title: 'A Profissão da Fé'
		});
	});

	it('section, 1, "PRIMEIRA SECÇÃO «EU CREIO» – «NÓS CREMOS»" (pt)', () => {
		expect(
			displayTitle(node('section', 1, 'PRIMEIRA SECÇÃO «EU CREIO» – «NÓS CREMOS»'), 'pt')
		).toEqual({
			ordinal: '1.',
			title: '«Eu Creio» – «Nós Cremos»'
		});
	});

	it('chapter, 1, "CAPÍTULO PRIMEIRO O HOMEM É «CAPAZ» DE DEUS" (pt)', () => {
		expect(
			displayTitle(node('chapter', 1, 'CAPÍTULO PRIMEIRO O HOMEM É «CAPAZ» DE DEUS'), 'pt')
		).toEqual({
			ordinal: '1.',
			title: 'O Homem É «Capaz» de Deus'
		});
	});

	it('prologue, null, "PROLOGUE" (en) / "PRÓLOGO" (pt)', () => {
		expect(displayTitle(node('prologue', null, 'PROLOGUE'), 'en')).toEqual({
			ordinal: null,
			title: 'Prologue'
		});
		expect(displayTitle(node('prologue', null, 'PRÓLOGO'), 'pt')).toEqual({
			ordinal: null,
			title: 'Prólogo'
		});
	});

	it('in-brief, null, "IN BRIEF" (en) / "Resumindo:" (pt)', () => {
		expect(displayTitle(node('in-brief', null, 'IN BRIEF'), 'en')).toEqual({
			ordinal: null,
			title: 'In Brief'
		});
		expect(displayTitle(node('in-brief', null, 'Resumindo:'), 'pt')).toEqual({
			ordinal: null,
			title: 'Resumindo'
		});
	});
});

describe('displayTitle — real-corpus edge cases beyond the table', () => {
	// ccc.en: some articles/parts are printed fully caps ("ARTICLE 2 ...")
	// rather than the more common "Article 2 ..." — the prefix match must be
	// case-insensitive to catch both.
	it('handles a fully-caps "ARTICLE" label', () => {
		expect(
			displayTitle(
				node('article', 2, 'ARTICLE 2 "AND IN JESUS CHRIST, HIS ONLY SON, OUR LORD"'),
				'en'
			)
		).toEqual({
			ordinal: '2.',
			title: '"And in Jesus Christ, His Only Son, Our Lord"'
		});
	});

	// ccc.en has one bare "SECTION TWO" with no title text left after its own
	// label — stripping would produce an empty title, so this must fall back
	// to the untouched-and-cased path instead of splitting into ordinal + "".
	it('falls back instead of producing an empty title ("SECTION TWO")', () => {
		expect(displayTitle(node('section', 2, 'SECTION TWO'), 'en')).toEqual({
			ordinal: null,
			title: 'Section Two'
		});
	});

	// ccc.en has roman-numeral `sub` markers where the rest of the title is
	// ALSO all-caps ("I. THE CREEDS"), unlike the mixed-case contract example.
	// The marker stays put; the word after it becomes the effective first
	// word (capitalized regardless of the small-word list).
	it('re-cases the remainder of an all-caps roman-numeral sub title', () => {
		expect(displayTitle(node('sub', 1, 'I. THE CREEDS'), 'en')).toEqual({
			ordinal: null,
			title: 'I. The Creeds'
		});
	});

	// ccc.pt: some `sub` nodes are bare all-caps prayers/titles with no
	// prefix of any kind (n is null) — still get cased.
	it('cases a bare all-caps sub title with no prefix at all', () => {
		expect(displayTitle(node('sub', null, 'CREDO'), 'pt')).toEqual({
			ordinal: null,
			title: 'Credo'
		});
		expect(displayTitle(node('sub', null, 'OS DEZ MANDAMENTOS'), 'pt')).toEqual({
			ordinal: null,
			title: 'Os Dez Mandamentos'
		});
	});

	// ccc.pt also has an in-brief without the trailing colon — must not be
	// altered beyond what's needed (it's already correct).
	it('leaves an already-clean in-brief title alone', () => {
		expect(displayTitle(node('in-brief', null, 'Resumindo'), 'pt')).toEqual({
			ordinal: null,
			title: 'Resumindo'
		});
	});

	// Scripture citations printed as sub titles are mixed-case (accented
	// capital + lowercase body) and must be left completely alone, not
	// mistaken for all-caps because of the accent.
	it('leaves a mixed-case scripture citation title alone', () => {
		expect(displayTitle(node('sub', null, 'Êxodo 20, 2-17'), 'pt')).toEqual({
			ordinal: null,
			title: 'Êxodo 20, 2-17'
		});
	});

	// compendium.en/pt structure titles are messier than the CCC's (multiple
	// headings often glued together with no separator) but must still not be
	// mangled: mixed-case remainders pass through untouched.
	it('compendium: mixed-case remainder after a "Part One" label passes through unchanged', () => {
		expect(displayTitle(node('part', 1, 'Part One The Profession of Faith'), 'en')).toEqual({
			ordinal: '1.',
			title: 'The Profession of Faith'
		});
	});

	it('compendium: all-caps glued chapter heading still gets a sane split + casing', () => {
		expect(
			displayTitle(
				node(
					'chapter',
					1,
					'CAPÍTULO PRIMEIRO A DIGNIDADE DA PESSOA HUMANA O HOMEM IMAGEM DE DEUS'
				),
				'pt'
			)
		).toEqual({
			ordinal: '1.',
			title: 'A Dignidade da Pessoa Humana o Homem Imagem de Deus'
		});
	});

	// Article-prefix stripping must not let n=1's prefix "ARTIGO 1" match the
	// start of an n=10/n=11 title's "ARTIGO 10"/"ARTIGO 11" label — this is
	// what the `\b` word boundary in stripKindPrefix's regex is for. We can't
	// call stripKindPrefix directly (not exported), so this is exercised via
	// displayTitle: passing the *correct* n for a two-digit article still has
	// to match past the boundary rather than accidentally under- or
	// over-consuming.
	it('correctly strips a two-digit article ordinal ("ARTIGO 10")', () => {
		expect(displayTitle(node('article', 10, 'ARTIGO 10 O DÉCIMO MANDAMENTO'), 'pt')).toEqual({
			ordinal: '10.',
			title: 'O Décimo Mandamento'
		});
	});

	it('does not touch an unrelated part/section/chapter kind when n is out of the known word range', () => {
		// No word for n=99 in any ordinal table — must not throw, must not
		// fabricate a label, must fall back to the untouched-and-cased path.
		expect(displayTitle(node('chapter', 99, 'CHAPTER NINETY-NINE SOMETHING'), 'en')).toEqual({
			ordinal: null,
			title: 'Chapter Ninety-Nine Something'
		});
	});
});

describe('normalizeCase', () => {
	it('returns mixed-case input unchanged', () => {
		expect(normalizeCase("Man's Capacity for God", 'en')).toBe("Man's Capacity for God");
		expect(normalizeCase('A salvaguarda da paz', 'pt')).toBe('A salvaguarda da paz');
	});

	it('title-cases an all-caps string, lowercasing small words except the first', () => {
		expect(normalizeCase("MAN'S CAPACITY FOR GOD", 'en')).toBe("Man's Capacity for God");
	});

	it('preserves quoting punctuation around re-cased words', () => {
		expect(normalizeCase('"I BELIEVE" - "WE BELIEVE"', 'en')).toBe('"I Believe" - "We Believe"');
		expect(normalizeCase('«EU CREIO» – «NÓS CREMOS»', 'pt')).toBe('«Eu Creio» – «Nós Cremos»');
	});

	it('does not lowercase the letter after an apostrophe', () => {
		expect(normalizeCase("GOD'S SALVATION: LAW AND GRACE", 'en')).toBe(
			"God's Salvation: Law and Grace"
		);
	});

	it('is a no-op on a string with no letters at all', () => {
		expect(normalizeCase('20:2-17', 'en')).toBe('20:2-17');
	});
});
