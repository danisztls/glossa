/**
 * Austria — the General Roman Calendar as Austria’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Austria actually does
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

export const AUSTRIA: NationalCalendar = {
	id: 'at',
	options: {},
	propers: withGroup(GERMAN_LANGUAGE_AREA, {
		'02-04': [
			proper(
				'rabanus-maurus',
				{ de: 'Hl. Rabanus Maurus, Bischof', en: 'Saint Rabanus Maurus, bishop' },
				'o'
			)
		],
		'03-26': [
			proper(
				'ludger-of-munster',
				{ de: 'Hl. Liudger von Münster, Bischof', en: 'Saint Ludger of Münster, bishop' },
				'o',
				{ colour: 'violet' }
			)
		],
		'05-10': [
			proper(
				'damien-de-veuster',
				{ de: 'Hl. Damian de Veuster, Ordenspriester', en: 'Saint Damien de Veuster, priest' },
				'o'
			)
		],
		'05-21': [
			proper(
				'franz-jagerstatter',
				{
					de: 'Hl. Christophorus Magallanes, Priester, und Gefährten, Märtyrer',
					en: 'Blessed Franz Jägerstätter, martyr'
				},
				'o',
				{ colour: 'red' }
			),
			proper(
				'hermann-joseph',
				{ de: 'Hl. Hermann Josef, Ordenspriester', en: 'Saint Hermann Joseph, priest' },
				'o'
			)
		],
		'06-12': [
			proper(
				'hildegard-burjan',
				{ de: 'Sel. Hildegard Burjan', en: 'Blessed Hildegard Burjan' },
				'o'
			)
		],
		'06-27': [
			proper('hemma-of-gurk', { de: 'Hl. Hemma von Gurk', en: 'Saint Hemma of Gurk' }, 'o')
		],
		'09-25': [
			proper(
				'nicholas-of-flue',
				{ de: 'Hl. Niklaus von Flüe, Einsiedler', en: 'Saint Nicholas of Flüe, hermit' },
				'o'
			)
		],
		'10-16': [proper('gall', { de: 'Hl. Gallus, Mönch', en: 'Saint Gall, abbot' }, 'o')],
		'10-21': [
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
			proper('wolfgang', { de: 'Hl. Wolfgang, Bischof', en: 'Saint Wolfgang, bishop' }, 'o')
		],
		'11-13': [
			proper(
				'carl-lampert',
				{
					de: 'Sel. Carl Lampert, Priester, Märtyrer',
					en: 'Blessed Carl Lampert, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'12-02': [
			proper(
				'lucius-of-chur',
				{
					de: 'Hl. Luzius von Chur, Bischof, Märtyrer',
					en: 'Saint Lucius of Chur, bishop and martyr'
				},
				'o',
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
		'holy-name-of-mary': keptAs('f'),
		lucy: keptAs('o'),
		'peter-canisius': keptAs('o', 'white'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'albert-the-great': { to: '11-16' },
		'elizabeth-of-hungary': { to: '11-19' },
		gertrude: { to: '11-17' },
		matthias: { to: '02-24' },
		'peter-canisius': { to: '04-27' },
		visitation: { to: '07-02' }
	}
};
