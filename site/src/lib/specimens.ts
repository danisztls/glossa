/**
 * The citation form each work is addressed by, written once.
 *
 * ## Why this is a module and not a list on a page
 *
 * Four surfaces taught this notation, and by 2026-09-10 three of them held
 * their own copy of it: `/schola`'s catalogue column, the home page's row of
 * three chips, and the shortcut sheet's typed/cites pairs (`help.ts`). The
 * jump box's own legend was about to be the fourth, which is where a table
 * copied by hand stops being a duplication and becomes a claim four files can
 * disagree about — and the one that goes stale is whichever page nobody
 * opened while the siglum changed.
 *
 * The Bible's line was already shared (`scriptureSpecimen`, in `refs.ts`)
 * because it is the one that CANNOT be written down: only the reader's own
 * edition knows what it calls the book, and only their language knows whether
 * a verse follows a colon or a comma. This module is the rest of the table
 * arriving at the same conclusion.
 *
 * THE FOURTH COPY IS GONE RATHER THAN SHARED. `help.ts`'s pairs taught a
 * different lesson — that the box reads a work's NAME and answers in its
 * siglum, `Catechism 101` against this table's `CCC 101` — which was a fair
 * reason to keep them separate and no reason to keep them at all: the help
 * sheet's whole jump-box section went on 2026-09-10, the box's own panel
 * teaching the same notation with the field the reader is about to type in
 * directly above it. `/schola`'s column went the same day and for a different
 * reason — a catalogue prints what a work IS, and the form it is addressed by
 * belongs where a reader types one (`docs/finding.md`). Two surfaces now, the
 * home page and the box, both of them this table.
 *
 * ## The numbers are representative and the rows are inert
 *
 * Four figures for a work with thousands of paragraphs, three for a code of
 * canons, two for the sections of a document: the shape of the number is part
 * of what the specimen teaches. They were links on `/schola` until 2026-09-05
 * and are not links anywhere now — `1` is a meaningful citation, so a live
 * example reads as a recommendation and drops a reader who was being taught a
 * FORM into the middle of a work they did not choose. The jump box does the
 * one thing that is not navigation: it puts the example in its own field.
 *
 * ## Prayers have no CITATION, which is not the same as having no row
 *
 * They are cited by name. An invented shape would teach a citation form that
 * does not exist, which is why `citationSpecimens` has no prayer row. The jump
 * box's legend does have one: that list is of PLACES TO LOOK rather than of
 * notations, and a work with no number to cite is still somewhere to search.
 * `sectionSpecimens`, at the foot of this file, is where the two lists diverge.
 */
import { listWorksOfType } from './corpus';
import { t } from './i18n.svelte';
import { scriptureSpecimen } from './refs';
import type { WorkType } from './types';

export interface Specimen {
	/** Stable id: the home page picks its three rows by it (`HOME_SHAPES`),
	 *  and both surfaces key their `{#each}` on it. */
	key: string;
	/** The work that has to be in this build for the row to mean anything. */
	type: WorkType;
	/** The work's SHORT name — the `nav.*` key the bar titles it with, not the
	 *  landing page's. A legend is a column of names read at a glance, and
	 *  "Compendium of the Social Doctrine of the Church" is a paragraph. */
	labelKey: string;
	/** The form as the work PRINTS it, in the reader's own language —
	 *  the home page's chips, which are teaching a citation rather than
	 *  offering one. `undefined` only for Scripture, whose book name
	 *  comes from an edition that may be absent. */
	text: string | undefined;
	/** The same form as a reader TYPES it, which is what the jump box's legend
	 *  prints, since every row there is a string that goes into the field.
	 *  Defined exactly where `text` is. */
	typed: string | undefined;
}

/**
 * A printed siglum as something to key in: lower case, and the abbreviating
 * full stop gone.
 *
 * BOTH ARE THINGS THE BOX DOES NOT ASK FOR. `fold` lower-cases every title,
 * heading and topic it matches, and `sectionForm` drops punctuation on top of
 * that — `ccc. 27`, `CCC 27` and `catechism 27` are one query. So a legend
 * printing `Comp. 123` states a precision that is not required, and the stop
 * is the character that most looks like it is.
 *
 * NOT APPLIED TO SCRIPTURE, whose abbreviation is whatever the reader's own
 * edition prints and is read by the book-token tables rather than by
 * `sectionForm` — those tables hold the printed forms, stops included, and
 * nothing licenses removing one.
 */
function typeable(text: string): string {
	return text.toLowerCase().replaceAll('.', '');
}

/**
 * Every notation, in the order a reader meets the works.
 *
 * The sigla come from the dictionary wherever the work has a key for one
 * (`ccc.abbrev`, `compendium.abbrev`, `socialDoctrine.abbrev`,
 * `canonLaw.canon`), so a reader is shown the siglum their own edition
 * prints. The two that are written out are Latin either way: a document is
 * cited by its incipit, and `STh` is the Summa's own abbreviation.
 */
export function citationSpecimens(bibleWorkId: string | undefined, bibleLang: string): Specimen[] {
	const cited = scriptureSpecimen(bibleWorkId, bibleLang);
	const siglum = (text: string): Pick<Specimen, 'text' | 'typed'> => ({
		text,
		typed: typeable(text)
	});
	return [
		{
			key: 'scripture',
			type: 'bible',
			labelKey: 'nav.bible',
			text: cited,
			// Case alone. The separator is the LANGUAGE's — `Jo 3,16` in
			// Portuguese — so a rule that dropped punctuation here would take
			// the chapter/verse mark with it.
			typed: cited?.toLowerCase()
		},
		{
			key: 'catechism',
			type: 'catechism',
			labelKey: 'nav.ccc',
			...siglum(`${t('ccc.abbrev')} 1234`)
		},
		{
			key: 'compendium',
			type: 'compendium',
			labelKey: 'nav.compendium',
			...siglum(`${t('compendium.abbrev')} 123`)
		},
		{
			// A real incipit and not a placeholder: the form is a NAME followed
			// by a section number, and it is only legible as that if the name is
			// one the reader could have met. It is how the Catechism cites a
			// conciliar document throughout.
			key: 'magisterium',
			type: 'document',
			labelKey: 'nav.magisterium',
			...siglum('Dei Verbum 12')
		},
		{
			key: 'social',
			type: 'social-doctrine',
			labelKey: 'nav.socialDoctrine',
			...siglum(`${t('socialDoctrine.abbrev')} 123`)
		},
		{
			key: 'law',
			type: 'canon-law',
			labelKey: 'nav.canonLaw',
			...siglum(`${t('canonLaw.canon')} 123`)
		},
		{
			key: 'doctors',
			type: 'summa',
			labelKey: 'nav.summa',
			text: 'STh I, 12',
			// The comma is a locus separator the Summa's grammar tolerates
			// either way (`SUMMA_RE` reads `sth i 12`), so it comes off with the
			// case — unlike Scripture's, which IS the chapter/verse mark.
			typed: 'sth i 12'
		}
	];
}

/**
 * EVERY SECTION OF THE SITE, AS A ROW A READER CAN CHOOSE.
 *
 * The table above says how each work is CITED; this one says where each work
 * IS, and they are different lists that happen to be nearly the same length.
 * A citation belongs to a work with numbered units, so `/preces` and
 * `/quaestiones` have none — a prayer is cited by name, and a topic is a door
 * onto the other works rather than a unit of any of them. Both are places to
 * look inside, so both are rows here and neither is a row there.
 *
 * `scope` IS THE SIGLUM WHERE THE WORK HAS ONE AND ITS NAME WHERE IT DOES NOT
 * — `ccc:` and `can:` against `prayers:` and `questions:`. Either is read by
 * `suggest.ts`'s `parseSectionFilter`, which matches a section word in any of
 * the interface languages, so the name arrives already translated and the
 * abbreviation is preferred only for being shorter to type. A document's
 * incipit is why `/documenta` takes the name too: `dei verbum:` names no
 * section, and `Dei Verbum 12` is a citation rather than a siglum.
 *
 * THE WELD TO `SECTIONS` IS A TEST AND NOT AN IMPORT. That table lives in
 * `suggest.ts`, which the jump box loads lazily and this module must not drag
 * into the boot payload — so `path` is written out here and
 * `specimens.test.ts` asserts, for every row, that `parseSectionFilter` reads
 * that row's `scope` back as exactly that path, and that the rows cover every
 * section there is. A prefix that stopped resolving is then a failing test
 * rather than a chip that quietly filters nothing.
 */
export interface SectionSpecimen {
	/** Stable id, shared with `Specimen.key` wherever the work has a citation. */
	key: string;
	/** The `SECTIONS` path in `suggest.ts` this row scopes to. */
	path: string;
	/** The work's SHORT name, for the reason `Specimen.labelKey` gives. */
	labelKey: string;
	/** What choosing this row types, colon included: `ccc:`. */
	scope: string;
	/** The citation form, absent for the two works that have none. */
	text?: string;
	typed?: string;
}

/**
 * The nine, in the order a reader meets them.
 *
 * `type` is the build gate, and it is `undefined` for the one row that is not
 * a work: `/quaestiones` is published by the topic index rather than by the
 * corpus registry, so its caller is the only thing that knows and passes the
 * answer in.
 */
const SECTION_ROWS: {
	key: string;
	path: string;
	labelKey: string;
	scopeKey?: string;
	type?: WorkType;
}[] = [
	{ key: 'scripture', path: '/scriptura', labelKey: 'nav.bible', type: 'bible' },
	{
		key: 'catechism',
		path: '/catechismus',
		labelKey: 'nav.ccc',
		scopeKey: 'ccc.abbrev',
		type: 'catechism'
	},
	{
		key: 'compendium',
		path: '/catechismus/compendium',
		labelKey: 'nav.compendium',
		scopeKey: 'compendium.abbrev',
		type: 'compendium'
	},
	{ key: 'magisterium', path: '/documenta', labelKey: 'nav.magisterium', type: 'document' },
	{
		key: 'social',
		path: '/doctrina-socialis',
		labelKey: 'nav.socialDoctrine',
		scopeKey: 'socialDoctrine.abbrev',
		type: 'social-doctrine'
	},
	{
		key: 'law',
		path: '/ius-canonicum',
		labelKey: 'nav.canonLaw',
		scopeKey: 'canonLaw.canon',
		type: 'canon-law'
	},
	{ key: 'prayers', path: '/preces', labelKey: 'nav.prayers', type: 'prayer' },
	{ key: 'doctors', path: '/doctores/summa', labelKey: 'nav.summa', type: 'summa' },
	{ key: 'topics', path: '/quaestiones', labelKey: 'quaestiones.landing.title' }
];

/**
 * All nine, whatever this build carries — the pair below is
 * `citationSpecimens`/`availableSpecimens` again and splits for the same
 * reason. The whole table is what the weld test reads, since a section
 * missing from a partial build must still be checked against `SECTIONS`.
 */
export function sectionSpecimens(
	bibleWorkId: string | undefined,
	bibleLang: string
): SectionSpecimen[] {
	const cited = new Map(citationSpecimens(bibleWorkId, bibleLang).map((row) => [row.key, row]));
	return SECTION_ROWS.map((row) => {
		const citation = cited.get(row.key);
		return {
			key: row.key,
			path: row.path,
			labelKey: row.labelKey,
			scope: `${typeable(t(row.scopeKey ?? row.labelKey))}:`,
			text: citation?.text,
			typed: citation?.typed
		};
	});
}

/**
 * The sections this build can actually answer for.
 *
 * Gated the way `availableSpecimens` is and for the same reason — a row
 * offering to search inside a work that is not loaded takes the reader's
 * words and returns nothing. THE CITATION IS GATED SEPARATELY AND MORE
 * STRICTLY: Scripture's needs a loaded edition to name the book, so a build
 * with a Bible and no edition keeps its row and loses only the example on it.
 *
 * `hasTopics` is passed in because `/quaestiones` is the one row that is not
 * a work: it is published by the topic index rather than by the corpus
 * registry, and only the caller has that.
 */
export function availableSections(
	bibleWorkId: string | undefined,
	bibleLang: string,
	hasTopics: boolean
): SectionSpecimen[] {
	const gate = new Map(SECTION_ROWS.map((row) => [row.key, row.type]));
	return sectionSpecimens(bibleWorkId, bibleLang).filter((row) => {
		const type = gate.get(row.key);
		return type ? listWorksOfType(type).length > 0 : hasTopics;
	});
}

/**
 * The rows this build can actually answer, in the order above.
 *
 * Two gates and they fail for different reasons: a work a partial sync or the
 * vitest fixtures did not carry has no index for the box to resolve the
 * example against, and Scripture's line is absent wherever no Bible edition
 * is loaded to name the book. Either way an example that cannot be followed
 * is worse than a shorter list — it teaches a form and then declines it.
 */
export function availableSpecimens(
	bibleWorkId: string | undefined,
	bibleLang: string
): (Specimen & { text: string; typed: string })[] {
	return citationSpecimens(bibleWorkId, bibleLang).filter(
		(row): row is Specimen & { text: string; typed: string } =>
			row.text !== undefined && listWorksOfType(row.type).length > 0
	);
}
