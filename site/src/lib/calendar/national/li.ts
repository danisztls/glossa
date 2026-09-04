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

import { keptAs, proper, withGroup } from './common';
import { GERMAN_LANGUAGE_AREA } from './groups';
import type { NationalCalendar } from '../types';

export const LIECHTENSTEIN: NationalCalendar = {
	id: 'li',
	options: {},
	propers: withGroup(GERMAN_LANGUAGE_AREA, {
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
		'05-11': [
			proper('mamertus', { de: 'Hl. Mamertus, Bischof', en: 'Saint Mamertus, bishop' }, 'o')
		],
		'05-21': [
			proper(
				'hermann-joseph',
				{ de: 'Hl. Hermann Josef, Ordenspriester', en: 'Saint Hermann Joseph, priest' },
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
		'07-16': [
			proper(
				'einsiedeln',
				{ de: 'Unsere Liebe Frau von Einsiedeln', en: 'Our Lady of Einsiedeln' },
				'm'
			)
		],
		'08-16': [
			proper(
				'theodore-of-octodurum',
				{ de: 'Hl. Theodor von Sitten, Bischof', en: 'Saint Theodore of Octodurum, bishop' },
				'o'
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
		'09-25': [
			proper(
				'nicholas-of-flue',
				{ de: 'Hl. Niklaus von Flüe, Einsiedler', en: 'Saint Nicholas of Flüe, hermit' },
				's'
			)
		],
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
		'11-16': [proper('othmar', { de: 'Hl. Otmar, Abt', en: 'Saint Othmar, abbot' }, 'o')],
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
		]
	}),
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
