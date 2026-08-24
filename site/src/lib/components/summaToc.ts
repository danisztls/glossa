/**
 * Grouping the Summa's questions under its treatise headings, for the reading
 * sidebar. Pure, so the grouping rule can be tested without mounting anything.
 *
 * WHY THIS IS NOT `structureToc.ts`. Every other sidebar walks a
 * `StructureNode` tree -- nested `children`, a `kind`, a `paragraphs` range --
 * and `StructureSidebarToc` is parametrized over exactly that shape. The
 * Summa's `SummaNode` is a FLAT list of `{ level, part, title, before }`: a
 * heading records only the question it precedes, because that is all either
 * source states. Reshaping it into a tree to reuse the other component would
 * mean inventing bounds (`paragraphs`) and kinds the corpus does not carry,
 * which is the kind of quiet fabrication `docs/corpus-schema.md` exists to
 * prevent. The grouping below derives the same information honestly: a
 * treatise runs from its own `before` up to the next heading's.
 *
 * THE LATIN EDITION HAS NO TREATISE HEADINGS AT ALL. The Corpus Thomisticum
 * publishes four part headings and nothing below them, so `headings` arrives
 * empty and every question lands in one untitled group -- which the sidebar
 * renders as a flat list of questions. That is the correct degradation rather
 * than a missing feature: borrowing the English edition's treatise divisions
 * to organise Latin text would be asserting a structure that source does not
 * print (the same reason `/summa`'s TOC shows no titles under Latin).
 */

import type { SummaNode } from '../types';
import type { SummaQuestionMeta } from '../corpus-index';

export interface SummaTocGroup {
	/** The treatise heading, or `null` for questions that precede the first
	 *  one (and for the whole of an edition that prints no headings). */
	title: string | null;
	questions: SummaQuestionMeta[];
}

/**
 * `headings` and `questions` must both belong to ONE part -- question numbers
 * restart at 1 in each, so a mixed list would group across a part boundary.
 * `summaHeadingsForPart` already filters that way; the caller passes its
 * output straight through.
 *
 * A heading whose `before` no question matches keeps its place with an empty
 * question list rather than being dropped, and two headings sharing a `before`
 * both survive for the same reason: the sidebar is a view of the source's own
 * outline, and silently swallowing a row it cannot place would make the outline
 * disagree with the text without saying so.
 */
export function summaTocGroups(
	headings: SummaNode[],
	questions: SummaQuestionMeta[]
): SummaTocGroup[] {
	const ordered = headings
		.filter((h) => h.before !== null)
		.slice()
		.sort((a, b) => (a.before as number) - (b.before as number));

	const groups: (SummaTocGroup & { before: number })[] = ordered.map((h) => ({
		title: h.title,
		before: h.before as number,
		questions: []
	}));

	// Questions ahead of the first heading (or all of them, when there are no
	// headings) belong to a leading group with no title of its own.
	const leading: SummaTocGroup = { title: null, questions: [] };

	for (const q of [...questions].sort((a, b) => a.n - b.n)) {
		// The last group that opens at or before this question. Linear scan
		// backwards: a part carries at most a dozen headings.
		let target: (SummaTocGroup & { before: number }) | undefined;
		for (let i = groups.length - 1; i >= 0; i--) {
			if (groups[i].before <= q.n) {
				target = groups[i];
				break;
			}
		}
		(target ?? leading).questions.push(q);
	}

	const out: SummaTocGroup[] = groups.map(({ title, questions }) => ({ title, questions }));
	if (leading.questions.length > 0) out.unshift(leading);
	return out;
}
