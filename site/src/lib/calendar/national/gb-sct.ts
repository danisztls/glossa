/**
 * Scotland — the General Roman Calendar as Scotland’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Scotland actually does
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
 *   - Saint Gertrude, virgin: absent in 2026, 2027 only -- not written; three years cannot say which it is
 */

export const SCOTLAND: NationalCalendar = {
	id: 'gb-sct',
	options: { epiphanyOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-13': [proper('kentigern', { en: 'Saint Kentigern, bishop' }, 'f')],
		'03-10': [
			proper('john-ogilvie', { en: 'Saint John Ogilvie, priest and martyr' }, 'f', {
				colour: 'red'
			})
		],
		'06-09': [proper('columba', { en: 'Saint Columba, abbot' }, 'f')],
		'07-09': [proper('aberdeen', { en: 'Our Lady of Aberdeen' }, 'f')],
		'09-16': [proper('ninian', { en: 'Saint Ninian, bishop' }, 'f')],
		'11-08': [proper('john-duns-scotus', { en: 'Blessed John Duns Scotus, priest' }, 'm')]
	},
	overrides: {
		andrew: keptAs('s'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'margaret-of-scotland': keptAs('f'),
		patrick: keptAs('f', 'white'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'all-saints': { to: '11-02' },
		andrew: { to: '12-01' },
		assumption: { to: '08-16' },
		'peter-and-paul': { to: '06-28' }
	}
};
