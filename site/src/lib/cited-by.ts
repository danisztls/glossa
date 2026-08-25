/**
 * The shapes and the one shared lookup behind the "Cited in" panel
 * (`components/CitedBy.svelte`).
 *
 * SEPARATE FROM THE COMPONENT because two callers need `citedSources` without
 * needing the markup, and because a Svelte module script is a poor place to
 * keep something worth unit-testing. The panel imports its types from here;
 * nothing here imports the panel.
 */
import { getDocumentGroup } from './corpus';
import { content } from './content.svelte';
import { hrefFor } from './address';

/** One reference inside a source group — "¶425", "§22". */
export interface CitedByRef {
	key: string | number;
	label: string;
	href: string;
}

/** A work citing this address, with every place in it that does. */
export interface CitedBySource {
	key: string;
	/** The short name shown in the row — "CCC", "Lumen Gentium". */
	label: string;
	/** The work's full name, shown on hover; `null` when it adds nothing. */
	fullTitle: string | null;
	refs: CitedByRef[];
}

/**
 * One address of the work being read.
 *
 * `href` absent means the address is real but not somewhere to jump — the
 * corpus's whole-chapter citation sentinel, which names no verse to scroll
 * to. `note` set means the address is cited but ABSENT from the edition in
 * front of the reader, which is a fact worth stating rather than a row worth
 * hiding; it renders as the same dotted-underline "there is more to read
 * here" affordance the rest of the site uses.
 */
export interface CitedByRow {
	key: string | number;
	label: string;
	href?: string;
	note?: string;
	sources: CitedBySource[];
}

/**
 * A citing document as one source group: its name in the edition this reader
 * would actually open, and its short title where the manifest has one —
 * "Lumen Gentium" rather than "Dogmatic Constitution on the Church Lumen
 * Gentium".
 *
 * A slug with no manifest at all yields `null` rather than a raw slug: it can
 * only mean the index outlived the work (switched off between builds), and a
 * bare slug is not something to put in front of a reader.
 *
 * A section is an anchor on the document's single page, not a page of its own
 * — the same `#s{n}` target `refs.ts` links to. It is also a previewable
 * address (`address.ts`), so hovering a section number shows the text itself
 * and not just its number.
 */
export function documentCitedSource(slug: string, sections: number[]): CitedBySource | null {
	const group = getDocumentGroup(slug);
	if (!group) return null;
	const lang = content.documentLangFor(slug);
	const manifest = group.manifests[lang] ?? Object.values(group.manifests)[0];
	if (!manifest) return null;
	const label = manifest.short_title || manifest.title;
	return {
		key: `doc:${slug}`,
		label,
		fullTitle: manifest.title !== label ? manifest.title : null,
		refs: sections.map((n) => ({
			key: n,
			label: `§${n}`,
			href: hrefFor({ kind: 'document', slug, n })
		}))
	};
}
