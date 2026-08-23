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
 *   `corpus-data/content/**` — the actual reading text: Bible books split
 *   one-file-per-book (73/edition, matching the print volume's own
 *   granularity), CCC paragraphs split into fixed 100-paragraph chunks (29
 *   chunks/language — shipping the 3.5 MB/language `paragraphs.json` whole
 *   would put a >500 KB gzipped file behind a single `¶1` visit), the
 *   Compendium kept whole per language (only ~90 KB gzipped total, no split
 *   needed), documents (docs/corpus-schema.md §Documents) split into fixed
 *   section chunks the same way — see `DOCUMENT_CHUNK_SIZE` — and prayers
 *   (docs/corpus-schema.md §Prayers) kept whole per language too, same as
 *   the Compendium and for the same reason: `prayers.json` measures ~40 KB
 *   RAW per language in the real corpus, smaller by an order of magnitude
 *   than the Compendium's already-established no-split threshold, so there
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
 * Configurable via the `CORPUS_DIR` env var (default: `../corpus`,
 * resolved relative to this `site/` package). If no corpus is found, this
 * is a no-op (with a warning): `corpus.ts` falls back to its fixtures, so
 * the site still builds.
 */

import { existsSync, rmSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
	buildCccBibleXrefs,
	buildDocumentBibleXrefs,
	checkXrefsAgainstCorpus
} from './build-xrefs.mjs';

const siteRoot = path.resolve(fileURLToPath(import.meta.url), '../..');
const corpusDir = path.resolve(siteRoot, process.env.CORPUS_DIR ?? '../corpus');
const destDir = path.join(siteRoot, 'src/lib/corpus-data');
const indexDir = path.join(destDir, 'index');
const contentDir = path.join(destDir, 'content');
// Public but address-only: the Cloudflare edge worker reads this before it
// serves the SPA shell, so an existing citation receives 200 while a typo
// remains a real 404. It is generated alongside corpus-data, never edited.
const routeManifestPath = path.join(siteRoot, 'static/corpus-routes.json');

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
 *  2026-08-21 (docs/decisions.md), which is most of the gap; nobody re-measured
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
 * A document's sections with the two DERIVABLE copies of the prose removed:
 * each block's `text_marked` and each section's `text`.
 *
 * KEEP THE CORPUS FAT, SHIP THIN. `corpus/works/` stores the same prose three
 * times — `html`, `text_marked` and `text` are 33%/32%/32% of a document's
 * payload, 97% between them — and that redundancy is load-bearing where it
 * lives: `html_to_text(html) == text_marked` is the round-trip oracle the
 * scraper checks over all ~14,900 sections on every run, and an oracle whose
 * expected value is derived from the thing under test checks nothing. The
 * SITE runs no such check, so shipping the copies buys it nothing: `html` is
 * a strict superset, and `inlineHtml.inlineText()` is the same derivation in
 * TypeScript.
 *
 * Worth doing even though brotli already collapses most of the duplication
 * (a whole file goes 827 → 292 KB raw but only 95 → 84 KB compressed, ~12%):
 * the win is on the client, where it is the raw bytes that are parsed and
 * held — roughly a third of the `JSON.parse` cost and of the retained heap
 * per open document, on a payload the memoizing content tier keeps for the
 * session.
 *
 * Returns a COPY. The caller's array is still referenced by
 * `documentEditions` for the Scripture cross-reference pass, which reads
 * `block.text_marked` (`build-xrefs.mjs`).
 */
function thinDocumentSections(workId, sections) {
	return sections.map((section) => {
		const blocks = section.blocks.map((block) => {
			// `html` is what the reader is derived FROM, so a block without it
			// would lose its words entirely rather than degrade. Every one of
			// the corpus's document blocks has it; this fails the build rather
			// than trusting that to stay true, because the failure it guards
			// against is silent and only visible as missing text on a page.
			if (!block.html) {
				throw new Error(
					`sync-corpus: ${workId} has a block with no \`html\`; refusing to drop ` +
						`\`text_marked\`, which is the only other copy of its text. ` +
						`(text_marked: ${JSON.stringify((block.text_marked ?? '').slice(0, 80))})`
				);
			}
			const { text_marked: _dropped, ...rest } = block;
			return rest;
		});
		const { text: _alsoDropped, ...restOfSection } = section;
		return { ...restOfSection, blocks };
	});
}

rmSync(destDir, { recursive: true, force: true });

const worksSrc = path.join(corpusDir, 'works');

if (!existsSync(worksSrc)) {
	// A fixture build must never inherit a real corpus's route manifest from a
	// previous build. Without this, preflight would see a plausible work count
	// beside fixture client assets and could approve exactly the deploy it is
	// meant to stop. This is generated site output, never corpus/raw.
	rmSync(routeManifestPath, { force: true });
	console.warn(
		`[sync-corpus] No corpus found at ${worksSrc} -- corpus.ts will fall back to its bundled ` +
			`fixtures. Set CORPUS_DIR to point at a real corpus/ checkout to build with real data.`
	);
	process.exit(0);
}

/*
 * A work IS its manifest: `corpus/works/<id>/manifest.json` is what every
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
const workDirs = readdirSync(worksSrc, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.filter((name) => !name.startsWith('.'))
	.sort();

const manifestless = workDirs.filter(
	(name) => !existsSync(path.join(worksSrc, name, 'manifest.json'))
);
if (manifestless.length > 0) {
	console.warn(
		`[sync-corpus] WARNING: ${manifestless.length} director(ies) under ${worksSrc} have no ` +
			`manifest.json and were NOT built: ${manifestless.join(', ')}. A work without a manifest ` +
			`is invisible to the site — if any of these is a real work, its scrape did not finish.`
	);
}

const workIds = workDirs.filter((name) => !manifestless.includes(name));

/**
 * Works taken down — see `site/unpublished.json`, which documents the
 * mechanism and the reasoning.
 *
 * Read here, at the point where content is written, because that is what
 * makes a takedown real: an unpublished work's TEXT is never written into
 * `corpus-data/content/` at all, so it is absent from the server rather
 * than hidden by the client. Its manifest still goes into the index, which
 * is what lets the reading routes render an honest link-out instead of a
 * 404 (see `unpublished.json` for why the pages are kept).
 *
 * A missing or malformed file is a hard error rather than an empty default.
 * Every other input here degrades quietly when absent, and that is right for
 * a corpus that may be partially built — but silently publishing a work
 * somebody asked us to take down is the one failure this script must never
 * produce.
 */
const unpublishedPath = path.join(siteRoot, 'unpublished.json');
const unpublishedWorks = readJson(unpublishedPath).works ?? {};
const unpublishedIds = new Set(Object.keys(unpublishedWorks));

/**
 * Editorial descriptions — see `site/descriptions.json` for the format and
 * for why they are curated here instead of in the corpus.
 *
 * The short version: `corpus/works/*​/manifest.json` is generated output, and
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

const manifests = {}; // workId -> manifest.json, verbatim (every work type, incl. future document families)
const bibleIndex = {}; // workId -> { books: BibleBookMeta[] }
const cccIndex = {}; // lang -> { structure, abbreviations, paragraphNumbers }
const cccEditions = []; // [{ lang, paragraphs }] -- input to the xref pass
const documentEditions = []; // [{ slug, lang, sections }] -- ditto, per document edition
const compendiumIndex = {}; // lang -> { structure }
const compendiumQuestionNumbers = []; // canonical URL existence, across languages
const documentIndex = {}; // workId -> { structure, sectionNumbers } -- keyed by WORK ID, not lang: unlike
// the CCC/Compendium (one canonical work per language), each document work id
// (`{family}.{slug}.{lang}`) is its own independent work with its own section
// count and its own structure tree -- there is no single "the document tree
// for English" the way there's a single CCC tree for English.
const prayerIndex = {}; // lang -> { structure, prayers } -- keyed by bare LANG, matching the Compendium
// (one canonical work per language), per the task brief's own instruction to
// follow that shape rather than the Documents one above: today there is
// exactly one prayer collection (`prayer.common.{lang}`), so `workId.split('.').pop()`
// safely recovers the language. `prayers` here is a COMPACT per-prayer summary
// (slug/n/title/kind/hasLatin/hasVariants/hasGroups) -- existence metadata for
// `entries()`/list pages/adjacency, never `blocks`/`latin` text, mirroring
// `bible-index.json`'s "numbers, never verse text" rule one type over.
/** [{ workId, kind, relPath, bytes }] — relPath matches the key `corpus.ts`
 *  derives from Vite's glob path (see `contentKeyFromGlobPath`), so the two
 *  can be joined at runtime without a second copy of the byte counts. */
const contentManifest = [];

for (const workId of workIds) {
	const workDir = path.join(worksSrc, workId);
	const manifestPath = path.join(workDir, 'manifest.json');
	// No existence check here: `workIds` is already filtered to directories that
	// have a manifest, and the ones that don't were reported up there rather
	// than skipped in silence.
	const manifest = readJson(manifestPath);
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
	manifests[workId] = {
		...manifest,
		notes: '',
		description: descriptions[workId] ?? manifest.description ?? null
	};

	// The takedown. Everything above this line still happens — the manifest
	// goes into the index, so the work keeps its title, its rights holder's
	// notice and its source URL, and its reading pages can render an honest
	// link-out. Everything BELOW writes reading text, and for an unpublished
	// work none of it runs: no content file is produced, so the text is not
	// on the server at all rather than merely unreachable from the UI.
	//
	// Structure trees are skipped with the text. A table of contents is a
	// map of a work's internal divisions, which is less than the text but
	// more than nothing, and a takedown request is not an invitation to
	// negotiate over how much we keep.
	if (unpublishedIds.has(workId)) {
		console.warn(`[sync-corpus] ${workId}: UNPUBLISHED — content withheld from the build`);
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
			const relPath = `content/${workId}/books/${book.osis}.json`;
			writeJson(path.join(destDir, relPath), book);
			contentManifest.push({ workId, kind: 'bible-book', relPath, bytes: byteLength(book) });
		}
		books.sort((a, b) => a.order - b.order);
		bibleIndex[workId] = { books };
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
		// the two editions' Scripture references are unioned per paragraph
		// (see build-xrefs.mjs). Not read from the chunks written just below:
		// those are already filtered by `unpublished`, and taking a work down
		// should not silently rewrite what the Catechism is recorded as
		// citing.
		cccEditions.push({ lang, paragraphs });

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
		compendiumIndex[lang] = { structure };

		const questions = readJson(path.join(workDir, 'questions.json'));
		compendiumQuestionNumbers.push(...questions.map((question) => question.n));
		const relPath = `content/${workId}/questions.json`;
		writeJson(path.join(destDir, relPath), questions);
		contentManifest.push({
			workId,
			kind: 'compendium-questions',
			relPath,
			bytes: byteLength(questions)
		});
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
				hasVariants: Boolean(p.variants && p.variants.length > 0),
				hasGroups: Boolean(p.groups && p.groups.length > 0)
			}))
		};

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
	// encyclical/apost-exhort/apost-const/cdf later per the schema), but
	// every one of them is `type: "document"` and shares one content shape,
	// so there's exactly one branch to maintain as more families land.
	if (manifest.type === 'document') {
		const structure = readJson(path.join(workDir, 'structure.json'));
		const sections = readJson(path.join(workDir, 'sections.json'));
		// Section EXISTENCE only, mirroring `cccParagraphNumbers` — the index
		// tier never carries section TEXT, so `documentSectionExists`/
		// adjacency in corpus.ts stay synchronous.
		documentIndex[workId] = {
			structure,
			sectionNumbers: sections.map((s) => s.n).sort((a, b) => a - b)
		};
		// Held for the xref pass, keyed by SLUG: the two language editions of
		// one document are unioned into a single entry, the same way the two
		// Catechism editions are, because they are one document citing one
		// verse. `{family}.{slug}.{lang}` -> slug, lang.
		const [, slug, docLang] = workId.split('.');
		documentEditions.push({ slug, lang: docLang, sections });

		// SHIPPED THIN, and chunked. `thinDocumentSections` drops the two
		// derivable copies of the prose; the loop below splits what's left the
		// way the CCC is split. Both are done on a COPY: `documentEditions`
		// above still holds the fat array, and `build-xrefs.mjs` reads
		// `block.text_marked` out of it — stripping in place would silently
		// empty the Scripture cross-reference table.
		const thin = thinDocumentSections(workId, sections);
		// From the already-sorted index above rather than from `thin`'s last
		// element: nothing guarantees `sections.json` is written in `n` order,
		// and a single out-of-order row would silently truncate the last chunk.
		const sorted = documentIndex[workId].sectionNumbers;
		const maxN = sorted.length ? sorted[sorted.length - 1] : 0;
		for (let start = 1; start <= maxN; start += DOCUMENT_CHUNK_SIZE) {
			const end = start + DOCUMENT_CHUNK_SIZE - 1;
			const chunk = thin.filter((s) => s.n >= start && s.n <= end);
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

writeJson(path.join(indexDir, 'manifests.json'), manifests);
writeJson(path.join(indexDir, 'bible-index.json'), bibleIndex);
writeJson(path.join(indexDir, 'ccc-index.json'), cccIndex);
writeJson(path.join(indexDir, 'compendium-index.json'), compendiumIndex);
writeJson(path.join(indexDir, 'document-index.json'), documentIndex);
writeJson(path.join(indexDir, 'prayer-index.json'), prayerIndex);

/**
 * CCC -> Bible cross-references, DERIVED here rather than read from the
 * corpus. `corpus/xrefs/ccc-bible.json` used to be a committed file built by
 * a separate Python parser; it is now computed from `corpus/works/` on every
 * build by the site's own citation grammar. See `build-xrefs.mjs` for why,
 * and docs/decisions.md (2026-08-21).
 */
const xrefs = buildCccBibleXrefs(cccEditions);
writeJson(path.join(indexDir, 'xrefs.json'), xrefs);
const documentXrefs = buildDocumentBibleXrefs(documentEditions);
writeJson(path.join(indexDir, 'document-xrefs.json'), documentXrefs);
const xrefsSynced = xrefs.length > 0;

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

writeJson(path.join(indexDir, 'content-manifest.json'), contentManifest);

/** Whole-reading routes are addressed by their unit's first number. Keep
 * these kind sets in sync with the corresponding corpus helpers: the edge
 * may only bless canonical addresses the client reader can actually resolve.
 */
const CCC_CHAPTER_KINDS = new Set(['chapter', 'prologue', 'section', 'part']);
const COMPENDIUM_CHAPTER_KINDS = new Set(['chapter', 'section', 'part']);

function chapterStarts(nodes, kinds) {
	const starts = [];
	function walk(items) {
		for (const node of items) {
			const [from, to] = node.paragraphs ?? [];
			if (kinds.has(node.kind) && Number.isFinite(from) && Number.isFinite(to)) {
				starts.push(from);
			}
			walk(node.children ?? []);
		}
	}
	walk(nodes);
	return starts;
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
	].sort()
};

writeJson(routeManifestPath, routeManifest);

// Copied into the index tier so the SITE knows which works are unpublished,
// not merely that their content files are missing. The distinction matters:
// "content absent" is also what a partially-built corpus looks like, and the
// two want opposite treatment — a missing chunk should fail loudly during
// development, a taken-down work should render a calm, deliberate notice.
writeJson(path.join(indexDir, 'unpublished.json'), unpublishedWorks);

const indexBytes = [
	'manifests.json',
	'bible-index.json',
	'ccc-index.json',
	'compendium-index.json',
	'document-index.json',
	'prayer-index.json',
	'xrefs.json',
	'document-xrefs.json'
]
	.map((f) => path.join(indexDir, f))
	.filter(existsSync)
	.reduce((sum, p) => sum + readFileSync(p).length, 0);

console.log(
	`[sync-corpus] Built corpus-data/ from ${worksSrc}: ${workIds.length} work(s), ` +
		`${contentManifest.length} content file(s)${xrefsSynced ? `, plus ${xrefs.length} CCC and ${documentXrefs.length} document xref entries` : ''}. ` +
		`Index tier: ${(indexBytes / 1000).toFixed(0)} KB raw. Works: ${workIds.join(', ')}`
);
