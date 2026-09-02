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
 *   (`BIBLE_CHAPTER_CHUNK_TARGET_BYTES`), CCC paragraphs into fixed 100-paragraph
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

import {
	copyFileSync,
	existsSync,
	rmSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	statSync,
	writeFileSync
} from 'node:fs';
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
import { PLATE_INTRINSIC_WIDTH, PLATE_WIDTHS } from '../src/lib/plates.ts';
import { pairDivisions } from '../src/lib/toc-pairing.ts';
import { isDivergentBook, toVulgateCandidates } from '../src/lib/versification.ts';
import { assertApparatus, buildApparatus, buildWorks } from './apparatus.mjs';
import { assertNamed, buildRouteTitles, readDictionaries } from './route-titles.mjs';
import { ORIGIN, sitemapPaths, sitemapXml } from './sitemap.mjs';
import {
	CHANGE_CEILING,
	fingerprint,
	readLedger,
	resolveLastmod,
	writeLedger
} from './lastmod.mjs';
import {
	BASELINE_PATH,
	CoverageMeter,
	REPORT_PATH,
	compareCoverage,
	readBaseline,
	summarize,
	writeReport
} from './reference-coverage.mjs';
import {
	contentDigest,
	importClosure,
	loadState,
	moved,
	saveState,
	treeDigest
} from './incremental.mjs';

const siteRoot = path.resolve(fileURLToPath(import.meta.url), '../..');
const corpusDir = path.resolve(siteRoot, process.env.CORPUS_DIR ?? '../../glossa-corpus');
const destDir = path.join(siteRoot, 'src/lib/corpus-data');

/**
 * The one directory under `destDir` that is RECONCILED rather than rebuilt,
 * and the set of files this run wants in it. See the wipe below.
 */
const PLATES_DIR = 'plates';
const platesDest = path.join(destDir, PLATES_DIR);
const plateImages = new Set();
const indexDir = path.join(destDir, 'index');
const contentDir = path.join(destDir, 'content');
// Public but address-only: the Cloudflare edge worker reads this before it
// serves the SPA shell, so an existing citation receives 200 while a typo
// remains a real 404. It is generated alongside corpus-data, never edited.
const routeManifestPath = path.join(siteRoot, 'static/corpus-routes.json');
// Names for those same addresses, read by the same worker in the same way and
// kept in a second file on purpose: if this one fails to load the edge must
// still answer 200 and 404 correctly, and separate files make that degradation
// structural rather than a `try` somewhere. See scripts/route-titles.mjs.
const routeTitlesPath = path.join(siteRoot, 'static/route-titles.json');
// A THIRD file for the same worker, on the same reasoning one step further:
// this one holds the descriptions and the cross-references, so losing it costs
// a description and some links on a page that still resolves and still names
// itself. Three severities, three files. See scripts/apparatus.mjs.
const apparatusPath = path.join(siteRoot, 'static/apparatus.json');
// Read by nobody here. It is published for the machines that come asking what
// this library holds and who to cite for it, and `static/llms.txt` points at it.
const worksPath = path.join(siteRoot, 'static/works.json');
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
 *  Smaller than the CCC's 100 because a document's sections are much
 *  longer and far more variable than a catechism paragraph — a median 1.1 KB
 *  but a p90 of 2.3 KB and a worst of 7.6 KB — so the same stride would span
 *  a much wider range of chunk sizes.
 *
 *  IT WAS 50 UNTIL THE CORPUS STOPPED BEING WRITTEN IN LATIN SCRIPT. A fixed
 *  section count is only a fixed byte count while the alphabet is; Cyrillic
 *  and Arabic cost two UTF-8 bytes per letter where English costs one, so
 *  the day the magisterial documents landed in ten languages
 *  (2026-08-29) `caritas-in-veritate.ru` produced a 202 KB chunk from the
 *  same 50 sections its English edition fits in 108 KB — the first breach of
 *  the ceiling below, and one no Latin-script measurement could have
 *  predicted. At 25 the worst chunk across all ten languages is well inside
 *  it, the median document (27 sections) still fits in one or two, and the
 *  continuous reading view (`/documenta/{slug}`, which needs every chunk)
 *  is bounded at 6 parallel fetches for the longest document. */
const DOCUMENT_CHUNK_SIZE = 25;

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
 *  (`bibleChapterChunkFor` in `corpus-index.ts`).
 *
 *  One file per book matched the print volume's own granularity, which is a
 *  good OFFLINE unit but was never the READ unit: `/scriptura/{osis}/{chapter}`
 *  shows one chapter, and `getChapter` is the only reader of this tier, so
 *  opening Ps 23 paid for all 150 psalms — 374 KB raw in the Matos Soares
 *  edition, the largest single read in the corpus.
 *
 *  IT WAS A FIXED STRIDE OF 20 UNTIL 2026-08-28, measured across all four
 *  editions then in the corpus, and the measurement was the problem: a stride
 *  is a proxy for size, and it holds only while every edition packs about the
 *  same amount of text into a chapter. `bible.allioli.de` and
 *  `bible.martini.it` broke that on the day they landed — Martini carries
 *  ~600 words of 18th-century commentary on a single verse — and 97 chunks
 *  came out over the ceiling, the worst at 602 KB against a previous corpus
 *  worst of 167 KB. Dropping the stride globally was the wrong fix twice over:
 *  it would have tripled the file count for the four editions that were fine,
 *  and Martini still exceeded the ceiling at a stride of 5.
 *
 *  So chapters are PACKED BY SIZE instead, greedily, up to
 *  `BIBLE_CHAPTER_CHUNK_TARGET_BYTES`. A chunk is still a contiguous range of
 *  chapters within one book and is still named `{start}-{end}`, so the path
 *  shape is unchanged and one file per read is unchanged; only the boundaries
 *  now follow the text rather than the numbering. Nothing needs a threshold or
 *  a per-edition constant, and an edition ingested later with a heavier
 *  apparatus is handled without anyone re-measuring.
 *
 *  WHAT THIS COST, and it is the reason the old comment insisted on a fixed
 *  stride: chunk membership is no longer a pure function of the chapter
 *  number, so the reader can no longer compute it. It does not have to —
 *  `corpus-index.ts` already builds a per-work, per-book map of chunk starts
 *  from the content manifest, and `bibleChapterChunkFor` now selects from that
 *  map the range actually containing the chapter. The path regex there already
 *  captured the end and threw it away; it keeps it now, so the lookup is
 *  bounded rather than a nearest-start guess.
 *
 *  A single chapter that exceeded the ceiling on its own could not be packed
 *  anywhere and would have to raise it. None does: the largest in the corpus is
 *  Martini's Song of Songs 2 at 93 KB, and Allioli's worst is Matthew 26 at
 *  58 KB. Re-check that if an edition with a still-heavier apparatus arrives —
 *  it is the one premise this scheme has left. */
const BIBLE_CHAPTER_CHUNK_TARGET_BYTES = 150_000;

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

/**
 * One book's chapters re-addressed from Hebrew numbering into the Vulgate.
 *
 * Verse by verse, through `toVulgateCandidates` — the same function
 * `refs.ts` resolves a citation with, so an edition's own text and a citation
 * into it cannot disagree about where a verse lives. At VERSE level the mapper
 * is unambiguous (it returns two candidates only for a whole-chapter reference
 * with no verse, which never occurs here), so the single candidate is taken and
 * a second one would be a bug worth hearing about rather than a choice.
 *
 * A Hebrew chapter can SPLIT across two Vulgate chapters and two can MERGE into
 * one, so chapters are rebuilt from scratch rather than relabelled: Heb 9 and
 * Heb 10 both land in Vulg 9, and Heb 116 lands partly in Vulg 114 and partly
 * in Vulg 115. Verse-level `notes`/`text_marked` ride along on the verse object
 * untouched — they belong to the verse, not to its number.
 *
 * `summary` and `headings` follow the verse they sit before, which is the only
 * defensible rule when a chapter splits: a heading is addressed by its verse
 * (docs/corpus-schema.md, "Headings are presentation"), and a summary belongs
 * to whichever Vulgate chapter its chapter's first verse landed in.
 */
function toVulgateChapters(osis, chapters, workId) {
	const byChapter = new Map();
	const chapterOf = (n) => {
		let ch = byChapter.get(n);
		if (!ch) byChapter.set(n, (ch = { n, verses: [] }));
		return ch;
	};
	for (const source of chapters) {
		let firstTarget;
		for (const verse of source.verses) {
			const candidates = toVulgateCandidates(osis, source.n, verse.n);
			if (candidates.length !== 1) {
				throw new Error(
					`${workId} ${osis} ${source.n}:${verse.n}: ${candidates.length} Vulgate ` +
						`candidates for one verse — the mapper should be unambiguous here`
				);
			}
			const { chapter, verse: n } = candidates[0];
			firstTarget ??= chapter;
			chapterOf(chapter).verses.push({ ...verse, n });
		}
		for (const heading of source.headings ?? []) {
			const [target] = toVulgateCandidates(osis, source.n, heading.before_verse);
			const ch = chapterOf(target.chapter);
			(ch.headings ??= []).push({ ...heading, before_verse: target.verse });
		}
		if (source.summary !== undefined && firstTarget !== undefined) {
			const ch = chapterOf(firstTarget);
			// A merge puts two source summaries on one Vulgate chapter. Keep the
			// first and drop the second rather than concatenating: the field is
			// what the source printed above a chapter, and a joined pair is a
			// sentence no edition printed.
			ch.summary ??= source.summary;
		}
	}
	return [...byChapter.values()]
		.sort((a, b) => a.n - b.n)
		.map((ch) => ({
			...ch,
			verses: ch.verses.sort((a, b) => a.n - b.n),
			...(ch.headings
				? { headings: ch.headings.sort((a, b) => a.before_verse - b.before_verse) }
				: {})
		}));
}

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

const buildSrc = path.join(corpusDir, 'build');

/**
 * The inputs this run reads and the outputs it writes, fingerprinted. See
 * scripts/incremental.mjs for the two digests and why each set gets the one it
 * gets; the parts are kept separate rather than merged into one hash so a run
 * can say WHICH of them moved.
 *
 * `dictionaries` IS ITS OWN PART BECAUSE THE CLOSURE CANNOT SEE IT.
 * `route-titles.mjs`'s `readDictionaries` loads them with a template-literal
 * `await import(...)` over `UI_LANGS`, which no static walk of import
 * statements will ever resolve. Fold it into `code` and editing a dictionary
 * silently keeps serving the previous `route-titles.json`.
 *
 * `ledger` IS BOTH AN INPUT AND AN OUTPUT, and content-hashing it is what makes
 * that harmless. `resolveLastmod` is a pure function of the previous ledger,
 * this run's address fingerprints and the date, and over an unchanged corpus it
 * reproduces the file byte for byte -- that is the property the ledger exists
 * for. Hashing it also means a `lastmod.json` arriving from a `git pull`
 * correctly forces a run, since the file on disk no longer matches this
 * script's own last output.
 *
 * There is no `readers` part: nothing here shells out to a binary whose version
 * could change an answer. The `git` spawns in `corpusDateFor` only seed the date
 * of an address the ledger has never seen, and a new address means new files
 * under `build/`, which `corpus` already catches.
 */
function syncFingerprint() {
	const i18nDir = path.join(siteRoot, 'src/lib/i18n');
	return {
		code: contentDigest(importClosure(fileURLToPath(import.meta.url)), siteRoot),
		dictionaries: contentDigest(
			(existsSync(i18nDir) ? readdirSync(i18nDir) : [])
				.filter((f) => f.endsWith('.ts'))
				.map((f) => path.join(i18nDir, f)),
			siteRoot
		),
		editorial: contentDigest(
			[
				path.join(siteRoot, 'unpublished.json'),
				path.join(siteRoot, 'descriptions.json'),
				path.join(siteRoot, 'document-tags.json'),
				BASELINE_PATH
			],
			siteRoot
		),
		ledger: contentDigest([lastmodPath], siteRoot),
		corpus: treeDigest([buildSrc], corpusDir),
		outputs: treeDigest(
			[
				destDir,
				routeManifestPath,
				routeTitlesPath,
				apparatusPath,
				worksPath,
				sitemapPath,
				REPORT_PATH
			],
			siteRoot
		)
	};
}

const statePath = path.join(siteRoot, 'scripts/.sync-corpus-state.json');
const changedOnly = process.argv.includes('--changed-only');
const forced = process.argv.includes('--force');

/*
 * ASKED BEFORE THE WIPE BELOW, which is the whole reason this block sits here
 * rather than anywhere more convenient: the `outputs` part is a claim about
 * what is on disk, and the next statement deletes it.
 *
 * OPT-IN, and `prebuild` does not opt in -- only `predev` does (package.json).
 * `docs/decisions.md` §Parsing settles the general question against skipping by
 * default, and the argument there is about the pipeline, where a stale parse is
 * invisible and flows downstream. This one fails differently: its output is the
 * page in the browser, and the recovery is `--force` and thirteen seconds. What
 * makes the split safe is that a deploy never takes it, so a fingerprint that
 * missed an input cannot reach a reader.
 *
 * A run RECORDS its fingerprint only where it exits 0 (the end of this file),
 * so every gate below -- the lastmod ceiling, PARSER DEFEATED, the content-size
 * ceiling, `assertNamed`, `assertApparatus` -- has already passed over these
 * exact bytes before any skip of them is possible. Skipping is not skipping
 * validation; it is declining to re-derive a result already proven valid.
 */
if (changedOnly && !forced) {
	const drift = moved(syncFingerprint(), loadState(statePath));
	if (drift.length === 0) {
		console.log(
			`[sync-corpus] --changed-only: nothing moved since the last successful sync — skipping. ` +
				`Re-run with --force to rebuild anyway.`
		);
		process.exit(0);
	}
	console.log(`[sync-corpus] --changed-only: ${drift.join(', ')} moved — rebuilding.`);
}

/*
 * THE DESTINATION STARTS EMPTY, so that a content file whose work has been
 * withdrawn cannot survive into a build.
 *
 * EXCEPT `plates/`, WHICH IS RECONCILED INSTEAD. It is 482 derived AVIFs,
 * 103 MB, against ~2 MB for the whole rest of the index tier — the only thing
 * here whose cost is its bytes rather than its parsing, and the only thing
 * that does not change between two runs of a script that otherwise rebuilds
 * everything from the corpus. Nothing derives these at sync time; `dore.py
 * --derive` does, and only when it is run.
 *
 * BE HONEST ABOUT THE SAVING, because it is not what a profile first suggests.
 * On a filesystem with copy-on-write reflinks and a warm page cache, copying
 * all 482 costs about 0.17 s of a 5.4 s sync; a CPU profile taken on a cold
 * cache attributed 1.5 s to `copyFile`, which is the same work costing what it
 * costs when the bytes are actually read and written. So this is worth having
 * for the cold case, for a filesystem that cannot reflink, and because it is
 * work with no possible product — but it is NOT why `npm run dev` takes five
 * seconds. Most of that is this script parsing the corpus, and the largest
 * avoidable piece of it was `corpusDateFor`, not this.
 *
 * IT KEEPS THE WIPE'S GUARANTEE, which is the reason it can be skipped rather
 * than merely made faster. An image is named `{plate_id}-{width}.avif`, so the
 * name is the content's address: `syncPlates` copies whatever is missing or
 * stale, records what it wants, and the prune after the work loop removes
 * everything else — leaving the directory exactly as a wipe-and-refill would
 * have left it, including when a plate is withdrawn, a collection disabled or
 * a width dropped.
 */
for (const entry of existsSync(destDir) ? readdirSync(destDir) : []) {
	if (entry === PLATES_DIR) continue;
	rmSync(path.join(destDir, entry), { recursive: true, force: true });
}

if (!existsSync(buildSrc)) {
	// A fixture build must never inherit a real corpus's route manifest from a
	// previous build. Without this, preflight would see a plausible work count
	// beside fixture client assets and could approve exactly the deploy it is
	// meant to stop. This is generated site output, never corpus/raw.
	rmSync(routeManifestPath, { force: true });
	rmSync(sitemapPath, { force: true });
	rmSync(routeTitlesPath, { force: true });
	rmSync(apparatusPath, { force: true });
	rmSync(worksPath, { force: true });
	// And the images the wipe above spared. A fixture build has no plates.json
	// to point at them, so they would render nowhere and ship anyway — 103 MB
	// of build assets belonging to a corpus this build does not have.
	rmSync(platesDest, { recursive: true, force: true });
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
const commentaryIndex = {}; // workId -> { annotates, books: [{ osis, chapters: [n, …] }] }
// EXISTENCE only, and deliberately coarser than `bibleIndex`: this tier answers
// "does this chapter have commentary at all", which is what decides whether the
// apparatus panel offers the work at an address. It is NOT the verse list --
// nothing on the page needs to know which verses are annotated until the
// reader has actually asked for the commentary, and at that point the chunk
// itself says. A commentary is the largest body of text the corpus holds per
// work, so anything eager about it is charged to every route.
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
 * ask about. Kept rather than deleted because it still answers for anyone
 * holding a pre-rewrite clone, and would answer again if the corpus were ever
 * laid out differently — but NOT because it "costs nothing", which is what
 * this said until it was measured at ~0.6-1.0 s of spawns per sync. What
 * costs nothing is `corpusTracksBuild()` below, which answers for all 383 at
 * once and is why this function usually returns before spawning anything. The ledger is the durable record:
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
	if (!corpusTracksBuild()) return undefined;
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

/**
 * Whether the corpus checkout has any history under `build/` at all — asked
 * ONCE, and the reason the per-work probes above are usually never spawned.
 *
 * ONE `git log` COVERS EVERY PATH UNDER IT, so an empty answer here settles
 * all 383: no commit touched `build/`, therefore none touched
 * `build/<workId>`. In this corpus that is the standing answer — `build/` is
 * in the corpus's `.gitignore`, and its history holds nothing under that name
 * or under the `works/` it was renamed from.
 *
 * WHAT THIS FIXES IS A CLAIM, not only a cost. `corpusDateFor`'s docblock said
 * the call "costs nothing" once `build/` stopped being tracked; measured, the
 * 383 spawns were ~0.6-1.0 s of a 5.4 s sync — several times what copying all
 * 103 MB of plate images costs, and the largest avoidable thing in this
 * script. A process spawn is never free, and 383 of them all answering
 * "nothing" is the shape worth looking for elsewhere.
 *
 * Kept rather than deleted, for the reason that docblock gives: a pre-rewrite
 * clone still answers, and pays one extra spawn to find out.
 */
let buildTracked;
function corpusTracksBuild() {
	if (buildTracked === undefined) {
		try {
			buildTracked =
				execFileSync('git', ['log', '-1', '--format=%cs', '--', 'build'], {
					cwd: corpusDir,
					encoding: 'utf8',
					stdio: ['ignore', 'pipe', 'ignore']
				}).trim() !== '';
		} catch {
			// Not a git checkout at all — the fixtures never are.
			buildTracked = false;
		}
	}
	return buildTracked;
}

/**
 * Credit for the illustration collections, for the colophon — index tier,
 * because it is ~300 bytes and the page that prints it fetches nothing.
 *
 * Separate from the plate list itself, which is content tier: attribution has
 * to be available on a page that renders no plates, and the plate list has to
 * be absent from a page that renders no Bible.
 */
const platesCredit = {};

/**
 * What the colophon prints about one collection: the manifest's own credit
 * fields, plus what actually shipped.
 *
 * The counts are here rather than in the page's copy for the reason that
 * route's docblock already gives about its work counts — a hand-typed number
 * drifts from what the site serves, and this is the page whose whole job is
 * to be believable.
 */
function creditRecord(manifest, plates, chapters) {
	return {
		title: manifest.title,
		edition: manifest.edition,
		copyright: manifest.copyright,
		...manifest.credit,
		plates,
		chapters
	};
}

/**
 * The Doré plates: a credit line for the index tier, the anchored list for
 * the content tier, and the images as ordinary build assets.
 *
 * THE IMAGES GO THROUGH VITE RATHER THAN `static/`, and that decision buys
 * three behaviours the site already has rather than three it would have to
 * add. As content-hashed assets under `_app/immutable/` they are (1) already
 * negated in `wrangler.jsonc`'s `run_worker_first`, so a chapter with four
 * plates costs no Worker invocations and is outside the zone's rate limiting
 * rule; (2) already classified by `sw-policy.ts`'s `isDeferred`, which routes
 * any `.avif` under `/immutable/` that is not corpus content to the permanent
 * content cache — stored on first read, never precached, in no download wave,
 * which is exactly "enrichment, not part of the offline library"; and (3)
 * safely re-derivable, because a re-encoded plate gets a new hash and no
 * reader is left pinned to a stale immutable copy. In `static/` all three
 * would be the opposite by default, and the precache one is not a nuisance
 * but a 103 MB download at install.
 *
 * WHAT IS DROPPED IS THE RECONCILIATION. `plates.json` in the corpus keeps
 * every reading — caption, Wikipedia, index, which won, whether they agreed —
 * because that is the audit trail for an anchor decided by vote. The site
 * needs the answer and nothing else, so the content file is a sixth the size.
 */
/**
 * Whether `to` is already the copy of `from` that this sync would make.
 *
 * SIZE AND MTIME — `rsync --update`'s test, not a hash. Reading 103 MB to
 * decide whether to write 103 MB saves nothing, and a checksum would be
 * answering a question these files do not raise: they are derived output with
 * one writer (`derive_images` in `pipeline/scrapers/dore/dore.py`), which
 * stamps each with the moment it wrote it.
 *
 * THE DIRECTION IS THE WHOLE TEST, and it holds because `copyFileSync` does
 * NOT preserve mtime: a copy is always newer than the source it was made
 * from, and a re-derived source is newer than the copy that preceded it. What
 * this cannot see is a source rewritten backwards in time at an identical
 * byte count; nothing produces one, and the recovery is to delete
 * `site/src/lib/corpus-data/plates/`, which the next sync refills.
 */
function isCopyOf(from, to) {
	let dest;
	try {
		dest = statSync(to);
	} catch {
		return false;
	}
	const src = statSync(from);
	return dest.size === src.size && dest.mtimeMs >= src.mtimeMs;
}

function syncPlates(workId, workDir, manifest) {
	if (unpublishedIds.has(workId)) {
		platesCredit[workId] = creditRecord(manifest, 0, 0);
		console.warn(`[sync-corpus] ${workId}: DISABLED — plates withheld from the build`);
		return;
	}

	const source = readJson(path.join(workDir, 'plates.json'));
	const imagesDir = path.join(workDir, 'images');
	const sizesPath = path.join(imagesDir, 'sizes.json');
	// Written by `derive_images`, at the only moment the numbers are known.
	// Missing means the images were never derived, and a plate with no
	// intrinsic size would reserve no space in the column — so the whole
	// collection is withheld rather than shipped as a source of layout shift.
	if (!existsSync(sizesPath)) {
		console.warn(
			`[sync-corpus] ${workId}: no images/sizes.json — plates NOT synced. ` +
				`Run \`uv run --script pipeline/scrapers/dore/dore.py --derive\` to write it.`
		);
		return;
	}
	const sizes = readJson(sizesPath);

	const missing = [];
	const plates = [];
	for (const plate of source.plates) {
		const size = sizes[plate.plate_id]?.[String(PLATE_INTRINSIC_WIDTH)];
		if (!size) {
			missing.push(plate.plate_id);
			continue;
		}
		plates.push({
			id: plate.plate_id,
			osis: plate.osis,
			chapter: plate.chapter,
			// `null` for a plate anchored to a chapter rather than a verse. No
			// plate is, today — all 241 carry a verse — but the pipeline can
			// still produce one and the reader has to place it somewhere, so
			// the field stays rather than the shape being narrowed to today's
			// data.
			verse: plate.verse ?? null,
			title: plate.title,
			width: size[0],
			height: size[1]
		});
	}
	if (missing.length > 0) {
		console.warn(
			`[sync-corpus] ${workId}: ${missing.length} plate(s) have no derived image and were ` +
				`skipped: ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}`
		);
	}

	// Written HERE and not at the top of the function, because the counts the
	// colophon prints have to be the number of plates that actually reached
	// the build — not the number the corpus holds. A plate whose image failed
	// to derive is skipped above, and a credit claiming it would be the one
	// kind of error the colophon must not make.
	platesCredit[workId] = creditRecord(
		manifest,
		plates.length,
		new Set(plates.map((plate) => `${plate.osis} ${plate.chapter}`)).size
	);

	const relPath = `content/${workId}/plates.json`;
	writeJson(path.join(destDir, relPath), plates);
	contentManifest.push({ workId, kind: 'plates', relPath, bytes: byteLength(plates) });

	const wanted = new Set(
		plates.flatMap((plate) => PLATE_WIDTHS.map((w) => `${plate.id}-${w}.avif`))
	);
	mkdirSync(platesDest, { recursive: true });
	let present = 0;
	let written = 0;
	for (const name of readdirSync(imagesDir).sort()) {
		if (!wanted.has(name)) continue;
		present++;
		// Recorded whether or not it is copied: this is what the prune below
		// spares, and a file already correct is exactly as wanted as a fresh one.
		plateImages.add(name);
		const from = path.join(imagesDir, name);
		const to = path.join(platesDest, name);
		if (isCopyOf(from, to)) continue;
		copyFileSync(from, to);
		written++;
	}
	if (present !== wanted.size) {
		console.warn(
			`[sync-corpus] ${workId}: ${wanted.size - present} of ${wanted.size} plate image(s) ` +
				`missing from ${imagesDir}`
		);
	}
	console.log(
		`[sync-corpus] ${workId}: ${plates.length} plates, ${present} images ` +
			`(${written} copied, ${present - written} already current)`
	);
}

for (const workId of workIds) {
	const workDir = path.join(buildSrc, workId);
	const manifestPath = path.join(workDir, 'manifest.json');
	// No existence check here: `workIds` is already filtered to directories that
	// have a manifest, and the ones that don't were reported up there rather
	// than skipped in silence.
	const manifest = readJson(manifestPath);

	/*
	 * PLATES ARE APPARATUS, NOT A WORK, and this branch is what keeps them
	 * out of everything below.
	 *
	 * `dore.tours` is 241 engravings with no language, no addresses of its
	 * own and no text — it hangs off the Bible the way `xrefs` does, at a
	 * verse. It carries a manifest anyway, because that is the corpus's one
	 * record of who is owed credit for the scans and because a directory
	 * under `build/` without one is REPORTED as a work whose scrape did not
	 * finish (see the `manifestless` warning above). So the manifest is what
	 * makes it visible, and this branch is what stops it being mistaken for
	 * something a reader can open: it never enters `manifests`, so it is
	 * absent from the registry, the listings, the sitemap, the language
	 * coverage and the work counts the colophon prints — all of which would
	 * otherwise be one higher, describing a work with nothing to read.
	 */
	if (manifest.type === 'plates') {
		syncPlates(workId, workDir, manifest);
		continue;
	}

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
		// THE MASTHEAD IS NOT HERE, since 2026-09-02. `header` is the document's
		// own first page -- the kind, the title, the pontiff, the date, as
		// narrowed html -- so it is real content and not metadata, and across the
		// corpus's 1,450 works it was 240 KB, a fifth of this file. This file is
		// downloaded whole before the first paint, so every reader of a Bible
		// chapter, a Compendium question or a prayer paid for the mastheads of
		// 305 documents they had not opened.
		//
		// It rides the work's content-tier structure asset instead (the document
		// branch below), on exactly the rule already stated twice further down
		// this file, for the translated descriptions and for the subject tags:
		// the boot index answers "does this address exist", and a masthead
		// answers neither existence nor address. The outline it now travels with
		// has the same single consumer, the same lifetime and the same download
		// wave, which is why it needed no asset of its own.
		//
		// `undefined` rather than a destructure so the omission is greppable from
		// the shape itself; `JSON.stringify` drops the key on the way out.
		header: undefined,
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
		// An edition may store the numbering its SOURCE printed rather than the
		// corpus's. `bible.crampon.fr` is the first: Crampon numbers the
		// Psalter the Hebrew way and says so in his own footnote, and the
		// scraper stores what the page says because `raw/` is the record of
		// what the source said. Converting there was not an option — the
		// mappers for the three wholesale-divergent books are an ALGORITHM and
		// live only in `versification.ts`, and `common/versification.py`
		// refuses those books outright rather than growing a second copy (see
		// its docstring, and the twin it records deleting).
		//
		// So the conversion happens HERE, which is the first point downstream
		// of the corpus that can import the real mapper. Everything below this
		// line — both tiers, the routes, the xref index — then sees one address
		// space, which is what every consumer already assumes.
		const storedHebrew = manifest.psalm_numbering === 'hebrew';
		for (const entry of readdirSync(booksDir).sort()) {
			if (!entry.endsWith('.json')) continue;
			const book = readJson(path.join(booksDir, entry));
			if (storedHebrew && isDivergentBook(book.osis)) {
				book.chapters = toVulgateChapters(book.osis, book.chapters, workId);
			}
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
			// Chapter text, packed by SIZE (see `BIBLE_CHAPTER_CHUNK_TARGET_BYTES`).
			// The chunk is the bare `Chapter[]` for its range, not a trimmed
			// copy of the book object: `osis`/`name`/`abbrevs`/`order` are all
			// in the index tier above, already in hand at every call site, and
			// repeating them in each of a book's chunks would be the only
			// thing in this tier that isn't reading text.
			const ordered = [...book.chapters].sort((a, b) => a.n - b.n);
			const emit = (chunk) => {
				if (chunk.length === 0) return;
				// Named by the chapters it actually holds, so the range in the
				// filename is the range in the file — which is what lets the
				// reader's lookup be bounded rather than a nearest guess.
				const start = chunk[0].n;
				const end = chunk[chunk.length - 1].n;
				const chunkName = `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}`;
				const relPath = `content/${workId}/books/${book.osis}/${chunkName}.json`;
				writeJson(path.join(destDir, relPath), chunk);
				contentManifest.push({
					workId,
					kind: 'bible-chapters',
					relPath,
					bytes: byteLength(chunk)
				});
			};
			let pack = [];
			let packBytes = 0;
			for (const chapter of ordered) {
				const size = byteLength(chapter);
				// A chapter always goes somewhere: an oversized one becomes a
				// chunk of its own rather than being dropped or split, and the
				// ceiling check at the end of the run is what reports it.
				if (pack.length > 0 && packBytes + size > BIBLE_CHAPTER_CHUNK_TARGET_BYTES) {
					emit(pack);
					pack = [];
					packBytes = 0;
				}
				pack.push(chapter);
				packBytes += size;
			}
			emit(pack);
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

	// A commentary ON another work (docs/corpus-schema.md §Commentary:
	// `commentary.{slug}.{lang}`). Branches on `manifest.type`, like the two
	// above and for the same reason.
	//
	// IT CALLS `mark()` NOWHERE, AND THAT IS THE WHOLE SHAPE OF THE TYPE. Its
	// units address the work named in `annotates` and have no address of
	// their own: a Haydock note is reachable at the verse it comments on and
	// nowhere else, so it contributes no route, no sitemap entry and nothing
	// to `route-titles.json`. `bible-intro` above is the near precedent and
	// stops one step short -- an introduction is chapter 0, which IS an
	// address. Marking a commentary's verses would be the reverse of the
	// chapter-0 mistake that section warns about: it would publish ~24,000
	// addresses that render nothing of their own.
	if (manifest.type === 'commentary') {
		const booksDir = path.join(workDir, 'books');
		const books = [];
		for (const file of readdirSync(booksDir).sort()) {
			if (!file.endsWith('.json')) continue;
			const book = readJson(path.join(booksDir, file));
			const ordered = [...book.chapters].sort((a, b) => a.n - b.n);
			books.push({
				osis: book.osis,
				order: book.order,
				chapters: ordered.map((c) => c.n)
			});

			// Packed by SIZE on exactly `BIBLE_CHAPTER_CHUNK_TARGET_BYTES` and
			// into the same path shape, so `bibleChapterLocations` in
			// `corpus-index.ts` reads both with one regex and one lookup. The
			// packing matters MORE here than it does for an edition: a
			// commentary's weight per chapter varies by an order of magnitude
			// (Apocalypse 20 is one 14 KB note; Psalm 118 is 144 of them),
			// which is precisely the case a fixed stride cannot serve and the
			// reason the stride became a size in the first place.
			const emit = (chunk) => {
				if (chunk.length === 0) return;
				const start = chunk[0].n;
				const end = chunk[chunk.length - 1].n;
				const chunkName = `${String(start).padStart(4, '0')}-${String(end).padStart(4, '0')}`;
				const relPath = `content/${workId}/books/${book.osis}/${chunkName}.json`;
				writeJson(path.join(destDir, relPath), chunk);
				contentManifest.push({
					workId,
					kind: 'commentary-chapters',
					relPath,
					bytes: byteLength(chunk)
				});
			};
			let pack = [];
			let packBytes = 0;
			for (const chapter of ordered) {
				const size = byteLength(chapter);
				if (pack.length > 0 && packBytes + size > BIBLE_CHAPTER_CHUNK_TARGET_BYTES) {
					emit(pack);
					pack = [];
					packBytes = 0;
				}
				pack.push(chapter);
				packBytes += size;
			}
			emit(pack);
		}
		books.sort((a, b) => a.order - b.order);
		if (!manifest.annotates) {
			console.error(
				`[sync-corpus] ${workId}: a commentary must name the work it \`annotates\`; ` +
					'without it every note addresses nothing'
			);
			process.exit(1);
		}
		commentaryIndex[workId] = { annotates: manifest.annotates, books };
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
	/**
	 * A prayer's opening words -- its first printed line.
	 *
	 * A PRAYER IS KNOWN BY ITS INCIPIT AND NOT BY ITS TITLE. Nobody looks for
	 * "The Hail Mary"; they look for "Hail, Mary, full of grace". `/preces` lists
	 * twenty-eight titles and, until this existed, gave a reader nothing to
	 * recognize them by.
	 *
	 * THE ROSARY IS THE EXCEPTION AND IT HAS TO BE, because a `group` prayer's
	 * `blocks[0]` is not its opening at all -- the corpus stores the Rosary's
	 * CONCLUDING prayer there, under the heading "Prayer concluding the Rosary",
	 * with the twenty mysteries in `groups` and the opening words in
	 * `instructions`. Deriving blindly prints that heading as the Rosary's first
	 * words, which is not merely useless but wrong. It gets no incipit instead:
	 * the one prayer on the page whose title everybody already knows.
	 *
	 * Taken from the FIRST PRINTED LINE (`html`, split on `<br>`) rather than the
	 * whole block, because the block is the whole prayer and the line is the
	 * opening. Capped so the eagerly-inlined index tier does not carry a stanza
	 * per prayer per language; the page clamps what is left.
	 */
	const INCIPIT_MAX = 120;

	function incipitOf(prayer) {
		if (prayer.kind === 'group') return undefined;
		const block = prayer.blocks && prayer.blocks[0];
		if (!block) return undefined;
		const first = String(block.html || block.text || '')
			.split(/<br\s*\/?>/i)[0]
			.replace(/<[^>]+>/g, '')
			.replace(/\s+/g, ' ')
			.trim();
		if (!first) return undefined;
		if (first.length <= INCIPIT_MAX) return first;
		const cut = first.slice(0, INCIPIT_MAX);
		const space = cut.lastIndexOf(' ');
		return `${(space > 40 ? cut.slice(0, space) : cut).trimEnd()}…`;
	}

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
				hasGroups: Boolean(p.groups && p.groups.length > 0),
				incipit: incipitOf(p)
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
			// `{ header, nodes }` since 2026-09-02, where it was a bare array. The
			// masthead joined the outline here rather than taking an asset of its
			// own because the two are the same fact about one document -- what its
			// first page prints and how the rest of it is divided -- wanted by the
			// same page, at the same moment, in the same download wave. A second
			// file would have doubled the requests a document page makes to save
			// nothing. `header` is omitted rather than written null for the works
			// whose source page prints no masthead, which is most of them.
			const frontMatter = {
				...(manifest.header ? { header: manifest.header } : {}),
				nodes: structure
			};
			writeJson(path.join(destDir, relPath), frontMatter);
			contentManifest.push({
				workId,
				kind: 'document-structure',
				relPath,
				bytes: byteLength(frontMatter)
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

/*
 * The other half of sparing `plates/` from the wipe, and what makes sparing it
 * safe rather than merely fast: anything in there that no collection asked for
 * on THIS run is removed now. A plate withdrawn from the corpus, a collection
 * disabled in `unpublished.json`, a width dropped from `PLATE_WIDTHS` — each
 * leaves the build exactly as it would have under a wipe, because the wanted
 * set was rebuilt from the corpus either way.
 *
 * Nothing but wanted images is ever copied in (`sizes.json` stays behind in
 * the corpus), so a name here that no collection claims is a leftover by
 * definition — there is no third category to be careful of.
 */
if (existsSync(platesDest)) {
	let stale = 0;
	for (const name of readdirSync(platesDest)) {
		if (plateImages.has(name)) continue;
		rmSync(path.join(platesDest, name), { recursive: true, force: true });
		stale++;
	}
	// No collection at all: the directory itself goes, rather than being left
	// as an empty one for the content glob to find.
	if (plateImages.size === 0) rmSync(platesDest, { recursive: true, force: true });
	if (stale > 0) console.log(`[sync-corpus] plates: removed ${stale} image(s) nothing wants`);
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
/** Content kinds the ceiling does not apply to, and why — not an escape
 *  hatch, a scope statement. The ceiling's premise is that a reader pays for
 *  a whole file to read ONE UNIT of it, so it only means anything where the
 *  file holds several addressable units. A document's appendix holds none: it
 *  is where an edition that prints no paragraph numbers keeps its whole text
 *  (docs/corpus-schema.md, "unnumbered content"), so it has no citable
 *  address, nothing links into the middle of it, and the page that shows it
 *  shows all of it. The whole file IS the unit. This stopped being
 *  theoretical on 2026-08-29, when the magisterial documents were taken in
 *  ten languages and 328 of the new editions turned out to be unnumbered:
 *  `vatii.gaudium-et-spes.ar` keeps its 118 entries in a 313 KB appendix,
 *  which is simply how long that document is in Arabic. */
const CEILING_EXEMPT_KINDS = new Set(['document-appendix']);

const oversized = contentManifest
	.filter(
		(entry) => entry.bytes > CONTENT_FILE_CEILING_BYTES && !CEILING_EXEMPT_KINDS.has(entry.kind)
	)
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
 * Subject tags for the magisterial documents — see `site/document-tags.json`
 * for the format, for why they are curated here rather than in the corpus, and
 * for why the vocabulary is open.
 *
 * ONE FILE, KEYED BY SLUG, FETCHED BY `/documenta` AND BY NOTHING ELSE. It is
 * ~20 KB, which is small enough that eager-inlining it into `manifests.json`
 * would have been defensible on size — and wrong on the rule `corpus-index.ts`
 * states: the boot index answers "does this address exist", and a tag answers
 * neither existence nor address. One page wants it, so it is fetched by that
 * page, exactly like the translated descriptions written above.
 *
 * NOT ON THE MANIFEST, which is the other thing that would have worked. A tag
 * belongs to the DOCUMENT and a manifest belongs to an edition, so merging it
 * in would write the same five strings into all ten editions of Laudato Si'
 * and into the index every reader downloads before the first paint.
 *
 * FOUR HARD FAILURES, none of them cosmetic:
 *
 *   - A tag outside `vocabulary`. THE LIST IS CLOSED (2026-08-31): 53 terms,
 *     cut down from an open 232 whose head did not partition anything and
 *     whose tail was one document apiece. An unlisted term is either a typo or
 *     a synonym of a listed one, and a synonym splits a term's documents in
 *     two with neither half findable. Widening the facet is a deliberate act —
 *     add the term to `vocabulary` in the same commit and say why.
 *   - A slug naming no document in this build. That is the residue of a
 *     renamed work, and the tags filed against the old name are lost the
 *     moment it is renamed — silently, because a filter that offers one fewer
 *     term looks exactly like a corpus that has one fewer document. Unlike
 *     `descriptions.json`, whose missing file is merely cosmetic, this one is
 *     checked because its failure is invisible on the page.
 *   - Two terms in `vocabulary` differing only in case. The panel matches
 *     case-insensitively, so `Labour` and `labour` are one facet with two
 *     labels, and which label a reader sees depends on which sorted first.
 *   - A tag that is empty or padded. Both make a facet nobody can name.
 *
 * A vocabulary term NO document carries is only a warning. It is the ordinary
 * state while a term is being introduced, and an empty facet row is visible on
 * the page in a way a missing one is not.
 *
 * A missing FILE is not an error, on the same terms as the descriptions: a
 * corpus nobody has tagged yet is a perfectly good corpus, and `/documenta`
 * renders its author and type facets and simply offers no tag facet.
 */
const documentTagsPath = path.join(siteRoot, 'document-tags.json');
const documentTagsFile = existsSync(documentTagsPath) ? readJson(documentTagsPath) : {};
const documentTags = documentTagsFile.tags ?? {};
const tagVocabulary = documentTagsFile.vocabulary ?? [];
{
	const known = new Set(
		Object.values(manifests)
			.filter((manifest) => manifest.type === 'document')
			.map((manifest) => manifest.id.split('.')[1])
	);
	const unknown = Object.keys(documentTags).filter((slug) => !known.has(slug));
	const byLower = new Map();
	const malformed = [];
	for (const term of tagVocabulary) {
		if (typeof term !== 'string' || term === '' || term !== term.trim()) {
			malformed.push(`vocabulary: ${JSON.stringify(term)}`);
			continue;
		}
		const key = term.toLowerCase();
		if (!byLower.has(key)) byLower.set(key, new Set());
		byLower.get(key).add(term);
	}
	const allowed = new Set(tagVocabulary);
	const offVocabulary = [];
	const used = new Set();
	for (const [slug, tags] of Object.entries(documentTags)) {
		for (const tag of tags) {
			if (typeof tag !== 'string' || tag === '' || tag !== tag.trim()) {
				malformed.push(`${slug}: ${JSON.stringify(tag)}`);
				continue;
			}
			if (allowed.has(tag)) used.add(tag);
			else offVocabulary.push(`${slug}: ${JSON.stringify(tag)}`);
		}
	}
	const unusedTerms = tagVocabulary.filter((term) => !used.has(term));
	if (unusedTerms.length > 0) {
		console.warn(
			`[sync-corpus] document-tags.json: ${unusedTerms.length} vocabulary term(s) on no ` +
				`document: ${unusedTerms.join(', ')}`
		);
	}
	const collisions = [...byLower.values()].filter((forms) => forms.size > 1);
	const problems = [
		offVocabulary.length
			? `${offVocabulary.length} tag(s) outside the vocabulary: ${offVocabulary.join('; ')}`
			: '',
		unknown.length ? `${unknown.length} slug(s) naming no document: ${unknown.join(', ')}` : '',
		collisions.length
			? `${collisions.length} vocabulary term(s) differing only in case: ${collisions.map((forms) => [...forms].join(' / ')).join('; ')}`
			: '',
		malformed.length ? `${malformed.length} malformed tag(s): ${malformed.join('; ')}` : ''
	].filter(Boolean);
	if (problems.length > 0) {
		console.error(`[sync-corpus] document-tags.json is inconsistent with this build:`);
		for (const problem of problems) console.error(`  - ${problem}`);
		process.exit(1);
	}
	if (Object.keys(documentTags).length > 0) {
		writeJson(path.join(indexDir, 'document-tags.json'), documentTags);
	}
}
const taggedDocuments = Object.keys(documentTags).length;
const distinctTags = tagVocabulary.length;

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
/** The works the site actually registers — `workIds` minus the apparatus
 *  directories that `syncPlates` and its like handle instead. */
const registeredWorkIds = Object.keys(manifests).sort();

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
	path.join(indexDir, 'commentary-index.json'),
	mapValues(commentaryIndex, (work) => ({
		...work,
		books: work.books.map((book) => ({ ...book, chapters: compactRun(book.chapters) }))
	}))
);
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
writeJson(path.join(indexDir, 'plates-credit.json'), platesCredit);
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
	// `manifests`, NOT `workIds`. Every directory under `build/` with a
	// manifest is in `workIds`, and since 2026-08-28 one of them
	// (`dore.tours`) is apparatus rather than a work — it never enters the
	// registry, has no addresses, and would inflate every count that quotes
	// this number, `preflight-deploy.mjs`'s corpus-size floor included.
	workCount: registeredWorkIds.length,
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
	// exists in English only, and `/doctores/summa/suppl/77` is a real address on that
	// basis alone.
	summa: Object.fromEntries(
		Object.entries(summaAddresses)
			.map(([slug, numbers]) => [slug, [...numbers].sort((a, b) => a - b)])
			.sort(([a], [b]) => a.localeCompare(b))
	)
};

writeJson(routeManifestPath, routeManifest);

const routeTitles = buildRouteTitles({
	manifests,
	bibleIndex,
	cccIndex,
	compendiumIndex,
	summaIndex,
	prayerIndex,
	// The interface's own strings, for the seven chrome pages that take a
	// language prefix. Read from the dictionaries so the head a searcher
	// matches on is the sentence the page shows them — see CHROME_KEYS.
	dictionaries: await readDictionaries()
});
// Checked here rather than trusted, on the same terms as `assertCanonical`:
// nothing a reader can see goes wrong when an address loses its name, because
// the page titles itself at hydration. Only the consumers that never render
// see it, and none of them reports back.
assertNamed(sitemapPaths(routeManifest), routeManifest, routeTitles);
writeJson(routeTitlesPath, routeTitles);

// The descriptions and the cross-reference apparatus: the two things on this
// site that are ours rather than reproduced, in the form the edge can serve
// them and in the form a machine can read them. Built from the indexes above
// rather than re-derived, so neither file can describe a corpus this build did
// not produce.
const apparatus = buildApparatus({
	manifests,
	descriptions,
	xrefs,
	documentXrefs,
	cccCompendium: condensation.map,
	cccCitations: citationXrefs.ccc
});
const works = buildWorks({ manifests, descriptions, origin: ORIGIN });
assertApparatus(apparatus, works);
writeJson(apparatusPath, apparatus);
writeJson(worksPath, works);
console.log(
	`[sync-corpus] apparatus: ${Object.keys(apparatus.descriptions).length} document description(s), ` +
		`${Object.keys(apparatus.bible).length} Bible chapters and ${Object.keys(apparatus.ccc).length} ` +
		`Catechism paragraphs with an apparatus (${(byteLength(apparatus) / 1024).toFixed(0)} KB); ` +
		`works.json lists ${works.works.length} work(s) (${(byteLength(works) / 1024).toFixed(0)} KB)`
);

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
	/*
	 * WITHDRAWAL NEEDS ITS OWN CEILING, and it is measured against what the
	 * ledger HELD rather than against what this run found — because the run
	 * this catches is the one that found nothing.
	 *
	 * The `changed` ceiling below cannot see it. A sync over a corpus that
	 * yields zero works reports total 0, added 0, changed 0 and removed 5,804:
	 * `known` is zero, `share` is zero, the check passes, and the ledger is
	 * written empty. The NEXT ordinary sync then finds 5,804 addresses it has
	 * never seen and stamps every one with today's date — which passes too,
	 * since they are all `added`. Two clean runs, no error, and the site's
	 * whole sitemap now claims the corpus changed today.
	 *
	 * It is not hypothetical: it happened on 2026-08-28, to a `CORPUS_DIR`
	 * pointed at a directory of symlinks (which `readdirSync` does not count as
	 * directories, so the work list came back empty). The only trace was a
	 * 5,800-line diff in a tracked file that looks exactly like a regeneration.
	 *
	 * Seeding is still free: an absent or unreadable ledger holds nothing, so
	 * `held` is zero and a first run adds everything without tripping this.
	 */
	const held = Object.keys(previousLedger).length;
	const lost = held === 0 ? 0 : removed / held;
	const ceiling = `${(CHANGE_CEILING * 100).toFixed(0)}%`;
	const refusals = [];
	if (share > CHANGE_CEILING) {
		refusals.push(`${changed} of ${known} known addresses changed (${(share * 100).toFixed(1)}%)`);
	}
	if (lost > CHANGE_CEILING) {
		refusals.push(`${removed} of ${held} ledger addresses withdrew (${(lost * 100).toFixed(1)}%)`);
	}
	if (refusals.length > 0 && !process.argv.includes('--accept-lastmod')) {
		// Not a warning. A sitemap that claims a quarter of the corpus changed
		// at once is how a crawler learns to stop believing the file, and the
		// realistic cause is a change to what `mark()` covers — or a corpus that
		// did not load — rather than to the text. Re-run with --accept-lastmod
		// once that is what you meant.
		console.error(
			`lastmod: ${refusals.join('; ')} — ceiling ${ceiling}. ` +
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
	'commentary-index.json',
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
	`[sync-corpus] Built corpus-data/ from ${buildSrc}: ${registeredWorkIds.length} work(s), ` +
		`${contentManifest.length} content file(s)${xrefsSynced ? `, plus ${xrefs.length} CCC and ${documentXrefs.length} document xref entries` : ''}. ` +
		`Index tier: ${(indexBytes / 1000).toFixed(0)} KB raw. ` +
		`Descriptions: ${describedWorks} read, ${translatedCount} translated across ` +
		`${Object.keys(translatedDescriptions).length} language file(s). ` +
		`Tags: ${taggedDocuments} document(s), ${distinctTags} distinct term(s). ` +
		`Works: ${registeredWorkIds.join(', ')}`
);

/*
 * RECORDED HERE AND NOWHERE EARLIER, because reaching this line is the whole
 * claim: every gate above exits nonzero rather than returning, so a fingerprint
 * written at the top would be a record that a broken run had succeeded, and the
 * next `--changed-only` would skip over it. `rebuild.py` records a stage only
 * when it exits 0 for the same reason.
 *
 * `outputs` is RE-READ rather than carried down from the check above: this run
 * has rewritten every one of those files since, and the state has to describe
 * what is on disk now, not what was there before.
 *
 * WRITTEN BY EVERY RUN THAT GETS HERE, not only by `--changed-only` ones. What
 * the record claims is "these inputs derived this output successfully", which
 * is as true of a plain `npm run sync-corpus` as of a flagged one -- and gating
 * it would mean `prebuild` taught the next `npm run dev` nothing, leaving it to
 * re-derive a corpus the build had just finished deriving. The early exit for a
 * missing corpus returns above this line, so a fixture-fallback run records
 * nothing.
 */
saveState(statePath, syncFingerprint());
