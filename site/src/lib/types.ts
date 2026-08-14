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

export type WorkType = 'bible' | 'catechism';

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

export type WorkManifest = BibleManifest | CatechismManifest;

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
	/** [first, last] CCC paragraph numbers this node spans, inclusive. */
	paragraphs: [number, number];
	children: CccNode[];
}

export interface CccCitation {
	/** Marker key, matches a `⟦marker⟧` token in the paragraph's `text_marked` blocks. */
	marker: string;
	/** Raw footnote text as printed, verbatim — unparsed in v1. */
	text: string;
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
