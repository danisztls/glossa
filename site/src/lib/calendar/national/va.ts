/**
 * Vatican City — the General Roman Calendar as Vatican City’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Vatican City actually does
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
 * A proper carries the name its conference approved, in it, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const VATICAN_CITY: NationalCalendar = {
	id: 'va',
	options: { corpusChristiOnSunday: true },
	propers: {
		'02-01': [
			proper(
				'ludovica-albertoni',
				{ it: 'Beato Ludovica Albertoni', en: 'Blessed Ludovica Albertoni' },
				'o'
			)
		],
		'04-16': [
			proper(
				'benedict-joseph-labre',
				{ it: 'San Benedetto Giuseppe Labre', en: 'Saint Benedict Joseph Labre' },
				'o'
			)
		],
		'05-18': [
			proper(
				'felix-of-cantalice',
				{ it: 'San Felice da Cantalice, religioso', en: 'Saint Felix of Cantalice, religious' },
				'o'
			)
		],
		'05-23': [
			proper(
				'john-baptist-of-rossi',
				{
					it: 'San Giovanni Battista De Rossi, sacerdote',
					en: 'Saint John Baptist of Rossi, priest'
				},
				'm'
			)
		],
		'06-04': [
			proper(
				'salus-populi-romani',
				{ it: 'Beata Vergine Maria «Salus Populi Romani»', en: 'Our Lady “Salus Populi Romani”' },
				'm'
			)
		],
		'06-09': [
			proper(
				'anna-maria-taigi',
				{ it: 'Beata Anna Maria Taigi, madre di famiglia', en: 'Blessed Anna Maria Taigi' },
				'm'
			)
		],
		'06-26': [
			proper(
				'josemaria-escriva-de-balaguer',
				{
					it: 'San Josemaría Escrivá de Balaguer, sacerdote',
					en: 'Saint Josemaría Escrivá de Balaguer, priest'
				},
				'o'
			)
		],
		'07-07': [
			proper(
				'holy-bishops-of-the-holy-roman-church',
				{
					it: 'I Santi Vescovi di Santa Romana Chiesa',
					en: 'The Holy Bishops of the Holy Roman Church'
				},
				'm'
			)
		],
		'10-21': [
			proper(
				'gaspar-del-bufalo',
				{ it: 'San Gaspare del Bufalo, sacerdote', en: 'Saint Gaspar del Bufalo, priest' },
				'o'
			)
		],
		'11-08': [
			proper(
				'all-saints-of-the-holy-roman-church',
				{ it: 'Tutti i Santi di Santa Romana Chiesa', en: 'All Saints of the Holy Roman Church' },
				'm'
			)
		],
		'11-26': [
			proper(
				'leonard-of-port-maurice',
				{
					it: 'San Leonardo da Porto Maurizio, sacerdote',
					en: 'Saint Leonard of Port Maurice, priest'
				},
				'o'
			)
		]
	},
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'first-martyrs-of-rome': keptAs('m'),
		'francis-of-assisi': keptAs('f'),
		nicholas: keptAs('m'),
		'teresa-benedicta': keptAs('f'),
		'vincent-deacon': keptAs('m', 'white')
	}
};
