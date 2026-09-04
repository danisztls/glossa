/**
 * Guam — the General Roman Calendar as Guam’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Guam actually does
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

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const GUAM: NationalCalendar = {
	id: 'gu',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-13': [
			proper(
				'diego-luis-de-san-vitores',
				{ en: 'Blessed Diego Luis de San Vitores, priest and martyr' },
				'f',
				{ colour: 'red' }
			)
		],
		'04-29': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{ en: 'Anniversary of the Dedication of the Cathedral' },
				'f'
			)
		]
	},
	observances: [
		{
			at: { month: 11, weekday: 4, nth: 4 },
			observance: {
				id: 'day-of-prayer-for-the-harvest-and-fruits-of-the-earth',
				names: { en: 'Day of Prayer for the Harvest and Fruits of the Earth' }
			}
		}
	],
	overrides: {
		'holy-name-of-mary': keptAs('m')
	}
};
