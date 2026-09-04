/**
 * The Latin Patriarchate of Jerusalem — the General Roman Calendar as its bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what the Latin Patriarchate of Jerusalem actually does
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
 *   - Saint Adalbert, bishop and martyr: absent in 2026, 2027 only -- not written; three years cannot say which it is
 */

export const JERUSALEM: NationalCalendar = {
	id: 'ps',
	alsoCovers: ['cy', 'il', 'jo'],
	options: {},
	propers: {
		'01-11': [proper('theodosius', { en: 'Saint Theodosius, abbot' }, 'o')],
		'01-20': [proper('euthymius', { en: 'Saint Euthymius, abbot' }, 'o')],
		'01-29': [
			proper('paula', { en: 'Saint Paula, Saint Eustochium and Saint Melania, religious' }, 'o')
		],
		'02-03': [
			proper('simeon-and-saint-anna', { en: 'Saint Simeon and Saint Anna, prophets' }, 'o')
		],
		'02-11': [
			proper(
				'anniversary-of-the-dedication-of-the-co-cathedral-of-the-most-holy-name-of-jesus',
				{ en: 'Anniversary of the Dedication of the Co-Cathedral of the Most Holy Name of Jesus' },
				'f'
			)
		],
		'02-26': [proper('porphyry', { en: 'Saint Porphyry, bishop' }, 'o')],
		'03-11': [proper('sophronius', { en: 'Saint Sophronius, bishop' }, 'o', { colour: 'violet' })],
		'04-24': [
			proper(
				'mary-of-clopas-and-other-holy-disciples-of-christ',
				{ en: 'Saint Mary of Clopas and other holy disciples of Christ' },
				'm'
			)
		],
		'04-27': [
			proper('simeon-of-jerusalem', { en: 'Saint Simeon of Jerusalem, bishop and martyr' }, 'm', {
				colour: 'red'
			})
		],
		'05-07': [proper('discovery-of-the-holy-cross', { en: 'Discovery of the Holy Cross' }, 'o')],
		'05-09': [proper('isaiah', { en: 'Saint Isaiah, prophet and martyr' }, 'm', { colour: 'red' })],
		'05-12': [proper('epiphanius-of-salamis', { en: 'Saint Epiphanius of Salamis, bishop' }, 'o')],
		'05-17': [
			proper(
				'all-holy-bishops-of-the-holy-city-of-jerusalem',
				{ en: 'All Holy Bishops of the Holy City of Jerusalem' },
				'm'
			)
		],
		'05-21': [proper('helena', { en: 'Saint Helena' }, 'm')],
		'06-14': [proper('elisha', { en: 'Saint Elisha, prophet' }, 'o')],
		'06-23': [
			proper(
				'zenon',
				{ en: 'Saint Zenon, Saint Zenas, martyrs, and all holy martyrs of Transjordan' },
				'o',
				{ colour: 'red' }
			)
		],
		'06-25': [
			proper(
				'zachariah-and-saint-elizabeth',
				{ en: 'Saint Zachariah and Saint Elizabeth, parents of Saint John the Baptist' },
				'm'
			)
		],
		'07-15': [
			proper(
				'dedication-of-the-basilica-of-the-holy-sepulchre-of-our-lord-jesus-christ',
				{ en: 'Dedication of the Basilica of the Holy Sepulchre of Our Lord Jesus Christ' },
				'f'
			)
		],
		'07-20': [proper('elijah', { en: 'Saint Elijah, prophet' }, 'm')],
		'07-21': [
			proper('jeremiah', { en: 'Saint Jeremiah, prophet and martyr' }, 'm', { colour: 'red' })
		],
		'08-03': [
			proper('holy-machabees', { en: 'The Holy Machabees, martyrs' }, 'o', { colour: 'red' })
		],
		'08-26': [
			proper('mary-of-jesus-crucified', { en: 'Saint Mary of Jesus Crucified, virgin' }, 'm')
		],
		'08-29': [
			proper(
				'passion-of-saint-john-the-baptist',
				{ en: 'The Passion of Saint John the Baptist, martyr' },
				's',
				{ colour: 'red' }
			)
		],
		'08-31': [
			proper(
				'joseph-of-arimathea-and-saint-nicodemus',
				{ en: 'Saint Joseph of Arimathea and Saint Nicodemus' },
				'o'
			)
		],
		'09-04': [proper('moses', { en: 'Saint Moses, prophet' }, 'm')],
		'09-17': [proper('albert-of-jerusalem', { en: 'Saint Albert of Jerusalem, patriarch' }, 'o')],
		'10-09': [proper('abraham', { en: 'Saint Abraham, patriarch' }, 'm')],
		'10-11': [proper('philip', { en: 'Saint Philip, deacon' }, 'o')],
		'10-12': [proper('dismas', { en: 'Saint Dismas' }, 'o')],
		'10-16': [proper('longinus', { en: 'Saint Longinus' }, 'o', { colour: 'red' })],
		'10-20': [proper('cornelius-the-centurion', { en: 'Saint Cornelius the Centurion' }, 'o')],
		'10-21': [proper('hilarion', { en: 'Saint Hilarion, abbot' }, 'o')],
		'10-25': [proper('queen-of-palestine', { en: 'Our Lady Queen of Palestine' }, 's')],
		'11-08': [
			proper(
				'all-saints-of-the-church-of-jerusalem',
				{ en: 'All Saints of the Church of Jerusalem' },
				'f'
			)
		],
		'11-13': [proper('philip-b', { en: 'Saint Philip, apostle' }, 'f', { colour: 'red' })],
		'11-14': [
			proper(
				'nicholas-tavelic',
				{ en: 'Saint Nicholas Tavelic, priest, and companions, martyrs' },
				'o',
				{ colour: 'red' }
			)
		],
		'11-19': [
			proper('marie-alphonsine-ghattas', { en: 'Saint Marie-Alphonsine Ghattas, religious' }, 'm')
		],
		'12-05': [proper('sabas', { en: 'Saint Sabas, abbot' }, 'm')],
		'12-15': [
			proper('david', { en: 'Saint David, king, and all ancestors of Our Lord Jesus Christ' }, 'm')
		]
	},
	overrides: {
		'cyril-of-jerusalem': keptAs('f', 'white'),
		'exaltation-of-the-cross': keptAs('s'),
		george: keptAs('m'),
		'john-damascene': keptAs('m'),
		'our-lady-of-mount-carmel': keptAs('m'),
		'passion-of-john-the-baptist': keptAs('s'),
		'philip-james': keptAs('s')
	}
};
