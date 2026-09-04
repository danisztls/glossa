/**
 * Japan — the General Roman Calendar as Japan’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Japan actually does
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
 * A proper carries the name its conference approved, in ja, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const JAPAN: NationalCalendar = {
	id: 'jp',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'02-03': [
			proper(
				'iustus-takayama-ukon',
				{ ja: '福者ユスト高山右近殉教者', en: 'Blessed Iustus Takayama Ukon, martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'02-05': [
			proper('26-martyrs-of-japan', { ja: '日本二十六聖人', en: '26 Martyrs of Japan' }, 'f', {
				colour: 'red'
			})
		],
		'03-17': [
			proper(
				'the-discovery-of-the-christians-of-japan',
				{ ja: '日本の信徒発見の聖母', en: 'Our Lady of the Discovery of the Christians of Japan' },
				'f'
			)
		],
		'07-01': [
			proper(
				'peter-kibe-and-187-companions',
				{
					ja: '福者ペトロ岐部司祭と187殉教者',
					en: 'Blessed Peter Kibe and 187 companions, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'09-10': [
			proper(
				'205-blessed-martyrs-of-japan',
				{ ja: '日本205福者殉教者', en: 'The 205 Blessed Martyrs of Japan' },
				'm',
				{ colour: 'red' }
			),
			proper(
				'blesseds-sebastianus-kimura-and-204-companions',
				{
					ja: '福者セバスチャン木村司祭と204殉教者',
					en: 'Blesseds Sebastianus Kimura and 204 companions, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'09-28': [
			proper(
				'thomas-rokuzayemon',
				{
					ja: '聖トマス西と15殉教者',
					en: 'Saint Thomas Rokuzayemon, priest, and companions, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		]
	},
	overrides: {
		'francis-xavier': keptAs('f'),
		'paul-miki': null
	},
	moves: {
		agatha: { to: '02-06' }
	}
};
