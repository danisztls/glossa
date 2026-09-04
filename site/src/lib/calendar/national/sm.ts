/**
 * San Marino — the General Roman Calendar as San Marino’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what San Marino actually does
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
 * A proper carries the name its conference approved, in it, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const SAN_MARINO: NationalCalendar = {
	id: 'sm',
	options: { corpusChristiOnSunday: true },
	propers: {
		'06-04': [
			proper(
				'quirinus-of-sescia',
				{ it: 'San Quirino, vescovo e martire', en: 'Saint Quirinus of Sescia, bishop and martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'06-17': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{
					it: 'Anniversario della Dedicazione della Chiesa Cattedrale',
					en: 'Anniversary of the Dedication of the Cathedral'
				},
				'f'
			)
		],
		'08-01': [proper('leo', { it: 'San Leone, sacerdote', en: 'Saint Leo, priest' }, 'f')],
		'09-03': [proper('marinus', { it: 'San Marino, diacono', en: 'Saint Marinus, deacon' }, 'f')],
		'09-11': [
			proper(
				'domenico-spadafora',
				{ it: 'Beato Domenico Spadafora, religioso', en: 'Blessed Domenico Spadafora, religious' },
				'm'
			)
		],
		'11-08': [
			proper(
				'all-saints-and-blesseds-of-the-diocese',
				{ it: 'Beata Vergine della Misericordia', en: 'All Saints and Blesseds of the Diocese' },
				'm'
			)
		]
	},
	movable: [
		{
			at: { month: 11, weekday: 6, nth: 2 },
			celebration: proper(
				'mercy',
				{ it: 'Tutti i Santi e Beati della Diocesi', en: 'Our Lady of Mercy' },
				'm'
			)
		},
		{
			at: { month: 3, weekday: 5, nth: 3 },
			celebration: proper(
				'mother-of-graces',
				{ it: 'Beata Vergine Maria Madre delle Grazie', en: 'Our Lady Mother of Graces' },
				'f'
			)
		}
	],
	overrides: {
		apollinaris: keptAs('f'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'francis-of-assisi': keptAs('f'),
		nicholas: keptAs('m'),
		'our-lady-of-loreto': keptAs('f'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		apollinaris: { to: '07-23' },
		bridget: { to: '07-20' }
	}
};
