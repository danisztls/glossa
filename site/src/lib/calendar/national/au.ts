/**
 * Australia — the General Roman Calendar as Australia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Australia actually does
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
 *   - Our Lady Help of Christians: kept on 2025 2025-05-24, 2026 2026-05-25, 2027 2027-05-24 -- no fixed date and no fixed offset from Easter
 */

export const AUSTRALIA: NationalCalendar = {
	id: 'au',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'04-16': [proper('bernadette-soubirous', { en: 'Saint Bernadette Soubirous, virgin' }, 'o')],
		'07-07': [
			proper('peter-to-rot', { en: 'Blessed Peter To Rot, martyr' }, 'o', { colour: 'red' })
		],
		'08-08': [proper('mary-of-the-cross', { en: 'Saint Mary of the Cross, religious' }, 'f')]
	},
	observances: [
		{
			at: '01-26',
			observance: { id: 'australia-day', names: { en: 'Australia Day' } }
		},
		{
			at: '04-25',
			observance: { id: 'anzac-day', names: { en: 'ANZAC Day' } }
		}
	],
	overrides: {
		'fisher-more': keptAs('m'),
		patrick: keptAs('s', 'white'),
		'peter-chanel': keptAs('m')
	},
	moves: {
		dominic: { to: '08-03' },
		'louis-de-montfort': { to: '04-27' },
		mark: { to: '04-26' },
		'paulinus-of-nola': { to: '06-23' },
		'timothy-titus': { to: '01-23' }
	}
};
