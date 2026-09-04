/**
 * Venezuela — the General Roman Calendar as the Conferencia Episcopal
 * Venezolana keeps it.
 *
 * The layer with the most Marian rows of the fifteen, and the one that shows
 * a move the others do not: OUR LADY OF SORROWS IS KEPT ON THE FRIDAY OF THE
 * FIFTH WEEK OF LENT rather than on 15 September — the day the Seven Sorrows
 * were kept before 1969 — so a general celebration leaves the fixed calendar
 * and joins the temporal cycle. That is why `moves` accepts a rule as well as
 * a date (`../types.ts`).
 *
 * See `co.ts` for the pattern this shares with the other Spanish-American
 * layers: the Holy Cross on 3 May, and the Eternal High Priest on the
 * Thursday after Pentecost.
 */

import type { NationalCalendar } from '../types';
import { THURSDAY_AFTER_PENTECOST, keptAs, proper } from './common';

/** The Friday of the Fifth Week of Lent — the Friday before Palm Sunday. */
const FRIDAY_OF_LENT_V = { fromEaster: -9 } as const;

export const VENEZUELA: NationalCalendar = {
	id: 've',
	options: { ascensionOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'02-01': [
			proper(
				'candelaria-de-san-jose',
				{
					es: 'Beata Candelaria de San José, virgen',
					en: 'Blessed Candelaria of Saint Joseph, Virgin'
				},
				'o'
			)
		],
		'02-05': [
			proper(
				'philip-of-jesus',
				{ es: 'San Felipe de Jesús, mártir', en: 'Saint Philip of Jesus, Martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'04-27': [
			proper(
				'turibius-proper',
				{ es: 'Santo Toribio de Mogrovejo, obispo', en: 'Saint Turibius of Mogrovejo, Bishop' },
				'm'
			)
		],
		'05-07': [
			proper(
				'maria-de-san-jose',
				{
					es: 'Beata María de San José, virgen',
					en: 'Blessed María of Saint Joseph, Virgin'
				},
				'o'
			)
		],
		'05-09': [
			proper(
				'carmen-rendiles',
				{ es: 'Beata Carmen Rendiles, virgen', en: 'Blessed Carmen Rendiles, Virgin' },
				'o'
			)
		],
		'05-15': [
			proper(
				'isidore-the-farmer',
				{ es: 'San Isidro Labrador', en: 'Saint Isidore the Farmer' },
				'm'
			)
		],
		'05-24': [
			proper(
				'our-lady-help-of-christians',
				{ es: 'Beata Virgen María Auxiliadora', en: 'Our Lady Help of Christians' },
				'm',
				{ marian: true }
			)
		],
		'05-26': [
			proper(
				'mariana-de-jesus-paredes',
				{
					es: 'Santa Mariana de Jesús de Paredes, virgen',
					en: 'Saint Mariana de Jesús de Paredes, Virgin'
				},
				'o'
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
		'06-27': [
			proper(
				'our-lady-of-perpetual-help',
				{ es: 'Nuestra Señora del Perpetuo Socorro', en: 'Our Lady of Perpetual Help' },
				'o',
				{ marian: true }
			)
		],
		'07-13': [
			proper(
				'teresa-of-los-andes',
				{
					es: 'Santa Teresa de Jesús de Los Andes, virgen',
					en: 'Saint Teresa of Jesus of the Andes, Virgin'
				},
				'o'
			)
		],
		'07-14': [
			proper(
				'francisco-solano',
				{ es: 'San Francisco Solano, presbítero', en: 'Saint Francisco Solano, Priest' },
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
		// The patroness of Venezuela.
		'09-11': [
			proper(
				'our-lady-of-coromoto',
				{ es: 'Nuestra Señora de Coromoto', en: 'Our Lady of Coromoto' },
				's',
				{ marian: true }
			)
		],
		'09-24': [
			proper(
				'our-lady-of-mercy',
				{ es: 'Nuestra Señora de la Merced', en: 'Our Lady of Mercy' },
				'm',
				{ marian: true }
			)
		],
		'10-09': [
			proper(
				'louis-bertrand',
				{ es: 'San Luis Bertrán, presbítero', en: 'Saint Louis Bertrand, Priest' },
				'o'
			)
		],
		'10-26': [
			proper(
				'jose-gregorio-hernandez',
				{ es: 'Beato José Gregorio Hernández', en: 'Blessed José Gregorio Hernández' },
				'o'
			)
		],
		'11-27': [
			proper(
				'our-lady-of-the-miraculous-medal',
				{
					es: 'Nuestra Señora de la Medalla Milagrosa',
					en: 'Our Lady of the Miraculous Medal'
				},
				'o',
				{ marian: true }
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
		},
		{
			// The Saturday after the Third Sunday of Easter. Omitted in a year
			// where a feast takes the day — 25 April 2026 is Saint Mark — which
			// is what a memorial does and needs no rule of its own.
			at: { fromEaster: 20 },
			celebration: proper(
				'mother-of-the-good-shepherd',
				{
					es: 'Beata Virgen María, Madre del Divino Pastor',
					en: 'The Blessed Virgin Mary, Mother of the Good Shepherd'
				},
				'o',
				{ marian: true }
			)
		}
	],

	overrides: {
		'our-lady-of-lourdes': keptAs('f'),
		'our-lady-of-fatima': keptAs('m'),
		'our-lady-of-mount-carmel': keptAs('f'),
		'our-lady-of-guadalupe': keptAs('f'),
		'anthony-mary-claret': keptAs('m'),
		'martin-de-porres': keptAs('m'),
		'peter-claver': keptAs('m'),
		'rose-of-lima': keptAs('m'),
		// Two the conference keeps at a lower rank than the general calendar.
		agatha: keptAs('o', 'red'),
		'philip-neri': keptAs('o'),
		// Kept on 27 April as a proper of its own rather than moved, since the
		// conference gives it a rank the general calendar does not.
		turibius: null
	},

	moves: {
		'exaltation-of-the-cross': { to: '05-03' },
		'philip-james': { to: '05-04' },
		'our-lady-of-sorrows': { to: FRIDAY_OF_LENT_V },
		'rose-of-lima': { to: '08-30' }
	}
};
