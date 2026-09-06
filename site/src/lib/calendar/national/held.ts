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
 * ## What is left, classified against the days themselves (2026-09-06)
 *
 * Read off all 96 remaining divergent days rather than inferred, because the
 * list this replaces was inferred and was wrong about the largest group. Each
 * heading names the calendars it accounts for; the rows below carry the
 * numbers, which is where a count belongs.
 *
 *   - **A PROPER THE COUNTRY PLACES BY A RULE AND THE LAYER PLACES BY A
 *     DATE — the biggest group by far** (`ad ae ao au ht mo mp mt pt rw sg si
 *     tn tw vn`, and Wales's Saint David). A patronal or dedication feast
 *     lands on a date the derivation read off one year, and the country moves
 *     it: the Emirates keep the Dedication of the Churches of the Vicariate
 *     on the LAST Sunday of October, which `MovableRule`'s `nth` cannot
 *     spell. **Two of them are not solvable by any rule in this file's
 *     vocabulary at all**: Macau keeps Our Lady of China and Vietnam the
 *     commemoration of ancestors on the LUNAR new year — 29 January 2025,
 *     17 February 2026, 6 February 2027 — and a lunisolar date is not a
 *     function of the Gregorian one. Those two want a table of years.
 *   - **All Souls kept on another day** (`dk fi gb-eng gb-sct gb-wls rw th`).
 *     THE THREE COUNTRIES DO NOT SHARE A RULE, which is why the old entry
 *     here calling it "transferred off a Sunday" was too tidy: Denmark keeps
 *     it on the Monday after the Sunday All Saints is kept (3 Nov 2025,
 *     2 Nov 2026, 8 Nov 2027), Finland on the Saturday falling 31 October to
 *     6 November (1 Nov 2025, 31 Oct 2026, 6 Nov 2027), and England and Wales
 *     move it only off a Sunday. So it is `movedInYear` data and not a rule —
 *     and the derivation cannot yet write it, because All Souls reaches it
 *     from the feed UNRANKED and is classified as a ferial or an observance
 *     rather than as a general celebration that moved. Two moving parts: a
 *     case in the generator, and `year.ts` honouring `movedInYear` for a day
 *     it places specially.
 *   - **The Immaculate Heart as a national solemnity, and Saint Irenaeus
 *     displaced by it** (`cv ec tt`). Both keep the Immaculate Heart at a
 *     rank the general calendar does not give it, on a date that then moves
 *     Irenaeus; the layers state half of it.
 *   - **A duplicated Newman** (`cv ie pt`). These print Saint John Henry
 *     Newman twice — the general calendar's and a proper the derivation added
 *     beside it — and Ireland's proper still calls him `priest` where the
 *     general calendar has said `Priest and Doctor of the Church` since he was
 *     proclaimed one on 1 November 2025. A DERIVATION DEFECT, not an engine
 *     one: the same celebration resolved to an id and to a stranger.
 *   - **Epiphany transferred in 2025 only** (`gb-eng gb-wls`). The layers now
 *     carry the right `movedInYear` row and it changes nothing, because
 *     `movedInYear` reaches the sanctorale and not the temporal cycle. The
 *     conference did change its mind — England and Wales restored Epiphany to
 *     6 January from Advent 2025 — so the fact is real and only the mechanism
 *     is missing.
 *   - **An observance suppressed by the day it falls on** (`au id nz`).
 *     Australia and New Zealand print no ANZAC Day inside the Octave of
 *     Easter, and Indonesia's Independence Day replaces a Sunday outright.
 *     `Observance` has `replacesDay` and nothing for "not on a day of this
 *     rank". The one entry from the old list that survived it unchanged.
 *   - **Ember Days that still double, or sort differently** (`ad ba sk`).
 *     `replacesDay` fires where the day's winner is a WEEKDAY, so a memorial
 *     that wins the day still prints beside the Ember Day; Slovakia's Advent
 *     pair also comes out in the other order. Andorra's are not in the layer
 *     at all.
 *   - **A handful that are their own case** (`pr sm tw ua`): a rank or colour
 *     that differs where both sides print the same name, two propers on one
 *     day, and a blessing day this calendar emits where the feed does not.
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
