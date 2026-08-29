# Description pass, 2026-08

A sweep over the Magisterium document works: one agent per work, each reading
the document in the corpus, writing a description for `site/descriptions.json`,
and reporting parse defects found on the way. Procedure and rationale in
`docs/writing-descriptions.md`; this file is the running record of what the
sweep found.

Scope: 339 document works (307 `encyclical`, 32 `vatii`), minus the 6
zero-section works withheld in `site/unpublished.json` = **333 describable**.
Progress is not tracked here — `descriptions.json` is keyed by work id, so
remaining work is always `333 − keys(descriptions)`.

Batches are stratified across page shell and pontificate rather than
alphabetical, so that defects surface while batches remain to benefit from a
fix. The corpus uses exactly two page shells: all 32 `vatii` works are the
**old** shell, all 307 encyclicals the **modern** one.

## STATE AS OF 2026-08-28 — read this first

**Scope is 354 document works** (322 `encyclical`, 32 `vatii`), not the 339
this file opened with. It moves as editions land, so it is measured rather
than remembered — and `site/unpublished.json` withholds nothing today, so all
354 are describable. **197 are described** and **190 carry a ToC oracle**;
what remains is 157 works with no description and 164 with no oracle.

**Batches 4 through 8 are not written up here.** They landed between
2026-08-24 and 2026-08-26 and were recorded in their commit messages instead
(`git log site/descriptions.json`), which is where their findings are.
Nothing has been reconstructed for them below: the file resumes at batch 9,
and the count above is what says where the sweep stands.

## State as of 2026-08-21

**The schema migration is COMPLETE for the document works.** `sections.json`
carries `html`; `structure.json` is the flat `{level, title, before}` array;
`manifest.header` carries the masthead; the site reads all three. Corpus
re-parsed (zero network fetches in phase 1; phase 2's 36 are translation
probes, not re-crawls), `svelte-check` clean, 363 tests passing, build green.

Still to do, in order:

1. **CCC and Compendium** have NOT been migrated — they still use
   `CccNode` (`kind`/`n`/`paragraphs`/`children`) and `text_marked` without
   `html`. `StructureNode` is deliberately unchanged for them, and
   `DocumentNode` is a separate type. `ccc.py` and `compendium.py` need the
   same treatment.
2. **Resume the description sweep** — see the section below. 26 of 333 done.
3. **The outstanding input-side parser fixes**, which are unrelated to storage
   and still open: see "Parser fixes decided but NOT applied" below. The
   footnote-capture defect (item 5) is the largest thing found in this pass and
   outranks the heading variants.

### Known residuals in the new structure (accepted, not bugs to re-derive)

- **Laudato Si' opens at h4.** Its introduction has four sub-headings and no
  heading of its own. Anchoring every document's first heading at h1 fixes it
  but collapses all 47 of Ad Petri Cathedram's headings onto one level,
  destroying the I/II part tier. Keeping the styling rank costs one awkward
  opening; forcing h1 costs a whole tier. Reasoning is in the code.
- **`span[lang]` was dropped from the allowlist.** All 486 instances are
  `lang="pt"` inside Portuguese documents — export noise, not semantics. No
  follow-up needed; do not "restore" it.
- Heading levels are a best-effort reading of loose source formatting. The
  intended cross-check is a **Sonnet pass that outputs each document's table of
  contents from `corpus/raw/`**, compared against the parser's — parsing alone
  is not expected to be sufficient. Fold this into the resumed sweep's brief.

### Where the page prints its own TOC, it is now used (2026-08-21)

Prompted by the observation that Magnifica Humanitas' outline was poor while
the page itself prints a perfectly good one. It does, and the parser now reads
it: levels come from the TOC's typography, and blocks the style rules missed
but the TOC names are promoted to headings. Full reasoning in `decisions.md`.

**This does not generalise, and that was measured, not assumed.** Of the 466
pages in `corpus/raw/vatican-docs`, exactly **three** carry a linked TOC:
`magnifica-humanitas.{en,pt}` (82 entries each) and `divini-redemptoris.pt` (7
entries, top level only). A first count that looked for in-page links without
checking their _direction_ said 47 — those were footnote back-references
(`dominum-et-vivificantem` alone has 594). The discriminator is that a TOC
entry points _forward_.

So the Sonnet ToC cross-check above is still needed for the other 463 pages —
this narrows the problem by three documents, it does not replace the pass.

What it bought, per document:

| Work                     | Before                                                                                                                 | After                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `magnifica-humanitas.en` | chapter numbers and their titles at different levels; sub-sections promoted to siblings of the chapters they belong to | 75 nodes matching the printed TOC exactly (82 before the merge below folded 7 away) |
| `magnifica-humanitas.pt` | 79 nodes, two headings missing entirely (one only partly italic, one only centred)                                     | both recovered on TOC evidence                                                      |
| `divini-redemptoris.pt`  | 60 nodes, flat, no part tier                                                                                           | 7 parts at h1 with their sub-sections nested under them                             |

Also fixed in passing: `PIO XI PP.` was signing `divini-redemptoris.pt` as a
top-level heading, because `_PAPAL_SIGNATURE_RE` allowed `PP.` only _before_
the numeral. Only three structure titles in the whole corpus match the
signature pattern; the third, `Gregory XIII` in `insignes.en`, is anchored to
section 10 and stays, protected by the existing positional guard.

### Heading lines merged; the TOC addresses headings (2026-08-22)

Two corrections found by looking at the rendered result, both recorded in
`decisions.md`. `structure.json` gained optional `ident`/`subtitle` (renamed `label`/`subtitle`
2026-08-25), and a
division's identifier, name and subtitle are now one node instead of three:
**150 headings merged across 32 works**, 2 of them carrying a subtitle. And a
table-of-contents row now links to the heading's own id rather than to `#s{n}`,
the section behind it — both the sidebar and the inline TOC, from one indexed
list shared with the body.

**Known defect this did NOT fix — 104 same-anchor, same-level sibling pairs
remain**, in works like `deus-caritas-est` (`THE PRACTICE OF LOVE BY THE
CHURCH...` / `The Church's charitable activity as...`). These are not
identifier/name pairs and must not be merged: they are a heading and its first
sub-heading with no numbered section between them, wrongly given the _same_
level. The cause is the levelling walk's run rule — the first heading after
another is its subtitle at parent+1, and every heading after _that_ repeats the
previous level ("title, subtitle, then siblings"), so the third heading in a run
lands as a sibling of the second. Fixing it means revisiting that rule, which
touches far more than these 104 rows.

The visible symptom is contained for now: a sidebar row is marked current only
if no earlier sibling already claims the position (`currentIndex` in
`structureToc.ts`), so identical ranges no longer duplicate the `id` the aside
scrolls to or put `aria-current` on several links at once.

Two unrelated defects surfaced in that same census, both worth their own fix:
`dilexit-nos.en` has lines of quoted Dante verse promoted to headings, and
`divino-afflante-spiritu.pt` has `1. Leão XIII` read as one.

## Batch 1 (12 works)

`vatii.dignitatis-humanae.{en,pt}`, `vatii.lumen-gentium.en`,
`encyclical.adiutricem.{en,pt}`, `encyclical.aeterni-patris.en`,
`encyclical.ad-petri.{en,pt}`, `encyclical.casti-connubii.en`,
`encyclical.acerbo-nimis.en`, `encyclical.fratelli-tutti.pt`,
`encyclical.deus-caritas-est.pt`.

All 12 descriptions written and recorded. Findings below.

### 1. Italic-only headings are dropped outright — text and all

**The main finding of the batch, and the likely root of the "300 works with no
usable chapter division" problem.**

`is_full_bold` (`pipeline/scrapers/vatican_docs.py:336`) requires a block's
_entire_ visible text to sit inside `<b>`. A heading marked up any other way is
not recognised as a heading — and because it is also not a numbered paragraph,
it is not captured as content either. It is discarded silently.

| Source markup                             | Detected | Evidence                                                                                   |
| ----------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `<p align="left"><b><i>Title</i></b></p>` | yes      | `deus-caritas-est.pt` (18/18 nodes real), `ad-petri.pt` (41), `dignitatis-humanae.pt` (18) |
| `<p><i>Title</i></p>`                     | **no**   | `fratelli-tutti.pt` — 78 sub-headings dropped                                              |
| `<p align="CENTER"><i>Title</i></p>`      | **no**   | `ad-petri.en` — 47 of 48 dropped                                                           |
| `<p align="CENTER">I</p>`                 | **no**   | `ad-petri.en` part markers I–IV                                                            |

`fratelli-tutti.pt` is the controlled comparison: in one document, all 17
bold-only paragraphs were captured and all 78 italic sub-headings were lost.

Corpus-wide scan of `corpus/raw/vatican-docs` (466 pages): **1,006**
italic-only heading-shaped `<p>` blocks, 370 of them explicitly centered. On a
random 40-page sample, **30 of 32 such blocks are absent from the parsed
output**. Worst cases in the sample: `paenitentiam.en` 18/18 dropped,
`pergrata.en` 9/10 dropped ("Notable Portuguese Achievements", "Gratitude of
Rome", "Effect upon the State").

Not every dropped block is a heading. The same sample shows salutations
(`"Venerable Brethren, Health and Apostolic Benediction."`) taking the same
path — still lost document text, but not table-of-contents material. **A naive
"treat italic-only blocks as headings" fix would promote those salutations to
structure nodes.** The fix needs a discriminator; see the open decision below.

### 2. `[null, null]` structure nodes: 513 nodes across 183 works

21% of all 2,461 structure nodes, in 54% of works. Classifying the titles
splits them into two unrelated bugs:

- **Page furniture promoted to headings (~168).** 153 pope signature lines
  (`PIUS XII` ×30, `PIO PP. XII` ×18, `BENEDICT XV` ×11, …) and 15 instances of
  vatican.va's language navigation bar,
  `[ AR - BE - CS - DE - EN - ES - FR - IT - HU - LA - LV - PT - SW - ZH ]`.
  These are bold-centered, so `is_full_bold` cannot tell them from a chapter
  title. They should be dropped, not ranged.
- **Real divisions that lost their range (~70).** `PROÉMIO` ×11, `CONCLUSÃO`
  ×11, `INTRODUÇÃO` ×9, `PRIMEIRA PARTE` ×8, `SEGUNDA PARTE` ×7, `TERCEIRA
PARTE` ×4, `CONCLUSION` ×4. Diagnosed independently by the
  `dignitatis-humanae.pt` and `deus-caritas-est.pt` agents: a heading
  immediately followed by _another_ heading, before any numbered paragraph,
  gets closed with zero attached paragraphs by the flat push/pop walker. Same
  mechanism class as the `magnifica-humanitas` TOC bug, different trigger —
  unhandled two-level nesting rather than a table of contents.

The two classes need opposite treatments, so they must not be fixed together.

### 3. Numbered-paragraph markers that defeat extraction

Three distinct causes found, two of them parser-side:

- **Numeral and period split across tags** — `27<i>. </i>` in
  `aeterni-patris.en` §27, which merged into §26. Parser defect. Corpus scan:
  48 occurrences across 8 raw files (`aeterni-patris.en`, `arcanum.en`, and 6
  `ccc-pt` pages), so narrow but real.
- **Marker mid-paragraph with no `<p>` boundary** — `ad-petri.pt` §38 and §41.
  The source never opens a new `<p>`; the parser has no fallback for a numbered
  marker appearing mid-block, so both merged into the preceding section. Text is
  not lost, but `sections.json` has no `n=38` or `n=41`.
- **Source typo** — `aeterni-patris.en` renders §21's marker as literal `Z 1.`
  on vatican.va's own page. This is a source defect and belongs in
  `pipeline/corrections/` with locator and evidence, per
  `docs/decisions.md` §Corrections and overrides — not a code
  special-case.

### 4. Hypothesis killed: PT heading detection is _not_ overfiring

Going in, the EN/PT node asymmetry (`dignitatis-humanae` EN 1 node / PT 18;
`perfectae-caritatis` EN 1 / PT 26) looked like Portuguese pages over-detecting
bold lead-ins as headings. Every agent that checked `corpus/raw/` found the
opposite: the PT nodes are real standalone heading paragraphs in the source.

The asymmetry has two causes, and they are different per document:

- **Genuine source-side difference.** `dignitatis-humanae`: the PT page carries
  two roman-numeral chapter titles and a bold-italic sub-heading before nearly
  every article; the EN page has none of them. Verified against raw HTML on both
  sides. The flat EN parse is _correct_.
- **Finding 1 in disguise.** `ad-petri`: the EN source has 48 headings and the
  parser dropped 47, because EN uses centered-italic and PT uses bold-italic.

So EN/PT node-count asymmetry is not by itself a defect signal, and the
cross-language symmetry oracle does not apply to structure trees the way it
applies to section-number sets.

### 5. Flat structure confirmed _correct_ in some cases — but beware the method

A useful negative result: not all ~300 flat works are damaged.
`casti-connubii.en` (130 sections) and `aeterni-patris.en` (32) are genuinely
undivided numbered prose, as is `dignitatis-humanae.en`. All three survived the
re-parse unchanged, which confirms it.

**`adiutricem.en` was reported here as a fourth such case and that was wrong.**
The re-parse took it from 1 node to 18, and `"Widespread Devotion to the
Rosary"` — one of the recovered titles — is present verbatim in
`corpus/raw/`. It had real sub-headings all along.

The error is methodological and worth stating, because it will recur: an agent
asked "does the section text contain division markers?" that greps
`sections.json` **cannot** detect finding 1, because the dropped headings are
missing from exactly the file being searched. A negative from that method means
"no headings survived the parse", not "no headings exist". Only a check against
`corpus/raw/` can answer the question. Agent briefs from batch 2 on must say so
explicitly.

### Smaller items

- `lumen-gentium.en`: 4 post-body headings (`APPENDIX`, the _Notificationes_,
  `Preliminary Note of Explanation`, and Pericle Felici's signature) are
  mis-nested as children of Chapter VIII, the Marian chapter, all with null
  ranges. The 8 chapter ranges themselves are correct and verified at every
  seam. The appendix body text was never captured as sections (disclosed in the
  manifest as "18 unnumbered content blocks").
- `acerbo-nimis.en`: §19–24 are the encyclical's six binding ordinances (I.–VI.)
  and are parsed cleanly as sections, but nothing in `structure.json` marks that
  span as an enacted-regulations list distinct from the surrounding prose.
- `deus-caritas-est.pt`: the closing Marian prayer between §42 and the dateline
  is real body content captured nowhere in `sections.json` (disclosed in the
  manifest as 1 unnumbered block).
- **Manifest/receipt mismatch**, seen in `aeterni-patris.en` and
  `acerbo-nimis.en`: `manifest.notes` says "1 anomalies recorded; see
  corrections-applied.json / run log", but `corrections-applied.json` reads
  `{"applied": [], "unresolved": [], "count": 0}` and no anomalies file exists
  in the work directory. The claimed anomaly record is not inspectable anywhere.

## Fixes applied, and what they measured

Three changes to `pipeline/scrapers/vatican_docs.py`, chosen 2026-08-20:

1. `promote_italic_heading_run` — italic-only blocks become headings only where
   a run of >= 3 appears, so a lone salutation or dateline is left alone.
2. `drop_page_furniture` — papal signature lines (positionally gated: only
   after the last numbered paragraph) and the language navigation bar.
3. `push_heading` — a heading holding no content becomes the _parent_ of the
   heading that follows, not its sibling, capped at 2 levels of empty nesting.

Verified on 14 works. Section counts are **identical everywhere** — the fixes
add structure without touching a word of text:

| Work                  | total nodes | null-range nodes |
| --------------------- | ----------- | ---------------- |
| `fratelli-tutti.pt`   | 17 → 96     | 1 → 2            |
| `fratelli-tutti.en`   | 1 → 47      | 0 → 2            |
| `ad-petri.en`         | 2 → 45      | 1 → 0            |
| `paenitentiam.en`     | 2 → 19      | 1 → 0            |
| `adiutricem.en`       | 1 → 18      | 0 → 0            |
| `deus-caritas-est.en` | 8 → 18      | 2 → 0            |
| `pergrata.en`         | 1 → 11      | 0 → 1            |
| `ad-petri.pt`         | 41 → 40     | 7 → 0            |
| `deus-caritas-est.pt` | 18 → 17     | 5 → 0            |
| `casti-connubii.en`   | 1 → 1       | 0 → 0            |
| `aeterni-patris.en`   | 1 → 1       | 0 → 0            |
| `acerbo-nimis.en`     | 1 → 1       | 0 → 0            |

Null-range nodes across these works fall 19 → 5. The three control-group works
are untouched, which is the guard the procedure asks for. The 5 remaining nulls
are newly introduced by promotion (a promoted heading with nothing following
it) and are the first thing to look at in batch 2.

## `DATA_ROOT` pointed at the wrong tree (fixed 2026-08-20)

`vatican_docs.py:205` hardcodes `DATA_ROOT = /home/dani/Dev/me/scriptura`, with
the documented rationale that "corpus/ is gitignored and therefore NOT shared
between worktrees". **That premise is stale.** `corpus/` became tracked on
2026-08-16 (`CLAUDE.md`, `docs/decisions.md`); this repo tracks 1,529 files
under `corpus/`, holding 347 works and 466 cached raw pages. The hardcoded tree
held 0 works and almost no raw cache.

Consequences, both of which need clearing before batch 2:

- A re-parse there **re-crawls**, because the raw cache it reads is empty. The
  2026-08-20 verification run fetched 29 pages from vatican.va rather than
  parsing from cache — the exact thing "re-parse, never re-crawl" exists to
  prevent. It respected the 2s crawl-delay, and the repo's own `corpus/` was
  not touched or overwritten.
- Re-parsed output lands outside the tracked corpus, so it reaches neither the
  site build nor git.

The 14 works and 29 raw pages now sitting under
`/home/dani/Dev/me/scriptura/corpus/` are that run's output. Per `CLAUDE.md`,
removing them is the decision of whoever is directing the work, not a
mid-task judgment call, so they have been left in place.

**Fix:** `DATA_ROOT` now derives from `__file__`, like `SOURCE_ROOT`, and the
module docstring's "NOTE ON THE ROOTS" records why the old reasoning expired.
No other scraper carried the same hardcoded path. Keeping the raw cache and the
parser in one checkout is what makes a re-parse provably zero-network — the run
summary's fetch count is the check, and it should read 0.

## Full re-parse, 2026-08-20

`phase1` + `phase2 --overwrite` across all 339 document works, from cache.
**Zero raw HTML files were touched**, which is the check that the re-parse was
genuinely zero-network and that `DATA_ROOT` now resolves correctly.

Measured against `git show HEAD:` (the corpus is tracked, so git is the
baseline):

|                                      | before | after     |
| ------------------------------------ | ------ | --------- |
| total structure nodes                | 3,498  | **4,617** |
| nodes carrying a real range          | 2,818  | **4,372** |
| `[null, null]` nodes                 | 680    | **245**   |
| works whose `structure.json` changed | —      | 244       |
| works whose `sections.json` changed  | —      | 48        |
| **works that lost a ranged node**    | —      | **0**     |

The 48 section changes are all accounted for and all are improvements:

- **46 are text-only, with the section count unchanged.** These are headings
  that had been merged into a section's body being lifted out into the
  structure tree. `ad-petri.en` §3 is the worked case: it used to end
  `"...unity, harmony, and peace. Truth, Unity, Peace."` and now ends at
  `"peace."`, with `Truth, Unity, Peace.` promoted to a heading.
- **2 are numbering-gap repairs.** `ad-extremas.en` recovered §10 and
  `ecclesiam.en` recovered §63 — both previously missing. The recovered text
  was checked verbatim against `corpus/raw/`, so it is restored, not invented.
  `ecclesiam` is one of the 25 unresolved §7.2 mismatches, now one fewer.

### A metric that misleads, recorded so nobody re-derives it

"Works with more than one structure node" _falls_ over this change, 197 → 189,
which reads as a regression and is not one. Those works had exactly two nodes —
the document's title block and the papal signature — and the signature was
dropped as furniture, leaving one. They never had structure; they had two
pieces of furniture. Counting nodes that carry a real paragraph range is the
metric that means something, and it rose 2,818 → 4,372.

## Batch 2 (12 works)

`vatii.gaudium-et-spes.en`, `vatii.sacrosanctum-concilium.pt`,
`encyclical.rerum-novarum.en`, `encyclical.quadragesimo-anno.en`,
`encyclical.mystici-corporis-christi.en`, `encyclical.haurietis-aquas.pt`,
`encyclical.veritatis-splendor.en`, `encyclical.evangelium-vitae.pt`,
`encyclical.caritas-in-veritate.en`, `encyclical.laudato-si.pt`,
`encyclical.immortale-dei.pt`, `encyclical.spiritus-paraclitus.en`.

All 12 descriptions written. Every agent verified against `corpus/raw/`, per the
corrected brief.

### The italic-run fix holds up

Two checks the batch was designed to run, both passing:

- **No false positives.** `sacrosanctum-concilium.pt` is the densest case in the
  corpus (106 nodes / 130 sections) and its node set was reconciled
  exhaustively, not sampled: 83 left-aligned bold-italic + 16 centered-bold + 7
  chapters = 106 exactly. Even its four duplicate titles and four
  lowercase-initial titles are genuine source repetition. `veritatis-splendor.en`
  and `evangelium-vitae.pt` also came back "checked, none" — the latter
  confirming the closing dateline and the Marian prayer were _not_ promoted.
- **Flat is often correct.** Five long single-node works — `rerum-novarum.en`
  (64 sections), `quadragesimo-anno.en` (148), `mystici-corporis-christi.en`
  (112), `spiritus-paraclitus.en` (69), `immortale-dei.pt` (61) — were each
  swept at raw-HTML level and are genuinely undivided prose. `quadragesimo-anno`
  is the instructive one: §15 says the argument "will fall under three main
  headings", but vatican.va never marks them as paragraphs. The division exists
  only as prose.

### Four more heading markup variants, none reached by the run rule

`is_full_bold` requires a block's _entire_ text inside `<b>`. Four further ways
vatican.va defeats that, found this batch:

| #   | shape                                                               | scope                 | effect                                                    |
| --- | ------------------------------------------------------------------- | --------------------- | --------------------------------------------------------- |
| 1   | `<b>CHAPTER I</b> - <b>Title</b>` — bold split by a plain separator | 8 blocks, 6 files     | heading text **appended to the preceding section's body** |
| 2   | `<span style="font-weight: 700">` instead of `<b>`                  | 1 block, 1 file       | heading dropped, paragraphs absorbed                      |
| 3   | `N.<b> Title</b>` — number outside the bold run                     | 3 blocks, 1 file      | heading dropped, paragraphs absorbed                      |
| 4   | plain centered `<p>`, no emphasis at all                            | 386 blocks, 199 files | heading dropped entirely                                  |

Variant 1 is the worst-behaved: it does not merely lose the heading, it
**corrupts three sections of `veritatis-splendor.en`** by gluing
`CHAPTER I - "TEACHER, WHAT GOOD MUST I DO...?"` onto the tail of §5, and
`corrections-applied.json` reports `count: 0`, so nothing logged it. It also hits
`ut-unum-sint.en`, `redemptoris-missio.en` and `redemptoris-mater.en`, always as
a top-level CHAPTER/PART heading, and the residue outside the bold runs is a bare
`-` in every real case.

Variants 2 and 3 are confined to `laudato-si.pt`, where they mis-range four
chapters (node `4. Alegria e paz` spans `[222,240]` instead of `[222,227]`,
swallowing sections 5, 6 and 7).

**Variant 4 must not be fixed naively.** Its 386 blocks are mostly page
furniture — `© Copyright - Libreria Editrice Vaticana`, document titles,
subtitles. Only 24 files carry a run of >= 3. But it is doing real damage where
it bites: `evangelium-vitae.pt` writes `CAPÍTULO II/III/IV` as plain centered
`<p>` (only `CAPÍTULO I` is bold), so one node titled `CAPÍTULO I` spans
`[7,105]` and silently swallows three further top-level chapters — the whole
macro-structure of the encyclical. `dilexit-nos.en` (42 blocks) and
`fratelli-tutti.en` (18) are the other large runs worth inspecting.

### `LEVELS` inverts chapter and section

`LEVELS = {"part": 0, "section": 1, "chapter": 2, ...}` ranks `section` _above_
`chapter`. `gaudium-et-spes.en` uses PART > CHAPTER > SECTION, so a chapter
never pops a section and nests under it instead. Consequences there, all
high-severity: `CHAPTER III` is a child of `SECTION 3`; `CHAPTER IV` and
`CHAPTER V` are children of `SECTION 2`; chapter ranges truncate to a single
paragraph (`CHAPTER II` = `[53,53]`, real extent 53–62); and sibling SECTION
ranges overreach into the next chapter's text (`SECTION 2` = `[67,78]` where
§73–76 is Chapter IV and §77–78 Chapter V). A UI reading those ranges renders
unrelated chapters' paragraphs under a section heading.

This is pre-existing, not from the 2026-08-20 fixes. The same ordering puts
`CONCLUSION` (a generic `sub`, level 4) inside `CHAPTER SIX` (level 2) in
`caritas-in-veritate.en`, where `INTRODUCTION` escapes only by preceding any
chapter.

Note also that the batch-2 brief's premise that every node is `kind: "sub"` is
false for `gaudium-et-spes.en`, which already carries chapter (9), part (2),
section (7) and sub (4).

### The empty-heading nesting fix is inconsistent — my defect

Confirmed independently by `haurietis-aquas.pt`, `veritatis-splendor.en` and
`laudato-si.pt`: only the **first** child nests under an empty heading; every
later sibling pops past it, because nesting gives the parent a child and it
stops looking empty. So a parent's range equals its first child's range rather
than the chapter's true extent (`I. Freedom and Law` = `[35,37]`, real extent
35–53), and markup-identical sub-headings are treated differently by position —
`Poluição, resíduos e cultura do descarte` nests, `O clima como bem comum` does
not.

It is not a regression (those parents previously had `[null, null]` and no range
at all), but it is a heuristic standing in for real tiering, and it should be
replaced by tiering rather than patched.

### Tiering: the discriminator is now well evidenced

Four documents across two languages agree, and `gaudium-et-spes.en` adds a third
signal:

- **major tier** — centered + bold (`<p align="center"><b>…`)
- **minor tier** — left-aligned + bold-italic (`<p align="left"><b><i>…`), tag
  order sometimes reversed, which the parser already tolerates
- **`<center>` wrapper** distinguishes CHAPTER from PART/SECTION in the old
  shell

`haurietis-aquas.pt` splits 7/21 on the first two, `sacrosanctum-concilium.pt`
16/83, `deus-caritas-est.pt` 5/13. That is enough to assign real `kind` values
instead of emitting everything as `sub`.

### Other findings

- **Appendix orphaned.** `sacrosanctum-concilium.pt`'s Apêndice — the calendar
  reform declaration, its two numbered points, dateline and `PAPA PAULO VI`
  signature, six blocks — is absent from `sections.json` entirely; only three
  `[null, null]` heading shells survive. Cause: the appendix restarts numbering
  at `1.`/`2.`, colliding with the Proémio's §1/§2, and there is no fallback.
  A reader never sees that content. **High.**
- **Salutations dropped corpus-wide.** `<p><i>Venerable Brethren, Health and
Apostolic Benediction.</i></p>` is discarded — found in **57+ raw files**, in
  both languages (`Veneráveis Irmãos, Saudação e Bênção Apostólica`). The run
  rule deliberately declines to promote a lone italic block, which is right, but
  these are still being _dropped rather than kept as content_. Identical markup
  gets opposite treatment by position: the opening salutation vanishes, the
  closing dateline merges into the last section.
- **§7.2 resolved for `haurietis-aquas`.** The EN/PT gap (127 vs 77) is source
  truncation. The raw PT page ends at §77 and goes straight to dateline,
  signature, footnotes. Not our defect.
- **Signature text no longer retained anywhere.** A consequence of
  `drop_page_furniture` worth recording: `LEÃO XIII, PAPA.` used to survive as a
  `[null, null]` node carrying its text and now appears in no artifact. It is
  reported as a `page furniture skipped:` anomaly, so it is logged rather than
  silent, but the artifacts retain less than before.
- **Front-matter subtitles captured nowhere.** `immortale-dei.pt`'s own
  descriptive subtitle, `SOBRE A CONSTITUIÇÃO CRISTÃ DOS ESTADOS`, is in raw
  front matter but absent from `manifest.title`, `short_title` and sections.
  These are exactly what a listing wants beside a description, and they are
  recoverable from `raw/` without re-crawling.
- **Manifest/anomaly-log mismatch is systematic.** Now seen in six works across
  both batches (`aeterni-patris.en`, `acerbo-nimis.en`, `quadragesimo-anno.en`,
  `caritas-in-veritate.en`, `sacrosanctum-concilium.pt`, `mystici-corporis-christi.en`).
  `manifest.notes` cites "N anomalies recorded; see corrections-applied.json /
  run log" while that file reads `count: 0` and no run log exists in the work
  directory. In `mystici-corporis-christi.en` the unnumbered-block count is
  itself wrong: 3 claimed, only 1 actually unattached.

## Carried forward after batch 1

**Discriminator chosen: run detection** (>= 3 italic-only blocks in a document),
over centered-only and over capture-without-promotion. It was picked because it
catches both markup variants while leaving a lone salutation alone, and because
it reuses the shape `drop_table_of_contents` already established — a single
occurrence is a coincidence, a run is a convention.

Still open:

- **245 `[null, null]` nodes remain**, down from 680. Most are document title
  blocks sitting before the first numbered paragraph, which `drop_page_furniture`
  deliberately does not touch (it only drops a papal name _after_ the last
  numbered paragraph). Whether a title block should be a structure node at all
  is a reader-facing question, not a parser bug.
- **A few nulls are newly introduced** by promotion — a heading promoted with
  nothing following it, seen in `fratelli-tutti.{en,pt}` and `pergrata.en`.
  Small, and the first thing to look at next.
- **All nodes are still `kind: "sub"`.** The parser now finds the headings but
  does not tier them, even where the source distinguishes visually (centered
  bold for parts, left bold-italic for subsections). Reported independently by
  the `dignitatis-humanae.pt` and `deus-caritas-est.pt` agents. This is what
  stands between the corpus and a real per-chapter reading view now that the
  headings themselves are recovered.
- **The two marker defects in §3** (`27<i>. </i>`, and mid-paragraph markers
  with no `<p>` boundary) are untouched, as is the `aeterni-patris.en` `Z 1.`
  source typo, which needs a `pipeline/corrections/` entry rather than code.
- **Manifest/receipt mismatch** (§ Smaller items) is untouched.

### Brief correction required for later agents

Batch 1's briefs asked agents whether the _section text_ contained division
markers. That question cannot detect the corpus's biggest defect, because the
markers were missing from `sections.json` — the very file being searched — and
it produced at least one confident false negative (`adiutricem.en`, §5). Batch 2
briefs must require the check against `corpus/raw/`, and should say that a
negative from grepping parsed output is not evidence of absence.

## Batch 3 (12 works) — and the two audits that now run before the agents

`encyclical.mortalium-animos.pt`, `encyclical.humanae-vitae.pt`,
`encyclical.ecclesiam.en`, `encyclical.singulari-quadam.en`,
`encyclical.mediator-dei.en`, `encyclical.libertas.en`,
`encyclical.communium-rerum.en`, `vatii.lumen-gentium.pt`,
`vatii.dei-verbum.pt`, `encyclical.dilexit-nos.en`,
`encyclical.laudato-si.en`, `encyclical.quod-votis.en`.

All 12 described. **38 of 333 done.** This batch also introduced the ToC
oracle (`<corpus>/oracles/toc/`) the earlier entries kept calling for, so all
12 carry a recorded table of contents as well.

### What ran before the agents did, and what it found alone

Two mechanical audits (`pipeline/scrapers/audit.py`) retired work the sweep
would otherwise have done slowly and less reliably. Reasoning in
`decisions.md` §Oracles; the short version is that **coverage** (raw body
text vs stored text) sees a class neither existing oracle can: the round-trip
check is a statement about one block, and cross-language symmetry compares
section-number sets, so a block that never became a block is invisible to both.

It found three works whose own manifest said `PARSER DEFEATED` and which were
being published anyway — `quadragesimo-anno.pt` at 8.7% coverage (5 sections
against the English edition's 148), `miranda-prorsus.en` at 10.0%, and
`gravissimum-educationis.en` at 85.7% but mis-divided. All three are now
withheld, and `sync-corpus.mjs` fails the build if a defeated parse is ever
published again.

### The census, and why it does not reuse the parser's own regex

`census.py` puts each raw block beside the parser's verdict on it. It cuts at
every block-level boundary rather than matching `<p>` pairs, because **1.24%
of body text corpus-wide (216,671 chars, concentrated in 43 files) lies
outside `<p>`/`<blockquote>`/`<center>`** — an extractor built on `_BLOCK_RE`
inherits the blind spot under audit. That decision is what let this batch find
the largest defect below.

Three census defects were found by the agents using it, all fixed mid-batch:

- It could not see block alignment at all. `re.split` discards the tags, so
  the block's own `align="center"` / `style="text-align: center"` never
  reached `shape()`. Every centered heading in the corpus showed a blank
  markup column — including `evangelium-vitae.pt`'s `CAPÍTULO II/III/IV`,
  whose whole documented defect is that they are centered but **not** bold.
  Since batch 2 established centering-vs-left as _the_ tiering discriminator,
  this would have handed 307 agents an empty column.
- A heading line matched its parent title mid-word (`"o amor conjugal"` inside
  `"AS CARACTERISTICAS DO AMOR CONJUGAL"`), reporting a lost heading as kept.
- A lost heading whose text is a prefix of the following paragraph scored
  `kept`. Now `kept?`, reported as unresolved rather than guessed.

### Findings: two new defect classes, both about unwrapped text

**1. `_gap_block`'s number gate (high).** The parser already walks the text
between consecutive `_BLOCK_RE` matches — `_gap_block`, added for
`aeterna-dei.pt` — but returns nothing unless the gap _itself_ opens with a
paragraph number. A bare continuation sentence or a bare `<i><b>` heading
fails that gate and is dropped with no trace. This is the whole of the 1.24%:

| work                  | coverage | what is lost                                   |
| --------------------- | -------- | ---------------------------------------------- |
| `mortalium-animos.pt` | 50.1%    | ~36 prose blocks + all 19 inline mini-headings |
| `humanae-vitae.pt`    | 78.9%    | 18 continuation sentences + 12 sub-headings    |

`humanae-vitae.pt` is the case that justifies the coverage oracle existing:
31 sections against the English edition's 31, no manifest warning, symmetry
clean, and a fifth of the text gone.

**2. `pending_first_block` is a scalar (high).** Where a document has no
explicit `1.` and jumps to `2.`, the parser promotes `pending_first_block`
into section 1 — but that field is overwritten by _every_ unnumbered block
before the first numbered one. `singulari-quadam.en` has two, so its real
1,747-character opening paragraph is discarded and only the salutation
survives. Any document with two or more leading unnumbered paragraphs is
affected.

**3. Unnumbered lead-ins after a heading (high).** `ecclesiam.en` loses ~19
real-prose blocks this way, including a Mystici Corporis block quotation, and
the loss then **causes** a second defect: a heading whose only content was
dropped reads as empty, so the next heading nests under it. Six headings are
falsely demoted to level 3, every one sharing a `before` with the level-2 node
above it. `quod-votis.en` is the same mechanism at the document's front: its
addressee list and salutation precede the first numbered paragraph, so they
have nothing to merge forward into and vanish.

**4. Verse promoted to headings (medium).** Confirmed in `dilexit-nos.en`, and
larger than recorded: **two** poems, not one — St John of the Cross's _Cántico
Espiritual_ at §70 as well as Dante's canzone at §205. Five false nodes; the
false nesting then pushed a genuine heading from level 3 to level 5.

**5. The levelling run rule, seen plainly (medium).** `dei-verbum.pt`: only
the first heading of a style tier gets its true depth, and every later
same-tier heading is demoted one level — so `CAPÍTULO I–VI` nest under
`PROÉMIO` despite identical centered-bold markup. Confirmed language-independent
against the English edition. This is the rule batch 2 recorded as producing 104
same-anchor sibling pairs, now characterised on a document where the whole tree
shows it.

### Source defects for `pipeline/corrections/`

- `libertas.en` prints §28's marker as `28,` with a comma. The section is lost
  and its text merged into §27. Swept corpus-wide: **two** genuine cases, the
  other being `mystici-corporis-christi.pt` (missing §2 and §3). A third hit,
  `depuis-le-jour.en`, is a footnote citation and not a marker.
- `ecclesiam.en` prints §63's marker as `3.`. The numbering recovers, but the
  heading above it is anchored one section early.
- `ecclesiam.en` prints a heading as `Modem Bent of Mind` for `Modern`.

### Clean negative results, recorded so nobody re-derives them

- `mediator-dei.en` (210 sections), `libertas.en` (46), `communium-rerum.en`
  (58) and `singulari-quadam.en` (9) are **genuinely undivided prose**, all
  verified at raw level rather than by grepping parsed output.
  `mediator-dei.en` was settled by reading the raw file directly: 6 `<b>` tags
  in 1,274 lines, no `font-weight`, no `<center>`.
- `laudato-si.en` shares **neither** of the two defects recorded for its
  Portuguese sibling — no `font-weight: 700` headings, no split numbering, and
  none of its six chapters mis-ranged.
- `dilexit-nos.en`'s 42 plain-centered headings with no emphasis at all were
  **correctly** detected: the parser reads the CSS `text-align` style.
- `dei-verbum` EN has 7 nodes to PT's 33 because the English source genuinely
  prints no italic subsection titles. An edition difference, not a defect.

### One brief defect the pilot existed to catch

Agents disagreed on whether a document's own title block is a heading:
`quod-votis.en` returned `QUOD VOTIS` as one, the others correctly treated it
as furniture. On 307 works that ambiguity produces oracles disagreeing with
each other rather than with the parser. `writing-descriptions.md` now says so
explicitly, and `audit.py toc` skips any parsed node matching the manifest's
own title.

The comparison also had to learn that **a whole-tree level offset is one
finding, not fifty**: a reader numbers the top division 1 while the parser
ranks by observed typography and may start at 2. Reporting each separately
buried `dilexit-nos.en`'s five real findings under fifty rows of the same
fact. The modal delta is now reported once and only deviations are listed.

### Where the oracle and the agents agree

Running `audit.py toc` after the batch reproduces the agents' findings
mechanically, which is the check that this layer works at all: 12 missing
sub-headings in `humanae-vitae.pt`, all 19 in `mortalium-animos.pt`, exactly
the six false demotions and the one mis-anchored heading in `ecclesiam.en`,
and the five verse lines in `dilexit-nos.en`. Five works agree completely.
One new finding the agents missed: `laudato-si.en` promotes a `* * * * *`
separator to a heading.

## Batch 9 (12 works) — 2026-08-28

`vatii.presbyterorum-ordinis.en`, `vatii.ad-gentes.pt`,
`vatii.nostra-aetate.pt`, `encyclical.pacem.pt`,
`encyclical.lacrimabili-statu.en`, `encyclical.mense-maio.pt`,
`encyclical.spe-salvi.pt`, `encyclical.in-plurimis.en`,
`encyclical.insignes.en`, `encyclical.fidei-donum.en`,
`encyclical.doctor-mellifluus.pt`, `encyclical.ut-unum-sint.en`.

All 12 described and all 12 carry a ToC oracle. Stratified across both page
shells (3 old, 9 modern), eight pontificates, six EN and six PT, and sizes
from 5 sections to 219 — including one unnumbered edition (`mense-maio.pt`,
whose text lives in `appendix.json`) to exercise the `numbered: false` path,
which it did: the reader confirmed the absence of numbering against the raw
page rather than inferring it from an empty `sections.json`.

### The check was reading a field nobody writes any more

`audit.py toc` reported 41 of 144 oracles disagreeing with the parse before
the batch, and a third of that was the check's own defect. The heading field
`ident` was renamed `label` on 2026-08-25 in the parser, in `structure.json`
and in the brief — but not in the 32 oracle files already written with it,
and `compare_toc` flattens `label`/`title`/`subtitle` and nothing else. So
every labelled heading produced a different key on each side and came back as
a `MISSING` and an `EXTRA` of the same title: `caritas-in-veritate.en`
reported 12 differences that were six chapter headings matching perfectly.
Renaming the key in the 189 affected headings took the count to **28 of 144**,
and what remains is real.

**A rename that leaves data behind is invisible to every check that reads the
data through the new name.** Nothing failed; the audit simply reported the
gap as though the parser had produced it.

### The dateline was in seventeen tables of contents

Read off the batch and then measured corpus-wide: **17 works published their
own closing dateline as the last entry of their outline** — `Given in Rome at
St. Peter's, 1 May 1896...`, `Dado em Roma, junto de São Pedro...`, `From the
Vatican, 16 August 1898` — an entry with nothing under it, in four languages.

The cause is `promote_italic_heading_run`. Its docstring already warns that a
document's salutation and its dateline wear the same italics as its
sub-headings, and the run rule is what keeps them out — but the run rule only
asks whether the document has a run, not whether a given member of it heads
anything. Where a document really does title its sub-sections, the dateline
joins them on the strength of their number.

The fix is positional, in the same shape `_opens_a_numbered_paragraph` uses at
the other end of the document: **a heading is followed by the text it heads.**
`_heads_nothing` refuses a candidate with no content after it — the signature,
the language bar, the publisher's notice and the blank rule are furniture and
do not count. A vocabulary of closing formulas would have been the wrong
instrument at four languages and counting.

Blast radius, measured as `writing-descriptions.md` prescribes (md5 of every
`structure.json`/`sections.json`/`appendix.json` before and after a full
re-parse, zero network fetches): **33 files across 17 works, all of them a
dateline leaving the outline and nothing else.** No other work changed, and
the text itself is not lost — it stays in the section as the closing prose it
is. The audit's before/after diff shows only the intended removals.

### Open, and each one evidence for a decision rather than a fix taken

- **A masthead subtitle becomes a top-level heading** — `rerum-novarum.en`
  ("Rights and Duties of Capital and Labor", its whole outline),
  `ut-unum-sint.en` ("On commitment to Ecumenism"),
  `dominum-et-vivificantem.en`, `redemptoris-missio.en`.
  `extract_document_header` ends the masthead at the first block that neither
  names the document nor names its author, and a subtitle names neither. The
  docstring cites Rerum Novarum's two-node outline as the defect it fixed;
  half of it survived.
- **A trailing top-tier heading is demoted** — `EXHORTATION`
  (`apostolicam-actuositatem.en`), `APPENDICES` (`inter-mirifica.en`),
  `GENERAL DIRECTIVE` (`christus-dominus.en`), `INTRODUCTORY STATEMENT`
  (`gaudium-et-spes.en`), `CONCLUSION AND EXHORTATION`
  (`presbyterorum-ordinis.en`, at level 3). Five old-shell works, one shape:
  the chapters arrive as `CHAPTER N` + title on two lines and are merged, and
  a heading printed in the label's own style with no title line after it does
  not get the level the merge gives its siblings. This is the levelling run
  rule batch 2 recorded, seen from a new side.
- **`pacem.pt` drops `INTRODUÇÃO` outright** — `<p align="center"><strong>`,
  identical to the `Iª PARTE` labels the parser keeps two paragraphs later,
  and identical to the `INTRODUÇÃO` every other PT encyclical records. One
  document, in the window the masthead scan runs over.
- **`ad-gentes.pt` does not merge its `Art. N` headings** with the titles
  under them, because those title lines are wrapped in `<font size="2">`
  where the `CAPÍTULO` titles are not. The label and the title land as two
  flat level-2 nodes, and the eight sub-headings below them lose the tier
  that would have distinguished them — 17 of the batch's differences are this
  one defect.
- **`quam-religiosa.en` loses "Peru and Christianity"**, a real italic heading
  before the first numbered paragraph, dropped outright rather than demoted.
  Pre-existing: verified by re-parsing the work with the dateline fix stashed.

### One brief compliance note

`ut-unum-sint.en`'s oracle was assembled from the parse minus the masthead
nodes and then checked against the census, rather than read off the raw page
and then compared. It agrees with the raw page where it was checked, and its
one disagreement is a real parser defect — but an oracle derived from the
output cannot contradict the output, which is the whole reason the brief asks
for the other order. Worth restating in the batch prompt rather than trusting
the procedure doc to carry it.

## Batch 10 (12 works) — 2026-08-28

`vatii.unitatis-redintegratio.pt`, `vatii.optatam-totius.pt`,
`vatii.perfectae-caritatis.pt`, `encyclical.au-milieu-des-sollicitudes.en`,
`encyclical.magni-nobis.en`, `encyclical.ecclesiae-fastos.en`,
`encyclical.le-pelerinage-de-lourdes.pt`, `encyclical.nos-es-muy-conocida.en`,
`encyclical.ad-salutem-humani.it`, `encyclical.dives-in-misericordia.pt`,
`encyclical.ecclesiam.pt`, `encyclical.lumen-fidei.pt`.

All 12 described and oracled. **173 of 354 described, 168 oracles.** The batch
carries the corpus's first Italian-only description: `ad-salutem-humani` has
no other edition, so its entry is keyed `it`, written from the Italian — the
same rule that keeps a Portuguese description prose about the Portuguese text.

### A source misprint, filed

`vatii.unitatis-redintegratio.pt` prints its third chapter's label as
`CAPÍTULO IlII` — a lowercase `l` where the second `I` belongs, the same
class as `ecclesiam.en`'s `Modem` for `Modern`. It is not cosmetic: the string
reached the reader verbatim as a structure node's label, and `IlII` is not a
roman numeral the division-label matcher can read, so of the decree's three
chapters exactly one had a number nothing downstream could resolve. Filed as
`pipeline/corrections/vatii.unitatis-redintegratio.pt.json` against the two
chapters above it and the English sibling's `CHAPTER III`; the re-parse
changes that one work and nothing else.

### `<strong>` is invisible to heading detection — measured, and NOT fixed

`pacem.pt` drops `INTRODUÇÃO` outright, and the cause generalises: heading
detection reads a block's RAW html, where `_BOLD_SPAN_RE` matches `<b>` and
not `<strong>`. The storage layer has folded the two together since it existed
(`_HTML_ALLOWED_SIMPLE`), but the fold happens after the decision. **103 raw
pages write `<strong>`.**

Widening the regex the way `_ITALIC_SPAN_RE` already covers `<em>` was tried
and reverted, because the measurement said it is not one fix but two:

- **It gains.** `pascendi-dominici-gregis.pt` recovered its whole outline —
  `INTRODUÇÃO`, `EXPOSIÇÃO DO SISTEMA E SUA DIVISÃO`, `AS CAUSAS DO
MODERNISMO`, `REMÉDIOS`, `CONCLUSÃO`, five headings its oracle had recorded
  as missing — and lost a false one (its salutation). `pacem.pt` gained
  `INTRODUÇÃO`. Ten works changed in all.
- **It loses.** In `pacem.pt` the recovered heading joins a style class the
  parser had been reading as two tiers, and the tree flattens: 59 of its 67
  headings drop a level, against an oracle that agreed with the parse
  completely before. `dives-in-misericordia.pt` gains a false heading its
  reader had explicitly checked and rejected.

The flattening is the levelling walk's "a LABEL beats appearance" rule not
holding once appearance stops distinguishing `Iª PARTE` from `DIREITOS`. So
the recognition fix has to land WITH a levelling fix or not at all, and that
is a decision rather than a defect — recorded here with its evidence so the
next attempt starts from the measurement instead of the regex.

### Open, carried forward

- **A sub-heading directly under a top-level heading is parsed at level 1.**
  `ecclesiam.pt` (three, all under `PRÓLOGO`), `optatam-totius.pt` (two, under
  `PROÉMIO` and `CONCLUSÃO`). In both, the demoted headings print in the same
  `all-bold,all-italic` as every correctly-nested level-2 sibling elsewhere in
  the same document. Same family as the trailing-heading demotions in the five
  old-shell EN works from batch 9.
- **`lumen-fidei.pt` loses its chapter epigraphs**, and in two different ways:
  before Chapter I and before the conclusion, where no paragraph is open, the
  two-line scriptural epigraph is dropped outright (`ACREDITÁMOS NO AMOR (cf.
1 Jo 4, 16)`, `FELIZ DAQUELA QUE ACREDITOU (cf. Lc 1, 45)`); before Chapters
  II, III and IV it is appended to the tail of the PREVIOUS chapter's last
  paragraph (§22, §36, §49). Text loss and misattribution from one cause.

### Clean negatives, recorded so nobody re-derives them

`au-milieu-des-sollicitudes.en` (32 sections), `ecclesiae-fastos.en` (41) and
`nos-es-muy-conocida.en` (39, published under the Latin title _Firmissimam
Constantiam_) are genuinely undivided numbered prose, each verified at raw
level rather than from an empty `structure.json`. `ad-salutem-humani.it` is
unnumbered as well as undivided — one appendix block of ~12,400 words, no
paragraph numbers anywhere on the page — and its `numbered: false` was checked
against the raw page, not inferred. `fidei-donum.en`'s source numbering jumps
from 27 to 35 in the raw HTML itself, with no block in between: the parse
reproduces the page, and there is nothing missing to find.

## Batch 11 (12 works) — 2026-08-28

`vatii.apostolicam-actuositatem.pt`, `vatii.inter-mirifica.pt`,
`vatii.orientalium-ecclesiarum.pt`, `encyclical.fides-et-ratio.en`,
`encyclical.laborem-exercens.pt`, `encyclical.caritas-in-veritate.pt`,
`encyclical.mysterium.pt`, `encyclical.aeterna-dei.pt`,
`encyclical.satis-cognitum.en`, `encyclical.divino-afflante-spiritu.pt`,
`encyclical.quadragesimo-anno.pt`, `encyclical.sollicitudo-rei-socialis.en`.

**185 of 354 described, 178 oracles.** Two of the twelve already had an oracle
from an earlier batch and were read for the description and an adjudication
instead; that is the shape to use for the three works whose oracle arrived
before their description.

### The comparison checked the first occurrence of a repeated title and no more

`quadragesimo-anno.pt` prints `Remédios` twice — once at level 3 under
`Despotismo económico`, once at level 2 under `Reforma dos costumes` — and
they casefold to one key. `compare_toc` grouped both sides by that key and
then compared `[0]` against `[0]`, so the second pair was never checked in
either direction and the counts agreeing was enough to report nothing. The
lists are in document order, so they now pair positionally, and a length
mismatch is reported as `COUNT` rather than silently truncated. One new
finding across 178 oracles (`REMÉDIOS`, read 2 parsed 3), no noise: the
defect this closes is the one that would have hidden behind a repeated title.

### `<a>` inside a heading spaces the words it links — and the fix is not here

`divino-afflante-spiritu.pt` stores `1. 50° aniversário da encíclica "
Providentissimus Deus "`, where the page prints no space inside the quotes:
the title is an anchor, `strip_tags` turns every non-emphasis tag into a
space, and the two spaces are ours. Corpus-wide it is two headings, the other
being `princeps.pt`'s `Apelo da epístola " Maximum illud "`.

Adding `a` to `_INLINE_TEXT_TAGS` fixes both and **takes validation failures
from 72 to 171**, which is the tag set's own docstring being right: it is held
in step with what `narrow_html` keeps, and the round-trip invariant
`html_to_text(html) == text` is what that buys. The fix belongs where a
heading's TITLE text is derived, not in the shared tag rule — recorded rather
than attempted.

### Open, carried forward — and two of them now have a shape

- **The trailing top-tier heading, demoted, is seven works and both
  languages.** `EXORTAÇÃO` (`apostolicam-actuositatem.pt`) and `CLÁUSULAS`
  (`inter-mirifica.pt`) join `EXHORTATION`, `APPENDICES`, `GENERAL DIRECTIVE`,
  `INTRODUCTORY STATEMENT` and `CONCLUSION AND EXHORTATION` from batch 9. In
  every one the demoted heading prints in the same `center,all-bold` as the
  document's `CAPÍTULO`/`CHAPTER` labels, and the discriminator is that a
  chapter's label is followed by a second line the parser merges into it while
  these stand alone. `INTRODUCTION - "KNOW YOURSELF"` in `fides-et-ratio.en`
  is the same defect at the front of the document, and `vatican_docs.py`'s own
  `_FRONT_BACK_MATTER` comment says such a heading should rank as a peer of
  the shallowest division the document prints.
- **A whole tier collapses in several PT editions.**
  `orientalium-ecclesiarum.pt` stores all 34 headings at level 1 where the page
  prints two tiers; `divino-afflante-spiritu.pt` stores three tiers as two;
  `quadragesimo-anno.pt`'s levels run roughly opposite to its typography, and
  its reader's hypothesis is worth keeping — that document opens with four
  bold-italic sub-headings before its first centred-bold heading, so a rank
  bootstrapped from first encounter starts from the wrong style. `ecclesiam.pt`
  and `optatam-totius.pt` from batch 10 are the same family.
- **An epigraph that quotes Scripture is dropped, in two editions and one
  way.** `fides-et-ratio.en` loses both of Chapter II's
  (`"Wisdom knows all and understands all" (Wis 9:11)`, `"Acquire wisdom,
acquire understanding" (Prov 4:5)`): the quotation is bold-italic and the
  citation after it is italic-only, so `is_full_bold` fails on the block and it
  is discarded rather than absorbed — its own manifest logs them as two
  unattached blocks. `lumen-fidei.pt`'s chapter epigraphs (batch 10) fail the
  same way. `_emphasis_covers` already tolerates an enumerator, punctuation and
  a footnote marker outside the run; a parenthetical citation is the fourth
  thing this corpus sets there.
- **`quadragesimo-anno.pt` prints one footnote marker with no anchor at all**
  (`sob a autoridade ordenada por Deus, 54 cultive`, raw line 927, against the
  `<a name="fnref54">` pattern every other marker uses and a footnote 54 that
  exists and matches). A bare digit therefore survives into the stored prose.
  Broken markup rather than wrong words, so it is the parser's business by
  `CLAUDE.md`'s rule and not a `corrections/` entry — but it is one document,
  and the class is worth a sweep before anyone writes code for it.

## Batch 12 (12 works) — 2026-08-28

`vatii.christus-dominus.pt`, `vatii.presbyterorum-ordinis.pt`,
`encyclical.dilexit-nos.pt`, `encyclical.dominum-et-vivificantem.pt`,
`encyclical.eccl-de-euch.en`, `encyclical.redemptor-hominis.pt`,
`encyclical.centesimus-annus.pt`, `encyclical.divini-illius-magistri.pt`,
`encyclical.vigilanti-cura.pt`, `encyclical.musicae-sacrae.pt`,
`encyclical.octobri-mense.pt`, `encyclical.magnae-dei-matris.en`.

**197 of 354 described, 190 oracles.** Eight of the twelve agree with the
parse completely; the four that do not are all one of the two level classes
below.

### A second source misprint, filed

`centesimus-annus.pt` heads its fourth chapter `IV. A PROPRIETADE PRIVADA E O
DESTINO UNIVERSAL DOS BENS` — `PROPRIETADE` for `PROPRIEDADE`, a transposition
that is not a Portuguese word. The correct value is fixed by the document
rather than inferred: the page spells `propriedade` 22 times in its own body,
the chapter is about private property, and the English sibling prints `PRIVATE
PROPERTY AND THE UNIVERSAL DESTINATION OF MATERIAL GOODS` at the same
position. Filed, re-parsed, one work changed and nothing else.

### The tier collapse has a suspect: `<font size="2">`

Three Portuguese Vatican II decrees read the same way. `christus-dominus.pt`
prints three tiers — `<p align="center"><b>` for `PROÉMIO` and the chapters,
the same centred bold **wrapped in `<font size="2">`** for the numbered
subdivisions, and `<p align="left"><b><i>` for the 44 paragraph-topic
headings — and the parse stores the last two as one level, flattening 44 of 61. `presbyterorum-ordinis.pt` is the same shape (12 differences), and
`ad-gentes.pt` in batch 9 named the same wrapper as what defeats its `Art. N`
merge. The English siblings do not show it because their old-shell pages
distinguish the tiers with `<b>` against `<b><i>`, which the ranker already
reads. **A font-size wrapper is a tier signal in this shell and the style rank
does not see it** — that is the hypothesis to test first, and it is cheap to
test because the three documents disagree with their oracles today.

`divini-illius-magistri.pt` is the unnumbered variant of the same thing: two
printed tiers, every one of its 42 headings stored at level 1.

### Two chapter titles are missing from an unnumbered document's text

`divini-illius-magistri.pt` has `A QUEM PERTENCE A EDUCAÇÃO` and `SUJEITO DA
EDUCAÇÃO` in `structure.json` and in **neither** `appendix.json`'s blocks nor
anywhere else in the stored text — verified by grep against both files, with
`AMBIENTE DA EDUCAÇÃO`, which has the identical shape (a centred-bold major
followed immediately by its own first lettered sub-heading), present. So it is
not simply "a heading followed by a heading", and it is in the appendix
grouping rather than in heading detection, which got both right. A reader of
that work goes from `c) Divisão da matéria` into `A) Em geral` with no chapter
title between them.

### An italic-only heading with no run to join is dropped

`vigilanti-cura.pt` prints `Perseverar no esforço iniciado e bem sucedido`
between §14 and §15 in italics alone, where its 41 siblings are bold or
bold-italic. `promote_italic_heading_run` needs three of a kind before it will
promote any, so this one is discarded outright rather than demoted — the run
rule's stated cost, paid here for one real heading. Recorded rather than
fixed: the rule is what keeps salutations and datelines out, and one heading
is not evidence against it.

### The census's `kept` verdict can be a false positive

Reading `dominum-et-vivificantem.pt`, its reader found `SOBRE O ESPÍRITO
SANTO` — a masthead line — scored `kept`, because the verdict tests
containment against the whole concatenated stored text and that phrase occurs
inside §2's running prose. The block itself was dropped, correctly. Worth
knowing before trusting a `kept` on a short heading-shaped string; `kept?`
already exists for the prefix case and this is its sibling.

## The parser pass — 2026-08-28

Four of the classes carried forward above were taken on together, because they
turned out to be one mechanism seen four ways. **42 disagreeing works became
30, and 297 findings became 265, with no work getting worse.** Thirty-three
files changed in `build/` — 22 `structure.json`, 9 `appendix.json`, 2
`sections.json`, none added or removed — and no document's validation status
moved in either direction. Zero network fetches.

**Measure against a freshly parsed corpus, not against the one on disk.** The
first three measurements in this pass were wrong, in both directions, because
`build/` had not been re-parsed since some earlier code change and
`write_if_changed` leaves an unchanged file's mtime alone, so nothing said so.
`dilexit-nos.en` read as a six-finding regression from a change that provably
did not touch it. The procedure that works: stash the change, re-parse
everything, run the audit — that is the baseline — then restore and repeat.
Doing it twice in a row also proves the parse is idempotent, which is what
makes the file-hash diff mean anything.

**A parse-in-process harness makes the loop minutes instead of an hour.**
`parse_document` + `build_structure` + `audit.compare_toc`, over the 190
oracles, reproduces `audit.py toc` exactly — 42 works, 297 findings — once it
does what `parse_and_write` does: apply `raw_text` corrections before parsing,
pass the slug and `pontiff_or_council`, and apply the overrides afterwards.
Without those it reported 96 failing works. Every experiment below was decided
on that harness and only then confirmed by a full re-parse.

### 1. A font-size wrapper is a tier signal — confirmed, and it is small

`heading_style_rank` ended `return (0 if centered else 2) + (1 if italic else
0)`: centring and emphasis, nothing else. The old shell sets a subordinate tier
by SHRINKING it — `<p align="center"><b><font size="2">1- FUNÇÕES DOS
PRESBÍTEROS</font></b>` under a `<p align="center"><b>CAPÍTULO II</b>` at the
default size — so both ranked 0 and the tier collapsed.

The blast radius is narrow and was measured before the change rather than
after: over all 1,614 raw pages, sixteen print centred bold in two sizes, and
in eight of those the larger is the masthead alone. The eight that really carry
two heading sizes are the Portuguese conciliar decrees. Flush-left headings mix
sizes on exactly one page, and there the second size is `+1` — bigger — so a
demotion-only term cannot touch it.

`heading_font_size` reads the size only where it covers the block's whole text,
with `_emphasis_covers`' own tolerance for the enumerator and the trailing
space; a size around one word is emphasis inside a heading, and two disagreeing
sizes say nothing. The rank became `(0 if centered else 4) + (2 if smaller
else 0) + (1 if italic else 0)`, keeping italic at bit 0 because the odd-tier
merge finds a heading's peer with `style ^ 1`.

**It changed four documents on its own, and that is the lesson.** The signal
was right and the levelling walk still overrode it in the three decrees the
hypothesis was written for — `presbyterorum-ordinis.pt` came out byte-identical
with the correct styles in hand. A style rank is an input to that walk, not a
verdict.

### 2. The front/back-matter promotion, stated as a precondition

`depth_key` lifts a `CONCLUSION` or `PROÉMIO` to the tier of the document's
labelled divisions. Two things were wrong with it.

**It fired in documents that label nothing**, where the key it returns outranks
every style key — so instead of joining a tier it invented one above the whole
document. `divini-illius-magistri.pt` prints INTRODUÇÃO and seven unlabelled
divisions in one identical centred bold; promoted, the first of them levelled
its own sub-headings from a tier its siblings were not in, and all 42 headings
came out at level 1. `orientalium-ecclesiarum.pt` the same across eight,
`ecclesiam.pt` across three. A post-condition existed for exactly this and
repaired the promoted heading's own level **after** the walk — by which point
`assigned` had already handed every heading beneath it the wrong level. Made a
precondition, all three clear; the post-condition is then provably dead (removing
it changes nothing over 190 oracles) and is gone.

**And it could only recognise front matter by its NAME**, a vocabulary test in
nine languages. The structural replacement is `inside_styles`: the set of
styles the document uses for unlabelled headings _inside_ the span of its
labelled divisions. A heading outside that span, in a style that set does not
contain, has no peers to be a sub-section of, so it is a peer of the divisions.
That single condition subsumes every one of the eight lone-heading findings —
`EXHORTATION`, `EXORTAÇÃO`, `APPENDICES`, `CLÁUSULAS`, `GENERAL DIRECTIVE`,
`INTRODUCTORY STATEMENT`, `CONCLUSION AND EXHORTATION`, `fides-et-ratio.en`'s
`INTRODUCTION` — plus Lumen Fidei PT's `FELIZ DAQUELA QUE ACREDITOU`, which no
vocabulary could have caught, and it holds Dilexit Nos EN's six trailing
section headings DOWN, which is the case that broke every positional rule
tried before it. Six new words and a prefix matcher were written first and
measured identically; they were reverted, because a rule that needs no
vocabulary is the one to keep.

### 3. A citation may sit outside a heading's emphasis run

`_emphasis_covers` already tolerated an enumerator before the run and
punctuation or a bracketed footnote marker after it. The fourth thing sources
put there is the reference of a quotation the heading IS: `<b><i>"Wisdom knows
all and understands all" </i></b>(<i>Wis </i>9:11)`. Bounded to one
un-nested bracket of at most 48 characters containing a digit — a citation
names a place, a parenthetical remark has no chapter number.

It recovered twelve real headings in three documents: two chapters of
`fides-et-ratio.en`, five in `redemptoris-missio.en`, and all five of
`lumen-fidei.pt`'s, whose four chapter titles then merged with the `CAPÍTULO N`
lines that had been standing alone in the outline. **Two oracles were
incomplete and were corrected against the raw pages**, not against the parse:
the five Redemptoris Missio epigraphs are printed in the same `<p><b><i>` as
the section headings the reader did record, and Lumen Fidei's chapter titles in
the same centred bold as each other.

### 4. `optatam-totius.pt`'s oracle was wrong, and wrong in the way the parser was

The reader recorded `PROÉMIO` and the seven `I.`–`VII.` divisions at the same
level. The page prints PROÉMIO at the default size and every one of the seven
in `<font size="2">` — the same signal §1 is about, missed by a person reading
the same page. Corrected: PROÉMIO and CONCLUSÃO at 1, the seven at 2, the
bold-italic leaves at 3. **An oracle is evidence, not scripture; where the raw
page contradicts it, it is corrected and the correction is shown.**

### 5. A title with nothing under it is still a heading the page prints

`appendix_out` dropped every unit with no blocks, which dropped
`divini-illius-magistri.pt`'s `A QUEM PERTENCE A EDUCAÇÃO` and `SUJEITO DA
EDUCAÇÃO` — the two of its seven divisions whose entire content is the
sub-headings beneath them. Nothing looked wrong, because `structure.json` keeps
naming them and the route pairs a tail row that has no unit; what was missing
was the title from the TEXT tier, which is what the scripture index and every
other reader of stored text sees.

Kept now, but **only where the document has an appendix for it to be part of**.
Admitting every block-less title gave four numbered encyclicals an
`appendix.json` holding one signature line — `PIUS XII, POPE` — and a
content-tier file for a heading `structure.json` already carries is a cost with
no reader. Eighteen title-only units corpus-wide, in nine documents.

## The thirty open works, classified — 2026-08-28

What `audit.py toc` still reports, taken apart. **265 findings across 30 of the
190 oracles**, and they are not thirty problems: one mechanism accounts for 181
of them, and the whole remainder fits in six classes. Counts below are findings,
not headings, and they sum to the total.

| class                                               | findings | works |
| --------------------------------------------------- | -------: | ----: |
| 1. The leaf tier is levelled by branch, not by page |      181 |    13 |
| 2. Headings never detected                          |       23 |    12 |
| 3. Label and title left as two nodes                |       29 |     6 |
| 4. The masthead subtitle becomes a heading          |        4 |     4 |
| 5. A document that opens on its deepest tier        |       14 |     1 |
| 6. The same heading, spelled differently            |        8 |     2 |
| 7. Singletons                                       |        6 |     5 |

### 1. The leaf tier is levelled by its branch, not by the page — 181 findings

**The largest class by a wide margin, and one mechanism.** `evangelium-vitae.en`
and `christus-dominus.pt` are the clean statement of it, because each prints
exactly two heading styles and needs three levels out of them:

```
(0) INTRODUCTION                                    <- style 0, level 1
(5)   The incomparable worth of the human person    <- style 5, level 2 by the SUBTITLE rule
(5)   New threats to human life
(0) CHAPTER I - THE VOICE OF YOUR BROTHER'S BLOOD   <- style 0, level 1
(0) PRESENT-DAY THREATS TO HUMAN LIFE               <- style 0, level 2 by the SUBTITLE rule
(5)   "Cain rose up against his brother Abel"       <- style 5, level 2 by RULE 2
```

The document's opening branch has no intermediate tier, so its first leaf is
levelled from the heading above it — rule 1, "a heading directly following
another heading is that heading's subtitle" — and lands at 2. Rule 2 then
freezes style 5 at level 2 for the whole document, so in every later branch,
where an intermediate tier _does_ exist, the leaf sits beside its own parent
instead of under it. **Eight documents come out with fewer levels than the page
prints:**

| work                                     |  oracle | parsed |
| ---------------------------------------- | ------: | -----: |
| `vatii.sacrosanctum-concilium.pt`        |  9/6/83 |  10/89 |
| `vatii.christus-dominus.pt`              | 4/13/44 |   4/57 |
| `encyclical.evangelium-vitae.en`         |  6/4/35 |   6/39 |
| `encyclical.divino-afflante-spiritu.pt`  | 5/12/22 |   5/34 |
| `vatii.presbyterorum-ordinis.pt`         |  5/6/22 |   5/28 |
| `encyclical.mystici-corporis-christi.pt` | 5/10/14 |   6/22 |
| `vatii.lumen-gentium.en`                 |   9/6/1 |    9/8 |
| `encyclical.pascendi-dominici-gregis.pt` |     5/7 |      8 |

Five more have the right NUMBER of tiers and the wrong membership, from the same
cause seen from the other side — `division_floor` pushes a leaf deeper inside a
labelled division while rule 2 holds it shallow outside one, so the same style
comes out at two, three and four depending on where it sits:
`gaudium-et-spes.pt` (60 findings, leaves read 4 and parsed 2 or 3),
`veritatis-splendor.en` (22), `ad-gentes.pt` (8), `optatam-totius.pt` (2),
`magnifica-humanitas.en` (2).

**One fix was tried and rejected with numbers.** Letting the subtitle rule take
the deeper of "one under my parent" and the heading's own global rank —
`max(prev + 1, prelim)` — fixes the class it was aimed at (`veritatis-splendor.en`
23 → 1, `gaudium-et-spes.pt` 63 → 24, `presbyterorum-ordinis.pt` 12 → 0) and
breaks five other documents worse (`lumen-gentium.pt` 0 → 36,
`unitatis-redintegratio.pt` 0 → 13, `ad-gentes.pt` 17 → 26,
`deus-caritas-est.en` 3 → 7, `lumen-gentium.en` 2 → 7). The reason is exact:
`prelim` is a rank over every `depth_key` in the DOCUMENT, and an intermediate
tier that exists in one branch need not exist in another — `lumen-gentium.pt`
has four keys, so its leaves rank 4 and jump from a chapter at 1 straight to 4.

**So the next attempt is to make `prelim` branch-local**: rank a heading among
the styles seen since the enclosing division opened, not among all the
document's keys. That keeps the one-level clamp (which is what stops the
staircase) while letting a branch that really has three tiers use three.

### 2. Headings never detected — 23 findings, 12 works

Every one is a heading the page prints and the parse has no node for. Five
distinct markups, all verified in `raw/`:

- **No emphasis at all, distinguished only by sitting alone** (10). Plain text
  in a `<p>`: `grande-munus.en` prints `<p align="left"><font size="3">Journey
to Rome</font></p>` and loses four; `pascendi-dominici-gregis.en` prints
  `<p align="left">Priests as Editors</p>` and loses three; `mense-maio.en` (2)
  and `sacerdotalis.en` (1) print theirs centred and plain, which
  `promote_plain_centered_run` would take but for its run-of-three floor.
- **`<strong>` where the parser reads `<b>`** (6). `pacem.pt`'s `INTRODUÇÃO` and
  all five of `pascendi-dominici-gregis.pt`'s divisions. Measured in batch 10 and
  refused there: widening the bold test recovers these and flattens 59 headings
  in `pacem.pt` and invents one in `dives-in-misericordia.pt`. **It should be
  re-tried after class 1 lands**, since both of those failures are levelling
  failures rather than detection ones.
- **Italic with no run of three to join** (4). `populorum.en`'s `The Church's
Concern`, `vigilanti-cura.pt`'s one italic heading among 41 bold siblings,
  two of `mystici-corporis-christi.pt`'s lettered sub-headings. The run rule's
  stated price; recorded, not a defect.
- **The emphasis run closes one character early** (2). `mater.en` prints
  `<i>Obligation of the Wealthy Nation</i>s` and `pacem.en` prints
  `<i>Inadequacy of Modern States…</i> the ` — a letter and a stray word outside
  the run, which `_emphasis_covers` correctly refuses because neither is
  punctuation, an enumerator, a footnote marker or a citation. **These are source
  defects and belong in `pipeline/corrections/`, not in a wider predicate.**
- **A quotation mark between two bold runs** (1). `veritatis-splendor.en` prints
  `<b>CHAPTER II</b> - <b>"DO NOT BE CONFORMED TO THIS WORLD </b>" <b><i>(Rom
12:2)</i></b> - <b>The Church and…`, and `_PUNCT_OUTSIDE_RE` allows
  `.,;:–—-` and whitespace between runs but not `"`. One character in one
  document; adding the quote characters is cheap and should be measured.

### 3. Label and title left as two nodes — 29 findings, 6 works

The oracle records one heading carrying a `label`; the parse emits the label and
the title as separate structure nodes, so each one costs a MISSING and two
EXTRAs — 10 and 19 of the corpus's 37 and 29. `ad-gentes.pt` (`Art. 1` / `O TESTEMUNHO CRISTÃO`, three times),
`quadragesimo-anno.pt` (`II.`, `III.`), `gaudium-et-spes.pt` (`INTRODUÇÃO` /
`A CONDIÇÃO DO HOMEM NO MUNDO ACTUAL`), `mystici-corporis-christi.pt` (`EPÍLOGO`
/ `A VIRGEM SENHORA NOSSA`), `sacrosanctum-concilium.pt` (`Apêndice` / its
declaration), `deus-caritas-est.en` (`PART II` / `CARITAS` / a subtitle line —
the only three-line case).

`ad-gentes.pt`'s is the one already traced: its `Art. N` lines are set in
`<font size="2">` and the title beneath them is not, so `merge_heading_lines`
sees two different styles where every other decree gives it two of the same.
The other five have not been read at markup level yet, and should be before any
fix — a merge rule loosened on one document's evidence is how a label gets
welded to a heading that is not its title.

### 4. The masthead subtitle becomes a heading — 4 findings, 4 works

`rerum-novarum.en` (whose oracle is `"headings": []`, so this is its entire
outline), `ut-unum-sint.en`, `dominum-et-vivificantem.en`,
`redemptoris-missio.en`. `extract_document_header` ends the masthead at the
first block naming neither the document nor its author, and a subtitle names
neither.

Three discriminators were tried and rejected on evidence: the page's own
`<meta name="description">` carries the subtitle for two of the four and not the
other two (`redemptoris-missio.en`'s omits it; `rerum-novarum.en`'s says `ON
CAPITAL AND LABOR` where the block says `Rights and Duties of Capital and
Labor`); absorbing one further centred block reaches three but not
`rerum-novarum.en`, whose subtitle sits BELOW the salutation and so is not
adjacent to the masthead at all; and "it heads nothing" is false for all four,
each being followed directly by numbered prose. Left as four findings rather
than a rule that happens to fit three.

### 5. A document that opens on its deepest tier — 14 findings, 1 work

`quadragesimo-anno.pt` comes out inverted: 43 headings at level 1 where the
oracle reads 4, and its `I.`/`II.`/`III.` divisions at 2 and 3. The first
heading in the document is a leaf (`A Encíclica « Rerum novarum ».`), and the
`last_level is None` branch deliberately gives the first heading its styling
rank rather than 1 — a trade the code documents (forcing 1 costs Ad Petri
Cathedram a whole tier) but which here anchors the leaf tier at 1 and pushes
everything above it down. It is the only document in the corpus where that trade
comes out this badly, and it is worth re-reading that branch once class 1 is
fixed, since both turn on the same `assigned` cache.

### 6. The same heading, spelled differently — 8 findings, 2 works

The heading is found and placed; only its text differs.
`divino-afflante-spiritu.pt` stores `" Providentissimus Deus "` with spaces
inside the quotes, which is the `<a>`-inside-a-heading spacing measured and
refused in batch 11 (adding `a` to `_INLINE_TEXT_TAGS` takes validation failures
from 72 to 171). `evangelium-vitae.en`'s three are character-level: a `?` where
the page prints a curly quote, a dropped opening `"`, and a missing space after
a colon — all three plausibly source encoding rather than parsing, and none read
yet.

### 7. Singletons — 6 findings, 5 works

- `lumen-gentium.en` emits the Secretary General's signature line
  (`+ PERICLE FELICI …`) as a heading; the oracle does not list it.
- `pascendi-dominici-gregis.pt` emits its salutation (`Veneráveis Irmãos, saúde e
bênção apostólica`) as one.
- `laudato-si.en`'s two closing prayers are read at 3 and parsed at 1 — back
  matter, where the walk restarts at the top tier by design.
- `populorum.pt`'s `Conclusão` is read at 1 and parsed at 2.
- `sacrosanctum-concilium.pt` places `Rito da Confirmação` before §71 where the
  reader put it before §70 — the only POSITION finding in the corpus, and not
  yet read at markup level.

### What to do first

**Class 1**, and nothing else until it lands: 181 of 265 findings, one
mechanism, a stated hypothesis (branch-local `prelim`), and thirteen documents
that verify it. Two other classes are waiting behind it — the `<strong>`
widening in class 2, whose measured cost is entirely levelling damage, and
`quadragesimo-anno.pt` in class 5, which turns on the same cache. Class 2's
source defects (`mater.en`, `pacem.en`) can be filed as corrections at any time
and are independent of all of it.

## Wave 13 (24 works) — 2026-08-28

The sweep resumed at 24 works per wave rather than 12, stratified across
pontificate as before: ten Leo XIII, eight Pius XII, two Pius XI, and one each
of John XXIII, Paul VI, John Paul II and Leo XIV. `audit.py coverage` ran first
and was clean — 354 works, median 99.2%, nothing under 95%.

`encyclical.{ad-extremas,caritatis-studium,diuturni-temporis,fidentem-piumque-animum,in-amplissimo,militantis-ecclesiae,pastoralis-officii,providentissimus-deus,quod-anniversarius}.en`,
`encyclical.iucunda-semper-expectatione.pt`,
`encyclical.{ad-apostolorum-principis,meminisse-iuvat,musicae-sacrae,redemptoris-nostri-cruciatus}.en`,
`encyclical.{anni-sacri,ecclesiae-fastos,fulgens-radiatur,ingruentium-malorum}.pt`,
`encyclical.{acerba-animi,ingravescentibus-malis}.en`,
`encyclical.{eccl-de-euch,grata-recordatio,christi-matri}.pt`,
`encyclical.magnifica-humanitas.it`.

**23 of the 24 oracles agree with the parse.** The corpus went from 190 ToC
oracles to 214; the disagreeing count went 30 → 31 and the finding count
265 → 273, and the whole of that movement is `magnifica-humanitas.it`'s eight.
Nine of the twenty-four are `"headings": []`, which is what this genre of
letter mostly is.

### An English mirror printing no divisions is the source, not the parser

Two agents reported it independently — `musicae-sacrae` (EN 0 headings against
PT 29) and `fulgens-radiatur` (EN 0 against PT 6) — each having checked the raw
English page and found no heading markup at all. It generalises, and the
measurement is worth keeping because the next person to notice it will assume
the opposite:

**33 works have one edition with no divisions and a sibling with four or
more, and 31 of the 33 are the English edition that is empty.** A crude scan
over all 1,614 raw pages for short `<p>`s wholly inside `<b>`/`<i>` agrees
edition by edition: the English mirrors carry 0–3 such paragraphs, which is
the masthead, the signature and the copyright line, while their Portuguese
siblings carry 6 to 61.

| work                       |  EN |  PT |     | work                  |  EN |  PT |
| -------------------------- | --: | --: | --- | --------------------- | --: | --: |
| `quadragesimo-anno`        |   0 |  60 |     | `mediator-dei`        |   0 |  23 |
| `divini-redemptoris`       |   0 |  59 |     | `mortalium-animos`    |   0 |  19 |
| `divini-illius-magistri`   |   0 |  42 |     | `humani-generis`      |   0 |  12 |
| `divino-afflante-spiritu`  |   0 |  39 |     | `ingruentium-malorum` |   0 |  10 |
| `musicae-sacrae`           |   0 |  29 |     | `fulgens-radiatur`    |   0 |   6 |
| `mystici-corporis-christi` |   0 |  28 |     | `apostolico-seggio`   |  12 |   0 |
| `haurietis-aquas`          |   0 |  28 |     | `grata-recordatio`    |  11 |   0 |

The two that run the other way are the check on the reading: they are the same
phenomenon, not a counter-example, and their Portuguese pages were confirmed
heading-free at raw level too. So this belongs beside the Bible's edition
divergence in `docs/research/bible-edition-divergence.md`: **calling it a defect
invites someone to "fix" a faithful parse of a faithful text.** It also means
`audit.py balance`'s reasoning does not carry over to document structure — the
CCC's eight editions can be compared division for division because they are
eight typesettings of one text, and these are not.

### Three parser fixes, measured together

All three were decided on the in-process harness, then confirmed by a full
`phase1` + `phase2 --overwrite`. **36 files changed across 34 works — 29
`sections.json`, 5 `structure.json`, 2 `appendix.json`, none added or removed —
zero network fetches, and the validation summary is byte-identical to the
baseline (271 validated / 127 stub / 37 failed / 11 fetch-failed).** 1,188 site
tests pass and preflight's reference-coverage comparison reports no family
falling.

**1. The masthead's subtitle was being read as the body's first line.** 25
works opened section 1 with a line like `SOBRE A RECITAÇÃO DO ROSÁRIO
ESPECIALMENTE NO MÊS DE OUTUBRO` — the document's own descriptive subtitle,
printed as if it were prose. `extract_document_header` stops at the first block
naming neither the document nor its author, and a subtitle names neither. The
English mirrors were never affected because they print the same two lines
inside ONE paragraph separated by `<br />`; the Portuguese ones use a second
centred `<p>`, and that is the whole difference.

The fix is a boundary **the page states** rather than one we infer, which is
the precedence `_printed_masthead_end` already established: `#663300` is the
brown vatican.va sets its masthead in, and a coloured block extends a masthead
that identity has already started. Three things about it were learned the
expensive way:

- **It must read `Block.raw`, not `Block.html`.** `<font>` is not inline
  emphasis, so narrowing drops it long before this runs. Asking `b.html`
  returns False for every block on every page — a silent no-op that passes
  every test.
- **The run flag and the acceptance test are different tests.** The masthead's
  own title line wears emphasis, so the strict test is false for exactly the
  block that starts the run it is meant to continue.
- **Once the run is being extended on colour, colour is the only credential
  left.** Reaching one block further than identity would have reached puts
  identity in front of blocks it never used to see. `miranda-prorsus.en` is
  what that costs: its mirror runs the title and `<b>INTRODUCTION</b>` into one
  coloured paragraph, which names the document, so identity claimed the whole
  thing and swallowed the first heading of a 39-heading document.

**And the colour is declined wherever the block is emphasised**, which loses
two works that would otherwise have been fixed. `redemptoris-missio.en` sets
its subtitle in bold and `miranda-prorsus.en` sets `INTRODUCTION` in bold, both
inside `#663300`; no test over emphasis alone can take the first and leave the
second. Declining both leaves those two exactly as they were. That is the safe
side of a boundary this signal cannot draw, and it is recorded here so nobody
re-derives the tempting version — `is_full_bold` was tried, and it takes the
heading.

**2. An empty anchor separated nothing, and put a space inside a word.**
`<a name="x"></a>` is a link target, and vatican.va plants one wherever its own
printed table of contents points — routinely inside a word, because the anchor
is named after the fragment: `L’<a name="uguale"></a>uguale dignità`,
`nell’<a name="era_digitale"></a>era digitale`. Two tags, two spaces, and a
heading that no longer matches the heading the page prints. Found by
`magnifica-humanitas.it`'s agent and confirmed at markup level.

**It had to be dropped in `narrow_html` as well as `strip_tags`, and the
round-trip check is what said so.** Fixing only `strip_tags` moved
`divino-afflante-spiritu.pt` and `musicae-sacrae.pt` from `validated` to
`validation-failed` with 26 mismatches between them — an unknown tag leaves a
space behind, so `Igreja."<a name="fnref3"></a>(3)` narrowed with a space the
source does not print while the block's own text no longer had one. Both sides
read the same markup and must drop the same nothings.

**3. Two mirrors lost a paragraph break, and it is the whole class.**
`militantis-ecclesiae.en` prints nine sub-headings each alone in its own
`<p align="left">`; the tenth, `Modern Knowledge Serves the Faith`, sits at
the tail of section 2's paragraph and is absent from `structure.json` while
its nine identically-styled peers are present. `miranda-prorsus.en` runs its
title line and `INTRODUCTION` into one centred paragraph and stored them as a
single node titled `MIRANDA PRORSUS INTRODUCTION` — neither the masthead (so
nothing skipped it) nor the heading (so the reader was offered a division that
does not exist).

Both are **broken markup, not prose**, so they are repaired in code with their
locators, the treatment `martini.py` gives `<em<` and `<br<` (CLAUDE.md). And
the class was measured before it was named: scanning every raw page for a body
paragraph ending in a stranded emphasis run reports these and one `Heb <` in a
Latin edition the corpus does not build. 56 of the 58 loose candidates are an
emphasised closing phrase — `¡Abrid las puertas a Cristo!`, `Magnificat!` — so
a general rule would have to tell a heading from an exclamation, and there is
nothing for it to earn.

### `magnifica-humanitas.it`, and a level defect its siblings expose

The Italian edition is the only one of the wave still disagreeing, at eight
findings, and its agent read all of them at markup level. Two were the empty
anchor above. One is the dateline — `Dato a Roma, presso San Pietro, il 15
maggio…` is fully italicised on the page and the heading detector takes it, at
`before: null`. The remaining five are a new shape worth stating:

**A heading whose emphasis is interrupted by a style switch is levelled
differently from its byte-identical siblings.** `Le <i>res novae</i> del nostro
tempo` sets a Latin phrase roman against the surrounding italic; `Il canto
della speranza: il <i>Magnificat</i>` does the same for a title. Both are read
one tier off, and — this is the tell — so are the plain siblings around them,
in the opposite direction. `Armi e IA` is byte-identical in markup to its four
neighbours and parsed one level deeper than all of them, which is also the only
place the parse invents a fourth tier in a document that has three.

This is class 1 from the classification above, seen in a document where the
oracle can be checked against two siblings rather than argued about: the
English edition's oracle levels all of these the same way. It is more evidence
for the branch-local `prelim` hypothesis, and a good regression case for it.

### Clean negatives, recorded so nobody re-derives them

- `musicae-sacrae.en` and `fulgens-radiatur.en` print no internal divisions.
  Verified at raw level, twice, by different agents. See the table above.
- `christi-matri.pt` prints no paragraph-number digits at all, yet the parser
  assigns §1–§13 to its body paragraphs from the numbering it does carry — a
  numbered work despite appearances, not a `"numbered": false` case.
- `ad-extremas.en`, `acerba-animi.en`, `meminisse-iuvat.en`,
  `ingravescentibus-malis.en`, `redemptoris-nostri-cruciatus.en`,
  `quod-anniversarius.en`, `caritatis-studium.en`, `in-amplissimo.en` and
  `anni-sacri.pt` are genuinely undivided numbered prose.
- `eccl-de-euch.pt` §62's `kept?` block is the Portuguese hymn translation,
  intact after the Latin original. Not a truncation.

## Wave 14 (24 works) — 2026-08-28

Same shape as wave 13: ten Leo XIII, seven Pius XII, two Pius XI, two John
Paul II, one each of John XXIII, Paul VI and Leo XIV. **21 of the 24 oracles
agree with the parse**, and the three that do not each carry a diagnosis read
at markup level by the agent that wrote them. The corpus now holds **238 ToC
oracles** and **245 descriptions**; 34 works disagree.

Two of the wave's works are `"numbered": false` editions (`quae-ad-nos.en`,
`lux-veritatis.it`) and were briefed as such, which is the first time that
path was exercised deliberately rather than discovered.

### The 87 stray comment markers are one parser defect, not source text

`in-multiplicibus-curis.pt` stored its only footnote as
`AAS 40(1948), p.171. <!--`. The raw page prints it cleanly; the marker is the
opening of vatican.va's own `<!-- /TESTO -->`, which closes the page body.

**All 87 occurrences in the corpus are the LAST footnote of their unit, and
every one ends in the marker.** The footnote region runs to the end of the
page, so it ends between the `<!--` and its `>`; `strip_tags` removed a CLOSED
comment as a side effect of matching `<`-to-`>` and had no rule at all for one
cut in half. Fixed there, and the count is now zero.

**This makes a claim in `CLAUDE.md` false, and the note has been corrected.**
Those 87 files were cited as evidence that stored corpus text carries comment
markers, which is why `minify-build.mjs` skips JSON. It does not carry them
and never did. The scan still skips JSON — a source page may one day print a
comment marker as text, and refusing a build over it is the wrong failure —
but the reason is now a hypothetical rather than a miscounted fact.

### An anchor marks up a phrase; it does not separate two

Batch 11 recorded that "`<a>` inside a heading spaces the words it links — and
the fix is not here". It is here now. vatican.va links the title of a document
it names, mid-heading and mid-clause, and `<a>` was the one inline tag in
neither text path's keep-set, so the two tags became two spaces:
`mater.pt` printed `A época da encíclica " Rerum Novarum "` for a heading whose
page shows no space at all.

**`strip_tags` AND `narrow_html` both had to change**, which is the same lesson
the empty-anchor fix taught one commit earlier: the round-trip check compares
the two, so fixing one side turns a spacing defect into a validation failure.
Measured: **106 files across 102 works**, one oracle better
(`divino-afflante-spiritu.pt` 19 → 18) and none worse.

### `phase1` + `phase2 --overwrite` is not a full re-parse, and the recipe says so

Fourteen works are outside `DEFAULT_LANGS` — seven Italian-only encyclicals and
the seven non-English/Portuguese editions of Magnifica Humanitas — so two
commands leave them at whatever the last run wrote. Six of the 87 comment
markers survived the first "full" re-parse for exactly this reason and read as
six unfixed cases rather than six stale files.

The corpus README's rebuild recipe already carries all four commands and warns
about this at length. The lesson is only that a blast-radius measurement has to
use the recipe rather than the two commands one remembers.

### Two candidates measured and NOT taken

**Widening bold detection to `<strong>`.** `mater.pt` sharpened the case: it is
not only levelling damage, as batch 10 recorded, but a lost top-level division —
`QUARTA PARTE` is printed `<strong>` where its three sibling Parts use `<b>`,
so the Part vanishes and its subtitle is left stranded a tier down. Widening
clears `pascendi-dominici-gregis.pt` outright (7 findings → 0) and recovers
`mater.pt`'s Part. It also takes `pacem.pt` from 1 finding to 9: recovering that
document's `INTRODUÇÃO` shifts its modal level offset, so one finding becomes an
OFFSET row plus eight LEVEL rows. That is class 1, and the widening stays behind
it. The class is 303 heading-shaped paragraphs across 25 pages.

**A general rule for a heading stranded at a paragraph's tail.** Rejected in
wave 13 and re-confirmed: 56 of the 58 loose candidates are an emphasised
closing phrase.

### An oracle corrected, and how it was caught

`diuturni-temporis.pt`'s oracle recorded every `before` one too high, and its
agent reported the work as agreeing with the parse. Reading the raw page
settles it in one pass — the six headings are each followed by a paragraph the
page prints as `1.` through `6.`, so `before` is 1–6 and the parser was right.
The agent had also reported that the page prints no inline paragraph numbers,
which is false. **An agent's "audit.py toc reports no disagreement" is worth
re-running rather than believing**, since the audit only agrees with whatever
oracle was on disk when it ran.

### Findings recorded, not acted on

- `ad-apostolorum-principis.pt` is the one work of the 25 the masthead-subtitle
  fix does not reach, and it is a variant rather than a miss: its mirror sets
  that paragraph in no colour at all, so the signal the fix reads is absent.
- `magnifica-humanitas.ar` prints its chapter openings as three centred lines
  and the parser folds two into a node and spins the third off as its own, where
  `.en` and `.it` merge all three. Six findings, all at `before` 90 and 131.
- The Arabic edition's sub-headings are genuinely one flat tier — it never
  italicises a heading, so the tier its siblings mark with bold-italic does not
  exist in it. The parser agrees; it is the source, not a gap.
- `mediator-dei.pt` skips from §151 to §153 with no §152 on the page. Documented,
  not corrected: there is no missing text to restore.

## Wave 15 (24 works) — 2026-08-28

Eleven Leo XIII, eight Pius XII, two Pius XI, two John Paul II, one John XXIII.
**22 of the 24 oracles agree with the parse.** The corpus now holds **262 ToC
oracles** and **269 descriptions**; 36 works disagree, and no previously
agreeing work regressed.

`diuturni-temporis.pt` went from 6 findings to 0 — the oracle correction filed
at the end of wave 14 only took effect once a fresh parse ran, which is worth
remembering when a fix appears not to have worked.

### Three OCR misprints filed

Two in `quod-multum.en`, one in `inimica-vis.en`, all with a correct value
fixed by the page rather than inferred:

| locator             | prints                          | reads              | corroboration                       |
| ------------------- | ------------------------------- | ------------------ | ----------------------------------- |
| `quod-multum.en` §1 | `many Roman Ponfiffs`           | `Pontiffs`         | same page spells it correctly twice |
| `quod-multum.en` §6 | `which is nor to be restricted` | `not`              | next sentence says it positively    |
| `inimica-vis.en` §9 | `<i>Course o f Action</i>`      | `Course of Action` | its five sibling headings are clean |

All three are single-character substitutions or a stray space — the ordinary
signature of the OCR this mirror's older English texts came through. The
re-parse moved exactly two files, which is what a correction's blast radius
should look like.

### An oracle that counted the addressee line as a heading

`inimica-vis.en`'s oracle opened with `To the Bishops of Italy.` at level 1,
and the audit duly reported it MISSING. It is the addressee formula, set in
the same left-aligned italic as the five real headings — which is exactly why
the agent took it for one. Two other agents in the same wave met the identical
shape (`To the Catholic Missionaries in Africa.`,
`To the Bishops of Spain…`) and correctly excluded both. Dropped from the
oracle, and the work is now clean.

**The rule is already in `writing-descriptions.md` and still cost a wave a
finding**, so it is worth stating in the sharper form: identical styling to the
headings is not evidence, because on these pages the addressee is _always_
styled like them. Position is the evidence — it sits between the masthead and
the first body paragraph.

### An italic-heading defect with an exact diagnosis, not fixed

`catholicae-ecclesiae.en` prints four italic-only sub-headings and the parser
drops all four — not absorbed into a paragraph, discarded. The markup is
byte-identical in shape to `non-mediocri.en`'s, which promotes five of the same
thing, so the difference is not the markup:

```
non-mediocri.en       italic blocks at 2, 4, 6, 8, 10, 12, 14   promoted 5
catholicae-ecclesiae  italic blocks at 2, 3, 5, 7, 10, 13       promoted 0
```

`promote_italic_heading_run` takes `body_start = numbered[0]`, the first block
carrying a printed paragraph number, and a candidate before that point joins
the run only if it opens a numbered paragraph. **`catholicae-ecclesiae.en`'s
section 1 is unnumbered** — the page's first printed number is `2.` — so
`body_start` lands past two of the four headings, leaving two in the body,
below the run threshold of three, and the whole run collapses.

So the bug is not the threshold. It is that `numbered[0]` is the first NUMBERED
paragraph and the rule wants the first BODY paragraph, and those differ in
every document whose opening section the source leaves unnumbered — a shape
several manifests already record a note for. Not fixed here: it wants its own
measurement, and three parser changes had already landed this session.

### Clean negatives, recorded so nobody re-derives them

- **The unnumbered-edition code path does tier detection.** An agent reported
  that `miranda-prorsus.pt` came out flat because the appendix path "appears
  not to do level detection at all". It does: of the 34 unnumbered editions
  with structure nodes, `quadragesimo-anno.pt` has three levels,
  `divini-illius-magistri.pt`, `vigilanti-cura.en` and `summa.en` two.
  `miranda-prorsus` is flat for the ordinary reasons — `<strong>` invisibility
  removing the tier markers, and the class 1 levelling collapse.
- `paenitentiam.pt` prints 8 headings against its English sibling's 17, and
  `laetitiae-sanctae.pt` 9 against 6 — divergence in both directions, verified
  at raw level, and neither a defect. Compare the wave-13 table.
- `quemadmodum.pt` opens five of its nine paragraphs with no `<p>` tag at all.
  No text was lost; recorded as a markup oddity, not a defect.

## Wave 16 (24 works)

21 of the 24 new oracles agree with the parse; 286 oracles now compared, 39
disagreeing, and **no previously-agreeing work regressed**. All three
disagreements are the same known defect, described below.

### The wave-15 diagnosis of the italic-run defect was wrong, and the correction matters

Wave 15 left this note: `promote_italic_heading_run`'s `body_start =
numbered[0]` should be the first BODY paragraph rather than the first NUMBERED
one. Three of this wave's works exercise it — `apostolico-seggio.en` loses
"Italy Has Come to This", `custodi-di-quella-fede.en` loses "Deplorable
Conditions in Italy", and `catholicae-ecclesiae.en` (wave 15) loses four — so
it was measured properly before being taken.

**It is not a slip. The guard is load-bearing, and removing it costs 26 works
to gain 3.** A patched parser run over every oracle went from 39 disagreeing
works to 65, and every one of the 26 new disagreements is a salutation promoted
into the table of contents: 'Venerable Brethren, Health and Apostolic
Benediction.' in twenty-one of them, 'To the Bishops of Poland.' and its kind in
five.

The reason is a shape the corpus is full of and the diagnosis had not accounted
for: **these documents leave their opening section unnumbered.** The printed
numbering starts at "2.", the parser promotes the preceding unnumbered block to
§1, and `numbered[0]` is therefore the block that opens §2. Everything in §1 —
including the addressee line and the apostolic greeting, both italic, both
furniture — is "before body_start". The guard is what keeps them out.

A shape-matching refinement was tried and rejected with numbers: admit a
pre-body italic block only when its tag envelope equals the modal envelope of
the run. It does not discriminate, because on these pages the salutation is
printed in exactly the markup the headings are (`<font size="3"><i>`). It fixed
`catholicae-ecclesiae.en` (4 findings to 1) and broke five other works.

What actually separates 'Italy Has Come to This' from 'Venerable Brothers,
Health and Apostolic Benediction.' is that one is a greeting, and every
discriminator that works is lexical:

| discriminator | fails on                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------- |
| markup shape  | all 26 — same envelope as the run                                                           |
| ends with `.` | `aeterna-dei.en`, which prints no stop                                                      |
| contains `,`  | real headings do too — `grande-munus.en`'s 'Cyril and Methodius, Missionaries to the Slavs' |

So the fix is a salutation cue, in at least EN/PT/IT, and it is worth what it
costs only alongside class 1. **Recorded here so the wave-15 note is not acted
on as written.**

### Corrections filed

- **A masthead template with the typo baked in, on 30 pages.** 'ARCHBISHOPS,
  BISHIOPS, AND OTHER LOCAL ORDINARIES' — the standing addressee formula of the
  Pius XII-era English mirrors. The corpus settles it rather than we do: 30
  pages print `BISHIOPS` and 4 print `BISHOPS` in the identical boilerplate
  line, which is one bad copy of a shared template, not thirty typos. The line
  is reader-visible — it is stored whole in `manifest.header` and rendered as
  the document masthead. Filed as 30 one-entry corrections, since the layer is
  per-work.
- **`christi-nomen.en` lost 16 word spaces to its own reflow**, all inside its
  four numbered paragraphs: 'the onetrue Church', 'holy ministerswho',
  'the EasternChurches', 'should moveCatholic men'. Verified literal in the raw
  HTML — no markup is involved, so this is the source and not the parser. One
  entry carries a second defect in the same clause ('in these hard rimes' for
  'times'), the r-for-t substitution this mirror's older texts show elsewhere.
- Two single misprints in printed headings, both reader-visible in a table of
  contents: `augustissimae-virginis-mariae.pt` §12 'Auspícios par a difusão'
  (the page split _para_ after two letters), and `humani-generis.pt` '4 . Erros
  subseqüentes' against its five siblings' tight '1.'–'6.'.

Blast radius: 69 files across 33 works, 0 network fetches — 33 manifests, two
`structure.json` (the two heading misprints), one `sections.json`
(`christi-nomen.en`). Validation summary unchanged; none of the touched works
failed.

### Clean negatives

- **`dilectissima-nobis.en` signs itself 'PIUS X'** where the document is Pius
  XI's. A real source misprint, and deliberately not corrected: it sits in the
  signature block, which the parser drops entirely, so it reaches no reader and
  no stored field.
- **The census `§` column is not `before`** for a heading whose own text starts
  with a numeral: on `evangelii-praecones.pt`'s '1. Progressos' it shows the
  numeral inside the heading. Read `before` off the raw page.
- `dum-multa.en` prints two italic sub-headings and loses both — the run
  threshold is 3, and two headings are not yet a convention. The oracle records
  what the page prints; the disagreement is correct.

## Wave 17 (24 works)

19 of the 24 new oracles agree with the parse; 310 oracles now compared, 44
disagreeing, and **no previously-agreeing work regressed**. All five
disagreements are the same finding, and it is the wave's real result.

### Nine oracles of one document disagreed about a tier the page prints the same way

_Magnifica Humanitas_ is now read in nine languages, 75 headings apiece,
aligned heading-for-heading — the strongest oracle in the corpus, because a
disagreement between two editions of the SAME text at the SAME locus cannot be
translation divergence. Reading them side by side, they disagreed with each
other about eight nodes: the four sub-headings under the Introduction and the
four under the Conclusion.

| edition    | Introduction | Conclusion |
| ---------- | ------------ | ---------- |
| es, pl, ar | 2 2 2 2      | 2 2 2 2    |
| en, it, ru | 2 2 2 2      | 3 3 3 3    |
| de         | 2 3 3 3      | 3 3 3 3    |
| fr         | 2 3 3 3      | 2 3 3 2    |

French's `2 3 3 2` cannot be read off any page — four headings printed
identically do not alternate tiers — and a 3 sitting directly under a 1 breaks
the contiguity rule the brief states. **These oracles were written from the
parse rather than from the page**, which is the one failure the whole procedure
exists to prevent; a `--derive`-shaped mistake survives because an oracle
derived from the output cannot contradict the output. Five editions were
repaired to `2` throughout, which is both the rule-conformant answer and what
six of the nine already said.

### The mechanism, measured

Two agents reported this as "identical markup, different level". Checking the
raw pages myself, it is subtler and worth stating exactly, because the obvious
fix does nothing:

**The headings look identical to a reader and differ in markup.** An `<a name>`
anchor or a roman gloss set inside the italic run splits it in two, and
`is_full_italic` — deliberately exact, see its docstring — reads a split run as
not-italic. The style key flips, and the level walk reads the flip as a tier
change. Polish is the clearest case: `<b><i>Rzeczy nowe</i>(res novae)<i>
naszych czasów</i></b>` scores italic=0 where its three siblings score 1.

Per edition, the four Introduction siblings score:

|                        | markup shapes among the four siblings |
| ---------------------- | ------------------------------------- |
| es, ar                 | all identical                         |
| en, it, fr, ru, de, pl | 2–3 distinct shapes, same appearance  |

**Tolerating a parenthesised gap inside an emphasis run was tried and changes
nothing** — 43 works / 325 findings before and after, byte for byte. The gloss
is only one of the splitters and not the common one, and the level walk is
where the tier is actually decided. That is class 1, and it stays there.

### Taken: a signature set off by a comma is still a signature

`drop_page_furniture` already drops a papal signature trailing the last
numbered paragraph — the positional test is what lets a pope's name stand as a
real heading inside a body. Its regex missed two forms: `LEÃO XIII, PAPA`
(comma before `PAPA`) and `PIUS XII POPE` (the English mirrors' word). Both
stood as childless top-level headings in a reader's table of contents.

Measured before taking: exactly 2 nodes corpus-wide match the widened regex and
not the old one, both childless, both `before: null`; over every oracle, one
work newly agrees and none regress.

### Corrections filed

- `longinqua.en` prints `CATHOLICISMIN THE` in its masthead and `is
.progressing` — a full stop stranded inside a sentence — in §5.
- `magnifica-humanitas.pl` §4 loses the space before its Latin gloss. The page
  settles it: its own contents entry for the same heading keeps the space.

### Clean negatives

- **`mirabile-illud.en` does not print `ARCHBISHIOPS`.** An agent reported it
  as a source misprint; the string occurs 0 times in the raw page and is absent
  from `manifest.header`. Read a reported misprint out of `raw/` before filing.
- **`miranda-prorsus.en`'s lost `</p>` is fixed**, and the note in the wave
  brief describing it as live is now stale — the wave-13 markup repair covers
  it, and every heading the census finds is in `structure.json`.
- An open oddity, recorded because it is unexplained rather than because it
  matters: `haurietis-aquas.en` and `immortale-dei.pt` rewrote their
  `manifest.json` and `corrections-applied.json` during this wave's re-parse
  while every parse field — structure, sections, notes, every dataclass field —
  is byte-identical under the old and new parsers, and a repeat run is stable.
  No corpus text is affected.

## Wave 18 (24 works)

18 of the 23 new oracles agree with the parse; 333 oracles now compared, 49
disagreeing, and **no previously-agreeing work regressed**. The wave was
interrupted by a session limit that killed 22 of the 24 agents mid-task, and
restarted; that is written up under "Losing a wave" below because it changes
how the next one should be sized.

### The wave-17 finding is worse than it was measured to be

Wave 17 established that `promote_italic_heading_run`'s `body_start =
numbered[0]` guard is load-bearing — removing it promotes 26 salutations —
and that the cost of keeping it is one lost heading per affected document.
**`omnibus-compertum.en` shows the cost compounds.**

Its section 1 is unnumbered, so the printed numbering starts at "2." and
`numbered[0]` is the block opening §2. The first italic heading sits before
that and is therefore "pre-body", excluded from `candidates`. That leaves two
body candidates against `_ITALIC_HEADING_MIN_RUN = 3`, the run test fails, and
**all three headings are dropped, not one** — the two that were never pre-body
included. The guard does not merely lose the pre-body heading; it can push a
document under the threshold and lose every heading it has.

`quam-religiosa.en` is the plain one-heading form of the same shape.
`quum-diuturnum.en` looks like it but is not: it prints two italic
sub-headings, two is below the threshold on its own merits, and the code
comment beside `_ITALIC_HEADING_MIN_RUN` already cites that document by name
for exactly this reason. Its oracle records what the page prints and the
disagreement is correct.

### Corrections filed

- **`spectata-fides.en` lost nine word spaces**, the same reflow defect
  `christi-nomen.en` carries — "very manyof your nation", "They do notin all
  things", "from OurPredecessor". Two Leo XIII English mirrors of the same
  vintage with the same damage; the evidence line in each entry says so, since
  that is what makes it the page rather than the text.
- **`sacerdotii.pt` prints U+201A where it means "é"**, ten times, and nowhere
  else. A low quotation mark opens nothing there and the sentence has no verb
  without it, so the correct value is fixed by grammar rather than chosen:
  "o espírito de alguns ‚ batido pelas ondas" is _é batido_. A systematic
  encoding fault, not ten typos.

Blast radius: 6 files across the 2 works, `sections.json` only, 0 network
fetches; both correction sets verified in the stored text with zero residue.

### Findings recorded, not taken

- **`pascendi-dominici-gregis.pt` is the largest single loss the sweep has
  found.** An unnumbered edition whose five centred-bold top-level headings —
  INTRODUÇÃO, the three PARTE labels, CONCLUSÃO — are dropped outright, so
  Parts II and III and the Conclusion are swallowed into one 40,009-character
  appendix block under the last surviving heading. Its salutation is promoted
  to a heading in their place, and the eight surviving sub-headings then parse
  one level shallow. Twelve divisions on the page, eight on the site.
- `princeps.pt` drops `<strong>INTRODUÇÃO</strong>` while keeping its
  identically-styled `<strong>I. A HIERARQUIA…</strong>` peers — the known
  `<strong>` blindness, with the added detail that the roman-numeral headings
  survive on a text pattern the bare word does not match.
- `redemptoris-missio.pt` §283 is the `<strong>`/`<em>` class at its purest:
  one heading written `<em><strong>` where the document's other 39 use
  `<b><i>`, and the only one of the forty that is lost.

### An oracle reproduced blind

`pascendi-dominici-gregis.pt` already had a committed oracle from 2026-08-24.
Its agent, told to distrust any file on disk and re-read the page, produced the
same twelve headings with the same labels and levels. The re-read was reverted
as cosmetic churn — but two independent readings of one page agreeing exactly
is the strongest evidence yet that the procedure is reproducible, and it is
worth more than the diff it would have made.

### Losing a wave

A session limit killed 22 of 24 agents mid-task. **An agent killed that way
cannot be resumed** — `ListAgents` drops it, and only a cleanly-stopped agent
keeps its context — so the loss is not just the results but every agent's setup
reading, roughly 80k tokens apiece. Four had already written their oracle file
before dying; those files were kept on disk but treated as unattested and
rewritten from the page by the restart, because a file whose author never
reported cannot be vouched for. Note the trap for the coordinator: `git add
oracles/toc` would have committed all four silently.
