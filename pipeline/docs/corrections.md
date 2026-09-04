# Corrections and overrides

Three layers, and keeping them apart is what lets `raw/` stay the record of
what the source said rather than of how we read it.

| Layer                   | Claim                             | Applies        |
| ----------------------- | --------------------------------- | -------------- |
| `pipeline/corrections/` | **the source is wrong**           | before parsing |
| `pipeline/overrides/`   | **our derivation is wrong**       | after parsing  |
| the parser              | the defect belongs to a **class** | —              |

**Never invented text, in either direction.** A defect with no known correct
value is documented and reported, not fixed. Every correction carries a
locator, exact before/after, a reason and evidence, and fails loudly when its
`from` stops matching. Only mechanical defects qualify — OCR artifacts, digit
typos, marker mismatches — never wording, never modernization.

**Before filing an override, ask whether the defect belongs to one document or
to a class. It has been a class nearly every time.** The layer holds five
entries against a corpus of hundreds of works, all the same defect, filed only
because the sole discriminator is cross-language and the parser reads one
document at a time.

**Loud failure is the point.** An override exists because the parser is wrong,
so the parser improving is the _expected_ way for one to stop matching —
indistinguishable from an override aimed at the wrong unit unless the run says
which entry and why.

**The edition's own inconsistency is the witness that licenses a citation
correction.** The corpus writes the pre-1909 gazette under the later siglum 194
times (`AAS 18 (1885)` for volume 18 of the _Acta Sanctae Sedis_).
`find-gazette-siglum.py` proposes an entry only where one edition writes `ASS`
at some pre-1909 citations and `AAS` at others, so its own correct uses are the
witness — the Latin _Lumen gentium_ prints both sigla in one footnote, seven
words apart. **The refusal is the larger half**: 56 editions write `AAS`
uniformly, which is that edition's usage and not a slip, and correcting it
would impose the Latin's convention on them. Reported under `--practice`, filed
nowhere. A volume and year that disagree is a second defect, reported, never
bundled into the first; and a `from` that cannot be made unique is refused,
since `apply_raw_text_corrections` matches by string and replaces once.

**A proposer must read the page the way the parser does.** The tool applies
already-filed corrections to the raw HTML before scanning it, because `raw/` is
never modified — without that it finds the defect still in the page and gone
from the parse, disagrees with itself, and refuses every entry as unlocatable.
That is also what makes it idempotent over the whole corpus.

**Broken markup is the parser's business, however few instances there are.**
The class-vs-instance test sorts _prose_ defects and does not reach this one. A
correction is about text a reader reads, and earns a locator so a change can be
audited; a corrupted tag changes nothing a reader reads, only whether the
parser can find the text, and repairing it restores the source rather than
amending it. `bible.martini.it` has three, normalised in `martini.py` with the
locators in its module docstring.

**Presentation is not a corrections matter.** The mirrors' loose citation
spacing is a typesetting habit of the source, tidied at render, whitespace-only,
verified to add and remove no mark. The corpus keeps what was printed.

## Two rules the prayers taught

**A correction's `field` names which text it repairs.** It had been decorative
— every prayer correction on file said `latin_text` and the code read
`prayer.latin.blocks` unconditionally, so the key described what the code
happened to do. That held only for as long as every defect found here was in
the Latin, which was a fact about which column had been read closely rather
than about the corpus. `variant_text` needs a `locator.variant`, because
corrections run before the UK/USA split resolves and the two wordings share
whole lines — "whichever column matched" is not a safe answer.

**A correction receipt names only what is in the file beside it.** One parse is
written into three editions, so `corrections-applied.json` was the same list in
all of them: `prayer.common.en-gb` shipped a receipt for a defect in a prayer
it does not contain. A receipt exists to be checked against its own file, and
naming a change that is not there is the one thing it cannot do.
