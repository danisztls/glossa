/**
 * The Democratic Republic of the Congo — the General Roman Calendar as the
 * CENCO keeps it.
 *
 * THE CALENDAR THAT PROVED THERE ARE FOUR TRANSFERS AND NOT THREE. GCatholic
 * publishes the general calendar in eight variants, `General-A` to `-H`, the
 * eight combinations of Epiphany, the Ascension and Corpus Christi moved to a
 * Sunday — which reads as a statement that those are the transfers a
 * conference makes. The Congo also keeps THE MOST SACRED HEART on the Sunday,
 * in all three oracle years, and the Immaculate Heart does not follow it: she
 * stays on her Saturday, which becomes the day before rather than the day
 * after. Hence `sacredHeartOnSunday` in `../types.ts`.
 *
 * The four solemnities it moves to Sundays are in `movedInYear`, for the
 * reason Brazil's are — the direction is a decision published year by year
 * and no rule fits the evidence.
 */

import type { NationalCalendar } from '../types';
import { keptAs, proper } from './common';

export const CONGO: NationalCalendar = {
	id: 'cd',
	options: {
		epiphanyOnSunday: true,
		ascensionOnSunday: true,
		corpusChristiOnSunday: true,
		sacredHeartOnSunday: true
	},

	propers: {
		'01-15': [
			proper(
				'arnold-janssen',
				{ fr: 'Saint Arnold Janssen, prêtre', en: 'Saint Arnold Janssen, Priest' },
				'o'
			)
		],
		'02-18': [
			proper(
				'bernadette-soubirous',
				{ fr: 'Sainte Bernadette Soubirous, vierge', en: 'Saint Bernadette Soubirous, Virgin' },
				'o'
			)
		],
		'05-10': [
			proper(
				'damien-de-veuster',
				{ fr: 'Saint Damien de Veuster, prêtre', en: 'Saint Damien de Veuster, Priest' },
				'o'
			)
		],
		'05-30': [
			proper(
				'joan-of-arc',
				{ fr: 'Sainte Jeanne d’Arc, vierge', en: 'Saint Joan of Arc, Virgin' },
				'o'
			)
		],
		'06-26': [
			proper(
				'josemaria-escriva',
				{
					fr: 'Saint Josemaria Escrivá de Balaguer, prêtre',
					en: 'Saint Josemaría Escrivá de Balaguer, Priest'
				},
				'm'
			)
		],
		'07-09': [
			proper('our-lady-of-peace', { fr: 'Notre-Dame de Paix', en: 'Our Lady of Peace' }, 'o', {
				marian: true
			})
		],
		// The Congo's own martyrs, and the reason this layer has two proper
		// feasts in red: Bakanja was beaten to death in 1909 for refusing to
		// take off his scapular, Anuarite killed in 1964.
		'08-12': [
			proper(
				'isidore-bakanja',
				{ fr: 'Bienheureux Isidore Bakanja, martyr', en: 'Blessed Isidore Bakanja, Martyr' },
				'f',
				{ colour: 'red' }
			)
		],
		'12-01': [
			proper(
				'anuarite-nengapeta',
				{
					fr: 'Bienheureuse Marie-Clémentine Anuarite Nengapeta, vierge et martyre',
					en: 'Blessed Marie-Clémentine Anuarite Nengapeta, Virgin and Martyr'
				},
				'f',
				{ colour: 'red' }
			)
		]
	},

	overrides: {
		// Charles Lwanga and the Uganda martyrs are a feast across the region.
		'charles-lwanga': keptAs('f', 'red'),
		'francis-xavier': keptAs('f'),
		'therese-of-lisieux': keptAs('f'),
		'our-lady-of-lourdes': keptAs('m'),
		'joseph-the-worker': keptAs('m'),
		'peter-claver': keptAs('m')
	},

	movedInYear: {
		'peter-and-paul': { 2025: '06-30' },
		assumption: { 2025: '08-10', 2026: '08-09' },
		'all-saints': { 2025: '11-03', 2027: '11-07' },
		// Not a Sunday at all: 31 May 2026 is Pentecost, which impedes the
		// Visitation, and only a solemnity is transferred when impeded. The
		// conference keeps the feast on the Monday; nothing in the Norms says
		// so, so it is recorded rather than derived.
		visitation: { 2026: '06-01' }
	}
};
