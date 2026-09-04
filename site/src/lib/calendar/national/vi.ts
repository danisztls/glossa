/**
 * The United States Virgin Islands — the General Roman Calendar as its bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what the United States Virgin Islands actually does
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

export const VIRGIN_ISLANDS: NationalCalendar = {
	id: 'vi',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-04': [
			proper(
				'elizabeth-ann-seton',
				{ es: 'Santa Isabel Ana Seton, religiosa', en: 'Saint Elizabeth Ann Seton, religious' },
				'm'
			)
		],
		'01-05': [
			proper(
				'john-neumann',
				{ es: 'San Juan Nepomuceno Neumann, obispo', en: 'Saint John Neumann, bishop' },
				'm'
			)
		],
		'01-06': [
			proper(
				'andre-bessette',
				{ es: 'San Andrés Bessette, religioso', en: 'Saint André Bessette, religious' },
				'o'
			)
		],
		'01-23': [
			proper(
				'marianne-cope',
				{ es: 'Santa Mariana Cope, virgen', en: 'Saint Marianne Cope, virgin' },
				'o'
			)
		],
		'03-03': [
			proper(
				'katherine-drexel',
				{ es: 'Santa Catalina Drexel, virgin', en: 'Saint Katherine Drexel, virgin' },
				'o'
			)
		],
		'05-10': [
			proper(
				'damien-de-veuster',
				{ es: 'San Damián de Veuster, presbítero', en: 'Saint Damien de Veuster, priest' },
				'o'
			)
		],
		'05-15': [
			proper(
				'isidore-the-farmer',
				{ es: 'San Isidro Labrador', en: 'Saint Isidore the Farmer' },
				'o'
			)
		],
		'07-01': [
			proper(
				'junipero-serra',
				{ es: 'San Junípero Serra, presbítero', en: 'Saint Junipero Serra, priest' },
				'o'
			)
		],
		'07-14': [
			proper(
				'kateri-tekakwitha',
				{ es: 'Santa Kateri Tekakwitha, virgen', en: 'Saint Kateri Tekakwitha, virgin' },
				'm'
			)
		],
		'10-05': [
			proper(
				'francis-xavier-seelos',
				{
					es: 'Beato Francisco Javier Seelos, presbítero',
					en: 'Blessed Francis Xavier Seelos, Priest'
				},
				'o'
			)
		],
		'10-06': [
			proper(
				'marie-rose-durocher',
				{ es: 'Beata María Rosa Durocher, virgen', en: 'Blessed Marie-Rose Durocher, religious' },
				'o'
			)
		],
		'11-13': [
			proper(
				'frances-xavier-cabrini',
				{
					es: 'Santa Francisca Javier Cabrini, virgen',
					en: 'Saint Frances Xavier Cabrini, virgin'
				},
				'm'
			)
		],
		'11-18': [
			proper(
				'rose-philippine-duchesne',
				{
					es: 'La Dedicación de las Basílicas de los Santos Pedro y Pablo, apóstoles',
					en: 'Saint Rose Philippine Duchesne, virgin'
				},
				'o'
			)
		],
		'11-23': [
			proper(
				'miguel-agustin-pro',
				{
					es: 'Beato Miguel Agustín Pro, presbítero y mártir',
					en: 'Blessed Miguel Agustín Pro, Priest and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		]
	},
	observances: [
		{
			at: '01-22',
			observance: {
				id: 'day-of-prayer-for-the-legal-protection-of-unborn-children',
				names: {
					es: 'Día de oración por la protección legal de la criatura en el vientre materno',
					en: 'Day of Prayer for the Legal Protection of Unborn Children'
				}
			}
		},
		{
			at: '07-04',
			observance: {
				id: 'independence-day',
				names: { es: 'Día de la Independencia de los Estados Unidos', en: 'Independence Day' }
			}
		},
		{
			at: { month: 9, weekday: 1, nth: 1 },
			observance: { id: 'labor-day', names: { es: 'Día del trabajo', en: 'Labor Day' } }
		},
		{
			at: { month: 11, weekday: 4, nth: 4 },
			observance: {
				id: 'thanksgiving-day',
				names: { es: 'Día de Acción de Gracias', en: 'Thanksgiving Day' }
			}
		}
	],
	overrides: {
		'north-american-martyrs': keptAs('m'),
		'our-lady-of-guadalupe': keptAs('f'),
		'peter-claver': keptAs('m')
	},
	moves: {
		camillus: { to: '07-18' },
		'elizabeth-of-portugal': { to: '07-05' },
		'paul-of-the-cross': { to: '10-20' },
		'vincent-deacon': { to: '01-23' }
	}
};
