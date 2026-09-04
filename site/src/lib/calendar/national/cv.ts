/**
 * Cabo Verde — the General Roman Calendar as Cabo Verde’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Cabo Verde actually does
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
 * A proper carries the name its conference approved, in pt, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const CABO_VERDE: NationalCalendar = {
	id: 'cv',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'02-04': [
			proper(
				'john-de-britto',
				{
					pt: 'São João de Brito, presbítero e mártir',
					en: 'Saint John de Britto, priest and martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'02-20': [
			proper(
				'francisco-marto-and-saint-jacinta-marto',
				{
					pt: 'Santos Francisco Marto e Jacinta Marto',
					en: 'Saint Francisco Marto and Saint Jacinta Marto'
				},
				'o'
			)
		],
		'07-17': [
			proper(
				'ignacio-de-azevedo',
				{
					pt: 'Beatos Inácio de Azevedo, presbítero, e companheiros, mártires',
					en: 'Blessed Ignacio de Azevedo, priest, and companions, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'08-05': [
			proper(
				'mother-of-africa',
				{ pt: 'Nossa Senhora de África', en: 'Our Lady Mother of Africa' },
				'f'
			)
		],
		'08-17': [
			proper(
				'beatrice-of-silva',
				{ pt: 'Santa Beatriz da Silva, virgem', en: 'Saint Beatrice of Silva, virgin' },
				'm'
			)
		],
		'10-09': [
			proper(
				'john-henry-newman',
				{ pt: 'São João Leonardo, presbítero', en: 'Saint John Henry Newman, priest' },
				'o'
			)
		]
	},
	overrides: {
		augustine: keptAs('f'),
		'charles-lwanga': keptAs('f'),
		'francis-xavier': keptAs('f'),
		irenaeus: keptAs('s'),
		'our-lady-of-fatima': keptAs('m'),
		'peter-claver': keptAs('m'),
		'therese-of-lisieux': keptAs('f')
	},
	moves: {
		'anthony-of-padua': { to: '06-13' },
		boniface: { to: '06-05' },
		irenaeus: { to: '06-28' }
	},
	movedInYear: {
		irenaeus: { 2025: '10-25', 2026: '10-24', 2027: '10-30' }
	}
};
