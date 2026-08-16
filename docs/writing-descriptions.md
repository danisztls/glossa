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
Source-defect corrections policy). A description invented from a title is the
same failure wearing editorial clothes. **A missing description costs a reader
nothing. A wrong one silently misinforms them about what the Church taught.**

The worked example that established this: `encyclical.magnifica-humanitas`
(Leo XIV, 2026-05-15) sits at the edge of the model's knowledge. Guessing from
the title — *magnifica humanitas*, "the grandeur of humanity" — yields
something about human dignity, which sounds right and is wrong: the document
is about **artificial intelligence**. Reading §1 settles it in one sentence.
Reading five more sections gives a description that is checkable line by line.

## Procedure

### 1. Read the document

```sh
cd corpus/works/encyclical.<slug>.en

jq 'length' sections.json                         # how long is it
jq -r '.[] | "\(.kind)|\(.title)|\(.paragraphs|tostring)"' structure.json
```

Then read actual text — the opening, the first section of each chapter, and
the closing:

```sh
for n in 1 17 46 90 131 182; do
  echo "=== §$n ==="
  jq -r --argjson n $n '.[] | select(.n==$n) | .text' sections.json | head -c 700
done
```

Chapter-opening sections are disproportionately informative: this genre
announces what each chapter will do ("In this first chapter, I intend to…").
The final sections carry the appeal the document is actually making.

### 2. Read the structure tree critically

You are the first person to look closely at this document since it was
scraped. **Treat every oddity in `structure.json` as a suspected parse
defect**, and report it. The tells:

- nodes with `[null, null]` ranges
- a heading whose range doesn't fit its position (a "CHAPTER FIVE" holding
  §1–16)
- duplicate titles at the same level
- a range that overlaps or skips its siblings'

This is why describing documents is worth doing by hand at all: it is the only
pass over the corpus where a human-shaped reading meets each document
individually. The description is half the value; the defects found are the
other half.

### 3. Write it

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

### 4. Record it

Add entries to `site/descriptions.json`, keyed by full work id:

```json
"descriptions": {
  "encyclical.magnifica-humanitas.en": "Leo XIV's encyclical on artificial intelligence…",
  "encyclical.magnifica-humanitas.pt": "Carta encíclica de Leão XIV sobre a inteligência artificial…"
}
```

**Not** into `corpus/works/*/manifest.json`. Those are generated; a re-parse
rewrites them, and this project fixes parsers by re-parsing. `sync-corpus.mjs`
merges `descriptions.json` into each manifest on the way into the site, so
`manifest.description` is populated for every route that reads it and the
corpus stays purely generated. Same posture and same place as
`unpublished.json` — though note that file is a hard error when missing and
this one is not, because their failure modes differ in severity.

Then:

```sh
cd site
CORPUS_DIR=/home/dani/Dev/me/scriptura/corpus node scripts/sync-corpus.mjs
jq -r '.["encyclical.<slug>.en"].description' src/lib/corpus-data/index/manifests.json
```

### 5. Report defects; fix parsers only deliberately

A defect found in step 2 is reported with the description. Fixing it means
changing a parser shared by every document in its family, which is a separate
decision — see the next section for what that costs.

## Fixing a parse defect

When a defect does get fixed, the fix is in the parser and the document is
**re-parsed, never re-crawled** (`CLAUDE.md`, `docs/link-surface.md`). That
insurance only holds because `corpus/raw/` is intact, which is why it is
treated as write-once.

```sh
# Re-parse one document from cached raw HTML. Zero network fetches.
uv run pipeline/scrapers/vatican_docs.py phase2 \
    --pontiffs <pontiff-slug> --slugs <doc-slug> --overwrite
```

Confirm the run reports `network fetches this run: 0`.

**A parser change is never local.** `vatican_docs.py` parses ~450 documents
across several page templates, so measure the blast radius rather than
assuming it:

```sh
# 1. snapshot every generated artifact
cd corpus/works
find . -name 'structure.json' -o -name 'sections.json' | sort | xargs md5sum > /tmp/before.md5

# 2. re-parse broadly (phase1 = the 16 Vatican II texts; phase2 --overwrite = everything)
uv run pipeline/scrapers/vatican_docs.py phase1

# 3. diff — anything changed that you did not intend to change is the finding
cd corpus/works
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

The intended workflow is one agent per document, in parallel, each returning a
description **and** a defect report. Two things make that safe:

- Descriptions land in one shared file (`site/descriptions.json`). Concurrent
  agents editing it will collide — either serialize the writes, or have each
  agent return its entry and let the coordinator apply them.
- No agent should change a parser on its own initiative. A parser fix affects
  every document in the family; it needs the blast-radius measurement above
  and a decision from whoever is directing the work.
