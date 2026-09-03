/**
 * The computed calendar, checked day by day against calendars computed by
 * somebody else.
 *
 * `pipeline/scrapers/calendar.py` fetches GCatholic's iCal feeds for three
 * years in eight transfer variants, plus Brazil, and writes them to
 * `./oracle/`. Every one of those days is compared here. What the oracle is
 * for, and why it is an oracle and not a source, is argued at the head of
 * that scraper; the short of it is that a liturgical calendar is the one kind
 * of output where being wrong looks exactly like being right, and the only
 * cure is a second opinion computed independently.
 *
 * ## What is compared, and what deliberately is not
 *
 * Compared: the season's shape by way of the RANK and the COLOUR of the day's
 * own celebration, the set of optional memorials offered on it, the psalter
 * week, and — for the fixed celebrations only — the Latin name.
 *
 * Not compared: the names of temporal days. Both calendars generate those
 * from a formula and the two formulae differ in case and in inflection
 * ("Feria II hebdomada I Paschæ" against "Feria II hebdomadae I Paschae"),
 * so a comparison would report a difference on some three hundred days a year
 * and mean nothing by any of them. The sanctorale is different: those names
 * are the Calendarium's own formulae, which both sides are reproducing rather
 * than composing, so a disagreement there is a real one.
 *
 * ## The one standing divergence
 *
 * GCatholic emits no rose. Gaudete and Laetare are violet in its feeds, with
 * "(Gaudete)" and "(Laetare)" in the name; this calendar computes rose, which
 * is what GIRM 346 §3 permits and what those two Sundays are known by. The
 * comparison accepts violet for a computed rose on exactly those two days and
 * fails on any other colour difference — a convention gap, named, rather than
 * a silent tolerance.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildYear } from './year';
import { parseIsoDate } from './computus';
import type { CalendarOptions, LiturgicalDay } from './types';
import { BRAZIL } from './national/br';

const ORACLE_DIR = join(dirname(fileURLToPath(import.meta.url)), 'oracle');

interface OracleCelebration {
	rank: string | null;
	colour: string;
	name: string;
}
interface OracleDay {
	date: string;
	psalter: string | null;
	celebrations: OracleCelebration[];
}
interface Oracle {
	year: number;
	calendar: string;
	anchorLang: string;
	transfers?: Record<string, boolean>;
	days: OracleDay[];
}

const files = readdirSync(ORACLE_DIR)
	.filter((f) => f.endsWith('.json'))
	.sort();

/** Roman numeral -> the psalter week's number. */
const PSALTER: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4 };

/**
 * Fold a Latin name to what two typesetters cannot disagree about.
 *
 * GCatholic prints the ligatures (`Mariæ`, `cœli`) and this calendar prints
 * the digraphs, which is a difference in the FONT of a name and not in the
 * name. Case and the abbreviating full stop go the same way — `Ss.` against
 * `SS.` — as do the accents Polish and Vietnamese names carry into a Latin
 * line. What survives is the letters, which is what a disagreement would have
 * to be about to be worth reporting.
 */
function fold(name: string): string {
	return name
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/æ/gi, 'ae')
		.replace(/œ/gi, 'oe')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, ' ')
		.trim();
}

/**
 * Latin names this calendar and GCatholic spell differently, both correctly.
 *
 * WHY A TABLE AND NOT A LOOSER COMPARISON. The point of checking names at all
 * is to catch the wrong saint on a day — a real defect that a rank-and-colour
 * check cannot see, because one optional memorial in white looks exactly like
 * another. A fuzzy match would tolerate that and a strict one reports these
 * twenty-one, none of which is a disagreement about which saint is meant:
 * they are alternative Latin forms of a name (`Lauretanae` for the shrine at
 * Loreto, `de Padua` against `de Padova`), the Missal's title against a
 * shorter one, or GCatholic's own abbreviating (`Ss.ᵐⁱ` for `Sanctissimi`,
 * `B. M. V.` spelled out). Naming each pair keeps the check strict everywhere
 * else, which is where its value is.
 *
 * The left column is what this site prints — the Roman Missal's form.
 */
const ACCEPTED_VARIANTS: ReadonlyArray<readonly [string, string]> = [
	['Beatae Mariae Virginis Guadalupensis', 'Beatæ Mariæ Virginis de Guadalupe'],
	['Beatae Mariae Virginis Lauretanae', 'Beatæ Mariæ Virginis de Loreto'],
	['De sancta Maria in sabbato', 'Beatæ Mariæ Virginis in Sabbato'],
	['In Passione S. Ioannis Baptistae', 'In Passione S. Ioannis Baptistæ, martyris'],
	['Sanctissimi Nominis Iesu', 'Ss.ᵐⁱ Nominis Iesu'],
	['Sanctissimi Nominis Mariae', 'Ss.ᵐⁱ Nominis Mariæ'],
	[
		'S. Antonii de Padua, presbyteri et Ecclesiae doctoris',
		'S. Antonii de Padova, presbyteri et Ecclesiæ doctoris'
	],
	['S. Augustini Cantuariensis, episcopi', 'S. Augustini Cantuarensis, episcopi'],
	[
		'S. Fidelis a Sigmaringa, presbyteri et martyris',
		'S. Fidelis a Sigmaringen, presbyteri et martyris'
	],
	['S. Ioannis Didaci Cuauhtlatoatzin', 'S. Ioannis Didaci Cuahtlatoatzin'],
	['S. Ioseph, Sponsi Beatae Mariae Virginis', 'S. Ioseph, sponsi B. M. V.'],
	[
		'S. Laurentii a Brundusio, presbyteri et Ecclesiae doctoris',
		'S. Laurentii de Brindisi, presbyteri et Ecclesiæ doctoris'
	],
	['S. Raymundi de Penyafort, presbyteri', 'S. Raimundi de Penyafort, presbyteri'],
	[
		'Ss. Andreae Kim Taegon, presbyteri, et Pauli Chong Hasang et sociorum, martyrum',
		'Ss. Andreæ Kim Tæ-gŏn, presbyteri, et Pauli Chŏng Ha-sang, et sociorum, martyrum'
	],
	[
		'Ss. Basilii Magni et Gregorii Nazianzeni, episcoporum et Ecclesiae doctorum',
		'Ss. Basilii et Gregorii Nazianzeni, episcoporum et Ecclesiæ doctorum'
	],
	['Ss. Laurentii Ruiz et sociorum, martyrum', 'S. Laurentii Ruiz et sociorum, martyrum'],
	['Ss. Protomartyrum sanctae Ecclesiae Romanae', 'Ss. Protomartyrum S. Romanæ Ecclesiæ'],
	[
		'Ss. Septem Fundatorum Ordinis Servorum Beatae Mariae Virginis',
		'Ss. Septem Fundatorum Ordinis Servorum'
	],
	['Ss. Xysti II, papae, et sociorum, martyrum', 'Ss. Xysti, papæ, et sociorum, martyrum'],
	['S. Turibii de Mogrovejo, episcopi', 'S. Turibii de Mongrovejo, episcopi'],
	['S. Wenceslai, martyris', 'S. Venceslai, martyris']
];

/** Folded `ours -> theirs`, built once. */
const VARIANT_OF = new Map(ACCEPTED_VARIANTS.map(([mine, theirs]) => [fold(mine), fold(theirs)]));

/** The options a `General-X` oracle was computed with. */
function optionsFor(oracle: Oracle): CalendarOptions {
	if (oracle.calendar === 'BR') return { nationalCalendar: BRAZIL };
	return {
		epiphanyOnSunday: oracle.transfers?.epiphanyOnSunday ?? false,
		ascensionOnSunday: oracle.transfers?.ascensionOnSunday ?? false,
		corpusChristiOnSunday: oracle.transfers?.corpusChristiOnSunday ?? false
	};
}

/**
 * A day's celebrations as `rank|colour` multisets, which is the comparison
 * that survives the two calendars ordering a day's optional memorials
 * differently — as they demonstrably do (22 June 2026, where the Latin feed
 * puts Paulinus before Fisher and More and the English puts them the other
 * way round).
 */
function shapeOf(rows: Array<{ rank: string | null; colour: string }>): string[] {
	return rows.map((r) => `${r.rank ?? 'day'}|${r.colour}`).sort();
}

/** What this calendar offers on a day, in the oracle's own vocabulary. */
function ours(
	day: LiturgicalDay
): Array<{ rank: string | null; colour: string; name: string; pt?: string; source?: string }> {
	const asOracle = (c: (typeof day)['celebration'], principal: boolean) => ({
		// The oracle leaves the day's own celebration unranked when it is a
		// Sunday or a weekday, and — see ALL_SOULS below — when it is the
		// Commemoration of All the Faithful Departed, which its vocabulary has
		// no word for.
		rank:
			principal && (c.rank === 'sunday' || c.rank === 'weekday' || c.id === 'all-souls')
				? null
				: c.rank,
		colour: c.colour,
		name: c.names.la ?? c.names.pt ?? c.names.en ?? '',
		source: c.source
	});
	return [asOracle(day.celebration, true), ...day.optional.map((c) => asOracle(c, false))];
}

describe('the computed calendar against GCatholic', () => {
	it('has an oracle to check against', () => {
		expect(files.length).toBeGreaterThan(0);
	});

	for (const file of files) {
		const oracle: Oracle = JSON.parse(readFileSync(join(ORACLE_DIR, file), 'utf8'));
		const options = optionsFor(oracle);

		describe(file.replace(/\.json$/, ''), () => {
			// One built year serves every assertion below. The oracle is a
			// CIVIL year and a liturgical year is not, so days from January to
			// Advent come from the liturgical year of the same name and the
			// December tail from the next one.
			const built = new Map<number, ReturnType<typeof buildYear>>();
			const dayFor = (iso: string): LiturgicalDay | undefined => {
				const n = parseIsoDate(iso)!;
				for (const y of [oracle.year, oracle.year + 1]) {
					if (!built.has(y)) built.set(y, buildYear(y, options));
					const hit = built.get(y)!.get(n);
					if (hit) return hit;
				}
				return undefined;
			};

			it('answers for every day of the civil year', () => {
				const missing = oracle.days.filter((d) => !dayFor(d.date)).map((d) => d.date);
				expect(missing).toEqual([]);
			});

			it('agrees about rank and colour on every day', () => {
				const wrong: string[] = [];
				for (const od of oracle.days) {
					const day = dayFor(od.date);
					if (!day) continue;
					const mine = ours(day);
					const theirs = shapeOf(od.celebrations);
					let shape = shapeOf(mine);
					// The one named divergence: GCatholic has no rose.
					if (day.colour === 'rose') {
						shape = shapeOf(
							mine.map((r) => (r.colour === 'rose' ? { ...r, colour: 'violet' } : r))
						);
					}
					if (String(shape) !== String(theirs)) {
						wrong.push(
							`${od.date}\n    ours:   ${shape.join(', ')}\n    theirs: ${theirs.join(', ')}` +
								`\n    names:  ${mine.map((m) => m.name).join(' / ')}` +
								`\n    their names: ${od.celebrations.map((c) => c.name).join(' / ')}`
						);
					}
				}
				expect(wrong.join('\n  ')).toBe('');
			});

			it('agrees about the psalter week on every day', () => {
				const wrong: string[] = [];
				for (const od of oracle.days) {
					const day = dayFor(od.date);
					if (!day || od.psalter === null) continue;
					if (day.psalterWeek !== PSALTER[od.psalter]) {
						wrong.push(`${od.date}: ours ${day.psalterWeek}, theirs ${od.psalter}`);
					}
				}
				expect(wrong.join('\n  ')).toBe('');
			});

			it('agrees about the name of every celebration it names', () => {
				const wrong: string[] = [];
				for (const od of oracle.days) {
					const day = dayFor(od.date);
					if (!day) continue;
					const theirs = new Set(od.celebrations.map((c) => fold(c.name)));
					for (const mine of ours(day)) {
						// Temporal days are formula-named on both sides and the
						// formulae differ; only the fixed celebrations, whose
						// names are the Calendarium's own, are compared.
						if (mine.source === 'temporal') continue;
						// A Portuguese-anchored oracle (Brazil) can only check the
						// names Brazil itself approved. Its Portuguese for a
						// GENERAL celebration is GCatholic's translation and this
						// site's is the Missal's, so comparing those two would
						// report a difference on every saint and mean nothing.
						const name = oracle.anchorLang === 'pt' ? (mine.pt ?? mine.name) : mine.name;
						if (oracle.anchorLang === 'pt' && mine.source !== 'proper') continue;
						const folded = fold(name);
						if (theirs.has(folded)) continue;
						const variant = VARIANT_OF.get(folded);
						if (variant !== undefined && theirs.has(variant)) continue;
						wrong.push(
							`${od.date}: ours "${name}" is not among ` +
								od.celebrations.map((c) => `"${c.name}"`).join(', ')
						);
					}
				}
				expect(wrong.join('\n  ')).toBe('');
			});
		});
	}
});
