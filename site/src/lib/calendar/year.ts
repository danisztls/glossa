/**
 * Assembling a liturgical year: the Proper of Time, the Proper of Saints, and
 * the rule that decides which of two celebrations on one day is kept.
 *
 * ## Occurrence, in one sentence
 *
 * Everything that could fall on a day is collected, the lowest number in the
 * Table of Liturgical Days (Universal Norms n. 59) wins, and what the losers
 * become depends on what beat them. That last clause is the part worth
 * reading, because a memorial does not simply vanish: on a Lenten weekday it
 * is kept as a *commemoration*, and only against a Sunday or a feast is it
 * dropped altogether.
 *
 * ## What was measured rather than assumed
 *
 * Four rules here were settled by reading the oracle (see `oracle.test.ts`)
 * instead of by reasoning from the Norms' wording, because in each case the
 * wording admits more than one implementation:
 *
 *  - **Commemorations are not only a Lenten thing.** The Norms discuss them
 *    under Lent (n. 14), and the same reduction happens on the privileged
 *    weekdays of 17–24 December and within the Christmas octave. Measured:
 *    Peter Canisius on 21 December and Sylvester on 31 December come out as
 *    commemorations in all three oracle years.
 *  - **The psalter week is per season and not one running count.** See
 *    `psalterWeek` below, where each season's rule is given with the dates
 *    that establish it.
 *  - **An impeded solemnity moves FORWARD** to the first day free of lines
 *    1–8, which is what puts the Annunciation of 2027 — 25 March, Holy
 *    Thursday that year — on Monday 5 April, after the Octave of Easter.
 *  - **The Saturday memorial of the Blessed Virgin Mary** is offered on every
 *    Saturday in Ordinary Time that nothing else claims, which is some forty
 *    a year and the commonest optional memorial in the calendar.
 */

import {
	SATURDAY,
	SUNDAY,
	type DayNumber,
	after,
	formatIsoDate,
	fromDayNumber,
	toDayNumber,
	weekday
} from './computus';
import { ALL_SOULS, GRC, HOLY_DAYS_OF_OBLIGATION, SATURDAY_MEMORIAL_OF_MARY } from './grc';
import { anchors, sundayCycle, temporalYear, weekdayCycle, type Anchors } from './temporal';
import { PRECEDENCE, type CalendarOptions, type Celebration, type LiturgicalDay } from './types';

/** The two celebrations the Proper of Saints places by Easter and not by a
 *  date. Both are memorials, and both were added to the Calendar after 1969 —
 *  the Immaculate Heart in 2000, Mary Mother of the Church in 2018. */
const MOVABLE_SANCTORAL: ReadonlyArray<{ at: keyof Anchors; celebration: Celebration }> = [
	{
		at: 'immaculateHeart',
		celebration: {
			id: 'immaculate-heart',
			names: {
				la: 'Immaculati Cordis Beatae Mariae Virginis',
				en: 'The Immaculate Heart of the Blessed Virgin Mary',
				pt: 'Imaculado Coração da Bem-Aventurada Virgem Maria'
			},
			rank: 'memorial',
			precedence: PRECEDENCE.MEMORIAL,
			colour: 'white'
		}
	},
	{
		at: 'maryMotherOfChurch',
		celebration: {
			id: 'mary-mother-of-the-church',
			names: {
				la: 'Beatae Mariae Virginis, Ecclesiae Matris',
				en: 'The Blessed Virgin Mary, Mother of the Church',
				pt: 'Bem-Aventurada Virgem Maria, Mãe da Igreja'
			},
			rank: 'memorial',
			precedence: PRECEDENCE.MEMORIAL,
			colour: 'white'
		}
	}
];

/** `MM-DD` for a day number — the key the Proper of Saints is stored by. */
function monthDay(n: DayNumber): string {
	const { month, day } = fromDayNumber(n);
	return `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * The week of the four-week psalter, per season.
 *
 * NOT ONE RUNNING COUNT, which is the obvious implementation and is wrong in
 * three places. Each season restarts, and two of them do not restart on the
 * boundary a reader would expect:
 *
 *  - **Ordinary Time, Advent, Lent and Easter** take `((week − 1) mod 4) + 1`
 *    off the season's own week number. Lent week 5 is psalter I again, and
 *    Holy Week is II.
 *  - **The days from Ash Wednesday to the Saturday after** are not yet in a
 *    numbered week of Lent and keep psalter IV. (2026: Ash Wednesday, 18
 *    February, is IV, where the Sixth Sunday in Ordinary Time before it was
 *    II — so it is not a continuation either.)
 *  - **Christmas Time** keeps Advent's fourth week until the first Sunday
 *    after Christmas and then counts I, II, III from there. Christmas always
 *    falls within six days of the Fourth Sunday of Advent, so the days before
 *    that Sunday are always IV.
 *  - **The Octave of Easter is eight days of psalter I**, so the Second
 *    Sunday of Easter is I although the weekdays after it are II. Pentecost
 *    is I as well, where its week number would give IV.
 */
function psalterWeek(
	n: DayNumber,
	season: string,
	week: number,
	a: Anchors,
	firstSundayOfChristmas: DayNumber
): 1 | 2 | 3 | 4 {
	const cycle = (w: number) => ((((w - 1) % 4) + 4) % 4) + 1;
	if (season === 'christmas') {
		if (n < firstSundayOfChristmas) return 4;
		return cycle(Math.floor((n - firstSundayOfChristmas) / 7) + 1) as 1 | 2 | 3 | 4;
	}
	if (season === 'triduum') return 2; // Holy Week's own week, which it is in
	if (season === 'lent' && week === 0) return 4;
	if (season === 'easter') {
		if (n <= a.easter + 7) return 1; // the octave, Second Sunday included
		if (n === a.pentecost) return 1;
	}
	return cycle(week) as 1 | 2 | 3 | 4;
}

/**
 * Everything the Proper of Saints puts on a day, before precedence.
 *
 * A national calendar contributes here and only here: its propers are added
 * to the list, and its `elevations` amend or suppress a general celebration
 * in place. Keeping it to this one function is what makes a country a data
 * file — nothing downstream knows whether a celebration came from the General
 * Roman Calendar or from Brazil's.
 */
function sanctoralFor(
	n: DayNumber,
	a: Anchors,
	options: CalendarOptions,
	temporal: Map<DayNumber, { celebration: Celebration }>
): Celebration[] {
	const key = monthDay(n);
	const civilYear = fromDayNumber(n).year;
	const national = options.nationalCalendar;
	const out: Celebration[] = [];

	// Where a national calendar keeps a general celebration on another date.
	// Consulted twice below — once to take it off its own day, once to put it
	// on the new one — so it is resolved here rather than at either site.
	// A move only happens if the displacing proper is actually kept on its own
	// date. Where that date is a Sunday the proper is not observed at all, so
	// nothing displaces anything — see `moves` in `../types.ts`.
	const keptOn = (mmdd: string): boolean => {
		const [mm, dd] = mmdd.split('-').map(Number);
		const t = temporal.get(toDayNumber(civilYear, mm, dd));
		return t !== undefined && t.celebration.precedence > PRECEDENCE.PROPER_FEAST;
	};
	const move = national?.moves;
	const movedTo = (id: string, ownDay: string): string | undefined => {
		const sunday = national?.sundayTransfers?.[id]?.[civilYear];
		if (sunday !== undefined) return sunday;
		const m = move?.[id];
		if (m === undefined || (m.since !== undefined && civilYear < m.since)) return undefined;
		return keptOn(ownDay) ? m.to : undefined;
	};
	const inCalendar = (c: Celebration) => c.since === undefined || civilYear >= c.since;

	// THE MOVABLE MEMORIALS GO FIRST, and the order is the tie-break rather
	// than a matter of taste. `resolveDay` sorts by precedence and the sort is
	// stable, so of two obligatory memorials on one day the earlier wins — and
	// when the Immaculate Heart falls on a fixed memorial's date, the decrees
	// that instituted it give it the day and reduce the other to optional. 13
	// June 2026 is both the Immaculate Heart and Anthony of Padua, and putting
	// the fixed table first gave the day to Anthony.
	for (const { at, celebration } of MOVABLE_SANCTORAL) {
		if (a[at] === n) out.push(celebration);
	}
	const fromGeneral = (celebration: Celebration, movedFrom?: string) => {
		const elevation = national?.elevations?.[celebration.id];
		if (elevation === null) return; // suppressed in this country
		if (!inCalendar(celebration)) return; // not yet inscribed in this year
		out.push({
			...celebration,
			...elevation,
			...(movedFrom ? { transferredFrom: movedFrom } : {})
		});
	};
	for (const celebration of GRC.get(key) ?? []) {
		if (movedTo(celebration.id, key) !== undefined) continue; // kept elsewhere here
		fromGeneral(celebration);
	}
	// The other half of a relocation: whatever this country has moved ONTO
	// today. Scanned over the (small) relocation table rather than the whole
	// calendar, so the cost is the number of moves and not the number of days.
	if (national) {
		for (const [ownDay, list] of GRC) {
			for (const found of list) {
				if (movedTo(found.id, ownDay) !== key) continue;
				fromGeneral(found, `${civilYear}-${ownDay}`);
			}
		}
	}
	if (key === '11-02') out.push(ALL_SOULS);
	for (const celebration of national?.propers?.[key] ?? []) {
		out.push({ ...celebration, proper: true, source: 'proper' });
	}
	return out;
}

/**
 * What a losing celebration becomes on a day the winner has already claimed.
 *
 * Returns `undefined` where it is simply omitted for the year. The three
 * outcomes are the whole of n. 14 and the lower half of n. 59:
 *
 *  - Against a **privileged weekday** (line 9 — Lent, 17–24 December, the
 *    Christmas octave) every memorial, obligatory or optional, survives as an
 *    optional COMMEMORATION.
 *  - Against an ordinary **weekday** (line 13) an optional memorial stays what
 *    it is, and an obligatory memorial has already won and is not here.
 *  - Against anything of line 8 or above — a Sunday, a feast, a solemnity —
 *    a memorial is omitted.
 */
function demote(celebration: Celebration, winner: Celebration): Celebration | undefined {
	if (celebration.precedence < PRECEDENCE.MEMORIAL) return undefined; // not a memorial
	if (winner.precedence === PRECEDENCE.PRIVILEGED_WEEKDAY) {
		return {
			...celebration,
			rank: 'commemoration',
			precedence: PRECEDENCE.OPTIONAL_MEMORIAL,
			// A COMMEMORATION TAKES THE SEASON'S COLOUR, not the saint's. It is
			// not a Mass of the saint with a Lenten flavour: it is the Lenten
			// weekday's own Mass, in violet, with the saint's collect said
			// within it (Universal Norms n. 14). A martyr commemorated on a
			// Lenten Friday is violet, never red — which is the difference the
			// oracle reported on every commemoration in the year.
			colour: winner.colour
		};
	}
	if (winner.precedence === PRECEDENCE.WEEKDAY) return celebration;
	return undefined;
}

/**
 * One liturgical year, keyed by day number, from the First Sunday of Advent
 * to the Saturday before the next.
 *
 * `year` is the civil year the year's EASTER falls in — see `temporal.ts`.
 */
export function buildYear(
	year: number,
	options: CalendarOptions = {}
): Map<DayNumber, LiturgicalDay> {
	const merged: CalendarOptions = { ...options.nationalCalendar?.options, ...options };
	const a = anchors(year, merged);
	const temporal = temporalYear(a);
	const firstSundayOfChristmas = after(a.christmas, SUNDAY);

	const cycles = {
		sundayCycle: sundayCycle(year),
		weekdayCycle: weekdayCycle(year)
	} as const;

	const days = new Map<DayNumber, LiturgicalDay>();

	// PASS ONE: what each day would hold if nothing were transferred, and
	// which solemnities are impeded. Two passes rather than one because a
	// transfer is not always forward — see below — so where an impeded
	// solemnity lands cannot be decided while still walking towards it.
	const base = new Map<DayNumber, Celebration[]>();
	const impeded: Array<{ from: DayNumber; celebration: Celebration }> = [];

	for (let n = a.adventStart; n < a.nextAdvent; n++) {
		const t = temporal.get(n)!;
		const kept: Celebration[] = [];
		for (const c of [t.celebration, ...sanctoralFor(n, a, merged, temporal)]) {
			// A solemnity impeded by a day of higher class is not dropped but
			// moved (n. 60). Taken out here, before a winner is chosen, so that
			// it cannot also appear as an omitted loser on its own date.
			if (
				c.transferable &&
				c.precedence >= PRECEDENCE.SOLEMNITY &&
				t.celebration.precedence < PRECEDENCE.SOLEMNITY
			) {
				impeded.push({ from: n, celebration: c });
			} else {
				kept.push(c);
			}
		}
		base.set(n, kept);
	}

	// PASS TWO: place each impeded solemnity on "the closest day not listed
	// under nn. 1–8" (n. 60), in date order so an earlier one cannot be
	// displaced by a later.
	//
	// THE DIRECTION IS NOT THE SAME FOR ALL OF THEM, and this is what a plain
	// forward queue gets wrong. The Annunciation impeded by Holy Week goes
	// FORWARD, past the whole Octave of Easter, to the Monday after the Second
	// Sunday of Easter — 25 March 2027 is Holy Thursday, and the oracle
	// confirms it lands on 5 April. Saint Joseph impeded by Holy Week is
	// ANTICIPATED instead, to the free day before, which is how 19 March was
	// kept in 2008 (moved back to the 15th).
	//
	// 2035 is the year that needs both at once: Easter falls on 25 March, so
	// Joseph is inside Holy Week and the Annunciation is on Easter Sunday
	// itself. Sending both forward gives Joseph the Annunciation's day and
	// pushes the Annunciation a fortnight past it.
	//
	// So the direction is a property of the celebration (`anticipated`) and
	// not a rule read off the season. NOTE that Joseph's direction is the one
	// thing here the oracle cannot confirm — 19 March is outside Holy Week in
	// all three of its years — so it rests on the published practice cited.
	const taken = new Set<DayNumber>();
	const free = (n: DayNumber): boolean =>
		n >= a.adventStart &&
		n < a.nextAdvent &&
		!taken.has(n) &&
		(base.get(n) ?? []).every((c) => c.precedence > PRECEDENCE.PROPER_FEAST);

	for (const { from, celebration } of impeded) {
		const step = celebration.anticipated ? -1 : 1;
		let n = from + step;
		while (n >= a.adventStart && n < a.nextAdvent && !free(n)) n += step;
		// Nowhere in this year to put it. Dropping is the honest answer: the
		// alternative is inventing a date the Church did not choose.
		if (!free(n)) continue;
		taken.add(n);
		base.get(n)!.push({ ...celebration, transferredFrom: formatIsoDate(from) });
	}

	// PASS THREE: resolve each day's winner from the settled candidate lists.
	for (let n = a.adventStart; n < a.nextAdvent; n++) {
		const t = temporal.get(n)!;
		const kept = base.get(n)!;
		kept.sort((x, y) => x.precedence - y.precedence);

		// AN OPTIONAL MEMORIAL NEVER TAKES THE DAY, though line 12 does sit
		// above line 13 in the Table of Liturgical Days. The table ranks what
		// happens when two celebrations MUST be resolved; an optional memorial
		// is by definition one that may be observed or not, so the day remains
		// the weekday and the memorial is offered on it. Reading the table as
		// a plain sort makes every ferial Tuesday with a saint on it disappear
		// into that saint — which is what this did until the oracle said so,
		// on 100 days of 2026 alone.
		const winner = kept.find((c) => c.rank !== 'optional-memorial') ?? kept[0];

		const optional: Celebration[] = [];
		for (const c of kept) {
			if (c === winner) continue;
			const survivor = demote(c, winner);
			if (survivor) optional.push(survivor);
		}
		// The Saturday of Our Lady: any Saturday in Ordinary Time on which no
		// obligatory celebration falls (n. 15). Offered last, after the day's
		// own optional memorials, which is the order the Missal prints.
		if (
			t.season === 'ordinary' &&
			weekday(n) === SATURDAY &&
			winner.precedence === PRECEDENCE.WEEKDAY &&
			!optional.some((c) => c.marian)
		) {
			optional.push(SATURDAY_MEMORIAL_OF_MARY);
		}

		const notObligatory = merged.nationalCalendar?.notObligatory ?? [];
		days.set(n, {
			date: formatIsoDate(n),
			dayNumber: n,
			season: t.season,
			week: t.week,
			celebration: winner,
			optional,
			colour: winner.colour,
			...cycles,
			psalterWeek: psalterWeek(n, t.season, t.week, a, firstSundayOfChristmas),
			holyDayOfObligation:
				weekday(n) === SUNDAY ||
				(HOLY_DAYS_OF_OBLIGATION.includes(winner.id) && !notObligatory.includes(winner.id))
		});
	}

	return days;
}
