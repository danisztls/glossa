/**
 * Resolving a typed book token to a real book, across every edition.
 *
 * `refparse.ts` hands over a normalized token and takes no view on whether
 * any book answers to it; `corpus.ts`'s `findBookByAbbrev` answers that for
 * ONE edition and only against `osis`/`abbrevs`. This module is the layer
 * between: it decides which surface forms count as naming a book, and in
 * what order competing readings win.
 *
 * WHY NAMES, NOT JUST ABBREVIATIONS. The two v1 editions record their
 * abbreviations very differently. CPDV's are generous — `john` carries
 * `jn|joh|john`, `song` carries `songofsongs|sos|canticles|cant`, so an
 * English reader typing a full name already resolved by accident. Matos
 * Soares carries exactly one abbreviation per book (`jo`, `sl`, `gn`), so
 * *every* Portuguese full name failed: `salmos 23`, `gênesis 1`, `são joão
 * 1,1-3` all fell through to "no match" while their English counterparts
 * worked. Matching `name` as well as `abbrevs` closes that asymmetry at the
 * lookup layer rather than by editing corpus data, which
 * `docs/decisions.md` keeps as a verbatim record of the source edition.
 *
 * WHY TIERS RATHER THAN ONE FLAT SET. Portuguese makes accent-insensitivity
 * genuinely dangerous: `Jó` is Job and `Jo` is John, one keystroke apart and
 * both real abbreviations in the same edition. Folding accents up front
 * would make `jó 1,1` ambiguous forever. So an exact reading always wins —
 * accents and all — and accent-folding only runs after every edition has
 * failed to match exactly, which is where it belongs: it serves the reader
 * who *can't* or didn't type the accent, and it can no longer overrule the
 * reader who did.
 *
 * That ordering has exactly ONE casualty, measured by resolving every book
 * of both editions by its every abbreviation, its name, and its unaccented
 * name: `jo` reaches John, never Job, because it is John's real abbreviation
 * in the Portuguese edition and an exact abbreviation outranks a folded
 * name. `jó` still reaches Job. Every other book in both editions — 73 of
 * them — is reachable by all three forms.
 *
 * WHY THE READER'S OWN EDITION GOES FIRST WITHIN A TIER. Some abbreviations
 * are real in both languages and mean different books: `jn` is John in
 * English and *Jonas* in Portuguese (`refs.ts` documents that inversion —
 * "a direct swap of the English convention"). There is no correct
 * edition-blind answer, so the tie goes to whichever edition the reader
 * currently has open. The destination is still edition-free (the caller
 * navigates to `/bible/{osis}/{chapter}`, per site/docs/addresses.md); the
 * preference decides only how an ambiguous *token* is read.
 */

import { baseLang, listBibleWorks, listBooks, PREFERRED_EDITION } from './corpus';
import type { BibleBookMeta } from './corpus-index';
import { normalizeBookToken } from './refparse';

export interface ResolvedBook {
	/** The edition whose surface forms matched — reported for callers that want to say so, not baked into the destination. */
	workId: string;
	book: BibleBookMeta;
}

/** Strip combining marks: "gênesis" -> "genesis", "são joão" -> "sao joao". Only ever applied as the last tier — see the module docblock. */
function foldDiacritics(s: string): string {
	return s.normalize('NFD').replace(/\p{Mn}/gu, '');
}

/**
 * Editions in resolution order: the reader's own first, then each language's
 * preferred edition ahead of its siblings, then registry order.
 *
 * THE SECOND RULE ARRIVED WITH THE SECOND ENGLISH BIBLE. Within one tier
 * several editions can match a token exactly — `gen` is a real abbreviation
 * in both the CPDV and the Douay-Rheims — and until 2026-08-24 no English
 * edition had a rival, so "registry order" was never a decision anyone made.
 * It is one now, and it defers to the same `PREFERRED_EDITION` table the
 * reader's default edition comes from rather than inventing a second answer.
 *
 * This orders editions WITHIN a tier and never across one: a stronger
 * reading in any edition still beats a weaker reading in the preferred one,
 * which is the module docblock's whole design. So `genesis` — an explicit
 * abbreviation in the Douay-Rheims, merely the display name in the CPDV —
 * still reports the Douay-Rheims.
 */
function orderedWorkIds(preferWorkId?: string): string[] {
	const works = listBibleWorks();
	const preferredRank = (id: string, language: string) =>
		PREFERRED_EDITION[`bible:${baseLang(language)}`] === id ? 0 : 1;
	const ids = works
		.map((w, index) => ({ id: w.id, rank: preferredRank(w.id, w.language), index }))
		.sort((a, b) => a.rank - b.rank || a.index - b.index)
		.map((w) => w.id);
	if (!preferWorkId || !ids.includes(preferWorkId)) return ids;
	return [preferWorkId, ...ids.filter((id) => id !== preferWorkId)];
}

type Tier = (book: BibleBookMeta, needle: string, folded: string) => boolean;

// Tier order is the whole design (see the module docblock): an OSIS code or a
// real abbreviation beats a display name, and any exact reading beats an
// accent-folded one.
const TIERS: Tier[] = [
	(book, needle) =>
		book.osis === needle || book.abbrevs.some((a) => normalizeBookToken(a) === needle),
	(book, needle) => normalizeBookToken(book.name) === needle,
	(book, _needle, folded) =>
		foldDiacritics(book.osis) === folded ||
		foldDiacritics(normalizeBookToken(book.name)) === folded ||
		book.abbrevs.some((a) => foldDiacritics(normalizeBookToken(a)) === folded)
];

/**
 * The book a typed token names, or `undefined`.
 *
 * `token` is expected in `normalizeBookToken` shape (what `parseReference`
 * returns); it is re-normalized here anyway so a caller with a raw string —
 * a test, a future URL parameter — gets the same answer.
 */
export function resolveBookToken(
	token: string,
	opts: { preferWorkId?: string } = {}
): ResolvedBook | undefined {
	const needle = normalizeBookToken(token);
	if (!needle) return undefined;
	const folded = foldDiacritics(needle);
	const workIds = orderedWorkIds(opts.preferWorkId);

	for (const tier of TIERS) {
		for (const workId of workIds) {
			const book = listBooks(workId).find((b) => tier(b, needle, folded));
			if (book) return { workId, book };
		}
	}
	return undefined;
}
