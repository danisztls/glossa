/**
 * Bolivia — the General Roman Calendar as Bolivia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Bolivia actually does
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

export const BOLIVIA: NationalCalendar = {
	id: 'bo',
	options: { ascensionOnSunday: true },
	propers: {
		'05-15': [
			proper(
				'isidore-the-farmer',
				{ es: 'San Isidro Labrador', en: 'Saint Isidore the Farmer' },
				'o'
			)
		],
		'05-24': [
			proper(
				'help-of-christians',
				{ es: 'María, Auxilio de los cristianos', en: 'Our Lady Help of Christians' },
				'o'
			)
		],
		'05-25': [
			proper(
				'mariana-de-jesus-de-paredes',
				{
					es: 'Santa Mariana de Jesús de Paredes, virgen',
					en: 'Saint Mariana de Jesús de Paredes, virgin'
				},
				'o'
			)
		],
		'07-06': [
			proper(
				'nazaria-ignacia-march-mesa',
				{
					es: 'Santa Nazaria Ignacia March Mesa, religiosa',
					en: 'Saint Nazaria Ignacia March Mesa, religious'
				},
				'f'
			)
		],
		'07-14': [
			proper(
				'francisco-solano',
				{ es: 'San Francisco Solano, presbítero', en: 'Saint Francisco Solano, priest' },
				'm'
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
		'09-18': [
			proper(
				'juan-macias',
				{ es: 'San Juan Macías, religioso', en: 'Saint Juan Macias, religious' },
				'm'
			)
		],
		'09-24': [proper('mercy', { es: 'Nuestra Señora de la Merced', en: 'Our Lady of Mercy' }, 'o')],
		'10-09': [
			proper(
				'louis-bertrand',
				{ es: 'San Luis Bertrán, presbítero', en: 'Saint Louis Bertrand, priest' },
				'o'
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
		'10-12': [
			proper('the-pillar', { es: 'Nuestra Señora del Pilar', en: 'Our Lady of the Pillar' }, 'o')
		],
		'10-21': [
			proper(
				'miguel-febres-cordero',
				{
					es: 'San Miguel Febres Cordero, religioso',
					en: 'Saint Miguel Febres Cordero, religious'
				},
				'o'
			)
		],
		'11-19': [
			proper(
				'roque-gonzalez',
				{
					es: 'Santos Roque González, Juan del Castillo y Alfonso Rodríguez, presbíteros y mártires',
					en: 'Saint Roque González, Saint Alfonso Rodríguez and Saint Juan del Castillo, priests and martyrs'
				},
				'm',
				{ colour: 'red' }
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
		'anthony-mary-claret': keptAs('m'),
		'martin-de-porres': keptAs('m'),
		'our-lady-of-guadalupe': keptAs('f'),
		'our-lady-of-mount-carmel': keptAs('s'),
		'peter-claver': keptAs('m'),
		'rose-of-lima': keptAs('f')
	},
	moves: {
		camillus: { to: '07-12' },
		'rose-of-lima': { to: '08-30' }
	}
};
