/**
 * Norway — the General Roman Calendar as Norway’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Norway actually does
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
 * A proper carries the name its conference approved, in no, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const NORWAY: NationalCalendar = {
	id: 'no',
	options: { corpusChristiOnSunday: true },
	propers: {
		'01-08': [
			proper('torfinn', { no: 'Den hellige Torfinn, biskop', en: 'Saint Torfinn, bishop' }, 'o')
		],
		'01-19': [
			proper(
				'henry-of-finland',
				{
					no: 'Den hellige Henrik av Finland, biskop og martyr',
					en: 'Saint Henry of Finland, bishop and martyr'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'01-26': [
			proper(
				'eystein-erlendsson',
				{ no: 'Den hellige Øystein', en: 'Saint Eystein Erlendsson, bishop' },
				'o'
			)
		],
		'04-16': [
			proper(
				'magus-of-orkney',
				{ no: 'Den hellige Magnus, martyr', en: 'Saint Magus of Orkney, martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'05-15': [
			proper(
				'hallvard-vebj-rnsson',
				{ no: 'Den hellige Hallvard, martyr', en: 'Saint Hallvard Vebjørnsson, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'05-18': [
			proper(
				'eric-of-sweden',
				{ no: 'Den hellige Erik, martyr', en: 'Saint Eric of Sweden, martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'07-08': [
			proper(
				'sunniva-and-companions',
				{
					no: 'Den hellige Sunniva og hennes ledsagere, martyrer',
					en: 'Saint Sunniva and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-10': [
			proper(
				'canute-of-denmark',
				{ no: 'Den hellige Knut, martyr', en: 'Saint Canute of Denmark, martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'07-15': [
			proper('swithun', { no: 'Den hellige Svithun, biskop', en: 'Saint Swithun, bishop' }, 'o')
		],
		'07-20': [
			proper('thorlak', { no: 'Den hellige Thorlákr, biskop', en: 'Saint Thorlak, bishop' }, 'm')
		],
		'07-29': [
			proper('olaf', { no: 'Den hellige Olav, martyr', en: 'Saint Olaf, martyr' }, 's', {
				colour: 'red'
			})
		],
		'10-16': [
			proper(
				'conversion-of-saint-olaf',
				{ no: 'Den hellige Olav den Helliges omvendelse', en: 'The Conversion of Saint Olaf' },
				'o'
			)
		],
		'11-25': [
			proper(
				'niels-steensen',
				{ no: 'Den salige Niels Steensen, biskop', en: 'Blessed Niels Steensen, bishop' },
				'm'
			)
		]
	},
	overrides: {
		ansgar: keptAs('m'),
		benedict: keptAs('f'),
		blaise: null,
		bonaventure: keptAs('o'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'teresa-benedicta': keptAs('f'),
		'timothy-titus': keptAs('o')
	},
	moves: {
		'martha-mary-lazarus': { to: '07-28' },
		'timothy-titus': { to: '01-27' }
	}
};
