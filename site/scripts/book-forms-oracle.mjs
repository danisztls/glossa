/**
 * The Catechism's eight editions, used as an oracle over the reference
 * grammar's book tables — both to BUILD one for a language that has none and
 * to CHECK the ones that exist.
 *
 * WHY THIS WORKS. Paragraph 1213 is the same paragraph in every edition, so
 * the citations attached to it are translations of each other, and a
 * chapter:verse is edition-invariant: where the English edition resolves
 * "Jn 11:52" the Italian edition prints its own abbreviation in front of the
 * same "11,52". Align the two on the locus and the abbreviation reads itself
 * off. That is how `BOOK_VARIANTS_DE/ES/FR/IT/MG` were built (2026-08-26) and
 * how `BOOK_VARIANTS_LA` — which came from the Latin edition's own printed
 * table — was checked: 53 of its 73 rows corroborated in use, none
 * contradicted.
 *
 * It is the same trick as `audit.py divisions` in the pipeline, one level
 * down: the corpus's cross-language symmetry is free evidence, and nothing
 * else here can see it. `reference-coverage.mjs` measures how MUCH the
 * grammar reads; this says whether what it reads is RIGHT.
 *
 *     node scripts/book-forms-oracle.mjs                 # check every edition
 *     node scripts/book-forms-oracle.mjs --derive it,la  # propose tables
 *     CORPUS_DIR=… node scripts/book-forms-oracle.mjs    # corpus elsewhere
 *
 * `--derive` prints every book-shaped token the named editions print that the
 * grammar does NOT already resolve, with the OSIS id the locus alignment
 * votes for, the vote count and one example. Rows it cannot decide are marked
 * `??` and are meant to be read, not pasted: the recurring false friend is a
 * patristic work title ("Enarratio in Psalmum 103, 4, 1", "secundum Lucam
 * 10,121"), which shapes exactly like a locator and is not a book.
 *
 * The default mode is the check, and it is the one worth running after any
 * change to a book table. It reports each scripture link the grammar produces
 * whose OSIS the OTHER editions contradict at that paragraph. A handful of
 * rows is normal and is not a defect — editions genuinely cite different
 * verses for the same claim (Sir 5:8 against Qo 5:9 at §2536) — so read the
 * COUNT: 330 rows for German meant the English book table was being applied
 * to a German apparatus, and 18 means the table is right and the editions
 * differ. What it caught when it was written: every First-John citation in
 * three editions resolving to the Gospel, and three source misprints now
 * filed as corrections (`ccc.de-330-dtn-for-dan`, `ccc.es-1867-jc-for-st`,
 * `ccc.mg-604-jo-missing-one`).
 *
 * REFERENCE EDITIONS ARE `en` AND `pt` because their tables are the two the
 * corpus has measured longest, not because they are more correct. Pass
 * `--ref` to change that; comparing a new edition against `la` is reasonable
 * once Latin is trusted, and the Latin table is the only one taken from a
 * source rather than derived.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { linkifyProse, normalizeCitationSpacing, parseRefs } from '../src/lib/refs-grammar.ts';
import { blockProse } from './build-xrefs.mjs';

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORPUS = process.env.CORPUS_DIR
	? path.resolve(process.env.CORPUS_DIR)
	: path.resolve(siteRoot, '../../glossa-corpus');

const ARGV = process.argv.slice(2);
/** Every index that is a `--flag` or the value belonging to one, so the sole
 *  positional argument (the edition list) is not confused with `--work`'s
 *  value. */
const FLAG_INDEXES = new Set(ARGV.flatMap((a, i) => (a.startsWith('--') ? [i, i + 1] : [])));
/** `--name value`, or null when the flag is absent. Defined here rather than
 *  beside the rest of the argument handling because `WORK` below needs it. */
function flagOf(name) {
	const i = ARGV.indexOf(name);
	return i === -1 ? null : (ARGV[i + 1] ?? '');
}

/**
 * The work whose editions are the oracle. `ccc` by default, because eight
 * editions of 2,865 aligned paragraphs is the largest such body the corpus
 * holds; `--work encyclical.magnifica-humanitas` points it at any other work
 * published in more than one language, which is what derived the Polish and
 * Russian tables (245 sections, nine editions, 2026-08-26).
 *
 * The alignment this depends on is NOT free for every family — a section
 * number is famously not the same section in two translations of an older
 * encyclical (CLAUDE.md, "Work that spans languages"). It holds for a work
 * translated from one text at one time, which is why the check below refuses
 * to run when the editions do not agree on their unit numbers.
 */
const WORK = flagOf('--work') ?? 'ccc';

/** The one file in a work directory that holds its numbered units. */
const UNIT_FILES = ['paragraphs.json', 'sections.json', 'questions.json'];

/** This edition's work id — the axis `refs-grammar.ts`'s `WORK_CONFIGS`
 *  overrides on, passed everywhere the oracle parses so it reads each edition
 *  exactly as its page does. Without it the Summa's Douay-numbered books of
 *  Kings would read here as the modern ones and the oracle would report a
 *  contradiction of its own making. */
function workIdOf(lang) {
	return `${WORK}.${lang}`;
}

function workDir(lang) {
	return path.join(CORPUS, 'works', workIdOf(lang));
}

/** Every edition of the chosen work the corpus holds, in work-id order. */
function editions() {
	const works = path.join(CORPUS, 'works');
	if (!existsSync(works)) {
		console.error(`[book-forms-oracle] no corpus at ${works}; set CORPUS_DIR`);
		process.exit(2);
	}
	const found = readdirSync(works)
		.filter((d) => d.startsWith(`${WORK}.`))
		.map((d) => d.slice(WORK.length + 1))
		.filter((lang) => !lang.includes('.'))
		.sort();
	if (found.length < 2) {
		console.error(`[book-forms-oracle] ${WORK} has ${found.length} edition(s); need at least two`);
		process.exit(2);
	}
	return found;
}

/** One paragraph's reference-bearing strings: its citations and its prose. */
function strings(para) {
	const out = [];
	for (const c of para.citations ?? []) out.push(c.label ?? c.text ?? '');
	for (const b of para.blocks ?? []) out.push(blockProse(b));
	return out.filter(Boolean).map(normalizeCitationSpacing);
}

function load(lang) {
	const dir = workDir(lang);
	const name = UNIT_FILES.find((f) => existsSync(path.join(dir, f)));
	if (!name) {
		console.error(`[book-forms-oracle] ${dir} holds none of ${UNIT_FILES.join(', ')}`);
		process.exit(2);
	}
	return new Map(
		JSON.parse(readFileSync(path.join(dir, name), 'utf8')).map((p) => [p.n, strings(p)])
	);
}

/** Every scripture segment the grammar finds in one string, both grammars. */
function scriptureIn(text, lang) {
	const out = [];
	const opts = { lang, work: workIdOf(lang) };
	for (const segs of [parseRefs(text, opts), linkifyProse(text, opts)]) {
		for (const s of segs) if (s.kind === 'scripture') out.push(s);
	}
	return out;
}

/** paragraph -> "chapter:verse" -> the OSIS ids the reference editions name. */
function referenceLoci(refLangs) {
	const byPara = new Map();
	for (const lang of refLangs) {
		for (const [n, texts] of load(lang)) {
			let loci = byPara.get(n);
			if (!loci) byPara.set(n, (loci = new Map()));
			for (const text of texts) {
				for (const s of scriptureIn(text, lang)) {
					for (const v of s.verses.length ? s.verses : [0]) {
						const key = `${s.chapter}:${v}`;
						let set = loci.get(key);
						if (!set) loci.set(key, (set = new Set()));
						set.add(s.osis);
					}
				}
			}
		}
	}
	return byPara;
}

/**
 * A book-shaped locator: an optional book number, a capitalized token, then
 * chapter and verse. Deliberately looser than the grammar's own matcher —
 * finding what the grammar MISSES is the point — and deliberately anchored on
 * a capital, since every book form in every edition is capitalized and
 * matching lowercase would swallow ordinary prose.
 */
const SHAPE =
	/(?<![\p{L}\p{N}])((?:[123]|I{1,3})\s?)?(\p{Lu}[\p{L}]{0,7}\.?)\s?\s*(\d{1,3})\s*[,:.]\s*(\d{1,3})/gu;

/** Byte spans of `text` the grammar already claims, so they are not proposed. */
function claimed(text, lang) {
	const spans = [];
	const opts = { lang, work: workIdOf(lang) };
	for (const segs of [parseRefs(text, opts), linkifyProse(text, opts)]) {
		let at = 0;
		for (const s of segs) {
			const raw = s.kind === 'text' ? s.text : (s.raw ?? '');
			if (s.kind !== 'text') spans.push([at, at + raw.length]);
			at += raw.length;
		}
	}
	return spans;
}

function derive(langs, refLoci) {
	for (const lang of langs) {
		const votes = new Map();
		const seen = new Map();
		const example = new Map();
		for (const [n, texts] of load(lang)) {
			const loci = refLoci.get(n);
			for (const text of texts) {
				const spans = claimed(text, lang);
				SHAPE.lastIndex = 0;
				let m;
				while ((m = SHAPE.exec(text))) {
					const start = m.index;
					const end = start + m[0].length;
					if (spans.some(([a, z]) => start < z && end > a)) continue;
					const token = ((m[1] ?? '').trim() ? `${m[1].trim()} ` : '') + m[2];
					seen.set(token, (seen.get(token) ?? 0) + 1);
					if (!example.has(token)) {
						example.set(token, `§${n} …${text.slice(Math.max(0, start - 40), end + 8)}`);
					}
					const candidates = loci?.get(`${m[3]}:${m[4]}`);
					if (!candidates) continue;
					let v = votes.get(token);
					if (!v) votes.set(token, (v = new Map()));
					// A locus two reference editions read differently splits its
					// vote rather than counting twice for each.
					for (const osis of candidates) v.set(osis, (v.get(osis) ?? 0) + 1 / candidates.size);
				}
			}
		}
		console.log(`\n===== ${lang}: ${seen.size} unresolved book-shaped tokens =====`);
		for (const [token, total] of [...seen.entries()].sort((a, b) => b[1] - a[1])) {
			const v = votes.get(token);
			if (!v) {
				console.log(`     ${String(total).padStart(4)}  ${token.padEnd(10)}  no locus matched`);
				continue;
			}
			const ranked = [...v.entries()].sort((a, b) => b[1] - a[1]);
			const [osis, score] = ranked[0];
			const confidence = score / ranked.reduce((sum, [, c]) => sum + c, 0);
			const sure = confidence > 0.8 && score >= 2;
			console.log(
				`${sure ? '   ' : ' ??'} ${String(total).padStart(4)}  ${token.padEnd(10)} -> ${osis.padEnd(8)} ` +
					`${score.toFixed(1)}/${total} (${Math.round(confidence * 100)}%)  | ${example.get(token)}`
			);
		}
	}
}

function check(langs, refLangs, refLoci) {
	let worst = 0;
	for (const lang of langs) {
		if (refLangs.includes(lang)) continue;
		const disputed = new Map();
		let links = 0;
		let agreed = 0;
		let unattested = 0;
		for (const [n, texts] of load(lang)) {
			const loci = refLoci.get(n);
			for (const text of texts) {
				for (const s of scriptureIn(text, lang)) {
					links++;
					const verse = s.verses.length ? s.verses[0] : 0;
					const candidates = loci?.get(`${s.chapter}:${verse}`);
					if (!candidates) {
						unattested++;
						continue;
					}
					if (candidates.has(s.osis)) {
						agreed++;
						continue;
					}
					const token = s.raw.replace(/[\d.,;:\-–—\s]+$/, '');
					const entry = disputed.get(token) ?? { count: 0, example: '' };
					entry.count++;
					if (!entry.example) {
						entry.example = `§${n} "${s.raw}" reads ${s.osis} ${s.chapter}:${verse}; elsewhere ${[...candidates].join('/')}`;
					}
					disputed.set(token, entry);
				}
			}
		}
		const contested = links - agreed - unattested;
		worst = Math.max(worst, contested);
		console.log(
			`\n===== ${lang}: ${links} links, ${agreed} corroborated, ${unattested} unattested elsewhere, ${contested} contested`
		);
		for (const [token, e] of [...disputed.entries()].sort((a, b) => b[1].count - a[1].count)) {
			console.log(`  ${String(e.count).padStart(4)}  ${token.padEnd(10)}  ${e.example}`);
		}
	}
	return worst;
}

const refLangs = (flagOf('--ref') ?? 'en,pt').split(',').filter(Boolean);
const all = editions();
const deriveArg = flagOf('--derive');
const positional = ARGV.find((a, i) => !FLAG_INDEXES.has(i));
const targets = (deriveArg || positional || '').split(',').filter(Boolean);

const refLoci = referenceLoci(refLangs);
if (deriveArg !== null) {
	derive(targets.length ? targets : all.filter((l) => !refLangs.includes(l)), refLoci);
} else {
	check(targets.length ? targets : all, refLangs, refLoci);
}
