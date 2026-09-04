/**
 * England — the General Roman Calendar as England’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what England actually does
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
 *   - epiphanyOnSunday: 2025 True, 2026 False, 2027 False -- the conference changed it; the latest is kept
 *   - Saint Martin de Porres, religious: absent in 2025 only -- not written; three years cannot say which it is
 *   - Saint Paulinus of Nola, bishop: absent in 2026, 2027 only -- not written; three years cannot say which it is
 *   - Saint Gregory VII, pope: absent in 2027 only -- not written; three years cannot say which it is
 *   - Saint Mary Magdalene de Pazzi, virgin: absent in 2027 only -- not written; three years cannot say which it is
 */

export const ENGLAND: NationalCalendar = {
	id: 'gb-eng',
	options: { corpusChristiOnSunday: true },
	propers: {
		'01-12': [proper('aelred-of-rievaulx', { en: 'Saint Aelred of Rievaulx, abbot' }, 'o')],
		'01-19': [proper('wulstan-of-worcester', { en: 'Saint Wulstan of Worcester, bishop' }, 'o')],
		'03-01': [proper('david-of-mynyw', { en: 'Saint David of Mynyw, bishop' }, 'f')],
		'05-04': [proper('english-martyrs', { en: 'The English Martyrs' }, 'f', { colour: 'red' })],
		'05-19': [proper('dunstan', { en: 'Saint Dunstan, bishop' }, 'o')],
		'06-09': [proper('columba', { en: 'Saint Columba, abbot' }, 'o')],
		'06-16': [proper('richard-of-chichester', { en: 'Saint Richard of Chichester, bishop' }, 'o')],
		'06-20': [proper('alban', { en: 'Saint Alban, martyr' }, 'o', { colour: 'red' })],
		'06-23': [proper('etheldreda', { en: 'Saint Etheldreda, abbess' }, 'o')],
		'07-01': [
			proper('oliver-plunkett', { en: 'Saint Oliver Plunkett, bishop and martyr' }, 'o', {
				colour: 'red'
			})
		],
		'08-26': [
			proper(
				'dominic-of-the-mother-of-god',
				{ en: 'Blessed Dominic of the Mother of God, priest' },
				'o'
			)
		],
		'08-30': [
			proper(
				'margaret-clitherow',
				{ en: 'Saint Margaret Clitherow, Saint Anne Line and Saint Margaret Ward, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'08-31': [proper('aidan', { en: 'Saint Aidan, bishop, and the Saints of Lindisfarne' }, 'o')],
		'09-04': [proper('cuthbert', { en: 'Saint Cuthbert, bishop' }, 'o')],
		'09-19': [
			proper('theodore-of-canterbury', { en: 'Saint Theodore of Canterbury, bishop' }, 'o')
		],
		'09-24': [proper('walsingham', { en: 'Our Lady of Walsingham' }, 'f')],
		'10-09': [proper('john-henry-newman', { en: 'Saint John Henry Newman, priest' }, 'f')],
		'10-10': [proper('paulinus-of-york', { en: 'Saint Paulinus of York, bishop' }, 'o')],
		'10-12': [proper('wilfrid', { en: 'Saint Wilfrid, bishop' }, 'o')],
		'10-13': [proper('edward-the-confessor', { en: 'Saint Edward the Confessor, king' }, 'o')],
		'10-26': [proper('chad-and-saint-cedd', { en: 'Saint Chad and Saint Cedd, bishops' }, 'o')],
		'11-03': [
			proper('winifride', { en: 'Saint Winifride, abbess and martyr' }, 'o', { colour: 'red' })
		],
		'11-07': [proper('willibrord', { en: 'Saint Willibrord, bishop' }, 'o')],
		'11-16': [proper('edmund-of-abingdon', { en: 'Saint Edmund of Abingdon, bishop' }, 'o')],
		'11-17': [
			proper('hilda-of-whitby', { en: 'Saint Hilda of Whitby, religious' }, 'o'),
			proper('hugh-of-lincoln', { en: 'Saint Hugh of Lincoln, bishop' }, 'o')
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
		'augustine-of-canterbury': keptAs('f'),
		bede: keptAs('m'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'elizabeth-of-hungary': keptAs('o'),
		'fisher-more': keptAs('f'),
		george: keptAs('s'),
		'gregory-the-great': keptAs('f'),
		'john-henry-newman': keptAs('f'),
		patrick: keptAs('f', 'white'),
		'teresa-benedicta': keptAs('f'),
		'thomas-becket': keptAs('f', 'red')
	},
	moves: {
		adalbert: { to: '04-24' },
		assumption: { to: '08-16' },
		denis: { to: '10-10' },
		epiphany: { to: '01-05' },
		george: { to: '04-28' },
		'john-leonardi': { to: '10-10' },
		'peter-and-paul': { to: '06-28' }
	},
	movedInYear: {
		'all-saints': { 2025: '11-02', 2027: '10-31' }
	}
};
