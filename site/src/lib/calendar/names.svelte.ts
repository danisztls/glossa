/**
 * The General Roman Calendar's celebration names in the twenty languages
 * `grc.ts` does not carry, one lazily-loaded module per language.
 *
 * ## Why they are not in `grc.ts`
 *
 * Because of what they weigh. `ROWS` carries Latin, English and Portuguese
 * for 218 celebrations in about 30 KB; the twenty languages here are 239 KB
 * more, 57 KB of it after gzip, and a reader uses exactly one of them. That is
 * the accounting `i18n.svelte.ts` already does for the interface dictionaries
 * — the cost of a language is paid by the reader who picks it — and a table
 * of saints' names is the same kind of thing as a table of button labels.
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

/**
 * One module per language under `./names/`, none of them statically imported.
 *
 * Unlike `i18n.svelte.ts` there is no exclusion: English is not among these,
 * because English is in `ROWS` and is the fallback every miss lands on.
 */
const loaders = import.meta.glob<Record<string, Record<string, string>>>('./names/*.ts');

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
	loaded[base] = module[base];
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
