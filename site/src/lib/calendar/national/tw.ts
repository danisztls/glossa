/**
 * Taiwan — the General Roman Calendar as Taiwan’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Taiwan actually does
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
 *   - Saint Augustine Zhao Rong, priest, and All Martyr Saints of China: kept on 2025 2025-07-06, 2026 2026-07-09, 2027 2027-07-09 -- no fixed date and no fixed offset from Easter
 */

export const TAIWAN: NationalCalendar = {
	id: 'tw',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-14': [
			proper(
				'odoric-de-pordenone',
				{ zht: '真福和德理司鐸', en: 'Blessed Odoric de Pordenone, priest' },
				'o'
			)
		],
		'01-15': [
			proper(
				'francisco-fernandez-de-capillas',
				{
					zht: '聖劉方濟（格來）司鐸殉道',
					en: 'Saint Francisco Fernandez de Capillas, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-23': [
			proper(
				'lawrence-bai-xiaoman',
				{ zht: '聖白小滿（樂倫）殉道', en: 'Saint Lawrence Bai Xiaoman, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'01-27': [
			proper(
				'augustine-zhao-rong',
				{ zht: '聖趙榮（思定）司鐸殉道', en: 'Saint Augustine Zhao Rong, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'01-29': [
			proper(
				'josef-freinademetz',
				{ zht: '聖福若瑟司鐸', en: 'Saint Josef Freinademetz, priest' },
				'o'
			),
			proper(
				'lawrence-wang-bing-and-companions',
				{ zht: '聖王炳（樂倫）等三位殉道', en: 'Saint Lawrence Wang Bing and companions, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'01-30': [
			proper(
				'gabriele-allegra',
				{ zht: '真福雷永明司鐸', en: 'Blessed Gabriele Allegra, priest' },
				'm'
			)
		],
		'02-13': [
			proper(
				'giovanni-da-triora',
				{ zht: '聖藍月旺司鐸殉道', en: 'Saint Giovanni da Triora, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'02-18': [
			proper(
				'francesco-regis-clet',
				{ zht: '聖劉方濟（格來）司鐸殉道', en: 'Saint Francesco Regis Clet, priest and martyr' },
				'o',
				{ colour: 'red' }
			),
			proper(
				'martin-wu-xuesheng-and-companions',
				{
					zht: '聖吳學聖（瑪定）等三人殉道',
					en: 'Saint Martin Wu Xuesheng and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'02-19': [
			proper(
				'lucy-yi-zhenmei',
				{ zht: '聖易貞美（璐琦）貞女殉道', en: 'Saint Lucy Yi Zhenmei, virgin and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'02-21': [
			proper(
				'paul-liu-hanzuo',
				{ zht: '聖劉翰佐（保祿）司鐸殉道', en: 'Saint Paul Liu Hanzuo, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'02-25': [
			proper(
				'luigi-versiglia',
				{
					zht: '聖雷鳴道主教及聖高惠黎司鐸殉道',
					en: 'Saint Luigi Versiglia, bishop, and Saint Callisto Caravario, priest, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'03-01': [
			proper(
				'agnes-cao-guiying',
				{ zht: '聖曹桂英（雅妮）殉道', en: 'Saint Agnes Cao Guiying, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'03-12': [
			proper(
				'joseph-zhang-dapeng-and-companions',
				{ zht: '聖張大鵬（若瑟）等殉道', en: 'Saint Joseph Zhang Dapeng and companions, martyrs' },
				'o',
				{ colour: 'violet' }
			)
		],
		'04-08': [
			proper(
				'maria-assunta-pallotta',
				{ zht: '真福雅頌修女', en: 'Blessed Maria Assunta Pallotta, religious' },
				'o'
			)
		],
		'04-28': [
			proper('gianna-beretta-molla', { zht: '聖吉安娜', en: 'Saint Gianna Beretta Molla' }, 'o')
		],
		'05-04': [
			proper(
				'john-martin-moye',
				{ zht: '真福慕雅（瑪定）司鐸', en: 'Blessed John-Martin Moye, priest' },
				'o'
			)
		],
		'05-17': [
			proper(
				'peter-liu-wenyuan',
				{ zht: '聖劉文元（伯鐸）殉道', en: 'Saint Peter Liu Wenyuan, martyr' },
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
				{ zht: '聖桑實（伯鐸）主教殉道', en: 'Saint Pedro Sans y Jordá, bishop and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'05-29': [
			proper(
				'joachim-kai-zhihao',
				{ zht: '聖何開枝（雅敬）殉道', en: 'Saint Joachim Kai Zhihao, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'06-20': [
			proper(
				'antonino-fantosati',
				{
					zht: '聖范懷德、聖艾世傑、聖富格辣三位主教及同伴殉道',
					en: 'Saint Antonino Fantosati, Saint Gregorio Grassi, Saint Francesco Fogolla, bishops, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'06-23': [
			proper(
				'joseph-yuan-zaide',
				{ zht: '聖袁在德（若瑟）司鐸殉道', en: 'Saint Joseph Yuan Zaide, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'07-08': [
			proper(
				'seven-sisters-of-franciscan-missionaries-of-mary',
				{
					zht: '瑪利亞方濟傳教女修會七位修女殉道',
					en: 'Seven Sisters of Franciscan Missionaries of Mary, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-20': [
			proper(
				'leon-ignace-mangin',
				{ zht: '聖波霖主教殉道', en: 'Saint Léon-Ignace Mangin, priest, and companions, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'07-21': [
			proper(
				'alberico-crescitelli',
				{ zht: '聖郭希德（博理）司鐸殉道', en: 'Saint Alberico Crescitelli, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'07-28': [
			proper(
				'paul-chen-changpin-and-companions',
				{
					zht: '聖陳昌品（保祿）修生等殉道',
					en: 'Saint Paul Chen Changpin and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'08-12': [
			proper(
				'maurice-tornay',
				{ zht: '真福杜仲賢司鐸殉道', en: 'Blessed Maurice Tornay, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'09-11': [
			proper(
				'jean-gabriel-perboyre',
				{ zht: '聖董文學（若望）司鐸殉道', en: 'Saint Jean-Gabriel Perboyre, priest and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'10-27': [
			proper(
				'francisco-diaz-del-rincon',
				{
					zht: '聖施方濟司鐸及同伴殉道',
					en: 'Saint Francisco Díaz del Rincón, priest, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'11-07': [
			proper(
				'peter-wu-guosheng',
				{ zht: '聖吳國盛（伯鐸）殉道', en: 'Saint Peter Wu Guosheng, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'11-29': [
			proper(
				'thaddeus-liu-ruiting',
				{
					zht: '聖劉瑞廷（達德）司鐸及同伴殉道',
					en: 'Saint Thaddeus Liu Ruiting, priest, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		]
	},
	movable: [
		{
			at: { month: 5, weekday: 6, nth: 2 },
			celebration: proper('china', { zht: '中華聖母', en: 'Our Lady of China' }, 'm')
		},
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{
					zht: '我們的主耶穌基督——永恆的大司祭',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	observances: [
		{
			at: { years: { 2025: '01-29', 2026: '02-17', 2027: '02-06' } },
			observance: {
				id: 'chinese-new-year',
				names: { zht: '春節', en: 'Chinese New Year' },
				colour: 'red'
			}
		},
		{
			at: '02-12',
			observance: { id: 'day-of-petition', names: { zht: '祈福日', en: 'Day of Petition' } }
		},
		{
			at: { years: { 2025: '10-06', 2026: '09-25', 2027: '09-15' } },
			observance: { id: 'thanksgiving-day', names: { zht: '感恩日', en: 'Thanksgiving Day' } }
		}
	],
	overrides: {
		'augustine-zhao-rong': null,
		'francis-xavier': keptAs('f'),
		'therese-of-lisieux': keptAs('f')
	},
	moves: {
		assumption: { to: '08-17' }
	}
};
