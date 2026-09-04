/**
 * Hungary — the General Roman Calendar as Hungary’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Hungary actually does
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
 * A proper carries the name its conference approved, in hu, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const HUNGARY: NationalCalendar = {
	id: 'hu',
	options: { ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-15': [
			proper('paul-of-thebes', { hu: 'Remete Szent Pál', en: 'Saint Paul of Thebes, hermit' }, 'o')
		],
		'01-18': [
			proper(
				'margeret-of-hungary',
				{ hu: 'Árpád-házi Szent Margit szűz', en: 'Saint Margeret of Hungary' },
				'f'
			)
		],
		'01-20': [
			proper(
				'eusebius-of-esztergom',
				{ hu: 'Boldog Özséb áldozópap', en: 'Blessed Eusebius of Esztergom, priest' },
				'o'
			)
		],
		'01-22': [
			proper(
				'laszlo-batthyany-strattmann',
				{
					hu: 'Boldog Batthyány Strattmann László családapa',
					en: 'Blessed László Batthyány-Strattmann'
				},
				'o'
			)
		],
		'02-20': [
			proper(
				'francisco-marto-and-saint-jacinta-marto',
				{
					hu: 'Szent Marto Jácinta és Szent Marto Ferenc',
					en: 'Saint Francisco Marto and Saint Jacinta Marto'
				},
				'o'
			)
		],
		'03-04': [
			proper(
				'zoltan-meszlenyi',
				{
					hu: 'Boldog Meszlényi Zoltán püspök és vértanú',
					en: 'Blessed Zoltán Meszlényi, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'04-16': [
			proper(
				'bernadette-soubirous',
				{ hu: 'Soubirouse Szent Mária Bernadett szűz', en: 'Saint Bernadette Soubirous, virgin' },
				'o'
			)
		],
		'05-04': [
			proper(
				'ceferino-jimenez',
				{ hu: 'Boldog Giménez Malla Ceferino vértanú', en: 'Blessed Ceferino Jiménez, martyr' },
				'o',
				{ colour: 'red' }
			),
			proper('florian', { hu: 'Szent Flórián vértanú', en: 'Saint Florian, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'05-07': [
			proper(
				'gisela-of-hungary',
				{ hu: 'Boldog Gizella királyné', en: 'Blessed Gisela of Hungary' },
				'o'
			)
		],
		'05-11': [
			proper(
				'sara-salkahazi',
				{
					hu: 'Boldog Salkaházi Sára szűz és vértanú',
					en: 'Blessed Sára Salkaházi, virgin and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-16': [
			proper(
				'john-of-nepomuk',
				{
					hu: 'Nepomuki Szent János áldozópap és vértanú',
					en: 'Saint John of Nepomuk, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-17': [
			proper(
				'john-scheffler',
				{
					hu: 'Boldog Scheffler János püspök és vértanú',
					en: 'Blessed John Scheffler, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-23': [
			proper(
				'vilmos-apor',
				{
					hu: 'Boldog Apor Vilmos püspök és vértanú',
					en: 'Blessed Vilmos Apor, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-24': [
			proper(
				'help-of-christians',
				{ hu: 'Szűz Mária, Keresztények Segítsége', en: 'Our Lady Help of Christians' },
				'm'
			)
		],
		'05-30': [
			proper(
				'translation-of-the-relics-of-saint-stephen-of-hungary',
				{
					hu: 'Szent István király ereklyéinek átvitele',
					en: 'Translation of the Relics of Saint Stephen of Hungary'
				},
				'o'
			)
		],
		'06-08': [
			proper(
				'istvan-sandor',
				{ hu: 'Boldog Sándor István vértanú', en: 'Blessed István Sándor, martyr' },
				'o',
				{ colour: 'red' }
			),
			proper(
				'agnes-of-bohemia',
				{ hu: 'Prágai Szent Ágnes szűz', en: 'Saint Agnes of Bohemia, virgin' },
				'o'
			)
		],
		'06-15': [
			proper(
				'jolenta-helena',
				{ hu: 'Árpád-házi Boldog Jolán szerzetesnő', en: 'Blessed Jolenta Helena, religious' },
				'm'
			)
		],
		'06-26': [
			proper(
				'josemaria-escriva-de-balaguer',
				{
					hu: 'Szent Escrívá de Balaguer Josemaría áldozópap',
					en: 'Saint Josemaría Escrivá de Balaguer, priest'
				},
				'o'
			)
		],
		'06-27': [proper('ladislaus', { hu: 'Szent László király', en: 'Saint Ladislaus' }, 'f')],
		'07-17': [
			proper(
				'pavel-gojdic',
				{
					hu: 'Boldog Gojdics Pál püspök és vértanú',
					en: 'Blessed Pavel Gojdič, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			),
			proper(
				'andrzej-zorard-and-saint-benedict',
				{
					hu: 'Szent Zoerard-András és Szent Benedek remeték',
					en: 'Saint Andrzej Zorard and Saint Benedict, monks'
				},
				'o'
			)
		],
		'07-18': [
			proper(
				'jadwiga-of-poland',
				{ hu: 'Szent Hedvig királynő', en: 'Saint Jadwiga of Poland' },
				'm'
			)
		],
		'07-24': [
			proper('kinga', { hu: 'Árpád-házi Szent Kinga szűz', en: 'Saint Kinga, virgin' }, 'm')
		],
		'08-13': [
			proper('innocent-xi', { hu: 'Boldog XI. Ince pápa', en: 'Blessed Innocent XI, pope' }, 'm')
		],
		'09-07': [
			proper(
				'marko-krizin',
				{
					hu: 'Szent Márk, István és Menyhért áldozópapok, kassai vértanúk',
					en: 'Saints Marko Krizin, Melichar Grodecki and Stephen Pongrác, priests and martyrs'
				},
				'f',
				{ colour: 'red' }
			)
		],
		'09-24': [
			proper(
				'gerard-sagredo',
				{ hu: 'Szent Gellért püspök és vértanú', en: 'Saint Gerard Sagredo, bishop and martyr' },
				'f',
				{ colour: 'red' }
			)
		],
		'10-03': [
			proper(
				'szilard-bogdanffy',
				{
					hu: 'Boldog Bogdánffy Szilárd püspök és vértanú',
					en: 'Blessed Szilárd Bogdánffy, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'10-08': [
			proper(
				'hungary',
				{ hu: 'Szűz Mária a Magyarok Nagyasszonya', en: 'Our Lady of Hungary' },
				's'
			)
		],
		'10-21': [
			proper(
				'charles-the-good',
				{ hu: 'Boldog IV. Károly király', en: 'Blessed Charles the Good, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'10-25': [
			proper('maurus-of-pecs', { hu: 'Szent Mór püspök', en: 'Saint Maurus of Pécs, bishop' }, 'm')
		],
		'10-31': [
			proper(
				'todor-romza',
				{
					hu: 'Boldog Romzsa Tódor püspök és vértanú',
					en: 'Blessed Tódor Romża, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'11-05': [
			proper('emeric-of-hungary', { hu: 'Szent Imre herceg', en: 'Saint Emeric of Hungary' }, 'f')
		],
		'11-13': [
			proper(
				'all-saints-and-blesseds-of-hungary',
				{ hu: 'Magyar szentek és boldogok', en: 'All Saints and Blesseds of Hungary' },
				'o'
			)
		],
		'12-15': [
			proper(
				'janos-brenner',
				{
					hu: 'Boldog Brenner János áldozópap és vértanú',
					en: 'Blessed János Brenner, priest and martyr'
				},
				'o',
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
					hu: 'A mi Urunk Jézus Krisztus az Örök Főpap',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	overrides: {
		adalbert: keptAs('m'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'elizabeth-of-hungary': keptAs('f'),
		'holy-name-of-mary': keptAs('m'),
		'john-of-capistrano': keptAs('m'),
		'stephen-of-hungary': keptAs('s'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		bernard: { to: '08-19' },
		'cyril-of-alexandria': { to: '06-26' },
		'elizabeth-of-hungary': { to: '11-19' },
		george: { to: '04-24' },
		gertrude: { to: '11-17' },
		'john-eudes': { to: '08-18' },
		matthias: { to: '02-24' },
		'pontian-hippolytus': { to: '08-16' },
		sharbel: { to: '07-27' },
		'stephen-of-hungary': { to: '08-20' },
		visitation: { to: '07-02' }
	}
};
