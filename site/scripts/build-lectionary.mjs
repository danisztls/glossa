/**
 * The lectionary table, derived from the corpus's USCCB reading pages.
 *
 * READS `build/usccb-readings/*.json` (written by
 * `pipeline/scrapers/lectionary.py`) AND WRITES `src/lib/lectionary/table.json`,
 * which is committed. The corpus holds what the source printed, verbatim and
 * unnormalised — the project's standing rule that the corpus stores raw
 * strings and never interpretations — and every judgment about what those
 * strings MEAN is made here, in one reviewable place, on the way out.
 *
 * ## Two tables, because they answer different questions
 *
 * `masses` is keyed by the OLM lectionary number and is the permanent half:
 * what reading set number 130 IS. That fact has no year in it, and the number
 * is the Ordo Lectionum Missae's own — USCCB prints it on every page.
 *
 * `days` maps a date to the numbers kept on it, and is INTERIM. The finished
 * design computes that from the liturgical day (season, week, cycle,
 * celebration), so it works for 2040 as readily as for 2027; this index only
 * covers the years crawled. It is kept because it is exactly the oracle those
 * rules will be checked against — an interim artifact that becomes the test
 * fixture rather than being thrown away.
 *
 * ## Normalisation, and what is deliberately not thrown away
 *
 * The source's slot labels are not a vocabulary. `Reading 1` and `Reading I`
 * are the same slot in two templates; `Alleluia` and `Verse Before the Gospel`
 * are one slot under two names, because Lent does not say Alleluia; `or` is
 * not a slot at all but an alternative to the reading above it. An unknown
 * label is REPORTED and kept raw, never dropped — a citation the site cannot
 * classify is still a citation the source printed, and silently losing one is
 * the failure this project's whole apparatus exists to prevent.
 *
 * A pericope with an EMPTY citation is kept too, and means what it says: the
 * source printed no address, because the text is not Scripture. Christmas Day
 * and the Easter sequences are the cases. Empty is "no citation", never "we
 * missed one", and the renderer has to tell those apart.
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const siteRoot = join(here, '..');
const corpusDir = process.env.CORPUS_DIR
	? process.env.CORPUS_DIR
	: join(siteRoot, '..', '..', 'glossa-corpus');
const src = join(corpusDir, 'build', 'usccb-readings');
const outDir = join(siteRoot, 'src', 'lib', 'lectionary');
/**
 * Which half of a `N/M` pair the page's readings belong to.
 *
 * NOT ALWAYS THE FIRST, which is what the OLM scan oracle caught. The source
 * writes the pair in the order it likes: `520/317` puts Timothy and Titus's
 * proper first and the ferial second, `459/650` puts the ferial first and the
 * Guardian Angels' proper second. What is stable is the book's own structure —
 * the Proper of Saints begins at 507, so a number at or above it is a proper
 * and anything below is temporal. Keyed by the first, 459 was given the Angels'
 * readings while the scan had it as a Thursday of week 26, and they shared not
 * one citation.
 */
const SANCTORAL_FIRST_NUMBER = 507;
function properOf(parts) {
	const sanctoral = parts.filter((n) => Number.parseInt(n, 10) >= SANCTORAL_FIRST_NUMBER);
	return sanctoral.length === 1 ? sanctoral[0] : parts[0];
}

const outFile = join(outDir, 'table.json');
const oracleFile = join(outDir, 'days.oracle.json');

/**
 * Roman and Arabic both appear, in different page templates. The Easter Vigil
 * runs to seven Old Testament readings, which is why this goes past two.
 */
const ORDINALS = new Map([
	['1', 1],
	['I', 1],
	['2', 2],
	['II', 2],
	['3', 3],
	['III', 3],
	['4', 4],
	['IV', 4],
	['5', 5],
	['V', 5],
	['6', 6],
	['VI', 6],
	['7', 7],
	['VII', 7]
]);

/** `or`, in the four spellings the source uses for it. */
const ALTERNATIVE = /^or:?$/i;

/**
 * A label may be prefixed with the formulary it belongs to — Palm Sunday
 * prints `At the Procession with Palms - Gospel` and `At the Mass - Reading I`
 * on ONE page, where Christmas splits its four Masses across four URLs. Both
 * shapes mean the same thing and both have to reach the same structure.
 */
const PREFIXED = /^At the (?<formulary>.+?)\s*[-–—]\s*(?<slot>.+)$/i;

/** Returns `{ slot, ordinal }`, or null when the label names no known slot. */
function classify(raw) {
	const label = raw.trim().replace(/\s+/g, ' ');
	if (!label) return null;
	if (ALTERNATIVE.test(label)) return { slot: 'alternative' };

	const reading = /^Reading(?:\s+(?<n>[IVX]+|\d+))?$/i.exec(label);
	if (reading) return { slot: 'reading', ordinal: ORDINALS.get(reading.groups.n ?? '1') ?? 1 };

	if (/^Epistle$/i.test(label)) return { slot: 'epistle' };
	if (/^Responsorial(\s+Psalm)?$/i.test(label)) return { slot: 'psalm' };
	if (/^Gospel$/i.test(label)) return { slot: 'gospel' };
	// The acclamation is one slot with two names: Lent replaces the Alleluia
	// with a verse, and both are the verse sung before the Gospel.
	if (/^Alleluia\b/i.test(label) || /^Verse before the Gospel$/i.test(label)) {
		return { slot: 'acclamation' };
	}
	// A sequence is a chant, not a lesson. Kept as its own slot rather than
	// filed with the readings, because it is not one and a reader should not
	// be told it is.
	if (/^Sequence\b/i.test(label)) return { slot: 'sequence' };
	return null;
}

/** Trailing full stops the source leaves on psalm citations, and stray space. */
function tidy(cite) {
	return cite
		.trim()
		.replace(/\s+/g, ' ')
		.replace(/\s*\.$/, '');
}

if (!existsSync(src)) {
	console.error(`build-lectionary: no ${src}\nRun: uv run pipeline/scrapers/lectionary.py`);
	process.exit(1);
}

const masses = {};
const days = {};
const unknown = new Map();
let pericopes = 0;
let unnumbered = 0;

for (const file of readdirSync(src)
	.filter((f) => f.endsWith('.json'))
	.sort()) {
	const year = JSON.parse(readFileSync(join(src, file), 'utf8'));
	for (const day of year.days) {
		const numbers = [];
		for (const mass of day.masses) {
			// A Mass with no lectionary number cannot enter the table keyed by
			// one. It is counted and reported rather than dropped in silence.
			const olm = (mass.lectionary ?? [])[0];
			if (!olm) {
				unnumbered += 1;
				continue;
			}
			numbers.push(olm);
			// THE SOURCE WRITES A DAY'S SETS THREE WAYS AND THE TABLE IS KEYED
			// BY SINGLE NUMBERS, because that is what `rules.ts` computes.
			// `520/317` is the proper over the ferial and the page prints the
			// PROPER, so the first number keys it; `37 and 38` is Palm Sunday's
			// procession and Mass, which are two formularies on one page and are
			// keyed one each, in the order printed. Keyed by the raw string
			// instead, every compound became a key nothing could ever ask for —
			// the Assumption, Timothy and Titus and Our Lady of Sorrows were all
			// in the table under names no rule produces.
			const parts = String(olm)
				.split(/\s*(?:\/|\band\b)\s*/)
				.map((n) => n.trim())
				.filter(Boolean);

			// One page can hold several formularies, told apart by a prefix on
			// the slot label. The unprefixed run is the Mass itself.
			const groups = new Map();
			let current = mass.label ?? null;
			for (const reading of mass.readings) {
				const prefixed = PREFIXED.exec(reading.slot.trim());
				const label = prefixed ? prefixed.groups.slot : reading.slot;
				if (prefixed) current = prefixed.groups.formulary.trim();

				// A row with neither a label nor a citation carries nothing at
				// all — template furniture the slot regex happened to match.
				// This is the ONE thing dropped here, and it is dropped because
				// it holds no information rather than because it is untidy.
				if (!label.trim() && !reading.cite.trim()) continue;

				const kind = classify(label);
				if (!kind) {
					unknown.set(label.trim(), (unknown.get(label.trim()) ?? 0) + 1);
				}
				const key = current ?? '';
				if (!groups.has(key)) groups.set(key, []);
				const into = groups.get(key);

				if (kind?.slot === 'alternative') {
					// An alternative belongs to the pericope above it. With
					// nothing above it, it is kept as its own unclassified row
					// rather than discarded.
					const previous = into[into.length - 1];
					if (previous) {
						(previous.orElse ??= []).push(tidy(reading.cite));
						continue;
					}
				}
				into.push({
					slot: kind && kind.slot !== 'alternative' ? kind.slot : null,
					...(kind?.ordinal ? { ordinal: kind.ordinal } : {}),
					// Kept whenever the site could not classify it, so the page
					// can print what the source called it rather than nothing.
					...(kind ? {} : { label: label.trim() }),
					cite: tidy(reading.cite)
				});
				pericopes += 1;
			}

			const rows = [...groups];
			rows.forEach(([label, readings], i) => {
				// One number per formulary where the counts agree, and the first
				// number otherwise: a `520/317` page carries one set of readings
				// and they are 520's.
				const key = rows.length === parts.length ? parts[i] : properOf(parts);
				const entry = { olm: key, readings };
				if (label) entry.label = label;
				// Two dates can carry the same OLM number — that is the point
				// of a number — and the first writing wins, with a later one
				// only checked for disagreement.
				if (!masses[key]) masses[key] = entry;
			});
		}
		if (numbers.length) days[day.date] = numbers;
	}
}

mkdirSync(outDir, { recursive: true });
// THE TABLE SHIPS `masses` AND NOT `days`. What set 130 IS has no year in it
// and is the thing the site renders; which day keeps it is arithmetic, in
// `src/lib/lectionary/rules.ts`. The date index is still written, beside it,
// as the ORACLE those rules are checked against by `rules.test.ts` — imported
// by that test and by nothing else, so it reaches no route's chunk.
writeFileSync(outFile, JSON.stringify({ masses }, null, '\t') + '\n', 'utf8');
writeFileSync(oracleFile, JSON.stringify({ days }, null, '\t') + '\n', 'utf8');

console.error(
	`build-lectionary: ${Object.keys(masses).length} numbered Mass sets, ` +
		`${Object.keys(days).length} days (oracle only), ${pericopes} pericopes -> ${outFile}`
);
if (unnumbered) console.error(`  ${unnumbered} Mass(es) with no lectionary number`);
if (unknown.size) {
	console.error(`  ${unknown.size} unrecognised slot label(s), kept raw:`);
	for (const [label, n] of [...unknown].sort((a, b) => b[1] - a[1])) {
		console.error(`    ${String(n).padStart(4)}  ${JSON.stringify(label)}`);
	}
}
