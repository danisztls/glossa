/**
 * São Tomé and Príncipe — the General Roman Calendar as São Tomé and Príncipe’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what São Tomé and Príncipe actually does
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
 * A proper carries the name its conference approved, in pt, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Saint Jerome Emiliani: absent in 2025, 2027 only -- not written; three years cannot say which it is
 */

export const SAO_TOME_PRINCIPE: NationalCalendar = {
	id: 'st',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-15': [proper('amarus', { pt: 'Santo Amaro, abade', en: 'Saint Amarus, abbot' }, 'f')],
		'01-27': [
			proper(
				'enrique-de-osso-y-cervello',
				{
					pt: 'Santo Henrique de Ossó, presbítero',
					en: 'Saint Enrique de Ossó y Cervelló, priest'
				},
				'o'
			)
		],
		'02-04': [
			proper(
				'john-de-britto',
				{
					pt: 'São João de Brito, presbítero e mártir',
					en: 'Saint John de Britto, priest and martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'02-07': [
			proper(
				'five-wounds-of-the-lord',
				{ pt: 'Cinco Chagas do Senhor', en: 'The Five Wounds of the Lord' },
				'f',
				{ colour: 'red' }
			)
		],
		'02-18': [
			proper(
				'theotonius-of-coimbra',
				{ pt: 'São Teotónio, presbítero', en: 'Saint Theotonius of Coimbra, priest' },
				'o'
			)
		],
		'02-20': [
			proper(
				'francisco-marto-and-saint-jacinta-marto',
				{
					pt: 'Santos Francisco Marto e Jacinta Marto',
					en: 'Saint Francisco Marto and Saint Jacinta Marto'
				},
				'm'
			)
		],
		'06-10': [
			proper(
				'holy-guardian-angel-of-portugal',
				{ pt: 'Santo Anjo da Guarda de Portugal', en: 'The Holy Guardian Angel of Portugal' },
				'm'
			)
		],
		'07-18': [
			proper(
				'bartholomew-of-the-martyrs',
				{
					pt: 'São Bartolomeu dos Mártires, bispo',
					en: 'Saint Bartholomew of the Martyrs, bishop'
				},
				'm'
			)
		],
		'08-05': [
			proper(
				'mother-of-africa',
				{ pt: 'Nossa Senhora de África', en: 'Our Lady Mother of Africa' },
				'f'
			)
		],
		'09-22': [
			proper(
				'good-dispatch',
				{ pt: 'Nossa Senhora de Bom Despacho', en: 'Our Lady of Good Dispatch' },
				'f'
			)
		],
		'09-24': [
			proper(
				'guadalupe-in-extremadura',
				{
					pt: 'Nossa Senhora de Guadalupe de Extremadura',
					en: 'Our Lady of Guadalupe in Extremadura'
				},
				'f'
			)
		],
		'11-03': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{
					pt: 'Aniversário da Dedicação da Igreja Catedral',
					en: 'Anniversary of the Dedication of the Cathedral'
				},
				'f'
			)
		],
		'11-06': [
			proper(
				'nuno-de-santa-maria',
				{ pt: 'São Nuno de Santa Maria, religioso', en: 'Saint Nuno de Santa Maria, religious' },
				'o'
			)
		],
		'12-01': [
			proper(
				'maria-clara-of-the-child-jesus',
				{
					pt: 'Beata Maria Clara do Menino Jesus, virgem',
					en: 'Blessed Maria Clara of the Child Jesus, virgin'
				},
				'o'
			)
		]
	},
	overrides: {
		'anthony-of-padua': keptAs('f'),
		'elizabeth-of-portugal': keptAs('m'),
		'francis-xavier': keptAs('f'),
		'john-xxiii': keptAs('m'),
		'josephine-bakhita': keptAs('m'),
		'our-lady-of-fatima': keptAs('f'),
		'peter-claver': keptAs('f'),
		'teresa-benedicta': keptAs('m'),
		'therese-of-lisieux': keptAs('f'),
		'thomas-apostle': keptAs('s')
	},
	moves: {
		'anthony-of-padua': { to: '06-13' }
	},
	movedInYear: {
		'thomas-apostle': { 2025: '12-22', 2026: '12-21', 2027: '12-21' }
	}
};
