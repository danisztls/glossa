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
	return new Intl.DateTimeFormat(lang.startsWith('pt') ? 'pt-PT' : 'en-US', {
		dateStyle: 'long',
		timeZone: 'UTC'
	}).format(d);
}
