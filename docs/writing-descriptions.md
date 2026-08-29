# Writing document descriptions

How a one-line description of a Magisterial document gets written for this
site, and why the procedure is shaped the way it is.

This exists to be handed to someone (or some agent) who has been asked to
describe a document. Follow it in order. The first section is the part that
matters; everything after it is mechanics.

## The rule

**A description is written by reading the document in the corpus. Never from
recollection of what a document with that title probably says.**

This is not a stylistic preference. The corpus holds ~450 documents, most of
them obscure — Leo XIII alone wrote dozens of encyclicals that almost nobody
has read. Asked to describe one from memory, a language model does not fail
loudly by drawing a blank; it produces a fluent, confident, specifically wrong
paragraph, because the title is Latin and suggestive and the genre is
familiar. Nothing on the rendered page distinguishes that from a real summary.

The project's standing rule for the corpus itself is that a defect with no
known correct value gets **documented, not invented** (`docs/decisions.md`,
Corrections and overrides). A description invented from a title is the
same failure wearing editorial clothes. **A missing description costs a reader
nothing. A wrong one silently misinforms them about what the Church taught.**

The worked example that established this: `encyclical.magnifica-humanitas`
(Leo XIV, 2026-05-15) sits at the edge of the model's knowledge. Guessing from
the title — _magnifica humanitas_, "the grandeur of humanity" — yields
something about human dignity, which sounds right and is wrong: the document
is about **artificial intelligence**. Reading §1 settles it in one sentence.
Reading five more sections gives a description that is checkable line by line.

## Procedure

**The corpus is a separate repository.** As of 2026-08-23 it is `glossa-corpus`,
a private checkout beside this one (`CLAUDE.md`). Every path below is relative
to it, and `$CORPUS` stands for it:

```sh
CORPUS=${CORPUS_DIR:-$HOME/Dev/me/glossa-corpus}
```

### 1. Read the document

```sh
cd $CORPUS/build/encyclical.<slug>.en

jq 'length' sections.json                                  # how long is it
jq -r '.[] | "\(.level)  before \u00a7\(.before)  \(.label // "")\(.title)"' structure.json
```

Note both shapes changed in August 2026 and older recipes are wrong:
`structure.json` is a **flat array** of `{level, title, before}` (plus optional
`label`/`subtitle`), not a tree with `kind`/`paragraphs`; and a section's
blocks carry **`html` only** — `text` and `text_marked` were removed
(`docs/decisions.md` §Storage). A recipe asking for `.text` returns empty
strings rather than failing, which reads as an empty document.

```sh
for n in 1 17 46 90 131 182; do
  echo "=== \u00a7$n ==="
  jq -r --argjson n $n '.[] | select(.n==$n) | .blocks[].html' sections.json \
    | sed -e 's/<[^>]*>//g' | head -c 700
done
```

Chapter-opening sections are disproportionately informative: this genre
announces what each chapter will do ("In this first chapter, I intend to…").
The final sections carry the appeal the document is actually making.

### 2. Read the raw page, with `census.py`

**Never judge a document's headings from `sections.json`.** The corpus's
largest structural defect is headings that the parser dropped, so they are
missing from exactly the file you would be searching. A negative from parsed
output means "no headings survived the parse", never "no headings exist". This
produced a confident false negative in batch 1 (`adiutricem.en`, reported as
genuinely flat, actually holding 18 real sub-headings).

`pipeline/scrapers/census.py` puts the raw page and the parser's verdict side
by side, one line per block, so you do not have to read 400 KB of HTML:

```sh
python3 pipeline/scrapers/census.py encyclical.<slug>.en --headings
python3 pipeline/scrapers/census.py encyclical.<slug>.en --dropped   # lost outright
```

Each row gives the block's index, its paragraph number if it has one, the
parser's verdict (`heading` — in the structure tree; `kept` — in a section;
`DROPPED` — in neither), the source's own markup (`all-bold`, `all-italic`,
`center`, `css-bold`, `part-bold`), and the text.

The markup column is where the defects live. `is_full_bold` requires a block's
**entire** text inside `<b>`, and vatican.va defeats that in at least six
documented ways — italic-only headings, `<b>CHAPTER I</b> - <b>Title</b>` split
by a plain separator, `N.<b> Title</b>` with the number outside the bold run,
`font-weight: 700` instead of `<b>`, and plain centered `<p>` with no emphasis
at all. `evangelium-vitae.pt` prints `CAPÍTULO II/III/IV` with **no markup
whatsoever** while `CAPÍTULO I` is bold.

Treat every oddity as a suspected parse defect and report it. The tells:

- a `DROPPED` block that is real document text, not page furniture
- a heading in the source that the census scores `kept` (it was absorbed into
  a paragraph's body instead of lifted into the structure tree)
- duplicate titles at the same level, or a level that contradicts the source's
  own typography
- a `before` that does not match where the heading actually sits

Page furniture is _expected_ to be dropped: the language bar
(`AR - BE - CS - DE - …`), the title block, `© Copyright — Libreria Editrice
Vaticana`, and the papal signature. Those are not findings.

**The document's own title is not a heading.** Every work's `structure.json`
carries a node for its title (`LIBERTAS`, `Mediator Dei`) as a fallback top
node; it is a masthead, not an internal division, and it must not go in the
ToC oracle. A work whose only structure node is that title has **no**
divisions, and its oracle is `[]`. This was the one thing batch 3's agents
disagreed about, and left unstated it produces oracles that disagree with each
other rather than with the parser.

Two verdicts are deliberately not confident. `heading*` means the block is one
line of a heading the parser stored as a single multi-line node — normal, not
a finding. `kept?` means the block's text matches only the _start_ of a stored
block, so a heading absorbed into the following paragraph cannot be told from
one that survived; check that case against `sections.json` yourself before
calling it either way.

### 3. Write the table of contents

Read from the census what headings the page actually prints, and record them
as the work's ToC oracle:

```sh
$CORPUS/oracles/toc/encyclical.<slug>.en.json
```

```json
{
  "work": "encyclical.<slug>.en",
  "read_on": "2026-08-23",
  "source": "raw/vatican-docs/encyclical__<slug>__en.html",
  "headings": [
    { "level": 1, "title": "INTRODUÇÃO", "before": 1 },
    {
      "level": 2,
      "label": "CAPÍTULO I",
      "title": "A VOZ DO SANGUE…",
      "before": 7
    }
  ]
}
```

`level` is 1 for the document's top divisions and increases with nesting, read
from the source's own typography — centered bold is the major tier,
left-aligned bold-italic the minor one, and a `<center>` wrapper distinguishes
CHAPTER from PART in the old shell. `before` is the number of the first
numbered paragraph _after_ the heading, which is what the census's `§` column
gives you. Split a heading into `label`/`title` only where the source really
prints two lines; the comparison flattens them anyway.

**A document with no divisions gets `"headings": []`.** That is a real and
common finding, not a failure — `rerum-novarum.en` (64 sections),
`quadragesimo-anno.en` (148) and `mystici-corporis-christi.en` (112) are
genuinely undivided numbered prose, verified at raw level. Recording the empty
result is what stops the next person re-deriving it.

**An edition that prints no paragraph numbers declares `"numbered": false`**
beside `work`/`read_on`/`source`. Eight editions in the corpus are typeset as
continuous prose with no inline numbering at all; their text lives in
`appendix.json` rather than `sections.json`, and every heading's `before` is
null. Null already meant something else — "trailing matter the numbered flow
never reaches" — so without the flag a reader cannot tell "there is no number
to point at" from "this heading sits past the last one". `audit.py toc` checks
the claim both ways: a declared flag whose oracle still carries a `before` is a
contradiction, and an edition with no sections whose oracle stays silent is
reported until it says so.

**Never invent punctuation, and never invent a tier.** Three corrections have
been filed against oracles already written, all of them the reader adding
something the page does not print:

- `lumen-gentium.pt` recorded `Regras e constituições. A relação com a
Hierarquia`. The source prints
  `<b><i>Regras e constituições <br />A relação com a Hierarquia</i></b>` —
  one heading on two lines, with a break and no period. Write it with a space;
  the corpus keeps the break in `title_html` where it belongs.
- `laudato-si.en` split two subsections of `I. POLLUTION AND CLIMATE CHANGE`
  across levels 3 and 4, and nested the two prayers that close the encyclical.
  Both pairs are printed identically — `<p align="left"><i>` and `<p><i>` render
  the same — so both are peers. **If two headings look the same on the page,
  they are the same level**, whatever their subject matter suggests.
- The same file used a scale with no level 3 in it. Levels are contiguous:
  1, 2, 3, not 1, 2, 4.

Then check it against the parse:

```sh
python3 pipeline/scrapers/audit.py toc
```

Disagreements are reported, not gated. Most resolve into a parser fix covering
a whole class of documents; see the next section for what that costs.

### 4. Write the description

- One paragraph, roughly 40–70 words. It is a library-card summary, not an
  abstract.
- Lead with **what the document is about**, not with its genre or its author's
  intentions. The kind, the pope and the date are already rendered next to it.
- Name the specific thing. "On the social order" describes half the corpus;
  "on artificial intelligence and the social doctrine of the Church" describes
  one document.
- Structural imagery the document itself uses is usually worth keeping — it is
  how readers remember which encyclical is which.
- Do not evaluate, recommend, or contextualize its reception. Describe it.
- Every clause must be traceable to a section you actually read. If you cannot
  point at the section, cut the clause.

Write the Portuguese description from the **Portuguese edition**, not by
translating the English one. They are separate works with separate texts, and
`descriptions.json` is keyed by work id for exactly that reason. Where a
document has no Portuguese edition (common — Leo XIII is ~17% translated),
there is simply no `.pt` entry.

### 5. Record the description

Add entries to `site/descriptions.json` — in **this** repository, not the
corpus one — keyed by full work id, then by the language the prose is
written in:

```json
"descriptions": {
  "encyclical.magnifica-humanitas.en": {
    "en": { "text": "Leo XIV's encyclical on artificial intelligence…", "origin": "read" },
    "fr": {
      "text": "Lettre encyclique de Léon XIV sur l'intelligence artificielle…",
      "origin": "translated",
      "from": "en"
    }
  },
  "encyclical.magnifica-humanitas.pt": {
    "pt": { "text": "Carta encíclica de Leão XIV sobre a inteligência artificial…", "origin": "read" }
  }
}
```

**`origin` is the field this whole procedure exists to make true.** `"read"`
means what §1 says: written by reading the document in the corpus. `"translated"`
means derived from another rendering of the same work, named in `from` —
never from the document, because a translator does not read it. The two are
kept apart rather than merged into one field precisely because nothing on the
rendered page distinguishes them, which is the same argument that makes a
guessed description worse than none.

A translation inherits whatever its source got right and whatever it got
wrong. `from` is what makes that a chain you can follow: correct a reading and
every translation of it is known to be stale.

The outer key stays the WORK, not the document, for the reason it always did —
the Portuguese edition is a different text, so a description read from it is
prose about that text and not a translated label. A work described only in
Italian (the seven encyclicals with no English edition) has one entry, under
`it`.

**Not** into `$CORPUS/build/*/manifest.json`. Those are generated; a re-parse
rewrites them, and this project fixes parsers by re-parsing. `sync-corpus.mjs`
merges `descriptions.json` into each manifest on the way into the site, so
`manifest.description` is populated for every route that reads it and the
corpus stays purely generated. Same posture and same place as
`unpublished.json` — though note that file is a hard error when missing and
this one is not, because their failure modes differ in severity.

Then:

```sh
cd site
node scripts/sync-corpus.mjs        # CORPUS_DIR only if the corpus is not the sibling
jq -r '.["encyclical.<slug>.en"].description' src/lib/corpus-data/index/manifests.json
```

Only the **reading** reaches `manifest.description`: the index tier is loaded
eagerly by every reader and nine translations of every description would
multiply the one field in it that is prose. Translations ship separately, one
`index/descriptions.<lang>.json` per language, keyed by document **slug** —
`descriptions.json` is keyed by work because that records which text was read,
but a translation is prose about the document and serves whichever edition a
reader is shown.

### 6. Report defects; fix parsers only deliberately

A defect found in step 2 is reported with the description. Fixing it means
changing a parser shared by every document in its family, which is a separate
decision — see the next section for what that costs.

## Fixing a parse defect

When a defect does get fixed, the fix is in the parser and the document is
**re-parsed, never re-crawled** (`CLAUDE.md`, `docs/link-surface.md`). That
insurance only holds because `$CORPUS/raw/` is intact, which is why it is
treated as write-once.

```sh
# Re-parse one document from cached raw HTML. Zero network fetches.
uv run pipeline/scrapers/vatican_docs.py phase2 \
    --pontiffs <pontiff-slug> --slugs <doc-slug>
```

Confirm the run reports `network fetches this run: 0`.

This took `--overwrite` until 2026-08-29, when re-parsing became what a run
does by default in both phases. `--skip-written` is the opposite flag and is
for resuming an interrupted crawl; passing it here would silently do nothing
to a document that already exists, which is every document you would be
fixing.

**A parser change is never local.** `vatican_docs.py` parses ~450 documents
across several page templates, so measure the blast radius rather than
assuming it:

```sh
# 1. snapshot every generated artifact
cd $CORPUS/build
find . -name 'structure.json' -o -name 'sections.json' | sort | xargs md5sum > /tmp/before.md5

# 2. re-parse every document, in every language the parser can read. Do NOT
#    hand-write the two vatican_docs commands: a --langs list short of what
#    DIVISIONS holds leaves those languages' editions at whatever the previous
#    parser wrote, and they do not show up as changed because they were never
#    re-read. That happened, and cost three Swahili editions.
uv run pipeline/rebuild.py --only documents

# 3. diff — anything changed that you did not intend to change is the finding
cd $CORPUS/build
find . -name 'structure.json' -o -name 'sections.json' | sort | xargs md5sum > /tmp/after.md5
diff /tmp/before.md5 /tmp/after.md5
```

A fix that changes only the documents you meant to fix is a fix. A fix that
changes others has told you something, and you should find out what before
keeping it.

Note also that `check-symmetry`'s cross-language `VALIDATION: FAIL` is the
corpus's **normal** state and not a signal about your change: many documents
legitimately have asymmetric EN/PT section sets, because a missing translation
is legitimate and common (`CLAUDE.md`). Compare the named documents, not the
pass/fail.

### Worked example: the `magnifica-humanitas` structure defect

`structure.json` opened with five nodes with `[null, null]` ranges and a sixth
titled "CHAPTER FIVE" spanning `[1, 16]` — a chapter five that begins at
section one, holding what is actually the Introduction.

Cause: the modern vatican.va shell prints a linked table of contents ahead of
the body, and each of its entries is a fully-bold `<p>` — indistinguishable to
`is_full_bold` from the heading it points at. The walker pushed each TOC entry
as a structure node, and since a heading stays open until the next one pops
it, the last TOC entry was still open when §1 arrived and adopted the whole
Introduction.

Fix: `drop_table_of_contents` in `pipeline/scrapers/vatican_docs.py` removes a
pre-body heading when a later heading duplicates it, requiring at least two
such duplicates before dropping anything (one repeat is a coincidence a real
document produces; a run of them in order is a table of contents). Dropped
entries are reported as anomalies, never silently.

Result: 0 network fetches, both editions re-validated, and the 16 Vatican II
documents re-parsed byte-identical — the guard held.

While fixing it, `--overwrite` turned out to be documented in the module
docstring but never wired into argparse, so no parser fix had ever been
verified this way. It and `--slugs` were added; without them the smallest
re-parse unit is a whole pontificate.

## Doing this at scale

The intended workflow is one agent per work, in parallel, each returning a
description, a table of contents **and** a defect report. Three things make
that safe:

- **Descriptions land in one shared file** (`site/descriptions.json`).
  Concurrent agents editing it will collide — have each agent return its entry
  and let the coordinator apply them.
- **ToC oracles do not collide**: one file per work under
  `$CORPUS/oracles/toc/`, so agents may write their own directly.
- **No agent changes a parser on its own initiative.** A parser fix affects
  every document in the family; it needs the blast-radius measurement above
  and a decision from whoever is directing the work.

Batches are stratified across page shell and pontificate rather than
alphabetical, so a defect surfaces while batches remain to benefit from the
fix. Both previous batches ended by correcting the brief, which is the reason
to keep them small.

Before spawning a batch, run the mechanical audits — they cost nothing and
retire questions an agent would answer slowly and less reliably:

```sh
python3 pipeline/scrapers/audit.py all
```
