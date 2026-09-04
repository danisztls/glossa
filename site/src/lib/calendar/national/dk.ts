/**
 * Denmark — the General Roman Calendar as Denmark’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Denmark actually does
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
 * A proper carries the name its conference approved, in da, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Saint Martin de Porres, religious: absent in 2025 only -- not written; three years cannot say which it is
 */

export const DENMARK: NationalCalendar = {
	id: 'dk',
	alsoCovers: ['fo', 'gl'],
	options: { epiphanyOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-07': [
			proper('canute-lavard', { da: 'Skt. Knud Hertug', en: 'Saint Canute Lavard, martyr' }, 'm', {
				colour: 'red'
			})
		],
		'01-19': [
			proper(
				'henry-of-finland',
				{ da: 'Skt. Henrik, biskop og martyr', en: 'Saint Henry of Finland, bishop and martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'03-02': [
			proper(
				'charles-the-good',
				{ da: 'Salige Karl den Gode, martyr', en: 'Blessed Charles the Good, martyr' },
				'o',
				{ colour: 'violet' }
			)
		],
		'03-05': [
			proper(
				'lucius-i',
				{ da: 'Skt. Lucius I, pave og martyr', en: 'Saint Lucius I, pope and martyr' },
				'o',
				{ colour: 'violet' }
			)
		],
		'05-18': [
			proper(
				'eric-of-sweden',
				{ da: 'Skt. Erik, martyr', en: 'Saint Eric of Sweden, martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'06-16': [
			proper(
				'william-of-belholt',
				{ da: 'Skt. Vilhelm, abbed', en: 'Saint William of Æbelholt, abbot' },
				'm'
			)
		],
		'07-09': [
			proper(
				'willehad-of-denmark',
				{ da: 'Skt. Villehad, martyr', en: 'Saint Willehad of Denmark, priest and martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'07-10': [
			proper(
				'canute-of-denmark',
				{ da: 'Skt. Knud Konge, martyr', en: 'Saint Canute of Denmark, martyr' },
				'f',
				{ colour: 'red' }
			)
		],
		'07-12': [
			proper(
				'kjeld-of-viborg',
				{ da: 'Skt. Kjeld, præst', en: 'Saint Kjeld of Viborg, priest' },
				'o'
			)
		],
		'07-20': [proper('thorlak', { da: 'Skt. Torlak, biskop', en: 'Saint Thorlak, bishop' }, 'm')],
		'07-29': [
			proper('olaf', { da: 'Skt. Olav, martyr', en: 'Saint Olaf, martyr' }, 'm', { colour: 'red' })
		],
		'09-07': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{
					da: 'Årsdagen for Domkirkens Konsekration',
					en: 'Anniversary of the Dedication of the Cathedral'
				},
				'f'
			)
		],
		'10-30': [
			proper(
				'theodgar-of-vestervig',
				{ da: 'Skt. Thøger, præst', en: 'Saint Theodgar of Vestervig, priest' },
				'o'
			)
		],
		'11-07': [
			proper('willibrord', { da: 'Skt. Willibrord, biskop', en: 'Saint Willibrord, bishop' }, 'm')
		],
		'11-25': [
			proper(
				'niels-steensen',
				{ da: 'Salige Niels Steensen, biskop', en: 'Blessed Niels Steensen, bishop' },
				'm'
			)
		]
	},
	movable: [
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{
					da: 'Skt. Jesus Kristus – Den Evige Ypperstepræst',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	overrides: {
		ansgar: keptAs('s'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'john-paul-ii': keptAs('m'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		apollinaris: { to: '07-19' },
		'augustine-zhao-rong': { to: '07-08' },
		blaise: { to: '02-04' },
		'catherine-of-alexandria': { to: '11-26' },
		'john-i': { to: '05-19' },
		'martha-mary-lazarus': { to: '07-28' },
		'raymond-of-penyafort': { to: '01-08' }
	},
	movedInYear: {
		'all-saints': { 2025: '11-02', 2027: '11-07' },
		ansgar: { 2025: '01-26', 2026: '01-25', 2027: '01-31' },
		assumption: { 2025: '08-17', 2026: '08-16' },
		'dedication-of-the-lateran': { 2026: '11-08', 2027: '11-14' },
		'peter-and-paul': { 2026: '06-28', 2027: '06-27' },
		'presentation-of-the-lord': { 2026: '02-01', 2027: '02-07' }
	}
};
