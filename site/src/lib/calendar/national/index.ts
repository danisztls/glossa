/**
 * The national calendars, by ISO 3166-1 alpha-2 code.
 *
 * ## Which countries, and why these
 *
 * Catholic population, largest first. It is the criterion the work was asked
 * for and the only one available that is a fact rather than a preference, and
 * it puts a calendar in front of roughly two thirds of the Catholics alive.
 * The list stops at Germany because a list has to stop somewhere; the next
 * countries down cost one file each and no change to any code, which is what
 * `NationalCalendar` being a data layer means.
 *
 * The populations themselves are deliberately not written here — a count that
 * rots silently is worse than no count (root `CLAUDE.md`), and this order is
 * the only thing they are needed for.
 *
 * ## What a layer may not do
 *
 * Nothing in this directory is code. A file states propers, overrides, moves,
 * transfers and observances, and every rule that acts on them lives in
 * `../year.ts` — which is what keeps a country from drifting away from the
 * general calendar it is a layer over. If a country seems to need a rule of
 * its own, the rule is probably general and stated wrongly.
 */

import type { NationalCalendar } from '../types';
import { ARGENTINA } from './ar';
import { BRAZIL } from './br';
import { COLOMBIA } from './co';
import { CONGO } from './cd';
import { FRANCE } from './fr';
import { GERMANY } from './de';
import { INDIA } from './in';
import { ITALY } from './it';
import { MEXICO } from './mx';
import { NIGERIA } from './ng';
import { PERU } from './pe';
import { PHILIPPINES } from './ph';
import { POLAND } from './pl';
import { SPAIN } from './es';
import { UNITED_STATES } from './us';
import { VENEZUELA } from './ve';

/** In the order the picker offers them — Catholic population, descending. */
export const NATIONAL_CALENDAR_LIST: readonly NationalCalendar[] = [
	BRAZIL,
	MEXICO,
	PHILIPPINES,
	UNITED_STATES,
	COLOMBIA,
	ITALY,
	CONGO,
	FRANCE,
	SPAIN,
	POLAND,
	ARGENTINA,
	PERU,
	VENEZUELA,
	INDIA,
	NIGERIA,
	GERMANY
];

/** The same, by `id`, for the oracle test and the route's query parameter. */
export const NATIONAL_CALENDARS: Record<string, NationalCalendar> = Object.fromEntries(
	NATIONAL_CALENDAR_LIST.map((c) => [c.id, c])
);
