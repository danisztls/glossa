/**
 * Ireland — the General Roman Calendar as Ireland’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Ireland actually does
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

export const IRELAND: NationalCalendar = {
	id: 'ie',
	options: { ascensionOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-03': [proper('munchin-of-limerick', { en: 'Saint Munchin of Limerick, bishop' }, 'o')],
		'01-15': [proper('ita-of-limerick', { en: 'Saint Ita of Limerick, virgin' }, 'm')],
		'01-16': [proper('fursa', { en: 'Saint Fursa, abbot' }, 'o')],
		'01-30': [proper('aidan-of-ferns', { en: 'Saint Aidan of Ferns, bishop' }, 'o')],
		'02-01': [proper('brigid-of-kildare', { en: 'Saint Brigid of Kildare, abbess' }, 'f')],
		'02-07': [proper('mel-of-ardagh', { en: 'Saint Mel of Ardagh, bishop' }, 'o')],
		'02-11': [proper('gobnait', { en: 'Saint Gobnait, virgin' }, 'o')],
		'02-17': [proper('fintan-of-clonenagh', { en: 'Saint Fintan of Clonenagh, abbot' }, 'o')],
		'03-01': [proper('david-of-mynyw', { en: 'Saint David of Mynyw, bishop' }, 'o')],
		'03-05': [proper('kieran', { en: 'Saint Kieran, bishop' }, 'o', { colour: 'violet' })],
		'03-08': [proper('senan', { en: 'Saint Senan, bishop' }, 'o', { colour: 'violet' })],
		'03-11': [
			proper('aengus', { en: 'Saint Aengus, bishop and abbot' }, 'o', { colour: 'violet' })
		],
		'03-21': [
			proper('enda-of-aran', { en: 'Saint Enda of Aran, abbot' }, 'o', { colour: 'violet' })
		],
		'03-24': [proper('macartan', { en: 'Saint Macartan, bishop' }, 'o', { colour: 'violet' })],
		'04-01': [proper('ceallach', { en: 'Saint Ceallach, bishop' }, 'o', { colour: 'violet' })],
		'04-18': [proper('laserian-of-leighlin', { en: 'Saint Laserian of Leighlin, bishop' }, 'o')],
		'04-27': [proper('asicus', { en: 'Saint Asicus, bishop' }, 'o')],
		'05-04': [proper('conleth', { en: 'Saint Conleth, bishop' }, 'o')],
		'05-05': [proper('edmund-rice', { en: 'Blessed Edmund Rice, religious' }, 'o')],
		'05-10': [proper('comgall', { en: 'Saint Comgall, abbot' }, 'o')],
		'05-15': [proper('carthage', { en: 'Saint Carthage, bishop' }, 'o')],
		'05-16': [proper('brendan-of-clonfert', { en: 'Saint Brendan of Clonfert, abbot' }, 'o')],
		'06-03': [proper('kevin', { en: 'Saint Kevin, abbot' }, 'm')],
		'06-06': [proper('jarlath', { en: 'Saint Jarlath, bishop' }, 'o')],
		'06-07': [proper('colman-of-dromore', { en: 'Saint Colman of Dromore, bishop' }, 'o')],
		'06-09': [proper('columba', { en: 'Saint Columba, abbot' }, 'f')],
		'06-14': [proper('davnet', { en: 'Saint Davnet, virgin' }, 'o')],
		'06-20': [
			proper('blessed-irish-martyrs', { en: 'The Blessed Irish Martyrs' }, 'm', { colour: 'red' })
		],
		'07-01': [
			proper('oliver-plunkett', { en: 'Saint Oliver Plunkett, bishop and martyr' }, 'm', {
				colour: 'red'
			})
		],
		'07-06': [proper('monnine', { en: 'Saint Monnine, virgin' }, 'o')],
		'07-07': [proper('maelruain', { en: 'Saint Maelruain, bishop and abbot' }, 'o')],
		'07-08': [proper('kilian', { en: 'Saint Kilian, bishop and martyr' }, 'o', { colour: 'red' })],
		'07-24': [proper('declan', { en: 'Saint Declan, bishop' }, 'o')],
		'08-12': [
			proper('attracta-of-killaraght', { en: 'Saint Attracta of Killaraght, virgin' }, 'o'),
			proper('lelia-of-killeely', { en: 'Saint Lelia of Killeely, virgin' }, 'o'),
			proper('muredach-of-killala', { en: 'Saint Muredach of Killala, bishop' }, 'o')
		],
		'08-13': [proper('fachtna', { en: 'Saint Fachtna, bishop' }, 'o')],
		'08-17': [proper('knock', { en: 'Our Lady of Knock' }, 'm')],
		'08-23': [proper('eugene-of-ardstraw', { en: 'Saint Eugene of Ardstraw, bishop' }, 'o')],
		'08-30': [proper('fiacre', { en: 'Saint Fiacre, monk' }, 'o')],
		'08-31': [proper('aidan-of-lindisfarne', { en: 'Saint Aidan of Lindisfarne, bishop' }, 'o')],
		'09-04': [proper('mac-nissi', { en: 'Saint Mac Nissi, bishop' }, 'o')],
		'09-09': [proper('ciaran-of-clonmacnoise', { en: 'Saint Ciaran of Clonmacnoise, abbot' }, 'm')],
		'09-12': [proper('ailbe', { en: 'Saint Ailbe, bishop' }, 'o')],
		'09-25': [proper('finbarr', { en: 'Saint Finbarr, bishop' }, 'o')],
		'10-03': [proper('columba-marmion', { en: 'Blessed Columba Marmion, priest' }, 'o')],
		'10-09': [proper('john-henry-newman', { en: 'Saint John Henry Newman, priest' }, 'o')],
		'10-11': [proper('canice', { en: 'Saint Canice, abbot' }, 'o')],
		'10-16': [proper('gall', { en: 'Saint Gall, abbot' }, 'o')],
		'10-27': [proper('otteran', { en: 'Saint Otteran, monk' }, 'o')],
		'10-29': [proper('colman-of-kilmacduagh', { en: 'Saint Colman of Kilmacduagh, bishop' }, 'o')],
		'11-03': [proper('malachy', { en: 'Saint Malachy, bishop' }, 'm')],
		'11-06': [proper('all-saints-of-ireland', { en: 'All Saints of Ireland' }, 'f')],
		'11-07': [proper('willibrord', { en: 'Saint Willibrord, bishop' }, 'o')],
		'11-14': [proper('laurence-o-toole', { en: 'Saint Laurence O’Toole, bishop' }, 'o')],
		'11-25': [proper('colman-of-cloyne', { en: 'Saint Colman of Cloyne, bishop' }, 'o')],
		'11-27': [proper('vergilius-of-salzburg', { en: 'Saint Vergilius of Salzburg, bishop' }, 'o')],
		'12-12': [proper('finnian', { en: 'Saint Finnian, bishop' }, 'o')],
		'12-18': [proper('flannan', { en: 'Saint Flannan, bishop' }, 'o', { colour: 'violet' })],
		'12-20': [proper('fachanan', { en: 'Saint Fachanan, bishop' }, 'o', { colour: 'violet' })]
	},
	overrides: {
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		columban: keptAs('m'),
		'cyril-methodius': keptAs('f'),
		patrick: keptAs('s', 'white'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'charles-lwanga': { to: '06-04' },
		'clement-i': { to: '11-25' },
		ephrem: { to: '06-10' },
		'martin-de-porres': { to: '11-05' },
		'peter-claver': { to: '09-10' }
	}
};
