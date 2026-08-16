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
 *   needed), documents (docs/corpus-schema.md §Documents) also kept whole
 *   per work — the largest is ~200 KB raw (Gaudium et Spes), well under the
 *   Compendium's own no-split precedent, so one `sections.json` per work is
 *   the whole content file rather than a chunk — and prayers
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

const siteRoot = path.resolve(fileURLToPath(import.meta.url), '../..');
const corpusDir = path.resolve(siteRoot, process.env.CORPUS_DIR ?? '../corpus');
const destDir = path.join(siteRoot, 'src/lib/corpus-data');
const indexDir = path.join(destDir, 'index');
const contentDir = path.join(destDir, 'content');

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

rmSync(destDir, { recursive: true, force: true });

const worksSrc = path.join(corpusDir, 'works');
const xrefsSrc = path.join(corpusDir, 'xrefs');

if (!existsSync(worksSrc)) {
	console.warn(
		`[sync-corpus] No corpus found at ${worksSrc} -- corpus.ts will fall back to its bundled ` +
			`fixtures. Set CORPUS_DIR to point at a real corpus/ checkout to build with real data.`
	);
	process.exit(0);
}

const workIds = readdirSync(worksSrc, { withFileTypes: true })
	.filter((e) => e.isDirectory())
	.map((e) => e.name)
	.sort();

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
const compendiumIndex = {}; // lang -> { structure }
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
	if (!existsSync(manifestPath)) continue; // not a real work dir
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

		// Kept WHOLE per work rather than chunked (see this module's docblock)
		// — at ~200 KB raw worst-case this is comfortably inside the
		// Compendium's own no-split precedent, and a document's own internal
		// structure (chapters/parts) already gives the reader a TOC to jump
		// through instead of a flat 1..N list, so chunk-boundary UX (the CCC's
		// reason to split) doesn't apply here.
		const relPath = `content/${workId}/sections.json`;
		writeJson(path.join(destDir, relPath), sections);
		contentManifest.push({
			workId,
			kind: 'document-sections',
			relPath,
			bytes: byteLength(sections)
		});
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

let xrefsSynced = false;
if (existsSync(xrefsSrc)) {
	const xrefFiles = readdirSync(xrefsSrc).filter((f) => f.endsWith('.json'));
	const xrefs = xrefFiles.flatMap((f) => readJson(path.join(xrefsSrc, f)));
	writeJson(path.join(indexDir, 'xrefs.json'), xrefs);
	xrefsSynced = xrefFiles.length > 0;
}

writeJson(path.join(indexDir, 'content-manifest.json'), contentManifest);

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
	'xrefs.json'
]
	.map((f) => path.join(indexDir, f))
	.filter(existsSync)
	.reduce((sum, p) => sum + readFileSync(p).length, 0);

console.log(
	`[sync-corpus] Built corpus-data/ from ${worksSrc}: ${workIds.length} work(s), ` +
		`${contentManifest.length} content file(s)${xrefsSynced ? ', plus xrefs/' : ''}. ` +
		`Index tier: ${(indexBytes / 1000).toFixed(0)} KB raw. Works: ${workIds.join(', ')}`
);
