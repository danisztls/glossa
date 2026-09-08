/**
 * Hebrew/Masoretic ("modern") ↔ Vulgate versification mapping.
 *
 * Glossa Catholica's canonical Bible address space is the **Vulgate** (both v1
 * editions — `bible.cpdv.en`, `bible.matos-soares.pt` — print Vulgate
 * chapter/verse numbering; see `docs/corpus-schema.md`'s
 * `psalm_numbering: "vulgate"`). But the CCC's own footnote citations, and
 * anything a reader types, may be phrased in Hebrew/Masoretic numbering —
 * the convention most modern Bible translations (NAB, RSV, NIV, ...) use
 * for the handful of books where it diverges from the Vulgate. This module
 * converts Hebrew-numbered addresses into the Vulgate addresses that
 * actually exist in our corpus.
 *
 * ## Why this exists (see docs/link-surface.md)
 *
 * `docs/link-surface.md` originally scoped this divergence to the Psalms
 * and to jump-box typing only ("Psalm 23 opens Psalm 22"). A real build
 * failure proved that scoping wrong: CCC 678 cites `Mal 3: 19`, which is
 * Hebrew versification — Malachi 3 ends at verse 18 in both v1 editions,
 * and Hebrew 3:19-24 is Vulgate 4:1-6. The CCC's own citation apparatus is
 * a second consumer of this mapping beyond the jump box, and Malachi is not
 * the only book affected (see below).
 *
 * ## What was actually measured (not guessed)
 *
 * Per the task brief's "measure before you design": every citation string
 * in the real `ccc.en`/`ccc.pt` `paragraphs.json` was run through
 * `parseRefs` (`refs.ts`) and every resulting `{osis, chapter, verse}`
 * checked for existence against the real `bible.cpdv.en` /
 * `bible.matos-soares.pt` book files (script discarded per instructions,
 * not checked in). Findings:
 *
 *   - **Psalms**: 44 citations (28 EN clauses + a further set of the same
 *     underlying refs re-cited in PT, ~14 PT clauses) named a chapter/verse
 *     that doesn't exist in the Vulgate edition at that literal number.
 *     Every single one resolves with the chapter mapping below and the
 *     verse number UNCHANGED — see "Why there's no verse offset" below.
 *   - **Malachi**: confirmed live (`ccc678`'s `Mal 3: 19`).
 *   - **Joel**: `Joel 3:1-5` and `Joel 3-4` appear three times across both
 *     languages (`ccc702`(EN)/equivalent PT, `ccc677`-area citations,
 *     `ccc678`). Critically, `Joel 3:1-5` does NOT fail an existence check
 *     — Vulgate Joel chapter 3 has 21 verses, so verses 1-5 trivially
 *     "exist" — but at the WRONG content: Vulgate Joel 3 is Hebrew Joel 4;
 *     Hebrew Joel 3 is the *tail* of Vulgate Joel 2 (verses 28-32). Left
 *     unconverted, this citation would silently link to the wrong chapter
 *     without ever tripping a "dead link" check. This is why the mapping
 *     below is applied unconditionally for these three books rather than
 *     only as a fallback after an existence check fails (see refs.ts's
 *     `refHref` for the wiring and a longer discussion of why "try as
 *     given, then try Hebrew→Vulgate" is unsafe for a book whose Hebrew
 *     chapter number happens to also be a valid — but wrong — Vulgate
 *     chapter number).
 *   - **Everything else that failed the existence check** (a handful of
 *     2 Corinthians/Acts/Matthew NT verse-count quirks, and several
 *     obvious transcription typos like `Dt 6:45` in a 25-verse chapter, or
 *     `Isa 45:51` in a 26-verse chapter) is NOT a Hebrew/Vulgate OT
 *     divergence — the Hebrew Masoretic text only exists for the Old
 *     Testament, so an NT verse-count mismatch is a different phenomenon
 *     (a different Greek-NT verse-numbering tradition, or a plain
 *     transcription error) outside this module's scope. Left unmapped per
 *     the project's under-linking-beats-a-wrong-link principle; see
 *     `xrefs.py`'s "dropped implausible refs" report bucket, which already
 *     surfaces the OT chapter-overrun typos and needed no change here.
 *   - **Candidates named in the task brief but NOT found to diverge in this
 *     corpus** (checked, not guessed): Jonah, Hosea, Ecclesiastes,
 *     Isaiah 8/9, Daniel, 3 John, Sirach, 1-2 Samuel. Daniel was checked
 *     specifically because chapter 3's deuterocanonical insertion (the
 *     Song of the Three Young Men, Vulgate-only verses ~24-90) is a classic
 *     Vulgate/Hebrew divergence — but the real citations (`Dan 3:57-80`,
 *     `Dan 3:79-81`) already cite the *extended* verse numbers, and CPDV's
 *     Daniel 3 already has 100 verses (the deuterocanonical text is
 *     already in our Vulgate corpus at those numbers), so there is nothing
 *     to convert. Not implemented; if a future citation needs one of these
 *     books, extend this file rather than guessing now.
 *
 * ## Why there's no verse-level "title-as-verse-1" offset
 *
 * The well-known fact that Vulgate psalters count a Hebrew psalm's
 * superscription as verse 1 (shifting every other verse +1 relative to a
 * KJV/RSV-style edition that leaves the title unnumbered) is real, but
 * turns out not to matter here: spot-checking real corpus text confirms
 * both v1 editions' citation sources ALREADY count the title as verse 1,
 * matching the Vulgate's own convention (e.g. CCC 298's "Ps 51:12" needs
 * only the chapter shift 51→50 — Vulgate Ps 50:12 is verbatim "Create a
 * clean heart in me, O God", the exact verse meant, with no verse-number
 * change at all). All 44 measured Psalm problems resolve with chapter
 * mapping alone and an UNCHANGED verse number — not one needed a ±1
 * correction. A per-psalm "does this psalm have a title" table (the
 * classic ~34-orphan-psalm list) would be needed to do the KJV-style
 * conversion in general, but since no real citation in this corpus needs
 * it, and getting even one entry of that table wrong would silently
 * produce a plausible-but-wrong link (worse than today's under-linking),
 * it is deliberately NOT implemented. If a future consumer needs to accept
 * KJV/RSV-style (title-unnumbered) Psalm references, that table has to be
 * built and verified against the corpus first — flagged here, not guessed.
 *
 * **THE CONSUMER ARRIVED AND DID NOT NEED IT** (2026-09-06). The lectionary
 * cites psalms as USCCB prints them, which is the NAB's numbering, and the
 * NAB counts a superscription as a verse exactly as the Vulgate does — so
 * the chapter shift alone is still the whole conversion. `Psalm 51:3` is the
 * Miserere and `Psalm 4:2` is `Cum invocarem`, both a verse the KJV
 * convention calls 1, and about twenty psalms whose title is its own verse
 * agree. `lectionary/psalms-oracle.test.ts` holds the check: every psalm
 * verse the table cites lands inside the psalm it maps to. So the orphan-
 * psalm table remains unbuilt for the original reason and not for want of
 * anyone needing it — no source this corpus reads numbers psalms that way.
 *
 * ## Design
 *
 * Pure and dependency-free: no corpus import. `toVulgateCandidates` takes a
 * Hebrew-or-already-Vulgate `{osis, chapter, verse?}` and returns Vulgate
 * address candidates, best guess first — usually exactly one, but two for
 * the handful of cases where a single Hebrew chapter genuinely splits
 * across two Vulgate chapters (Ps 116, Ps 147, Malachi 3) and no verse was
 * given to disambiguate which half. For any osis/chapter/verse combination
 * this module doesn't know to diverge, the input is returned unchanged
 * (identity) — safe by construction, since applying a no-op mapping can
 * never turn a correct address into a wrong one. `resolveVulgate` is the
 * convenience wrapper a caller with a real existence check (the corpus, or
 * a test fixture) uses to pick the first candidate that actually exists.
 */

export interface VulgateAddress {
	osis: string;
	chapter: number;
	verse?: number;
}

// --------------------------------------------------------------------------
// Psalms
//
// Heb 1–8 and 148–150 agree with Vulgate. In between, Vulgate is
// consistently one behind Hebrew EXCEPT at three places where the Hebrew
// Psalter's chapter count (150) is preserved by merging two short Hebrew
// psalms into one Vulgate chapter (9+10, 114+115) or splitting one long
// Hebrew psalm across two Vulgate chapters (116, 147):
//
//   Heb   1– 8  = Vulg   1– 8   (agree)
//   Heb   9–10  = Vulg   9      (merge: Heb 9 vv.1-21, then Heb 10 vv.1-18
//                                 continue as Vulg 9 vv.22-39)
//   Heb  11–113 = Vulg  10–112  (Vulg = Heb − 1)
//   Heb 114–115 = Vulg 113      (merge: Heb 114 vv.1-8, then Heb 115 vv.1-18
//                                 continue as Vulg 113 vv.9-26)
//   Heb 116     = Vulg 114–115  (split: Heb 116 vv.1-9 → Vulg 114 vv.1-9;
//                                 Heb 116 vv.10-19 → Vulg 115 vv.1-10)
//   Heb 117–146 = Vulg 116–145  (Vulg = Heb − 1)
//   Heb 147     = Vulg 146–147  (split: Heb 147 vv.1-11 → Vulg 146 vv.1-11;
//                                 Heb 147 vv.12-20 → Vulg 147 vv.1-9)
//   Heb 148–150 = Vulg 148–150  (agree)
//
// Every boundary and split point (21/18, 8/18, 9/10, 11/9) is verified
// against the real corpus's actual Vulgate verse counts, not textbook
// numbers: e.g. Vulg Ps 9 really has 39 verses (21+18), Vulg Ps 113 really
// has 26 (8+18), Vulg Ps 114 really has 9, Vulg Ps 115 really has 10,
// Vulg Ps 146 really has 11, Vulg Ps 147 really has 9 — see this module's
// test file, which re-asserts each of these against corpus-shaped fixture
// data.
// --------------------------------------------------------------------------

const PS_MERGE_9_10_SPLIT = 21; // Heb 9's own verse count (title-inclusive)
const PS_MERGE_114_115_SPLIT = 8; // Heb 114's own verse count
const PS_SPLIT_116_AT = 9; // last verse of Heb 116 that lands in Vulg 114
const PS_SPLIT_147_AT = 11; // last verse of Heb 147 that lands in Vulg 146

function mapPsalm(chapter: number, verse?: number): { chapter: number; verse?: number }[] {
	if (chapter >= 1 && chapter <= 8) return [{ chapter, verse }];
	if (chapter >= 148 && chapter <= 150) return [{ chapter, verse }];

	if (chapter === 9 || chapter === 10) {
		if (verse === undefined) return [{ chapter: 9 }];
		const v = chapter === 9 ? verse : verse + PS_MERGE_9_10_SPLIT;
		return [{ chapter: 9, verse: v }];
	}

	if (chapter >= 11 && chapter <= 113) return [{ chapter: chapter - 1, verse }];

	if (chapter === 114 || chapter === 115) {
		if (verse === undefined) return [{ chapter: 113 }];
		const v = chapter === 114 ? verse : verse + PS_MERGE_114_115_SPLIT;
		return [{ chapter: 113, verse: v }];
	}

	if (chapter === 116) {
		if (verse === undefined) return [{ chapter: 114 }, { chapter: 115 }]; // ambiguous: whole psalm spans both
		return verse <= PS_SPLIT_116_AT
			? [{ chapter: 114, verse }]
			: [{ chapter: 115, verse: verse - PS_SPLIT_116_AT }];
	}

	if (chapter >= 117 && chapter <= 146) return [{ chapter: chapter - 1, verse }];

	if (chapter === 147) {
		if (verse === undefined) return [{ chapter: 146 }, { chapter: 147 }]; // ambiguous: whole psalm spans both
		return verse <= PS_SPLIT_147_AT
			? [{ chapter: 146, verse }]
			: [{ chapter: 147, verse: verse - PS_SPLIT_147_AT }];
	}

	// Outside 1-150 entirely: not a valid Hebrew psalm number, nothing to
	// convert — pass through unchanged (identity; see module docblock).
	return [{ chapter, verse }];
}

// --------------------------------------------------------------------------
// Malachi
//
// Hebrew Malachi has 3 chapters; Vulgate splits the last one:
//   Heb 1–2       = Vulg 1–2  (agree)
//   Heb 3:1–18    = Vulg 3:1–18  (agree)
//   Heb 3:19–24   = Vulg 4:1–6   (confirmed live: CCC 678's "Mal 3: 19")
// Chapter 4 does not exist in Hebrew numbering at all, so an input chapter
// ≥ 4 is passed through unchanged (it can only be an already-Vulgate
// reference, e.g. someone citing "Mal 4:2" directly).
// --------------------------------------------------------------------------

const MAL_SPLIT_AT = 18; // last verse of Heb 3 that stays in Vulg 3

function mapMalachi(chapter: number, verse?: number): { chapter: number; verse?: number }[] {
	if (chapter === 1 || chapter === 2) return [{ chapter, verse }];
	if (chapter === 3) {
		if (verse === undefined) return [{ chapter: 3 }, { chapter: 4 }]; // ambiguous: whole chapter spans both
		return verse <= MAL_SPLIT_AT
			? [{ chapter: 3, verse }]
			: [{ chapter: 4, verse: verse - MAL_SPLIT_AT }];
	}
	return [{ chapter, verse }]; // chapter >= 4: no Hebrew equivalent, already-Vulgate input
}

// --------------------------------------------------------------------------
// Joel
//
// Hebrew Masoretic Joel has 4 chapters; Vulgate (matching the LXX split)
// has 3, folding Hebrew's short chapter 3 into the tail of Vulgate 2:
//   Heb 1        = Vulg 1        (agree)
//   Heb 2:1–27   = Vulg 2:1–27   (agree)
//   Heb 3:1–5    = Vulg 2:28–32  (confirmed live: "Joel 3:1-5", "Joel 3-4")
//   Heb 4        = Vulg 3        (Vulg = Heb − 1)
// Verified against the real corpus: Vulgate Joel chapter 2 really has 32
// verses (27 + 5), chapter 3 really has 21 (matching Heb 4's own length).
// --------------------------------------------------------------------------

const JOEL_CH2_SPLIT = 27; // Heb 2's own verse count

function mapJoel(chapter: number, verse?: number): { chapter: number; verse?: number }[] {
	if (chapter === 1) return [{ chapter: 1, verse }];
	if (chapter === 2) return [{ chapter: 2, verse }]; // Heb 2 always ⊆ Vulg 2's first 27 verses
	if (chapter === 3) {
		if (verse === undefined) return [{ chapter: 2 }]; // unambiguous: wholly nested in Vulg 2's tail
		return [{ chapter: 2, verse: verse + JOEL_CH2_SPLIT }];
	}
	if (chapter === 4) return [{ chapter: 3, verse }];
	return [{ chapter, verse }]; // outside 1-4: no Hebrew equivalent, already-Vulgate input
}

// --------------------------------------------------------------------------
// Arrangements: an EDITION's stored text, not a numbering tradition
//
// Everything above converts a REFERENCE phrased in Hebrew/Masoretic numbering.
// This converts one edition's own text, and the two must not be confused: a
// reader typing "Esther 13" means the Vulgate's chapter 13, and running that
// through the table below would move it to 16 and be wrong. Only
// `sync-corpus.mjs` may apply an arrangement, and only to the edition whose
// manifest declares it (`book_arrangement`, docs/corpus-schema.md).
//
// `bible.cpdv.en` is the first and only: it prints the Greek additions where
// they belong in the story rather than appended as 10:4-16:24, so its Esther
// has fifteen chapters and none of them names the text the corpus addresses at
// that number. Nothing else in the book is rewritten — the rows below carry
// all 274 of its verses onto all 275 Vulgate ones, which is a permutation, and
// `pipeline/scrapers/bible/divergence.py` re-derives that bijection from the
// two editions on every run rather than trusting this comment.
//
// ONE ROW IS NOT ONE-TO-ONE. CPDV 7:14 prints as a single verse what the
// Vulgate divides into 4:12 ("And when Mardochai had heard this,") and 4:13,
// so its text lands whole at 4:12 and 4:13 has no verse of its own in this
// edition. That is a gap in the numbering and not in the text; splitting the
// CPDV's sentence to fill it would be inventing a division it never printed,
// and the schema allows a verse gap precisely so this can be said honestly.
//
// Three seams move material the Vulgate prints twice or out of sequence, and
// no arithmetic finds them — each was read against `bible.douay-rheims.en`,
// the same base text in the same language at the Vulgate's numbers:
//   - Vulgate 15:1-3 is Mardochai's charge, which 4:8 has already narrated.
//     CPDV files its WORDS at 7:10-11 and the narrator's SUMMARY of them at
//     7:16 — the one row here that runs backwards.
//   - Vulgate 15:4-19 and 5:1-2 tell Esther's approach to the king twice,
//     Greek then Hebrew. CPDV keeps both, in that order.
//   - Vulgate 11:1, the Ptolemy colophon, moves from the head of the appendix
//     to the last verse of the book.
// --------------------------------------------------------------------------

/** `[chapter, first verse, last verse]`, inclusive. */
type Span = readonly [number, number, number];

/** CPDV's Esther onto the Vulgate's, in reading order down the CPDV. */
const ESTHER_GREEK_INTERLEAVED: readonly (readonly [Span, Span])[] = [
	[
		[1, 1, 11],
		[11, 2, 12]
	], // Mardochai's dream
	[
		[2, 1, 6],
		[12, 1, 6]
	], // the eunuchs' plot
	[
		[3, 1, 22],
		[1, 1, 22]
	], // the Hebrew book begins
	[
		[4, 1, 23],
		[2, 1, 23]
	],
	[
		[5, 1, 13],
		[3, 1, 13]
	],
	[
		[6, 1, 7],
		[13, 1, 7]
	], // the first edict, where it is sent
	[
		[6, 8, 9],
		[3, 14, 15]
	],
	[
		[7, 1, 9],
		[4, 1, 9]
	],
	[
		[7, 10, 11],
		[15, 2, 3]
	], // the charge, as its own words
	[
		[7, 12, 13],
		[4, 10, 11]
	],
	[
		[7, 14, 14],
		[4, 12, 13]
	], // THE MERGE — see above
	[
		[7, 15, 15],
		[4, 14, 14]
	],
	[
		[7, 16, 16],
		[15, 1, 1]
	], // the charge again, as the narrator's summary
	[
		[7, 17, 19],
		[4, 15, 17]
	],
	[
		[7, 20, 30],
		[13, 8, 18]
	], // Mardochai's prayer
	[
		[8, 1, 19],
		[14, 1, 19]
	], // Esther's prayer
	[
		[9, 1, 16],
		[15, 4, 19]
	], // before the king — Greek telling
	[
		[9, 17, 30],
		[5, 1, 14]
	], // and again — Hebrew telling
	[
		[10, 1, 14],
		[6, 1, 14]
	],
	[
		[11, 1, 10],
		[7, 1, 10]
	],
	[
		[12, 1, 12],
		[8, 1, 12]
	],
	[
		[13, 1, 24],
		[16, 1, 24]
	], // the second edict — "Esther 16"
	[
		[13, 25, 29],
		[8, 13, 17]
	],
	[
		[14, 1, 32],
		[9, 1, 32]
	],
	[
		[15, 1, 13],
		[10, 1, 13]
	],
	[
		[15, 14, 14],
		[11, 1, 1]
	] // the Ptolemy colophon, at the end
];

const ARRANGEMENTS: Record<string, Record<string, readonly (readonly [Span, Span])[]>> = {
	'greek-interleaved': { esth: ESTHER_GREEK_INTERLEAVED }
};

/** Whether `arrangement` re-addresses this book at all. */
export function isArrangedBook(arrangement: string, osis: string): boolean {
	return ARRANGEMENTS[arrangement]?.[osis] !== undefined;
}

/**
 * One verse of an arranged edition at its canonical Vulgate address.
 *
 * `undefined` when no row covers the verse, which for a book this arrangement
 * claims is a defect and not a pass-through: the table is total over the
 * edition, so an uncovered verse means the edition was re-parsed into a shape
 * the table no longer describes. The caller raises rather than guessing —
 * silently keeping the CPDV's own number would put a verse of the Greek
 * appendix at a Hebrew chapter's address, which is the failure this whole
 * module exists to prevent.
 */
export function arrangedToVulgate(
	arrangement: string,
	osis: string,
	chapter: number,
	verse: number
): { chapter: number; verse: number } | undefined {
	for (const [from, to] of ARRANGEMENTS[arrangement]?.[osis] ?? []) {
		if (chapter === from[0] && verse >= from[1] && verse <= from[2]) {
			return { chapter: to[0], verse: to[1] + (verse - from[1]) };
		}
	}
	return undefined;
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

const DIVERGENT_MAPPERS: Record<
	string,
	(chapter: number, verse?: number) => { chapter: number; verse?: number }[]
> = {
	ps: mapPsalm,
	mal: mapMalachi,
	joel: mapJoel
};

/**
 * Late-merge point mappings (a Python twin of this table existed until
 * 2026-08-21, when it was deleted with the rest of `pipeline/build/`);
 * keep the two in step.
 *
 * The three books above diverge WHOLESALE: chapter boundaries move, so every
 * reference into them needs converting and each has a mapper. A second, much
 * narrower divergence exists too, and it does not deserve a mapper: a handful
 * of individual chapters where the Vulgate MERGES two verses modern editions
 * print separately, so the tail of that one chapter runs one or two ahead
 * while the rest of the book agrees exactly.
 *
 * Recorded as explicit point mappings rather than per-chapter offset rules,
 * because a point mapping cannot extrapolate. Every entry was verified by
 * reading BOTH shipped editions at the target address and confirming the text
 * is the passage the modern number names; `bible.cpdv.en` and
 * `bible.matos-soares.pt` agree on all of them. Nothing is inferred from
 * verse counts — a chapter being two verses short tells you an offset exists
 * somewhere, never where it starts.
 *
 * WHY THIS MATTERS MORE THAN THE OUT-OF-RANGE VERSES THAT EXPOSED IT: these
 * were found because CCC citations pointed past the end of a chapter (Acts
 * 7:60 in a 59-verse Acts 7), which fails loudly. But the same offset means
 * the verses just BEFORE it resolve to real, existing, wrong text — "Mt
 * 17:24-27" was landing on Vulgate 17:24-26, one verse off for its whole
 * length, and nothing would have complained. Hence an entry per cited verse,
 * not only the one that overflowed.
 */
const LATE_MERGE = new Map<string, { chapter: number; verse: number }>([
	// 2 Cor 13: the Vulgate joins modern 13:12/13, so the Trinitarian blessing
	// closing the letter is 13:13 here. Cited by CCC 249, 734 and 2627.
	['2cor:13:14', { chapter: 13, verse: 13 }],
	// Zechariah 2: modern editions move Hebrew 2:1-4 up into chapter 1, so the
	// chapter runs four verses ahead.
	['zech:2:14', { chapter: 2, verse: 10 }],
	// Exodus 40: offset by two across the chapter's tail.
	['exod:40:34', { chapter: 40, verse: 32 }],
	['exod:40:35', { chapter: 40, verse: 33 }],
	['exod:40:36', { chapter: 40, verse: 34 }],
	['exod:40:37', { chapter: 40, verse: 35 }],
	['exod:40:38', { chapter: 40, verse: 36 }],
	// Matthew 17: offset by one from the temple-tax episode onward.
	['matt:17:24', { chapter: 17, verse: 23 }],
	['matt:17:25', { chapter: 17, verse: 24 }],
	['matt:17:26', { chapter: 17, verse: 25 }],
	['matt:17:27', { chapter: 17, verse: 26 }],
	// Acts 7: offset by one through the stoning of Stephen.
	['acts:7:57', { chapter: 7, verse: 56 }],
	['acts:7:58', { chapter: 7, verse: 57 }],
	['acts:7:59', { chapter: 7, verse: 58 }],
	['acts:7:60', { chapter: 7, verse: 59 }],
	// Psalm 56 (Vulgate 55): the Vulgate joins the two halves of the refrain
	// into 55:11 — "In Deo laudabo verbum, in Domino laudabo sermonem" and "in
	// Deo speravi, non timebo quid faciat mihi homo" are one verse there and
	// two in Hebrew — so the tail runs one ahead from 56:12 on. All four
	// shipped Vulgate psalters agree (`clementina.la`, `cpdv.en`,
	// `douay-rheims.en`, `matos-soares.pt`), and 55:12 is "In me sunt Deus
	// vota tua" against 55:13's "Quoniam eripuisti animam meam de morte".
	//
	// KEYED BY THE VULGATE CHAPTER AND THE HEBREW VERSE, because this table is
	// consulted AFTER the book mapper has already moved 56 to 55. Every other
	// entry here is in a book whose chapters do not shift, so the distinction
	// is invisible in them and is stated once, here, where it is not.
	//
	// The lectionary is what found it: `Psalm 56:10c-12, 13-14` overran the
	// end of a 13-verse psalm, and the two verses before the overrun had been
	// resolving to real, existing, WRONG text — the failure this table's
	// docblock says to expect.
	['ps:55:12', { chapter: 55, verse: 11 }],
	['ps:55:13', { chapter: 55, verse: 12 }],
	['ps:55:14', { chapter: 55, verse: 13 }]
]);

/**
 * True for the OSIS codes this module has a real, corpus-verified
 * wholesale-divergence table for.
 *
 * Late-merge chapters are deliberately excluded: Matthew and Acts agree with
 * modern numbering everywhere except one chapter's tail, and calling the whole
 * book "divergent" would invite callers to treat every reference into them as
 * needing conversion — `refs.ts` uses this predicate to decide exactly that.
 */
export function isDivergentBook(osis: string): boolean {
	return osis in DIVERGENT_MAPPERS;
}

/**
 * Vulgate address candidates for a Hebrew/Masoretic-numbered `{osis,
 * chapter, verse?}`, best guess first. Always returns at least one entry.
 * For any osis/chapter/verse this module has no divergence data for
 * (including a chapter/verse range outside a covered book's Hebrew
 * numbering, which can only be an already-Vulgate reference), the input
 * comes back unchanged — applying a no-op can never turn a correct address
 * into a wrong one, so this is safe to call unconditionally on every
 * scripture reference, not just ones already known to be Hebrew-numbered.
 *
 * More than one candidate only happens when a single Hebrew chapter with
 * no verse given spans two Vulgate chapters (Ps 116, Ps 147, Malachi 3) —
 * there's no way to know which half a whole-chapter reference means, so
 * both are offered, larger/first-part first.
 */
export function toVulgateCandidates(
	osis: string,
	chapter: number,
	verse?: number
): VulgateAddress[] {
	const mapper = DIVERGENT_MAPPERS[osis];
	const candidates = mapper ? mapper(chapter, verse) : [{ chapter, verse }];
	// Late merges apply AFTER the book mappers, and never to a whole-chapter
	// reference (no verse to move). No book has both, so the ordering is a
	// formality — stated so it stays one if a book ever acquires both.
	return candidates.map((c) => {
		const merged =
			c.verse !== undefined ? LATE_MERGE.get(`${osis}:${c.chapter}:${c.verse}`) : undefined;
		return merged ? { osis, ...merged } : { osis, chapter: c.chapter, verse: c.verse };
	});
}

/**
 * Resolve a Hebrew/Masoretic-or-already-Vulgate `{osis, chapter, verse?}`
 * to the first Vulgate candidate address that `exists` confirms is real,
 * or `undefined` if none is. `exists` is injected rather than imported so
 * this module never depends on the corpus — a caller in `site/` passes a
 * check against the reader's actual Bible edition (see `refs.ts`'s
 * `refHref`), a caller in tests passes a fixture-backed check.
 */
export function resolveVulgate(
	osis: string,
	chapter: number,
	verse: number | undefined,
	exists: (osis: string, chapter: number, verse?: number) => boolean
): VulgateAddress | undefined {
	return toVulgateCandidates(osis, chapter, verse).find((c) => exists(c.osis, c.chapter, c.verse));
}

/**
 * The two divergence tables as plain data, for export to the pipeline.
 *
 * `site/scripts/export-versification.mjs` writes this to
 * `pipeline/scrapers/common/versification.json` and
 * `versification.test.ts` fails when the committed file falls behind —
 * the same arrangement `BOOK_FORMS` has, and for the same reason: Python
 * cannot import TypeScript, and a second hand-maintained copy of a table
 * this exact would drift silently.
 *
 * ONLY THE TABLES CROSS OVER, never the mappers. `ps`, `mal` and `joel`
 * diverge wholesale and are converted by FUNCTIONS above, which is algorithm
 * rather than data; re-implementing them in Python is precisely the
 * duplication that produced the `pipeline/build/` twin this module's
 * `LATE_MERGE` comment records the deletion of. So the export names those
 * three books and carries no rule for them, and the Python side refuses a
 * reference into one rather than guessing at it.
 */
export const VERSIFICATION_TABLE = {
	wholesale_divergent: Object.keys(DIVERGENT_MAPPERS).sort(),
	late_merge: Object.fromEntries(
		[...LATE_MERGE.entries()]
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([key, value]) => [key, value])
	),
	// The arrangements ARE data and so they do cross, unlike the three mappers
	// above. `divergence.py` reads them from the exported JSON to check the
	// bijection against the editions themselves; it held its own copy for one
	// commit, which is the drift this export exists to prevent.
	arrangements: Object.fromEntries(
		Object.entries(ARRANGEMENTS)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([name, books]) => [
				name,
				Object.fromEntries(
					Object.entries(books)
						.sort(([a], [b]) => a.localeCompare(b))
						.map(([osis, rows]) => [osis, rows.map(([from, to]) => [[...from], [...to]])])
				)
			])
	)
};
