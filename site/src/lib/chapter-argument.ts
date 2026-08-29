import type { Chapter } from './types';

/**
 * The chapter argument to PRINT, which is not always the one the edition
 * stored.
 *
 * An argument is what a source prints under the chapter number to say what is
 * in the chapter (`Chapter.summary`), and three of the corpus's editions write
 * one as prose: Challoner's 1,307 are sentences about the chapter, and
 * Straubinger's, Allioli's, Martini's and Káldi's the same. Matos Soares does
 * something else — his argument is the chapter's own rubrics, read out in
 * advance and joined with spaces. Of the 1,279 chapters he gives one to,
 * **1,131 are exactly the deepest-level headings of that chapter**, in order,
 * so a reader meets "Principio. Primeiro dia da criação. Segundo dia da
 * criação…" above the title and then meets "Principio." again as a rubric two
 * inches below it, and every one of the others in turn as they read.
 *
 * SO IT IS SUPPRESSED WHERE IT IS A PREVIEW AND KEPT WHERE IT IS AN ARGUMENT,
 * and equality is what tells them apart. The 148 Matos Soares chapters that do
 * not match keep theirs, because they earn it: the Psalms carry a real title
 * over rubrics that say something else ("Preces matutinas do justo cercado de
 * inimigos" over "Implora a atenção de Deus…"), and Jeremias 49 loses a rubric
 * to the summary's own abridgement. Not one chapter of the other five editions
 * matches, which is the check that this suppresses a habit of one edition
 * rather than a shape of the genre.
 *
 * THE DEEPEST LEVEL, not every heading. A chapter may open with a part title
 * and a section title above its first rubric — Genesis 1 sets "PRIMEIRA
 * PARTE", "I - CRIAÇÃO DO MUNDO" and "Principio." before verse 1 — and those
 * outer divisions are not what the argument repeats. Comparing against all
 * headings instead would recognise 644 of the 1,131 and leave the rest
 * printing their own rubrics.
 *
 * A DISPLAY RULE AND NOT A CORRECTION. The source really does print this, so
 * `raw/` and the parsed corpus keep it (a correction amends what the source
 * said, and this is not amended — `pipeline/corrections/README`); what changes
 * is only whether the reader is shown the same words twice on one screen.
 */
export function chapterArgument(
	chapter: Pick<Chapter, 'summary' | 'headings'>
): string | undefined {
	const summary = chapter.summary?.trim();
	if (!summary) return undefined;
	const headings = chapter.headings ?? [];
	if (headings.length === 0) return summary;
	const deepest = Math.max(...headings.map((h) => h.level ?? 0));
	const rubrics = headings.filter((h) => (h.level ?? 0) === deepest).map((h) => h.text);
	return collapse(rubrics.join(' ')) === collapse(summary) ? undefined : summary;
}

/** Whitespace is not a difference: the source's line breaks land inside a
    heading as often as between two, and a match that a newline could break
    would suppress a chapter and print its neighbour. */
function collapse(s: string): string {
	return s.replace(/\s+/g, ' ').trim();
}
