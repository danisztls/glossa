/**
 * What every national calendar's file is made of.
 *
 * A layer is data (`NationalCalendar` in `../types.ts`), and fifteen files of
 * data want one way of spelling a row. Everything here is spelling: the
 * mapping from a one-letter rank code to the pair of fields the Table of
 * Liturgical Days actually compares on, and the flags that follow from the
 * rank rather than from the celebration.
 *
 * ## Why a proper's precedence is not the general one
 *
 * Universal Norms n. 59 gives a country's own celebrations their own lines —
 * proper solemnities are line 4 where the General Calendar's are line 3,
 * proper feasts line 8 against line 7, proper obligatory memorials line 11
 * against line 10. So the same saint at the same rank yields to a general
 * celebration of that rank, and `PROPER_*` is never a synonym for the general
 * constant. Optional memorials are the exception: line 12 is the only line
 * for them, general and proper alike.
 *
 * ## Names, and where they come from
 *
 * A national proper has NO LATIN NAME. It was approved by a conference in the
 * language that conference works in, and there is no *Calendarium Romanum
 * Generale* entry behind it to reproduce — composing a Latin one would be
 * exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 * So each file carries the celebration's own name in the language it was
 * approved in, and an English rendering beside it for the reader who has no
 * other way in. `celebrationName` falls back to whichever exists.
 */

import { PRECEDENCE, type Celebration, type Colour, type Names } from '../types';

/**
 * A proper's rank, in the same one-letter shorthand `grc.ts` uses.
 *
 * `F` AND `f` ARE THE SAME DISTINCTION THEY ARE THERE — a feast of the Lord
 * against a feast of a saint — and this file said for one afternoon that a
 * country never needs the first, on the reasoning that n. 59 gives PROPER
 * feasts one line (8) and that a country keeping a feast of the Lord keeps a
 * general one. The Philippines disproves it: the Santo Niño is a feast of the
 * Lord that no general calendar has, it falls on the third Sunday of January,
 * and in 2026 that Sunday is the Second in Ordinary Time — which it takes.
 * Only line 5 does that; line 8 loses to a Sunday and the feast disappears.
 *
 * So `F` is line 5, exactly as in `grc.ts`. It is rare and it is checked: use
 * it only where the celebration is genuinely of the Lord.
 */
export type ProperRank =
	| 's' // proper solemnity — line 4
	| 'F' // feast of the Lord — line 5, above a Sunday in Ordinary Time
	| 'f' // proper feast of a saint — line 8
	| 'm' // proper obligatory memorial — line 11
	| 'o'; // optional memorial — line 12, the one line shared with the general calendar

const RANK = {
	s: 'solemnity',
	F: 'feast',
	f: 'feast',
	m: 'memorial',
	o: 'optional-memorial'
} as const;

const PRECEDENCE_OF = {
	s: PRECEDENCE.PROPER_SOLEMNITY,
	F: PRECEDENCE.FEAST_OF_THE_LORD,
	f: PRECEDENCE.PROPER_FEAST,
	m: PRECEDENCE.PROPER_MEMORIAL,
	o: PRECEDENCE.OPTIONAL_MEMORIAL
} as const;

/** Extra properties a row may carry, all of them defaults a rank cannot give. */
interface ProperOptions {
	/** Red for a martyr, blue where a country has the Marian privilege. White
	 *  otherwise, as everywhere else in the calendar. */
	colour?: Colour;
	/** A celebration OF Our Lady, which suppresses her Saturday memorial on a
	 *  day that already offers one. Set it or the day carries her twice — the
	 *  oracle reports it, but only for a Saturday inside its three years. */
	marian?: boolean;
	/** The first civil year the conference kept it. */
	since?: number;
}

/**
 * One proper celebration.
 *
 * A SOLEMNITY IS TRANSFERABLE AND NOTHING ELSE IS (n. 60), which is a
 * property of the rank and so is set here rather than in fifteen files: a
 * proper solemnity impeded by a Sunday of Advent, Lent or Easter is moved to
 * the next free day rather than dropped. Poland's Our Lady Queen of Poland
 * is the case the oracle shows — 3 May 2026 is the Fifth Sunday of Easter,
 * and the solemnity is kept on the Monday.
 */
export function proper(
	id: string,
	names: Names,
	rank: ProperRank,
	options: ProperOptions = {}
): Celebration {
	return {
		id,
		names,
		rank: RANK[rank],
		precedence: PRECEDENCE_OF[rank],
		colour: options.colour ?? 'white',
		proper: true,
		source: 'proper',
		...(rank === 's' ? { transferable: true } : {}),
		...(options.marian ? { marian: true } : {}),
		...(options.since !== undefined ? { since: options.since } : {})
	};
}

/**
 * Raise or lower a general celebration to a rank this country keeps it at.
 *
 * `transferable` comes with the solemnity here as it does in `proper`, and
 * Poland is why it has to: Saint Adalbert is a memorial in the general
 * calendar and the principal patron of Poland, and 23 April 2025 fell in the
 * Octave of Easter — so the raised solemnity had to move to 28 April, which
 * only a transferable one does. A rank raised without the flag is a solemnity
 * that vanishes in the years it matters most.
 */
export function keptAs(rank: ProperRank, colour?: Colour): Partial<Celebration> {
	return {
		rank: RANK[rank],
		precedence: PRECEDENCE_OF[rank],
		...(rank === 's' ? { transferable: true } : {}),
		...(colour ? { colour } : {})
	};
}

/**
 * The Immaculate Conception in blue — the *privilegio de azul*.
 *
 * Six of these calendars keep it and it is the only day any of them recolours,
 * so it is written once here rather than six times. See `Colour` in
 * `../types.ts` for what the privilege is; the rank is untouched, since the
 * solemnity is the general calendar's.
 */
export const BLUE_IMMACULATE_CONCEPTION = { colour: 'blue' as const };

/** The Thursday after Pentecost — Our Lord Jesus Christ, Eternal High Priest,
 *  which seven of these conferences keep and the General Calendar does not. */
export const THURSDAY_AFTER_PENTECOST = { fromEaster: 53 } as const;
