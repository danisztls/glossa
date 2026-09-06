/**
 * The shapes and the one shared lookup behind the "Cited in" panel
 * (`components/CitedBy.svelte`).
 *
 * SEPARATE FROM THE COMPONENT because four callers need `citedSources`
 * without needing the markup, and because a Svelte module script is a poor
 * place to keep something worth unit-testing. The panel imports its types
 * from here; nothing here imports the panel.
 */
import { getCanonicalBook, getDocumentGroup, getPrayerMeta, getWork } from './corpus';
import { content, type WorkTypeKey } from './content.svelte';
import { hrefFor, summaPartSlug } from './address';
import { baseLang } from './lang-names';
import type { Citer } from './types';

/** One reference inside a source group — "¶425", "§22". */
export interface CitedByRef {
	key: string | number;
	label: string;
	href: string;
}

/**
 * The shelf a citing work sits on, and the unit the panel's filter toggles.
 *
 * COARSER THAN `Citer['kind']` ON PURPOSE. Eight kinds is a menu; what a
 * reader wants of a Bible verse cited two hundred times is "show me the
 * magisterium" or "hide the commentary", and the Catechism and its Compendium
 * are one answer to that question rather than two. Every kind belongs to
 * exactly one family, so no citer can be left unfilterable — a family that
 * covered only the kinds someone remembered would leave the rest permanently
 * on, which is worse than no filter at all.
 *
 * THE NAMES ARE THE SITE'S OWN, taken from the library's sections
 * (`nav.*`), because these buttons name places a reader has already been
 * rather than a taxonomy invented for this panel — which is also why the
 * Code of Canon Law is its own family and not folded into the magisterium:
 * the library lists it separately.
 */
export type CitedByFamily =
	'catechism' | 'magisterium' | 'socialDoctrine' | 'canonLaw' | 'doctors' | 'prayer' | 'commentary';

/**
 * The families in the order the filter offers them, each with the key it is
 * labelled by. The order is the library's, not the index's: a reader scanning
 * the buttons is scanning the site's own shelf order.
 *
 * EVERY KEY IS ONE A PAGE ALREADY USES, so a family costs no new string in
 * thirty-seven dictionaries. `apparatus.commentary` is written in two of them
 * and falls back to English in the rest — which is what the apparatus panel
 * further up the same page already does with it, so the two agree.
 */
export const CITED_BY_FAMILIES: readonly { key: CitedByFamily; labelKey: string }[] = [
	{ key: 'catechism', labelKey: 'nav.ccc' },
	{ key: 'magisterium', labelKey: 'nav.magisterium' },
	{ key: 'socialDoctrine', labelKey: 'nav.socialDoctrine' },
	{ key: 'canonLaw', labelKey: 'nav.canonLaw' },
	{ key: 'doctors', labelKey: 'doctores.landing.title' },
	{ key: 'prayer', labelKey: 'nav.prayers' },
	{ key: 'commentary', labelKey: 'apparatus.commentary' }
];

/** A work citing this address, with every place in it that does. */
export interface CitedBySource {
	key: string;
	/** The shelf this work sits on — what the panel's filter toggles. */
	family: CitedByFamily;
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
		family: 'magisterium',
		label,
		fullTitle: manifest.title !== label ? manifest.title : null,
		refs: sections.map((n) => ({
			key: n,
			label: `§${n}`,
			href: hrefFor({ kind: 'document', slug, n })
		}))
	};
}

/**
 * The work a numbered citer belongs to, named as the CORPUS names it and
 * never as a literal.
 *
 * `PrayerReferences` and `CommentaryGloss` label a locus by the same rule and
 * the three must agree: `CCC` in every language, the Compendium headed in its
 * own (`Compêndio`, `Lilla katekesen`), the Code by whatever its editions
 * print. THE READER'S OWN EDITION FIRST, because these addresses are
 * edition-free — the edition that opens when the link is followed is the
 * reader's standing preference, and naming a different one would label the
 * link with a book it does not lead to.
 *
 * Returns the short form and the full title separately, which is what
 * `CitedBySource` wants: the short one is the label, the long one is the
 * hover, and where they are the same there is nothing to reveal.
 */
function workNames(type: WorkTypeKey): { label: string; fullTitle: string | null } | null {
	const workId = content.workIdFor(type);
	const manifest = workId ? getWork(workId) : undefined;
	if (!manifest) return null;
	const label = manifest.short_title || manifest.title;
	return { label, fullTitle: manifest.title !== label ? manifest.title : null };
}

/**
 * Every place that cites one address, as source groups ready to render.
 *
 * ONE FUNCTION BECAUSE THERE IS ONE ANSWER, and it took four callers to see
 * it. The Bible chapter, the Catechism paragraph, the document and the Summa
 * question all render `CitedBy` over the same `Citer[]`, and each had built
 * its own grouping — two of them identical, and all of them able to see only
 * the two kinds the index used to hold. A fifth kind arriving would have been
 * four edits, three of which nothing would have reported missing.
 *
 * GROUPING IS BY WORK, not by citer, because that is the shape the panel
 * renders and the shape a reader scans: "Lumen Gentium §8 §22", not the
 * work's name repeated once per section. The one exception is `annotation`,
 * which groups by the annotating WORK and not by the Bible — Haydock's notes
 * and Challoner's are two apparatuses that happen to hang off one text.
 *
 * A GROUP WHOSE WORK THIS BUILD DOES NOT HOLD IS DROPPED, silently and by
 * the same argument `documentCitedSource` makes for a slug with no manifest:
 * it can only mean the index outlived the work, and a bare id is not
 * something to put in front of a reader.
 *
 * COMMENTARY IS SHOWN IN ONE LANGUAGE — the reader's own — and this is the
 * only kind that is filtered rather than grouped. Every other citer is an
 * edition-free address: "CCC ¶27" opens in whatever Catechism the reader
 * reads, so two editions of it collapse to one citer and there is nothing to
 * choose between. An annotation is the opposite: Challoner's note IS
 * Challoner's, in English, and ten annotated editions cite one verse as ten
 * separate works. Listing all of them would put nine apparatuses a reader
 * cannot read beside the one they can, and the count is not small — Haydock
 * alone cites Scripture 11,491 times. `commentaryLang` is the edition
 * actually on screen where a page knows it, and otherwise the Bible edition
 * this reader would open.
 */
export function citedSources(citers: Citer[], commentaryLang?: string): CitedBySource[] {
	/** @see `CitedBySource.key` — insertion order is `Citer`'s own order,
	 *  which the builder wrote in `CITER_KINDS` order. */
	const groups = new Map<string, CitedBySource>();
	const into = (
		family: CitedByFamily,
		key: string,
		names: { label: string; fullTitle: string | null } | null,
		ref: CitedByRef
	) => {
		if (!names) return;
		let group = groups.get(key);
		if (!group) groups.set(key, (group = { key, family, ...names, refs: [] }));
		group.refs.push(ref);
	};

	/** @see the docblock above — the one language of commentary this reader is
	 *  offered, defaulting to the Bible edition they would open. */
	const notesLang = commentaryLang ?? content.langFor('bible');

	/** Sections of one document, gathered before `documentCitedSource` is
	 *  asked, so a document cited at three sections is one group. */
	const documentSections = new Map<string, number[]>();

	for (const citer of citers) {
		switch (citer.kind) {
			case 'ccc':
				into('catechism', 'ccc', workNames('catechism'), {
					key: citer.n,
					label: `¶${citer.n}`,
					href: hrefFor({ kind: 'ccc', n: citer.n })
				});
				break;
			case 'compendium':
				into('catechism', 'compendium', workNames('compendium'), {
					key: citer.n,
					label: `${citer.n}`,
					href: hrefFor({ kind: 'compendium', n: citer.n })
				});
				break;
			case 'socialDoctrine':
				into('socialDoctrine', 'socialDoctrine', workNames('social-doctrine'), {
					key: citer.n,
					label: `${citer.n}`,
					href: hrefFor({ kind: 'socialDoctrine', n: citer.n })
				});
				break;
			case 'canonLaw':
				into('canonLaw', 'canonLaw', workNames('canon-law'), {
					key: citer.n,
					label: `${citer.n}`,
					href: hrefFor({ kind: 'canonLaw', n: citer.n })
				});
				break;
			case 'summa':
				into('doctors', 'summa', workNames('summa'), {
					key: `${citer.part}:${citer.question}:${citer.article ?? ''}`,
					// The form every citation of the Summa prints, and the one
					// `refs-grammar.ts` reads back: part, question, article.
					label: `${citer.part} ${citer.question}${citer.article === null ? '' : `.${citer.article}`}`,
					href: hrefFor({
						kind: 'summa',
						part: summaPartSlug(citer.part),
						question: citer.question,
						article: citer.article
					})
				});
				break;
			case 'prayer': {
				const meta = getPrayerMeta(content.langFor('prayer'), citer.slug);
				if (!meta) break;
				into('prayer', 'prayer', workNames('prayer'), {
					key: citer.slug,
					// The prayer's own name, not its number: a collection is
					// read by title and its numbering is an ordering, not an
					// address anyone cites.
					label: meta.title,
					href: hrefFor({ kind: 'prayer', slug: citer.slug })
				});
				break;
			}
			case 'document': {
				const sections = documentSections.get(citer.slug);
				if (sections) sections.push(citer.n);
				else documentSections.set(citer.slug, [citer.n]);
				break;
			}
			case 'annotation': {
				const manifest = getWork(citer.work);
				if (!manifest || baseLang(manifest.language) !== notesLang) break;
				const label = manifest.short_title || manifest.title;
				into(
					'commentary',
					`annotation:${citer.work}`,
					{ label, fullTitle: manifest.title !== label ? manifest.title : null },
					{
						key: `${citer.osis}:${citer.chapter}:${citer.verse}`,
						label: `${bookName(citer.osis)} ${citer.chapter}:${citer.verse}`,
						href: hrefFor({
							kind: 'bible',
							osis: citer.osis,
							chapter: citer.chapter,
							from: citer.verse,
							to: citer.verse
						})
					}
				);
				break;
			}
		}
	}

	const documents = [...documentSections]
		.map(([slug, sections]) => documentCitedSource(slug, sections))
		.filter((source): source is CitedBySource => source !== null)
		// By display title, which is what a reader actually scans; the other
		// groups keep the builder's order, which is by work.
		.sort((a, b) => a.label.localeCompare(b.label));

	return [...groups.values(), ...documents];
}

/**
 * A book's name in the edition this reader would actually open.
 *
 * `PrayerReferences` reads it the same way and for the same reason: a Bible
 * address names no edition, so the one that opens is the reader's standing
 * preference, and any other edition's spelling would label the link with a
 * book it does not lead to.
 */
function bookName(osis: string): string {
	const names = getCanonicalBook(osis)?.namesByWorkId ?? {};
	const preferred = content.workIdFor('bible');
	return (preferred && names[preferred]) || Object.values(names)[0] || osis;
}
