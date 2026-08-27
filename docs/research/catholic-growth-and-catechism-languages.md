# Where the Church is growing, and what it reads

Research conducted 2026-08-27 (Claude, read-only survey; live fetches against
`vaticannews.va`, `osservatoreromano.va`, `fides.org`, `vatican.va`,
`usccb.org`, `china-zentrum.de`, `cbcj.catholic.jp`, plus local measurement of
`glossa-corpus`). Written to answer a question the corpus had never been asked:
the editions we hold were chosen by what vatican.va publishes, so it is worth
knowing, separately, where the readers actually are. Companion to
`../decisions.md` §Languages and `../../CLAUDE.md` §"Work that spans
languages".

**Scope note**: nothing here is scraped, parsed or ingested. This document
establishes demand and availability; `../../PLAN.md` #13 is where the one
finding with scoped work attached lives.

## TL;DR

The growth is Africa, and it is not close: +2.7% in 2024 against Asia's 0.6%
and Europe's 0.8%, the only continent growing faster than its own population
and the only one where seminarians rose. **But the corpus is already in the
right languages by accident.** The growth belt's doctrinal languages are
French (DR Congo, Burkina Faso, Côte d'Ivoire, Cameroon, Rwanda, Burundi,
Madagascar), English (Nigeria, Uganda, Kenya, Tanzania, Ghana, Zambia,
Malawi, South Sudan) and Portuguese (Angola, Mozambique, Timor-Leste) — all
three held, all three with the CCC. `ccc.mg` turns out to sit on a growth
country rather than being the curiosity it looks like.

The real gap is **Swahili**, which has a published CCC (Paulines Africa,
Nairobi, 2000) that vatican.va does not carry — so it is outside the scraper
model entirely, not merely unscheduled.

**Chinese and Japanese are not growth stories, and Japan is the more
interesting of the two**: the majority of Catholics in Japan are no longer
Japanese, so its pastoral languages of growth are Tagalog, Vietnamese and
Portuguese. China's own numbers have not been published since 2018.

And the sharpest finding is inward: **`ar` and `ru` are interface languages
whose only corpus edition is sitting unparsed in `raw/` as a PDF.** Before
adding a fourteenth-plus interface language, close those two.

## 1. The measurement

From the _Annuario Pontificio 2026_ / _Annuarium Statisticum Ecclesiae 2024_,
published 2026-03-28 (Vatican News, and L'Osservatore Romano's fuller Italian
text). Figures are 2023 → 2024.

| Continent | Catholics       | Growth                                       | Share of world Catholics |
| --------- | --------------- | -------------------------------------------- | ------------------------ |
| Africa    | 281M → **288M** | **+2.7%** — above its own demographic growth | 19.9% → **20.3%**        |
| Oceania   | ~11M            | +2.1%                                        | 0.9%                     |
| Americas  | ~679M           | +0.9% — below population growth              | 47.7%                    |
| Europe    | ~286M           | +0.8%                                        | 20.4% → **20.1%**        |
| Asia      | ~156M           | +0.6% — below population growth              | 11.0%                    |

World total 1.406bn → 1.422bn (+1.14%), stable at 17.8% of humanity.

Three secondary series say the same thing more sharply. Seminarians fell
−2.72% worldwide and rose only in Africa (+2.25%), which now holds **34.5%**
of the world's candidates for priesthood against 11.7% in Europe. Africa
takes 31.7% of all baptisms. Infant baptisms per 1,000 Catholics run 9.5 in
Africa and 10.8 in Asia against 4.7 in Europe.

**Country detail is published only intermittently.** The 2025 release (2023
data) named DR Congo first in Africa at nearly 55M baptized, Nigeria second at
35M, "with Uganda, Tanzania and Kenya also registering significant figures";
Brazil 182M, Philippines 93M, India 23M. The 2026 release named no countries
at all. For scale, catholic-hierarchy's mid-2000s snapshot has DRC at 29.5M
and Nigeria at 17.9M — both roughly doubled in twenty years. Uganda's own
2024 census counts ~17.0M Catholics, 37% of the population.

Asia's aggregate is flat but conceals real local growth: Vietnam (~7M, with
200+ churches and parish buildings raised in 2025), Timor-Leste (~98%
Catholic), and conversion-driven upticks in Singapore (978 catechumens at
Easter 2026, its largest intake in ten years, including a separate Mandarin
Rite of Election) and South Korea (7.9% → 11.3% of population since 1997).
Oceania's +2.1% is mostly Papua New Guinea.

## 2. What the growth belt reads

Sorted by whether the corpus already answers it.

**Held, with the CCC.** French — DR Congo, Burkina Faso, Côte d'Ivoire,
Cameroon, Benin, Togo, Senegal, Rwanda, Burundi, Chad, CAR, Congo-Brazzaville,
Mali, Madagascar (co-official). English — Nigeria, Uganda, Kenya, Tanzania
(co-official), Ghana, Zambia, Malawi, Zimbabwe, South Sudan. Portuguese —
Angola, Mozambique, Cape Verde, Guinea-Bissau, São Tomé, Timor-Leste
(co-official). Spanish — Equatorial Guinea. Malagasy — Madagascar.

That coverage is not a plan that worked; it is a coincidence worth naming.
The languages of colonial administration became the languages of seminary
formation and of the episcopal conferences, so the doctrinal register of the
African Church runs in exactly the three languages vatican.va publishes most
and the corpus therefore holds most.

**Not held, and no vatican.va source exists.** Swahili is the one large
African vernacular that functions as a doctrinal language across borders —
Tanzania, Kenya, eastern DRC, Uganda. _Katekisimu ya Kanisa Katoliki_,
Paulines Publications Africa, Nairobi, 2000, 734pp (HathiTrust 006019159,
ISBN 9966214720). It is a real, complete, approved translation, and it is not
on vatican.va in any form. See §5.

**Used in catechesis, but not doctrinal registers.** Lingala, Tshiluba,
Kikongo, Igbo, Yoruba, Hausa, Luganda, Kinyarwanda, Chichewa, Bemba, Shona,
Amharic, Tigrinya. No full CCC translation was found for any of them; what
exists is diocesan and national catechisms, question-and-answer adaptations,
and YOUCAT-style derivatives. Absence of evidence rather than proof of
absence — but the search was directed and repeated, and it turned up
adaptations every time rather than the CCC.

**Asia and Oceania.** Vietnamese (official CDF-approved translation by the
Vietnamese bishops' doctrine committee, from the Latin, published by
HĐGMVN), Korean (CBCK), Indonesian (Compendium on vatican.va; a full national
CCC was not confirmed either way), Filipino/Tagalog, Tetum, Malayalam, Tamil,
Hindi, Burmese, Tok Pisin.

The Philippines is a deliberate substitution rather than a gap: the CBCP
publishes the _Catechism for Filipino Catholics_, an inculturated national
catechism approved by the Holy See, in place of a Tagalog CCC. Any future
"the Catechism in Filipino" work would be a different book, not a translation
of one we hold.

## 3. Catechism editions, in three tiers

**On vatican.va — CCC, ten languages.** Arabic, Traditional Chinese, English,
French, German, Italian, Latin, Malagasy, Portuguese, Spanish. Eight are
HTML and are the corpus's eight editions; **Arabic and Traditional Chinese
are PDF-only** and are captured, unparsed, in `raw/ccc-ar/` (4 part-files)
and `raw/ccc-zh/` (44 part-files).

**On vatican.va — Compendium, fourteen languages.** The above minus Arabic,
Chinese, Latin and Malagasy, plus Belarusian, Hungarian, Indonesian,
Lithuanian, Romanian, Russian, Slovenian, Swedish. Ten are HTML and are the
corpus's ten editions; **Belarusian, Indonesian, Lithuanian and Russian are
PDF-only** and are captured, unparsed, in `raw/compendium-{be,id,lt,ru}/`.

Note the asymmetry this produces: the Compendium exists in four languages the
CCC does not, and the CCC in four the Compendium does not. Neither list is a
subset of the other, so "the Catechism in language X" has two different
answers depending on which book is meant.

**Published nationally, not on vatican.va.** The CCC is in print in 20+
languages. Confirmed relevant here: Swahili, Vietnamese, Korean. Also Polish,
Czech, Slovak, Croatian, Maltese, Norwegian, Catalan, Russian, Ukrainian.

The USCCB's "Available Translations and Contacts" page is the only
consolidated list anywhere, and it is **badly out of date** — it still lists
Korean, Vietnamese and Swahili as _pending_ translations that have since
shipped, and carries a publication year of "2996". Treat it as evidence that
a translation exists, never as evidence that one does not.

## 4. Chinese and Japanese

Both were asked about directly. Neither is a growth story, and the reasons
differ enough to be worth recording.

**China: not measurable, and not growing.** Katharina Wenzel-Teuber's annual
statistical update (_Religions & Christianity in Today's China_ XVI/2026 no.
2, pp. 21–45 — the standard reference) gives **ca. 10 million** Catholics
including both the official and underground Church (Tripod 2025 estimate),
against **6 million** per State data (2018 White Paper), and **under 0.5%**
of the adult population per CGSS 2010–2018. Roughly 4,000 priests and 5,000
sisters, 7 major seminaries.

The decisive line for our purposes: **the last published national baptism
figure is 48,365, for 2018.** Nothing since — only sporadic parish reports,
which the 2025 update tabulates as individual examples because that is all
there is. There is no series to read a trend from, and the trend such
fragments suggest is flat at best.

Chinese therefore earns its place for a different reason than growth: the
diaspora and the Chinese-speaking jurisdictions outside the mainland
(Singapore, which ran a Mandarin Rite of Election for 111 catechumens in
2026; Malaysia; Taiwan ~300k; Hong Kong). And **vatican.va already publishes
the CCC in Traditional Chinese**, so unlike Swahili this one is a parsing
question, not a sourcing one.

**Japan: declining, and the growth inside it is in other languages.** ~419,414
Catholics, 0.34% of a population of 125 million (Fides, 2024); 459 diocesan
and 761 religious priests, and 35 major seminarians — that last figure is the
one to read. The CBCJ publishes annual statistics that track members,
baptisms, catechumens and clergy as explicit time series
(`cbcj.catholic.jp`), which is more transparency than China offers and shows
a flat-to-falling Japanese membership.

**But the majority of Catholics in Japan are no longer Japanese.** Filipino,
Vietnamese, Brazilian and Peruvian migrants have overtaken Japanese believers,
a shift documented since at least 2017 and now routine in the Japanese
Church's own synodal reporting. So the languages in which the Church in Japan
is actually growing are **Tagalog, Vietnamese and Portuguese** — one of which
the corpus already holds, in the edition a Brazilian reader would want.

Japanese itself has no vatican.va edition of either book, and no confirmed
national CCC translation (the USCCB list has it as "pending", which per §3
means nothing either way). Of every language surveyed here it is the weakest
candidate: smallest readership, flat demand, no source.

## 5. What follows for the corpus

Ordered by how much growth sits behind each, with the blocker named.

| Language                        | Where                            | Book                | vatican.va | Blocker                                       |
| ------------------------------- | -------------------------------- | ------------------- | ---------- | --------------------------------------------- |
| **Swahili**                     | TZ, KE, DRC, UG                  | CCC (Paulines 2000) | **No**     | No source. Outside the scraper model entirely |
| **Arabic**                      | Chad, Sudan, South Sudan, Levant | CCC                 | PDF only   | No PDF path in `pipeline/`                    |
| **Chinese (Hant)**              | Diaspora, SG, MY, TW, HK         | CCC                 | PDF only   | Same                                          |
| **Indonesian**                  | Indonesia (~8M)                  | Compendium          | PDF only   | Same                                          |
| **Vietnamese**                  | Vietnam (~7M, growing)           | CCC (HĐGMVN)        | No         | No source                                     |
| **Korean**                      | South Korea (11.3%)              | CCC (CBCK)          | No         | No source                                     |
| Russian, Lithuanian, Belarusian | —                                | Compendium          | PDF only   | Same as above                                 |

Two observations the table makes but does not state.

**Five of the six vatican.va editions we do not hold are already in `raw/`.**
They cost fetches once and have sat unread since 2026-08-25. Their blocker is
one shared capability — text extraction from born-digital PDF — not six
separate scrapes. Measured 2026-08-27 with `pdftotext`, all six extract real
text rather than needing OCR:

- **Indonesian, Lithuanian, Belarusian** extract clean UTF-8.
- **Russian** extracts as **CP1251 read as Latin-1** (`×àñòü 1` for `Часть
1`) — recoverable by re-encoding, but it will look like a corrupt file to
  anyone who does not know to expect it.
- **Traditional Chinese** extracts best of the six: paragraph numbers
  (`493.`, `494.`), headings, and inline Scripture references in Chinese book
  forms (`弗 1:3`, `羅 1:5`) that `refs-grammar.ts` would need a `zh` table for.
- **Arabic** extracts with paragraph numbers intact but carries embedded bidi
  control characters and presentation-form ligatures; it is the one that will
  need real normalization work.

The Compendium PDFs also carry the CCC cross-reference numbers in a margin
column (`345-349`, `75–79, 83, 96, 98`), which is the `ccc_refs` field the ten
HTML editions already populate — so the target schema is unchanged.

**Swahili is the only entry whose blocker is not ours to remove.** Every other
row is work; that one is a sourcing decision about whether the corpus ever
takes a text from a commercial publisher outside vatican.va, which
`../decisions.md` §Scope has so far answered no. It is recorded here because
it is the single highest-growth language gap, and because the answer being
"no" should be a decision rather than an oversight.

## 6. The inward finding

`UI_LANGS` holds fourteen tags; `ContentLang` holds fifteen. Two of the
interface languages have **no corpus content at all in them**:

- **`ar`** — Arabic chrome ships, and the only Arabic edition vatican.va
  publishes is the CCC PDF in `raw/ccc-ar/`.
- **`ru`** — Russian chrome ships, and the only Russian edition is the
  Compendium PDF in `raw/compendium-ru/`.

Both are exactly the failure mode `../../CLAUDE.md` warns about in the other
direction — chrome with nothing behind it, a reader given a translated
interface wrapped around English content everywhere through
`CONTENT_LANG_FALLBACK`. And in both cases the missing content is already
paid for and sitting in `raw/`.

Meanwhile **`mg` is the one content language that is not an interface
language**, and it holds a whole work: all 2,865 paragraphs of the CCC. It is
the highest-value interface addition by the standard `decisions.md` §Languages
already sets — coverage, not count — and its blocker is competence rather than
code.

So the honest answer to "should we add interface languages" is: not yet, and
the three that matter are already implied by what the corpus holds. Adding
Swahili, Vietnamese, Korean or Indonesian chrome today would create two more
`ar`s.
