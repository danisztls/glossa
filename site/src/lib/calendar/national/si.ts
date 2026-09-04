/**
 * Slovenia — the General Roman Calendar as Slovenia’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Slovenia actually does
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

/*
 * NOT DERIVED, and left here rather than guessed:
 *
 *   - Our Lady Help of Christians: kept on 2025 2025-05-24, 2026 2026-05-25, 2027 2027-05-24 -- no fixed date and no fixed offset from Easter
 */

export const SLOVENIA: NationalCalendar = {
	id: 'si',
	options: {},
	propers: {
		'01-11': [proper('paulinus-of-aquileia', { en: 'Saint Paulinus of Aquileia, bishop' }, 'm')],
		'02-14': [
			proper('valentine', { en: 'Saint Valentine, priest and martyr' }, 'o', { colour: 'red' })
		],
		'04-16': [proper('bernadette-soubirous', { en: 'Saint Bernadette Soubirous, virgin' }, 'm')],
		'05-04': [proper('florian', { en: 'Saint Florian, martyr' }, 'm', { colour: 'red' })],
		'05-12': [proper('leopold-mandic', { en: 'Saint Leopold Mandić, priest' }, 'm')],
		'05-16': [
			proper('john-of-nepomuk', { en: 'Saint John of Nepomuk, priest and martyr' }, 'm', {
				colour: 'red'
			})
		],
		'05-17': [proper('judoc', { en: 'Saint Judoc, priest and hermit' }, 'o')],
		'05-27': [
			proper('aloysius-grozde', { en: 'Blessed Aloysius Grozde, martyr' }, 'o', { colour: 'red' })
		],
		'05-29': [proper('maximus-of-emona', { en: 'Saint Maximus of Emona, bishop' }, 'o')],
		'05-30': [
			proper(
				'cantius',
				{ en: 'Saint Cantius, Saint Cantianus, and Saint Cantianilla, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'06-09': [
			proper('primus-and-saint-felician', { en: 'Saint Primus and Saint Felician, martyrs' }, 'o', {
				colour: 'red'
			})
		],
		'06-15': [proper('vitus', { en: 'Saint Vitus, martyr' }, 'o', { colour: 'red' })],
		'06-27': [proper('hemma-of-gurk', { en: 'Saint Hemma of Gurk' }, 'm')],
		'07-04': [proper('ulrich-of-augsburg', { en: 'Saint Ulrich of Augsburg, bishop' }, 'o')],
		'07-12': [
			proper(
				'hermagoras',
				{ en: 'Saint Hermagoras, bishop, and Saint Fortunatus, deacon, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'07-24': [proper('christopher', { en: 'Saint Christopher, martyr' }, 'o', { colour: 'red' })],
		'07-27': [
			proper('gorazd', { en: 'Saint Gorazd, Saint Clement of Ohrid, bishops, and companions' }, 'm')
		],
		'08-16': [proper('roch', { en: 'Saint Roch' }, 'o')],
		'09-01': [proper('giles', { en: 'Saint Giles, abbot' }, 'o')],
		'09-24': [
			proper('anton-martin-slomsek', { en: 'Blessed Anton Martin Slomšek, bishop' }, 'o'),
			proper('rupert-of-salzburg', { en: 'Saint Rupert of Salzburg, bishop' }, 'o')
		],
		'10-12': [
			proper('maximilian-of-lorch', { en: 'Saint Maximilian of Lorch, bishop and martyr' }, 'o', {
				colour: 'red'
			})
		],
		'11-03': [
			proper('justus-of-trieste', { en: 'Saint Justus of Trieste, martyr' }, 'o', {
				colour: 'red'
			}),
			proper('victorinus-of-pettau', { en: 'Saint Victorinus of Pettau, bishop and martyr' }, 'o', {
				colour: 'red'
			})
		],
		'11-06': [proper('leonard-of-noblac', { en: 'Saint Leonard of Noblac, abbot' }, 'o')],
		'11-13': [proper('stanislaus-kostka', { en: 'Saint Stanislaus Kostka, religious' }, 'o')],
		'11-27': [
			proper(
				'vergilius-of-salzburg-and-saint-modestus',
				{ en: 'Saint Vergilius of Salzburg and Saint Modestus, bishops' },
				'o'
			)
		],
		'12-15': [
			proper(
				'marija-krizina-bojanc',
				{
					en: 'Blessed Marija Krizina Bojanc, Blessed Marija Antonija Fabjan, and companions, religious and martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		]
	},
	overrides: {
		benedict: keptAs('f'),
		blaise: keptAs('m'),
		bridget: keptAs('f'),
		bruno: keptAs('m'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'joseph-the-worker': keptAs('f'),
		nicholas: keptAs('m'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		ansgar: { to: '02-04' },
		'anthony-zaccaria': { to: '07-07' },
		'cyril-methodius': { to: '07-05' },
		'cyril-of-alexandria': { to: '06-26' },
		matthias: { to: '02-24' },
		'nereus-achilleus': { to: '05-11' },
		pancras: { to: '05-11' }
	}
};
