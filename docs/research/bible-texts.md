# Bible text selection

Research conducted 2026-08-13/14; extended to the interface languages 2026-08-28 (§One Bible per interface language). Criteria: complete Catholic canon (73 books); modern language welcome **provided it does not deviate from the original meaning and does not demythologize** (no rationalist softening of miracles/angels/virgin birth, no "full of grace" → "highly favored", no inclusive-language rewrites).

## Decision

Initial lineup (expand later):

- **English: CPDV** (Catholic Public Domain Version, 2009) — modern English, public domain. **Reversed 2026-09-01: the default English edition is the Douay-Rheims** (see §The English default, below). The CPDV remains in the corpus as the second English edition.
- **Portuguese: Matos Soares (1956 edition)** — modern Portuguese, under copyright until 31 Dec 2027 (accepted exposure, see `copyright.md` §4–5).

Candidates for later expansion: Douay-Rheims Challoner (traditional EN), Clementine Vulgate (parallel Latin), Figueiredo 1950 edition (traditional PT — text only, **never the notes**, which were placed on the Index in 1795). The first two have since been ingested; §One Bible per interface language takes the question to the other eleven interface languages.

Rejected: **WEB Catholic Edition** — its Luke 1:28 reads "Rejoice, you highly favored one!", failing the doctrinal-fidelity criterion at the litmus verse (see appendix).

## The English default (reversed 2026-09-01)

`PREFERRED_EDITION['bible:en']` names `bible.douay-rheims.en`. The criteria at the top of
this file are unchanged and the CPDV still passes them — what changed is that the
criteria were about the **text** alone, and by 2026-09-01 the choice was no longer only
about text.

**The deciding argument is the apparatus.** The CPDV has **no notes** — no verse in any of
its 73 book files carries a `notes` key — and `commentary.haydock.en` declares
`annotates: bible.douay-rheims.en`, so `commentariesAt` returned nothing for it and the
apparatus control did not render at all. The reader who expressed no preference got a bare
text with nothing saying an apparatus existed. The Douay-Rheims offers Challoner's 1,916
notes, his 1,307 chapter arguments, and Haydock's 45,747-note catena.

**The supporting arguments, in the order they carry weight:**

- **It is the only default in the corpus that is not a received edition.** Every other
  language's Bible here is an approved translation with a history — Clementina 1592,
  Martini, Allioli, Káldi-Tárkányi, Crampon, Straubinger, Matos Soares. The assessment
  below stands: the CPDV's risks are provenance, and the provenance is a self-published,
  deliberately unreviewed translation by one man.
- **The corpus already leaned Douay in English.** `bible-intro.en` is Challoner's own
  prefaces and has been shipped to CPDV readers since the introductions landed
  (`introductions.py`'s docstring argues the graft); Doré's plate anchors were decided
  against the Douay-Rheims; `WORK_CONFIGS` carries its Douay book-naming.
- **Esther.** The Douay-Rheims prints the sixteen-chapter Vulgate arrangement the corpus
  canonicalizes on. The CPDV's fifteen mean a Douay-style "Esther 16" — the form the
  magisterial corpus prints — does not resolve in the default edition.

**What it costs, and why it was accepted.** The register: "The Lord ruleth me: and I shall
want nothing" against "The Lord directs me, and nothing will be lacking to me." Every
`CONTENT_LANG_FALLBACK` row ends in `en, la` and only eight of the thirty-four interface
languages have a Bible of their own, so the English default is what most readers of this
site meet, mostly as non-native English readers — which is exactly where archaism is
hardest. It is bounded: the CPDV stays in the edition menu one click away, and the choice
persists per interface language.

**Left open**: whether the CPDV should be one of the two English editions at all. The
assessment below is the argument about that, and it is a different question from which
edition a reader meets first.

## CPDV assessment

**Verdict: passes the no-demythologizing test — it errs hard in the traditional direction. Its risks are provenance, not content.**

Method: verse-by-verse translation of the **Clementine Vulgate** (1914 Hetzenauer base), with Challoner Douay-Rheims as English guide text. Latin only — no Hebrew/Greek base; explicitly rejects the Nova Vulgata. Self-described "fairly literal" (more literal than RSV-CE/NAB). Deliberately no inclusive language. One translator (Ronald L. Conte Jr.), 2004–2009. All 73 books complete, traditional Catholic order, no footnotes. Sources: [version info](https://www.sacredbible.org/catholic/version.htm), [introduction](http://catholicplanet.com/TSM/introduction-CPDV.htm).

Test verses (verified against sacredbible.org / Bible Hub):

| Verse       | CPDV                                             | Verdict                                                                                                   |
| ----------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| Luke 1:28   | "Hail, **full of grace**. The Lord is with you." | Passes                                                                                                    |
| Isaiah 7:14 | "Behold, **a virgin** will conceive"             | Passes                                                                                                    |
| Gen 3:15    | "**She** will crush your head"                   | Passes — keeps the Marian _ipsa_                                                                          |
| Matt 16:18  | "gates of Hell shall not prevail"                | Passes                                                                                                    |
| John 1:1    | "and God was the Word"                           | **Eccentric** — copies Latin word order; reads as a convertible proposition in English                    |
| Matt 1:25   | "he knew her not, **yet** she bore her son"      | **Doctrinally motivated deviation** — Latin _donec_ = "until"; substituted to protect perpetual virginity |

Caveats, eyes open:

- **No imprimatur, no review — deliberately.** Conte refuses to submit it for approval ([his statement](https://ronconte.com/2010/08/09/unapproved-translation/)) and refuses proofreaders on principle. The translation's own introduction contains a section arguing no woman may be a Bible translator.
- **The translator is personally fringe**: published failed dated prophecies (nuclear attack on NYC in 2010, tribulation 2009, etc. — [catalogue](https://americanloons.blogspot.com/2013/06/583-ronald-conte-jr.html)); community reputation on r/Catholicism is "translation by a crackpot." **No evidence the eschatology leaked into the text** (Revelation reads conventionally; no annotations exist for it to hide in), but nobody has systematically audited it.
- **No scholarly review of its Latin fidelity exists** — it is ignored rather than refuted. Since CPDV, Challoner, and the Clementine Vulgate are all PD and machine-readable, a systematic three-way diff is feasible in-project and would answer "how many more Matt 1:25s are there." Potential site feature.
- Still corrected via a running errata — **date-stamp any ingested text** (latest known: Feb 2025 errata).
- **Edition quirk found at scrape time (2026-08-14)**: the CPDV prints **Esther in 15 chapters**, renumbering the Greek additions, vs the Vulgate/Challoner 16-chapter arrangement (verified against the cached source: chapter headings 1–15, no `{16:n}` markers). Corpus follows the source. Affects reference resolution: Douay-style "Esther 16" refs won't resolve in CPDV.

## Matos Soares assessment

**Verdict: not archaic.** Ordinary formal 20th-century Portuguese; what registers as "off" to a Brazilian is _Lusitanian_, not old — pre-1990-Agreement orthography (`baptizar`, `Unigénito`, `rectas`), Portugal-side idiom (`há-de vir`, `da banda de além do Jordão`), heavy enclisis. Feels like a 1950s missal. Sample (John 1:1): "No principio existia o Verbo, e o Verbo estava junto de Deus, e o Verbo era Deus."

- **Every clean digital text online is the 1956 edition** (revised from the original languages with L. G. da Fonseca SJ of the Biblicum), not the 1932 Vulgate-only translation. Diagnostics: John 1:42 "filho de João" (not _Jona_); Luke 1:28 omits "bendita és tu entre as mulheres". The 1932 text exists only as PDF scans (archive.org) — OCR from scratch if ever wanted.
- The 1956 Psalter follows the Pius XII "Pian Psalter" line ("O Senhor me apascenta"), more modern than the rest.
- **Copyright until 31 Dec 2027** (died 1957; Brazil Law 9.610/98 art. 41, life+70 from 1 Jan following death; same in Portugal). Sold commercially in new editions (Ecclesiae, Realeza, Missões Cristo Rei); freely hosted meanwhile by liriocatolico, padrepauloricardo, bibliacatolica with no visible enforcement.

## Figueiredo assessment (deferred)

**Genuinely archaic, but less than feared, and the difficulty is syntactic, not lexical**: mesoclisis ("vo-lo-á de anunciar"), `Benta` for `bendita`, `logo` for `então`, verb-initial inversion, prepositional accusative ("Temos achado **ao** Messias"). Calibration: Padre Vieira's sermons — heavier than modern, materially lighter than Camões. Circulating text is the 1950 "Ano Santo" modernized-orthography edition (`êle`, `tôdas`), not the 1778 original spelling.

Cautions:

- **His annotations were placed on the Index (26 Jan 1795)** as regalist/Jansenist-influenced; the translation itself was accepted. Serve the text, never the notes.
- Figueiredo knew "nem ainda medianamente" Hebrew or Greek — it is a Vulgate translation.
- Bible Societies published Protestant-edited Figueiredo revisions (1821, 1828 without deuterocanonicals) — **verify the book count of anything ingested**.

## Scrape sources, ranked

### CPDV

1. **sacredbible.org** per-book HTML (`/catholic/NT-04_John.htm`) — verses marked `{1:1}` inline, trivially parseable. **Force cp1252 decoding** (mojibake on curly quotes otherwise). PD including the HTML.
2. [FBIAgent05/Bible-CPDV](https://github.com/FBIAgent05/Bible-CPDV) — JSON, corrected to Feb 2025 errata.
3. [Zefania XML module](https://sourceforge.net/projects/zefania-sharp/files/Bibles/ENG/Catholic+Public+Domain+Version+2009/) — converts cleanly to OSIS/USFM.
4. Not on eBible.org; no SWORD module found.

### Matos Soares (1956)

1. **liriocatolico.com.br** — server-rendered HTML, all 73 books, cleanest text. `/biblia_online/biblia_matos_soares/{livro}/{cap}/`, verse-level and `/{livro}/completo/` variants. No sitemap; enumerate from the book list. Known OCR artifact: `Ihe` (capital I for l) — grep the corpus for `Ihe|Iá|Ies`.
2. **padrepauloricardo.org/biblia** — `/biblia/{sigla}?cap={n}&edition=matos-soares`, whole-book pages, byte-identical to #1. Good cross-check.
3. [Dancrf/biblia-db](https://github.com/Dancrf/biblia-db) — ready JSON, explicitly 1956. **Unverified** — diff against #1 before trusting.
4. **vulgata.online** (`/bible/Gn.1?ed=MS`) — uniquely includes Matos Soares' **footnotes** and section headings; in development, Cloudflare-protected.
5. bibliacatolica.com.br (`/biblia-matos-soares-1956/{livro}/{cap}/`) — JS-rendered, noticeably worse OCR; cross-check only.

### Figueiredo

1. **bibliatraduzida.com** — `/figueiredo/{livro}/{cap}/`, clean transcription of the 1950 edition, real sitemap.xml, per-verse anchors, footnotes clearly delimited, Vulgate psalm numbering. One-person in-progress transcription — spot-check against the 1950 PDFs (archive.org, evangelizandocommaria.com.br).
2. [archive.org/details/biblia-figueiredo](https://archive.org/details/biblia-figueiredo) — 758-page scan with full OCR derivatives; verification corpus, not a primary source.

## One Bible per interface language (2026-08-28)

The site has fourteen interface languages and Bibles in four content languages
— `en` twice, `pt`, `la`. This pass asks what each of the other eleven could
have. Same criteria as above, plus the constraint `copyright.md` §5 states for
this material specifically: **a Bible must be public domain.** Matos Soares is
a knowingly accepted, self-resolving exposure and explicitly not a precedent to
repeat; nothing below relies on repeating it.

Every reading in the tables was fetched from the source proposed for it, not
from a secondary description of the translation.

**All eight sources were then captured in full on 2026-08-28** — 4,714 pages,
568 MB, nine source directories under `raw/` — and the capture corrected four of
the judgements this section had already reached. Where the survey and the
capture disagree, the capture is the later and better evidence and wins; the
superseded reading is left in place with its correction beside it, because the
_shape_ of each mistake is the reusable part. See §What the capture found.

### Decision

Eight languages have an answer. Three do not.

Ordered by what the capture found, not by language. The canon column below is
a **measurement taken from the captured bytes**, not a claim read off a book
list — which is the distinction the whole exercise turned on, since two sources
have all 73 book files and do not have all 73 books.

| UI lang | Edition                               | Basis         | PD since           | Source                   | Canon, as captured                                |
| ------- | ------------------------------------- | ------------- | ------------------ | ------------------------ | ------------------------------------------------- |
| `de`    | **Allioli–Arndt** (1830–34, rev 1914) | Vulgate       | 1988 (Arndt †1917) | `vulgata.info`           | **complete**, and carries the Clementine Latin    |
| `fr`    | **Crampon 1923**                      | Hebrew/Greek  | see note           | `fr.wikisource.org`      | **complete**; Hebrew-numbered Psalter             |
| `es`    | **Straubinger** (1944–51)             | Hebrew/Greek  | 1 Jan 2027 (†1956) | `lasantabiblia.com.ar`   | **complete**                                      |
| `it`    | **Martini** (1775–81)                 | Vulgate       | long PD            | `scrutatio.it`           | **complete**                                      |
| `hu`    | **Káldi–Tárkányi** (1626, rev 1865)   | Vulgate       | long PD            | `biblia.kapisztran.info` | **complete**                                      |
| `ru`    | **Synodal 1876**                      | Masoretic/LXX | long PD            | `ru.wikisource.org`      | text complete, **Esther not addressable**         |
| `pl`    | **Wujek** (1599, 1923 orthography)    | Vulgate       | long PD            | `biblia.info.pl`         | **Esther 11–16 absent**                           |
| `ro`    | **Biblia 1914** (Orthodox Synodal)    | LXX           | long PD            | `ro.wikisource.org`      | Esther 11–16 absent; **23 % of chapters diverge** |
| `ar`    | —                                     |               |                    |                          | **blocked**                                       |
| `sl`    | —                                     |               |                    |                          | **blocked**                                       |
| `sv`    | —                                     |               |                    |                          | **blocked**                                       |

**Five are ready to parse; three are not, for three different reasons.** German,
French, Spanish, Italian and Hungarian carry the whole canon and their remaining
quirks are parser work. Russian's Esther exists but cannot be addressed at
Vulgate coordinates, Polish's is simply missing, and Romanian needs a
versification table an order of magnitude larger than the one the corpus has.

Six of the eight are Vulgate translations, which is not a preference imposed on
the search — it is what "complete Catholic canon, public domain, in this
language" returns almost everywhere. The pre-critical Catholic vernacular Bible
_is_ the Vulgate Bible, and the modern Catholic translations that would read
more naturally (Einheitsübersetzung, CEI, Tysiąclecia, Nácar-Colunga,
Bibel 2000, Sapientia) are uniformly under active publisher copyright. The
trade the corpus already made for Portuguese — accept a period register to get
a complete, free, doctrinally settled text — is the trade available in eight
languages and unavailable in three.

**`ru` and `ro` are Orthodox texts and the table should not hide it.** Neither
is a Catholic translation, and each carries a larger canon than the 73 — the
Synodal adds 2 Esdras, **3 Esdras** (which the survey missed and the capture
found) and 3 Maccabees, and keeps Psalm 151 as a chapter of the Psalter rather
than a separate work; the Romanian 1914 adds 3 Esdra, 3 Macavei and the Prayer
of Manasseh, splits Daniel's additions into four free-standing books, and gives
the Letter of Jeremiah its own page. The Synodal is what Russian Catholics
actually read — there is no Catholic Russian Bible in print or in the public
domain — so shipping it would be descriptive rather than a compromise.

**But "superset" was the wrong word for both, and the capture is what showed
it.** A superset cannot be missing anything, and both are: neither prints
Esther's Greek additions as chapters 11–16. Russian folds them into chapters
1–10 as unnumbered bracketed prose, so the text is present and no Vulgate
coordinate reaches it; Romanian simply does not have them, and unlike Daniel's
additions — which it does split into their own books — nothing else holds them.
A canon can be simultaneously larger and smaller than the one you are checking
against, and counting books cannot see it.

### What the capture found (2026-08-28)

All eight sources were captured before any parser was written, which is the
order `link-surface.md`'s "re-parse, never re-crawl" policy implies and which
paid for itself immediately: **three findings below are invisible from any one
source and only appear when eight are read side by side.** None of them is a
markup detail; each changes what may be shipped.

**Canon completeness is decided in Esther, and it fails five different ways.**
The Greek additions (Vulgate 10:4–16:24) are the most-dropped text in the
Christian canon, and every source in this batch handled them differently:

| Source           | Esther 10:4–16:24                                         |
| ---------------- | --------------------------------------------------------- |
| `de`, `it`, `hu` | printed as chapters 11–16, ending at 16:24                |
| `es`             | chapter 10 runs to v. 13, then chapters 11–16             |
| `ru`             | **present as unnumbered bracketed prose inside ch. 1–10** |
| `pl`, `ro`       | **absent** — 108 verses simply not there                  |

The Russian row is the one that matters for method. Its text is complete and
its addresses are not, so a verse-count check, a book-count check and a
round-trip all pass while a citation to Est 11:2 resolves to nothing. **Only
reading the text separates loss from divergence**, and this document already
says as much about Esther in another register — it is the reason the Bible is
excluded from `audit.py balance` ("Esther is versification divergence, not
loss"). The capture shows both living in the same book at once.

**The Psalm 9/10 seam breaks differently in every edition, and each break is
silent.** Where the Vulgate combines Hebrew 9 and 10 into one 39-verse psalm,
the eight sources do five different things:

| Source | At Vulgate Ps 9                                                                                     |
| ------ | --------------------------------------------------------------------------------------------------- |
| `de`   | a **second heading block** — `Psalmus X. secundum Hebrœos` — with its own table                     |
| `hu`   | an **unanchored editorial appendix**, `Zsolt 10. A ZSIDÓK SZERINT.`, 8 verses with no anchor at all |
| `es`   | the verse counter **silently resets to 1** mid-page (21 + 18)                                       |
| `it`   | merged, continuous, and **one verse short** of the Clementine (38 against 39)                       |
| `fr`   | Hebrew-numbered outright, and says so in its own footnote                                           |

Every one of those yields a plausible-looking Psalter when parsed naively — a
split into two chapters, eight unreachable verses, a truncated psalm, an
off-by-one. The seam is one address in one book, and it is the single most
dangerous address in this whole ingestion.

**The Kings collision is a pattern, and it hides one layer below where anyone
would look.** `CLAUDE.md` documents `WORK_CONFIGS` as a short list of works whose
own text contradicts their language's table, with `bible.douay-rheims.en` as the
case. Two of the eight sources are the same case, and **both hide it in the
apparatus while their chrome says the opposite**:

| Source | Book titles print     | Footnotes cite                                     | Volume                 |
| ------ | --------------------- | -------------------------------------------------- | ---------------------- |
| `es`   | `1 Samuel`, `2 Reyes` | `I`–`IV Reyes` (four Kingdoms)                     | 1,008 across 489 files |
| `it`   | `1-samuele`, `2-re`   | `I.`–`IV. Reg.` (Latin, and Arabic `1.`–`4. Reg.`) | 447 across 295 files   |

In both, `III`/`IV` land on the modern book and prove the scheme; `I`/`II`
collide with it and resolve into the wrong book. Verified against content in
each: Martini's note citing `I. Reg. IV` for the Philistines and the Ark is
1 Samuel 4, while his own site files `1-re/004` as Solomon's ministers.
**German is the clean negative** — no `3Koe`/`4Koe` pages exist and every
apparent old-scheme hit in its footnotes was a verse number followed by an
unrelated German word.

The lesson generalises past Kings: **an edition's book titles are not evidence
about its citation scheme.** Checking the titles is the obvious move and it
returns the wrong answer in two of eight editions.

**What the capture cost, and what it bought.** 4,714 pages, 568 MB, nine source
directories, **zero failed fetches**, and `pipeline/absent-sources.json`
untouched — not one definitive 404 across nine hosts. Fetching went through one
shared tool (`pipeline/scrapers/bible/capture.py`), which takes an inventory of
`{url, path}` pairs and drives `common.Fetcher`, so every page carries a
capture date in `captured-at.json` written at the moment of the request. The
inventories are tracked in `pipeline/scrapers/bible/inventories/`.

### The litmus, verse by verse

Luke 1:28 first, since it is the test that rejected the WEB Catholic Edition.
Each string was read out of the page the scraper would parse.

| Lang | Luke 1:28                                                                                             | Verdict   |
| ---- | ----------------------------------------------------------------------------------------------------- | --------- |
| `de` | "Gegrüßt seist du, **voll der Gnaden**, der Herr ist mit dir, du bist gebenedeiet unter den Weibern!" | Passes    |
| `fr` | "Je vous salue, **pleine de grâce** ; le Seigneur est avec vous, vous êtes bénie entre les femmes."   | Passes    |
| `es` | "¡Dios te salve, **llena de gracia**!, el Señor es contigo; bendita tú eres entre todas las mujeres"  | Passes    |
| `it` | "Dio ti salvi, **piena di grazia**: il Signore è teco: Benedetta tu fra le donne."                    | Passes    |
| `pl` | "Bądź pozdrowiona **łaski pełna**, Pan z tobą, błogosławionaś ty między niewiastami."                 | Passes    |
| `hu` | "Üdvözlégy, **malaszttal teljes**, az Úr teveled, áldott vagy te az asszonyok között."                | Passes    |
| `ru` | "радуйся, **Благодатная**! Господь с Тобою; благословенна Ты между женами."                           | Passes    |
| `ro` | "bucură-te ceeace ești **plină de dar**, Domnul este cu tine, binecuvântată ești tu între femei."     | Passes    |
| `sv` | "Hell dig, du **högtbenådade**! Herren är med dig."                                                   | **Fails** |

All eight keep the completed-state reading and all eight keep _benedicta tu in
mulieribus_, which the Swedish 1917 also drops. Hungarian is the strongest
signal in the set: **_malaszt_ is the older Catholic word for sanctifying
grace**, abandoned by every post-1973 Hungarian translation in favour of the
generic _kegyelem_; a text that still prints it is announcing its tradition.

Two further verses, on the same method:

| Lang | Isaiah 7:14                           | Genesis 3:15                                                                |
| ---- | ------------------------------------- | --------------------------------------------------------------------------- |
| `de` | "Ecce virgo…" / "eine Jungfrau"       | "**sie** wird dir den Kopf zertreten" — keeps the Marian _ipsa_             |
| `fr` | "**la Vierge** a conçu" (capitalised) | "**celle-ci** te meurtrira à la tête" — feminine by grammar, Hebrew reading |
| `es` | "una **virgen** concebirá"            | "**ella** quebrantará tu cabeza" — keeps _ipsa_                             |
| `pl` | "**panna** pocznie i porodzi syna"    | "**ona** zetrze głowę twoję" — keeps _ipsa_                                 |
| `hu` | "egy **szűz** méhében fogan"          | "**ő** megrontja fejedet" — Hungarian marks no gender                       |
| `ru` | "се, **Дева** во чреве приимет"       | "**оно** будет поражать тебя в голову" — seed, not _ipsa_                   |
| `ro` | "iată **fecioara** în pântece va luà" | "**acela** va păzì capul tău" — LXX _autos … tērēsei_                       |

The `ru` and `ro` readings at Genesis 3:15 are the expected consequence of
translating from Hebrew and Greek rather than from the Vulgate, not a softening:
the Synodal even footnotes the messianic alternative ("и между Семенем ее; Он
будет поражать"). This is the same category as the CPDV/Challoner divergences
already documented — edition divergence, not defect
(`bible-edition-divergence.md`).

### Per-language notes, and what each will cost

**German — Allioli–Arndt, `vulgata.info`.** The strongest source found in this
pass and the only one that is not merely adequate. It is a MediaWiki with an
open API; the text lives at `Kategorie:BIBLIA_SACRA:{AT|NT}:{Book}{NN}`, **1,343
chapter pages**, and each page carries the **Clementine Latin and the German in
parallel columns plus Allioli's own footnotes**. Chapter counts confirm Vulgate
versification throughout (Tobit 14, Esther 16, Baruch 6, Sirach 51, Psalms 150),
so it needs no conversion. Allioli was the first German translation with papal
approbation and the dominant Catholic German Bible for a century.

**The capture confirms the parallel Latin and adds three things.** Each chapter
page is a two-column wikitable — Clementine Latin first, Allioli–Arndt German
second, position being the only discriminator, with no inline label. The Latin
is present in **1,339 of 1,340 chapters**; the single exception is a genuinely
empty page upstream. Pages carry no MediaWiki templates at all, so `action=raw`
wikitext is the complete and higher-fidelity capture and `action=render` adds
only wrapping. Verses are plain `N. text <br/>` with no anchors, footnotes are
German-only and restart at 1 per chapter under a `===Fußnote===` heading, and
cross-reference wiki-links already carry a modern-scheme abbreviation in their
display text.

**German is the batch's clean negative on the Kings axis** and the negative is
worth as much as the two positives: no `3Koe`/`4Koe` pages exist, the string
"Kön" appears in no footnote, and every apparent four-Kingdoms hit was a verse
number followed by an unrelated German word ("3." + "Samuels", "I." + "Regina").
Allioli needs no `WORK_CONFIGS` entry, and that was established by looking
rather than assumed from its being a Vulgate translation — which is what the
Italian source, also a Vulgate translation, turned out to disprove as a rule.

At the Psalm 9/10 seam it does the most legible thing of the eight: a second
full heading block, `Psalmus X. secundum Hebrœos` / `Psalm 10 nach Zählung der
Juden`, with its own table and footnotes. The German column is safe to key off;
at Ps 113 the **Latin** column silently resets 1→8 then 1→18 inside one cell
while the German runs continuously 1–26, so the parallel columns cannot be
assumed to share a verse numbering.

Ignore `k-bibel.de` for ingestion despite its better presentation: its Allioli
1839 text is its own Tesseract OCR of Fraktur scans and the site says so
("Der Text ist daher ohne Gewähr"), and its chapter bodies arrive by script
rather than in the served HTML. Keep it as a cross-check.

**French — Crampon 1923, `fr.wikisource`.** One page per book, all 73 present,
flagged **100 % proofread** against the scan, verse anchors already in the
markup as `id="{chapter}-{verse}"`, Crampon's notes carried as references.
Cleanest markup of any candidate here.

**The rights are the one loose thread and should be pulled before ingesting.**
Crampon died in 1894, so his own work is long public domain, but the 1923 text
is a posthumous revision carried out collectively by the Society of St John the
Evangelist for Desclée, and a collective work's term runs from publication in
France (70 years, i.e. 1994) rather than from Crampon's death. fr.wikisource
hosts it as public domain and Wikimedia's own rights review is not nothing, but
the corpus should record which of the two clocks it is relying on rather than
inheriting the answer.

Two further properties to decide about, neither disqualifying:

- **The Psalter is numbered Hebrew, not Vulgate.** Psalm 10 opens "Pourquoi,
  Yahweh, te tiens-tu éloigné ?" — Vulgate 9:22. This is the first
  Hebrew-numbered edition the corpus would hold; `versification.ts` converts,
  but the stored text follows the source, so the edition's own addresses differ
  from the canonical ones by one across most of the Psalter.
- **It prints "Yahweh" throughout the Old Testament.** A deliberate choice of
  Crampon's, not a modernism, and not a fidelity problem — but it is the single
  most conspicuous thing a reader will notice, and it is worth stating in the
  edition description rather than being asked about. The capture counts **7,775
  occurrences**, absent from Esther, Judith, Tobit, Ecclesiastes and Wisdom,
  which is those books' own convention rather than a gap.

**The capture settled the Psalter question from the edition's own mouth**, and
narrowed it. Psalm 9 carries 21 verses where the Vulgate's carries 39, and a
footnote states the policy outright: "jusqu'au Ps. cxlvii, la numération des
Psaumes est, sauf quelques exceptions, en avant d'une unité dans l'hebreu par
rapport aux LXX et à la Vulg." Note "sauf quelques exceptions" — the offset is
not uniform and the exceptions are the edition's own. **But the divergence is
confined to the Psalter**: Tobit 14, Esther 16, Baruch 6, Sirach 51, Daniel 14
are all Vulgate. So the conversion `versification.ts` must do here is bounded,
not pervasive.

Two structural facts: `?action=raw` returns only a ProofreadPage
`<pages index=… />` transclusion stub with no scripture text — `?action=render`
is required — and **Psalms is five wiki pages**, the traditional Books I–V split
at 1–41 / 42–72 / 73–89 / 90–106 / 107–150, so book pages and logical books are
not one-to-one. Chapters are delimited only by the verse anchors resetting;
there are no chapter headings to walk.

**Spanish — Straubinger, `lasantabiblia.com.ar`.** Revised 2026-08-28, after
the first pass recommended Torres Amat on public-domain grounds and was
overruled on the exposure. Straubinger is the better translation by a wide
margin and the margin is measurable, not reputational:

|              | Torres Amat (1823–25)                                                   | Straubinger (1944–51)                                     |
| ------------ | ----------------------------------------------------------------------- | --------------------------------------------------------- |
| Base text    | the Vulgate                                                             | **Hebrew and Greek originals**                            |
| Apparatus    | none carried by the digital sources                                     | **Straubinger's own notes, thousands of them**            |
| Isaiah 7:14  | "una virgen concebirá … su nombre será Emmanuel, _o Dios con nosotros_" | "**la** virgen concebirá … le pondrá por nombre Emmanuel" |
| Genesis 3:15 | "**ella** quebrantará tu cabeza" (Vulgate _ipsa_)                       | "**éste** te aplastará la cabeza" (Hebrew)                |
| Luke 1:28    | "llena de gracia … bendita tú eres entre todas las mujeres"             | "Salve, llena de gracia; el Señor es contigo"             |

The Isaiah row is the whole case against Torres Amat in one verse: "_o Dios con
nosotros_" is not in the text being translated, it is the translator explaining
himself inside the verse, and that habit — plus the unresolved question of how
much of the work is really José Miguel Petisco's — is the standing criticism of
the edition. Straubinger's two divergences are the opposite kind: both follow
from translating the originals rather than the Vulgate (he drops _benedicta tu
in mulieribus_ at Luke 1:28 because the critical Greek carries it at v. 42, not
v. 28), and neither softens anything. He renders the divine name **Yahvé**, as
Crampon does in French.

**The rights are a knowingly accepted, self-resolving exposure of the Matos
Soares kind, and a much shorter one.** Straubinger died in 1956; Argentina and
Brazil both run life+70 from 1 January of the following year, so the term ends
**1 January 2027** — about four months out. Everything §5 of `copyright.md`
says about Matos Soares applies here in a milder form, and the exposure closes
on its own before most of the rest of this expansion could ship.

**Use `lasantabiblia.com.ar`, not `bibliastraubinger.com`.** Both carry the same
translation and both pass the litmus, but they are not equally complete, and the
difference was found by counting rather than by reading:

- `bibliastraubinger.com` (WordPress, 1,414 posts, enumerable through
  `wp-json/wp/v2/posts`) is **missing five chapters**: 2 Samuel 7, 1 Maccabees
  16, and Psalms 9, 113 and 118 in the Vulgate numbering. 2 Samuel 7 is the
  Davidic covenant and Psalm 118 is the 176-verse acrostic, so this is not a
  tail of oddities. Its Psalter is also absent from the site's own navigation
  (the book menu runs 2 Maccabees → Job) and `/salmos/` is a 404, though the
  individual psalm pages exist. Its footnote markup is inconsistent: Luke 1
  links 23 markers to 23 note bodies, Genesis 3 prints 15 markers with no
  anchors at all.
- `lasantabiblia.com.ar` (Astro, `/biblia/{libro}/{capítulo}`) has all 73 books
  including the Psalter, and every one of those five chapters resolves. Its
  markup is the cleanest of any Spanish source examined:
  `<div class="versiculo" id="v-28">` with `<span class="v-texto" data-v="28">`,
  and the notes are **anchored to the verse they belong to** —
  `<div class="nota-v4-item" id="nota-78">` pointing back at `#v-78` — rather
  than to a site-wide sequential counter as on the other site.

Both sites confirm the numbering the corpus wants: **the Psalter is Vulgate, not
Hebrew.** Verified by verse count rather than by title — Psalm 9 has 39 verses
(Hebrew 9 + 10), Psalm 113 has 26 (Hebrew 114 + 115), Psalm 118 has 176.
`bibliastraubinger.com` prints the mapping in its page titles ("Salmo 145
(146)"), which makes it a useful cross-check for exactly that.

**Corrected 2026-08-28 by the capture — this paragraph originally said
Straubinger names the historical books the Douay way, "I de Reyes (1 Samuel)",
and concluded that the edition disambiguates its own Kings citations, "the
`WORK_CONFIGS` axis answering itself". That is exactly backwards.** The site's
titles are modern and unambiguous throughout (`1 Samuel`, `2 Reyes`); the
parenthetical Douay form appears in one book's prose introduction, explaining
the older usage historically. What the capture found is that **Straubinger's
footnotes cite in the four-Kingdoms scheme regardless** — 1,008 Roman-numeral
citations across 489 chapter files, `I Reyes` 216, `II Reyes` 248,
`III Reyes` 282, `IV Reyes` 262. A note on sackcloth reads "Cf. Génesis 37, 34;
**II Reyes** 3, 31; **III Reyes** 21, 27; **IV Reyes** 6, 30" — 2 Samuel 3:31,
1 Kings 21:27 and 2 Kings 6:30, three sackcloth verses in a note about
sackcloth, which corroborates the scheme from inside the citation itself.

So Spanish needs a `WORK_CONFIGS` entry after all, and it earns one on the
standard the rule actually sets: its references are measurably read wrong
without it, and the evidence is in the note's own sentence. The mistake worth
remembering is the method, not the conclusion — **the first pass checked the
book titles, which is the obvious place and the wrong layer.**

Keep **Torres Amat** (`paxetbon.com`, 73 books at `/biblia/{libro}/{cap}`) as the
public-domain fallback if the exposure is ever refused, and as a second witness
for `audit.py balance`.

**Italian — Martini, `scrutatio.it`.** Book ids 1–73 at
`/bibbia/lettura/it/martini/{book}/{chapter}`; verses marked
`<sup id="vid{n}" class="idvers">`, with cross-references attached as popovers.
The register is 18th-century — "Dio ti salvi", "il Signore è teco" — roughly
where Douay-Rheims sits in English, and archaic in the way `bible-texts.md`
already accepted for Figueiredo. `robots.txt` is `Disallow:` (nothing
disallowed). Note the site also republishes copyrighted translations (CEI, NJB,
NAB, Tysiąclecia, Ave Maria); take Martini and nothing else, and treat the site
as a host rather than as a rights holder.

**The capture confirms Martini and finds the Kings collision.** Esther has 16
chapters ending at 16:24, Baruch 6 with the Letter of Jeremiah as its own
chapter 6, and **no mid-page verse-numbering reset** of the kind the Spanish
source has. Martini's commentary is present in full — his note on Genesis 1:1
alone runs some 600 words — and cross-references are inline in the served HTML
rather than fetched separately. Two shapes to respect: a footnote anchor is
**not** 1:1 with a verse (one note may cover a range, so key by its own `id`
and resolve through the verse's href), and one verse may carry **several**
cross-reference links, not one.

Its footnotes cite the four-Kingdoms scheme in both Roman and Arabic forms —
**447 citations across 295 files** (`I.`–`IV. Reg.`, `1.`–`4. Reg.`) — against
modern book titles in the chrome, so Italian needs a `WORK_CONFIGS` entry on the
same evidence Spanish does. See §What the capture found.

**The Psalter diverges slightly from the Clementine and it is not an artifact.**
Psalm 9 has 38 verses against 39, Psalm 113 has 27 against 26 — one fewer and
one _more_, which rules out the missing-superscription explanation that would
account for either alone. Numbering is contiguous with no duplicates. This is
ordinary edition divergence of the kind `bible-edition-divergence.md` exists to
stop someone "fixing", and it should be diffed at parse time and left alone.

**Polish — Wujek, `biblia.info.pl/bibliawujka`.** 73 book files, whole book per
page, verse anchors `id="{chapter}:{verse}"` — 1,531 in Genesis alone. Its
colophon is unusually honest and should be read before ingesting: the base is
the pl.wikisource "transcription B" (Wujek's wording, modernised orthography) of
the **1923 Polish and Foreign Bible Society** printing, **which omitted Baruch,
Judith, Maccabees, Wisdom, Sirach and Tobit** — those six were supplied from the
original 1599 edition. That is exactly the trap this document already flagged
for Figueiredo ("Bible Societies published revisions without deuterocanonicals —
verify the book count"), caught and patched by the source itself. The colophon
also warns that OCR typos remain.

**The capture found the patch incomplete, and the disclosure is what hid it.**
Esther stops at **10:3** — 167 verse anchors against the Clementine's 275, so
**108 verses of the Greek additions are absent**: Mordecai's dream, both royal
edicts, the prayers of Mordecai and Esther, Esther before the king. The
colophon discloses six omitted _books_ and says they were supplied from 1599.
The additions to Esther are chapters of a book that _was_ present in 1923, so
they fell straight through a patch keyed on books — and the honesty that makes
this source trustworthy is precisely what stops anyone looking further. "73
book files" is not "73 books", and only this source's own frankness made the
difference checkable at all.

The gap is in the 1923 base and propagates everywhere that base is reused:
pl.wikisource's own 1923 Esther stops at 10, and a third independent host
renders "chapter 11" by silently falling back to chapter 1.

**The text exists, in Wujek's wording, and is now captured** — `raw/wujek_1599_ia/`,
the 1599 _editio princeps_ from archive.org (the scan, its OCR, and item
metadata). Wujek's own marginal note stands at the seam: what precedes is what
he found "w kśięgach żydowskich", and what follows he took from the common
edition issued in Greek. But it is uncorrected Tesseract OCR of 16th-century
type, and the damage reaches the structure rather than only the prose — chapter
numerals come out `VIL`, `XIIL`, `XVL`. Capturing the PDF alongside means a
better OCR later is a re-parse rather than a re-crawl.

**So Polish is a decision, not a defect**: ship with the 1599 OCR as the source
for 11–16, ship with a documented gap, or hold until someone proofreads it.
That is the person directing the work's call (`CLAUDE.md` §the corpus), not a
judgement to be taken mid-parse.

**The orthographic seam IS visible, contrary to what this paragraph first
recorded.** The six recovered books contain zero instances of `é` — 524 in
Genesis alone — and read `wszytko`/`wszytkich` where the modernised majority
text reads `wszystko`/`wszystkich`. They were never run through the
transcription-B modernisation. That is a property of the source, not damage,
and a per-unit check across this work will see it; nobody should "fix" it.

**Hungarian — Káldi–Tárkányi, `biblia.kapisztran.info`.** All 73 books plus the
edition's introductions, whole book per page, anchors `name="{book}:{ccc}.{vvv}"`
— machine-readable to the verse. Word-exported HTML (`class=MsoNormal`), the
same shape as the Portuguese Catechism mirror, so the parser has a precedent.
The 1865 Eger edition, "Az Apostoli Szék jóváhagyásával", was the Hungarian
Catholic Bible until 1973. Book titles are Douay-style ("Királyok (Sámuel) I.
könyve", "Királyok III. (I.) könyve"), which is a `WORK_CONFIGS` question, not a
defect — see below.

**The capture corrected three things here.** The site is **73 books × 3 pages**,
not one page per book: `szoveg.html` (text), `jegyzet.html` (concise notes) and
`jegyzet2.html` (extended commentary), plus four cross-book introductions — a
two-layer apparatus, which is a schema question rather than a parsing one.
Anchors key on a **positional book number 01–73 in Vulgate canonical order**
(`name="19:016.024"`), not on the URL slug, so book identity survives
independently of the site's naming.

And **`malaszt` is a minority usage, which this document originally overstated
as "the strongest signal in the set".** Counted across the whole capture: 47
`malaszt` against 85 `kegyelem` in the running text, 161 against 571 in the
notes. The claim that survives is narrower and still worth making — every
post-1973 Hungarian translation dropped the word entirely, so a text still
printing it at this volume is announcing its tradition — but this is not a
`malaszt`-only Bible and the colophon must not say so.

The Isaiah 7:14 OCR typo is confirmed present ("Emmánnelnek" for "Emmánuelnek")
and now has its corroboration: **Matthew 1:23 quotes the same verse and spells
it correctly**, so it is a one-page typo rather than a period-orthography
variant. That is the locator-plus-evidence shape `pipeline/corrections/` asks
for, recorded here and not yet filed.

**One address needs a decision before parsing.** The Psalter carries a one-off
editorial appendix at the 9/10 acrostic seam — `Zsolt 10. A ZSIDÓK SZERINT.`,
Hebrew Psalm 10 as its own unit. Eight of its verses carry **no anchor at all**,
and the anchored ones sit in the file _before_ the real Psalm 10's. Anything
walking anchors in document order reads them out of numeric sequence.

Note `szentiras.hu`, the obvious first stop and the site that labels this
translation **Közkincs** (public domain), was unreachable throughout this pass
(timeouts) and `szentiras.eu` is behind a Cloudflare interstitial. Kapisztrán is
plain static HTML and needs neither.

**Russian — Synodal, `ru.wikisource`.** Books are top-level pages; verses are
`{{стих|глава=N|стих=M}}` templates and cross-references are
`{{bible parallels}}` — structured data, not prose to be pattern-matched. The
deuterocanonicals are present and colour-marked "неканонические", the Orthodox
designation; we would take the 73 and let the marking go. Psalms follow the
Septuagint numbering, which is the Vulgate's, so no conversion — confirmed by
the capture, which counts 39 verses at Psalm 9 and 151 chapters in the Psalter,
Psalm 151 being a chapter rather than a separate work.

**Two structural findings move Russian out of the ready set.** Esther's Greek
additions are present but **unaddressable** — bracketed prose folded into
chapters 1–10, with the edition's own footnote explaining that bracketed words
come from the Septuagint — so no citation to Est 11–16 can reach them. And
**Baruch has five chapters**, because the Letter of Jeremiah is its own page
rather than Baruch 6, so `Bar 6` needs mapping rather than lookup. Neither is a
defect and neither is loss; both are decisions about how a differently-shaped
canon maps onto Vulgate addresses, which is work rather than a judgement call,
and it is why Russian waits.

`robots.txt` disallows all of `/w/`, where both `action=raw` and `action=render`
live, so the capture took `/wiki/{title}` — an unrestricted path — after
confirming these are native wikitext articles rather than ProofreadPage
transclusions. The opposite conclusion from French, reached by reading the file
rather than copying the sibling.

**Romanian — the weak case.** `Biblia 1914` on `ro.wikisource` is 80 books with
`<span id="{c}.{v}"/>` anchors and whole-book pages, and it passes the litmus.
But it is Orthodox, in 1914 orthography (`erà`, `dela`, `ceeace`), and — the
finding that actually matters — **its verse numbering diverges from the Vulgate
outside the Psalms**: the Emmanuel prophecy is printed as **Isaiah 7:13**, not
7:14. A citation to Is 7:14 would resolve to real but wrong text, which is
precisely the failure mode `versification.ts` exists to prevent and which it
currently models only for the books it knows about. Adopting Romanian means
first measuring how wide that offset runs.

**That survey has now been run, and the answer is decisive.** Comparing every
chapter's verse count against `bible.clementina.la`, **308 of 1,321 mappable
chapters (23 %) differ** — not confined to Isaiah, not confined to the prophets.
Three clusters are expected and not defects: **Tobit 14/14 and Judith 15/16**
diverge almost totally because Jerome's Vulgate is an abridged Latin paraphrase
while this edition translates the longer Greek recension, **Sirach 37/51** is
the standing Greek-versus-Latin numbering split, and the Psalter is already
modelled as wholesale-divergent. What remains after setting those aside is
low-density divergence nearly everywhere — the single-verse merge that shifts a
chapter's tail, the Isaiah 7 shape, recurring across the Pentateuch, the
historical books, wisdom, the minor prophets and a sparse but real tail in the
New Testament (John 6:71 here is Vulgate John 6:72, verified by content).

Against that, `versification.json` holds three wholesale-divergent books and
fifteen individually-mapped verses. **Adopting Romanian does not mean extending
that table; it means building one of a different order of magnitude**, and every
entry not built is a citation resolving to real but wrong text with nothing to
catch it. The survey is a verse-count comparison, not a content alignment, so it
cannot see a same-count swap and it excludes the eight books with no clean
1:1 counterpart — within those limits the scale is the finding.

Romanian also **lacks Esther's Greek additions entirely** (see above), which is a
canon question independent of the versification one. Its book order is not
Vulgate order and Daniel is four separate pages, so a parser must read book
identity from the page title rather than from position.

The Catholic alternatives are worse: the Iași diocese's complete Bible (Editura
Sapientia, 2013) is under copyright, and the Greek-Catholic Blaj Bibles (Aron's
Vulgate translation 1760–61, Micu 1795) exist as scans and modern critical
editions, not as machine-readable text. **Recommendation: ship the other seven
first and treat Romanian as a decision to be taken on its own**, once the
versification survey says what it would cost.

### The three that are blocked

**Swedish.** There has never been a distinctly Catholic Swedish Bible; Swedish
Catholics use **Bibel 2000**, which is under Svenska Bibelsällskapet copyright.
The public-domain alternatives are Lutheran and fail the litmus at the same verse
the WEB Catholic Edition failed at — the 1917 church Bible reads "Hell dig, du
**högtbenådade**!" and drops "blessed art thou among women"; Karl XII (1703) is
Luther-derived and older. There is no version of this that satisfies both
criteria. Swedish readers keep `CONTENT_LANG_FALLBACK`.

**Slovenian.** The right text exists and is not digitised. **Wolfova Biblija**
(1856–59) is Catholic, complete, public domain, and — pleasingly — was
translated from **Allioli**, the same edition proposed for German. But
sl.wikisource holds exactly **one book of it** (the Psalms); Japelj (1784–1802)
has none. Everything on `biblija.net` is claimed by the Bible Society of
Slovenia, including its prepared text of Dalmatin (1584), and the Society states
that use of Slovene Bible texts requires its written permission. Chráska (1914)
is Protestant and has no deuterocanon. The path to Slovenian is OCR of the dLib
scans — a real project, not an ingestion.

**Arabic.** The Catholic translation is the **Jesuit Bible** (Beirut,
1876–1880), and the circulating digital text is Dar el-Machreq's edition, under
copyright. Van Dyck (1865) is public domain, structurally available, and
disqualified twice over: it is a Protestant translation with no deuterocanonical
books, so it cannot reach 73. The Dominican Mosul Bible (1875–78) is Catholic
and old enough, and exists as scans. Arabic is the same shape as Slovenian —
blocked on digitisation, not on rights.

Both blockages are worth stating on the colophon rather than leaving as silent
gaps, since a reader in either language currently gets English scripture under
their own chrome with no explanation.

### What ingesting these touches

None of the eight is a new `ContentLang` — `types.ts` already carries all eleven,
so `LANGUAGE_NAMES` needs nothing (the `mg` failure mode does not repeat here).
What they do touch:

- **`refs-grammar.ts` book tables gain their second consumer per language.**
  Eight of the eleven tables were derived from citation apparatus and hold
  abbreviations only; a Bible edition carries its own `name`/`abbrevs`, which is
  what lets a reader complete a full book name in the jump box. Adding these
  editions is the cheapest available fix for the complaint recorded in
  `CLAUDE.md` that only `en`, `pt` and `la` complete full names.
- **`WORK_CONFIGS` needs one look per edition, on the Kings axis — and the look
  has now been taken.** The anticipation in this list was wrong in both
  directions, which is the useful part. Allioli, a Vulgate translation, is a
  **clean negative**: no old-scheme citation anywhere in its apparatus. Martini,
  also a Vulgate translation, is a **positive at 447 citations across 295
  files**. And Straubinger, translated from the originals and printing modern
  titles — the edition least expected to need an entry — is the **largest
  positive in the corpus at 1,008 across 489 files**. So "it is a Vulgate
  translation" predicts nothing, and the rule stands exactly as written: an entry
  only where the work's own references are measurably read wrong without it. Two
  entries earned, one refused, one (Káldi) still to check at parse time.
- **Versification is the one real surprise, and it is larger than this line
  first allowed.** Crampon is Hebrew-numbered in the Psalter — bounded there, and
  stated in the edition's own footnote. The Romanian 1914 is not "offset in
  Isaiah" but divergent in 23 % of its chapters. Martini differs from the
  Clementine by one verse at Ps 9 and Ps 113, in opposite directions. Everything
  else is Vulgate-numbered, but the **Psalm 9/10 seam needs per-edition handling
  in five of the eight** — see §What the capture found.
- **`audit.py balance` gets a much larger matrix.** Twelve Bible editions is 66
  pairs, and the Bible is deliberately excluded from `balance` today because
  Esther divergence reads as loss. That exclusion should be revisited rather
  than inherited: with eight new editions, an edition-specific defect has seven
  witnesses against it, which is the configuration that found all three
  Catechism defects.

### Sources, ranked, per language

| Lang | Primary                                                               | URL shape                                                    | Cross-check                                                |
| ---- | --------------------------------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| `de` | **vulgata.info** (MediaWiki API; Latin+German+notes)                  | `?title=Kategorie:BIBLIA_SACRA:{AT\|NT}:{Bk}{NN}&action=raw` | k-bibel.de (OCR, JS-rendered)                              |
| `fr` | **fr.wikisource** (100 % proofread, verse anchors)                    | `/Bible_Crampon_1923/{Livre}` + `?action=render`             | scrutatio.it (Fillion, Vigouroux)                          |
| `es` | **lasantabiblia.com.ar** (73 books, `id="v-N"`, verse-anchored notes) | `/biblia/{libro}/{capitulo}`                                 | bibliastraubinger.com (5 gaps); paxetbon.com (Torres Amat) |
| `it` | **scrutatio.it** (73 book ids, verse `id`s, cross-refs)               | `/bibbia/lettura/it/martini/{1-73}/{cap}`                    | sacrabibbia.altervista.org                                 |
| `pl` | **biblia.info.pl** (73 files, `id="c:v"`, colophon states provenance) | `/bibliawujka/{Sigla}.html`                                  | pl.wikisource (incomplete)                                 |
| `hu` | **biblia.kapisztran.info** (73 books + introductions, `bb:ccc.vvv`)   | `/{book}/szoveg.html`                                        | szentiras.hu (unreachable here)                            |
| `ru` | **ru.wikisource** (`{{стих}}` templates)                              | `/wiki/{Книга}?action=raw`                                   | azbyka.ru                                                  |
| `ro` | **ro.wikisource** (`<span id="c.v"/>`, whole book)                    | `/wiki/Biblia_1914/{Carte}?action=raw`                       | — (see caveats)                                            |

Four of the eight are MediaWiki, which means one fetch-and-parse shape covers
half the set — and the two Wikisource families (`fr` transcluded from
ProofreadPage, `ru`/`ro` written as wikitext) differ enough to be two readers,
not one.

**On `robots.txt`.** `scrutatio.it` disallows nothing. `vulgata.info` serves no
`robots.txt`. `bibliastraubinger.com` disallows only `/wp-admin/` and publishes a
sitemap. `lasantabiblia.com.ar`, `biblia.info.pl`, `paxetbon.com` and `bibliatodo.com` all serve
Cloudflare's managed file: `User-agent: *` is `Allow: /` with
`Content-Signal: search=yes, ai-train=no, use=reference`, and named AI crawlers
(including ClaudeBot) are disallowed by name. Reproducing a public-domain text
in a reference site is the `search`/`reference` use those signals permit and is
not the training use they refuse — but the distinction should be honoured
deliberately rather than by not reading the file, and the `Crawl-delay: 2`
discipline `docs/decisions.md` commits to for vatican.va applies here by the
same reasoning.

## Appendix: the Luke 1:28 litmus test

Greek: Χαῖρε, **κεχαριτωμένη** (_kecharitōmenē_) — perfect passive participle of χαριτόω ("to grace"), used by the angel _in place of Mary's name_. The perfect tense denotes a completed past action with enduring present result: "you who have been graced, fully and permanently." Jerome rendered it _gratia plena_ → "full of grace"; this is the traditional reading underpinning the Immaculate Conception (cited in _Ineffabilis Deus_; CCC 490–493) — grace as a transformative state Mary already possesses.

"Highly favored" (KJV → ASV → WEB lineage) is lexically defensible but reads the word as external favor — God's attitude toward her — rather than an infused condition in her. At the single verse where the Catholic/Protestant divergence over the nature of grace is sharpest, it resolves the ambiguity away from the Catholic reading. Hence its use here as a one-verse litmus for a translation's tradition: not "demythologizing" in the rationalist sense, but doctrinal under-translation at a dogmatically load-bearing spot.
