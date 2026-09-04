/**
 * Argentina — the General Roman Calendar as the Conferencia Episcopal
 * Argentina keeps it.
 *
 * Two of its propers fall on no date. Our Lady of the Valley, the patroness
 * of Catamarca, is kept on the Saturday after the Second Sunday of Easter;
 * and Saint Mary at the Cross on the Friday of the Fifth Week of Lent, which
 * is where the Seven Sorrows were kept before 1969 — Venezuela does the same
 * thing by moving the general memorial there instead (`ve.ts`).
 *
 * Argentina is the one Spanish-American layer here that does NOT keep the
 * Holy Cross on 3 May, so Philip and James stay where the general calendar
 * has them.
 */

import type { NationalCalendar } from '../types';
import { keptAs, proper } from './common';

export const ARGENTINA: NationalCalendar = {
	id: 'ar',
	options: { ascensionOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'01-22': [
			proper(
				'laura-vicuna',
				{ es: 'Beata Laura Vicuña, virgen', en: 'Blessed Laura Vicuña, Virgin' },
				'o'
			)
		],
		'02-25': [
			proper(
				'ludovica-de-angelis',
				{ es: 'Beata Ludovica de Angelis, virgen', en: 'Blessed Ludovica de Angelis, Virgin' },
				'o'
			)
		],
		'03-07': [
			proper(
				'maria-antonia-de-paz-y-figueroa',
				{
					es: 'Santa María Antonia de Paz y Figueroa, virgen',
					en: 'Saint María Antonia de Paz y Figueroa, Virgin'
				},
				'o'
			)
		],
		'03-16': [
			proper(
				'jose-gabriel-brochero',
				{
					es: 'San José Gabriel Brochero, presbítero',
					en: 'Saint José Gabriel Brochero, Priest'
				},
				'o'
			)
		],
		'04-27': [
			proper(
				'turibius-proper',
				{ es: 'Santo Toribio de Mogrovejo, obispo', en: 'Saint Turibius of Mogrovejo, Bishop' },
				'f'
			)
		],
		// The patroness of Argentina.
		'05-08': [
			proper('our-lady-of-lujan', { es: 'Nuestra Señora de Luján', en: 'Our Lady of Luján' }, 's', {
				marian: true
			})
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
				'luigi-orione',
				{ es: 'San Luis Orione, presbítero', en: 'Saint Luigi Orione, Priest' },
				'o'
			)
		],
		'05-20': [
			proper(
				'crescencia-perez',
				{ es: 'Beata Crescencia Pérez, religiosa', en: 'Blessed Crescencia Pérez, Religious' },
				'o'
			)
		],
		'05-24': [
			proper(
				'our-lady-help-of-christians',
				{ es: 'María, Auxilio de los cristianos', en: 'Our Lady Help of Christians' },
				'o',
				{ marian: true }
			)
		],
		'07-06': [
			proper(
				'nazaria-ignacia-march',
				{
					es: 'Santa Nazaria Ignacia March Mesa, religiosa',
					en: 'Saint Nazaria Ignacia March Mesa, Religious'
				},
				'o'
			)
		],
		'07-09': [
			proper('our-lady-of-itati', { es: 'Nuestra Señora de Itatí', en: 'Our Lady of Itatí' }, 'm', {
				marian: true
			})
		],
		'07-24': [
			proper(
				'francisco-solano',
				{ es: 'San Francisco Solano, presbítero', en: 'Saint Francisco Solano, Priest' },
				'm'
			)
		],
		'08-16': [proper('roch', { es: 'San Roque', en: 'Saint Roch' }, 'o')],
		'08-25': [
			proper(
				'maria-transito-cabanillas',
				{
					es: 'Beata María Tránsito Cabanillas de Jesús Sacramentado, religiosa',
					en: 'Blessed María Tránsito Cabanillas of the Blessed Sacrament, Religious'
				},
				'o'
			)
		],
		'08-26': [
			proper(
				'ceferino-namuncura',
				{ es: 'Beato Ceferino Namuncurá', en: 'Blessed Ceferino Namuncurá' },
				'o'
			)
		],
		'09-24': [
			proper(
				'our-lady-of-mercy',
				{ es: 'Nuestra Señora de la Merced', en: 'Our Lady of Mercy' },
				'm',
				{
					marian: true
				}
			)
		],
		'10-09': [
			proper(
				'hector-valdivielso',
				{
					es: 'San Héctor Valdivielso Sáez, mártir',
					en: 'Saint Héctor Valdivielso Sáez, Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'10-12': [
			proper(
				'our-lady-of-the-pillar',
				{ es: 'Nuestra Señora del Pilar', en: 'Our Lady of the Pillar' },
				'o',
				{ marian: true }
			)
		],
		'11-07': [
			proper(
				'mary-mediatrix',
				{
					es: 'María, Madre y Medianera de la gracia',
					en: 'Mary, Mother and Mediatrix of Grace'
				},
				'm',
				{ marian: true }
			)
		],
		'11-13': [
			proper(
				'artemide-zatti',
				{ es: 'San Artémides Zatti, religioso', en: 'Saint Artemide Zatti, Religious' },
				'o'
			)
		],
		'11-17': [
			proper(
				'roque-gonzalez',
				{
					es: 'Santos Roque González, Alfonso Rodríguez y Juan del Castillo, presbíteros y mártires',
					en: 'Saints Roque González, Alfonso Rodríguez and Juan del Castillo, Priests and Martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		]
	},

	movable: [
		{
			// The Saturday after the Second Sunday of Easter.
			at: { fromEaster: 13 },
			celebration: proper(
				'our-lady-of-the-valley',
				{ es: 'Nuestra Señora del Valle', en: 'Our Lady of the Valley' },
				'm',
				{ marian: true }
			)
		},
		{
			// The Friday of the Fifth Week of Lent, so kept as a commemoration
			// in every year it is not impeded — 19 March 2027 is Saint Joseph.
			at: { fromEaster: -9 },
			celebration: proper(
				'mary-at-the-cross',
				{ es: 'Santa María junto a la Cruz', en: 'Saint Mary at the Cross' },
				'o',
				{ marian: true }
			)
		}
	],

	overrides: {
		'our-lady-of-guadalupe': keptAs('f'),
		'our-lady-of-mount-carmel': keptAs('m'),
		'rose-of-lima': keptAs('f')
	},

	moves: {
		turibius: { to: '04-27' },
		sharbel: { to: '07-23' },
		'augustine-zhao-rong': { to: '07-10' },
		'rose-of-lima': { to: '08-30' },
		'elizabeth-of-hungary': { to: '11-19' }
	}
};
