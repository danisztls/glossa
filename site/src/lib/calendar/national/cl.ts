/**
 * Chile — the General Roman Calendar as Chile’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Chile actually does
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

export const CHILE: NationalCalendar = {
	id: 'cl',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-22': [
			proper(
				'laura-vicuna',
				{ es: 'Beata Laura Vicuña, virgen', en: 'Blessed Laura Vicuna, virgin' },
				'o'
			)
		],
		'02-07': [proper('pius-ix', { es: 'Beato Pio IX, papa', en: 'Blessed Pius IX, pope' }, 'o')],
		'05-24': [
			proper(
				'help-of-christians',
				{ es: 'María, Auxilio de los cristianos', en: 'Our Lady Help of Christians' },
				'm'
			)
		],
		'07-13': [
			proper(
				'teresa-of-jesus-of-los-andes',
				{
					es: 'Santa Teresa de Jesús de Los Andes, virgen',
					en: 'Saint Teresa of Jesus of Los Andes, virgin'
				},
				'f'
			)
		],
		'08-18': [
			proper(
				'alberto-hurtado-cruchaga',
				{
					es: 'San Alberto Hurtado Cruchaga, presbítero',
					en: 'Saint Alberto Hurtado Cruchaga, priest'
				},
				'm'
			)
		],
		'08-26': [
			proper(
				'ceferino-namuncura',
				{ es: 'Beato Ceferino Namuncurá', en: 'Blessed Ceferino Namuncurá' },
				'o'
			)
		],
		'09-24': [proper('mercy', { es: 'Nuestra Señora de la Merced', en: 'Our Lady of Mercy' }, 'o')]
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
		'our-lady-of-lourdes': keptAs('m'),
		'our-lady-of-mount-carmel': keptAs('s', 'white'),
		'rose-of-lima': keptAs('f')
	},
	moves: {
		'exaltation-of-the-cross': { to: '05-03' },
		henry: { to: '07-14' },
		'philip-james': { to: '05-04' },
		'rose-of-lima': { to: '08-30' }
	}
};
