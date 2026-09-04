/**
 * Mexico — the General Roman Calendar as the Mexican bishops' conference
 * keeps it.
 *
 * The largest of these layers after Brazil's, and the one that shows most
 * clearly that a national calendar is not a list of extra saints. Mexico
 * moves two celebrations of the Lord: the Holy Cross to 3 May, where Spanish
 * usage kept the Finding of the Cross for centuries, which pushes Philip and
 * James to the 4th; and it keeps Guadalupe as a SOLEMNITY, which takes 12
 * December whole and displaces Saint Lucy in a year where it has to move.
 *
 * See `common.ts` for what a row means and `br.ts` for the worked example.
 */

import type { NationalCalendar } from '../types';
import { THURSDAY_AFTER_PENTECOST, keptAs, proper } from './common';

export const MEXICO: NationalCalendar = {
	id: 'mx',
	// Epiphany and Corpus Christi on Sundays; the Ascension keeps its Thursday.
	options: { epiphanyOnSunday: true, ascensionOnSunday: true },

	propers: {
		'02-05': [
			proper(
				'philip-of-jesus',
				{ es: 'San Felipe de Jesús, mártir', en: 'Saint Philip of Jesus, Martyr' },
				'f',
				{ colour: 'red' }
			)
		],
		'02-10': [
			proper(
				'jose-luis-sanchez-del-rio',
				{
					es: 'San José Luis Sánchez del Río, mártir',
					en: 'Saint José Luis Sánchez del Río, Martyr'
				},
				'o',
				{ colour: 'red', since: 2026 }
			)
		],
		'02-25': [
			proper(
				'sebastian-de-aparicio',
				{
					es: 'Beato Sebastián de Aparicio, religioso',
					en: 'Blessed Sebastián de Aparicio, Religious'
				},
				'o'
			)
		],
		'04-27': [
			proper(
				'maria-guadalupe-garcia-zavala',
				{
					es: 'Santa María Guadalupe García Zavala, virgen',
					en: 'Saint María Guadalupe García Zavala, Virgin'
				},
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
		'05-16': [
			proper(
				'john-of-nepomuk',
				{
					es: 'San Juan Nepomuceno, presbítero y mártir',
					en: 'Saint John of Nepomuk, Priest and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'06-27': [
			proper(
				'our-lady-of-perpetual-help',
				{ es: 'Nuestra Señora del Perpetuo Socorro', en: 'Our Lady of Perpetual Help' },
				'o',
				{ marian: true }
			)
		],
		'07-04': [
			proper(
				'our-lady-of-refuge',
				{ es: 'Nuestra Señora del Refugio', en: 'Our Lady of Refuge' },
				'o',
				{ marian: true }
			)
		],
		'07-30': [
			proper(
				'maria-de-jesus-sacramentado-venegas',
				{
					es: 'Santa María de Jesús Sacramentado Venegas, virgen',
					en: 'Saint María de Jesús Sacramentado Venegas, Virgin'
				},
				'o'
			)
		],
		'08-16': [
			proper(
				'bartolome-laurel',
				{
					es: 'Beato Bartolomé Laurel, religioso y mártir',
					en: 'Blessed Bartolomé Laurel, Religious and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'08-19': [
			proper(
				'pedro-zuniga-luis-flores',
				{
					es: 'Beato Pedro Zúñiga y Beato Luis Flores, presbíteros y mártires',
					en: 'Blessed Pedro Zúñiga and Blessed Luis Flores, Priests and Martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'08-26': [
			proper(
				'junipero-serra',
				{ es: 'San Junípero Serra, presbítero', en: 'Saint Junípero Serra, Priest' },
				'o'
			)
		],
		'09-02': [
			proper(
				'bartolome-gutierrez',
				{
					es: 'Beato Bartolomé Gutiérrez, presbítero y mártir',
					en: 'Blessed Bartolomé Gutiérrez, Priest and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-19': [
			proper(
				'jose-maria-de-yermo-y-parres',
				{
					es: 'San José María de Yermo y Parres, presbítero',
					en: 'Saint José María de Yermo y Parres, Priest'
				},
				'o'
			)
		],
		'09-23': [
			proper(
				'christopher-anthony-john',
				{
					es: 'Santos Cristóbal, Antonio y Juan, mártires',
					en: 'Saints Christopher, Anthony and John, Martyrs'
				},
				'o',
				{ colour: 'red', since: 2026 }
			)
		],
		'10-24': [
			proper(
				'rafael-guizar-y-valencia',
				{
					es: 'San Rafael Guízar y Valencia, obispo',
					en: 'Saint Rafael Guízar y Valencia, Bishop'
				},
				'f'
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
		// Guadalupe is the patroness of Mexico and of the Americas, and the
		// only Marian solemnity any of these layers adds.
		'our-lady-of-guadalupe': keptAs('s'),
		'juan-diego': keptAs('m'),
		'christopher-magallanes': keptAs('m', 'red'),
		'martin-de-porres': keptAs('m'),
		'our-lady-of-mount-carmel': keptAs('m'),
		'rose-of-lima': keptAs('f'),
		// Two general memorials Mexico kept as obligatory in 2025 and has kept
		// as optional since 2026 — a conference changing its mind, and the
		// reason `since` on an override gates the OVERRIDE.
		scholastica: { ...keptAs('o'), since: 2026 },
		'padre-pio': { ...keptAs('o'), since: 2026 }
	},

	/**
	 * Five general celebrations kept on another day.
	 *
	 * The first two are the chain the Holy Cross starts: Mexico keeps the
	 * Exaltation on 3 May rather than 14 September, which is where Philip and
	 * James were, so they go to the 4th. The rest are ordinary displacement —
	 * a proper takes the date and the general celebration steps aside by a
	 * day, except Rose of Lima, whom Mexico keeps a week later as a feast.
	 */
	moves: {
		'exaltation-of-the-cross': { to: '05-03' },
		'philip-james': { to: '05-04' },
		agatha: { to: '02-04', displacedBy: 'philip-of-jesus' },
		'rose-of-lima': { to: '08-30' },
		'anthony-mary-claret': { to: '10-25' }
	}
};
