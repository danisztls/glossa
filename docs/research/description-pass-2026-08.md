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
