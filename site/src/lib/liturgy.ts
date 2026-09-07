/**
 * What `/calendarium/liturgia` gathers for one day, and where each part of it
 * comes from.
 *
 * THE PAGE COMPILES; IT DOES NOT KNOW ANYTHING NEW. Every fact on it is
 * already somewhere in this repository or this corpus — the day is
 * `$lib/calendar`'s arithmetic, the pericopes are `$lib/lectionary`'s, the
 * text under each one is the reader's own Bible edition, and the prayers are
 * the corpus's. What this module adds is the two joins nothing else makes: a
 * citation to the verses it names, and a day to the prayers appointed on it.
 *
 * ## The text is this site's edition and never a Missal's
 *
 * `site/docs/lectionary.md` states the position and `DayReadings` says it on
 * the card: the schedule is the Ordo Lectionum Missae's, the words are
 * whichever Bible this reader has open. Printing the passages rather than
 * only their citations does not change what is being claimed, and it makes
 * saying so louder rather than quieter — the caveat is set out on the page
 * instead of behind a mark, because a page of reading text invites exactly the
 * assumption the mark exists to correct.
 *
 * ## A pericope is printed whole or not at all
 *
 * `refs.ts`'s `passageSpans` is where that rule lives. What it means here is
 * that a citation this corpus cannot resolve in full leaves its own text
 * blank, with the citation still standing as a link — never a passage cut
 * short, which a reader has no way to detect.
 */

import { getChapter } from './corpus';
import { normalizeCitationSpacing, parseRefs, passageSpans } from './refs';
import type { LiturgicalDay } from './calendar/types';
import type { Prayer, PrayerGroupEntry, Verse } from './types';

/**
 * One unbroken run of verses, as the page sets it.
 *
 * IT CARRIES ITS OWN BOOK, which looks redundant and is not: an acclamation
 * can name two of them (`1 Sm 3:9; Jn 6:68c`), so a book on the passage rather
 * than on the run would label half the text with the other half's book.
 */
export interface PassageRun {
	osis: string;
	/** The book as the reader's own edition names it. */
	book: string;
	chapter: number;
	verses: Verse[];
}

/**
 * What a pericope's citation resolved to, in the three states the page draws
 * differently.
 *
 * `withheld` and `unscriptured` are both "no text", and telling them apart is
 * the difference between the site saying it will not print something and the
 * site saying there is nothing to print. `Victimae paschali laudes` is the
 * second: the source prints the sequence's NAME where a citation would go, and
 * a line about an edition's limits under it would be an answer to a question
 * nobody asked.
 */
export type PassageResult =
	| {
			kind: 'passage';
			/**
			 * The runs the citation named, in the source's order. More than one
			 * means the citation skipped something — `Ps 95:1-2, 6-7` is two runs
			 * — or that it crossed a chapter or a book, and the page must set
			 * them apart either way: a gap printed as continuous text is the
			 * passage saying something it does not say.
			 */
			runs: PassageRun[];
	  }
	| { kind: 'withheld' }
	| { kind: 'unscriptured' };

/**
 * The verses a citation names, out of `workId`.
 *
 * `withheld` COVERS THREE DIFFERENT FAILURES and deliberately does not tell
 * them apart: a citation this grammar cannot read whole, a book or chapter
 * this edition does not carry, and a verse range that came back empty. The
 * page does the same thing for all three — prints the citation and no text —
 * so a finer answer would be a distinction nothing acts on.
 */
export async function loadPassage(
	cite: string,
	ctx: { bibleWorkId?: string; lang?: string; work?: string }
): Promise<PassageResult> {
	const spans = passageSpans(cite, ctx);
	if (!spans || !ctx.bibleWorkId) {
		return namesScripture(cite, ctx) ? { kind: 'withheld' } : { kind: 'unscriptured' };
	}

	const runs: PassageRun[] = [];
	for (const span of spans) {
		const result = await getChapter(ctx.bibleWorkId, span.osis, span.chapter);
		if (!result) return { kind: 'withheld' };
		const verses = result.chapter.verses.filter((v) => v.n >= span.from && v.n <= span.to);
		// A span that selects nothing is a citation naming verses this edition
		// does not print at that address — the same "real chapter, wrong verse"
		// gap `linkPreviewContent.ts` refuses to paper over.
		if (verses.length === 0) return { kind: 'withheld' };
		runs.push({ osis: span.osis, book: result.book.name, chapter: span.chapter, verses });
	}
	return { kind: 'passage', runs };
}

/**
 * Whether a citation names Scripture at all.
 *
 * The lectionary's `cite` is a citation for every pericope but the sequences,
 * where the source prints `Victimae paschali laudes` in the same field —
 * `Pericope.cite`'s docblock reserves the EMPTY string for a slot with no
 * address, so a name standing there is a third case neither end of that
 * contract covers.
 */
function namesScripture(cite: string, ctx: { lang?: string; work?: string }): boolean {
	return parseRefs(normalizeCitationSpacing(cite), { lang: ctx.lang, work: ctx.work }).some(
		(seg) => seg.kind === 'scripture'
	);
}

/**
 * Whether a run is separated from the one before it by something the page has
 * to draw — verses the citation skipped, or a change of book.
 *
 * A change of CHAPTER is not one of them: a crossing is continuous text, and
 * the chapter number printed on the run's first verse is what marks it.
 */
export function runIsBroken(runs: PassageRun[], i: number): boolean {
	const previous = runs[i - 1];
	const run = runs[i];
	if (!previous || !run) return false;
	if (previous.osis !== run.osis) return true;
	if (previous.chapter !== run.chapter) return false;
	const last = previous.verses[previous.verses.length - 1];
	return last !== undefined && run.verses[0] !== undefined && run.verses[0].n > last.n + 1;
}

/**
 * The Marian antiphon said at the Angelus hour: the Regina Caeli through
 * Easter Time, the Angelus through the rest of the year.
 *
 * A SEASON AND NOT A DATE RANGE, which is why this is one line rather than a
 * table: the substitution runs from Easter Sunday to Pentecost inclusive, and
 * that is exactly the extent of `season: 'easter'` in `temporal.ts` — Easter
 * Sunday belongs to it (the Triduum ends at Evening Prayer that day) and
 * Pentecost is its last day.
 *
 * Both slugs are language-invariant addresses (`Prayer.slug`), so this answers
 * the same in every language and the corpus decides whether it holds one.
 */
export function marianAntiphonSlug(day: LiturgicalDay): 'regina-caeli' | 'angelus' {
	return day.season === 'easter' ? 'regina-caeli' : 'angelus';
}

/**
 * The Rosary's mysteries for a weekday, or `undefined` where the corpus
 * cannot say.
 *
 * THE WEEKDAYS ARE THE CORPUS'S AND NOT THIS FILE'S. `PrayerGroupEntry.days`
 * is written by the scraper out of the rubric the source prints, in ISO
 * numbering, precisely so that a site in fourteen interface languages does not
 * have to parse "(recited Monday and Saturday)" or "(Segundas e Sábados)" to
 * recover a fact the source already stated. A corpus written before that field
 * existed answers nothing, and the page then shows the Rosary without singling
 * out a set — which is what it should show anyway when nobody has said.
 */
export function rosaryGroupFor(
	prayer: Prayer | undefined,
	isoWeekday: number
): PrayerGroupEntry | undefined {
	return prayer?.groups?.find((group) => group.days?.includes(isoWeekday));
}
