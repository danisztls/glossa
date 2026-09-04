/**
 * Southern Arabia — the General Roman Calendar as Southern Arabia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Southern Arabia actually does
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

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Dedication of the Churches of the Vicariate: kept on 2025 2025-10-26, 2026 2026-10-25, 2027 2027-10-31 -- no fixed date and no fixed offset from Easter
 */

export const SOUTHERN_ARABIA: NationalCalendar = {
	id: 'ae',
	alsoCovers: ['om', 'ye'],
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'02-25': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{ en: 'Anniversary of the Dedication of the Cathedral' },
				'f'
			)
		]
	},
	movable: [
		{
			at: { month: 1, weekday: 6, nth: 3 },
			celebration: proper('arabia', { en: 'Our Lady of Arabia' }, 's')
		}
	],
	observances: [
		{
			at: '06-30',
			observance: {
				id: 'day-of-prayer-for-modern-martyrs-of-yemen',
				names: { en: 'Day of Prayer for modern martyrs of Yemen' },
				colour: 'violet'
			}
		},
		{
			at: '11-05',
			observance: {
				id: 'commemoration-of-deceased-priests-and-religious',
				names: { en: 'Commemoration of Deceased Priests and Religious' },
				colour: 'violet'
			}
		}
	],
	overrides: {
		'francis-xavier': keptAs('f'),
		'therese-of-lisieux': keptAs('f')
	},
	movedInYear: {
		'peter-and-paul': { 2026: '06-28', 2027: '06-27' }
	}
};
