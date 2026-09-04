/**
 * Sweden — the General Roman Calendar as Sweden’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Sweden actually does
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
 * A proper carries the name its conference approved, in sv, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const SWEDEN: NationalCalendar = {
	id: 'se',
	options: { corpusChristiOnSunday: true },
	propers: {
		'01-18': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{
					sv: 'Årsdagen av domkyrkans invigning',
					en: 'Anniversary of the Dedication of the Cathedral'
				},
				'f'
			)
		],
		'01-19': [
			proper(
				'henry-of-finland',
				{ sv: 'S:t Henrik, biskop och martyr', en: 'Saint Henry of Finland, bishop and martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'02-04': [
			proper(
				'nils-hermansson',
				{ sv: 'Den salige Nils Hermansson, biskop', en: 'Blessed Nils Hermansson, bishop' },
				'o'
			)
		],
		'02-15': [
			proper('sigfrid', { sv: 'S:t Sigfrid av Växjö, biskop', en: 'Saint Sigfrid, bishop' }, 'o')
		],
		'05-18': [
			proper(
				'eric-of-sweden',
				{ sv: 'S:t Erik, konung och martyr', en: 'Saint Eric of Sweden, martyr' },
				'f',
				{ colour: 'red' }
			)
		],
		'05-21': [
			proper(
				'hemming',
				{ sv: 'Den salige Hemming av Åbo, biskop', en: 'Saint Hemming, bishop' },
				'o'
			)
		],
		'06-04': [
			proper(
				'elizabeth-hesselblad',
				{
					sv: 'S:ta Maria Elisabeth Hesselblad, ordenskvinna',
					en: 'Saint Elizabeth Hesselblad, virgin'
				},
				'm'
			)
		],
		'06-12': [
			proper(
				'eskil',
				{ sv: 'S:t Eskil, biskop och martyr', en: 'Saint Eskil, bishop and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'06-25': [
			proper(
				'david-of-munktorp',
				{ sv: 'S:t David av Munktorp, abbot', en: 'Saint David of Munktorp, abbot' },
				'o'
			)
		],
		'07-10': [
			proper(
				'canute-of-denmark',
				{ sv: 'S:t Knut, konung och martyr', en: 'Saint Canute of Denmark, martyr' },
				'm',
				{ colour: 'red' }
			)
		],
		'07-20': [proper('thorlak', { sv: 'S:t Thorlak, biskop', en: 'Saint Thorlak, bishop' }, 'm')],
		'07-23': [
			proper(
				'heavenly-birthday-of-saint-bridget',
				{
					sv: 'S:ta Birgittas himmelska födelsedag',
					en: 'The Heavenly Birthday of Saint Bridget, religious'
				},
				'o'
			)
		],
		'07-28': [
			proper('botvid', { sv: 'S:t Botvid, martyr', en: 'Saint Botvid, martyr' }, 'o', {
				colour: 'red'
			})
		],
		'07-29': [
			proper('olaf', { sv: 'S:t Olav, konung och martyr', en: 'Saint Olaf, martyr' }, 'm', {
				colour: 'red'
			})
		],
		'07-30': [
			proper(
				'helena-of-skovde',
				{ sv: 'S:ta Elin av Skövde, martyr', en: 'Saint Helena of Skövde, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'08-02': [
			proper(
				'catherine-of-vadstena',
				{ sv: 'S:t Eusebius av Vercelli, biskop', en: 'Saint Catherine of Vadstena, virgin' },
				'o'
			)
		],
		'08-16': [
			proper(
				'brynolf-of-skara',
				{ sv: 'S:t Brynolf av Skara, biskop', en: 'Saint Brynolf of Skara, bishop' },
				'o'
			)
		],
		'09-02': [
			proper(
				'holy-crown-of-thorns',
				{ sv: 'Herrens törnekrona', en: 'The Holy Crown of Thorns' },
				'o'
			)
		],
		'09-24': [
			proper(
				'all-saints-of-sweden',
				{ sv: 'Alla Sveriges skyddshelgon', en: 'All Saints of Sweden' },
				'o'
			)
		],
		'10-09': [
			proper(
				'ingrid-of-skanninge',
				{ sv: 'S:t Giovanni Leonardi, präst', en: 'Saint Ingrid of Skänninge, religious' },
				'o'
			)
		],
		'11-25': [
			proper(
				'niels-steensen',
				{ sv: 'Den salige Niels Stensen, biskop', en: 'Blessed Niels Steensen, bishop' },
				'o'
			)
		]
	},
	movable: [
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{
					sv: 'Vår Herre Jesus Kristus, den evige Översteprästen',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	overrides: {
		ansgar: keptAs('m'),
		benedict: keptAs('f'),
		bridget: keptAs('s'),
		'catherine-of-siena': keptAs('f'),
		'cyril-methodius': keptAs('f'),
		'martin-de-porres': keptAs('m'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		apollinaris: { to: '07-19' },
		blaise: { to: '02-01' },
		bridget: { to: '10-07' },
		'john-i': { to: '05-19' },
		'martha-mary-lazarus': { to: '07-27' },
		'our-lady-of-the-rosary': { to: '10-08' }
	},
	movedInYear: {
		'presentation-of-the-lord': { 2026: '02-08', 2027: '02-07' }
	}
};
