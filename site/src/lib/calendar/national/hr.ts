/**
 * Croatia — the General Roman Calendar as Croatia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Croatia actually does
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
 * A proper carries the name its conference approved, in hr, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const CROATIA: NationalCalendar = {
	id: 'hr',
	options: {},
	propers: {
		'02-10': [
			proper(
				'aloysius-stepinac',
				{
					hr: 'Bl. Alojzije Stepinac, biskup i mučenik',
					en: 'Blessed Aloysius Stepinac, bishop and martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'04-27': [
			proper(
				'osanna-of-kotor',
				{ hr: 'Bl. Ozana Kotorska, djevica', en: 'Blessed Osanna of Kotor, virgin' },
				'o'
			)
		],
		'05-10': [proper('ivan-merz', { hr: 'Bl. Ivan Merz', en: 'Blessed Ivan Merz' }, 'o')],
		'05-12': [
			proper(
				'leopold-mandic',
				{ hr: 'Sv. Leopold Mandić, prezbiter', en: 'Saint Leopold Mandić, priest' },
				'm'
			)
		],
		'07-09': [
			proper(
				'mary-petkovic',
				{ hr: 'Bl. Marija Propetog Isusa, djevica', en: 'Blessed Mary Petkovic, virgin' },
				'o'
			)
		],
		'07-13': [
			proper(
				'bistrica',
				{ hr: 'Blažena Djevica Marija Bistrička', en: 'Our Lady of Bistrica' },
				'o'
			)
		],
		'08-03': [
			proper(
				'augustine-kazotic',
				{ hr: 'Bl. Augustin Kažotić, biskup', en: 'Blessed Augustine Kažotić, bishop' },
				'o'
			)
		],
		'09-07': [
			proper(
				'marko-krizin',
				{
					hr: 'Sv. Marko Križevčanin, prezbiter i mučenik',
					en: 'Saint Marko Krizin, priest and martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'11-08': [
			proper(
				'gratia-of-kotor',
				{ hr: 'Bl. Gracija Kotorski, redovnik', en: 'Blessed Gratia of Kotor, monk' },
				'o'
			)
		],
		'11-14': [
			proper(
				'nicholas-tavelic',
				{
					hr: 'Sv. Nikola Tavelić, prezbiter i mučenik',
					en: 'Saint Nicholas Tavelic, priest and martyr'
				},
				'm',
				{ colour: 'red' }
			)
		]
	},
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'cyril-methodius': { to: '07-05' },
		scholastica: { to: '02-09' }
	}
};
