import { describe, expect, it } from 'vitest';
import { isDivergentBook, resolveVulgate, toVulgateCandidates } from './versification';

/**
 * Ground truth pulled from the real corpus (`corpus/build/bible.cpdv.en`),
 * not textbook numbers — every value here was checked with `jq` against
 * the actual shipped Bible files as part of building this module (see
 * versification.ts's docblock for the measurement methodology). Used both
 * to assert exact chapter/verse mappings and, in the "never out of range"
 * block below, as the existence oracle for the corpus invariant.
 */
// The compact rows are the point: this is a measured table, and one psalm per
// line buries which chapters carry a note and which do not. Prettier only
// honours `// prettier-ignore` alone on the line directly above, so keep the
// reason here and the pragma bare -- it used to read `}; // fmt: skip`, which
// is ruff's spelling and prettier silently ignored.
// prettier-ignore
const REAL_VULGATE_PS_MAX_VERSE: Record<number, number> = {
	1: 6, 2: 13, 3: 9, 8: 10,
	9: 39, // Heb 9 (21v) + Heb 10 (18v) merged
	10: 8,
	21: 32, 26: 14, 41: 12, 50: 21, 54: 24, 68: 37, 88: 53, 101: 29, 106: 43,
	112: 9, 113: 26, // 112: top of the 11-113 shift range; 113: Heb 114 (8v) + Heb 115 (18v) merged
	114: 9, // Heb 116:1-9
	115: 10, // Heb 116:10-19
	116: 2, // bottom of the 117-146 shift range
	118: 176, 123: 8, 138: 24, 145: 10,
	146: 11, // Heb 147:1-11
	147: 9, // Heb 147:12-20
	148: 14, 150: 6
};

const REAL_VULGATE_MAL_MAX_VERSE: Record<number, number> = { 1: 14, 2: 17, 3: 18, 4: 6 };
const REAL_VULGATE_JOEL_MAX_VERSE: Record<number, number> = { 1: 20, 2: 32, 3: 21 };

function psExists(osis: string, chapter: number, verse?: number): boolean {
	if (osis !== 'ps') return false;
	const max = REAL_VULGATE_PS_MAX_VERSE[chapter];
	if (max === undefined) return false;
	return verse === undefined || (verse >= 1 && verse <= max);
}

function malExists(osis: string, chapter: number, verse?: number): boolean {
	if (osis !== 'mal') return false;
	const max = REAL_VULGATE_MAL_MAX_VERSE[chapter];
	if (max === undefined) return false;
	return verse === undefined || (verse >= 1 && verse <= max);
}

describe('toVulgateCandidates — Psalms', () => {
	it('leaves 1-8 unchanged (Hebrew and Vulgate agree)', () => {
		expect(toVulgateCandidates('ps', 3, 5)).toEqual([{ osis: 'ps', chapter: 3, verse: 5 }]);
		expect(toVulgateCandidates('ps', 8)).toEqual([{ osis: 'ps', chapter: 8, verse: undefined }]);
	});

	it('leaves 148-150 unchanged', () => {
		expect(toVulgateCandidates('ps', 150, 6)).toEqual([{ osis: 'ps', chapter: 150, verse: 6 }]);
	});

	it('shifts 11-113 down by one, verse unchanged', () => {
		expect(toVulgateCandidates('ps', 11, 1)).toEqual([{ osis: 'ps', chapter: 10, verse: 1 }]);
		expect(toVulgateCandidates('ps', 113, 26)).toEqual([{ osis: 'ps', chapter: 112, verse: 26 }]);
	});

	it('shifts 117-146 down by one, verse unchanged', () => {
		expect(toVulgateCandidates('ps', 117, 1)).toEqual([{ osis: 'ps', chapter: 116, verse: 1 }]);
		expect(toVulgateCandidates('ps', 146, 1)).toEqual([{ osis: 'ps', chapter: 145, verse: 1 }]);
	});

	it("merges Heb 9+10 into Vulg 9, offsetting Heb 10 by Heb 9's own length (21)", () => {
		expect(toVulgateCandidates('ps', 9, 1)).toEqual([{ osis: 'ps', chapter: 9, verse: 1 }]);
		expect(toVulgateCandidates('ps', 9, 21)).toEqual([{ osis: 'ps', chapter: 9, verse: 21 }]); // Heb 9's last verse
		expect(toVulgateCandidates('ps', 10, 1)).toEqual([{ osis: 'ps', chapter: 9, verse: 22 }]); // Heb 10's first verse
		expect(toVulgateCandidates('ps', 10, 18)).toEqual([{ osis: 'ps', chapter: 9, verse: 39 }]); // Heb 10's last verse = Vulg 9's last (39, verified against corpus)
	});

	it("merges Heb 114+115 into Vulg 113, offsetting Heb 115 by Heb 114's own length (8)", () => {
		expect(toVulgateCandidates('ps', 114, 8)).toEqual([{ osis: 'ps', chapter: 113, verse: 8 }]);
		expect(toVulgateCandidates('ps', 115, 1)).toEqual([{ osis: 'ps', chapter: 113, verse: 9 }]);
		expect(toVulgateCandidates('ps', 115, 18)).toEqual([{ osis: 'ps', chapter: 113, verse: 26 }]); // = Vulg 113's last (verified)
	});

	it('splits Heb 116 across Vulg 114 (vv.1-9) and Vulg 115 (vv.10-19 renumbered 1-10)', () => {
		expect(toVulgateCandidates('ps', 116, 9)).toEqual([{ osis: 'ps', chapter: 114, verse: 9 }]);
		expect(toVulgateCandidates('ps', 116, 10)).toEqual([{ osis: 'ps', chapter: 115, verse: 1 }]);
		expect(toVulgateCandidates('ps', 116, 19)).toEqual([{ osis: 'ps', chapter: 115, verse: 10 }]);
	});

	it('splits Heb 147 across Vulg 146 (vv.1-11) and Vulg 147 (vv.12-20 renumbered 1-9)', () => {
		expect(toVulgateCandidates('ps', 147, 11)).toEqual([{ osis: 'ps', chapter: 146, verse: 11 }]);
		expect(toVulgateCandidates('ps', 147, 12)).toEqual([{ osis: 'ps', chapter: 147, verse: 1 }]);
		expect(toVulgateCandidates('ps', 147, 20)).toEqual([{ osis: 'ps', chapter: 147, verse: 9 }]);
	});

	it('offers both halves, larger/first part first, for a whole-chapter reference to a split psalm', () => {
		expect(toVulgateCandidates('ps', 116)).toEqual([
			{ osis: 'ps', chapter: 114, verse: undefined },
			{ osis: 'ps', chapter: 115, verse: undefined }
		]);
		expect(toVulgateCandidates('ps', 147)).toEqual([
			{ osis: 'ps', chapter: 146, verse: undefined },
			{ osis: 'ps', chapter: 147, verse: undefined }
		]);
	});

	it('a whole-chapter reference to a merged psalm is unambiguous', () => {
		expect(toVulgateCandidates('ps', 9)).toEqual([{ osis: 'ps', chapter: 9, verse: undefined }]);
		expect(toVulgateCandidates('ps', 10)).toEqual([{ osis: 'ps', chapter: 9, verse: undefined }]);
		expect(toVulgateCandidates('ps', 114)).toEqual([
			{ osis: 'ps', chapter: 113, verse: undefined }
		]);
		expect(toVulgateCandidates('ps', 115)).toEqual([
			{ osis: 'ps', chapter: 113, verse: undefined }
		]);
	});

	// Regression cases: every one of these is a real CCC footnote citation
	// (EN or PT) that failed a real-corpus existence check before this
	// module existed, per the corpus-wide measurement in versification.ts's
	// docblock. Each mapped address below was independently confirmed to
	// exist (and, for the two content-quoted ones, to be the *right* verse)
	// in the real bible.cpdv.en corpus.
	it('resolves real CCC citations that the un-mapped chapter/verse cannot', () => {
		// ccc112: "Ps 22:14" -> Vulg 21:14 is verbatim "They have opened their
		// mouths over me, just like a lion seizing and roaring" — confirmed
		// against the real corpus text, not just existence.
		expect(toVulgateCandidates('ps', 22, 14)).toEqual([{ osis: 'ps', chapter: 21, verse: 14 }]);
		// ccc298: "Ps 51:12" -> Vulg 50:12 is verbatim "Create a clean heart
		// in me, O God" (the Miserere) — confirmed against real corpus text.
		expect(toVulgateCandidates('ps', 51, 12)).toEqual([{ osis: 'ps', chapter: 50, verse: 12 }]);
		expect(toVulgateCandidates('ps', 102, 26)).toEqual([{ osis: 'ps', chapter: 101, verse: 26 }]);
		expect(toVulgateCandidates('ps', 119, 160)).toEqual([{ osis: 'ps', chapter: 118, verse: 160 }]);
		expect(toVulgateCandidates('ps', 27, 10)).toEqual([{ osis: 'ps', chapter: 26, verse: 10 }]);
		expect(toVulgateCandidates('ps', 69, 10)).toEqual([{ osis: 'ps', chapter: 68, verse: 10 }]);
		expect(toVulgateCandidates('ps', 89, 49)).toEqual([{ osis: 'ps', chapter: 88, verse: 49 }]);
		expect(toVulgateCandidates('ps', 139, 15)).toEqual([{ osis: 'ps', chapter: 138, verse: 15 }]);
		expect(toVulgateCandidates('ps', 124, 8)).toEqual([{ osis: 'ps', chapter: 123, verse: 8 }]);
	});
});

describe('toVulgateCandidates — Malachi', () => {
	it('leaves chapters 1-2 unchanged', () => {
		expect(toVulgateCandidates('mal', 1, 11)).toEqual([{ osis: 'mal', chapter: 1, verse: 11 }]);
		expect(toVulgateCandidates('mal', 2, 7)).toEqual([{ osis: 'mal', chapter: 2, verse: 7 }]);
	});

	it('leaves chapter 3 verses 1-18 unchanged', () => {
		expect(toVulgateCandidates('mal', 3, 1)).toEqual([{ osis: 'mal', chapter: 3, verse: 1 }]);
		expect(toVulgateCandidates('mal', 3, 18)).toEqual([{ osis: 'mal', chapter: 3, verse: 18 }]);
	});

	it('maps chapter 3 verses 19-24 to chapter 4 verses 1-6 (the CCC 678 case: "Mal 3: 19")', () => {
		expect(toVulgateCandidates('mal', 3, 19)).toEqual([{ osis: 'mal', chapter: 4, verse: 1 }]);
		expect(toVulgateCandidates('mal', 3, 24)).toEqual([{ osis: 'mal', chapter: 4, verse: 6 }]);
	});

	it('offers both halves for a whole-chapter reference to chapter 3', () => {
		expect(toVulgateCandidates('mal', 3)).toEqual([
			{ osis: 'mal', chapter: 3, verse: undefined },
			{ osis: 'mal', chapter: 4, verse: undefined }
		]);
	});

	it('passes chapter 4 through unchanged (no Hebrew chapter 4 exists; must already be Vulgate)', () => {
		expect(toVulgateCandidates('mal', 4, 2)).toEqual([{ osis: 'mal', chapter: 4, verse: 2 }]);
	});
});

describe('toVulgateCandidates — Joel', () => {
	it('leaves chapter 1 and chapter 2 verses 1-27 unchanged', () => {
		expect(toVulgateCandidates('joel', 1, 1)).toEqual([{ osis: 'joel', chapter: 1, verse: 1 }]);
		expect(toVulgateCandidates('joel', 2, 27)).toEqual([{ osis: 'joel', chapter: 2, verse: 27 }]);
	});

	it('maps chapter 3 verses 1-5 to chapter 2 verses 28-32 (the CCC "Joel 3:1-5" case)', () => {
		expect(toVulgateCandidates('joel', 3, 1)).toEqual([{ osis: 'joel', chapter: 2, verse: 28 }]);
		expect(toVulgateCandidates('joel', 3, 5)).toEqual([{ osis: 'joel', chapter: 2, verse: 32 }]);
	});

	it("a whole-chapter reference to chapter 3 is unambiguous (wholly nested in Vulg 2's tail)", () => {
		expect(toVulgateCandidates('joel', 3)).toEqual([
			{ osis: 'joel', chapter: 2, verse: undefined }
		]);
	});

	it('maps chapter 4 to chapter 3 (the CCC "Joel 3-4" case, second half)', () => {
		expect(toVulgateCandidates('joel', 4, 1)).toEqual([{ osis: 'joel', chapter: 3, verse: 1 }]);
		expect(toVulgateCandidates('joel', 4, 21)).toEqual([{ osis: 'joel', chapter: 3, verse: 21 }]);
		expect(toVulgateCandidates('joel', 4)).toEqual([
			{ osis: 'joel', chapter: 3, verse: undefined }
		]);
	});
});

describe('toVulgateCandidates — non-divergent books', () => {
	it('is the identity for any book this module has no divergence data for', () => {
		expect(toVulgateCandidates('gen', 9, 16)).toEqual([{ osis: 'gen', chapter: 9, verse: 16 }]);
		expect(toVulgateCandidates('john', 3, 16)).toEqual([{ osis: 'john', chapter: 3, verse: 16 }]);
		expect(toVulgateCandidates('rev', 22)).toEqual([
			{ osis: 'rev', chapter: 22, verse: undefined }
		]);
	});

	it('always returns at least one candidate', () => {
		for (const [osis, chapter] of [
			['gen', 1],
			['ps', 1],
			['ps', 9],
			['ps', 116],
			['mal', 3],
			['joel', 3]
		] as const) {
			expect(toVulgateCandidates(osis, chapter).length).toBeGreaterThanOrEqual(1);
		}
	});
});

describe('isDivergentBook', () => {
	it('is true only for the books this module has real divergence data for', () => {
		expect(isDivergentBook('ps')).toBe(true);
		expect(isDivergentBook('mal')).toBe(true);
		expect(isDivergentBook('joel')).toBe(true);
		expect(isDivergentBook('gen')).toBe(false);
		expect(isDivergentBook('john')).toBe(false);
	});
});

describe('resolveVulgate', () => {
	it('resolves to the existing candidate for an unambiguous mapping', () => {
		expect(resolveVulgate('ps', 22, 14, psExists)).toEqual({ osis: 'ps', chapter: 21, verse: 14 });
		expect(resolveVulgate('mal', 3, 19, malExists)).toEqual({ osis: 'mal', chapter: 4, verse: 1 });
	});

	it('picks the first candidate that exists when a whole-chapter reference is ambiguous', () => {
		// Ps 116 whole-chapter: both 114 and 115 "exist" as chapters (no verse
		// to disambiguate), so the first (114) wins.
		expect(resolveVulgate('ps', 116, undefined, psExists)).toEqual({
			osis: 'ps',
			chapter: 114,
			verse: undefined
		});
	});

	it('falls through to the second candidate when the first does not exist', () => {
		// A predicate that only ever recognizes chapter 147, never 146 —
		// simulates an edition missing the first half.
		const onlyChapter147 = (osis: string, chapter: number) => osis === 'ps' && chapter === 147;
		expect(resolveVulgate('ps', 147, undefined, onlyChapter147)).toEqual({
			osis: 'ps',
			chapter: 147,
			verse: undefined
		});
	});

	it('returns undefined when no candidate exists', () => {
		expect(resolveVulgate('ps', 22, 9999, psExists)).toBeUndefined();
		expect(resolveVulgate('nope', 1, 1, psExists)).toBeUndefined();
	});
});

describe("invariant: every mapped Psalm/Malachi/Joel address is within the real corpus's actual verse range", () => {
	it("Psalms: the merge/split boundary chapters map every in-range verse within the real target chapter's verse count", () => {
		// Only sweep the chapters whose mapping is non-trivial (merges,
		// splits, and the shift range) with verse numbers that are actually
		// valid for THAT Hebrew chapter — sweeping a fixed verse range across
		// unrelated chapters would just be testing this test's own fixture,
		// not the module (e.g. Heb Ps 1 only has 6 verses at all).
		const cases: [heb: number, verses: number[]][] = [
			[9, [1, 21]], // Heb 9's own range
			[10, [1, 18]], // continues into Vulg 9 at offset 21
			[11, [1]],
			[113, [1, 9]], // top of the 11-113 shift range (-> Vulg 112, which really has 9 verses)
			[114, [1, 8]], // Heb 114's own range
			[115, [1, 18]], // continues into Vulg 113 at offset 8
			[116, [1, 9, 10, 19]], // split boundary
			[117, [1]],
			[146, [1]],
			[147, [1, 11, 12, 20]] // split boundary
		];
		for (const [heb, verses] of cases) {
			for (const verse of verses) {
				const [primary] = toVulgateCandidates('ps', heb, verse);
				const max = REAL_VULGATE_PS_MAX_VERSE[primary.chapter];
				expect(max, `no ground-truth verse count for Vulg ps ${primary.chapter}`).toBeDefined();
				expect(
					primary.verse! >= 1 && primary.verse! <= max!,
					`ps ${heb}:${verse} -> ${primary.chapter}:${primary.verse} (max ${max})`
				).toBe(true);
			}
		}
	});

	it('Malachi: every mapped verse is within the real chapter 3/4 verse counts', () => {
		for (let verse = 1; verse <= 24; verse++) {
			const [primary] = toVulgateCandidates('mal', 3, verse);
			const max = REAL_VULGATE_MAL_MAX_VERSE[primary.chapter];
			expect(
				primary.verse! >= 1 && primary.verse! <= max,
				`mal 3:${verse} -> ${primary.chapter}:${primary.verse}`
			).toBe(true);
		}
	});

	it('Joel: every mapped verse is within the real chapter 2/3 verse counts', () => {
		for (let verse = 1; verse <= 5; verse++) {
			const [primary] = toVulgateCandidates('joel', 3, verse);
			const max = REAL_VULGATE_JOEL_MAX_VERSE[primary.chapter];
			expect(
				primary.verse! >= 1 && primary.verse! <= max,
				`joel 3:${verse} -> ${primary.chapter}:${primary.verse}`
			).toBe(true);
		}
		for (let verse = 1; verse <= 21; verse++) {
			const [primary] = toVulgateCandidates('joel', 4, verse);
			const max = REAL_VULGATE_JOEL_MAX_VERSE[primary.chapter];
			expect(
				primary.verse! >= 1 && primary.verse! <= max,
				`joel 4:${verse} -> ${primary.chapter}:${primary.verse}`
			).toBe(true);
		}
	});
});

/**
 * Late merges: individual chapters whose tails run ahead of the Vulgate's
 * because the Vulgate joins two verses modern editions print separately.
 *
 * Every expectation here was verified by reading the passage at the target
 * address in BOTH shipped editions — `bible.cpdv.en` and
 * `bible.matos-soares.pt` agree on all of them. The table's own comments in
 * `versification.ts` name the passage each mapping lands on.
 */
describe('toVulgateCandidates — late-merge chapters', () => {
	it('maps the Trinitarian blessing closing 2 Corinthians', () => {
		// 2 Cor 13 has 13 verses in the Vulgate, 14 in modern editions.
		expect(toVulgateCandidates('2cor', 13, 14)).toEqual([{ osis: '2cor', chapter: 13, verse: 13 }]);
	});

	it('maps Zechariah 2, which modern editions run four verses ahead', () => {
		expect(toVulgateCandidates('zech', 2, 14)).toEqual([{ osis: 'zech', chapter: 2, verse: 10 }]);
	});

	it('maps the whole cited range in Exodus 40', () => {
		expect(toVulgateCandidates('exod', 40, 36)).toEqual([{ osis: 'exod', chapter: 40, verse: 34 }]);
		expect(toVulgateCandidates('exod', 40, 37)).toEqual([{ osis: 'exod', chapter: 40, verse: 35 }]);
		expect(toVulgateCandidates('exod', 40, 38)).toEqual([{ osis: 'exod', chapter: 40, verse: 36 }]);
	});

	it('maps verses that EXIST but are wrong, not only the one that overflowed', () => {
		// This is the point of the table. Acts 7:60 overflows a 59-verse chapter
		// and fails loudly; 7:57-59 all exist and were silently resolving one
		// verse early. Same for Matthew 17:24-26 against 17:27.
		expect(toVulgateCandidates('acts', 7, 57)).toEqual([{ osis: 'acts', chapter: 7, verse: 56 }]);
		expect(toVulgateCandidates('acts', 7, 60)).toEqual([{ osis: 'acts', chapter: 7, verse: 59 }]);
		expect(toVulgateCandidates('matt', 17, 24)).toEqual([{ osis: 'matt', chapter: 17, verse: 23 }]);
		expect(toVulgateCandidates('matt', 17, 27)).toEqual([{ osis: 'matt', chapter: 17, verse: 26 }]);
	});

	it('leaves the rest of those books alone', () => {
		// The merge is confined to one chapter's tail. Matthew and Acts are NOT
		// divergent books, and treating them as such would corrupt every other
		// reference into them.
		expect(toVulgateCandidates('matt', 5, 3)).toEqual([{ osis: 'matt', chapter: 5, verse: 3 }]);
		expect(toVulgateCandidates('matt', 17, 1)).toEqual([{ osis: 'matt', chapter: 17, verse: 1 }]);
		expect(toVulgateCandidates('acts', 2, 38)).toEqual([{ osis: 'acts', chapter: 2, verse: 38 }]);
		expect(toVulgateCandidates('2cor', 13, 13)).toEqual([{ osis: '2cor', chapter: 13, verse: 13 }]);
		expect(isDivergentBook('matt')).toBe(false);
		expect(isDivergentBook('acts')).toBe(false);
	});

	it('leaves whole-chapter references untouched', () => {
		// No verse to move.
		expect(toVulgateCandidates('acts', 7)).toEqual([
			{ osis: 'acts', chapter: 7, verse: undefined }
		]);
	});
});
