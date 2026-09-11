/**
 * The sources line under a topic's editorial note, as text and links.
 *
 * THE NOTE IS THE ONE PARAGRAPH ON THIS SITE THAT RESTS ON NOBODY ELSE'S
 * AUTHORITY, so it is the one that owes a reader the means to check it
 * (`site/docs/topics.md`). That line named its units in words for a fortnight,
 * and the reason it gave was a fact about `linkifyProse` dressed as a fact
 * about the line: the prose grammar refuses a bare siglum, so `CCC 1385` would
 * not resolve where `(CIC, can. 1374)` would, and an apparatus that links the
 * canons and not the Catechism is worse than none.
 *
 * TRUE OF THE SCANNER, AND IRRELEVANT HERE, WHICH IS THE WHOLE POINT OF THIS
 * MODULE. `linkifyProse` is written to read somebody else's text, where what a
 * number is has to be INFERRED and a wrong inference is a wrong link
 * (`site/docs/references.md`). This site wrote the note. Nothing about it is
 * inferred: `Topic.editorialSources` names the units, so each one is an
 * `Address` before it is a word, and the label is written by `citationFor` —
 * the same writer `/signata` uses, in the reader's own language and out of the
 * index tier, so a Portuguese reader is offered `CIC 1385` for the Catechism
 * and `Cân. 1374` for the canon and neither can be read as the other, the
 * ambiguity that made the scanner unusable in that language being an ambiguity
 * only a scanner can have.
 *
 * THE RUNNING PARAGRAPHS STAY PLAIN, and that is not an omission. A paragraph
 * of argument dotted with links is read as a list of links; the note is meant
 * to be read through, and its one forward reference stays in words ("CCC 1385,
 * printed below") because the page prints that paragraph a few centimetres
 * down with its number already a link.
 */

import { hrefFor, type Address } from './address';
import { bcp47 } from './ui-langs';
import type { EditorialSources } from './types';

/** The one placeholder a sources string carries. Every translation of
 *  `quaestiones.{slug}.editorial.sources` must keep it, which
 *  `quaestiones.test.ts` checks in every dictionary that has the key — a
 *  translation that dropped it would silently publish a note with no
 *  apparatus, and nothing else would say so. */
export const SOURCES_PLACEHOLDER = '{sources}';

export interface SourceLink {
	href: string;
	label: string;
}

/** A run of the line: text as the dictionary wrote it, or one citation. */
export type SourceLinePart = { text: string } | { link: SourceLink };

/**
 * The units the note can be checked against, as addresses.
 *
 * IN THE ORDER THE PAGE PRINTS THE BLOCKS THEY BELONG TO — the Catechism, the
 * Social Doctrine, the Code, then the documents — which is a rule rather than
 * a judgement, and is why the field needs no ordering of its own. A reader
 * following the line downward meets each source in the order it names them.
 * Ascending inside each work, because a list of numbers from one work that is
 * not in order reads as a mistake in a way a page of passages does not: the
 * page has `lead` and says when it has used it, and a footing has nothing to
 * say and nothing to disclose.
 */
export function editorialSourceAddresses(sources: EditorialSources): Address[] {
	const ascending = (numbers: readonly number[] | undefined) =>
		[...(numbers ?? [])].sort((a, b) => a - b);
	return [
		...ascending(sources.ccc).map((n): Address => ({ kind: 'ccc', n })),
		...ascending(sources.csdc).map((n): Address => ({ kind: 'socialDoctrine', n })),
		...ascending(sources.canons).map((n): Address => ({ kind: 'canonLaw', n })),
		...(sources.documents ?? []).map((slug): Address => ({ kind: 'document', slug }))
	];
}

/** The href for each address, paired with a label a caller has written.
 *  Split from the labelling so this module stays free of the dictionary and
 *  the corpus registries `citationFor` reads. */
export function sourceLinks(
	addresses: readonly Address[],
	label: (a: Address) => string
): SourceLink[] {
	return addresses.map((address) => ({ href: hrefFor(address), label: label(address) }));
}

/**
 * The line, spliced.
 *
 * `Intl.ListFormat` AND NOT A SEPARATOR, because the separator is the part a
 * translator would otherwise have to carry: English joins the last two with
 * `and` and Portuguese with `e`, Spanish changes `y` to `e` before an `i`
 * sound, and several languages punctuate a two-item list differently from a
 * longer one. `formatToParts` is what makes it usable with links in it — the
 * elements come back marked, so the sentinel each one is formatted under is
 * replaced by the citation and every literal between them is the platform's
 * own punctuation.
 *
 * The sentinel is a NUL plus an index rather than the label itself: a label is
 * not unique (one topic may cite a canon its neighbour cites too), and one
 * containing the list's own separator would be split by the search that found
 * it. A NUL occurs in no dictionary string and in no corpus title.
 *
 * A template with NO placeholder keeps its text and loses its links, which is
 * the safe direction for a line whose text is somebody's translation — and the
 * test is what stops it being the shipped one.
 *
 * @param template `quaestiones.{slug}.editorial.sources`, in the reader's own
 *   language, carrying `{sources}` where the citations go.
 * @param lang the INTERFACE tag as the store holds it — `i18n.lang`. The
 *   conversion is done here rather than asked of the caller, because `zht` is
 *   structurally valid and `Intl` answers it in the platform's default locale
 *   instead of throwing, so a caller that forgot would be wrong in silence
 *   (`ui-langs.ts`, and the source scan in `i18n.test.ts`).
 */
export function editorialSourceLine(
	template: string,
	links: readonly SourceLink[],
	lang: string
): SourceLinePart[] {
	const at = template.indexOf(SOURCES_PLACEHOLDER);
	if (at === -1 || links.length === 0) return template ? [{ text: template }] : [];

	const parts: SourceLinePart[] = [];
	const before = template.slice(0, at);
	if (before) parts.push({ text: before });

	const formatted = new Intl.ListFormat(bcp47(lang), {
		style: 'long',
		type: 'conjunction'
	}).formatToParts(links.map((_, i) => `\u0000${i}`));
	for (const part of formatted) {
		if (part.type === 'element') parts.push({ link: links[Number(part.value.slice(1))] });
		else if (part.value) parts.push({ text: part.value });
	}

	const after = template.slice(at + SOURCES_PLACEHOLDER.length);
	if (after) parts.push({ text: after });
	return parts;
}
