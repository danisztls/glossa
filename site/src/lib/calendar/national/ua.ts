/**
 * Ukraine — the General Roman Calendar as Ukraine’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Ukraine actually does
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

export const UKRAINE: NationalCalendar = {
	id: 'ua',
	options: { corpusChristiOnSunday: true },
	propers: {
		'01-05': [proper('marcelina-darowska', { en: 'Blessed Marcelina Darowska, religious' }, 'o')],
		'01-30': [proper('bronis-aw-markiewicz', { en: 'Blessed Bronisław Markiewicz, priest' }, 'o')],
		'04-01': [proper('mercy', { en: 'Our Lady of Mercy' }, 'o', { colour: 'violet' })],
		'05-16': [
			proper('andrzej-bobola', { en: 'Saint Andrzej Bobola, priest and martyr' }, 'o', {
				colour: 'red'
			})
		],
		'05-21': [
			proper('john-of-nepomuk', { en: 'Saint John of Nepomuk, priest and martyr' }, 'o', {
				colour: 'red'
			})
		],
		'06-17': [proper('albert-chmielowski', { en: 'Saint Albert Chmielowski, religious' }, 'o')],
		'06-26': [proper('zygmunt-gorazdowski', { en: 'Saint Zygmunt Gorazdowski, priest' }, 'o')],
		'07-08': [proper('john-of-dukla', { en: 'Saint John of Dukla, priest' }, 'o')],
		'07-18': [proper('jadwiga-of-poland', { en: 'Saint Jadwiga of Poland' }, 'o')],
		'07-24': [proper('olga-of-kiev', { en: 'Saint Olga of Kiev' }, 'o')],
		'07-28': [proper('vladimir', { en: 'Saint Vladimir' }, 'm')],
		'08-17': [proper('hyacinth-of-poland', { en: 'Saint Hyacinth of Poland, priest' }, 'o')],
		'08-26': [proper('czestochowa', { en: 'Our Lady of Częstochowa' }, 'o')],
		'09-09': [
			proper(
				'w-adys-aw-b-adzinski',
				{ en: 'Blessed Władysław Błądziński, priest, and companions, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'09-18': [proper('stanislaus-kostka', { en: 'Saint Stanislaus Kostka, religious' }, 'm')],
		'10-23': [proper('jozef-bilczewski', { en: 'Saint Józef Bilczewski, bishop' }, 'm')]
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
		ephrem: keptAs('f'),
		stanislaus: keptAs('m', 'red'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'john-of-capistrano': { to: '10-22' },
		stanislaus: { to: '05-08' }
	}
};
