/**
 * Formatting for the corpus's dates.
 *
 * There is exactly one kind of date in this corpus — a document's
 * `promulgated` — and it is a CALENDAR date, not an instant: `1891-05-15`
 * says which day Rerum Novarum was promulgated, and that day is the same day
 * in Lisbon, São Paulo and Sydney. It carries no time and no timezone
 * because it never had one.
 *
 * That distinction is load-bearing rather than pedantic. `new Date('2026-05-15')`
 * parses a bare ISO date as UTC MIDNIGHT (ECMA-262 §21.4.3.2 — date-only
 * forms are UTC, date-time forms without an offset are local), and
 * `Intl.DateTimeFormat` then renders that instant in the viewer's own zone.
 * Anywhere west of Greenwich, midnight UTC is still the previous evening, so
 * the date renders a day early: at UTC-3 the line above prints "May 14,
 * 2026". Portuguese readers are the site's second audience and Brazil is
 * UTC-3, so this was not a hypothetical — every promulgation date on the
 * site was off by one for them.
 *
 * Pinning `timeZone: 'UTC'` formats the instant in the same zone it was
 * parsed in, which round-trips the calendar date unchanged for every
 * reader. Formatting the string's parts by hand would work too; this is
 * less code and keeps `Intl`'s per-locale month names and date order, which
 * is the whole reason for using it.
 *
 * Shared rather than copied: this existed as three separate identical
 * `formatDate` functions (the home page, the Magisterium library, and a
 * document's landing page), which meant the bug existed three times and
 * would have had to be found three times.
 */

import { bcp47 } from './ui-langs';

/**
 * The locale to hand `Intl` for a date in a reader's interface language, or
 * `en-US` where the platform has no data for it.
 *
 * IT USED TO BE `lang.startsWith('pt') ? 'pt-PT' : 'en-US'`, written when the
 * site had two interface languages and left standing as it grew past thirty.
 * A Polish reader was being shown "November 18, 1965" not because anyone
 * decided Polish dates were out of scope but because the branch had never
 * been revisited, and `Intl` has had the month names all along — which is the
 * reason the module docblock above gives for using `Intl` in the first place.
 *
 * ASKING `supportedLocalesOf` RATHER THAN TRYING THE TAG AND HOPING. A tag
 * `Intl` cannot resolve does not throw and does not fall back to English: it
 * falls back to the RUNTIME'S default locale, so a Latin reader on a French
 * machine would get French month names in a Latin interface. That failure is
 * silent and it is not one a reader could report intelligibly, so the tag is
 * checked before it is used. Latin is the standing case — no CLDR data — and
 * `en-US` is the same fallback the rest of the chrome takes.
 *
 * THE REGION IS CUT AND THE SCRIPT IS NOT, and the two halves of that are
 * separate facts. `pt-BR` → `pt` because the reader chose an interface
 * language and not a country, and their region is not something this site
 * knows. But `zht` must NOT be cut to `zh`: it is this app's slug for
 * Traditional Chinese, `bcp47` is what turns it into the `zh-Hant` `Intl` can
 * resolve, and cutting first would hand `Intl` a tag it answers for with
 * Simplified. So the region goes, then `bcp47` runs — which is also why this
 * is the one `Intl` call site the shim reaches through a helper rather than
 * inline (`i18n.test.ts` scans for it, and allows this name).
 */
export function dateLocale(lang: string): string {
	const tag = bcp47(lang.split('-')[0]);
	return Intl.DateTimeFormat.supportedLocalesOf([tag])[0] ?? 'en-US';
}

/**
 * A promulgation date in the reader's UI language, e.g. "May 15, 2026" /
 * "15 de maio de 2026".
 *
 * Falls back to the raw ISO string if it doesn't parse, rather than
 * rendering "Invalid Date" — same "leave it untouched over mangling it"
 * posture as `titles.ts` and `document-labels.ts` take for values they
 * don't recognize. The corpus should never contain such a date; if one
 * appears, showing it verbatim is what makes the defect visible.
 */
export function formatPromulgated(iso: string, lang: string): string {
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return iso;
	return new Intl.DateTimeFormat(dateLocale(lang), {
		dateStyle: 'long',
		timeZone: 'UTC'
	}).format(d);
}
