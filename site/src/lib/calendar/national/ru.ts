/**
 * Russia — the General Roman Calendar as Russia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Russia actually does
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

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Saint Columban, abbot: absent in 2026, 2027 only -- not written; three years cannot say which it is
 */

export const RUSSIA: NationalCalendar = {
	id: 'ru',
	options: { corpusChristiOnSunday: true },
	propers: {
		'01-27': [proper('jurgis-matulaitis', { en: 'Blessed Jurgis Matulaitis, bishop' }, 'm')],
		'01-29': [proper('boles-awa-lament', { en: 'Blessed Bolesława Lament, virgin' }, 'm')],
		'05-16': [
			proper('theodosius-of-the-caves', { en: 'Saint Theodosius of the Caves, abbot' }, 'm')
		],
		'05-24': [proper('help-of-christians', { en: 'Our Lady Help of Christians' }, 'o')],
		'06-27': [
			proper('leonid-feodorov', { en: 'Blessed Leonid Feodorov, priest and martyr' }, 'o', {
				colour: 'red',
				marian: true
			}),
			proper('perpetual-help', { en: 'Our Lady of Perpetual Help' }, 'o', { marian: true })
		],
		'07-24': [proper('olga-of-kiev', { en: 'Saint Olga of Kiev' }, 'm')],
		'07-27': [proper('olaf', { en: 'Saint Olaf, martyr' }, 'm', { colour: 'red' })],
		'07-28': [proper('vladimir', { en: 'Saint Vladimir' }, 'm')],
		'08-05': [
			proper('boris-and-saint-gleb', { en: 'Saint Boris and Saint Gleb, martyrs' }, 'o', {
				colour: 'red'
			})
		],
		'08-26': [proper('czestochowa', { en: 'Our Lady of Częstochowa' }, 'o')],
		'09-07': [proper('vladimir-b', { en: 'Our Lady of Vladimir' }, 'o')],
		'09-17': [
			proper('zygmunt-szczesny-felinski', { en: 'Saint Zygmunt Szczęsny Feliński, bishop' }, 'm')
		],
		'10-30': [
			proper('oleksa-zarytsky', { en: 'Blessed Oleksa Zarytsky, priest and martyr' }, 'm', {
				colour: 'red'
			})
		],
		'11-16': [
			proper('the-gate-of-dawn', { en: 'Our Lady of the Gate of Dawn, Mother of Mercy' }, 'o')
		],
		'11-20': [proper('raphael-kalinowski', { en: 'Saint Raphael Kalinowski, priest' }, 'm')],
		'12-04': [proper('barbara', { en: 'Saint Barbara, virgin and martyr' }, 'o', { colour: 'red' })]
	},
	overrides: {
		andrew: keptAs('s'),
		'clement-i': keptAs('m'),
		'cyril-methodius': keptAs('f'),
		faustina: keptAs('m'),
		george: keptAs('m'),
		nicholas: keptAs('m'),
		'teresa-of-calcutta': keptAs('m')
	},
	moves: {
		andrew: { to: '12-01' },
		george: { to: '05-06' }
	}
};
