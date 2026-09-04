/**
 * The Philippines — the General Roman Calendar as the Catholic Bishops'
 * Conference of the Philippines keeps it.
 *
 * Two things here are unusual among these layers. The Santo Niño is kept on
 * the THIRD SUNDAY OF JANUARY and so falls on no date — the only proper in
 * any of them anchored to a weekday of a month rather than to Easter. And the
 * Immaculate Conception is kept in BLUE, which of the sixteen calendars
 * fetched only Spain does besides (see `Colour` in `../types.ts`).
 *
 * The propers were approved in English, which is one of the conference's own
 * languages, so unlike every other non-Anglophone layer here the English name
 * is the celebration's own rather than a rendering of it.
 */

import type { NationalCalendar } from '../types';
import { BLUE_IMMACULATE_CONCEPTION, THURSDAY_AFTER_PENTECOST, keptAs, proper } from './common';

export const PHILIPPINES: NationalCalendar = {
	id: 'ph',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'01-09': [
			proper('senor-jesus-nazareno', { en: 'Our Lord Jesus Christ, Señor Jesus Nazareno' }, 'F', {
				colour: 'red'
			})
		],
		// The Philippines keeps its own protomartyr with Paul Miki and the
		// companions, so the general memorial of 6 February is replaced rather
		// than joined — see `overrides`.
		'02-06': [
			proper(
				'pedro-bautista-paul-miki',
				{ en: 'Saints Pedro Bautista, Paul Miki and Companions, Martyrs' },
				'm',
				{ colour: 'red' }
			)
		],
		'05-15': [proper('isidore-the-farmer', { en: 'Saint Isidore the Farmer' }, 'm')],
		'05-25': [proper('eugene-de-mazenod', { en: 'Saint Eugène de Mazenod, Bishop' }, 'o')],
		'08-16': [proper('roch', { en: 'Saint Roch' }, 'o')],
		'08-19': [proper('ezequiel-moreno', { en: 'Saint Ezequiel Moreno Díaz, Bishop' }, 'o')],
		'10-21': [
			proper('pedro-calungsod', { en: 'Saint Pedro Calungsod, Martyr' }, 'f', {
				colour: 'red'
			})
		]
	},

	movable: [
		{
			// The third Sunday of January. A feast of the Lord in fact as well
			// as in rank — the Santo Niño is the image of the Child Jesus
			// given at the first baptism in the islands in 1521.
			at: { month: 1, weekday: 0, nth: 3 },
			celebration: proper('santo-nino', { en: 'Santo Niño' }, 'F')
		},
		{
			at: THURSDAY_AFTER_PENTECOST,
			celebration: proper(
				'eternal-high-priest',
				{ en: 'Our Lord Jesus Christ, the Eternal High Priest' },
				'F'
			)
		}
	],

	overrides: {
		'lawrence-ruiz': keptAs('f', 'red'),
		'our-lady-of-guadalupe': keptAs('m'),
		'immaculate-conception': BLUE_IMMACULATE_CONCEPTION,
		// Replaced by the composite memorial of 6 February above.
		'paul-miki': null,
		// Not kept in the Philippines at all.
		wenceslaus: null
	}
};
