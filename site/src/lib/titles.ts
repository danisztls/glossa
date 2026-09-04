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
 * BOTH HALVES WERE `en`/`pt` ONLY until 2026-08-25, which was invisible
 * while those were the only two editions of anything. The Compendium's ten
 * landed eight more, and the two halves failed differently on them. The
 * stripping failed loudly: a German reader saw the whole label survive into
 * the title — `Erster Abschnitt „Ich Glaube“ – „Wir Glauben“` — because no
 * English pattern matched it. The casing failed quietly, in the same
 * heading: `Ich Glaube` for a verb, and `La Professione Della Fede` for an
 * Italian title whose prepositions the English small-word list has never
 * heard of. Twelve languages now have their own list.
 */

import type { StructureNode } from './types';
// `./inline-html.ts` WITH THE EXTENSION, like `route-manifest.ts` writes
// `./address.ts` and for the same reason: `scripts/route-titles.mjs` imports
// this module to normalize a heading exactly as the page does, and Node's
// type-stripping loader will not resolve an extensionless relative specifier.
// Vite resolves it either way, so the cost is one visible `.ts` here against a
// second implementation of `displayTitle` in a build script.
import { parseInlineHtml, textRuns, withTextRuns, type InlineNode } from './inline-html.ts';

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
 * TWO TABLES ARE KEYED BY IT and they cover different subsets, which is why
 * this is one list rather than two: `KIND_PREFIXES` (the editions with a
 * label grammar) and `SMALL_WORDS` (those plus `pl` and `ru`, which have
 * ALL-CAPS document headings but no CCC or Compendium). A language outside
 * it — `ar` — falls back to `en`, and it has no ALL-CAPS heading in the
 * corpus to normalize.
 *
 * `la` AND `mg` ARRIVED WITH THE CATECHISM (2026-08-26), which vatican.va
 * publishes as HTML in eight languages. Latin had been a content language
 * since the Summa and was outside this list because the Summa's divisions
 * carry no printed label to strip; the Catechism's do (`PARS PRIMA`, `CAPUT
 * SECUNDUM`), so it needs the grammar now. Malagasy was not a content
 * language at all.
 */
const LANGS = [
	'en',
	'pt',
	'be',
	'de',
	'es',
	'fr',
	'hu',
	'id',
	'it',
	'la',
	'lt',
	'mg',
	'pl',
	'ro',
	'ru',
	'sl',
	'sv'
] as const;

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

// The eight below were added 2026-08-25 with the Compendium's ten editions
// and Magnifica Humanitas' Polish and Russian. Each is closed-class —
// articles, prepositions, conjunctions — for the same reason the two above
// are: lower-casing one can never destroy information, because none of them
// is ever a proper noun. That is also the ceiling. Title case is not the
// convention in most of these languages, but it is the only SAFE guess from
// an ALL-CAPS source: sentence case would lowercase `GESÙ CRISTO`,
// `DUMNEZEU`, `GUD FADER`, and no table can put those capitals back. So a
// content word stays capitalised where its own orthography would not
// capitalise it — over-capitalised, never wrong in the losing direction.

// German declines its articles rather than dropping them, so all six forms
// of "der" are here. Adjectives and verbs are NOT — "SAKRAMENTALE",
// "GLAUBE" — and cannot be, since only a lexicon separates them from the
// nouns German capitalises by rule.
const DE_SMALL_WORDS = new Set([
	'der',
	'die',
	'das',
	'den',
	'dem',
	'des',
	'ein',
	'eine',
	'einen',
	'einem',
	'eines',
	'einer',
	'und',
	'oder',
	'aber',
	'als',
	'wie',
	'in',
	'im',
	'an',
	'am',
	'auf',
	'aus',
	'bei',
	'beim',
	'mit',
	'nach',
	'von',
	'vom',
	'zu',
	'zur',
	'zum',
	'für',
	'über',
	'unter',
	'vor',
	'durch',
	'um',
	'ohne'
]);

const ES_SMALL_WORDS = new Set([
	'el',
	'la',
	'los',
	'las',
	'un',
	'una',
	'unos',
	'unas',
	'lo',
	'de',
	'del',
	'a',
	'al',
	'y',
	'e',
	'o',
	'u',
	'en',
	'con',
	'por',
	'para',
	'que',
	'se',
	'su',
	'sus',
	'como',
	'sin',
	'sobre'
]);

const FR_SMALL_WORDS = new Set([
	'le',
	'la',
	'les',
	'un',
	'une',
	'des',
	'du',
	'de',
	'et',
	'ou',
	'à',
	'au',
	'aux',
	'en',
	'dans',
	'pour',
	'par',
	'sur',
	'sous',
	'avec',
	'sans',
	'que',
	'qui',
	'ne',
	'se',
	'comme'
]);

// `vagy` — "or" — is absent on purpose. It is also the second-person
// present of "to be", and the corpus's only heading containing it is the
// Our Father: "MI ATYÁNK, AKI A MENNYEKBEN VAGY". A list entry that is a
// coin flip between a conjunction and a verb does not belong on a list
// whose whole warrant is that lower-casing its members is always safe.
const HU_SMALL_WORDS = new Set([
	'a',
	'az',
	'és',
	's',
	'de',
	'is',
	'hogy',
	'ha',
	'nem',
	'meg',
	'mint'
]);

// Italian contracts its prepositions with its articles, and every one of the
// results is a separate token ("della", "nello", "sulla") — the list is long
// because the language spells them out, not because it reaches further.
const IT_SMALL_WORDS = new Set([
	'il',
	'lo',
	'la',
	'i',
	'gli',
	'le',
	'un',
	'uno',
	'una',
	'di',
	'del',
	'dello',
	'della',
	'dei',
	'degli',
	'delle',
	'al',
	'allo',
	'alla',
	'ai',
	'agli',
	'alle',
	'dal',
	'dalla',
	'dai',
	'nel',
	'nello',
	'nella',
	'nei',
	'negli',
	'nelle',
	'sul',
	'sulla',
	'e',
	'ed',
	'o',
	'a',
	'da',
	'in',
	'con',
	'su',
	'per',
	'tra',
	'fra',
	'che',
	'non',
	'si',
	'come'
]);

// `i` is deliberately absent: it is Polish for "and", and it is also roman
// one, and the corpus prints "ROZDZIAŁ I" — a heading where lower-casing it
// would turn a chapter number into a conjunction. Leaving it capitalised is
// wrong in the other headings and harmless there, which is the direction
// this list errs in everywhere.
const PL_SMALL_WORDS = new Set([
	'w',
	'we',
	'z',
	'ze',
	'na',
	'do',
	'od',
	'za',
	'po',
	'dla',
	'przez',
	'o',
	'u',
	'ku',
	'przy',
	'nad',
	'pod',
	'bez',
	'a',
	'ale',
	'lub',
	'oraz',
	'nie',
	'się',
	'że'
]);

// Both spellings of Romanian's "and": the corpus prints the cedilla forms
// (ş U+015F) its 2005 source was typeset with, not the comma-below ș of
// current orthography.
const RO_SMALL_WORDS = new Set([
	'a',
	'al',
	'ai',
	'ale',
	'un',
	'o',
	'unui',
	'unei',
	'și',
	'şi',
	'sau',
	'de',
	'din',
	'la',
	'în',
	'pe',
	'cu',
	'pentru',
	'prin',
	'ca',
	'că',
	'să',
	'se',
	'lui',
	'ce',
	'nu'
]);

const RU_SMALL_WORDS = new Set([
	'и',
	'а',
	'но',
	'или',
	'в',
	'во',
	'на',
	'с',
	'со',
	'о',
	'об',
	'от',
	'до',
	'для',
	'по',
	'к',
	'ко',
	'у',
	'за',
	'из',
	'при',
	'про',
	'над',
	'под',
	'без',
	'как',
	'что',
	'не',
	'же'
]);

const SL_SMALL_WORDS = new Set([
	'in',
	'ali',
	'pa',
	'ter',
	'v',
	'na',
	'z',
	's',
	'o',
	'od',
	'do',
	'za',
	'pri',
	'po',
	'ob',
	'iz',
	'je',
	'so',
	'se',
	'ne',
	'kot'
]);

const SV_SMALL_WORDS = new Set([
	'och',
	'eller',
	'men',
	'i',
	'på',
	'av',
	'för',
	'till',
	'från',
	'med',
	'om',
	'som',
	'vid',
	'under',
	'över',
	'att',
	'en',
	'ett',
	'den',
	'det',
	'de',
	'är'
]);

// Latin's closed-class function words: conjunctions and prepositions, none
// of which is ever a proper noun, which is the whole standard for this list
// (see site/docs/languages.md, "A list entry that is a coin flip does not go on the
// list"). Latin has no articles, so the list is shorter than any other here.
const LA_SMALL_WORDS = new Set([
	'et',
	'ac',
	'atque',
	'aut',
	'vel',
	'sed',
	'in',
	'de',
	'ex',
	'ad',
	'cum',
	'per',
	'sub',
	'pro',
	'sine',
	'contra',
	'inter'
]);

// EMPTY, AND DELIBERATELY SO. Nobody here reads Malagasy, and the standard
// for an entry on these lists is that lower-casing it is ALWAYS safe — which
// is a claim about a language, not a guess at one. An empty set means the
// ALL-CAPS pass capitalises every word of a Malagasy heading, which
// over-capitalises function words and is the error a reader reads past;
// guessing wrong would lower-case a name, which no later pass repairs. Most
// of this edition's headings are printed in sentence case anyway and never
// reach the pass at all.
const MG_SMALL_WORDS = new Set<string>([]);

// Empty for the same reason as Malagasy: these four editions print their
// division titles in capitals or in sentence case already, so the title-case
// pass has nothing to lower. A word list written from a dictionary rather
// than from the corpus would be a guess about usage nobody here can check.
const BE_SMALL_WORDS = new Set<string>([]);
const ID_SMALL_WORDS = new Set<string>([]);
const LT_SMALL_WORDS = new Set<string>([]);

const SMALL_WORDS: Record<Lang, ReadonlySet<string>> = {
	en: EN_SMALL_WORDS,
	pt: PT_SMALL_WORDS,
	be: BE_SMALL_WORDS,
	de: DE_SMALL_WORDS,
	es: ES_SMALL_WORDS,
	fr: FR_SMALL_WORDS,
	hu: HU_SMALL_WORDS,
	id: ID_SMALL_WORDS,
	it: IT_SMALL_WORDS,
	la: LA_SMALL_WORDS,
	lt: LT_SMALL_WORDS,
	mg: MG_SMALL_WORDS,
	pl: PL_SMALL_WORDS,
	ro: RO_SMALL_WORDS,
	ru: RU_SMALL_WORDS,
	sl: SL_SMALL_WORDS,
	sv: SV_SMALL_WORDS
};

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
 * Tokens that satisfy `ROMAN_TOKEN` but are ordinary words in one language,
 * and so must be cased rather than preserved.
 *
 * Derived from the corpus, not guessed — the same rule `ACRONYMS` states.
 * Every roman-shaped token in every ALL-CAPS heading was counted per
 * language, and these four are the ones that are words: Italian `DI` (of,
 * ×13, "L'UOMO É «CAPACE» DI DIO"), French `DIX` (ten, ×1, "LES DIX
 * COMMANDEMENTS"), Hungarian `MI` (our/we, ×2, "MI ATYÁNK") and Swedish
 * `VI` (we, ×2, "«JAG TROR» - «VI TROR»").
 *
 * `VI` is the one that shows why this has to be per language rather than a
 * single list: it is a word in Swedish and the number six in English and
 * Portuguese, where it heads 31 real chapter divisions.
 */
const NOT_ROMAN: Partial<Record<Lang, ReadonlySet<string>>> = {
	fr: new Set(['DIX']),
	hu: new Set(['MI']),
	it: new Set(['DI']),
	sv: new Set(['VI'])
};

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
 * Only `AI`, `IA` and `ИИ` currently reach an ALL-CAPS heading — all three
 * in Magnifica Humanitas' third chapter, which is about artificial
 * intelligence in every language it was published in. The rest are attested
 * in prose and listed so a future heading carrying one is right the first
 * time. To extend it, look for capitalised tokens in mixed-case
 * `text_marked` rather than adding a plausible-looking one — an entry that
 * is also a word would freeze that word in capitals wherever it appears in
 * a title.
 *
 * The 2026-08-25 census that added the last seven counted every all-capital
 * token in mixed-case prose per language: `AAS` ×173 (Acta Apostolicae
 * Sedis) and `CCSL` ×3 in every language's footnotes, the Catechism sigla
 * `KKK` (sv) and `KKC` (sl), the divine name as both `YHWH` and `JHWH`, and
 * `ИИ` ×2. Polish is the language that got NOTHING out of that census and
 * is the reason it is worth running rather than guessing: it spells
 * "sztuczna inteligencja" out and has no acronym for it at all.
 */
const ACRONYMS = new Set([
	'AI',
	'IA',
	'ИИ',
	'DNA',
	'ONU',
	'UNESCO',
	'FAO',
	'AAS',
	'CCSL',
	'KKK',
	'KKC',
	'YHWH',
	'JHWH'
]);

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

	const L = normLang(lang);
	const smallWords = SMALL_WORDS[L];
	const notRoman = NOT_ROMAN[L];
	const marker = joined.match(ROMAN_MARKER);
	const markerEnd = marker ? marker[0].length : 0;

	let sawFirstContentWord = false;
	let previousEnd = 0;
	let base = 0;
	return runs.map((run) => {
		const runStart = base;
		base += run.length;
		return run.replace(WORD, (word, offset: number) => {
			// part of the preserved roman-numeral marker itself
			if (runStart + offset < markerEnd) return word;

			if (word.length >= 2 && ROMAN_TOKEN.test(word) && !notRoman?.has(word)) return word;

			// A colon introduces a new phrase, so the word after it is a
			// first word again and keeps its capital: "La Vocation de
			// l'homme : la Vie" is French for a heading that reads "…: La
			// Vie". Only the colon — a full stop is as often an ellipsis or
			// an abbreviation inside a heading as it is the end of a
			// sentence, and treating those as boundaries would capitalise
			// the wrong words.
			const gap = joined.slice(previousEnd, runStart + offset);
			previousEnd = runStart + offset + word.length;

			const isFirst = !sawFirstContentWord || gap.includes(':');
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
 * Abbreviated rather than spelled out for the DEEP kinds (there are 19
 * chapters and 67 articles in the CCC, and "Chapter"/"Article" repeated at
 * that density is more column than information), spelled out for the two
 * shallow ones (4 parts, 8 sections — they head the page and can afford it).
 *
 * `title` IS SPELLED OUT DESPITE BEING DEEP, because the test is what an
 * abbreviation SAVES and not where the kind sits: "Title" -> "Tit." saves one
 * character and costs the reader the certainty that the word ends there. It
 * shipped abbreviated for a day on the density argument alone, which is the
 * argument that does not apply — an abbreviation has to earn its full stop.
 * The row is spelled out in all seven languages together, since a crumb that
 * read `TIT. IV` in English and `TITULUS I` in Latin would be one vocabulary
 * pretending to be two.
 *
 * A ROW IS AS COMPLETE AS THE WORKS IN THAT LANGUAGE REQUIRE, which is why
 * `title` is filled in for seven languages and `article` for eleven rather
 * than either being filled in for all seventeen. Naming a division in a
 * language no work here divides that way is inventing vocabulary nobody can
 * check — see the low-confidence tiers in `src/lib/i18n/`'s headers for what
 * that costs. `kindLabelWord` answers `null` for a gap and every caller
 * degrades to the label the source printed, which is always available and
 * always right, just longer.
 *
 * So the gaps say which works exist, not which words do:
 *
 *  - **`title` is the Code of Canon Law's**, in the seven languages the Holy
 *    See publishes it in as HTML. No other work in this corpus has such a
 *    division.
 *  - **`article` is the Catechism's**, plus the Code's — which is what added
 *    `ru` on 2026-09-03. The remaining five gaps (`hu`, `pl`, `ro`, `sl`,
 *    `sv`) are the Compendium-only languages, where neither work is
 *    published. It was absent from all eight until 2026-08-26, when the
 *    Catechism stopped being en/pt.
 */
const KIND_LABELS: Record<Lang, Partial<Record<StructureNode['kind'], string>>> = {
	en: { part: 'Part', section: 'Section', title: 'Title', chapter: 'Ch.', article: 'Art.' },
	pt: { part: 'Parte', section: 'Secção', chapter: 'Cap.', article: 'Art.' },
	be: { part: 'Частка', section: 'Раздзел', chapter: 'Гл.' },
	de: { part: 'Teil', section: 'Abschnitt', title: 'Titel', chapter: 'Kap.', article: 'Art.' },
	es: { part: 'Parte', section: 'Sección', title: 'Título', chapter: 'Cap.', article: 'Art.' },
	fr: { part: 'Partie', section: 'Section', title: 'Titre', chapter: 'Ch.', article: 'Art.' },
	hu: { part: 'rész', section: 'szakasz', chapter: 'fejezet' },
	id: { part: 'Bagian', section: 'Seksi', chapter: 'Bab' },
	it: { part: 'Parte', section: 'Sezione', title: 'Titolo', chapter: 'Cap.', article: 'Art.' },
	la: { part: 'Pars', section: 'Sectio', title: 'Titulus', chapter: 'Cap.', article: 'Art.' },
	lt: { part: 'dalis', section: 'skyrius', chapter: 'poskyris' },
	mg: { part: 'Fizarana', section: 'Sampana', chapter: 'Toko', article: 'And.' },
	pl: { part: 'Część', section: 'Sekcja', chapter: 'Rozdz.' },
	ro: { part: 'Partea', section: 'Secțiunea', chapter: 'Cap.' },
	ru: { part: 'Часть', section: 'Раздел', title: 'Титул', chapter: 'Гл.', article: 'Ст.' },
	sl: { part: 'Del', section: 'Oddelek', chapter: 'Pogl.' },
	sv: { part: 'Del', section: 'Avdelning', chapter: 'Kap.' }
};

/**
 * Languages that write the number BEFORE the noun ("1. rész"), not after
 * it. Hungarian's ordinal syntax, not a house style — and the reason the
 * label word is stored lowercase for it, since it is no longer the first
 * word of the marker. Which rows of `KIND_LABELS` are partial, and why, is
 * recorded there rather than here.
 */
const NUMBER_FIRST: ReadonlySet<Lang> = new Set<Lang>(['hu', 'lt']);

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

// The French COMPENDIUM numbers its chapters in roman numerals ("CHAPITRE
// II") where every other edition of it uses words. The French CATECHISM does
// not — it prints "CHAPITRE PREMIER" — so French chapters carry both series
// and `stripKindPrefix` tries each. Which of the two a heading uses is a fact
// about the work, and the table is keyed by language.
const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' };

const FR_ORDINAL_MASC: Record<number, string> = {
	1: 'PREMIER',
	2: 'DEUXIEME',
	3: 'TROISIEME',
	4: 'QUATRIEME',
	5: 'CINQUIEME'
};

// Latin declines its ordinal to the gender of the noun it heads, so PARS and
// SECTIO (feminine) take one series and CAPUT (neuter) the other. Same shape
// as German's two, for the same grammatical reason.
const LA_ORDINAL_FEM: Record<number, string> = {
	1: 'PRIMA',
	2: 'SECUNDA',
	3: 'TERTIA',
	4: 'QUARTA',
	5: 'QUINTA'
};

const LA_ORDINAL_NEUT: Record<number, string> = {
	1: 'PRIMUM',
	2: 'SECUNDUM',
	3: 'TERTIUM',
	4: 'QUARTUM',
	5: 'QUINTUM'
};

// Malagasy does not decline, so one series serves every division.
const MG_ORDINAL: Record<number, string> = {
	1: 'VOALOHANY',
	2: 'FAHAROA',
	3: 'FAHATELO',
	4: 'FAHEFATRA',
	5: 'FAHADIMY'
};

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
/*
 * The four PDF editions of the Compendium, added 2026-09-01. Written in the
 * FOLDED form `foldCodePoints` compares against, which strips a combining
 * mark from its letter: Belarusian ЧАЦВЁРТАЯ and Russian ЧЕТВЁРТАЯ lose the
 * diaeresis, and Russian's masculine ordinals lose the breve from Й, so
 * ПЕРВЫЙ is written ПЕРВЫИ. Lithuanian loses its caron, ogonek and macron the
 * same way — TREČIA is TRECIA. Spelling any of them the way the language
 * actually writes them matches nothing, silently: the label simply is not
 * stripped and the heading renders with its own label repeated in front of it.
 */
const BE_ORDINAL_FEM: Record<number, string> = {
	1: 'ПЕРШАЯ',
	2: 'ДРУГАЯ',
	3: 'ТРЭЦЯЯ',
	4: 'ЧАЦВЕРТАЯ',
	5: 'ПЯТАЯ'
};

const BE_ORDINAL_MASC: Record<number, string> = {
	1: 'ПЕРШЫ',
	2: 'ДРУГІ',
	3: 'ТРЭЦІ',
	4: 'ЧАЦВЕРТЫ',
	5: 'ПЯТЫ'
};

const RU_ORDINAL_FEM: Record<number, string> = {
	1: 'ПЕРВАЯ',
	2: 'ВТОРАЯ',
	3: 'ТРЕТЬЯ',
	4: 'ЧЕТВЕРТАЯ',
	5: 'ПЯТАЯ'
};

const RU_ORDINAL_MASC: Record<number, string> = {
	1: 'ПЕРВЫИ',
	2: 'ВТОРОИ',
	3: 'ТРЕТИИ',
	4: 'ЧЕТВЕРТЫИ',
	5: 'ПЯТЫИ'
};

/** Indonesian counts with cardinals, and they do not decline. */
const ID_CARDINAL: Record<number, string> = {
	1: 'SATU',
	2: 'DUA',
	3: 'TIGA',
	4: 'EMPAT',
	5: 'LIMA'
};

const LT_ORDINAL_FEM: Record<number, string> = {
	1: 'PIRMA',
	2: 'ANTRA',
	3: 'TRECIA',
	4: 'KETVIRTA',
	5: 'PENKTA'
};

const LT_ORDINAL_MASC: Record<number, string> = {
	1: 'PIRMAS',
	2: 'ANTRAS',
	3: 'TRECIAS',
	4: 'KETVIRTAS',
	5: 'PENKTAS'
};

const KIND_PREFIXES: Record<
	Lang,
	Partial<Record<StructureNode['kind'], KindPrefix | KindPrefix[]>>
> = {
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
	be: {
		part: { noun: 'ЧАСТКА', ordinals: BE_ORDINAL_FEM, ordinalFirst: false },
		section: { noun: 'РАЗДЗЕЛ', ordinals: BE_ORDINAL_MASC, ordinalFirst: false },
		chapter: { noun: 'ГЛАВА', ordinals: BE_ORDINAL_FEM, ordinalFirst: false }
	},
	de: {
		part: { noun: 'TEIL', ordinals: DE_ORDINAL_MASC, ordinalFirst: true },
		section: { noun: 'ABSCHNITT', ordinals: DE_ORDINAL_MASC, ordinalFirst: true },
		chapter: { noun: 'KAPITEL', ordinals: DE_ORDINAL_NEUT, ordinalFirst: true },
		article: { noun: 'ARTIKEL', ordinals: 'digits', ordinalFirst: false }
	},
	es: {
		part: { noun: 'PARTE', ordinals: ES_ORDINAL_FEM, ordinalFirst: true },
		section: { noun: 'SECCION', ordinals: ES_ORDINAL_FEM, ordinalFirst: true },
		chapter: { noun: 'CAPITULO', ordinals: ES_ORDINAL_MASC, ordinalFirst: false },
		article: { noun: 'ARTICULO', ordinals: 'digits', ordinalFirst: false }
	},
	fr: {
		part: { noun: 'PARTIE', ordinals: FR_ORDINAL_FEM, ordinalFirst: true },
		section: { noun: 'SECTION', ordinals: FR_ORDINAL_FEM, ordinalFirst: true },
		// The Compendium's roman numerals and the Catechism's ordinal words,
		// in that order — see the note on `ROMAN`.
		chapter: [
			{ noun: 'CHAPITRE', ordinals: ROMAN, ordinalFirst: false },
			{ noun: 'CHAPITRE', ordinals: FR_ORDINAL_MASC, ordinalFirst: false }
		],
		article: { noun: 'ARTICLE', ordinals: 'digits', ordinalFirst: false }
	},
	hu: {
		part: { noun: 'RESZ', ordinals: HU_ORDINAL, ordinalFirst: true },
		section: { noun: 'SZAKASZ', ordinals: HU_ORDINAL, ordinalFirst: true },
		chapter: { noun: 'FEJEZET', ordinals: HU_ORDINAL, ordinalFirst: true }
	},
	it: {
		part: { noun: 'PARTE', ordinals: IT_ORDINAL_FEM, ordinalFirst: false },
		section: { noun: 'SEZIONE', ordinals: IT_ORDINAL_FEM, ordinalFirst: false },
		chapter: { noun: 'CAPITOLO', ordinals: IT_ORDINAL_MASC, ordinalFirst: false },
		article: { noun: 'ARTICOLO', ordinals: 'digits', ordinalFirst: false }
	},
	la: {
		part: { noun: 'PARS', ordinals: LA_ORDINAL_FEM, ordinalFirst: false },
		section: { noun: 'SECTIO', ordinals: LA_ORDINAL_FEM, ordinalFirst: false },
		chapter: { noun: 'CAPUT', ordinals: LA_ORDINAL_NEUT, ordinalFirst: false },
		article: { noun: 'ARTICULUS', ordinals: 'digits', ordinalFirst: false }
	},
	mg: {
		part: { noun: 'FIZARANA', ordinals: MG_ORDINAL, ordinalFirst: false },
		section: { noun: 'SAMPANA', ordinals: MG_ORDINAL, ordinalFirst: false },
		chapter: { noun: 'TOKO', ordinals: MG_ORDINAL, ordinalFirst: false },
		article: { noun: 'ANDALANA', ordinals: 'digits', ordinalFirst: false }
	},
	// Polish and Russian reach this module through their Magnifica Humanitas
	// documents, which carry no `kind`/`n` to reconstruct a label from — so
	// there is nothing to strip, and the entries are empty rather than
	// absent because the map is total over `Lang`.
	pl: {},
	// Russian puts the ordinal AFTER the noun for its parts and chapters and
	// BEFORE it for its sections — the only edition of the fourteen that does
	// both. Empty until its Compendium was read from PDF on 2026-09-01.
	ru: {
		part: { noun: 'ЧАСТЬ', ordinals: RU_ORDINAL_FEM, ordinalFirst: false },
		section: { noun: 'РАЗДЕЛ', ordinals: RU_ORDINAL_MASC, ordinalFirst: true },
		chapter: { noun: 'ГЛАВА', ordinals: RU_ORDINAL_FEM, ordinalFirst: false }
	},
	id: {
		part: { noun: 'BAGIAN', ordinals: ID_CARDINAL, ordinalFirst: false },
		section: { noun: 'SEKSI', ordinals: ID_CARDINAL, ordinalFirst: false },
		chapter: { noun: 'BAB', ordinals: ID_CARDINAL, ordinalFirst: false }
	},
	lt: {
		part: { noun: 'DALIS', ordinals: LT_ORDINAL_FEM, ordinalFirst: true },
		section: { noun: 'SKYRIUS', ordinals: LT_ORDINAL_MASC, ordinalFirst: true },
		chapter: { noun: 'POSKYRIS', ordinals: LT_ORDINAL_MASC, ordinalFirst: true }
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
function kindPrefixWords(kind: StructureNode['kind'], n: number, lang: Lang): string[][] {
	const spec = KIND_PREFIXES[lang][kind];
	if (!spec) return [];
	const out: string[][] = [];
	for (const one of Array.isArray(spec) ? spec : [spec]) {
		const ordinal = one.ordinals === 'digits' ? String(n) : one.ordinals[n];
		if (!ordinal) continue;
		out.push(one.ordinalFirst ? [ordinal, one.noun] : [one.noun, ordinal]);
	}
	return out;
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
	const chars = [...title];
	const folded = foldCodePoints(chars);
	// One language can print one kind two ways — French chapters are roman
	// in the Compendium and ordinal words in the Catechism — so each
	// alternative is tried and the first that matches wins. They cannot both
	// match: a title opens with one prefix or the other.
	for (const words of kindPrefixWords(kind, n, lang)) {
		// The trailing assertion after a digit token (article) is what stops
		// n=1's prefix from also matching the start of an n=10/n=11 title, and
		// it gives word tokens (ONE, PARTE, CAPITULO…) the same boundary.
		//
		// A LOOKAHEAD RATHER THAN `\b`, because `\b` is ASCII-only. This read
		// `\b` and said so, on the premise that folding reduces every label to
		// ASCII letters — true of all fourteen labels until the Compendium's
		// Russian and Byelorussian editions arrived on 2026-09-01 with ЧАСТЬ,
		// РАЗДЗЕЛ and ГЛАВА. A Cyrillic letter is not a `\b` word character, so
		// no boundary exists after ПЕРВАЯ and the prefix silently failed to
		// match: the label was simply never stripped, and the heading rendered
		// with its own label repeated in front of the title.
		const pattern = words.map((word) => word.split(' ').map(esc).join('\\s+')).join('\\s+');
		const match = folded.match(new RegExp('^' + pattern + '(?![\\p{L}\\p{N}])', 'u'));
		if (match) return afterPrefix(chars.slice([...match[0]].length));
	}
	return null;
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

/**
 * The LIST MARKER a document heading prints in front of its name — `I.`,
 * `a.`, `a)`, `A.` — split off so the two can be set apart, the way every
 * other numbered division on the site already is.
 *
 * `displayDocumentTitle` above deliberately splits nothing, on the grounds
 * that a document node carries no `kind`/`n` to reconstruct an ordinal from.
 * That reasoning is about RECONSTRUCTING one and does not reach a marker the
 * source itself printed: `I. GOD'S LIBERATING ACTION IN THE HISTORY OF
 * ISRAEL` is a numeral and a name, and running them together is why the
 * Social Doctrine's table of contents read as one long line where the
 * Catechism's reads as a column.
 *
 * IT IS A SEPARATE FUNCTION AND NOT A CHANGE TO `displayTitle`, because the
 * Catechism's `sub` nodes are the same shape (`I. The Desire for God`) and
 * `normalizeCase`'s docblock records the decision to leave those alone —
 * "the marker is part of the title rather than a redundant echo of `n`".
 * Reversing that for every work at once is not this function's business.
 *
 * THE MARKER IS KEPT VERBATIM, punctuation included. Seven of the ten
 * editions print `a)` where English prints `a.`, and normalising one to the
 * other would make the page say something the source does not — the same
 * rule the printed division labels take (`marker()`, structureToc.ts).
 *
 * Anything that is not a single letter or a roman numeral followed by `.` or
 * `)` and then a name is left exactly as it was, which covers every heading
 * that is only a name (`INTRODUCTION`), only an identifier (`PART ONE`,
 * `ELSŐ RÉSZ` — the source prints those with no name beside them at all) and
 * the Swahili edition, which marks nothing.
 */
const HEADING_MARKER_RE = /^(?:[IVXL]+|\p{L})[.)](?=\s)/u;

export function documentHeadingParts(title: string, lang: string): DisplayTitle {
	const head = title.trimStart();
	const match = head.match(HEADING_MARKER_RE);
	const rest = match ? head.slice(match[0].length).trim() : '';
	// A marker with nothing after it is not a marker — it is the whole
	// heading, and splitting it would leave a row with no text.
	if (!match || !rest) return displayDocumentTitle(title, lang);
	return { ordinal: match[0], title: finalize(normalizeCase(rest, normLang(lang))) };
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
