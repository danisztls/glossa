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

## SUSPENDED 2026-08-21 — how to resume

**The sweep is paused after batch 2, deliberately, to migrate the corpus schema
first** (`docs/decisions.md`, 2026-08-21 — storing paragraph HTML in JSON with a
closed tag allowlist, and recording heading depth instead of a `kind`
taxonomy). Resume after that lands, not before: several things the batch briefs
ask agents to check stop existing under the new schema.

**Progress: 26 of 333.** The ledger is `site/descriptions.json` itself — it is
keyed by work id, so the remaining set is always every document work minus its
keys, and no separate tracking file exists or should be created:

```sh
comm -23 \
  <(ls corpus/works | grep -E '^(encyclical|vatii)\.' | sort) \
  <(jq -r '.descriptions | keys[]' site/descriptions.json | sort)
```

Subtract the 6 zero-section works in `site/unpublished.json`, which cannot be
described (nothing to read) and are not candidates.

### What must change in the agent brief before resuming

The batch-2 brief is written against the old schema and will mislead agents:

- It asks for **`[null, null]` ranges**, **overlapping/skipped sibling ranges**,
  and **parent ranges that do not span their children**. Under the new schema
  ranges are derived, not stored, so all of these become unaskable. Drop them.
- It says **"every node has `kind: sub`"** and asks whether the markup
  distinguishes tiers. That question is answered and closed: it does, and the
  new schema records observed depth. Replace with a check that the recorded
  depth matches what the raw markup shows.
- Keep, unchanged, the instruction that **`sections.json` greps prove nothing**
  and that every structural claim must be verified against `corpus/raw/`. That
  correction is what makes the reports trustworthy; batch 1 produced a confident
  false negative without it (`adiutricem.en`, §5).

### What has not changed

- One agent per work per language, **Sonnet**, read-only. Agents return JSON and
  never write: the coordinator applies `descriptions.json` in one batch, because
  concurrent agents editing one file collide.
- PT descriptions are written **from the PT text**, never translated from EN.
- Batches are stratified across page shell and pontificate, not alphabetical, so
  that defects surface while batches remain to benefit from a fix.
- Every clause of a description must be quotable from a section the agent
  actually opened.

### Batch 3 candidates (selected, not yet run)

Chosen to continue the stratification and to re-check the works this pass
identified as damaged: `encyclical.ut-unum-sint.en`,
`encyclical.redemptoris-missio.en`, `encyclical.redemptoris-mater.en` (all three
carry the separator-split `CHAPTER` headings), `encyclical.dilexit-nos.en` (42
plain-centered blocks, the largest such run), `encyclical.fratelli-tutti.en`
(18), `encyclical.pergrata.en` and `encyclical.paenitentiam.en` (large italic
recoveries, never described), plus unexamined Leo XIII and Pius XII works, which
remain the two largest pontificates.

### Parser fixes decided but NOT applied

Carried into the migration work, still outstanding — see "Four more heading
markup variants" below for evidence and counts:

1. **Separator-tolerant bold** — `<b>CHAPTER I</b> - <b>Title</b>`. 8 blocks, 6
   files. Currently _corrupts_ text by appending the heading to the preceding
   section. Approved.
2. **Keep dropped salutations** — lone italic blocks are discarded rather than
   retained as content. 57+ files, both languages. Approved.
3. Inline-style bold (`<span style="font-weight: 700">`) and number-outside-bold
   (`N.<b> Title</b>`) — 4 blocks, `laudato-si.pt` only. Not yet decided.
4. Plain-centered headings — 386 blocks / 199 files, but mostly furniture
   (copyright lines, title blocks); only 24 files carry a run of >= 3. Real
   damage where it bites (`evangelium-vitae.pt` loses three top-level chapters).
   Not yet decided; needs a run-gated rule and its own diff review.

`LEVELS` reordering and the stored-range repairs are **deliberately dropped** —
the new schema removes both problems rather than fixing them.

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
  `docs/decisions.md` §Source-defect corrections policy — not a code
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
