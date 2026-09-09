/**
 * The `CompactRun` accessors in `corpus-index.ts`.
 *
 * They exist so that reading the index tier does not materialise it (see
 * `BibleChapterMeta`), which means every one of them is a hand-written
 * shortcut past `expandRun`. So the test that matters is not a table of
 * examples but AGREEMENT: for any run, in either stored shape, each accessor
 * must answer exactly what the expanded array answered before it — that being
 * the code these replaced, verbatim, in the `expected` half below.
 *
 * The gapped cases are the corpus's real ones, named in `expandRun`'s own
 * docblock: Douay-Rheims Ps 115 and Ps 147 begin at verses 10 and 12, and
 * Wis 18 skips 25. A bare count cannot express any of them, which is why the
 * array branch is not dead code.
 */
import { describe, expect, it } from 'vitest';
import {
	expandRun,
	runAdjacent,
	runAt,
	runHas,
	runHasInRange,
	runLast,
	runLength,
	type CompactRun
} from './corpus-index';

/** Every shape the index tier stores, plus the pathological ends. */
const RUNS: CompactRun[] = [
	0,
	1,
	31,
	150,
	[10, 11, 12, 13],
	[12, 13, 14, 15, 16, 17, 18, 19, 20],
	[1, 2, 3],
	[25],
	[]
];

/** `expandRun` and nothing else — one long chapter, so a probe walks past
 *  both ends of every run above. */
const PROBES = [-1, 0, 1, 2, 24, 25, 26, 31, 150, 151];

describe('CompactRun accessors agree with the expansion they replace', () => {
	for (const run of RUNS) {
		const label = Array.isArray(run) ? `[${run.join(',')}]` : String(run);
		const expanded = expandRun(run);

		it(`runLength(${label})`, () => {
			expect(runLength(run)).toBe(expanded.length);
		});

		it(`runLast(${label})`, () => {
			// What `refs.ts`'s `lastVerseOf` did: undefined on an empty run,
			// the largest number otherwise.
			const expected = expanded.length === 0 ? undefined : Math.max(...expanded);
			expect(runLast(run)).toBe(expected);
		});

		it(`runAt(${label}, i)`, () => {
			for (const i of PROBES) expect(runAt(run, i)).toBe(expanded[i]);
		});

		it(`runHas(${label}, n)`, () => {
			// What `refs.ts`'s `exists` did.
			for (const n of PROBES) {
				expect(runHas(run, n)).toBe(expanded.some((v) => v === n));
			}
		});

		it(`runAdjacent(${label}, n, direction)`, () => {
			// What `corpus.ts`'s now-deleted `adjacentInSorted` did, verbatim.
			for (const n of PROBES) {
				expect(runAdjacent(run, n, 'next')).toBe(expanded.find((x) => x > n));
				expect(runAdjacent(run, n, 'prev')).toBe([...expanded].reverse().find((x) => x < n));
			}
		});

		it(`runHasInRange(${label}, from, to)`, () => {
			// What `citation-label.ts`'s `addressResolves` did.
			for (const from of PROBES) {
				for (const to of PROBES) {
					expect(runHasInRange(run, from, to)).toBe(
						from > to ? false : expanded.some((v) => v >= from && v <= to)
					);
				}
			}
		});
	}
});

describe('the questions a citation actually asks', () => {
	it('a bare count holds every verse from 1 to n and nothing outside it', () => {
		expect(runHas(31, 1)).toBe(true);
		expect(runHas(31, 31)).toBe(true);
		expect(runHas(31, 32)).toBe(false);
		expect(runHas(31, 0)).toBe(false);
	});

	it('refuses a verse a gapped chapter does not print', () => {
		// Wis 18 skips 25 — the case a max-verse bound would mislink, which is
		// why `compactRun` is lossless (see its docblock in sync-corpus.mjs).
		const wis18 = [...Array(24)].map((_, i) => i + 1).concat([26, 27, 28, 29]);
		expect(runHas(wis18, 24)).toBe(true);
		expect(runHas(wis18, 25)).toBe(false);
		expect(runHas(wis18, 26)).toBe(true);
		expect(runLast(wis18)).toBe(29);
	});

	it('a chapter starting past verse 1 carries no span below its start', () => {
		// Douay-Rheims Ps 147 begins at verse 12.
		const ps147 = [12, 13, 14, 15, 16, 17, 18, 19, 20];
		expect(runHasInRange(ps147, 1, 11)).toBe(false);
		expect(runHasInRange(ps147, 1, 12)).toBe(true);
		expect(runHas(ps147, 1)).toBe(false);
	});

	it('an empty run is a real answer and not a missing field', () => {
		expect(runLength(0)).toBe(0);
		expect(runLast(0)).toBeUndefined();
		expect(runHas(0, 1)).toBe(false);
		expect(runHasInRange(0, 1, 100)).toBe(false);
	});

	it('walks a bare count by position, for randomVerse', () => {
		expect(runAt(31, 0)).toBe(1);
		expect(runAt(31, 30)).toBe(31);
		expect(runAt(31, 31)).toBeUndefined();
		expect(runAt(31, -1)).toBeUndefined();
	});
});
