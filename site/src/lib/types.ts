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
	| 'bible'
	| 'bible-intro'
	| 'catechism'
	| 'commentary'
	| 'compendium'
	| 'document'
	| 'prayer'
	| 'summa';

/**
 * Bare language subtag the corpus ships content in (see `baseLang` in
 * corpus.ts). Fourteen tags as of 2026-08-25, and the four newest are the
 * point of this comment: `hu`, `ro`, `sl` and `sv` arrived with the
 * Compendium, which vatican.va publishes in ten languages, and none of them
 * was an interface language when it did.
 *
 * THE TWO TYPES SEPARATED FOR A DAY AND ARE EQUAL AGAIN, which is the whole
 * lesson and not a reason to merge them. They were equal on 2026-08-24; the
 * Compendium's editions arrived the next day with four texts and no
 * dictionaries; the dictionaries were written the day after that. Each list
 * moved on its own schedule for its own reason — a content language arrives
 * when someone ingests a text in it, an interface language when someone
 * writes a dictionary — and in between, readers of all four got the
 * Compendium in their own language and everything else through
 * `CONTENT_LANG_FALLBACK`, which is what that chain is for and a better
 * answer than declining to store a text because the chrome around it is in
 * English.
 *
 * Nothing may be written that assumes one set is the other; today's equality
 * is an accident of timing, and the next ingestion in a language nobody has
 * written a dictionary for breaks it again. Russian is the standing example
 * pointing the other way: an interface language since Magnifica Humanitas
 * whose only Compendium is a PDF nothing parses.
 *
 * AND IT BROKE AGAIN THE NEXT DAY, exactly as that paragraph said it would.
 * The Catechism landed in the eight languages vatican.va publishes it as
 * HTML (2026-08-26), of which `mg` — Malagasy — was not a content language
 * and was not an interface language: a Malagasy reader had the whole
 * Catechism, 2,865 paragraphs, inside English chrome.
 *
 * THAT DEBT WAS PAID ON 2026-08-31, and paying it inverted the relationship
 * this docblock spent a year describing. Malagasy turned out to be one of
 * TWELVE content languages with no dictionary — Byelorussian had 31 editions
 * to Swedish's one — so the interface list was not lagging the corpus by a
 * language, it was tracking something else entirely: who had happened to
 * write a dictionary. `UI_LANGS` is now a SUPERSET of this union, plus a
 * reach tier of languages the corpus holds nothing in.
 *
 * The rule that survives is the one that matters: NOTHING MAY BE WRITTEN THAT
 * ASSUMES ONE SET IS THE OTHER. It just needs reading in the new direction —
 * an interface language is no longer evidence of content, and the next
 * ingestion in a language nobody has written a dictionary for will separate
 * them again from this side. `CONTENT_LANG_FALLBACK` is what carries a reader
 * across the gap either way.
 */
export type ContentLang =
	| 'en'
	| 'pt'
	| 'la'
	| 'de'
	| 'es'
	| 'fr'
	| 'it'
	| 'mg'
	| 'pl'
	| 'ru'
	| 'ar'
	| 'hu'
	| 'ro'
	| 'sl'
	| 'sv'
	| 'cs'
	| 'da'
	| 'fi'
	| 'hr'
	| 'lv'
	| 'nl'
	| 'sk'
	| 'sw'
	| 'vi'
	| 'be'
	| 'he'
	| 'id'
	| 'lt';

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

/**
 * Which numbering an edition's STORED text follows.
 *
 * Not a property of the corpus's address space, which is always the Vulgate:
 * it is a property of one edition's own pages, recorded so the sync can
 * convert. `bible.crampon.fr` is the first `'hebrew'` — Crampon numbers the
 * Psalter the Hebrew way and states the policy in his own footnote, and the
 * scraper stores what the page prints because `raw/` and `build/` are the
 * record of what the source said.
 *
 * The conversion happens in `scripts/sync-corpus.mjs`, which is the first
 * point downstream that can import `versification.ts` — the three
 * wholesale-divergent books are converted by an ALGORITHM that deliberately
 * exists nowhere else (`common/versification.py` refuses them rather than
 * growing a second copy). So everything reading the content tier sees Vulgate
 * addresses and no consumer needs to know this field exists.
 *
 * NOTE the field is named for the Psalter and the divergence is not confined
 * to it: Crampon runs Hebrew verse division through the Old Testament
 * generally — 156 of its 294 diverging chapters lie outside Psalms, Malachi
 * and Joel. Renaming it is a schema decision nobody has taken yet; see
 * PLAN.md.
 */
export type PsalmNumbering = 'vulgate' | 'hebrew';

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
 * `preamble` and `postscript` are the two members that are not Aquinas's,
 * and both are deliberately outside the citable set: nothing may cite them,
 * and they exist only so that the edition's own editorial matter is neither
 * dropped nor mis-filed as part of the argument. `preamble` holds the
 * translator's bracketed note that opens 2 articles of 3,113; `postscript`
 * holds the one note the edition appends after the last reply, on III q. 26
 * a. 2, which was previously stored as the continuation of `ad 3` — a
 * twentieth-century editor's essay on the Immaculate Conception sitting
 * exactly where a citation to `ad 3` lands. Both read as "Note".
 */
export type SummaDivisionKind =
	'preamble' | 'objection' | 'sed-contra' | 'corpus' | 'reply' | 'postscript';

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
 * reasoning as the documents' `DocumentNode` (docs/decisions.md §Storage:
 * "record the observable thing; derive the rest").
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

/**
 * A commentary ON another work (`commentary.haydock.en`). NOT `type: 'bible'`,
 * for the reason `BibleIntroManifest` states one stronger: this work has no
 * verses at all — the source ships notes and nothing else — so every consumer
 * of `'bible'` (the edition menu, `compare.ts`'s alignment by verse number,
 * `PREFERRED_EDITION`, the versification oracle) would be handed a translation
 * with no text in it.
 *
 * It also has no address of its own. `bible-intro` is the near precedent and
 * stops one step short: an introduction is addressed as chapter 0, and a
 * commentary note is addressed only by the verse it names in `annotates`.
 */
export interface CommentaryManifest extends WorkManifestBase {
	type: 'commentary';
	/** The work whose addresses this one's units name. Required: without it a
	 *  note resolves against nothing. */
	annotates: string;
	psalm_numbering: PsalmNumbering;
	/**
	 * Whether this commentary already contains the annotated edition's own
	 * apparatus, so that showing both prints most of one of them twice.
	 *
	 * A PROPERTY OF THE WORK, WHICH IS WHY IT IS IN THE MANIFEST. Haydock
	 * published Challoner's text with Challoner's notes absorbed into the
	 * catena, and the corpus can measure that where the interface cannot:
	 * 1,399 of the Douay-Rheims's 1,916 notes appear again in Haydock, 1,300
	 * of his paragraphs signed "Challoner" by name. `haydock.py` writes it and
	 * says so.
	 *
	 * WHAT THE SITE DOES WITH IT IS CHANGE A DEFAULT AND NOTHING MORE. The
	 * overlap is 73%, not 100% — 517 of Challoner's notes are not in the
	 * capture — so the edition's own apparatus is switched off rather than
	 * suppressed, and the panel still offers it. See
	 * `apparatus-prefs.svelte.ts`.
	 */
	subsumes_notes?: boolean;
	/** Lowercase OSIS codes this commentary reaches, canonical order. */
	books: string[];
}

export type WorkManifest =
	| BibleManifest
	| BibleIntroManifest
	| CatechismManifest
	| CommentaryManifest
	| CompendiumManifest
	| DocumentManifest
	| PrayerManifest
	| SummaManifest;

export interface VerseNote {
	/**
	 * Unique WITHIN ITS UNIT, not within the chapter — sources number
	 * footnotes per verse and restart at 1, so John 3's four notes are all
	 * marker `"1"`. A chapter-wide marker index collides immediately.
	 */
	marker: string;
	/**
	 * The words the note glosses, when the source's apparatus names them
	 * before glossing them (Challoner: `_The judgment:_ That is, …`). The
	 * token in `text_marked` sits immediately AFTER the last of these words,
	 * so a renderer that wants to mark the whole phrase walks back from the
	 * token by exactly this string. Omitted when the source names none.
	 */
	lemma?: string;
	text: string;
}

/**
 * A unit of text that may carry an apparatus. Verses and chapter headings
 * both can — some sources anchor a note inside a heading (Challoner prints
 * Jeremias's prologue before Lamentations 1:1 and footnotes it).
 */
interface Annotated {
	text: string;
	/**
	 * `text` with each note's `⟦marker⟧` token where the source sets it — the
	 * same vocabulary `CccParagraph` uses. Present only when the unit really
	 * carries apparatus, and then `text` is always this string with the tokens
	 * stripped.
	 *
	 * Every token has a `notes` entry; the converse does NOT hold. A source
	 * may print a note whose anchor it never marks, and that note is stored
	 * against its verse with a marker and no token (docs/corpus-schema.md).
	 */
	text_marked?: string;
	notes?: VerseNote[];
}

export interface Verse extends Annotated {
	n: number;
}

export interface ChapterHeading extends Annotated {
	/** Verse number this heading is printed immediately before. */
	before_verse: number;
	/**
	 * How prominent the source sets it, 1 (most) to 4 (least) — a part title,
	 * a section, a subsection, and the innermost line printed above a verse.
	 *
	 * SEVERAL HEADINGS CAN SHARE ONE `before_verse`, which is the whole reason
	 * this field exists. The Matos Soares edition sets "PRIMEIRA PARTE",
	 * "I - CRIAÇÃO DO MUNDO" and "Principio." all before Genesis 1:1, and 558
	 * of its verse numbers carry more than one heading. They arrive in level
	 * order, so a renderer can take them in sequence without sorting.
	 *
	 * PRESENTATION, NOT STRUCTURE. Verse numbering is the Bible's structure
	 * and headings hang off it — a heading names the verse it precedes and
	 * addresses nothing. Two consequences: no address ever resolves to a
	 * heading, and an edition may divide a chapter however it likes without
	 * that being a disagreement with another edition about shape.
	 *
	 * Optional because an edition ingested before 2026-08-25 has none.
	 */
	level?: number;
}

export interface Chapter {
	n: number;
	verses: Verse[];
	/**
	 * What the source prints before the chapter's verses to say what is in it
	 * — Bible typography calls it the chapter's *argument*. Belongs to the
	 * whole chapter, which is what distinguishes it from a `headings` entry:
	 * that one is a division inside the chapter and names the verse it
	 * precedes. Omitted when the edition prints none, which is three of the
	 * corpus's four.
	 */
	summary?: string;
	/** Section headings the source prints inside the chapter, if any. */
	headings?: ChapterHeading[];
}

/**
 * One authority's remark on one verse — the unit of a commentary work.
 *
 * `Annotated` because a commentary note may carry its OWN apparatus: Haydock
 * footnotes his own paragraphs with the Greek and Latin behind a rendering,
 * and that nests the `text_marked`/`notes` shape one level down on exactly the
 * terms every other unit uses.
 *
 * IT CARRIES NO `marker`, unlike `VerseNote`, and the absence is the design.
 * A `VerseNote` is anchored by a token inside its edition's own text; a
 * commentary is not part of the text it comments on — its lemma quotes the
 * annotated edition's wording, which the reader may not even have on screen —
 * so it hangs beside the verse and is named by its author instead.
 */
export interface CommentaryNote extends Annotated {
	/** The words the note glosses, as the source quotes them. */
	lemma?: string;
	/**
	 * The authority the remark is drawn from, where the source names one:
	 * "Calmet", "Worthington", "Witham". Matched against a closed vocabulary
	 * in the pipeline and omitted rather than guessed — see
	 * docs/corpus-schema.md §Commentary. This is what makes the work a catena
	 * rather than an anonymous gloss, and it is the note's printed label.
	 */
	attribution?: string;
}

export interface CommentaryVerse {
	/** Verse of the annotated work these notes are about. */
	verse: number;
	notes: CommentaryNote[];
}

export interface CommentaryChapter {
	n: number;
	verses: CommentaryVerse[];
}

export interface CommentaryBook {
	osis: string;
	order: number;
	chapters: CommentaryChapter[];
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
	 * SUMMA ONLY. The language this row's title was actually written in, when
	 * that is NOT the edition being read.
	 *
	 * The Corpus Thomisticum prints no question titles at all, so under
	 * `summa.la` every title in the outline is the English edition's,
	 * borrowed by address (`summaTitleFor`). Saying so is the difference
	 * between showing a Latin reader a helpful gloss and passing another
	 * edition's words off as this source's own — the row renders it muted
	 * and italic, and the attribute puts the real language on the element so
	 * a screen reader switches voice with it.
	 *
	 * Absent whenever the title is the edition's own, which is every row of
	 * every other work.
	 */
	titleLang?: string;
	/**
	 * DOCUMENTS ONLY. The division label printed above the title
	 * ("CHAPTER THREE"), shown as the row's marker. Same name as
	 * `DocumentNode.label`, which is where it is read from, and see there
	 * for why the label and the title are stored apart.
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
	 * The division label the source prints on its own line above the
	 * title — "CHAPTER THREE", "PRIMEIRA PARTE" — when it prints one.
	 *
	 * Stored apart from `title` rather than folded into it because they are
	 * different things: the label names the division's place in a sequence,
	 * the title names its subject, and a renderer wants them typeset
	 * differently (and a table of contents may want only one). The scraper
	 * merges the two printed paragraphs into one heading; keeping three
	 * nodes made them three TOC rows all anchored to the same section.
	 *
	 * Called `ident` until 2026-08-25. It was never an identifier: `CHAPTER
	 * ONE` picks nothing out — four of them can sit in one work, and only
	 * the enclosing trail tells them apart — it NAMES a place in a sequence,
	 * which is what a label does. The rest of the codebase had been calling
	 * it that all along (`match_label`, `OutlineRow.label`, `KIND_LABELS`),
	 * so the rename removed the one word that disagreed rather than
	 * introducing a new one.
	 */
	label?: string;
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
	 * handle both; `ProseBlocks`'s `nodesFor` is the one place that does.
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

/**
 * The Catechism's own front-matter sigla table, as its source prints it.
 *
 * TWO OF THE EIGHT EDITIONS PRINT ONE, AND THEY ARE DIFFERENT TABLES.
 * French lists 58 magisterial documents and liturgical books; Latin lists 46
 * bibliographic and editorial sigla plus all 73 Scripture books. The other
 * six mirrors open at the Prologue and carry `[]` — which is the source
 * speaking, not a gap. So this is per-edition data and never a shared table:
 * where the two overlap they disagree, `SC` being *Sacrosanctum concilium*
 * in the French list and *Sources chrétiennes* in the Latin one, and both
 * are right about their own edition's references.
 *
 * `abbr` is therefore not a key: the Latin table gives `Act` twice, as
 * *Actio* among the sigla and as *Actus Apostolorum* among the New Testament
 * books. Read the array in order, and disambiguate with `kind`.
 */
export type CccAbbreviationKind = 'scripture' | 'general';

export interface CccAbbreviation {
	abbr: string;
	expansion: string;
	/** The only division either source itself draws — Latin separates
	 *  Scripture from the rest with a heading, French has one list. */
	kind: CccAbbreviationKind;
	/** The source's own heading over this entry, verbatim ("SIGLA",
	 *  "NOVUM TESTAMENTUM", "LISTE DES SIGLES"), so a finer grouping can be
	 *  derived here rather than guessed at in the pipeline. */
	section: string;
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

/**
 * A unit that cites something — one entry in a reverse citation index.
 * `slug` is present only for `kind: 'document'`, where `n` is a section
 * number; for `kind: 'ccc'` it is a paragraph number.
 */
export interface Citer {
	kind: 'ccc' | 'document';
	slug?: string;
	n: number;
}

/**
 * Who cites one document address — the non-scripture counterpart of
 * `DocumentBibleXref`, derived by `scripts/build-xrefs.mjs` and keyed the
 * same way, by edition-free slug.
 *
 * `n` is `null` for a citation that names the document without naming a
 * section it has: a bare siglum ("cf. GS"), a spelled-out title with no
 * number after it, or a number the document does not have ("Humani generis
 * 561" is an AAS page). That is one fact about the document at large rather
 * than a fact about a section, and it is kept apart from the numbered
 * entries rather than folded into section 1.
 */
export interface DocumentCitationXref {
	work: string;
	n: number | null;
	cited_by: Citer[];
}

/** Who cites one Catechism paragraph. The other direction of the same pass. */
export interface CccCitationXref {
	ccc: number;
	cited_by: Citer[];
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
// `ProseBlocks.svelte` render a `DocumentSection` with no changes to
// its own type beyond the widened prop signature it already documents.

/** A run of prose the source prints with NO number on it, under the heading it
 *  prints above it (docs/corpus-schema.md §"An unnumbered unit").
 *
 *  Two quite different things arrive in this shape, and deliberately so: the
 *  matter a numbered document appends after its last paragraph — Lumen
 *  Gentium's Nota Explicativa Praevia, Laudato Si's two closing prayers — and
 *  the ENTIRE text of an edition that numbers nothing anywhere, of which this
 *  corpus has eight. Both are text with no citable address, so both render the
 *  same way and neither gets a `§n` in the margin. */
export interface DocumentAppendixUnit {
	/** The heading the source prints above this run. Empty when the run opens
	 *  the appendix with no heading of its own. */
	title?: string;
	blocks: CccBlock[];
	citations: CccCitation[];
}

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
	/**
	 * The block's printed LINES, joined by `<br />`, when it prints on more
	 * than one -- absent otherwise, and `text` carries the same words either
	 * way (collapsed to single spaces, which is what search and every
	 * plain-text consumer want).
	 *
	 * A PRAYER IS SET AS VERSE AND THE SOURCE SETS IT THAT WAY. The scraper
	 * used to collapse these breaks on the CCC's convention that a `<br/>`
	 * inside a block is column wrap; measured over the source's whole prayer
	 * region that is false here -- 895 lines, median length 28 characters,
	 * 73% ending on punctuation. Every prayer on the site rendered as one
	 * undifferentiated paragraph until this field existed.
	 *
	 * Same field, same name and same narrow allowlist as a document
	 * section's block (docs/corpus-schema.md), so `parseInlineHtml` already
	 * understands it and every prose renderer already emits `<br>`.
	 */
	html?: string;
	/** Verbatim printed prefix on a versicle/response line -- `"V."`/`"R."`
	 *  in most sources, PT's own Angelus and Rosary-closing dialogue use
	 *  `"D."`/`"C."` instead. Kept exactly as printed, never normalized to a
	 *  canonical V./R. (docs/corpus-schema.md "Prayers"). Present only on
	 *  `versicle`/`response` blocks -- absent on `prose`. */
	label?: string;
}

/** A prayer's Latin companion text, as the SOURCE prints it: a field on the
 *  vernacular entry, bound to the text beside it. `prayer.common.la` is
 *  derived from these and does not replace them (docs/decisions.md
 *  §Addresses and editions). Present on 21 of 28 prayers in the real corpus; genuinely
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
	/**
	 * ISO weekday numbers (1 = Monday … 7 = Sunday) this set is traditionally
	 * prayed on, read by the scraper out of the rubric the source prints and
	 * asserted against the rotation both sources are known to carry.
	 *
	 * The rubric stays verbatim and is what the page shows; this is the form
	 * a reader's own weekday can be compared against. It has to be a corpus
	 * field rather than something the site parses, because the rubric is
	 * written in the CONTENT language ("(recited Monday and Saturday)",
	 * "(Segundas e Sábados)") while the reader may be in any of fourteen
	 * interface languages — a client-side parse would be reimplementing a
	 * weekday vocabulary per language to recover a fact the scraper already
	 * knew.
	 *
	 * Optional: absent in a corpus written before 2026-08-26, and absent on
	 * any future grouped prayer whose groups are not weekday-assigned.
	 */
	days?: number[];
	/**
	 * The page THIS GROUP's five mysteries were parsed from.
	 *
	 * The Rosary is assembled from five pages, not one: the Compendium's
	 * Appendix A prints the entry (its title, rubric and concluding prayer),
	 * and the four Holy Rosary micro-site pages print the twenty mysteries
	 * and the directions — which is the overwhelming bulk of the page a
	 * reader sees. Attributing that to the Compendium, as the work-level
	 * notice necessarily did, pointed a reader at a page not containing the
	 * text they had just read. So each group names its own.
	 *
	 * Optional: nothing outside the Rosary has ever had more than one source,
	 * and a group without this falls back to the prayer's own `sources`.
	 */
	source?: string;
}

/** Source-provided directions attached to a prayer. Present for the Rosary,
 * whose Vatican mystery pages give the opening invocation and each decade's
 * order after the twenty meditations. */
export interface PrayerInstructions {
	title: string;
	blocks: PrayerBlock[];
	/** The page these directions were parsed from -- see
	 *  `PrayerGroupEntry.source`. */
	source?: string;
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
	/**
	 * Where THIS prayer's own text came from — not the work's.
	 *
	 * A prayer manifest lists every page the collection was assembled from
	 * (eight, for English) and cannot say which prayer came from which, so a
	 * copyright notice reading `manifest.sources[0]` attributed all
	 * twenty-eight to the Compendium appendix. Four of them are not from it:
	 * the two Creeds and the Our Father come from the Catechism's own pages,
	 * the Litany of Loreto from the Holy Rosary micro-site. Read this instead
	 * of the manifest's list wherever one prayer is in view.
	 *
	 * It is the prayer's OWN text only: the Rosary's mysteries and directions
	 * come from four further pages and carry their own `source`, because they
	 * are the case that motivated all of this (see `PrayerGroupEntry.source`).
	 * Optional so a corpus written before 2026-08-25 still loads — a consumer
	 * with nothing here falls back to the manifest, which is what it did
	 * before.
	 */
	sources?: SourceRef[];
}
