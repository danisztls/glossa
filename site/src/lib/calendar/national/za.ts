/**
 * South Africa — the General Roman Calendar as South Africa’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what South Africa actually does
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
 * GCatholic publishes this calendar in English only, so a proper carries its English name and nothing else. `celebrationName` falls back to it for a reader of any other language, which is the name the celebration actually has.
 */

import { keptAs, proper, withGroup } from './common';
import { EASTERN_AFRICA } from './groups';
import type { NationalCalendar } from '../types';

export const SOUTH_AFRICA: NationalCalendar = {
	id: 'za',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: withGroup(EASTERN_AFRICA, {
		'02-01': [
			proper('benedict-daswa', { en: 'Blessed Benedict Daswa, martyr' }, 'o', { colour: 'red' })
		],
		'05-29': [proper('joseph-gerard', { en: 'Blessed Joseph Gerard, priest' }, 'o')],
		'06-08': [
			proper('james-berthieu', { en: 'Saint James Berthieu, priest and martyr' }, 'o', {
				colour: 'red'
			})
		],
		'08-30': [
			proper('ghebre-michael', { en: 'Blessed Ghebre Michael, priest and martyr' }, 'o', {
				colour: 'red'
			})
		],
		'09-24': [proper('stephanie', { en: 'Saint Stephanie, martyr' }, 'o', { colour: 'red' })],
		'10-10': [proper('daniele-comboni', { en: 'Saint Daniele Comboni, bishop' }, 'm')],
		'10-30': [
			proper('marcellus-of-tangier', { en: 'Saint Marcellus of Tangier, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'12-10': [
			proper('melchiades', { en: 'Saint Melchiades, pope and martyr' }, 'o', { colour: 'red' })
		],
		'12-20': [
			proper('scubilion', { en: 'Blessed Scubilion, religious' }, 'o', { colour: 'violet' })
		]
	}),
	overrides: {
		'peter-claver': keptAs('f')
	},
	moves: {
		'pius-v': { to: '04-28' }
	}
};
