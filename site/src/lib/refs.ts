/**
 * Universal reference system.
 *
 * Depositum's raw citation strings — CCC footnotes, the CCC's `related`
 * marginal-number list, the Compendium's `ccc_refs` — are never pre-parsed
 * in the corpus (`docs/link-surface.md`'s "the corpus stores raw strings,
 * never interpretations" principle). This module is the derived pass that
 * turns those verbatim strings into a sequence of `RefSegment`s so a caller
 * can render the original string intact with links woven through it:
 * `parseRefs("Cf. Gen 9:16; Lk 21:24; DV 3.")` → text "Cf. ", a scripture
 * segment, text "; ", a scripture segment, text "; ", a document segment,
 * text ".". `RefText.svelte` is the presentation layer over this.
 *
 * The scripture grammar (clause splitting on `;`, `Cf.` scope, bookless
 * continuation clauses that inherit the previous clause's book, `:`/space/
 * `.` chapter-verse separators, range expansion, verse-subdivision letters,
 * the single-chapter-book exception, the dropped-colon-typo guard, the
 * known transcription typos) is ported from `pipeline/build/xrefs.py`,
 * which derived it empirically against the full 2865-paragraph EN corpus —
 * read that module's docstring for the primary source of truth. This file
 * extends it in three ways that module doesn't need to cover:
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
 *      but nameable, so they render as a quiet non-link with a tooltip
 *      instead of disappearing into plain text. `xrefs.py` only needed a
 *      *non*-scripture allowlist (to silence its "unmapped abbreviation"
 *      report); this module needs the sigla's expansions too. The table
 *      below is a stopgap — `docs/link-surface.md` records that neither
 *      language's `abbreviations.json` carries a real one (the vatican.va
 *      mirrors omit the front-matter table) — built by counting sigla
 *      occurrences in both `paragraphs.json` files with `jq` and confirming
 *      each one's meaning against its citation context. Replace this table
 *      wholesale once the corpus carries a real abbreviations source.
 *   3. Two grammars `xrefs.py` never had to parse at all: a bare
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
 * real ambiguity `xrefs.py` deliberately leaves unresolved (see its
 * docstring: "a genuine bare-verse continuation... this will under-link
 * it") — a bare trailing clause after an established book is a dangling
 * verse-continuation candidate in citation grammar, not a CCC paragraph
 * number, and treating it as the latter would be a *wrong* link, worse
 * than the under-linking `xrefs.py` accepts.
 *
 * Design principle carried over verbatim from `xrefs.py`: under-linking
 * (leaving a real reference as plain text) is an acceptable, expected
 * outcome; over-linking (a citation surface-form that isn't really that
 * reference) is not. Every ambiguous case below resolves toward "leave it
 * as text".
 */

import { findBookByAbbrev, workIdToEdition } from './corpus';
import { isDivergentBook, resolveVulgate } from './versification';

// --------------------------------------------------------------------------
// Public types
// --------------------------------------------------------------------------

export type RefSegment =
	| { kind: 'text'; text: string }
	| { kind: 'scripture'; osis: string; chapter: number; verses: number[]; cf?: boolean; raw: string }
	| { kind: 'ccc'; n: number; raw: string }
	| { kind: 'compendium'; n: number; raw: string }
	| { kind: 'document'; sigla: string; locus: string | null; expansion: string | null; raw: string };

export interface RefsOpts {
	/** BCP-47 or bare language tag; only the `pt`/non-`pt` distinction matters. Defaults to `en`. */
	lang?: string;
}

// --------------------------------------------------------------------------
// Canonical chapter counts (docs/corpus-schema.md canonical 73-book order).
// Ported from xrefs.py's MAX_CHAPTER — used two ways: (1) a chapter number
// above the book's real length is almost always a dropped-colon typo
// running chapter and verse together ("Eph 314" for "Eph 3:14") and is
// dropped rather than guessed at, same as the Python parser; (2) its
// max-1 entries are exactly the Bible's five single-chapter books, cited
// "Book <verse>" with no chapter number at all — see SINGLE_CHAPTER_BOOKS.
// --------------------------------------------------------------------------

const MAX_CHAPTER: Record<string, number> = {
	gen: 50, exod: 40, lev: 27, num: 36, deut: 34, josh: 24, judg: 21,
	ruth: 4, '1sam': 31, '2sam': 24, '1kgs': 22, '2kgs': 25, '1chr': 29, '2chr': 36,
	ezra: 10, neh: 13, tob: 14, jdt: 16, esth: 16, '1macc': 16, '2macc': 15,
	job: 42, ps: 150, prov: 31, eccl: 12, song: 8, wis: 19, sir: 51,
	isa: 66, jer: 52, lam: 5, bar: 6, ezek: 48, dan: 14, hos: 14,
	joel: 3, amos: 9, obad: 1, jonah: 4, mic: 7, nah: 3, hab: 3,
	zeph: 3, hag: 2, zech: 14, mal: 4,
	matt: 28, mark: 16, luke: 24, john: 21, acts: 28, rom: 16,
	'1cor': 16, '2cor': 13, gal: 6, eph: 6, phil: 4, col: 4, '1thess': 5,
	'2thess': 3, '1tim': 6, '2tim': 4, titus: 3, phlm: 1, heb: 13, jas: 5,
	'1pet': 5, '2pet': 3, '1john': 5, '2john': 1, '3john': 1, jude: 1, rev: 22
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
// (ported from xrefs.py's BOOK_VARIANTS/VARIANT_TO_OSIS design). Unlike
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
	titus: ['Ti', 'Titus'],
	phlm: ['Philem', 'Phlm', 'Philemon'],
	heb: ['Heb', 'Hebrews'],
	jas: ['Jas', 'James'],
	jude: ['Jude'],
	rev: ['Rev', 'Rv', 'Revelation', 'Apoc'],
	...numberedVariants(
		{ 1: '1sam', 2: '2sam' },
		['Sam', 'Samuel'],
		{ lTypo: true }
	),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['Kings', 'Kgs'], { lTypo: true }),
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Chr', 'Chronicles'], { lTypo: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Macc', 'Maccabees'], { lTypo: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Cor', 'Corinthians'], { lTypo: true }),
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Thess', 'Thessalonians', 'Th'], { lTypo: true }),
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
const BOOK_VARIANTS_PT: Record<string, string[]> = {
	gen: ['Gn'],
	exod: ['Ex'],
	lev: ['Lv'],
	num: ['Nm'],
	deut: ['Dt', 'Dr'], // Dr: observed typo (t -> r), "Cf. Dr 18, 10" = Dt 18:10
	josh: ['Js'],
	judg: ['Jz'],
	ruth: ['Rt'], // fallback: not observed in a ccc.pt citation
	tob: ['Tb'],
	jdt: ['Jt'],
	esth: ['Est'], // fallback
	job: ['Job', 'Jó'],
	ps: ['Sl'],
	prov: ['Pr'],
	eccl: ['Ecl', 'Ec'],
	song: ['Ct'],
	wis: ['Sb'],
	sir: ['Sir'],
	isa: ['Is'],
	jer: ['Jr'],
	lam: ['Lm'], // fallback
	bar: ['Br'], // fallback
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
	luke: ['Lc'],
	john: ['Jo'],
	acts: ['Act', 'At'],
	// "Rom" (unabbreviated) is deliberately NOT included: the corpus also
	// abbreviates "Catechismus Romanus" as "Cat Rom"/"CatRom", which shapes
	// identically to a chapter:verse citation ("Cat Rom 1, 10, 24") — "Rm"
	// is the unambiguous, dominant citation form, so this trades a little
	// under-linking of the rarer full-word form for never mislinking the
	// Roman Catechism as the Letter to the Romans.
	rom: ['Rm'],
	gal: ['Gl'],
	eph: ['Ef'],
	phil: ['Fl'],
	col: ['Cl'],
	titus: ['Tt'],
	phlm: ['Fm'], // fallback
	heb: ['Heb', 'Hb'],
	jas: ['Tg'],
	jude: ['Jd'], // fallback
	rev: ['Ap'],
	...numberedVariants({ 1: '1chr', 2: '2chr' }, ['Cr'], { unspaced: true }),
	...numberedVariants({ 1: '1cor', 2: '2cor' }, ['Cor'], { unspaced: true }),
	...numberedVariants({ 1: '1kgs', 2: '2kgs' }, ['Rs'], { unspaced: true }),
	...numberedVariants({ 1: '1macc', 2: '2macc' }, ['Mac'], { unspaced: true }),
	...numberedVariants({ 1: '1pet', 2: '2pet' }, ['Pe'], { unspaced: true }),
	...numberedVariants({ 1: '1sam', 2: '2sam' }, ['Sm'], { unspaced: true }),
	// Observed unspaced once ("1Ts 4, 7") alongside the normal spaced form.
	...numberedVariants({ 1: '1thess', 2: '2thess' }, ['Ts'], { unspaced: true }),
	...numberedVariants({ 1: '1tim', 2: '2tim' }, ['Tm'], { unspaced: true }),
	...numberedVariants({ 1: '1john', 2: '2john', 3: '3john' }, ['Jo'], { unspaced: true })
};

// --------------------------------------------------------------------------
// Document sigla (non-scripture: councils, encyclicals, canon law, patrology
// series, magisterial document collections). Nothing in the corpus links to
// these yet (`docs/link-surface.md`: no encyclicals ingested) — the point of
// recognizing them is a quiet, informative non-link (sigla + locus +
// expansion tooltip) instead of the sigla vanishing into unstyled text.
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
	/** Primary chapter/verse separator: ":" (EN) or "," (PT, "Act 2, 42"). */
	primarySep: string;
	/** EN-only: a bare space or "." also separates chapter from verse when
	 * immediately followed by a digit ("Mk 10 14", "Jn 3.16") — a documented
	 * dropped-colon/dotted-style pattern in the EN corpus. Not extended to
	 * PT without direct evidence of the same drift. */
	allowBareSeparators: boolean;
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
const RIGHT_BOUND = '(?![\\p{L}\\p{N}])';

function buildVariantRe(variants: string[]): RegExp {
	const sorted = [...variants].sort((a, b) => b.length - a.length);
	return new RegExp(LEFT_BOUND + '(?:' + sorted.map(escapeRe).join('|') + ')' + RIGHT_BOUND, 'gu');
}

function buildConfig(
	bookVariants: Record<string, string[]>,
	documentSigla: Record<string, string>,
	primarySep: string,
	allowBareSeparators: boolean
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
		primarySep,
		allowBareSeparators
	};
}

const CONFIG_EN = buildConfig(BOOK_VARIANTS_EN, DOCUMENT_SIGLA_EN, ':', true);
const CONFIG_PT = buildConfig(BOOK_VARIANTS_PT, DOCUMENT_SIGLA_PT, ',', false);

function configFor(lang?: string): LangConfig {
	return lang?.toLowerCase().startsWith('pt') ? CONFIG_PT : CONFIG_EN;
}

// --------------------------------------------------------------------------
// Low-level number parsing — language-agnostic once the separator is fixed.
// Ported from xrefs.py's _parse_verse_list / _parse_chapter_verses /
// _parse_single_chapter_ref.
// --------------------------------------------------------------------------

/** A leading run of digits, with an optional single trailing subdivision letter ("3a" -> 3, letter dropped). */
const LEAD_NUM_RE = /^(\d+)[a-zA-Z]?/;

/**
 * Parse a verse list from the start of `s` (no leading separator expected —
 * any leading spaces are consumed as part of the parse). Handles ranges
 * ("12-13", "12–13"), comma/dot-chained additional verses ("15, 33",
 * "16.21"), and verse-subdivision letters ("3a" -> 3). Returns
 * (sorted deduplicated verses, chars consumed).
 *
 * DELIBERATE DIVERGENCE from xrefs.py's `_parse_verse_list`, which does not
 * skip a leading space here (its regex requires a digit at position 0).
 * Added primarily so PT's "Act 2, 42" — a space after the primary
 * chapter/verse separator is the norm there, not a typo — parses at all.
 * It turns out to also fix a real EN transcription pattern the Python
 * parser doesn't handle: a stray space after the colon ("Dt 28: 10",
 * "Ex 33: 12-17", "Gen 21: 17") makes `corpus/xrefs/ccc-bible.json` record
 * these as whole-chapter refs (`verses: []`) when the citation actually
 * names a verse. Confirmed by a corpus-wide smoke check: of ~1200 CCC
 * paragraphs with scripture refs, this file agrees with the Python-built
 * `ccc-bible.json` on 98.4% verbatim, and *every one* of the disagreements
 * traces to exactly this space-after-separator case — this parser is more
 * correct on those, not wrong. That makes `corpus/xrefs/ccc-bible.json`
 * itself slightly wrong: `xrefs.py` needs the same fix and the file needs
 * rebuilding. Tracked as follow-up work, not done here.
 */
function parseVerseList(s: string): { verses: number[]; consumed: number } {
	const lead = /^ */.exec(s)![0];
	let pos = lead.length;
	const verses: number[] = [];
	while (true) {
		const m = LEAD_NUM_RE.exec(s.slice(pos));
		if (!m) break;
		const start = Number(m[1]);
		pos += m[0].length;
		if (s[pos] === '-' || s[pos] === '–') {
			const m2 = LEAD_NUM_RE.exec(s.slice(pos + 1));
			if (m2) {
				const end = Number(m2[1]);
				pos += 1 + m2[0].length;
				for (let v = start; v <= end; v++) verses.push(v);
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
	if (rest[0] === cfg.primarySep) {
		const { verses, consumed } = parseVerseList(rest.slice(1));
		return { chapter, verses, consumed: pos + 1 + consumed };
	}
	if (cfg.allowBareSeparators && (rest[0] === '.' || rest[0] === ' ') && /\d/.test(rest[1] ?? '')) {
		const { verses, consumed } = parseVerseList(rest.slice(1));
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
	const { verses, consumed } = parseVerseList(body);
	if (verses.length === 0) return { chapter: null, verses: [], consumed: 0 };
	return { chapter: 1, verses, consumed: prefixLen + consumed };
}

function parseRefNumbers(
	s: string,
	cfg: LangConfig,
	osis: string
): { chapter: number | null; verses: number[]; consumed: number } {
	return SINGLE_CHAPTER_BOOKS.has(osis) ? parseSingleChapterRef(s, cfg) : parseChapterVerses(s, cfg);
}

// --------------------------------------------------------------------------
// Book / document sigla search.
// --------------------------------------------------------------------------

interface BookMatch {
	osis: string;
	matchStart: number;
	matchEnd: number;
}

/** Search (not anchor) `s` for a recognized book, starting at `start` — a stray prefix before the real match doesn't block it (ported from xrefs.py's `_find_book`). */
function findBookAt(cfg: LangConfig, s: string, start: number): BookMatch | null {
	cfg.bookRe.lastIndex = start;
	const m = cfg.bookRe.exec(s);
	if (!m) return null;
	return { osis: cfg.variantToOsis.get(m[0])!, matchStart: m.index, matchEnd: m.index + m[0].length };
}

interface DocumentMatch {
	sigla: string;
	matchStart: number;
	consumedEnd: number;
	locus: string | null;
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
	const consumedEnd = m.index + m[0].length + (locusMatch ? spaceSkip.length + locusMatch[0].length : 0);
	return { sigla: m[0], matchStart: m.index, consumedEnd, locus };
}

/** True if a "cf."/"Cf." token sits directly before `pos` — the fallback for `Cf.` appearing mid-clause rather than at its start (ported from xrefs.py's `_preceded_by_cf`). */
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
 * Parse one `;`-delimited clause (ported from xrefs.py's `parse_citation`
 * loop body) into segments that reproduce the clause's exact original text
 * with any recognized reference woven in as a non-text segment.
 */
function parseClause(rawClause: string, cfg: LangConfig, state: ClauseState): RefSegment[] {
	if (rawClause === '') return [];

	const cfMatch = /^(\s*)((?:Cf|cf)\.?\s*)/.exec(rawClause);
	const pos = cfMatch ? cfMatch[0].length : 0;
	const clauseCf = Boolean(cfMatch);

	// 1. Scripture book search, retrying past a book-shaped false lead (e.g.
	//    "Ad Eph." with no chapter after it — see xrefs.py's
	//    test_book_like_prefix_does_not_block_later_real_ref).
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
		if (consumedEnd < rawClause.length) segs.push(textSeg(rawClause.slice(consumedEnd)));
		return segs;
	}

	// 2. Bookless continuation of the previously established book — requires
	//    an actual verse component (a bare chapter-shaped number is too
	//    ambiguous to attach to the running book; see xrefs.py's docstring
	//    on the known bare-verse-continuation gap).
	if (state.currentBook) {
		const leadSpace = /^ */.exec(rawClause.slice(pos))![0];
		const digitsStart = pos + leadSpace.length;
		if (/^\d/.test(rawClause.slice(digitsStart))) {
			const cv = parseRefNumbers(rawClause.slice(digitsStart), cfg, state.currentBook);
			if (cv.chapter !== null && cv.verses.length > 0 && cv.chapter <= MAX_CHAPTER[state.currentBook]) {
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
				if (consumedEnd < rawClause.length) segs.push(textSeg(rawClause.slice(consumedEnd)));
				return segs;
			}
		}
	}

	// 3. Document sigla.
	const dm = findDocumentAt(cfg, rawClause, pos);
	if (dm) {
		const segs: RefSegment[] = [];
		if (dm.matchStart > 0) segs.push(textSeg(rawClause.slice(0, dm.matchStart)));
		segs.push({
			kind: 'document',
			sigla: dm.sigla,
			locus: dm.locus,
			expansion: cfg.documentSigla.get(dm.sigla) ?? null,
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
	for (const part of text.split(/(;)/)) {
		if (part === ';') segs.push(textSeg(';'));
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
export function parseRefs(text: string, opts?: RefsOpts): RefSegment[] {
	if (!text) return [];
	if (isBareNumberList(text)) return parseBareCccList(text);
	return parseCitationClauses(text, configFor(opts?.lang));
}

/**
 * Linkify references appearing inside running prose ("cf. 1212",
 * "Cf. Jn 3:16", "cf. nn. 1212-1215"). Deliberately conservative: a bare
 * number in prose is a false positive waiting to happen (chapter numbers,
 * years, footnote markers, ordinary counting all look identical to a CCC
 * paragraph number), so this only fires immediately after an explicit
 * "cf."/"Cf." token, never on a bare number by itself. Under-linking here
 * is far cheaper than a wrong link — same principle as the rest of this
 * module, just with a narrower trigger since prose has no `;`-clause
 * structure to lean on.
 */
export function linkifyProse(text: string, opts?: RefsOpts): RefSegment[] {
	if (!text) return [];
	const cfg = configFor(opts?.lang);
	const CF_RE = /\bcf\.\s*/gi;
	const NUM_LIST_RE = /^\d+(?:\s*[-–]\s*\d+)?(?:\s*,\s*\d+(?:\s*[-–]\s*\d+)?)*/;
	const LABEL_RE = /^nn?\.\s*/i;

	const segs: RefSegment[] = [];
	let last = 0;
	let m: RegExpExecArray | null;
	while ((m = CF_RE.exec(text))) {
		const cfStart = m.index;
		let pos = m.index + m[0].length;

		const label = LABEL_RE.exec(text.slice(pos));
		if (label) pos += label[0].length;

		let ref: RefSegment[] | null = null;
		let refEnd = pos;

		const numMatch = NUM_LIST_RE.exec(text.slice(pos));
		if (numMatch) {
			ref = parseBareCccList(numMatch[0]);
			refEnd = pos + numMatch[0].length;
		} else {
			// A scripture ref must immediately follow "cf. " (or its "nn."
			// label) — a search-anywhere here would risk linking an unrelated
			// book-shaped word later in the sentence.
			const bm = findBookAt(cfg, text, pos);
			if (bm && bm.matchStart === pos) {
				const spaceAfter = /^ */.exec(text.slice(bm.matchEnd))![0];
				const afterBook = bm.matchEnd + spaceAfter.length;
				const cv = parseRefNumbers(text.slice(afterBook), cfg, bm.osis);
				if (cv.chapter !== null && cv.chapter <= MAX_CHAPTER[bm.osis]) {
					refEnd = afterBook + cv.consumed;
					ref = [
						{
							kind: 'scripture',
							osis: bm.osis,
							chapter: cv.chapter,
							verses: cv.verses,
							raw: text.slice(pos, refEnd)
						}
					];
				}
			}
		}

		if (ref) {
			if (cfStart > last) segs.push(textSeg(text.slice(last, cfStart)));
			segs.push(textSeg(text.slice(cfStart, pos)));
			segs.push(...ref);
			last = refEnd;
			CF_RE.lastIndex = refEnd;
		}
		// Else: this "cf." isn't followed by anything ref-shaped — leave it as
		// plain text and keep scanning for the next occurrence.
	}
	if (last < text.length) segs.push(textSeg(text.slice(last)));
	return mergeText(segs);
}

/**
 * Where a segment points, given the reader's current editions. `undefined`
 * means "not linkable" — a `text`/`document` segment (documents have
 * nothing to link to yet, see the module docblock), or a scripture segment
 * whose book/chapter isn't present in the reader's current Bible edition.
 * Never returns a dead link.
 *
 * CCC and Compendium URLs are edition-free (docs: "URLs for CCC and
 * Compendium stay edition-free") and their paragraph/question numbering is
 * a single fixed canonical range, so those two cases don't need to consult
 * the corpus at all — only scripture depends on which edition is open.
 */
export function refHref(seg: RefSegment, ctx: { bibleWorkId?: string }): string | undefined {
	if (seg.kind === 'ccc') return `/ccc/${seg.n}`;
	if (seg.kind === 'compendium') return `/compendium/${seg.n}`;
	if (seg.kind !== 'scripture') return undefined; // 'text' and 'document' never link

	if (!ctx.bibleWorkId) return undefined;
	const book = findBookByAbbrev(ctx.bibleWorkId, seg.osis);
	if (!book) return undefined;

	const exists = (osis: string, chapterN: number, verseN?: number): boolean => {
		const chapter = book.chapters.find((c) => c.n === chapterN);
		if (!chapter) return false;
		return verseN === undefined || chapter.verses.some((v) => v.n === verseN);
	};

	// The CCC cites some passages in HEBREW/Masoretic versification while
	// both v1 Bible editions print the VULGATE's — CCC 678's "Mal 3: 19" is
	// Vulgate Mal 4:1. docs/link-surface.md originally scoped this
	// divergence to the Psalms and to jump-box typing only; it is neither
	// (see versification.ts's docblock for the corpus-wide measurement that
	// found it, including Malachi and Joel).
	//
	// The mapping is applied UNCONDITIONALLY for books versification.ts
	// knows to diverge — not merely as a fallback once the literal address
	// fails to exist. A citation's literal Hebrew chapter number can be a
	// real but WRONG Vulgate chapter (Vulgate Joel 3 is a different psalm's
	// worth of text than Hebrew Joel 3 — it's Hebrew Joel 4), so "try the
	// literal address, only convert on failure" would silently link "Joel
	// 3:1-5" to the wrong chapter forever, since Vulgate Joel 3:1-5 trivially
	// exists. Under-linking is acceptable; a plausible-looking wrong link is
	// not (see the module docblock's design principle) — so for these books
	// the converted address IS "the reference as given", and the raw literal
	// number is never tried on its own.
	let chapterN = seg.chapter;
	let anchorVerse: number | undefined;

	if (isDivergentBook(seg.osis)) {
		const firstVerse = seg.verses[0];
		const withVerse =
			firstVerse !== undefined ? resolveVulgate(seg.osis, seg.chapter, firstVerse, exists) : undefined;
		if (withVerse) {
			chapterN = withVerse.chapter;
			anchorVerse = withVerse.verse;
		} else {
			// Either no verse was given, or the mapped verse doesn't exist in
			// this edition (e.g. a malformed source citation) — fall back to
			// just placing the chapter, same "degrade rather than emit a dead
			// anchor" behavior as the non-divergent path below.
			const chapterOnly = resolveVulgate(seg.osis, seg.chapter, undefined, exists);
			if (!chapterOnly) return undefined; // the mapped chapter doesn't exist in this edition at all
			chapterN = chapterOnly.chapter;
		}
	} else {
		if (!exists(seg.osis, chapterN)) return undefined;
		anchorVerse = seg.verses[0] !== undefined && exists(seg.osis, chapterN, seg.verses[0]) ? seg.verses[0] : undefined;
	}

	const anchor = anchorVerse !== undefined ? `#v${anchorVerse}` : '';
	const edition = workIdToEdition(ctx.bibleWorkId);
	return `/bible/${edition}/${seg.osis}/${chapterN}${anchor}`;
}
