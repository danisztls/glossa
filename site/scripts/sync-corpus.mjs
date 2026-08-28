#!/usr/bin/env node
/**
 * Builds `src/lib/corpus-data/` from a real corpus checkout — not a plain
 * copy (see git history before 2026-08-15 for that version). `corpus.ts`
 * used to `import.meta.glob(..., { eager: true })` the corpus verbatim,
 * which inlined the whole library (~18 MB / ~4.6 MB gz) into one client JS
 * chunk that every page preloaded, home page included. This script instead
 * splits each work into two tiers on disk, so `corpus.ts`/`corpus-index.ts`
 * can glob them differently:
 *
 *   `corpus-data/index/*.json` — small, structural: manifests, canonical
 *   book/chapter numbers (NOT verse text), CCC/Compendium TOC trees,
 *   abbreviations, the xrefs table, and `content-manifest.json` (byte size
 *   per content file, for the service worker's future per-work download
 *   UI). Globbed eagerly and inlined — this is the site's boot index, and
 *   at real-corpus scale it's well under 500 KB total, so inlining it once
 *   costs less than a network round-trip would.
 *
 *   `corpus-data/content/**` — the actual reading text, split so a reader
 *   pays for roughly the unit they asked for and no more. Every split is one
 *   rule at a different stride: a fixed arithmetic partition of the work's
 *   own numbering, so chunk membership stays a pure function of `n` with no
 *   lookup table to ship or keep in sync (the `*ChunkStartFor` functions in
 *   `corpus-index.ts`). Bible books split into fixed 20-chapter chunks
 *   (`BIBLE_CHAPTER_CHUNK_SIZE`), CCC paragraphs into fixed 100-paragraph
 *   chunks (29 chunks/language — shipping the 3.5 MB/language
 *   `paragraphs.json` whole would put a >500 KB gzipped file behind a single
 *   `¶1` visit), the Compendium into fixed 100-question chunks
 *   (`COMPENDIUM_CHUNK_SIZE`), documents (docs/corpus-schema.md §Documents)
 *   into fixed section chunks (`DOCUMENT_CHUNK_SIZE`) — and prayers
 *   (docs/corpus-schema.md §Prayers) kept whole per language, the one work
 *   type with no stride at all: `prayers.json` measures ~40 KB RAW per
 *   language in the real corpus, smaller than the smallest chunk any of the
 *   four strides above produces, so there
 *   is nothing here that would ever justify chunking it. It belongs in the
 *   content tier at all — rather than being small enough to just inline
 *   into the index — because it holds actual reading TEXT (prayer wording,
 *   Latin companions), and that is what decides the tier, not size alone:
 *   the index tier is existence/structure metadata ONLY (see
 *   `prayer-index.json` below), the same line already drawn between
 *   `bible-index.json` (chapter/verse NUMBERS) and each Bible book's actual
 *   verse text. Globbed with Vite's `{ query: '?url' }` by `corpus.ts` —
 *   each file becomes its own content-hashed build asset, `fetch()`-ed only
 *   by the page(s) that need it, cacheable forever (immutable content).
 *
 * See `docs/corpus-schema.md` for the *source* shapes this reads, and
 * `corpus.ts`'s docblock for how the site consumes what this script writes.
 *
 * Runs automatically before `npm run build` / `npm run dev` (`prebuild` /
 * `predev` in package.json) — not before `npm test`, so vitest always
 * exercises the bundled fixtures under `src/lib/fixtures/` regardless of
 * whether a corpus checkout is present (`corpus.ts`'s `VITEST` guard).
 *
 * Configurable via the `CORPUS_DIR` env var (default: `../../glossa-corpus`,
 * resolved relative to this `site/` package — the corpus is a separate,
 * private repository expected as a sibling checkout of this one, see
 * docs/decisions.md §The corpus). Spelled the same way as
 * `pipeline/scrapers/common/`'s `corpus_dir()`, so one exported variable
 * moves both halves of the project. If no corpus is found, this is a no-op
 * (with a warning): `corpus.ts` falls back to its fixtures, so the site
 * still builds.
 */

import { existsSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
	buildCccBibleXrefs,
	buildCitationXrefs,
	buildDocumentBibleXrefs,
	checkXrefsAgainstCorpus
} from './build-xrefs.mjs';

import { summaPartSlug } from '../src/lib/route-manifest.ts';
import { setDocumentTitleSource } from '../src/lib/refs-grammar.ts';
import { hrefFor } from '../src/lib/address.ts';
import { buildCondensationMap } from '../src/lib/condensation.ts';
import { pairDivisions } from '../src/lib/toc-pairing.ts';
import { sitemapXml } from './sitemap.mjs';
import {
	CHANGE_CEILING,
	fingerprint,
	readLedger,
	resolveLastmod,
	writeLedger
} from './lastmod.mjs';
import {
	CoverageMeter,
	compareCoverage,
	readBaseline,
	summarize,
	writeReport
} from './reference-coverage.mjs';

const siteRoot = path.resolve(fileURLToPath(import.meta.url), '../..');
const corpusDir = path.resolve(siteRoot, process.env.CORPUS_DIR ?? '../../glossa-corpus');
const destDir = path.join(siteRoot, 'src/lib/corpus-data');
const indexDir = path.join(destDir, 'index');
const contentDir = path.join(destDir, 'content');
// Public but address-only: the Cloudflare edge worker reads this before it
// serves the SPA shell, so an existing citation receives 200 while a typo
// remains a real 404. It is generated alongside corpus-data, never edited.
const routeManifestPath = path.join(siteRoot, 'static/corpus-routes.json');
// Derived from the same manifest, one line below where it is written. The
// SPA shell means a crawler can otherwise reach the corpus only by rendering
// the app and walking JavaScript-written links; see scripts/sitemap.mjs.
const sitemapPath = path.join(siteRoot, 'static/sitemap.xml');
// COMMITTED, and the sitemap's `<lastmod>` is only as truthful as this file's
// history. See scripts/lastmod.mjs for why git cannot stand in for it.
const lastmodPath = path.join(siteRoot, 'scripts/lastmod.json');

/** CCC/Compendium `paragraphs.json`/`questions.json` are per-language single
 *  arrays ordered by `n`; Bible books split naturally along the print
 *  volume's own chapter boundaries, but the CCC's 2865 paragraphs don't —
 *  this is the fixed range size chunked into (see module docblock). Not
 *  derived from `structure.json`'s part/section boundaries on purpose: a
 *  fixed stride keeps chunk membership a pure function of `n`
 *  (`chunkStartFor` in `corpus-index.ts`) with no extra lookup table to
 *  ship or keep in sync, and 100 lands every chunk at 15-28 KB gzipped
 *  (measured against the real corpus 2026-08-15) — comfortably inside the
 *  same budget as a Bible book file. */
const CCC_CHUNK_SIZE = 100;

/** Documents are chunked by SECTION, the same fixed-stride way the CCC is
 *  chunked by paragraph and for the same "pure function of `n`, no lookup
 *  table" reason (`documentChunkStartFor` in `corpus-index.ts`).
 *
 *  This replaces a whole-file-per-work rule whose stated premise —
 *  "~200 KB raw worst-case (Gaudium et Spes)" — had gone stale by 4×: Gaudium
 *  et Spes measures 623 KB today and the real worst case is Evangelium Vitae
 *  at 827 KB. The claim was written 2026-08-16 and `html` landed on
 *  2026-08-21 (docs/decisions.md §Storage), which is most of the gap; nobody re-measured
 *  after. What made it matter is that a hover LINK PREVIEW of a single cited
 *  section (`linkPreviewContent.ts`) pays for the whole file, so citing one
 *  paragraph of an encyclical downloaded the encyclical.
 *
 *  50 rather than the CCC's 100 because a document's sections are much
 *  longer and far more variable than a catechism paragraph — a median 1.1 KB
 *  but a p90 of 2.3 KB and a worst of 7.6 KB — so the same stride would span
 *  a much wider range of chunk sizes. At 50 the worst chunk is ~161 KB raw
 *  (~48 KB brotli) against a whole-file 827 KB (95 KB brotli), and since the
 *  median document is 27 sections most works remain a single chunk anyway.
 *  It also bounds the continuous reading view (`/documenta/{slug}`, which
 *  needs every chunk) at 3 parallel fetches for the longest document. */
const DOCUMENT_CHUNK_SIZE = 50;

/** The Compendium, chunked by question on the same fixed-stride rule as the
 *  CCC and for the same "pure function of `n`, no lookup table" reason
 *  (`compendiumChunkStartFor` in `corpus-index.ts`).
 *
 *  This replaces a keep-it-whole rule whose premise — "only ~90 KB gzipped
 *  total, no split needed" — was measured on 2026-08-15 against TWO editions
 *  and never re-measured. Ten editions landed on 2026-08-25 and each
 *  `questions.json` is now 280-290 KB raw (~90 KB brotli) on its own, so
 *  opening question 1 downloaded all 598 answers. Exactly the stale-premise
 *  failure `DOCUMENT_CHUNK_SIZE` above was written to correct, one work over.
 *
 *  100 rather than the documents' 50 because a Compendium answer is short and
 *  uniform — much more like a catechism paragraph than an encyclical section —
 *  so the CCC's stride transfers directly: 6 chunks per edition, worst chunk
 *  51 KB raw (measured 2026-08-25). */
const COMPENDIUM_CHUNK_SIZE = 100;

/** Bible books, chunked by CHAPTER on the same fixed-stride rule again
 *  (`bibleChapterChunkStartFor` in `corpus-index.ts`).
 *
 *  One file per book matched the print volume's own granularity, which is a
 *  good OFFLINE unit but was never the READ unit: `/scriptura/{osis}/{chapter}`
 *  shows one chapter, and `getChapter` is the only reader of this tier, so
 *  opening Ps 23 paid for all 150 psalms — 374 KB raw in the Matos Soares
 *  edition, the largest single read in the corpus.
 *
 *  20 was measured rather than guessed (2026-08-25, all four editions, every
 *  stride from 10 to 30): it caps the worst chunk at 159 KB raw, in line with
 *  the CCC's 147 KB and the documents' 171 KB, for 444 files against 388 at
 *  stride 25 and 692 at stride 10. Below 20 the file count climbs fast for
 *  almost no reduction in the worst case, because the worst case is set by a
 *  handful of genuinely long chapters (1 Maccabees) rather than by the stride.
 *
 *  Applied uniformly, not above a size threshold: a threshold would put two
 *  different path shapes in the same tier, and the whole point of a fixed
 *  stride is that chunk membership stays a pure function of the chapter
 *  number. Every book with 20 chapters or fewer — most of them — is still a
 *  single file, just at a chunked path. */
const BIBLE_CHAPTER_CHUNK_SIZE = 20;

/** No single content file may exceed this. Checked over the whole manifest at
 *  the end of the run, and a HARD failure rather than a warning.
 *
 *  Every chunking regression this project has had was the same one: a size
 *  premise recorded in a comment, correct when written, never re-measured.
 *  Documents were whole-file on a "~200 KB raw worst-case" note until the real
 *  worst case reached 827 KB; the Compendium was whole-file on a "~90 KB for
 *  both languages" note until it had ten editions at 290 KB each. Both were
 *  found by someone happening to look, months late. A ceiling converts that
 *  class of silent drift into a failed build.
 *
 *  200 KB against a measured worst of 171 KB (a document chunk) leaves real
 *  headroom while still catching either regression above at roughly the point
 *  it started to matter. Raising it is a legitimate decision — some units,
 *  like a single Summa question or a single Bible chapter, cannot be split at
 *  all — but it should be a decision someone makes and records here, which is
 *  the entire purpose of the check. */
const CONTENT_FILE_CEILING_BYTES = 200_000;

function readJson(p) {
	return JSON.parse(readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
	mkdirSync(path.dirname(p), { recursive: true });
	writeFileSync(p, JSON.stringify(data));
}

function byteLength(data) {
	return Buffer.byteLength(JSON.stringify(data));
}

/**
 * A sorted run of positive integers, in the shape the index tier writes it:
 * the bare COUNT when the run is exactly `1..n`, and the explicit array
 * otherwise. `expandRun` in `src/lib/corpus-index.ts` is the other half, and
 * `sync-corpus.test.ts` pins the pair.
 *
 * LOSSLESS, WHICH IS THE ONLY REASON IT IS ALLOWED HERE. The Bible branch
 * below already argues at length that verse numbers must be EXPLICIT and not
 * "e.g. a max-verse-number bound", because a critical-text verse gap
 * (docs/corpus-schema.md allows them) would then silently mislink — the
 * opposite of `refs.ts`'s under-link-rather-than-over-link rule. That argument
 * is untouched: a bound is lossy and this is not. The count is emitted ONLY
 * when the run has no gap to lose, and the moment one appears the encoder
 * falls back to writing every number. Round-tripping any input through
 * `compactRun`/`expandRun` returns it unchanged; a bound could not promise
 * that, which is exactly why it was refused.
 *
 * WHAT IT BUYS. `[1,2,3,…,31]` is ~110 bytes of source text and one JS array
 * allocation per chapter; `31` is two bytes and none. Across the four Bible
 * editions that is 5,332 of 5,335 chapters, and the same shape repeats in the
 * CCC's `paragraphNumbers` (1..2865, twice), the Compendium's
 * `questionNumbers` (1..598, ten times), each document's `sectionNumbers` and
 * each Summa question's `articles`. Together it is ~470 KB of the boot chunk
 * every route `modulepreload`s in front of first paint — mostly parse time and
 * heap rather than transfer, since brotli already saw the pattern.
 *
 * Callers pass an ASCENDING run. Nothing here sorts: every call site below
 * already sorts (or reads an ordered source), and sorting silently here would
 * hide a caller that stopped.
 */
function compactRun(nums) {
	for (let i = 0; i < nums.length; i++) {
		if (nums[i] !== i + 1) return nums;
	}
	return nums.length;
}

rmSync(destDir, { recursive: true, force: true });

const buildSrc = path.join(corpusDir, 'build');

if (!existsSync(buildSrc)) {
	// A fixture build must never inherit a real corpus's route manifest from a
	// previous build. Without this, preflight would see a plausible work count
	// beside fixture client assets and could approve exactly the deploy it is
	// meant to stop. This is generated site output, never corpus/raw.
	rmSync(routeManifestPath, { force: true });
	rmSync(sitemapPath, { force: true });
	// The lastmod ledger is deliberately NOT removed, and this exit is what
	// keeps a fixture build from rewriting it: two fixture books cannot be
	// allowed to record the rest of the corpus as withdrawn.
	console.warn(
		`[sync-corpus] No corpus found at ${buildSrc} -- corpus.ts will fall back to its bundled ` +
			`fixtures. The corpus is a separate, private repository (docs/decisions.md, ` +
			`2026-08-23): clone it beside this one as glossa-corpus/, or set CORPUS_DIR.`
	);
	process.exit(0);
}

/*
 * A work IS its manifest: `corpus/build/<id>/manifest.json` is what every
 * consumer below reads, so a directory without one is not a work no matter
 * what it is named. Deciding that here rather than mid-loop keeps the run
 * summary honest — this list is what gets counted and printed, and it used to
 * include anything that happened to be a directory.
 *
 * The two rejected cases are deliberately NOT treated alike:
 *
 *  - Dot-prefixed directories are ignored in silence. Work IDs are
 *    `type.slug.lang`, never leading-dot, so these are always something else's
 *    scratch space — `.claude/.cc-writes`, an editor's swap dir — and warning
 *    about them every run trains people to ignore the warnings that matter.
 *
 *  - Anything else without a manifest is REPORTED. That is the dangerous
 *    shape: a real work whose manifest failed to write looks exactly like this,
 *    and skipping it quietly would drop it from the build with no signal, which
 *    is the thing `CLAUDE.md` says must never happen ("a genuine failure belongs
 *    in the run summary, never silently absent from the corpus").
 */
const workDirs = readdirSync(buildSrc, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.filter((name) => !name.startsWith('.'))
	.sort();

const manifestless = workDirs.filter(
	(name) => !existsSync(path.join(buildSrc, name, 'manifest.json'))
);
if (manifestless.length > 0) {
	console.warn(
		`[sync-corpus] WARNING: ${manifestless.length} director(ies) under ${buildSrc} have no ` +
			`manifest.json and were NOT built: ${manifestless.join(', ')}. A work without a manifest ` +
			`is invisible to the site — if any of these is a real work, its scrape did not finish.`
	);
}

const workIds = workDirs.filter((name) => !manifestless.includes(name));

/**
 * Works switched off — see `site/unpublished.json`, which documents the
 * mechanism and the reasoning.
 *
 * Read here, at the point where content is written, because that is what
 * makes the switch real: a disabled work's TEXT is never written into
 * `corpus-data/content/` at all, so it is absent from the server rather than
 * hidden by the client. Its manifest still goes into the index, because the
 * registry is what tells the site which addresses to stop offering; the site
 * then serves no page for a work with nothing left to read.
 *
 * A missing or malformed file is a hard error rather than an empty default.
 * Every other input here degrades quietly when absent, and that is right for
 * a corpus that may be partially built — but silently publishing a work
 * somebody switched off is the one failure this script must never produce.
 */
const unpublishedPath = path.join(siteRoot, 'unpublished.json');
const unpublishedWorks = readJson(unpublishedPath).works ?? {};
const unpublishedIds = new Set(Object.keys(unpublishedWorks));

/**
 * Works whose own parser reported that it had failed on them, and which are
 * not withheld — collected in the loop below and a hard error after it.
 *
 * `vatican_docs.py` writes `PARSER DEFEATED` into `manifest.notes` when a
 * document's markup beat it. That is the parser's own verdict on its own
 * output, and it is the strongest quality signal the corpus produces. But
 * `notes` is dropped from the shipped index a few lines down (it is scraper
 * diagnostics, not reader-facing), so nothing downstream — `preflight-deploy`
 * included — can ever see it. Three works drifted into production that way:
 * `quadragesimo-anno.pt` was shipping 5 of its 148 paragraphs, about 9% of the
 * page's text, with the marker sitting unread in its manifest the whole time.
 *
 * Checked here because this is the last place the marker still exists. The
 * fix for a failure is a one-line entry in `unpublished.json`, or repairing
 * the parse and re-parsing; it is deliberately not skippable, because the
 * thing it prevents is silently publishing a document we know is broken.
 */
const publishedDefeats = [];

/**
 * Editorial descriptions — see `site/descriptions.json` for the format and
 * for why they are curated here instead of in the corpus.
 *
 * The short version: `corpus/build/*​/manifest.json` is generated output, and
 * this project fixes parse defects by re-parsing (CLAUDE.md's "re-parse,
 * never re-crawl"), so anything hand-written into a manifest survives only
 * until the next fix. Merging at sync time keeps the corpus purely generated
 * and keeps `manifest.description` populated for every route that already
 * reads it — no component changes, no second lookup path.
 *
 * Unlike `unpublished.json`, a missing file here is NOT an error: a corpus
 * with no descriptions yet is a perfectly good corpus, and the failure mode
 * (a document shows no summary) is cosmetic. The takedown file's hard error
 * exists because ITS failure mode is publishing something we were asked to
 * withdraw; these two files look alike and are deliberately strict in
 * different degrees.
 */
const descriptionsPath = path.join(siteRoot, 'descriptions.json');
const descriptions = existsSync(descriptionsPath)
	? (readJson(descriptionsPath).descriptions ?? {})
	: {};

/**
 * The description written in a work's OWN language.
 *
 * `descriptions.json` is `work id -> language -> { text, origin }` since
 * 2026-08-25, so that a description read from a document and a translation of
 * one are distinguishable rather than sharing a field. Only the reading is
 * merged into the manifest here: the index tier is eagerly loaded by every
 * reader, and putting eight translations of every description into it would
 * multiply the one field in it that is prose. Translations are stored and are
 * not yet shipped.
 *
 * A work's own language is the only one a reading can be in, so this is a
 * lookup rather than a search: `encyclical.rerum-novarum.pt` is described in
 * Portuguese by definition, because the description is prose about that text.
 */
function ownLanguageDescription(workId, language) {
	return descriptions[workId]?.[language]?.text ?? null;
}

const manifests = {}; // workId -> manifest.json, verbatim (every work type, incl. future document families)
const bibleIndex = {}; // workId -> { books: BibleBookMeta[] }
const bibleIntroIndex = {}; // lang -> { books: [osis, …] } -- EXISTENCE only, never the prose
// Keyed by bare LANG, matching the CCC/Compendium/prayers: a book introduction
// describes the BOOK, not the translation, so `bible-intro.{lang}` has no
// edition segment to key on (docs/corpus-schema.md).
//
// DELIBERATELY NOT FOLDED INTO `bibleIndex`. An introduction is addressed as
// chapter 0 of its book, and putting that 0 into a Bible book's `chapters`
// would make it indistinguishable from a chapter of scripture to everything
// downstream that reads chapter numbers from there -- `refs.ts`'s existence
// check (so "Gen 0" would start resolving as a citation), the xref checker's
// `chapterVerses` map, and `versification.ts`. Chapter 0 is an address the
// reader can navigate to; it is not a verse-bearing chapter, and keeping the
// two registries apart is what stops it becoming citable by accident.
const cccIndex = {}; // lang -> { structure, abbreviations, paragraphNumbers }
const cccEditions = []; // [{ lang, work, paragraphs }] -- input to the xref pass
const documentEditions = []; // [{ slug, lang, work, sections }] -- ditto, per document edition
const compendiumIndex = {}; // lang -> { structure }
const compendiumEditions = []; // [{ lang, work, questions }] -- input to the condensation vote
const compendiumQuestionNumbers = []; // canonical URL existence, across languages
const summaIndex = {}; // lang -> { structure, questions } -- metadata only, never article text
const summaAddresses = {}; // partSlug -> Set(question numbers), unioned across editions
const documentIndex = {}; // workId -> { sectionNumbers, appendixUnits? } -- keyed by WORK ID, not lang: unlike
// the CCC/Compendium (one canonical work per language), each document work id
// (`{family}.{slug}.{lang}`) is its own independent work with its own section
// count and its own structure tree -- there is no single "the document tree
// for English" the way there's a single CCC tree for English.
const prayerIndex = {}; // lang -> { structure, prayers } -- keyed by bare LANG, matching the Compendium
// (one canonical work per language), per the task brief's own instruction to
// follow that shape rather than the Documents one above: today there is
// exactly one prayer collection (`prayer.common.{lang}`), so `workId.split('.').pop()`
// safely recovers the language. `prayers` here is a COMPACT per-prayer summary
// (slug/n/title/kind/hasLatin/hasGroups) -- existence metadata for
// `entries()`/list pages/adjacency, never `blocks`/`latin` text, mirroring
// `bible-index.json`'s "numbers, never verse text" rule one type over.
/** [{ workId, kind, relPath, bytes }] — relPath matches the key `corpus.ts`
 *  derives from Vite's glob path (see `contentKeyFromGlobPath`), so the two
 *  can be joined at runtime without a second copy of the byte counts. */
const contentManifest = [];

// Every work's citation strings and prose, measured against the grammar once
// all manifests are in — see `reference-coverage.mjs`.
const coverage = new CoverageMeter();

/** Whole-reading routes are addressed by their unit's first number. Keep
 * these kind sets in sync with the corresponding corpus helpers: the edge
 * may only bless canonical addresses the client reader can actually resolve.
 * Declared above the work loop because the lastmod pass reads them there as
 * well as the route manifest below.
 */
const CCC_CHAPTER_KINDS = new Set(['chapter', 'prologue', 'section', 'part']);
const COMPENDIUM_CHAPTER_KINDS = new Set(['chapter', 'section', 'part']);

/** Canonical path -> language -> the fingerprints of the text stored there.
 *  Filled by `mark()` below as each work is read; resolved against the
 *  committed ledger once the address space is complete. */
const addressFingerprints = new Map();

/**
 * Record one edition's text for one address.
 *
 * The `hrefFor` indirection is not decoration: `address.ts` is "the only place
 * a canonical URL is written", and a fingerprint filed under a path the sitemap
 * spells differently is a date that silently attaches to nothing. Passing the
 * same builder both consumers use is what keeps them joined.
 *
 * `lang` is `manifest.language` rather than the tail of the work id, because
 * the manifest is what the site itself reads and the id is a filename. It
 * decides which editions the date is drawn from at all — see `SITEMAP_LANGS`
 * in `scripts/lastmod.mjs`.
 *
 * @param {Parameters<typeof hrefFor>[0]} address
 * @param {unknown} value
 * @param {string} workId
 * @param {string} lang
 */
function mark(address, value, workId, lang) {
	fingerprint(addressFingerprints, hrefFor(address), value, corpusDateFor(workId), lang);
}

/**
 * The corpus's own last commit date for a work, as `YYYY-MM-DD`, or undefined.
 *
 * Used ONLY to seed an address the ledger has never seen (`lastmod.mjs`). It is
 * far too coarse to detect change — one commit touching `ccc.en/paragraphs.json`
 * covers all 2,865 CCC addresses, which is exactly why the ledger exists — but
 * as an upper bound on when a work's text last moved it beats stamping a first
 * build with the wall clock, and it is reproducible on any machine holding the
 * same corpus checkout.
 *
 * Best-effort by design: `CORPUS_DIR` may point at something that is not a git
 * checkout at all, and the fixtures never are.
 *
 * SINCE 2026-08-27 IT ESSENTIALLY ALWAYS RETURNS UNDEFINED, and that is not a
 * regression to chase. `build/` (formerly `build/`) is not tracked in the corpus repository
 * (`docs/decisions.md` §The corpus), so there is no commit touching a work to
 * ask about. Kept rather than deleted because the call costs nothing, still
 * answers for anyone holding a pre-rewrite clone, and would answer again if
 * the corpus were ever laid out differently. The ledger is the durable record:
 * every address it has already seen keeps its date, and only a NEWLY added
 * work loses its seed and is stamped with the build date instead -- which is
 * roughly right for a work that is new. Watch `resolveLastmod`'s `unseeded`
 * count if that assumption ever needs checking.
 *
 * @param {string} workId
 * @returns {string | undefined}
 */
const corpusDates = new Map();
function corpusDateFor(workId) {
	if (corpusDates.has(workId)) return corpusDates.get(workId);
	let date;
	try {
		date =
			execFileSync('git', ['log', '-1', '--format=%cs', '--', `build/${workId}`], {
				cwd: corpusDir,
				encoding: 'utf8',
				stdio: ['ignore', 'pipe', 'ignore']
			}).trim() || undefined;
	} catch {
		date = undefined;
	}
	corpusDates.set(workId, date);
	return date;
}

for (const workId of workIds) {
	const workDir = path.join(buildSrc, workId);
	const manifestPath = path.join(workDir, 'manifest.json');
	// No existence check here: `workIds` is already filtered to directories that
	// have a manifest, and the ones that don't were reported up there rather
	// than skipped in silence.
	const manifest = readJson(manifestPath);
	coverage.addWork(workId, workDir);
	// `notes` is free-text scraper/provenance diagnostics — sometimes several
	// paragraphs (observed: the Vatican-document manifests, which can run to
	// a page of scraper notes) — and no route renders it (only `copyright`,
	// `title`/`short_title`, `language`, bible's `books`). Dropped from the
	// INDEX copy (eagerly inlined into every page) for that reason; still
	// sitting in the source corpus for anyone reading it there. Kept as `''`
	// rather than removing the key so `WorkManifest`'s shape stays intact for
	// any future reader of `getWork()` that does start using it.
	// `descriptions` wins over whatever the scraper left in `description`
	// (today: always null — no scraper writes one, and none should: a
	// description is editorial). Falls back to the manifest's own value so
	// that stays true rather than assumed.
	// `sources` is trimmed to its FIRST ENTRY for the same reason `notes` is
	// blanked: nothing on any page reads the rest. `copyright.ts`'s
	// `sourceUrl` — the only reader there is, via `CopyrightNotice.svelte` and
	// the document route's redirect-to-source — takes `sources[0].url` and
	// nothing else, and `retrieved_at` is read by no component in the site at
	// all. The full array is provenance for whoever reads the corpus repo, and
	// the CCC's mirror alone contributes hundreds of entries: across 377 works
	// it was 92 KB of the index, ~38 KB of it in the boot chunk after the
	// first entry is kept.
	//
	// TRIMMED, NOT RESHAPED. `ccc.py` deliberately puts the mirror's table of
	// contents at the head of the list because that is what the source link
	// wants (see `sourceUrl`'s docblock), so "the first entry" is a decision
	// the scrapers already make on purpose — this only stops carrying the ones
	// after it. Keeping the entry whole rather than reducing it to a bare URL
	// leaves `WorkManifest`'s shape intact, which is the same bargain `notes:
	// ''` strikes.
	manifests[workId] = {
		...manifest,
		notes: '',
		...(manifest.sources ? { sources: manifest.sources.slice(0, 1) } : {}),
		description: ownLanguageDescription(workId, manifest.language) ?? manifest.description ?? null
	};

	if (typeof manifest.notes === 'string' && manifest.notes.includes('PARSER DEFEATED')) {
		if (!unpublishedIds.has(workId)) publishedDefeats.push(workId);
	}

	// The switch. Everything above this line still happens — the manifest goes
	// into the index, so the registry still knows the work exists, which is
	// what the listings need in order to fall back to another edition of the
	// same document. Everything BELOW writes reading text, and for a disabled
	// work none of it runs: no content file is produced, so the text is not on
	// the server at all rather than merely unreachable from the UI.
	//
	// Structure trees are skipped with the text. A table of contents built
	// from a parse we do not trust is not better than nothing, and the routes
	// enumerated from it would address text that was never written.
	if (unpublishedIds.has(workId)) {
		console.warn(`[sync-corpus] ${workId}: DISABLED — content withheld from the build`);
		continue;
	}

	if (workId.startsWith('bible.')) {
		const booksDir = path.join(workDir, 'books');
		const books = [];
		for (const entry of readdirSync(booksDir).sort()) {
			if (!entry.endsWith('.json')) continue;
			const book = readJson(path.join(booksDir, entry));
			books.push({
				osis: book.osis,
				name: book.name,
				abbrevs: book.abbrevs,
				order: book.order,
				// Metadata tier carries chapter/verse EXISTENCE only — `{ n,
				// verses: [n, …] }`, never verse `text` — for the book/
				// chapter picker, chapter-adjacency nav, and (the reason verse
				// NUMBERS are here at all, not just chapter numbers)
				// `refs.ts`'s `refHref`, which checks a cited verse actually
				// exists in the reader's edition before linking to it — a
				// file this restructuring must not require editing.
				// `verses` is a PLAIN number array on disk/on the wire (not
				// `{n}` objects — `corpus-index.ts` expands each into `{n}`
				// when building the runtime registry, which is the shape
				// `refs.ts` actually needs): wrapping ~72,000 verse numbers
				// in objects here was most of this client chunk's weight
				// (measured 2026-08-15: ~1.2 MB raw / ~430 KB of that from
				// object-wrapping alone), for zero benefit since the wrapping
				// only needs to exist in memory, not on the wire. Explicit
				// numbers (not e.g. a max-verse-number bound) specifically so
				// a future critical-text verse gap (docs/corpus-schema.md
				// explicitly allows those) can't silently mislink — the
				// opposite of `refs.ts`'s own "under-link rather than
				// over-link" principle. Verse TEXT is the content tier,
				// fetched per-chapter-page.
				chapters: book.chapters.map((c) => ({
					n: c.n,
					verses: c.verses.map((v) => v.n)
				}))
			});
			// One address per chapter, fingerprinted from the chapter as stored.
			// Unioned across editions by `mark`: `/scriptura/gen/1` is one page
			// showing whichever edition the reader has, so a correction to any
			// of the three is a change at that address.
			for (const chapter of book.chapters) {
				mark(
					{ kind: 'bible', osis: book.osis, chapter: chapter.n },
					chapter,
					workId,
					manifest.language
				);
			}
			// Chapter text, chunked by CHAPTER (see `BIBLE_CHAPTER_CHUNK_SIZE`).
			// The chunk is the bare `Chapter[]` for its range, not a trimmed
			// copy of the book object: `osis`/`name`/`abbrevs`/`order` are all
			// in the index tier above, already in hand at every call site, and
			// repeating them in each of a book's chunks would be the only
			// thing in this tier that isn't reading text.
			const maxChapterN = book.chapters.reduce((max, c) => Math.max(max, c.n), 0);
			for (let start = 1; start <= maxChapterN; start += BIBLE_CHAPTER_CHUNK_SIZE) {
				const end = start + BIBLE_CHAPTER_CHUNK_SIZE - 1;
				const chunk = book.chapters.filter((c) => c.n >= start && c.n <= end);
				if (chunk.length === 0) continue;
				const chunkName = `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}`;
				const relPath = `content/${workId}/books/${book.osis}/${chunkName}.json`;
				writeJson(path.join(destDir, relPath), chunk);
				contentManifest.push({
					workId,
					kind: 'bible-chapters',
					relPath,
					bytes: byteLength(chunk)
				});
			}
		}
		books.sort((a, b) => a.order - b.order);
		bibleIndex[workId] = { books };
		continue;
	}

	// Book introductions (docs/corpus-schema.md §Book introductions:
	// `bible-intro.{lang}`). Branches on `manifest.type` rather than the
	// `bible-intro.` prefix for the same reason the prayer and document
	// branches below do — and note the prefix would be the more fragile test
	// here in particular, since `workId.startsWith('bible.')` above must NOT
	// match this work and only the dot keeps it from doing so.
	if (manifest.type === 'bible-intro') {
		const lang = workId.split('.').pop();
		const intros = readJson(path.join(workDir, 'intros.json'));
		// Existence only. The prose is ~50 KB per language, which is content
		// tier by the same rule that keeps verse text out of `bible-index.json`
		// -- the index is eager-inlined into every page, and a reader who never
		// opens an introduction must not carry all 71 of them.
		bibleIntroIndex[lang] = { books: intros.map((entry) => entry.osis) };

		// An introduction is chapter 0 of its book, and therefore an address on
		// the same terms as any other chapter (docs/corpus-schema.md §Book
		// introductions) — including this one.
		for (const entry of intros) {
			mark({ kind: 'bible', osis: entry.osis, chapter: 0 }, entry, workId, manifest.language);
		}

		// Kept WHOLE per language, like the prayers: one fetch the first time a
		// reader opens any introduction, then memoized for the rest of the
		// session. There is no chunk boundary worth drawing in 50 KB.
		const relPath = `content/${workId}/intros.json`;
		writeJson(path.join(destDir, relPath), intros);
		contentManifest.push({
			workId,
			kind: 'bible-intros',
			relPath,
			bytes: byteLength(intros)
		});
		continue;
	}

	if (workId.startsWith('ccc.')) {
		const lang = workId.slice('ccc.'.length);
		const structure = readJson(path.join(workDir, 'structure.json'));
		const abbreviations = existsSync(path.join(workDir, 'abbreviations.json'))
			? readJson(path.join(workDir, 'abbreviations.json'))
			: [];
		const paragraphs = readJson(path.join(workDir, 'paragraphs.json'));
		const paragraphNumbers = paragraphs.map((p) => p.n).sort((a, b) => a - b);
		cccIndex[lang] = { structure, abbreviations, paragraphNumbers };
		// Held for the xref pass below, which needs every edition at once —
		// every edition's Scripture references are unioned per paragraph
		// (see build-xrefs.mjs). Not read from the chunks written just below:
		// those are already filtered by `unpublished`, and taking a work down
		// should not silently rewrite what the Catechism is recorded as
		// citing.
		cccEditions.push({ lang, work: workId, paragraphs });

		for (const paragraph of paragraphs) {
			mark({ kind: 'ccc', n: paragraph.n }, paragraph, workId, manifest.language);
		}
		// The chapter page renders its whole span, so its fingerprint is that
		// span's paragraphs — not the outline. A correction inside a chapter
		// changes the chapter page as surely as it changes the paragraph page.
		for (const [from, to] of chapterSpans(structure, CCC_CHAPTER_KINDS)) {
			const span = paragraphs.filter((p) => p.n >= from && p.n <= to);
			mark({ kind: 'cccChapter', n: from }, span, workId, manifest.language);
		}

		const maxN = paragraphNumbers[paragraphNumbers.length - 1] ?? 0;
		for (let start = 1; start <= maxN; start += CCC_CHUNK_SIZE) {
			const end = start + CCC_CHUNK_SIZE - 1;
			const chunk = paragraphs.filter((p) => p.n >= start && p.n <= end);
			if (chunk.length === 0) continue;
			const chunkName = `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}`;
			const relPath = `content/${workId}/paragraphs/${chunkName}.json`;
			writeJson(path.join(destDir, relPath), chunk);
			contentManifest.push({ workId, kind: 'ccc-chunk', relPath, bytes: byteLength(chunk) });
		}
		continue;
	}

	if (workId.startsWith('compendium.')) {
		const lang = workId.slice('compendium.'.length);
		const structure = readJson(path.join(workDir, 'structure.json'));

		const questions = readJson(path.join(workDir, 'questions.json'));
		// Existence numbers move to the INDEX tier with the chunk split, the
		// way the CCC has always kept `paragraphNumbers`: existence and
		// adjacency used to be answered by scanning the one whole-language
		// content file every reader had already fetched, and chunked that scan
		// would have to pull all six chunks to learn a number is absent.
		compendiumIndex[lang] = {
			structure,
			questionNumbers: questions.map((question) => question.n).sort((a, b) => a - b)
		};
		compendiumQuestionNumbers.push(...questions.map((question) => question.n));
		// Every edition, not one: the ten disagree about a question's own
		// reference line and none of them is complete. See
		// `condensation.ts` for what the vote is over and why.
		compendiumEditions.push({ lang, work: workId, questions });

		for (const question of questions) {
			mark({ kind: 'compendium', n: question.n }, question, workId, manifest.language);
		}
		for (const [from, to] of chapterSpans(structure, COMPENDIUM_CHAPTER_KINDS)) {
			const span = questions.filter((q) => q.n >= from && q.n <= to);
			mark({ kind: 'compendiumChapter', n: from }, span, workId, manifest.language);
		}

		// Chunked by question, exactly as the CCC is by paragraph — see
		// `COMPENDIUM_CHUNK_SIZE` for why this stopped being a whole-file work.
		const maxQuestionN = questions.reduce((max, q) => Math.max(max, q.n), 0);
		for (let start = 1; start <= maxQuestionN; start += COMPENDIUM_CHUNK_SIZE) {
			const end = start + COMPENDIUM_CHUNK_SIZE - 1;
			const chunk = questions.filter((q) => q.n >= start && q.n <= end);
			if (chunk.length === 0) continue;
			const chunkName = `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}`;
			const relPath = `content/${workId}/questions/${chunkName}.json`;
			writeJson(path.join(destDir, relPath), chunk);
			contentManifest.push({
				workId,
				kind: 'compendium-chunk',
				relPath,
				bytes: byteLength(chunk)
			});
		}
		continue;
	}

	// Prayers (docs/corpus-schema.md §Prayers: `prayer.{collection-slug}.{lang}`
	// work ids — currently one collection, `prayer.common.{lang}`). Branches on
	// `manifest.type`, not a `workId.startsWith(...)` prefix list like the
	// three cases above, for the same reason the document branch below does:
	// the middle segment (`common` today) is meant to vary once a second
	// collection ships, and `type: "prayer"` is what's actually invariant.
	if (manifest.type === 'prayer') {
		const lang = workId.split('.').pop();
		const structure = readJson(path.join(workDir, 'structure.json'));
		const prayers = readJson(path.join(workDir, 'prayers.json'));
		prayerIndex[lang] = {
			structure,
			// Existence/metadata only -- see this file's `prayerIndex` docblock
			// above. `n` is kept here (not just used to sort) because
			// `listPrayerGroups`/adjacency both need it at the index tier
			// without a content fetch.
			prayers: prayers.map((p) => ({
				slug: p.slug,
				n: p.n,
				title: p.title,
				kind: p.kind,
				hasLatin: Boolean(p.latin),
				hasGroups: Boolean(p.groups && p.groups.length > 0)
			}))
		};

		for (const prayer of prayers) {
			mark({ kind: 'prayer', slug: prayer.slug }, prayer, workId, manifest.language);
		}

		// Kept WHOLE per language (see this module's docblock) -- ~40 KB raw
		// per language in the real corpus, an order of magnitude under the
		// Compendium's own no-split precedent, so there is no chunk boundary
		// to draw here at all.
		const relPath = `content/${workId}/prayers.json`;
		writeJson(path.join(destDir, relPath), prayers);
		contentManifest.push({
			workId,
			kind: 'prayer-collection',
			relPath,
			bytes: byteLength(prayers)
		});
		continue;
	}

	// Documents (docs/corpus-schema.md §Documents: `{family}.{slug}.{lang}`
	// work ids — `vatii.lumen-gentium.en`, future `encyclical.*`/`cdf.*`/…).
	// Branches on `manifest.type`, not a `workId.startsWith(...)` prefix list
	// like the three cases above: the family segment varies (vatii today,
	// The Summa (docs/corpus-schema.md §Summa). Keyed by bare LANG like the
	// Catechism, not by work id like the documents: there is one canonical
	// Summa per language, not N independent works sharing a type.
	if (manifest.type === 'summa') {
		const lang = workId.slice('summa.'.length);
		const structure = readJson(path.join(workDir, 'structure.json'));
		const questions = readJson(path.join(workDir, 'questions.json'));

		// EXISTENCE AND TITLES ONLY -- never a division's html. Same rule as
		// `bible-index.json`'s "numbers, never verse text": what the index
		// tier owes the client is enough to render a table of contents,
		// validate an address and answer adjacency synchronously. At 611
		// questions this is ~40 KB per language; the text it leaves behind is
		// 19 MB.
		summaIndex[lang] = {
			structure,
			questions: questions.map((q) => ({
				part: q.part,
				n: q.n,
				title: q.title,
				articles: q.articles.map((a) => a.n),
				// The article-less questions (I q. 71, q. 72) carry their
				// divisions on the question itself, and a reader route has to
				// know that before fetching anything.
				...(q.divisions ? { hasOwnDivisions: true } : {})
			}))
		};

		// One file per question, which is exactly one reader page. Averages
		// ~31 KB, so a reader opening II-II q. 64 fetches that and nothing
		// else -- the alternative, chunking by number range like the CCC,
		// would drag in four unrelated questions per read for no gain, since
		// question numbers restart per part and a range spans no natural unit.
		for (const question of questions) {
			const slug = summaPartSlug(question.part);
			(summaAddresses[slug] ??= new Set()).add(question.n);
			// `article: null` — an article is a fragment on its question's page,
			// and `sitemapPaths` lists the question for the same reason.
			// `slug`, not `question.part`: the address space is keyed by the part
			// SLUG (`summaAddresses` above, and the route manifest the sitemap
			// reads). Passing the raw part here files the fingerprint under a
			// path the sitemap never spells, and the date attaches to nothing.
			mark(
				{ kind: 'summa', part: slug, question: question.n, article: null },
				question,
				workId,
				manifest.language
			);
			const relPath = `content/${workId}/questions/${slug}/${question.n}.json`;
			writeJson(path.join(destDir, relPath), question);
			contentManifest.push({
				workId,
				kind: 'summa-question',
				relPath,
				bytes: byteLength(question)
			});
		}
		continue;
	}

	// encyclical/apost-exhort/apost-const/cdf later per the schema), but
	// every one of them is `type: "document"` and shares one content shape,
	// so there's exactly one branch to maintain as more families land.
	if (manifest.type === 'document') {
		const structure = readJson(path.join(workDir, 'structure.json'));
		const sections = readJson(path.join(workDir, 'sections.json'));
		// Matter the source prints with no number on it (docs/corpus-schema.md
		// §"An unnumbered unit"). Absent for most works; for the eight editions
		// that number nothing at all it is the whole text.
		const appendixPath = path.join(workDir, 'appendix.json');
		const appendix = existsSync(appendixPath) ? readJson(appendixPath) : null;
		// Section EXISTENCE only, mirroring `cccParagraphNumbers` — the index
		// tier never carries section TEXT, so `documentSectionExists`/
		// adjacency in corpus.ts stay synchronous.
		//
		// THE STRUCTURE TREE IS NOT HERE. It is written as a content-tier
		// asset just below, one file per work, and the reason is arithmetic:
		// 354 document editions carry 414 KB of outline between them, which
		// was 82 KB brotli — a quarter of the whole boot chunk — inlined into
		// every route's `modulepreload` so that a reader could open ONE of the
		// 354. The other index registries here stay eager because they are
		// answers to questions asked without a work in hand (does this
		// paragraph exist, which books are there); an outline is only ever
		// wanted by the page already reading that document, which is the
		// definition of the content tier.
		//
		// It is content-tier rather than a lazily-fetched index file for one
		// further reason: content-tier assets ride the service worker's
		// download waves, so a reader filling their offline library gets each
		// document's headings alongside that document's text. An index file
		// would have landed in the permanent cache but in no wave, and the
		// offline library would have gone quietly headless.
		documentIndex[workId] = {
			sectionNumbers: sections.map((s) => s.n).sort((a, b) => a - b),
			...(appendix ? { appendixUnits: appendix.length } : {})
		};

		// A document is ONE address showing the whole text, so it is one
		// fingerprint over everything that renders there — sections and the
		// unnumbered matter alike, which for the eight editions that number
		// nothing at all is the entire work. The slug is read the same way the
		// route manifest reads it, from the middle segment of the work id.
		{
			const slug = /^([a-z0-9-]+)\.([a-z0-9-]+)\.([a-z]{2,3})$/.exec(workId)?.[2];
			if (slug) mark({ kind: 'document', slug }, [sections, appendix], workId, manifest.language);
		}
		{
			// Averages 1.2 KB. Written even when empty, so an absent file
			// means "this work was never built" rather than "this work has no
			// headings" — the same distinction every other content location
			// makes, and the one `documentStructures.svelte.ts` relies on to
			// tell a real miss from a document that simply has no outline.
			const relPath = `content/${workId}/structure.json`;
			writeJson(path.join(destDir, relPath), structure);
			contentManifest.push({
				workId,
				kind: 'document-structure',
				relPath,
				bytes: byteLength(structure)
			});
		}
		if (appendix) {
			// One asset, not chunked: the largest in the corpus is 120 KB, and
			// a reader who opens an unnumbered edition needs all of it at once
			// because there is no numbered flow to page through.
			const relPath = `content/${workId}/appendix.json`;
			writeJson(path.join(destDir, relPath), appendix);
			contentManifest.push({
				workId,
				kind: 'document-appendix',
				relPath,
				bytes: byteLength(appendix)
			});
		}
		// Held for the xref pass, keyed by SLUG: the two language editions of
		// one document are unioned into a single entry, the same way the two
		// Catechism editions are, because they are one document citing one
		// verse. `{family}.{slug}.{lang}` -> slug, lang.
		const [, slug, docLang] = workId.split('.');
		documentEditions.push({ slug, lang: docLang, work: workId, sections });

		// Chunked, and shipped verbatim: there is nothing to strip. The corpus
		// stores `html` and nothing derived from it (docs/corpus-schema.md),
		// so what is written here is what was read. The fat-corpus/thin-shipped
		// split this used to perform went away with the derived fields.
		//
		// From the already-sorted index rather than from the last element:
		// nothing guarantees `sections.json` is written in `n` order, and a
		// single out-of-order row would silently truncate the last chunk.
		const sorted = documentIndex[workId].sectionNumbers;
		const maxN = sorted.length ? sorted[sorted.length - 1] : 0;
		for (let start = 1; start <= maxN; start += DOCUMENT_CHUNK_SIZE) {
			const end = start + DOCUMENT_CHUNK_SIZE - 1;
			const chunk = sections.filter((s) => s.n >= start && s.n <= end);
			if (chunk.length === 0) continue;
			const chunkName = `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}`;
			const relPath = `content/${workId}/sections/${chunkName}.json`;
			writeJson(path.join(destDir, relPath), chunk);
			contentManifest.push({
				workId,
				kind: 'document-chunk',
				relPath,
				bytes: byteLength(chunk)
			});
		}
		continue;
	}

	// Any other work type this script doesn't yet know the content shape of:
	// manifest only, so `listWorks()` keeps seeing it without this script
	// needing to know its content shape. Matches the pre-2026-08-15
	// glob-everything behaviour, which never filtered by work type either.
}

if (publishedDefeats.length > 0) {
	console.error(
		`[sync-corpus] ${publishedDefeats.length} work(s) report a defeated parse in ` +
			`manifest.notes and are not withheld:\n` +
			publishedDefeats.map((id) => `  ${id}`).join('\n') +
			`\n\nEither withhold them in site/unpublished.json (see its header for the ` +
			`reasoning and the field meanings) or repair the parse and re-parse. ` +
			`Run pipeline/scrapers/audit.py for how much text each one is actually losing.`
	);
	process.exit(1);
}

/**
 * Nothing in the content tier may exceed `CONTENT_FILE_CEILING_BYTES`.
 *
 * Deliberately checked over the manifest rather than inside each writer: the
 * point is to catch a work type whose size premise has gone stale, and the
 * writer that would need to notice is exactly the one whose comment says the
 * split isn't needed. A single check over everything cannot be reasoned past
 * one work type at a time.
 */
const oversized = contentManifest
	.filter((entry) => entry.bytes > CONTENT_FILE_CEILING_BYTES)
	.sort((a, b) => b.bytes - a.bytes);

if (oversized.length > 0) {
	const kinds = [...new Set(oversized.map((entry) => entry.kind))].sort();
	console.error(
		`[sync-corpus] ${oversized.length} content file(s) exceed the ` +
			`${(CONTENT_FILE_CEILING_BYTES / 1000).toFixed(0)} KB ceiling ` +
			`(kind(s): ${kinds.join(', ')}):\n` +
			oversized
				.slice(0, 20)
				.map((entry) => `  ${(entry.bytes / 1000).toFixed(0).padStart(5)} KB  ${entry.relPath}`)
				.join('\n') +
			(oversized.length > 20 ? `\n  ... and ${oversized.length - 20} more` : '') +
			`\n\nA reader pays for the whole file to read one unit of it. Either chunk ` +
			`the kind(s) above the way the CCC, the Compendium, the documents and the ` +
			`Bible already are, or raise CONTENT_FILE_CEILING_BYTES deliberately and ` +
			`record why — see its docblock for the two regressions this check exists ` +
			`to stop repeating.`
	);
	process.exit(1);
}

/**
 * Translated descriptions, one file per language, written only for the
 * languages that have any.
 *
 * NOT in `manifests.json`, which every reader downloads before the first
 * page paints. A description is the only prose in the index tier, and eight
 * translations of every one of them would add roughly a megabyte to a 415 KB
 * file — most of it in languages any given reader cannot read. One file per
 * language is one request, made only when the reader's language is not the
 * one the description was written in, and never made at all for a reader in
 * that language.
 *
 * NOT one file per work either, which was the other candidate: `/documenta`
 * lists every document with its description, so a per-work file would mean
 * one request per row to render a single page.
 *
 * Only `origin: "translated"` renderings go here. A reading in the work's own
 * language is already in the manifest, and duplicating it would make two
 * places disagree the moment one is corrected.
 *
 * Keyed by document SLUG, not by work id, though `descriptions.json` is keyed
 * by work. The two keys answer different questions: the authoring file records
 * WHICH TEXT WAS READ, because a description read from the Portuguese edition
 * is prose about that text; a translation of that prose is about the DOCUMENT,
 * and every edition of it is the same document. Keying the shipped file by work
 * would leave a Portuguese reader looking at the Portuguese edition of a
 * document read in English with no description at all — the row he sees is the
 * `.pt` work, and the translation was filed against the `.en` one. The route is
 * `/documenta/{slug}` for the same reason.
 */
const translatedDescriptions = {}; // lang -> { slug: text }
for (const [workId, renderings] of Object.entries(descriptions)) {
	const manifest = manifests[workId];
	if (!manifest || manifest.type !== 'document') continue;
	const slug = workId.split('.')[1];
	for (const [lang, rendering] of Object.entries(renderings)) {
		if (lang === manifest.language) continue; // the reading, already in the manifest
		if (rendering?.origin !== 'translated') continue;
		(translatedDescriptions[lang] ??= {})[slug] = rendering.text;
	}
}
for (const [lang, bySlug] of Object.entries(translatedDescriptions)) {
	writeJson(path.join(indexDir, `descriptions.${lang}.json`), bySlug);
}
const describedWorks = Object.keys(descriptions).filter(
	(workId) => descriptions[workId]?.[manifests[workId]?.language]?.origin === 'read'
).length;
const translatedCount = Object.values(translatedDescriptions).reduce(
	(n, bySlug) => n + Object.keys(bySlug).length,
	0
);

/**
 * NUMBERING IS COMPACTED HERE, ON THE WAY OUT, and not where each index is
 * built. `compactRun`'s docblock covers what the encoding is and why it is
 * allowed; this is why it happens at the write.
 *
 * Three consumers above still read these registries as plain arrays, and
 * compacting them in place broke all three — only the first of them loudly:
 *
 *   - the xref checker spreads a chapter's verses (`Math.max(0, ...verses)`),
 *     which throws on a number;
 *   - the route manifest flat-maps `paragraphNumbers`, and `[].flatMap` over
 *     the number 2865 quietly yields `[2865]` — a manifest declaring exactly
 *     one valid Catechism address, which the edge would then 404 the other
 *     2,864 of;
 *   - the document branch reads its own `sectionNumbers` back to find the
 *     last chunk boundary.
 *
 * So the in-memory registries stay plain and the encoding happens once, in one
 * place, where `expandRun` in `src/lib/corpus-index.ts` is the mirror image.
 */
const mapValues = (obj, fn) => Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, fn(v)]));

writeJson(path.join(indexDir, 'manifests.json'), manifests);
writeJson(
	path.join(indexDir, 'bible-index.json'),
	mapValues(bibleIndex, (edition) => ({
		books: edition.books.map((book) => ({
			...book,
			chapters: book.chapters.map((c) => ({ n: c.n, verses: compactRun(c.verses) }))
		}))
	}))
);
writeJson(path.join(indexDir, 'bible-intro-index.json'), bibleIntroIndex);
writeJson(
	path.join(indexDir, 'ccc-index.json'),
	mapValues(cccIndex, (v) => ({ ...v, paragraphNumbers: compactRun(v.paragraphNumbers) }))
);
writeJson(
	path.join(indexDir, 'compendium-index.json'),
	mapValues(compendiumIndex, (v) => ({ ...v, questionNumbers: compactRun(v.questionNumbers) }))
);
writeJson(
	path.join(indexDir, 'document-index.json'),
	mapValues(documentIndex, (v) => ({ ...v, sectionNumbers: compactRun(v.sectionNumbers) }))
);
writeJson(path.join(indexDir, 'prayer-index.json'), prayerIndex);
writeJson(
	path.join(indexDir, 'summa-index.json'),
	mapValues(summaIndex, (v) => ({
		...v,
		questions: v.questions.map((q) => ({ ...q, articles: compactRun(q.articles) }))
	}))
);

/**
 * CCC -> Bible cross-references, DERIVED here rather than read from the
 * corpus. `corpus/xrefs/ccc-bible.json` used to be a committed file built by
 * a separate Python parser; it is now computed from `corpus/build/` on every
 * build by the site's own citation grammar. See `build-xrefs.mjs` for why,
 * and docs/decisions.md §Parsing.
 */
// The grammar's document-title and siglum matchers are fed the same document
// list `refs.ts` hands them in the browser, so the builder and the renderer
// run the SAME parser configuration — before this, the builder parsed with no
// document table at all, which cost the scripture index nothing (scripture is
// matched first in every clause) but made "one grammar" true only by luck.
const documentGroups = new Map();
for (const [workId, manifest] of Object.entries(manifests)) {
	if (manifest.type !== 'document') continue;
	const [, slug, lang] = workId.split('.');
	let group = documentGroups.get(slug);
	if (!group) documentGroups.set(slug, (group = { slug, manifests: {} }));
	group.manifests[lang] = { title: manifest.title };
}
setDocumentTitleSource(() => [...documentGroups.values()]);

const xrefs = buildCccBibleXrefs(cccEditions);
writeJson(path.join(indexDir, 'xrefs.json'), xrefs);
const documentXrefs = buildDocumentBibleXrefs(documentEditions);
writeJson(path.join(indexDir, 'document-xrefs.json'), documentXrefs);
const xrefsSynced = xrefs.length > 0;

/**
 * The same derivation for the citations that are NOT scripture: which CCC
 * paragraph or document section cites which document section, reversed, so
 * a document can say who cites it. docs/link-surface.md #12; the forward
 * direction has rendered since 2026-08-25 and this is its counterpart.
 *
 * Both validators come from what was just read rather than from the site's
 * corpus helpers, which this script cannot import: `sectionNumbers` is
 * already indexed per document above, and the Catechism's paragraph numbers
 * per edition. A section is real if ANY edition of that document has it, the
 * same union rule the scripture pass applies to references.
 */
const sectionsBySlug = new Map();
for (const { slug, sections } of documentEditions) {
	let set = sectionsBySlug.get(slug);
	if (!set) sectionsBySlug.set(slug, (set = new Set()));
	for (const section of sections) set.add(section.n);
}
const cccParagraphSet = new Set();
for (const { paragraphs } of cccEditions) for (const p of paragraphs) cccParagraphSet.add(p.n);

/**
 * Which Compendium questions condense which Catechism paragraphs — the one
 * join between the two works the sources state themselves. Derived here for
 * the same reason the scripture xrefs are (see above): it is a reading of
 * `ccc_refs`, and a reading belongs with the renderer rather than committed
 * beside the corpus.
 */
const condensation = buildCondensationMap(compendiumEditions, cccParagraphSet);
writeJson(path.join(indexDir, 'ccc-compendium.json'), condensation.map);
console.log(
	`[sync-corpus] condensation index: ${condensation.stats.questions} questions over ` +
		`${condensation.stats.distinctParagraphs} Catechism paragraphs, voted across ` +
		`${condensation.stats.editions} editions (${condensation.stats.contested} questions had a ` +
		`reference the vote dropped)` +
		(condensation.stats.malformed.length
			? `; ${condensation.stats.malformed.length} unreadable reference token(s): ` +
				condensation.stats.malformed.slice(0, 6).join(', ')
			: '') +
		(condensation.stats.absent.length
			? `; ${condensation.stats.absent.length} reference(s) to paragraphs absent from this corpus`
			: '')
);

const citingUnits = [];
for (const { lang, work, paragraphs } of cccEditions) {
	for (const p of paragraphs) {
		citingUnits.push({ citer: { kind: 'ccc', n: p.n }, lang, work, unit: p });
	}
}
for (const { slug, lang, work, sections } of documentEditions) {
	for (const section of sections) {
		citingUnits.push({
			citer: { kind: 'document', slug, n: section.n },
			lang,
			work,
			unit: section
		});
	}
}
const citationXrefs = buildCitationXrefs(
	citingUnits,
	(slug, n) => sectionsBySlug.get(slug)?.has(n) ?? false,
	(n) => cccParagraphSet.has(n)
);
writeJson(path.join(indexDir, 'document-citations.json'), citationXrefs.documents);
writeJson(path.join(indexDir, 'ccc-citations.json'), citationXrefs.ccc);
console.log(
	`[sync-corpus] reverse citation index: ${citationXrefs.documents.length} document addresses ` +
		`and ${citationXrefs.ccc.length} Catechism paragraphs have a citer`
);

// How much of the apparatus the grammar reads, against the committed
// baseline. Loud and non-fatal here; `preflight-deploy.mjs` is where a drop
// refuses to ship. See `reference-coverage.mjs`.
const coverageReport = coverage.report();
// Two counters that are not about the grammar: how much of the
// Catechism/Compendium join this build actually carries. Both degrade
// silently by design — see `compareCrossWork`. The pairing is counted over
// every (Catechism edition, Compendium edition) pair rather than the pairs a
// reader will actually see, because the fallback that picks a reader's
// companion edition lives in the browser: an all-pairs total moves the
// moment ANY edition's outline diverges, which is the event worth catching.
coverageReport.crossWork = {
	pairedDivisions: Object.values(cccIndex).reduce(
		(total, ccc) =>
			total +
			Object.values(compendiumIndex).reduce(
				(sum, compendium) => sum + pairDivisions(ccc.structure, compendium.structure).size,
				0
			),
		0
	),
	condensedQuestions: condensation.stats.questions,
	condensedParagraphs: condensation.stats.distinctParagraphs
};
writeReport(coverageReport);
console.log(
	`[sync-corpus] cross-work links: ${coverageReport.crossWork.pairedDivisions} paired divisions ` +
		`over all edition pairs, ${coverageReport.crossWork.condensedQuestions} condensing questions`
);
console.log(`[sync-corpus] reference coverage:\n${summarize(coverageReport)}`);
if (process.env.REFERENCE_COVERAGE === 'verbose') {
	for (const [family, f] of Object.entries(coverageReport.families)) {
		if (f.residue.length === 0) continue;
		console.log(`[sync-corpus] ${family}: citations the grammar recognized nothing in`);
		for (const r of f.residue) console.log(`  ${String(r.count).padStart(5)}  ${r.example}`);
	}
}
const coverageBaseline = readBaseline();
if (!coverageBaseline) {
	console.warn(
		`[sync-corpus] no reference-coverage baseline; run \`npm run coverage:accept\` to record this build's as the floor`
	);
} else {
	const regressions = compareCoverage(coverageReport, coverageBaseline);
	if (regressions.length > 0) {
		console.error(
			`[sync-corpus] REFERENCE COVERAGE DROPPED below scripts/reference-coverage.baseline.json ` +
				`(preflight will refuse to deploy this build):\n` +
				regressions.map((r) => `  ${r}`).join('\n') +
				`\n  If the drop is intended, \`npm run coverage:accept\` records the new floor.`
		);
	}
}

if (xrefsSynced) {
	// Loud, non-fatal, and always on — not behind a flag. See
	// `checkXrefsAgainstCorpus`.
	const chapterVerses = new Map();
	for (const { books } of Object.values(bibleIndex)) {
		for (const book of books) {
			for (const chapter of book.chapters) {
				const key = `${book.osis}:${chapter.n}`;
				const max = Math.max(0, ...chapter.verses);
				chapterVerses.set(key, Math.max(chapterVerses.get(key) ?? 0, max));
			}
		}
	}
	const problems = checkXrefsAgainstCorpus([...xrefs, ...documentXrefs], chapterVerses);
	if (problems.length > 0) {
		console.warn(
			`[sync-corpus] ${problems.length} scripture reference(s) point outside the corpus ` +
				`(known source defects — see docs/research/ccc-citation-defects.md):`
		);
		for (const p of problems) console.warn(`  ${p}`);
	}
}

/**
 * Two fields the writers above can't fill in, decorated on afterwards.
 *
 * `lang` because the service worker's download waves are per-language and
 * work ids only *look* parseable: `bible.cpdv.en`, `ccc.pt`, `summa.la`,
 * `encyclical.rerum-novarum.pt` and `prayer.common.en-gb` all put the tag
 * last, but that is a coincidence of five naming schemes rather than a rule,
 * and `manifests` holds the language the work actually declares. Deriving it
 * would be a guess that fails silently — a work in the wrong wave downloads
 * fine, just for the wrong reader.
 *
 * `citedBy` because it is the only ordering signal the corpus already
 * contains for documents. There are ~400 of them and they will not all be
 * downloaded; how often the rest of the corpus cites a document is a far
 * better guess at what a reader wants offline than alphabet or date. Zero for
 * everything that is not a document, which is what keeps this a plain data
 * field rather than a ranking policy — the ordering itself lives in
 * `sw-policy.ts`, where it can be read and tested.
 */
const citersBySlug = new Map();
for (const entry of citationXrefs.documents) {
	citersBySlug.set(entry.work, (citersBySlug.get(entry.work) ?? 0) + entry.cited_by.length);
}
for (const entry of contentManifest) {
	entry.lang = manifests[entry.workId]?.language ?? '';
	const slug = /^[a-z0-9-]+\.([a-z0-9-]+)\.[a-z]{2,3}(-[a-z]{2,3})?$/.exec(entry.workId)?.[1];
	entry.citedBy = (slug && citersBySlug.get(slug)) || 0;
}

writeJson(path.join(indexDir, 'content-manifest.json'), contentManifest);

/**
 * Every chapter-kind node's paragraph span, outermost first.
 *
 * `chapterStarts` below is this with the ends dropped. The spans are what the
 * lastmod ledger needs: a `/catechismus/caput/{n}` page renders the paragraphs
 * between `from` and `to` (see the route's loader), so its fingerprint has to
 * cover that range rather than the outline alone — a corrected paragraph
 * changes the chapter page it appears on.
 */
function chapterSpans(nodes, kinds) {
	const spans = [];
	function walk(items) {
		for (const node of items) {
			const [from, to] = node.paragraphs ?? [];
			if (kinds.has(node.kind) && Number.isFinite(from) && Number.isFinite(to)) {
				spans.push([from, to]);
			}
			walk(node.children ?? []);
		}
	}
	walk(nodes);
	return spans;
}

function chapterStarts(nodes, kinds) {
	return chapterSpans(nodes, kinds).map(([from]) => from);
}

/**
 * Route-only output for `src/worker.ts`. The client has richer index data;
 * the worker needs only enough to answer the binary question "is this a
 * canonical address?", and keeping text out is intentional.
 */
const routeManifest = {
	version: 1,
	workCount: workIds.length,
	contentAssetCount: contentManifest.length,
	bible: (() => {
		const byBook = new Map();
		for (const { books } of Object.values(bibleIndex)) {
			for (const book of books) {
				const chapters = byBook.get(book.osis) ?? new Set();
				for (const chapter of book.chapters) chapters.add(chapter.n);
				byBook.set(book.osis, chapters);
			}
		}
		// Chapter 0 is a book's introduction, in whichever languages have one
		// (docs/corpus-schema.md §Book introductions). Blessed here on the same
		// terms as every other chapter number: the union across languages, so
		// the edge answers "is this an address?" and the reader's own language
		// decides whether there is text to show — exactly how a chapter present
		// in one edition and absent from another already behaves.
		//
		// Guarded on the book already existing, so an introduction filed for a
		// book no edition carries cannot mint an address that resolves to
		// nothing at all.
		for (const { books } of Object.values(bibleIntroIndex)) {
			for (const osis of books) byBook.get(osis)?.add(0);
		}
		return Object.fromEntries(
			[...byBook.entries()].map(([osis, chapters]) => [osis, [...chapters].sort((a, b) => a - b)])
		);
	})(),
	ccc: [...new Set(Object.values(cccIndex).flatMap((value) => value.paragraphNumbers))].sort(
		(a, b) => a - b
	),
	cccChapters: [
		...new Set(
			Object.values(cccIndex).flatMap((value) => chapterStarts(value.structure, CCC_CHAPTER_KINDS))
		)
	].sort((a, b) => a - b),
	compendium: [...new Set(compendiumQuestionNumbers)].sort((a, b) => a - b),
	compendiumChapters: [
		...new Set(
			Object.values(compendiumIndex).flatMap((value) =>
				chapterStarts(value.structure, COMPENDIUM_CHAPTER_KINDS)
			)
		)
	].sort((a, b) => a - b),
	// From `manifests`, so a document the corpus knows about is an address even
	// when this build has none of its text: `/documenta/{slug}` redirects that
	// reader to the source page (docs/decisions.md §Posture), and it needs
	// the shell in order to do it.
	documents: [
		...new Set(
			Object.entries(manifests)
				.filter(([, manifest]) => manifest.type === 'document')
				.map(([workId]) => /^([a-z0-9-]+)\.([a-z0-9-]+)\.([a-z]{2,3})$/.exec(workId)?.[2])
				.filter(Boolean)
		)
	].sort(),
	prayers: [
		...new Set(
			Object.values(prayerIndex).flatMap((value) => value.prayers.map((prayer) => prayer.slug))
		)
	].sort(),
	// Unioned across editions, like `bible` above and for the same reason:
	// the edge answers "is this an address?", and which edition has text for
	// it is the reader's own language fallback to decide. The Supplement
	// exists in English only, and `/summa/suppl/77` is a real address on that
	// basis alone.
	summa: Object.fromEntries(
		Object.entries(summaAddresses)
			.map(([slug, numbers]) => [slug, [...numbers].sort((a, b) => a - b)])
			.sort(([a], [b]) => a.localeCompare(b))
	)
};

writeJson(routeManifestPath, routeManifest);

// Per-address `<lastmod>`, resolved against the committed ledger: an address
// whose text is byte-identical to the last build keeps the date it already had,
// however many times the site is rebuilt. See scripts/lastmod.mjs — the value
// of this element is entirely in its being true.
const previousLedger = readLedger(lastmodPath);
const lastmod = resolveLastmod({
	fingerprints: addressFingerprints,
	ledger: previousLedger,
	today: new Date().toISOString().slice(0, 10)
});
{
	const { total, added, changed, removed, unseeded, basis } = lastmod.stats;
	const known = total - added;
	const share = known === 0 ? 0 : changed / known;
	if (share > CHANGE_CEILING && !process.argv.includes('--accept-lastmod')) {
		// Not a warning. A sitemap that claims a quarter of the corpus changed
		// at once is how a crawler learns to stop believing the file, and the
		// realistic cause is a change to what `mark()` covers rather than to the
		// corpus. Re-run with --accept-lastmod once that is what you meant.
		console.error(
			`lastmod: ${changed} of ${known} known addresses changed ` +
				`(${(share * 100).toFixed(1)}%, ceiling ${(CHANGE_CEILING * 100).toFixed(0)}%). ` +
				`Refusing to write. Re-run with --accept-lastmod if this is intended.`
		);
		process.exit(1);
	}
	writeLedger(lastmodPath, lastmod.entries);
	// The basis tally is the line that says the dates describe the page a
	// crawler is served rather than the newest edition at the address; a shift
	// in it is the only signal that the English chain stopped answering
	// somewhere it used to.
	const read = Object.entries(basis)
		.sort(([, a], [, b]) => b - a)
		.map(([lang, n]) => `${n} ${lang}`)
		.join(', ');
	console.log(
		`lastmod: ${total} addresses — ${changed} changed, ${added} new, ${removed} withdrawn` +
			(unseeded ? `, ${unseeded} dated from the build clock (corpus is not a git checkout)` : '') +
			`; read from ${read}`
	);
}

// Throws rather than warns if any address it derives is one the edge worker
// would 404: the two are generated from the same object in the same pass, so
// a disagreement between them is a bug here and not a corpus condition.
writeFileSync(sitemapPath, sitemapXml(routeManifest, lastmod.dates));

// IDS ONLY, not the entries. The site's one question is "is this work
// switched off", which it asks to keep from offering an address whose content
// was never written; `date` and `reason` are notes to whoever files an entry
// and have no reader-facing surface (docs/decisions.md §Posture).
//
// Copied at all — rather than inferred from "no content files" — because
// "content absent" is also what a partially-built corpus looks like, and the
// two want opposite treatment: a missing chunk should fail loudly during
// development, a disabled work is deliberate and silent.
writeJson(path.join(indexDir, 'unpublished.json'), [...unpublishedIds].sort());

const indexBytes = [
	'manifests.json',
	'bible-index.json',
	'bible-intro-index.json',
	'ccc-index.json',
	'compendium-index.json',
	'summa-index.json',
	'document-index.json',
	'prayer-index.json',
	'xrefs.json',
	'document-xrefs.json'
]
	.map((f) => path.join(indexDir, f))
	.filter(existsSync)
	.reduce((sum, p) => sum + readFileSync(p).length, 0);

console.log(
	`[sync-corpus] Built corpus-data/ from ${buildSrc}: ${workIds.length} work(s), ` +
		`${contentManifest.length} content file(s)${xrefsSynced ? `, plus ${xrefs.length} CCC and ${documentXrefs.length} document xref entries` : ''}. ` +
		`Index tier: ${(indexBytes / 1000).toFixed(0)} KB raw. ` +
		`Descriptions: ${describedWorks} read, ${translatedCount} translated across ` +
		`${Object.keys(translatedDescriptions).length} language file(s). ` +
		`Works: ${workIds.join(', ')}`
);
