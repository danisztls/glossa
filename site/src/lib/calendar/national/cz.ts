/**
 * Czechia — the General Roman Calendar as Czechia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Czechia actually does
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
 * A proper carries the name its conference approved, in cs, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const CZECHIA: NationalCalendar = {
	id: 'cz',
	options: {},
	propers: {
		'01-18': [
			proper(
				'our-lady',
				{ cs: 'Panny Marie, Matky jednoty křesťanů', en: 'Our Lady, Mother of Christian Unity' },
				'm'
			)
		],
		'02-17': [
			proper(
				'alexis-and-companions',
				{ cs: 'Sv. Alexia a druhů, řeholníků', en: 'Saint Alexis and companions, martyrs' },
				'o'
			)
		],
		'03-10': [
			proper(
				'john-ogilvie',
				{ cs: 'Sv. Jana Ogilvie, kněze a mučedníka', en: 'Saint John Ogilvie, priest and martyr' },
				'o',
				{ colour: 'violet' }
			)
		],
		'04-30': [
			proper(
				'sigismund-of-burgundy',
				{ cs: 'Sv. Zikmunda, mučedníka', en: 'Saint Sigismund of Burgundy, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'05-06': [
			proper(
				'jan-sarkander',
				{
					cs: 'Sv. Jana Sarkandra, kněze a mučedníka',
					en: 'Saint Jan Sarkander, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-08': [
			proper(
				'mediatrix-of-all-graces',
				{ cs: 'Panny Marie, Prostřednice všech milostí', en: 'Our Lady Mediatrix of All Graces' },
				'o'
			)
		],
		'05-16': [
			proper(
				'john-of-nepomuk',
				{
					cs: 'Sv. Jana Nepomuckého, kněze a mučedníka',
					en: 'Saint John of Nepomuk, priest and martyr'
				},
				'f',
				{ colour: 'red' }
			)
		],
		'05-20': [
			proper(
				'clement-mary-hofbauer',
				{ cs: 'Sv. Klementa Marie Hofbauera, kněze', en: 'Saint Clement Mary Hofbauer, priest' },
				'o'
			)
		],
		'05-30': [proper('zdislava', { cs: 'Sv. Zdislavy', en: 'Saint Zdislava' }, 'o')],
		'06-15': [
			proper('vitus', { cs: 'Sv. Víta, mučedníka', en: 'Saint Vitus, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'06-19': [
			proper(
				'john-neumann',
				{ cs: 'Sv. Jana Nepomuckého Neumanna, biskupa', en: 'Saint John Neumann, bishop' },
				'o'
			)
		],
		'07-04': [
			proper(
				'procopius-of-sazava',
				{ cs: 'Sv. Prokopa, opata', en: 'Saint Procopius of Sázava, abbot' },
				'o'
			)
		],
		'07-14': [
			proper('hroznata', { cs: 'Bl. Hroznaty, mučedníka', en: 'Blessed Hroznata, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'07-17': [
			proper(
				'czes-aw-and-saint-hyacinth',
				{
					cs: 'Bl. Česlava a sv. Hyacinta, kněží',
					en: 'Blessed Czesław and Saint Hyacinth, priests'
				},
				'o'
			)
		],
		'07-27': [
			proper(
				'clement-of-ohrid',
				{ cs: 'Sv. Gorazda a druhů', en: 'Saint Clement of Ohrid, Saint Gorazd, and companions' },
				'o'
			)
		],
		'08-02': [
			proper(
				'the-angels',
				{ cs: 'Panny Marie Královny andělů', en: 'Our Lady of the Angels' },
				'o',
				{ marian: true }
			)
		],
		'08-25': [
			proper(
				'dominic-methodius-trcka',
				{
					cs: 'Bl. Dominika Metoděje Trčky, kněze a mučedníka',
					en: 'Blessed Dominic Methodius Trčka, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			),
			proper(
				'benedict',
				{
					cs: 'Sv. Benedikta, Jana, Matouše, Izáka a Kristina, mučedníků',
					en: 'Saints Benedict, John, Matthew, Isaac and Christinus, protomartyrs of Poland'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-07': [
			proper(
				'melchior-grodziecki',
				{
					cs: 'Sv. Melichara Grodeckého, kněze a mučedníka',
					en: 'Saint Melchior Grodziecki, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-10': [
			proper(
				'charles-spinola-and-blessed-jerome-de-angelis',
				{
					cs: 'Bl. Karla Spinoly, kněze a mučedníka',
					en: 'Blessed Charles Spinola and Blessed Jerome de Angelis, priests and martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-16': [
			proper('ludmila', { cs: 'Sv. Ludmily, mučednice', en: 'Saint Ludmila, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'10-12': [
			proper(
				'radzim-gaudenty',
				{ cs: 'Sv. Radima, biskupa', en: 'Blessed Radzim Gaudenty, bishop' },
				'o'
			)
		],
		'10-21': [
			proper('karl-of-austria', { cs: 'Bl. Karla Rakouského', en: 'Blessed Karl of Austria' }, 'o')
		],
		'10-31': [
			proper('wolfgang', { cs: 'Sv. Wolfganga, biskupa', en: 'Saint Wolfgang, bishop' }, 'o')
		],
		'11-13': [
			proper(
				'agnes-of-bohemia',
				{ cs: 'Sv. Anežky České, panny', en: 'Saint Agnes of Bohemia, virgin' },
				'm'
			)
		],
		'12-01': [
			proper(
				'edmund-campion',
				{
					cs: 'Sv. Edmunda Kampiána, kněze a mučedníka',
					en: 'Saint Edmund Campion, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		]
	},
	movable: [
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{
					cs: 'Ježíše Krista, nejvyššího a věčného kněze',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	overrides: {
		adalbert: keptAs('f'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cornelius-cyprian': keptAs('o'),
		'cyril-methodius': keptAs('s'),
		'seven-founders': null,
		'teresa-benedicta': keptAs('f'),
		wenceslaus: keptAs('s')
	},
	moves: {
		'cornelius-cyprian': { to: '09-17' },
		'cyril-methodius': { to: '07-05' },
		george: { to: '04-24' },
		wenceslaus: { to: '09-28' }
	}
};
