/**
 * The rules, checked against the crawl they replace.
 *
 * `table.json`'s `days` map is the ORACLE for `rules.ts` — the thing
 * `index.ts` said it would become on the day arithmetic replaced it. Every
 * date USCCB printed a number for is replayed through `olmNumbersFor`, and a
 * rule that answers differently fails here rather than on a reader's page.
 *
 * IT IS IN THE HERMETIC SUITE, unlike the OLM scan oracle beside it, because
 * it needs no corpus: `table.json` is committed and the calendar is computed.
 */

import { describe, expect, it } from 'vitest';
import oracle from './days.oracle.json';
import { liturgicalDay } from '../calendar/index';
import { NATIONAL_CALENDARS } from '../calendar/national/index';
import { olmNumbersFor, SANCTORAL } from './rules';

// The numbers were read off USCCB's pages, so the day each was printed under
// is the day the UNITED STATES' calendar keeps.
const OPTIONS = { nationalCalendar: NATIONAL_CALENDARS.us };

/**
 * What the crawl recorded, as a set of single numbers.
 *
 * The source writes a day's sets three ways and all three have to come apart:
 * `520/317` is proper over ferial, `37 and 38` is Palm Sunday's procession and
 * Mass, and a bare number is itself.
 */
function recorded(numbers: string[]): Set<string> {
	const out = new Set<string>();
	for (const raw of numbers)
		for (const part of raw.split(/\s*(?:\/|\band\b)\s*/)) {
			if (part) out.add(part);
		}
	return out;
}

/**
 * Days where the CALENDAR, not this module, disagrees with USCCB.
 *
 * 19 March 2028 is the Third Sunday of Lent, so St Joseph is impeded. USCCB
 * transfers him FORWARD to the Monday, which is what the Universal Norms
 * require of a solemnity a Lenten Sunday impedes; `$lib/calendar` transfers him
 * backward to the Saturday. Listed here rather than tolerated silently, because
 * the fix belongs in the calendar and this file is what found it.
 */
const CALENDAR_DIVERGENCE = new Set(['2028-03-18', '2028-03-20']);

describe('the OLM rules against the crawled days', () => {
	const days = oracle.days as Record<string, string[]>;

	it('has an oracle to check against', () => {
		expect(Object.keys(days).length).toBeGreaterThan(700);
		expect(Object.keys(SANCTORAL).length).toBeGreaterThan(40);
	});

	it('names a number the source also printed, on nearly every day', () => {
		const missed: string[] = [];
		let checked = 0;
		for (const [date, numbers] of Object.entries(days)) {
			const day = liturgicalDay(date, OPTIONS);
			if (!day) continue;
			if (CALENDAR_DIVERGENCE.has(date)) continue;
			checked += 1;
			const want = recorded(numbers);
			const got = olmNumbersFor(day);
			// The claim is agreement on at least one set: a day can carry a proper
			// and a ferial, and the source prints one, both, or an alternative.
			if (!got.some((n) => want.has(n)))
				missed.push(
					`${date} ${day.season}/${day.week} ` +
						`${day.celebration.id} want ${[...want].join('|')} got ${got.join('|') || '-'}`
				);
		}
		const rate = ((checked - missed.length) / checked) * 100;
		console.info(`  olm rules: ${checked - missed.length}/${checked} days (${rate.toFixed(1)}%)`);
		for (const m of missed.slice(0, 40)) console.info(`    ${m}`);
		// A FLOOR, and a tight one: the rules reproduced 808 of the 808 comparable
		// days when this was written. Anything above zero is a rule that has
		// stopped describing the book.
		expect(missed).toEqual([]);
	});
});
