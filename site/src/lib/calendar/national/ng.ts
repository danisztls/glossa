/**
 * Nigeria — the General Roman Calendar as the Catholic Bishops' Conference of
 * Nigeria keeps it.
 *
 * The one layer here whose propers are mostly NOT its own country's saints.
 * Adrian of Canterbury, Zeno of Verona, Onuphrius, Maurice of Agaune, Victor
 * I, Justin de Jacobis, Isidore Bakanja, Victoria Rasoamanarivo, Daudi Okelo
 * and Jildo Irwa, Anuarite Nengapeta — an African calendar rather than a
 * Nigerian one, closing with All Saints of Africa on 6 November. Nigeria's own
 * are the two that outrank the rest: Blessed Cyprian Michael Tansi, the
 * Trappist of Onitsha, and Our Lady Queen of Nigeria.
 *
 * Saint Patrick is a feast here, which no other calendar in this directory
 * does, and it is not a puzzle: the Irish missions founded the Church in
 * eastern Nigeria.
 */

import type { NationalCalendar } from '../types';
import { keptAs, proper } from './common';

export const NIGERIA: NationalCalendar = {
	id: 'ng',
	options: { epiphanyOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'01-09': [proper('adrian-of-canterbury', { en: 'Saint Adrian of Canterbury, Abbot' }, 'o')],
		'01-20': [
			proper('cyprian-michael-tansi', { en: 'Blessed Cyprian Michael Tansi, Priest' }, 'f')
		],
		'02-26': [
			proper('alexander-of-alexandria', { en: 'Saint Alexander of Alexandria, Bishop' }, 'o')
		],
		'04-04': [proper('benedict-the-moor', { en: 'Saint Benedict the Moor, Religious' }, 'o')],
		'04-12': [proper('zeno-of-verona', { en: 'Saint Zeno of Verona, Bishop' }, 'o')],
		'04-20': [proper('marcellinus-of-embrun', { en: 'Saint Marcellinus of Embrun, Bishop' }, 'o')],
		'04-30': [
			proper('our-lady-mother-of-africa', { en: 'Our Lady, Mother of Africa' }, 'f', {
				marian: true
			})
		],
		'05-24': [
			proper('our-lady-help-of-christians', { en: 'Our Lady Help of Christians' }, 'm', {
				marian: true
			})
		],
		'06-12': [proper('onuphrius', { en: 'Saint Onuphrius, Abbot' }, 'o')],
		'07-28': [
			proper('victor-i', { en: 'Saint Victor I, Pope and Martyr' }, 'o', { colour: 'red' })
		],
		'07-30': [proper('justin-de-jacobis', { en: 'Saint Justin de Jacobis, Bishop' }, 'o')],
		'08-12': [
			proper('isidore-bakanja', { en: 'Blessed Isidore Bakanja, Martyr' }, 'o', {
				colour: 'red'
			})
		],
		'08-18': [proper('victoria-rasoamanarivo', { en: 'Blessed Victoria Rasoamanarivo' }, 'o')],
		'09-22': [
			proper('maurice-of-agaune', { en: 'Saint Maurice of Agaune and Companions, Martyrs' }, 'o', {
				colour: 'red'
			})
		],
		'10-01': [
			proper('our-lady-queen-of-nigeria', { en: 'Our Lady, Queen of Nigeria' }, 's', {
				marian: true
			})
		],
		'10-10': [proper('daniele-comboni', { en: 'Saint Daniele Comboni, Bishop' }, 'm')],
		'10-20': [
			proper(
				'daudi-okelo-jildo-irwa',
				{ en: 'Blessed Daudi Okelo and Blessed Jildo Irwa, Martyrs' },
				'o',
				{
					colour: 'red'
				}
			)
		],
		'11-06': [proper('all-saints-of-africa', { en: 'All Saints of Africa' }, 'm')],
		'12-01': [
			proper(
				'anuarite-nengapeta',
				{ en: 'Blessed Marie-Clémentine Anuarite Nengapeta, Virgin and Martyr' },
				'o',
				{ colour: 'red' }
			)
		]
	},

	overrides: {
		patrick: keptAs('f')
	},

	moves: {
		fabian: { to: '01-19' },
		sebastian: { to: '01-19' },
		'pius-v': { to: '04-28' },
		'therese-of-lisieux': { to: '10-03' }
	}
};
