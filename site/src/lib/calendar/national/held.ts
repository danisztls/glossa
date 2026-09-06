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
 * WHY THESE THIRTY-TWO AND NOT OTHERS: they are exactly the calendars
 * `oracle.test.ts` still finds a difference in, and that test asserts the
 * list is exactly that set. So a layer that starts failing cannot be
 * published by accident, and one that is fixed cannot stay held by neglect —
 * the test fails in both directions and names the file to edit.
 *
 * JAPAN LEFT THIS LIST ON 2026-09-06 AND IS THE SHAPE TO LOOK FOR NEXT. It
 * was the only row here with `days: 0` — the engine agreed about the rank,
 * colour and precedence of all 1,095 days — and what held it was two names
 * for one celebration, 10 September, where this site prints the form the
 * Japanese Church's own calendars print and GCatholic names the same group of
 * martyrs by its leader. That is a row for `ACCEPTED_VARIANTS`, not a defect:
 * a `days: 0` calendar is held by a disagreement about WORDS, and the
 * question to ask of one is which book each side is copying.
 *
 * THE NUMBERS ARE THE EVIDENCE AND THEY ARE SMALL. Each is out of 1,095 days
 * (three years) per calendar: most differ on one to five, and the largest is
 * eight. That is what makes holding them the right call rather than an
 * overreaction — the layers are close, and the remaining differences are the
 * kind that a person has to read a conference's own ordo to settle. Measured
 * 2026-09-06; re-run `npm run verify:calendar` after touching a layer and
 * update the row.
 *
 * TWO FIFTHS OF THE DIVERGENCES WERE THE DERIVATION'S AND NOT THE ENGINE'S
 * (2026-09-06, 155 days down to 96), and both defects were in the generator
 * rather than in `year.ts`:
 *
 *   - **A standing `moves` row written from ONE year's sighting.** England
 *     kept Saint George on 28 April for ever because 23 April 2025 fell
 *     inside the Octave of Easter, and Scotland kept Saint Andrew on
 *     1 December because 30 November 2025 was the First Sunday of Advent —
 *     both the engine's n. 60 to work out, neither anything a conference did.
 *     A standing move now needs every year that could have contradicted it,
 *     and a year the celebration is absent from contradicts nothing. Scotland
 *     went from seventeen divergent days to one, and Russia to none.
 *   - **`replacesDay` computed and then dropped on the way to the file**,
 *     which is worse than never computing it: the analysis had the answer,
 *     `Observance` had the field and `year.ts` had the branch, and only the
 *     renderer's line was missing — so Spain looked like the only country
 *     whose Ember Days replace the ferial day, because Spain is hand-written.
 *     Bosnia went from twelve to three.
 *
 * **The lesson is not about calendars: a generator that turns one observation
 * into a standing rule, or computes an answer it does not print, writes
 * layers that read as engine defects — and the engine is where everybody then
 * looks.**
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
	ad: { days: 6, names: 0, feed: 'ES-urge0' },
	ae: { days: 3, names: 0, feed: 'AE-arab0' },
	ao: { days: 1, names: 0, feed: 'AO' },
	au: { days: 4, names: 0, feed: 'AU' },
	ba: { days: 3, names: 0, feed: 'BA' },
	cv: { days: 8, names: 0, feed: 'CV' },
	dk: { days: 3, names: 0, feed: 'DK-kobe0' },
	ec: { days: 5, names: 0, feed: 'EC' },
	fi: { days: 5, names: 0, feed: 'FI-hels0' },
	'gb-eng': { days: 3, names: 0, feed: 'QE' },
	'gb-sct': { days: 1, names: 0, feed: 'QS' },
	'gb-wls': { days: 6, names: 1, feed: 'QW' },
	ht: { days: 3, names: 0, feed: 'HT' },
	id: { days: 1, names: 0, feed: 'ID' },
	ie: { days: 2, names: 2, feed: 'IE' },
	mo: { days: 3, names: 0, feed: 'MO' },
	mp: { days: 3, names: 0, feed: 'MP' },
	mt: { days: 3, names: 0, feed: 'MT' },
	nz: { days: 1, names: 0, feed: 'NZ' },
	pr: { days: 1, names: 1, feed: 'PR' },
	pt: { days: 3, names: 0, feed: 'PT' },
	rw: { days: 4, names: 0, feed: 'RW' },
	sg: { days: 3, names: 0, feed: 'SG' },
	si: { days: 3, names: 0, feed: 'SI' },
	sk: { days: 2, names: 0, feed: 'SK' },
	sm: { days: 1, names: 3, feed: 'IT-zmar5' },
	th: { days: 1, names: 0, feed: 'TH' },
	tn: { days: 3, names: 0, feed: 'TN' },
	tt: { days: 1, names: 0, feed: 'TT' },
	tw: { days: 5, names: 0, feed: 'TW' },
	ua: { days: 4, names: 0, feed: 'UA' },
	vn: { days: 1, names: 0, feed: 'VN-H' }
};
