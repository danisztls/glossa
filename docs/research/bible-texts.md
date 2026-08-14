# Bible text selection

Research conducted 2026-08-13/14. Criteria: complete Catholic canon (73 books); modern language welcome **provided it does not deviate from the original meaning and does not demythologize** (no rationalist softening of miracles/angels/virgin birth, no "full of grace" → "highly favored", no inclusive-language rewrites).

## Decision

Initial lineup (expand later):

- **English: CPDV** (Catholic Public Domain Version, 2009) — modern English, public domain.
- **Portuguese: Matos Soares (1956 edition)** — modern Portuguese, under copyright until 31 Dec 2027 (accepted exposure, see `copyright.md` §4–5).

Candidates for later expansion: Douay-Rheims Challoner (traditional EN), Clementine Vulgate (parallel Latin), Figueiredo 1950 edition (traditional PT — text only, **never the notes**, which were placed on the Index in 1795).

Rejected: **WEB Catholic Edition** — its Luke 1:28 reads "Rejoice, you highly favored one!", failing the doctrinal-fidelity criterion at the litmus verse (see appendix).

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

## Appendix: the Luke 1:28 litmus test

Greek: Χαῖρε, **κεχαριτωμένη** (_kecharitōmenē_) — perfect passive participle of χαριτόω ("to grace"), used by the angel _in place of Mary's name_. The perfect tense denotes a completed past action with enduring present result: "you who have been graced, fully and permanently." Jerome rendered it _gratia plena_ → "full of grace"; this is the traditional reading underpinning the Immaculate Conception (cited in _Ineffabilis Deus_; CCC 490–493) — grace as a transformative state Mary already possesses.

"Highly favored" (KJV → ASV → WEB lineage) is lexically defensible but reads the word as external favor — God's attitude toward her — rather than an infused condition in her. At the single verse where the Catholic/Protestant divergence over the nature of grace is sharpest, it resolves the ambiguity away from the Catholic reading. Hence its use here as a one-verse litmus for a translation's tradition: not "demythologizing" in the rationalist sense, but doctrinal under-translation at a dogmatically load-bearing spot.
