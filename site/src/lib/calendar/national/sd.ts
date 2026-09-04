/**
 * Sudan — the General Roman Calendar as Sudan’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Sudan actually does
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
 * GCatholic publishes this calendar in English only, so a proper carries its English name and nothing else. `celebrationName` falls back to it for a reader of any other language, which is the name the celebration actually has.
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const SUDAN: NationalCalendar = {
	id: 'sd',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-09': [proper('adrian-of-canterbury', { en: 'Saint Adrian of Canterbury, abbot' }, 'o')],
		'01-20': [
			proper('cyprian-michael-tansi', { en: 'Blessed Cyprian Michael Tansi, priest' }, 'o')
		],
		'02-26': [
			proper('alexander-of-alexandria', { en: 'Saint Alexander of Alexandria, bishop' }, 'o')
		],
		'04-04': [
			proper('benedict-the-moor', { en: 'Saint Benedict the Moor, religious' }, 'o', {
				colour: 'violet'
			})
		],
		'04-12': [proper('zeno-of-verona', { en: 'Saint Zeno of Verona, bishop' }, 'o')],
		'04-20': [proper('marcellinus-of-embrun', { en: 'Saint Marcellinus of Embrun, bishop' }, 'o')],
		'04-30': [proper('mother-of-africa', { en: 'Our Lady Mother of Africa' }, 'f')],
		'05-24': [proper('help-of-christians', { en: 'Our Lady Help of Christians' }, 'm')],
		'06-12': [proper('onuphrius', { en: 'Saint Onuphrius, abbot' }, 'o')],
		'07-28': [
			proper('victor-i', { en: 'Saint Victor I, pope and martyr' }, 'o', { colour: 'red' })
		],
		'07-30': [proper('justin-de-jacobis', { en: 'Saint Justin de Jacobis, bishop' }, 'o')],
		'08-12': [
			proper('isidore-bakanja', { en: 'Blessed Isidore Bakanja, martyr' }, 'o', { colour: 'red' })
		],
		'08-18': [proper('victoria-rasoamanarivo', { en: 'Blessed Victoria Rasoamanarivo' }, 'o')],
		'09-22': [
			proper(
				'maurice-of-agaune-and-companions',
				{ en: 'Saint Maurice of Agaune and companions, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'10-10': [proper('daniele-comboni', { en: 'Saint Daniele Comboni, bishop' }, 's')],
		'10-20': [
			proper(
				'daudi-okelo-and-blessed-jildo-irwa',
				{ en: 'Blessed Daudi Okelo and Blessed Jildo Irwa, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'11-06': [proper('all-saints-of-africa', { en: 'All Saints of Africa' }, 'm')],
		'12-01': [
			proper(
				'marie-clementine-anuarite-nengapeta',
				{ en: 'Blessed Marie-Clémentine Anuarite Nengapeta, virgin and martyr' },
				'o',
				{ colour: 'red' }
			)
		]
	},
	overrides: {
		'josephine-bakhita': keptAs('s')
	},
	moves: {
		'josephine-bakhita': { to: '02-08' },
		'pius-v': { to: '04-28' }
	}
};
