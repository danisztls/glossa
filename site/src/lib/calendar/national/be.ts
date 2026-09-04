/**
 * Belgium — the General Roman Calendar as Belgium’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Belgium actually does
 * differently, and no code at all.
 *
 * ## Derived, and what that costs
 *
 * DERIVED BY `pipeline/derive_national_calendars.py`, not written by hand —
 * unlike the sixteen layers that came before it, whose propers were read one
 * at a time. That tool takes the difference between this calendar's feed and
 * the general variant it layers over, both in English, and classifies each
 * difference by what it does to the day. The honest consequence is stated
 * rather than left to be discovered: `oracle.test.ts` compares this country
 * against the same feed the layer came from, so for THIS file the name check
 * is a transcription check and not an independent one.
 *
 * What the oracle still checks independently is everything the ENGINE does
 * with these rows — precedence, an impeded solemnity transferred, a memorial
 * reduced by Lent, a Sunday that wins or loses. None of that is in the feed,
 * and it is the half that can be wrong invisibly.
 *
 * ## The names
 *
 * A proper carries the name its conference approved, in nl, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const BELGIUM: NationalCalendar = {
	id: 'be',
	options: { epiphanyOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'02-06': [
			proper(
				'amandus-of-maastricht',
				{ nl: 'H. Amandus van Maastricht, bisschop', en: 'Saint Amandus of Maastricht, bishop' },
				'm'
			)
		],
		'05-10': [
			proper(
				'damien-de-veuster',
				{ nl: 'H. Damiaan de Veuster, priester', en: 'Saint Damien de Veuster, priest' },
				'm'
			)
		],
		'06-10': [
			proper(
				'edward-poppe',
				{ nl: 'Z. Edward Poppe, priester', en: 'Blessed Edward Poppe, priest' },
				'o'
			)
		],
		'08-07': [
			proper(
				'juliana-of-mount-cornillon',
				{ nl: 'H. Juliana van Cornillon, maagd', en: 'Saint Juliana of Mount-Cornillon, virgin' },
				'o'
			)
		],
		'08-31': [
			proper(
				'our-lady',
				{ nl: 'Maria, Moeder en Middelares van genade', en: 'Our Lady, Mediatrix' },
				'o'
			)
		],
		'11-03': [
			proper(
				'hubertus-of-liege',
				{ nl: 'H. Hubertus van Luik, bisschop', en: 'Saint Hubertus of Liège, bishop' },
				'm'
			)
		],
		'11-26': [
			proper(
				'john-berchmans',
				{ nl: 'H. Johannes Berchmans, kloosterling', en: 'Saint John Berchmans, religious' },
				'o'
			)
		]
	},
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'paul-miki': { to: '02-07' }
	}
};
