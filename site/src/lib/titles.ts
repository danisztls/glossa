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
 * contract's example table): `ccc.en`, `ccc.pt`, `compendium.en`,
 * `compendium.pt` structure.json — see titles.test.ts.
 */

import type { StructureNode } from './types';
import { parseInlineHtml, textRuns, withTextRuns, type InlineNode } from './inline-html';

export interface DisplayTitle {
	ordinal: string | null;
	title: string;
}

type Lang = 'en' | 'pt';

function normLang(lang: string): Lang {
	return lang.toLowerCase().startsWith('pt') ? 'pt' : 'en';
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
	pt: { part: 'Parte', section: 'Secção', chapter: 'Cap.', article: 'Art.' }
};

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
	const label = KIND_LABELS[normLang(lang)][node.kind];
	return label ? `${label} ${node.n}` : null;
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
// PRIMEIRA).
const PT_ORDINAL_MASC: Record<number, string> = {
	1: 'PRIMEIRO',
	2: 'SEGUNDO',
	3: 'TERCEIRO',
	4: 'QUARTO',
	5: 'QUINTO',
	6: 'SEXTO',
	7: 'SÉTIMO',
	8: 'OITAVO',
	9: 'NONO',
	10: 'DÉCIMO'
};

const PT_ORDINAL_FEM: Record<number, string> = {
	1: 'PRIMEIRA',
	2: 'SEGUNDA',
	3: 'TERCEIRA',
	4: 'QUARTA',
	5: 'QUINTA',
	6: 'SEXTA',
	7: 'SÉTIMA',
	8: 'OITAVA',
	9: 'NONA',
	10: 'DÉCIMA'
};

function esc(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * The literal tokens (in print order) that make up the redundant prefix for
 * a part/section/chapter/article node, or null if `n` is out of the range
 * we have words for (safer to skip stripping than to guess).
 *
 * Word order genuinely differs by kind in Portuguese: part/section put the
 * ordinal word first ("PRIMEIRA PARTE", "SEGUNDA SECÇÃO") but chapter puts
 * the kind word first ("CAPÍTULO PRIMEIRO") — both forms are real, attested
 * in `ccc.pt/structure.json`, not a typo to normalize away.
 */
function kindPrefixTokens(
	kind: StructureNode['kind'],
	n: number,
	lang: Lang
): [string, string] | null {
	let tokens: [string | undefined, string | undefined];
	switch (kind) {
		case 'part':
			tokens = lang === 'pt' ? [PT_ORDINAL_FEM[n], 'PARTE'] : ['PART', EN_CARDINAL[n]];
			break;
		case 'section':
			tokens = lang === 'pt' ? [PT_ORDINAL_FEM[n], 'SECÇÃO'] : ['SECTION', EN_CARDINAL[n]];
			break;
		case 'chapter':
			tokens = lang === 'pt' ? ['CAPÍTULO', PT_ORDINAL_MASC[n]] : ['CHAPTER', EN_CARDINAL[n]];
			break;
		case 'article':
			tokens = lang === 'pt' ? ['ARTIGO', String(n)] : ['ARTICLE', String(n)];
			break;
		default:
			return null;
	}
	return tokens[0] && tokens[1] ? (tokens as [string, string]) : null;
}

/**
 * Strip a matched prefix + whatever separator punctuation follows it
 * ("PART ONE: …", "Article 1 …", "SECTION ONE …"), returning the
 * remainder, or null if the prefix isn't there or nothing is left after it.
 */
function stripPrefixMatch(title: string, re: RegExp): string | null {
	const match = title.match(re);
	if (!match) return null;
	const rest = title
		.slice(match[0].length)
		.replace(/^[\s:.,-]+/, '')
		.trim();
	return rest.length > 0 ? rest : null;
}

function stripKindPrefix(
	title: string,
	kind: StructureNode['kind'],
	n: number,
	lang: Lang
): string | null {
	const tokens = kindPrefixTokens(kind, n, lang);
	if (!tokens) return null;
	// `\b` after a digit token (article) is what stops n=1's prefix from
	// also matching the start of an n=10/n=11 title — \b only holds between
	// a word character and a non-word character, so "1" directly followed
	// by another digit ("10…") never satisfies it. Word tokens (ONE, PARTE,
	// CAPÍTULO…) get the same boundary for free.
	const re = new RegExp('^' + tokens.map(esc).join('\\s+') + '\\b', 'i');
	return stripPrefixMatch(title, re);
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
