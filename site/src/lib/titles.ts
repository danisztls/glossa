/**
 * Structure-node title display: strips the redundant "kind + ordinal"
 * prefix the source prints on top of `structure.json`'s own `n` field
 * (e.g. `"PART ONE: THE PROFESSION OF FAITH"` when `n` is already `1`), and
 * normalizes ALL-CAPS titles to title case.
 *
 * `docs/corpus-schema.md` specifies the *unprefixed* title as what the
 * corpus should store (its own example: `"title": "The Profession of
 * Faith"`), but the real scraper output doesn't match that — CCC and
 * Compendium titles come through with the printed "PART ONE"/"CAPÍTULO
 * PRIMEIRO"/etc label still glued onto the front, inconsistently cased.
 * This module is a site-side derived pass compensating for that (permitted
 * by docs/link-surface.md's "corpus stores raw strings, derived passes
 * interpret" principle) — fixing the scraper to emit clean titles directly
 * is worth doing upstream one day, at which point this module's prefix
 * stripping becomes a no-op safety net rather than the primary mechanism.
 *
 * Verified against every distinct title in the real corpus (not just the
 * contract's example table): `ccc.en`, `ccc.pt` and all ten HTML
 * `compendium.{lang}` structure.json trees — see titles.test.ts.
 *
 * The stripping was `en`/`pt` only until 2026-08-25, which was invisible
 * while those were the only two editions of anything. The Compendium's ten
 * landed eight more, and a German reader saw the whole label survive into
 * the title — `Erster Abschnitt „Ich Glaube“ – „Wir Glauben“` — since no
 * English pattern matched it.
 */

import type { StructureNode } from './types';
import { parseInlineHtml, textRuns, withTextRuns, type InlineNode } from './inline-html';

export interface DisplayTitle {
	ordinal: string | null;
	title: string;
}

/**
 * The content languages whose structure titles this module can read.
 *
 * Not `ContentLang`: this is the set the corpus has a *prefix grammar* for,
 * which is the ten HTML Compendium editions plus what the CCC needs. A
 * language outside it falls back to `en`, which strips nothing and leaves
 * the title as the source printed it — the same posture the module already
 * takes for a title it cannot split.
 *
 * WHAT IS STILL en/pt ONLY, knowingly: the small-word lists
 * `normalizeCaseRuns` uses to title-case an ALL-CAPS heading. The eight
 * languages added here go on borrowing the English list, so a Slovenian or
 * Italian heading is title-cased by English convention where its own
 * orthography wants sentence case, and a German one gets every word
 * capitalised where only its nouns should be. That is a separate defect
 * from the prefix one and needs a per-language decision (title case, or
 * sentence case, or leave the source's capitals alone), not another table.
 */
const LANGS = ['en', 'pt', 'de', 'es', 'fr', 'hu', 'it', 'ro', 'sl', 'sv'] as const;

type Lang = (typeof LANGS)[number];

const LANG_SET: ReadonlySet<string> = new Set(LANGS);

function normLang(lang: string): Lang {
	const base = lang.toLowerCase().slice(0, 2);
	return (LANG_SET.has(base) ? base : 'en') as Lang;
}

// --- Case normalization ----------------------------------------------------

// "except as the first word": these stay lowercase everywhere else in a
// title. Deliberately the same short closed-class list the contract
// specifies — not a general stop-word list.
const EN_SMALL_WORDS = new Set([
	'a',
	'an',
	'and',
	'the',
	'of',
	'in',
	'on',
	'for',
	'to',
	'but',
	'or',
	'nor',
	'as',
	'at',
	'by',
	'from',
	'with'
]);

const PT_SMALL_WORDS = new Set([
	'a',
	'o',
	'as',
	'os',
	'um',
	'uma',
	'de',
	'do',
	'da',
	'dos',
	'das',
	'e',
	'em',
	'no',
	'na',
	'nos',
	'nas',
	'por',
	'para',
	'com',
	'que',
	'se',
	'ao',
	'à'
]);

/** Roman-numeral list marker at the very start of a string (`I.`, `IV.`, `XI.` …). */
const ROMAN_MARKER = /^([IVXLCDM]{1,6})\.(?=\s|$)/;

/**
 * A whole token that is a well-formed roman numeral of two letters or more.
 *
 * Title-casing these produced `Iii`, `Xiv`, `Vii` — 325 occurrences across
 * the corpus's ALL-CAPS headings (`II` ×107, `III` ×88, `IV` ×62, and nine
 * more forms), so this is not an edge case, it is the second most common
 * token shape in the corpus's headings after ordinary words.
 *
 * Two letters minimum, because a lone `I` is the English pronoun far more
 * often than it is the number, and `V`/`X`/`C`/`D`/`M` alone are initials.
 * The ordering rules matter too — a bare `[IVXLCDM]+` would also preserve
 * `MMII`-shaped nonsense — though they are not airtight in the other
 * direction: `MIX` is a valid numeral by these rules and also a word, and
 * would be left as `MIX` rather than `Mix`. That is a cosmetic risk on a
 * word that does not occur in the corpus's headings, taken knowingly.
 */
const ROMAN_TOKEN = /^M{0,4}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

/**
 * Tokens to leave in capitals because they are acronyms, not words.
 *
 * Inside an ALL-CAPS title nothing about `AI` distinguishes it from `AS` by
 * shape, so this cannot be inferred and has to be listed. The list is
 * derived rather than guessed: these are the tokens the corpus itself writes
 * in capitals inside ordinary MIXED-CASE prose, which is the source telling
 * us they are acronyms — `AI` appears that way 59 times and `IA` (its
 * Portuguese equivalent) 57.
 *
 * Only `AI` and `IA` currently reach an ALL-CAPS heading, both in Magnifica
 * Humanitas' third chapter. The rest are attested in prose and listed so a
 * future heading carrying one is right the first time. To extend it, look
 * for capitalised tokens in mixed-case `text_marked` rather than adding a
 * plausible-looking one — an entry that is also a word would freeze that
 * word in capitals wherever it appears in a title.
 */
const ACRONYMS = new Set(['AI', 'IA', 'DNA', 'ONU', 'UNESCO', 'FAO']);

/** Runs of letters (plus in-word apostrophes, so `MAN'S` is one token, not two). */
const WORD = /[\p{L}][\p{L}'’]*/gu;

/**
 * Title-case an ALL-CAPS string; returns mixed-case input unchanged.
 *
 * "Effectively all-caps" ignores digits, punctuation and accents (i.e. it's
 * a check for "any lowercase letter", not "every character is a capital
 * letter") — see the module docblock for why this leaves already-sensible
 * strings (mixed-case titles, scripture citations like "Êxodo 20, 2-17")
 * alone rather than trying to re-derive a "better" casing for them.
 *
 * A leading roman-numeral marker (`I.`, `II.`, `XI.` …) is preserved
 * verbatim rather than re-cased — CCC/Compendium `sub` nodes use these as
 * list markers (`"I. The Desire for God"`), and the corpus sometimes prints
 * the rest of the title in caps too (`"I. THE CREEDS"`). The word right
 * after the marker is then treated as the title's first word for
 * capitalization purposes (so it's capitalized even if it's normally a
 * small word), matching the convention already visible in the corpus's own
 * mixed-case examples of this pattern.
 */
export function normalizeCase(text: string, lang: string): string {
	return normalizeCaseRuns([text], lang)[0];
}

/**
 * `normalizeCase` over a title split into text runs — the pieces of a
 * heading that carries inline markup, as `textRuns` yields them.
 *
 * The decision ("is this ALL-CAPS?") and the state that walks it (the
 * leading roman marker, which word is the title's first) belong to the whole
 * title, not to any one run: `FOUNDATIONS AND PRINCIPLES OF<br/> THE SOCIAL
 * DOCTRINE OF THE CHURCH` is one ALL-CAPS heading in two runs, and casing
 * them independently would capitalise `THE` as a second first-word. So the
 * runs are joined for the test and walked with shared state for the rewrite.
 *
 * A preserved roman numeral does NOT consume the first-word slot — it is a
 * marker, and the word after it is the title's real first word, which is the
 * convention the corpus's own mixed-case examples already show. An acronym
 * does consume it: it is a word, so `AI AND THE HUMAN PERSON` should read
 * `AI and the Human Person`, not `AI And the Human Person`.
 */
export function normalizeCaseRuns(runs: string[], lang: string): string[] {
	const joined = runs.join('');
	const hasLower = /\p{Ll}/u.test(joined);
	const hasUpper = /\p{Lu}/u.test(joined);
	if (!hasUpper || hasLower) return runs;

	// en/pt only, and every other language borrows the English list — the
	// gap named in `Lang`'s docblock. Widening this is a per-language
	// decision about what "normalized" even means for that orthography.
	const smallWords = normLang(lang) === 'pt' ? PT_SMALL_WORDS : EN_SMALL_WORDS;
	const marker = joined.match(ROMAN_MARKER);
	const markerEnd = marker ? marker[0].length : 0;

	let sawFirstContentWord = false;
	let base = 0;
	return runs.map((run) => {
		const runStart = base;
		base += run.length;
		return run.replace(WORD, (word, offset: number) => {
			// part of the preserved roman-numeral marker itself
			if (runStart + offset < markerEnd) return word;

			if (word.length >= 2 && ROMAN_TOKEN.test(word)) return word;

			const isFirst = !sawFirstContentWord;
			sawFirstContentWord = true;

			if (ACRONYMS.has(word)) return word;

			const lower = word.toLowerCase();
			if (!isFirst && smallWords.has(lower)) return lower;
			return lower.charAt(0).toUpperCase() + lower.slice(1);
		});
	});
}

/**
 * A document heading as inline nodes, case-normalized.
 *
 * Falls back to a single text node when the heading carries no markup, so a
 * caller renders one way regardless. The normalization runs over the text
 * runs rather than the markup string: `FOUNDATIONS AND PRINCIPLES OF<br/>
 * THE SOCIAL DOCTRINE` is one ALL-CAPS title whose words are split across
 * two runs, and lower-casing the tag names would be the other outcome.
 */
export function inlineTitleNodes(
	title: string,
	titleHtml: string | undefined,
	lang: string
): InlineNode[] {
	const nodes = titleHtml ? parseInlineHtml(titleHtml) : [{ kind: 'text' as const, text: title }];
	const cased = withTextRuns(nodes, normalizeCaseRuns(textRuns(nodes), normLang(lang)));
	// Same trailing-colon trim `displayDocumentTitle` applies, on the last
	// text run so the two forms of a title cannot render differently.
	for (let i = cased.length - 1; i >= 0; i--) {
		const node = cased[i];
		if (node.kind !== 'text') continue;
		cased[i] = { kind: 'text', text: finalize(node.text) };
		break;
	}
	return cased;
}

// --- Kind labels -----------------------------------------------------------

/**
 * Short kind label for a numbered structure node — "Part 1", "Ch. 3",
 * "Art. 2" — replacing the bare `"1."` that `displayTitle` returns as its
 * `ordinal`.
 *
 * WHY THE BARE ORDINAL WASN'T ENOUGH. `displayTitle` strips the source's
 * printed prefix precisely because it is redundant with `n` and
 * inconsistently cased ("PART ONE: ...", "CAPÍTULO PRIMEIRO"). But dropping
 * it entirely left every level rendering the identical "1.", so a table of
 * contents four levels deep showed "1." for a Part, "1." for the Section
 * inside it, "1." for the Chapter inside that, and "1." again for the
 * Article — four different things wearing the same badge, and the numbers
 * restart at every level so they don't disambiguate each other either.
 *
 * This puts the kind back, but on our terms rather than the source's:
 * uniform, abbreviated, derived from structured data, and translated. So
 * `displayTitle` still does the right thing by stripping, and callers that
 * want a label ask for one.
 *
 * Abbreviated rather than spelled out for the two deep kinds (there are 19
 * chapters and 67 articles in the CCC, and "Chapter"/"Article" repeated at
 * that density is more column than information), spelled out for the two
 * shallow ones (4 parts, 8 sections — they head the page and can afford it).
 */
const KIND_LABELS: Record<Lang, Partial<Record<StructureNode['kind'], string>>> = {
	en: { part: 'Part', section: 'Section', chapter: 'Ch.', article: 'Art.' },
	pt: { part: 'Parte', section: 'Secção', chapter: 'Cap.', article: 'Art.' },
	de: { part: 'Teil', section: 'Abschnitt', chapter: 'Kap.' },
	es: { part: 'Parte', section: 'Sección', chapter: 'Cap.' },
	fr: { part: 'Partie', section: 'Section', chapter: 'Ch.' },
	hu: { part: 'rész', section: 'szakasz', chapter: 'fejezet' },
	it: { part: 'Parte', section: 'Sezione', chapter: 'Cap.' },
	ro: { part: 'Partea', section: 'Secțiunea', chapter: 'Cap.' },
	sl: { part: 'Del', section: 'Oddelek', chapter: 'Pogl.' },
	sv: { part: 'Del', section: 'Avdelning', chapter: 'Kap.' }
};

/**
 * Languages that write the number BEFORE the noun ("1. rész"), not after
 * it. Hungarian's ordinal syntax, not a house style — and the reason the
 * label word is stored lowercase for it, since it is no longer the first
 * word of the marker. `article` is absent from all eight new tables because
 * only the CCC has that kind and the CCC is en/pt.
 */
const NUMBER_FIRST: ReadonlySet<Lang> = new Set<Lang>(['hu']);

/**
 * `"Ch. 3"`, or null when the node has no number or no label for its kind
 * (`prologue`, `in-brief` and `sub` are all unnumbered headings whose titles
 * already say what they are).
 */
export function kindOrdinalLabel(
	node: Pick<StructureNode, 'kind' | 'n'>,
	lang: string
): string | null {
	if (node.n === null) return null;
	const L = normLang(lang);
	const label = KIND_LABELS[L][node.kind];
	if (!label) return null;
	return NUMBER_FIRST.has(L) ? `${node.n}. ${label}` : `${label} ${node.n}`;
}

/**
 * The bare kind word `kindOrdinalLabel` prints before a number ("Ch.",
 * "Part"…), with no number attached — for callers that have a `kind` but no
 * `n` to hand `kindOrdinalLabel`. Document headings are the case: they carry
 * no structured `n` (`types.ts`'s `DocumentNode` docblock — the scraper
 * deliberately doesn't judge what a heading *means*), but a document's own
 * printed label ("CHAPTER TWO") still names one of these same four kinds,
 * and a caller that derives its own number from heading position wants the
 * matching abbreviated word from the one table both forms share.
 */
export function kindLabelWord(kind: StructureNode['kind'], lang: string): string | null {
	return KIND_LABELS[normLang(lang)][kind] ?? null;
}

// --- Redundant prefix stripping --------------------------------------------

/**
 * The ordinal words each edition prints in its division labels, FOLDED —
 * uppercased with diacritics removed, because that is the form
 * `stripKindPrefix` matches against (see `foldCodePoints`). So `SETIMO`,
 * not `SÉTIMO`, and `ELSO`, not `ELSŐ`.
 *
 * These are the same words `pipeline/scrapers/ccc/compendium.py`'s
 * `_ORDINAL_LABELS` recognizes, and deliberately a second copy rather than
 * a generated one: the scraper's table decides what a heading *is* — get it
 * wrong there and a part goes missing, which `validate` fails on — while
 * this one decides how a heading *reads*, and getting it wrong shows an
 * unstripped label. Different jobs, different failure modes, and the source
 * they both describe is a frozen 2005 capture that will never be re-crawled
 * (`docs/link-surface.md`). What guards this copy is `titles.test.ts`,
 * which asserts a real title from every edition, not the table itself.
 *
 * Five is the whole range for the Compendium (four parts, two sections, at
 * most four chapters); en/pt carry ten because the CCC's chapters do.
 */
const EN_CARDINAL: Record<number, string> = {
	1: 'ONE',
	2: 'TWO',
	3: 'THREE',
	4: 'FOUR',
	5: 'FIVE',
	6: 'SIX',
	7: 'SEVEN',
	8: 'EIGHT',
	9: 'NINE',
	10: 'TEN'
};

// "Capítulo" is masculine, "parte"/"secção" are feminine — Portuguese
// ordinal-word prefixes agree in gender with the noun they modify, so
// chapter needs a different word list than part/section (PRIMEIRO vs
// PRIMEIRA). Six of the nine other languages decline the same way; which
// series goes with which noun is what `KIND_PREFIXES` records.
const PT_ORDINAL_MASC: Record<number, string> = {
	1: 'PRIMEIRO',
	2: 'SEGUNDO',
	3: 'TERCEIRO',
	4: 'QUARTO',
	5: 'QUINTO',
	6: 'SEXTO',
	7: 'SETIMO',
	8: 'OITAVO',
	9: 'NONO',
	10: 'DECIMO'
};

const PT_ORDINAL_FEM: Record<number, string> = {
	1: 'PRIMEIRA',
	2: 'SEGUNDA',
	3: 'TERCEIRA',
	4: 'QUARTA',
	5: 'QUINTA',
	6: 'SEXTA',
	7: 'SETIMA',
	8: 'OITAVA',
	9: 'NONA',
	10: 'DECIMA'
};

// German declines the ordinal to its noun's gender: der Teil and der
// Abschnitt take ERSTER, das Kapitel takes ERSTES.
const DE_ORDINAL_MASC: Record<number, string> = {
	1: 'ERSTER',
	2: 'ZWEITER',
	3: 'DRITTER',
	4: 'VIERTER',
	5: 'FUNFTER'
};

const DE_ORDINAL_NEUT: Record<number, string> = {
	1: 'ERSTES',
	2: 'ZWEITES',
	3: 'DRITTES',
	4: 'VIERTES',
	5: 'FUNFTES'
};

const ES_ORDINAL_FEM: Record<number, string> = {
	1: 'PRIMERA',
	2: 'SEGUNDA',
	3: 'TERCERA',
	4: 'CUARTA',
	5: 'QUINTA'
};

const ES_ORDINAL_MASC: Record<number, string> = {
	1: 'PRIMERO',
	2: 'SEGUNDO',
	3: 'TERCERO',
	4: 'CUARTO',
	5: 'QUINTO'
};

const FR_ORDINAL_FEM: Record<number, string> = {
	1: 'PREMIERE',
	2: 'DEUXIEME',
	3: 'TROISIEME',
	4: 'QUATRIEME',
	5: 'CINQUIEME'
};

// French is the only edition that numbers its chapters in roman numerals
// ("CHAPITRE II"), so its chapter series is numerals where every other
// language's is words.
const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

const HU_ORDINAL: Record<number, string> = {
	1: 'ELSO',
	2: 'MASODIK',
	3: 'HARMADIK',
	4: 'NEGYEDIK',
	5: 'OTODIK'
};

const IT_ORDINAL_FEM: Record<number, string> = {
	1: 'PRIMA',
	2: 'SECONDA',
	3: 'TERZA',
	4: 'QUARTA',
	5: 'QUINTA'
};

const IT_ORDINAL_MASC: Record<number, string> = {
	1: 'PRIMO',
	2: 'SECONDO',
	3: 'TERZO',
	4: 'QUARTO',
	5: 'QUINTO'
};

// Romanian's ordinals past the first are two words ("a doua", "al doilea"),
// which is why these entries contain spaces — the space is matched as
// whitespace, not as a literal, so a line broken across it still strips.
const RO_ORDINAL_FEM: Record<number, string> = {
	1: 'INTAI',
	2: 'A DOUA',
	3: 'A TREIA',
	4: 'A PATRA',
	5: 'A CINCEA'
};

const RO_ORDINAL_MASC: Record<number, string> = {
	1: 'INTAI',
	2: 'AL DOILEA',
	3: 'AL TREILEA',
	4: 'AL PATRULEA',
	5: 'AL CINCILEA'
};

const SL_ORDINAL_MASC: Record<number, string> = {
	1: 'PRVI',
	2: 'DRUGI',
	3: 'TRETJI',
	4: 'CETRTI',
	5: 'PETI'
};

const SL_ORDINAL_NEUT: Record<number, string> = {
	1: 'PRVO',
	2: 'DRUGO',
	3: 'TRETJE',
	4: 'CETRTO',
	5: 'PETO'
};

const SV_ORDINAL: Record<number, string> = {
	1: 'FORSTA',
	2: 'ANDRA',
	3: 'TREDJE',
	4: 'FJARDE',
	5: 'FEMTE'
};

/**
 * One kind's printed label in one edition: the noun, the ordinal series
 * that agrees with it, and which of the two comes first.
 *
 * `'digits'` is the article case — the CCC prints "Article 1", a bare
 * number rather than a word, and only in English and Portuguese.
 */
interface KindPrefix {
	noun: string;
	ordinals: Record<number, string> | 'digits';
	ordinalFirst: boolean;
}

/**
 * Which words each edition puts in front of a division title, folded.
 *
 * WORD ORDER IS PER LANGUAGE AND PER KIND, and every combination below is
 * attested rather than inferred. Portuguese and Spanish put the ordinal
 * first for part/section ("PRIMEIRA PARTE") and the noun first for chapter
 * ("CAPÍTULO PRIMEIRO"); Italian and Romanian put the noun first for all
 * three ("PARTE PRIMA", "Partea întâi"); German, Hungarian, Slovenian and
 * Swedish put the ordinal first for all three; English puts the noun first
 * for all three and French splits the way Spanish does.
 *
 * NOUNS ARE AS PRINTED, which for Swedish means the definite form its
 * headings actually use — "FÖRSTA DELEN", not "DEL".
 */
const KIND_PREFIXES: Record<Lang, Partial<Record<StructureNode['kind'], KindPrefix>>> = {
	en: {
		part: { noun: 'PART', ordinals: EN_CARDINAL, ordinalFirst: false },
		section: { noun: 'SECTION', ordinals: EN_CARDINAL, ordinalFirst: false },
		chapter: { noun: 'CHAPTER', ordinals: EN_CARDINAL, ordinalFirst: false },
		article: { noun: 'ARTICLE', ordinals: 'digits', ordinalFirst: false }
	},
	pt: {
		part: { noun: 'PARTE', ordinals: PT_ORDINAL_FEM, ordinalFirst: true },
		section: { noun: 'SECCAO', ordinals: PT_ORDINAL_FEM, ordinalFirst: true },
		chapter: { noun: 'CAPITULO', ordinals: PT_ORDINAL_MASC, ordinalFirst: false },
		article: { noun: 'ARTIGO', ordinals: 'digits', ordinalFirst: false }
	},
	de: {
		part: { noun: 'TEIL', ordinals: DE_ORDINAL_MASC, ordinalFirst: true },
		section: { noun: 'ABSCHNITT', ordinals: DE_ORDINAL_MASC, ordinalFirst: true },
		chapter: { noun: 'KAPITEL', ordinals: DE_ORDINAL_NEUT, ordinalFirst: true }
	},
	es: {
		part: { noun: 'PARTE', ordinals: ES_ORDINAL_FEM, ordinalFirst: true },
		section: { noun: 'SECCION', ordinals: ES_ORDINAL_FEM, ordinalFirst: true },
		chapter: { noun: 'CAPITULO', ordinals: ES_ORDINAL_MASC, ordinalFirst: false }
	},
	fr: {
		part: { noun: 'PARTIE', ordinals: FR_ORDINAL_FEM, ordinalFirst: true },
		section: { noun: 'SECTION', ordinals: FR_ORDINAL_FEM, ordinalFirst: true },
		chapter: { noun: 'CHAPITRE', ordinals: ROMAN, ordinalFirst: false }
	},
	hu: {
		part: { noun: 'RESZ', ordinals: HU_ORDINAL, ordinalFirst: true },
		section: { noun: 'SZAKASZ', ordinals: HU_ORDINAL, ordinalFirst: true },
		chapter: { noun: 'FEJEZET', ordinals: HU_ORDINAL, ordinalFirst: true }
	},
	it: {
		part: { noun: 'PARTE', ordinals: IT_ORDINAL_FEM, ordinalFirst: false },
		section: { noun: 'SEZIONE', ordinals: IT_ORDINAL_FEM, ordinalFirst: false },
		chapter: { noun: 'CAPITOLO', ordinals: IT_ORDINAL_MASC, ordinalFirst: false }
	},
	ro: {
		part: { noun: 'PARTEA', ordinals: RO_ORDINAL_FEM, ordinalFirst: false },
		section: { noun: 'SECTIUNEA', ordinals: RO_ORDINAL_FEM, ordinalFirst: false },
		chapter: { noun: 'CAPITOLUL', ordinals: RO_ORDINAL_MASC, ordinalFirst: false }
	},
	sl: {
		part: { noun: 'DEL', ordinals: SL_ORDINAL_MASC, ordinalFirst: true },
		section: { noun: 'ODDELEK', ordinals: SL_ORDINAL_MASC, ordinalFirst: true },
		chapter: { noun: 'POGLAVJE', ordinals: SL_ORDINAL_NEUT, ordinalFirst: true }
	},
	sv: {
		part: { noun: 'DELEN', ordinals: SV_ORDINAL, ordinalFirst: true },
		section: { noun: 'AVDELNINGEN', ordinals: SV_ORDINAL, ordinalFirst: true },
		chapter: { noun: 'KAPITLET', ordinals: SV_ORDINAL, ordinalFirst: true }
	}
};

function esc(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Uppercase and strip diacritics, ONE CODE POINT AT A TIME so the result
 * has exactly as many code points as the input went in with — an offset
 * into the folded string then names the same place in the original, which
 * is what lets a match on the folded form decide how much of the real title
 * to cut. The Python side needs the same property and says so at
 * `common/text.py`'s `fold`.
 *
 * A code point that does not fold to a single code point is left alone
 * rather than expanded: German ß upper-cases to SS and a ligature
 * decomposes to two letters, and either would slide every later offset. No
 * label contains one — the guard is there so that if one ever does, the
 * prefix simply fails to match instead of cutting the title in the wrong
 * place.
 */
function foldCodePoints(chars: string[]): string {
	let out = '';
	for (const ch of chars) {
		const folded = ch.toUpperCase().normalize('NFKD').replace(/\p{M}/gu, '');
		out += [...folded].length === 1 ? folded : ch;
	}
	return out;
}

/**
 * The folded words (in print order) that make up the redundant prefix for
 * a part/section/chapter/article node, or null if this edition prints no
 * label for that kind or `n` is out of the range we have words for (safer
 * to skip stripping than to guess).
 */
function kindPrefixWords(kind: StructureNode['kind'], n: number, lang: Lang): string[] | null {
	const spec = KIND_PREFIXES[lang][kind];
	if (!spec) return null;
	const ordinal = spec.ordinals === 'digits' ? String(n) : spec.ordinals[n];
	if (!ordinal) return null;
	return spec.ordinalFirst ? [ordinal, spec.noun] : [spec.noun, ordinal];
}

/**
 * Strip a matched prefix + whatever separator punctuation follows it
 * ("PART ONE: …", "Article 1 …", "SECTION ONE …"), returning the
 * remainder, or null if the prefix isn't there or nothing is left after it.
 */
function afterPrefix(remainder: string[]): string | null {
	const rest = remainder
		.join('')
		.replace(/^[\s:.,-]+/, '')
		.trim();
	return rest.length > 0 ? rest : null;
}

function stripPrefixMatch(title: string, re: RegExp): string | null {
	const match = title.match(re);
	if (!match) return null;
	return afterPrefix([title.slice(match[0].length)]);
}

function stripKindPrefix(
	title: string,
	kind: StructureNode['kind'],
	n: number,
	lang: Lang
): string | null {
	const words = kindPrefixWords(kind, n, lang);
	if (!words) return null;
	// `\b` after a digit token (article) is what stops n=1's prefix from
	// also matching the start of an n=10/n=11 title — \b only holds between
	// a word character and a non-word character, so "1" directly followed
	// by another digit ("10…") never satisfies it. Word tokens (ONE, PARTE,
	// CAPITULO…) get the same boundary for free, and folding has already
	// reduced every one of them to ASCII letters, which is the alphabet
	// `\b` knows.
	const pattern = words.map((word) => word.split(' ').map(esc).join('\\s+')).join('\\s+');
	const chars = [...title];
	const match = foldCodePoints(chars).match(new RegExp('^' + pattern + '\\b'));
	if (!match) return null;
	return afterPrefix(chars.slice([...match[0]].length));
}

/**
 * The English "Paragraph N." / Portuguese "PARÁGRAFO N" numbered-sub
 * prefix — a second, unrelated redundant-prefix pattern that also shows up
 * under `kind: "sub"`, distinct from the roman-numeral list markers
 * (`I.`, `II.` …) that same kind also uses and which are deliberately left
 * alone (see `normalizeCase`'s docblock).
 */
function stripSubOrdinalPrefix(title: string, n: number, lang: Lang): string | null {
	const word = lang === 'pt' ? 'PARÁGRAFO' : 'Paragraph';
	const re = new RegExp('^' + esc(word) + String.raw`\s+${n}\.?(?!\d)`, 'i');
	return stripPrefixMatch(title, re);
}

/**
 * Strip the redundant kind prefix a source prints and normalize ALL-CAPS.
 *
 * Where recognizing/stripping a prefix would be ambiguous (most notably
 * `ccc.en`'s bare `"SECTION TWO"`, which has no title left over once its
 * own label is removed, and roman-numeral-marker `sub` titles like
 * `"I. The Desire for God"`, where the marker is part of the title rather
 * than a redundant echo of `n`), this leaves the title's structure alone —
 * `ordinal` comes back `null` — and only case-normalizes it. Preferring an
 * unsplit-but-correctly-cased title over a guessed split matches the
 * "leave it untouched over mangling it" rule from the contract.
 */
/**
 * A DOCUMENT heading's display form. Unlike `displayTitle`, there is no
 * ordinal to split off: a document node carries no `kind`/`n` to reconstruct
 * one from, and its label ("PART I", "CHAPTER I") is part of the title text
 * the source printed. Casing normalisation still applies, since vatican.va
 * sets most headings in full caps.
 */
export function displayDocumentTitle(title: string, lang: string): DisplayTitle {
	return { ordinal: null, title: finalize(normalizeCase(title, normLang(lang))) };
}

export function displayTitle(
	node: Pick<StructureNode, 'kind' | 'n' | 'title'>,
	lang: string
): DisplayTitle {
	const L = normLang(lang);
	const { kind, n, title } = node;

	if (
		n !== null &&
		(kind === 'part' || kind === 'section' || kind === 'chapter' || kind === 'article')
	) {
		const rest = stripKindPrefix(title, kind, n, L);
		if (rest !== null) {
			return { ordinal: `${n}.`, title: finalize(normalizeCase(rest, L)) };
		}
	}

	if (kind === 'sub' && n !== null) {
		const rest = stripSubOrdinalPrefix(title, n, L);
		if (rest !== null) {
			return { ordinal: `${n}.`, title: finalize(normalizeCase(rest, L)) };
		}
	}

	// prologue/in-brief (bare kind-name titles, nothing to strip), roman-
	// numeral subs, and any part/section/chapter/article that didn't match
	// the expected prefix (out-of-range `n`, or a genuinely empty remainder
	// like "SECTION TWO") all land here: no separate ordinal, just casing.
	return { ordinal: null, title: finalize(normalizeCase(title, L)) };
}

/**
 * A handful of in-brief titles print a trailing colon ("Resumindo:") that
 * doesn't belong once the block is rendered as its own heading rather than
 * inline lead-in text. No other real title in the corpus ends in a bare
 * colon, so trimming it unconditionally (after case normalization, whose
 * word-boundary regex ignores it either way) is safe.
 */
function finalize(title: string): string {
	return title.replace(/[:\s]+$/, '');
}
