/**
 * Andorra — the General Roman Calendar as Andorra’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Andorra actually does
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
 *   - Our Lady of Montserrat: kept on 2025 2025-04-29, 2026 2026-04-27, 2027 2027-04-27 -- no fixed date and no fixed offset from Easter
 */

export const ANDORRA: NationalCalendar = {
	id: 'ad',
	options: { ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-09': [
			proper(
				'eulogius-of-cordoba',
				{
					es: 'San Eulogio de Córdoba, presbítero y mártir',
					en: 'Saint Eulogius of Cordoba, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-11': [
			proper(
				'ana-maria-janer',
				{ es: 'Beata Ana María Janer, virgen', en: 'Blessed Ana María Janer, virgin' },
				'o'
			)
		],
		'01-18': [
			proper(
				'jaime-hilario-barbal',
				{
					es: 'San Jaime Hilario Barbal, religioso y mártir',
					en: 'Saint Jaime Hilario Barbal, religious and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-21': [
			proper(
				'fructuosus',
				{
					es: 'Santos Fructuoso, obispo, y Augurio y Eulogio, diáconos, mártires',
					en: 'Saint Fructuosus, bishop, and Saint Augurius and Saint Eulogius, deacons, martyrs'
				},
				'f',
				{ colour: 'red' }
			)
		],
		'01-23': [
			proper(
				'ildephonsus-of-toledo',
				{ es: 'San Ildefonso de Toledo, obispo', en: 'Saint Ildephonsus of Toledo, bishop' },
				'm'
			)
		],
		'04-13': [
			proper(
				'hermenegild',
				{ es: 'San Hermenegildo, mártir', en: 'Saint Hermenegild, martyr' },
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
				{ es: 'San Pascual Bailón, religioso', en: 'Saint Paschal Baylon, religious' },
				'o'
			)
		],
		'05-22': [
			proper(
				'joaquina-vedruna',
				{ es: 'Santa Joaquina Vedruna, religiosa', en: 'Saint Joaquina Vedruna, religious' },
				'o'
			)
		],
		'05-29': [
			proper(
				'just-of-urgell',
				{ es: 'San Justo de Urgell, obispo', en: 'Saint Just of Urgell, bishop' },
				'm'
			)
		],
		'05-30': [proper('ferdinand', { es: 'San Fernando', en: 'Saint Ferdinand' }, 'o')],
		'06-15': [
			proper(
				'maria-micaela-desmaisieres',
				{
					es: 'Santa María Micaela del Santísimo Sacramento, virgen',
					en: 'Saint Maria Micaela Desmaisieres, virgin'
				},
				'o'
			)
		],
		'06-26': [
			proper(
				'josemaria-escriva-de-balaguer',
				{
					es: 'San Josemaría Escrivá de Balaguer, presbítero',
					en: 'Saint Josemaría Escrivá de Balaguer, priest'
				},
				'o'
			),
			proper(
				'pelagius-of-cordoba',
				{ es: 'San Pelayo, mártir', en: 'Saint Pelagius of Córdoba, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'07-07': [
			proper(
				'odon-of-urgell',
				{ es: 'San Odón de Urgell, obispo', en: 'Saint Odon of Urgell, bishop' },
				'm'
			)
		],
		'07-24': [
			proper(
				'jose-sala-pico',
				{
					es: 'Beatos José Sala Picó, presbítero, y compañeros, mártires',
					en: 'Blessed José Sala Picó, priest, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-30': [
			proper(
				'protasio-cubells-and-companions',
				{
					es: 'Beatos Protasio Cubells y compañeros, mártires',
					en: 'Blessed Protasio Cubells and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'08-12': [
			proper(
				'eusebio-codina-milla',
				{
					es: 'Beatos Eusebio Codina Millá, Ramón Illa Salvia y Sebastián Riera Coromina, religiosos, y compañeros, mártires',
					en: 'Blessed Eusebio Codina Millá, Ramón Illa Salvia y Sebastián Riera Coromina, religious, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'08-13': [
			proper(
				'jose-tapies-and-companions',
				{
					es: 'Beatos José Tapies y compañeros, presbíteros y mártires',
					en: 'Blessed José Tapies and companions, priests and martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'08-19': [
			proper(
				'ezequiel-moreno-diaz',
				{ es: 'San Ezequiel Moreno Díaz, obispo', en: 'Saint Ezequiel Moreno Díaz, bishop' },
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
				'm'
			)
		],
		'08-31': [
			proper(
				'raymond-nonnatus',
				{ es: 'San Ramón Nonato, presbítero', en: 'Saint Raymond Nonnatus, priest' },
				'o'
			)
		],
		'09-08': [proper('nuria', { es: 'Nuestra Señora de Nuria', en: 'Our Lady of Nuria' }, 's')],
		'09-22': [
			proper(
				'jose-batalla',
				{
					es: 'Beatos José Batalla, presbítero, y compañeros, mártires',
					en: 'Blessed José Batalla, priest, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-24': [
			proper(
				'mercy',
				{ es: 'Bienaventurada Virgen María de la Merced', en: 'Our Lady of Mercy' },
				'o'
			)
		],
		'10-03': [
			proper(
				'francis-borgia',
				{ es: 'San Francisco de Borja, presbítero', en: 'Saint Francis Borgia, priest' },
				'o'
			)
		],
		'10-10': [
			proper(
				'thomas-of-villanova',
				{ es: 'Santo Tomás de Villanueva, obispo', en: 'Saint Thomas of Villanova, bishop' },
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
			proper(
				'the-pillar',
				{ es: 'Bienaventurada Virgen María del Pilar', en: 'Our Lady of the Pillar' },
				'f'
			)
		],
		'10-19': [
			proper(
				'peter-of-alcantara',
				{ es: 'San Pedro de Alcántara, presbítero', en: 'Saint Peter of Alcantara, priest' },
				'o'
			)
		],
		'10-23': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{
					es: 'Aniversario de la Dedicación de la Catedral',
					en: 'Anniversary of the Dedication of the Cathedral'
				},
				'f'
			)
		],
		'11-03': [
			proper(
				'ermengol-of-urgell',
				{ es: 'San Ermengol de Urgell, obispo', en: 'Saint Ermengol of Urgell, bishop' },
				's'
			)
		],
		'11-05': [
			proper(
				'angela-of-the-cross-guerrero-gonzalez',
				{
					es: 'San Martín de Porres, religioso',
					en: 'Saint Angela of the Cross Guerrero González, virgin'
				},
				'o'
			)
		],
		'11-06': [
			proper(
				'pedro-poveda-castroverde',
				{
					es: 'Santos Pedro Poveda Castroverde e Inocencio de la Inmaculada Canoura Arnau, presbíteros, y compañeros, mártires',
					en: 'Saint Pedro Poveda Castroverde, Saint Innocencio of Mary Immaculate, priests, and companions, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'11-13': [
			proper(
				'leander-of-seville',
				{ es: 'San Leandro de Sevilla, obispo', en: 'Saint Leander of Seville, bishop' },
				'o'
			)
		],
		'12-10': [
			proper(
				'eulalia-of-merida',
				{
					es: 'Santa Eulalia de Mérida, virgen y mártir',
					en: 'Saint Eulalia of Mérida, virgin and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'12-16': [
			proper(
				'jose-manyanet-y-vives',
				{ es: 'San José Manyanet y Vives, presbítero', en: 'Saint José Manyanet y Vives, priest' },
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
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		bruno: { colour: 'white' },
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		george: keptAs('s'),
		'immaculate-conception': { colour: 'blue' },
		isidore: keptAs('m', 'white'),
		james: keptAs('s'),
		'john-of-avila': keptAs('m'),
		'joseph-calasanz': keptAs('m'),
		'our-lady-of-mount-carmel': keptAs('m'),
		'peter-claver': keptAs('m'),
		'raymond-of-penyafort': keptAs('m'),
		'teresa-benedicta': keptAs('f'),
		'teresa-of-avila': keptAs('f'),
		'vincent-deacon': keptAs('m')
	},
	moves: {
		adalbert: { to: '04-22' },
		agnes: { to: '01-19' },
		faustina: { to: '10-08' },
		george: { to: '04-28' },
		isidore: { to: '04-26' },
		james: { to: '07-25' },
		'john-of-capistrano': { to: '10-21' },
		louis: { to: '08-30' },
		'martin-de-porres': { to: '11-05' }
	}
};
