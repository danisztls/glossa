/**
 * Bosnia and Herzegovina — the General Roman Calendar as Bosnia and Herzegovina’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Bosnia and Herzegovina actually does
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

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Saint Vincent de Paul, priest: absent in 2025 only -- not written; three years cannot say which it is
 *   - Saint Lucy, virgin and martyr: absent in 2025 only -- not written; three years cannot say which it is
 *   - Saint Cosmas and Saint Damian, martyrs: absent in 2026 only -- not written; three years cannot say which it is
 *   - Our Lady of Guadalupe: absent in 2026 only -- not written; three years cannot say which it is
 *   - Saint Rita of Cassia, religious: absent in 2027 only -- not written; three years cannot say which it is
 *   - Saint Damasus I, pope: absent in 2027 only -- not written; three years cannot say which it is
 */

export const BOSNIA_HERZEGOVINA: NationalCalendar = {
	id: 'ba',
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
		'07-20': [proper('elijah', { hr: 'Sv. Ilija, prorok', en: 'Saint Elijah, prophet' }, 'f')],
		'07-27': [
			proper(
				'clement-of-ohrid',
				{
					hr: 'Sv. Klement Ohridski, Gorazd i drugovi',
					en: 'Saint Clement of Ohrid, Saint Gorazd, and companions'
				},
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
		'08-16': [proper('roch', { hr: 'Sv. Rok', en: 'Saint Roch' }, 'o')],
		'08-23': [
			proper(
				'miroslav-bulesic',
				{
					hr: 'Bl. Miroslav Bulešić, prezbiter i mučenik',
					en: 'Blessed Miroslav Bulešić, priest and martyr'
				},
				'm',
				{ colour: 'red' }
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
		],
		'12-15': [
			proper(
				'marija-jula-ivanisevic-and-companions',
				{
					hr: 'Bl. Marija Jula Ivanišević i susestre, djevice I mučenice',
					en: 'Blessed Marija Jula Ivanišević and companions, virgins and martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		]
	},
	observances: [
		{
			at: { fromEaster: -39 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { fromEaster: -37 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { fromEaster: -36 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { fromEaster: 52 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { fromEaster: 54 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { fromEaster: 55 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { month: 9, weekday: 3, nth: 4 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { month: 9, weekday: 5, nth: 4 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { month: 9, weekday: 6, nth: 4 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { years: { 2025: '12-10', 2026: '12-09', 2027: '12-10' } },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { years: { 2025: '12-12', 2026: '12-11', 2027: '12-11' } },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		},
		{
			at: { month: 12, weekday: 6, nth: 2 },
			observance: {
				id: 'ember-day',
				names: { hr: 'Kvatreni dan', en: 'Ember Day' },
				colour: 'violet'
			}
		}
	],
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'pius-v': keptAs('m'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'cyril-methodius': { to: '07-05' },
		scholastica: { to: '02-09' }
	}
};
