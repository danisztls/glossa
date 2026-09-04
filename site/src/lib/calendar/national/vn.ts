/**
 * Vietnam — the General Roman Calendar as Vietnam’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Vietnam actually does
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
 * A proper carries the name its conference approved, in vi, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs } from './common';
import type { NationalCalendar } from '../types';

export const VIETNAM: NationalCalendar = {
	id: 'vn',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {},
	observances: [
		{
			at: { years: { 2025: '01-29', 2026: '02-17', 2027: '02-06' } },
			observance: { id: 'lunar-new-year', names: { vi: 'Tết Nguyên Đán', en: 'Lunar New Year' } }
		},
		{
			at: { years: { 2025: '01-30', 2027: '02-07' } },
			observance: {
				id: 'day-of-venerating-ancestors',
				names: { vi: 'Kính Nhớ Tổ Tiên Và Ông Bà Cha Mẹ', en: 'Day of Venerating Ancestors' }
			}
		},
		{
			at: { years: { 2025: '01-31', 2026: '02-19', 2027: '02-08' } },
			observance: {
				id: 'day-of-prayer-for-sanctifying-works',
				names: { vi: 'Thánh Hoá Công Ăn Việc Làm', en: 'Day of Prayer for Sanctifying Works' }
			}
		},
		{
			at: '09-02',
			observance: {
				id: 'independence-day',
				names: { vi: 'Ngày Quốc Khánh', en: 'Independence Day' }
			}
		}
	],
	overrides: {
		'andrew-dung-lac': keptAs('s'),
		'francis-xavier': keptAs('f'),
		'our-lady-of-the-rosary': keptAs('s'),
		'therese-of-lisieux': keptAs('f')
	},
	movedInYear: {
		'andrew-dung-lac': { 2025: '11-16', 2026: '11-15', 2027: '11-14' },
		'our-lady-of-the-rosary': { 2025: '10-05', 2026: '10-04', 2027: '10-03' }
	}
};
