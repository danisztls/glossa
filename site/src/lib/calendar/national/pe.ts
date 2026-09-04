/**
 * Peru — the General Roman Calendar as the Conferencia Episcopal Peruana
 * keeps it.
 *
 * Peru raises four saints of its own past the rank the general calendar gives
 * them, and Rose of Lima to a SOLEMNITY: she is the patroness of Peru and of
 * all Latin America, kept on 30 August rather than the general calendar's 23rd.
 * Turibius of Mogrovejo moves the other way — off 23 March, which falls in
 * Lent or Holy Week in most years, to 27 April, and up to a feast.
 *
 * See `co.ts` for the pattern this shares with the other Spanish-American
 * layers: the Holy Cross on 3 May, and the Eternal High Priest on the
 * Thursday after Pentecost.
 */

import type { NationalCalendar } from '../types';
import { THURSDAY_AFTER_PENTECOST, keptAs, proper } from './common';

export const PERU: NationalCalendar = {
	id: 'pe',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'01-10': [
			proper(
				'ana-de-los-angeles-monteagudo',
				{
					es: 'Beata Ana de los Ángeles Monteagudo, virgen',
					en: 'Blessed Ana de los Ángeles Monteagudo, Virgin'
				},
				'm'
			)
		],
		'05-24': [
			proper(
				'our-lady-help-of-christians',
				{
					es: 'Virgen María Auxiliadora de los Cristianos',
					en: 'Our Lady Help of Christians'
				},
				'o',
				{ marian: true }
			)
		],
		'05-25': [
			proper(
				'madeleine-sophie-barat',
				{
					es: 'Santa Magdalena Sofía Barat, virgen',
					en: 'Saint Madeleine Sophie Barat, Virgin'
				},
				'o'
			)
		],
		'05-26': [
			proper(
				'mariana-de-jesus-paredes',
				{
					es: 'Santa Mariana de Jesús de Paredes, virgen',
					en: 'Saint Mariana de Jesús de Paredes, Virgin'
				},
				'f'
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
		'07-14': [
			proper(
				'francisco-solano',
				{ es: 'San Francisco Solano, presbítero', en: 'Saint Francisco Solano, Priest' },
				'f'
			)
		],
		'07-28': [
			proper(
				'mary-queen-of-peace',
				{
					es: 'Bienaventurada Virgen María, Reina de la paz',
					en: 'The Blessed Virgin Mary, Queen of Peace'
				},
				'f',
				{ marian: true }
			)
		],
		'09-18': [
			proper(
				'juan-macias',
				{ es: 'San Juan Macías, religioso', en: 'Saint Juan Macías, Religious' },
				'f'
			)
		],
		'09-24': [
			proper(
				'our-lady-of-mercy',
				{ es: 'Nuestra Señora de la Merced', en: 'Our Lady of Mercy' },
				'o',
				{ marian: true }
			)
		],
		'10-12': [
			proper(
				'our-lady-of-the-pillar',
				{ es: 'Bienaventurada Virgen María del Pilar', en: 'Our Lady of the Pillar' },
				'o',
				{ marian: true }
			),
			proper('carlo-acutis', { es: 'San Carlo Acutis', en: 'Saint Carlo Acutis' }, 'o', {
				// Canonised in 2025 and inscribed from 2026, exactly as John
				// Henry Newman is in the general calendar. THE CALENDAR IS NOT
				// A CONSTANT — see `since` in `../types.ts`.
				since: 2026
			})
		],
		// El Señor de los Milagros: the procession in Lima each October is the
		// largest in the Americas.
		'10-28': [
			proper(
				'lord-of-miracles',
				{ es: 'Nuestro Señor de los Milagros', en: 'The Lord of Miracles' },
				'F'
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
		'rose-of-lima': keptAs('s'),
		'martin-de-porres': keptAs('s'),
		turibius: keptAs('f'),
		'philip-neri': keptAs('o'),
		'our-lady-of-guadalupe': keptAs('f'),
		camillus: null
	},

	moves: {
		'exaltation-of-the-cross': { to: '05-03' },
		'philip-james': { to: '05-04' },
		turibius: { to: '04-27' },
		'philip-neri': { to: '05-27' },
		'rose-of-lima': { to: '08-30' },
		'simon-jude': { to: '10-29' }
	}
};
