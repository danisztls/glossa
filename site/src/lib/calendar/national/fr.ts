/**
 * France — the General Roman Calendar as the Conférence des évêques de France
 * keeps it.
 *
 * A small layer: nine saints of France, and five European patrons raised to
 * feasts exactly as Italy raises them (see `it.ts` — the six patrons of
 * Europe are a fact about the continent, so several of these calendars carry
 * the same five rows). France does not raise Francis of Assisi or Catherine
 * of Siena, who are Italy's patrons rather than Europe's.
 */

import type { NationalCalendar } from '../types';
import { keptAs, proper } from './common';

export const FRANCE: NationalCalendar = {
	id: 'fr',
	// Epiphany on the Sunday; the Ascension keeps its Thursday, which is a
	// public holiday, and Corpus Christi its own Sunday.
	options: { epiphanyOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'01-03': [
			proper('genevieve', { fr: 'Sainte Geneviève, vierge', en: 'Saint Genevieve, Virgin' }, 'o')
		],
		'01-15': [
			proper(
				'remigius',
				{ fr: 'Saint Remi de Reims, évêque', en: 'Saint Remigius of Reims, Bishop' },
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
		'03-15': [
			proper(
				'louise-de-marillac',
				{ fr: 'Sainte Louise de Marillac, religieuse', en: 'Saint Louise de Marillac, Religious' },
				'o'
			)
		],
		'05-19': [
			proper(
				'ivo-of-kermartin',
				{ fr: 'Saint Yves de Kermartin, prêtre', en: 'Saint Ivo of Kermartin, Priest' },
				'o'
			)
		],
		// A secondary patroness of France.
		'05-30': [
			proper(
				'joan-of-arc',
				{ fr: 'Sainte Jeanne d’Arc, vierge', en: 'Saint Joan of Arc, Virgin' },
				'm'
			)
		],
		'06-02': [
			proper(
				'pothinus-blandina',
				{
					fr: 'Saint Pothin, évêque, Sainte Blandine, vierge, et leurs compagnons, martyrs',
					en: 'Saints Pothinus, Bishop, Blandina, Virgin, and Companions, Martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'06-04': [proper('clotilde', { fr: 'Sainte Clotilde', en: 'Saint Clotilda' }, 'o')],
		'08-26': [
			proper(
				'caesarius-of-arles',
				{ fr: 'Saint Césaire d’Arles, évêque', en: 'Saint Caesarius of Arles, Bishop' },
				'o'
			)
		],
		'08-30': [
			proper(
				'jeanne-jugan',
				{ fr: 'Sainte Jeanne Jugan, vierge', en: 'Saint Jeanne Jugan, Virgin' },
				'o',
				{ since: 2026 }
			)
		],
		'09-19': [
			proper(
				'our-lady-of-la-salette',
				{ fr: 'Notre-Dame de La Salette', en: 'Our Lady of La Salette' },
				'o',
				{ marian: true }
			)
		]
	},

	/** The five patrons of Europe France raises — Benedict, Cyril and
	 *  Methodius, Bridget, Catherine of Siena and Teresa Benedicta. */
	overrides: {
		benedict: keptAs('f'),
		'cyril-methodius': keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'teresa-benedicta': keptAs('f', 'red')
	}
};
