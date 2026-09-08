/**
 * Chapters the Bible editions in this corpus divide differently, and the one
 * sentence a reader is owed about each.
 *
 * ## Why the reading view needs this and compare mode does not answer it
 *
 * `docs/decisions.md` #2 made reader URLs edition-free: `/scriptura/2thess/2?v=16`
 * names a verse, not an edition's verse. That is right for 1,300 chapters and
 * false for thirty-four, and the failure is silent — a reader following a
 * citation gets real, plausible, wrong text with nothing marking it.
 *
 * `compare.ts`'s `numberSetsDiffer` catches part of it, and only while the
 * reader has opened the comparison. It cannot catch the worst of it at all:
 * Acts 14 runs 1–27 in both editions, so its verse-number SETS agree exactly,
 * while twenty verses in the middle name different text in each. Nothing that
 * compares numbers can see that. So the table is read, not computed
 * (`docs/research/bible-edition-divergence.md`), and the note is shown in the
 * reading view where the citation actually lands.
 *
 * ## The table is generated, and this file must not grow one of its own
 *
 * `divergence.json` is written by `pipeline/scrapers/bible/divergence.py
 * --export`, which owns the classification because it also verifies it against
 * the editions every run. That script fails when the committed JSON falls
 * behind, which is the same guarantee `versification-export.test.ts` gives in
 * the other direction.
 *
 * ## A row is about the address, so it is shown to every edition's reader
 *
 * No row names an edition. The table was measured over `bible.cpdv.en` and
 * `bible.matos-soares.pt`, but what it records is that the address is
 * ambiguous — and a reader arriving at Acts 14 in Straubinger followed a
 * citation somebody wrote against one edition or the other. Filtering the note
 * to the two editions measured would tell the rest of the corpus's readers
 * that their chapter is settled, which is the claim we cannot make.
 */

import table from './divergence.json';

/** How two editions come to divide one chapter differently. The four printed
 *  kinds and the two silent ones — see the research note for what separates
 *  them, and `i18n` for the sentence each becomes. */
export type DivergenceKind =
	| 'arrangement'
	| 're-division'
	| 'merge-split'
	| 'textual-variant'
	| 'span-shift'
	| 'local-repartition';

export interface Divergence {
	kind: DivergenceKind;
	/** A verse-for-verse correspondence, where a person has confirmed one —
	 *  `en 35 <-> pt 35+36`. Present only on `merge-split` rows: the research
	 *  note's §4 is why a `re-division` or `arrangement` row has none to give. */
	mapping?: string;
}

const CHAPTERS = table.chapters as Record<string, Record<string, Divergence>>;

/** The i18n key for a kind's advisory sentence. */
export function divergenceKey(kind: DivergenceKind): string {
	return `bible.divergence.${kind}`;
}

/** What is known about this chapter's divisions, or undefined where nothing is
 *  — which is every chapter but thirty-four. */
export function divergenceFor(osis: string, chapter: number): Divergence | undefined {
	return CHAPTERS[osis]?.[String(chapter)];
}

/** Every chapter in the table, for the tests that check it against the
 *  editions the site actually holds. */
export function divergences(): { osis: string; chapter: number; row: Divergence }[] {
	return Object.entries(CHAPTERS).flatMap(([osis, rows]) =>
		Object.entries(rows).map(([chapter, row]) => ({ osis, chapter: Number(chapter), row }))
	);
}
