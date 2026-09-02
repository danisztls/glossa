import { describe, expect, it } from 'vitest';
import {
	displayDocumentTitle,
	documentHeadingParts,
	displayTitle,
	kindOrdinalLabel,
	normalizeCase,
	normalizeCaseRuns
} from './titles';
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
				node('chapter', 1, 'CAPÍTULO PRIMEIRO A DIGNIDADE DA PESSOA HUMANA O HOMEM IMAGEM DE DEUS'),
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

describe('normalizeCase — numerals and acronyms', () => {
	// 325 occurrences across the corpus's ALL-CAPS headings were being
	// title-cased into Iii / Xiv / Vii.
	it('leaves a roman numeral alone instead of title-casing it', () => {
		expect(normalizeCase('III OS ARGUMENTOS TEOLÓGICOS', 'pt')).toBe(
			'III Os Argumentos Teológicos'
		);
		expect(normalizeCase('CHAPTER VIII', 'en')).toBe('Chapter VIII');
	});

	it("does not let the numeral take the first word's capital", () => {
		// A numeral is a marker, so the word after it is the title's first —
		// "os" is a Portuguese small word and would otherwise be lowercased.
		expect(normalizeCase('IV OS FRUTOS', 'pt')).toBe('IV Os Frutos');
	});

	it('leaves a lone I alone — it is the pronoun far more often than the number', () => {
		expect(normalizeCase('I AM THE WAY', 'en')).toBe('I Am the Way');
	});

	it('keeps an acronym in capitals', () => {
		expect(normalizeCase('THE PROMISES OF AI', 'en')).toBe('The Promises of AI');
		expect(normalizeCase('AS PROMESSAS DA IA', 'pt')).toBe('As Promessas da IA');
	});

	it("lets an acronym take the first word's slot, unlike a numeral", () => {
		expect(normalizeCase('AI AND THE HUMAN PERSON', 'en')).toBe('AI and the Human Person');
	});
});

describe('normalizeCaseRuns', () => {
	it('treats runs of one title as one title', () => {
		// Split across a <br/>: casing the runs separately would capitalise
		// "THE" as a second first-word.
		expect(
			normalizeCaseRuns(['FOUNDATIONS AND PRINCIPLES OF', ' THE SOCIAL DOCTRINE'], 'en')
		).toEqual(['Foundations and Principles of', ' the Social Doctrine']);
	});

	it('returns mixed-case runs untouched', () => {
		expect(normalizeCaseRuns(['The ', 'res novae', ' of our time'], 'en')).toEqual([
			'The ',
			'res novae',
			' of our time'
		]);
	});
});

// Every title below is verbatim from `compendium.{lang}/structure.json` —
// the ten HTML editions ingested 2026-08-25. They are the guard on
// `KIND_PREFIXES`, which is a second copy of the label vocabulary
// `pipeline/scrapers/ccc/compendium.py` recognizes; a copy is only safe
// while something asserts the outcome, and the outcome is what these check.
describe('displayTitle — the eight Compendium languages beyond en/pt', () => {
	it('de: the ordinal declines to its noun (ERSTER Teil, ERSTES Kapitel)', () => {
		expect(displayTitle(node('part', 1, 'ERSTER TEIL DAS GLAUBENSBEKENNTNIS'), 'de')).toEqual({
			ordinal: '1.',
			title: 'Das Glaubensbekenntnis'
		});
		// The neuter series, and a mixed-case title the caser leaves alone.
		expect(
			displayTitle(node('chapter', 2, 'ZWEITES KAPITEL Gott geht auf den Menschen zu'), 'de')
		).toEqual({ ordinal: '2.', title: 'Gott geht auf den Menschen zu' });
		// The masculine series must NOT strip a chapter, or n would be read
		// off the wrong word.
		expect(displayTitle(node('chapter', 1, 'ERSTER KAPITEL Etwas'), 'de').ordinal).toBe(null);
	});

	it('es: ordinal before part/section, after CAPÍTULO — as in pt', () => {
		expect(displayTitle(node('part', 1, 'PRIMERA PARTE LA PROFESIÓN DE LA FE'), 'es')).toEqual({
			ordinal: '1.',
			title: 'La Profesión de la Fe'
		});
		expect(
			displayTitle(node('chapter', 3, 'CAPÍTULO TERCERO LA RESPUESTA DEL HOMBRE A DIOS'), 'es')
		).toEqual({ ordinal: '3.', title: 'La Respuesta del Hombre a Dios' });
	});

	it('fr: chapters are numbered in roman numerals, uniquely', () => {
		expect(
			displayTitle(node('chapter', 2, 'CHAPITRE II DIEU À LA RENCONTRE DE L’HOMME'), 'fr')
		).toEqual({ ordinal: '2.', title: 'Dieu à la Rencontre de L’homme' });
	});

	it('fr: a part whose title is nothing but its own label stays whole', () => {
		// Same shape as ccc.en's bare "SECTION TWO" above: stripping would
		// leave an empty title, so nothing is stripped and the marker comes
		// from `kindOrdinalLabel` instead.
		expect(displayTitle(node('part', 1, 'PREMIÈRE PARTIE'), 'fr')).toEqual({
			ordinal: null,
			title: 'Première Partie'
		});
	});

	it('hu: one ordinal series for all three kinds', () => {
		expect(displayTitle(node('section', 2, 'MÁSODIK SZAKASZ A TÍZPARANCSOLAT'), 'hu')).toEqual({
			ordinal: '2.',
			title: 'A Tízparancsolat'
		});
	});

	it('it: the noun comes first for all three kinds', () => {
		expect(displayTitle(node('part', 1, 'PARTE PRIMA LA PROFESSIONE DELLA FEDE'), 'it')).toEqual({
			ordinal: '1.',
			title: 'La Professione della Fede'
		});
		expect(
			displayTitle(node('chapter', 4, 'CAPITOLO QUARTO LE ALTRE CELEBRAZIONI LITURGICHE'), 'it')
		).toEqual({ ordinal: '4.', title: 'Le Altre Celebrazioni Liturgiche' });
	});

	it('ro: two-word ordinals, and a cedilla the folding sees past', () => {
		// "Secţiunea" is printed with U+0163 (t-cedilla), not the comma-below
		// ț of modern orthography; matching folds both to T.
		expect(
			displayTitle(node('section', 2, 'Secţiunea a doua Mărturisirea de credinţă creştină'), 'ro')
		).toEqual({ ordinal: '2.', title: 'Mărturisirea de credinţă creştină' });
		expect(
			displayTitle(node('chapter', 4, 'Capitolul al patrulea CELELALTE CELEBRĂRI LITURGICE'), 'ro')
		).toEqual({ ordinal: '4.', title: 'Celelalte Celebrări Liturgice' });
	});

	it('sl: the ordinal declines to its noun, as in de', () => {
		expect(
			displayTitle(node('chapter', 4, 'ČETRTO POGLAVJE DRUGA LITURGIČNA OPRAVILA'), 'sl')
		).toEqual({ ordinal: '4.', title: 'Druga Liturgična Opravila' });
	});

	it('sv: the noun is printed in its definite form ("FÖRSTA DELEN")', () => {
		expect(displayTitle(node('part', 1, 'FÖRSTA DELEN TROSBEKÄNNELSEN'), 'sv')).toEqual({
			ordinal: '1.',
			title: 'Trosbekännelsen'
		});
		// This one edition prints its second section's label in mixed case
		// where every other heading is capitals — the match ignores case.
		expect(
			displayTitle(node('section', 2, 'Andra avdelningen DEN KRISTNA TROSBEKÄNNELSEN'), 'sv')
		).toEqual({ ordinal: '2.', title: 'Den Kristna Trosbekännelsen' });
	});

	it('a language with no prefix grammar leaves the title alone', () => {
		// `ar` is a content language with no CCC or Compendium edition; it
		// falls back to `en`, which strips nothing here rather than guessing.
		// This was `la` until the Catechism's Latin edition arrived
		// (2026-08-26) and gave Latin a grammar of its own.
		expect(displayTitle(node('part', 1, 'ERSTER TEIL DAS GLAUBENSBEKENNTNIS'), 'ar')).toEqual({
			ordinal: null,
			title: 'Erster Teil Das Glaubensbekenntnis'
		});
	});

	// One real title from each of the six Catechism editions added
	// 2026-08-26, which is what guards the second copy of the label
	// vocabulary (decisions.md, "A division label is read in the language it
	// was printed in").
	it('reads each Catechism edition’s own division labels', () => {
		expect(displayTitle(node('part', 1, 'PARS PRIMA PROFESSIO FIDEI'), 'la')).toEqual({
			ordinal: '1.',
			title: 'Professio Fidei'
		});
		expect(displayTitle(node('chapter', 2, 'CAPUT SECUNDUM DEUS HOMINI OCCURRIT'), 'la')).toEqual({
			ordinal: '2.',
			title: 'Deus Homini Occurrit'
		});
		expect(displayTitle(node('article', 8, 'ARTIKEL 8 KAMPF DES BETENS'), 'de')).toEqual({
			ordinal: '8.',
			title: 'Kampf des Betens'
		});
		expect(
			displayTitle(node('article', 8, 'ARTÍCULO 8 “CREO EN EL ESPÍRITU SANTO”'), 'es')
		).toEqual({ ordinal: '8.', title: '“Creo en el Espíritu Santo”' });
		expect(displayTitle(node('article', 2, 'ARTICOLO 2 IO CREDO'), 'it')).toEqual({
			ordinal: '2.',
			title: 'Io Credo'
		});
		expect(displayTitle(node('part', 4, 'FIZARANA FAHEFATRA'), 'mg')).toEqual({
			ordinal: null,
			title: 'Fizarana Fahefatra'
		});
		expect(displayTitle(node('article', 2, 'ANDALANA 2 Ny tolom-bavaka'), 'mg')).toEqual({
			ordinal: '2.',
			title: 'Ny tolom-bavaka'
		});
	});

	// French chapters are roman in the Compendium and ordinal words in the
	// Catechism. The same table has to read both.
	it('reads both French chapter conventions', () => {
		expect(displayTitle(node('chapter', 2, 'CHAPITRE II JE CROIS EN JÉSUS-CHRIST'), 'fr')).toEqual({
			ordinal: '2.',
			title: 'Je Crois en Jésus-Christ'
		});
		expect(
			displayTitle(node('chapter', 1, 'CHAPITRE PREMIER L’HOMME EST CAPABLE DE DIEU'), 'fr')
		).toEqual({ ordinal: '1.', title: 'L’homme Est Capable de Dieu' });
	});
});

describe("kindOrdinalLabel — our own marker, not the source's", () => {
	it("names the division in the reader's language", () => {
		expect(kindOrdinalLabel(node('section', 2, ''), 'de')).toBe('Abschnitt 2');
		expect(kindOrdinalLabel(node('section', 1, ''), 'ro')).toBe('Secțiunea 1');
		expect(kindOrdinalLabel(node('chapter', 4, ''), 'sv')).toBe('Kap. 4');
		expect(kindOrdinalLabel(node('part', 3, ''), 'sl')).toBe('Del 3');
	});

	it('puts the number first in Hungarian, which is where its ordinal goes', () => {
		expect(kindOrdinalLabel(node('part', 3, ''), 'hu')).toBe('3. rész');
	});

	it('falls back to English for a language with no labels', () => {
		expect(kindOrdinalLabel(node('part', 1, ''), 'ar')).toBe('Part 1');
	});

	it('names the Catechism’s own divisions in its eight languages', () => {
		expect(kindOrdinalLabel(node('part', 1, ''), 'la')).toBe('Pars 1');
		expect(kindOrdinalLabel(node('article', 8, ''), 'la')).toBe('Art. 8');
		expect(kindOrdinalLabel(node('chapter', 3, ''), 'mg')).toBe('Toko 3');
		expect(kindOrdinalLabel(node('article', 2, ''), 'mg')).toBe('And. 2');
		expect(kindOrdinalLabel(node('article', 8, ''), 'de')).toBe('Art. 8');
	});
});

// Casing, the other half of the same 2026-08-25 gap: every language but
// en/pt was title-cased against the ENGLISH small-word list. Titles here are
// verbatim from the corpus, and each one is a word the English list has no
// entry for.
describe('normalizeCase — the ten languages that had no small-word list', () => {
	it('lowercases the function words of the language it is reading', () => {
		expect(normalizeCase('DIE BERUFUNG DES MENSCHEN', 'de')).toBe('Die Berufung des Menschen');
		expect(normalizeCase('LA PROFESIÓN DE LA FE', 'es')).toBe('La Profesión de la Fe');
		expect(normalizeCase('LA PROFESSIONE DELLA FEDE', 'it')).toBe('La Professione della Fede');
		expect(normalizeCase('CELE ZECE PORUNCI', 'ro')).toBe('Cele Zece Porunci');
		expect(normalizeCase('VERUJEM V BOGA OČETA', 'sl')).toBe('Verujem v Boga Očeta');
		expect(normalizeCase('JAG TROR PÅ GUD FADER', 'sv')).toBe('Jag Tror på Gud Fader');
		expect(normalizeCase('AZ ÚR IMÁDSÁGA', 'hu')).toBe('Az Úr Imádsága');
		expect(normalizeCase('ЦЕРКОВЬ И ЧЕЛОВЕЧЕСТВО НА ПУТИ ИСТОРИИ', 'ru')).toBe(
			'Церковь и Человечество на Пути Истории'
		);
	});

	it('capitalises a content word rather than risk lowercasing a name', () => {
		// Sentence case is what most of these orthographies actually use for
		// a heading, and it is not available: from ALL CAPS there is nothing
		// that separates `CRISTO` from `FEDE`. Over-capitalising is the
		// error that can be read past.
		expect(normalizeCase('CREDO IN GESÙ CRISTO, IL FIGLIO UNIGENITO DI DIO', 'it')).toBe(
			'Credo in Gesù Cristo, il Figlio Unigenito di Dio'
		);
	});

	it('starts a new first word after a colon', () => {
		expect(normalizeCase('LA VOCATION DE L’HOMME: LA VIE DANS L’ESPRIT', 'fr')).toBe(
			'La Vocation de L’homme: La Vie dans L’esprit'
		);
	});
});

describe('normalizeCase — roman numerals that are words', () => {
	it('cases the four the corpus proves are words', () => {
		expect(normalizeCase('L’UOMO É «CAPACE» DI DIO', 'it')).toContain('di Dio');
		expect(normalizeCase('LES DIX COMMANDEMENTS', 'fr')).toBe('Les Dix Commandements');
		expect(normalizeCase('MI ATYÁNK, AKI A MENNYEKBEN VAGY', 'hu')).toBe(
			'Mi Atyánk, Aki a Mennyekben Vagy'
		);
		expect(normalizeCase('VI TROR', 'sv')).toBe('Vi Tror');
	});

	it('keeps VI a numeral in English and Portuguese, where it heads chapters', () => {
		expect(normalizeCase('CHAPTER VI', 'en')).toBe('Chapter VI');
		expect(normalizeCase('CAPÍTULO VI', 'pt')).toBe('Capítulo VI');
	});

	it('keeps a lone Polish I capital, because it is also roman one', () => {
		// `i` is Polish for "and" and is deliberately NOT in the Polish
		// small-word list: the corpus prints "ROZDZIAŁ I", where lowercasing
		// it would turn a chapter number into a conjunction.
		expect(normalizeCase('ROZDZIAŁ I', 'pl')).toBe('Rozdział I');
	});

	it('knows the Russian acronym for artificial intelligence', () => {
		expect(normalizeCase('ОБЕЩАНИЙ ИИ', 'ru')).toBe('Обещаний ИИ');
	});
});

describe("the Compendium's four PDF editions", () => {
	// Added 2026-09-01 with the Byelorussian, Indonesian, Lithuanian and
	// Russian Compendium. Russian's KIND_PREFIXES entry was `{}` until then --
	// the language had chrome but neither Catechism nor Compendium -- and the
	// other three were not in `LANGS` at all.
	it('strips a Cyrillic division label', () => {
		// THE REGRESSION THIS PINS: the prefix was anchored with `\b`, which in
		// JavaScript is ASCII-only, so no boundary exists after a Cyrillic
		// ordinal and the label was never stripped. It failed silently -- the
		// title simply rendered with its own label in front of it -- and no
		// edition could reach it until a Cyrillic one had a prefix table.
		expect(displayTitle(node('part', 1, 'ЧАСТЬ ПЕРВАЯ Исповедание веры'), 'ru')).toEqual({
			ordinal: '1.',
			title: 'Исповедание веры'
		});
		expect(displayTitle(node('chapter', 3, 'ГЛАВА ТРЕТЬЯ ОТВЕТ ЧЕЛОВЕКА БОГУ'), 'ru')).toEqual({
			ordinal: '3.',
			title: 'Ответ Человека Богу'
		});
		expect(displayTitle(node('part', 1, 'ЧАСТКА ПЕРШАЯ ВЫЗНАННЕ ВЕРЫ'), 'be')).toEqual({
			ordinal: '1.',
			title: 'Вызнанне Веры'
		});
	});

	it('reads the ordinal before the noun where the language puts it there', () => {
		// Russian is the one edition of the fourteen that does both: the
		// ordinal follows ЧАСТЬ and ГЛАВА but precedes РАЗДЕЛ.
		expect(
			displayTitle(node('section', 2, 'ВТОРОЙ РАЗДЕЛ ИСПОВЕДАНИЕ ХРИСТИАНСКОЙ ВЕРЫ'), 'ru')
		).toEqual({ ordinal: '2.', title: 'Исповедание Христианской Веры' });
		// Lithuanian sets its divisions in sentence case, not capitals, and
		// declines the ordinal to the noun's gender (dalis is feminine).
		expect(displayTitle(node('part', 1, 'Pirma dalis TIKĖJIMO IŠPAŽINIMAS'), 'lt')).toEqual({
			ordinal: '1.',
			title: 'Tikėjimo Išpažinimas'
		});
	});

	it('counts Indonesian divisions with cardinals', () => {
		expect(displayTitle(node('part', 1, 'BAGIAN SATU PENGAKUAN IMAN'), 'id')).toEqual({
			ordinal: '1.',
			title: 'Pengakuan Iman'
		});
		expect(
			displayTitle(node('chapter', 2, 'BAB DUA ALLAH DATANG UNTUK MENJUMPAI MANUSIA'), 'id')
		).toEqual({ ordinal: '2.', title: 'Allah Datang Untuk Menjumpai Manusia' });
	});
});

// Real headings from the ten Social Doctrine editions. The marker is the
// source's own, so its punctuation is not normalised: seven editions print
// `a)` where English prints `a.`.
describe('documentHeadingParts', () => {
	it('splits a roman-numeral marker from the name it stands over', () => {
		expect(
			documentHeadingParts("I. GOD'S LIBERATING ACTION IN THE HISTORY OF ISRAEL", 'en')
		).toEqual({ ordinal: 'I.', title: "God's Liberating Action in the History of Israel" });
		expect(documentHeadingParts('IV. HUMAN RIGHTS', 'en').ordinal).toBe('IV.');
	});

	it('splits a lettered marker in both punctuations, verbatim', () => {
		expect(documentHeadingParts('a. God\u2019s gratuitous presence', 'en').ordinal).toBe('a.');
		expect(documentHeadingParts('a) All\u2019alba del terzo millennio', 'it').ordinal).toBe('a)');
		expect(documentHeadingParts('A. THE UNITY OF THE PERSON', 'en')).toEqual({
			ordinal: 'A.',
			title: 'The Unity of the Person'
		});
	});

	// A heading that is only a name, and one that is only an identifier: the
	// source prints `PART ONE` on a page of its own with nothing beside it, so
	// there is nothing to split off and splitting would leave an empty row.
	it('leaves a heading alone when it is not a marker and a name', () => {
		for (const title of ['INTRODUCTION', 'PART ONE', 'ELS\u0150 R\u00c9SZ', 'SURA YA KUMI']) {
			expect(documentHeadingParts(title, 'en')).toEqual(displayDocumentTitle(title, 'en'));
		}
	});

	// `Az` opens a Hungarian heading and is not a marker: a single letter only
	// counts when the very next character is its own punctuation.
	it('does not read a word\u2019s first letter as a marker', () => {
		const hu = 'Az Egyh\u00e1z t\u00e1rsadalmi tan\u00edt\u00e1s\u00e1nak kompendiuma';
		expect(documentHeadingParts(hu, 'hu').ordinal).toBeNull();
	});
});
