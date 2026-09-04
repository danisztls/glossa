/**
 * Luxembourg — the General Roman Calendar as Luxembourg’s bishops keep it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar` in
 * `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar as
 * the general one with proper celebrations inserted, and a conference does not
 * restate the rest. So this file is only what Luxembourg actually does
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

export const LUXEMBOURG: NationalCalendar = {
	id: 'lu',
	options: { corpusChristiOnSunday: true },
	propers: {
		'01-03': [
			proper(
				'irmine-of-trier',
				{ fr: 'Le Saint Nom de Jésus', en: 'Saint Irmine of Trier, religious' },
				'o'
			)
		],
		'01-07': [
			proper(
				'valentine-of-raetia',
				{ fr: 'Saint Valentin de Rhétie, évêque', en: 'Saint Valentine of Raetia, bishop' },
				'o'
			)
		],
		'01-08': [
			proper(
				'severin-of-noricum',
				{ fr: 'Saint Sévérin du Norique, religieuse', en: 'Saint Severin of Noricum, religious' },
				'o'
			)
		],
		'01-21': [
			proper(
				'meinrad-of-einsiedeln',
				{
					fr: 'Sainte Agnès, vierge et martyre',
					en: 'Saint Meinrad of Einsiedeln, hermit and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'01-23': [
			proper(
				'henry-suso',
				{ fr: 'Bienheureux Henri Suso, prêtre', en: 'Blessed Henry Suso, priest' },
				'o'
			)
		],
		'02-04': [
			proper(
				'rabanus-maurus',
				{ fr: 'Saint Rabanus Maurus, évêque', en: 'Saint Rabanus Maurus, bishop' },
				'o'
			)
		],
		'02-20': [
			proper(
				'francisco-marto-and-saint-jacinta-marto',
				{
					fr: 'Saint Francisco Marto et Sainte Jacinta Marto',
					en: 'Saint Francisco Marto and Saint Jacinta Marto'
				},
				'o'
			)
		],
		'02-25': [
			proper('walburga', { fr: 'Sainte Walburge, abbesse', en: 'Saint Walburga, abbess' }, 'o')
		],
		'03-06': [
			proper(
				'fridolin-of-sackingen',
				{ fr: 'Saint Fridolin de Säckingen, moine', en: 'Saint Fridolin of Säckingen, monk' },
				'o',
				{ colour: 'violet' }
			)
		],
		'03-09': [
			proper(
				'bruno-of-querfurt',
				{
					fr: 'Saint Bruno de Querfurt, évêque et martyr',
					en: 'Saint Bruno of Querfurt, bishop and martyr'
				},
				'o',
				{ colour: 'violet' }
			)
		],
		'03-14': [
			proper('mathilda', { fr: 'Sainte Mathilde', en: 'Saint Mathilda' }, 'o', { colour: 'violet' })
		],
		'03-15': [
			proper(
				'clement-mary-hofbauer',
				{ fr: 'Saint Clément Maria Hofbauer, prêtre', en: 'Saint Clement Mary Hofbauer, priest' },
				'o',
				{ colour: 'violet' }
			)
		],
		'03-17': [
			proper('gertrude', { fr: 'Saint Patrice, évêque', en: 'Saint Gertrude, abbess' }, 'o', {
				colour: 'violet'
			})
		],
		'04-19': [proper('leo-ix', { fr: 'Saint Léon IX, pape', en: 'Saint Leo IX, pope' }, 'o')],
		'04-21': [
			proper(
				'conrad-of-parzham',
				{ fr: 'Saint Conrad de Parzham, religieux', en: 'Saint Conrad of Parzham, religious' },
				'o'
			)
		],
		'05-04': [
			proper(
				'florian-and-companions',
				{
					fr: 'Saint Florian et ses compagnons, martyrs',
					en: 'Saint Florian and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-05': [
			proper(
				'gotthard-of-hildesheim',
				{ fr: 'Saint Godehard de Hildesheim, évêque', en: 'Saint Gotthard of Hildesheim, bishop' },
				'o'
			)
		],
		'05-16': [
			proper(
				'john-of-nepomuk',
				{
					fr: 'Saint Jean Népomucène, prêtre et martyr',
					en: 'Saint John of Nepomuk, priest and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'05-21': [
			proper(
				'hermann-joseph',
				{ fr: 'Saint Hermann Joseph, prêtre', en: 'Saint Hermann Joseph, priest' },
				'o'
			)
		],
		'06-15': [proper('vitus', { en: 'Saint Vitus, martyr' }, 'o', { colour: 'red' })],
		'06-16': [proper('benno', { fr: 'Saint Benno, évêque', en: 'Saint Benno, bishop' }, 'o')],
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
		'06-27': [proper('hemma-of-gurk', { fr: 'Sainte Emma', en: 'Saint Hemma of Gurk' }, 'o')],
		'06-30': [
			proper(
				'otto-of-bamberg',
				{ fr: 'Saint Othon de Bamberg, évêque', en: 'Saint Otto of Bamberg, bishop' },
				'o'
			)
		],
		'07-04': [
			proper(
				'ulrich-of-augsburg',
				{ fr: 'Sainte Élisabeth de Portugal', en: 'Saint Ulrich of Augsburg, bishop' },
				'o'
			)
		],
		'07-07': [
			proper('willibald', { fr: 'Saint Willibald, évêque', en: 'Saint Willibald, bishop' }, 'o')
		],
		'07-08': [
			proper(
				'kilian',
				{
					fr: 'Saint Kilian, évêque, et ses compagnons, martyrs',
					en: 'Saint Kilian, bishop, and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-10': [
			proper(
				'canute-iv',
				{
					fr: 'Saint Knud IV, Saint Éric IX, martyrs, et Saint Olaf II',
					en: 'Saint Canute IV, Saint Eric IX, martyrs, and Saint Olaf II'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-20': [
			proper(
				'margaret-of-antioch',
				{
					fr: 'Sainte Marguerite d’Antioche, martyre',
					en: 'Saint Margaret of Antioch, virgin and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'07-24': [
			proper(
				'christopher',
				{ fr: 'Saint Christophe, martyr', en: 'Saint Christopher, martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'08-11': [
			proper(
				'schecelin',
				{ fr: 'Bienheureux Schetzel, ermite', en: 'Blessed Schecelin, hermit' },
				'o'
			)
		],
		'08-29': [
			proper(
				'anniversary-of-the-dedication-of-the-cathedral',
				{
					fr: 'Anniversaire de la Dédicace de la Cathédrale',
					en: 'Anniversary of the Dedication of the Cathedral'
				},
				'f'
			)
		],
		'08-31': [
			proper(
				'paulinus-of-trier',
				{
					fr: 'Saint Paulin de Trier, évêque et martyr',
					en: 'Saint Paulinus of Trier, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-18': [
			proper(
				'lambert-of-maastricht',
				{
					fr: 'Saint Lambert de Maastricht, évêque et martyr',
					en: 'Saint Lambert of Maastricht, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-22': [
			proper(
				'maurice-of-agaune-and-companions',
				{
					fr: 'Saint Maurice d’Agaune et ses compagnons, martyrs',
					en: 'Saint Maurice of Agaune and companions, martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'09-24': [
			proper(
				'rupert-and-saint-vergilius',
				{
					fr: 'Saint Rupert et Saint Virgil, évêques',
					en: 'Saint Rupert and Saint Vergilius, bishops'
				},
				'o'
			)
		],
		'09-25': [
			proper(
				'nicholas-of-flue',
				{ fr: 'Saint Nicholas de Flüe, ermite', en: 'Saint Nicholas of Flüe, hermit' },
				'o'
			)
		],
		'09-28': [proper('leoba', { fr: 'Sainte Lioba, abbesse', en: 'Saint Leoba, abbess' }, 'o')],
		'10-16': [proper('gall', { fr: 'Saint Gall, abbé', en: 'Saint Gall, abbot' }, 'o')],
		'10-20': [
			proper(
				'wendelin-of-trier',
				{ fr: 'Saint Wendelin, ermite', en: 'Saint Wendelin of Trier, hermit' },
				'o'
			)
		],
		'10-21': [
			proper(
				'ursula-and-companions',
				{
					fr: 'Sainte Ursule et ses compagnes, vierges et martyrs',
					en: 'Saint Ursula and companions, virgins and martyrs'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'10-31': [
			proper('wolfgang', { fr: 'Saint Wolfgang, évêque', en: 'Saint Wolfgang, bishop' }, 'o')
		],
		'11-03': [
			proper(
				'hubertus-of-liege',
				{ fr: 'Saint Hubert de Liège, évêque', en: 'Saint Hubertus of Liège, bishop' },
				'o'
			),
			proper(
				'pirmin',
				{ fr: 'Saint Pirmin, abbé et évêque', en: 'Saint Pirmin, abbot and bishop' },
				'o'
			)
		],
		'11-06': [
			proper(
				'leonard-of-noblac',
				{ fr: 'Saint Leonard de Noblat, ermite', en: 'Saint Leonard of Noblac, abbot' },
				'o'
			)
		],
		'11-07': [
			proper('willibrord', { fr: 'Saint Willibrord, évêque', en: 'Saint Willibrord, bishop' }, 'f')
		],
		'11-15': [
			proper(
				'leopold',
				{ fr: 'Saint Léopold, margrave d’Autriche', en: 'Saint Leopold, Margrave of Austria' },
				'o'
			)
		],
		'11-26': [
			proper(
				'conrad-and-saint-gebhard',
				{
					fr: 'Saint Conrad et Saint Gebhard, évêques',
					en: 'Saint Conrad and Saint Gebhard, bishops'
				},
				'o'
			)
		],
		'12-02': [
			proper(
				'lucius-of-chur',
				{
					fr: 'Saint Lucius de Coire, évêque et martyr',
					en: 'Saint Lucius of Chur, bishop and martyr'
				},
				'o',
				{ colour: 'red' }
			)
		],
		'12-04': [
			proper(
				'barbara',
				{ fr: 'Sainte Barbe, vierge et martyr', en: 'Saint Barbara, virgin and martyr' },
				'o',
				{ colour: 'red' }
			)
		],
		'12-05': [
			proper(
				'anno-of-cologne',
				{ fr: 'Saint Anno de Cologne, évêque', en: 'Saint Anno of Cologne, bishop' },
				'o'
			)
		],
		'12-13': [
			proper(
				'odilia-of-alsace',
				{ fr: 'Sainte Odile de Hohenbourg, abbesse', en: 'Saint Odilia of Alsace, abbess' },
				'o'
			)
		]
	},
	movable: [
		{
			at: { fromEaster: 76 },
			celebration: proper(
				'consoler-of-the-afflicted',
				{
					fr: 'La Vierge Marie Consolatrice des Affligés',
					en: 'Our Lady Consoler of the Afflicted'
				},
				's'
			)
		},
		{
			at: { fromEaster: 53 },
			celebration: proper(
				'our-lord-jesus-christ',
				{
					fr: 'Jésus Christ, grand-prêtre éternel',
					en: 'Our Lord Jesus Christ, the Eternal High Priest'
				},
				'f'
			)
		}
	],
	observances: [
		{
			at: { fromEaster: 50 },
			observance: {
				id: 'holy-spirit',
				names: { fr: 'L’Esprit Saint', en: 'The Holy Spirit' },
				colour: 'red'
			}
		}
	],
	overrides: {
		agnes: keptAs('o'),
		benedict: keptAs('f'),
		bridget: keptAs('f'),
		'catherine-of-siena': keptAs('f'),
		clare: keptAs('o'),
		'cyril-methodius': keptAs('f'),
		lucy: keptAs('o'),
		'peter-canisius': keptAs('o', 'white'),
		'teresa-benedicta': keptAs('f')
	},
	moves: {
		'elizabeth-of-hungary': { to: '11-19' },
		gertrude: { to: '11-17' },
		matthias: { to: '02-24' },
		'peter-canisius': { to: '04-27' },
		visitation: { to: '07-02' }
	}
};
