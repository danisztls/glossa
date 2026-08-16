# Structure-tree defects in the Magisterium corpus

Findings from 2026-08-16, recorded for a later fix. **Nothing here is fixed
except the table-of-contents defect in §1**, which was found first and fixed
at the time. Everything after it is diagnosed and left alone deliberately.

Section text is not in question anywhere in this note. `sections.json` is
sound; it is `structure.json` — the tree of Parts, Chapters, Articles and bold
subheadings that gives a document its divisions — that is unreliable for most
of the corpus.

## Why this blocks work, not just tidiness

Three things that were wanted immediately all depend on the structure tree,
and none of them can be built on it as it stands:

- **A per-division reading view.** Reading a 245-section encyclical in one
  page is too much; the natural unit is the document's own divisions. There is
  no usable division boundary for most documents (§3).
- **The sidebar table of contents.** It renders the structure tree. A document
  with one root node gets a table of contents with one row.
- **Naming the unit in the UI** ("Read full chapter" vs "Read full document").
  The vocabulary problem is real (§4) but downstream of this: you cannot pick
  a good name for a division that the parser did not find.

## 1. The page's own table of contents parsed as structure — FIXED

The modern vatican.va shell prints a linked table of contents ahead of the
body, and each entry is a fully-bold `<p>` — indistinguishable to
`is_full_bold` from the heading it points at. Each became a structure node,
and since a heading stays open until the next one pops it, the last TOC entry
was still open when section 1 arrived and adopted the document's opening.

`encyclical.magnifica-humanitas` showed it as five phantom top-level nodes
with null ranges plus a `CHAPTER FIVE` spanning sections 1–16 — a chapter five
beginning at section one, holding what is actually the Introduction. The real
chapters below parsed correctly, which is what made it look plausible.

Fixed in `drop_table_of_contents` (`pipeline/scrapers/vatican_docs.py`): a
pre-body heading is dropped when a later heading duplicates it, requiring at
least two such duplicates before anything is removed. Re-parsing the 16
Vatican II documents left every artifact byte-identical, so the guard holds.

## 2. Headings not detected at all — NOT FIXED

The larger problem. Measured across 339 document works:

| root-level structure | documents |
| --- | --- |
| only `sub` nodes | 300 |
| `chapter` + `sub` | 29 |
| `part` + `sub` | 4 |
| `chapter` only | 4 |
| `chapter` + `section` + `sub` | 1 |
| nothing at all | 1 |

And, counting root nodes that carry a real section range, across 333 works
that have both a structure and sections:

- **211 documents have exactly one top-level division** — i.e. a structure
  tree that says nothing about how the document is divided.
- median top-level divisions per document: **1**
- median sections per document: **27**; largest: 287

### The proof that these are defects, not unstructured documents

The cross-language oracle (`CLAUDE.md`: when a document exists in two
languages their structures must agree) settles it:

```
encyclical.fratelli-tutti.en   1 root node:  [sub] [1,287] "Fratelli Tutti"
encyclical.fratelli-tutti.pt   8 root nodes: [chapter] Capítulo I..VIII, ranges correct

encyclical.mater.en            1 division
encyclical.mater.pt           69 divisions
```

Fratelli Tutti has eight chapters. The Portuguese parse found all eight with
correct ranges; the English parse found none and fell back to the trivial
single-node tree (`docs/corpus-schema.md`'s "a document with no internal
headings gets a trivial single-node tree spanning its full section range").
The document is not unstructured — our parse of it is.

Both editions agree on section count (287 = 287), so **`check-symmetry` passes
these documents**: it compares section-number sets only. The structure trees
are never compared, which is why a defect this large went unnoticed.

### Recommended first step

Extend `check-symmetry` (or add a sibling pass) to compare **structure trees**
across languages, not just section sets: root-node count, per-node ranges, and
tree depth. That turns a 339-document manual audit into a ranked worklist, and
it is the same oracle already trusted elsewhere in the project. Documents where
one language finds divisions and the other finds one are the highest-value
cases, because the working side shows what the broken side should produce.

Only after that is it worth asking why detection fails on the English pages —
likely a heading-markup variant `is_full_bold` misses, and likely fixable once
there are paired examples to compare.

## 3. Consequence for choosing a reading unit

Two candidate units were evaluated and both fail on today's trees:

- **Split on `<h2>`** — only **5 of 339** documents have one. `headingTag()`
  maps `part`/`section`→h2, `chapter`→h3, `sub`→h5, and 300 documents have
  only `sub` at root, so 334 of 339 would get zero split points: one giant
  page, which is the problem being solved.
- **Split on the structure tree's top level, whatever kind it is** — fails for
  the 211 documents with a single top-level division.

Both become workable once §2 is fixed. Neither is worth implementing before.

## 4. The vocabulary collision (independent of the defects)

Worth recording because it will come up again when the unit is finally named:

- **"section"** already means the numbered unit — §17, the `{n}` in
  `/documents/{slug}/{n}`, `sections.json` — *and* is a `StructureNode.kind`
  (`SECTION ONE`).
- **"chapter"** collides with Bible chapters and with `/ccc/chapter/[n]`.

The suggestion that avoids inventing a word that fits all 339 documents: label
a division with **its own printed title**, verbatim — "Read Chapter III",
"Read the Introduction", "Read Part Two" — and keep "Read full document" as
the other option. The document says what its divisions are called; the UI does
not have to generalize.

## 5. Smaller things noticed in passing

- `encyclical.magnifica-humanitas`: the body's `CONCLUSION` heading is a `sub`,
  so it nests under `CHAPTER FIVE` rather than sitting beside it. A `sub` never
  pops a `chapter` in `push_heading`'s level logic. This follows from the
  documented "any other fully-bold block becomes a generic `sub` node" design
  rather than being a separate bug, but it means a document's concluding
  material is filed inside its last chapter.
- The Introduction's own subheadings land as top-level siblings of the
  Introduction rather than beneath it, for the same reason: all unlabelled
  headings are `sub`, and `sub` does not nest under `sub`.
- `--overwrite` was documented in `vatican_docs.py`'s module docstring but was
  never wired into argparse, so no parser fix in this project had ever been
  verified by re-parsing. It and `--slugs` now exist; see
  `docs/writing-descriptions.md` for the blast-radius procedure that uses them.
