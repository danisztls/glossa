/**
 * Malta — the General Roman Calendar as Malta’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Malta actually does
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
 * A proper carries the name its conference approved, in mt, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Saint Paul, apostle: kept on 2025 2025-02-10, 2026 2026-02-10, 2027 2027-02-11 -- no fixed date and no fixed offset from Easter
 */

export const MALTA: NationalCalendar = {
	id: 'mt',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-22': [
			proper(
				'publius',
				{ mt: 'San Publiju, isqof u prinċep ta’ Malta', en: 'Saint Publius, bishop' },
				'm'
			)
		],
		'02-25': [
			proper(
				'maria-adeodata-pisani',
				{
					mt: 'Beata Marija Adeodata Pisani, reliġjuża',
					en: 'Blessed Maria Adeodata Pisani, religious'
				},
				'o'
			)
		],
		'05-09': [
			proper(
				'george-preca',
				{ mt: 'San Ġorġ Preca, presbiteru', en: 'Saint George Preca, priest' },
				'f'
			)
		],
		'07-01': [
			proper(
				'nazju-falzon',
				{ mt: 'Beatu Nazju Falzon, kjeriku sekulari', en: 'Blessed Nazju Falzon, religious' },
				'o'
			)
		]
	},
	movable: [
		{
			at: { fromEaster: -9 },
			celebration: proper(
				'mary-next-to-the-cross',
				{
					mt: 'L’Imqaddsa Verġni Marija ħdejn is-Salib tal-Mulej',
					en: 'Saint Mary next to the Cross'
				},
				'o',
				{ colour: 'violet' }
			)
		}
	],
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'joseph-the-worker': keptAs('m'),
		'nativity-of-mary': keptAs('s'),
		'our-lady-of-mount-carmel': keptAs('m'),
		'pius-v': keptAs('m'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		scholastica: { to: '02-09' }
	}
};
