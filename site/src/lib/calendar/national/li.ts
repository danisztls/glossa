/**
 * Liechtenstein — the General Roman Calendar as Liechtenstein’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Liechtenstein actually does
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
 * A proper carries the name its conference approved, in de, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const LIECHTENSTEIN: NationalCalendar = {
	id: 'li',
	options: {},
	propers: {
		'01-07': [
			proper(
				'valentine-of-raetia',
				{ de: 'Hl. Valentin von Rätien, Bischof', en: 'Saint Valentine of Raetia, bishop' },
				'o'
			)
		],
		'01-08': [
			proper(
				'severin-of-noricum',
				{ de: 'Hl. Severin, Mönch', en: 'Saint Severin of Noricum, religious' },
				'o'
			)
		],
		'01-21': [
			proper(
				'meinrad-of-einsiedeln',
				{
					de: 'Hl. Meinrad, Einsiedler, Märtyrer',
					en: 'Saint Meinrad of Einsiedeln, hermit and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-23': [
			proper(
				'henry-suso',
				{ de: 'Sel. Heinrich Seuse, Ordenspriester', en: 'Blessed Henry Suso, priest' },
				'o'
			)
		],
		'01-30': [proper('eusebius', { de: 'Hl. Eusebius, Mönch', en: 'Saint Eusebius, monk' }, 'o')],
		'02-04': [
			proper(
				'maria-de-mattias',
				{ de: 'Hl. Maria de Mattias, Ordensfrau', en: 'Saint Maria de Mattias, virgin' },
				'o'
			),
			proper(
				'rabanus-maurus',
				{ de: 'Hl. Rabanus Maurus, Bischof', en: 'Saint Rabanus Maurus, bishop' },
				'o'
			)
		],
		'02-25': [
			proper('walburga', { de: 'Hl. Walburga, Äbtissin', en: 'Saint Walburga, abbess' }, 'o')
		],
		'03-06': [
			proper(
				'fridolin-of-sackingen',
				{ de: 'Hl. Fridolin von Säckingen, Mönch', en: 'Saint Fridolin of Säckingen, monk' },
				'o',
				{ colour: 'violet' }
			)
		],
		'03-09': [
			proper(
				'bruno-of-querfurt',
				{
					de: 'Hl. Bruno von Querfurt, Bischof, Märtyrer',
					en: 'Saint Bruno of Querfurt, bishop and martyr'
				},
				'o',
				{ colour: 'violet' }
			)
		],
		'03-14': [
			proper('mathilda', { de: 'Hl. Mathilde', en: 'Saint Mathilda' }, 'o', { colour: 'violet' })
		],
		'03-15': [
			proper(
				'clement-mary-hofbauer',
				{
					de: 'Hl. Klemens Maria Hofbauer, Ordenspriester',
					en: 'Saint Clement Mary Hofbauer, priest'
				},
				'o',
				{ colour: 'violet' }
			)
		],
		'03-17': [
			proper('gertrude', { de: 'Hl. Gertrud, Äbtissin', en: 'Saint Gertrude, abbess' }, 'o', {
				colour: 'violet'
			})
		],
		'04-19': [proper('leo-ix', { de: 'Hl. Leo IX., Papst', en: 'Saint Leo IX, pope' }, 'o')],
		'04-21': [
			proper(
				'conrad-of-parzham',
				{ de: 'Hl. Konrad von Parzham, Ordensmann', en: 'Saint Conrad of Parzham, religious' },
				'o'
			)
		],
		'05-04': [
			proper(
				'florian-and-companions',
				{
					de: 'Hl. Florian und heilige Märtyrer von Lorch',
					en: 'Saint Florian and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-05': [
			proper(
				'gotthard-of-hildesheim',
				{ de: 'Hl. Godehard von Hildesheim, Bischof', en: 'Saint Gotthard of Hildesheim, bishop' },
				'o'
			)
		],
		'05-11': [
			proper('mamertus', { de: 'Hl. Mamertus, Bischof', en: 'Saint Mamertus, bishop' }, 'o')
		],
		'05-16': [
			proper(
				'john-of-nepomuk',
				{
					de: 'Hl. Johannes Nepomuk, Priester, Märtyrer',
					en: 'Saint John of Nepomuk, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-21': [
			proper(
				'hermann-joseph',
				{ de: 'Hl. Hermann Josef, Ordenspriester', en: 'Saint Hermann Joseph, priest' },
				'o'
			)
		],
		'06-15': [
			proper('vitus', { de: 'Hl. Vitus, Märtyrer', en: 'Saint Vitus, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'06-16': [proper('benno', { de: 'Hl. Benno, Bischof', en: 'Saint Benno, bishop' }, 'o')],
		'06-26': [
			proper(
				'josemaria-escriva-de-balaguer',
				{
					de: 'Hl. Josefmaria Escrivá de Balaguer, Priester',
					en: 'Saint Josemaría Escrivá de Balaguer, priest'
				},
				'o'
			)
		],
		'06-27': [
			proper(
				'perpetual-help',
				{
					de: 'Hl. Cyrill von Alexandrien, Bischof, Kirchenlehrer',
					en: 'Our Lady of Perpetual Help'
				},
				'o',
				{ marian: true }
			),
			proper(
				'hemma-of-gurk',
				{ de: 'Maria, Mutter der Immerwährenden Hilfe', en: 'Saint Hemma of Gurk' },
				'o',
				{ marian: true }
			)
		],
		'06-30': [
			proper(
				'otto-of-bamberg',
				{ de: 'Hl. Otto von Bamberg, Bischof', en: 'Saint Otto of Bamberg, bishop' },
				'o'
			)
		],
		'07-01': [
			proper(
				'precious-blood-of-our-lord-jesus-christ',
				{
					de: 'Kostbare Blut unseres Herrn Jesus Christus',
					en: 'The Precious Blood of Our Lord Jesus Christ'
				},
				'f',
				{ colour: 'red' }
			)
		],
		'07-04': [
			proper(
				'ulrich-of-augsburg',
				{ de: 'Hl. Ulrich von Augsburg, Bischof', en: 'Saint Ulrich of Augsburg, bishop' },
				'o'
			)
		],
		'07-07': [
			proper('willibald', { de: 'Hl. Willibald, Bischof', en: 'Saint Willibald, bishop' }, 'o')
		],
		'07-08': [
			proper(
				'kilian',
				{
					de: 'Hl. Kilian, Bischof, und Gefährten, Märtyrer',
					en: 'Saint Kilian, bishop, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-10': [
			proper(
				'canute-iv',
				{
					de: 'Hl. Knud IV., hl. Erich IX., Märtyrer, und hl. Olaf II.',
					en: 'Saint Canute IV, Saint Eric IX, martyrs, and Saint Olaf II'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-16': [
			proper(
				'einsiedeln',
				{ de: 'Unsere Liebe Frau von Einsiedeln', en: 'Our Lady of Einsiedeln' },
				'm'
			)
		],
		'07-20': [
			proper(
				'margaret-of-antioch',
				{
					de: 'Hl. Margareta von Antiochien, Jungfrau, Märtyrin',
					en: 'Saint Margaret of Antioch, virgin and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-24': [
			proper(
				'christopher',
				{ de: 'Hl. Christophorus, Märtyrer', en: 'Saint Christopher, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'08-16': [
			proper(
				'theodore-of-octodurum',
				{ de: 'Hl. Theodor von Sitten, Bischof', en: 'Saint Theodore of Octodurum, bishop' },
				'o'
			)
		],
		'08-31': [
			proper(
				'paulinus-of-trier',
				{
					de: 'Hl. Paulinus von Trier, Bischof, Märtyrer',
					en: 'Saint Paulinus of Trier, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-06': [
			proper(
				'magnus-of-fussen',
				{ de: 'Hl. Magnus, Mönch', en: 'Saint Magnus of Füssen, abbot' },
				'o'
			)
		],
		'09-11': [
			proper(
				'felix-and-saint-regula',
				{ de: 'Hl. Felix und hl. Regula, Märtyrer', en: 'Saint Felix and Saint Regula, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'09-18': [
			proper(
				'lambert-of-maastricht',
				{
					de: 'Hl. Lambert von Maastricht, Bischof, Märtyrer',
					en: 'Saint Lambert of Maastricht, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-22': [
			proper(
				'maurice-of-agaune-and-companions',
				{
					de: 'Hl. Mauritius und Gefährten, Märtyrer',
					en: 'Saint Maurice of Agaune and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-24': [
			proper(
				'rupert-and-saint-vergilius',
				{
					de: 'Hl. Rupert und hl. Virgil, Bischöfe',
					en: 'Saint Rupert and Saint Vergilius, bishops'
				},
				'o'
			)
		],
		'09-25': [
			proper(
				'nicholas-of-flue',
				{ de: 'Hl. Niklaus von Flüe, Einsiedler', en: 'Saint Nicholas of Flüe, hermit' },
				's'
			)
		],
		'09-28': [proper('leoba', { de: 'Hl. Lioba, Äbtissin', en: 'Saint Leoba, abbess' }, 'o')],
		'09-30': [
			proper(
				'ursus-and-saint-victor',
				{ de: 'Hl. Urs und hl. Viktor, Märtyrer', en: 'Saint Ursus and Saint Victor, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'10-03': [
			proper(
				'adalgott-of-chur',
				{ de: 'Hl. Adalgott, Bischof', en: 'Saint Adalgott of Chur, bishop' },
				'o'
			)
		],
		'10-05': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{
					de: 'Jahrestag der Weihe der Domkirche',
					en: 'Anniversary of the Dedication of the Cathedral'
				},
				'f'
			)
		],
		'10-16': [proper('gall', { de: 'Hl. Gallus, Mönch', en: 'Saint Gall, abbot' }, 'm')],
		'10-20': [
			proper(
				'wendelin-of-trier',
				{ de: 'Hl. Wendelin, Einsiedler', en: 'Saint Wendelin of Trier, hermit' },
				'o'
			)
		],
		'10-21': [
			proper(
				'gaspar-del-bufalo',
				{ de: 'Hl. Kaspar del Bufalo, Priester', en: 'Saint Gaspar del Bufalo, priest' },
				'o'
			),
			proper(
				'ursula-and-companions',
				{
					de: 'Hl. Ursula und Gefährtinnen, Märtyrinnen',
					en: 'Saint Ursula and companions, virgins and martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'10-31': [
			proper('wolfgang', { de: 'Hl. Wolfgang, Bischof', en: 'Saint Wolfgang, bishop' }, 'm')
		],
		'11-03': [
			proper(
				'hubertus-of-liege',
				{ de: 'Hl. Hubert von Lüttich, Bischof', en: 'Saint Hubertus of Liège, bishop' },
				'o'
			),
			proper('pirmin', { de: 'Hl. Pirmin, Abtbischof', en: 'Saint Pirmin, abbot and bishop' }, 'o')
		],
		'11-06': [
			proper(
				'leonard-of-noblac',
				{ de: 'Hl. Leonhard, Einsiedler', en: 'Saint Leonard of Noblac, abbot' },
				'o'
			)
		],
		'11-07': [
			proper('willibrord', { de: 'Hl. Willibrord, Bischof', en: 'Saint Willibrord, bishop' }, 'o')
		],
		'11-15': [
			proper(
				'leopold',
				{ de: 'Hl. Leopold, Markgraf von Österreich', en: 'Saint Leopold, Margrave of Austria' },
				'o'
			)
		],
		'11-16': [proper('othmar', { de: 'Hl. Otmar, Abt', en: 'Saint Othmar, abbot' }, 'o')],
		'11-26': [
			proper(
				'conrad-and-saint-gebhard',
				{
					de: 'Hl. Konrad und hl. Gebhard, Bischöfe',
					en: 'Saint Conrad and Saint Gebhard, bishops'
				},
				'o'
			)
		],
		'12-02': [
			proper(
				'lucius-of-chur',
				{
					de: 'Hl. Luzius von Chur, Bischof, Märtyrer',
					en: 'Saint Lucius of Chur, bishop and martyr'
				},
				's',
				{ colour: 'red' }
			)
		],
		'12-04': [
			proper(
				'barbara',
				{ de: 'Hl. Barbara, Märtyrin', en: 'Saint Barbara, virgin and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'12-05': [
			proper(
				'anno-of-cologne',
				{ de: 'Hl. Anno von Köln, Bischof', en: 'Saint Anno of Cologne, bishop' },
				'o'
			)
		],
		'12-13': [
			proper(
				'odilia-of-alsace',
				{ de: 'Hl. Odilia, Äbtissin', en: 'Saint Odilia of Alsace, abbess' },
				'o'
			)
		]
	},
	observances: [
		{
			at: { fromEaster: 50 },
			observance: {
				id: 'holy-spirit',
				names: { de: 'Heiligen Geist', en: 'The Holy Spirit' },
				colour: 'red'
			}
		}
	],
	overrides: {
		agnes: keptAs('o'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		jerome: keptAs('o'),
		lucy: keptAs('o'),
		nicholas: keptAs('m'),
		'peter-canisius': keptAs('o', 'white'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'elizabeth-of-hungary': { to: '11-19' },
		gertrude: { to: '11-17' },
		matthias: { to: '02-24' },
		'peter-canisius': { to: '04-27' },
		visitation: { to: '07-02' }
	}
};
