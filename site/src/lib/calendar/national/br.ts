/**
 * Brazil — the General Roman Calendar as the Brazilian bishops' conference
 * keeps it.
 *
 * A national calendar is a LAYER and not a calendar (see `NationalCalendar`
 * in `../types.ts`): Universal Norms nn. 48–55 describe a particular calendar
 * as the general one with proper celebrations inserted, and a conference does
 * not restate the rest. So this file is only the four things Brazil actually
 * does — its transfers, its own saints, the general celebrations it keeps at
 * another rank, and the ones it keeps on another day — and no code at all.
 *
 * ## No Latin, and that is correct
 *
 * These celebrations were approved in Portuguese by the conference that has
 * them; there is no Latin original to reproduce, and composing one would be
 * exactly the invented text this project refuses to make (`docs/decisions.md`
 * §Scope, on critical editions). `celebrationName` falls back to Portuguese
 * for a reader of any other language, which is the name the celebration
 * actually has. GCatholic agrees: it publishes Brazil's calendar in English
 * and Portuguese and answers 404 for Latin.
 *
 * ## Everything here was measured
 *
 * Each entry below is present because the oracle showed Brazil's calendar
 * differing from the general one on a specific day — 36 days across 2025,
 * 2026 and 2027 (`pipeline/scrapers/calendar.py`). Nothing is here because a
 * list somewhere said Brazil venerates a saint; a celebration earns a row by
 * making a day come out differently.
 */

import { PRECEDENCE, type Celebration, type NationalCalendar } from '../types';

function proper(
	id: string,
	pt: string,
	en: string,
	rank: Celebration['rank'],
	precedence: Celebration['precedence'],
	colour: Celebration['colour'] = 'white'
): Celebration {
	return { id, names: { pt, en }, rank, precedence, colour, proper: true, source: 'proper' };
}

const m = PRECEDENCE.PROPER_MEMORIAL;
const o = PRECEDENCE.OPTIONAL_MEMORIAL;

export const BRAZIL: NationalCalendar = {
	id: 'br',
	// Epiphany and the Ascension are kept on Sundays; Corpus Christi stays on
	// its Thursday, which is a national holiday there.
	options: { epiphanyOnSunday: true, ascensionOnSunday: true },

	propers: {
		'06-09': [
			proper(
				'jose-de-anchieta',
				'São José de Anchieta, presbítero',
				'Saint José de Anchieta, Priest',
				'memorial',
				m
			)
		],
		'07-09': [
			proper(
				'paulina',
				'Santa Paulina do Coração Agonizante de Jesus, virgem',
				'Saint Pauline of the Agonizing Heart of Jesus, Virgin',
				'memorial',
				m
			)
		],
		'07-17': [
			proper(
				'inacio-de-azevedo',
				'Beatos Inácio de Azevedo, presbítero, e companheiros, mártires',
				'Blessed Ignatius de Azevedo, Priest, and Companions, Martyrs',
				'memorial',
				m,
				'red'
			)
		],
		'08-13': [
			proper(
				'dulce-lopes-pontes',
				'Santa Dulce Lopes Pontes, virgem',
				'Saint Dulce Lopes Pontes, Virgin',
				'memorial',
				m
			)
		],
		'10-03': [
			proper(
				'andre-de-soveral',
				'Santos André de Soveral, Ambrósio Francisco Ferro, presbíteros, e Companheiros, mártires',
				'Saints André de Soveral and Ambrósio Francisco Ferro, Priests, and Companions, Martyrs',
				'memorial',
				m,
				'red'
			)
		],
		'10-05': [
			proper(
				'benedito',
				'São Benedito, religioso',
				'Saint Benedict the Moor, Religious',
				'optional-memorial',
				o
			)
		],
		// The patroness of Brazil, and the only proper here that is a
		// solemnity — which is why it takes a Monday or a Tuesday whole, as
		// the oracle shows it doing in 2026 and 2027.
		'10-12': [
			proper(
				'aparecida',
				'Nossa Senhora da Conceição Aparecida',
				'Our Lady of the Conception, Aparecida',
				'solemnity',
				PRECEDENCE.PROPER_SOLEMNITY
			)
		],
		'10-19': [
			proper(
				'pedro-de-alcantara',
				'São Pedro de Alcântara, presbítero',
				'Saint Peter of Alcántara, Priest',
				'optional-memorial',
				o
			)
		],
		'10-25': [
			proper(
				'antonio-galvao',
				'Santo Antônio de Sant’Ana Galvão, presbítero',
				'Saint Anthony of Sant’Anna Galvão, Priest',
				'memorial',
				m
			)
		],
		'11-19': [
			proper(
				'roque-gonzalez',
				'Santos Roque González, Afonso Rodríguez e João del Castillo, presbíteros e mártires',
				'Saints Roque González, Alonso Rodríguez and Juan del Castillo, Priests and Martyrs',
				'memorial',
				m,
				'red'
			)
		]
	},

	/** Three general celebrations Brazil keeps at a higher rank than the
	 *  General Roman Calendar gives them. */
	overrides: {
		'our-lady-of-mount-carmel': { rank: 'feast', precedence: PRECEDENCE.PROPER_FEAST },
		'rose-of-lima': { rank: 'feast', precedence: PRECEDENCE.PROPER_FEAST },
		'our-lady-of-guadalupe': { rank: 'feast', precedence: PRECEDENCE.PROPER_FEAST }
	},

	/** Four general memorials displaced by a Brazilian proper on their own
	 *  date, each kept on the day before. */
	moves: {
		ephrem: { to: '06-08', displacedBy: 'jose-de-anchieta' },
		'augustine-zhao-rong': { to: '07-08', displacedBy: 'paulina' },
		// Omitted outright in Brazil in 2025; kept on the 12th from 2026.
		'pontian-hippolytus': { to: '08-12', since: 2026, displacedBy: 'dulce-lopes-pontes' },
		faustina: { to: '10-06', displacedBy: 'benedito' }
	},

	/**
	 * The three solemnities Brazil moves to a Sunday, listed year by year.
	 *
	 * A TABLE AND NOT A RULE — see `movedInYear` in `../types.ts` for the
	 * six measurements that rule out every rule tried. Years absent from a row
	 * keep the celebration on its own date, which is the general calendar's
	 * answer rather than a guess at the conference's.
	 *
	 * The empty years are as informative as the filled ones: Peter and Paul
	 * needed no move in 2025 because 29 June was already a Sunday, and All
	 * Saints stayed on Saturday 1 November 2025 rather than moving at all.
	 */
	movedInYear: {
		'peter-and-paul': { 2026: '06-28', 2027: '07-04' },
		assumption: { 2025: '08-17', 2026: '08-16' },
		'all-saints': { 2027: '11-07' }
	}
};
