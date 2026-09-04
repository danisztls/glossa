/**
 * South Korea — the General Roman Calendar as South Korea’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what South Korea actually does
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
 * A proper carries the name its conference approved, in ko, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Saint Justin, martyr: absent in 2026, 2027 only -- not written; three years cannot say which it is
 */

export const SOUTH_KOREA: NationalCalendar = {
	id: 'kr',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'06-01': [
			proper(
				'paul-yun-ji-chung-and-companions',
				{
					ko: '복자 윤지충 바오로와 동료 순교자들',
					en: 'Blessed Paul Yun Ji Chung and companions, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'09-20': [
			proper(
				'andrew-kim-taegon',
				{
					ko: '성 김대건 안드레아 사제와 성 정하상 바오로와 동료 순교자들',
					en: 'Saint Andrew Kim Taegŏn, priest, Saint Paul Chŏng Hasang and companions, martyrs'
				},
				's',
				{ colour: 'red' }
			)
		]
	},
	observances: [
		{
			at: { years: { 2025: '01-29', 2026: '02-17', 2027: '02-06' } },
			observance: { id: 'lunar-new-year', names: { ko: '설', en: 'Lunar New Year' } }
		},
		{
			at: '06-25',
			observance: {
				id: 'day-of-prayer-for-the-reconciliation-and-unity-of-the-korean-people',
				names: {
					ko: '민족의 화해와 일치를 위한 기도의 날',
					en: 'Day of Prayer for the Reconciliation and Unity of the Korean People'
				}
			}
		},
		{
			at: { years: { 2025: '10-06', 2026: '09-25', 2027: '09-15' } },
			observance: { id: 'thanksgiving-day', names: { ko: '한가위', en: 'Thanksgiving Day' } }
		}
	],
	overrides: {
		'andrew-kim': keptAs('s'),
		'therese-of-lisieux': keptAs('s')
	}
};
