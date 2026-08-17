/**
 * Reference parser for the jump box.
 *
 * This module only parses *syntax* — it turns a typed string into a
 * structured reference. It knows nothing about which books or CCC
 * paragraphs actually exist; resolving a parsed `book` token against real
 * corpus data (abbrevs, names, OSIS codes) is the caller's job (see
 * `book-token.ts`'s `resolveBookToken`). Keeping this module corpus-agnostic
 * keeps it trivially unit-testable and safe to grow.
 *
 * The grammar covers the citation conventions of BOTH languages the corpus
 * carries, because a reader types the notation their own books print, not
 * the one the parser happens to have been written against:
 *
 *   - `ccc 1234`, `catecismo 1234`  → CCC paragraph
 *   - `<book> <chapter>`            → whole chapter, e.g. `gen 1`, `gênesis 1`
 *   - `<book> <chapter>:<v>`        → EN colon style, e.g. `john 3:16`
 *   - `<book> <chapter>,<v>`        → PT comma style, e.g. `jo 3,16`
 *   - `<book> <c>:<v>-<v2>`         → verse range, `john 3:16-18`, `jo 3,16-18`
 *                                     (hyphen, en dash or em dash)
 *   - `<book> <c>:<v>,<v2>` / `<c>,<v>.<v2>` → a verse LIST; EN chains with
 *     "," and PT with "." after the first verse. Parsed so the reference is
 *     recognized at all, but only the first verse (and its range, if any)
 *     survives — the jump box lands on one passage, and inventing a span
 *     from a list's outer bounds would highlight verses the reader never
 *     named.
 *   - `<book> <c>:<v>ff` / `<c>,<v>ss` → EN "and following" / PT "e
 *     seguintes". The open-ended tail has no end to highlight, so it lands
 *     on the named verse.
 *   - `<book> <c1>-<c2>`            → chapter range, e.g. `gen 1-3`. Kept as
 *     `chapterEnd` rather than dropped: the caller needs it to read
 *     `jude 3-5` correctly once it knows Jude has one chapter (see below).
 *   - Book tokens may be an abbreviation, a full name, or a multi-word name:
 *     `são joão 1,1-3`, `cântico dos cânticos 2,1`, `acts of the apostles
 *     2:42`. Their number prefix may be a digit or a Roman numeral, spaced
 *     or not, and abbreviating dots are tolerated: `1cor 13:4`, `1 cor 13:4`,
 *     `I Coríntios 13,4`, `1 Cor. 13,4`.
 *
 * `book` is returned NORMALIZED — lowercased, dots and spaces removed,
 * a leading Roman numeral folded to a digit — which is the same shape the
 * corpus's own `abbrevs` are stored in ("songofsongs", "1cor"). Diacritics
 * are deliberately PRESERVED: in Portuguese `jó` is Job and `jo` is John, so
 * folding accents here would silently merge two books. Accent-insensitive
 * matching is a *fallback tier* in `book-token.ts`, applied only after every
 * exact reading has failed.
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
 * real jump-box abbreviations and names these three books actually have in
 * both v1 editions (`corpus/works/*\/books/{ps,mal,joel}.json`'s `abbrevs`
 * and `name`) plus their bare OSIS codes — not the full abbreviation
 * grammar `corpus.ts` and `refs.ts` own, since only these three books need
 * converting at all.
 */

import { toVulgateCandidates } from './versification';

/** Real jump-box abbreviations and names for the three books this module converts (verified against `corpus/works/*\/books/{ps,mal,joel}.json`, both editions), normalized the same way `book` tokens are below. Bare OSIS codes are included since book resolution also matches those directly. */
const DIVERGENT_BOOK_TOKENS: Record<string, string> = {
	ps: 'ps',
	psalm: 'ps',
	psalms: 'ps',
	psa: 'ps',
	sl: 'ps',
	salmo: 'ps',
	salmos: 'ps',
	mal: 'mal',
	malachi: 'mal',
	malaquias: 'mal',
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
	/** Normalized book token (see the module docblock) — NOT necessarily a known OSIS code. */
	book: string;
	chapter: number;
	/** End of a chapter range typed without any verse (`gen 1-3`). Only the caller, which knows how many chapters the book has, can tell this from `jude 3-5`'s verse range. */
	chapterEnd?: number;
	verse?: number;
	verseEnd?: number;
	raw: string;
}

export interface ParsedInvalidReference {
	kind: 'invalid';
	raw: string;
}

export type ParsedReference = ParsedCccReference | ParsedBibleReference | ParsedInvalidReference;

// "catecismo": the Catechism's Portuguese name, and the only unambiguous PT
// alias for it. "CIC" is deliberately NOT accepted even though Brazilian
// usage often means the Catechism by it — `refs.ts`'s PT siglum table reads
// CIC as the Codex Iuris Canonici, and one input surface must not contradict
// the other about what a siglum means.
const CCC_RE = /^(?:ccc|catecismo)\.?\s*(\d{1,4})$/i;

// A book token: an optional leading digit (1cor, 2sam) — a Roman numeral
// prefix needs no special case here, since "I"/"II"/"III" are letters and
// `normalizeBookToken` folds them to digits afterwards — then one or more
// words, which may carry the dots of an abbreviation ("1 Cor.") and the
// spaces of a full name ("São João", "Song of Songs"). Non-greedy so the
// trailing `\s+<digits>` still claims the chapter number.
const BOOK_TOKEN = String.raw`\d?\s*\p{L}[\p{L}\s.]*?`;

const BIBLE_RE = new RegExp(
	`^(${BOOK_TOKEN})\\s+(\\d{1,3})` +
		// Dual Psalm numbering, "Sl 22(23)" — see `parseReference`.
		`(?:\\s*\\((\\d{1,3})\\))?` +
		`(?:\\s*[:,]\\s*(\\d{1,3})` +
		`(?:\\s*[-–—]\\s*(\\d{1,3}))?` +
		// "ff" / "ss" — an open-ended tail with no end to highlight.
		`(?:\\s*(?:s{1,2}|f{1,2})\\.?)?` +
		// Further verses in a list; matched so the whole string is recognized,
		// then discarded (see the module docblock).
		`(?:\\s*[.,;]\\s*\\d{1,3}(?:\\s*[-–—]\\s*\\d{1,3})?)*)?` +
		// A chapter range, only reachable when no verse was given.
		`(?:\\s*[-–—]\\s*(\\d{1,3}))?$`,
	'iu'
);

/**
 * Fold a raw book token to the shape the corpus stores abbreviations in:
 * lowercase, no abbreviating dots, no spaces, and a leading Roman numeral
 * rewritten as the digit it stands for ("I Coríntios" -> "1coríntios", which
 * is exactly what that book's own `name` normalizes to).
 *
 * Exported because `book-token.ts` must normalize the corpus's `name`/
 * `abbrevs` with the SAME function it normalizes the typed token with —
 * two near-identical private copies would drift.
 */
export function normalizeBookToken(raw: string): string {
	const spaced = raw.toLowerCase().replace(/\./g, ' ').trim().replace(/\s+/g, ' ');
	// The `\s` is what keeps this off "Isaías"/"Is": only a standalone
	// leading i/ii/iii is a numeral.
	return spaced
		.replace(/^(i{1,3})\s/, (_, roman: string) => String(roman.length))
		.replace(/\s+/g, '');
}

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
		const [, bookRaw, chapterRaw, altChapterRaw, verseRaw, verseEndRaw, chapterEndRaw] = bibleMatch;
		const book = normalizeBookToken(bookRaw);
		let chapter = Number(chapterRaw);
		let verse = verseRaw ? Number(verseRaw) : undefined;
		let verseEnd = verseEndRaw ? Number(verseEndRaw) : undefined;
		const chapterEnd = chapterEndRaw ? Number(chapterEndRaw) : undefined;

		const osis = DIVERGENT_BOOK_TOKENS[book];

		if (altChapterRaw !== undefined) {
			// Dual numbering, "Sl 22(23)" / "Ps 23(22)" — Portuguese psalters
			// (and Latin ones) print both systems side by side. The reader has
			// already told us the Vulgate number, so the Hebrew conversion below
			// must NOT also run; the only question is which of the two is which,
			// and it always has the same answer: across every divergence (the
			// 9/10 merge, the 113 split, the 146/147 merge) the Vulgate number
			// is the lower one. Taking the minimum is therefore correct
			// regardless of the order the pair was printed in.
			chapter = Math.min(chapter, Number(altChapterRaw));
			return { kind: 'bible', book, chapter, chapterEnd, verse, verseEnd, raw };
		}

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

		return { kind: 'bible', book, chapter, chapterEnd, verse, verseEnd, raw };
	}

	return { kind: 'invalid', raw };
}
