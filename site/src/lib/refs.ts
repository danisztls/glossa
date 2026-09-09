/**
 * Corpus-bound half of the reference system: turning a parsed `RefSegment`
 * into a URL the reader can follow.
 *
 * The GRAMMAR — every table, every parsing rule, `parseRefs`, `linkifyProse`,
 * `normalizeCitationSpacing` — lives in `./refs-grammar`, which imports
 * nothing and therefore runs outside the browser too. That split is what lets
 * `scripts/sync-corpus.mjs` build the scripture cross-reference index with the
 * exact parser that renders the page, instead of the second, separately
 * maintained Python implementation the corpus used to ship (see
 * site/docs/references.md). This module is the part that genuinely needs
 * the corpus: whether a book, chapter, verse or document section actually
 * exists in the edition the reader has open.
 *
 * Everything the grammar exports is re-exported here, so `$lib/refs` remains
 * the single import for callers that want both halves.
 */

import {
	canonLawCanonExists,
	canonLawLangs,
	defaultDocumentWorkId,
	documentSectionExists,
	findBookByAbbrev,
	getBook,
	listDocuments,
	summaArticleExists,
	summaQuestionExists,
	workIdToEdition,
	type BibleBookMeta
} from './corpus';
import { runHas, runLast } from './corpus-index';
import { hrefFor, summaPartSlug, type Address } from './address';
import {
	bookAbbrev,
	citationParts,
	citesVulgateNumbering,
	grammarSurface,
	normalizeCitationSpacing,
	parseRefs,
	setDocumentTitleSource,
	type RefSegment
} from './refs-grammar';
import { isDivergentBook, resolveVulgate, type VulgateAddress } from './versification';

export * from './refs-grammar';

// The grammar keeps its own document-title table but has no way to reach the
// corpus for the titles; hand it the corpus accessor once, at import time.
// `listDocuments` is index-backed and synchronous, and the grammar only calls
// it lazily on the first citation it parses, so this costs nothing up front.
setDocumentTitleSource(listDocuments);

/**
 * The leading section number off a document locus string ("19", "19 # 1",
 * "12-13", "12, 15") — `LOCUS_RE`'s own match already keeps the whole
 * range/subsection string together for DISPLAY (the raw citation text is
 * reproduced verbatim, per this module's store-raw principle), but a link
 * target needs exactly one section number. "GS 19 # 1" means Gaudium et
 * Spes §19, subsection 1 — link to §19 and drop the subsection rather than
 * failing the whole reference (documents have no sub-section-level
 * addressability in the corpus, docs/corpus-schema.md §Documents); a range
 * ("12-13") links to its first section, same "pick the first address"
 * convention `refHref`'s divergent-Psalm handling already uses for a
 * whole-chapter reference to a split psalm.
 */
function firstLocusSection(locus: string | null): number | undefined {
	if (!locus) return undefined;
	const m = /^\d+/.exec(locus);
	return m ? Number(m[0]) : undefined;
}

/**
 * Where a segment points, given the reader's current editions. `undefined`
 * means "not linkable" — a `text` segment, a `document` segment whose
 * siglum isn't an ingested document (`seg.slug === null`: DS, CIC, PL, PG,
 * AAS, and — for PT specifically — every conciliar siglum, since PT never
 * maps sigla to slugs at all, see `DOCUMENT_SLUGS_EN`'s docblock) or whose
 * target section doesn't exist in the reader's effective language, or a
 * scripture segment whose book/chapter isn't present in the reader's
 * current Bible edition. Never returns a dead link.
 *
 * CCC and Compendium URLs are edition-free (docs: "URLs for CCC and
 * Compendium stay edition-free") and their paragraph/question numbering is
 * a single fixed canonical range, so those two cases don't need to consult
 * the corpus at all. Document URLs are edition-free too (`/documents/
 * {slug}/{n}`, docs/corpus-schema.md §Documents extending docs/decisions.md
 * #2's convention) — but unlike CCC/Compendium, a document has TWO editions
 * whose section counts can genuinely differ (a source defect can leave one
 * language short a section or two, docs/research/vatican-documents.md §6),
 * so `ctx.lang` (the reader's EFFECTIVE content language for this document,
 * `content.documentLangFor(slug)`-equivalent at the call site — never the
 * raw UI language) picks which language's edition to check the section
 * against, through the same `corpus.defaultDocumentWorkId` chain that
 * OPENING the document resolves — their own language first, and what the
 * document page would have shown them when it has no edition there. It read
 * the exact-language edition alone until 2026-09-03, and refusing the link
 * was not respecting the reader's language but withholding a work this site
 * holds; the section-existence check below is what stays strict.
 */
export function refAddress(
	seg: RefSegment,
	ctx: { bibleWorkId?: string; lang?: string; work?: string }
): Address | undefined {
	if (seg.kind === 'ccc') return { kind: 'ccc', n: seg.n };
	if (seg.kind === 'compendium') return { kind: 'compendium', n: seg.n };
	if (seg.kind === 'summa') {
		// EDITION-FREE, and it has to be. Every other work type here either has
		// an edition in each interface language (CCC, Compendium) or checks the
		// reader's own before linking (documents). The Summa has neither: it
		// ships EN + LA and no Portuguese, and will not have one before 2055
		// (docs/decisions.md §Scope). Refusing to link for a Portuguese
		// reader — which is what the documents' "their own language or no
		// link" rule would do here — would leave every Summa citation in the
		// Portuguese Catechism dead, which is most of them.
		//
		// So the address is checked against the corpus as a whole and the
		// EDITION is resolved when the page opens, by the reader's own
		// fallback chain (their language, then English, then Latin — see
		// `editionInLang`). That is the same reasoning that already makes CCC
		// and Compendium URLs edition-free, arriving at the same answer from a
		// different direction.
		if (!summaQuestionExists(seg.part, seg.question)) return undefined;
		const part = summaPartSlug(seg.part);
		// The article is validated, never trusted: the Portuguese archive's
		// OCR produces article numbers that do not exist ("a. l" read as 1
		// where the article is 4), and a citation naming only a question is
		// ordinary. Either way the question page is a correct destination, so
		// an unusable article degrades to it rather than to no link at all.
		const article =
			seg.article !== null && summaArticleExists(seg.part, seg.question, seg.article)
				? seg.article
				: null;
		return { kind: 'summa', part, question: seg.question, article };
	}
	if (seg.kind === 'document') {
		// A siglum naming a work the corpus holds under its OWN addresses
		// rather than as a document. `CIC, can. 748, § 2` is canon 748, and
		// `/ius-canonicum/748` is where it lives — there is no `/documenta`
		// page to fall through to, so this branches before the slug test that
		// would otherwise reject it.
		if (seg.work === 'canon-law') {
			const n = firstLocusSection(seg.locus);
			if (n === undefined) return undefined;
			// Validated against an edition, never trusted: the Catechism cites
			// the 1917 Code in a handful of places and its numbering is not
			// this one's. The reader's own edition is asked first and the
			// union second, because the two editions with a gap in them
			// (`cic.KNOWN_GAPS`) must not make a canon every other edition
			// carries unlinkable.
			const lang = (ctx.lang ?? 'en').split('-')[0].toLowerCase();
			const exists =
				canonLawCanonExists(lang, n) || canonLawLangs().some((l) => canonLawCanonExists(l, n));
			return exists ? { kind: 'canonLaw', n } : undefined;
		}
		if (!seg.slug) return undefined; // recognized siglum, but not an ingested document (or PT, which never resolves one)
		// The reader's own language edition: a citation link must not silently
		// move them to a different-language edition than the one they are
		// reading (see the docblock).
		const targetLang = (ctx.lang ?? 'en').split('-')[0].toLowerCase();
		// The reader's own edition when the document has one, and otherwise the
		// edition OPENING it would give them — the same `editionInLang` chain
		// `/documenta/{slug}` resolves at page load, which is what makes this
		// safe: the URL names no edition, so the link cannot land them anywhere
		// the document's own page would not have.
		//
		// Requiring the reader's exact language here read as respecting it and
		// was the opposite: a citation naming a document this site holds went
		// dead because it holds it in another language. Dei Filius (Italian and
		// Latin only) is cited 25 times in the Portuguese Catechism and 17 in
		// the English, and no document at all has a Malagasy edition — every one
		// of `ccc.mg`'s 141 document citations linked nowhere. That is the
		// Summa's argument above, reached from the other direction.
		const workId = defaultDocumentWorkId(seg.slug, targetLang);
		if (!workId) return undefined;
		// The number is validated, never trusted: "Humani generis 561" cites an
		// AAS page, and that document has 44 sections. A section is a FRAGMENT
		// on the document's one page, not a page of its own —
		// `documents/[slug]/[n]` was retired 2026-08-17 (site/docs/addresses.md;
		// 9,315 prerendered files for one section of text each). `#s{n}` is the
		// same anchor the reading view has always carried.
		const n = firstLocusSection(seg.locus);
		if (n !== undefined && documentSectionExists(workId, n)) {
			return { kind: 'document', slug: seg.slug, n };
		}
		// The one place a siglum and a title part ways. A title with no usable
		// section still names one specific document, so it degrades to that
		// document's landing page; a bare siglum ("cf. GS") has no destination
		// worth guessing and links nowhere.
		return seg.via === 'title' ? { kind: 'document', slug: seg.slug } : undefined;
	}
	if (seg.kind !== 'scripture') return undefined; // 'text' never links

	if (!ctx.bibleWorkId) return undefined;
	const book = findBookByAbbrev(ctx.bibleWorkId, seg.osis);
	if (!book) return undefined;

	const exists = (osis: string, chapterN: number, verseN?: number): boolean => {
		const chapter = book.chapters.find((c) => c.n === chapterN);
		if (!chapter) return false;
		return verseN === undefined || runHas(chapter.verses, verseN);
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
	// Applied to EVERY book, not only the wholesale-divergent ones. It used to
	// be gated on `isDivergentBook`, which was correct while conversion meant
	// only the Psalms/Malachi/Joel chapter shifts — but versification.ts also
	// carries LATE_MERGE, a table of individual chapters (Matthew 17, Acts 7,
	// Exodus 40, Zechariah 2, 2 Corinthians 13) whose tails run one or two
	// verses ahead of the Vulgate's. Those books are deliberately NOT
	// "divergent", so gating here skipped them entirely and "Mt 17:24-27"
	// linked to Vulgate 17:24-26 — one verse off for its whole length, and
	// silently, since those verses all exist.
	//
	// Calling it unconditionally is safe by construction: for any address the
	// module has no data for, conversion is the identity, and a no-op can
	// never turn a correct address into a wrong one (see
	// `toVulgateCandidates`' docblock, which says exactly this).
	//
	// UNCONDITIONAL ACROSS BOOKS, NOT ACROSS WORKS. The safety argument above
	// covers the books the module has no data for; it says nothing about a work
	// that already cites in the numbering being converted TO. A work of the
	// Douay tradition does, and for it every psalm citation in the shifted range
	// lands a psalm low — Haydock's `Ps. ciii. 3` reached Ps 102:3. Those works
	// declare `vulgateNumbering` on their config, measured rather than assumed
	// (see `refs-grammar.ts` for the per-work counts and for the residue this
	// trades away), and their references are checked for existence and never
	// moved. The default stays conversion, which is what the Catechism needs.
	const resolve = citesVulgateNumbering(ctx.lang, ctx.work)
		? (osis: string, chapter: number, verse?: number) =>
				exists(osis, chapter, verse) ? { osis, chapter, verse } : undefined
		: (osis: string, chapter: number, verse?: number) =>
				resolveVulgate(osis, chapter, verse, exists);

	let chapterN = seg.chapter;
	let anchorVerse: number | undefined;

	{
		const firstVerse = seg.verses[0];
		const withVerse =
			firstVerse !== undefined ? resolve(seg.osis, seg.chapter, firstVerse) : undefined;
		if (withVerse) {
			chapterN = withVerse.chapter;
			anchorVerse = withVerse.verse;
		} else {
			// Either no verse was given, or the verse doesn't exist in this
			// edition even after conversion (a malformed source citation, of
			// which the CCC has a documented handful) — fall back to placing
			// the chapter alone rather than emitting a dead anchor.
			const chapterOnly = resolve(seg.osis, seg.chapter, undefined);
			if (!chapterOnly) return undefined; // the chapter doesn't exist in this edition at all
			chapterN = chapterOnly.chapter;
		}
	}

	/**
	 * A multi-verse reference carries its whole extent, not just its first
	 * verse: `Jn 1:1-7` reaches `?v=1-7#v1`, so the reader arrives knowing
	 * where the cited passage ENDS as well as where it starts. Landing on
	 * verse 1 of a long chapter with no indication that the citation runs
	 * through verse 7 is the single most common thing a scripture link can
	 * get wrong. (`hrefFor` owns how that is spelled; see its own note on why
	 * the extent goes in the query and the scroll target stays in the hash.)
	 *
	 * Bounded by min/max rather than by `verses[0]`/`verses.at(-1)`: the
	 * corpus's verse arrays come from range expansion and comma lists alike
	 * ("Jn 1:1-7" and "Jn 1:7,1" both land here), so they are not guaranteed
	 * sorted. Which is also why the extent's start and the ANCHOR can differ —
	 * "Jn 1:7,1" spans 1-7 but is about verse 7 — and why `Address` carries
	 * both.
	 */
	const extent =
		anchorVerse !== undefined && seg.verses.length > 1
			? verseExtent(seg.osis, seg.chapter, seg.verses, chapterN, resolve)
			: undefined;

	// Edition-free (site/docs/addresses.md, which the Bible now follows too).
	// `ctx.bibleWorkId` is still required above: it decides whether the
	// book/chapter/verse EXISTS for this reader, which is what stops a dead
	// link — it just no longer appears in the URL.
	if (anchorVerse === undefined) return { kind: 'bible', osis: seg.osis, chapter: chapterN };
	if (!extent) {
		// A single verse (or a list of which only one survived conversion) is
		// fully described by its anchor.
		return {
			kind: 'bible',
			osis: seg.osis,
			chapter: chapterN,
			from: anchorVerse,
			to: anchorVerse
		};
	}
	return {
		kind: 'bible',
		osis: seg.osis,
		chapter: chapterN,
		from: extent.from,
		to: extent.to,
		...(anchorVerse !== extent.from ? { anchor: anchorVerse } : {})
	};
}

/** Where a segment points, as a URL. `refAddress` decides the place; this is
 *  only the spelling of it. */
export function refHref(
	seg: RefSegment,
	ctx: { bibleWorkId?: string; lang?: string; work?: string }
): string | undefined {
	const address = refAddress(seg, ctx);
	return address && hrefFor(address);
}

/** One drawable run of a citation: the characters, and where they lead if
 *  they lead anywhere. Concatenating every `text` reproduces `seg.raw`. */
export interface CitationPiece {
	text: string;
	href?: string;
}

/**
 * A scripture citation split into one link per PASSAGE, where the source named
 * several.
 *
 * `Psalm 95:1-2, 6-7, 8-9` is three passages and was one link over all of
 * them — and because an `Address` carries a single span, that link claimed
 * `?v=1-9`: the reader was sent to a passage four verses longer than the one
 * appointed, and the hover card titled itself `Psalms 94:1-9` to prove it. The
 * verse SET was never wrong (`refAddress` reads `seg.verses`, which holds
 * exactly what was cited); what was wrong is that one address cannot say
 * "1-2 and 6-9" and nothing noticed it was being asked to.
 *
 * So the groups the source printed get an address each — `citationParts` is
 * where they come from — and the string is reproduced character for character
 * around them: the book and chapter ride inside the first link, the source's
 * own `, ` between groups stays plain text. A group whose address does not
 * resolve degrades to text on its own, which is the module's under-linking
 * rule at a finer grain than it used to be able to reach.
 *
 * ONE PIECE IS THE ORDINARY ANSWER. A single-group citation (`Ez 33:7-9`) and
 * a whole-chapter one are unchanged, and so is every non-scripture segment —
 * a document siglum's locus is not verses and is validated elsewhere.
 */
export function citationPieces(
	seg: RefSegment,
	ctx: { bibleWorkId?: string; lang?: string; work?: string }
): CitationPiece[] {
	const whole = (): CitationPiece[] => {
		const href = refHref(seg, ctx);
		return [{ text: seg.kind === 'text' ? seg.text : seg.raw, ...(href ? { href } : {}) }];
	};
	if (seg.kind !== 'scripture') return whole();
	const { book, groups } = citationParts(seg, { lang: ctx.lang, work: ctx.work });
	if (groups.length < 2) return whole();

	const pieces: CitationPiece[] = [];
	let cursor = 0;
	let linked = 0;
	for (const group of groups) {
		const start = book.length + group.start;
		const end = book.length + group.end;
		// Everything since the last group — the book and chapter before the
		// first, the source's separator after that. It joins the first link so
		// that `Psalm 95:1-2` is one anchor rather than a bare `1-2` with the
		// book left dangling beside it.
		if (start > cursor && pieces.length) pieces.push({ text: seg.raw.slice(cursor, start) });
		// THE VERSE IS REQUIRED HERE AND NOT ELSEWHERE. `refAddress` degrades a
		// citation whose verse it cannot place to the chapter alone, which is
		// right for a whole citation and wrong for a fragment of one: the words
		// under the link would read `98-99` and the link would open the top of
		// the chapter, which a reader cannot tell from a working one. A group
		// that cannot be placed is drawn as text.
		const address = refAddress({ ...seg, verses: group.verses }, ctx);
		const href =
			address?.kind === 'bible' && address.from !== undefined ? hrefFor(address) : undefined;
		if (href) linked++;
		pieces.push({ text: seg.raw.slice(pieces.length ? start : 0, end), ...(href ? { href } : {}) });
		cursor = end;
	}
	if (cursor < seg.raw.length) pieces.push({ text: seg.raw.slice(cursor) });
	// Nothing placed — the chapter is missing from this edition, or the whole
	// locus is out of range. Split, that is a citation drawn as dead text where
	// it used to reach at least the chapter; whole, it is what it always was.
	return linked ? pieces : whole();
}

/** One run of consecutive verses inside one chapter, with both ends named. */
export interface PassageSpan {
	osis: string;
	chapter: number;
	from: number;
	to: number;
}

/**
 * What a chapter-crossing citation leaves behind: `-4:2` after `2 Timothy
 * 3:14`, `-4:4` after `Baruch 3:9-15, 32`.
 *
 * A scripture SEGMENT holds one chapter — the type says so — so the grammar
 * stops at the first chapter's numbers and hands the rest back as text. That
 * is right for `RefText`, where an address holds one chapter too and a second
 * link would have to be minted for the remainder; it is wrong for a caller
 * that wants the passage rather than the anchor, which is what this reads.
 *
 * The verse may carry the lectionary's part letters (`4:2a`, `2:2bc`), which
 * are ignored: a verse is the finest thing this corpus is addressed by. A run
 * rather than one letter, for the reason `LEAD_NUM_RE` takes one — a citation
 * names as many stichs as it means, and a tail this refuses is a pericope
 * printed with no text.
 */
const CROSSING_TAIL_RE = /^\s*[-–—]\s*(\d{1,3})\s*[:,.]\s*(\d{1,3})[a-z]*\s*$/;

/**
 * The semicolon a lectionary citation joins two clauses of one pericope with:
 * `Genesis 2:7-9; 3:1-7`, `Hebrews 4:14-16; 5:7-9`, `1 Sm 3:9; Jn 6:68c`.
 *
 * It is the ONE piece of leftover text that means "and also", and the grammar
 * already does the hard half — the clause after it parses as a segment of its
 * own, carrying the previous clause's book where the source did not repeat it.
 */
const CLAUSE_SEP_RE = /^\s*;\s*$/;

/**
 * Every verse a citation names, as spans into the reader's own Bible edition —
 * or `undefined` where the citation cannot be read WHOLE.
 *
 * ## Why this exists beside `citationPieces`
 *
 * They answer different questions. `citationPieces` asks where a citation
 * LEADS, and under-links: a piece it cannot place is drawn as text, which
 * costs a link and says nothing false. This asks what a citation SAYS, and a
 * partial answer to that is not a smaller answer but a wrong one — a reader
 * cannot tell a pericope printed short from one printed whole, which is the
 * condition `lectionary/cite.ts` refuses one citation at a time and
 * `national/held.ts` refuses a whole calendar layer for.
 *
 * So it is all or nothing: a citation with anything in it this module cannot
 * place resolves to `undefined`, and the caller prints the citation alone.
 *
 * ## It crosses chapters, which nothing else here does
 *
 * `Genesis 1:1-2:2` is one pericope and two chapters, and the intervening
 * chapters — `Gen 1:1-3:5` has all of chapter 2 inside it — are named in full.
 * Their lengths come from the edition's own index rather than from any table
 * here: the last verse of a chapter is a fact about the edition open in front
 * of this reader, and the two Vulgate editions and the two modern ones do not
 * always agree on it.
 *
 * ## Conversion is `refAddress`'s, not a second copy
 *
 * Every span is minted by calling `refAddress` on a segment, including the
 * synthetic one naming the chapter a crossing lands in — so the Hebrew-to-
 * Vulgate mapping, the late-merge tables and the `vulgateNumbering` opt-out
 * all apply here exactly as they apply to the link, and the text under a
 * citation cannot come from a different chapter than the link above it. A
 * crossing whose two ends convert into the same chapter, or backwards, is
 * refused rather than straightened.
 */
export function passageSpans(
	text: string,
	ctx: { bibleWorkId?: string; lang?: string; work?: string }
): PassageSpan[] | undefined {
	if (!ctx.bibleWorkId || !text.trim()) return undefined;
	const parsed = parseRefs(normalizeCitationSpacing(text), {
		lang: ctx.lang,
		work: ctx.work
	}).filter((seg) => seg.kind !== 'text' || seg.text.trim() !== '');

	// `Cf. Acts 16:14b` is the acclamation's ordinary shape and the `Cf.` is
	// its own text segment, in whichever language the citation was written in.
	// The segment that follows says so itself — the grammar sets `cf` — which
	// is what lets this drop the word without a table of the fourteen ways to
	// spell it.
	const segments =
		parsed[0]?.kind === 'text' && parsed[1]?.kind === 'scripture' && parsed[1].cf
			? parsed.slice(1)
			: parsed;

	if (segments[0]?.kind !== 'scripture') return undefined;

	const books = new Map<string, BibleBookMeta | undefined>();
	const bookOf = (osis: string) => {
		if (!books.has(osis)) books.set(osis, findBookByAbbrev(ctx.bibleWorkId as string, osis));
		return books.get(osis);
	};
	const lastVerseOf = (osis: string, n: number): number | undefined => {
		const chapter = bookOf(osis)?.chapters.find((c) => c.n === n);
		if (!chapter) return undefined;
		return runLast(chapter.verses);
	};

	/**
	 * One group of one clause, resolved.
	 *
	 * A group naming NO verse is the whole chapter — `Ionas 3` appoints all of
	 * it. A group that named verses and placed none is not: `refAddress`
	 * degrades that to the chapter alone, which is right for an anchor (the
	 * reader lands on the chapter rather than nowhere) and would be a passage
	 * of fifty verses printed where five were cited. So the two from-less
	 * answers are told apart by what was ASKED, not by what came back.
	 */
	const spanFor = (
		seg: Extract<RefSegment, { kind: 'scripture' }>,
		verses: number[]
	): PassageSpan | undefined => {
		const address = refAddress({ ...seg, verses }, ctx);
		if (address?.kind !== 'bible') return undefined;
		if (address.from === undefined) {
			if (verses.length > 0) return undefined;
			const end = lastVerseOf(seg.osis, address.chapter);
			return end === undefined
				? undefined
				: { osis: seg.osis, chapter: address.chapter, from: 1, to: end };
		}
		return {
			osis: seg.osis,
			chapter: address.chapter,
			from: address.from,
			to: address.to ?? address.from
		};
	};

	const spans: PassageSpan[] = [];
	let clause: Extract<RefSegment, { kind: 'scripture' }> | undefined;
	for (const seg of segments) {
		if (seg.kind === 'scripture') {
			if (!bookOf(seg.osis)) return undefined;
			// The source's own comma-chained groups, each its own span: `Ps
			// 95:1-2, 6-7` is two runs and not one nine-verse block, which is the
			// same reason `citationPieces` gives each of them its own link.
			const { groups } = citationParts(seg, { lang: ctx.lang, work: ctx.work });
			for (const verses of groups.length ? groups.map((g) => g.verses) : [seg.verses]) {
				const span = spanFor(seg, verses);
				if (!span) return undefined;
				spans.push(span);
			}
			clause = seg;
			continue;
		}
		if (seg.kind !== 'text') return undefined;
		// The semicolon between two clauses of one pericope. It carries nothing
		// of its own: the clause after it is a segment like any other, and a
		// bookless one has already been given the previous clause's book by the
		// grammar.
		if (CLAUSE_SEP_RE.test(seg.text)) continue;

		const crossing = CROSSING_TAIL_RE.exec(seg.text);
		const last = spans[spans.length - 1];
		if (!crossing || !clause || !last) return undefined;

		// The crossing runs off the end of the group it left, so that group's
		// own end is the chapter's.
		const chapterEnd = lastVerseOf(last.osis, last.chapter);
		if (chapterEnd === undefined || chapterEnd < last.from) return undefined;
		last.to = chapterEnd;

		// The landing chapter, resolved through `refAddress` like every other
		// span: a synthetic segment naming it and its verses 1..n is the
		// cheapest way to say "this chapter, converted the way its clause was".
		const landing = refAddress(
			{
				...clause,
				chapter: Number(crossing[1]),
				verses: Array.from({ length: Number(crossing[2]) }, (_, i) => i + 1)
			},
			ctx
		);
		if (landing?.kind !== 'bible' || landing.from === undefined) return undefined;
		if (landing.chapter <= last.chapter) return undefined;

		// Whatever the crossing jumped OVER — `Gen 1:1-3:5` holds all of
		// chapter 2 — named in full rather than skipped.
		for (let n = last.chapter + 1; n < landing.chapter; n++) {
			const end = lastVerseOf(last.osis, n);
			if (end === undefined) return undefined;
			spans.push({ osis: last.osis, chapter: n, from: 1, to: end });
		}
		spans.push({
			osis: last.osis,
			chapter: landing.chapter,
			from: landing.from,
			to: landing.to ?? landing.from
		});
	}
	return spans.length ? spans : undefined;
}

/**
 * The decoder-ring line a siglum discloses -- `AAS — Acta Apostolicae Sedis` --
 * and `undefined` for a segment with nothing to disclose.
 *
 * ONE FUNCTION FOR THE TEXT AND FOR WHETHER THERE IS A CUE AT ALL, which is
 * the whole reason it is here rather than inline in `RefText`. A cue that
 * opens nothing is the bug this was written for: a dotted underline and a
 * `cursor: help` were drawn over every unlinkable segment, so an unresolvable
 * scripture reference promised a reader something and then answered with its
 * own words repeated back. `CitedBy` already states the rule -- only a label
 * that shortens something gets the affordance -- and returning `undefined`
 * here is what keeps the two halves of it from drifting apart.
 *
 * `expansion` IS NON-NULL ONLY FOR A SIGLUM. A document named by its
 * spelled-out title explains itself (`refs-grammar.ts`'s `document` variant),
 * so `via: 'title'` never carries one and never draws a cue.
 *
 * ASKED OF THE SEGMENT AND NOT OF THE LINK, deliberately: a siglum that
 * resolves carries its expansion just the same, and it is `RefText` that
 * prefers the link -- a reader who can be taken to the document does not need
 * to be told what its initials stand for.
 */
export function glossOf(seg: RefSegment): string | undefined {
	if (seg.kind !== 'document' || !seg.expansion) return undefined;
	return `${seg.label} — ${seg.expansion}`;
}

/**
 * The `{from, to}` span of a verse list, put through the caller's `resolve`
 * (conversion, or the identity for a work that already cites in Vulgate
 * numbering) and clamped to verses that actually exist in the reader's
 * edition.
 *
 * Every verse is resolved individually rather than the span's endpoints
 * being offset by whatever the anchor moved: the late-merge tables
 * (`versification.ts`) shift a chapter's tail but not its head, so a range
 * straddling the merge point moves by different amounts at each end. "Mt
 * 17:24-27" converts to 17:23-26; offsetting from the anchor alone would
 * have produced 17:23-26 here by luck and the wrong answer for any range
 * beginning before the merge.
 *
 * Verses that don't survive conversion are dropped rather than guessed at,
 * which is also what clamps the span: a handful of CCC citations name a
 * verse past the end of its chapter (see the Bible chapter route for the
 * measurement), and a highlight running to verse 61 of a 52-verse chapter
 * would silently highlight to the end while claiming otherwise.
 *
 * A converted verse landing in a DIFFERENT chapter than the anchor is
 * dropped too — a range crossing a Psalms/Malachi chapter split cannot be
 * expressed as one span, and `refparse.ts` already refuses the same case
 * rather than pointing at the wrong half.
 *
 * Returns undefined when fewer than two verses survive: a one-verse span
 * adds nothing the anchor doesn't already say.
 */
function verseExtent(
	osis: string,
	sourceChapter: number,
	verses: number[],
	chapterN: number,
	resolve: (osis: string, chapter: number, verse?: number) => VulgateAddress | undefined
): { from: number; to: number } | undefined {
	const present: number[] = [];
	for (const v of verses) {
		const resolved = resolve(osis, sourceChapter, v);
		if (resolved?.verse !== undefined && resolved.chapter === chapterN)
			present.push(resolved.verse);
	}
	if (present.length < 2) return undefined;
	return { from: Math.min(...present), to: Math.max(...present) };
}

/**
 * `Jo 3,16` — one scripture citation written the way `lang` writes one, for a
 * page teaching the notation rather than resolving one.
 *
 * IT IS THE PARSER RUN BACKWARDS AND HAS TO STAY SO. Both halves come out of
 * the tables `parseRefs` matches against — the abbreviation from `bookAbbrev`,
 * the chapter mark from `grammarSurface` — because a specimen showing a form
 * the parser does not read would teach a citation this site refuses. That is
 * the same constraint `lectionary/cite.ts` works under, arrived at from the
 * other direction.
 *
 * ONE FUNCTION BECAUSE THERE ARE TWO CALLERS AND THERE WERE TWO COPIES. The
 * home page's notation section and `/schola`'s work list each carried these six
 * lines verbatim, comments included; the second was written by copying the
 * first, which is how the shelf catalogue's own docblock says a thing comes to
 * drift.
 *
 * THE EDITION HAS TO CARRY THE BOOK before its name is printed, and asking
 * supplies the fallback name in the same step. `osis` is LOWER-CASE here and
 * everywhere in this corpus (`john`, not the OSIS standard's `John`):
 * `bookAbbrev` and `getBook` both answer `undefined` for a spelling they do not
 * hold, so the wrong case fails by drawing no specimen at all rather than by
 * erring. Where the language has no abbreviation table (Hungarian, today) the
 * edition's full name stands — a full name is a correct citation and a shorter
 * one is not available.
 */
export function scriptureSpecimen(
	workId: string | undefined,
	lang: string,
	osis = 'john',
	chapter = 3,
	verse = 16
): string | undefined {
	const book = workId ? getBook(workId, osis) : undefined;
	if (!book) return undefined;
	const name = bookAbbrev(osis, lang) ?? book.name;
	return `${name} ${chapter}${grammarSurface(lang).chapterVerseSep}${verse}`;
}
