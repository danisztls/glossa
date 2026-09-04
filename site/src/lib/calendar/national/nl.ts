/**
 * The Netherlands — the General Roman Calendar as its bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what the Netherlands actually does
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

export const NETHERLANDS: NationalCalendar = {
	id: 'nl',
	options: { epiphanyOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'06-14': [proper('lidwina', { nl: 'H. Lidwina, maagd', en: 'Saint Lidwina, virgin' }, 'f')],
		'07-09': [
			proper(
				'holy-martyrs-of-gorkum',
				{ nl: 'HH. Martelaren van Gorcum', en: 'Holy Martyrs of Gorkum' },
				'f',
				{ colour: 'red' }
			)
		],
		'07-27': [
			proper(
				'titus-brandsma',
				{
					nl: 'H. Titus Brandsma, priester en martelaar',
					en: 'Saint Titus Brandsma, priest and martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'11-06': [
			proper(
				'holy-preachers-of-the-faith-in-the-netherlands',
				{
					nl: 'HH. Verkondigers van het geloof in onze streken',
					en: 'Holy Preachers of the Faith in the Netherlands'
				},
				'f'
			)
		],
		'11-07': [
			proper('willibrord', { nl: 'H. Willibrord, bisschop', en: 'Saint Willibrord, bishop' }, 's')
		]
	},
	movable: [
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{
					nl: 'Onze Heer Jezus Christus, Eeuwige Hogepriester',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'louis-de-montfort': null,
		'peter-chanel': keptAs('m'),
		'teresa-benedicta': keptAs('f')
	}
};
