/**
 * Calendars derived but NOT published, and what each still gets wrong.
 *
 * `site/unpublished.json`'s argument, for a different kind of output: a work
 * that is held, readable, and deliberately not served. A reader cannot tell a
 * calendar that is wrong on four days from one that is right, and a liturgical
 * calendar is the one kind of output where being wrong looks exactly like
 * being right — so a country whose layer the oracle still disagrees with is
 * kept out of the picker until it does not.
 *
 * WHY THESE THIRTY-FOUR AND NOT OTHERS: they are exactly the calendars
 * `oracle.test.ts` still finds a difference in, and that test asserts the
 * list is exactly that set. So a layer that starts failing cannot be
 * published by accident, and one that is fixed cannot stay held by neglect —
 * the test fails in both directions and names the file to edit.
 *
 * THE NUMBERS ARE THE EVIDENCE AND THEY ARE SMALL. Each is out of 1,095 days
 * (three years) per calendar: most differ on one to five, and the largest is
 * seventeen. That is what makes holding them the right call rather than an
 * overreaction — the layers are close, and the remaining differences are the
 * kind that a person has to read a conference's own ordo to settle. Measured
 * 2026-09-04; re-run `npx vitest run src/lib/calendar/oracle.test.ts` after
 * touching a layer and update the row.
 *
 * The recurring causes, none of which a layer can state today:
 *
 *   - **All Souls transferred off a Sunday.** Denmark and Thailand keep the
 *     Commemoration of All the Faithful Departed on the Monday when 2
 *     November is a Sunday; the general calendar keeps it on the Sunday, and
 *     that is a rule of `year.ts` rather than a row of a layer.
 *   - **An observance suppressed by the day it falls on.** Australia and New
 *     Zealand print no ANZAC Day inside the Octave of Easter, and Indonesia\'s
 *     Independence Day replaces a Sunday outright. `Observance` has
 *     `replacesDay` and nothing for "not on a day of this rank".
 *   - **A conference that changed a transfer inside the window.** England and
 *     Wales restored Epiphany to 6 January from Advent 2025;
 *     `CalendarOptions` carries a boolean per country and not a table.
 *   - **A patronal solemnity on the LAST weekday of a month**, which
 *     `MovableRule`\'s `nth` cannot spell.
 */

export const HELD_CALENDARS: Record<string, { days: number; names: number; feed: string }> = {
	ad: { days: 10, names: 0, feed: 'ES-urge0' },
	ae: { days: 3, names: 0, feed: 'AE-arab0' },
	ao: { days: 1, names: 0, feed: 'AO' },
	au: { days: 2, names: 0, feed: 'AU' },
	ba: { days: 12, names: 0, feed: 'BA' },
	cv: { days: 8, names: 0, feed: 'CV' },
	dk: { days: 3, names: 0, feed: 'DK-kobe0' },
	ec: { days: 5, names: 0, feed: 'EC' },
	fi: { days: 5, names: 0, feed: 'FI-hels0' },
	'gb-eng': { days: 15, names: 0, feed: 'QE' },
	'gb-sct': { days: 17, names: 0, feed: 'QS' },
	'gb-wls': { days: 14, names: 1, feed: 'QW' },
	ht: { days: 3, names: 0, feed: 'HT' },
	id: { days: 3, names: 0, feed: 'ID' },
	ie: { days: 2, names: 2, feed: 'IE' },
	jp: { days: 0, names: 2, feed: 'JP' },
	mo: { days: 3, names: 0, feed: 'MO' },
	mp: { days: 3, names: 0, feed: 'MP' },
	mt: { days: 3, names: 0, feed: 'MT' },
	nz: { days: 1, names: 0, feed: 'NZ' },
	pr: { days: 4, names: 1, feed: 'PR' },
	pt: { days: 3, names: 0, feed: 'PT' },
	ru: { days: 4, names: 0, feed: 'RU' },
	rw: { days: 8, names: 0, feed: 'RW' },
	sg: { days: 3, names: 0, feed: 'SG' },
	si: { days: 3, names: 0, feed: 'SI' },
	sk: { days: 2, names: 0, feed: 'SK' },
	sm: { days: 1, names: 3, feed: 'IT-zmar5' },
	th: { days: 1, names: 0, feed: 'TH' },
	tn: { days: 3, names: 0, feed: 'TN' },
	tt: { days: 1, names: 0, feed: 'TT' },
	tw: { days: 9, names: 0, feed: 'TW' },
	ua: { days: 4, names: 0, feed: 'UA' },
	vn: { days: 1, names: 0, feed: 'VN-H' }
};
