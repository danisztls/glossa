import { describe, expect, it } from 'vitest';
import { marianAntiphonSlug, rosaryGroupFor, runIsBroken } from './liturgy';
import type { LiturgicalDay, Season } from './calendar/types';
import type { Prayer, PrayerGroupEntry } from './types';

/** A day is a big shape and these three functions read one field of it each,
 *  so it is built rather than imported: `liturgicalDay` would tie a test about
 *  a rubric to the calendar's own arithmetic. */
function dayIn(season: Season): LiturgicalDay {
	return { season } as LiturgicalDay;
}

function group(name: string, days?: number[]): PrayerGroupEntry {
	return { name, rubric: null, items: [], ...(days ? { days } : {}) };
}

describe('marianAntiphonSlug', () => {
	it('says the Regina Caeli through Easter Time and the Angelus otherwise', () => {
		// The substitution runs from Easter Sunday to Pentecost inclusive, which
		// is exactly the extent of `season: 'easter'` — the Triduum ends at
		// Evening Prayer on Easter Sunday and Pentecost is the season's last day.
		expect(marianAntiphonSlug(dayIn('easter'))).toBe('regina-caeli');
		for (const season of ['advent', 'christmas', 'lent', 'triduum', 'ordinary'] as const) {
			expect(marianAntiphonSlug(dayIn(season)), season).toBe('angelus');
		}
	});
});

describe('rosaryGroupFor', () => {
	const rosary = {
		groups: [
			group('The Joyful Mysteries', [1, 6]),
			group('The Mysteries of Light', [4]),
			group('The Sorrowful Mysteries', [2, 5]),
			group('The Glorious Mysteries', [3, 7])
		]
	} as Prayer;

	it('picks the set the corpus assigns to that weekday', () => {
		// ISO numbering, Monday 1 to Sunday 7 — the corpus's own, written by the
		// scraper out of the rubric so that this site does not have to read
		// "(recited Monday and Saturday)" in fourteen languages.
		expect(rosaryGroupFor(rosary, 1)?.name).toBe('The Joyful Mysteries');
		expect(rosaryGroupFor(rosary, 6)?.name).toBe('The Joyful Mysteries');
		expect(rosaryGroupFor(rosary, 7)?.name).toBe('The Glorious Mysteries');
	});

	it('answers nothing where the corpus does not say', () => {
		// A prayer with no groups, no prayer at all, and a corpus written before
		// `days` existed: three ways to have no answer, and the page shows the
		// Rosary without singling out a set for all three.
		expect(rosaryGroupFor(undefined, 1)).toBeUndefined();
		expect(rosaryGroupFor({} as Prayer, 1)).toBeUndefined();
		expect(
			rosaryGroupFor({ groups: [group('The Joyful Mysteries')] } as Prayer, 1)
		).toBeUndefined();
	});
});

describe('runIsBroken', () => {
	const run = (osis: string, chapter: number, from: number, to: number) => ({
		osis,
		book: osis,
		chapter,
		verses: Array.from({ length: to - from + 1 }, (_, i) => ({ n: from + i, text: '' }))
	});

	it('marks a gap the citation left inside one chapter', () => {
		// `Ps 95:1-2, 6-7` skips three verses, and text set continuously over
		// the join would say something the citation does not.
		const runs = [run('ps', 95, 1, 2), run('ps', 95, 6, 7)];
		expect(runIsBroken(runs, 0)).toBe(false);
		expect(runIsBroken(runs, 1)).toBe(true);
	});

	it('marks a change of book', () => {
		// `1 Sm 3:9; Jn 6:68c` — one acclamation, two books, and nothing joins
		// them but the citation.
		expect(runIsBroken([run('1sam', 3, 9, 9), run('john', 6, 68, 68)], 1)).toBe(true);
	});

	it('leaves consecutive verses and a chapter crossing alone', () => {
		expect(runIsBroken([run('ps', 95, 1, 2), run('ps', 95, 3, 4)], 1)).toBe(false);
		// A crossing is continuous text; the chapter number printed on the first
		// verse of the new run is what marks it.
		expect(runIsBroken([run('gen', 1, 10, 31), run('gen', 2, 1, 2)], 1)).toBe(false);
	});
});
