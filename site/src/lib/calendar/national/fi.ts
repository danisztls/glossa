/**
 * Finland — the General Roman Calendar as Finland’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Finland actually does
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

export const FINLAND: NationalCalendar = {
	id: 'fi',
	alsoCovers: ['ax'],
	options: { corpusChristiOnSunday: true },
	propers: {
		'01-19': [
			proper('henry-of-finland', { en: 'Saint Henry of Finland, bishop and martyr' }, 'f', {
				colour: 'red'
			})
		],
		'05-18': [
			proper('eric-of-sweden', { en: 'Saint Eric of Sweden, martyr' }, 'm', { colour: 'red' })
		],
		'05-22': [proper('hemming', { en: 'Saint Hemming, bishop' }, 'm')],
		'05-29': [proper('urszula-ledochowska', { en: 'Saint Urszula Ledóchowska, virgin' }, 'o')],
		'06-04': [proper('elizabeth-hesselblad', { en: 'Saint Elizabeth Hesselblad, virgin' }, 'o')],
		'06-26': [
			proper(
				'josemaria-escriva-de-balaguer',
				{ en: 'Saint Josemaría Escrivá de Balaguer, priest' },
				'o'
			)
		],
		'07-10': [
			proper('canute-of-denmark', { en: 'Saint Canute of Denmark, martyr' }, 'm', { colour: 'red' })
		],
		'07-20': [proper('thorlak', { en: 'Saint Thorlak, bishop' }, 'm')],
		'07-29': [proper('olaf', { en: 'Saint Olaf, martyr' }, 's', { colour: 'red' })],
		'09-12': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{ en: 'Anniversary of the Dedication of the Cathedral' },
				'f'
			)
		],
		'09-24': [proper('all-nordic-saints', { en: 'All Nordic Saints' }, 'm')],
		'11-25': [proper('niels-steensen', { en: 'Blessed Niels Steensen, bishop' }, 'o')]
	},
	movable: [
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{ en: 'Our Lord Jesus Christ, the Eternal High Priest' },
				'f'
			)
		}
	],
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		bridget: { to: '10-07' },
		'our-lady-of-the-rosary': { to: '10-08' }
	},
	movedInYear: {
		'all-saints': { 2025: '11-02', 2027: '11-07' }
	}
};
