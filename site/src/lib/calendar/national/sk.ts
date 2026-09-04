/**
 * Slovakia — the General Roman Calendar as Slovakia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Slovakia actually does
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
 * A proper carries the name its conference approved, in sk, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const SLOVAKIA: NationalCalendar = {
	id: 'sk',
	options: {},
	propers: {
		'05-04': [
			proper('florian', { sk: 'Svätého Floriána, mučeníka', en: 'Saint Florian, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'05-11': [
			proper(
				'sara-salkahazi',
				{
					sk: 'Blahoslavenej Sáry Salkaháziovej, panny a mučenice',
					en: 'Blessed Sára Salkaházi, virgin and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-16': [
			proper(
				'john-of-nepomuk',
				{
					sk: 'Svätého Jána Nepomuckého, kňaza a mučeníka',
					en: 'Saint John of Nepomuk, priest and martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'07-17': [
			proper(
				'andrzej-zorard-and-saint-benedict',
				{
					sk: 'Svätých Andreja-Svorada a Benedikta, pustovníkov',
					en: 'Saint Andrzej Zorard and Saint Benedict, monks'
				},
				'm'
			)
		],
		'07-27': [
			proper(
				'gorazd-and-companions',
				{ sk: 'Svätých Gorazda a spoločníkov', en: 'Saint Gorazd and companions' },
				'm'
			)
		],
		'07-30': [
			proper(
				'zdenka-schelingova',
				{
					sk: 'Blahoslavenej Zdenky Cecílie Schelingovej, panny a mučenice',
					en: 'Blessed Zdenka Schelingová, virgin and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'08-18': [proper('helena', { sk: 'Svätej Heleny', en: 'Saint Helena' }, 'o')],
		'09-07': [
			proper(
				'marko-krizin',
				{
					sk: 'Svätých Marka Križina, Melichara Grodzieckeho a Štefana Pongrácza, kňazov a mučeníkov',
					en: 'Saints Marko Krizin, Melichar Grodecki and Stephen Pongrác, priests and martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'10-16': [proper('gall', { sk: 'Svätej Hedvigy, rehoľníčky', en: 'Saint Gall, abbot' }, 'o')],
		'10-25': [
			proper(
				'maurus-of-pecs',
				{ sk: 'Svätého Maura, biskupa', en: 'Saint Maurus of Pécs, bishop' },
				'o'
			)
		],
		'12-04': [
			proper(
				'barbara',
				{ sk: 'Svätej Barbory, panny a mučenice', en: 'Saint Barbara, virgin and martyr' },
				'o',
				{ colour: 'red' }
			)
		]
	},
	movable: [
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{
					sk: 'Nášho Pána Ježiša Krista, najvyššieho a večného kňaza',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	observances: [
		{
			at: { fromEaster: -39 },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { fromEaster: -37 },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { fromEaster: -36 },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { fromEaster: 45 },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { fromEaster: 47 },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { fromEaster: 48 },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { years: { 2025: '09-17', 2026: '09-16', 2027: '09-17' } },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { years: { 2025: '09-19', 2026: '09-18', 2027: '09-18' } },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { years: { 2025: '09-20', 2026: '09-19', 2027: '12-10' } },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { years: { 2025: '12-10', 2026: '12-09', 2027: '12-11' } },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { month: 12, weekday: 5, nth: 2 },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { month: 12, weekday: 6, nth: 2 },
			observance: { id: 'ember-day', names: { sk: 'Suché dny', en: 'Ember Day' }, colour: 'violet' }
		},
		{
			at: { fromEaster: 36 },
			observance: {
				id: 'rogation-day',
				names: { sk: 'Prosebné dny', en: 'Rogation Day' },
				colour: 'violet'
			}
		},
		{
			at: { fromEaster: 37 },
			observance: {
				id: 'rogation-day',
				names: { sk: 'Prosebné dny', en: 'Rogation Day' },
				colour: 'violet'
			}
		},
		{
			at: { fromEaster: 38 },
			observance: {
				id: 'rogation-day',
				names: { sk: 'Prosebné dny', en: 'Rogation Day' },
				colour: 'violet'
			}
		}
	],
	overrides: {
		adalbert: keptAs('m'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('s'),
		'our-lady-of-sorrows': keptAs('s'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'anthony-zaccaria': { to: '07-07' },
		'cyril-methodius': { to: '07-05' },
		george: { to: '04-24' },
		visitation: { to: '07-02' }
	}
};
