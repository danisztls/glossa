/**
 * Algeria — the General Roman Calendar as Algeria’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Algeria actually does
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
 * A proper carries the name its conference approved, in fr, and the English rendering GCatholic prints beside it. There is no Latin original — the celebration was approved in the vernacular — and composing one would be exactly the invented text this project refuses (`docs/decisions.md` §Scope).
 */

import { keptAs, proper } from './common';
import type { NationalCalendar } from '../types';

export const ALGERIA: NationalCalendar = {
	id: 'dz',
	options: { epiphanyOnSunday: true, corpusChristiOnSunday: true },
	propers: {
		'01-03': [
			proper(
				'fulgentius-of-ruspe',
				{ fr: 'Saint Fulgence de Ruspe, évêque', en: 'Saint Fulgentius of Ruspe, bishop' },
				'm'
			)
		],
		'01-08': [
			proper(
				'quodvultdeus-and-saint-deogratias',
				{
					fr: 'Saint Quodvultdeus et Saint Deogratias, évêques',
					en: 'Saint Quodvultdeus and Saint Deogratias, bishops'
				},
				'o'
			)
		],
		'04-30': [
			proper(
				'mother-of-africa',
				{ fr: 'Notre-Dame d’Afrique', en: 'Our Lady Mother of Africa' },
				's'
			)
		],
		'05-06': [
			proper(
				'james',
				{
					fr: 'Saint Jacques, diacre et Saint Marien, lecteur et leurs compagnons, martyrs',
					en: 'Saint James, deacon, Saint Marianus and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'06-04': [
			proper(
				'optatus-of-milevis',
				{ fr: 'Saint Optat de Milev, évêque', en: 'Saint Optatus of Milevis, bishop' },
				'm'
			)
		],
		'06-26': [
			proper(
				'josemaria-escriva-de-balaguer',
				{
					fr: 'Saint Josemaria Escrivá de Balaguer, prêtre',
					en: 'Saint Josemaría Escrivá de Balaguer, priest'
				},
				'o'
			)
		],
		'07-10': [
			proper(
				'marciana-of-mauretania',
				{
					fr: 'Sainte Marcienne de Dellys, vierge et martyre',
					en: 'Saint Marciana of Mauretania, virgin and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-17': [
			proper(
				'speratus-and-companions',
				{
					fr: 'Saint Spérat et ses compagnons, martyrs Scillitains',
					en: 'Saint Speratus and companions, martyrs of Scillium'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'09-10': [
			proper(
				'nemesian',
				{
					fr: 'Saint Némésianus, évêque, et ses compagnons, martyrs',
					en: 'Saint Nemesian, bishop, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-12': [
			proper(
				'marcellinus-of-carthage',
				{ fr: 'Saint Marcellin de Carthage, martyr', en: 'Saint Marcellinus of Carthage, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'10-30': [
			proper(
				'marcellus-of-tangier-and-saint-maximilian-of-numidia',
				{
					fr: 'Saint Marcel et Saint Maximilien, martyrs',
					en: 'Saint Marcellus of Tangier and Saint Maximilian of Numidia, martyrs'
				},
				'm',
				{ colour: 'red' }
			)
		],
		'12-01': [
			proper(
				'charles-de-foucauld',
				{ fr: 'Saint Charles de Foucauld, prêtre', en: 'Saint Charles de Foucauld, priest' },
				'o'
			)
		],
		'12-05': [
			proper('crispina', { fr: 'Sainte Crispine, martyre', en: 'Saint Crispina, martyr' }, 'm', {
				colour: 'red'
			})
		]
	},
	overrides: {
		augustine: keptAs('s'),
		'cornelius-cyprian': keptAs('s'),
		'francis-xavier': keptAs('f'),
		monica: keptAs('f'),
		'perpetua-felicity': keptAs('f', 'red'),
		'therese-of-lisieux': keptAs('f')
	}
};
