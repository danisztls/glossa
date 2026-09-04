/**
 * How much of the corpus's reference apparatus the grammar actually reads —
 * measured on every sync, compared against a committed baseline, and refused
 * at deploy when it drops.
 *
 * WHY THIS EXISTS. Every rule in `src/lib/refs-grammar.ts` was derived by
 * measuring the corpus, and every regression the grammar has had was found
 * the same way, by hand, after the fact: 3,590 references silently not
 * linking when an italic book name split a citation across two text runs
 * (site/docs/references.md), 153 references to Romans lost to a "Cat Rom"
 * guard, ~200 English references lost to an abbreviating full stop. The unit
 * tests lock in what each rule does; nothing measured what the grammar
 * covers, so a change that lost five hundred links passed `npm test` and
 * `npm run deploy` alike. This is that measurement, made a fixture of the
 * build rather than a one-off script.
 *
 * WHAT IS MEASURED. Per work family (`ccc`, `vatii`, `encyclical`, `summa`,
 * …), every citation string the corpus stores (numbered footnotes, the
 * Portuguese inline locators, a Compendium question's `ccc_refs`, a Rosary
 * mystery's citation) is parsed with `parseRefs` and counted as one of:
 *
 *   linkable    — at least one segment `refHref` could turn into a link
 *                 (scripture, a Catechism or Compendium paragraph, a Summa
 *                 locus, a document the corpus holds);
 *   recognized  — only segments that name something the corpus does NOT hold
 *                 (DS, PL, PG, AAS, CIC …), rendered as a tooltip, never a link;
 *   nothing     — no reference recognized at all (the Fathers, the Roman
 *                 Missal, "Ibid.", a papal address …).
 *
 * "Ibid." stays in that last bucket even though `buildCitationXrefs` now
 * reads one: what expands it is the PREVIOUS citation, and this measures
 * what the grammar reads in a string handed to it alone. Parse-level is the
 * point — a coverage number that moved when a neighbouring footnote changed
 * would not be measuring the grammar.
 *
 * and every prose block is scanned with `linkifyProse`, counting scripture
 * references found in running text, document sigla found there (the German,
 * Spanish and French Catechisms print no footnotes at all, so their whole
 * apparatus is prose), and, for the Summa, the self-references the source
 * itself marked (`<a data-ref>`). Parse-level, deliberately: it
 * asks what the grammar READS, not whether each address exists in the reader's
 * edition — the latter is `checkXrefsAgainstCorpus`'s job, and the two guard
 * opposite failures (under-linking here, dead links there).
 *
 * THE BASELINE is `scripts/reference-coverage.baseline.json`, committed. The
 * sync writes the current report to `static/reference-coverage.json` (so it
 * ships in `build/`, where preflight can read it) and warns when any family's
 * `linkable` citations or prose scripture hits fall more than `TOLERANCE`
 * below the baseline; `preflight-deploy.mjs` refuses on the same condition.
 * A genuine change — a work withdrawn, a rule tightened on purpose — is
 * accepted with `npm run coverage:accept`, which is a diff in the commit, not
 * a number nobody sees.
 *
 * The residue — what the grammar recognized nothing in — is bucketed by its
 * first two tokens and kept in the report, because that list is where every
 * coverage win so far was found. It prints with `REFERENCE_COVERAGE=verbose`.
 */

import { existsSync, readdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { linkifyProse, normalizeCitationSpacing, parseRefs } from '../src/lib/refs-grammar.ts';
import { blockProse } from './build-xrefs.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const REPORT_PATH = path.join(siteRoot, 'static/reference-coverage.json');
export const BASELINE_PATH = path.join(siteRoot, 'scripts/reference-coverage.baseline.json');

/** A family may lose this fraction of its links before it is a regression.
 *  Wide enough to absorb a corrected citation or two, narrow enough that a
 *  broken rule — which loses links by the hundred — cannot hide in it. */
export const TOLERANCE = 0.03;

/** How many residue buckets the report keeps per family. */
const RESIDUE_BUCKETS = 25;

/** The files in a work directory that hold no reference apparatus. */
const NOT_CONTENT = new Set(['manifest.json', 'corrections-applied.json', 'abbreviations.json']);

/**
 * @typedef {{ text: string, sameChapter?: { osis: string, chapter: number } }} ProseText
 * @typedef {{ lang: string, work?: string, citations: string[], prose: ProseText[], stored: number }} Pending
 * @typedef {{ key: string, count: number, example: string }} ResidueBucket
 * @typedef {{
 *   citations: { total: number, linkable: number, recognized: number, nothing: number },
 *   prose: { blocks: number, scripture: number, document: number, stored: number },
 *   residue: ResidueBucket[]
 * }} FamilyCoverage
 * @typedef {{ version: 1, families: Record<string, FamilyCoverage> }} CoverageReport
 * @typedef {'linkable' | 'recognized' | 'nothing'} Verdict
 */

/**
 * Collects the corpus's citation strings and prose blocks work by work, then
 * parses them all at once in `report()`.
 *
 * Two passes rather than one because the grammar's document-title matcher is
 * fed by `setDocumentTitleSource`, which the sync can only call once every
 * manifest is read — and a citation parsed before that would miss every
 * document named by title. Holding the strings costs a few tens of megabytes
 * for the whole corpus, once, at build time.
 */
export class CoverageMeter {
	/**
	 * @type {Map<string, Map<string, Pending>>} family -> work id -> pending strings
	 *
	 * Bucketed per WORK, not per language, because the grammar is not purely
	 * per-language: `refs-grammar.ts`'s `WORK_CONFIGS` overrides a handful of
	 * works whose own book naming contradicts their language's table. Two
	 * English encyclicals are among them, and an `encyclical`/`en` bucket
	 * would have had to parse them the same way as their 200 neighbours —
	 * i.e. measure something the site does not render. The report still
	 * aggregates per family; only the parsing sees the work.
	 */
	#pending = new Map();

	/**
	 * Read every content file of one work directory.
	 * @param {string} workId
	 * @param {string} workDir
	 */
	addWork(workId, workDir) {
		const parts = workId.split('.');
		const family = parts[0];
		const lang = parts[parts.length - 1];
		const files = readdirSync(workDir)
			.filter((f) => f.endsWith('.json') && !NOT_CONTENT.has(f))
			.map((f) => path.join(workDir, f));
		const booksDir = path.join(workDir, 'books');
		if (existsSync(booksDir)) {
			for (const f of readdirSync(booksDir)) files.push(path.join(booksDir, f));
		}
		for (const file of files) {
			this.addUnits(family, lang, JSON.parse(readFileSync(file, 'utf8')), workId);
		}
	}

	/**
	 * Walk any corpus JSON for the shapes that carry references.
	 * @param {string} family
	 * @param {string} lang
	 * @param {unknown} data
	 * @param {string} [work] corpus work id, when the caller has one — see
	 *   `#pending`. Defaults to bucketing by language alone.
	 */
	addUnits(family, lang, data, work) {
		const bucket = this.#bucket(family, lang, work);
		/*
		 * THE ADDRESS A COMMENTARY'S NOTE HANGS OFF, tracked down the walk
		 * because `RefsOpts.sameChapter` needs it and nothing in the note's own
		 * text says it. A commentary names its neighbours with no book and no
		 * chapter — `v. 12` — so this meter reads 2,745 fewer references than
		 * the page draws unless it carries the same address the page passes.
		 *
		 * `family === 'commentary'` GATES IT, and the gate is the whole safety
		 * of it: a Bible edition's own `notes` have exactly this file shape and
		 * exactly this recursion, and `Sidenote` does NOT pass `sameChapter`
		 * for them — Challoner's `v. 12` is far more often a Roman five. A
		 * meter that read the two apparatuses differently from the page is the
		 * failure `prose.document` was added to catch, in the other direction.
		 */
		const addressed = family === 'commentary';
		/** @type {{ osis?: string, chapter?: number }} */
		const at = {};
		/** @param {any} node */
		const walk = (node) => {
			if (Array.isArray(node)) {
				for (const x of node) walk(x);
				return;
			}
			if (!node || typeof node !== 'object') return;
			if (addressed) {
				if (typeof node.osis === 'string') at.osis = node.osis;
				if (typeof node.n === 'number' && Array.isArray(node.verses)) at.chapter = node.n;
			}
			if (Array.isArray(node.citations)) {
				// `label ?? text`: the field the renderer shows (build-xrefs.mjs).
				for (const c of node.citations) bucket.citations.push(c.label ?? c.text ?? '');
			}
			if (node.citation && typeof node.citation === 'object' && node.citation.text) {
				bucket.citations.push(node.citation.text);
			}
			if (typeof node.ccc_refs === 'string') bucket.citations.push(node.ccc_refs);
			// `answer_blocks` is the Compendium's name for `blocks`, and
			// `question` is prose the reader meets BEFORE the answer — eight
			// questions quote a verse and print its locator. `notes[].text` is
			// an annotated Bible edition's commentary, which cites Scripture
			// 20,596 times across the seven editions that carry an apparatus
			// (435 when Challoner and Matos Soares were the only two, before
			// the 2026-08-28 capture added five more).
			//
			// All three were walked past until 2026-08-26, and all three were
			// rendered as inert text on the page until the same day. That is
			// not a coincidence worth shrugging at: this meter and the renderer
			// have to see the same text or the drop guard in
			// `preflight-deploy.mjs` guards something nobody reads. The CCC
			// went the other way that week — measured here, undrawn there —
			// which is the same failure with the operands swapped.
			for (const list of [node.blocks, node.answer_blocks]) {
				if (!Array.isArray(list)) continue;
				for (const block of list) {
					if (!block || typeof block !== 'object') continue;
					bucket.prose.push({ text: blockProse(block) });
					if (block.html) bucket.stored += (block.html.match(/<a data-ref=/g) ?? []).length;
				}
			}
			if (typeof node.question === 'string') bucket.prose.push({ text: node.question });
			if (Array.isArray(node.notes)) {
				const sameChapter =
					addressed && at.osis && at.chapter ? { osis: at.osis, chapter: at.chapter } : undefined;
				for (const note of node.notes) {
					if (note && typeof note === 'object' && typeof note.text === 'string') {
						bucket.prose.push({ text: note.text, ...(sameChapter ? { sameChapter } : {}) });
					}
				}
			}
			for (const [key, value] of Object.entries(node)) {
				if (key === 'citations' || key === 'citation') continue;
				if (key === 'blocks' || key === 'answer_blocks' || key === 'notes') continue;
				if (value && typeof value === 'object') walk(value);
			}
		};
		walk(data);
	}

	/**
	 * @param {string} family
	 * @param {string} lang
	 * @param {string} [work]
	 * @returns {Pending}
	 */
	#bucket(family, lang, work) {
		let byWork = this.#pending.get(family);
		if (!byWork) this.#pending.set(family, (byWork = new Map()));
		const key = work ?? lang;
		let bucket = byWork.get(key);
		if (!bucket) byWork.set(key, (bucket = { lang, work, citations: [], prose: [], stored: 0 }));
		return bucket;
	}

	/**
	 * Parse everything collected so far. Call after `setDocumentTitleSource`.
	 * @returns {CoverageReport}
	 */
	report() {
		/** @type {Record<string, FamilyCoverage>} */
		const families = {};
		for (const family of [...this.#pending.keys()].sort()) {
			const counts = {
				citations: { total: 0, linkable: 0, recognized: 0, nothing: 0 },
				prose: { blocks: 0, scripture: 0, document: 0, stored: 0 }
			};
			/** @type {Map<string, { count: number, example: string }>} */
			const residue = new Map();
			for (const { lang, work, citations, prose, stored } of this.#pending.get(family)?.values() ??
				[]) {
				for (const raw of citations) {
					if (!raw) continue;
					counts.citations.total++;
					const verdict = classifyCitation(raw, lang, work);
					counts.citations[verdict]++;
					if (verdict === 'nothing') {
						const key = residueKey(raw);
						const entry = residue.get(key) ?? { count: 0, example: normalizeCitationSpacing(raw) };
						entry.count++;
						residue.set(key, entry);
					}
				}
				counts.prose.blocks += prose.length;
				counts.prose.stored += stored;
				for (const { text, sameChapter } of prose) {
					for (const seg of linkifyProse(text, { lang, work, sameChapter })) {
						if (seg.kind === 'scripture') counts.prose.scripture++;
						else if (seg.kind === 'document') counts.prose.document++;
					}
				}
			}
			families[family] = {
				...counts,
				residue: [...residue.entries()]
					.sort((a, b) => b[1].count - a[1].count)
					.slice(0, RESIDUE_BUCKETS)
					.map(([key, { count, example }]) => ({ key, count, example: example.slice(0, 90) }))
			};
		}
		return { version: 1, families };
	}
}

/**
 * One citation string's verdict — see the module docblock for the three.
 * @param {string} raw
 * @param {string} lang
 * @param {string} [work] corpus work id, for `WORK_CONFIGS`
 * @returns {Verdict}
 */
export function classifyCitation(raw, lang, work) {
	let linkable = false;
	let recognized = false;
	for (const seg of parseRefs(normalizeCitationSpacing(raw), { lang, work })) {
		if (seg.kind === 'text') continue;
		// A document segment links by its SLUG or by the work it names. `work`
		// is the second of those and arrived with the Code of Canon Law: a
		// `CIC, can. 216` has no `/documenta` slug and never will — it
		// resolves to `/ius-canonicum/216` — so counting it as merely
		// recognized understated this measure by every canon the corpus cites.
		if (seg.kind === 'document' && !seg.slug && !seg.work) recognized = true;
		else linkable = true;
	}
	return linkable ? 'linkable' : recognized ? 'recognized' : 'nothing';
}

/**
 * The first two tokens after any "cf.", lower-cased — enough to group
 * "Ibid., 14." with "Ibid. p. 618." and "Roman Missal, …" with itself.
 * @param {string} raw
 */
function residueKey(raw) {
	return normalizeCitationSpacing(raw)
		.replace(/^(?:cf|cfr)\.?\s*/i, '')
		.split(/[\s,;:(]+/)
		.slice(0, 2)
		.join(' ')
		.toLowerCase();
}

/**
 * Every family whose links fell below the baseline by more than `tolerance`,
 * as human-readable lines; empty when nothing regressed. A family the baseline
 * knows and the report lacks is a regression too — a whole work family gone
 * missing is exactly the kind of build this exists to stop.
 * Structurally typed on the three counters it reads, so a baseline written by
 * an older report shape still compares.
 * @typedef {{ families: Record<string, { citations: { linkable: number }, prose: { scripture: number, document?: number, stored: number } }>, crossWork?: Record<string, number> }} Comparable
 * @param {Comparable} report
 * @param {Comparable} baseline
 * @param {number} tolerance
 * @returns {string[]}
 */
export function compareCoverage(report, baseline, tolerance = TOLERANCE) {
	/** @type {string[]} */
	const problems = [];
	for (const [family, expected] of Object.entries(baseline.families ?? {})) {
		const actual = report.families?.[family];
		if (!actual) {
			problems.push(`${family}: in the baseline, absent from this build`);
			continue;
		}
		/** @type {[string, number, number][]} */
		const checks = [
			['linkable citations', expected.citations.linkable, actual.citations.linkable],
			['prose scripture references', expected.prose.scripture, actual.prose.scripture],
			// `?? 0` on both sides, not just the baseline's: a report written
			// before this counter existed compares as zero rather than as
			// NaN, which would silently pass every comparison.
			['prose document sigla', expected.prose.document ?? 0, actual.prose.document ?? 0],
			['stored references', expected.prose.stored, actual.prose.stored]
		];
		for (const [label, before, after] of checks) {
			if (after < before * (1 - tolerance)) {
				problems.push(`${family}: ${label} ${before} → ${after}`);
			}
		}
	}
	problems.push(...compareCrossWork(report, baseline, tolerance));
	return problems;
}

/**
 * The two counters that are not about the grammar at all: how much of the
 * Catechism/Compendium join survives a build.
 *
 * They live here because they fail the same way everything else here does —
 * silently, and only for some readers. The Catechism and Compendium indexes
 * pair their outlines by position and DROP a whole level when the two
 * disagree about how many divisions it has (`toc-pairing.ts`), which is a
 * correct refusal and an invisible one: the Spanish Compendium parsed seven
 * sections against the other nine editions' eight, and the only symptom was
 * eight missing links on two pages in one language. The condensation map has
 * the same property — an edition that stops printing its reference column
 * costs links and nothing else.
 *
 * `?? 0` on both sides, like `prose.document` above: a baseline written
 * before these counters existed compares as zero and passes, rather than
 * comparing as NaN and passing for the wrong reason.
 * @param {Comparable} report
 * @param {Comparable} baseline
 * @param {number} tolerance
 * @returns {string[]}
 */
export function compareCrossWork(report, baseline, tolerance = TOLERANCE) {
	/** @type {string[]} */
	const problems = [];
	for (const [key, before] of Object.entries(baseline.crossWork ?? {})) {
		const after = report.crossWork?.[key] ?? 0;
		if (after < before * (1 - tolerance)) {
			problems.push(`cross-work: ${key} ${before} → ${after}`);
		}
	}
	return problems;
}

/**
 * One line per family that carries any apparatus, for the sync's console.
 * @param {CoverageReport} report
 */
export function summarize(report) {
	return Object.entries(report.families)
		.filter(
			([, f]) =>
				f.citations.total > 0 || f.prose.scripture > 0 || f.prose.document > 0 || f.prose.stored > 0
		)
		.map(([family, f]) => {
			const c = f.citations;
			const pct = c.total ? Math.round((100 * c.linkable) / c.total) : 0;
			return (
				`  ${family.padEnd(11)} citations ${String(c.total).padStart(5)}: ` +
				`${c.linkable} linkable (${pct}%), ${c.recognized} recognized, ${c.nothing} nothing` +
				` | prose: ${f.prose.scripture} scripture` +
				(f.prose.document ? `, ${f.prose.document} sigla` : '') +
				(f.prose.stored ? `, ${f.prose.stored} stored` : '')
			);
		})
		.join('\n');
}

/** @returns {CoverageReport | undefined} */
export function readBaseline() {
	return existsSync(BASELINE_PATH) ? JSON.parse(readFileSync(BASELINE_PATH, 'utf8')) : undefined;
}

/** @param {CoverageReport} report */
export function writeReport(report) {
	writeFileSync(REPORT_PATH, JSON.stringify(report, null, '\t') + '\n');
}

// `node scripts/reference-coverage.mjs --accept`: the report the last sync
// wrote becomes the baseline. The sync itself never does this — accepting a
// drop is a decision, and it should show up as a diff.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	if (process.argv[2] !== '--accept') {
		console.error('usage: node scripts/reference-coverage.mjs --accept');
		process.exit(2);
	}
	if (!existsSync(REPORT_PATH)) {
		console.error(
			`[reference-coverage] no report at ${REPORT_PATH}; run \`npm run sync-corpus\` first`
		);
		process.exit(1);
	}
	copyFileSync(REPORT_PATH, BASELINE_PATH);
	console.log(`[reference-coverage] baseline updated from ${REPORT_PATH}`);
}
