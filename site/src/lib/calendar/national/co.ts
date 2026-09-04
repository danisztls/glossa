/**
 * Colombia — the General Roman Calendar as the Conferencia Episcopal de
 * Colombia keeps it.
 *
 * The first of the five Spanish-American layers here, and the one to read
 * first: they share a pattern the general calendar does not have. All five
 * keep the Holy Cross on 3 MAY, where Spanish usage kept the Finding of the
 * Cross before 1969, which displaces Philip and James to the 4th and leaves
 * 14 September without its feast; and all five keep Our Lord Jesus Christ the
 * Eternal High Priest on the Thursday after Pentecost, a feast Benedict XVI
 * granted to conferences that asked for it in 2012 and which is in none of
 * the eight variants of the general calendar.
 */

import type { NationalCalendar } from '../types';
import { THURSDAY_AFTER_PENTECOST, keptAs, proper } from './common';

export const COLOMBIA: NationalCalendar = {
	id: 'co',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'05-19': [
			proper(
				'maria-bernarda-butler',
				{ es: 'Santa María Bernarda Bütler, virgen', en: 'Saint Maria Bernarda Bütler, Virgin' },
				'o'
			)
		],
		'05-26': [
			proper(
				'mariana-de-jesus-paredes',
				{
					es: 'Santa Mariana de Jesús Paredes y Flórez, virgen',
					en: 'Saint Mariana de Jesús de Paredes, Virgin'
				},
				'm'
			)
		],
		'06-26': [
			proper(
				'josemaria-escriva',
				{
					es: 'San Josemaría Escrivá de Balaguer, presbítero',
					en: 'Saint Josemaría Escrivá de Balaguer, Priest'
				},
				'o'
			)
		],
		// The patroness of Colombia.
		'07-09': [
			proper(
				'our-lady-of-chiquinquira',
				{
					es: 'Nuestra Señora del Rosario de Chiquinquirá',
					en: 'Our Lady of the Rosary of Chiquinquirá'
				},
				'f',
				{ marian: true }
			)
		],
		'08-17': [
			proper(
				'beatrice-of-silva',
				{ es: 'Santa Beatriz da Silva, virgen', en: 'Saint Beatrice of Silva, Virgin' },
				'm'
			)
		],
		'08-19': [
			proper(
				'ezequiel-moreno',
				{ es: 'San Ezequiel Moreno Díaz, obispo', en: 'Saint Ezequiel Moreno Díaz, Bishop' },
				'o'
			)
		],
		'08-26': [
			proper(
				'teresa-jornet',
				{
					es: 'Santa Teresa de Jesús Jornet e Ibars, virgen',
					en: 'Saint Teresa Jornet Ibars, Virgin'
				},
				'o'
			)
		],
		'10-09': [
			proper(
				'louis-bertrand',
				{ es: 'San Luis Bertrán, presbítero', en: 'Saint Louis Bertrand, Priest' },
				'm'
			)
		],
		'10-21': [
			proper(
				'laura-montoya',
				{ es: 'Santa Laura Montoya, virgen', en: 'Saint Laura Montoya, Virgin' },
				'o'
			)
		]
	},

	movable: [
		{
			at: THURSDAY_AFTER_PENTECOST,
			celebration: proper(
				'eternal-high-priest',
				{
					es: 'Nuestro Señor Jesucristo, Sumo y Eterno Sacerdote',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'F'
			)
		}
	],

	overrides: {
		'our-lady-of-guadalupe': keptAs('f'),
		'our-lady-of-mount-carmel': keptAs('m'),
		'martin-de-porres': keptAs('m'),
		'peter-claver': keptAs('m'),
		'rose-of-lima': keptAs('f'),
		denis: null,
		'john-leonardi': null,
		'john-henry-newman': null
	},

	moves: {
		'exaltation-of-the-cross': { to: '05-03' },
		'philip-james': { to: '05-04' },
		'philip-neri': { to: '05-28' },
		'augustine-zhao-rong': { to: '07-10' }
	}
};
