/**
 * Timor-Leste — the General Roman Calendar as Timor-Leste’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Timor-Leste actually does
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

import { proper } from './common';
import type { NationalCalendar } from '../types';

export const TIMOR_LESTE: NationalCalendar = {
	id: 'tl',
	options: { epiphanyOnSunday: true, ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
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
				'o'
			)
		],
		'05-12': [
			proper(
				'joan-of-portugal',
				{ pt: 'Beata Joana de Portugal, virgem', en: 'Blessed Joan of Portugal, virgin' },
				'o'
			)
		],
		'06-10': [
			proper(
				'holy-guardian-angel-of-portugal',
				{ pt: 'Santo Anjo da Guarda de Portugal', en: 'The Holy Guardian Angel of Portugal' },
				'm'
			)
		],
		'06-20': [
			proper(
				'sancha-and-blessed-mafalda',
				{
					pt: 'Beatas Sancha e Mafalda, virgens, e Teresa, religiosa',
					en: 'Blessed Sancha and Blessed Mafalda, virgins, and Blessed Theresa, religious'
				},
				'o'
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
		'10-12': [proper('aitara', { pt: 'Nossa Senhora de Aitara', en: 'Our Lady of Aitara' }, 'f')],
		'10-27': [
			proper(
				'gonzalo-of-lagos',
				{ pt: 'Beato Gonçalo de Lagos, presbítero', en: 'Blessed Gonzalo of Lagos, priest' },
				'o'
			)
		]
	}
};
