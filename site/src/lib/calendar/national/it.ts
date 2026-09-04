/**
 * Italy — the General Roman Calendar as the Conferenza Episcopale Italiana
 * keeps it.
 *
 * THE SMALLEST LAYER HERE, AND IT ADDS NO SAINT AT ALL. Every one of its
 * seven rows raises a celebration the general calendar already has, and six
 * of the seven are patrons: Catherine of Siena and Francis of Assisi are
 * patrons of Italy, and Benedict, Cyril and Methodius, Bridget of Sweden and
 * Teresa Benedicta of the Cross are the six patrons of Europe (Benedict since
 * 1964, the other five added by John Paul II). Nicholas of Bari is the one
 * that is Italy's own, his relics having been at Bari since 1087.
 *
 * That is worth reading before assuming a country's file is a list of its own
 * saints. Italy's propers are in the calendars of its dioceses, not in the
 * national one, and a diocesan calendar is a layer this project does not
 * carry.
 */

import type { NationalCalendar } from '../types';
import { keptAs } from './common';

export const ITALY: NationalCalendar = {
	id: 'it',
	// Epiphany keeps 6 January — a public holiday in Italy — and the Ascension
	// its Thursday; only Corpus Christi moves to the Sunday.
	options: { corpusChristiOnSunday: true },

	propers: {},

	overrides: {
		'catherine-of-siena': keptAs('f'),
		'francis-of-assisi': keptAs('f'),
		benedict: keptAs('f'),
		'cyril-methodius': keptAs('f'),
		bridget: keptAs('f'),
		'teresa-benedicta': keptAs('f', 'red'),
		nicholas: keptAs('m')
	}
};
