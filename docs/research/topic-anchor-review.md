# Topic anchor review: whether the passages answer the question asked

A per-topic quality ledger for `site/quaestiones.json`, opened 2026-09-10 and
filled a cluster at a time. Companion to `docs/research/topics.md`, which
decided _which_ topics exist and holds the shipping blocklist; this file records
whether the ones that shipped actually work.

**The test is one sentence.** A reader arrives holding the topic's own
`question`, in their own words, and reads the anchored passages in the anchored
order. Do they leave with it answered, without a sentence of ours explaining
what the passages mean? Anything else — the topic being interesting, the
paragraphs being about the right subject, the anchor being tidy — is not the
test.

**The question is the specification, and the title is not.** Every defect this
pass has found has the same shape: a topic whose _title_ is anchored perfectly
and whose _question_ is not anchored at all. `pornographia` is CCC 2354 and
always was, and "and about not being able to stop?" was in no paragraph on the
page; `amor-dei` is CCC 218–221 and "I believe it about everyone else" was in
none of them. Read the question clause by clause, and the keywords too — a
keyword is a promise the search bar keeps.

## The scale

Four grades, and each one implies a different action.

| Grade             | What it means                                                                                                | Action                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| **A — answers**   | The passages answer the question as asked, in their own words.                                               | none                             |
| **B — obliquely** | The answer is there, but the reader has to carry it across from a passage written about an adjacent thing.   | watch; replace if a text arrives |
| **C — partial**   | Something the title, question or keywords promise has no anchored text behind it, and the corpus has a text. | fix here; the note names the fix |
| **D — held**      | The missing half needs a document the corpus does not have.                                                  | see the blocklist in `topics.md` |

A grade is about the anchors, not about the writing. A question written worse
than the passages deserve is a `docs/writing-voice.md` matter and gets a note,
not a grade.

**B is a real grade and not a soft A.** The Catechism is not organised by the
questions people ask it, so a topic will sometimes have exactly one paragraph
that bears on the reader's situation and it will be filed under something else.
That is worth shipping and worth recording, because the day a better text is
ingested the note says where to put it.

## Reviewed

### `private-shame / the-body` — 2026-09-10

| Topic                    | Grade | Note                                                                                                                                                                                                                                              |
| ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `masturbatio`            | A     | CCC 2352's closing sentence answers "is it always a mortal sin" in the Catechism's own words, and 1735 generalises it.                                                                                                                            |
| `homosexualitas-vivenda` | A     | 2358–2359 is a what-do-I-do text rather than a teaching, which is the whole reason it is a separate topic from `homosexualitas`, which keeps 2357.                                                                                                |
| `pornographia`           | A     | Was C: three paragraphs of definition and nothing on "not being able to stop", while the keywords opened on _addiction_. Fixed 2026-09-10 with 2342 (self-mastery is never acquired once and for all) and 1735.                                   |
| `post-contraceptionem`   | A     | Was C twice over: no anchored text said the word _sterilisation_, and "what now?" was answered only by 2370, which is `contraceptio`'s own teaching restated. Fixed 2026-09-10 with 2399 and 1451–1453.                                           |
| `adulterium`             | B     | "Do I have to tell?" is answered only by 2487, which is written about offences against truth and reputation and reaches a spouse by analogy — correctly, since it says reparation is owed and may be made secretly. Checked: no better paragraph. |

### `private-shame / despair` — 2026-09-10

| Topic               | Grade | Note                                                                                                                                                                                                                                                                  |
| ------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `oratio-inaudita`   | A     | CCC 2734–2741 is the Catechism's own two headings on this exact question, taken whole and unreordered — the ideal case, where the topic is barely editorial. 2737 lands hard on a reader whose petition was for a dying child; excising it would be choosing by hand. |
| `mortis-desiderium` | A     | `lead` 2283 puts _we should not despair of the eternal salvation of persons who have taken their own lives_ first, which is the question verbatim, and 2282 closes on diminished responsibility. See the keyword note below.                                          |
| `amor-dei`          | A     | Was C: 218–221 is God's love for **Israel**, and the reader's whole objection is that it applies to everyone but them. Fixed 2026-09-10 with CCC 604–605 anchored ahead of it, which also retired the `lead`.                                                         |
| `dubium-fidei`      | A     | Was C: nothing anchored said faith is ever dark. Fixed 2026-09-10 by widening 162 to the Catechism's own 162–165 and adding 2731 on dryness.                                                                                                                          |

## What the pass keeps finding

**A keyword must not promise what the blocklist refuses.**
`pornographia` led its keywords with _addiction_, which `topics.md` holds back as
a topic precisely because CCC 2288–2291 is about temperance and not compulsion.
The search bar was offering the word the blocklist says this corpus cannot
answer. The fix was to anchor the nearest true thing — diminished imputability,
and self-mastery as long work — not to drop the word.

**An in-brief paragraph earns its place when it is the only one that names the
act.** CCC 2399 is one of two paragraphs in the whole Catechism that say
"sterilization"; the other is 2297, which sits between torture and kidnapping and
is the wrong room to send this reader into. Anchoring a summary paragraph is
otherwise a smell — `finis-mundi` was the only topic that did it before this —
because in-brief text restates what the article already said at length.

**Widen before you reach.** `dubium-fidei` held CCC 162 alone, and the
paragraphs that answer it were 163–165 — the Catechism's own next heading,
sitting directly underneath the anchor the topic already had. Read what is
beside the anchor before searching the rest of the book.

**A `lead` is a compensation, and a better span retires it.** `amor-dei` led on
219 because its span opened on Israel's history and the reader needed the
strongest sentence first. Anchoring 604–605 — _there is not, never has been, and
never will be a single human being for whom Christ did not suffer_ — put a direct
answer at the top of the page on its own, so the field came out. The page now
carries no reordering disclosure because there is no reordering, which is the
better state: `lead` is the most editorial thing this site does.

**A keyword may over-reach where the alternative is silence, and that is a
decision, not a defect.** `mortis-desiderium` carries _self-harm_ and _alone_,
both of which `topics.md` holds back as topics because the corpus has nothing
addressed to them. Kept deliberately: the nearest true page is this one, its
2282 does speak to diminished responsibility, and a search that returns nothing
serves that reader worse than one that returns this. Distinguish it from
`pornographia`'s _addiction_, where a true paragraph existed and simply was not
anchored.

**Two topics sharing a paragraph is fine; sharing an anchor set is not.**
`pornographia` now reaches into `castitas`'s 2337–2350 for one paragraph and into
`masturbatio`'s ground for another, and stays a distinct page because the set and
its order differ. The rule the file states is about the whole set.

## How to run a batch

Read the paragraphs, in the topic's declared order, with the lead first:

```sh
jq -r --arg s pornographia \
  --slurpfile ccc "$CORPUS_DIR"/build/ccc.en/paragraphs.json \
  '($ccc[0]|INDEX(.n|tostring)) as $by
   | .topics[$s].ccc[] | range(.[0];.[1]+1) | tostring
   | $by[.] | "— CCC \(.n)\(if .in_brief then " [in brief]" else "" end)\n\(.text)\n"' \
  site/quaestiones.json
```

`build/csdc.en/sections.json` and `build/cic.en/sections.json` hold the other two
works, keyed the same way but carrying `blocks[].html` rather than `.text`. Read
the topic's three strings out of `src/lib/i18n/en.ts` at the same time; the
question is what is being tested and it is not in this file.

A batch is one cluster. Sixteen clusters, and the ones not listed above have not
been read.
