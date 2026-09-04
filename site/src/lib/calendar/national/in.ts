/**
 * India — the General Roman Calendar as the Conference of Catholic Bishops of
 * India keeps it.
 *
 * SAINT THOMAS IS A SOLEMNITY HERE, and that is the row worth reading. The
 * general calendar gives him a feast on 3 July; India keeps him as the
 * apostle of the country, on the tradition that he preached and died on the
 * Malabar coast. Francis Xavier is a solemnity for the same reason and is a
 * memorial everywhere else. Both are the pattern this layer is made of: not
 * saints India adds, but saints India claims.
 *
 * The propers were approved in English, one of the conference's own working
 * languages, so the English name here is the celebration's own.
 */

import type { NationalCalendar } from '../types';
import { keptAs, proper } from './common';

export const INDIA: NationalCalendar = {
	id: 'in',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },

	propers: {
		'01-14': [proper('devasahayam', { en: 'Saint Devasahayam, Martyr' }, 'o', { colour: 'red' })],
		'01-16': [proper('joseph-vaz', { en: 'Saint Joseph Vaz, Priest' }, 'o')],
		'02-04': [
			proper('john-de-britto', { en: 'Saint John de Britto, Priest and Martyr' }, 'm', {
				colour: 'red'
			})
		],
		'02-07': [
			proper('gonsalo-garcia', { en: 'Saint Gonsalo Garcia, Religious and Martyr' }, 'm', {
				colour: 'red'
			})
		],
		'02-18': [proper('kuriakose-chavara', { en: 'Saint Koriakose Chavara, Priest' }, 'o')],
		'06-08': [proper('mariam-thresia', { en: 'Saint Thresia Chiramel Mankdiyan, Virgin' }, 'o')],
		'07-28': [proper('alphonsa', { en: 'Saint Alphonsa Muttathu Padathu, Virgin' }, 'm')],
		'08-30': [proper('euphrasia', { en: 'Saint Euphrasia, Virgin' }, 'o')],
		'10-16': [
			proper('augustine-thevarparambil', { en: 'Blessed Augustine Thevarparambil, Priest' }, 'o')
		]
	},

	overrides: {
		'thomas-apostle': keptAs('s', 'red'),
		'francis-xavier': keptAs('s'),
		'therese-of-lisieux': keptAs('f'),
		// Displaced by Timothy and Titus, whom India keeps on the 27th.
		'angela-merici': null
	},

	observances: [{ at: '01-26', observance: { id: 'republic-day', names: { en: 'Republic Day' } } }],

	moves: {
		'timothy-titus': { to: '01-27' }
	}
};
