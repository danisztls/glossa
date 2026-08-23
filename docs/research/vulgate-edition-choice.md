# Choosing a Latin Vulgate edition

Research conducted 2026-08-22 (Claude, read-only survey; live fetches against
`sacredbible.org`, `www.vatican.va` and `www.intratext.com`). A follow-up to
`latin-sources.md`, narrowed to the one question that document deliberately
left open: **which Latin Bible**. Everything `latin-sources.md` established
about availability is taken as given here and not re-derived; what is new is
a third candidate (IntraText, raised by the user), today's re-verification of
the two known ones, a measurement of what the Latin text is worth as
_evidence_ rather than as reading matter, and the book-order question.

**Scope note**: nothing here is scraped, parsed or ingested. `pipeline/` and
`site/` are untouched. Two books of the recommended source were fetched into
the scratchpad for shape verification and discarded; `corpus/raw/` was not
written.

## TL;DR

**Recommendation: the Clementine/Hetzenauer 1914 edition at
`sacredbible.org/vulgate1914/`.** Re-verified live today: all 73 books, page
shape byte-for-byte identical in convention to the CPDV source the pipeline
already parses, traditional Vulgate psalm numbering, explicit public-domain
disclaimer, and `robots.txt` that permits it.

**IntraText is disqualified, on measured data integrity — not on taste.** Its
`Vulgata` (LAT0001) is missing Baruch entirely and **truncates books
mid-way**: Daniel ends at chapter 3, Numbers at 32, Esther at 10, Psalms at 149. It is also not the Clementine text at all but a Stuttgart-family critical
e-text, lowercase and unpunctuated, whose own credits page states its printed
source is "Not available."

**Nova Vulgata remains a legitimate but different project** — the Church's
current typical edition, on vatican.va, with Hebrew psalm numbering that the
corpus's whole address space is built against. Best treated as a possible
_second_ Latin edition later, not the first one.

Two findings beyond the choice itself:

- **The Latin earns its place as evidence, not just as a fourth text.** A
  sample comparison against both existing editions shows the Latin base
  adjudicating a divergence `bible-edition-divergence.md` had recorded as
  unresolvable — see §5.
- **"Original Vulgata order" costs almost nothing.** The corpus's canonical
  73-book order already matches the Vulgate everywhere except Maccabees —
  §6.

## 1. The three candidates

|                 | Hetzenauer 1914                                                           | Nova Vulgata                                                | IntraText LAT0001                                  |
| --------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------- | -------------------------------------------------- |
| Host            | `sacredbible.org/vulgate1914/`                                            | `vatican.va/archive/bible/nova_vulgata/`                    | `intratext.com/IXT/LAT0001/`                       |
| Text            | Clementine (Sixtus V / Clement VIII), Hetzenauer's 1914 critical printing | 1979 typical edition, promulgated by John Paul II           | Unidentified Stuttgart-family critical text        |
| Books           | **73/73**                                                                 | 73/73                                                       | **72/73** (no Baruch)                              |
| Complete?       | Verified by index; per-book counts not yet crawled                        | Assumed (not measured)                                      | **No — books truncated, §3**                       |
| Psalm numbering | **Vulgate** (verified, §2)                                                | **Hebrew** (verified in `latin-sources.md` §1)              | Not established (Psalms truncated)                 |
| Rights          | "in the public domain. No copyright."                                     | vatican.va terms, as with every other work already ingested | CC licence, "Some rights reserved by EuloTech SRL" |
| Provenance      | Named editor, named year, page scans on the same site                     | Named typical edition                                       | **"Printed source: Not available"**                |
| Fetches needed  | **73**                                                                    | 73                                                          | **1,307** (one page per chapter)                   |
| Parser          | `cpdv.py`'s, unchanged                                                    | New micro-parser (inline bare digits)                       | New parser                                         |

## 2. Hetzenauer 1914 — re-verified 2026-08-22

`https://sacredbible.org/vulgate1914/index.htm` → 200. Everything
`latin-sources.md` §2 recorded a week ago still holds, and the following is
now verified directly rather than inferred from the CPDV sibling.

**All 73 books, one file per book**, `VT-01_Genesis.htm` … `VT-46_2-Machabaeus.htm`,
`NT-01_Matthaeus.htm` … `NT-27_Apocalypsis.htm`. The set maps 1:1 onto the
corpus's 73 OSIS codes with no book missing and none extra — Baruch, Tobit,
Judith, Wisdom, Sirach and both Maccabees all present.

**The page shape is the CPDV shape.** Not "similar" — the same. Philemon,
fetched whole:

```
<!-- begin -->

[<A NAME=1><A HREF=#top class=chapter>Philemon 1</A></A>]<BR>
{1:1} Paulus vinctus Christi Iesu, et Timotheus frater: Philemoni dilecto…<BR>
{1:2} et Appiæ sorori charissimæ, et Archippo commilitoni nostro…<BR>
…
<!-- end -->
```

`cpdv.py`'s `CHAPTER_RE`, `VERSE_RE`, the `<BR>` segmentation and the
`<!-- begin -->`/`<!-- end -->` body slice all match this unmodified, and the
pages are cp1252 without a reliable charset header — the same decoding
hazard, handled the same way. A Latin scraper is a near-copy of `cpdv.py`
with a new `BOOKS` table and manifest, not a new parsing family.

**Psalm numbering is traditional Vulgate — verified, not assumed.** Psalm 9
runs to `{9:39}` and Psalm 10 then begins at `{10:1}`: the classic 9/10 merge,
150 psalms, no standalone Hebrew Psalm 10. `psalm_numbering: "vulgate"` stands
unchanged and `versification.ts` needs no rework.

**`robots.txt` permits it.** The only `Disallow` entries are page-scan
directories (`/vulgate1822/scans/`, `/hetzenauer1914/scans/`, …); the text
directories are open. Reuse `cpdv.py`'s 1-second rate limit. (The existence of
a `/hetzenauer1914/scans/` tree is incidental corroboration of the
attribution — the operator photographed the printed book — and is both
out of scope and robots-disallowed.)

**Rights.** Every page carries
`<META name=copyright content="Entire text, including all html and css code,
is in the public domain. No copyright.">`, the same posture as the CPDV pages
already scraped from the same operator. The 1914 apparatus (Michael
Hetzenauer, d. 1927) is independently out of copyright.

**Orthography, which is a decision and not a defect.** Measured over the whole
Psalms text: **zero occurrences of `j`** — the edition prints `i` throughout
(`Iesu`, `iudicium`, `adiutori`) — and **1,073 `æ` plus 19 `œ`** ligatures in
that book alone, including 22 uppercase `Æ`. `u`/`v` _are_ distinguished
(2,170 `v`). This is the printed convention and the corpus's fidelity posture
says to preserve it. The consequence lands elsewhere: a reader typing "Jesus"
or "Iesus" into the jump box, or searching for `caelum` against a text that
prints `cælum`, finds nothing unless matching folds `j→i` and `æ→ae`. That is
an input-normalization job for the jump box and for search (`PLAN.md` #2), not
a reason to alter stored text.

## 3. IntraText — disqualified on measured integrity

The user's lead: `https://www.intratext.com/y/LAT0001.HTM`. Worth taking
seriously — IntraText is a real scholarly hypertext library, the text card
reports 626,982 words, and the TOC lists a full-looking Catholic canon. It
does not survive checking.

**Baruch is absent.** 72 book entries in the table of contents, not 73.

**Books are truncated mid-way.** Chapter counts extracted from the TOC and
diffed against the corpus's existing `bible.cpdv.en`:

| Book    | Corpus | IntraText  |                                    |
| ------- | ------ | ---------- | ---------------------------------- |
| Daniel  | 14     | **3**      | −11                                |
| Esther  | 15     | **10**     | −5                                 |
| Numbers | 36     | **32**     | −4                                 |
| Psalms  | 150    | **149**    | −1                                 |
| Baruch  | 6      | **absent** | −6                                 |
| Sirach  | 51     | 52         | +1 (prologue counted as a chapter) |

In every case the chapters run `1..n` with **no internal gaps** — the books
simply stop. This is truncation, not a different canon.

**Confirmed against the text, not just the index**, because a wrong TOC would
be a much smaller problem than a wrong text. Daniel chapter 3 is `_PP9.HTM`;
the very next page, `_PPA.HTM`, is **Osee 1**. Daniel 4–14 does not exist in
this edition. 1,307 chapter pages total against the corpus's 1,333 chapters.

**It is not the Clementine text.** The prose is lowercase and unpunctuated,
with Stuttgart-family orthography — `Israhel`, `Hiezrahel`, `filii Iuda` —
where the Clementine prints `Israel`, `Iezrahel`. Whatever a reader wants when
they ask for "the Vulgate" alongside the CCC's citations and the traditional
liturgy, this text is a different object.

**Its own credits disclaim provenance**: "Printed source: **Not available**.
Source of the electronic transcription: **Public domain file**." An edition
that cannot name what it is a transcription _of_ cannot be described honestly
in a `manifest.json` whose whole purpose is to say what the reader is reading.

**Rights are weaker, not stronger**: page footers read "Some rights reserved
by EuloTech SRL - 1996-2008. Content in this page is licensed under a Creative
Commons License" — a licence grant, against sacredbible.org's outright
public-domain disclaimer. The specific CC variant was not pinned down (the
site's `Copyright.htm` 404s), and there was no reason to chase it once the
integrity findings landed.

**And it would cost 18× the fetches**: one page per chapter under opaque
base-36 filenames (`_P1.HTM`, `_PZ.HTM`, `_P1A.HTM`) whose mapping to
(book, chapter) exists only in the TOC — 1,307 requests against 73.

## 4. Nova Vulgata — a second edition, not the first

Nothing here revises `latin-sources.md` §1; the index was re-fetched today and
still returns 200. The case against making it the _first_ Latin edition is
unchanged and is about fit, not quality:

- **Hebrew psalm numbering** inverts the corpus's stated canonical address
  space, which is Vulgate throughout (`link-surface.md`, `versification.ts`).
  Ingesting it means either converting on the way in or making
  `psalm_numbering` genuinely per-edition — a real decision that the
  Hetzenauer route simply does not raise.
- **It is not the text the rest of the corpus cites.** The CCC's Scripture
  apparatus, and the Latin of the documents already ingested, belong to the
  Clementine tradition. A Latin column that silently differs from the Latin
  being quoted around it is a subtle trap of exactly the kind
  `bible-edition-divergence.md` was written about.
- **New micro-parser**: inline bare digits with no delimiter, versus a
  parser that already exists.

None of that is an argument against ever adding it — the schema supports more
than one edition per language, and "the Church's current typical edition"
is a genuinely good reason for a reader to want it. It is an argument for
second.

## 5. What the Latin buys beyond a fourth text

The interesting result of this survey, and the one that was not the question
asked.

`bible-edition-divergence.md` measured 30 chapters where the EN and PT
editions disagree about verse shape, sorted them into four kinds, and
concluded of the sharpest case — Psalm 13, where CPDV carries the long
Romans 3 catena and Matos Soares does not — that "Both editions are faithful
to their own textual tradition. **Neither is wrong.**" That was the right
conclusion from two witnesses. A third witness changes it, because this
particular third witness is **the text CPDV was translated from**.

Verse-number sets compared for the two books fetched:

|                  | vs `bible.cpdv.en`                       | vs `bible.matos-soares.pt` |
| ---------------- | ---------------------------------------- | -------------------------- |
| Philemon         | identical                                | identical                  |
| Psalms (150 ch.) | **4 chapters differ** (13, 92, 125, 135) | **1 chapter differs** (43) |

Psalm 13: **the Latin has 7 verses. Matos Soares has 7. CPDV has 10.** The
interpolation CPDV prints is not in its own stated base text. Psalms 92, 125
and 135 are the same shape — Latin agrees with the Portuguese, CPDV stands
alone. Psalm 43 runs the other way: Latin agrees with CPDV, Portuguese splits
a verse.

So on this sample the Latin sides with the _Portuguese_ three times as often
as with the English translation made from it. That is not an argument against
CPDV — a translator may knowingly follow a fuller textual tradition — but it
does mean the Latin edition would function as an **adjudicator** for the
divergence table `bible-edition-divergence.md` proposes, turning entries
currently classified as "both faithful, no formula" into entries with a
documented base reading. That is a corpus-integrity argument for ingesting
Latin, independent of anyone wanting to read it.

**Honest limit on this**: two books, chosen for size and for the known Psalms
divergence — not a corpus-wide measurement. It justifies running the full
comparison after ingestion; it does not pre-empt its result.

## 6. "Follow the original Vulgata order"

Cheaper than it sounds. The corpus's canonical 73-book order
(`docs/corpus-schema.md`) already matches the Clementine Vulgate's own order
everywhere **except Maccabees**:

```
corpus   … tob jdt esth 1macc 2macc job ps prov eccl song wis sir isa … zech mal | matt …
Vulgate  … tob jdt esth             job ps prov eccl song wis sir isa … zech mal 1macc 2macc | matt …
```

Wisdom and Sirach after Song, Baruch after Lamentations — all already
Vulgate. The corpus currently places Maccabees right after Esther, which is
the modern NAB/lectionary arrangement; the Vulgate closes the Old Testament
with them. `sacredbible.org`'s own file numbering agrees with the Vulgate:
`VT-44_Malachias`, then `VT-45_1-Machabaeus`, `VT-46_2-Machabaeus`.

**What changing it costs.** `order` is a pure presentation field: it is
consumed in exactly two places — `sync-corpus.mjs:331` and `corpus.ts:373`,
both sorts. No URL, no cross-reference and no addressing depends on it (those
all key on OSIS codes). So the change is:

1. Amend the canonical order in `docs/corpus-schema.md`.
2. Renumber `order` in the `BOOKS` tables of `cpdv.py` and `matos_soares.py`
   and regenerate — **offline from `corpus/raw/`, no re-crawl**.
3. Regenerate the two Bible fixtures.

One thing to decide rather than assume: this is a **corpus-wide** order, not
a per-edition one — `corpus.ts:373` merges books across editions into one
canonical list keyed by OSIS. Moving Maccabees moves them in the English and
Portuguese Bibles too. That is probably what "follow the original Vulgata
order" means for a project whose canonical address space is already Vulgate,
but it is a visible change to two existing editions and belongs in
`decisions.md` rather than in a scraper diff.

## 7. What ingestion would actually touch

**Pipeline** — a new `pipeline/scrapers/vulgate.py`, a near-copy of
`cpdv.py`: new `BASE_URL`, new 73-row `BOOKS` table (Latin names, `VT-`/`NT-`
filenames), `WORK_ID = "bible.vulgate.la"`, new manifest text, `RAW_DIR =
corpus/raw/vulgate1914/`. The parsing core, the corrections layer, the
validation pass and the offline-from-cache behaviour carry over as they
stand. One validation check needs re-thinking rather than copying:
`chapter_opening_letter`'s lowercase guard assumes a chapter opens a sentence
with a capital — true here, but Latin chapter openings should be spot-checked
before that check is trusted to mean the same thing.

**Site** — smaller than `PLAN.md`'s architecture section implies, because
the Bible is the _only_ work type where a third edition changes nothing
structural:

- `types.ts`: `ContentLang = 'en' | 'pt'` → add `'la'`. `PsalmNumbering`
  unchanged.
- `corpus.ts`: `LANGUAGE_NAMES` gains `la: 'Latina'`. `listEditions` and
  `defaultWorkId` are already language-agnostic and need nothing.
- `content.svelte.ts`: **the one real change.** `#activeOverride` discards an
  override as soon as `i18n.lang` moves past `forUiLang`. Correct for a reader
  who picked the PT Bible under an EN interface; wrong for a reader who picked
  the Latin one, since no UI language will ever default to Latin and so no UI
  event should ever supersede that pick. `PLAN.md`'s Option 1 — keep the reset
  rule, but fire it only when the override's own language is itself a UI
  language — is a condition change in one method.
- `i18n.svelte.ts`: `UiLang` stays `'en' | 'pt'`. Nobody wants Latin chrome.
- `EditionMenu.svelte`: no change expected; it renders whatever
  `listEditions` returns.

**Not touched**: `versification.ts` (Vulgate numbering throughout),
`vatican_docs.py`'s `check_language_symmetry` (that generalization is the
_documents_ half of the Latin phase, and the Bible does not go through it),
the route grammar, or `corpus-routes.json`.

## 8. Decisions this needs before it can be built

1. **Edition**: Hetzenauer 1914, as recommended — or Nova Vulgata, or both.
2. **Work id**: `bible.vulgate.la` (proposed) vs `bible.hetzenauer.la` /
   `bible.clementina.la`. The `{corpus}.{edition}.{lang}` convention wants the
   _edition_ slug, and the existing two name their translator/version
   (`cpdv`, `matos-soares`) — which argues for `clementina` or `hetzenauer`
   over the generic `vulgate`, and reserves `vulgate` in case Nova Vulgata
   follows.
3. **Book order**: adopt the Vulgate order corpus-wide (§6), or leave it.
4. **Orthography**: preserve `i`/`æ` as printed (recommended) and fold at
   input, or normalize on the way in.
5. **Whether the divergence comparison runs as a validation pass** once three
   editions exist (§5) — `bible-edition-divergence.md` proposed it; the Latin
   is what makes it adjudicable.

## Honest gaps in this survey

- **Per-book chapter counts for the 1914 edition were not measured.** Only
  the index (73 books) and two book pages (Philemon, Psalms) were fetched.
  Books could be truncated the way IntraText's are; nothing here rules that
  out. The full check is the first validation run after ingestion — and
  IntraText is precisely why it should not be skipped.
- The §5 comparison covers two books, not the corpus.
- Nova Vulgata was re-confirmed as reachable but not re-measured; `latin-sources.md`
  §1's findings are taken as they stand.
- ~~IntraText's exact CC variant was not determined (`Copyright.htm` 404s).~~
  **Closed 2026-08-22** (`intratext-2026-08.md` §6): the statement lives at
  `/info/copyENG.htm`, not `Copyright.htm`, and is CC BY-NC-SA 3.0 Unported
  "except where otherwise noted", with per-page notes governing. Does not
  affect §3's conclusion, which rests on integrity, not rights.
- The two other Vulgate editions on `sacredbible.org` (1822, 1861, 2009) were
  not evaluated; `latin-sources.md` §2's reason for preferring 1914 — that it
  is CPDV's own translation base — was taken as sufficient, and §5 gives that
  reason more weight than it had.
