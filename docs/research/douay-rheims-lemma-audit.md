# The Douay-Rheims lemma oracle: 72 candidates, adjudicated

Measured 2026-08-25 over `bible.douay-rheims.en` as it stands in the corpus.
**Six defects found and not yet corrected**; the remaining 66 are the source
behaving as an apparatus behaves, and must not be "fixed".

## What the oracle is

Challoner's notes open with the words they gloss, set in italics, which the
scraper lifts into a `lemma` field (`docs/corpus-schema.md`). A lemma is a
quotation of its own verse — so it should appear in that verse, and one that
does not is evidence that one of the two was mistranscribed.

The check exists because of a specific miss. `Nineve` for `Ninive` at Jonas
1:2 was filed as a spelling variant on a first pass and it was not one: it was
a typo in the apparatus, and the only thing that could have caught it
automatically was comparing the lemma against the verse it claims to quote.
The oracle is that comparison, added afterwards.

It folds case and punctuation away before comparing (`fold_for_match` in
`douay_rheims.py`), because an unfolded comparison reported 103 of 1,910
lemmas as absent, nearly all of them punctuation. It also skips any lemma
ending in `etc.` — the apparatus's own elision marker, where the quotation is
deliberately partial and its absence says nothing.

That leaves **72 of 1,908** lemmas quoting words their verse does not contain.

## The six that are defects

Each is a mistranscription in the **lemma**, not in the verse; the verse reads
correctly in every case. Same class as `Nineve`, and each is a one-line entry
in `pipeline/corrections/bible.douay-rheims.en.json` with `field: "lemma"`.

| locator      | lemma as transcribed                | verse reads                           |
| ------------ | ----------------------------------- | ------------------------------------- |
| `2kgs 18:4`  | And he called its name Nohest**o**n | `… he called its name Nohestan.`      |
| `1macc 1:11` | Antiochus the Illustri**us**        | `… Antiochus the Illustrious …`       |
| `isa 63:16`  | Abraham hath not **know** us        | `… Abraham hath not known us …`       |
| `ezek 23:5`  | On the Assyr**ai**ans               | `… on the Assyrians that came to her` |
| `dan 2:2`    | The Chald**ee**ans                  | `… and the Chaldeans: to declare …`   |
| `rev 9:1`    | A star f**u**ll                     | `… I saw a star fall from heaven …`   |

`rev 9:1` is the one worth a second look before filing: "a star full" is not a
plausible printed lemma for a verse about a star _falling_, but it is the kind
of error that could equally be ours. `raw/vulgata-online/DR2/Ap.9.json` settles
it without a re-crawl.

## The five kinds that are not defects

The other 66 divide into kinds that each have a reason. **Calling any of them a
defect invites someone to "fix" a faithful text** — the same warning
`bible-edition-divergence.md` gives about verse shape.

1. **The lemma carries the Latin it renders.** `gen 14:10` — "Of slime.
   Bituminis"; `acts 17:6` — "City. Urbem"; `phil 2:7` — "Emptied himself,
   exinanivit"; `ps 4:1` — "In verses, in carminibus". Challoner is naming the
   Vulgate word behind the English, inside the lemma.
2. **The lemma joins two discontinuous quotations**, usually on a dash.
   `matt 23:9` — "Call none your father--Neither be ye called masters";
   `john 6:54` — "Except you eat--and drink"; `amos 1:3` — "For three
   crimes--and for four". Each half is in the verse; the join is not.
3. **The lemma offers an alternative reading.** `ps 4:1` — "For David, or to
   David"; `eph 6:12` — "High places, or heavenly places"; `heb 13:4` — "Or,
   Let marriage be honourable in all". The note's subject is precisely that the
   text could be read another way.
4. **The lemma is a paraphrase, not a quotation.** `gen 39:16` — "A proof of
   her fidelity"; `rom 3:4` — "God only is essentially true"; `heb 2:10` —
   "Perfect by his passion". Here the italic opening is a topic sentence.
5. **The lemma re-points or lightly re-words the quotation** — capitalisation,
   an inflection, a dropped article. `gen 4:14`, `exod 8:15`, `num 31:17`.

## The full list

Kept whole so this can be re-adjudicated rather than re-derived. Regenerate
with `uv run pipeline/scrapers/bible/douay_rheims.py --offline`, which prints
the count and the first ten.

| locator       | lemma                                                                            |
| ------------- | -------------------------------------------------------------------------------- |
| `gen 4:14`    | Every one that findeth me shall kill me                                          |
| `gen 14:10`   | Of slime. Bituminis                                                              |
| `gen 39:16`   | A proof of her fidelity                                                          |
| `gen 44:31`   | His gray hairs                                                                   |
| `exod 8:15`   | Pharao hardened his own heart                                                    |
| `lev 2:11`    | Without leaven or honey                                                          |
| `num 18:1`    | Thou, and thy father's house with thee, shall bear the iniquity of the sanctuary |
| `num 31:17`   | Of children                                                                      |
| `deut 11:29`  | Put the blessing, et                                                             |
| `deut 29:19`  | The drunken, etc., absumat ebria sitientem                                       |
| `josh 11:6`   | Hamstring their horses, and burn their chariots with fire                        |
| `josh 14:4`   | Hebron belonged                                                                  |
| `judg 19:10`  | Jemini                                                                           |
| `1kgs 12:29`  | Bethel and Dan                                                                   |
| `2kgs 18:4`   | And he called its name Noheston                                                  |
| `2chr 30:3`   | The host of heaven                                                               |
| `ezra 8:21`   | And I proclaimed a fast                                                          |
| `tob 6:8`     | Its heart, etc. The liver (ver. 19)                                              |
| `1macc 1:11`  | Antiochus the Illustrius                                                         |
| `2macc 6:2`   | That in Gazarim                                                                  |
| `2macc 11:21` | In the year 148                                                                  |
| `2macc 14:3`  | Now Alcimus, who had been chief priest                                           |
| `ps 4:1`      | In verses, in carminibus                                                         |
| `ps 4:1`      | For David, or to David                                                           |
| `ps 80:16`    | Their time shall be forever                                                      |
| `ps 111:1`    | Of the returning                                                                 |
| `ps 136:1`    | For Jeremias                                                                     |
| `song 4:12`   | My sister, etc., a garden enclosed                                               |
| `isa 63:16`   | Abraham hath not know us                                                         |
| `isa 63:17`   | Made us to err, etc. Hardened our heart                                          |
| `isa 66:4`    | I will choose their mockeries                                                    |
| `jer 49:28`   | Cedar and Asor                                                                   |
| `ezek 14:9`   | I have deceived that prophet                                                     |
| `ezek 23:4`   | Oolla and Ooliba                                                                 |
| `ezek 23:5`   | On the Assyraians                                                                |
| `dan 2:2`     | The Chaldeeans                                                                   |
| `hos 2:1`     | Say to your brethren                                                             |
| `hos 2:24`    | That which was not my people                                                     |
| `hos 4:15`    | Galgal and Bethaven                                                              |
| `hos 10:14`   | As Salmana, king of the Midianites, was destroyed by the house,                  |
| `amos 1:3`    | For three crimes--and for four                                                   |
| `amos 5:5`    | Bethel,--Galgal,--Bersabee                                                       |
| `zech 6:6`    | The land of the south                                                            |
| `mal 2:16`    | Iniquity shall cover his garment                                                 |
| `matt 1:25`   | Till she brought forth her firstborn son                                         |
| `matt 23:9`   | Call none your father--Neither be ye called masters                              |
| `luke 2:7`    | Her firstborn                                                                    |
| `john 6:54`   | Except you eat--and drink                                                        |
| `acts 17:6`   | City. Urbem                                                                      |
| `rom 3:4`     | God only is essentially true                                                     |
| `rom 3:10`    | There is not any man just, that is                                               |
| `rom 6:6`     | Old man--body of sin                                                             |
| `rom 7:13`    | That it may appear sin, or that sin may appear, that is                          |
| `1cor 2:14`   | The sensual man--the spiritual man                                               |
| `1cor 10:13`  | Let - human                                                                      |
| `1cor 11:27`  | Guilty of the body, etc., not discerning the body                                |
| `eph 4:11`    | Gave some apostles--Until we all meet                                            |
| `eph 6:12`    | High places, or heavenly places                                                  |
| `phil 2:7`    | Emptied himself, exinanivit                                                      |
| `phil 4:8`    | To think on these things                                                         |
| `heb 2:10`    | Perfect by his passion                                                           |
| `heb 2:16`    | No where doth he                                                                 |
| `heb 13:4`    | Or, Let marriage be honourable in all                                            |
| `jas 5:16`    | Confess your sins one to another                                                 |
| `2pet 2:1`    | Seeds of perdition                                                               |
| `2pet 2:11`   | Bring not a railing judgment                                                     |
| `1john 5:20`  | And may be in his true Son. He is, or this is the true God, and life eternal     |
| `jude 1:17`   | Sensual men                                                                      |
| `jude 1:21`   | Building yourselves upon your most holy faith                                    |
| `jude 1:23`   | And some indeed reprove being judged                                             |
| `jude 1:25`   | Now to him                                                                       |
| `rev 9:1`     | A star full                                                                      |
