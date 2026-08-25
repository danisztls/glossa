/**
 * Splitting the opening of a passage into the three pieces a drop cap needs:
 * the punctuation that leads into it, the one letter that gets set large, and
 * the body text that wraps around it (`.drop-cap-letter` / `.drop-cap-lead`
 * in app.css).
 *
 * WHY THE PUNCTUATION IS ITS OWN PIECE. It used to go *inside* the cap, on the
 * reasoning that a typesetter would take `"` and `A` together rather than
 * strand `And` at body size. That reasoning holds for the pairing; it does not
 * survive the size. Set in the display face at 4.98em, a `«` is two chevrons
 * about as wide as the letter beside it, so `«Ninguém` opened with a red mark
 * the reader had to parse past before reaching the initial — the ornament
 * announcing a quotation mark instead of a chapter. 322 PT and 335 EN
 * drop-cap positions in the corpus open on a quotation mark, so this is the
 * common case, not an edge one. The mark now sets at body size at the cap's
 * shoulder, which is what the printed editions do.
 *
 * "First letter" is still not `text[0]`, for the reasons the corpus exhibits:
 *
 *   - Portuguese is accented. `Ó`, `É`, `À` may arrive decomposed (a base
 *     letter followed by a combining mark), where slicing at index 1 splits
 *     the accent off its letter and renders a bare diacritic in the cap.
 *     Iterating by grapheme rather than by code unit keeps them together.
 *   - Blocks arrive with leading whitespace from the parser; whitespace in
 *     the cap would push the float away from the margin.
 *   - Openings exist that no cap suits at all (see NOT EVERY OPENING below).
 *
 * When there is nothing sensible to promote this returns an empty `first` and
 * the text unchanged in `rest`; the caller then renders it plainly, which is
 * the correct degradation — a passage without an initial, not a broken one.
 */

/** Opening punctuation that leads into the cap, set at body size beside it. */
const LEADING_PUNCT = /[\s"'“”‘’«»¿¡([{—–-]/u;

/*
 * NOT EVERY OPENING GETS A CAP, and the two exclusions are deliberate.
 *
 * Digits. `LETTER` used to be `\p{L}|\p{N}`, so a passage opening "1." set a
 * five-em blackletter "1" — which reads as a list numeral rendered by mistake,
 * not as an initial. The corpus has 19 such positions, all of them genuinely
 * enumerations: "1. Regulation of the sacred liturgy…" (Sacrosanctum
 * Concilium), "1) Conferência episcopal…" (Christus Dominus).
 *
 * Lowercase. 14 positions, of two kinds. Some are legitimate — "(a) To
 * bishops…" in Christus Dominus, and CCC 1353-1354, which open mid-sentence
 * by design. The rest are transcription defects in bible.matos-soares.pt
 * (Exod 14:1, Exod 25:1, Num 18:1, Num 34:1 all read "o Senhor…"; Sir 41:1
 * reads "ó morte"), where the raw HTML has a lowercase letter that the other
 * eleven identical openings in the same book capitalise.
 *
 * Suppressing the cap is NOT the same move as `text-transform: uppercase`,
 * which app.css's @font-face docblock rejects and still rejects: that would
 * silently print a letter the corpus does not contain, while this leaves
 * every character exactly as the source has it and merely declines to
 * ornament it. The defect stays as visible as it was — an opening without an
 * initial, where every neighbouring chapter has one.
 */
const CAP_LETTER = /\p{L}/u;
const LOWERCASE = /\p{Ll}/u;

/*
 * CURSIVE SCRIPTS GET NO CAP, and this is a correctness rule rather than a
 * stylistic one.
 *
 * Arabic letters join, and take a different shape depending on whether they
 * sit at the start, middle or end of a word. A drop cap works by lifting the
 * first letter into its own element, which severs that join: the promoted
 * letter renders in isolated form and the remainder re-forms without it, so
 * `نحن` set with a cap is not big-`ن` plus `حن` but a differently-spelled
 * word. Latin can be cut anywhere because its letters do not touch; Arabic
 * cannot be cut at all.
 *
 * Two further reasons it would be wrong even if the join survived. Arabic is
 * unicase, so there is no majuscule to promote — enlarging the first letter
 * has none of the register shift a Latin initial carries. And the tradition
 * already has its own device for the job: the ʿunwān, an illuminated headpiece
 * BAND above the text block, with the opening words rubricated. Ornament goes
 * over the text, not inside the first line.
 *
 * Syriac is listed with it because it joins the same way, and Garshuni (Arabic
 * written in Syriac letters) is a live possibility for a Maronite or Syriac
 * Catholic text this corpus might yet take. Adding a script here is the whole
 * fix; nothing downstream needs to know.
 */
const JOINING_SCRIPT = /[\p{Script=Arabic}\p{Script=Syriac}]/u;

export interface DropCapSplit {
	/** Opening punctuation, set at body size ahead of the cap — may be empty. */
	lead: string;
	/** The single letter set as the drop cap — empty when no cap is warranted. */
	first: string;
	/** Everything after them, to be rendered at body size. */
	rest: string;
}

/**
 * Grapheme-aware where the runtime supports it, code-point-aware otherwise.
 * `Intl.Segmenter` is in every browser this site targets, but is guarded
 * because this module also runs under Node: `dropcap.test.ts` calls
 * `splitDropCap` directly under vitest's Node test environment
 * (`environment: 'node'`, vitest.config.ts). It used to run under Node
 * during the build's prerendering pass too, before the site became one SPA
 * shell with `ssr = false` (`+layout.ts`, docs/decisions.md §The site) —
 * but the guard was never only about that, and stays regardless of which
 * Node context reaches it.
 */
function graphemes(text: string): string[] {
	if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
		const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' });
		return [...segmenter.segment(text)].map((s) => s.segment);
	}
	// `[...text]` splits by code point, which already keeps surrogate pairs
	// intact; only combining marks are at risk, and those are rare enough in
	// this corpus that the fallback is acceptable where Segmenter is absent.
	return [...text];
}

/** No cap: the caller renders `rest` as ordinary text. */
const NO_CAP = (text: string): DropCapSplit => ({ lead: '', first: '', rest: text });

export function splitDropCap(text: string): DropCapSplit {
	const units = graphemes(text.trimStart());
	if (units.length === 0) return NO_CAP(text);

	// Take the leading punctuation, then exactly one letter. Bounded at 3 units
	// so a passage opening with a run of punctuation ("«— ...") can't push the
	// cap arbitrarily far into the line. Interior whitespace stays in the lead
	// rather than being dropped — `« Caritas in veritate »` is how the source
	// spaces its guillemets, and `lead + first + rest` has to reproduce the
	// passage character for character.
	let taken = 0;
	while (taken < units.length && taken < 3 && LEADING_PUNCT.test(units[taken])) taken++;

	// The unit after the punctuation run must be a letter this file is willing
	// to set large. Without this check a passage opening "..." promotes a lone
	// period into a three-line drop cap — punctuation that is neither opening
	// punctuation nor a letter has nothing to lead into.
	const candidate = units[taken];
	if (candidate === undefined) return NO_CAP(text);
	if (!CAP_LETTER.test(candidate) || LOWERCASE.test(candidate)) return NO_CAP(text);
	// See JOINING_SCRIPT: promoting the letter would change how the word is
	// spelled, not just how large it is set.
	if (JOINING_SCRIPT.test(candidate)) return NO_CAP(text);

	return {
		lead: units.slice(0, taken).join(''),
		first: candidate,
		rest: units.slice(taken + 1).join('')
	};
}
