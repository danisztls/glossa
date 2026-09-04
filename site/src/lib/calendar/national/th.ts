/**
 * Thailand — the General Roman Calendar as Thailand’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Thailand actually does
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
 *   - Saint Martin de Porres, religious: absent in 2025 only -- not written; three years cannot say which it is
 */

export const THAILAND: NationalCalendar = {
	id: 'th',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-12': [
			proper(
				'nicholas-bunkerd-kitbamrung',
				{ en: 'Blessed Nicholas Bunkerd Kitbamrung, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'12-16': [
			proper('martyrs-of-songkhon', { en: 'Blessed Martyrs of Songkhon' }, 'o', { colour: 'red' })
		]
	},
	overrides: {
		'francis-xavier': keptAs('f')
	},
	movedInYear: {
		'all-saints': { 2025: '11-02', 2027: '11-07' },
		assumption: { 2025: '08-17', 2026: '08-16' },
		'peter-and-paul': { 2026: '07-05', 2027: '07-04' }
	}
};
