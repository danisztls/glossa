/**
 * The United States — the General Roman Calendar as the USCCB keeps it.
 *
 * ## One layer, two answers about the Ascension
 *
 * The Ascension is kept on the Thursday in the ecclesiastical provinces of
 * Boston, Hartford, New York, Newark, Omaha and Philadelphia and on the
 * Seventh Sunday of Easter everywhere else. That is not a thing a national
 * calendar can settle, so `options` states the transfer the greater part of
 * the country makes and the reader may say otherwise — the three transfers
 * are separate flags for exactly this reason (`CalendarOptions`). GCatholic
 * publishes both as `US-D` and `US-H`, and `oracle.test.ts` checks this one
 * layer against both.
 *
 * ## The four observances
 *
 * This calendar prints four days that are not celebrations at all — the Day
 * of Prayer for the Legal Protection of Unborn Children, Independence Day,
 * Labor Day and Thanksgiving. They carry no rank because they are not lines
 * of the Table of Liturgical Days; see `Observance` in `../types.ts`. The Day
 * of Prayer is why Saint Vincent moves to 23 January, which is the only move
 * in these fifteen layers made by something that is not itself a celebration.
 */

import type { NationalCalendar } from '../types';
import { keptAs, proper } from './common';

export const UNITED_STATES: NationalCalendar = {
	id: 'us',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'01-04': [proper('elizabeth-ann-seton', { en: 'Saint Elizabeth Ann Seton, Religious' }, 'm')],
		'01-05': [proper('john-neumann', { en: 'Saint John Neumann, Bishop' }, 'm')],
		'01-06': [proper('andre-bessette', { en: 'Saint André Bessette, Religious' }, 'o')],
		'01-23': [proper('marianne-cope', { en: 'Saint Marianne Cope, Virgin' }, 'o')],
		'03-03': [proper('katharine-drexel', { en: 'Saint Katherine Drexel, Virgin' }, 'o')],
		'05-10': [proper('damien-de-veuster', { en: 'Saint Damien de Veuster, Priest' }, 'o')],
		'05-15': [proper('isidore-the-farmer', { en: 'Saint Isidore the Farmer' }, 'o')],
		'07-01': [proper('junipero-serra', { en: 'Saint Junípero Serra, Priest' }, 'o')],
		'07-14': [proper('kateri-tekakwitha', { en: 'Saint Kateri Tekakwitha, Virgin' }, 'm')],
		'10-05': [
			proper('francis-xavier-seelos', { en: 'Blessed Francis Xavier Seelos, Priest' }, 'o')
		],
		'10-06': [proper('marie-rose-durocher', { en: 'Blessed Marie-Rose Durocher, Religious' }, 'o')],
		'11-13': [
			proper('frances-xavier-cabrini', { en: 'Saint Frances Xavier Cabrini, Virgin' }, 'm')
		],
		'11-18': [
			proper('rose-philippine-duchesne', { en: 'Saint Rose Philippine Duchesne, Virgin' }, 'o')
		],
		'11-23': [
			proper('miguel-agustin-pro', { en: 'Blessed Miguel Agustín Pro, Priest and Martyr' }, 'o', {
				colour: 'red'
			})
		]
	},

	overrides: {
		'our-lady-of-guadalupe': keptAs('f'),
		'peter-claver': keptAs('m'),
		// The North American martyrs are an obligatory memorial here, which is
		// what pushes Paul of the Cross off 19 October.
		'north-american-martyrs': keptAs('m', 'red')
	},

	observances: [
		{
			at: '01-22',
			observance: {
				id: 'day-of-prayer-unborn',
				names: { en: 'Day of Prayer for the Legal Protection of Unborn Children' }
			}
		},
		{ at: '07-04', observance: { id: 'independence-day', names: { en: 'Independence Day' } } },
		{
			at: { month: 9, weekday: 1, nth: 1 },
			observance: { id: 'labor-day', names: { en: 'Labor Day' } }
		},
		{
			at: { month: 11, weekday: 4, nth: 4 },
			observance: { id: 'thanksgiving', names: { en: 'Thanksgiving Day' } }
		}
	],

	moves: {
		// Displaced by the Day of Prayer, which is a penitential observance and
		// not a celebration — the one move here with nothing ranked behind it.
		'vincent-deacon': { to: '01-23' },
		'elizabeth-of-portugal': { to: '07-05' },
		camillus: { to: '07-18' },
		'paul-of-the-cross': { to: '10-20' }
	}
};
