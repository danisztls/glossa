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
 * WHY THESE AND NOT OTHERS: they are exactly the calendars `oracle.test.ts`
 * still finds a difference in, and that test asserts the list is exactly that
 * set. So a layer that starts failing cannot be published by accident, and one
 * that is fixed cannot stay held by neglect — the test fails in both
 * directions and names the file to edit.
 *
 * ## Two of the three are held by the LUNISOLAR calendar (2026-09-10)
 *
 * Macau keeps Our Lady of China and Vietnam the commemoration of ancestors on
 * the lunar new year — 29 January 2025, 17 February 2026, 6 February 2027 —
 * and **a lunisolar date is not a function of the Gregorian one**. Nothing in
 * a layer file can spell it, and the two mechanisms that look as though they
 * could are both worse than holding:
 *
 *   - **A table of years publishes a calendar that is silently wrong outside
 *     the table.** `movedInYear` is safe for All Saints because the row it
 *     overrides is the General Calendar's own date, so a year the table does
 *     not name still gets a defensible answer. Our Lady of China has no such
 *     date to fall back to: a reader asking for 2028 would be shown a Macau
 *     calendar with the feast simply absent, which is the failure this file
 *     exists to prevent, moved one year out of sight.
 *   - **Computing the Chinese calendar** is a real answer and a
 *     disproportionate one — the arithmetic is a new-moon and solar-term
 *     ephemeris, and it would be the only part of this engine that no oracle
 *     inside the three-year window could check.
 *
 * So the honest state is held, and it stays held until somebody decides the
 * ephemeris is worth having. **Wanting a date and being able to compute one
 * are different, and a table of years is what the difference looks like when
 * it is papered over.**
 *
 * ## San Marino is held by a rubric, not by a defect
 *
 * Two PROPER OBLIGATORY MEMORIALS fall on 8 November 2025 — the diocese's own
 * All Saints and Blesseds on its fixed date, and Our Lady of Mercy on the
 * second Saturday of November — and the feed prints both. Universal Norms
 * n. 60 resolves a coincidence by rank and says nothing about two celebrations
 * of equal rank, because a particular calendar is not supposed to produce one;
 * `demote` keeps the winner and omits the other, which is the reading every
 * other calendar here agrees with.
 *
 * MEASURED BEFORE IT WAS ARGUED: letting an equal-ranked memorial survive was
 * tried and reported divergences on twenty-odd other calendars, so it is a
 * rule about San Marino and not a rule this engine had got wrong. One day in
 * 1,095 is what it costs.
 *
 * ## The numbers are the evidence and they are small
 *
 * Each is out of 1,095 days (three years) per calendar. `names` is separate
 * because a `days: 0` row would be held by a disagreement about WORDS, and the
 * question to ask of one is which book each side is copying — Japan was such a
 * row and left this list on 2026-09-06 for `ACCEPTED_VARIANTS`. Measured
 * 2026-09-10; re-run `npm run verify:calendar` after touching a layer and
 * update the row.
 */

export const HELD_CALENDARS: Record<string, { days: number; names: number; feed: string }> = {
	mo: { days: 3, names: 0, feed: 'MO' },
	sm: { days: 1, names: 0, feed: 'IT-zmar5' },
	vn: { days: 1, names: 0, feed: 'VN-H' }
};
