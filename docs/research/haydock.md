# Haydock's commentary: a work type the corpus does not have

Measured 2026-08-25 against `vulgata.online`, the host the Douay-Rheims was
taken from. This is the research pass that should have accompanied the
Douay-Rheims ingestion and did not — the findings below existed only in a
conversation until then, which is the reason the document exists at all.

**Ingested 2026-09-01 as `commentary.haydock.en`.** The four open decisions at
the foot of this note are answered there; `docs/decisions.md` §Addresses and
editions holds the reasoning, `docs/corpus-schema.md` §Commentary the shape,
and `CLAUDE.md` the things that will bite. What is kept here is the
measurement, plus — under "What the crawl changed" — the three claims below
that the full crawl contradicted, because a research note that is quietly
corrected teaches nothing about how far to trust the next one.

The George Leo Haydock Bible (1811, revised 1859) is the Douay-Rheims
Challoner text with a vastly larger apparatus attached. On this host it is
edition `HAY`, beside `DR2` (the Douay-Rheims, ingested) and `MS` (Matos
Soares).

## The finding that decides the shape: it has no text

A chapter of `HAY` answers with **`fn` records and nothing else** — no `vs`,
no `cd`, no `bd`:

```
GET /api/text/readings2/?ed=HAY&bk=Jo&cn=1   ->  { "fn": 23 }
GET /api/text/readings2/?ed=DR2&bk=Jo&cn=1   ->  { "vs": 51, "fn": 4, "cd": 1, ... }
```

This is not a defect and not a gap to fill. Haydock did not produce a
translation; he produced an apparatus **on** the Challoner Douay-Rheims, which
is the text already in the corpus as `bible.douay-rheims.en`. The host models
that correctly by shipping the notes alone.

**So Haydock is not an edition of the Bible, and must not be ingested as
one.** Every existing consumer of `type: 'bible'` assumes verses:
`listEditions('bible')` offers it in the edition menu, `compare.ts` aligns it
against another edition by verse number, `PREFERRED_EDITION` (`corpus.ts`)
would have to name it, and the versification oracle would compare its
non-existent verse sets against the Clementine. A work with 24,000 notes and
zero verses would satisfy none of it.

It is a **commentary**: a new work type, `commentary.haydock.en`, whose units
address the Bible rather than containing it. That is a schema decision, not a
scraping one, and it is the reason this is a research note rather than a
ticket.

## What the apparatus actually is

The single most important property, and the one that makes this worth doing:
**Haydock is a catena, not one man's commentary.** Nearly every note ends with
the authority it is drawn from. Across a 10-chapter sample (319 notes), the
attributions that close a note:

| attribution                    | notes | who                                         |
| ------------------------------ | ----- | ------------------------------------------- |
| Calmet                         | 59    | Augustin Calmet, OSB (d. 1757)              |
| Worthington                    | 51    | Thomas Worthington (d. 1627)                |
| Haydock                        | 39    | the compiler's own                          |
| Bert.                          | 28    | Berthier                                    |
| Witham                         | 24    | Robert Witham (d. 1738)                     |
| Menochius                      | 11    | Giovanni Stefano Menochio, SJ (d. 1655)     |
| Aug., Amb., Jer., Hil., Theod. | 12+   | the Fathers, cited directly                 |
| Bristow                        | 4     | Richard Bristow (d. 1581), of the Rheims NT |
| Challoner                      | —     | the Douay-Rheims reviser himself            |

About 72% of notes in the sample close with a recognizable attribution; the
rest are unsigned (conventionally Haydock's own).

**This is the _Glossa Ordinaria_ arrangement the project is named for**
(`docs/decisions.md` §Posture): not a single modern commentary, but the
tradition's own voices set around the sacred text, each named. Challoner's
1,917 notes made the site's name honest; Haydock would make it the thing it
claims to be.

Format matches the Douay-Rheims exactly, which is what makes the parser cheap:
a leading italic lemma, the same `_..._` emphasis, the same `{rn:...}` anchor
convention.

```
_The same was in the beginning with God._ In the text is only, "this was in
the beginning;" but the sense and construction certainly is, _this word_ was
in the beginning. Witham
```

One extra convention not seen in `DR2`: an inline `_(#1)_` back-reference
inside a note, which needs adjudication before parsing rather than after.

## Sizing

Estimated, not measured — a full crawl has not been run. From the same
10-chapter sample (434 verses, 319 notes, 187 KB of JSON), weighted **per
verse** rather than per chapter, because the chapter mean is wrecked by Psalm
118 alone (176 verses, 144 notes):

- **0.68 notes per verse** → roughly **24,000 notes** across the
  Douay-Rheims's 35,804 verses
- **430 bytes per verse** → roughly **15 MB** of raw JSON

Both figures are order-of-magnitude only. The sample is 1.2% of the Bible and
deliberately spread (law, history, wisdom, prophecy, gospel, epistle,
apocalypse), but note density varies by more than an order of magnitude
between books — Apocalypse 20 has 1 note for 15 verses, Psalm 118 has 144 for 176.

At ~13x the Douay-Rheims's own note count, this is the largest single body of
text the corpus would hold. Payload granularity (`docs/research/payload-granularity.md`)
is therefore a real design question here and was not one for Challoner: 15 MB
cannot ship as one asset, and per-chapter chunking is the obvious unit but has
not been costed.

## Crawl cost and conduct

1,334 chapters at the 1.0 s floor `douay_rheims.py` sets for this host — about
**22 minutes**, the same shape of crawl the Douay-Rheims already cost. The
host's `robots.txt` is `Disallow:` with no `Crawl-delay`, so that floor is
ours rather than theirs.

## Copyright

Public domain on age: Haydock died 1849 and the revised edition is 1859. The
same position as `bible.douay-rheims.en`, and unlike Matos Soares (PD 1 Jan
2028 — `docs/research/copyright.md`). No new exposure.

## How each of the four was decided

In the order this note posed them:

1. **The schema.** Purely an index onto another work's addresses — a
   commentary contributes no route, no sitemap entry and no title table, and
   its manifest names the work it `annotates`. `bible-intro` was the near
   precedent and stops one step short, since an introduction is chapter 0 and
   that is an address.
2. **How the reader reaches it.** An apparatus selector: a panel of switches
   in the reading bar choosing what is set beside the text, the edition's own
   notes included. This note's guess that "more sidenotes" was probably wrong
   was half right — the notes DO go in the margin, but they carry no marker in
   the running text and are labelled by their author rather than lettered,
   because a lemma quoting Challoner cannot be anchored in an edition that is
   not Challoner.
3. **Payload granularity** was answered three days after this note was
   written, by somebody else's problem — see below.
4. **Attribution is parsed**, against a closed vocabulary derived from the
   crawl and then read, with the residue reported by `--attributions` and an
   unmatched tail left in the text. The concern was right that it "will be
   wrong somewhere"; what makes that affordable is that being wrong here costs
   a missing field rather than an altered sentence.

## What the crawl changed

Three claims above were measured on ten chapters and did not survive 1,334.

- **"The largest body of text the corpus would hold" was already false when
  it was written, and became more so.** `bible.allioli.de` (37,790 notes) and
  `bible.martini.it` (18,722) landed on 2026-08-28, three days after this
  note. Haydock is large, not exceptional.
- **"Payload granularity becomes a real design question" — it did not.** The
  same two editions forced `sync-corpus.mjs` to pack Bible chapters by SIZE
  rather than by a fixed stride, explicitly so "an edition ingested later with
  a heavier apparatus is handled without anyone re-measuring." Haydock is that
  edition, and it needed no new scheme: its heaviest chapter is Psalm 118 at
  59 KB against a 150 KB pack target.
- **"~24,000 notes" counted RECORDS, and a record is a verse.** Each holds
  that verse's whole commentary as several attributed paragraphs, so the note
  count at the stored granularity is roughly double. Apocalypse 20 was
  described here as "1 note for 15 verses"; it is one record of 14,082
  characters holding three paragraphs and sixteen sub-notes.

**And one convention this note flagged in a single line turned out to be a
sub-apparatus.** The "inline `_(#1)_` back-reference, which needs adjudication
before parsing rather than after" is an anchor into `__Notes:__` blocks
appended after the body — Haydock footnoting his own paragraphs with the Greek
and Latin behind a rendering. Every anchor is printed `#1` and every block
defines `#1`; they pair by POSITION, sixteen of each in Apocalypse 20:2.
Reading the digit as a marker would have collapsed fifteen notes into one,
silently. The line was right that it needed adjudicating first.

## Related

The user has also named **Matos Soares' notes** as wanted. That one is
genuinely different and much smaller: `ed=MS` carries `vs` records too, so it
is an enrichment of an existing edition rather than a new work type. See
`PLAN.md` #6.
