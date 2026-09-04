/**
 * Ecuador — the General Roman Calendar as Ecuador’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Ecuador actually does
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

export const ECUADOR: NationalCalendar = {
	id: 'ec',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'02-09': [
			proper(
				'miguel-febres-cordero',
				{
					es: 'San Miguel Febres Cordero, religioso',
					en: 'Saint Miguel Febres Cordero, religious'
				},
				'm'
			)
		],
		'02-27': [
			proper(
				'caridad-brader',
				{ es: 'Beata Caridad Brader, religiosa', en: 'Blessed Caridad Brader, religious' },
				'o'
			)
		],
		'04-20': [
			proper(
				'sorrows-of-the-college',
				{ es: 'Santísima Virgen Dolorosa del Colegio', en: 'Our Lady of Sorrows of the College' },
				'm'
			)
		],
		'05-19': [
			proper(
				'maria-bernarda-butler',
				{ es: 'Santa María Bernarda Bütler, virgen', en: 'Saint Maria Bernarda Bütler, virgin' },
				'm'
			)
		],
		'05-26': [
			proper(
				'mariana-de-jesus-de-paredes',
				{
					es: 'Santa Mariana de Jesús de Paredes, virgen',
					en: 'Saint Mariana de Jesús de Paredes, virgin'
				},
				'f'
			)
		],
		'06-12': [
			proper(
				'mercedes-de-jesus-molina',
				{
					es: 'Beata Mercedes de Jesús Molina, virgen',
					en: 'Blessed Mercedes de Jesús Molina, virgin'
				},
				'o'
			)
		],
		'09-24': [proper('mercy', { es: 'Nuestra Señora de la Merced', en: 'Our Lady of Mercy' }, 'f')]
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
		irenaeus: keptAs('s'),
		'our-lady-of-guadalupe': keptAs('f'),
		'rose-of-lima': keptAs('f')
	},
	moves: {
		'rose-of-lima': { to: '08-30' }
	}
};
