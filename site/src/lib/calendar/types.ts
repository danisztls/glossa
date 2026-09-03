/**
 * What a liturgical calendar is made of.
 *
 * The vocabulary is the *Universal Norms on the Liturgical Year and the
 * Calendar* (1969), promulgated with the General Roman Calendar by Paul VI's
 * motu proprio *Mysterii Paschalis* — which vatican.va publishes, while the
 * Norms and the Calendar it approves are printed in the Roman Missal and are
 * not on vatican.va at all. That absence is the whole reason this half of the
 * project is code and a table here rather than a work in the corpus; see the
 * head of `grc.ts`.
 *
 * Two things in this file are worth reading before the rest of the directory:
 * why RANK and PRECEDENCE are separate fields, and why a day carries a list
 * of celebrations rather than one.
 */

import type { DayNumber } from './computus';

/**
 * The seasons, in the order the year keeps them.
 *
 * `triduum` is a season here and is not one in the Norms, where it is the
 * summit of the year standing outside the count (nn. 18–21) — Lent runs "until
 * the Mass of the Lord's Supper exclusive", and the Triduum runs from that Mass
 * to Evening Prayer of Easter Sunday. Both boundaries fall in the MIDDLE of a
 * day, and this calendar's unit is the day, so a choice was unavoidable: either
 * Holy Thursday is Lent (true until the evening) or it is the Triduum (true
 * after it). Naming the Triduum a season of its own makes the three days answer
 * for what they mostly are, and keeps the alternative — silently calling Good
 * Friday "Lent" — from being what a reader is told.
 */
export type Season = 'advent' | 'christmas' | 'lent' | 'triduum' | 'easter' | 'ordinary';

/** The vestment colour a day is kept in (GIRM 346). */
export type Colour = 'white' | 'red' | 'green' | 'violet' | 'rose' | 'black';

/**
 * What a celebration IS — its dignity, in the Norms' sense (nn. 10–15).
 *
 * `commemoration` is the fifth and the one most often missing: in Lent, an
 * obligatory memorial is not kept as a memorial and is not dropped either, but
 * observed as a commemoration within the Lenten weekday's own Mass (n. 14).
 * It is therefore a rank a celebration ACQUIRES from the season it lands in,
 * never one it carries in the calendar — which is why nothing in `grc.ts`
 * spells it and `resolveDay` is the only thing that produces it.
 */
export type Rank =
	'solemnity' | 'feast' | 'memorial' | 'optional-memorial' | 'commemoration' | 'sunday' | 'weekday';

/**
 * A celebration's class in the Table of Liturgical Days (Universal Norms
 * n. 59) — the thirteen numbered lines that decide which of two celebrations
 * falling on one day is the one kept.
 *
 * ## Why this is a separate field from `rank`
 *
 * Because rank does not determine precedence, and treating it as though it
 * did is the mistake that makes a calendar quietly wrong. A feast of the Lord
 * (line 5) outranks a Sunday in Ordinary Time (line 6) and is celebrated when
 * the two coincide; a feast of a saint (line 7) does not and is omitted. Both
 * are `rank: 'feast'`. Likewise every Sunday of Advent, Lent and Easter is
 * line 2 — above every solemnity — while a Sunday in Ordinary Time is line 6,
 * below them; both are `rank: 'sunday'`. A comparison on rank gets the
 * Annunciation-on-a-Lenten-Sunday case backwards and reads plausibly doing it.
 *
 * So the number is stated per celebration, from the table, and comparison is
 * on the number alone. Lower wins.
 */
export type Precedence = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

/** The lines of n. 59 named, so the table can be read in `grc.ts`. */
export const PRECEDENCE = {
	/** Paschal Triduum. */
	TRIDUUM: 1,
	/** Christmas, Epiphany, Ascension, Pentecost; Sundays of Advent, Lent and
	 *  Easter; Ash Wednesday; Monday–Thursday of Holy Week; Easter octave. */
	PRINCIPAL: 2,
	/** Solemnities of the Lord, of the BVM and of saints in the General
	 *  Calendar; All Souls. */
	SOLEMNITY: 3,
	/** Proper solemnities — a place's patron, a church's dedication. */
	PROPER_SOLEMNITY: 4,
	/** Feasts of the Lord in the General Calendar. */
	FEAST_OF_THE_LORD: 5,
	/** Sundays of Christmas Time and Sundays in Ordinary Time. */
	SUNDAY: 6,
	/** Feasts of the BVM and of saints in the General Calendar. */
	FEAST: 7,
	/** Proper feasts. */
	PROPER_FEAST: 8,
	/** Weekdays of 17–24 December; days in the Christmas octave; Lenten
	 *  weekdays. Privileged: they yield only to lines 1–8. */
	PRIVILEGED_WEEKDAY: 9,
	/** Obligatory memorials in the General Calendar. */
	MEMORIAL: 10,
	/** Proper obligatory memorials. */
	PROPER_MEMORIAL: 11,
	/** Optional memorials — which may also be kept on the days of line 9, in
	 *  the special manner n. 14 describes. */
	OPTIONAL_MEMORIAL: 12,
	/** Weekdays of Advent to 16 December; of Christmas Time from 2 January;
	 *  of Easter Time after the octave; and of Ordinary Time. */
	WEEKDAY: 13
} as const satisfies Record<string, Precedence>;

/**
 * A celebration's name, per language.
 *
 * LATIN IS REQUIRED AND THE REST ARE NOT, which is the same shape the corpus
 * takes everywhere else and for the same reason: the Calendarium Romanum
 * Generale is a Latin book, so the Latin name is the celebration's own and
 * every vernacular is a translation of it. A reader whose language is missing
 * falls back through `CONTENT_LANG_FALLBACK` to English and then to Latin,
 * exactly as they do for an edition the corpus does not hold in their
 * language — see `celebrationName` in `index.ts`.
 *
 * A national calendar's propers are the exception that proves it: Brazil's
 * own saints have no Latin name in `br.ts`, because the conference that has
 * them approved them in Portuguese and there is nothing to reproduce.
 */
export interface Names {
	la?: string;
	en?: string;
	pt?: string;
}

/** One celebration, as the calendar carries it before any day is resolved. */
export interface Celebration {
	/** Stable key, unique within a calendar. Used by tests and by the route;
	 *  never shown to a reader. */
	id: string;
	names: Names;
	rank: Rank;
	precedence: Precedence;
	colour: Colour;
	/** True for a celebration from a national calendar rather than the GRC. */
	proper?: boolean;
	/** Which layer placed this celebration. `temporal` names are generated
	 *  from a formula and are therefore the site's own wording; the others
	 *  are the Calendar's own formulae. `oracle.test.ts` compares the names of
	 *  the latter and not the former, because two calendars generating a
	 *  formula will differ in inflection while meaning the same day. */
	source?: 'temporal' | 'grc' | 'proper';
	/** A celebration OF the Blessed Virgin Mary. Read only to suppress the
	 *  Saturday memorial of Our Lady on a day that already offers one — you do
	 *  not commemorate her twice on the same Saturday. */
	marian?: boolean;
	/** A solemnity impeded by a higher class is moved rather than dropped
	 *  (n. 60). Everything else of lower class is simply omitted. */
	transferable?: boolean;
	/** Move this solemnity BACKWARD when impeded, not forward. Only Saint
	 *  Joseph does: 19 March inside Holy Week is anticipated to the free day
	 *  before it, where the Annunciation goes forward past the Octave of
	 *  Easter. See the transfer pass in `year.ts` for why the direction has to
	 *  be per celebration. */
	anticipated?: boolean;
	/** Set when this celebration was moved off its own date, naming the date
	 *  it was moved from — so the page can say so rather than silently
	 *  showing a feast on the wrong day. */
	transferredFrom?: string;
	/** The first civil year this celebration was in the calendar, where that
	 *  is recent enough to fall inside the range anyone will ask for. THE
	 *  CALENDAR IS NOT A CONSTANT: John Henry Newman was inscribed on 9
	 *  October in 2026 and a calendar for 2025 that shows him is wrong about
	 *  2025. Absent means "for as long as this table is asked about". */
	since?: number;
}

/** One resolved day of the calendar. */
export interface LiturgicalDay {
	/** `2026-04-05`. */
	date: string;
	dayNumber: DayNumber;
	season: Season;
	/** The week within the season, 1-based. Ordinary Time's own numbering (1
	 *  to 34); Advent 1–4; Lent 1–5 with Holy Week as 6; Easter 1–7. */
	week: number;
	/** The celebration the day is kept as. Always present: a day with nothing
	 *  else is the weekday itself. */
	celebration: Celebration;
	/** Optional memorials and Lenten commemorations available on the day, in
	 *  calendar order. Empty on most days. */
	optional: Celebration[];
	colour: Colour;
	/** Sunday lectionary cycle for the liturgical year this day belongs to. */
	sundayCycle: 'A' | 'B' | 'C';
	/** Weekday lectionary cycle for the same year. */
	weekdayCycle: 'I' | 'II';
	/** Week of the four-week psalter in the Liturgy of the Hours, 1–4. */
	psalterWeek: 1 | 2 | 3 | 4;
	/** A holy day of obligation in the universal law — CIC c. 1246 §1, which
	 *  the corpus holds in seven languages. A conference may suppress or
	 *  transfer some of these (§2), so a national calendar overrides it. */
	holyDayOfObligation: boolean;
}

/**
 * What a caller may vary about the calendar.
 *
 * The three booleans are the transfers a bishops' conference may make under
 * c. 1246 §2, and they are separate flags rather than a country because they
 * are separate decisions: a conference can move Ascension and keep Corpus
 * Christi on its Thursday, and several do. `nationalCalendar` is the other
 * axis — the propers and elevations a country adds on top.
 */
export interface CalendarOptions {
	/** Epiphany on the Sunday falling 2–8 January, rather than 6 January. */
	epiphanyOnSunday?: boolean;
	/** Ascension on the Seventh Sunday of Easter, rather than the Thursday. */
	ascensionOnSunday?: boolean;
	/** Corpus Christi on the Sunday after Trinity, rather than the Thursday. */
	corpusChristiOnSunday?: boolean;
	/** A national calendar to lay over the General Roman Calendar. */
	nationalCalendar?: NationalCalendar;
}

/**
 * A country's calendar, as the three things it may do to the general one.
 *
 * Modelled as a layer rather than as a whole calendar because that is what it
 * IS — the Norms (nn. 48–55) describe a particular calendar as the General
 * Roman Calendar with proper celebrations inserted, and a conference does not
 * get to restate the rest. Keeping it a layer means a country is a data file
 * with no code, and that the general calendar cannot drift out from under it.
 */
export interface NationalCalendar {
	/** ISO 3166-1 alpha-2, lowercased — `br`. */
	id: string;
	/** The transfers this conference has made. */
	options: Omit<CalendarOptions, 'nationalCalendar'>;
	/** Celebrations this country adds, keyed `MM-DD`. */
	propers: Record<string, Celebration[]>;
	/** Celebrations of the general calendar this country keeps at another
	 *  rank, keyed by the general celebration's `id`. A `null` suppresses. */
	elevations?: Record<string, Partial<Celebration> | null>;
	/** Holy days of obligation this conference has suppressed or moved to a
	 *  Sunday, by the general celebration's `id` (c. 1246 §2). */
	notObligatory?: readonly string[];
	/**
	 * General celebrations this country keeps on a different date. What
	 * produces one is a proper taking the date the general calendar had used,
	 * so the general one steps aside: Brazil keeps José de Anchieta on 9 June,
	 * and Ephrem moves to the 8th.
	 *
	 * `since` is there because a conference can begin doing this in a given
	 * year and not before — Brazil omitted Pontian and Hippolytus outright in
	 * 2025 and has kept them on 12 August since 2026.
	 *
	 * A MOVE IS CONDITIONAL ON THE DISPLACING DAY BEING KEPT AT ALL. Where the
	 * proper's own date falls on a Sunday, the proper is not observed, so
	 * nothing displaces anything: the general celebration stays where it was
	 * and is then suppressed by that Sunday like any other memorial. 5 October
	 * 2025 is the case — a Sunday, so São Benedito is not kept and Faustina
	 * does not move to the 6th.
	 */
	moves?: Record<string, { to: string; since?: number }>;
	/**
	 * Solemnities this conference moves to a Sunday, as `id -> year -> MM-DD`.
	 *
	 * A TABLE OF YEARS AND NOT A RULE, because the evidence says there is no
	 * rule. Measured across the three oracle years, Brazil moved Saints Peter
	 * and Paul from a Monday BACKWARD to the preceding Sunday in 2026 and from
	 * a Tuesday FORWARD to the following Sunday in 2027, while All Saints went
	 * forward from a Monday in 2027 and stayed put on a Saturday in 2025.
	 * Neither "nearest Sunday" nor "following Sunday" fits all six, so the
	 * direction is a decision the conference publishes in its Ordo year by
	 * year, and inventing a rule to cover it would produce a date nobody
	 * chose. Outside the years listed the solemnity keeps its own date, which
	 * is the general calendar's answer and is at least not a fabrication.
	 */
	sundayTransfers?: Record<string, Record<number, string>>;
}
