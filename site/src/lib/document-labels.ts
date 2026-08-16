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
	'cdf-declaration': 'document.kind.cdfDeclaration'
};

const KIND_PLURAL_KEYS: Record<string, string> = {
	'conciliar-constitution': 'document.kindPlural.conciliarConstitution',
	'conciliar-decree': 'document.kindPlural.conciliarDecree',
	'conciliar-declaration': 'document.kindPlural.conciliarDeclaration',
	encyclical: 'document.kindPlural.encyclical',
	'apostolic-exhortation': 'document.kindPlural.apostolicExhortation',
	'apostolic-constitution': 'document.kindPlural.apostolicConstitution',
	'cdf-declaration': 'document.kindPlural.cdfDeclaration'
};

/** Singular label for one document's kind — falls back to the raw
 *  `document_kind` string for a kind this table doesn't recognize yet
 *  (a new family landing ahead of a UI update), same "leave it untouched
 *  over mangling it" posture `titles.ts` documents for its own fallback. */
export function documentKindLabel(kind: string): string {
	const key = KIND_KEYS[kind];
	return key ? t(key) : kind;
}

/** Plural label for a document kind, e.g. "encyclical" -> "Encyclicals". */
export function documentKindPluralLabel(kind: string): string {
	const key = KIND_PLURAL_KEYS[kind];
	return key ? t(key) : documentKindLabel(kind);
}
