/**
 * How a citation this site WRITES is punctuated, for the reader in front of it.
 *
 * `site/docs/references.md` states the rule; this is the one line of it that
 * three surfaces need identically, and it is a named function because it was
 * written out three times and got typed as a literal `:` in three more.
 *
 * TWO DECISIONS ARE IN HERE AND NEITHER IS OBVIOUS FROM THE CALL SITE.
 *
 * The mark comes from `grammarSurface`, which is the table `parseRefs` matches
 * against — so a citation this site composes cannot be spelled in a form its
 * own parser refuses. A literal is what every one of these surfaces had, and a
 * literal is right in exactly one language.
 *
 * The language is the reader's Bible EDITION's and not the interface's, because
 * every one of these labels sits beside a book named out of that edition and
 * links into it. Naming it in the interface's convention would describe a page
 * the reader is not being taken to — `Lucas 1:28` over a link that opens an
 * edition printing `1,28`.
 *
 * IT IS NOT FOR A CITATION THE CORPUS PRINTED. `RefText` reproduces what a work
 * wrote, in that work's own language, and must not be touched by this; the
 * distinction is the whole first paragraph of `lectionary/cite.ts`. Nor is it
 * for a pure function that already takes a language — `scriptureSpecimen` and
 * `localizeCite` are handed one by their callers, which is what lets them be
 * tested in eleven languages.
 *
 * `citation-punctuation.test.ts` is what keeps the literal from coming back.
 */

import { content } from './content.svelte';
import { grammarSurface } from './refs-grammar';

/** `:` for an English edition, `,` across the Romance tables. */
export function chapterVerseSep(): string {
	return grammarSurface(content.langFor('bible')).chapterVerseSep;
}
