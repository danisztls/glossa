/**
 * Universal reference system.
 *
 * Glossa Catholica's raw citation strings — CCC footnotes, the CCC's `related`
 * marginal-number list, the Compendium's `ccc_refs` — are never pre-parsed
 * in the corpus (`docs/link-surface.md`'s "the corpus stores raw strings,
 * never interpretations" principle). This module is the derived pass that
 * turns those verbatim strings into a sequence of `RefSegment`s so a caller
 * can render the original string intact with links woven through it:
 * `parseRefs("Cf. Gen 9:16; Lk 21:24; DV 3.")` → text "Cf. ", a scripture
 * segment, text "; ", a scripture segment, text "; ", a document segment,
 * text ".". `RefText.svelte` is the presentation layer over this.
 *
 * The scripture grammar — clause splitting on `;` (and, for Portuguese, `:`),
 * `Cf.` scope, bookless continuation clauses that inherit the previous
 * clause's book, `:`/space/`.`/`,` chapter-verse separators, range expansion,
 * verse-subdivision letters, the single-chapter-book exception, the
 * dropped-colon-typo guard, the known transcription typos — was derived
 * empirically, rule by rule, against the whole corpus; every table in it was
 * built by grepping real citations rather than from a specification. It had a
 * second home until 2026-08-21, `pipeline/build/xrefs.py`, which produced the
 * committed `corpus/xrefs/ccc-bible.json`; the two drifted, this one was
 * right wherever they disagreed, and the Python is gone (docs/decisions.md).
 * `scripts/build-xrefs.mjs` now derives that index from this module, so there
 * is exactly one grammar again.
 *
 * Three parts of it never existed in the Python at all:
 *
 *   1. A second, independently-derived book-abbreviation table for
 *      `ccc.pt`'s citations (Portuguese uses "," where English uses ":" as
 *      the chapter-verse separator, and its abbreviations frequently do NOT
 *      match the jump box's lowercase `abbrevs` — e.g. the corpus's own
 *      jump abbreviation for Acts is "at", but citations write "Act"; the
 *      jump abbreviation for John is "jo", but the citation form for
 *      *Jonah* is "Jn" — a direct swap of the English convention. Built by
 *      grepping every `Cf. X 1, 2` — shaped token out of the real
 *      `ccc.pt/paragraphs.json`, not guessed.) There are eight tables now,
 *      not two: the six editions of the Catechism added on 2026-08-26 each
 *      got one, derived by the cross-edition oracle in
 *      `scripts/book-forms-oracle.mjs`. What that added is measured
 *      (+2,906 linkable citations, +7,255 prose references); what it FIXED
 *      matters as much, because the English table was never a neutral
 *      default — see the section above `BOOK_VARIANTS_DE`.
 *   2. Document sigla (DV, LG, GS, CIC, DS, PL, PG, AAS, …) — non-scripture
 *      but nameable. Sigla naming a document the corpus has actually
 *      ingested (currently the 16 Vatican II texts, see
 *      `DOCUMENT_SLUGS_EN`) resolve to a real `/documents/{slug}/{n}` link
 *      through `refHref`, same as a scripture reference; everything else
 *      (DS, CIC, PL, PG, AAS, and any PT conciliar mention — PT never maps
 *      sigla to slugs, see that table's docblock) renders as a quiet
 *      non-link with an expansion tooltip instead of disappearing into
 *      plain text. A parser that only builds an index needs a
 *      *non*-scripture allowlist; one that renders needs the sigla's
 *      expansions too. The EN and PT tables were built by counting sigla
 *      occurrences in both `paragraphs.json` files with `jq` and confirming
 *      each one's meaning against its citation context; the six added in
 *      2026-08-26 lean on something better where it exists — the French and
 *      Latin editions publish their OWN sigla lists, now parsed into
 *      `abbreviations.json` (docs/corpus-schema.md §abbreviations), and
 *      those two tables are transcribed from the source rather than
 *      inferred from it.
 *   3. Two grammars an index-only parser never had to touch: a bare
 *      comma/dash-separated CCC-paragraph number list (the Compendium's
 *      `ccc_refs`, e.g. "279-289, 296-298", and the CCC's own `related`
 *      field once a caller stringifies it) and a conservative in-prose
 *      "cf. 1212" / "cf. nn. 1212-1215" / "Cf. Jn 3:16" linkifier.
 *
 * A citation-grammar ref (`parseRefs`) and a bare-number-list ref never
 * overlap in the same string in practice — CCC footnotes cite external
 * documents and scripture, never other CCC paragraphs; `related` and
 * `ccc_refs` are pure number lists with no book letters at all — so
 * `parseRefs` tells them apart up front by checking whether the whole
 * string contains any letters, rather than threading a "what do bare
 * digits mean here" flag through the clause grammar. This also sidesteps a
 * real ambiguity the grammar deliberately leaves unresolved (a genuine
 * bare-verse continuation is under-linked rather than guessed at) — a bare
 * trailing clause after an established book is a dangling
 * verse-continuation candidate in citation grammar, not a CCC paragraph
 * number, and treating it as the latter would be a *wrong* link, worse
 * than that under-linking.
 *
 * Design principle, and the one that decides every ambiguous case:
 * under-linking
 * (leaving a real reference as plain text) is an acceptable, expected
 * outcome; over-linking (a citation surface-form that isn't really that
 * reference) is not. Every ambiguous case below resolves toward "leave it
 * as text".
 */

// No import from './corpus'. That is the point of this module: the grammar
// is pure, so it runs anywhere — in the browser, in a unit test, and in
// `scripts/sync-corpus.mjs`, which builds the scripture cross-reference
// index with the SAME parser that renders every link on the page (Node
// strips the types natively; see that script's `buildXrefs`). `refs.ts`
// keeps the half that does need the corpus — `refHref`, which turns a
// segment into a URL, and the document-title table below, which it feeds in
// through `setDocumentTitleSource`.

// --------------------------------------------------------------------------
// Public types
// --------------------------------------------------------------------------

export type RefSegment =
	| { kind: 'text'; text: string }
	| {
			kind: 'scripture';
			osis: string;
			chapter: number;
			verses: number[];
			cf?: boolean;
			raw: string;
	  }
	| { kind: 'ccc'; n: number; raw: string }
	| { kind: 'compendium'; n: number; raw: string }
	| {
			/**
			 * A Summa Theologiae locus. Its own kind rather than a `document`
			 * with a slug because its address is three levels deep (part,
			 * question, article) where a document's is one section number, and
			 * because the part is not a number at all.
			 */
			kind: 'summa';
			part: SummaPartLabel;
			question: number;
			/** Absent when the citation names only a question, or names an
			 *  article the parser could not read (`a. l`, `q. I` -- the PT
			 *  Catechism's OCR). Under-linking beats a plausible wrong link. */
			article: number | null;
			raw: string;
	  }
	| {
			/**
			 * A magisterial document, named either by a SIGLUM ("GS 19 # 1", "DS
			 * 1514") or by its spelled-out TITLE ("Pius XII, Humani generis 561",
			 * "Const. dogm. Dei Verbum, 2"). One kind for both, because both
			 * resolve to the same address the same way; `via` records which
			 * matcher found it, for the one place the two differ (`refAddress`:
			 * a title with no usable section still names one document and
			 * links to its landing page, a bare siglum links nowhere).
			 */
			kind: 'document';
			via: 'siglum' | 'title';
			/** The siglum as printed, or the manifest title that matched. */
			label: string;
			/** Trailing number(s), if any — validated against the document in `refAddress`, never trusted. */
			locus: string | null;
			/** The decoder-ring text for a siglum, for tooltips; `null` for a title, which explains itself. */
			expansion: string | null;
			/** The ingested document this names, or `null` for a
			 *  recognized-but-not-ingested siglum (DS, CIC, PL, PG, AAS, ...) or
			 *  a language whose config never maps sigla to slugs at all (PT —
			 *  see the sigla section comment). Always set for a title: an
			 *  unresolvable title never becomes a segment. Resolved at PARSE
			 *  time, not re-derived in `refAddress`, so there's one place that
			 *  decides "is this a document we have," not two that could drift. */
			slug: string | null;
			raw: string;
	  };

/** The five parts, in the Roman form every citation normalizes to. */
export type SummaPartLabel = 'I' | 'I-II' | 'II-II' | 'III' | 'Suppl';

/**
 * Both numbering conventions this corpus actually prints, mapped to one.
 *
 * The English Catechism and the encyclicals write Roman (`STh I-II, 79, 1`);
 * the Portuguese Catechism writes Arabic (`Summa theologiae, 1-2, q. 79,
 * a. 1`). `11-II` and `1-II` are not typos of ours -- they are what the PT
 * archive's OCR produced for `II-II` and `I-II`, and they appear in the
 * corpus often enough to be worth reading rather than dropping. Anything not
 * in this table is left unlinked.
 */
const SUMMA_PARTS: Record<string, SummaPartLabel> = {
	I: 'I',
	II: 'II-II',
	III: 'III',
	'I-II': 'I-II',
	'II-II': 'II-II',
	'1': 'I',
	'2': 'II-II',
	'3': 'III',
	'1-2': 'I-II',
	'2-2': 'II-II',
	'11-II': 'II-II',
	'1-II': 'I-II',
	'2-II': 'II-II',
	SUPPL: 'Suppl',
	SUPPLEM: 'Suppl',
	SUPPLEMENTUM: 'Suppl'
};

/**
 * `S Th`, `STh`, `S. Th.`, `Summa Theologica/theologiae`, `Suma Teológica`,
 * followed by a part and a question, optionally an article.
 *
 * Word-bounded on the left, and that is not cosmetic: an unbounded `S\.?\s*Th`
 * matches the `sth` inside `Esth` (Esther), which silently turned a Scripture
 * citation into a Summa one across the corpus the first time this was
 * measured.
 *
 * The separator between the title and the part is `[.,\s]*` rather than one
 * optional mark: `Summa Theol., I, q. 25` prints BOTH an abbreviating period
 * and a separating comma, and allowing only one silently dropped every
 * citation written that way.
 *
 * The trailing article number tolerates `l` and `I` for `1` because the
 * Portuguese archive's OCR prints them that way (`a. l`, `a. I`); a part or
 * question number it cannot read is left unlinked rather than guessed.
 */
const SUMMA_RE =
	/(?<![A-Za-zÀ-ÿ])(?:S\.?\s*Th\.?|STh|Summa\s+[Tt]heol\w*|Suma\s+[Tt]eol\w*|Summa\s+Theologica)[.,\s]*(?:p\.\s*)?(?:q\.\s*)?(Suppl\w*|[IVXl123]{1,3}[ªaе]?e?³?(?:\s*[-–]\s*|\s+)[IVXl123]{1,3}[ªa]?e?³?|[IVXl123]{1,3}[ªa]?e?³?)[.,\s]+(?:Supplem\w*\s*\d*[.,\s]*)?(?:q(?:uaest)?\.?\s*|p\.\s*)?([0-9]{1,3}|[IVXLCl]{1,7})(?![0-9])(?:[.,\s]+(?:a(?:rt)?\.?\s*)?([0-9]{1,2}|[IVXl]{1,6})(?![0-9]))?/gi;

/** Roman numeral -> integer; `null` for anything that is not one. */
function romanToInt(token: string): number | null {
	const values: Record<string, number> = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
	// `l` is the Portuguese/older archives' OCR of `1` and of `I` alike; both
	// readings agree here, since we are already parsing this as a numeral.
	const upper = token.toUpperCase().replace(/L(?=$|[^IVXLCDM])/g, 'I');
	let total = 0;
	let previous = 0;
	for (let i = upper.length - 1; i >= 0; i--) {
		const value = values[upper[i]];
		if (value === undefined) return null;
		total += value < previous ? -value : value;
		previous = Math.max(previous, value);
	}
	return total > 0 ? total : null;
}

/** A question or article number, written either way. */
function summaNumber(token: string | undefined): number | null {
	if (!token) return null;
	const arabic = /^[0-9]+$/.test(token) ? Number(token) : null;
	if (arabic !== null) return Number.isSafeInteger(arabic) && arabic > 0 ? arabic : null;
	if (/^l$/i.test(token)) return 1; // bare OCR `l` for `1`
	return romanToInt(token);
}

/**
 * A part token as printed, reduced to one of the five labels.
 *
 * Four notations are live in this corpus and all four mean the same five
 * things: Roman (`II-II`), Arabic (`2-2`, the Portuguese Catechism), the
 * classical ordinal abbreviations the older encyclicals use (`IIa-IIae`,
 * `Ia`), and OCR damage on any of them (`11-II`, `la` for `Ia`). Rather than
 * enumerate the cross product, the token is normalized: drop the ordinal
 * `a`/`ae` suffixes, read `l` as `1`, map Arabic to Roman, and look the
 * result up.
 */
function normalizeSummaPart(token: string): SummaPartLabel | null {
	const upper = token.toUpperCase();
	if (upper.startsWith('SUPPL')) return 'Suppl';

	// Split on a hyphen OR whitespace: `Ia-IIae` and `IIª IIª³` are the same
	// notation, and one encyclical prints each.
	const sides = upper.split(new RegExp(`\\s*[${DASHES}]\\s*|\\s+`)).map((side) => {
		// Drop the ordinal suffixes (`Ia`, `IIae`) and the superscript
		// ordinal marks vatican.va's typesetting leaves behind (`IIª`, `³`),
		// then read `L` as the OCR of `1` that it is.
		const bare = side
			.replace(/[ª³]/g, '')
			.replace(/AE$|A$/g, '')
			.replace(/L/g, 'I');
		if (/^[123]$/.test(bare)) return 'I'.repeat(Number(bare));
		if (bare === '11') return 'II';
		return bare;
	});
	if (sides.some((side) => !/^I{1,3}$/.test(side))) return null;

	const label = sides.length === 1 ? sides[0] : `${sides[0]}-${sides[1]}`;
	// `II` alone is not a part: the Summa's second part is always cited as
	// `I-II` or `II-II`, so a bare `II` is a mis-parse rather than an address.
	return label === 'II' ? null : (label as SummaPartLabel satisfies SummaPartLabel);
}

/**
 * A stored corpus address (`data-ref` on an inline anchor) as a reference
 * segment.
 *
 * THE OTHER DIRECTION FROM EVERYTHING ELSE IN THIS FILE. The rest of this
 * module reads references out of PROSE, where a citation is whatever a
 * source's house style made of it and the parser's job is to guess well and
 * to under-link when it cannot. This reads a reference the SOURCE ITSELF
 * stated, so there is nothing to guess: CCEL marks each of the Summa's 5,180
 * self-citations with an anchor naming its exact target (`#FP_Q74_A2`), and
 * the scraper carries that across as `data-ref="summa:I:74:2"`.
 *
 * Which matters, because the visible text of those citations is not
 * parseable in isolation. `Q[74], A[2]` names a question in whichever part
 * happens to be printing it; `(A[3])` names an article of whichever question.
 * A prose grammar would have to be handed the surrounding address and would
 * still be guessing at `Q[3], AA[1]` and `Q[76] , A[2]`. The anchor simply
 * says.
 *
 * `undefined` for anything this version does not know -- a work family added
 * later, a malformed payload -- which is the same "no link, keep the words"
 * outcome an unparseable citation gets, and never an error.
 */
export function parseStoredRef(address: string, raw: string): RefSegment | undefined {
	const parts = address.split(':');
	if (parts[0] !== 'summa') return undefined;
	const part = normalizeSummaPart(parts[1] ?? '');
	const question = Number(parts[2]);
	if (!part || !Number.isSafeInteger(question) || question < 1) return undefined;
	// A question-level anchor (`#FP_Q74`, 94 of them) carries no article, and
	// yields the same `null` a citation naming only a question produces.
	const article = parts.length > 3 ? Number(parts[3]) : NaN;
	return {
		kind: 'summa',
		part,
		question,
		article: Number.isSafeInteger(article) && article >= 1 ? article : null,
		raw
	};
}

function findSummaAt(
	clause: string,
	pos: number
): {
	part: SummaPartLabel;
	question: number;
	article: number | null;
	matchStart: number;
	consumedEnd: number;
} | null {
	SUMMA_RE.lastIndex = pos;
	const m = SUMMA_RE.exec(clause);
	if (!m) return null;

	const part = normalizeSummaPart(m[1]);
	if (!part) return null;

	const question = summaNumber(m[2]);
	if (question === null) return null;

	return {
		part,
		question,
		article: summaNumber(m[3]),
		matchStart: m.index,
		consumedEnd: m.index + m[0].length
	};
}

export interface RefsOpts {
	/** BCP-47 or bare language tag; only the `pt`/non-`pt` distinction matters. Defaults to `en`. */
	lang?: string;
	/**
	 * Corpus work id of the text being read (`summa.en`,
	 * `encyclical.diuturnum.en`), when the caller knows it.
	 *
	 * Optional, and almost always ignorable: the grammar's axis is content
	 * language, and this is consulted only for the handful of works listed in
	 * `WORK_CONFIGS`, whose own text contradicts their language's book table.
	 * Today all of them are English works numbering the books of Kings the
	 * Douay way, where `1 Kings` means 1 Samuel. Passing nothing reads such a
	 * work as its language reads — which is what happened until 2026-08-26,
	 * and what left 52 references pointing one book off.
	 */
	work?: string;
	/**
	 * `linkifyProse` only: read a bare "cf. 1212" as a CCC PARAGRAPH reference.
	 *
	 * Off by default, and deliberately. The grammar is real — the Catechism's
	 * print edition does cross-reference its own paragraphs in running text
	 * (docs/link-surface.md #3) — but that apparatus is absent from both
	 * vatican.va archive mirrors, a documented source gap, so the corpus
	 * contains ZERO in-prose "cf. <number>" mentions in either CCC edition or
	 * either Compendium (verified across all four). What a default-on rule
	 * actually produced was 104 wrong links, all of them in the encyclicals,
	 * where a bare number after "cf." is a Scripture chapter continuing an
	 * earlier reference ("cf. 22:32") or a book number the tables don't know
	 * ("cf. 1 Ped 2, 21") — never a Catechism paragraph. Turn this on for a
	 * work that genuinely prints them; until one is ingested, nothing does.
	 */
	cccParagraphRefs?: boolean;
}

// --------------------------------------------------------------------------
// Canonical chapter counts (docs/corpus-schema.md canonical 73-book order).
// Used two ways: (1) a chapter number
// above the book's real length is almost always a dropped-colon typo
// running chapter and verse together ("Eph 314" for "Eph 3:14") and is
// dropped rather than guessed at, same as the Python parser; (2) its
// max-1 entries are exactly the Bible's five single-chapter books, cited
// "Book <verse>" with no chapter number at all — see SINGLE_CHAPTER_BOOKS.
// --------------------------------------------------------------------------

const MAX_CHAPTER: Record<string, number> = {
	gen: 50,
	exod: 40,
	lev: 27,
	num: 36,
	deut: 34,
	josh: 24,
	judg: 21,
	ruth: 4,
	'1sam': 31,
	'2sam': 24,
	'1kgs': 22,
	'2kgs': 25,
	'1chr': 29,
	'2chr': 36,
	ezra: 10,
	neh: 13,
	tob: 14,
	jdt: 16,
	esth: 16,
	'1macc': 16,
	'2macc': 15,
	job: 42,
	ps: 150,
	prov: 31,
	eccl: 12,
	song: 8,
	wis: 19,
	sir: 51,
	isa: 66,
	jer: 52,
	lam: 5,
	bar: 6,
	ezek: 48,
	dan: 14,
	hos: 14,
	joel: 3,
	amos: 9,
	obad: 1,
	jonah: 4,
	mic: 7,
	nah: 3,
	hab: 3,
	zeph: 3,
	hag: 2,
	zech: 14,
	mal: 4,
	matt: 28,
	mark: 16,
	luke: 24,
	john: 21,
	acts: 28,
	rom: 16,
	'1cor': 16,
	'2cor': 13,
	gal: 6,
	eph: 6,
	phil: 4,
	col: 4,
	'1thess': 5,
	'2thess': 3,
	'1tim': 6,
	'2tim': 4,
	titus: 3,
	phlm: 1,
	heb: 13,
	jas: 5,
	'1pet': 5,
	'2pet': 3,
	'1john': 5,
	'2john': 1,
	'3john': 1,
	jude: 1,
	rev: 22
}; // fmt: skip

/**
 * EVERY CHARACTER A SOURCE IN THIS CORPUS RANGES WITH. Written once because
 * it was written six times, each spelling out its own `[-–]`, and the seventh
 * source to arrive used a character none of them had.
 *
 * That source is the Romanian Compendium, which ranges all 598 of its
 * reference lines with a NON-BREAKING hyphen (U+2011): "1‑25", not "1-25".
 * None of them was a number list at all, and 490 citations that resolve
 * perfectly well fell out of the coverage report as unrecognized — which is
 * the deploy gate working, and the only reason it was noticed.
 *
 * The em dash is here for the same reason in advance: the Catechism's
 * Portuguese edition prints one in running prose, and a range set with one is
 * a matter of which typesetter, not of which grammar.
 *
 * Use it in a `[...]` class. It is deliberately NOT a separator anywhere a
 * dash could be punctuation instead — `parseBareCccList` reproduces whatever
 * it finds between two numbers as literal text rather than normalizing it,
 * because the corpus stores raw strings and the reader should see the mark
 * the page printed (docs/link-surface.md).
 */
const DASHES = '\\-\\u2011–—';

/** Books the corpus/citations cite as "Book <verse>" with no chapter — see MAX_CHAPTER. */
const SINGLE_CHAPTER_BOOKS = new Set(
	Object.entries(MAX_CHAPTER)
		.filter(([, max]) => max === 1)
		.map(([osis]) => osis)
);

// --------------------------------------------------------------------------
// Book abbreviation inventories.
//
// Keys are exact, case-sensitive surface forms as printed in citations —
// matching a lowercase word never risks colliding with ordinary prose
// Unlike
// `corpus.findBookByAbbrev` (lowercase, one canonical set per edition, used
// to resolve a *typed* jump-box token against whichever Bible edition is
// open), this table is fixed and languageshaped: it exists to recognize
// citation *surface forms*, several of which are confirmed transcription
// typos rather than real abbreviating conventions (see inline comments).
// --------------------------------------------------------------------------

const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV' };

/** Build `{n} {base}` / `{roman} {base}` (and optionally digit-glued/typo) variants for a family of numbered books. */
function numberedVariants(
	byN: Record<number, string>,
	bases: string[],
	opts: { lTypo?: boolean; unspaced?: boolean; numDot?: boolean } = {}
): Record<string, string[]> {
	const out: Record<string, string[]> = {};
	for (const [nStr, osis] of Object.entries(byN)) {
		const n = Number(nStr);
		const variants: string[] = [];
		for (const base of bases) {
			variants.push(`${n} ${base}`, `${ROMAN[n]} ${base}`);
			if (opts.unspaced) variants.push(`${n}${base}`);
			// "4. Reg.", "I. Reg." — the book's NUMBER carries its own
			// abbreviating full stop. Martini prints it that way 316 times
			// against 21 without; nothing else in the corpus does, which is
			// why it is opt-in rather than universal. The glued form
			// ("IV.Reg.") is three instances of the same edition losing a
			// space and needs `unspaced` as well, since that is what it is.
			if (opts.numDot) {
				variants.push(`${n}. ${base}`, `${ROMAN[n]}. ${base}`);
				if (opts.unspaced) variants.push(`${n}.${base}`, `${ROMAN[n]}.${base}`);
			}
			// "l" (lowercase L) for the digit "1" is a recurring transcription
			// artifact in the EN corpus (observed: "l Cor", "l Pt", "l Tim") —
			// visually confusable with "1" in some renderings.
			if (opts.lTypo && n === 1) variants.push(`l ${base}`);
		}
		// Accumulated, not assigned: one family can be numbered two ways at
		// once. English calls the same four books 1-2 Samuel and 1-2 Kings or,
		// in the Douay tradition, 1-4 Kings, so `1kgs` is reached from both
		// `3 Kings` and `1 Kings` and the second call must not erase the first.
		(out[osis] ??= []).push(...variants);
	}
	return out;
}

/**
 * Combine tables that share osis keys, keeping every form.
 *
 * `numberedVariants` accumulates across the numbers of ONE call (see its
 * comment on `push` rather than assign), but two calls produce two objects,
 * and spreading both into one literal makes the second's `1kgs` REPLACE the
 * first's instead of extending it — silently, and only for a family named
 * twice. That is exactly what a book cited under two conventions in one work
 * requires, so it is a function rather than a warning.
 */
function mergeVariants(...tables: Record<string, string[]>[]): Record<string, string[]> {
	const out: Record<string, string[]> = {};
	for (const table of tables)
		for (const [osis, variants] of Object.entries(table)) (out[osis] ??= []).push(...variants);
	return out;
}

/**
 * ENGLISH NUMBERS THE BOOKS OF KINGS TWO WAYS, and the two collide.
 *
 * The Douay tradition — inherited from the Septuagint's four Βασιλειῶν and
 * the Vulgate's four Regum, and stated by `bible.douay-rheims.en`'s own book
 * names ("1 Kings (1 Samuel)", "3 Kings (1 Kings)") — calls 1-2 Samuel the
 * first two books of Kings and 1-2 Kings the third and fourth. The modern
 * naming, which the Nova Vulgata and every modern Catholic translation use,
 * keeps Samuel and Kings apart and stops at two of each.
 *
 * So `3 Kings` and `4 Kings` are unambiguous under both, and `1 Kings` and
 * `2 Kings` are unambiguous under neither: nothing in the citation string
 * tells them apart. Only the WORK does — which is why `RefsOpts.work` exists
 * and why `configFor` takes it. Modern is the default because that is what
 * the corpus overwhelmingly prints (measured 2026-08-26: 13 references in
 * `ccc.en` and one apiece in the Compendium and six encyclicals, against
 * three works that read the other way); Douay is opt-in per work, listed in
 * `WORK_CONFIGS`.
 *
 * Both build the same surface forms, so `remapBookVariants` can swap one for
 * the other by dropping the first table's strings and adding the second's.
 */
const KINGS_BASES = ['Kings', 'Kgs', 'Kg'];
const KINGS_NUMBER_OPTS = { lTypo: true, unspaced: true };
const KINGS_MODERN = numberedVariants(
	{ 1: '1kgs', 2: '2kgs', 3: '1kgs', 4: '2kgs' },
	KINGS_BASES,
	KINGS_NUMBER_OPTS
);
const KINGS_DOUAY = numberedVariants(
	{ 1: '1sam', 2: '2sam', 3: '1kgs', 4: '2kgs' },
	KINGS_BASES,
	KINGS_NUMBER_OPTS
);

/**
 * THE SAME COLLISION IN SPANISH AND ITALIAN — and in both, only for the
 * SPELLED-OUT form. The short one is a second convention in the same book.
 *
 * `bible.straubinger.es` and `bible.martini.it` both print modern book
 * titles ("1 Reyes", "Primo libro dei Re") and then cite the four Kingdoms
 * in their notes: 990 `I`-`IV Reyes` and 440 `I.`-`IV. Reg.`, measured
 * 2026-08-28 over the parsed editions. So both belong in `WORK_CONFIGS` for
 * the reason `summa.en` does.
 *
 * The four-Kingdoms scheme was not, however, what was WRONG with them.
 * Neither language's table held `Reyes` or `Reg` at all, so those 1,430
 * citations resolved to NOTHING rather than to the wrong book. Adding a
 * surface form and re-pointing a scheme are two different repairs and this
 * needed both — the forms belong in the language tables, which answer for
 * every work in their language (neither appears in any other work of its
 * language: checked across ccc, compendium and every encyclical in both),
 * and the scheme belongs in `WORK_CONFIGS`, which answers for one work.
 *
 * WHICH FORMS THE SCHEME COVERS IS ITSELF MEASURED, and the measurement is
 * what keeps `R` and `Re` out of it. Reading every Kings-family citation in
 * each edition against the Clementine's real verse counts — a citation is
 * evidence only where one of the two readings addresses a verse that does
 * not exist — gives:
 *
 *   es `Reyes`/`Rey`   77 decided:  77 Douay,  0 modern   (1 misprint, below)
 *   es `R`              5 decided:   0 Douay,  5 modern
 *   it `Reg`           17 decided:  13 Douay,  4 modern   (4 misprints, below)
 *
 * Straubinger writes Samuel as `1 Sam.` and 1 Kings as `1 R.` in the SAME
 * sentence (the note at Acts 13:22), and his five decisive `R` citations are
 * Solomon's dedication prayer, Jezebel and Ahaziah at Megiddo — modern, every
 * one. So `R` keeps its modern reading and only the spelled-out form flips.
 *
 * The five counter-examples on the other side are source misprints, not a
 * second convention, and each is identifiable from its own sentence: the
 * Spanish one writes `III Reyes 4, 31` and then `II Reyes 4, 31` for the same
 * verse in one note (1 Chr 25), and the four Italian ones name Solomon's
 * lavers, Samaria's resettlement, Hezekiah's parallel in Isaiah 39 and
 * Seraiah's death — all in Kings, all reached by a numeral one off the one
 * Martini uses everywhere else. They are candidates for `pipeline/corrections/`.
 *
 * Both MODERN tables carry all four numbers, exactly as `KINGS_MODERN` does:
 * `3` and `4` are unambiguous under either scheme, so a Spanish or Italian
 * work that has not opted in still reads `III Reyes` as 1 Kings rather than
 * as nothing.
 */
const FOUR_KINGDOMS_MODERN = { 1: '1kgs', 2: '2kgs', 3: '1kgs', 4: '2kgs' };
const FOUR_KINGDOMS_DOUAY = { 1: '1sam', 2: '2sam', 3: '1kgs', 4: '2kgs' };

// Straubinger's spelled-out form takes the scheme; his short `1 R.` does not
// and stays modern in both tables, which is why each is a `mergeVariants` of
// two calls rather than one call over three bases. The two tables must span
// the SAME surface forms for `remapBookVariants` to swap them cleanly, so
// the short form appears in both — identically.
const KINGS_ES_SPELLED = ['Reyes', 'Rey'];
const KINGS_ES_SHORT = ['R'];
const KINGS_ES_OPTS = { lTypo: true, unspaced: true };
const KINGS_ES_MODERN = mergeVariants(
	numberedVariants(FOUR_KINGDOMS_MODERN, KINGS_ES_SPELLED, KINGS_ES_OPTS),
	numberedVariants(FOUR_KINGDOMS_MODERN, KINGS_ES_SHORT, KINGS_ES_OPTS)
);
const KINGS_ES_DOUAY = mergeVariants(
	numberedVariants(FOUR_KINGDOMS_DOUAY, KINGS_ES_SPELLED, KINGS_ES_OPTS),
	numberedVariants(FOUR_KINGDOMS_MODERN, KINGS_ES_SHORT, KINGS_ES_OPTS)
);

// The same split in Italian. `Reg` is Martini's Latin form for a book he
// titles "Re" in the text itself, and `numDot` his printing convention for
// its number (see `numberedVariants`); `Re` is the modern Italian name and
// keeps the modern reading, so that the one Italian work citing the four
// Kingdoms cannot re-point a form it never prints.
const KINGS_IT_SPELLED = ['Reg'];
const KINGS_IT_SHORT = ['Re'];
const KINGS_IT_OPTS = { lTypo: true, unspaced: true, numDot: true };
const KINGS_IT_SHORT_OPTS = { lTypo: true, unspaced: true };
const KINGS_IT_MODERN = mergeVariants(
	numberedVariants(FOUR_KINGDOMS_MODERN, KINGS_IT_SPELLED, KINGS_IT_OPTS),
	numberedVariants(FOUR_KINGDOMS_MODERN, KINGS_IT_SHORT, KINGS_IT_SHORT_OPTS)
);
const KINGS_IT_DOUAY = mergeVariants(
	numberedVariants(FOUR_KINGDOMS_DOUAY, KINGS_IT_SPELLED, KINGS_IT_OPTS),
	numberedVariants(FOUR_KINGDOMS_MODERN, KINGS_IT_SHORT, KINGS_IT_SHORT_OPTS)
);

/**
 * A book table with one family's surface forms re-pointed at other books.
 *
 * `from` and `to` must span the same surface forms — the point is a work
 * that spells references identically to its neighbours and means something
 * else by them, not a work with extra abbreviations. Anything `from` claims
 * is dropped wherever it appears, so a form that survives in `to` comes back
 * on the key `to` gives it, and a book left with no forms at all disappears
 * from the table rather than lingering as an empty array.
 */
function remapBookVariants(
	base: Record<string, string[]>,
	from: Record<string, string[]>,
	to: Record<string, string[]>
): Record<string, string[]> {
	const dropped = new Set(Object.values(from).flat());
	const out: Record<string, string[]> = {};
	for (const [osis, variants] of Object.entries(base)) {
		const kept = variants.filter((v) => !dropped.has(v));
		if (kept.length) out[osis] = kept;
	}
	for (const [osis, variants] of Object.entries(to)) (out[osis] ??= []).push(...variants);
	return out;
}

const BOOK_VARIANTS_EN: Record<string, string[]> = {
	gen: ['Gn', 'Gen', 'Genesis'],
	exod: ['Ex', 'Exod', 'Exodus', 'EX'], // EX: observed all-caps variant
	lev: ['Lv', 'Lev', 'Leviticus'],
	num: ['Nm', 'Num', 'Numbers'],
	deut: ['Dt', 'Deut', 'Deuteronomy'],
	josh: ['Jos', 'Josh', 'Joshua'],
	judg: ['Jdg', 'Jgs', 'Judg', 'Judges'],
	ruth: ['Ru', 'Ruth'],
	// The Douay tradition numbers these two as ESDRAS — 1 Esdras is Ezra and
	// 2 Esdras is Nehemias — and the CCEL Summa, the Douay-Rheims's own book
	// prefaces and Redemptoris Mater's English translation all cite them that
	// way ("2 Esd. 13:1" for Neh 13:1). Written out rather than built with
	// `numberedVariants` because the numbered forms belong to two DIFFERENT
	// osis keys, which that helper's one-family shape cannot express. A
	// "3 Esdras" is deliberately absent: it is the apocryphon, which the
	// corpus does not hold, so the Summa's five citations of it stay text.
	ezra: ['Ezr', 'Ezra', '1 Esdras', '1 Esdra', '1 Esdr', '1 Esd', 'I Esdras', '1Esdras', '1Esd'],
	neh: [
		'Neh',
		'Nehemiah',
		'Nehemias',
		'2 Esdras',
		'2 Esdra',
		'2 Esdr',
		'2 Esd',
		'II Esdras',
		'2Esdras',
		'2Esd'
	],
	tob: ['Tb', 'Tob', 'Tobit', 'Tobias'],
	jdt: ['Jdt', 'Judith'],
	esth: ['Est', 'Esth', 'Esther'],
	job: ['Job'],
	ps: ['Ps', 'Pss', 'Psalm', 'Psalms', 'PS'], // PS: observed all-caps variant
	prov: ['Prv', 'Prov', 'Proverbs'],
	eccl: ['Eccl', 'Eccles', 'Ec', 'Qo', 'Qoh', 'Ecclesiastes'],
	song: ['Song', 'SS', 'Ct', 'Cant', 'Canticle of Canticles', 'Song of Songs', 'Song of Solomon'],
	wis: ['Wis', 'Wisdom'],
	sir: ['Sir', 'Ecclus', 'Sirach', 'Eccli'],
	isa: ['Is', 'Isa', 'Isaiah'],
	jer: ['Jer', 'Jeremiah'],
	lam: ['Lam', 'Lamentations'],
	bar: ['Bar', 'Baruch'],
	ezek: ['Ez', 'Ezek', 'Ezech', 'Ezechiel'],
	dan: ['Dn', 'Dan', 'Daniel'],
	hos: ['Hos', 'Hosea', 'Osee'],
	joel: ['Jl', 'Joel'],
	amos: ['Am', 'Amos'],
	obad: ['Ob', 'Obad', 'Obadiah'],
	jonah: ['Jon', 'Jonah'],
	mic: ['Mi', 'Mic', 'Micah'],
	nah: ['Na', 'Nah', 'Nahum'],
	hab: ['Hab', 'Habakkuk', 'Habac', 'Habacuc'],
	zeph: ['Zep', 'Zeph', 'Zephaniah', 'Soph', 'Sophonias'],
	hag: ['Hag', 'Haggai'],
	zech: ['Zec', 'Zech', 'Zechariah'],
	mal: ['Mal', 'Malachi', 'Malach', 'Malachias'],
	// The Latin abbreviations ("Matth.", "Luc.", "Io.", "Joh.", "Petr.",
	// "Eccli.") are how the pre-conciliar encyclicals' English translations
	// cite Scripture, nearly always with a Roman-numeral chapter ("Matth. IX,
	// 37-38", "I Petr. II, 21"). Found by scanning every citation for a
	// Roman-chapter shape and reading each form's occurrences (2026-08-25);
	// only forms that named a book every time are here.
	matt: ['Mt', 'Matt', 'Mat', 'Matthew', 'Matth'],
	mark: ['Mk', 'Mc', 'Mark'],
	luke: ['Lk', 'Lc', 'Luke', 'Luc'],
	john: ['Jn', 'John', 'In', 'Io', 'Ioan', 'Joh'], // In: observed typo (J -> I), only fires with a chapter:verse after it
	acts: ['Acts', 'Act'],
	rom: ['Rom', 'Rm', 'Romans'],
	gal: ['Gal', 'Galatians', 'Cal'], // Cal: observed typo (G -> C), verified against ccc476/478's Christology
	eph: ['Eph', 'Ephesians'],
	phil: ['Phil', 'Philip', 'Philippians'],
	col: ['Col', 'Colossians'],
	titus: ['Ti', 'Tit', 'Tt', 'Titus'],
	phlm: ['Philem', 'Phlm', 'Philemon'],
	heb: ['Heb', 'Hebrews'],
	jas: ['Jas', 'Js', 'Jam', 'James'],
	jude: ['Jude'],
	rev: ['Rev', 'Rv', 'Revelation', 'Apoc', 'Apocalypse'],
	// `unspaced` everywhere: the number is printed hard against the book in
	// several English works ("2Tim 1:6" in ccc.en, "1Jn 4:19" in Veritatis
	// Splendor, "2Pa. 9,29" and "1Jo. 4,21" in the Douay-Rheims prefaces),
	// and every one of those was a reference the grammar read as nothing.
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sam', 'Samuel'], {
		lTypo: true,
		unspaced: true
	}),
	// FOUR BOOKS OF KINGS. `1 Kings` means two different books in two English
	// conventions, and which one a work follows is not a property of the
	// citation string — see `KINGS_MODERN`/`KINGS_DOUAY` above and
	// `WORK_CONFIGS` below. This table carries the modern reading, which is
	// the default for every English work that has not been measured to use
	// the other one.
	...KINGS_MODERN,
	// "Paralipomenon" is the Douay name for Chronicles, abbreviated by the
	// Summa five different ways in five places.
	...numberedVariants(
		{ 1: '1chr', 2: '2chr' },
		['Chr', 'Chronicles', 'Paralipomenon', 'Paralip', 'Paral', 'Para', 'Pa'],
		{ lTypo: true, unspaced: true }
	),
	// "Mc" numbered is MACCABEES in the older English translations ("2 Mc
	// 1.19-22", "1 Mc 4:24") while bare "Mc." is Mark — the same two letters,
	// the same language. Both work because `buildVariantRe` sorts its
	// alternation longest-first, so "1 Mc" is tried before "Mc".
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Macc', 'Mac', 'Mc', 'Maccabees'], {
		lTypo: true,
		unspaced: true
	}),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Cor', 'Corinthians'], {
		lTypo: true,
		unspaced: true
	}),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Thess', 'Thes', 'Thessalonians', 'Th'], {
		lTypo: true,
		unspaced: true
	}),
	// "Tm": the Portuguese-style abbreviation, printed in 25 English
	// citations ("1 Tm 3.15") — the older encyclicals' translators kept it.
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tim', 'Timothy', 'Tm'], {
		lTypo: true,
		unspaced: true
	}),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Pet', 'Pt', 'Peter', 'Petr'], {
		lTypo: true,
		unspaced: true
	}),
	// "Jo" is deliberately absent, here and above: ccc.en cites Augustine's
	// tractates on the Epistle of John as "In ep Jo. 8, 9" three times, which
	// is a tract and a section and not John 8:9, against one real "Jo. 7, 52"
	// in the Douay-Rheims prefaces.
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Jn', 'John', 'In'], {
		lTypo: true,
		unspaced: true
	})
};

/**
 * Portuguese citation-surface book abbreviations, derived empirically from
 * `ccc.pt/paragraphs.json` (not the jump box's `abbrevs`, which frequently
 * differ — see the module docblock). Built by grepping every
 * `\bTOKEN\.?\s+\d+\s*[,:.]\s*\d+` — shaped token out of the real corpus and
 * mapping each one to its book by reading the surrounding citation/prose;
 * a handful of canonical books never appear in a `ccc.pt` citation at all
 * (Ruth, Esther, Baruch, Habakkuk, Haggai, Nahum, Obadiah, Philemon, Jude),
 * so those fall back to the jump box's own lowercase abbreviation,
 * title-cased — unverified against a real citation, flagged inline.
 */
// Beyond the Catechism's own forms, this table carries the fuller
// abbreviations the older Portuguese translations of the encyclicals and
// council documents use — "Gén", "Sal", "Apoc", "Hebr", "Luc", "Fil", "Col",
// "Eclo", "1 Ped", "2 Tess". Same method as the rest of the table: every
// entry below was found by scanning the real corpus for scripture-shaped
// prose that produced no link, then reading the surrounding sentence to
// confirm which book it names. None was guessed.
const BOOK_VARIANTS_PT: Record<string, string[]> = {
	gen: ['Gn', 'Gén', 'Gen'],
	exod: ['Ex', 'Éx', 'Êx'], // Êx: the circumflex spelling, in Veritatis Splendor and Sollicitudo rei socialis
	lev: ['Lv'],
	num: ['Nm', 'Núm', 'Num'],
	deut: ['Dt', 'Dr', 'Deut'], // Dr: observed typo (t -> r), "Cf. Dr 18, 10" = Dt 18:10
	josh: ['Js', 'Jos'],
	judg: ['Jz'],
	ruth: ['Rt'], // fallback: not observed in a ccc.pt citation
	tob: ['Tb', 'Tob'],
	jdt: ['Jt'],
	esth: ['Est'], // fallback
	job: ['Job', 'Jó'],
	ps: ['Sl', 'Sal', 'Salm', 'Salmo', 'Salmos', 'SI'], // SI: observed OCR of "Sl" (l -> I), "SI 24, 8-10" = Ps 24:8-10
	prov: ['Pr', 'Prov'],
	eccl: ['Ecl', 'Ec', 'Coel'], // Coel: Coélet, the Hebrew name, used by Fides et Ratio
	song: ['Ct', 'Cânt'],
	wis: ['Sb', 'Sab'],
	sir: ['Sir', 'Eclo', 'Ecli'],
	isa: ['Is'],
	jer: ['Jr', 'Jer'],
	lam: ['Lm'], // fallback
	bar: ['Br', 'Bar'],
	ezek: ['Ez'],
	ezra: ['Esd'],
	// "2 Esdras" is Nehemias, the same Douay-tradition numbering the English
	// table carries: Lumen Gentium's Portuguese translation cites
	// "2 Esdr. 13,1" for Neh 13:1. Spelled out because the two numbers of
	// Esdras name two different books, which `numberedVariants` cannot say.
	neh: ['Ne', '2 Esdras', '2 Esdr', '2 Esd', 'II Esdras'],
	dan: ['Dn'],
	hos: ['Os'],
	joel: ['Jl'],
	amos: ['Am'],
	obad: ['Ab'], // fallback
	jonah: ['Jn'], // NOTE: the reverse of English convention — "Jo" is John, "Jn" is Jonah
	mic: ['Mq', 'Miq'],
	nah: ['Na'], // fallback
	hab: ['Hab'], // fallback
	zeph: ['Sf', 'Sof'],
	hag: ['Ag'], // fallback
	zech: ['Zc', 'Zac'],
	mal: ['Ml', 'Mal'],
	matt: ['Mt', 'Mat'],
	mark: ['Mc', 'Mr', 'Marc'], // Mr: observed one-off typo for Mc
	luke: ['Lc', 'Luc'],
	// "João" spelled out: how a Portuguese sentence names the evangelist it
	// is quoting ("interpretaram o texto de João 7, 38"), which only the prose
	// scan sees. "Lucas" is NOT here, and the asymmetry is measured rather
	// than stylistic: Humanae Vitae's Portuguese text cites an address given
	// to the Italian medical association *San Luca* as "São Lucas, 12 de
	// novembro de 1944", which reads as Luke 12 — a whole-chapter link to a
	// date. Nothing in the corpus does that to "João".
	john: ['Jo', 'João'],
	acts: ['Act', 'At'],
	// "Rom" is included despite colliding with "Cat Rom"/"CatRom"
	// (Catechismus Romanus), whose locus shapes identically to a
	// chapter:verse. The collision is handled where it actually occurs — by
	// prefix, in `precededByFalseLead` — rather than by dropping the book,
	// which used to cost 153 real references to Romans in the older
	// encyclical translations that spell it out this way.
	// "Roma" is deliberately absent: every occurrence in the corpus is the
	// city followed by a date ("Universidade de Roma, 15 jun. 1952").
	rom: ['Rm', 'Rom'],
	gal: ['Gl', 'Gál', 'Gal', 'GI'], // GI: observed OCR of "Gl" (l -> I), "GI 4, 4" = Gal 4:4
	eph: ['Ef'],
	phil: ['Fl', 'Fil', 'Flp', 'Fp', 'Filip'],
	col: ['Cl', 'Col'],
	titus: ['Tt', 'Tit'],
	phlm: ['Fm', 'Flm'], // Flm observed in an inline PT citation
	heb: ['Heb', 'Hb', 'Hebr', 'Hbr', 'He'],
	jas: ['Tg', 'Tiago'],
	jude: ['Jd'], // fallback
	rev: ['Ap', 'Apoc', 'Apc'],
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Cr'], { unspaced: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Cor', 'Co'], { unspaced: true, lTypo: true }),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['Rs', 'Re'], { unspaced: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Mac'], { unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Pe', 'Ped', 'Pd', 'Pdr', 'Pedr'], {
		unspaced: true
	}),
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sm', 'Sam'], { unspaced: true }),
	// Observed unspaced once ("1Ts 4, 7") alongside the normal spaced form.
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Ts', 'Tess', 'Tes'], { unspaced: true }),
	// `lTypo`: "l Tim. 2, 4-6" is printed in Ad Gentes and Dei Verbum.
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tm', 'Tim'], { unspaced: true, lTypo: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Jo'], { unspaced: true })
};

// --------------------------------------------------------------------------
// The six editions added 2026-08-26, and how their book tables were built.
//
// Each is derived, not transcribed from a style guide. The Catechism is the
// same 2,865 paragraphs in every edition, so paragraph N's citations are
// translations of each other, and a chapter:verse the English and Portuguese
// tables already resolve is the SAME reference the Italian edition prints
// beside its own abbreviation. `scripts/derive-book-forms.mjs` aligns the two
// and reads the abbreviation off the locus; every entry below is backed by at
// least one such corroboration and most by hundreds ("Gv" as John: 455 of its
// 458 occurrences). What it could not corroborate is patristic work titles
// ("Sermo 241, 2", "Epistula 187, 11, 34"), which are not books and are
// deliberately absent — the Fathers are not ingested (docs/link-surface.md).
//
// THIS FIXED READINGS, it did not only add them. Until these tables existed
// `configFor` answered EN for all six, and the English table is not a neutral
// default: it silently mis-read 120 German, 138 Latin and 4 Spanish
// references, because "1 Joh 2,20" / "1 Io 2,20" / "1 Jn 4,19" have no
// numbered form in it and matched the bare `Joh`/`Io`/`Jn` instead — every
// First-John citation in three editions resolving to the Gospel. The German
// mirror also prints `Job` for `Joh` throughout (73 occurrences), so those
// resolved to the book of Job.
//
// BOOKS THE CATECHISM NEVER CITES ARE ABSENT, and are left absent rather than
// filled in from a style guide — the same choice `BOOK_VARIANTS_PT` records
// inline for its own gaps, made stricter: nothing here is unobserved. Latin
// is the exception, and for better evidence rather than a lower bar; see
// `BOOK_VARIANTS_LA`.
// --------------------------------------------------------------------------

const BOOK_VARIANTS_DE: Record<string, string[]> = {
	gen: ['Gen', 'Gn'],
	exod: ['Ex'],
	lev: ['Lev'],
	num: ['Num'],
	// `Din`: observed twice, a t/n confusion of `Dtn` from the same Word
	// export that produces `Job`, `KoI` and `Epb` below.
	deut: ['Dtn', 'Din'],
	josh: ['Jos'],
	judg: ['Ri'],
	neh: ['Neh'],
	tob: ['Tob'],
	esth: ['Est'],
	job: ['Ijob'],
	ps: ['Ps'],
	prov: ['Spr'],
	eccl: ['Koh'],
	song: ['Hld'],
	wis: ['Weish'],
	sir: ['Sir'],
	isa: ['Jes'],
	jer: ['Jer'],
	ezek: ['Ez'],
	dan: ['Dan'],
	hos: ['Hos'],
	joel: ['Joël'],
	amos: ['Am'],
	jonah: ['Jona'],
	mic: ['Mi'],
	zeph: ['Zef'],
	zech: ['Sach'],
	mal: ['Mal'],
	matt: ['Mt'],
	mark: ['Mk'],
	luke: ['Lk'],
	// `Job` IS John here, 73 times, and never the book of Job — which this
	// mirror spells `Ijob`. Corroborated on every occurrence: "Mt 26,38; Job
	// 12,27" is Mt 26:38 beside Jn 12:27, "Mt 16,25-26 - Job 15,13" beside
	// Jn 15:13. Under the English table every one of these linked to Job.
	john: ['Joh', 'Job'],
	acts: ['Apg'],
	rom: ['Röm', 'Rom.'],
	gal: ['Gal'],
	eph: ['Eph', 'Epb'],
	phil: ['Phil'],
	col: ['Kol', 'KoI'],
	titus: ['Tit'],
	heb: ['Hebr'],
	jas: ['Jak'],
	rev: ['Offb'],
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sam'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['Kön'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Chr'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Makk'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Kor'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Thess'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tim'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Petr'], { lTypo: true, unspaced: true }),
	// `Job` again in its numbered form: "1 Job 2,20.27" is 1 Jn 2:20,27.
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Joh', 'Job'], {
		lTypo: true,
		unspaced: true
	})
};

const BOOK_VARIANTS_ES: Record<string, string[]> = {
	gen: ['Gn'],
	exod: ['Ex'],
	lev: ['Lv'],
	num: ['Nm'],
	deut: ['Dt'],
	josh: ['Jos'],
	judg: ['Jc'],
	ezra: ['Esd'],
	neh: ['Ne'],
	tob: ['Tb'],
	jdt: ['Jdt'],
	esth: ['Est'],
	job: ['Jb', 'Job'],
	ps: ['Sal'],
	prov: ['Pr'],
	eccl: ['Qo'],
	song: ['Ct'],
	wis: ['Sb'],
	sir: ['Si'],
	isa: ['Is'],
	jer: ['Jr'],
	lam: ['Lm'],
	ezek: ['Ez'],
	dan: ['Dn'],
	hos: ['Os'],
	joel: ['Jl'],
	amos: ['Am'],
	jonah: ['Jon'],
	mic: ['Mi'],
	zeph: ['So'],
	zech: ['Za'],
	mal: ['Ml'],
	matt: ['Mt', 'Mt.'],
	mark: ['Mc', 'Mc.'],
	luke: ['Lc', 'Lc.'],
	john: ['Jn'],
	acts: ['Hch'],
	rom: ['Rm', 'Rom'],
	gal: ['Ga', 'Gál'],
	eph: ['Ef'],
	phil: ['Flp'],
	col: ['Col'],
	titus: ['Tt', 'Tit'],
	heb: ['Hb'],
	jas: ['St'],
	rev: ['Ap'],
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['S'], { lTypo: true }),
	...KINGS_ES_MODERN,
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Cro'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['M'], { lTypo: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Co', 'Cor'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Ts'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tm', 'Tim'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['P', 'Pe'], { lTypo: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Jn'], {
		lTypo: true,
		unspaced: true
	})
};

const BOOK_VARIANTS_FR: Record<string, string[]> = {
	gen: ['Gn'],
	exod: ['Ex'],
	lev: ['Lv'],
	num: ['Nb'],
	deut: ['Dt'],
	josh: ['Jos'],
	judg: ['Jg'],
	ezra: ['Esd'],
	neh: ['Ne'],
	tob: ['Tb'],
	jdt: ['Jdt'],
	esth: ['Est'],
	job: ['Jb'],
	ps: ['Ps'],
	prov: ['Pr'],
	eccl: ['Qo'],
	song: ['Ct'],
	wis: ['Sg'],
	sir: ['Si'],
	isa: ['Is'],
	jer: ['Jr'],
	lam: ['Lm'],
	ezek: ['Ez'],
	dan: ['Dn'],
	hos: ['Os'],
	joel: ['Jl'],
	amos: ['Am'],
	jonah: ['Jon'],
	mic: ['Mi'],
	zeph: ['So'],
	zech: ['Za'],
	mal: ['Ml'],
	matt: ['Mt'],
	mark: ['Mc'],
	luke: ['Lc', 'Lc.'],
	john: ['Jn'],
	acts: ['Ac'],
	rom: ['Rm', 'Rom.'],
	gal: ['Ga'],
	eph: ['Ep'],
	phil: ['Ph'],
	col: ['Col'],
	titus: ['Tt'],
	heb: ['He'],
	jas: ['Jc'],
	rev: ['Ap'],
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['S'], { lTypo: true }),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['R'], { lTypo: true }),
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Ch'], { lTypo: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['M'], { lTypo: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Co'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Th'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tm'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['P'], { lTypo: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Jn'], {
		lTypo: true,
		unspaced: true
	})
};

const BOOK_VARIANTS_IT: Record<string, string[]> = {
	// `Gen` and `Pr` are Magnifica Humanitas's forms, not the Catechism's —
	// the table is per LANGUAGE and the language has ten works.
	gen: ['Gn', 'Gen'],
	exod: ['Es'],
	lev: ['Lv'],
	num: ['Nm'],
	deut: ['Dt'],
	josh: ['Gs'],
	judg: ['Gdc'],
	ezra: ['Esd'],
	neh: ['Ne'],
	tob: ['Tb'],
	jdt: ['Gdt'],
	esth: ['Est'],
	job: ['Gb'],
	// `Psalm.` and `Ephes.` are the Latin forms Pius XI's *Ecclesiam Dei*
	// cites in ("] Psalm. XLIV, 10. ["), the same pre-conciliar habit
	// `BOOK_VARIANTS_EN` records for the English translations of that era.
	ps: ['Sal', 'Psalm.'],
	prov: ['Prv', 'Pr'],
	eccl: ['Qo'],
	song: ['Ct'],
	wis: ['Sap'],
	sir: ['Sir'],
	isa: ['Is'],
	jer: ['Ger'],
	lam: ['Lam'],
	ezek: ['Ez'],
	dan: ['Dn'],
	hos: ['Os'],
	// `Gl` is JOEL here. The same two letters are Galatians in Portuguese and
	// Spanish, which is the clearest single reason these tables are
	// per-language and never merged into a shared base.
	joel: ['Gl'],
	amos: ['Am'],
	jonah: ['Gio'],
	mic: ['Mic'],
	zeph: ['Sof'],
	zech: ['Zc'],
	mal: ['Ml'],
	matt: ['Mt'],
	mark: ['Mc'],
	// `Luca` spelled out: this edition names the evangelist in running prose
	// where it abbreviates in a footnote ("commentando il passo di san Luca
	// 22,19"), and the prose scan is what found it.
	luke: ['Lc', 'Luca'],
	john: ['Gv'],
	acts: ['At'],
	rom: ['Rm'],
	gal: ['Gal'],
	eph: ['Ef', 'Ephes.'],
	phil: ['Fil'],
	col: ['Col'],
	titus: ['Tt'],
	heb: ['Eb'],
	jas: ['Gc'],
	jude: ['Gd'],
	rev: ['Ap'],
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sam'], { lTypo: true, unspaced: true }),
	...KINGS_IT_MODERN,
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Cr'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Mac'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Cor'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Ts'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tm'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Pt'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Gv'], {
		lTypo: true,
		unspaced: true
	})
};

const BOOK_VARIANTS_MG: Record<string, string[]> = {
	gen: ['Jen'],
	exod: ['Eks'],
	lev: ['Lev'],
	num: ['Fan'],
	deut: ['Det'],
	josh: ['Jôs'],
	judg: ['Mpits'],
	neh: ['Neh'],
	tob: ['Tob', 'Tobia'],
	esth: ['Est'],
	job: ['Jôba', 'Joba'],
	ps: ['Sal'],
	prov: ['Ohab'],
	eccl: ['Mpitor'],
	song: ['Ton'],
	wis: ['Fah'],
	sir: ['Ekl'],
	// `Izaia`, `Lioka` and `Hebrio` are this edition's full names, printed
	// where it introduces a book in its own sentence rather than citing it.
	isa: ['Iz', 'Izaia'],
	jer: ['Jer'],
	lam: ['Fitom'],
	ezek: ['Ezek'],
	dan: ['Dan'],
	hos: ['Ôs'],
	joel: ['Joely'],
	amos: ['Am'],
	jonah: ['Jôn'],
	mic: ['Mik', 'Mi'],
	zeph: ['Sôf'],
	zech: ['Zak'],
	mal: ['Mal'],
	matt: ['Mt'],
	mark: ['Mk'],
	luke: ['Lk', 'Lioka'],
	john: ['Jo'],
	acts: ['Asa'],
	rom: ['Rôm', 'Rom.'],
	gal: ['Gal'],
	eph: ['Efez'],
	phil: ['Filip'],
	col: ['Kôl'],
	titus: ['Tito'],
	heb: ['Heb', 'Hebrio'],
	jas: ['Jak', 'Jak.'],
	jude: ['Joda'],
	rev: ['Apôk'],
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sam'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['Mpanj'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Tan', 'Tant'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Mak'], { lTypo: true, unspaced: true }),
	// `l Kôr 15,4` is printed in this edition, which is why `lTypo` is on for
	// all six rather than carried over from the English table's observation.
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Kôr', 'Kor'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Tes'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tim'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Pi'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Jo'], {
		lTypo: true,
		unspaced: true
	})
};

/**
 * Latin, and the only one of the six taken from a printed table rather than
 * derived: the Latin mirror publishes its own `ABBREVIATIONES PRO SACRA
 * SCRIPTURA` (`abbrev_lt.htm`, parsed into `ccc.la/abbreviations.json` on
 * 2026-08-26), and this is those 73 rows in canonical order — every book,
 * including the twenty the Catechism never cites, which is why this table is
 * complete where the other five stop at what was observed.
 *
 * It is not taken on trust either. The same locus alignment that built the
 * other five was run over it and corroborated 53 of the 73 in actual use,
 * disagreeing on none — two independent derivations of the same table, one
 * from what the edition SAYS its abbreviations are and one from what it
 * DOES with them. `Il` for Joel and `Ids` for Jude look like defects and are
 * not: both are the source's own system (I + consonants, as in `Idc` for
 * Iudicum and `Idt` for Iudith) and both are attested in its citations.
 */
const BOOK_VARIANTS_LA: Record<string, string[]> = {
	// `Gen.` is the Corpus Thomisticum's form in `summa.la`, not the
	// Catechism's — this config answers for every Latin work, and the Summa
	// and the Clementine Vulgate are two more.
	gen: ['Gn', 'Gen.'],
	exod: ['Ex'],
	lev: ['Lv'],
	num: ['Nm'],
	deut: ['Dt'],
	josh: ['Ios'],
	judg: ['Idc'],
	ruth: ['Rt'],
	ezra: ['Esd'],
	neh: ['Ne'],
	tob: ['Tb'],
	jdt: ['Idt'],
	esth: ['Est'],
	job: ['Iob'],
	ps: ['Ps'],
	prov: ['Prv'],
	eccl: ['Eccle'],
	song: ['Ct'],
	wis: ['Sap'],
	sir: ['Eccli'],
	isa: ['Is'],
	jer: ['Ier'],
	lam: ['Lam'],
	bar: ['Bar'],
	ezek: ['Ez'],
	dan: ['Dn'],
	hos: ['Os'],
	joel: ['Il'],
	amos: ['Am'],
	obad: ['Abd'],
	jonah: ['Ion'],
	mic: ['Mich'],
	nah: ['Nah'],
	hab: ['Hab'],
	zeph: ['Soph'],
	hag: ['Ag'],
	zech: ['Zach'],
	mal: ['Mal'],
	matt: ['Mt'],
	mark: ['Mc'],
	// The GENITIVE, which is how a Latin sentence names a book it is about
	// ("super illud Lucae 22,19"). Only this one is attested; the others are
	// left out rather than declined by rule.
	luke: ['Lc', 'Lucae'],
	john: ['Io'],
	acts: ['Act'],
	rom: ['Rom'],
	gal: ['Gal'],
	eph: ['Eph'],
	phil: ['Phil'],
	col: ['Col'],
	titus: ['Tit'],
	phlm: ['Philm'],
	heb: ['Heb'],
	jas: ['Iac'],
	jude: ['Ids'],
	rev: ['Apc'],
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sam'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['Reg'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Par'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Mac'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Cor'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Thess'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tim'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Pe'], { lTypo: true, unspaced: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Io'], {
		lTypo: true,
		unspaced: true
	})
};

// --------------------------------------------------------------------------
// Three more, added 2026-08-26 when `linkifyProse` learned to read document
// sigla and the same pass measured what its SCRIPTURE half was still missing.
//
// These are not Catechism editions. `pl`, `ru` and `ar` hold exactly one work
// apiece — Leo XIV's *Magnifica Humanitas*, published simultaneously in nine
// languages — and until now `configFor` answered ENGLISH for all three, which
// matched nothing at all in them: not one of their references shares a
// surface form with the English table, so the failure was silent and total
// rather than wrong. CLAUDE.md's standing note that these tags "print no
// Scripture locator" was measured before that encyclical landed and is what
// this replaces.
//
// DERIVED THE SAME WAY THE CATECHISM'S SIX WERE, by the same tool: the nine
// editions are 245 sections that align exactly, so section N's citations are
// translations of each other and a chapter:verse read from the English or
// Italian edition names the book the Polish one abbreviates at the same
// locus. `scripts/book-forms-oracle.mjs --work encyclical.magnifica-humanitas`
// is that run, and every row below came back corroborated on 100% of its
// occurrences. The oracle was generalized past `ccc.` for exactly this.
//
// They stop at what one encyclical cites, which is between eleven and
// fourteen books — the same rule the derived Catechism tables follow, and for
// the same reason: a form nothing in the corpus prints is a form nothing has
// checked.
// --------------------------------------------------------------------------

const BOOK_VARIANTS_PL: Record<string, string[]> = {
	gen: ['Rdz'],
	neh: ['Ne'],
	ps: ['Ps'],
	prov: ['Prz'],
	isa: ['Iz'],
	// `Mt`, `Mk` and `Ps` are the same three letters Polish and English
	// happen to share, and they went unnoticed in the first derivation for
	// exactly that reason: the English fallback was already resolving them,
	// so the oracle saw nothing unresolved to propose. Giving the language a
	// table of its own is what made them visible.
	matt: ['Mt'],
	mark: ['Mk'],
	luke: ['Łk'],
	john: ['J'],
	acts: ['Dz'],
	eph: ['Ef'],
	rev: ['Ap'],
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Kor'], { unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['P'], { unspaced: true })
};

const BOOK_VARIANTS_RU: Record<string, string[]> = {
	gen: ['Быт'],
	neh: ['Неем'],
	ps: ['Пс'],
	prov: ['Притч'],
	isa: ['Ис'],
	matt: ['Мф'],
	mark: ['Мк'],
	luke: ['Лк'],
	john: ['Ин'],
	acts: ['Деян'],
	eph: ['Еф'],
	rev: ['Откр'],
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Кор'], { unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Пет'], { unspaced: true })
};

/**
 * Arabic, which spells its books out rather than abbreviating them and is the
 * only table here whose language has no letter case at all — so nothing in
 * the matcher can lean on a capital, and `LEFT_BOUND`/`RIGHT_BOUND`'s
 * `\p{L}` guards are what keep a book name from matching inside a longer
 * word. Two of them are two words ("أعمال الرّسل", Acts of the Apostles), and
 * one CONTAINS another: "رؤيا يوحنّا" (the Revelation of John) opens on the
 * evangelist's own name, which is harmless because `buildVariantRe` sorts its
 * alternation longest-first.
 */
const BOOK_VARIANTS_AR: Record<string, string[]> = {
	gen: ['تكوين'],
	neh: ['نحميا'],
	ps: ['المزمور'],
	prov: ['أمثال'],
	isa: ['أشعيا'],
	matt: ['متّى'],
	mark: ['مرقس'],
	luke: ['لوقا'],
	john: ['يوحنّا'],
	acts: ['أعمال الرّسل'],
	eph: ['أفسس'],
	rev: ['رؤيا يوحنّا'],
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['قورنتس']),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['بطرس'])
};

/**
 * The book tables, materialized, for anything outside this module that has
 * to recognize the same surface forms.
 *
 * The one such consumer is the pipeline: `pipeline/scrapers/ccc/ccc.py`
 * decides which parentheses in the Portuguese Catechism are Scripture
 * locators (docs/corpus-schema.md §CCC, the `⟦inlineN⟧` tokens), and it
 * used to do so with a book list of its own, in Python, that could not learn
 * what this table learned. `scripts/export-book-forms.mjs` writes this object
 * to `pipeline/scrapers/common/book_forms.json`, and `book-forms.test.ts`
 * fails when the two differ — so the JSON is generated, committed, and
 * checked, and the table has one home.
 */
export const BOOK_FORMS: Record<string, Record<string, string[]>> = {
	en: BOOK_VARIANTS_EN,
	pt: BOOK_VARIANTS_PT,
	de: BOOK_VARIANTS_DE,
	es: BOOK_VARIANTS_ES,
	fr: BOOK_VARIANTS_FR,
	it: BOOK_VARIANTS_IT,
	la: BOOK_VARIANTS_LA,
	mg: BOOK_VARIANTS_MG
};

// --------------------------------------------------------------------------
// Document sigla (non-scripture: councils, encyclicals, canon law, patrology
// series, magisterial document collections). A siglum that names a document
// the corpus has ingested links to it through `refHref`; everything else
// (DS, CIC, PL, PG, AAS, canon law, patrology series, and every siglum's PT
// appearance) has nothing in the corpus to link to, so the point of
// recognizing THOSE is a quiet, informative non-link (sigla + locus +
// expansion tooltip) instead of the sigla vanishing into unstyled text.
//
// This table is a decoder ring built by counting `\bTOKEN\b` occurrences in
// the corpus's citations and confirming each entry's meaning against its
// citation context — not exhaustive, just the sigla that actually occur with
// enough frequency to verify. It was written when no edition's
// `abbreviations.json` carried one; two now do (`ccc.fr` 58 entries,
// `ccc.la` 119, added 2026-08-26), and they are the sources' own tables
// rather than a reading of the citations. Nothing here consumes them yet,
// and they would not simply replace this: they name the sigla those two
// EDITIONS print, EN and PT are the only languages this file has configs
// for, and an expansion is not a slug. What they do settle is that the
// per-language split below is right — see the `SC` note in the next
// paragraph, which the Latin table states outright.
//
// A SLUG HERE IS A CLAIM, NOT A LINK. Whether the siglum actually links is
// decided at parse time by `ingestedSlugs()` — the set of documents the
// corpus really holds, injected through `setDocumentTitleSource` — so an
// entry naming a work that is not (or not yet) ingested is inert rather than
// a dead link, and ingesting a work is enough to make its citations resolve.
// The previous arrangement, a separate hand-written siglum→slug table that
// only listed Vatican II, rested on the claim that "the CCC cites encyclicals
// by title, never by siglum" — true of the Catechism, false of the
// encyclicals citing each other: measured 2026-08-25, 67 citations to ten
// ingested encyclicals (CA 28, SRS 10, HV 6, LE 6, DeV 4, PT 4 …) were
// recognized and rendered as non-links because the table did not know them.
//
// EN and PT get separate tables, not one shared one, because at least one
// siglum means something different per language: "SC" is Sacrosanctum
// Concilium (Vatican II liturgy constitution) throughout the EN corpus, but
// the EN-only "SCh" (Sources Chrétiennes, a patristic critical-edition
// series) doesn't appear in ccc.pt at all — PT citations use bare "SC" for
// Sources Chrétiennes instead (103 occurrences, zero for the Vatican II
// document sigla, which PT citations spell out in full: "Const. past.
// Gaudium et Spes"; a 2026-08-25 scan of every PT citation for a conciliar or
// encyclical siglum followed by a number found none). Sharing one table would
// silently mislabel one language.
//
// SIX MORE TABLES FOLLOW, and they exist because that split turned out to be
// the rule rather than a Portuguese peculiarity. Until 2026-08-26 `configFor`
// answered EN for every language but PT, and the same `SC` collision was
// present in two of the six editions added that month: `ccc.la`'s own printed
// sigla table says `SC` is Sources chrétiennes, `ccc.it` prints the same
// apparatus, and each cites it 118 times as a volume-and-page, of which 54
// and 55 carried a number Sacrosanctum Concilium really has a section for —
// real links to the wrong document. `CA` collides the same way. See the
// section below the book tables.
// --------------------------------------------------------------------------

export interface SiglumEntry {
	expansion: string;
	/** The ingested document this siglum names — see the section comment on
	 *  why a slug listed here is validated against the corpus, never trusted. */
	slug?: string;
}

const DOCUMENT_SIGLA_EN: Record<string, SiglumEntry> = {
	LG: {
		expansion: 'Lumen Gentium (Vatican II, Dogmatic Constitution on the Church)',
		slug: 'lumen-gentium'
	},
	AG: {
		expansion: "Ad Gentes (Vatican II, Decree on the Church's Missionary Activity)",
		slug: 'ad-gentes'
	},
	SC: {
		expansion: 'Sacrosanctum Concilium (Vatican II, Constitution on the Sacred Liturgy)',
		slug: 'sacrosanctum-concilium'
	},
	GS: {
		expansion:
			'Gaudium et Spes (Vatican II, Pastoral Constitution on the Church in the Modern World)',
		slug: 'gaudium-et-spes'
	},
	UR: {
		expansion: 'Unitatis Redintegratio (Vatican II, Decree on Ecumenism)',
		slug: 'unitatis-redintegratio'
	},
	CT: { expansion: 'Catechesi Tradendae (John Paul II, apostolic exhortation on catechesis)' },
	DS: { expansion: 'Denzinger–Schönmetzer (Enchiridion Symbolorum)' },
	CIC: { expansion: 'Codex Iuris Canonici (Code of Canon Law)' },
	CCEO: {
		expansion: 'Codex Canonum Ecclesiarum Orientalium (Code of Canons of the Eastern Churches)'
	},
	RCIA: { expansion: 'Rite of Christian Initiation of Adults' },
	RBC: { expansion: 'Rite of Baptism for Children' },
	CDF: { expansion: 'Congregation for the Doctrine of the Faith' },
	PL: { expansion: 'Patrologia Latina (Migne)' },
	PG: { expansion: 'Patrologia Graeca (Migne)' },
	SCh: { expansion: 'Sources Chrétiennes (patristic critical-edition series)' },
	AAS: { expansion: 'Acta Apostolicae Sedis (official gazette of the Holy See)' },
	DV: {
		expansion: 'Dei Verbum (Vatican II, Dogmatic Constitution on Divine Revelation)',
		slug: 'dei-verbum'
	},
	NA: {
		expansion:
			'Nostra Aetate (Vatican II, Declaration on the Relation of the Church to Non-Christian Religions)',
		slug: 'nostra-aetate'
	},
	OT: {
		expansion: 'Optatam Totius (Vatican II, Decree on Priestly Training)',
		slug: 'optatam-totius'
	},
	PO: {
		expansion: 'Presbyterorum Ordinis (Vatican II, Decree on the Ministry and Life of Priests)',
		slug: 'presbyterorum-ordinis'
	},
	CD: {
		expansion: 'Christus Dominus (Vatican II, Decree on the Pastoral Office of Bishops)',
		slug: 'christus-dominus'
	},
	OE: {
		expansion: 'Orientalium Ecclesiarum (Vatican II, Decree on the Eastern Catholic Churches)',
		slug: 'orientalium-ecclesiarum'
	},
	EP: { expansion: 'Eucharistic Prayer (Roman Missal)' },
	PC: {
		expansion: 'Perfectae Caritatis (Vatican II, Decree on the Renewal of Religious Life)',
		slug: 'perfectae-caritatis'
	},
	AA: {
		expansion: 'Apostolicam Actuositatem (Vatican II, Decree on the Apostolate of the Laity)',
		slug: 'apostolicam-actuositatem'
	},
	DH: {
		expansion: 'Dignitatis Humanae (Vatican II, Declaration on Religious Freedom)',
		slug: 'dignitatis-humanae'
	},
	IM: {
		expansion: 'Inter Mirifica (Vatican II, Decree on Social Communication)',
		slug: 'inter-mirifica'
	},
	GE: {
		expansion: 'Gravissimum Educationis (Vatican II, Declaration on Christian Education)',
		slug: 'gravissimum-educationis'
	},
	// Encyclicals, cited by siglum in the other encyclicals rather than in the
	// Catechism. Slugs are the corpus's own (`encyclical.{slug}.{lang}`), which
	// for a handful of documents is the incipit's first word alone
	// (`populorum`, `mater`, `pacem`, `mysterium`).
	CA: { expansion: 'Centesimus Annus (John Paul II encyclical)', slug: 'centesimus-annus' },
	SRS: {
		expansion: 'Sollicitudo Rei Socialis (John Paul II encyclical)',
		slug: 'sollicitudo-rei-socialis'
	},
	LE: { expansion: 'Laborem Exercens (John Paul II encyclical)', slug: 'laborem-exercens' },
	HV: { expansion: 'Humanae Vitae (Paul VI encyclical)', slug: 'humanae-vitae' },
	MF: { expansion: 'Mysterium Fidei (Paul VI encyclical)', slug: 'mysterium' },
	PP: { expansion: 'Populorum Progressio (Paul VI encyclical)', slug: 'populorum' },
	RH: { expansion: 'Redemptor Hominis (John Paul II encyclical)', slug: 'redemptor-hominis' },
	RM: { expansion: 'Redemptoris Mater (John Paul II encyclical)', slug: 'redemptoris-mater' },
	RMat: { expansion: 'Redemptoris Mater (John Paul II encyclical)', slug: 'redemptoris-mater' }, // observed alt siglum, same document as RM
	PT: { expansion: 'Pacem in Terris (John XXIII encyclical)', slug: 'pacem' },
	MM: { expansion: 'Mater et Magistra (John XXIII encyclical)', slug: 'mater' },
	DeV: {
		expansion: 'Dominum et Vivificantem (John Paul II encyclical)',
		slug: 'dominum-et-vivificantem'
	},
	DM: {
		expansion: 'Dives in Misericordia (John Paul II encyclical)',
		slug: 'dives-in-misericordia'
	},
	CIV: { expansion: 'Caritas in Veritate (Benedict XVI encyclical)', slug: 'caritas-in-veritate' },
	// `SS` (Spe Salvi, 2 citations) is deliberately absent: "Festo SS. Apost."
	// and "C.SS. Rituum" would claim it ten times over.
	// Apostolic exhortations and letters, recognized for the tooltip; none is
	// ingested (docs/corpus-schema.md §Documents lists the families that are).
	FC: { expansion: 'Familiaris Consortio (John Paul II, apostolic exhortation on the family)' },
	RP: { expansion: 'Reconciliatio et Paenitentia (John Paul II, apostolic exhortation)' },
	EN: { expansion: 'Evangelii Nuntiandi (Paul VI, apostolic exhortation on evangelization)' },
	MC: { expansion: 'Marialis Cultus (Paul VI, apostolic exhortation)' },
	MD: { expansion: 'Mulieris Dignitatem (John Paul II, apostolic letter)' },
	CL: { expansion: 'Christifideles Laici (John Paul II, apostolic exhortation)' },
	GCD: { expansion: 'General Catechetical Directory' },
	GIRM: { expansion: 'General Instruction of the Roman Missal' },
	GILH: { expansion: 'General Instruction of the Liturgy of the Hours' },
	OCF: { expansion: 'Order of Christian Funerals' },
	OP: { expansion: 'Ordo Paenitentiae (Rite of Penance)' },
	LC: { expansion: 'Libertatis Conscientia (CDF instruction on Christian freedom and liberation)' },
	ND: { expansion: 'Neuner–Dupuis, The Christian Faith (doctrinal sourcebook)' }
};

const DOCUMENT_SIGLA_PT: Record<string, SiglumEntry> = {
	// SC deliberately means something different here than in EN — see the
	// table-group docblock above.
	SC: { expansion: 'Sources Chrétiennes (patristic critical-edition series)' },
	DS: { expansion: 'Denzinger–Schönmetzer (Enchiridion Symbolorum)' },
	CIC: { expansion: 'Codex Iuris Canonici (Código de Direito Canónico)' },
	CCEO: { expansion: 'Codex Canonum Ecclesiarum Orientalium' },
	PL: { expansion: 'Patrologia Latina (Migne)' },
	PG: { expansion: 'Patrologia Graeca (Migne)' },
	AAS: { expansion: 'Acta Apostolicae Sedis' }
	// Vatican II / encyclical sigla (LG, GS, DV, ...) do not appear in
	// ccc.pt at all — its citations spell those documents out in full
	// ("Const. past. Gaudium et Spes") rather than abbreviating them.
};

// --------------------------------------------------------------------------
// Sigla for the six editions added 2026-08-26.
//
// These editions split cleanly in two, and the split is a fact about their
// APPARATUS rather than about their languages:
//
//   - German, Spanish and French cite magisterial documents by the Latin
//     siglum, exactly as English does — LG 281 times in the French edition,
//     GS 159, DV 73. So they share the conciliar and encyclical tables below.
//   - Italian and Latin cite none of them. They spell every document out
//     ("Conc. Vat. II, Const. dogm. Lumen gentium, 20"), which the title
//     matcher already reads because an incipit is Latin in every edition, and
//     the only sigla they print are bibliographic: AAS, DS, PL, PG, SC, CCL,
//     CSEL, PTS, CA. Their two lists are identical, count for count.
//   - Malagasy translates the conciliar sigla and keeps the encyclical ones:
//     FF is Lumen gentium, FAA Gaudium et spes, FA Dei Verbum, EK Unitatis
//     redintegratio — while CA, CT, RM, SRS, HV, LE stay as they are.
//
// TWO SIGLA MEAN DIFFERENT THINGS IN DIFFERENT EDITIONS, and both are settled
// by the Latin edition's own printed table (`ccc.la/abbreviations.json`)
// rather than by inference:
//
//   - `SC` is *Sacrosanctum concilium* in German, Spanish and French, and
//     *Sources chrétiennes* in Italian and Latin — where its 118 references
//     apiece are volume-and-page ("SC 211, 392 (PG 7, 944)"). Read with the
//     English table, 54 Latin and 55 Italian citations linked to real
//     sections of the Vatican II constitution.
//   - `CA` is *Centesimus annus* in German, Spanish, French and Malagasy (32
//     citations each), and *Corpus apologetarum* in Italian and Latin (10
//     each: "Sanctus Iustinus, Apologia, 1, 61: CA 1, 168").
//
// This is the same collision `DOCUMENT_SIGLA_PT` was split off for, found
// twice more, and it is why no shared base table sits under these.
//
// EXPANSIONS ARE THE DOCUMENT'S OWN INCIPIT and carry no translated gloss,
// unlike the English table's "Lumen Gentium (Vatican II, Dogmatic
// Constitution on the Church)". The incipit is what the French edition's own
// sigla list prints, it is the same words in every language, and a gloss in
// five languages would be this file inventing text. Where an edition's own
// table does gloss in its language, that gloss is used — French expands
// `CDF` as "Congrégation pour la doctrine de la foi".
// --------------------------------------------------------------------------

/**
 * Bibliographic series and critical editions — the same in every language,
 * because what they abbreviate is a series TITLE and not a word: *Patrologia
 * latina* is *Patrologia latina* in a German footnote too.
 *
 * Taken from the Latin edition's printed `SIGLA` list, minus the rows that
 * are editorial shorthand rather than a work (`c` for *caput*, `q` for
 * *quaestio*, `Cf`, `Ibid`, `ed`, `p`, `v`, `Sess`, `Const. dogm.` and their
 * kin). None names anything the corpus holds, so every one of these is a
 * tooltip and never a link — which is the point: they are what the Italian
 * and Latin apparatus is mostly made of.
 */
const SERIES_SIGLA: Record<string, SiglumEntry> = {
	AAS: { expansion: 'Acta Apostolicae Sedis' },
	AHMA: { expansion: 'Analecta hymnica Medii Aevi' },
	BP: { expansion: 'Biblioteca patristica' },
	CCG: { expansion: 'Corpus Christianorum (Series Graeca)' },
	CCL: { expansion: 'Corpus Christianorum (Series Latina)' },
	COD: { expansion: 'Conciliorum Oecumenicorum Decreta' },
	CSEL: { expansion: 'Corpus Scriptorum Ecclesiasticorum Latinorum' },
	// Not in the Latin edition's list; both are printed by Magnifica
	// Humanitas in all four of its languages that have a table here. `CCSL`
	// is the fuller form of `CCL`, and `ASS` is what AAS was called before
	// 1909.
	CCSL: { expansion: 'Corpus Christianorum (Series Latina)' },
	ASS: { expansion: 'Acta Sanctae Sedis' },
	DS: {
		expansion:
			'Denzinger–Schönmetzer, Enchiridion Symbolorum definitionum et declarationum de rebus fidei et morum'
	},
	'Ed. Leon.': { expansion: 'Sancti Thomae Aquinatis Opera omnia, editio Leonina' },
	Funk: { expansion: 'F.X. Funk, Patres apostolici' },
	GCS: { expansion: 'Die griechischen christlichen Schriftsteller' },
	MGH: { expansion: 'Monumenta Germaniae historica' },
	MHSI: { expansion: 'Monumenta historica Societatis Iesu' },
	PG: { expansion: 'Patrologia graeca (J.P. Migne)' },
	PL: { expansion: 'Patrologia latina (J.P. Migne)' },
	PLS: { expansion: 'Patrologia latina. Supplementum' },
	PTS: { expansion: 'Patristische Texte und Studien' },
	SPM: { expansion: 'Stromata patristica et medievalia' },
	TD: { expansion: 'Textes et documents' },
	TPL: { expansion: 'Textus patristici et liturgici' },
	CIC: { expansion: 'Codex Iuris Canonici' },
	CCEO: { expansion: 'Codex Canonum Ecclesiarum Orientalium' }
};

/**
 * Vatican II, by siglum, for the editions that cite it that way. Every slug
 * here names a document the corpus holds; `ingestedSlugs()` still decides
 * whether it links, per `DOCUMENT_SIGLA_EN`'s standing rule that a slug is a
 * claim and not a link.
 *
 * `SC` is deliberately NOT here — see this section's docblock.
 */
const CONCILIAR_SIGLA: Record<string, SiglumEntry> = {
	LG: { expansion: 'Lumen gentium', slug: 'lumen-gentium' },
	GS: { expansion: 'Gaudium et spes', slug: 'gaudium-et-spes' },
	DV: { expansion: 'Dei Verbum', slug: 'dei-verbum' },
	AG: { expansion: 'Ad gentes', slug: 'ad-gentes' },
	UR: { expansion: 'Unitatis redintegratio', slug: 'unitatis-redintegratio' },
	DH: { expansion: 'Dignitatis humanae', slug: 'dignitatis-humanae' },
	NA: { expansion: 'Nostra aetate', slug: 'nostra-aetate' },
	AA: { expansion: 'Apostolicam actuositatem', slug: 'apostolicam-actuositatem' },
	CD: { expansion: 'Christus Dominus', slug: 'christus-dominus' },
	PC: { expansion: 'Perfectae caritatis', slug: 'perfectae-caritatis' },
	PO: { expansion: 'Presbyterorum ordinis', slug: 'presbyterorum-ordinis' },
	OT: { expansion: 'Optatam totius', slug: 'optatam-totius' },
	OE: { expansion: 'Orientalium ecclesiarum', slug: 'orientalium-ecclesiarum' },
	IM: { expansion: 'Inter mirifica', slug: 'inter-mirifica' },
	GE: { expansion: 'Gravissimum educationis', slug: 'gravissimum-educationis' }
};

/**
 * Papal documents by siglum. The ingested ones carry a slug; the
 * exhortations and letters do not, because the corpus holds no exhortation
 * family (docs/corpus-schema.md §Documents), and are here for the expansion.
 *
 * `CA` is deliberately NOT here — see this section's docblock.
 */
const PAPAL_SIGLA: Record<string, SiglumEntry> = {
	SRS: { expansion: 'Sollicitudo rei socialis', slug: 'sollicitudo-rei-socialis' },
	LE: { expansion: 'Laborem exercens', slug: 'laborem-exercens' },
	HV: { expansion: 'Humanae vitae', slug: 'humanae-vitae' },
	RH: { expansion: 'Redemptor hominis', slug: 'redemptor-hominis' },
	RM: { expansion: 'Redemptoris Mater', slug: 'redemptoris-mater' },
	DeV: { expansion: 'Dominum et Vivificantem', slug: 'dominum-et-vivificantem' },
	DM: { expansion: 'Dives in misericordia', slug: 'dives-in-misericordia' },
	MF: { expansion: 'Mysterium fidei', slug: 'mysterium' },
	PP: { expansion: 'Populorum progressio', slug: 'populorum' },
	PT: { expansion: 'Pacem in terris', slug: 'pacem' },
	MM: { expansion: 'Mater et magistra', slug: 'mater' },
	CT: { expansion: 'Catechesi tradendae' },
	EN: { expansion: 'Evangelii nuntiandi' },
	FC: { expansion: 'Familiaris consortio' },
	RP: { expansion: 'Reconciliatio et paenitentia' },
	MC: { expansion: 'Marialis cultus' },
	MD: { expansion: 'Mulieris dignitatem' },
	CL: { expansion: 'Christifideles laici' },
	SPF: { expansion: 'Sollemnis Professio fidei (Credo of the People of God)' }
};

/** `SC` where it is the Vatican II constitution: German, Spanish, French. */
const SC_CONCILIAR: SiglumEntry = {
	expansion: 'Sacrosanctum concilium',
	slug: 'sacrosanctum-concilium'
};
/** `SC` where it is the patristic series: Italian, Latin. Never a link. */
const SC_SERIES: SiglumEntry = { expansion: 'Sources chrétiennes' };

const DOCUMENT_SIGLA_DE: Record<string, SiglumEntry> = {
	...SERIES_SIGLA,
	...CONCILIAR_SIGLA,
	...PAPAL_SIGLA,
	SC: SC_CONCILIAR,
	CA: { expansion: 'Centesimus annus', slug: 'centesimus-annus' },
	// German-only forms, each corroborated against the English edition's own
	// siglum at the same paragraph: DCG is the General Catechetical
	// Directory, IGMR the General Instruction of the Roman Missal, OEx the
	// Order of Christian Funerals, DnV Dominum et Vivificantem.
	DCG: { expansion: 'Directorium Catecheticum Generale' },
	IGMR: { expansion: 'Institutio generalis Missalis Romani' },
	IGLH: { expansion: 'Institutio generalis de Liturgia Horarum' },
	OEx: { expansion: 'Ordo exsequiarum' },
	DnV: { expansion: 'Dominum et Vivificantem', slug: 'dominum-et-vivificantem' }
};

const DOCUMENT_SIGLA_ES: Record<string, SiglumEntry> = {
	...SERIES_SIGLA,
	...CONCILIAR_SIGLA,
	...PAPAL_SIGLA,
	SC: SC_CONCILIAR,
	CA: { expansion: 'Centesimus annus', slug: 'centesimus-annus' }
};

/**
 * French, and the second table in this file taken from a source rather than
 * derived: the French mirror prints its own `LISTE DES SIGLES` (`__P1.HTM`,
 * parsed into `ccc.fr/abbreviations.json` on 2026-08-26). Its 58 rows are the
 * conciliar and papal blocks above plus the liturgical books below, and the
 * three rows it expands in French rather than Latin are kept in French.
 */
const DOCUMENT_SIGLA_FR: Record<string, SiglumEntry> = {
	...SERIES_SIGLA,
	...CONCILIAR_SIGLA,
	...PAPAL_SIGLA,
	SC: SC_CONCILIAR,
	CA: { expansion: 'Centesimus annus', slug: 'centesimus-annus' },
	SPF: { expansion: 'Credo du Peuple de Dieu : profession de foi solennelle' },
	CDF: { expansion: 'Congrégation pour la doctrine de la foi' },
	'off. lect.': { expansion: 'office des lectures' },
	Ben: { expansion: 'De Benedictionibus' },
	'Catech. R.': { expansion: 'Catechismus Romanus' },
	DCG: { expansion: 'Directorium Catecheticum Generale' },
	IGLH: { expansion: 'Introductio generalis LH' },
	IGMR: { expansion: 'Institutio generalis MR' },
	LH: { expansion: 'Liturgia Horarum' },
	MR: { expansion: 'Missale Romanum' },
	OBA: { expansion: 'Ordo baptismi adultorum' },
	OBP: { expansion: 'Ordo baptismi parvulorum' },
	OCf: { expansion: 'Ordo confirmationis' },
	OcM: { expansion: 'Ordo celebrandi Matrimonium' },
	OCV: { expansion: 'Ordo consecrationis virginum' },
	OEx: { expansion: 'Ordo exsequiarum' },
	OICA: { expansion: 'Ordo initiationis christianae adultorum' },
	OP: { expansion: 'Ordo poenitentiae' }
};

/**
 * Latin, from the same printed table as `BOOK_VARIANTS_LA` — its `SIGLA`
 * list, narrowed to the rows that name a work. It is almost entirely
 * bibliographic, because this edition names its documents in full rather
 * than by siglum, and it is where `SC` and `CA` are settled for both editions
 * that use this apparatus.
 */
const DOCUMENT_SIGLA_LA: Record<string, SiglumEntry> = {
	...SERIES_SIGLA,
	SC: SC_SERIES,
	CA: { expansion: 'Corpus apologetarum Christianorum saeculi secundi' }
};

/** Italian prints the same apparatus as the Latin editio typica, siglum for
 *  siglum and count for count — AAS, DS, PL, PG, SC, CCL, CSEL, PTS, CA and
 *  nothing else — so it reads the same table rather than a copy of it. */
const DOCUMENT_SIGLA_IT = DOCUMENT_SIGLA_LA;

/**
 * Malagasy, derived the same way the book tables were: a `SIGLUM n` shape
 * this edition prints, aligned against the document the English edition
 * cites at the same paragraph. Every entry below was corroborated on the
 * large majority of its occurrences — FF as Lumen gentium on 265 of 282,
 * FAA as Gaudium et spes on 155 of 165 — and the conciliar sigla are the
 * only ones this edition translates.
 */
/**
 * Polish, Russian and Arabic, whose one work cites nothing but bibliographic
 * series: `AAS` 172-176 times apiece, then `CCSL`, `ASS` and `PL` in single
 * figures, and — measured across all three editions — not one conciliar or
 * papal siglum. So they get `SERIES_SIGLA` and nothing else, on the same
 * evidence that gave Italian and Latin theirs. Under the English fallback
 * they carried every siglum in `DOCUMENT_SIGLA_EN`, which is a table of
 * two-letter tokens offered to running text in two languages nobody had
 * checked them against.
 */
const DOCUMENT_SIGLA_SERIES_ONLY: Record<string, SiglumEntry> = SERIES_SIGLA;

const DOCUMENT_SIGLA_MG: Record<string, SiglumEntry> = {
	...SERIES_SIGLA,
	...PAPAL_SIGLA,
	CA: { expansion: 'Centesimus annus', slug: 'centesimus-annus' },
	FF: { expansion: 'Lumen gentium', slug: 'lumen-gentium' },
	FAA: { expansion: 'Gaudium et spes', slug: 'gaudium-et-spes' },
	FA: { expansion: 'Dei Verbum', slug: 'dei-verbum' },
	EK: { expansion: 'Unitatis redintegratio', slug: 'unitatis-redintegratio' },
	AFF: { expansion: 'Ad gentes', slug: 'ad-gentes' },
	FVA: { expansion: 'Dignitatis humanae', slug: 'dignitatis-humanae' },
	RFP: { expansion: 'Presbyterorum ordinis', slug: 'presbyterorum-ordinis' },
	FM: { expansion: 'Familiaris consortio' }
};

// --------------------------------------------------------------------------
// Per-language config: pre-built matchers so parseRefs doesn't rebuild a
// regex per call.
// --------------------------------------------------------------------------

interface LangConfig {
	variantToOsis: Map<string, string>;
	bookRe: RegExp;
	documentSigla: Map<string, SiglumEntry>;
	documentRe: RegExp;
	/** Whether a siglum may resolve to an ingested document at all. False for
	 *  PT, whose table maps no siglum to a slug (see `DOCUMENT_SIGLA_PT`). */
	linksSigla: boolean;
	/** Primary chapter/verse separator: ":" (EN) or "," (PT, "Act 2, 42"). */
	primarySep: string;
	/** EN-only: a bare space or "." also separates chapter from verse when
	 * immediately followed by a digit ("Mk 10 14", "Jn 3.16") — a documented
	 * dropped-colon/dotted-style pattern in the EN corpus. Not extended to
	 * PT without direct evidence of the same drift. */
	allowBareSeparators: boolean;
	/** Other accepted chapter/verse separators. Used only for a verified
	 * source-specific punctuation drift, never to guess a locator. */
	extraChapterVerseSeparators: string[];
	/** Marks that delimit one citation clause from the next. ";" everywhere;
	 * PT adds ":" (see `CONFIG_PT`). */
	clauseSepRe: RegExp;
	/**
	 * Read a Roman-numeral CHAPTER in running prose as well as in a stored
	 * citation ("Matth. XVI. 18." in a footnote, not in a `citations` array).
	 *
	 * Off everywhere but `bible.martini.it`, and the docblock on
	 * `parseChapterVerses` says why it has to stay that way: in prose "John
	 * XXIII" is a pope far more often than a chapter. It is a per-WORK
	 * property rather than a per-language one because it describes how one
	 * edition's printer set numerals, not how a language cites — Martini
	 * writes the chapter in Roman ~10 times for every once he writes it in
	 * Arabic (measured over eight book families, 2026-08-28), and no other
	 * Italian work in the corpus does it at all.
	 *
	 * The guards that make it safe are already in `parseChapterVerses` and
	 * are not relaxed here: a Roman chapter must be followed by an explicit
	 * separator and a verse, and that verse must be verse-sized (`MAX_VERSE`).
	 */
	proseRomanChapters?: boolean;
}

function escapeRe(s: string): string {
	return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Unicode-aware word boundary: plain `\b` relies on `\w`, which in JS is
// ASCII-only, so it fails to find a boundary before/after an accented
// letter (e.g. `\bÊxodo\b` would not match "Cf. Êxodo 20" — both "space"
// and "Ê" read as "non-word" to `\w`, so `\b` never fires). PT's citation
// surface forms and full book names can start or end on an accented
// letter, so every matcher below uses this instead.
const LEFT_BOUND = '(?<![\\p{L}\\p{N}])';
const RIGHT_BOUND = '(?![\\p{L}])';

function buildVariantRe(variants: string[]): RegExp {
	const sorted = [...variants].sort((a, b) => b.length - a.length);
	return new RegExp(LEFT_BOUND + '(?:' + sorted.map(escapeRe).join('|') + ')' + RIGHT_BOUND, 'gu');
}

function buildConfig(
	bookVariants: Record<string, string[]>,
	documentSigla: Record<string, SiglumEntry>,
	primarySep: string,
	allowBareSeparators: boolean,
	linksSigla: boolean,
	extraChapterVerseSeparators: string[] = [],
	clauseSeparators: string[] = [';']
): LangConfig {
	const variantToOsis = new Map<string, string>();
	for (const [osis, variants] of Object.entries(bookVariants)) {
		for (const v of variants) variantToOsis.set(v, osis);
	}
	return {
		variantToOsis,
		bookRe: buildVariantRe([...variantToOsis.keys()]),
		documentSigla: new Map(Object.entries(documentSigla)),
		documentRe: buildVariantRe(Object.keys(documentSigla)),
		linksSigla,
		primarySep,
		allowBareSeparators,
		extraChapterVerseSeparators,
		clauseSepRe: new RegExp('([' + clauseSeparators.map(escapeRe).join('') + '])')
	};
}

// The English Vatican Rosary page has one `Mt 27,26` locator amid otherwise
// colon-separated English references. A comma immediately after a chapter is
// unambiguously a verse separator there, so accept it while retaining the
// source's printed spelling in the corpus.
const CONFIG_EN = buildConfig(BOOK_VARIANTS_EN, DOCUMENT_SIGLA_EN, ':', true, true, [',']);

/**
 * English, read by a work that numbers the books of Kings the Douay way —
 * see `KINGS_MODERN`/`KINGS_DOUAY`. Identical to `CONFIG_EN` in every other
 * respect, because the convention is a naming difference and not a dialect:
 * such a work abbreviates, punctuates and separates exactly as its
 * neighbours do, and the sigla, the marks and the other seventy books are
 * the same table.
 */
const CONFIG_EN_DOUAY = buildConfig(
	remapBookVariants(BOOK_VARIANTS_EN, KINGS_MODERN, KINGS_DOUAY),
	DOCUMENT_SIGLA_EN,
	':',
	true,
	true,
	[',']
);
// Fourth argument stays `false`: PT never uses a bare SPACE as a
// chapter/verse separator, so `allowBareSeparators` (which would enable both
// " " and ".") is still the wrong knob for it. What PT does drift to is "."
// where it means "," -- "Sl 40. 7-9" for Ps 40:7-9, "Mc 14. 25" for Mk 14:25
// -- so that one mark goes in via `extraChapterVerseSeparators`, the knob
// meant for exactly this kind of verified, source-specific punctuation
// drift. Fifth argument `false`: PT's document segments always parse with
// `slug: null` (the sigla section comment explains why that's correct, not a
// gap).
const CONFIG_PT = buildConfig(
	BOOK_VARIANTS_PT,
	DOCUMENT_SIGLA_PT,
	',',
	false,
	false,
	['.'],
	[';', ':']
);

/**
 * The six editions added 2026-08-26, all reading `,` as the chapter/verse
 * separator and `.` as the verse-list separator ("Cf 1 Gv 2,20.27") — which
 * is the Continental convention `CONFIG_PT` already encodes, not a per-
 * edition choice. What differs between them is the tables, not the marks.
 *
 * `allowBareSeparators` stays off for all six: none of them prints a bare
 * space or a bare full stop where the chapter/verse mark belongs, and
 * turning it on would read "Serm. 241, 2" and "Ed. Leon. 4, 31" — both
 * everywhere in these apparatus — as loci.
 *
 * `linksSigla` is on for all six, unlike PT. PT's is off because its table
 * maps no siglum to a slug at all; these do, and the document a siglum names
 * is the same document whatever language cites it — the reader lands on it
 * through `CONTENT_LANG_FALLBACK` like any other cross-language address.
 */
function romanceConfig(
	books: Record<string, string[]>,
	sigla: Record<string, SiglumEntry>
): LangConfig {
	return buildConfig(books, sigla, ',', false, true, ['.']);
}

const CONFIG_DE = romanceConfig(BOOK_VARIANTS_DE, DOCUMENT_SIGLA_DE);
const CONFIG_ES = romanceConfig(BOOK_VARIANTS_ES, DOCUMENT_SIGLA_ES);
const CONFIG_FR = romanceConfig(BOOK_VARIANTS_FR, DOCUMENT_SIGLA_FR);
const CONFIG_IT = romanceConfig(BOOK_VARIANTS_IT, DOCUMENT_SIGLA_IT);
const CONFIG_LA = romanceConfig(BOOK_VARIANTS_LA, DOCUMENT_SIGLA_LA);
const CONFIG_MG = romanceConfig(BOOK_VARIANTS_MG, DOCUMENT_SIGLA_MG);
const CONFIG_PL = romanceConfig(BOOK_VARIANTS_PL, DOCUMENT_SIGLA_SERIES_ONLY);
const CONFIG_RU = romanceConfig(BOOK_VARIANTS_RU, DOCUMENT_SIGLA_SERIES_ONLY);

/**
 * Spanish and Italian read by a work that numbers the books of Kings the
 * Douay way — see `KINGS_ES_MODERN`/`KINGS_IT_MODERN` for the evidence and
 * for why each needed a table widening as well as this remap.
 *
 * Like `CONFIG_EN_DOUAY`, identical to the language's own config in every
 * other respect: the sigla, the marks and the other seventy books are the
 * same table, because the convention is a naming difference and not a
 * dialect. `CONFIG_IT_MARTINI` is the one exception, and it is not about
 * naming at all — see `proseRomanChapters`.
 */
const CONFIG_ES_DOUAY = romanceConfig(
	remapBookVariants(BOOK_VARIANTS_ES, KINGS_ES_MODERN, KINGS_ES_DOUAY),
	DOCUMENT_SIGLA_ES
);
const CONFIG_IT_MARTINI: LangConfig = {
	...romanceConfig(
		remapBookVariants(BOOK_VARIANTS_IT, KINGS_IT_MODERN, KINGS_IT_DOUAY),
		DOCUMENT_SIGLA_IT
	),
	proseRomanChapters: true
};

/**
 * Arabic is the one config whose MARKS differ rather than only its tables.
 * Its chapter/verse separator is the Arabic comma U+060C ("تكوين 11، 1-9"),
 * and its clause separator the Arabic semicolon U+061B, both of which are
 * distinct characters from the ASCII ones every other edition prints — a
 * config built on "," would read none of its 25 references.
 *
 * `.` stays in `extraChapterVerseSeparators` because a book abbreviation's
 * own full stop is handled before the locus grammar runs (`parseRefNumbers`),
 * and dropping it here would change that path for no reason.
 */
const CONFIG_AR = buildConfig(
	BOOK_VARIANTS_AR,
	DOCUMENT_SIGLA_SERIES_ONLY,
	'\u060C',
	false,
	true,
	['.'],
	[';', '\u061B']
);

/**
 * Content language -> grammar. Keyed on the BARE tag, matched on the prefix
 * so `en-gb` reads as English.
 *
 * ENGLISH IS THE FALLBACK FOR EVERYTHING ELSE, and that is a smaller claim
 * than it looks. Five tags have no entry here: `en-gb`, whose prayers are
 * English and read as English by the prefix rule, and `hu`, `ro`, `sl` and
 * `sv`, which hold one work apiece — a Compendium, citing the Catechism by
 * bare number ("279-289, 296-298"), which `parseBareCccList` reads without
 * any table at all. Measured 2026-08-26, all four are at 100% of their
 * citations already, and their prose prints no Scripture locator, so the
 * English book table matched nothing in them rather than matching something
 * wrong. `ar`, `pl` and `ru` were on that list until one encyclical landed a
 * work in each and the same measurement said otherwise — which is the point:
 * a tag that acquires a work with a real apparatus needs a row here, and the
 * way to find out is `scripts/reference-coverage.mjs`.
 */
const CONFIGS: Record<string, LangConfig> = {
	ar: CONFIG_AR,
	de: CONFIG_DE,
	es: CONFIG_ES,
	fr: CONFIG_FR,
	it: CONFIG_IT,
	la: CONFIG_LA,
	mg: CONFIG_MG,
	pl: CONFIG_PL,
	pt: CONFIG_PT,
	ru: CONFIG_RU,
	en: CONFIG_EN
};

/**
 * Work id -> grammar, consulted BEFORE the language table and overriding it.
 *
 * The grammar's axis is content language, and it stays that: this map is not
 * a second axis so much as a short list of works whose own text contradicts
 * their language's table, and it is short on purpose. A work belongs here
 * only when its references are measurably read wrong without it, and the
 * evidence goes in the comment beside it — the same standard
 * `pipeline/corrections/` holds a source defect to.
 *
 * All four entries are the Douay numbering of Kings, verified reference by
 * reference against the verse each one actually names (2026-08-26):
 *
 *   `bible.douay-rheims.en`   4 references, in CHALLONER'S NOTES rather than
 *                   in the text — the edition that gives the convention its
 *                   name, and the last one added, because its apparatus was
 *                   not being read at all until the notes were linkified.
 *                   Two are read wrong without this and both are settled by
 *                   the note's own sentence: at 1 Chronicles 21 he writes
 *                   "the difference of the numbers here and 2 Kings 24",
 *                   which is the census in 2 Samuel 24 and not Jehoiachin;
 *                   at Isaiah 28 "the Lord fought against the Philistines in
 *                   Baal Pharasim, 2 Kings 5." is David at Baal-perazim,
 *                   2 Samuel 5:20, and not Naaman. The other two read the
 *                   same either way ("3 Kings 22", "2Sam. 21"), and the
 *                   edition's own book names say the rest: it prints
 *                   1-2 Samuel AS 1-2 Kings.
 *   `summa.en`      50 references. CCEL quotes Scripture in Douay-Rheims
 *                   throughout, and prints all four books of Kings — 38 "1
 *                   Kings", 17 "2 Kings", 37 "3 Kings", 30 "4 Kings". The
 *                   3s and 4s are what put it beyond doubt.
 *   `encyclical.aeterni-patris.en`   1. "1 Kings 2:3" anchors "the God of
 *                   all knowledge", which is 1 Samuel 2:3.
 *   `encyclical.diuturnum.en`        1, covering three verses. "1 Kings
 *                   9:16; 10:1; 16:13" anchors the anointing of kings —
 *                   Saul and David, 1 Samuel — and `ccc.en` cites the same
 *                   three verses as "1 Sam 9:16; 10:1; 16:1, 12-13".
 *
 * Two other English works print the Douay numbering and need no entry, since
 * `3 Kings`/`4 Kings` resolve the same way under both conventions:
 * `encyclical.editae-saepe.en` ("III Kings 19:11") and
 * `encyclical.mysterium.en` ("3 Kgs 19.8").
 */
const WORK_CONFIGS: Record<string, LangConfig> = {
	'bible.douay-rheims.en': CONFIG_EN_DOUAY,
	'summa.en': CONFIG_EN_DOUAY,
	'encyclical.aeterni-patris.en': CONFIG_EN_DOUAY,
	'encyclical.diuturnum.en': CONFIG_EN_DOUAY,
	'bible.straubinger.es': CONFIG_ES_DOUAY,
	'bible.martini.it': CONFIG_IT_MARTINI
};

function configFor(lang?: string, work?: string): LangConfig {
	if (work) {
		const byWork = WORK_CONFIGS[work];
		if (byWork) return byWork;
	}
	if (!lang) return CONFIG_EN;
	const tag = lang.toLowerCase();
	return CONFIGS[tag.split('-')[0]] ?? CONFIG_EN;
}

/**
 * The surface forms one language reads, for a consumer that has to RECOGNIZE
 * them rather than parse a finished citation.
 *
 * `parseRefs` and `linkifyProse` read a string the corpus already printed;
 * the jump box's suggester (`suggest.ts`) reads a string a reader is still
 * typing, so it needs the tables themselves — every spelling of a book, every
 * siglum, and the separator this language puts between chapter and verse —
 * rather than the pre-built matchers, which are anchored regexes over
 * complete tokens and match nothing halfway through a word.
 *
 * This is a READ-ONLY view of the same `LangConfig` the parser uses, not a
 * second copy: a table the suggester completes and the parser then fails to
 * resolve would offer the reader an address that does not exist. `BOOK_FORMS`
 * is deliberately not that view — it is the eight tables the pipeline's
 * exporter needs, keyed by the language it happens to know about, and it has
 * no sigla and no separator.
 */
export interface GrammarSurface {
	/** Every spelling of a book this language reads -> that book's OSIS code. */
	books: ReadonlyMap<string, string>;
	/** Every document siglum this language reads. A `slug` here is a claim the
	 *  corpus may not honour — see the sigla section above. */
	sigla: ReadonlyMap<string, Readonly<SiglumEntry>>;
	/** What this language prints between chapter and verse: `:` in English,
	 *  `,` in the Romance tables, an Arabic comma in `ar`. */
	chapterVerseSep: string;
	/** Whether a siglum in this language may resolve to an ingested document
	 *  at all (false for PT — see `DOCUMENT_SIGLA_PT`). */
	linksSigla: boolean;
}

export function grammarSurface(lang?: string, work?: string): GrammarSurface {
	const config = configFor(lang, work);
	return {
		books: config.variantToOsis,
		sigla: config.documentSigla,
		chapterVerseSep: config.primarySep,
		linksSigla: config.linksSigla
	};
}

/**
 * `osis -> the abbreviation this language PRINTS`, per language, built once on
 * first ask.
 *
 * The tables are ordered shortest-and-most-canonical first (`gen: ['Gn',
 * 'Gen', 'Genesis']`) because that is the order the matcher wants, and it is
 * also the order a display wants, so the first variant seen for a book is the
 * one to show. `variantToOsis` preserves that order, so no second table is
 * needed and none may be added: an abbreviation the picker shows and the
 * parser does not read would be a form that exists nowhere but our own chrome.
 */
const abbrevIndexes = new Map<string, ReadonlyMap<string, string>>();

function abbrevIndexFor(tag: string): ReadonlyMap<string, string> {
	let index = abbrevIndexes.get(tag);
	if (!index) {
		const out = new Map<string, string>();
		for (const [variant, osis] of CONFIGS[tag].variantToOsis) {
			if (!out.has(osis)) out.set(osis, variant);
		}
		abbrevIndexes.set(tag, (index = out));
	}
	return index;
}

/**
 * How `lang` abbreviates one book, or `undefined` when it has no answer.
 *
 * TWO WAYS OF HAVING NO ANSWER, AND NEITHER FALLS BACK TO ENGLISH — which is
 * the whole reason this is not `grammarSurface(lang)`, whose `configFor` ends
 * in `?? CONFIG_EN`. An English abbreviation is a correct answer to "what
 * might this citation be" and a wrong one to "what is this book called here":
 * `Song` over a Hungarian book list is not an abbreviation of anything the
 * reader is looking at.
 *
 *  - The language has no table (`hu` today, and every interface language that
 *    is not one of the eleven). Ten of the corpus's twelve content languages
 *    have one, but the Káldi Bible's does not.
 *  - The table has no form for this book. The derived tables are built from
 *    citations, so a book the Catechism never cites is simply absent — 7 books
 *    missing in Italian, 8 in Spanish and French, 11 in German. That is close
 *    to free here: the absent ones are the rarely-cited books, which are also
 *    Ruth, Baruch, Obadiah, Nahum, Habakkuk, Haggai, Philemon and Jude, whose
 *    names are short enough to need no abbreviating.
 *
 * The caller's fallback is therefore the book's own name, which is where it
 * started. `la`, `pt` and `en` answer for all 73.
 */
export function bookAbbrev(osis: string, lang?: string): string | undefined {
	const tag = lang?.toLowerCase().split('-')[0];
	if (!tag || !CONFIGS[tag]) return undefined;
	return abbrevIndexFor(tag).get(osis);
}

// --------------------------------------------------------------------------
// Documents named by TITLE rather than by siglum.
//
// The sigla tables above cover how the ENGLISH Catechism cites magisterial
// documents ("LG 12", "GS 19 # 1"). They do not cover how it cites papal
// documents, which it names by their italicised incipit — "Pius XII, Humani
// generis 561", "Pius XI, encyclical, Casti connubii" — and, far more
// consequentially, they do not cover the PORTUGUESE Catechism at all, which
// spells conciliar documents out in full ("Const. dogm. Dei Verbum, 2")
// rather than abbreviating them. DOCUMENT_SLUGS_EN's docblock records that
// asymmetry as the reason PT resolved no document links whatsoever; this is
// what closes it. Measured against the real corpus: 20 additional links in
// `ccc.en` and 830 in `ccc.pt`, across 12 and 33 distinct documents.
//
// The index is derived from the corpus itself — every document manifest's
// own title — rather than hand-maintained like the sigla tables. There is no
// judgment to encode here (a title either is a work we ingested or it
// isn't), and a hand-written table would silently rot as the Magisterium
// corpus grows past its current 232 works.
//
// TWO EXCLUSIONS, both measured, both failing closed:
//
//   Single-word titles are dropped (24 of 232). Encyclical incipits are
//   Latin, and one-word ones collide with ordinary Latin prose in the very
//   citations being scanned: "Pacem" matched the Roman Missal's "da
//   propitius pacem", "Paternae" matched a hymn's "digitus paternae
//   dexterae", "Mater" matched "Provida Mater" (a different document), and
//   "Mysterium" matched "Mysterium Fidei" (likewise). Each would have been a
//   confidently wrong link into a 232-document corpus, which is worse than
//   no link — the standing rule for DS, CIC, PL and PG. The cost is real and
//   accepted: "Libertas praestantissimum" now goes unlinked because the
//   corpus stores its title as the single word "Libertas".
//
//   Titles mapping to more than one slug are dropped. None do today; this
//   exists so that a future collision degrades to no link rather than to an
//   arbitrary one.

/**
 * Where the ingested documents come from. Injected rather than imported so
 * this module stays corpus-free (see the top of the file): `refs.ts` calls
 * this with `listDocuments` at import time, and anything that only needs the
 * scripture grammar — the xref builder — simply never does, and gets no
 * title-matched `document` segments. Scripture is matched before documents in
 * `parseClause`, so an absent table costs those callers nothing.
 */
let documentTitleSource: () => DocumentTitleGroup[] = () => [];

export interface DocumentTitleGroup {
	slug: string;
	manifests: Record<string, { title: string } | undefined>;
}

export function setDocumentTitleSource(source: () => DocumentTitleGroup[]): void {
	documentTitleSource = source;
	documentTitleIndex = null;
	documentTitleRe = null;
	ingestedSlugSet = null;
}

/** Lazily built so it costs nothing on pages that never parse a citation. */
let documentTitleIndex: Map<string, string> | null = null;
let documentTitleRe: RegExp | null = null;
let ingestedSlugSet: Set<string> | null = null;

/** The slugs the corpus holds — what a siglum's claimed slug is checked against. */
function ingestedSlugs(): Set<string> {
	if (!ingestedSlugSet) {
		ingestedSlugSet = new Set(documentTitleSource().map((group) => group.slug));
	}
	return ingestedSlugSet;
}

function normalizeTitleKey(title: string): string {
	return title.trim().toLowerCase().replace(/\s+/g, ' ');
}

function buildDocumentTitleIndex(): void {
	const slugsByTitle = new Map<string, Set<string>>();
	for (const group of documentTitleSource()) {
		for (const manifest of Object.values(group.manifests)) {
			if (!manifest) continue;
			const key = normalizeTitleKey(manifest.title);
			// Both exclusions, in one place — see the section comment above.
			if (key.split(' ').length < 2) continue;
			let slugs = slugsByTitle.get(key);
			if (!slugs) slugsByTitle.set(key, (slugs = new Set()));
			slugs.add(group.slug);
		}
	}

	const index = new Map<string, string>();
	for (const [key, slugs] of slugsByTitle) {
		if (slugs.size === 1) index.set(key, [...slugs][0]);
	}
	documentTitleIndex = index;

	// Longest first: JS alternation takes the first branch that matches, so
	// without this "Dei Verbum" could lose to a shorter title sharing its
	// opening words. Empty index (fixtures with no documents) yields a regex
	// that can never match rather than an always-matching empty alternation.
	const keys = [...index.keys()].sort((a, b) => b.length - a.length);
	documentTitleRe = keys.length
		? new RegExp(`\\b(${keys.map(escapeRe).join('|')})\\b`, 'gi')
		: /(?!)/g;
}

/**
 * The first document title occurring at or after `pos` in `clause`, with any
 * trailing section number.
 *
 * Unlike the siglum matcher this is a SEARCH rather than an anchored match:
 * a title is preceded by attribution prose of wildly varying shape ("Pius
 * XII, Enc.", "II Concílio do Vaticano, Const. dogm.", "Cf. Leão XIII,"),
 * and enumerating those prefixes in two languages would be a worse-founded
 * guess than trusting the title itself. A multi-word Latin incipit is
 * distinctive enough to carry the match on its own — that is exactly what
 * the single-word exclusion above buys.
 *
 * The trailing number is captured but NOT trusted: `refHref` validates it
 * against the document's real section list, because these numbers are often
 * not section numbers at all ("Humani generis 561" is an AAS page — the
 * document has 44 sections).
 */
function findDocumentTitleAt(
	clause: string,
	pos: number
): {
	slug: string;
	title: string;
	locus: string | null;
	matchStart: number;
	consumedEnd: number;
} | null {
	if (!documentTitleIndex || !documentTitleRe) buildDocumentTitleIndex();
	const index = documentTitleIndex!;
	const re = documentTitleRe!;

	re.lastIndex = pos;
	const m = re.exec(clause);
	if (!m) return null;

	const slug = index.get(normalizeTitleKey(m[0]));
	if (!slug) return null; // case/whitespace variant that didn't round-trip; skip rather than guess

	// Optional separator then digits, e.g. " 2", ", 19", " 48 # 4". Stops at
	// the first number; ranges and lists beyond it stay as plain text, matching
	// how the siglum path treats a locus.
	const tail = /^[\s,.:]*(\d{1,4})/.exec(clause.slice(m.index + m[0].length));
	return {
		slug,
		title: m[0],
		locus: tail ? tail[1] : null,
		matchStart: m.index,
		consumedEnd: m.index + m[0].length + (tail ? tail[0].length : 0)
	};
}

// --------------------------------------------------------------------------
// Low-level number parsing — language-agnostic once the separator is fixed.
// --------------------------------------------------------------------------

/**
 * A leading run of digits, with an optional single trailing subdivision
 * letter ("3a" -> 3, letter dropped).
 *
 * A lowercase "l" standing in for the digit "1" is accepted when a digit
 * follows it ("l2" -> 12, "l0" -> 10). This is the same 1/l confusion
 * `numberedVariants`' `lTypo` option already folds into the EN book table
 * ("l Cor", "l Pt"), observed inside a locus rather than before a book name:
 * ccc.pt cites "Act 4, l2" where EN has Acts 4:12, and "Heb 5, l0" where EN
 * has Heb 5:10. The digit lookahead is what keeps it safe -- a bare "l" is
 * still a letter, so no ordinary word can be read as a number.
 */
const LEAD_NUM_RE = /^(?:l(?=\d)|\d)\d*[a-zA-Z]?/;

/** `LEAD_NUM_RE`'s match as a number, with a leading "l" read as the "1" it stands for. */
function leadNum(match: string): number {
	return Number(match.replace(/[a-zA-Z]+$/, '').replace(/^l/, '1'));
}

/**
 * Parse a verse list from the start of `s` (no leading separator expected —
 * any leading spaces are consumed as part of the parse). Handles ranges
 * ("12-13", "12–13"), comma/dot-chained additional verses ("15, 33",
 * "16.21"), and verse-subdivision letters ("3a" -> 3). Returns
 * (sorted deduplicated verses, chars consumed).
 *
 * A leading space is skipped, which the long-gone Python parser did not do.
 * Needed so PT's "Act 2, 42" — a space after the primary chapter/verse
 * separator is the norm there, not a typo — parses at all; it also fixes a
 * real EN transcription pattern, a stray space after the colon ("Dt 28: 10",
 * "Ex 33: 12-17", "Gen 21: 17"), which the Python recorded as a whole-chapter
 * ref when the citation actually named a verse. That divergence is what
 * settled which of the two parsers should survive: they agreed on 98.4% of
 * CCC paragraphs, and every disagreement traced to this case, with this one
 * correct each time.
 */
function parseVerseList(s: string, primarySep: string): { verses: number[]; consumed: number } {
	const lead = /^ */.exec(s)![0];
	let pos = lead.length;
	const verses: number[] = [];
	while (true) {
		const m = LEAD_NUM_RE.exec(s.slice(pos));
		if (!m) break;
		const start = leadNum(m[0]);
		pos += m[0].length;
		if (s[pos] === '-' || s[pos] === '–' || s[pos] === '‑') {
			const m2 = LEAD_NUM_RE.exec(s.slice(pos + 1));
			// A ":" right after the range's far end means the range crosses
			// chapters ("Isa 52:13-53:12"): "53" is the second chapter, not a
			// verse of the first, and expanding 13..53 would invent 41 verses
			// of a 15-verse chapter. `RefSegment` holds one chapter, so link
			// the range's opening verse and leave the rest as text — the
			// under-link this module prefers over a wrong link.
			//
			// EN only, keyed off ":" being ITS primary separator. Every mark
			// PT could use here is load-bearing twice over — its "," and "."
			// both also chain the next verse of a list ("Rm 11, 17-18. 24"),
			// and its ":" is a clause separator ("Mt 5, 29-30: 16. 24") — so
			// there is no PT mark that identifies a chapter crossing without
			// misreading commoner shapes. PT's one cross-chapter range
			// ("Ap 21, 1-22, 5") keeps its existing over-expansion rather
			// than trading it for a wide regression.
			const crossesChapters =
				m2 !== null && primarySep === ':' && s[pos + 1 + m2[0].length] === ':';
			if (m2 && !crossesChapters) {
				const end = leadNum(m2[0]);
				pos += 1 + m2[0].length;
				for (let v = start; v <= end; v++) verses.push(v);
			} else if (crossesChapters) {
				verses.push(start);
				break;
			} else {
				verses.push(start);
			}
		} else {
			verses.push(start);
		}
		if (s[pos] === ',' || s[pos] === '.') {
			const look = s.slice(pos + 1);
			const stripped = look.replace(/^ +/, '');
			if (/^\d/.test(stripped)) {
				pos += 1 + (look.length - stripped.length);
				continue;
			}
		}
		break;
	}
	return { verses: [...new Set(verses)].sort((a, b) => a - b), consumed: pos };
}

/**
 * A chapter written as a Roman numeral, read strictly — no OCR tolerance,
 * unlike `romanToInt`'s reading of `l` as `I`, because here a stray letter is
 * far more likely to be a word than a damaged numeral.
 */
function strictRomanToInt(token: string): number | null {
	if (!/^[IVXLC]+$/.test(token)) return null;
	return romanToInt(token);
}

/** No chapter of any book runs past Psalm 118's 176 verses. A "verse" beyond
 *  that after a Roman-numeral chapter is a year or a page — "John XXIII,
 *  1962" — and the guard that keeps a pope from becoming a Gospel. */
const MAX_VERSE = 176;

/**
 * Parse "chapter<sep>verselist" or a bare "chapter" (whole-chapter) from the
 * start of `s`.
 *
 * `romanChapters` admits a Roman-numeral chapter ("Matth. IX, 37-38", "I Cor.
 * VI, 20") — the pre-conciliar encyclicals' convention, ~100 citations that
 * parsed as nothing. Only the CITATION grammar turns it on; running prose
 * keeps digits-only, where "John XXIII" is a pope far more often than a
 * chapter. Even in a citation a Roman chapter is accepted only with an
 * explicit verse after it, and only a verse-sized one (`MAX_VERSE`): a bare
 * "John XXIII" or "John XXIII, 1962" is not a reference, and a whole-chapter
 * reading of it would be a confidently wrong link.
 */
function parseChapterVerses(
	s: string,
	cfg: LangConfig,
	romanChapters = false
): { chapter: number | null; verses: number[]; consumed: number } {
	const none = { chapter: null, verses: [], consumed: 0 };
	let chapter: number | null = null;
	let pos = 0;
	let roman = false;
	const m = /^(\d+)/.exec(s);
	if (m) {
		chapter = Number(m[1]);
		pos = m[0].length;
	} else if (romanChapters) {
		const rm = /^[IVXLC]{1,7}(?![\p{L}])/u.exec(s);
		const value = rm ? strictRomanToInt(rm[0]) : null;
		if (rm && value !== null) {
			chapter = value;
			pos = rm[0].length;
			roman = true;
		}
	}
	if (chapter === null) return none;
	const rest = s.slice(pos);
	// A space before the separator ("Rm 8 , 15", "Mt 28 , 19") is a spacing
	// defect in the PT archive, not a different locator: 9 ccc.pt citations
	// print one, and without this each links as a whole-chapter reference
	// with its verse left dangling as plain text. An EXPLICIT separator still
	// has to follow, so this never competes with `allowBareSeparators`'
	// space-as-separator reading below.
	const gap = /^ */.exec(rest)![0];
	const afterGap = rest.slice(gap.length);
	if (afterGap[0] === cfg.primarySep || cfg.extraChapterVerseSeparators.includes(afterGap[0])) {
		const { verses, consumed } = parseVerseList(afterGap.slice(1), cfg.primarySep);
		// A separator with no verse after it is punctuation, not a locator:
		// the "." ending "Cf. Ez 36." is the sentence's full stop, and
		// consuming it would pull the period inside the rendered link.
		if (verses.length > 0) {
			if (roman && verses[0] > MAX_VERSE) return none;
			return { chapter, verses, consumed: pos + gap.length + 1 + consumed };
		}
	}
	if (cfg.allowBareSeparators && (rest[0] === '.' || rest[0] === ' ') && /\d/.test(rest[1] ?? '')) {
		const { verses, consumed } = parseVerseList(rest.slice(1), cfg.primarySep);
		if (roman && verses[0] > MAX_VERSE) return none;
		return { chapter, verses, consumed: pos + 1 + consumed };
	}
	if (roman) return none; // a Roman chapter never stands alone — see the docblock
	return { chapter, verses: [], consumed: pos };
}

/**
 * Single-chapter books (SINGLE_CHAPTER_BOOKS) are cited "Book <verse>", no
 * chapter number — so a bare leading number is a *verse*, not a chapter.
 * Tolerates a redundant explicit "1<sep>" prefix if the source gives one.
 */
function parseSingleChapterRef(
	s: string,
	cfg: LangConfig
): { chapter: number | null; verses: number[]; consumed: number } {
	if (!/^\d/.test(s)) return { chapter: null, verses: [], consumed: 0 };
	const redundantPrefix = '1' + cfg.primarySep;
	const body = s.startsWith(redundantPrefix) ? s.slice(redundantPrefix.length) : s;
	const prefixLen = s.startsWith(redundantPrefix) ? redundantPrefix.length : 0;
	const { verses, consumed } = parseVerseList(body, cfg.primarySep);
	if (verses.length === 0) return { chapter: null, verses: [], consumed: 0 };
	return { chapter: 1, verses, consumed: prefixLen + consumed };
}

function parseRefNumbers(
	s: string,
	cfg: LangConfig,
	osis: string,
	romanChapters = false
): { chapter: number | null; verses: number[]; consumed: number } {
	// A mark between the book abbreviation and its locus separates those two,
	// not the locus's chapter from its verse, so discard it before the normal
	// grammar runs. PT's archive writes a comma ("1 Cor, 13, 12") or a stray
	// period ("Fl . 3, 8"); the abbreviating full stop ("Lk. 1:28", "Matt. 16,
	// 18", "Hebr. 4,12") is the ordinary typographic form in the older
	// translations of BOTH languages, and accounts for ~200 English references
	// that otherwise fail to resolve at all.
	//
	// The comma is accepted only where "," is not itself the chapter/verse
	// separator: in English "Rom, 5" would be indistinguishable from a locus.
	const bookPunctuation =
		(cfg.primarySep === ',' ? /^(?:,\s*|\.\s*)/.exec(s)?.[0] : /^\.\s*/.exec(s)?.[0]) ?? '';
	const body = s.slice(bookPunctuation.length);
	const parsed = SINGLE_CHAPTER_BOOKS.has(osis)
		? parseSingleChapterRef(body, cfg)
		: parseChapterVerses(body, cfg, romanChapters);
	return { ...parsed, consumed: parsed.consumed + bookPunctuation.length };
}

// --------------------------------------------------------------------------
// Book / document sigla search.
// --------------------------------------------------------------------------

interface BookMatch {
	osis: string;
	matchStart: number;
	matchEnd: number;
}

/** Search (not anchor) `s` for a recognized book, starting at `start` — a stray prefix before the real match doesn't block it. */
function findBookAt(cfg: LangConfig, s: string, start: number): BookMatch | null {
	cfg.bookRe.lastIndex = start;
	const m = cfg.bookRe.exec(s);
	if (!m) return null;
	return {
		osis: cfg.variantToOsis.get(m[0])!,
		matchStart: m.index,
		matchEnd: m.index + m[0].length
	};
}

interface DocumentMatch {
	sigla: string;
	matchStart: number;
	consumedEnd: number;
	locus: string | null;
	slug: string | null;
}

/** A locus is digits, comma/dot-chained and dash-ranged, plus an optional "# N" subsection — display-only text, not parsed further (document segments never resolve to a link). */
const LOCUS_RE = new RegExp(
	`^\\d+(?:\\s*[${DASHES}]\\s*\\d+)?(?:\\s*[,.]\\s*\\d+(?:\\s*[${DASHES}]\\s*\\d+)?)*(?:\\s*#\\s*\\d+)?`
);

function findDocumentAt(cfg: LangConfig, s: string, start: number): DocumentMatch | null {
	cfg.documentRe.lastIndex = start;
	const m = cfg.documentRe.exec(s);
	if (!m) return null;
	const after = s.slice(m.index + m[0].length);
	// "Pius PP. X", "Benedictus PP. XV": the papal style, not Populorum
	// Progressio. A siglum followed by a full stop and a Roman numeral is a
	// title, and this is the one siglum that collides with one.
	if (/^\.\s*[IVXL]+(?![\p{L}])/u.test(after)) return null;
	const spaceSkip = /^ */.exec(after)![0];
	const locusMatch = LOCUS_RE.exec(after.slice(spaceSkip.length));
	const locus = locusMatch ? locusMatch[0] : null;
	const consumedEnd =
		m.index + m[0].length + (locusMatch ? spaceSkip.length + locusMatch[0].length : 0);
	const entry = cfg.documentSigla.get(m[0]);
	// Validated against what the corpus actually holds, never trusted from
	// the table — see the sigla section comment.
	const slug = cfg.linksSigla && entry?.slug && ingestedSlugs().has(entry.slug) ? entry.slug : null;
	return {
		sigla: m[0],
		matchStart: m.index,
		consumedEnd,
		locus,
		slug
	};
}

// --------------------------------------------------------------------------
// The Catechism and its Compendium named as WORKS — "Catechism of the
// Catholic Church, 1939", "Catecismo da Igreja Católica, nn. 2258-2262",
// "CCC 1234". The encyclicals cite the Catechism this way constantly (80
// citations, measured 2026-08-25) and none of them linked: a `ccc` segment
// only ever came out of a bare number list. Same shape as a document siglum
// with a locus, except that the locus is a paragraph list in a fixed range
// the grammar already knows, so the segments are the same `ccc`/`compendium`
// kinds `parseBareCccList` produces and `refHref` needs no corpus to link.
//
// The Compendium's title CONTAINS the Catechism's, so it is listed first and
// the alternation is tried in order. "CEC" is Portuguese usage; "CIC" is not
// accepted for the Catechism in either language because the PT sigla table
// reads it as the Codex Iuris Canonici, and one grammar must not read one
// siglum two ways (the jump box makes the same choice, `refparse.ts`).
// --------------------------------------------------------------------------

const WORK_TITLE_RE = new RegExp(
	LEFT_BOUND +
		'(?:(Compendium of the Catechism of the Catholic Church|Comp[êe]ndio do Catecismo da Igreja Cat[óo]lica)' +
		'|(Catechism of the Catholic Church|Catecismo da Igreja Cat[óo]lica|Catechismus Catholicae Ecclesiae|CCC|CEC))' +
		RIGHT_BOUND,
	'gu'
);
/** A paragraph list after a work title: "1939", "nn. 2258-2262", ", 1888, 1891". */
const WORK_LOCUS_RE = new RegExp(
	`^[\\s,.:]*(?:nn?\\.?\\s*|n[.º°]\\s*)?(\\d+(?:\\s*[${DASHES}]\\s*\\d+)?(?:\\s*,\\s*\\d+(?:\\s*[${DASHES}]\\s*\\d+)?)*)`
);
const MAX_CCC = 2865;
const MAX_COMPENDIUM = 598;

interface WorkTitleMatch {
	kind: 'ccc' | 'compendium';
	matchStart: number;
	consumedEnd: number;
	/** Where the number list starts, so the title itself can stay text. */
	locusStart: number;
	locus: string;
}

function findWorkTitleAt(clause: string, pos: number): WorkTitleMatch | null {
	WORK_TITLE_RE.lastIndex = pos;
	let m: RegExpExecArray | null;
	while ((m = WORK_TITLE_RE.exec(clause))) {
		const kind = m[1] ? 'compendium' : 'ccc';
		const after = m.index + m[0].length;
		const locus = WORK_LOCUS_RE.exec(clause.slice(after));
		if (!locus) continue; // the work named in passing, no paragraph to point at
		// Every number must be a paragraph the work has. "Catechism of the
		// Catholic Church, 1994" is the year of publication, and a page or
		// year would link to a paragraph that merely happens to exist.
		const max = kind === 'ccc' ? MAX_CCC : MAX_COMPENDIUM;
		const numbers = locus[1].match(/\d+/g) ?? [];
		if (numbers.some((n) => Number(n) < 1 || Number(n) > max)) continue;
		return {
			kind,
			matchStart: m.index,
			consumedEnd: after + locus[0].length,
			locusStart: after + locus[0].length - locus[1].length,
			locus: locus[1]
		};
	}
	return null;
}

/**
 * True when a book name is the OBJECT OF A LATIN COMMENTARY TITLE rather than
 * a reference — "St. Gregory the Great, Moralia in Job, 31, 45", "Origenes,
 * In Mt. 16, 21", "S. Aug. in Ps 32". Those name a Father's commentary ON a
 * book, and the numbers after them are the commentary's own divisions, so
 * reading them as chapter and verse invents a citation the text never made
 * (it put "Job 31 is cited in the Catechism" into the cross-reference index,
 * where it is simply false).
 *
 * Derived from the corpus, not guessed: scanning every citation in all 347
 * works for a scripture match directly preceded by "in" turns up ten, of
 * which nine are commentary titles and one — "Is 7:14 (LXX), quoted in
 * Mt 1:23" — is a real reference in English prose. The three shapes below
 * separate them exactly: a capitalised "In" (4 cases, always Latin), an
 * abbreviation's full stop before a lowercase "in" (1, "S. Aug. in"), and the
 * literal title word "Moralia" (4). Ordinary English "quoted in" matches none
 * of them and keeps its link. Same posture as the `Cat Rom` exclusion in
 * `BOOK_VARIANTS_PT`: a narrow, evidence-backed block on a form the corpus
 * demonstrably uses for something else.
 */
const COMMENTARY_TITLE_RE =
	/(?:\bIn|\.\s*in|\bMoralia\s+in|\b(?:Hist|Expos|Expl|Comm|Tract|Adv)\.|\b(?:interpretation|Commentary|Commentaries|Homilies|Homily|Tractates?|Expositions?|Sermons?)\s+(?:on|of)|\bComent[áa]rios?\b[^.;:]{0,40})\s*$/;
// "Adv." joined the abbreviated genres when the prose scan reached the
// Portuguese council documents: "Tertuliano, Adv. Marc. 3, 7" is Adversus
// Marcionem, and "Adv. Haer." Adversus haereses — a work AGAINST a person,
// wearing a book's abbreviation.
//
// "Comentário" is the same rule in Portuguese, and needs a window rather than
// an adjacency because the title names the book at a distance: "Comentário ao
// Evangelho de João, XII, 20" and "Comentário aos Salmos, 85,5" are Cyril and
// Augustine, not John 12 and Psalm 85. Bounded at 40 characters and stopped
// by any sentence punctuation, so it cannot reach out of its own title.
// The English commentary titles at the end ("On the literal interpretation
// of Genesis XI, 15.20") are the Latin ones in translation, found by the same
// measurement.
// The abbreviated genres joined above ("Hist. Eccl. V, 23", "Expos. Lc. II,
// 7", "Expl. Ps. I, 33") surfaced when Roman-numeral chapters began to parse:
// each is a work ABOUT the book, or merely sharing its abbreviation
// (Eusebius's Historia Ecclesiastica is not Ecclesiastes), and each produced
// a plausible chapter-and-verse into the wrong book. Same evidence standard as
// the rest of the pattern — every form listed was seen doing exactly that.

/**
 * "Cat Rom"/"CatRom" is the Catechismus Romanus, and its locus is shaped
 * exactly like a chapter and verse ("CatRom 1, 10, 24"). The Portuguese book
 * table used to drop "Rom" entirely to avoid mislinking that as the Letter to
 * the Romans — at the cost of every real reference to Romans in the older
 * encyclical translations, which spell the book out that way. Blocking the
 * prefix instead keeps both: all 25 occurrences of the Roman Catechism in the
 * corpus are spelled "Cat"/"Cat." immediately before, and none of them occur
 * in running prose at all.
 */
const ROMAN_CATECHISM_RE = /\bCat\.?\s*$/;

/** A book match that is really part of a longer title — see the two patterns above. */
function precededByFalseLead(prefix: string, osis: string): boolean {
	if (COMMENTARY_TITLE_RE.test(prefix)) return true;
	return osis === 'rom' && ROMAN_CATECHISM_RE.test(prefix);
}

/** True if a "cf."/"Cf." token sits directly before `pos` — the fallback for `Cf.` appearing mid-clause rather than at its start. */
function precededByCf(prefix: string): boolean {
	return /\bcf\.?\s*$/i.test(prefix);
}

function textSeg(text: string): RefSegment {
	return { kind: 'text', text };
}

function mergeText(segs: RefSegment[]): RefSegment[] {
	const out: RefSegment[] = [];
	for (const s of segs) {
		if (s.kind === 'text') {
			if (s.text === '') continue;
			const last = out[out.length - 1];
			if (last?.kind === 'text') {
				last.text += s.text;
				continue;
			}
		}
		out.push(s);
	}
	return out;
}

// --------------------------------------------------------------------------
// Citation-clause grammar (CCC footnotes, DV/LG-style document refs).
// --------------------------------------------------------------------------

interface ClauseState {
	currentBook: string | null;
	currentCf: boolean;
}

/**
 * Parse one clause into segments that reproduce the clause's exact original text
 * with any recognized reference woven in as a non-text segment.
 */
function parseClause(rawClause: string, cfg: LangConfig, state: ClauseState): RefSegment[] {
	if (rawClause === '') return [];

	const cfMatch = /^(\s*)((?:Cf|cf)\.?\s*)/.exec(rawClause);
	const pos = cfMatch ? cfMatch[0].length : 0;
	const clauseCf = Boolean(cfMatch);

	// 1. Scripture book search, retrying past a book-shaped false lead (e.g.
	//    "Ad Eph." with no chapter after it).
	let searchPos = pos;
	while (true) {
		const bm = findBookAt(cfg, rawClause, searchPos);
		if (!bm) break;
		const spaceAfter = /^ */.exec(rawClause.slice(bm.matchEnd))![0];
		const afterBook = bm.matchEnd + spaceAfter.length;
		const cv = parseRefNumbers(rawClause.slice(afterBook), cfg, bm.osis, true);
		if (cv.chapter === null) {
			searchPos = bm.matchEnd; // book-shaped, but nothing ref-shaped follows it
			continue;
		}
		if (precededByFalseLead(rawClause.slice(0, bm.matchStart), bm.osis)) {
			searchPos = bm.matchEnd; // a Father's commentary ON the book, not a reference
			continue;
		}
		if (cv.chapter > MAX_CHAPTER[bm.osis]) {
			searchPos = bm.matchEnd; // implausible: almost always a dropped-colon typo, not guessed at
			continue;
		}
		const consumedEnd = afterBook + cv.consumed;
		const cf = clauseCf || precededByCf(rawClause.slice(0, bm.matchStart));
		const segs: RefSegment[] = [];
		if (bm.matchStart > 0) segs.push(textSeg(rawClause.slice(0, bm.matchStart)));
		segs.push({
			kind: 'scripture',
			osis: bm.osis,
			chapter: cv.chapter,
			verses: cv.verses,
			...(cf ? { cf: true as const } : {}),
			raw: rawClause.slice(bm.matchStart, consumedEnd)
		});
		state.currentBook = bm.osis;
		state.currentCf = cf;
		// Keep scanning the REST of this clause rather than dropping it to
		// text: PT's archive drifts between ";" and "," as the mark between
		// two references, so one comma-joined clause can carry two of them
		// ("Heb 10, 5-7, citando o Sl 40. 7-9, segundo os LXX" — Ps 40 is a
		// second real reference, not prose). Recursion always consumes at
		// least the matched book, so it terminates.
		if (consumedEnd < rawClause.length) {
			segs.push(...parseClause(rawClause.slice(consumedEnd), cfg, state));
		}
		return segs;
	}

	// 2. Bookless continuation of the previously established book — requires
	//    an actual verse component (a bare chapter-shaped number is too
	//    ambiguous to attach to the running book — a known, accepted
	//    under-linking gap).
	if (state.currentBook) {
		const leadSpace = /^ */.exec(rawClause.slice(pos))![0];
		const digitsStart = pos + leadSpace.length;
		if (/^\d/.test(rawClause.slice(digitsStart))) {
			const cv = parseRefNumbers(rawClause.slice(digitsStart), cfg, state.currentBook);
			if (
				cv.chapter !== null &&
				cv.verses.length > 0 &&
				cv.chapter <= MAX_CHAPTER[state.currentBook]
			) {
				const consumedEnd = digitsStart + cv.consumed;
				const cf = clauseCf || state.currentCf;
				const segs: RefSegment[] = [];
				if (digitsStart > 0) segs.push(textSeg(rawClause.slice(0, digitsStart)));
				segs.push({
					kind: 'scripture',
					osis: state.currentBook,
					chapter: cv.chapter,
					verses: cv.verses,
					...(cf ? { cf: true as const } : {}),
					raw: rawClause.slice(digitsStart, consumedEnd)
				});
				if (consumedEnd < rawClause.length) {
					segs.push(...parseClause(rawClause.slice(consumedEnd), cfg, state));
				}
				return segs;
			}
		}
	}

	// 3. A document, named either by siglum or by title — WHICHEVER COMES
	//    FIRST in the clause.
	//
	//    Both matchers search rather than anchor, so "leftmost wins" is the
	//    only ordering that doesn't let one shadow the other by accident. It
	//    is not a hypothetical: nearly every Portuguese citation ends in an
	//    "AAS 58 (1966) 818" volume reference, and AAS is a recognized (but
	//    never linkable, `slug: null`) siglum. Trying sigla first meant that
	//    trailing AAS beat the spelled-out "Const. dogm. Dei Verbum, 2"
	//    earlier in the same clause, so the segment that CAN link lost to one
	//    that never can — silently, and for most of the PT corpus.
	//
	//    Ties go to the siglum: at the same offset it is the more precise
	//    match, and a title only reaches that offset by being a prefix of it.
	//    The Summa joins the same leftmost-wins race, and needs to: a
	//    Portuguese Summa citation ends in `Ed. Leon. 8, 11`, an edition
	//    reference, and the English ones often sit in a clause that also names
	//    a document ("...DS 3005; DV 6; St. Thomas Aquinas, S Th I, I, I").
	//    Whichever starts earliest is the one the clause is actually about.
	const dm = findDocumentAt(cfg, rawClause, pos);
	const tm = findDocumentTitleAt(rawClause, pos);
	const sm = findSummaAt(rawClause, pos);
	const wm = findWorkTitleAt(rawClause, pos);
	const earliest = Math.min(...[dm, tm, sm, wm].filter((x) => x !== null).map((x) => x.matchStart));
	if (wm !== null && wm.matchStart === earliest) {
		// The Catechism or Compendium by name: the title stays text, each
		// paragraph number links, as a bare number list would.
		const segs: RefSegment[] = [];
		if (wm.locusStart > 0) segs.push(textSeg(rawClause.slice(0, wm.locusStart)));
		segs.push(...parseBareCccList(wm.locus, wm.kind));
		if (wm.consumedEnd < rawClause.length) segs.push(textSeg(rawClause.slice(wm.consumedEnd)));
		return segs;
	}
	if (
		sm !== null &&
		(dm === null || sm.matchStart < dm.matchStart) &&
		(tm === null || sm.matchStart < tm.matchStart)
	) {
		const segs: RefSegment[] = [];
		if (sm.matchStart > 0) segs.push(textSeg(rawClause.slice(0, sm.matchStart)));
		segs.push({
			kind: 'summa',
			part: sm.part,
			question: sm.question,
			article: sm.article,
			raw: rawClause.slice(sm.matchStart, sm.consumedEnd)
		});
		if (sm.consumedEnd < rawClause.length) segs.push(textSeg(rawClause.slice(sm.consumedEnd)));
		return segs;
	}
	const useTitle = tm !== null && (dm === null || tm.matchStart < dm.matchStart);

	if (useTitle) {
		const segs: RefSegment[] = [];
		if (tm.matchStart > 0) segs.push(textSeg(rawClause.slice(0, tm.matchStart)));
		segs.push({
			kind: 'document',
			via: 'title',
			label: tm.title,
			locus: tm.locus,
			expansion: null,
			slug: tm.slug,
			raw: rawClause.slice(tm.matchStart, tm.consumedEnd)
		});
		if (tm.consumedEnd < rawClause.length) segs.push(textSeg(rawClause.slice(tm.consumedEnd)));
		return segs;
	}

	if (dm) {
		const segs: RefSegment[] = [];
		if (dm.matchStart > 0) segs.push(textSeg(rawClause.slice(0, dm.matchStart)));
		segs.push({
			kind: 'document',
			via: 'siglum',
			label: dm.sigla,
			locus: dm.locus,
			expansion: cfg.documentSigla.get(dm.sigla)?.expansion ?? null,
			slug: dm.slug,
			raw: rawClause.slice(dm.matchStart, dm.consumedEnd)
		});
		if (dm.consumedEnd < rawClause.length) segs.push(textSeg(rawClause.slice(dm.consumedEnd)));
		return segs;
	}

	// 4. Nothing recognized (patristic titles, canon-law prose, editorial
	//    apparatus, ...) — kept verbatim, per the under-link-don't-guess rule.
	return [textSeg(rawClause)];
}

function parseCitationClauses(text: string, cfg: LangConfig): RefSegment[] {
	const state: ClauseState = { currentBook: null, currentCf: false };
	const segs: RefSegment[] = [];
	// Splitting with a capturing group keeps every ";" as its own array
	// element, so no character of the original string is ever dropped.
	for (const part of text.split(cfg.clauseSepRe)) {
		if (part.length === 1 && cfg.clauseSepRe.test(part)) segs.push(textSeg(part));
		else segs.push(...parseClause(part, cfg, state));
	}
	return mergeText(segs);
}

// --------------------------------------------------------------------------
// Bare CCC-paragraph-number lists: the Compendium's `ccc_refs`
// ("279-289, 296-298") and a stringified CCC `related` list. Neither ever
// carries book letters, so `parseRefs` tells this grammar apart from the
// citation-clause grammar up front (see the module docblock) rather than
// threading a mode flag through `parseClause`.
//
// A range's two ends each become their own `ccc` segment with the
// separator kept as literal text between them, rather than expanding every
// paragraph number in between (unlike a scripture verse range, `RefSegment`
// gives a CCC ref no array field to hold an expansion into — and a compendium
// question can legitimately span dozens of paragraphs, where a link per
// paragraph would be a link wall, not a citation).
// --------------------------------------------------------------------------

function isBareNumberList(text: string): boolean {
	return new RegExp(`^[\\d\\s,.;${DASHES}]+$`).test(text) && /\d/.test(text);
}

function parseBareCccList(text: string, kind: 'ccc' | 'compendium' = 'ccc'): RefSegment[] {
	const segs: RefSegment[] = [];
	const re = /\d+/g;
	let last = 0;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) {
		if (m.index > last) segs.push(textSeg(text.slice(last, m.index)));
		segs.push({ kind, n: Number(m[0]), raw: m[0] });
		last = m.index + m[0].length;
	}
	if (last < text.length) segs.push(textSeg(text.slice(last)));
	return mergeText(segs);
}

// --------------------------------------------------------------------------
// `Ibid.` — a citation that names no work because the one before it did
//
// 1,243 of the corpus's 22,693 citation strings open with an ibidem word,
// and every one of them is a citation that reads as nothing: the grammar
// parses one string at a time, and "Ibid., 14." carries no work to resolve.
// What it
// carries is an ABBREVIATION, and the expansion is the previous citation's
// work — so `expandIbidem` writes that work back into the string and hands
// the result to `parseRefs`, which then reads the locus, the range, the "#"
// subsection and the rest of the citation by the rules it already has. One
// grammar (this file's whole premise), and the expanded string is the exact
// shape it reads everywhere else.
//
// SUPPLYING THE PREVIOUS CITATION IS THE CALLER'S JOB, and deliberately so:
// which citation precedes this one is a fact about a document's apparatus,
// not about a string, and the caller is the only one who knows whether the
// two are really adjacent (`build-xrefs.mjs` requires consecutive footnote
// numbers before it will believe they are).
//
// ONE TABLE FOR EVERY LANGUAGE, not a `LangConfig` field. Two reasons. The
// forms are a Latin loanword everywhere but German, so the table is nearly
// the same list six times over; and `configFor` collapses to EN or PT, so
// the Spanish, French, Italian and German editions that print `Ibíd.`,
// `ibid.` and `Ebd.` would all be reading the English config anyway. Every
// form here was counted in the corpus (2026-08-25) — nothing is here on the
// strength of a dictionary, and `Ivi`, which an Italian apparatus may print,
// is absent because this one never does.
//
// `IDEM`/`ID.` IS NOT AN IBIDEM WORD and is deliberately absent. It means
// the same AUTHOR, not the same work, and what follows it is a different
// title — "Id., Homilia III in Dormitionem Ssmae Deiparae" after a citation
// of St Germanus's In Praesentationem. Of the corpus's 299, all but one name
// a new work that way; expanding them would file a citation the source never
// made, which is the failure this module's docblock rules out. The single
// bare `Idem.` is left unread with them, at a cost of one.
// --------------------------------------------------------------------------

/**
 * A citation opening with an ibidem word, with the word itself captured.
 *
 * Anchored at the start, because an `ib.` in the middle of a citation refers
 * back to a work that citation already named ("Gasser, ib.") and not to the
 * previous note. The optional prefix is what the corpus actually prints in
 * front of one: a stray full stop left by the source's own typesetting, a
 * "cf." in five spellings across four languages, or both.
 */
const IBIDEM_RE =
	/^[\s.]*((?:cfr?|vgl|see|vd)[.,]?\s+)?(?:ibidem|ib[íi]dem|ibid|ib[íi]d|ebenda|ebd|ib)(?![\p{L}])\.?/iu;

/**
 * Rewrite an `Ibid.` citation as though it had named its work in full.
 *
 * `label` is the work the previous citation named — a siglum as printed
 * ("LG") or a manifest title ("Gaudium et spes"), i.e. exactly what a
 * `document` segment carries in its own `label`, so the rewritten string is
 * guaranteed to parse back to the same document. Returns `null` when the
 * citation does not open with an ibidem word, which is the caller's signal
 * that there is nothing to expand.
 *
 * The punctuation between the word and what follows it is DROPPED rather
 * than kept, and that is load-bearing: "Ibid., 14." must become "LG 14" and
 * not "LG, 14", because the siglum path reads a locus only when digits
 * follow the siglum directly (`LOCUS_RE`). Kept, the comma would make the
 * locus unreadable and the citation would silently inherit the previous
 * note's section — a wrong link where there had merely been no link.
 *
 * What follows an ibidem word is often not a locus at all ("Ibid.: AAS 20
 * (1928), 172.", "Ibid., p. 618."), and nothing here pretends otherwise: the
 * expansion is handed to the same parser as any other citation, and a
 * volume or page number does not look like a section to it either.
 */
export function expandIbidem(text: string, label: string): string | null {
	const m = IBIDEM_RE.exec(text);
	if (!m) return null;
	const rest = text.slice(m[0].length).replace(/^[\s.,:;]*/, '');
	return (m[1] ?? '') + label + (rest ? ' ' + rest : '');
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

/**
 * Parse a raw reference string into segments that reproduce it exactly with
 * any recognized reference woven in. Handles both grammars this file knows:
 * a `;`-delimited citation (CCC footnotes, DV/LG-style document refs) and a
 * bare CCC-paragraph-number list (Compendium `ccc_refs`, a stringified CCC
 * `related`).
 */
/**
 * A citation string with the source's loose typesetting spacing tidied —
 * NOT a rewrite of the citation, only of the whitespace around it.
 *
 * Every mirror the corpus is built from carries the same defect class, and it
 * is not rare: 367 of ccc.pt's 1,255 inline locators and 387 of its 3,601
 * footnote strings print a stray space, and the Vatican II and encyclical
 * pages do the same. It shows up as a space after "(" or before ")"
 * ("( Sl 105, 3)", "(2 Cor 5, 17 )"), a space before a comma or period
 * ("Mc 1 , 11", "Cf . Lc 1, 38", "Catechesi tradendae , 1"), or a doubled
 * space mid-string. All three read as typography errors rather than as
 * anything the citation means.
 *
 * Applied at RENDER time, by `RefText.svelte`, not stored: `corpus/raw/` and
 * the parsed corpus both keep exactly what the page prints, per
 * `docs/link-surface.md`'s "the corpus stores raw strings, never
 * interpretations". This is the presentation layer deciding presentation, and
 * it is deliberately whitespace-only — no mark is added, removed or replaced,
 * so a citation that says something wrong still says it, and the fix stays
 * safe to apply blind to every work in the corpus.
 */
export function normalizeCitationSpacing(text: string): string {
	return text
		.replace(/\s+/g, ' ')
		.replace(/\(\s+/g, '(')
		.replace(/\s+\)/g, ')')
		.replace(/\s+([,.;:])/g, '$1')
		.trim();
}

export function parseRefs(text: string, opts?: RefsOpts): RefSegment[] {
	if (!text) return [];
	if (isBareNumberList(text)) return parseBareCccList(text);
	return parseCitationClauses(text, configFor(opts?.lang, opts?.work));
}

/**
 * Which characters of `text` sit inside a parenthesis or a square bracket.
 *
 * The one guard that makes a two-letter siglum safe in running prose (see
 * `linkifyProse`'s scan 3), and it is not a stylistic hunch: of the 3,712
 * siglum-shaped tokens the Catechism's German, Spanish, French and English
 * editions print in their PROSE, 3,708 are inside a bracket of one of these
 * two kinds — "(GS 19,1)", "[Vgl. LG 20.]", "(cf. LG 20)". The four that are
 * not are all a source defect of the same shape, an opening bracket lost in
 * the mirror's markup ("...beten Vgl. UR 8;22]."), so requiring the bracket
 * costs four references and buys a hard stop on every capitalised
 * abbreviation the running text of 383 works happens to contain.
 *
 * An unmatched closer is clamped rather than treated as an error: these
 * pages drop brackets, and a stray ")" must not make the whole rest of a
 * paragraph read as "outside".
 */
/**
 * The one siglum-and-locus shape that means something else in this corpus's
 * running prose, blocked the same narrow, measured way `precededByFalseLead`
 * blocks a commentary title.
 *
 * "(AA 1,2)" in the English Summa is ARTICLES 1 and 2 of the question being
 * read — CCEL doubles the letter to pluralise, exactly as "nn." pluralises
 * "n." — and not Apostolicam actuositatem. It normally anchors those itself
 * ("AA<a data-ref="summa:I:13:1">[1]</a>,2", 300+ times, which
 * `parseStoredRef` reads and this scan never sees); three it forgot to, and
 * those three are the only false hits a prose siglum scan produces anywhere
 * in the corpus's 383 works.
 *
 * The discriminator is the locus, and it is not a coincidence of these three:
 * a conciliar decree cited in prose points at ONE section, and all 42 real
 * uses of "AA" across the German, Spanish, French and English Catechisms are
 * a single number ("AA 3", "AA 2 # 2"). Blocking the siglum outright would
 * cost those 42 to save 3.
 */
function proseSiglumFalseLead(sigla: string, locus: string): boolean {
	return sigla === 'AA' && /[,.]/.test(locus);
}

function bracketedPositions(text: string): boolean[] {
	const inside = new Array<boolean>(text.length);
	let depth = 0;
	for (let i = 0; i < text.length; i++) {
		const c = text[i];
		if (c === '(' || c === '[') depth++;
		inside[i] = depth > 0;
		if (c === ')' || c === ']') depth = Math.max(0, depth - 1);
	}
	return inside;
}

/**
 * Link references inside RUNNING PROSE — a Catechism paragraph's own body, an
 * encyclical's argument — as opposed to a citation string, which is what
 * `parseRefs` is for.
 *
 * Two grammars, scanned together and merged in document order:
 *
 *   1. A "cf."-triggered CCC PARAGRAPH reference — "cf. 1212", "cf. nn.
 *      1212-1215". Bare numbers mean nothing without the trigger, so this one
 *      stays anchored to it.
 *   2. A SCRIPTURE locator anywhere — "«Eu estarei contigo» – Ex 3, 12",
 *      "(cf. Mt 5, 3)", "the account of the fall in Genesis 3". No trigger
 *      and no bracket required. That matters far beyond the odd Catechism
 *      paragraph: the encyclicals cite Scripture almost entirely this way,
 *      in parentheses inside the running text, and the corpus holds ~4,400
 *      such locators that were previously plain text — 334 in Evangelium
 *      Vitae alone.
 *   3. A DOCUMENT SIGLUM with a locus, inside a bracket — "(GS 19,1)",
 *      "[Vgl. LG 20.]", "(cf. AG 2)". Added 2026-08-26, and the reason it
 *      was worth adding is the same fact that made the six new book tables
 *      worth deriving: German, Spanish and French print no footnotes at all
 *      (docs/corpus-schema.md §Catechism), so the whole apparatus of those
 *      three editions is in the prose this scan reads. 3,624 references,
 *      against 82 in the English edition, which footnotes almost everything.
 *
 * The bracket requirement is scan 3's alone — see `bracketedPositions` for
 * the measurement behind it. Scripture does not need it (a book name plus a
 * chapter is already distinctive) and would lose by it, since the Catechism's
 * prose names books in the open constantly.
 *
 * Deliberately NOT `parseRefs` over prose. That function assumes the whole
 * string is citation apparatus, and two of its rules are actively wrong here:
 * it splits on ";" and ":", which in prose are ordinary punctuation, and it
 * carries a book across clauses so a later bare "12, 4" inherits it — in a
 * paragraph of prose that turns page numbers and dates into verses. This scan
 * has neither: every match must carry its own book name, immediately followed
 * by its own locus.
 *
 * What keeps it from over-linking (the principle in this module's docblock —
 * under-linking is acceptable, a wrong link is not):
 *
 *   - Book tables are matched CASE-SENSITIVELY, on the exact surface forms
 *     the corpus prints. This is what makes short abbreviations safe in
 *     Portuguese, where "Na" (Nahum) and "At" (Acts) are otherwise a common
 *     preposition and a common word — "na" and "at" never match "Na"/"At".
 *   - A parseable chapter must follow immediately, within the plausible
 *     chapter count for that book.
 *   - A commentary title ("Moralia in Job 31, 45") is excluded — see
 *     `precededByCommentaryTitle`.
 */
export function linkifyProse(text: string, opts?: RefsOpts): RefSegment[] {
	if (!text) return [];
	const cfg = configFor(opts?.lang, opts?.work);
	const CF_RE = /\bcf\.\s*/gi;
	const NUM_LIST_RE = new RegExp(
		`^\\d+(?:\\s*[${DASHES}]\\s*\\d+)?(?:\\s*,\\s*\\d+(?:\\s*[${DASHES}]\\s*\\d+)?)*`
	);
	const LABEL_RE = /^nn?\.\s*/i;

	/** One accepted match: [start, end) of the source text plus what it becomes. */
	interface Hit {
		start: number;
		end: number;
		segs: RefSegment[];
	}
	const hits: Hit[] = [];

	// --- 1. "cf." + a bare CCC paragraph-number list ----------------------
	// Opt-in; see `RefsOpts.cccParagraphRefs` for why it is off by default.
	let m: RegExpExecArray | null;
	while (opts?.cccParagraphRefs && (m = CF_RE.exec(text))) {
		let pos = m.index + m[0].length;
		const label = LABEL_RE.exec(text.slice(pos));
		if (label) pos += label[0].length;
		const numMatch = NUM_LIST_RE.exec(text.slice(pos));
		if (!numMatch) continue;
		// "cf. 1 Jo 3,2" opens on a digit, but that digit is the BOOK NUMBER of
		// 1 John, not a Catechism paragraph. Scan 2 will claim the whole
		// reference; bail out here so this one doesn't claim the "1" first and
		// win the overlap by starting further left.
		const bookHere = findBookAt(cfg, text, pos);
		if (bookHere?.matchStart === pos) continue;
		hits.push({
			start: m.index,
			end: pos + numMatch[0].length,
			// The trigger itself is reproduced as text, the numbers become links.
			segs: [textSeg(text.slice(m.index, pos)), ...parseBareCccList(numMatch[0])]
		});
		CF_RE.lastIndex = pos + numMatch[0].length;
	}

	// --- 2. Scripture locators, anywhere ----------------------------------
	let searchPos = 0;
	while (searchPos < text.length) {
		const bm = findBookAt(cfg, text, searchPos);
		if (!bm) break;
		searchPos = bm.matchEnd;
		if (precededByFalseLead(text.slice(0, bm.matchStart), bm.osis)) continue;
		const spaceAfter = /^ */.exec(text.slice(bm.matchEnd))![0];
		const afterBook = bm.matchEnd + spaceAfter.length;
		const cv = parseRefNumbers(text.slice(afterBook), cfg, bm.osis, cfg.proseRomanChapters);
		if (cv.chapter === null || cv.chapter > MAX_CHAPTER[bm.osis]) continue;
		const end = afterBook + cv.consumed;
		hits.push({
			start: bm.matchStart,
			end,
			segs: [
				{
					kind: 'scripture',
					osis: bm.osis,
					chapter: cv.chapter,
					verses: cv.verses,
					// "cf."/"Cf." immediately before makes it a comparative
					// reference, the same rule the citation grammar applies.
					...(precededByCf(text.slice(0, bm.matchStart)) ? { cf: true as const } : {}),
					raw: text.slice(bm.matchStart, end)
				}
			]
		});
		searchPos = end;
	}

	// --- 3. Document sigla with a locus, inside a bracket ------------------
	let bracketed: boolean[] | null = null;
	let siglumPos = 0;
	while (siglumPos < text.length) {
		const dm = findDocumentAt(cfg, text, siglumPos);
		if (!dm) break;
		siglumPos = Math.max(dm.consumedEnd, dm.matchStart + 1);
		// A bare siglum with no number after it names a document in passing at
		// best and is an ordinary capitalised word at worst; in prose there is
		// nothing to point at either way.
		if (!dm.locus) continue;
		if (proseSiglumFalseLead(dm.sigla, dm.locus)) continue;
		if (!bracketed) bracketed = bracketedPositions(text);
		if (!bracketed[dm.matchStart]) continue;
		hits.push({
			start: dm.matchStart,
			end: dm.consumedEnd,
			segs: [
				{
					kind: 'document',
					via: 'siglum',
					label: dm.sigla,
					locus: dm.locus,
					expansion: cfg.documentSigla.get(dm.sigla)?.expansion ?? null,
					slug: dm.slug,
					raw: text.slice(dm.matchStart, dm.consumedEnd)
				}
			]
		});
	}

	// --- Merge, earliest first, dropping anything that overlaps a kept hit -
	// The two scans can claim the same characters ("cf. Jn 3:16" is a scripture
	// hit starting mid-way through nothing the first scan matched, but "cf.
	// 1212" style overlaps do occur in mixed strings). First hit wins, which
	// with this ordering is always the leftmost.
	hits.sort((a, b) => a.start - b.start || b.end - a.end);
	const segs: RefSegment[] = [];
	let last = 0;
	for (const hit of hits) {
		if (hit.start < last) continue;
		if (hit.start > last) segs.push(textSeg(text.slice(last, hit.start)));
		segs.push(...hit.segs);
		last = hit.end;
	}
	if (last < text.length) segs.push(textSeg(text.slice(last)));
	return mergeText(segs);
}
