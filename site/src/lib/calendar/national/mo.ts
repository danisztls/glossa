/**
 * Macau — the General Roman Calendar as Macau’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Macau actually does
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
 * A proper carries the name its conference approved, in zt, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Our Lady of China: kept on 2025 2025-01-29, 2026 2026-02-17, 2027 2027-02-06 -- no fixed date and no fixed offset from Easter
 */

export const MACAU: NationalCalendar = {
	id: 'mo',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-30': [
			proper(
				'gabriele-allegra',
				{ zht: '真福雷永明（司鐸）', en: 'Blessed Gabriele Allegra, priest' },
				'm'
			)
		],
		'02-04': [
			proper(
				'john-de-britto',
				{ zht: '聖庇道（司鐸、殉道）', en: 'Saint John de Britto, priest and martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'02-07': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{ zht: '紀念聖母誕辰主教座堂祝聖', en: 'Anniversary of the Dedication of the Cathedral' },
				'f'
			)
		],
		'02-25': [
			proper(
				'luigi-versiglia',
				{
					zht: '聖雷鳴道（主教）及聖高惠黎（司鐸）（殉道）',
					en: 'Saint Luigi Versiglia, bishop, and Saint Callisto Caravario, priest, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'05-24': [
			proper('help-of-christians', { zht: '聖母進教之佑', en: 'Our Lady Help of Christians' }, 'm')
		],
		'06-26': [
			proper(
				'josemaria-escriva-de-balaguer',
				{ zht: '聖施禮華（司鐸）', en: 'Saint Josemaría Escrivá de Balaguer, priest' },
				'm'
			)
		],
		'07-09': [
			proper(
				'holy-martyrs-and-blesseds-and-saints-of-china',
				{ zht: '中華諸聖及真福（殉道）', en: 'The Holy Martyrs and Blesseds and Saints of China' },
				'f',
				{ colour: 'red' }
			)
		]
	},
	movable: [
		{
			at: { fromEaster: -43 },
			celebration: proper(
				'five-wounds-of-the-lord',
				{ zht: '耶穌五傷', en: 'The Five Wounds of the Lord' },
				'f',
				{ colour: 'red' }
			)
		}
	],
	overrides: {
		'catherine-of-siena': keptAs('f'),
		'elizabeth-of-portugal': keptAs('m'),
		faustina: keptAs('m'),
		'francis-xavier': keptAs('f'),
		'john-paul-ii': keptAs('m'),
		'our-lady-of-fatima': keptAs('m'),
		'teresa-of-calcutta': keptAs('m')
	}
};
