/**
 * Poland — the General Roman Calendar as the Konferencja Episkopatu Polski
 * keeps it.
 *
 * The largest layer here with Germany's, and the one with the most
 * SOLEMNITIES: Adalbert, Stanislaus, Our Lady Queen of Poland and Our Lady of
 * Częstochowa, none of which the general calendar ranks above a memorial.
 * Three of the four are raised general celebrations rather than propers,
 * which is why `keptAs('s')` has to carry `transferable` — 23 April 2025 fell
 * in the Octave of Easter, and Adalbert's solemnity was kept on the 28th.
 *
 * Poland is also the calendar that showed the rank tokens in these feeds are
 * the LANGUAGE's initials rather than Latin's: its `SUMMARY` prints `U Ś W w`
 * for *uroczystość, święto, wspomnienie*, where six Romance-and-Latin feeds
 * had all printed `S F M m` (see `RANKS` in `pipeline/scrapers/liturgical_calendar.py`).
 */

import type { NationalCalendar } from '../types';
import { THURSDAY_AFTER_PENTECOST, keptAs, proper } from './common';

export const POLAND: NationalCalendar = {
	id: 'pl',
	// The Ascension on the Sunday; Epiphany and Corpus Christi keep their own
	// days, both public holidays in Poland.
	options: { ascensionOnSunday: true },

	propers: {
		'01-19': [
			proper(
				'jozef-sebastian-pelczar',
				{
					pl: 'Św. Józefa Sebastiana Pelczara, biskupa',
					en: 'Saint Józef Sebastian Pelczar, Bishop'
				},
				'm'
			)
		],
		'01-22': [
			proper(
				'vincent-pallotti',
				{ pl: 'Św. Wincentego Pallottiego, prezbitera', en: 'Saint Vincent Pallotti, Priest' },
				'o'
			)
		],
		'05-03': [
			proper(
				'our-lady-queen-of-poland',
				{
					pl: 'Najświętszej Maryi Panny, Królowej Polski',
					en: 'Our Lady, Queen of Poland'
				},
				's',
				{ marian: true }
			)
		],
		'05-04': [
			proper('florian', { pl: 'Św. Floriana, męczennika', en: 'Saint Florian, Martyr' }, 'm', {
				colour: 'red'
			})
		],
		'05-05': [
			proper(
				'stanislaw-kazimierczyk',
				{
					pl: 'Św. Stanisława Kazimierczyka, prezbitera',
					en: 'Saint Stanisław Kazimierczyk, Priest'
				},
				'o'
			)
		],
		'05-16': [
			proper(
				'andrzej-bobola',
				{
					pl: 'Św. Andrzeja Boboli, prezbitera i męczennika',
					en: 'Saint Andrzej Bobola, Priest and Martyr'
				},
				'f',
				{ colour: 'red' }
			)
		],
		'05-24': [
			proper(
				'our-lady-help-of-christians',
				{
					pl: 'Najświętszej Maryi Panny, Wspomożycielki Wiernych',
					en: 'Our Lady Help of Christians'
				},
				'm',
				{ marian: true }
			)
		],
		'05-28': [
			proper(
				'stefan-wyszynski',
				{ pl: 'Bł. Stefan Wyszyński, biskupa', en: 'Blessed Stefan Wyszyński, Bishop' },
				'o'
			)
		],
		'05-29': [
			proper(
				'urszula-ledochowska',
				{ pl: 'Św. Urszuli Ledóchowskiej, dziewicy', en: 'Saint Urszula Ledóchowska, Virgin' },
				'm'
			)
		],
		'05-30': [
			proper(
				'jan-sarkander',
				{
					pl: 'Św. Jana Sarkandra, prezbitera i męczennika',
					en: 'Saint Jan Sarkander, Priest and Martyr'
				},
				'o',
				{ colour: 'red' }
			),
			proper('zdislava', { pl: 'Św. Zdzisławy', en: 'Saint Zdislava' }, 'o')
		],
		'06-08': [
			proper('jadwiga-queen', { pl: 'Św. Jadwigi Królowej', en: 'Saint Jadwiga of Poland' }, 'm')
		],
		'06-12': [
			proper(
				'antoni-nowowiejski',
				{
					pl: 'Błogosławionych męczenników Antoniego Nowowiejskiego, biskupa, i Towarzyszy',
					en: 'Blessed Antoni Nowowiejski, Bishop, and Companions, Martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'06-14': [
			proper(
				'michal-kozal',
				{
					pl: 'Bł. Michała Kozala, biskupa i męczennika',
					en: 'Blessed Michał Kozal, Bishop and Martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'06-17': [
			proper(
				'albert-chmielowski',
				{
					pl: 'Św. Alberta Chmielowskiego, zakonnika',
					en: 'Saint Albert Chmielowski, Religious'
				},
				'm'
			)
		],
		'06-26': [
			proper(
				'zygmunt-gorazdowski',
				{
					pl: 'Św. Zygmunta Gorazdowskiego, prezbitera',
					en: 'Saint Zygmunt Gorazdowski, Priest'
				},
				'o'
			)
		],
		'07-01': [
			proper(
				'otto-of-bamberg',
				{ pl: 'Św. Ottona z Bambergu, biskupa', en: 'Saint Otto of Bamberg, Bishop' },
				'o'
			)
		],
		'07-06': [
			proper(
				'maria-teresa-ledochowska',
				{
					pl: 'Bł. Marii Teresy Ledóchowskiej, dziewicy',
					en: 'Blessed Maria Teresa Ledóchowska, Virgin'
				},
				'm'
			)
		],
		'07-08': [
			proper(
				'john-of-dukla',
				{ pl: 'Św. Jana z Dukli, prezbitera', en: 'Saint John of Dukla, Priest' },
				'm'
			)
		],
		'07-12': [
			proper(
				'bruno-of-querfurt',
				{
					pl: 'Św. Brunona Bonifacego z Kwerfurtu, biskupa i męczennika',
					en: 'Saint Bruno of Querfurt, Bishop and Martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'07-13': [
			proper(
				'andrzej-swierad-benedict',
				{
					pl: 'Świętych pustelników Andrzeja Świerada i Benedykta',
					en: 'Saints Andrzej Świerad and Benedict, Hermits'
				},
				'm'
			)
		],
		'07-18': [
			proper(
				'szymon-of-lipnica',
				{ pl: 'Św. Szymona z Lipnicy, prezbitera', en: 'Saint Szymon of Lipnica, Priest' },
				'o'
			)
		],
		'07-20': [
			proper('czeslaw', { pl: 'Bł. Czesława, prezbitera', en: 'Blessed Czesław, Priest' }, 'o')
		],
		'07-24': [proper('kinga', { pl: 'Św. Kingi, dziewicy', en: 'Saint Kinga, Virgin' }, 'm')],
		'08-17': [
			proper(
				'hyacinth',
				{ pl: 'Św. Jacka, prezbitera', en: 'Saint Hyacinth of Poland, Priest' },
				'm'
			)
		],
		'08-26': [
			proper(
				'our-lady-of-czestochowa',
				{
					pl: 'Najświętszej Maryi Panny Częstochowskiej',
					en: 'Our Lady of Częstochowa'
				},
				's',
				{ marian: true }
			)
		],
		'09-04': [
			proper(
				'maria-stella-companions',
				{
					pl: 'Błogosławionych dziewicy i męczennicy Marii Stelli i Towarzyszek',
					en: 'Blessed Maria Stella and Companions, Virgins and Martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-07': [
			proper(
				'melchior-grodziecki',
				{
					pl: 'Św. Melchiora Grodzieckiego, prezbitera i męczennika',
					en: 'Saint Melchior Grodziecki, Priest and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-17': [
			proper(
				'zygmunt-szczesny-felinski',
				{
					pl: 'Św. Zygmunta Szczęsnego Felińskiego, biskupa',
					en: 'Saint Zygmunt Szczęsny Feliński, Bishop'
				},
				'o'
			)
		],
		'09-18': [
			proper(
				'stanislaus-kostka',
				{ pl: 'Św. Stanisława Kostki, zakonnika', en: 'Saint Stanislaus Kostka, Religious' },
				'f'
			)
		],
		'10-12': [
			proper(
				'jan-beyzym',
				{ pl: 'Bł. Jana Beyzyma, prezbitera', en: 'Blessed Jan Beyzym, Priest' },
				'o'
			)
		],
		'10-13': [
			proper(
				'honorat-kozminski',
				{
					pl: 'Bł. Honorata Koźmińskiego, prezbitera',
					en: 'Blessed Honorat Koźmiński, Priest'
				},
				'm'
			)
		],
		'10-23': [
			proper(
				'jozef-bilczewski',
				{ pl: 'Św. Józefa Bilczewskiego, biskupa', en: 'Saint Józef Bilczewski, Bishop' },
				'o'
			)
		],
		'11-13': [
			proper(
				'polish-protomartyrs',
				{
					pl: 'Świętych Benedykta, Jana, Mateusza, Izaaka i Krystyna, pierwszych męczenników Polski',
					en: 'Saints Benedict, John, Matthew, Isaac and Christinus, First Martyrs of Poland'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'11-18': [
			proper(
				'karolina-kozka',
				{
					pl: 'Bł. Karoliny Kózkówny, dziewicy i męczennicy',
					en: 'Blessed Karolina Kózka, Virgin and Martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'11-20': [
			proper(
				'raphael-kalinowski',
				{ pl: 'Św. Rafała Kalinowskiego, prezbitera', en: 'Saint Raphael Kalinowski, Priest' },
				'm'
			)
		],
		'12-04': [
			proper(
				'barbara',
				{ pl: 'Św. Barbary, dziewicy i męczennicy', en: 'Saint Barbara, Virgin and Martyr' },
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
					pl: 'Jezusa Chrystusa, Najwyższego i Wiecznego Kapłana',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'F'
			)
		}
	],

	overrides: {
		// Three general memorials Poland keeps as its own solemnities. All
		// three are transferable, which is not decoration: 23 April 2025 was
		// in the Octave of Easter and Adalbert was kept on the 28th.
		adalbert: keptAs('s', 'red'),
		stanislaus: keptAs('s', 'red'),
		casimir: keptAs('f'),
		faustina: keptAs('m'),
		hedwig: keptAs('m'),
		'john-of-kanty': keptAs('m'),
		'john-paul-ii': keptAs('m'),
		wenceslaus: keptAs('m', 'red'),
		'our-lady-of-mount-carmel': keptAs('m'),
		'mary-mother-of-the-church': keptAs('f'),
		// The five patrons of Europe, as Italy, France and Spain raise them.
		benedict: keptAs('f'),
		'cyril-methodius': keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'teresa-benedicta': keptAs('f', 'red')
	},

	moves: {
		stanislaus: { to: '05-08' },
		'philip-james': { to: '05-06' },
		george: { to: '04-24' },
		'maria-goretti': { to: '07-05' },
		'paul-vi': { to: '05-27' },
		henry: { to: '07-14' },
		apollinaris: { to: '07-21' },
		sharbel: { to: '07-28' },
		'lawrence-ruiz': { to: '09-26' },
		'margaret-mary-alacoque': { to: '10-14' },
		'john-of-kanty': { to: '10-20' },
		'dedication-of-peter-and-paul': { to: '11-16' }
	}
};
