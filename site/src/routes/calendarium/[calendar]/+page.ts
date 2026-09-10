import { error } from '@sveltejs/kit';
import { CALENDAR_BY_SLUG } from '$lib/calendar/national/languages';
import type { PageLoad } from './$types';

/**
 * One country's calendar, named by the path instead of by `?c=`.
 *
 * THE SEGMENT IS A SLUG AND THE ANSWER IS A LAYER ID — `brazil` -> `br`. The
 * two vocabularies are `languages.ts`'s subject: fifteen layer ids are also
 * interface language tags, and four of those mean something else there.
 *
 * THIS LOAD FETCHES NOTHING, and there is nothing for it to fetch: the whole
 * calendar is arithmetic over the date of Easter and a table of fixed
 * celebrations (`$lib/calendar`), so what an address adds is a NAME for a
 * computation the page would do anyway. What it does instead is refuse an id
 * the layers do not answer for, which the edge has already refused
 * (`parseCalendarPath`) — reaching here with an unknown one means the two
 * tables disagree, and failing is better than rendering the general calendar
 * under a country's address.
 *
 * A HELD CALENDAR IS AN UNKNOWN ONE HERE, and `held.ts` is why that is the
 * right answer rather than a hole: a layer the oracle still disagrees with is
 * not served at any address, and `?c=` has always fallen back to the general
 * calendar for exactly the same ids.
 *
 * A TERRITORY THAT KEEPS ANOTHER'S CALENDAR HAS NO ADDRESS EITHER — `il` is
 * not a page, `ps` is. `parseCalendarPath` carries that argument; what it
 * means here is that `/calendarium?c=il` is still the way to say Israel, and
 * still shows the Latin Patriarchate's calendar.
 */
export const load: PageLoad = async ({ params, parent }) => {
	// Runs CONCURRENTLY with the layout that primes this route's indexes unless
	// it waits — `src/routes/+layout.ts` has the whole of why.
	await parent();

	const calendar = CALENDAR_BY_SLUG[params.calendar];
	if (!calendar) error(404, 'Not found');

	return { calendar };
};
