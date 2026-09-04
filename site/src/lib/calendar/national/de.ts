/**
 * Germany — the General Roman Calendar as the Deutsche Bischofskonferenz
 * keeps it.
 *
 * The only calendar of the sixteen that transfers NOTHING: Epiphany, the
 * Ascension and Corpus Christi are all public holidays in the Catholic
 * Länder, so this is `General-A`, the universal calendar, with the largest
 * sanctorale of any layer here laid over it.
 *
 * Three of its rows keep pre-1969 dates the general reform moved: Matthias on
 * 24 February rather than 14 May, the Visitation on 2 July rather than 31 May,
 * and Peter Canisius on 27 April rather than 21 December. That is what the
 * *Regionalkalender für das deutsche Sprachgebiet* is largely made of — the
 * German-speaking dioceses keeping what they had — and it is why this file's
 * `moves` are longer journeys than anyone else's.
 *
 * It is also the layer with the one observance in these calendars that is not
 * a civil day: Whit Monday, kept as a Mass of the Holy Spirit, in red, beside
 * whatever memorial the day already carries.
 */

import type { NationalCalendar } from '../types';
import { keptAs, proper } from './common';

export const GERMANY: NationalCalendar = {
	id: 'de',
	options: {},

	propers: {
		'01-07': [
			proper(
				'valentine-of-raetia',
				{ de: 'Hl. Valentin von Rätien, Bischof', en: 'Saint Valentine of Raetia, Bishop' },
				'o'
			)
		],
		'01-08': [
			proper('severin', { de: 'Hl. Severin, Mönch', en: 'Saint Severinus of Noricum, Monk' }, 'o')
		],
		'01-21': [
			proper(
				'meinrad',
				{
					de: 'Hl. Meinrad, Einsiedler, Märtyrer',
					en: 'Saint Meinrad of Einsiedeln, Hermit and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-23': [
			proper(
				'henry-suso',
				{ de: 'Sel. Heinrich Seuse, Ordenspriester', en: 'Blessed Henry Suso, Priest' },
				'o'
			)
		],
		'02-04': [
			proper(
				'rabanus-maurus',
				{ de: 'Hl. Rabanus Maurus, Bischof', en: 'Saint Rabanus Maurus, Bishop' },
				'o'
			)
		],
		'02-25': [
			proper('walburga', { de: 'Hl. Walburga, Äbtissin', en: 'Saint Walburga, Abbess' }, 'o')
		],
		'03-06': [
			proper(
				'fridolin',
				{ de: 'Hl. Fridolin von Säckingen, Mönch', en: 'Saint Fridolin of Säckingen, Monk' },
				'o'
			)
		],
		'03-09': [
			proper(
				'bruno-of-querfurt',
				{
					de: 'Hl. Bruno von Querfurt, Bischof, Märtyrer',
					en: 'Saint Bruno of Querfurt, Bishop and Martyr'
				},
				'o'
			)
		],
		'03-14': [proper('mathilda', { de: 'Hl. Mathilde', en: 'Saint Mathilda' }, 'o')],
		'03-15': [
			proper(
				'clement-mary-hofbauer',
				{
					de: 'Hl. Klemens Maria Hofbauer, Ordenspriester',
					en: 'Saint Clement Mary Hofbauer, Priest'
				},
				'o'
			)
		],
		'03-17': [
			proper(
				'gertrude-of-nivelles',
				{ de: 'Hl. Gertrud, Äbtissin', en: 'Saint Gertrude, Abbess' },
				'o'
			)
		],
		'03-26': [
			proper(
				'ludger',
				{ de: 'Hl. Liudger von Münster, Bischof', en: 'Saint Ludger of Münster, Bishop' },
				'o'
			)
		],
		'04-19': [
			proper(
				'marcel-callo',
				{ de: 'Sel. Marcel Callo, Märtyrer', en: 'Blessed Marcel Callo, Martyr' },
				'o',
				{
					colour: 'red'
				}
			),
			proper('leo-ix', { de: 'Hl. Leo IX., Papst', en: 'Saint Leo IX, Pope' }, 'o')
		],
		'04-21': [
			proper(
				'conrad-of-parzham',
				{ de: 'Hl. Konrad von Parzham, Ordensmann', en: 'Saint Conrad of Parzham, Religious' },
				'o'
			)
		],
		'05-04': [
			proper(
				'florian',
				{
					de: 'Hl. Florian und heilige Märtyrer von Lorch',
					en: 'Saint Florian and the Martyrs of Lorch'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-05': [
			proper(
				'gotthard',
				{ de: 'Hl. Godehard von Hildesheim, Bischof', en: 'Saint Gotthard of Hildesheim, Bishop' },
				'o'
			)
		],
		'05-16': [
			proper(
				'john-of-nepomuk',
				{
					de: 'Hl. Johannes Nepomuk, Priester, Märtyrer',
					en: 'Saint John of Nepomuk, Priest and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-21': [
			proper(
				'hermann-joseph',
				{ de: 'Hl. Hermann Josef, Ordenspriester', en: 'Saint Hermann Joseph, Priest' },
				'o'
			)
		],
		'06-15': [
			proper('vitus', { de: 'Hl. Vitus, Märtyrer', en: 'Saint Vitus, Martyr' }, 'o', {
				colour: 'red'
			})
		],
		'06-16': [proper('benno', { de: 'Hl. Benno, Bischof', en: 'Saint Benno, Bishop' }, 'o')],
		'06-26': [
			proper(
				'josemaria-escriva',
				{
					de: 'Hl. Josefmaria Escrivá de Balaguer, Priester',
					en: 'Saint Josemaría Escrivá de Balaguer, Priest'
				},
				'o'
			)
		],
		'06-27': [
			proper('hemma-of-gurk', { de: 'Hl. Hemma von Gurk', en: 'Saint Hemma of Gurk' }, 'o')
		],
		'06-30': [
			proper(
				'otto-of-bamberg',
				{ de: 'Hl. Otto von Bamberg, Bischof', en: 'Saint Otto of Bamberg, Bishop' },
				'o'
			)
		],
		'07-04': [
			proper(
				'ulrich',
				{ de: 'Hl. Ulrich von Augsburg, Bischof', en: 'Saint Ulrich of Augsburg, Bishop' },
				'o'
			)
		],
		'07-07': [
			proper('willibald', { de: 'Hl. Willibald, Bischof', en: 'Saint Willibald, Bishop' }, 'o')
		],
		'07-08': [
			proper(
				'kilian',
				{
					de: 'Hl. Kilian, Bischof, und Gefährten, Märtyrer',
					en: 'Saint Kilian, Bishop, and Companions, Martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-10': [
			proper(
				'canute-eric-olaf',
				{
					de: 'Hl. Knud IV., hl. Erich IX., Märtyrer, und hl. Olaf II.',
					en: 'Saints Canute IV and Eric IX, Martyrs, and Olaf II'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-13': [
			proper(
				'henry-cunegonde',
				{ de: 'Hl. Heinrich II. und hl. Kunigunde', en: 'Saints Henry II and Cunegonde' },
				'o'
			)
		],
		'07-20': [
			proper(
				'margaret-of-antioch',
				{
					de: 'Hl. Margareta von Antiochien, Jungfrau, Märtyrin',
					en: 'Saint Margaret of Antioch, Virgin and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-24': [
			proper(
				'christopher',
				{ de: 'Hl. Christophorus, Märtyrer', en: 'Saint Christopher, Martyr' },
				'o',
				{
					colour: 'red'
				}
			)
		],
		'08-31': [
			proper(
				'paulinus-of-trier',
				{
					de: 'Hl. Paulinus von Trier, Bischof, Märtyrer',
					en: 'Saint Paulinus of Trier, Bishop and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-18': [
			proper(
				'lambert',
				{
					de: 'Hl. Lambert von Maastricht, Bischof, Märtyrer',
					en: 'Saint Lambert of Maastricht, Bishop and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-22': [
			proper(
				'maurice-of-agaune',
				{
					de: 'Hl. Mauritius und Gefährten, Märtyrer',
					en: 'Saint Maurice and Companions, Martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-24': [
			proper(
				'rupert-vergilius',
				{ de: 'Hl. Rupert und hl. Virgil, Bischöfe', en: 'Saints Rupert and Vergilius, Bishops' },
				'o'
			)
		],
		'09-25': [
			proper(
				'nicholas-of-flue',
				{ de: 'Hl. Niklaus von Flüe, Einsiedler', en: 'Saint Nicholas of Flüe, Hermit' },
				'o'
			)
		],
		'09-28': [proper('leoba', { de: 'Hl. Lioba, Äbtissin', en: 'Saint Leoba, Abbess' }, 'o')],
		'10-16': [proper('gall', { de: 'Hl. Gallus, Mönch', en: 'Saint Gall, Monk' }, 'o')],
		'10-20': [
			proper(
				'wendelin',
				{ de: 'Hl. Wendelin, Einsiedler', en: 'Saint Wendelin of Trier, Hermit' },
				'o'
			)
		],
		'10-21': [
			proper(
				'ursula',
				{
					de: 'Hl. Ursula und Gefährtinnen, Märtyrinnen',
					en: 'Saint Ursula and Companions, Virgins and Martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'10-31': [
			proper('wolfgang', { de: 'Hl. Wolfgang, Bischof', en: 'Saint Wolfgang, Bishop' }, 'o')
		],
		'11-03': [
			proper(
				'hubert',
				{ de: 'Hl. Hubert von Lüttich, Bischof', en: 'Saint Hubert of Liège, Bishop' },
				'o'
			),
			proper('pirmin', { de: 'Hl. Pirmin, Abtbischof', en: 'Saint Pirmin, Abbot and Bishop' }, 'o'),
			proper(
				'rupert-mayer',
				{ de: 'Sel. Rupert Mayer, Ordenspriester', en: 'Blessed Rupert Mayer, Priest' },
				'o'
			)
		],
		'11-06': [
			proper(
				'leonard',
				{ de: 'Hl. Leonhard, Einsiedler', en: 'Saint Leonard of Noblac, Hermit' },
				'o'
			)
		],
		'11-07': [
			proper('willibrord', { de: 'Hl. Willibrord, Bischof', en: 'Saint Willibrord, Bishop' }, 'o')
		],
		'11-15': [
			proper(
				'leopold',
				{ de: 'Hl. Leopold, Markgraf von Österreich', en: 'Saint Leopold, Margrave of Austria' },
				'o'
			)
		],
		'11-26': [
			proper(
				'conrad-gebhard',
				{ de: 'Hl. Konrad und hl. Gebhard, Bischöfe', en: 'Saints Conrad and Gebhard, Bishops' },
				'o'
			)
		],
		'12-02': [
			proper(
				'lucius-of-chur',
				{
					de: 'Hl. Luzius von Chur, Bischof, Märtyrer',
					en: 'Saint Lucius of Chur, Bishop and Martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'12-04': [
			proper('barbara', { de: 'Hl. Barbara, Märtyrin', en: 'Saint Barbara, Martyr' }, 'o', {
				colour: 'red'
			}),
			proper(
				'adolph-kolping',
				{ de: 'Sel. Adolph Kolping, Priester', en: 'Blessed Adolph Kolping, Priest' },
				'o'
			)
		],
		'12-05': [
			proper('anno', { de: 'Hl. Anno von Köln, Bischof', en: 'Saint Anno of Cologne, Bishop' }, 'o')
		],
		'12-13': [
			proper('odilia', { de: 'Hl. Odilia, Äbtissin', en: 'Saint Odilia of Alsace, Abbess' }, 'o')
		]
	},

	overrides: {
		boniface: keptAs('f', 'red'),
		// The five patrons of Europe, as the other European layers raise them.
		benedict: keptAs('f'),
		'cyril-methodius': keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'teresa-benedicta': keptAs('f', 'red'),
		// Two general obligatory memorials kept as optional here, each because
		// a proper of the German-speaking dioceses shares the day.
		agnes: keptAs('o', 'red'),
		lucy: keptAs('o', 'red'),
		// Kept on 13 July with Cunegonde as a proper of the region.
		henry: null
	},

	/**
	 * Whit Monday, kept as a Mass of the Holy Spirit — the only observance in
	 * these calendars that is not a civil day, and the only one in red. It is
	 * an `Observance` rather than a celebration because the feeds rank it as
	 * none: 25 May 2026 is the obligatory memorial of Mary Mother of the
	 * Church AND this, which no line of n. 59 can express.
	 */
	observances: [
		{
			at: { fromEaster: 50 },
			observance: {
				id: 'whit-monday',
				names: { de: 'Heiligen Geist', en: 'The Holy Spirit' },
				colour: 'red'
			}
		}
	],

	/** Three pre-1969 dates the region kept, and two ordinary displacements. */
	moves: {
		matthias: { to: '02-24' },
		visitation: { to: '07-02' },
		'peter-canisius': { to: '04-27' },
		gertrude: { to: '11-17' },
		'elizabeth-of-hungary': { to: '11-19' }
	}
};
