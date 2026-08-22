# Post-parse overrides

Fixes applied to **parsed output**, after parsing and before the corpus is
written. This directory is expected to stay nearly empty.

## Not the same thing as `pipeline/corrections/`

|             | `pipeline/corrections/`                  | `pipeline/overrides/`                         |
| ----------- | ---------------------------------------- | --------------------------------------------- |
| Claim       | **the source is wrong**                  | **the source is fine, our derivation is not** |
| Applies to  | the fetched HTML, _before_ parsing       | `structure.json` / `sections.json`, _after_   |
| Evidence is | an argument about what should be printed | a quotation of what _is_ printed              |
| Fixes       | a defect in the document                 | a defect in the parser we chose not to fix    |

The separation is load-bearing, not tidiness. `corpus/raw/` exists to answer
"what does vatican.va actually say?", and the project's insurance policy is
that any capture regret is fixed by **re-parsing, never re-crawling**
(`docs/link-surface.md`). A correction rewrites the source's own words; an
override must never be able to. Filing a parser defect as a correction would
put a change to _our_ reading into the record of what the Church published.

## An override is the exception, not the rule

Before filing one, ask: **does this defect belong to one document, or to a
class of them?** The cheap test has been decisive every time so far:

- `III` rendering as `Iii` looked like a Magnifica Humanitas quirk. It was
  325 occurrences across the corpus.
- A heading losing its italics looked like one heading. No heading anywhere
  had ever rendered its markup.
- A tag boundary inserting a space the source does not render
  (`R esponsibility`) looked like one title. 65 headings do it, across several
  works.

Each of those was a parser fix that repaired hundreds to thousands of units at
once. An override would have repaired one and left the rest broken while
_claiming_ the defect was handled. Reach for this directory only when the
defect genuinely does not generalise — a quirk of one document's own markup
that no rule could state without naming that document.

## Format

One JSON file per work id, e.g. `encyclical.magnifica-humanitas.en.json`, an
array of entries:

```jsonc
[
  {
    "id": "<work-id>-<short-slug>",
    "target": "structure", // or "section"
    "locator": { "index": 12, "before": 90, "title": "..." },
    "field": "title",
    "op": "set", // or "remove" (structure only); "set" is the default
    "from": "<the exact value there now>",
    "to": "<the value it should be>",
    "reason": "why the parser cannot reasonably get this right",
    "evidence": "corpus/raw/vatican-docs/<file>.html: '<quoted markup>'",
    "added": "YYYY-MM-DD",
  },
]
```

`locator` for a `section` target is `{"section": n}`, optionally with
`{"block": i}`.

**Give more than one locator key when you can.** `index` is exact but moves
when any heading above it is added or removed; `before` survives that but is
not unique when several headings open the same section. Supplying both makes
the entry fail if they ever disagree, which is the behaviour you want.

## Everything fails loudly

`from` must equal what is actually there, and a locator must match exactly one
unit. Anything else raises `OverrideDriftError`, which surfaces as
`status="overrides-drift"` on that work, with the entry id and reason printed
in the run summary. The crawl continues — one bad entry must not kill a run of
many — but the work is not written.

This matters more here than for corrections. An override exists _because_ the
parser gets something wrong, so **the parser improving is the expected way for
one to stop matching**. That is the good case: the override is now redundant
and should be deleted. But it is indistinguishable from the bad case (the
entry was aimed at the wrong unit) unless the run says so. An override that
silently no-ops is worse than none at all: the defect it documents is back,
and the file still claims it is handled.

## Receipts

A work with overrides gets `corpus/works/<id>/overrides-applied.json`. It is
written only when there are any, so

```sh
ls corpus/works/*/overrides-applied.json
```

is the census of where the parser gave up. Keep that list short.
