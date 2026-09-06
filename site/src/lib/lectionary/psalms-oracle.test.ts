/**
 * Every psalm verse the table cites, resolved against the Vulgate that has to
 * hold it.
 *
 * THIS EXISTS BECAUSE A GAP WAS CLAIMED AND MEASURED AWAY. `versification.ts`
 * converts the Hebrew/Vulgate CHAPTER shift and deliberately refuses the
 * verse-level one, naming the orphan-psalm table — the per-psalm list of which
 * psalms carry a superscription — as the prerequisite, on the grounds that one
 * wrong row silently produces a plausible wrong link. `lectionary.md` recorded
 * USCCB's psalms as the consumer that would finally need it.
 *
 * They are not. The NAB counts a superscription as a verse exactly as the
 * Vulgate does, so the chapter shift alone lands every citation on the right
 * text and the verse number never moves. The evidence is the whole point of
 * this file rather than a sentence in a docblock: `Psalm 51:3` is the Miserere
 * and `Psalm 4:2` is `Cum invocarem`, both a verse the KJV convention would
 * have called 1, and about twenty psalms whose title IS its own verse agree.
 *
 * What the check asserts is weaker than that reading and is what a machine can
 * hold: every cited verse EXISTS at the mapped address. An offset in either
 * direction walks a citation off the end of a psalm often enough to fail here
 * — the psalms are short — and a wholesale convention change would fail on
 * nearly all of them at once.
 *
 * WITHOUT A CORPUS IT ASSERTS NOTHING AND SAYS SO, like the two oracles beside
 * it. Run by `npm run verify:lectionary`.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { toVulgateCandidates } from '../versification';
import table from './table.json';

const CORPUS_DIR =
	process.env.CORPUS_DIR ??
	join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..', '..', 'glossa-corpus');
const PSALMS = join(CORPUS_DIR, 'build', 'bible.clementina.la', 'books', 'ps.json');
const HAVE_PSALMS = existsSync(PSALMS);

/**
 * A citation's chapter and its verse numbers, or null when it is not a psalm.
 *
 * Only the FIRST chapter's verses are taken. `Psalm 42:3, 5; 43:3, 4` is one
 * citation spanning two psalms, and reading 43 as a verse of 42 is how a
 * throwaway sweep of this invented three failures that were not there.
 */
function psalmVerses(cite: string): { chapter: number; verses: number[] } | null {
	const m = /^(?:Psalms?|Ps)\s*(\d+)\s*:\s*([^;]*)/.exec(cite);
	if (!m) return null;
	const verses = [...m[2].matchAll(/\d+/g)].map((d) => Number(d[0]));
	return verses.length ? { chapter: Number(m[1]), verses } : null;
}

describe.skipIf(!HAVE_PSALMS)('the table’s psalms need no verse-level offset', () => {
	// Lazy: `describe.skipIf` still runs this callback, so a read at module
	// scope would throw on a machine with no corpus instead of skipping.
	const counts = (): Map<number, number> => {
		const book = JSON.parse(readFileSync(PSALMS, 'utf8')) as {
			chapters: { verses: { n: number }[] }[];
		};
		return new Map(book.chapters.map((c, i) => [i + 1, Math.max(...c.verses.map((v) => v.n))]));
	};

	it('has a Vulgate psalter to check against', () => {
		expect(counts().size).toBe(150);
	});

	it('lands every cited verse inside the psalm it maps to', () => {
		const verseCount = counts();
		const cites = Object.entries(table.masses as Record<string, { readings: { cite: string }[] }>)
			.flatMap(([olm, mass]) => mass.readings.map((r) => [olm, r.cite] as const))
			.map(([olm, cite]) => [olm, cite, psalmVerses(cite)] as const)
			.filter(
				(row): row is readonly [string, string, { chapter: number; verses: number[] }] =>
					row[2] !== null
			);

		const missed: string[] = [];
		for (const [olm, cite, { chapter, verses }] of cites) {
			for (const verse of verses) {
				const candidates = toVulgateCandidates('ps', chapter, verse);
				const ok = candidates.some(
					(c) => c.verse !== undefined && c.verse <= (verseCount.get(c.chapter) ?? 0)
				);
				if (!ok) {
					const where = candidates
						.map((c) => `Ps ${c.chapter}:${c.verse} of ${verseCount.get(c.chapter)}`)
						.join(' / ');
					missed.push(`olm ${olm}  ${cite}  v${verse} -> ${where}`);
				}
			}
		}

		// ZERO, not a threshold. The one citation that overran on this check's
		// first run was Psalm 56's tail against a 13-verse Vulgate Ps 55, and
		// it was a real defect with a real fix (three `LATE_MERGE` rows), not
		// noise to be tolerated. A tolerance here would have hidden it, and
		// would hide the next one — which is the argument the module's own
		// docblock makes about the verses that fail QUIETLY.
		if (missed.length) console.error(`  psalm verses outside their chapter:\n${missed.join('\n')}`);
		expect(cites.length).toBeGreaterThan(400);
		expect(missed).toEqual([]);
	});
});
