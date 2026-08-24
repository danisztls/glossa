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
 *      `ccc.pt/paragraphs.json`, not guessed.)
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
 *      expansions too. The table below is a stopgap —
 *      `docs/link-surface.md` records that neither language's
 *      `abbreviations.json` carries a real one (the vatican.va mirrors omit
 *      the front-matter table) — built by counting sigla occurrences in
 *      both `paragraphs.json` files with `jq` and confirming each one's
 *      meaning against its citation context. Replace this table wholesale
 *      once the corpus carries a real abbreviations source.
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
			 * A document named by its TITLE rather than by a siglum — "Pius XII,
			 * Humani generis 561", "Const. dogm. Dei Verbum, 2". Distinct from
			 * `document` because the two resolve differently: a siglum without a
			 * section number links nowhere (a bare "cf. GS" has no destination
			 * worth guessing), whereas a title without a usable section number
			 * still names one specific document and links to its landing page.
			 * See `findDocumentTitleAt` for why titles are matched at all.
			 */
			kind: 'documentTitle';
			/** The ingested document's slug — always set; an unresolvable title never becomes this segment. */
			slug: string;
			/** The manifest title that matched, for tooltips. */
			title: string;
			/** Trailing number(s) after the title, if any — validated against the document in `refHref`, never trusted. */
			locus: string | null;
			raw: string;
	  }
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
			kind: 'document';
			sigla: string;
			locus: string | null;
			expansion: string | null;
			/** The ingested document this siglum names, or `null` for a
			 *  recognized-but-not-ingested siglum (DS, CIC, PL, PG, AAS, ...) or
			 *  a language whose config never maps sigla to slugs at all (PT —
			 *  see `DOCUMENT_SLUGS_EN`'s docblock). Resolved at PARSE time, not
			 *  re-derived in `refHref`, so there's one place that decides "is
			 *  this siglum a document we have," not two that could drift. */
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
	const sides = upper.split(/\s*[-–]\s*|\s+/).map((side) => {
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

const ROMAN: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III' };

/** Build `{n} {base}` / `{roman} {base}` (and optionally digit-glued/typo) variants for a family of numbered books. */
function numberedVariants(
	byN: Record<number, string>,
	bases: string[],
	opts: { lTypo?: boolean; unspaced?: boolean } = {}
): Record<string, string[]> {
	const out: Record<string, string[]> = {};
	for (const [nStr, osis] of Object.entries(byN)) {
		const n = Number(nStr);
		const variants: string[] = [];
		for (const base of bases) {
			variants.push(`${n} ${base}`, `${ROMAN[n]} ${base}`);
			if (opts.unspaced) variants.push(`${n}${base}`);
			// "l" (lowercase L) for the digit "1" is a recurring transcription
			// artifact in the EN corpus (observed: "l Cor", "l Pt", "l Tim") —
			// visually confusable with "1" in some renderings.
			if (opts.lTypo && n === 1) variants.push(`l ${base}`);
		}
		out[osis] = variants;
	}
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
	ezra: ['Ezr', 'Ezra'],
	neh: ['Neh', 'Nehemiah'],
	tob: ['Tb', 'Tob', 'Tobit'],
	jdt: ['Jdt', 'Judith'],
	esth: ['Est', 'Esth', 'Esther'],
	job: ['Job'],
	ps: ['Ps', 'Pss', 'Psalm', 'Psalms', 'PS'], // PS: observed all-caps variant
	prov: ['Prv', 'Prov', 'Proverbs'],
	eccl: ['Eccl', 'Qo', 'Qoh', 'Ecclesiastes'],
	song: ['Song', 'SS', 'Ct', 'Song of Songs', 'Song of Solomon'],
	wis: ['Wis', 'Wisdom'],
	sir: ['Sir', 'Ecclus', 'Sirach'],
	isa: ['Is', 'Isa', 'Isaiah'],
	jer: ['Jer', 'Jeremiah'],
	lam: ['Lam', 'Lamentations'],
	bar: ['Bar', 'Baruch'],
	ezek: ['Ez', 'Ezek', 'Ezekiel'],
	dan: ['Dn', 'Dan', 'Daniel'],
	hos: ['Hos', 'Hosea'],
	joel: ['Jl', 'Joel'],
	amos: ['Am', 'Amos'],
	obad: ['Ob', 'Obad', 'Obadiah'],
	jonah: ['Jon', 'Jonah'],
	mic: ['Mi', 'Mic', 'Micah'],
	nah: ['Na', 'Nah', 'Nahum'],
	hab: ['Hab', 'Habakkuk'],
	zeph: ['Zep', 'Zeph', 'Zephaniah'],
	hag: ['Hag', 'Haggai'],
	zech: ['Zec', 'Zech', 'Zechariah'],
	mal: ['Mal', 'Malachi'],
	matt: ['Mt', 'Matt', 'Matthew'],
	mark: ['Mk', 'Mark'],
	luke: ['Lk', 'Luke'],
	john: ['Jn', 'John', 'In'], // In: observed typo (J -> I), only fires with a chapter:verse after it
	acts: ['Acts'],
	rom: ['Rom', 'Romans'],
	gal: ['Gal', 'Galatians', 'Cal'], // Cal: observed typo (G -> C), verified against ccc476/478's Christology
	eph: ['Eph', 'Ephesians'],
	phil: ['Phil', 'Philippians'],
	col: ['Col', 'Colossians'],
	titus: ['Ti', 'Tit', 'Titus'],
	phlm: ['Philem', 'Phlm', 'Philemon'],
	heb: ['Heb', 'Hebrews'],
	jas: ['Jas', 'James'],
	jude: ['Jude'],
	rev: ['Rev', 'Rv', 'Revelation', 'Apoc'],
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sam', 'Samuel'], { lTypo: true }),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['Kings', 'Kgs'], { lTypo: true }),
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Chr', 'Chronicles'], { lTypo: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Macc', 'Maccabees'], { lTypo: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Cor', 'Corinthians'], { lTypo: true }),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Thess', 'Thessalonians', 'Th'], {
		lTypo: true
	}),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tim', 'Timothy'], { lTypo: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Pet', 'Pt', 'Peter'], { lTypo: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Jn', 'John', 'In'], { lTypo: true })
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
	exod: ['Ex', 'Éx'],
	lev: ['Lv'],
	num: ['Nm', 'Núm'],
	deut: ['Dt', 'Dr', 'Deut'], // Dr: observed typo (t -> r), "Cf. Dr 18, 10" = Dt 18:10
	josh: ['Js'],
	judg: ['Jz'],
	ruth: ['Rt'], // fallback: not observed in a ccc.pt citation
	tob: ['Tb'],
	jdt: ['Jt'],
	esth: ['Est'], // fallback
	job: ['Job', 'Jó'],
	ps: ['Sl', 'Sal', 'Salm'],
	prov: ['Pr', 'Prov'],
	eccl: ['Ecl', 'Ec'],
	song: ['Ct', 'Cânt'],
	wis: ['Sb', 'Sab'],
	sir: ['Sir', 'Eclo', 'Ecli'],
	isa: ['Is'],
	jer: ['Jr', 'Jer'],
	lam: ['Lm'], // fallback
	bar: ['Br', 'Bar'],
	ezek: ['Ez'],
	ezra: ['Esd'],
	neh: ['Ne'],
	dan: ['Dn'],
	hos: ['Os'],
	joel: ['Jl'],
	amos: ['Am'],
	obad: ['Ab'], // fallback
	jonah: ['Jn'], // NOTE: the reverse of English convention — "Jo" is John, "Jn" is Jonah
	mic: ['Mq'],
	nah: ['Na'], // fallback
	hab: ['Hab'], // fallback
	zeph: ['Sf'],
	hag: ['Ag'], // fallback
	zech: ['Zc'],
	mal: ['Ml'],
	matt: ['Mt'],
	mark: ['Mc', 'Mr'], // Mr: observed one-off typo for Mc
	luke: ['Lc', 'Luc'],
	john: ['Jo'],
	acts: ['Act', 'At'],
	// "Rom" is included despite colliding with "Cat Rom"/"CatRom"
	// (Catechismus Romanus), whose locus shapes identically to a
	// chapter:verse. The collision is handled where it actually occurs — by
	// prefix, in `precededByFalseLead` — rather than by dropping the book,
	// which used to cost 153 real references to Romans in the older
	// encyclical translations that spell it out this way.
	rom: ['Rm', 'Rom'],
	gal: ['Gl', 'Gál', 'Gal'],
	eph: ['Ef'],
	phil: ['Fl', 'Fil'],
	col: ['Cl', 'Col'],
	titus: ['Tt', 'Tit'],
	phlm: ['Fm', 'Flm'], // Flm observed in an inline PT citation
	heb: ['Heb', 'Hb', 'Hebr'],
	jas: ['Tg'],
	jude: ['Jd'], // fallback
	rev: ['Ap', 'Apoc'],
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Cr'], { unspaced: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Cor'], { unspaced: true, lTypo: true }),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['Rs'], { unspaced: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Mac'], { unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Pe', 'Ped', 'Pd'], { unspaced: true }),
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sm'], { unspaced: true }),
	// Observed unspaced once ("1Ts 4, 7") alongside the normal spaced form.
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Ts', 'Tess'], { unspaced: true }),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tm', 'Tim'], { unspaced: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Jo'], { unspaced: true })
};

// --------------------------------------------------------------------------
// Document sigla (non-scripture: councils, encyclicals, canon law, patrology
// series, magisterial document collections). The 16 Vatican II sigla now
// resolve to a real `/documents/{slug}/{n}` link via `DOCUMENT_SLUGS_EN` +
// `refHref` below — everything else here (DS, CIC, PL, PG, AAS, canon law,
// patrology series, and every siglum's PT appearance) still has nothing in
// the corpus to link to, so the point of recognizing THOSE is a quiet,
// informative non-link (sigla + locus + expansion tooltip) instead of the
// sigla vanishing into unstyled text.
//
// This table is a STOPGAP. `docs/link-surface.md` records that neither
// language's `abbreviations.json` carries a real one (the vatican.va
// mirrors omit the front-matter table); replace this wholesale once the
// corpus ships one. Built by counting `\bTOKEN\b` occurrences in both
// `ccc.en` and `ccc.pt` `paragraphs.json` citations with `jq` and confirming
// each entry's meaning against its citation context — not exhaustive, just
// the sigla that actually occur with enough frequency to verify.
//
// EN and PT get separate tables, not one shared one, because at least one
// siglum means something different per language: "SC" is Sacrosanctum
// Concilium (Vatican II liturgy constitution) throughout the EN corpus, but
// the EN-only "SCh" (Sources Chrétiennes, a patristic critical-edition
// series) doesn't appear in ccc.pt at all — PT citations use bare "SC" for
// Sources Chrétiennes instead (103 occurrences, zero for the Vatican II
// document sigla, which PT citations spell out in full: "Const. past.
// Gaudium et Spes"). Sharing one table would silently mislabel one language.
// --------------------------------------------------------------------------

const DOCUMENT_SIGLA_EN: Record<string, string> = {
	LG: 'Lumen Gentium (Vatican II, Dogmatic Constitution on the Church)',
	AG: "Ad Gentes (Vatican II, Decree on the Church's Missionary Activity)",
	SC: 'Sacrosanctum Concilium (Vatican II, Constitution on the Sacred Liturgy)',
	GS: 'Gaudium et Spes (Vatican II, Pastoral Constitution on the Church in the Modern World)',
	UR: 'Unitatis Redintegratio (Vatican II, Decree on Ecumenism)',
	CT: 'Catechesi Tradendae (John Paul II, apostolic exhortation on catechesis)',
	DS: 'Denzinger–Schönmetzer (Enchiridion Symbolorum)',
	CIC: 'Codex Iuris Canonici (Code of Canon Law)',
	CCEO: 'Codex Canonum Ecclesiarum Orientalium (Code of Canons of the Eastern Churches)',
	RCIA: 'Rite of Christian Initiation of Adults',
	RBC: 'Rite of Baptism for Children',
	CDF: 'Congregation for the Doctrine of the Faith',
	PL: 'Patrologia Latina (Migne)',
	PG: 'Patrologia Graeca (Migne)',
	SCh: 'Sources Chrétiennes (patristic critical-edition series)',
	AAS: 'Acta Apostolicae Sedis (official gazette of the Holy See)',
	DV: 'Dei Verbum (Vatican II, Dogmatic Constitution on Divine Revelation)',
	NA: 'Nostra Aetate (Vatican II, Declaration on the Relation of the Church to Non-Christian Religions)',
	OT: 'Optatam Totius (Vatican II, Decree on Priestly Training)',
	PO: 'Presbyterorum Ordinis (Vatican II, Decree on the Ministry and Life of Priests)',
	CD: 'Christus Dominus (Vatican II, Decree on the Pastoral Office of Bishops)',
	OE: 'Orientalium Ecclesiarum (Vatican II, Decree on the Eastern Catholic Churches)',
	EP: 'Eucharistic Prayer (Roman Missal)',
	PC: 'Perfectae Caritatis (Vatican II, Decree on the Renewal of Religious Life)',
	AA: 'Apostolicam Actuositatem (Vatican II, Decree on the Apostolate of the Laity)',
	DH: 'Dignitatis Humanae (Vatican II, Declaration on Religious Freedom)',
	CA: 'Centesimus Annus (John Paul II encyclical)',
	FC: 'Familiaris Consortio (John Paul II, apostolic exhortation on the family)',
	SRS: 'Sollicitudo Rei Socialis (John Paul II encyclical)',
	RP: 'Reconciliatio et Paenitentia (John Paul II, apostolic exhortation)',
	LE: 'Laborem Exercens (John Paul II encyclical)',
	HV: 'Humanae Vitae (Paul VI encyclical)',
	EN: 'Evangelii Nuntiandi (Paul VI, apostolic exhortation on evangelization)',
	IM: 'Inter Mirifica (Vatican II, Decree on Social Communication)',
	GE: 'Gravissimum Educationis (Vatican II, Declaration on Christian Education)',
	MC: 'Marialis Cultus (Paul VI, apostolic exhortation)',
	MD: 'Mulieris Dignitatem (John Paul II, apostolic letter)',
	MF: 'Mysterium Fidei (Paul VI encyclical)',
	PP: 'Populorum Progressio (Paul VI encyclical)',
	RH: 'Redemptor Hominis (John Paul II encyclical)',
	RM: 'Redemptoris Mater (John Paul II encyclical)',
	RMat: 'Redemptoris Mater (John Paul II encyclical)', // observed alt siglum, same document as RM
	PT: 'Pacem in Terris (John XXIII encyclical)',
	GCD: 'General Catechetical Directory',
	GIRM: 'General Instruction of the Roman Missal',
	GILH: 'General Instruction of the Liturgy of the Hours',
	OCF: 'Order of Christian Funerals',
	OP: 'Ordo Paenitentiae (Rite of Penance)',
	LC: 'Libertatis Conscientia (CDF instruction on Christian freedom and liberation)',
	ND: 'Neuner–Dupuis, The Christian Faith (doctrinal sourcebook)'
};

/**
 * Siglum -> document SLUG (docs/corpus-schema.md §Documents work ids,
 * `{family}.{slug}.{lang}`) for sigla that are BOTH recognized above AND
 * actually ingested into the corpus — currently the 16 Vatican II
 * constitutions/decrees/declarations, the one document family both fully
 * ingested and cited by siglum anywhere in the CCC
 * (docs/research/vatican-documents.md §1a). `refHref` below consults this to
 * turn e.g. `GS 19` into `/documents/gaudium-et-spes/19` — see
 * `docs/link-surface.md`'s "once ingested, the raw citations + abbreviations
 * let the parser resolve 'LG 12' to an actual paragraph link" prediction,
 * which this table is what makes true.
 *
 * Encyclicals are NOT in this table even though ~60+ are already in the
 * corpus: the CCC cites them by spelled-out title ("Familiaris Consortio"),
 * never by siglum (`vatican-documents.md` §1b), so there is no siglum ->
 * encyclical-slug mapping for the citation grammar to need — this table maps
 * what the grammar can actually encounter, not everything the corpus has.
 *
 * EN-ONLY, DELIBERATELY: `DOCUMENT_SIGLA_PT` below doesn't carry any of
 * these sigla at all (ccc.pt spells conciliar documents out in full rather
 * than abbreviating them — see that table's own docblock), so there's
 * nothing to map for PT. Critically, `SC` must NEVER appear in a PT version
 * of this table: in `DOCUMENT_SIGLA_EN` it's Sacrosanctum Concilium, but the
 * identical siglum in `DOCUMENT_SIGLA_PT` means Sources Chrétiennes — a
 * shared slug table would silently mislink a PT patristics citation into a
 * conciliar constitution. `buildConfig`'s `documentSlugs` parameter defaults
 * to `{}` for exactly this reason: PT's config simply never resolves any
 * siglum to a slug, so `RefSegment.slug` is always `null` there and
 * `refHref` never links a PT document segment (see its own docblock).
 */
const DOCUMENT_SLUGS_EN: Record<string, string> = {
	LG: 'lumen-gentium',
	SC: 'sacrosanctum-concilium',
	GS: 'gaudium-et-spes',
	DV: 'dei-verbum',
	UR: 'unitatis-redintegratio',
	AG: 'ad-gentes',
	DH: 'dignitatis-humanae',
	AA: 'apostolicam-actuositatem',
	CD: 'christus-dominus',
	OE: 'orientalium-ecclesiarum',
	NA: 'nostra-aetate',
	PC: 'perfectae-caritatis',
	IM: 'inter-mirifica',
	OT: 'optatam-totius',
	GE: 'gravissimum-educationis',
	PO: 'presbyterorum-ordinis'
};

const DOCUMENT_SIGLA_PT: Record<string, string> = {
	// SC deliberately means something different here than in EN — see the
	// table-group docblock above.
	SC: 'Sources Chrétiennes (patristic critical-edition series)',
	DS: 'Denzinger–Schönmetzer (Enchiridion Symbolorum)',
	CIC: 'Codex Iuris Canonici (Código de Direito Canónico)',
	CCEO: 'Codex Canonum Ecclesiarum Orientalium',
	PL: 'Patrologia Latina (Migne)',
	PG: 'Patrologia Graeca (Migne)',
	AAS: 'Acta Apostolicae Sedis'
	// Vatican II / encyclical sigla (LG, GS, DV, ...) do not appear in
	// ccc.pt at all — its citations spell those documents out in full
	// ("Const. past. Gaudium et Spes") rather than abbreviating them.
};

// --------------------------------------------------------------------------
// Per-language config: pre-built matchers so parseRefs doesn't rebuild a
// regex per call.
// --------------------------------------------------------------------------

interface LangConfig {
	variantToOsis: Map<string, string>;
	bookRe: RegExp;
	documentSigla: Map<string, string>;
	documentRe: RegExp;
	/** Siglum -> ingested document slug, e.g. "GS" -> "gaudium-et-spes"; empty for PT (see `DOCUMENT_SLUGS_EN`'s docblock). */
	documentSlugs: Map<string, string>;
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
	documentSigla: Record<string, string>,
	primarySep: string,
	allowBareSeparators: boolean,
	documentSlugs: Record<string, string> = {},
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
		documentSlugs: new Map(Object.entries(documentSlugs)),
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
const CONFIG_EN = buildConfig(BOOK_VARIANTS_EN, DOCUMENT_SIGLA_EN, ':', true, DOCUMENT_SLUGS_EN, [
	','
]);
// Fourth argument stays `false`: PT never uses a bare SPACE as a
// chapter/verse separator, so `allowBareSeparators` (which would enable both
// " " and ".") is still the wrong knob for it. What PT does drift to is "."
// where it means "," -- "Sl 40. 7-9" for Ps 40:7-9, "Mc 14. 25" for Mk 14:25
// -- so that one mark goes in via `extraChapterVerseSeparators`, the knob
// meant for exactly this kind of verified, source-specific punctuation
// drift. Fifth argument empty: PT's document segments always parse with
// `slug: null` (DOCUMENT_SLUGS_EN's docblock explains why that's correct,
// not a gap).
const CONFIG_PT = buildConfig(
	BOOK_VARIANTS_PT,
	DOCUMENT_SIGLA_PT,
	',',
	false,
	{},
	['.'],
	[';', ':']
);

function configFor(lang?: string): LangConfig {
	return lang?.toLowerCase().startsWith('pt') ? CONFIG_PT : CONFIG_EN;
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
 * `documentTitle` segments. Scripture is matched before documents in
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
}

/** Lazily built so it costs nothing on pages that never parse a citation. */
let documentTitleIndex: Map<string, string> | null = null;
let documentTitleRe: RegExp | null = null;

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

/** Parse "chapter<sep>verselist" or a bare "chapter" (whole-chapter) from the start of `s`. */
function parseChapterVerses(
	s: string,
	cfg: LangConfig
): { chapter: number | null; verses: number[]; consumed: number } {
	const m = /^(\d+)/.exec(s);
	if (!m) return { chapter: null, verses: [], consumed: 0 };
	const chapter = Number(m[1]);
	const pos = m[0].length;
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
			return { chapter, verses, consumed: pos + gap.length + 1 + consumed };
		}
	}
	if (cfg.allowBareSeparators && (rest[0] === '.' || rest[0] === ' ') && /\d/.test(rest[1] ?? '')) {
		const { verses, consumed } = parseVerseList(rest.slice(1), cfg.primarySep);
		return { chapter, verses, consumed: pos + 1 + consumed };
	}
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
	osis: string
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
		: parseChapterVerses(body, cfg);
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
const LOCUS_RE = /^\d+(?:\s*[-–]\s*\d+)?(?:\s*[,.]\s*\d+(?:\s*[-–]\s*\d+)?)*(?:\s*#\s*\d+)?/;

function findDocumentAt(cfg: LangConfig, s: string, start: number): DocumentMatch | null {
	cfg.documentRe.lastIndex = start;
	const m = cfg.documentRe.exec(s);
	if (!m) return null;
	const after = s.slice(m.index + m[0].length);
	const spaceSkip = /^ */.exec(after)![0];
	const locusMatch = LOCUS_RE.exec(after.slice(spaceSkip.length));
	const locus = locusMatch ? locusMatch[0] : null;
	const consumedEnd =
		m.index + m[0].length + (locusMatch ? spaceSkip.length + locusMatch[0].length : 0);
	return {
		sigla: m[0],
		matchStart: m.index,
		consumedEnd,
		locus,
		slug: cfg.documentSlugs.get(m[0]) ?? null
	};
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
const COMMENTARY_TITLE_RE = /(?:\bIn|\.\s*in|\bMoralia\s+in)\s*$/;

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
		const cv = parseRefNumbers(rawClause.slice(afterBook), cfg, bm.osis);
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
			kind: 'documentTitle',
			slug: tm.slug,
			title: tm.title,
			locus: tm.locus,
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
			sigla: dm.sigla,
			locus: dm.locus,
			expansion: cfg.documentSigla.get(dm.sigla) ?? null,
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
	return /\d/.test(text) && /^[\d\s,.;\-–—]+$/.test(text);
}

function parseBareCccList(text: string): RefSegment[] {
	const segs: RefSegment[] = [];
	const re = /\d+/g;
	let last = 0;
	let m: RegExpExecArray | null;
	while ((m = re.exec(text))) {
		if (m.index > last) segs.push(textSeg(text.slice(last, m.index)));
		segs.push({ kind: 'ccc', n: Number(m[0]), raw: m[0] });
		last = m.index + m[0].length;
	}
	if (last < text.length) segs.push(textSeg(text.slice(last)));
	return mergeText(segs);
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
	return parseCitationClauses(text, configFor(opts?.lang));
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
	const cfg = configFor(opts?.lang);
	const CF_RE = /\bcf\.\s*/gi;
	const NUM_LIST_RE = /^\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–]\s*\d+)?)*/;
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
		const cv = parseRefNumbers(text.slice(afterBook), cfg, bm.osis);
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
