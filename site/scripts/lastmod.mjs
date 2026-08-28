/**
 * Per-address `<lastmod>` for the sitemap, and the ledger that makes it honest.
 *
 * `scripts/sitemap.mjs` refused `lastmod` outright until now, for a reason that
 * was correct and is worth keeping in view:
 *
 *   "A build-time value marks all ~5,800 URLs as changed on every deploy, which
 *    is worse than silence — Google discounts a lastmod it catches lying, for
 *    the whole file rather than the one entry."
 *
 * The objection is to an INACCURATE lastmod, not to lastmod. Google's own
 * wording is "if your page changed seven years ago, but you are telling us in
 * the lastmod element that it changed yesterday, at some point we will stop
 * believing you". So the whole problem is producing a value that is true, and
 * this corpus is unusually well placed to: ~5,800 addresses whose text, once
 * ingested, moves only when a correction lands in `pipeline/corrections/`. Fix
 * one Catechism paragraph and a crawler that believes us re-reads one address
 * instead of rediscovering 2,897.
 *
 * WHY NOT GIT, which is the obvious first idea. The corpus stores one
 * `paragraphs.json` per work — 3.3 MB for `ccc.en` — so `git log -1 --
 * works/ccc.en/paragraphs.json` says a one-paragraph correction changed all
 * 2,865 CCC addresses. That is precisely the lie above, told with a citation.
 * Git's granularity is the work; the sitemap's is the address.
 *
 * SO: A LEDGER. `sync-corpus.mjs` fingerprints every address from the text it
 * is already holding, and this module compares that against `lastmod.json`
 * from the previous build. An address whose fingerprint is unchanged keeps its
 * recorded date, however many times the site is rebuilt or redeployed; only a
 * fingerprint that actually moved takes today's. A rebuild over an unchanged
 * corpus therefore produces a byte-identical sitemap, which also preserves the
 * property `sitemapPaths` was already written for — Wrangler skips re-uploading
 * a file whose content hash it has seen.
 *
 * WHAT THE FINGERPRINT COVERS, and this is the line that keeps the whole thing
 * truthful: the TEXT AT THE ADDRESS, in the language the sitemap's one URL
 * actually shows. Not the rendered page. A change to `refs-grammar.ts` alters
 * what links appear on all 5,812 pages, and if that bumped 5,812 dates the
 * ledger would be telling exactly the lie it exists to avoid. Chrome, styling
 * and grammar are deliberately outside the fingerprint.
 *
 * AND THE LANGUAGE IS ENGLISH, which is the narrower half of that sentence and
 * was not true until 2026-08-26. The fingerprint used to union every edition
 * answering at an address — eight Catechisms at `/catechismus/330`, three
 * Bibles at `/scriptura/gen/1` — so a Malagasy re-parse moved the date of
 * 2,865 addresses whose English text had not changed by a character.
 *
 * That was wrong for a reason particular to this site: there is exactly ONE
 * URL per address and no `hreflang` alternates, because the reader's language
 * is a stored preference rather than part of the path. So the page a crawler
 * is told about is the page a crawler gets, and a crawler arrives with no
 * stored preference — it gets English, or Latin where the corpus has no
 * English (`CONTENT_LANG_FALLBACK.en` in `src/lib/corpus.ts` is `['en','la']`,
 * and `SITEMAP_LANGS` below is that row). Dating the URL from an edition no
 * consumer of the sitemap will ever be served is dating something else.
 *
 * The other fourteen languages are not thereby unadvertised — the URL is the
 * same URL and their text is one preference away — they simply do not get a
 * vote on when it last changed, because a crawler cannot see them. If they
 * ever become addressable (a `/{lang}/` prefix, or `hreflang`), this is the
 * decision to revisit, and it becomes per-URL rather than per-address.
 *
 * THE LEDGER IS COMMITTED, and must be. A missing ledger cannot be treated as
 * "nothing has a date yet" without stamping the whole corpus as changed today —
 * the same class of silent, corpus-wide no-op that `common/paths.py` asserts
 * against on the pipeline side. It is instead SEEDED: an address the ledger has
 * never seen takes the corpus's own last commit date for the work it comes
 * from, which is an upper bound on when that text last changed and is stable
 * across machines. So a lost ledger largely reconstructs itself rather than
 * resetting the site's history to the day someone deleted it.
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Ledger schema version. Bump only for a shape change that cannot be read by
 * the previous parser; a version we do not recognise is treated as no ledger
 * at all, which re-seeds rather than guessing.
 *
 * 2 (2026-08-26) narrowed the fingerprint from every edition at an address to
 * the English chain. Every hash therefore moved at once, and a bump is the
 * RIGHT migration rather than a way around the change ceiling: re-seeding
 * dates each address from its English edition's own corpus commit, which is
 * true, where carrying the ledger forward would have stamped all 5,804 as
 * changed today, which is the lie this module exists to avoid.
 */
export const LEDGER_VERSION = 2;

/**
 * The share of already-known addresses that may change in one build before this
 * refuses to write — and, applied a second time by `sync-corpus.mjs`, the share
 * of the ledger's own addresses that may WITHDRAW. That second use is not
 * symmetry for its own sake: a run that loads no corpus at all changes nothing
 * and withdraws everything, so the first test passes it and only the second
 * stops it.
 *
 * Corpus work moves a handful of addresses; a re-parse of one work moves that
 * work's. What no legitimate change does is move a quarter of the corpus at
 * once — that shape means the fingerprint itself started covering something new
 * (a field that varies per build, the rendered page rather than the text), and
 * writing it would burn the file's credibility with every crawler in one
 * deploy. `--accept-lastmod` is the override, and it exists so that the one
 * case that IS legitimate (a deliberate change to what the fingerprint covers)
 * has to be stated rather than absorbed.
 */
export const CHANGE_CEILING = 0.25;

/**
 * The languages a crawler's copy of an address can be in, in the order the
 * site resolves them — `CONTENT_LANG_FALLBACK.en` in `src/lib/corpus.ts`.
 *
 * Kept as its own constant rather than imported because this module is plain
 * `.mjs` run by `sync-corpus.mjs` and that one is TypeScript; `lastmod.test.ts`
 * asserts the two agree, which is the check that matters — the row is short and
 * stable, and a silent divergence would date every address from an edition
 * nobody is served.
 */
export const SITEMAP_LANGS = ['en', 'la'];

/** `en-gb` and `en` are one language for this purpose. @param {string} tag */
function baseLang(tag) {
	return String(tag).toLowerCase().split('-', 1)[0];
}

/**
 * Fold one edition's text for one address into the accumulator.
 *
 * Several works answer at the same address — eight Catechism editions at
 * `/catechismus/330`, three Bibles at `/scriptura/gen/1` — so each is recorded
 * under its own language and `resolveLastmod` picks the one a crawler is
 * served. Hashing per edition and combining there (rather than hashing a merged
 * object) keeps the result independent of the order works happen to be read in.
 *
 * WITHIN one language the hashes are still unioned, and that is deliberate:
 * `bible.cpdv.en` and `bible.douay-rheims.en` both answer at `/scriptura/gen/1`
 * and the edition menu offers both at that URL, so either changing changes what
 * an English reader can read there.
 *
 * @param {Map<string, Map<string, {hashes: string[], seed?: string}>>} into
 * @param {string} href Canonical path, always from `hrefFor`.
 * @param {unknown} value The stored text for this address in this edition.
 * @param {string | undefined} seed Corpus commit date for the contributing work.
 * @param {string} lang The contributing work's `manifest.language`.
 */
export function fingerprint(into, href, value, seed, lang) {
	let langs = into.get(href);
	if (!langs) into.set(href, (langs = new Map()));
	const key = baseLang(lang);
	let entry = langs.get(key);
	if (!entry) langs.set(key, (entry = { hashes: [] }));
	entry.hashes.push(hash8(JSON.stringify(value)));
	// The LATEST contributing work wins the seed: the address is at most as old
	// as the most recently ingested edition that answers there.
	if (seed && (!entry.seed || seed > entry.seed)) entry.seed = seed;
}

/**
 * The editions at one address that a crawler's copy is drawn from: the first
 * `SITEMAP_LANGS` language present, else — for the seven documents the corpus
 * holds in neither English nor Latin — every edition there.
 *
 * That last clause mirrors `defaultWorkId`, which ends "else any edition at
 * all" rather than refusing to render. Those addresses are real pages showing
 * real text, so they get a real date; unioning the remainder is conservative in
 * the right direction, and each of them has one or two editions anyway.
 *
 * @param {Map<string, {hashes: string[], seed?: string}>} langs
 * @returns {{hashes: string[], seed?: string, served?: string}} `served` is the
 *   language the date was read from, absent for the fall-through case.
 */
export function crawlerEditions(langs) {
	const served = SITEMAP_LANGS.find((lang) => langs.has(lang));
	const chosen = served
		? [/** @type {{hashes: string[], seed?: string}} */ (langs.get(served))]
		: [...langs.values()];
	/** @type {string | undefined} */
	let seed;
	const hashes = [];
	for (const entry of chosen) {
		hashes.push(...entry.hashes);
		if (entry.seed && (!seed || entry.seed > seed)) seed = entry.seed;
	}
	return { hashes, seed, served };
}

/** @param {string} input */
export function hash8(input) {
	return createHash('sha256').update(input).digest('hex').slice(0, 8);
}

/**
 * Resolve every address to a date, carrying unchanged ones forward.
 *
 * @param {object} options
 * @param {Map<string, Map<string, {hashes: string[], seed?: string}>>} options.fingerprints
 * @param {Record<string, string>} options.ledger Previous `path -> "date hash"`.
 * @param {string} options.today ISO date (`YYYY-MM-DD`) for changes seen now.
 * @returns {{entries: Record<string, string>, dates: Record<string, string>,
 *           stats: {total: number, added: number, changed: number,
 *                   removed: number, unseeded: number,
 *                   basis: Record<string, number>}}}
 */
export function resolveLastmod({ fingerprints, ledger, today }) {
	/** @type {Record<string, string>} */
	const entries = {};
	/** @type {Record<string, string>} */
	const dates = {};
	let added = 0;
	let changed = 0;
	// New addresses with no corpus commit date behind them, which therefore
	// fall back to the wall clock. A handful is nothing; thousands means the
	// corpus is not a git checkout and the bootstrap is guessing.
	let unseeded = 0;
	// Which language each address's date was read from. Printed by the sync so
	// the basis is visible rather than assumed: a corpus change that stopped
	// English answering somewhere would show up here as a shift toward `la` or
	// `none`, and nothing else would notice.
	/** @type {Record<string, number>} */
	const basis = {};

	// Sorted so the ledger is a stable file rather than one that reshuffles with
	// corpus read order, which would make every diff unreadable.
	for (const href of [...fingerprints.keys()].sort()) {
		const { hashes, seed, served } = crawlerEditions(
			/** @type {Map<string, {hashes: string[], seed?: string}>} */ (fingerprints.get(href))
		);
		basis[served ?? 'none'] = (basis[served ?? 'none'] ?? 0) + 1;
		const now = hash8([...hashes].sort().join(' '));
		const previous = ledger[href];
		let date;
		if (!previous) {
			// Never seen: seeded from the corpus rather than stamped as new.
			date = seed ?? today;
			if (!seed) unseeded += 1;
			added += 1;
		} else {
			const [wasDate, wasHash] = previous.split(' ');
			if (wasHash === now) {
				date = wasDate;
			} else {
				date = today;
				changed += 1;
			}
		}
		entries[href] = `${date} ${now}`;
		dates[href] = date;
	}

	const removed = Object.keys(ledger).filter((href) => !fingerprints.has(href)).length;
	return {
		entries,
		dates,
		stats: { total: fingerprints.size, added, changed, removed, unseeded, basis }
	};
}

/**
 * Read the committed ledger. An unreadable or unrecognised file reads as empty,
 * which SEEDS rather than stamps — see the module docblock.
 *
 * @param {string} file
 * @returns {Record<string, string>}
 */
export function readLedger(file) {
	if (!existsSync(file)) return {};
	try {
		const parsed = JSON.parse(readFileSync(file, 'utf8'));
		if (parsed?.version !== LEDGER_VERSION) return {};
		return parsed.entries ?? {};
	} catch {
		return {};
	}
}

/**
 * @param {string} file
 * @param {Record<string, string>} entries
 */
export function writeLedger(file, entries) {
	// One address per line, which is the whole point: a correction to a single
	// paragraph should show up in `git diff` as a single line.
	const lines = Object.entries(entries).map(
		([href, value]) => `\t\t${JSON.stringify(href)}: ${JSON.stringify(value)}`
	);
	writeFileSync(
		file,
		[
			'{',
			`\t"version": ${LEDGER_VERSION},`,
			'\t"entries": {',
			lines.join(',\n'),
			'\t}',
			'}',
			''
		].join('\n')
	);
}
