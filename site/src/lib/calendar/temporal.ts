/**
 * The Proper of Time: every day of the liturgical year that the date of
 * Easter and the date of Christmas put there.
 *
 * ## The year is identified by the civil year its Easter falls in
 *
 * Liturgical year 2026 begins on the First Sunday of Advent in NOVEMBER 2025,
 * keeps Christmas in December 2025, and ends on the Saturday before Advent
 * 2026. Every function here takes that designation, so `anchors(2026)` is the
 * year a reader would call "2026" and `anchors(2026).adventStart` is a date in
 * 2025. Getting this backwards is the single easiest way to be wrong by a
 * year, so nothing takes a bare "year" without saying which one it means.
 *
 * ## Two cycles, one line each, and neither is guessable
 *
 * The Sunday lectionary runs A/B/C and the weekday lectionary I/II, both
 * turning over at Advent — so both belong to the liturgical year rather than
 * the civil one, and both are stated off the SAME designation. Year 2026 is
 * Sunday cycle A and weekday cycle II. These are asserted in `year.test.ts`
 * against published cycles rather than derived from a rule that reads well.
 *
 * ## What this module does not do
 *
 * It places celebrations; it does not decide which of two on one day is kept.
 * That is `resolveDay` in `year.ts`, working off the `precedence` each
 * celebration carries out of here. Keeping them apart is what lets the
 * precedence table be read against Universal Norms n. 59 in one place instead
 * of being spread through the construction of every season.
 */

import {
	type DayNumber,
	MONDAY,
	SUNDAY,
	after,
	before,
	easter,
	fromDayNumber,
	toDayNumber,
	weekday
} from './computus';
import { PRECEDENCE, type Celebration, type Colour, type Season } from './types';

/** The dates every other date in the year is measured from. */
export interface Anchors {
	/** The liturgical year's designation: the civil year of its Easter. */
	year: number;
	/** First Sunday of Advent — in civil year `year - 1`. */
	adventStart: DayNumber;
	christmas: DayNumber;
	holyFamily: DayNumber;
	maryMotherOfGod: DayNumber;
	epiphany: DayNumber;
	baptism: DayNumber;
	ashWednesday: DayNumber;
	easter: DayNumber;
	ascension: DayNumber;
	pentecost: DayNumber;
	trinity: DayNumber;
	corpusChristi: DayNumber;
	sacredHeart: DayNumber;
	immaculateHeart: DayNumber;
	maryMotherOfChurch: DayNumber;
	christTheKing: DayNumber;
	/** First Sunday of Advent of the NEXT year — the day after this one ends. */
	nextAdvent: DayNumber;
}

/** The First Sunday of Advent falling in civil year `civilYear`. */
export function adventSunday(civilYear: number): DayNumber {
	// The fourth Sunday before Christmas. Seeking the Sunday STRICTLY before
	// 25 December and stepping back three weeks is what makes a Christmas
	// that is itself a Sunday come out right: Advent IV is then 18 December,
	// not 25, and the season does not eat its own last week.
	return before(toDayNumber(civilYear, 12, 25), SUNDAY) - 21;
}

export function anchors(
	year: number,
	options: {
		epiphanyOnSunday?: boolean;
		ascensionOnSunday?: boolean;
		corpusChristiOnSunday?: boolean;
	} = {}
): Anchors {
	const pascha = easter(year);
	const christmas = toDayNumber(year - 1, 12, 25);

	// The Sunday within the Christmas octave, or 30 December when the octave
	// holds no Sunday — which happens exactly when Christmas is itself a
	// Sunday, since 26–31 December then runs Monday to Saturday.
	const sundayInOctave = after(christmas, SUNDAY);
	const holyFamily =
		sundayInOctave < toDayNumber(year, 1, 1) ? sundayInOctave : toDayNumber(year - 1, 12, 30);

	// Transferred, Epiphany is the Sunday falling 2–8 January.
	const epiphany = options.epiphanyOnSunday
		? after(toDayNumber(year, 1, 1), SUNDAY)
		: toDayNumber(year, 1, 6);

	// The Baptism of the Lord is the Sunday after Epiphany — except where a
	// transferred Epiphany has itself taken 7 or 8 January, when the Baptism
	// is the MONDAY immediately following. Without that clause the two would
	// be a week apart and Ordinary Time would start late; it is the reason
	// this is not simply `after(epiphany, SUNDAY)`.
	const epiphanyDom = fromDayNumber(epiphany).day;
	const baptism =
		options.epiphanyOnSunday && epiphanyDom >= 7 ? epiphany + 1 : after(epiphany, SUNDAY);

	const nextAdvent = adventSunday(year);

	return {
		year,
		adventStart: adventSunday(year - 1),
		christmas,
		holyFamily,
		maryMotherOfGod: toDayNumber(year, 1, 1),
		epiphany,
		baptism,
		ashWednesday: pascha - 46,
		easter: pascha,
		ascension: options.ascensionOnSunday ? pascha + 42 : pascha + 39,
		pentecost: pascha + 49,
		trinity: pascha + 56,
		corpusChristi: options.corpusChristiOnSunday ? pascha + 63 : pascha + 60,
		sacredHeart: pascha + 68,
		immaculateHeart: pascha + 69,
		maryMotherOfChurch: pascha + 50,
		christTheKing: nextAdvent - 7,
		nextAdvent
	};
}

/** The Sunday lectionary cycle of a liturgical year. */
export function sundayCycle(year: number): 'A' | 'B' | 'C' {
	// The three-year cycle turns over at Advent, so it belongs to the
	// liturgical year's designation and not to a civil year. 2026 is A.
	return (['C', 'A', 'B'] as const)[((year % 3) + 3) % 3];
}

/** The weekday lectionary cycle of a liturgical year. */
export function weekdayCycle(year: number): 'I' | 'II' {
	// Year I in liturgical years designated by an ODD civil year. 2025 is I
	// and 2026 is II — checked against published cycles in `year.test.ts`,
	// not reasoned from the name.
	return year % 2 === 0 ? 'II' : 'I';
}

/* ------------------------------------------------------------------ names */

const ROMAN = [
	'',
	'I',
	'II',
	'III',
	'IV',
	'V',
	'VI',
	'VII',
	'VIII',
	'IX',
	'X',
	'XI',
	'XII',
	'XIII',
	'XIV',
	'XV',
	'XVI',
	'XVII',
	'XVIII',
	'XIX',
	'XX',
	'XXI',
	'XXII',
	'XXIII',
	'XXIV',
	'XXV',
	'XXVI',
	'XXVII',
	'XXVIII',
	'XXIX',
	'XXX',
	'XXXI',
	'XXXII',
	'XXXIII',
	'XXXIV'
];

/**
 * English ordinal WORDS, because that is what the Missal prints — "Second
 * Sunday of Advent", never "2nd". A closed table to 34, which is as far as
 * Ordinary Time counts and therefore as far as anything here can ask.
 */
const ORDINAL_EN = [
	'',
	'First',
	'Second',
	'Third',
	'Fourth',
	'Fifth',
	'Sixth',
	'Seventh',
	'Eighth',
	'Ninth',
	'Tenth',
	'Eleventh',
	'Twelfth',
	'Thirteenth',
	'Fourteenth',
	'Fifteenth',
	'Sixteenth',
	'Seventeenth',
	'Eighteenth',
	'Nineteenth',
	'Twentieth',
	'Twenty-first',
	'Twenty-second',
	'Twenty-third',
	'Twenty-fourth',
	'Twenty-fifth',
	'Twenty-sixth',
	'Twenty-seventh',
	'Twenty-eighth',
	'Twenty-ninth',
	'Thirtieth',
	'Thirty-first',
	'Thirty-second',
	'Thirty-third',
	'Thirty-fourth'
];

/* Latin counts the week's days as ferias from Sunday, so Monday is the
   SECOND — `Feria II`. Saturday is `Sabbato` and never `Feria VII`. */
const FERIA_LA = [
	'Dominica',
	'Feria II',
	'Feria III',
	'Feria IV',
	'Feria V',
	'Feria VI',
	'Sabbato'
];
const DAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_PT = [
	'Domingo',
	'Segunda-feira',
	'Terça-feira',
	'Quarta-feira',
	'Quinta-feira',
	'Sexta-feira',
	'Sábado'
];

/** Portuguese ordinals are written as Roman numerals here, which is what the
 *  Brazilian and Portuguese liturgical books print ("Domingo II do Advento")
 *  and what avoids inventing thirty-four ordinal words for a third language. */
const SEASON_NAMES: Record<
	Exclude<Season, 'triduum'>,
	{ la: string; en: string; pt: string; ofLa: string }
> = {
	advent: { la: 'Adventus', en: 'Advent', pt: 'do Advento', ofLa: 'Adventus' },
	christmas: { la: 'Nativitatis', en: 'Christmas Time', pt: 'do Natal', ofLa: 'Nativitatis' },
	lent: { la: 'Quadragesimae', en: 'Lent', pt: 'da Quaresma', ofLa: 'Quadragesimae' },
	easter: { la: 'Paschae', en: 'Easter', pt: 'da Páscoa', ofLa: 'Paschae' },
	ordinary: {
		la: 'per annum',
		en: 'Ordinary Time',
		pt: 'do Tempo Comum',
		ofLa: 'per annum'
	}
};

function sundayOf(season: Exclude<Season, 'triduum'>, week: number): Celebration['names'] {
	const s = SEASON_NAMES[season];
	const inOf = season === 'ordinary' ? 'in' : 'of';
	return {
		la: `Dominica ${ROMAN[week]} ${s.ofLa}`,
		en: `${ORDINAL_EN[week]} Sunday ${inOf} ${s.en}`,
		pt: `Domingo ${ROMAN[week]} ${s.pt}`
	};
}

function weekdayOf(
	season: Exclude<Season, 'triduum'>,
	week: number,
	dow: number
): Celebration['names'] {
	const s = SEASON_NAMES[season];
	const inOf = season === 'ordinary' ? 'in' : 'of';
	return {
		la: `${FERIA_LA[dow]} hebdomadae ${ROMAN[week]} ${s.ofLa}`,
		en: `${DAY_EN[dow]} of the ${ORDINAL_EN[week]} Week ${inOf} ${s.en}`,
		pt: `${DAY_PT[dow]} da Semana ${ROMAN[week]} ${s.pt}`
	};
}

/* ----------------------------------------------------------- construction */

/** A temporal day before precedence is applied: its season, its week, and
 *  the celebration the Proper of Time puts on it. */
export interface TemporalDay {
	season: Season;
	week: number;
	celebration: Celebration;
}

function day(
	id: string,
	names: Celebration['names'],
	rank: Celebration['rank'],
	precedence: Celebration['precedence'],
	colour: Colour
): Celebration {
	return { id, names, rank, precedence, colour, source: 'temporal' };
}

/**
 * Every day from the First Sunday of Advent to the Saturday before the next,
 * keyed by day number.
 *
 * Built as a dense map rather than as a set of rules queried per date. A
 * liturgical year is about 365 entries and building it costs a fraction of a
 * millisecond, while the alternative — deciding a single date's season and
 * week from first principles — needs every boundary rule written twice, once
 * to place a day and once to recognise one. `year.ts` caches the result per
 * (year, options), so a reader paging through a month builds it once.
 */
export function temporalYear(a: Anchors): Map<DayNumber, TemporalDay> {
	const days = new Map<DayNumber, TemporalDay>();
	const put = (n: DayNumber, season: Season, week: number, celebration: Celebration) =>
		days.set(n, { season, week, celebration });

	/* --- Advent. Violet, and rose on Gaudete. --------------------------- */
	for (let n = a.adventStart; n < a.christmas; n++) {
		const week = Math.floor((n - a.adventStart) / 7) + 1;
		const dow = weekday(n);
		if (dow === SUNDAY) {
			put(
				n,
				'advent',
				week,
				day(
					`advent-${week}-sunday`,
					sundayOf('advent', week),
					'sunday',
					PRECEDENCE.PRINCIPAL,
					week === 3 ? 'rose' : 'violet'
				)
			);
			continue;
		}
		// From 17 December the weekdays have proper texts and rise to the
		// privileged class, which is what keeps an optional memorial from
		// displacing the O Antiphons' days.
		const { month, day: dom } = fromDayNumber(n);
		const late = month === 12 && dom >= 17;
		put(
			n,
			'advent',
			week,
			day(
				late ? `advent-dec-${dom}` : `advent-${week}-${dow}`,
				late
					? {
							la: `Die ${dom} decembris`,
							en: `${dom} December`,
							pt: `Dia ${dom} de dezembro`
						}
					: weekdayOf('advent', week, dow),
				'weekday',
				late ? PRECEDENCE.PRIVILEGED_WEEKDAY : PRECEDENCE.WEEKDAY,
				'violet'
			)
		);
	}

	/* --- Christmas Time, to the Baptism inclusive. ---------------------- */
	put(
		a.christmas,
		'christmas',
		1,
		day(
			'christmas',
			{ la: 'In Nativitate Domini', en: 'The Nativity of the Lord', pt: 'Natal do Senhor' },
			'solemnity',
			PRECEDENCE.PRINCIPAL,
			'white'
		)
	);
	for (let n = a.christmas + 1; n <= a.baptism; n++) {
		const { month, day: dom } = fromDayNumber(n);
		const dow = weekday(n);
		const inOctave = n < a.maryMotherOfGod;
		if (inOctave) {
			// Days 2–7 of the octave. The feasts of Stephen, John and the Holy
			// Innocents sit on three of them and come from `grc.ts`, where
			// they outrank this by the table rather than by a special case.
			const dayOfOctave = n - a.christmas + 1;
			put(
				n,
				'christmas',
				1,
				day(
					`christmas-octave-${dayOfOctave}`,
					{
						la: `De ${ROMAN[dayOfOctave]} die infra octavam Nativitatis`,
						en: `${ORDINAL_EN[dayOfOctave]} Day within the Octave of the Nativity`,
						pt: `${ROMAN[dayOfOctave]}º Dia da Oitava do Natal`
					},
					'weekday',
					PRECEDENCE.PRIVILEGED_WEEKDAY,
					'white'
				)
			);
			continue;
		}
		if (n === a.maryMotherOfGod) continue; // placed below, as a solemnity
		if (n === a.epiphany || n === a.baptism) continue; // likewise
		// Weekdays of Christmas Time from 2 January, named by their position
		// relative to Epiphany — which is how the Missal names them and what a
		// reader looking for "Thursday after Epiphany" expects.
		const beforeEpiphany = n < a.epiphany;
		put(
			n,
			'christmas',
			beforeEpiphany ? 1 : 2,
			day(
				beforeEpiphany ? `christmas-jan-${dom}` : `after-epiphany-${dow}`,
				beforeEpiphany
					? {
							la: `${FERIA_LA[dow]} temporis Nativitatis`,
							en: `${DAY_EN[dow]} of Christmas Time`,
							pt: `${DAY_PT[dow]} do Tempo do Natal`
						}
					: {
							la: `${FERIA_LA[dow]} post Epiphaniam`,
							en: `${DAY_EN[dow]} after Epiphany`,
							pt: `${DAY_PT[dow]} depois da Epifania`
						},
				'weekday',
				PRECEDENCE.WEEKDAY,
				'white'
			)
		);
		void month;
	}
	put(
		a.holyFamily,
		'christmas',
		1,
		day(
			'holy-family',
			{
				la: 'Sanctae Familiae Iesu, Mariae et Ioseph',
				en: 'The Holy Family of Jesus, Mary and Joseph',
				pt: 'Sagrada Família de Jesus, Maria e José'
			},
			'feast',
			// A feast OF THE LORD, which is why it takes a Sunday of Christmas
			// Time rather than yielding to it (n. 59, line 5 against line 6).
			PRECEDENCE.FEAST_OF_THE_LORD,
			'white'
		)
	);
	put(
		a.maryMotherOfGod,
		'christmas',
		1,
		day(
			'mary-mother-of-god',
			{
				la: 'Sanctae Dei Genetricis Mariae',
				en: 'The Blessed Virgin Mary, the Mother of God',
				pt: 'Santa Maria, Mãe de Deus'
			},
			'solemnity',
			PRECEDENCE.SOLEMNITY,
			'white'
		)
	);
	// The Second Sunday after Christmas exists only in years where a Sunday
	// falls between 2 January and the day before Epiphany. A transferred
	// Epiphany takes that Sunday, so in those years there is none.
	const secondSundayOfChristmas = after(a.maryMotherOfGod, SUNDAY);
	if (secondSundayOfChristmas < a.epiphany) {
		put(
			secondSundayOfChristmas,
			'christmas',
			2,
			day(
				'christmas-2-sunday',
				{
					la: 'Dominica II post Nativitatem',
					en: 'Second Sunday after the Nativity',
					pt: 'Domingo II depois do Natal'
				},
				'sunday',
				PRECEDENCE.SUNDAY,
				'white'
			)
		);
	}
	put(
		a.epiphany,
		'christmas',
		2,
		day(
			'epiphany',
			{ la: 'In Epiphania Domini', en: 'The Epiphany of the Lord', pt: 'Epifania do Senhor' },
			'solemnity',
			PRECEDENCE.PRINCIPAL,
			'white'
		)
	);
	put(
		a.baptism,
		'christmas',
		2,
		day(
			'baptism-of-the-lord',
			{
				la: 'In Baptismate Domini',
				en: 'The Baptism of the Lord',
				pt: 'Batismo do Senhor'
			},
			'feast',
			PRECEDENCE.FEAST_OF_THE_LORD,
			'white'
		)
	);

	/* --- Ordinary Time, first part. ------------------------------------ */
	// Week 1 has no Sunday of its own: the Baptism occupies it. So the count
	// starts from the Monday after, and the following Sunday opens week 2.
	const otStart = a.baptism + 1;
	for (let n = otStart; n < a.ashWednesday; n++) {
		const week = 1 + Math.floor((n - otStart + 1) / 7);
		putOrdinary(n, week);
	}

	function putOrdinary(n: DayNumber, week: number) {
		const dow = weekday(n);
		put(
			n,
			'ordinary',
			week,
			dow === SUNDAY
				? day(
						`ordinary-${week}-sunday`,
						sundayOf('ordinary', week),
						'sunday',
						PRECEDENCE.SUNDAY,
						'green'
					)
				: day(
						`ordinary-${week}-${dow}`,
						weekdayOf('ordinary', week, dow),
						'weekday',
						PRECEDENCE.WEEKDAY,
						'green'
					)
		);
	}

	/* --- Lent. --------------------------------------------------------- */
	put(
		a.ashWednesday,
		'lent',
		0,
		day(
			'ash-wednesday',
			{ la: 'Feria IV Cinerum', en: 'Ash Wednesday', pt: 'Quarta-feira de Cinzas' },
			'weekday',
			PRECEDENCE.PRINCIPAL,
			'violet'
		)
	);
	const lent1 = a.easter - 42;
	for (let n = a.ashWednesday + 1; n < lent1; n++) {
		const dow = weekday(n);
		put(
			n,
			'lent',
			0,
			day(
				`after-ashes-${dow}`,
				{
					la: `${FERIA_LA[dow]} post Cineres`,
					en: `${DAY_EN[dow]} after Ash Wednesday`,
					pt: `${DAY_PT[dow]} depois das Cinzas`
				},
				'weekday',
				PRECEDENCE.PRIVILEGED_WEEKDAY,
				'violet'
			)
		);
	}
	for (let n = lent1; n < a.easter - 3; n++) {
		const week = Math.floor((n - lent1) / 7) + 1;
		const dow = weekday(n);
		if (week === 6) {
			// Holy Week. Palm Sunday and Monday–Wednesday are all line 2; the
			// Triduum begins on Thursday and is placed below.
			put(
				n,
				'lent',
				6,
				dow === SUNDAY
					? day(
							'palm-sunday',
							{
								la: 'Dominica in Palmis de Passione Domini',
								en: 'Palm Sunday of the Passion of the Lord',
								pt: 'Domingo de Ramos na Paixão do Senhor'
							},
							'sunday',
							PRECEDENCE.PRINCIPAL,
							'red'
						)
					: day(
							`holy-week-${dow}`,
							{
								la: `${FERIA_LA[dow]} Hebdomadae Sanctae`,
								en: `${DAY_EN[dow]} of Holy Week`,
								pt: `${DAY_PT[dow]} da Semana Santa`
							},
							'weekday',
							PRECEDENCE.PRINCIPAL,
							'violet'
						)
			);
			continue;
		}
		put(
			n,
			'lent',
			week,
			dow === SUNDAY
				? day(
						`lent-${week}-sunday`,
						sundayOf('lent', week),
						'sunday',
						PRECEDENCE.PRINCIPAL,
						week === 4 ? 'rose' : 'violet'
					)
				: day(
						`lent-${week}-${dow}`,
						weekdayOf('lent', week, dow),
						'weekday',
						PRECEDENCE.PRIVILEGED_WEEKDAY,
						'violet'
					)
		);
	}

	/* --- The Paschal Triduum. ------------------------------------------ */
	put(
		a.easter - 3,
		'triduum',
		0,
		day(
			'holy-thursday',
			{
				la: 'Feria V in Cena Domini',
				en: 'Thursday of the Lord’s Supper',
				pt: 'Quinta-feira da Ceia do Senhor'
			},
			'weekday',
			PRECEDENCE.TRIDUUM,
			'white'
		)
	);
	put(
		a.easter - 2,
		'triduum',
		0,
		day(
			'good-friday',
			{
				la: 'Feria VI in Passione Domini',
				en: 'Friday of the Passion of the Lord',
				pt: 'Sexta-feira da Paixão do Senhor'
			},
			'weekday',
			PRECEDENCE.TRIDUUM,
			'red'
		)
	);
	put(
		a.easter - 1,
		'triduum',
		0,
		day(
			'holy-saturday',
			{ la: 'Sabbato Sancto', en: 'Holy Saturday', pt: 'Sábado Santo' },
			'weekday',
			PRECEDENCE.TRIDUUM,
			'white'
		)
	);

	/* --- Easter Time. -------------------------------------------------- */
	put(
		a.easter,
		'easter',
		1,
		day(
			'easter-sunday',
			{
				la: 'Dominica Paschae in Resurrectione Domini',
				en: 'Easter Sunday of the Resurrection of the Lord',
				pt: 'Domingo de Páscoa na Ressurreição do Senhor'
			},
			'sunday',
			PRECEDENCE.TRIDUUM,
			'white'
		)
	);
	for (let n = a.easter + 1; n < a.easter + 7; n++) {
		const dow = weekday(n);
		put(
			n,
			'easter',
			1,
			day(
				`easter-octave-${dow}`,
				{
					la: `${FERIA_LA[dow]} infra octavam Paschae`,
					en: `${DAY_EN[dow]} within the Octave of Easter`,
					pt: `${DAY_PT[dow]} da Oitava da Páscoa`
				},
				// "The eight days of the Octave of Easter are celebrated as
				// SOLEMNITIES of the Lord" (Universal Norms n. 24) — so the
				// rank is a solemnity even though nothing is named on the day.
				'solemnity',
				PRECEDENCE.PRINCIPAL,
				'white'
			)
		);
	}
	for (let n = a.easter + 7; n <= a.pentecost; n++) {
		const week = Math.floor((n - a.easter) / 7) + 1;
		const dow = weekday(n);
		if (dow === SUNDAY) {
			put(
				n,
				'easter',
				week,
				day(
					`easter-${week}-sunday`,
					week === 2
						? {
								la: 'Dominica II Paschae seu de divina Misericordia',
								en: 'Second Sunday of Easter, or of Divine Mercy',
								pt: 'Domingo II da Páscoa, ou da Divina Misericórdia'
							}
						: sundayOf('easter', week),
					'sunday',
					PRECEDENCE.PRINCIPAL,
					'white'
				)
			);
			continue;
		}
		put(
			n,
			'easter',
			week,
			day(
				`easter-${week}-${dow}`,
				weekdayOf('easter', week, dow),
				'weekday',
				PRECEDENCE.WEEKDAY,
				'white'
			)
		);
	}
	put(
		a.ascension,
		'easter',
		Math.floor((a.ascension - a.easter) / 7) + 1,
		day(
			'ascension',
			{
				la: 'In Ascensione Domini',
				en: 'The Ascension of the Lord',
				pt: 'Ascensão do Senhor'
			},
			'solemnity',
			PRECEDENCE.PRINCIPAL,
			'white'
		)
	);
	put(
		a.pentecost,
		'easter',
		8,
		day(
			'pentecost',
			{ la: 'Dominica Pentecostes', en: 'Pentecost Sunday', pt: 'Domingo de Pentecostes' },
			'solemnity',
			PRECEDENCE.PRINCIPAL,
			'red'
		)
	);

	/* --- Ordinary Time, second part. ----------------------------------- */
	// Counted BACKWARDS from the end, because the end is what is fixed: the
	// Saturday before Advent is always the last day of week 34, and the weeks
	// that Lent and Easter displaced are the ones missing from the middle. A
	// forward count from Pentecost would need the number of displaced weeks,
	// which is this subtraction anyway.
	const lastDay = a.nextAdvent - 1;
	for (let n = a.pentecost + 1; n <= lastDay; n++) {
		putOrdinary(n, 34 - Math.floor((lastDay - n) / 7));
	}
	put(
		a.trinity,
		'ordinary',
		34 - Math.floor((lastDay - a.trinity) / 7),
		day(
			'trinity',
			{
				la: 'Sanctissimae Trinitatis',
				en: 'The Most Holy Trinity',
				pt: 'Santíssima Trindade'
			},
			'solemnity',
			PRECEDENCE.SOLEMNITY,
			'white'
		)
	);
	put(
		a.corpusChristi,
		'ordinary',
		34 - Math.floor((lastDay - a.corpusChristi) / 7),
		day(
			'corpus-christi',
			{
				la: 'Sanctissimi Corporis et Sanguinis Christi',
				en: 'The Most Holy Body and Blood of Christ',
				pt: 'Santíssimo Corpo e Sangue de Cristo'
			},
			'solemnity',
			PRECEDENCE.SOLEMNITY,
			'white'
		)
	);
	put(
		a.sacredHeart,
		'ordinary',
		34 - Math.floor((lastDay - a.sacredHeart) / 7),
		day(
			'sacred-heart',
			{
				la: 'Sacratissimi Cordis Iesu',
				en: 'The Most Sacred Heart of Jesus',
				pt: 'Sagrado Coração de Jesus'
			},
			'solemnity',
			PRECEDENCE.SOLEMNITY,
			'white'
		)
	);
	put(
		a.christTheKing,
		'ordinary',
		34,
		day(
			'christ-the-king',
			{
				la: 'Domini nostri Iesu Christi universorum Regis',
				en: 'Our Lord Jesus Christ, King of the Universe',
				pt: 'Nosso Senhor Jesus Cristo, Rei do Universo'
			},
			'solemnity',
			PRECEDENCE.SOLEMNITY,
			'white'
		)
	);

	return days;
}

export { MONDAY };
