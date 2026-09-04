/**
 * Spain — the General Roman Calendar as the Conferencia Episcopal Española
 * keeps it.
 *
 * Two rows here are the only ones of their kind in these fifteen layers.
 * SAINT JAMES IS A SOLEMNITY, the patron of Spain raised from the general
 * calendar's feast — no other conference here raises an apostle. And THE
 * IMMACULATE CONCEPTION IS KEPT IN BLUE, the *privilegio de azul* Spain
 * obtained in the eighteenth century, which of these sixteen calendars only
 * the Philippines keeps besides (`Colour` in `../types.ts`).
 */

import type { NationalCalendar } from '../types';
import { BLUE_IMMACULATE_CONCEPTION, THURSDAY_AFTER_PENTECOST, keptAs, proper } from './common';

export const SPAIN: NationalCalendar = {
	id: 'es',
	options: { epiphanyOnSunday: false, ascensionOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'01-09': [
			proper(
				'eulogius-of-cordoba',
				{
					es: 'San Eulogio de Córdoba, presbítero y mártir',
					en: 'Saint Eulogius of Córdoba, Priest and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-20': [
			proper(
				'fructuosus-augurius-eulogius',
				{
					es: 'Santos Fructuoso, obispo, y Augurio y Eulogio, diáconos, mártires',
					en: 'Saints Fructuosus, Bishop, and Augurius and Eulogius, Deacons, Martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-23': [
			proper(
				'ildephonsus-of-toledo',
				{ es: 'San Ildefonso de Toledo, obispo', en: 'Saint Ildephonsus of Toledo, Bishop' },
				'm'
			)
		],
		'04-13': [
			proper(
				'hermenegild',
				{ es: 'San Hermenegildo, mártir', en: 'Saint Hermenegild, Martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'05-15': [
			proper(
				'isidore-the-farmer',
				{ es: 'San Isidro Labrador', en: 'Saint Isidore the Farmer' },
				'm'
			)
		],
		'05-17': [
			proper(
				'paschal-baylon',
				{ es: 'San Pascual Bailón, religioso', en: 'Saint Paschal Baylón, Religious' },
				'o'
			)
		],
		'05-22': [
			proper(
				'joaquina-vedruna',
				{ es: 'Santa Joaquina Vedruna, religiosa', en: 'Saint Joaquina Vedruna, Religious' },
				'o'
			)
		],
		'05-30': [proper('ferdinand', { es: 'San Fernando', en: 'Saint Ferdinand' }, 'o')],
		'06-15': [
			proper(
				'maria-micaela',
				{
					es: 'Santa María Micaela del Santísimo Sacramento, virgen',
					en: 'Saint María Micaela of the Blessed Sacrament, Virgin'
				},
				'o'
			)
		],
		'06-26': [
			proper(
				'pelagius',
				{ es: 'San Pelayo, mártir', en: 'Saint Pelagius of Córdoba, Martyr' },
				'o',
				{
					colour: 'red'
				}
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
				'm'
			)
		],
		'09-24': [
			proper(
				'our-lady-of-mercy',
				{ es: 'Bienaventurada Virgen María de la Merced', en: 'Our Lady of Mercy' },
				'o',
				{ marian: true }
			)
		],
		'10-03': [
			proper(
				'francis-borgia',
				{ es: 'San Francisco de Borja, presbítero', en: 'Saint Francis Borgia, Priest' },
				'o'
			)
		],
		'10-10': [
			proper(
				'thomas-of-villanova',
				{ es: 'Santo Tomás de Villanueva, obispo', en: 'Saint Thomas of Villanova, Bishop' },
				'o'
			)
		],
		'10-11': [
			proper(
				'maria-soledad-torres-acosta',
				{
					es: 'Santa María Soledad Torres Acosta, virgen',
					en: 'Saint María Soledad Torres Acosta, Virgin'
				},
				'o'
			)
		],
		'10-12': [
			proper(
				'our-lady-of-the-pillar',
				{ es: 'Bienaventurada Virgen María del Pilar', en: 'Our Lady of the Pillar' },
				'f',
				{ marian: true }
			)
		],
		'10-19': [
			proper(
				'peter-of-alcantara',
				{ es: 'San Pedro de Alcántara, presbítero', en: 'Saint Peter of Alcántara, Priest' },
				'o'
			)
		],
		'11-05': [
			proper(
				'angela-of-the-cross',
				{
					es: 'Santa Ángela de la Cruz Guerrero González, virgen',
					en: 'Saint Ángela of the Cross Guerrero González, Virgin'
				},
				'o'
			)
		],
		'11-06': [
			proper(
				'pedro-poveda-companions',
				{
					es: 'Santos Pedro Poveda Castroverde e Inocencio de la Inmaculada Canoura Arnau, presbíteros, y compañeros, mártires',
					en: 'Saints Pedro Poveda Castroverde and Inocencio of the Immaculate Canoura Arnau, Priests, and Companions, Martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'11-13': [
			proper(
				'leander-of-seville',
				{ es: 'San Leandro de Sevilla, obispo', en: 'Saint Leander of Seville, Bishop' },
				'o'
			)
		],
		'12-10': [
			proper(
				'eulalia-of-merida',
				{
					es: 'Santa Eulalia de Mérida, virgen y mártir',
					en: 'Saint Eulalia of Mérida, Virgin and Martyr'
				},
				'o',
				{ colour: 'red' }
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
		james: keptAs('s', 'red'),
		'immaculate-conception': BLUE_IMMACULATE_CONCEPTION,
		'teresa-of-avila': keptAs('f'),
		'john-of-avila': keptAs('m'),
		'vincent-deacon': keptAs('m', 'red'),
		'our-lady-of-mount-carmel': keptAs('m'),
		// The four patrons of Europe Spain raises, as Italy and France do.
		benedict: keptAs('f'),
		'cyril-methodius': keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'teresa-benedicta': keptAs('f', 'red'),
		// Isidore of Seville keeps 26 April here as an obligatory memorial —
		// 4 April falls in Lent or Eastertide most years — so `moves` places
		// him and this raises him.
		isidore: keptAs('m')
	},

	/**
	 * The Ember Days of Thanksgiving and Petition, which the Spanish
	 * conference keeps in early October. A TABLE OF YEARS AND NOT A RULE —
	 * Monday 6 October 2025, Monday 5 October 2026, Tuesday 5 October 2027 —
	 * see `observances` in `../types.ts` for why no rule fits.
	 */
	observances: [
		{
			at: { years: { 2025: '10-06', 2026: '10-05', 2027: '10-05' } },
			observance: {
				id: 'ember-days-of-thanksgiving',
				names: {
					es: 'Témporas de Acción de Gracias y de Petición',
					en: 'Ember Days of Thanksgiving and Petition'
				},
				replacesDay: true
			}
		}
	],

	moves: {
		isidore: { to: '04-26' },
		faustina: { to: '10-08' }
	}
};
