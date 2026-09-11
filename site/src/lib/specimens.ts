/**
 * The citation form each work is addressed by, written once.
 *
 * ## Why this is a module and not a list on a page
 *
 * Four surfaces teach this notation, and by 2026-09-10 three of them held
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
 * `help.ts` keeps its own pairs deliberately. It teaches a different lesson —
 * that the box reads the work's NAME and answers in its siglum — so its left
 * column is `Catechism 101` where everything here is `CCC 101`.
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
 * ## Prayers have no row, and that is the whole answer for them
 *
 * They are cited by name. An invented shape would teach a citation form that
 * does not exist, which is why `/schola` prints a sentence there instead and
 * why the jump box's legend leads with the name case rather than listing it.
 */
import { listWorksOfType } from './corpus';
import { t } from './i18n.svelte';
import { scriptureSpecimen } from './refs';
import type { WorkType } from './types';

export interface Specimen {
	/** Stable id, and the key `/schola` looks its own row up by. */
	key: string;
	/** The work that has to be in this build for the row to mean anything. */
	type: WorkType;
	/** The work's SHORT name — the `nav.*` key the bar titles it with, not the
	 *  landing page's. A legend is a column of names read at a glance, and
	 *  "Compendium of the Social Doctrine of the Church" is a paragraph. */
	labelKey: string;
	/** The form as the work PRINTS it, in the reader's own language —
	 *  `/schola`'s column and the home page's chips, both of which are
	 *  teaching a citation. `undefined` only for Scripture, whose book name
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
