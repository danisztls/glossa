/**
 * Panama — the General Roman Calendar as Panama’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Panama actually does
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
 * A proper carries the name its conference approved, in es, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const PANAMA: NationalCalendar = {
	id: 'pa',
	options: { ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'05-15': [
			proper(
				'isidore-the-farmer',
				{ es: 'San Isidro Labrador', en: 'Saint Isidore the Farmer' },
				'm'
			)
		],
		'09-09': [
			proper(
				'mary-the-ancient',
				{ es: 'Santa María la Antigua', en: 'Saint Mary the Ancient' },
				's'
			)
		],
		'10-10': [
			proper(
				'thomas-of-villanova',
				{ es: 'Santo Tomás de Villanueva, obispo', en: 'Saint Thomas of Villanova, bishop' },
				'o'
			)
		],
		'11-27': [
			proper(
				'the-miraculous-medal',
				{ es: 'Nuestra Señora de la Medalla Milagrosa', en: 'Our Lady of the Miraculous Medal' },
				'o',
				{ marian: true }
			)
		]
	},
	movable: [
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{
					es: 'Nuestro Señor Jesucristo, Sumo y Eterno Sacerdote',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	overrides: {
		'our-lady-of-guadalupe': keptAs('f'),
		'rose-of-lima': keptAs('f')
	},
	moves: {
		'rose-of-lima': { to: '08-30' }
	}
};
