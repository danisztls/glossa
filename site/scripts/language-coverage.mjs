/**
 * Which works a reader can reach in which language — measured on every sync,
 * compared against a committed baseline, and refused at deploy when one goes
 * missing.
 *
 * WHY THIS EXISTS, AND WHY `reference-coverage.mjs` CANNOT ANSWER IT. That
 * one measures the citations a work MAKES: how much of the printed apparatus
 * the grammar reads. This measures what a work OFFERS: whether a reader whose
 * interface is Portuguese has a Code of Canon Law at all. They are the two
 * halves of "coverage" and they fail independently — a grammar regression
 * loses links in a corpus that is complete, and a withdrawn edition loses a
 * language in a corpus whose grammar is perfect.
 *
 * NOTHING GUARDED IT BEFORE. `routeManifest` unions across editions, so
 * `/documenta/{slug}` stays a valid address while any language has it;
 * `workCount` is a scalar that a swap leaves unchanged; and the census page
 * draws whatever it is given. A language could lose a work between two clean
 * builds with nothing said.
 *
 * PRESENCE, NOT PROPORTION, AND THAT IS THE WHOLE DESIGN. The baseline records
 * the SET of (work, language) pairs and not how much of each work a language
 * reaches. Recording the amounts would put a file in the tree that churns on
 * every ingest and needs accepting weekly — the exact noise a regression has
 * to stand out from. On presence it moves only when something real happens,
 * so a diff is worth reading and `--accept` is worth typing.
 *
 * A COUNT WOULD ALSO HIDE A SWAP. "8 languages" is still 8 after a build that
 * gained Polish and lost Portuguese, and the pair that matters is the one that
 * went. So the comparison is over pairs and the failure names them.
 *
 * A GAIN IS NEVER A FAILURE and is reported anyway: it is what an accepted
 * baseline is FOR, and a sync that quietly ingests a language nobody notices
 * is a smaller problem than a silent loss but the same kind.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Shipped in `build/`, where `preflight-deploy.mjs` can read it — the same
 *  arrangement `reference-coverage.mjs` uses, and for the same reason: the
 *  index tier is content-hashed and cannot be found by name. */
export const REPORT_PATH = path.join(siteRoot, 'static/language-coverage.json');
export const BASELINE_PATH = path.join(siteRoot, 'scripts/language-coverage.baseline.json');

/**
 * @typedef {{ version: 1, coverage: Record<string, string[]> }} LanguageCoverage
 * @typedef {{ work: string, lang: string }} Pair
 */

/**
 * The (work, language) pairs this build offers, out of the census.
 *
 * Read from the census rather than derived again, which is that module's
 * whole point: the number a reader is shown and the number the deploy is
 * gated on must be the same number, or the gate is guarding something else.
 *
 * @param {{ coverage: { languages: string[], rows: { key: string, values: number[] }[] } }} census
 * @returns {LanguageCoverage}
 */
export function languageCoverage(census) {
	/** @type {Record<string, string[]>} */
	const coverage = {};
	for (const row of census.coverage.rows) {
		coverage[row.key] = census.coverage.languages
			.filter((_, i) => row.values[i] > 0)
			.sort((a, b) => a.localeCompare(b));
	}
	return { version: 1, coverage };
}

/**
 * Pairs in the baseline that this build no longer offers, and pairs it offers
 * that the baseline does not know about.
 *
 * A work absent from the CURRENT report entirely counts as every one of its
 * baseline languages lost, which is the case that matters most: a work type
 * that failed to sync at all is the failure mode `CLAUDE.md` already records
 * for the lastmod ledger, where a `CORPUS_DIR` of symlinks yielded zero works
 * and two clean runs shipped an empty file.
 *
 * A work absent from the BASELINE is a new work, and every language of it is
 * a gain rather than a lie about a loss.
 *
 * @param {LanguageCoverage} current
 * @param {LanguageCoverage} baseline
 * @returns {{ lost: Pair[], gained: Pair[] }}
 */
export function compareLanguageCoverage(current, baseline) {
	/** @type {Pair[]} */ const lost = [];
	/** @type {Pair[]} */ const gained = [];
	for (const [work, langs] of Object.entries(baseline.coverage)) {
		const now = new Set(current.coverage[work] ?? []);
		for (const lang of langs) if (!now.has(lang)) lost.push({ work, lang });
	}
	for (const [work, langs] of Object.entries(current.coverage)) {
		const before = new Set(baseline.coverage[work] ?? []);
		for (const lang of langs) if (!before.has(lang)) gained.push({ work, lang });
	}
	return { lost, gained };
}

/** `bible de, catechism pt` — what a message prints, capped so a total
 *  collapse does not fill a terminal with its own symptom. */
export function describePairs(/** @type {Pair[]} */ pairs, /** @type {number} */ cap = 12) {
	const shown = pairs.slice(0, cap).map((p) => `${p.work} ${p.lang}`);
	return shown.join(', ') + (pairs.length > cap ? `, +${pairs.length - cap} more` : '');
}

/** @returns {LanguageCoverage | null} */
export function readBaseline() {
	if (!existsSync(BASELINE_PATH)) return null;
	return JSON.parse(readFileSync(BASELINE_PATH, 'utf8'));
}

/**
 * Sorted keys and a trailing newline, because this file is read as a DIFF and
 * its formatting is part of what it is for: an unsorted write would make the
 * next real change unreadable.
 *
 * TABS, matching `reference-coverage.mjs` and every other generated JSON in
 * this tree. That is not enough to keep it out of `.prettierignore` and both
 * files are listed there: prettier collapses a short array onto one line and
 * this writer never does, so the two disagree about every work with fewer than
 * about eight languages and each would undo the other on every sync — the
 * fight `pipeline/corrections/` is exempted from, for the same reason.
 */
function serialize(/** @type {LanguageCoverage} */ report) {
	const coverage = Object.fromEntries(
		Object.keys(report.coverage)
			.sort((a, b) => a.localeCompare(b))
			.map((k) => [k, report.coverage[k]])
	);
	return JSON.stringify({ version: report.version, coverage }, null, '\t') + '\n';
}

export function writeReport(/** @type {LanguageCoverage} */ report) {
	writeFileSync(REPORT_PATH, serialize(report));
}

export function acceptBaseline(/** @type {LanguageCoverage} */ report) {
	writeFileSync(BASELINE_PATH, serialize(report));
}

// `node scripts/language-coverage.mjs --accept`: the report the last sync
// wrote becomes the baseline. The sync itself never does this — accepting a
// withdrawal is a decision, and it should show up as a diff.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	if (process.argv[2] !== '--accept') {
		console.error('usage: node scripts/language-coverage.mjs --accept');
		process.exit(2);
	}
	if (!existsSync(REPORT_PATH)) {
		console.error(
			`[language-coverage] no report at ${REPORT_PATH}; run \`npm run sync-corpus\` first`
		);
		process.exit(1);
	}
	acceptBaseline(JSON.parse(readFileSync(REPORT_PATH, 'utf8')));
	console.log(`[language-coverage] baseline updated from ${REPORT_PATH}`);
}
