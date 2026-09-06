/**
 * The calendar's names in the twenty languages `grc.ts` and `temporal.ts` do
 * not carry, one lazily-loaded module per language.
 *
 * Each module holds two things: a table keyed by celebration id — the General
 * Roman Calendar's 218, and the twenty-one days of the Proper of Time the
 * Missal names outright — and the pieces the other 285 days of the year are
 * composed from, since a formula cannot be transcribed as a string.
 *
 * ## Why they are not in `grc.ts`
 *
 * Because of what they weigh. `ROWS` carries Latin, English and Portuguese
 * for 218 celebrations in about 30 KB; the twenty languages here build to
 * twenty chunks and 277 KB (2026-09-06, `npm run build`), and a reader uses
 * exactly one of them — about 14 KB, 5 KB over the wire. That is the
 * accounting `i18n.svelte.ts` already does for the interface dictionaries —
 * the cost of a language is paid by the reader who picks it — and a table of
 * saints' names is the same kind of thing as a table of button labels.
 *
 * `import.meta.glob` for the same reasons it gives: statically analyzable, so
 * Vite emits one chunk per file; and a language is added by dropping a file
 * in, so there is no list here to drift from the directory.
 *
 * ## Where they came from
 *
 * `pipeline/scrapers/liturgical_calendar.py` fetches every calendar GCatholic
 * publishes, in every edition it publishes them in, and a NATIONAL calendar is
 * the General Roman Calendar plus that conference's propers — so the whole
 * sanctorale rides in on the Italian edition of Italy's calendar, the Korean
 * edition of Korea's, and so on. `General-A` through `General-H` would not do
 * it: GCatholic publishes those in Latin, English and Portuguese, which are
 * the three this project already had.
 *
 * THE JOIN KEY IS `DESCRIPTION` AND NOT POSITION. Every non-English edition
 * parenthesises the English name at the head of `DESCRIPTION`, and that is the
 * only thing in the feeds that identifies a celebration across languages: the
 * order inside a day genuinely differs between editions — 9 October puts Denis
 * first in Korean and last in Italian, and `liturgical_calendar.py` records
 * the same of 22 June in Latin against English. Joining on position gives
 * Paulinus of Nola the martyrs' name and reads perfectly while doing it.
 *
 * ## The 285 days a year that are named by a rule
 *
 * The larger half, and the one that cannot be transcribed. Of the 365 days of
 * 2026, 80 carry a name of their own and 285 are composed — every Sunday and
 * every ferial weekday, `Tuesday of the 11th Week in Ordinary Time`. Storing
 * those as strings is about 390 rows a language where the sanctorale is 218,
 * and three years of feeds show only ~345 of them: the ninth week of Ordinary
 * Time has no Sunday in 2025, 2026 or 2027, and the seventh of Easter is the
 * Ascension nearly everywhere.
 *
 * SO THE FEED IS SOLVED FOR ITS PIECES rather than copied. Two names that
 * differ in one slot differ in one substring, which locates the slots; what is
 * left over is the pattern. Fifteen of them — a Sunday and a weekday in each
 * of four seasons, Holy Week, the days after Ash Wednesday, the two halves of
 * Christmas Time, the Octave of Easter and the Octave of Christmas — over a
 * shared table of six weekdays and thirty-four week numerals, with an override
 * wherever a language declines one of them differently here than it does on an
 * ordinary weekday (`NameForm` in `types.ts`; Polish's Monday of Holy Week is
 * `Wielki Poniedziałek`). About 1.5 KB a language, against 40 KB for the
 * table it replaces. The solve is CHECKED by rebuilding every string the feeds
 * carry out of the pieces, which is what makes an unobserved week safe.
 *
 * AND A SOLVE THAT REBUILDS THE FEED EXACTLY IS THE WRONG ONE WHERE THE FEED
 * IS WRONG. Four defects turned up, each stated identically in every year and
 * every territory, so none of them is a stray character to be voted away:
 * GCatholic's Lithuanian numbers the sixth and seventh weeks of Easter `II`,
 * its Indonesian numbers the second week of Advent `III`, its Vietnamese sets
 * a stray `i` into the thirty-second week of Ordinary Time, and its Croatian
 * prints `3. tjedna kroz godinu` for the thirteenth week. The first three are
 * outvoted inside the weekday family, where Ordinary Time counts thirty-four
 * weeks against Advent's three. THE FOURTH IS OVERRULED RATHER THAN OUTVOTED
 * (2026-09-06): the week has one witness and it is wrong, so the answer comes
 * from outside the feeds — Banjaluka numbers 28 June to 5 July 2026 the XIII,
 * and every other entry in that column is its own digits. It was DROPPED
 * until then, on the reasoning that a slot with no good witness is better
 * left to English; what retired that is that a second witness was a search
 * away, and thirteen weekdays a year is not a rounding error.
 *
 * NOTHING FALLS BACK ANY MORE, and the four languages that used to are the
 * argument for looking twice. Croatian, Maltese, Dutch and Swedish number
 * their Sundays differently from their weekdays, so a Sunday numeral has to
 * be witnessed as a Sunday — and each had two to four it could not fill.
 * TWO OF THOSE WERE IN THE FEEDS ALL ALONG: Advent 3 and Lent 4 are Gaudete
 * and Laetare, the two days this project paints rose and GCatholic paints
 * violet, and the solve passed over them for it. The rest genuinely have no
 * witness — Malta keeps the Ascension on the Sunday, so Eastertide week 7 has
 * no Sunday there at all, and Ordinary Time's ninth Sunday needs an earlier
 * Easter than 2025, 2026 or 2027 gave — and those were settled against the
 * conferences' own pages, in the wording of the column they join.
 * `names.test.ts` asserts the fallback list is EMPTY over thirty-seven years,
 * because a table that stopped composing looks on the page exactly like a
 * language that never had one.
 *
 * THE EIGHT DAYS OF ADVENT NAMED BY THEIR DATE ARE NOT TRANSCRIBED AT ALL.
 * `temporal.ts` calls 19 December `19 December`, which is a date and not a
 * formula, and `Intl` writes a date in all twenty of these languages — where
 * GCatholic's own feeds set `Décembre 17` and `Dicembre 17`, its English
 * template applied to a French and an Italian month. That is the one name here
 * that is computed rather than read (`decemberDate`).
 *
 * ## The two things these are not
 *
 * THEY ARE NOT CHECKED. `oracle.test.ts` compares the names this project
 * computes against the names GCatholic publishes, in Latin; these names ARE
 * the ones GCatholic publishes, so running that comparison over them would
 * assert nothing. That is the circularity `site/docs/calendar.md` names for a
 * derived country, arriving here in its pure form.
 *
 * AND THEY ARE NOT A CONFERENCE'S BOOK — they are GCatholic's edition of one.
 * The distance is measurable exactly where this project has a second witness
 * and nowhere else: against `ROWS`, GCatholic differs on 19 of the 218 Latin
 * names, 36 of the English and 48 of the Portuguese (`Blase` for `Blaise`,
 * `Peñafort` for `Penyafort`, `Lurdes` for `Lourdes`, and its own house style
 * of lowercasing `bishop and martyr`). Every one of those is a correction this
 * project made by hand and can go on making, because it holds the Missal's
 * wording in those three languages. In the twenty here it does not, so what is
 * served is the source uncorrected — which is worth more than English, and
 * less than a book.
 */
import { untrack } from 'svelte';
import { bcp47 } from '$lib/ui-langs';
import type { NameForm, NameParts, NameTable, TemporalNames } from './types';

/**
 * One module per language under `./names/`, none of them statically imported.
 *
 * Unlike `i18n.svelte.ts` there is no exclusion: English is not among these,
 * because English is in `ROWS` and is the fallback every miss lands on.
 */
const loaders = import.meta.glob<Record<string, unknown>>('./names/*.ts');

/** The languages a module exists for, which is what `ensure` will answer to. */
export const NAMED_LANGS: readonly string[] = Object.keys(loaders)
	.map((path) => path.slice('./names/'.length, -'.ts'.length))
	.sort();

/**
 * The tables resolved so far. Never evicted, for `i18n.svelte.ts`'s reason:
 * the whole set is a few hundred KB even if a reader visits every language,
 * and switching back is not worth a second request.
 */
const loaded: Record<string, Record<string, string>> = $state({});
const loadedTemporal: Record<string, TemporalNames> = $state({});

/**
 * Load one language's table if it exists and is not resident yet.
 *
 * Silent on a language with no module — the twenty here are the ones
 * GCatholic publishes a calendar in, and the other fourteen interface
 * languages are a fallback to English rather than a bug to report.
 */
export async function ensureCelebrationNames(lang: string): Promise<void> {
	const base = lang.split('-')[0];
	const loader = loaders[`./names/${base}.ts`];
	if (!loader || untrack(() => loaded[base])) return;
	const module = await loader();
	loaded[base] = module[base] as Record<string, string>;
	loadedTemporal[base] = module[`${base}Temporal`] as TemporalNames;
}

/**
 * A celebration's name in `lang` IF THAT TABLE IS RESIDENT, without fetching.
 *
 * Read from inside a render, so it never starts a request nobody is waiting
 * for — the same rule `loadedDictionary` follows. A miss falls through to the
 * chain in `celebrationName`, which ends in English and then Latin, and the
 * `$state` above means the name re-renders when the chunk lands.
 */
export function residentCelebrationName(lang: string, id: string): string | undefined {
	return loaded[lang.split('-')[0]]?.[id];
}

/**
 * Fill one pattern's `{day}`, `{week}` and `{nth}` from the language's tables.
 *
 * Returns undefined rather than a half-filled string wherever a piece is
 * missing — three years of feeds do not show every week of every season, so a
 * hole is ordinary and the answer for that day is English (`NameTable`). The
 * form's own tables win over the shared ones where it carries any: Polish
 * names Monday of Holy Week `Wielki Poniedziałek` and every other Monday
 * `Poniedziałek`.
 */
function fill(
	form: NameForm,
	shared: TemporalNames,
	values: Partial<Record<'day' | 'week' | 'nth', number>>
): string | undefined {
	const spec = typeof form === 'string' ? { form, days: undefined, weeks: undefined } : form;
	const tables: Record<string, NameTable> = {
		day: spec.days ?? shared.days,
		week: spec.weeks ?? shared.weeks,
		nth: shared.octave
	};
	let out = '';
	let rest = spec.form;
	for (;;) {
		const at = rest.indexOf('{');
		if (at < 0) return out + rest;
		const end = rest.indexOf('}', at);
		const slot = rest.slice(at + 1, end) as 'day' | 'week' | 'nth';
		const n = values[slot];
		const word = n === undefined ? undefined : tables[slot]?.[n];
		if (word === undefined) return undefined;
		out += rest.slice(0, at) + word;
		rest = rest.slice(end + 1);
	}
}

/**
 * The eight days of Advent that are named by their date and not by a rule.
 *
 * The one name here that is not transcribed. `temporal.ts` calls 19 December
 * `19 December` and `Dia 19 de dezembro`, which is a date rather than a
 * formula, and `Intl` writes a date in every one of these languages already —
 * where GCatholic's own feeds set `Décembre 17` and `Dicembre 17`, its English
 * template applied to a French and an Italian month. Transcribing those would
 * be transcribing a defect.
 *
 * The year is arbitrary and never printed; December is month 11, and `UTC`
 * keeps the day from sliding under a reader west of Greenwich.
 */
function decemberDate(lang: string, dom: number): string | undefined {
	try {
		return new Intl.DateTimeFormat(bcp47(lang), {
			day: 'numeric',
			month: 'long',
			timeZone: 'UTC'
		}).format(new Date(Date.UTC(2001, 11, dom)));
	} catch {
		return undefined;
	}
}

/**
 * A formulaic day's name in `lang` IF THAT TABLE IS RESIDENT, without fetching.
 *
 * `residentCelebrationName`'s rule and its reasons exactly, for the 285 days a
 * year that have no name of their own to look up. The parts come off the
 * celebration (`NameParts`), so nothing here parses an id.
 */
export function residentTemporalName(lang: string, parts: NameParts): string | undefined {
	const base = lang.split('-')[0];
	const t = loadedTemporal[base];
	if (!t) return undefined;
	switch (parts.kind) {
		case 'sunday':
			return fill(t.sunday[parts.season], t, { week: parts.week });
		case 'weekday':
			return fill(t.weekday[parts.season], t, { week: parts.week, day: parts.dow });
		case 'holy-week':
			return fill(t.holyWeek, t, { day: parts.dow });
		case 'after-ashes':
			return fill(t.afterAshes, t, { day: parts.dow });
		case 'after-epiphany':
			return fill(t.afterEpiphany, t, { day: parts.dow });
		case 'christmas-weekday':
			return fill(t.christmasWeekday, t, { day: parts.dow });
		case 'easter-octave':
			return fill(t.easterOctave, t, { day: parts.dow });
		case 'christmas-octave':
			return fill(t.christmasOctave, t, { nth: parts.nth });
		case 'december':
			return decemberDate(base, parts.dom);
	}
}
