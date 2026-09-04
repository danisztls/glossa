/**
 * Puerto Rico — the General Roman Calendar as Puerto Rico’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Puerto Rico actually does
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

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Saint Catherine of Alexandria, virgin and martyr: absent in 2027 only -- not written; three years cannot say which it is
 */

export const PUERTO_RICO: NationalCalendar = {
	id: 'pr',
	options: { ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-03': [
			proper('bethlehem', { es: 'El Santísimo Nombre de Jesús', en: 'Our Lady of Bethlehem' }, 'o')
		],
		'01-10': [
			proper(
				'maria-dolores-rodriguez-sopena',
				{
					es: 'Beata María Dolores Rodríguez Sopeña, virgen',
					en: 'Blessed María Dolores Rodríguez Sopeña, virgin'
				},
				'o'
			)
		],
		'05-04': [
			proper(
				'carlos-manuel-rodriguez',
				{ es: 'Beato Carlos Manuel Rodríguez', en: 'Blessed Carlos Manuel Rodríguez' },
				'o'
			)
		],
		'08-26': [
			proper(
				'teresa-jornet-ibars',
				{
					es: 'Santa Teresa de Jesús Jornet e Ibars, virgen',
					en: 'Saint Teresa Jornet Ibars, virgin'
				},
				'o'
			)
		],
		'09-10': [
			proper(
				'charles-spinola-and-blessed-jerome-de-angelis',
				{
					es: 'Beatos Carlos Spínola y Jerónimo de Angelis, presbíteros y mártires',
					en: 'Blessed Charles Spinola and Blessed Jerome de Angelis, priests and martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'10-11': [
			proper(
				'maria-soledad-torres-acosta',
				{
					es: 'Santa María Soledad Torres Acosta, virgen',
					en: 'Saint María Soledad Torres Acosta, virgin'
				},
				'o'
			)
		],
		'10-20': [
			proper(
				'junipero-serra',
				{ es: 'San Junípero Serra, presbítero', en: 'Saint Junipero Serra, priest' },
				'm'
			)
		],
		'11-19': [
			proper(
				'mother-of-divine-providence',
				{
					es: 'Nuestra Señora Madre de la Divina Providencia',
					en: 'Our Lady Mother of Divine Providence'
				},
				's'
			)
		],
		'11-27': [
			proper(
				'the-miraculous-medal',
				{ es: 'Nuestra Señora de la Medalla Milagrosa', en: 'Our Lady of the Miraculous Medal' },
				'o',
				{ marian: true }
			)
		],
		'12-16': [
			proper(
				'expectation-of-the-blessed-virgin-mary',
				{
					es: 'La Expectación del Parto de la Bienaventurada Virgen María',
					en: 'The Expectation of the Blessed Virgin Mary'
				},
				'm'
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
	observances: [
		{
			at: { fromEaster: -9 },
			observance: {
				id: 'mary-next-to-the-cross',
				names: { es: 'Santa María junto a la Cruz', en: 'Saint Mary next to the Cross' }
			}
		},
		{
			at: { month: 11, weekday: 4, nth: 4 },
			observance: {
				id: 'thanksgiving-day',
				names: {
					es: 'Témporas de Acción de Gracias y Petición por la Actividad Humana',
					en: 'Thanksgiving Day'
				}
			}
		}
	],
	overrides: {
		'our-lady-of-guadalupe': keptAs('f'),
		'our-lady-of-mount-carmel': keptAs('f'),
		'rose-of-lima': keptAs('f')
	},
	moves: {
		'rose-of-lima': { to: '08-30' }
	}
};
