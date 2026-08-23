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

export type WorkType =
	'bible' | 'bible-intro' | 'catechism' | 'compendium' | 'document' | 'prayer' | 'summa';

/**
 * Bare language subtag the corpus ships content in (see `baseLang` in
 * corpus.ts). Deliberately a wider set than `UiLang` in i18n.svelte.ts:
 * `la` is a language readers want the TEXT in (the Clementine Vulgate) and
 * nobody wants the interface in.
 */
export type ContentLang = 'en' | 'pt' | 'la';

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

/**
 * A language's book introductions (`bible-intro.{lang}`). NOT `type: 'bible'`,
 * and the distinction is load-bearing: `listBibleWorks()` filters on that type
 * to build the edition menu, so a work typed as a Bible here would offer
 * itself to readers as a fourth translation of scripture.
 */
export interface BibleIntroManifest extends WorkManifestBase {
	type: 'bible-intro';
	/** Lowercase OSIS codes that have an introduction, canonical order. */
	books: string[];
	/** `osis -> the book whose introduction covers it`, where the source prints
	 *  one preface for two volumes (Challoner: 4 Kings, 2 Paralipomenon). */
	shared_preface_with: Record<string, string>;
}

export interface CatechismManifest extends WorkManifestBase {
	type: 'catechism';
}

export interface CompendiumManifest extends WorkManifestBase {
	type: 'compendium';
}

/**
 * The five parts of the Summa, as the work's own citations spell them.
 *
 * Roman, because that is the form every citation in this corpus resolves to
 * — including the Portuguese Catechism's, which prints Arabic (`Summa
 * theologiae, 1-2, q. 79, a. 1`) and is normalized to `I-II` on the way in
 * (see the scraper). `Suppl` is the Supplementum, which `summa.en` carries
 * and `summa.la` does not: the Corpus Thomisticum publishes no Latin
 * Supplement, it being a posthumous compilation rather than Aquinas's own
 * text for this work.
 */
export type SummaPart = 'I' | 'I-II' | 'II-II' | 'III' | 'Suppl';

export interface SummaManifest extends WorkManifestBase {
	type: 'summa';
	/** The parts this edition actually carries, in order. */
	parts: SummaPart[];
	question_count: number;
	article_count: number;
	corrections_applied?: number;
}

/**
 * The divisions of a scholastic article, which are an ADDRESS SPACE and not
 * a rendering hint: this corpus's own footnotes cite `co.` (the body) and
 * `ad 3` (the third reply) as locators, so they are stored as structure
 * rather than flattened into prose.
 *
 * `preamble` is the one member that is not Aquinas's: it holds prose the
 * English edition prints before the first objection — a translator's
 * bracketed note, on 2 articles of 3,113 — and is deliberately outside the
 * citable set. Nothing may cite it, and it exists only so that text is
 * neither dropped nor mis-filed as the body.
 */
export type SummaDivisionKind = 'preamble' | 'objection' | 'sed-contra' | 'corpus' | 'reply';

export interface SummaDivision {
	kind: SummaDivisionKind;
	/** The ordinal of an objection or reply; absent on the body and the sed contra. */
	n?: number;
	blocks: { html: string }[];
}

export interface SummaArticle {
	n: number;
	/** Empty in `summa.la`, which prints no article titles — only addressed text. */
	title: string;
	divisions: SummaDivision[];
}

export interface SummaQuestion {
	part: SummaPart;
	n: number;
	/** Empty in `summa.la`, which prints no question titles. */
	title: string;
	/** The question's own preamble, before its first article. */
	prologue: { html: string }[];
	articles: SummaArticle[];
	/**
	 * Divisions hanging off the QUESTION rather than an article. Present only
	 * for the article-less questions (I q. 71 and I q. 72), which both sources
	 * agree have no articles at all — their objections, body and replies
	 * belong to the question itself. Absent everywhere else, rather than an
	 * empty array, so its presence is the signal.
	 */
	divisions?: SummaDivision[];
}

/**
 * A heading in the Summa's table of contents. Flat and document-ordered,
 * with ranges DERIVED rather than stored — the same shape and the same
 * reasoning as the documents' `DocumentNode` (docs/decisions.md,
 * 2026-08-21: "Nothing stored is nothing to drift").
 *
 * `part` is the extra field the documents' node does not need: question
 * numbering restarts at 1 in each part, so `before` alone does not identify
 * a position in the work.
 */
export interface SummaNode {
	level: number;
	part: SummaPart;
	title: string;
	/** The question number this heading precedes; `null` for trailing matter. */
	before: number | null;
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
	 * The masthead the source page itself prints above the text -- the kind of
	 * document, its title, the promulgating pontiff, the date -- as narrowed
	 * html (`docs/corpus-schema.md`, amended 2026-08-21), with vatican.va's
	 * language selector stripped. This is real content, not chrome: it is what
	 * the printed edition puts on its first page. Kept out of `structure.json`
	 * because it is not a heading -- left in the block stream it became a
	 * phantom top-level node, and Rerum Novarum's entire two-node "outline"
	 * was its own title and subtitle. Absent for a work whose page prints
	 * none; render nothing rather than a placeholder.
	 */
	header?: string;
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
	| BibleManifest
	| BibleIntroManifest
	| CatechismManifest
	| CompendiumManifest
	| DocumentManifest
	| PrayerManifest
	| SummaManifest;

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

/**
 * A book's introduction — the reader meets it as chapter 0 of the book.
 *
 * NOT part of `BibleBook`, and the separation is the point. An introduction
 * describes the book rather than the translation, so it is keyed by language
 * (`bible-intro.{lang}`) and shared across every edition of that language;
 * and its prose is not verses, so folding it into `chapters` would make it
 * indistinguishable from scripture to everything that reads chapter/verse
 * numbers — see `sync-corpus.mjs`'s `bibleIntroIndex` for the full list of
 * what that would have broken.
 */
export interface BibleIntro {
	/** Lowercase OSIS code of the book this introduces. */
	osis: string;
	blocks: BibleIntroBlock[];
}

export interface BibleIntroBlock {
	text: string;
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
	/**
	 * DOCUMENTS ONLY, and the reason it lives on the shared node rather than
	 * beside it: the sidebar TOC is one component across the CCC, the
	 * Compendium and documents, and a document's rows must address the
	 * HEADING they name, not the section that happens to follow it.
	 *
	 * An in-page fragment id (`h12`) matching the `id` the document route
	 * puts on that same heading. Both come from one indexed list, so the
	 * table of contents and the text it describes cannot disagree. Absent
	 * for the CCC and Compendium, whose rows address a unit number and are
	 * their own pages.
	 */
	anchor?: string;
	/**
	 * DOCUMENTS ONLY. The division identifier printed above the title
	 * ("CHAPTER THREE"), shown as the row's marker. See `DocumentNode.ident`
	 * for why the two are stored apart.
	 */
	label?: string;
	/** DOCUMENTS ONLY. `title` with the source's partial inline emphasis kept
	 *  — see `DocumentNode.title_html`. Absent means `title` is already plain. */
	titleHtml?: string;
	/**
	 * `title` with the source's own footnote references left where it printed
	 * them, as `⟦marker⟧` tokens — the heading counterpart of
	 * `CccBlock.text_marked`, and paired with `citations` below exactly as a
	 * paragraph's two fields are (docs/corpus-schema.md, added 2026-08-23).
	 *
	 * Absent unless the heading carries at least one reference, which is two
	 * nodes in the whole corpus. `title` is ALWAYS the plain form, so a
	 * consumer that just wants to print a heading reads that and needs to know
	 * nothing about this.
	 *
	 * Snake_case, unlike `titleHtml`/`anchor`/`label` above, because those
	 * three are built in TypeScript by `buildDocumentOutline` while this one
	 * is read straight off `structure.json`.
	 */
	title_marked?: string;
	/**
	 * The footnotes `title_marked`'s tokens point at, same entry shape as a
	 * paragraph's. Absent when the heading has none.
	 *
	 * A TOC or index row is a link, so it must NOT render these — a disclosure
	 * button inside an anchor is invalid markup. The reading views, where a
	 * heading is a real heading, render them the way body prose does.
	 */
	citations?: CccCitation[];
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

/**
 * A heading in a DOCUMENT's structure (`docs/corpus-schema.md`, amended
 * 2026-08-21). Deliberately NOT `StructureNode`: documents record what the
 * source shows rather than what it means.
 *
 * - `level` is observed depth, 1-based and contiguous within the document. It
 *   is not a taxonomy. The old `kind` made the scraper judge whether a heading
 *   *meant* "chapter" or "section", which the sources do not reliably encode,
 *   and that judgement is what nested chapters inside sections in Gaudium et
 *   Spes.
 * - `before` is the section number this heading precedes — its anchor. `null`
 *   is trailing matter the numbered flow never reaches, and is unlinkable, the
 *   same posture as a null `paragraphs` bound on a `CccNode`.
 * - The array is FLAT and in document order. Nesting and ranges are derived:
 *   a heading owns sections from its anchor until the next heading of equal or
 *   shallower `level`. Storing ranges is what let them drift from the text.
 */
export interface DocumentNode {
	level: number;
	title: string;
	before: number | null;
	/**
	 * The division identifier the source prints on its own line above the
	 * title — "CHAPTER THREE", "PRIMEIRA PARTE" — when it prints one.
	 *
	 * Stored apart from `title` rather than folded into it because they are
	 * different things: the identifier names the division's place in a
	 * sequence, the title names its subject, and a renderer wants them
	 * typeset differently (and a table of contents may want only one). The
	 * scraper merges the two printed paragraphs into one heading; keeping
	 * three nodes made them three TOC rows all anchored to the same section.
	 */
	ident?: string;
	/** Further heading lines below the title, joined — the second title line
	 *  a chapter opening sometimes carries. Same merge, same reasoning. */
	subtitle?: string;
	/**
	 * `title` with the source's PARTIAL inline emphasis kept — present on the
	 * 275 headings that carry any. The emphasis wrapping a whole heading is
	 * the scraper's own detection signal and is not stored, so this appears
	 * only where the source distinguished words *within* the title: an
	 * encyclical name (`THE MESSAGE OF <i>POPULORUM PROGRESSIO</i>`), a
	 * scripture reference, or a Latin phrase (`The <i>res novae</i> of our
	 * time`). `title` stays the plain form and the two must agree.
	 */
	title_html?: string;
}

export interface CccCitation {
	/** Marker key, matches a `⟦marker⟧` token in the paragraph's `text_marked` blocks. */
	marker: string;
	/** Raw footnote text as printed, verbatim — unparsed in v1. */
	text: string;
	/**
	 * Set only on a citation the source printed INLINE, in the running text,
	 * instead of as a numbered note — the Portuguese Catechism types Scripture
	 * locators straight into the sentence where English footnotes them. Holds
	 * the source's parenthesis verbatim, "(Mt 28, 19-20)", leading-space
	 * irregularities and all; `text` is the same locator with the parentheses
	 * off, for the citation parser. Its presence is what tells a renderer to
	 * print the citation where it stands rather than as a footnote marker.
	 */
	label?: string;
}

export type CccBlockKind = 'prose' | 'quote';

export interface CccBlock {
	/** Absent means `'prose'` — the corpus omits the default so that every
	 *  stored `kind` marks a real exception (docs/corpus-schema.md; the
	 *  scrapers' `BlockOut.to_dict`). Read it by comparing against the
	 *  exception you care about (`kind === 'quote'`), never against
	 *  `'prose'`, which an ordinary block no longer carries. */
	kind?: CccBlockKind;
	/**
	 * Block text with inline footnote markers preserved as `⟦marker⟧` tokens.
	 *
	 * Optional because a DOCUMENT block ships without it: it is derivable
	 * from `html`, so `sync-corpus.mjs` drops it from the shipped copy
	 * (`thinDocumentSections`) while the corpus on disk keeps it as the
	 * round-trip oracle's expected value. Exactly one of `text_marked` and
	 * `html` is guaranteed present — the CCC and Compendium have the former
	 * and not the latter, shipped documents the reverse — so a renderer must
	 * handle both; `CccParagraphText`'s `nodesFor` is the one place that does.
	 */
	text_marked?: string;
	/**
	 * The same text with the source's inline markup kept, restricted to the
	 * stored allowlist and with footnote markers as `<sup data-fn="N"></sup>`
	 * (docs/corpus-schema.md, amended 2026-08-21). `text_marked` remains the
	 * plain form and the two are required to agree.
	 *
	 * Optional because the CCC and Compendium have not been migrated: their
	 * blocks carry `text_marked` only, so a renderer must fall back to it
	 * rather than assume this is present.
	 */
	html?: string;
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
	/** Absent means `'prose'` — see `CccBlock.kind`. */
	kind?: CompendiumBlockKind;
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

/**
 * The same relation for magisterial documents: which SECTION of which
 * document cites which verses.
 *
 * Keyed by the document's edition-free `slug` (`"lumen-gentium"`), not a work
 * id, because that is what a link addresses and because the two language
 * editions of one document are unioned into a single entry — see
 * `scripts/build-xrefs.mjs`.
 */
export interface DocumentBibleXref {
	work: string;
	n: number;
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
	/** Absent means `'prose'` — see `CccBlock.kind`. */
	kind?: PrayerBlockKind;
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
