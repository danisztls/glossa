/**
 * Lithuania — the General Roman Calendar as Lithuania’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Lithuania actually does
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
 * A proper carries the name its conference approved, in lt, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const LITHUANIA: NationalCalendar = {
	id: 'lt',
	options: { ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-27': [
			proper(
				'jurgis-matulaitis',
				{ lt: 'Pal. Jurgis Matulaitis, vyskupas', en: 'Blessed Jurgis Matulaitis, bishop' },
				'm'
			)
		],
		'03-09': [
			proper(
				'bruno-of-querfurt',
				{
					lt: 'Šv. Bonifacas (Brunonas) Kverfurtietis, vyskupas, kankinys',
					en: 'Saint Bruno of Querfurt, bishop and martyr'
				},
				'o',
				{ colour: 'violet' }
			)
		],
		'05-16': [
			proper(
				'andrzej-bobola',
				{
					lt: 'Šv. Andriejus Bobola, kunigas, kankinys',
					en: 'Saint Andrzej Bobola, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'06-14': [
			proper(
				'teofilius-matulionis',
				{
					lt: 'Pal. Teofilius Matulionis, vyskupas, kankinys',
					en: 'Blessed Teofilius Matulionis, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-02': [
			proper(
				'queen-of-families',
				{ lt: 'Švč. Mergelė Marija, Šeimų Karalienė', en: 'Our Lady Queen of Families' },
				'f'
			)
		],
		'08-17': [
			proper(
				'hyacinth-of-poland',
				{ lt: 'Šv. Hiacintas, kunigas', en: 'Saint Hyacinth of Poland, priest' },
				'o'
			)
		],
		'11-16': [
			proper(
				'the-gate-of-dawn',
				{
					lt: 'Švč. Mergelė Marija, Gailestingumo Motina',
					en: 'Our Lady of the Gate of Dawn, Mother of Mercy'
				},
				's'
			)
		],
		'11-20': [
			proper(
				'raphael-kalinowski',
				{ lt: 'Šv. Rapolas Kalinauskas, vienuolis', en: 'Saint Raphael Kalinowski, priest' },
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
					lt: 'Mūsų Viešpats Jėzus Kristus, Aukščiausiasis ir Amžinasis Kunigas',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	overrides: {
		adalbert: keptAs('m'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		casimir: keptAs('s'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		faustina: keptAs('m'),
		george: keptAs('m'),
		'nativity-of-mary': keptAs('s'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		adalbert: { to: '04-24' },
		'angela-merici': { to: '01-29' },
		fidelis: { to: '04-26' },
		'frances-of-rome': { to: '03-10' },
		gertrude: { to: '11-14' },
		'margaret-of-scotland': { to: '11-14' }
	}
};
