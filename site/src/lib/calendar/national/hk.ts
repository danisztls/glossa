/**
 * Hong Kong — the General Roman Calendar as Hong Kong’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Hong Kong actually does
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

export const HONG_KONG: NationalCalendar = {
	id: 'hk',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-14': [
			proper(
				'odoric-de-pordenone',
				{ zht: '真福和德理（司鐸）', en: 'Blessed Odoric de Pordenone, priest' },
				'o'
			)
		],
		'01-15': [
			proper(
				'francisco-fernandez-de-capillas',
				{
					zht: '聖劉方濟（司鐸、殉道）',
					en: 'Saint Francisco Fernandez de Capillas, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-23': [
			proper(
				'lawrence-bai-xiaoman',
				{ zht: '聖白小滿（殉道）', en: 'Saint Lawrence Bai Xiaoman, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'01-27': [
			proper(
				'augustine-zhao-rong',
				{ zht: '聖趙榮（司鐸、殉道）', en: 'Saint Augustine Zhao Rong, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'01-29': [
			proper(
				'josef-freinademetz',
				{ zht: '聖福若瑟（司鐸）', en: 'Saint Josef Freinademetz, priest' },
				'm'
			)
		],
		'01-30': [
			proper(
				'gabriele-allegra',
				{ zht: '真福雷永明（司鐸）', en: 'Blessed Gabriele Allegra, priest' },
				'm'
			)
		],
		'02-13': [
			proper(
				'giovanni-da-triora',
				{ zht: '聖藍月旺（司鐸、殉道）', en: 'Saint Giovanni da Triora, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'02-18': [
			proper(
				'francesco-regis-clet',
				{ zht: '聖劉格來（司鐸、殉道）', en: 'Saint Francesco Regis Clet, priest and martyr' },
				'o',
				{ colour: 'red' }
			),
			proper(
				'martin-wu-xuesheng',
				{
					zht: '聖吳學聖、聖文乃耳及同伴（殉道）',
					en: 'Saint Martin Wu Xuesheng, Saint Jean-Pierre Néel and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'02-19': [
			proper(
				'lucy-yi-zhenmei',
				{ zht: '聖易貞美（貞女、殉道）', en: 'Saint Lucy Yi Zhenmei, virgin and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'02-21': [
			proper(
				'paul-liu-hanzuo',
				{ zht: '聖劉翰佐（司鐸、殉道）', en: 'Saint Paul Liu Hanzuo, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'02-25': [
			proper(
				'luigi-versiglia',
				{
					zht: '聖雷鳴道（主教）及聖高惠黎（司鐸）（殉道）',
					en: 'Saint Luigi Versiglia, bishop, and Saint Callisto Caravario, priest, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'03-01': [
			proper(
				'agnes-cao-guiying',
				{ zht: '聖曹桂英（殉道）', en: 'Saint Agnes Cao Guiying, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'03-12': [
			proper(
				'joseph-zhang-dapeng',
				{ zht: '聖張大鵬（殉道）', en: 'Saint Joseph Zhang Dapeng, martyr' },
				'o',
				{ colour: 'violet' }
			)
		],
		'04-08': [
			proper(
				'maria-assunta-pallotta',
				{ zht: '真福亞松大（修女）', en: 'Blessed Maria Assunta Pallotta, religious' },
				'o'
			)
		],
		'05-04': [
			proper(
				'john-martin-moye',
				{ zht: '真福梅慕雅（司鐸）', en: 'Blessed John-Martin Moye, priest' },
				'o'
			)
		],
		'05-17': [
			proper(
				'peter-liu-wenyuan',
				{ zht: '聖劉文元（殉道）', en: 'Saint Peter Liu Wenyuan, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'05-24': [
			proper('help-of-christians', { zht: '聖母進教之佑', en: 'Our Lady Help of Christians' }, 'm')
		],
		'05-27': [
			proper(
				'pedro-sans-y-jorda',
				{ zht: '聖桑實（主教、殉道）', en: 'Saint Pedro Sans y Jordá, bishop and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'05-29': [
			proper(
				'joachim-kai-zhihao',
				{ zht: '聖郝開枝（殉道）', en: 'Saint Joachim Kai Zhihao, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'06-23': [
			proper(
				'joseph-yuan-zaide',
				{ zht: '聖袁在德（司鐸、殉道）', en: 'Saint Joseph Yuan Zaide, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'07-09': [
			proper(
				'holy-martyrs-and-blesseds-and-saints-of-china',
				{ zht: '中華諸聖及真福（殉道）', en: 'The Holy Martyrs and Blesseds and Saints of China' },
				'f',
				{ colour: 'red' }
			)
		],
		'07-20': [
			proper(
				'leon-ignace-mangin',
				{
					zht: '聖任德芬（司鐸）及同伴（殉道）',
					en: 'Saint Léon-Ignace Mangin, priest, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-21': [
			proper(
				'alberico-crescitelli',
				{ zht: '聖郭西德（司鐸、殉道）', en: 'Saint Alberico Crescitelli, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'07-28': [
			proper(
				'paul-chen-changpin-and-companions',
				{ zht: '聖陳昌品及同伴（殉道）', en: 'Saint Paul Chen Changpin and companions, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'08-12': [
			proper(
				'maurice-tornay',
				{ zht: '真福杜仲賢（司鐸、殉道）', en: 'Blessed Maurice Tornay, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'09-11': [
			proper(
				'jean-gabriel-perboyre',
				{ zht: '聖董文學（司鐸、殉道）', en: 'Saint Jean-Gabriel Perboyre, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'10-27': [
			proper(
				'francisco-diaz-del-rincon',
				{
					zht: '聖施方濟（司鐸）及同伴（殉道）',
					en: 'Saint Francisco Díaz del Rincón, priest, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'11-07': [
			proper(
				'peter-wu-guosheng',
				{ zht: '聖吳國盛（殉道）', en: 'Saint Peter Wu Guosheng, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'11-29': [
			proper(
				'thaddeus-liu-ruiting',
				{
					zht: '聖劉瑞廷（司鐸）及同伴（殉道）',
					en: 'Saint Thaddeus Liu Ruiting, priest, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'12-09': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{ zht: '紀念聖母無原罪主教座堂祝聖', en: 'Anniversary of the Dedication of the Cathedral' },
				'f'
			)
		]
	},
	movable: [
		{
			at: { month: 5, weekday: 6, nth: 2 },
			celebration: proper('china', { zht: '中華聖母', en: 'Our Lady of China' }, 'm')
		}
	],
	observances: [
		{
			at: { years: { 2025: '01-29', 2026: '02-17', 2027: '02-06' } },
			observance: {
				id: 'chinese-new-year',
				names: { zht: '農曆新春', en: 'Chinese New Year' },
				colour: 'red'
			}
		}
	],
	overrides: {
		'francis-xavier': keptAs('f'),
		'therese-of-lisieux': keptAs('f')
	}
};
