/**
 * Human-readable labels for a document's `document_kind` (docs/corpus-
 * schema.md §Documents) — a small set today (the three Vatican II kinds
 * plus `encyclical`), but the schema's own field comment anticipates more
 * (`apostolic-exhortation`, `apostolic-constitution`, `cdf-declaration`, …)
 * as later phases of `docs/research/vatican-documents.md`'s scraping plan
 * land. i18n keys, not a hardcoded string table, so the label follows the
 * reader's UI language like everything else in the chrome — `document_kind`
 * itself is corpus DATA (never translated, same posture as a document's own
 * title), but "what kind of document is this" is UI, and gets translated.
 *
 * `documentKindLabel` names ONE document ("Constitution"); the singular is
 * what `/documents` and `/documents/{slug}` show per-item. The home page's
 * Magisterium group needs a different thing — one row per document FAMILY,
 * not per document (see `routes/+page.svelte`) — and reaches for
 * `documentFamilyPluralLabel` instead, keyed by `document_kind` rather than
 * `family` because that's the field that's actually uniform within a family
 * in practice (every `encyclical.*` work has `document_kind: "encyclical"`).
 */

import { t } from './i18n.svelte';

const KIND_KEYS: Record<string, string> = {
	'conciliar-constitution': 'document.kind.conciliarConstitution',
	'conciliar-decree': 'document.kind.conciliarDecree',
	'conciliar-declaration': 'document.kind.conciliarDeclaration',
	encyclical: 'document.kind.encyclical',
	'apostolic-exhortation': 'document.kind.apostolicExhortation',
	'apostolic-constitution': 'document.kind.apostolicConstitution',
	// The doctrinal-office kinds. Every one carries the `CDF ` prefix its
	// label already had, including the four documents the Dicastery issued
	// under its post-2022 name: this is a FACET in `/documenta`, and `cdf-`
	// declaration next to `conciliar-declaration` needs the prefix to stay a
	// distinguishable filter. Which body issued a given document is a
	// separate field — `pontiff_or_council`, printed under its title, and it
	// says Congregation or Dicastery per the promulgation date.
	'cdf-declaration': 'document.kind.cdfDeclaration',
	'cdf-instruction': 'document.kind.cdfInstruction',
	'cdf-letter': 'document.kind.cdfLetter',
	'cdf-doctrinal-note': 'document.kind.cdfDoctrinalNote',
	'cdf-responsum': 'document.kind.cdfResponsum',
	'cdf-considerations': 'document.kind.cdfConsiderations'
};

/** Singular label for one document's kind — falls back to the raw
 *  `document_kind` string for a kind this table doesn't recognize yet
 *  (a new family landing ahead of a UI update), same "leave it untouched
 *  over mangling it" posture `titles.ts` documents for its own fallback. */
export function documentKindLabel(kind: string): string {
	const key = KIND_KEYS[kind];
	return key ? t(key) : kind;
}

/**
 * The names one issuing body has held, folded to the one it holds now.
 *
 * `pontiff_or_council` is corpus data and stays exactly as promulgated — a
 * document issued in 2016 was issued by the *Congregation* for the Doctrine of
 * the Faith, and its masthead says so, because that is a fact about the
 * document. What is NOT a fact about the document is that this makes two
 * bodies: *Praedicate Evangelium* renamed the Congregation to a Dicastery in
 * 2022, and `/documenta`'s author facet was showing the doctrinal office as
 * two options — 188 documents under one name and 12 under the other — so no
 * click reached the body's work whole. Every other office on that list will
 * eventually do the same thing; the curia is renamed regularly.
 *
 * SO THIS FOLDS THE FACET AND TOUCHES NOTHING ELSE. The label is the current
 * name because that is what the body is called; the search box still reads the
 * raw field, so a reader who types "Congregation" still finds the documents
 * that say it. This is a display grouping over data that is left alone, which
 * is the same posture `titles.ts` takes towards a title it cannot parse.
 */
const RENAMED_BODIES: Record<string, string> = {
	'Congregation for the Doctrine of the Faith': 'Dicastery for the Doctrine of the Faith'
};

/** The facet value a document's issuing body belongs to. Identity for every
 *  body that has not been renamed, which is all but one of them today. */
export function documentAuthorKey(author: string): string {
	return RENAMED_BODIES[author] ?? author;
}
