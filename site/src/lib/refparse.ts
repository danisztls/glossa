/**
 * Reference parser for the jump box.
 *
 * This module only parses *syntax* — it turns a typed string into a
 * structured reference. It knows nothing about which books or CCC
 * paragraphs actually exist; resolving a parsed `book` token against real
 * corpus data (abbrevs, OSIS codes) is the caller's job (see
 * `corpus.findBookByAbbrev`). Keeping this module corpus-agnostic keeps it
 * trivially unit-testable and safe to grow: recognizing new patterns
 * (verse lists like `3:16,18`, `gen 1-3`, ranges across chapters, other
 * languages' separators) means editing this file alone.
 *
 * Supported forms today:
 *   - `ccc 1234`               → CCC paragraph
 *   - `<book> <chapter>`       → whole chapter, e.g. `gen 1`
 *   - `<book> <chapter>:<v>`   → single verse, e.g. `john 3:16`
 *   - `<book> <chapter>,<v>`   → PT comma style, e.g. `jo 3,16`
 *   - `<book> <chapter>:<v>-<v2>` → verse range, e.g. `john 3:16-18`
 *   - Book tokens may carry a leading number, with or without a space:
 *     `1cor 13:4`, `1 cor 13:4`, `2sam 1`.
 *
 * One exception to "knows nothing about which books exist": a reader
 * typing a Psalms/Malachi/Joel reference almost always means the
 * Hebrew/Masoretic numbering everyone actually uses day to day (`docs/
 * link-surface.md`'s "Psalm 23 opens Psalm 22" case), not this corpus's
 * canonical Vulgate numbering — so this module converts the chapter/verse
 * for those three books via `versification.ts` before returning. That
 * module is itself corpus-agnostic (pure osis/chapter/verse tables), so
 * this stays a syntax-and-convention layer, not a corpus lookup: no
 * `corpus.ts` import, no change to the "caller resolves the book token"
 * contract. Book-token recognition here is deliberately narrow — just the
 * real jump-box abbreviations these three books actually have in both v1
 * editions (`corpus/works/*\/books/{ps,mal,joel}.json`'s `abbrevs`) plus
 * their bare OSIS codes — not the full abbreviation grammar `corpus.ts`
 * and `refs.ts` own, since only these three books need converting at all.
 */

import { toVulgateCandidates } from './versification';

/** Real jump-box abbreviations for the three books this module converts (verified against `corpus/works/*\/books/{ps,mal,joel}.json`'s `abbrevs`, both editions), normalized the same way `book` tokens are below (lowercased, spaces stripped). Bare OSIS codes are included since `corpus.findBookByAbbrev` also matches those directly. */
const DIVERGENT_BOOK_TOKENS: Record<string, string> = {
	ps: 'ps',
	psalm: 'ps',
	psalms: 'ps',
	psa: 'ps',
	sl: 'ps',
	mal: 'mal',
	malachi: 'mal',
	ml: 'mal',
	joel: 'joel',
	jl: 'joel'
};

export interface ParsedCccReference {
	kind: 'ccc';
	n: number;
	raw: string;
}

export interface ParsedBibleReference {
	kind: 'bible';
	/** Normalized (lowercased, space-stripped) book token — NOT necessarily a known OSIS code. */
	book: string;
	chapter: number;
	verse?: number;
	verseEnd?: number;
	raw: string;
}

export interface ParsedInvalidReference {
	kind: 'invalid';
	raw: string;
}

export type ParsedReference = ParsedCccReference | ParsedBibleReference | ParsedInvalidReference;

const CCC_RE = /^ccc\.?\s*(\d{1,4})$/i;

// Book token: an optional leading digit (1cor, 2sam), optionally separated
// from the letters by a single space, followed by letters (incl. common
// Latin accented ranges for Portuguese abbreviations).
const BOOK_TOKEN = `\\d?\\s?[a-zà-öø-ÿ]+`;
const BIBLE_RE = new RegExp(
	`^(${BOOK_TOKEN})\\s+(\\d{1,3})(?:[:,](\\d{1,3})(?:-(\\d{1,3}))?)?$`,
	'i'
);

export function parseReference(input: string): ParsedReference {
	const raw = input;
	const trimmed = input.trim();

	if (!trimmed) {
		return { kind: 'invalid', raw };
	}

	const cccMatch = trimmed.match(CCC_RE);
	if (cccMatch) {
		return { kind: 'ccc', n: Number(cccMatch[1]), raw };
	}

	const bibleMatch = trimmed.match(BIBLE_RE);
	if (bibleMatch) {
		const [, bookRaw, chapterRaw, verseRaw, verseEndRaw] = bibleMatch;
		const book = bookRaw.replace(/\s+/g, '').toLowerCase();
		let chapter = Number(chapterRaw);
		let verse = verseRaw ? Number(verseRaw) : undefined;
		let verseEnd = verseEndRaw ? Number(verseEndRaw) : undefined;

		const osis = DIVERGENT_BOOK_TOKENS[book];
		if (osis) {
			const [primary] = toVulgateCandidates(osis, chapter, verse);
			chapter = primary.chapter;
			verse = primary.verse;
			if (verseEnd !== undefined) {
				// Convert the range end against the ORIGINAL (Hebrew) chapter,
				// not the already-converted one, then only keep it if it lands
				// in the same Vulgate chapter as the start — a range that
				// crosses a Hebrew/Vulgate split (e.g. across Ps 147's
				// boundary) can't be represented by this shape; drop the end
				// rather than point it at the wrong chapter.
				const [endCandidate] = toVulgateCandidates(osis, Number(chapterRaw), verseEnd);
				verseEnd = endCandidate.chapter === chapter ? endCandidate.verse : undefined;
			}
		}

		return { kind: 'bible', book, chapter, verse, verseEnd, raw };
	}

	return { kind: 'invalid', raw };
}
