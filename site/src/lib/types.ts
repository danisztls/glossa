/**
 * Types mirroring the corpus data contract in `docs/corpus-schema.md`.
 * Keep this file in sync with that document — it is the single source of
 * truth for what `pipeline/` produces and `site/` consumes.
 */

export type Bcp47 = string;

/** ISO 8601 date (`2026-08-14`) or date-time (`2026-08-14T12:00:00Z`) string. */
export type IsoDate = string;

export interface SourceRef {
	url: string;
	retrieved_at: IsoDate;
}

export type CopyrightStatus = 'public-domain' | 'copyrighted';

export interface Copyright {
	status: CopyrightStatus;
	holder: string | null;
	notice: string | null;
}

export type WorkType = 'bible' | 'catechism' | 'compendium' | 'document' | 'prayer';

/** Bare language subtag the corpus ships content in (see `baseLang` in corpus.ts). */
export type ContentLang = 'en' | 'pt';

interface WorkManifestBase {
	id: string;
	type: WorkType;
	title: string;
	short_title: string;
	language: Bcp47;
	edition: string;
	sources: SourceRef[];
	copyright: Copyright;
	notes: string;
	generated_at: IsoDate;
}

export type PsalmNumbering = 'vulgate';

export interface BibleManifest extends WorkManifestBase {
	type: 'bible';
	psalm_numbering: PsalmNumbering;
	/** Lowercase OSIS codes, canonical 73-book order. */
	books: string[];
}

export interface CatechismManifest extends WorkManifestBase {
	type: 'catechism';
}

export interface CompendiumManifest extends WorkManifestBase {
	type: 'compendium';
}

export type DocumentKind =
	| 'conciliar-constitution'
	| 'conciliar-decree'
	| 'conciliar-declaration'
	| 'encyclical'
	| 'apostolic-exhortation'
	| 'apostolic-constitution'
	| 'cdf-declaration'
	// The schema (docs/corpus-schema.md §Documents) deliberately leaves this
	// open-ended ("…") rather than a closed enum -- a future family this
	// union hasn't been extended for yet should still type-check as a valid
	// document, not force a corpus-wide manifest cast at the ingestion site.
	| (string & {});

/**
 * A prayer collection's manifest -- currently one work, `prayer.common.
 * {lang}` (docs/corpus-schema.md "Prayers"): the Compendium of the CCC's
 * Appendix A plus three already-cached CCC texts, all re-parsed without a
 * second fetch. `{slug}` in the work id (`common`
 * today) leaves room for a later, larger collection to ship as its own work
 * without growing this one unboundedly -- see that section for why.
 */
export interface PrayerManifest extends WorkManifestBase {
	type: 'prayer';
}

export interface DocumentManifest extends WorkManifestBase {
	type: 'document';
	document_kind: DocumentKind;
	/** e.g. "Second Vatican Council", "John Paul II", "Congregation for the Doctrine of the Faith". */
	pontiff_or_council: string;
	/** The document's own promulgation date (ISO 8601 date) -- distinct from `sources[].retrieved_at`. */
	promulgated: IsoDate;
	/**
	 * One-line summary of what the document is about, shown in the
	 * `/documents` list. Optional and currently absent from every manifest in
	 * the corpus: the pipeline has no source for it (vatican.va publishes no
	 * abstract), so these are expected to be written or generated separately
	 * and backfilled. Consumers must render nothing rather than a placeholder
	 * when it is missing -- an empty line is honest, "No description" is
	 * noise repeated 345 times.
	 */
	description?: string;
}

export type WorkManifest =
	BibleManifest | CatechismManifest | CompendiumManifest | DocumentManifest | PrayerManifest;

export interface VerseNote {
	marker: string;
	text: string;
}

export interface Verse {
	n: number;
	text: string;
	notes?: VerseNote[];
}

export interface ChapterHeading {
	/** Verse number this heading is printed immediately before. */
	before_verse: number;
	text: string;
}

export interface Chapter {
	n: number;
	verses: Verse[];
	/** Section headings the source prints inside the chapter, if any. */
	headings?: ChapterHeading[];
}

export interface BibleBook {
	/** Lowercase OSIS code, matches the source filename. */
	osis: string;
	name: string;
	/** Lowercase abbreviations for the jump box, including common local forms. */
	abbrevs: string[];
	/** 1-based position in the 73-book canonical order. */
	order: number;
	chapters: Chapter[];
}

export type CccNodeKind =
	'prologue' | 'part' | 'section' | 'chapter' | 'article' | 'sub' | 'in-brief';

export interface CccNode {
	kind: CccNodeKind;
	/** Ordinal within its parent, when the source numbers it. */
	n: number | null;
	title: string;
	/**
	 * [first, last] paragraph numbers this node spans, inclusive. Either bound
	 * may be `null` (docs/corpus-schema.md, amended 2026-08-14): this marks
	 * unnumbered content the structure knows about but no paragraph number
	 * addresses (creed texts, Decalogue epigraphs, catechetical formulas).
	 * Treat a non-finite bound as unaddressable — never as `n < null` (which
	 * JS coerces to `n < 0` and would falsely match).
	 */
	paragraphs: [number | null, number | null];
	children: CccNode[];
}

/**
 * Structure nodes are the same shape for the Catechism and the Compendium
 * (docs/corpus-schema.md "Compendium — questions.json": "`structure.json`
 * uses the same node schema as the CCC"). For a Compendium tree, `paragraphs`
 * is a misnomer inherited from that shared shape — it holds first/last
 * **Compendium question numbers**, not CCC paragraph numbers. Callers walking
 * a Compendium `StructureNode[]` must read `.paragraphs` as a question range.
 */
export type StructureNode = CccNode;

export interface CccCitation {
	/** Marker key, matches a `⟦marker⟧` token in the paragraph's `text_marked` blocks. */
	marker: string;
	/** Raw footnote text as printed, verbatim — unparsed in v1. */
	text: string;
	/**
	 * A Portuguese source may print a Scripture citation directly in the prose
	 * where English prints a numbered footnote. Preserve the exact source
	 * locator in data while rendering its location as a generated numeric
	 * footnote marker.
	 */
	label?: string;
	/** Reader-facing sequence number; differs from `marker` only when PT's
	 * source-inline Scripture citations are interleaved with its printed notes. */
	number?: string;
}

export type CccBlockKind = 'prose' | 'quote';

export interface CccBlock {
	kind: CccBlockKind;
	/** Block text with inline footnote markers preserved as `⟦marker⟧` tokens. */
	text_marked: string;
	/** Set-off byline under an indented quote (e.g. "St. Augustine, Conf. 1, 1"); only when the source prints one. */
	attribution?: string;
}

export interface CccParagraph {
	n: number;
	blocks: CccBlock[];
	/** Derived: all blocks joined, markers stripped, spaces normalized — for search and plain rendering. */
	text: string;
	in_brief: boolean;
	citations: CccCitation[];
	/** Marginal cross-references: other CCC paragraph numbers on the same theme. */
	related: number[];
	notes: string[];
}

export type CccAbbreviationKind = 'scripture' | 'document';

export interface CccAbbreviation {
	abbr: string;
	expansion: string;
	kind?: CccAbbreviationKind;
}

// --- Compendium ------------------------------------------------------------

export type CompendiumBlockKind = 'prose' | 'quote';

export interface CompendiumBlock {
	kind: CompendiumBlockKind;
	text: string;
	/** Set-off byline under a quote block; only when the source prints one. */
	attribution?: string;
}

export interface CompendiumQuestion {
	n: number;
	question: string;
	answer_blocks: CompendiumBlock[];
	/**
	 * RAW reference string to the CCC paragraphs this question condenses, as
	 * printed (e.g. "279-289, 296-298"). Store-raw principle (docs/link-surface.md):
	 * never pre-parsed in the corpus — expand ranges in a derived pass.
	 */
	ccc_refs: string;
}

// --- Cross-references (xrefs/ccc-bible.json, generated) --------------------

export interface ScriptureRef {
	osis: string;
	chapter: number;
	/** Empty array means "whole chapter". */
	verses: number[];
	/** True when the source prints this as a "cf." (comparative) reference. */
	cf?: boolean;
}

export interface CccBibleXref {
	ccc: number;
	refs: ScriptureRef[];
}

// --- Documents (encyclicals, conciliar texts, curial documents) ------------
//
// docs/corpus-schema.md §Documents: `structure.json` reuses `StructureNode`
// (the CCC/Compendium tree shape) verbatim -- `.paragraphs` holds document
// SECTION numbers here, a third meaning for that one generic field name (CCC
// paragraph numbers, Compendium question numbers, now document section
// numbers). `sections.json` reuses the CCC's `blocks`/`text_marked`/
// `citations`/`text` block model exactly (`CccBlock`/`CccCitation` below are
// literally the same wire shape, not just similar), which is what lets
// `CccParagraphText.svelte` render a `DocumentSection` with no changes to
// its own type beyond the widened prop signature it already documents.

export interface DocumentSection {
	n: number;
	blocks: CccBlock[];
	/** Derived: all blocks joined, markers stripped, spaces normalized. */
	text: string;
	citations: CccCitation[];
	// No `related` (no marginal cross-reference apparatus in any document
	// family sampled) and no `in_brief` (a CCC-only summarization device) --
	// both deliberately absent rather than carried as permanently-empty
	// fields, per corpus-schema.md's own note on this shape.
}

// --- Prayers (docs/corpus-schema.md §Prayers) -------------------------------
//
// A prayer collection has no numbered units at all -- unlike every other
// work type above, none of which this schema invents a number for either,
// but all of which at least have ONE the source itself prints (a CCC
// paragraph, a Compendium question, a document section). Here the source
// prints nothing to capture, so addressing runs on `Prayer.slug` --
// language-invariant, kebab-case, English-derived -- never on `n`, which is
// kept only as the print-order integer (docs/corpus-schema.md: "the actual
// address"). `structure.json` reuses `StructureNode` (types.ts, above)
// purely for grouping, same as the CCC/Compendium -- every prayer section's
// `paragraphs` is `[null, null]` throughout, since there is no number range
// to carry, not even an unaddressable one.

export type PrayerKind = 'simple' | 'dialogic' | 'group';

/** Beyond the CCC/Compendium's `prose`/`quote` pair (types.ts, above):
 *  `versicle`/`response` are the leader/assembly halves of a dialogic
 *  prayer (the Angelus's V./R.). */
export type PrayerBlockKind = 'prose' | 'versicle' | 'response';

export interface PrayerBlock {
	kind: PrayerBlockKind;
	text: string;
	/** Verbatim printed prefix on a versicle/response line -- `"V."`/`"R."`
	 *  in most sources, PT's own Angelus and Rosary-closing dialogue use
	 *  `"D."`/`"C."` instead. Kept exactly as printed, never normalized to a
	 *  canonical V./R. (docs/corpus-schema.md "Prayers"). Present only on
	 *  `versicle`/`response` blocks -- absent on `prose`. */
	label?: string;
}

/** A full alternate wording the source prints under the SAME title
 *  (regional adaptations -- EN's Regina Caeli UK/USA split is the only
 *  instance in v1). Not to be confused with a translation difference
 *  between language editions, which is just two separate top-level works --
 *  see docs/corpus-schema.md "Prayers". */
export interface PrayerVariant {
	label: string;
	blocks: PrayerBlock[];
}

/** A prayer's Latin companion text -- a FIELD on the prayer, not a third
 *  edition/work (docs/corpus-schema.md "Prayers": "Latin is a field, not an
 *  edition"). Present on 21 of 28 prayers in the real corpus; genuinely
 *  absent (not a capture gap) for the three Eastern-rite prayers, which the
 *  source prints with no Latin text in either language. */
export interface PrayerLatin {
	title: string;
	blocks: PrayerBlock[];
}

/** One Rosary mystery: its printed title and the Scripture meditation that
 * accompanies it on Vatican's mystery page. */
export interface PrayerMysteryItem {
	title: string;
	meditation: string;
	/** Verbatim terminal Scripture locator from the Vatican meditation page;
	 * rendered as the site's inline citation/footnote rather than repeated
	 * in the meditation prose. */
	citation?: { marker: string; text: string };
}

/** One named group of items -- the Rosary's four mystery groups, each with
 *  a weekday rubric and five full mysteries -- captured directly rather than
 *  flattened into `blocks`, because that flattening would destroy the one
 *  thing this shape exists to keep (docs/corpus-schema.md "Prayers"). */
export interface PrayerGroupEntry {
	name: string;
	/** Free text attached to this GROUP specifically (e.g. "(recited Monday
	 *  and Saturday)") -- distinct from `Prayer.rubric`, which attaches to
	 *  the whole prayer. */
	rubric: string | null;
	items: PrayerMysteryItem[];
}

/** Source-provided directions attached to a prayer. Present for the Rosary,
 * whose Vatican mystery pages give the opening invocation and each decade's
 * order after the twenty meditations. */
export interface PrayerInstructions {
	title: string;
	blocks: PrayerBlock[];
}

export interface Prayer {
	/** Print order -- ordering only, never addressing. See `slug`. */
	n: number;
	/** Stable, language-invariant identifier -- the actual address
	 *  (`/prayers/{slug}`), unrelated to and never derived from `title`
	 *  (e.g. "Under Your Protection" addresses as `sub-tuum-praesidium`, the
	 *  Latin incipit, not a slugified English title). */
	slug: string;
	title: string;
	/** Derived from what was actually parsed, not asserted per prayer:
	 *  `"group"` whenever `groups` is present, `"dialogic"` whenever any
	 *  block is a versicle/response, `"simple"` otherwise. Can legitimately
	 *  differ between this work's two language editions for the same slug --
	 *  source-faithful, the same way structure trees are per-language. */
	kind: PrayerKind;
	blocks: PrayerBlock[];
	/** Present only when the source prints more than one full wording under
	 *  this title -- absent (not `[]`) otherwise. */
	variants?: PrayerVariant[];
	/** Present only when the source prints Latin for this prayer -- absent
	 *  (not `null`) otherwise, so `!!prayer.latin` alone answers "does this
	 *  prayer have a Latin companion." */
	latin?: PrayerLatin;
	rubric: string | null;
	/** Present only on prayers structured as named groups of items rather
	 *  than flowing text (today: the Rosary alone). */
	groups?: PrayerGroupEntry[];
	/** Optional source-provided directions for praying this prayer. */
	instructions?: PrayerInstructions;
}
