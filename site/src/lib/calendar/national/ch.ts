/**
 * Switzerland — the General Roman Calendar as Switzerland’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Switzerland actually does
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

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const SWITZERLAND: NationalCalendar = {
	id: 'ch',
	options: {},
	propers: {
		'09-25': [
			proper(
				'nicholas-of-flue',
				{ de: 'Hl. Niklaus von Flüe, Einsiedler', en: 'Saint Nicholas of Flüe, hermit' },
				's'
			)
		]
	},
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'teresa-benedicta': keptAs('f')
	}
};
