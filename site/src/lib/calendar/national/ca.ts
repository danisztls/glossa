/**
 * Canada — the General Roman Calendar as Canada’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Canada actually does
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

export const CANADA: NationalCalendar = {
	id: 'ca',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-07': [proper('andre-bessette', { en: 'Saint André Bessette, religious' }, 'm')],
		'01-12': [proper('marguerite-bourgeoys', { en: 'Saint Marguerite Bourgeoys, virgin' }, 'm')],
		'04-17': [proper('kateri-tekakwitha', { en: 'Saint Kateri Tekakwitha, virgin' }, 'm')],
		'04-18': [proper('marie-anne-blondin', { en: 'Blessed Marie-Anne Blondin, religious' }, 'o')],
		'04-26': [proper('good-counsel', { en: 'Our Lady of Good Counsel' }, 'o')],
		'04-30': [
			proper('marie-of-the-incarnation', { en: 'Saint Marie of the Incarnation, religious' }, 'm')
		],
		'05-04': [proper('marie-leonie-paradis', { en: 'Saint Marie-Léonie Paradis, religious' }, 'o')],
		'05-06': [
			proper(
				'francois-de-montmorency-laval',
				{ en: 'Saint François de Montmorency Laval, bishop' },
				'm'
			)
		],
		'05-08': [
			proper(
				'catherine-of-saint-augustine',
				{ en: 'Blessed Catherine of Saint Augustine, religious' },
				'o'
			)
		],
		'05-21': [proper('eugene-de-mazenod', { en: 'Saint Eugène de Mazenod, bishop' }, 'o')],
		'05-24': [
			proper('louis-zephirin-moreau', { en: 'Blessed Louis-Zéphirin Moreau, bishop' }, 'o')
		],
		'06-27': [
			proper(
				'nykyta-budka-and-blessed-vasyl-velychkovsky',
				{ en: 'Blessed Nykyta Budka and Blessed Vasyl Velychkovsky, bishops and martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'08-05': [proper('frederic-janssoone', { en: 'Blessed Frédéric Janssoone, priest' }, 'o')],
		'09-02': [
			proper('andre-grasset', { en: 'Blessed André Grasset, priest and martyr' }, 'o', {
				colour: 'red'
			})
		],
		'09-04': [proper('dina-belanger', { en: 'Blessed Dina Bélanger, religious' }, 'o')],
		'09-24': [
			proper('emilie-tavernier-gamelin', { en: 'Blessed Émilie Tavernier-Gamelin, religious' }, 'o')
		],
		'10-06': [proper('marie-rose-durocher', { en: 'Blessed Marie-Rose Durocher, religious' }, 'o')],
		'10-16': [
			proper('marguerite-d-youville', { en: 'Saint Marguerite d’Youville, religious' }, 'm')
		]
	},
	observances: [
		{
			at: '07-01',
			observance: { id: 'canada-day', names: { en: 'Canada Day' } }
		},
		{
			at: { month: 9, weekday: 1, nth: 1 },
			observance: { id: 'labour-day', names: { en: 'Labour Day' } }
		},
		{
			at: { month: 10, weekday: 1, nth: 2 },
			observance: { id: 'thanksgiving-day', names: { en: 'Thanksgiving Day' } }
		},
		{
			at: '11-11',
			observance: { id: 'remembrance-day', names: { en: 'Remembrance Day' } }
		}
	],
	overrides: {
		'joachim-anne': keptAs('f'),
		'north-american-martyrs': keptAs('f'),
		'our-lady-of-guadalupe': keptAs('f')
	},
	moves: {
		'cosmas-damian': { to: '09-25' },
		hedwig: { to: '10-20' },
		'margaret-mary-alacoque': { to: '10-20' },
		'north-american-martyrs': { to: '09-26' },
		'pius-v': { to: '05-01' },
		'raymond-of-penyafort': { to: '01-08' }
	}
};
