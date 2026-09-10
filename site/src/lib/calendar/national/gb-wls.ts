/**
 * Wales — the General Roman Calendar as Wales’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Wales actually does
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
 *   - Saint Martin de Porres, religious: absent in 2025 only -- not written; three years cannot say which it is
 *   - Saint Adalbert, bishop and martyr: absent in 2026, 2027 only -- not written; three years cannot say which it is
 *   - Saint Paulinus of Nola, bishop: absent in 2026, 2027 only -- not written; three years cannot say which it is
 */

export const WALES: NationalCalendar = {
	id: 'gb-wls',
	options: { corpusChristiOnSunday: true },
	// The Epiphany was kept on the Sunday until Advent 2025 and has been
	// kept on 6 January since — 5 January 2025 was the last, and it is a
	// fact about one liturgical year rather than a rule this layer holds.
	optionsInYear: { 2025: { epiphanyOnSunday: true } },
	propers: {
		'02-09': [proper('teilo-of-llandaff', { en: 'Saint Teilo of Llandaff, bishop' }, 'o')],
		'03-01': [proper('david-of-mynyw', { en: 'Saint David of Mynyw, bishop' }, 's')],
		'04-20': [proper('beuno', { en: 'Saint Beuno, abbot' }, 'o')],
		'05-05': [proper('asaph', { en: 'Saint Asaph, bishop' }, 'o')],
		'06-20': [
			proper('alban', { en: 'Saint Alban, Saint Julius and Saint Aaron, martyrs' }, 'm', {
				colour: 'red'
			})
		],
		'07-12': [
			proper('john-jones', { en: 'Saint John Jones, priest and martyr' }, 'o', { colour: 'red' })
		],
		'08-03': [proper('germanus-of-auxerre', { en: 'Saint Germanus of Auxerre, bishop' }, 'o')],
		'08-26': [
			proper('david-lewis', { en: 'Saint David Lewis, priest and martyr' }, 'o', { colour: 'red' })
		],
		'09-11': [proper('deiniol', { en: 'Saint Deiniol, bishop' }, 'o')],
		'10-09': [proper('john-henry-newman', { en: 'Saint John Henry Newman, priest' }, 'f')],
		'10-16': [proper('richard-gwyn', { en: 'Saint Richard Gwyn, martyr' }, 'o', { colour: 'red' })],
		'10-25': [
			proper(
				'six-welsh-martyrs-and-companions',
				{ en: 'The Six Welsh martyrs and companions, martyrs' },
				'f',
				{ colour: 'red' }
			)
		],
		'11-03': [
			proper('winifride', { en: 'Saint Winifride, abbess and martyr' }, 'o', { colour: 'red' })
		],
		'11-06': [proper('illtud', { en: 'Saint Illtud, abbot' }, 'o')],
		'11-08': [proper('all-saints-of-wales', { en: 'All Saints of Wales' }, 'f')],
		'11-14': [proper('dyfrig', { en: 'Saint Dyfrig, bishop' }, 'o')],
		'12-10': [
			proper('john-roberts', { en: 'Saint John Roberts, priest and martyr' }, 'o', {
				colour: 'red'
			})
		]
	},
	movable: [
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{ en: 'Our Lord Jesus Christ, the Eternal High Priest' },
				'f'
			)
		}
	],
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'fisher-more': keptAs('m'),
		george: keptAs('f'),
		'john-henry-newman': keptAs('f'),
		patrick: keptAs('f', 'white'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		denis: { to: '10-10' },
		'john-leonardi': { to: '10-10' }
	},
	movedInYear: {
		'all-souls': { 2025: '11-03' },
		'all-saints': { 2025: '11-02', 2027: '10-31' },
		assumption: { 2026: '08-16' },
		epiphany: { 2025: '01-05' },
		'peter-and-paul': { 2026: '06-28' }
	}
};
