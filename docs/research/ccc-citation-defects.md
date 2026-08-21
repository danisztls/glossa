# CCC scripture citations that point outside the corpus

Nine of the ~3,800 scripture references the citation parser derives from
`ccc.en`'s footnotes name a verse that does not exist in the chapter they name.
Every one is damage in the **CCC's own printed citation string** on the
vatican.va mirror — not a parser bug, and not a versification difference.

`xrefs.py` reports them on every run (`check_against_corpus`). They are
deliberately **not corrected**: `docs/decisions.md`'s source-defect policy is
that a defect goes through `pipeline/corrections/` only with a locator, an
exact before/after, a reason and evidence, and that _a defect with no known
correct value gets documented, not fixed_. Several below have an obvious-looking
repair; "obvious-looking" is not the standard for silently rewriting a scripture
reference, so none has been applied.

The site degrades correctly around all nine: the citation still renders, the
verse label just isn't a link (`bible/[book]/[chapter]/+page.svelte`).

## How this list got shorter

It was **sixteen**. Seven were not defects at all but a second, narrower kind of
versification divergence — individual chapters whose tails run one or two verses
ahead of the Vulgate's because the Vulgate merges two verses modern editions
print separately. Those are now handled by `versification.ts`'s `LATE_MERGE`
(2 Cor 13, Zech 2, Exod 40, Matt 17, Acts 7), verified against both shipped
editions.

That distinction mattered more than the count: an out-of-range verse fails
loudly, but the same offset means the verses _just before_ it resolve to real,
existing, **wrong** text. `Mt 17:24-27` was landing on Vulgate 17:24-26 — one
verse off for its whole length, silently. The nine below have no such shadow;
they are simply unresolvable.

## The nine

| CCC  | Emitted           | Source string                                   | Chapter ends | Note                                                                                  |
| ---- | ----------------- | ----------------------------------------------- | ------------ | ------------------------------------------------------------------------------------- |
| 201  | `deut 6:45`       | `Dt 6:45.`                                      | 25           | Paragraph is the Shema; `6:4-5` with a lost hyphen is the obvious reading, unverified |
| 304  | `isa 45:51`       | `Cf. Is 10:5-15; 45:51; Dt 32:39; Sir 11:14.`   | 26           | No confident reading                                                                  |
| 525  | `luke 2:61`       | `Cf. Lk 2:61.`                                  | 52           | Paragraph is the Nativity; the same footnote block separately cites `Lk 2:8-20`       |
| 590  | `matt 12:0`       | `Cf.Mt 12:6, 0, 36, 37, 41-42.`                 | 50           | A literal `0` in the source — a digit was lost, which one is unknowable               |
| 1050 | `1cor 5:28`       | `1 Cor 5:28.`                                   | 13           | Paragraph quotes "God may be all in all" = `1 Cor 15:28`; a dropped leading `1`       |
| 1214 | `rom 6:34`        | `2 Cor 5:17; Gal 6:15; Cf. Rom 6:34; Col 2:12.` | 23           | Paragraph is on baptism; `Rom 6:3-4` with a lost hyphen                               |
| 1618 | `matt 2:56`       | `Cf. Rev 14:4; 1 Cor 7:32; Mt 2:56.`            | 23           | No confident reading                                                                  |
| 2122 | `2cor 9:16,17,18` | `... 2 Cor 9:5-18; 1 Tim 5:17-18.`              | 15           | 2 Cor 9 has 15 verses in every edition; the range end is simply wrong                 |
| 2709 | `song 3:14`       | `Song 1:7; cf. 3:14.`                           | 11           | Paragraph is on contemplative prayer; `Song 3:1-4` fits and has a lost hyphen         |

Five of the nine share one shape — **a lost hyphen turning a verse range into a
verse number** (`6:4-5` → `6:45`, `6:3-4` → `6:34`, `3:1-4` → `3:14`, and
plausibly `45:5-1` and `2:6-1`). That is a plausible mirror-side typesetting
artifact rather than nine unrelated errors, and it is the strongest argument for
eventually correcting them as a group with evidence from each paragraph's own
prose. Whoever does that should quote the paragraph text in each correction
entry, not reason from the pattern alone.

## Not in this list

Citations whose _book_ is garbled rather than the verse (`Th 2:13` for 1 Thess,
`Macc 10:29-30` for 2 Macc, `Rom I 1:20-26` for Rom 11) are recorded in
`xrefs.py`'s own module docstring. They never reach this check because they fail
to parse into a reference at all.
