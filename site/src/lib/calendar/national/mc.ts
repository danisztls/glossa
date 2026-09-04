/**
 * Monaco — the General Roman Calendar as Monaco’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Monaco actually does
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
 * A proper carries the name its conference approved, in fr, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const MONACO: NationalCalendar = {
	id: 'mc',
	options: {},
	propers: {
		'01-16': [
			proper(
				'honoratus',
				{ fr: 'Saint Honorat d’Arles, évêque', en: 'Saint Honoratus, bishop' },
				'm'
			)
		],
		'01-27': [
			proper(
				'devota',
				{ fr: 'Sainte Dévote, vierge et martyre', en: 'Saint Devota, virgin and martyr' },
				's',
				{ colour: 'red' }
			)
		],
		'05-15': [
			proper(
				'pontius-of-cimiez',
				{ fr: 'Saint Pons de Cimiez, martyr', en: 'Saint Pontius of Cimiez, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'05-21': [
			proper('hospitius', { fr: 'Saint Hospice, ermite', en: 'Saint Hospitius, hermit' }, 'o')
		],
		'06-11': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{
					fr: 'Anniversaire de la Dédicace de la Cathédrale',
					en: 'Anniversary of the Dedication of the Cathedral'
				},
				'f'
			)
		],
		'08-09': [
			proper('romanus', { fr: 'Saint Roman, martyr', en: 'Saint Romanus, martyr' }, 'f', {
				colour: 'red'
			})
		],
		'08-11': [
			proper('aurelia', { fr: 'Sainte Aurélie, martyre', en: 'Saint Aurelia, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'08-16': [proper('roch', { en: 'Saint Roch' }, 'm')],
		'12-04': [
			proper(
				'barbara',
				{ fr: 'Sainte Barbe, vierge et martyr', en: 'Saint Barbara, virgin and martyr' },
				'o',
				{ colour: 'red' }
			)
		]
	},
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		clare: keptAs('o'),
		'cyril-methodius': keptAs('f'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'angela-merici': { to: '01-29' },
		barnabas: { to: '06-12' },
		'teresa-benedicta': { to: '08-07' }
	}
};
