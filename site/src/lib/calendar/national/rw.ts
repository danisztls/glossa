/**
 * Rwanda — the General Roman Calendar as Rwanda’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Rwanda actually does
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

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Our Lady of Kibeho: kept on 2025 2025-11-28, 2026 2026-11-28, 2027 2027-11-29 -- no fixed date and no fixed offset from Easter
 *   - Saint Martin de Porres, religious: absent in 2025 only -- not written; three years cannot say which it is
 */

export const RWANDA: NationalCalendar = {
	id: 'rw',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-27': [
			proper(
				'john-maria-muzeyi',
				{ fr: 'Saint Jean-Marie Muzeyi, martyr', en: 'Saint John Maria Muzeyi, martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'05-26': [
			proper(
				'denys-ssebuggwawo-and-saint-andrew-kaggwa',
				{
					fr: 'Saint Denys Ssebuggwawo et Saint André Kaggwa, martyrs',
					en: 'Saint Denys Ssebuggwawo and Saint Andrew Kaggwa, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'11-15': [
			proper(
				'joseph-mukasa-balikuddembe',
				{ en: 'Saint Joseph Mukasa Balikuddembe, martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'12-01': [
			proper(
				'charles-de-foucauld',
				{ fr: 'Saint Charles de Foucauld, prêtre', en: 'Saint Charles de Foucauld, priest' },
				'm'
			)
		]
	},
	overrides: {
		'charles-lwanga': keptAs('s')
	},
	moves: {
		'peter-and-paul': { to: '06-30' },
		'philip-neri': { to: '05-27' }
	},
	movedInYear: {
		'all-saints': { 2025: '11-02', 2027: '11-07' },
		'charles-lwanga': { 2025: '06-29', 2026: '06-14', 2027: '06-06' }
	}
};
