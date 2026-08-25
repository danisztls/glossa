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
 * docs/decisions.md, 2026-08-21). This module is the part that genuinely needs
 * the corpus: whether a book, chapter, verse or document section actually
 * exists in the edition the reader has open.
 *
 * Everything the grammar exports is re-exported here, so `$lib/refs` remains
 * the single import for callers that want both halves.
 */

import {
	documentSectionExists,
	findBookByAbbrev,
	getDocumentGroup,
	listDocuments,
	summaArticleExists,
	summaQuestionExists,
	workIdToEdition
} from './corpus';
import { hrefFor, summaPartSlug, type Address } from './address';
import { setDocumentTitleSource, type RefSegment } from './refs-grammar';
import { isDivergentBook, resolveVulgate } from './versification';

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
 * against. Deliberately NOT `corpus.defaultDocumentWorkId`, which falls back
 * to "any edition, if the reader's language has none" — the right behavior
 * for OPENING a document page (better to show it in some language than
 * 404), but the wrong one here: a citation link that silently lands the
 * reader on a different-language edition than the one they're reading would
 * violate "respect the reader's language" in the one case it's meant to
 * cover, so this looks up the exact-language edition directly and emits no
 * link at all if that specific edition doesn't have the section.
 */
export function refAddress(
	seg: RefSegment,
	ctx: { bibleWorkId?: string; lang?: string }
): Address | undefined {
	if (seg.kind === 'ccc') return { kind: 'ccc', n: seg.n };
	if (seg.kind === 'compendium') return { kind: 'compendium', n: seg.n };
	if (seg.kind === 'summa') {
		// EDITION-FREE, and it has to be. Every other work type here either has
		// an edition in each interface language (CCC, Compendium) or checks the
		// reader's own before linking (documents). The Summa has neither: it
		// ships EN + LA and no Portuguese, and will not have one before 2055
		// (docs/decisions.md, 2026-08-23). Refusing to link for a Portuguese
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
	if (seg.kind === 'documentTitle') {
		// The reader's own language edition, for the same reason the siglum
		// branch below uses it: a citation link must not silently move them to
		// a different-language edition than the one they are reading.
		const targetLang = (ctx.lang ?? 'en').split('-')[0].toLowerCase();
		const workId = getDocumentGroup(seg.slug)?.manifests[targetLang]?.id;
		if (!workId) return undefined;
		// Unlike a siglum, a title with no usable section number still names one
		// specific document, so it degrades to that document's landing page
		// rather than to no link. The number is validated, never trusted: "Humani
		// generis 561" cites an AAS page, and that document has 44 sections.
		const n = firstLocusSection(seg.locus);
		// A section is a FRAGMENT on the document's one page, not a page of its
		// own — `documents/[slug]/[n]` was retired 2026-08-17 (docs/decisions.md;
		// 9,315 prerendered files for one section of text each). `#s{n}` is the
		// same anchor the reading view has always carried.
		if (n !== undefined && documentSectionExists(workId, n)) {
			return { kind: 'document', slug: seg.slug, n };
		}
		return { kind: 'document', slug: seg.slug };
	}
	if (seg.kind === 'document') {
		if (!seg.slug) return undefined; // recognized siglum, but not an ingested document (or PT, which never resolves one)
		const n = firstLocusSection(seg.locus);
		if (n === undefined) return undefined; // e.g. a bare "cf. GS" with no section number at all
		const targetLang = (ctx.lang ?? 'en').split('-')[0].toLowerCase();
		const workId = getDocumentGroup(seg.slug)?.manifests[targetLang]?.id;
		if (!workId || !documentSectionExists(workId, n)) return undefined;
		// Fragment, not a path segment — see the `documentTitle` branch above.
		return { kind: 'document', slug: seg.slug, n };
	}
	if (seg.kind !== 'scripture') return undefined; // 'text' never links

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
	let chapterN = seg.chapter;
	let anchorVerse: number | undefined;

	{
		const firstVerse = seg.verses[0];
		const withVerse =
			firstVerse !== undefined
				? resolveVulgate(seg.osis, seg.chapter, firstVerse, exists)
				: undefined;
		if (withVerse) {
			chapterN = withVerse.chapter;
			anchorVerse = withVerse.verse;
		} else {
			// Either no verse was given, or the verse doesn't exist in this
			// edition even after conversion (a malformed source citation, of
			// which the CCC has a documented handful) — fall back to placing
			// the chapter alone rather than emitting a dead anchor.
			const chapterOnly = resolveVulgate(seg.osis, seg.chapter, undefined, exists);
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
			? verseExtent(seg.osis, seg.chapter, seg.verses, chapterN, exists)
			: undefined;

	// Edition-free (docs/decisions.md #2, which the Bible now follows too).
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
	ctx: { bibleWorkId?: string; lang?: string }
): string | undefined {
	const address = refAddress(seg, ctx);
	return address && hrefFor(address);
}

/**
 * The `{from, to}` span of a verse list, CONVERTED to Vulgate numbering and
 * clamped to verses that actually exist in the reader's edition.
 *
 * Every verse is converted individually rather than the span's endpoints
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
	exists: (osis: string, chapterN: number, verseN?: number) => boolean
): { from: number; to: number } | undefined {
	const present: number[] = [];
	for (const v of verses) {
		const resolved = resolveVulgate(osis, sourceChapter, v, exists);
		if (resolved?.verse !== undefined && resolved.chapter === chapterN)
			present.push(resolved.verse);
	}
	if (present.length < 2) return undefined;
	return { from: Math.min(...present), to: Math.max(...present) };
}
