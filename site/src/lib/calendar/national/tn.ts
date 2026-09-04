/**
 * Tunisia — the General Roman Calendar as Tunisia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Tunisia actually does
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
 * A proper carries the name its conference approved, in fr, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper, withGroup } from './common';
import { NORTH_AFRICA } from './groups';
import type { NationalCalendar } from '../types';

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Anniversary of the Dedication of the Cathedral: kept on 2025 2025-05-23, 2026 2026-05-23, 2027 2027-05-24 -- no fixed date and no fixed offset from Easter
 */

export const TUNISIA: NationalCalendar = {
	id: 'tn',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: withGroup(NORTH_AFRICA, {
		'05-06': [
			proper(
				'james',
				{
					fr: 'Saint Jacques, diacre et Saint Marien, lecteur et leurs compagnons, martyrs',
					en: 'Saint James, deacon, Saint Marianus and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'06-18': [proper('roch', { en: 'Saint Roch' }, 'f')]
	}),
	overrides: {
		augustine: keptAs('s'),
		'cornelius-cyprian': keptAs('s'),
		'francis-xavier': keptAs('f'),
		monica: keptAs('f'),
		'perpetua-felicity': keptAs('f', 'red'),
		'therese-of-lisieux': keptAs('f')
	}
};
