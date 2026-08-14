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
 */

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
		return {
			kind: 'bible',
			book: bookRaw.replace(/\s+/g, '').toLowerCase(),
			chapter: Number(chapterRaw),
			verse: verseRaw ? Number(verseRaw) : undefined,
			verseEnd: verseEndRaw ? Number(verseEndRaw) : undefined,
			raw
		};
	}

	return { kind: 'invalid', raw };
}
