# The Catechism's apparatus as a cross-edition oracle

Measured 2026-09-02, read-only against the built corpus, while `audit.py refs`
was being written for the Compendium. **Nothing here has been acted on.** It
exists because `audit.py`'s `REFS_TYPES` names the Compendium and not the
Catechism, and "why not the Catechism, which has eight editions?" is a fair
question with a long answer.

Short version: **the Catechism has no apparatus of addresses.** The field that
would be one is empty everywhere by the source's choice, and the apparatus it
does have is prose in eight languages under three different printing
conventions. There is one comparison worth making inside it, it is narrower
than the Compendium's, and it is worth about 71 paragraphs.

## 1. `related` is empty in all 22,920 paragraphs of all eight editions

`docs/corpus-schema.md` specifies `related` as the CCC's **marginal reference
apparatus** — the small paragraph numbers printed beside each paragraph
pointing to others on the same theme. That is exactly the shape `audit.py refs`
eats: language-independent, arithmetic, comparable across editions by
construction.

It is `[]` in every paragraph of `ccc.{de,en,es,fr,it,la,mg,pt}`. This is not a
gap in the parse — `ccc.py` records the absence in every manifest ("Marginal
cross-reference apparatus ('related' field) is absent from this …") and
`validate` only range-checks whatever is there. vatican.va's mirrors do not
print the margin.

**So the printed Catechism has the better apparatus and the published one does
not, and no amount of parser work recovers it.** The only route would be the
two PDF editions (`docs/research/pdf-editions.md`) — which are also the two
editions nobody here reads — or a print copy. Worth knowing before anyone
proposes deriving `related` from something; there is nothing to derive it from.

## 2. What it does have is `citations`, and three editions print none

| edition  | paragraphs with citations | citations | note                                   |
| -------- | ------------------------- | --------- | -------------------------------------- |
| `ccc.de` | 0                         | 0         | folds references into the running text |
| `ccc.es` | 0                         | 0         | parenthesizes them                     |
| `ccc.fr` | 0                         | 0         | parenthesizes them                     |
| `ccc.en` | 1,877                     | 3,698     |                                        |
| `ccc.it` | 1,856                     | 3,662     |                                        |
| `ccc.la` | 1,855                     | 3,671     |                                        |
| `ccc.mg` | 1,847                     | 3,611     |                                        |
| `ccc.pt` | 2,049                     | 4,893     |                                        |

The three zeroes are the edition, already documented in `CLAUDE.md`, and they
are what `linkifyProse`'s document-siglum scan exists for. They put the oracle's
ceiling at five editions before anything else is considered.

## 3. Counting citations across all five measures the CONVENTION, not the parse

Per paragraph, the modal citation count across the five is unanimous in 1,686
of 2,865, and departures are wildly uneven:

| edition  | ≠ modal count | fewer | more    |
| -------- | ------------- | ----- | ------- |
| `ccc.en` | 908           | 426   | 482     |
| `ccc.pt` | 785           | 15    | **770** |
| `ccc.mg` | 57            | 55    | 2       |
| `ccc.it` | 26            | 18    | 8       |
| `ccc.la` | 20            | 13    | 7       |

Almost none of the first two rows is a defect. `ccc.en` and `ccc.pt` capture
**inline parenthesised scripture as a citation** — the Portuguese marks them
`inline1`, `inline2` — where `ccc.it`, `ccc.la` and `ccc.mg` leave the same
reference in the sentence. §2 is the clean illustration: `Mt 28:19-20` and
`Mk 16:20` are two citations in English and Portuguese and zero in the other
three, and every edition prints the same two references.

**This is the trap the Compendium's apparatus does not have.** A margin number
is a reference or it is nothing; a citation is a reference the edition chose to
set in one of two places, and counting where it ended up says nothing about
whether we read it.

## 4. Restricted to one convention it is worth something: 71 paragraphs

`ccc.it`, `ccc.la` and `ccc.mg` share a source family and a footnote-block
apparatus. Comparing only those three, the count disagrees in **71 paragraphs**,
and the low edition is:

- `ccc.mg` in 60,
- `ccc.it` in 14,
- `ccc.la` in 6.

Read directionally, the way `audit.py divisions` is read, that concentration is
the finding. The Malagasy reader already has a history in exactly this shape:
it filed each page's whole footnote apparatus onto that page's last paragraph
until 2026-08-26, because its notes live in `<div id="ftnN">` rather than in a
`<p>` and the block walk never matched them (`audit.py balance` found it; §975
was stored at 13,680 characters against Portuguese's 197). 60 paragraphs where
it carries fewer footnotes than both siblings is the residue to read next.

§313 is the worked example, and it points at the Italian rather than the
Malagasy:

| edition  | citations at §313                                                 |
| -------- | ----------------------------------------------------------------- |
| `ccc.en` | Rom 8:28 · Catherine of Siena · Thomas More · Julian of Norwich   |
| `ccc.pt` | Rm 8,28 · Catarina de Sena · Margarita Roper · Juliana de Norwich |
| `ccc.la` | Catharina Senensis · Margarita Roper · Iuliana de Norwich         |
| `ccc.mg` | Dial. 138 · Margarita Roper · Rev. 13,32                          |
| `ccc.it` | **Giuliana di Norwich only**                                      |

Four editions carry three patristic and spiritual authorities; the Italian
carries the last of them. Whether that is the mirror or the reader needs the raw
page, which is where this stops and a fix would start.

## 5. What it would cost, and the sharper instrument

Comparing counts is the cheap version and is what the numbers above are. The
instrument that would actually earn its keep compares the **numeric loci** —
`GS 19 # 1`, `Dial. 138`, `Rev. 13,32` — since a work title is in the edition's
own language but a section number is not. That is a small parser over citation
strings, and `refs-grammar.ts`'s eleven sigla tables already hold most of the
vocabulary it would need. It would also survive the convention problem: a
reference folded into a sentence in Spanish and footnoted in Latin is the same
locus either way, so all eight editions could be compared rather than three.

Whoever picks this up should read **§8b of `pdf-editions.md`** first for the
shape of the same argument in another family, and should know one caveat the
Compendium work turned up:

> **The editions are not independent witnesses, and a vote quietly assumes they
> are.** German and Slovenian carry the identical departure from the modal
> apparatus at six of the Compendium's 598 questions; Italian and French carry
> the identical impossible range `1198-1999` at another. Two editions agreeing
> on a wrong value is evidence of a shared exemplar, not of two observations —
> so "one edition against thirteen" is a real standard and "two against twelve"
> is not the same claim with a smaller number. In the Compendium that rule kept
> three questions out of `pipeline/corrections/` that a count alone would have
> corrected.

## 6. What was not measured

- Whether the six `related`-bearing PDF-only editions print the margin
  apparatus at all. `pdf-editions.md` §1 records that `ccc-ar` and `ccc-zh` are
  in `raw/`; neither was examined for a margin column.
- The `notes` field, which is `0` on every CCC paragraph in every edition and
  was not chased.
- Any comparison against the Compendium's `ccc_refs`, which point INTO the
  Catechism and therefore check nothing about it: the address space is 1–2865
  by construction, so every reference resolves whether or not it is right. That
  vacuity is the same one `docs/decisions.md` records for the unit-set oracle.
