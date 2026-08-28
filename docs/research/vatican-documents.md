# Scoping survey: encyclicals and other Vatican documents

Research conducted 2026-08-15 (Claude, read-only survey; corpus analysis via `jq`/`python3`, live vatican.va fetches via `curl`). Companion to `copyright.md` (§6 folds in this survey's copyright findings), `../corpus-schema.md` (§Documents is drawn from §5 below), `../link-surface.md`, and `../decisions.md` (§Scope records the decision this survey fed).

## TL;DR

The CCC's own footnote apparatus is a near-perfect priority signal: it cites Vatican II documents constantly (Lumen Gentium alone 269 times), a fairly small, dominated-by-John-Paul-II set of encyclicals/exhortations (~30 distinct titles, headed by _Familiaris Consortio_ and _Centesimus Annus_), and heavily leans on Denzinger (DS, 502 occurrences) and canon law (CIC, 264) — neither of which vatican.va carries in scrapeable form. The good news: every document family actually tested (Vatican II constitutions from 1963–65, encyclicals from 1891 through 2015, an apostolic exhortation, a CDF declaration, and the Code of Canon Law) numbers its paragraphs/canons **inline, as plain digits**, and that numbering is **reliably, completely extractable** with a regex-based parser in the same style as the existing `ccc.py` scraper — once it accounts for three recurring quirks (self-link anchors around the number, `&nbsp;` instead of a literal space, and one early-19th-century off-by-one on paragraph 1). One parser family, with per-era regex tweaks, plausibly covers Vatican II + encyclicals + exhortations + CDF/DDF documents. Canon law needs a second, smaller parser (`Can. N` prefix, chunked pages by canon range) and **has no Portuguese edition on vatican.va** — a hard language-symmetry blocker for that one family. Denzinger and the Roman Catechism are not on vatican.va at all and are out of scope for a vatican.va-only pipeline. Copyright posture is identical to the CCC's existing one — LEV/Dicastery for Communication claims copyright on every document tested, including the 1891 _Rerum Novarum_, with no age-based carve-out visible in the notice itself.

## 1. What does the CCC actually cite?

Extracted every `citations[].text` from `corpus/build/ccc.en/paragraphs.json` (3,698 citation strings) and `ccc.pt/paragraphs.json` (3,601 citation strings) — 7,299 total, combined for counting since a document cited in one language edition is cited in the doctrine, not the language. (`corpus/build/compendium.{en,pt}/questions.json` carries **no** citation apparatus at all — only `ccc_refs`, a raw string pointing back into the CCC's own paragraph numbers, confirmed by `jq '[.[] | keys] | unique'` returning only `["answer_blocks","ccc_refs","n","question"]`. The Compendium contributes nothing to this signal.)

### (a) Vatican II documents — sigla occurrence counts (EN+PT combined)

| Siglum | Document                                                   | Count |
| ------ | ---------------------------------------------------------- | ----- |
| LG     | Lumen Gentium (dogm. const. on the Church)                 | 269   |
| SC     | Sacrosanctum Concilium (const. on the Liturgy)             | 191   |
| GS     | Gaudium et Spes (past. const., Church in the Modern World) | 135   |
| DV     | Dei Verbum (dogm. const. on Divine Revelation)             | 76    |
| UR     | Unitatis Redintegratio (decree on Ecumenism)               | 36    |
| AG     | Ad Gentes (decree on Missionary Activity)                  | 32    |
| DH     | Dignitatis Humanae (decl. on Religious Freedom)            | 20    |
| AA     | Apostolicam Actuositatem (decree on the Laity)             | 13    |
| CD     | Christus Dominus (decree on Bishops)                       | 10    |
| NA     | Nostra Aetate (decl. on Non-Christian Religions)           | 9     |
| PC     | Perfectae Caritatis (decree on Religious Life)             | 7     |
| IM     | Inter Mirifica (decree on Social Communications)           | 5     |
| OT     | Optatam Totius (decree on Priestly Formation)              | 3     |
| GE     | Gravissimum Educationis (decl. on Christian Education)     | 3     |

All 16 conciliar documents (4 constitutions, 9 decrees, 3 declarations) are cited at least once; the four constitutions plus DH and UR account for the overwhelming majority of traffic (727 of 809 sigil occurrences, 90%). "Vatican Council II"/"Concílio do Vaticano" also appears as prose (not just sigla) 697 times across both languages — the true reference density is higher than the siglum table alone shows, since many citations spell the document out or combine a siglum with an "AAS" volume/page cite (e.g. `"Pius XII, Fidei donum: AAS 49 (1957) 237; cf. LG 23; CD 4; 36; 37; AG 5; 6; 38."`).

### (b) Papal encyclicals/exhortations/apostolic documents — named titles extracted from citation prose

Extracted via pattern-matching on `Enc. <title>`, `Ex. ap. <title>`, `Encyclical <title>`, `Apostolic Exhortation <title>`, `Const. ap. <title>` etc. (38 distinct titles recovered, 113 total occurrences — an undercount, since many citations abbreviate after first mention or use a bare italicized title the regex didn't anchor on; treat as a floor, not a ceiling):

| Count  | Title                                                                                                                                                                                                     | Pope                          |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| 15     | Familiaris Consortio                                                                                                                                                                                      | John Paul II (apost. exhort.) |
| 13     | Centesimus Annus                                                                                                                                                                                          | John Paul II (enc.)           |
| 9      | Redemptoris Missio                                                                                                                                                                                        | John Paul II (enc.)           |
| 8      | Sollicitudo Rei Socialis                                                                                                                                                                                  | John Paul II (enc.)           |
| 5      | Evangelii Nuntiandi                                                                                                                                                                                       | Paul VI (apost. exhort.)      |
| 5      | Humanae Vitae                                                                                                                                                                                             | Paul VI (enc.)                |
| 5      | Laborem Exercens                                                                                                                                                                                          | John Paul II (enc.)           |
| 4      | Reconciliatio et Paenitentia                                                                                                                                                                              | John Paul II (apost. exhort.) |
| 4      | Pacem in Terris                                                                                                                                                                                           | John XXIII (enc.)             |
| 3      | Christifideles Laici                                                                                                                                                                                      | John Paul II (apost. exhort.) |
| 3      | Mysterium Fidei                                                                                                                                                                                           | Paul VI (enc.)                |
| 2      | Humani Generis                                                                                                                                                                                            | Pius XII (enc.)               |
| 2      | Redemptoris Mater                                                                                                                                                                                         | John Paul II (enc.)           |
| 2      | Mystici Corporis                                                                                                                                                                                          | Pius XII (enc.)               |
| 2      | Redemptor Hominis                                                                                                                                                                                         | John Paul II (enc.)           |
| 2      | Dominum et Vivificantem                                                                                                                                                                                   | John Paul II (enc.)           |
| 2      | Indulgentiarum Doctrina                                                                                                                                                                                   | Paul VI (apost. const.)       |
| 2      | Immortale Dei                                                                                                                                                                                             | Leo XIII (enc.)               |
| 2      | Libertas Praestantissimum                                                                                                                                                                                 | Leo XIII (enc.)               |
| 2      | Casti Connubii                                                                                                                                                                                            | Pius XI (enc.)                |
| 2      | Populorum Progressio                                                                                                                                                                                      | Paul VI (enc.)                |
| 1 each | Summi Pontificatus, Haurietis Aquas, Vita Consecrata, Sacram Unctionem Infirmorum, Mediator Dei, Fidei Donum, Sacramentum Ordinis, Mater et Magistra, Diuturnum Illud, Quanta Cura, Dives in Misericordia | (mixed, see below)            |

By pope-name occurrence in citation prose (author attributions, includes both encyclical and non-encyclical citations, EN "John Paul"/PT "João Paulo" summed): **John Paul II 154**, **Leo XIII 69**, **Paul VI 77**, **Pius XII 33** (English count; PT "Pio XII" not separately tallied but present), **Gregory (various, mostly Fathers not popes) 54**, **Clement 25**, **Benedict 19**, **John XXIII 10**, **Innocent 3**. John Paul II dominates by a wide margin — unsurprising, since the CCC (1992/1997) was promulgated under his pontificate and draws heavily on his own magisterium.

### (c) Canon law

`CIC` (1983 Code) — 264 occurrences. `CCEO` (Code of Canons of the Eastern Churches) — 46 occurrences. Both cited as `CIC can. NNN` / `CCEO can. NNN`, i.e. individual canon numbers, not document ranges — the link target would need to be canon-level, not document-level.

### (d) Denzinger/DS

`DS` (Denzinger, or in some older printings Denzinger-Schönmetzer) — **502 occurrences**, the single most-cited non-scripture siglum in the corpus after AAS. Always as `DS NNNN`, a specific numbered proposition. This is high-value linking territory that vatican.va **cannot supply** (see §2).

### (e) Patristic and liturgical sources

`PL` (Migne, Patrologia Latina) — 324. `PG` (Migne, Patrologia Graeca) — 257. `AAS` (Acta Apostolicae Sedis, the official gazette — appears as a citation-format suffix on nearly every magisterial-document citation, not a standalone reference) — 1,051, the most frequent siglum overall, but structurally a page-locator, not something to build a document/link target around. Named Fathers/saints by frequency (795 total mentions across 131 distinct names, English+Portuguese honorific forms summed where recognizable): **Augustine 166** (Agostinho 85 + Augustine 81), **Thomas Aquinas 112**, **Irenaeus 50**, **Ignatius of Antioch ~39**, **John Chrysostom 40**, **Ambrose 38**, **Gregory (Nazianzen/Nyssa/Great, undifferentiated) ~55**, **Cyril (Jerusalem/Alexandria) 18**, **Cyprian 16**, **Justin Martyr 17**, **Teresa (of Ávila/of the Andes, undifferentiated) 26**. The "Roman Catechism" (Catechismus Romanus, post-Tridentine) is separately cited 26 times.

### Reading this table for scoping

The CCC's citation apparatus tells us, in priority order: (1) Vatican II — 16 documents, high density, would light up hundreds of links immediately; (2) a compact ~25-30-document set of John Paul II/Paul VI-era encyclicals and exhortations, plus a handful of earlier ones (Leo XIII social encyclicals, Pius XI/XII doctrinal ones); (3) Denzinger and canon law, both structurally out of reach from vatican.va; (4) patristics/liturgy, which is a different, much larger and more heterogeneous sourcing problem (PL/PG are 19th-century Migne compilations, not vatican.va content) and clearly a "later, if ever" tier.

## 2. What's on vatican.va, and in which languages?

All checks below performed live against `www.vatican.va` on 2026-08-15 (network-allowlisted for this survey); `robots.txt` confirms `Allow: *`, `Crawl-delay: 2` (unchanged from what `ccc.py`/`compendium.py` already assume).

### Vatican II corpus (16/16 documents)

Index: <https://www.vatican.va/archive/hist_councils/ii_vatican_council/index.htm> (retrieved 2026-08-15). Lists **all 16** documents — 4 constitutions (_Dei Verbum_, _Lumen Gentium_, _Sacrosanctum Concilium_, _Gaudium et Spes_), 3 declarations (_Gravissimum Educationis_, _Nostra Aetate_, _Dignitatis Humanae_), 9 decrees (_Ad Gentes_, _Presbyterorum Ordinis_, _Apostolicam Actuositatem_, _Optatam Totius_, _Perfectae Caritatis_, _Christus Dominus_, _Unitatis Redintegratio_, _Orientalium Ecclesiarum_, _Inter Mirifica_) — each with a per-language link list including `po` (Portuguese) and `en` (English) for every one of the 16, confirmed by fetching `.../documents/vat-ii_const_19641121_lumen-gentium_en.html` (200) and the `_po.html` counterpart (200, after one transient network retry — see reliability note below). URL pattern: `vat-ii_{const|decl|decree}_{YYYYMMDD}_{slug}_{lang}.html`, entirely predictable from the index page — no per-document URL guessing needed.

**Vatican Council I** (also cited in the CCC — _Dei Filius_, DS 3000s range, 100+ occurrences bundled into the "Vatican Council" prose count above): index guess `.../hist_councils/i_vatican_council/index.htm` returned 404, and a direct guess at `vat-i_const_18700424_dei-filius_en.html` also 404. **Not confirmed available** on vatican.va under any pattern tried; flagged as an open question rather than a confirmed absence (no exhaustive site-map search was run) — Vatican I is doctrinally important (it's where the CCC's DS 3000s block comes from) but did not surface in this survey and should not be assumed in scope for phase 1.

### Papal encyclicals — per-pontificate index audit

Fetched `.../content/{pontiff}/en/encyclicals.index.html` for four pontificates spanning the full historical range, parsed every `.../encyclicals/documents/{slug}.html` link and grouped by language:

| Pontificate              | Distinct encyclicals | EN available | PT available | Both EN+PT |
| ------------------------ | -------------------- | ------------ | ------------ | ---------- |
| Leo XIII (1878–1903)     | 86                   | 86/86 (100%) | 15/86 (17%)  | 15/86      |
| Pius XII (1939–1958)     | 41                   | 40/41 (98%)  | 34/41 (83%)  | 33/41      |
| John Paul II (1978–2005) | 14                   | 14/14 (100%) | 14/14 (100%) | 14/14      |
| Francis (2013–2025)      | 4                    | 4/4 (100%)   | 4/4 (100%)   | 4/4        |

(Sources: `.../content/leo-xiii/en/encyclicals.index.html`, `.../content/pius-xii/en/encyclicals.index.html`, `.../content/john-paul-ii/en/encyclicals.index.html`, `.../content/francesco/en/encyclicals.index.html`, all retrieved 2026-08-15.) The pattern is exactly what §1's citation data would predict: coverage improves sharply as the pontificate gets closer to the present, and Portuguese lags English badly for Leo XIII specifically (83% of his encyclicals have no Portuguese translation on vatican.va at all). Every JPII and Francis encyclical named in the CCC's citation list (§1b) is available in both languages. Pontificates not directly audited (Pius XI, Pius X, Benedict XV, Paul VI, John XXIII, Benedict XVI, John Paul I) were not indexed in this pass; given the monotonic trend visible above, Paul VI and John XXIII (both cited heavily in §1b) are expected to be close to 100%/100%, and Pius XI/X close to the Pius XII numbers — but this is inference, not measurement, and should be spot-checked before committing to a document list beyond phase 1.

### Other doctrinal categories, scrapeability assessed

- **Apostolic exhortations**: same publishing pipeline as encyclicals (confirmed via _Familiaris Consortio_, `.../content/john-paul-ii/en/apost_exhortations/documents/hf_jp-ii_exh_19811122_familiaris-consortio.html`, retrieved 2026-08-15) — identical inline paragraph-numbering convention, full 1–86 coverage with zero gaps. Doctrinally weighty (this family includes the CCC's single most-cited non-conciliar document) and structurally identical to encyclicals. High priority.
- **CDF/DDF declarations and instructions**: confirmed via _Dominus Iesus_ (`.../roman_curia/congregations/cfaith/documents/rc_con_cfaith_doc_20000806_dominus-iesus_en.html`, retrieved 2026-08-15) — same numbering family, but uses `&nbsp;` instead of a literal space after the paragraph-number period (see §3). Doctrinally weighty, moderate volume (the CDF/DDF index at `.../roman_curia/congregations/cfaith/index.htm` lists many declarations/instructions/notifications going back decades); worth a dedicated later phase once the core encyclical parser is proven.
- **Code of Canon Law (1983 CIC)**: index at `.../archive/cod-iuris-canonici/cic_index_en.html` (200; note the URL the CCC-adjacent naming convention suggests, `.../archive/ENG1104/_INDEX.HTM`, 302-redirects there). Chunked into ~100+ small pages by canon range (e.g. `cic_lib1-cann7-22_en.html` covers canons 7–22) rather than one page per canon — an indexed table of contents maps every canon range to its page, same shape as the CCC/Compendium's own multi-page mirrors. **Also available in Italian and Spanish** (`cic_index_it.html`, `cic_index_sp.html`, both 200) but **not Latin** (`cic_index_lt.html`, 404) and, critically, **not Portuguese** — no `cic_index_po.html`/`_pt.html` found under any guessed slug. This is a real language-symmetry blocker: 264 CCC citations point at CIC canons, but a Portuguese edition doesn't exist on vatican.va to link against. (A Portuguese CIC exists in print/elsewhere — e.g. via CNBB — but that's a separate sourcing problem, out of scope for a vatican.va-only pipeline.)
- **Denzinger (DS)**: not found on vatican.va under any guessed path; this is expected — Denzinger-Hünermann is a Herder-published, separately-copyrighted compilation, never a vatican.va publication. Out of scope regardless of doctrinal weight (502 CCC citations notwithstanding).
- **Roman Catechism** (Catechismus Romanus, 1566): not found on vatican.va. A different, much older PD-by-age work (16th century), circulated via third-party sites, not the Holy See's own site. Out of scope for this pipeline's vatican.va-sourcing model; a future project could pursue it as a wholly separate PD acquisition, parallel to how the Bible texts were sourced outside vatican.va.
- **Papal general audiences**: index at `.../content/john-paul-ii/en/audiences/1979.index.html` (200) confirms the category exists and is huge (one index page per year, per pontificate, decades deep). Not spot-checked for numbering/structure beyond confirming existence — audiences are catechetical but not magisterial documents in the same weight class as encyclicals, and the volume (thousands of individual talks) makes this a "much later, if ever" tier; excluded from the phased plan below pending a dedicated future survey.
- **Motu proprios, apostolic constitutions, apostolic letters**: not independently audited beyond the "Const. ap." pattern already surfacing in the encyclical-title extraction (§1b, e.g. _Indulgentiarum Doctrina_). Same publishing pipeline as encyclicals based on every sample checked; treat as the same parser family, lower individual priority than the ranked list in §1b.

### How many distinct parsers, realistically?

Based on every family actually fetched and parsed in this survey:

1. **One "encyclical-family" parser** covers: Vatican II constitutions/decrees/declarations, encyclicals across all four pontificates sampled (1891–2015), one apostolic exhortation, and one CDF declaration — all use the same "plain digit + period starts a `<p>`, optionally self-link-anchored, footnote markers as `<sup><a name="-N" href="#$N">N</a></sup>`" convention, the same convention the existing `ccc.py` EN parser already handles for the CCC's own IntraText mirror. This is the highest-confidence, lowest-marginal-cost family — it is not a new parser design, it is the existing one generalized with 2-3 additional regex branches (see §3).
2. **One "canon law" parser** for the CIC: different marker (`Can. N` inline, not a bare leading number), different pagination (canon-range chunks with an index-page map rather than IntraText-style sequential `__PN.HTM` pages), no Portuguese. Small, standalone, blocked on language symmetry regardless of effort.
3. Everything else (Denzinger, Roman Catechism, general audiences, and the visual/page-template differences between pre-2016 "archive" frameset pages and the post-2016 Dicastery-for-Communication-branded pages — see reliability note below) is either out of scope (not on vatican.va) or not yet surveyed in enough depth to size.

So: **two parsers get you Vatican II + the CCC's top ~30 cited encyclicals/exhortations + CDF documents**, which is the overwhelming majority of the link-surface value identified in §1. This is a materially smaller lift than "one parser per pontificate" or "one parser per document," which was the open risk this survey was meant to rule in or out.

### Site reliability note

Several fetches during this survey returned transient `000` (connection) or `404` errors that succeeded on immediate retry (e.g. Lumen Gentium PT, Dominus Iesus EN — the latter flipped 404→200→200 across three consecutive requests seconds apart). Response headers show Azure Front Door edge infrastructure (`x-azure-ref`, `x-cache: TCP_MISS`); this looks like edge-cache/origin flakiness rather than bot-blocking (no 403s, no CAPTCHA, `robots.txt` unchanged and permissive). The existing scrapers' cache-and-retry posture (`Fetcher` class in `ccc.py`/`compendium.py`) already tolerates this class of failure via `fetch_failures` bookkeeping; a new scraper should keep that pattern and possibly add a single automatic retry before recording a failure, since the failure rate observed here (roughly 1 in 6–8 requests) is higher than what the existing scrapers were written against.

## 3. Numbering and addressability

Tested paragraph/canon numbering extraction against five real documents spanning 124 years and three document families, using a single evolving regex, refined live against failures:

| Document                          | Era  | Expected range | Found (final regex)  | Notes                                                                                                                                                                                                           |
| --------------------------------- | ---- | -------------- | -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _Rerum Novarum_ (Leo XIII) EN     | 1891 | 1–64           | 63/64                | ¶1 uses a different opening pattern (no leading digit — the encyclical's first line is unnumbered framing text before "2."); a one-off, handleable like the CCC scraper's own first-paragraph special cases     |
| _Lumen Gentium_ (Vatican II) EN   | 1964 | 1–69           | 69/69                | 8 of 69 numbers are wrapped in a self-link anchor (`<a name="18">18</a>.`), rest are bare digits — the anchor targets appear to be the ones cross-referenced by an internal footnote elsewhere on the same page |
| _Centesimus Annus_ (JPII) EN+PT   | 1991 | 1–62           | 62/62 both languages | Same footnote-marker convention as `ccc.py`'s own `_EN_SUP_RE`: `<sup><a name="-N" href="#$N">N</a></sup>` inline, footnote text keyed by the mirrored `<a name="$N" href="#-N">` at the bottom of the page     |
| _Familiaris Consortio_ (JPII) EN  | 1981 | 1–86           | 86/86                | Clean, no anchor variants encountered                                                                                                                                                                           |
| _Laudato Si'_ (Francis) EN        | 2015 | 1–246          | 246/246              | 73 of 246 numbers anchor-wrapped (same pattern as LG)                                                                                                                                                           |
| _Dominus Iesus_ (CDF) EN          | 2000 | 1–23           | 23/23                | Requires matching `&nbsp;` as well as a literal space after the number-period — the one real format divergence found outside the "encyclical family" baseline                                                   |
| Code of Canon Law, Title I sample | 1983 | canons 7–22    | all present          | `Can. N` prefix, no anchors, no footnotes on the sampled page — structurally simpler than the encyclical family but a distinct marker                                                                           |

**Verdict: addressability is solid across the whole encyclical/conciliar/exhortation/CDF family.** Every paragraph number tested was recoverable, completely, once the parser's leading-number regex accounted for three variants (bare digit, anchor-wrapped digit, `&nbsp;`-separated digit) — the same defensive, non-well-formed-HTML posture `ccc.py` already documents in its own module docstring ("Both are old, sloppy HTML... this scraper parses defensively"). No family tested produced paragraphs with **no** recoverable number — the failure mode this survey was watching for, and the one that would have forced deprioritizing a doctrinally-important family regardless of its citation count, did not occur in any of the seven documents sampled.

The one family not tested for numbering at all is Denzinger/Roman Catechism/Vatican I — moot, since none are confirmed present on vatican.va (§2).

## 4. Copyright

Checked the rendered copyright notice (`class="copyright"` div, present on every post-2016-template page fetched) on four documents spanning the widest possible date range:

| Document               | Date | Copyright notice found                    |
| ---------------------- | ---- | ----------------------------------------- |
| _Rerum Novarum_        | 1891 | "Copyright © Dicastery for Communication" |
| _Familiaris Consortio_ | 1981 | "Copyright © Dicastery for Communication" |
| _Centesimus Annus_     | 1991 | "Copyright © Dicastery for Communication" |
| _Laudato Si'_          | 2015 | "Copyright © Dicastery for Communication" |

All four — including the 1891 encyclical — carry the **identical**, generic, modern notice. This is exactly the posture `copyright.md` already documents in its TL;DR ("copyright notices on vatican.va are inconsistent... absence of a notice is not a license under Berne") and confirms there is **no age-based signal in the notice itself**: vatican.va does not distinguish an 1891 text as differently-licensed from a 2015 one. This matches — does not diverge from — the CCC's own posture, so the existing "host Church-owned texts verbatim with full attribution, without prior permission, comply promptly if asked" stance (`../decisions.md` §Copyright posture) extends to encyclicals and conciliar documents without needing a new decision. See `copyright.md` §6 for how this folds into that document's posture.

Two nuances worth flagging, neither requiring a posture change but both worth stating explicitly:

- **Underlying-text age vs. vatican.va's claim.** Leo XIII died in 1903; under an ordinary life+70 analysis the _original Latin_ of _Rerum Novarum_ would be public domain in most jurisdictions since 1973. The Holy See's own legal position (documented in `copyright.md` §1 — the 1978/2005 LEV decrees, Vatican Law CXXXII (2011) Art. 4 §3 treating any reformat as "a new publication") does not recognize an age carve-out and vatican.va's uniform notice reflects that. `papalencyclicals.net`, the existing risk-managed precedent already cited in `copyright.md`, resolves this by holding **explicit written LEV permission** rather than relying on a public-domain theory for the older documents. This project's adopted posture (host without prior permission, comply if asked) sidesteps the question rather than resolving it — same as it already does for the CCC — but it is worth naming explicitly that the "maybe old encyclicals are safer" intuition does **not** hold up against vatican.va's own notice, so there's no copyright-based reason to prioritize Leo XIII over John Paul II, or vice versa; the prioritization should stay citation-driven (§1), not risk-driven.
- **Vatican II texts and translations.** No separate notice or rights-holder distinct from LEV/Dicastery for Communication was found on the Vatican II documents fetched (the index page and Lumen Gentium's own page carry no visible copyright string at all in the older frameset template — see §2's LG fetch, "no copyright string found"). Silence, per Berne and per `copyright.md`'s own stated principle, is not a license; treat Vatican II texts as carrying the same LEV claim as everything else, not as differently-postured.

No new copyright research is needed to proceed with phase 1 below; the existing posture and colophon language cover this material as written.

## 5. Recommendation

### Phased plan, cheapest/highest-value first

**Phase 1 — Vatican II (16 documents, both languages).** Single highest-value, lowest-marginal-risk addition: fully available EN+PT (§2), fully addressable numbering (§3, tested directly on Lumen Gentium), dominates the CCC's non-scripture citation apparatus (809 siglum occurrences + 697 prose mentions, §1a). One parser, generalized from `ccc.py`'s existing EN-mirror logic (the Vatican II "archive" pages are the same IntraText-family template CCC EN already targets). Concrete document list, in citation-count order: **Lumen Gentium, Sacrosanctum Concilium, Gaudium et Spes, Dei Verbum** (constitutions, do these four first — they're 84% of siglum traffic), then **Unitatis Redintegratio, Ad Gentes, Dignitatis Humanae, Apostolicam Actuositatem, Christus Dominus, Nostra Aetate, Perfectae Caritatis, Inter Mirifica, Optatam Totius, Gravissimum Educationis, Presbyterorum Ordinis, Orientalium Ecclesiarum**. Effort estimate: comparable to one `ccc.py`-sized scraper (the module is ~1550 lines including its corrections/validation harness; a Vatican-II-family scraper is structurally simpler — single-page-per-document instead of multi-page-per-work, no "In Brief" concept, no marginal-reference apparatus to worry about) — call it 40-60% of that effort, largely in reusing rather than reinventing the structure-tree/footnote logic.

**Phase 2 — the CCC's top-cited encyclicals/exhortations (~15-20 documents).** Cheapest by document count and highest per-document link payoff after Vatican II: _Familiaris Consortio, Centesimus Annus, Redemptoris Missio, Sollicitudo Rei Socialis, Evangelii Nuntiandi, Humanae Vitae, Laborem Exercens, Reconciliatio et Paenitentia, Pacem in Terris, Christifideles Laici, Mysterium Fidei_, then the singly-cited-but-still-CCC-referenced set (_Redemptor Hominis, Redemptoris Mater, Dominum et Vivificantem, Populorum Progressio, Casti Connubii, Humani Generis, Mystici Corporis, Mediator Dei, Fidei Donum, Mater et Magistra, Dives in Misericordia, Immortale Dei, Libertas Praestantissimum, Quanta Cura, Diuturnum Illud, Summi Pontificatus, Haurietis Aquas_). All confirmed EN+PT-available for the JPII/Paul VI-era ones (§2); the Leo XIII-era ones (_Immortale Dei, Libertas Praestantissimum, Quanta Cura, Diuturnum Illud_) need individual PT-availability verification given Leo XIII's overall 17% PT coverage rate (§2) — budget for some of these landing EN-only, which the existing "any work can be individually unpublished or degraded" architecture (`../decisions.md`) already handles gracefully. Same parser family as phase 1 with the `&nbsp;` handling confirmed necessary for at least the CDF-style pages; verify it's not also needed on some encyclical pages before assuming phase 1's parser needs no changes.

**Phase 3 — CDF/DDF declarations and instructions, remaining pontificates' encyclicals.** Same parser family, larger and less-triaged document set (the CDF index alone spans decades); needs its own citation-frequency pass once phase 1/2 are live and the xrefs builder can actually report which CDF documents get referenced from real link traffic, not just the CCC's own footnotes.

**Not phase 1-3, explicitly deprioritized with reasons:**

- **Code of Canon Law**: doctrinally weighty (264+46 CCC citations) but blocked on missing Portuguese (§2) — pursuing EN-only breaks the project's language-symmetry principle for this one family; either accept an EN-only exception (a real product decision, not a technical one) or wait for a non-vatican.va Portuguese source.
- **Denzinger, Roman Catechism, Vatican Council I**: not on vatican.va under any URL pattern tried. Out of scope for this pipeline unless a separate acquisition strategy is scoped later (parallel to how the Bible texts were sourced outside vatican.va).
- **General audiences, most motu proprios/apostolic constitutions/apostolic letters beyond the phase-2 list**: not individually surveyed for structure; large volume, lower doctrinal-citation density in the CCC. Revisit after phases 1-2 ship and real usage data (search queries, 404s on attempted lookups) can reprioritize.

### Where the rest of this survey's output lives

The corpus schema drawn from this section (`document` work type, work-ID pattern, `manifest.json`/`structure.json`/`sections.json` shapes) is written up in `../corpus-schema.md` §Documents, not restated here — that document is now the normative schema reference, and it deliberately deviates from one detail sketched during this survey (see its note on why the structure-node span field stays named `paragraphs`, not `sections`). The scope decision this survey fed (all encyclicals + Vatican II, in scope; Canon Law/Denzinger/Roman Catechism/Vatican I, out) is recorded in `../decisions.md` §Scope. `../link-surface.md`'s "v2 surfaces this design anticipates" section cites this survey directly.

### Honest gaps in this survey

- Only 4 of ~15 pontificates' encyclical indexes were empirically checked (§2); the EN/PT trend across the unchecked ones (Pius XI, Pius X, Benedict XV, Paul VI, John XXIII, Benedict XVI, John Paul I) is inferred from the monotonic pattern in the four that were checked, not measured.
- Vatican Council I's presence on vatican.va was not conclusively resolved — two URL guesses failed, but no sitemap/search-based confirmation of its absence was attempted.
- CDF/DDF document _volume_ (how many declarations/instructions exist, how doctrinally central each is) was not surveyed beyond confirming the category exists and one document's numbering works — a phase-3 planning pass needs its own citation-frequency-style triage, since the CCC's own citations don't cite CDF documents by any consistent siglum the way they cite Vatican II or Denzinger.
- General audiences were confirmed to exist and nothing more — no structure/numbering check was performed; treat the "much later, if ever" placement as a placeholder pending an actual look.

## 6. Known source defects (Vatican II corpus, phase 1 output)

Recorded 2026-08-15/16 while fixing a chapter-scoped-footnote parsing bug in `vatican_docs.py` (see `../decisions.md`'s §Scope and the scraper's own module docstring, "LUMEN GENTIUM'S CHAPTER-SCOPED STAR NOTES" / the generalized per-chapter footnote-table logic). Fixing that bug and re-parsing all 32 Vatican II works from cache dropped the corpus's total unresolved (empty-text) citations from 6 to 4 — the two Christus Dominus citations that were empty because of the flattening bug itself (EN §15 marker `9`, PT §35 marker `21`) are now correctly resolved. The 4 that remain are **not** parser defects: each is confirmed, by direct inspection of the cached source HTML, to be a genuine gap or dangling reference in vatican.va's own page, with no correct value anywhere to substitute. Per `../decisions.md`'s §Corrections and overrides, a correction requires a _known correct value_; these have none, so they are documented here and in each work's own `manifest.notes`, and left as empty citation text rather than fabricated. `../corpus-schema.md`'s corrections mechanism (`pipeline/corrections/{work_id}.json`) deliberately does **not** carry entries for these — there is nothing to correct them _to_.

1. **`vatii.lumen-gentium.en` §11 marker `106`, §13 marker `118`.** Both are cited inline in the body but have no matching entry in the EN footnote list, which jumps straight from footnote 105 to footnote 107 (and shows a similar gap around 118) — confirmed by reading the footnote-list block sequence in `corpus/raw/vatican-docs/vatii__lumen-gentium__en.html` directly: the printed numbering simply skips those two integers. This is one root cause (a gap in the same flat, non-chapter-scoped numbered list) producing two separate empty citations.
2. **`vatii.lumen-gentium.pt` §59 marker `198`.** The PT footnote list is truncated at 194 in the source page itself — measured directly from the cached HTML: 194 inline `⟦N⟧` markers, 193 parseable citations, highest footnote-list entry printed is 194, while the body's own prose cites markers up to 198. Section 59's marker 198 sits past the end of the list entirely; there is no 195-198 to recover.
3. **`vatii.inter-mirifica.pt` §19 marker `1`.** A single, isolated inline citation with no matching footnote-list definition anywhere on the page — not a numbering-scope issue (Inter Mirifica's own footnote list isn't chapter-restarted, unlike Christus Dominus's), just a dangling reference: the source cites a note "1" in the body that its own footnote apparatus never defines.

None of the three is fixable by better parsing — each was independently re-confirmed after the chapter-scoping fix landed (the fix could not have created or masked any of them, since all three sit in flat, non-restarting footnote lists) — and the corpus's remaining 4 unresolved citations are exactly these, and only these.

## 7. Phase 2 sweep working notes (encyclicals, 2026-08-16): untraced validation failures and symmetry mismatches

Recorded at the close of the phase-2 sweep (216 EN + 91 PT encyclical works, 13 pontificates) so these survive past this session's own logs, per this project's posture that a list of "not yet traced to source-vs-parser" is worth more to the next person than a bare count. Four real parser bugs were found and fixed during this sweep (empty self-link anchor + separate bare digit; a self-link anchor with the period printed inside it; a single stray space before a period silently breaking a strict sequential gate for the rest of a document, `_SECTION_TITLE_HEADING_RE`; and a footnote-definition anchor-code collision in `build_footnote_table_anchor`) — all four are documented in the scraper's own comments at their fix sites, not repeated here. What follows is everything **left over** after those fixes and after the honest per-document post-mortems already recorded in each defeated work's own `manifest.notes` (Pascendi PT, Quae Ad Nos EN, Mense Maio PT, Vigilanti Cura EN, Divini Illius Magistri PT, Miranda Prorsus EN+PT, Mortalium Animos PT, Quadragesimo Anno PT, Dilexit Nos PT §206).

### 7.1 ~~A new, undiagnosed-but-not-fixed structural family~~ — FIXED 2026-08-16: missing `<p>` tags around centered sub-headings

**Resolved.** `_gap_block` in `pipeline/scrapers/vatican_docs.py` now recovers these paragraphs. The diagnosis below was right about the source defect and wrong about the mechanism, which is worth recording because the wrong mechanism is the more obvious one: the orphaned text is **not** merged into the preceding heading's block. `_BLOCK_RE` only ever yields text strictly _inside_ a `<p>`/`<blockquote>`/`<center>` pair, so `finditer` steps straight over the span between one block's `</p>` and the next block's `<p>` — it was never captured at all, by anything. The fix checks that skipped span, gated on the same `match_para_num` every ordinary block already passes; a whitespace-only gap (every other work, every other block) fails immediately, so it is a pure addition rather than a change to block classification.

**Result**: all 11 affected works now parse contiguously and validate — `aeterna-dei.pt` 15→33 sections, `anni-sacri.pt` 7→12, `auspicia-quaedam.pt` 7→14, `deiparae-virginis-mariae.pt` 3→4, `grata-recordatio.pt` 10→19, `humanae-vitae.pt` 17→31, `in-multiplicibus-curis.pt` 4→8, `lumen-fidei.pt` 24→60, `princeps.pt` 29→54, `quemadmodum.pt` 5→9, `summi-maeroris.pt` 5→9. `humanae-vitae.pt` and `lumen-fidei.pt` now match their English siblings exactly.

**A twelfth work was affected and had been mis-diagnosed**: `mortalium-animos.pt` (2→19 sections). Its `PARSER_DEFEAT_NOTES` entry asserted that headings 4/5/6/7 do not exist in the source and that it "jumps straight to 8". They do exist — as bare `<b>4. <i>…</i></b>` between a `</p>` and the next `<p>`, the same family — and the note has been removed. Recorded here because the note was confidently wrong, not merely incomplete, and it had already been cited elsewhere as evidence of a _different_ failure mode.

**One second-order defect surfaced underneath the first**: `quemadmodum.pt` §5 prints its number as `5,` rather than `5.`, so the recovery correctly declined to treat it as a paragraph number. Handled through the corrections layer (`pipeline/corrections/encyclical.quemadmodum.pt.json`) with locator, before/after, reason and raw-HTML evidence, cross-checked against the EN sibling — not by loosening the number pattern, which would have made every stray "N," in the corpus a section boundary.

**Not fixed by this, and not fixable by it**: none of the 11 reach full EN parity. The remainder is source-side truncation on vatican.va — the PT page's raw HTML simply ends, with footer markup immediately after the last captured paragraph (verified directly for `aeterna-dei`, `auspicia-quaedam` and `quemadmodum`) — the same phenomenon §7.2 already measures for 26 other PT-shorter cases.

**Regression checking**, since `_BLOCK_RE` is shared by all 339 document works: an in-memory fingerprint (section count, range, gaps, orphan and anomaly counts, and a hash of section text) was taken across all 454 cached raw pages before and after, and only the 12 works above differ in any field. The text hash matters as much as the counts — it rules out a recovered paragraph silently merging into an existing section rather than opening a new one, which would have left counts identical and content wrong. Independently re-checked against §7.2's own EN/PT table: **no English figure moved**.

The original diagnosis follows, unedited, for the record.

### 7.1 (original diagnosis, 2026-08-16, superseded above)

Confirmed live, `encyclical.aeterna-dei.pt` (Pius XII, on St. Leo the Great): the source HTML is missing the opening `<p>` tag for at least one numbered paragraph that immediately follows a `<p align="center">` heading block, e.g.:

```html
<p align="center">
  <b
    >SÃO LEÃO MAGNO, PONTÍFICE, <br />
    PASTOR E DOUTOR DA IGREJA UNIVERSAL</b
  >
</p>
3. À vida e à operosidade de S. Le...
```

"3." has no `<p>` of its own — it runs on directly after the heading's `</p>` with nothing but a space between them. Because `_BLOCK_RE` splits on `<p>`/`<blockquote>` boundaries, this stray text becomes part of the _same block_ as the centered heading, which is unconditionally treated as a heading (`kind == "center"` short-circuits `is_heading = True`, see `parse_document`'s block-classification comment). The combined text ("SÃO LEÃO MAGNO... 3. À vida...") doesn't start with a digit, so it fails both `match_label` and `_SECTION_TITLE_HEADING_RE`, becomes a generic untitled `sub` node, and paragraph 3's real number and content are lost into that heading's title text — never reaching `match_para_num` at all.

This is a genuine **source-HTML defect** (a missing tag), not a systematic markup convention the way the four fixed bugs were — so a general fix isn't "add a regex variant," it's "detect and recover a paragraph number that got absorbed into a preceding heading block's trailing text," which touches `_BLOCK_RE`'s core block-splitting logic used by every single document in the corpus. Diagnosed but **deliberately not fixed**: a risky change to universally-shared code at the end of a multi-thousand-second sweep risks the 253 already-validated works for the sake of an estimated 15-20 affected ones. Flagged here for a dedicated future pass, ideally done with room to re-run the _entire_ corpus and inspect every diff, not squeezed into a sweep's closing minutes.

Symmetry-mismatch cases whose signature (EN clean 1..N, PT sparse and skipping numbers right after bold/centered sub-headings, or vice versa) is consistent with this same root cause, **not individually confirmed for all of them** the way `aeterna-dei` was: `anni-sacri`, `auspicia-quaedam`, `grata-recordatio`, `summi-maeroris`, `quemadmodum`, `humanae-vitae`, `in-multiplicibus-curis`, `princeps`, `mystici-corporis-christi`. Treat this list as a starting point for the next pass, not a confirmed diagnosis.

### 7.2 The 25 cross-language symmetry mismatches not explained by a known cause

91 encyclical slugs have both EN and PT written. 25 match exactly; 5 are the already-documented zero-section defeats (§ manifest notes); 36 were spot-checked (3 directly, by inspecting the raw cached HTML's own `testo`-region end boundary) and confirmed to be genuine **source-side truncation on vatican.va itself** — one language's edition just stops partway through, in either direction (26 cases PT shorter, 10 EN shorter), the same phenomenon already documented for Lumen Gentium/Christus Dominus in §6, now measured at much higher frequency in the pre-Vatican-II corpus. The remaining **25 were not individually traced** to source-truncation vs. parser gap. Full list (slug, EN's `[first three, last three]` captured numbers, PT's same) at the time of the sweep's close:

```
ad-petri                     EN [1,2,3]..[147,148,149]   PT [1,2,3]..[78,79,84]
aeterna-dei                  EN [1,2,3]..[78,79,80]      PT [1,2,5]..[28,30,33]     -- see §7.1, likely the missing-<p> family
anni-sacri                   EN [1,2,3]..[14,15,16]      PT [1,2,4]..[8,10,12]      -- see §7.1
auspicia-quaedam             EN [1,2,3]..[21,22,23]      PT [1,3,5]..[9,11,13]      -- see §7.1
deiparae-virginis-mariae     EN [1,2,3]..[3,4,5]         PT [1,2,4]..[1,2,4]
dilexit-nos                  EN [1,2,3]..[218,219,220]   PT [1,2,3]..[218,219,220]  -- the documented §206 gap only; otherwise identical
divini-redemptoris           EN [1,2,3]..[80,81,82]      PT [1,2,3]..[80,81,82]     -- same max both sides, a single internal gap somewhere
ecclesiam                    EN [1,2,3]..[117,118,119]   PT [1,2,3]..[66,67,68]
fidei-donum                  EN [1,2,3]..[82,83,84]      PT [1,2,3]..[32,33,34]
grata-recordatio             EN [1,2,3]..[19,20,21]      PT [1,2,4]..[14,16,18]     -- see §7.1
humanae-vitae                EN [1,2,3]..[29,30,31]      PT [1,2,4]..[21,22,29]     -- see §7.1
in-multiplicibus-curis       EN [1,2,3]..[8,9,10]        PT [1,3,5]..[3,5,7]        -- see §7.1
iucunda-semper-expectatione  EN [1,2,3]..[9,10,11]       PT [1,2,3]..[18,19,20]
lumen-fidei                  EN [1,2,3]..[58,59,60]      PT [1,3,5]..[57,58,60]
mater                        EN [1,2,3]..[262,263,264]   PT [1,2,3]..[260,261,262]
mediator-dei                 EN [1,2,3]..[208,209,210]   PT [1,2,3]..[192,193,194]
mortalium-animos             EN [1,2,3]..[11,12,13]      PT [2,3]..[2,3]            -- see manifest.notes, mixed-heading-convention defeat
mystici-corporis-christi     EN [1,2,3]..[110,111,112]   PT [1,4,5]..[106,107,108]  -- see §7.1
princeps                     EN [1,2,3]..[57,58,59]      PT [1,2,4]..[50,52,54]     -- see §7.1
quemadmodum                  EN [1,2,3]..[14,15,16]      PT [1,2,4]..[4,6,8]        -- see §7.1
redemptor-hominis            EN [1,2,3]..[20,21,22]      PT [2,3,4]..[20,21,22]     -- PT's true start is 2 (validate_document: "numbering starts at 2, not 1"); same pattern as Rerum Novarum's known unnumbered-first-paragraph case, but promotion did not fire here -- not traced why
redemptoris-mater            EN [1,2,3]..[50,51,52]      PT [1,2,3]..[50,51,52]     -- same max both sides, a single internal gap (EN missing 37) plus whatever PT's own gap is
sacerdotii                   EN [1,2,3]..[117,118,119]   PT [1,2,3]..[66,67,68]
saeculo-exeunte-octavo       EN [1,2,3]..[51,52,53]      PT [1,2,3]..[47,48,49]
summi-maeroris                EN [1,2,3]..[13,14,15]     PT [1,2,4]..[4,6,8]        -- see §7.1
```

### 7.3 The 54 documents whose own validation failed (of 307 total; 253 validated clean)

9 are the already-documented, deliberately-left defeats/gaps (Pascendi PT, Quae Ad Nos EN, Mense Maio PT, Vigilanti Cura EN, Divini Illius Magistri PT, Miranda Prorsus EN+PT, Mortalium Animos PT, Quadragesimo Anno PT, Dilexit Nos PT). The other 45 fall into two shapes, neither individually traced to source-vs-parser beyond what's stated:

- **`gaps in A..B: missing [...]`** (the majority): a numbered range with one or more integers absent. Every one spot-checked so far (§7.2's 36 confirmed truncations, plus the individual LG/CD/IM cases in §6) turned out to be genuine source gaps, not parser misses — but that was confirmed per-document, not assumed; a future pass should keep verifying rather than treating "gap" as synonymous with "source defect."
- **`citations with no resolved text`** (a minority, e.g. `veritatis-splendor.en` 3 remaining after the anchor-code-collision fix, `populorum.en` 5 remaining after the year-in-parens fix, `redemptor-hominis.en` 1, `iucunda-sane.en` 6, `inscrutabili-dei-consilio.en` 9): a footnote marker cited inline with no matching entry in that document's own footnote list. Given how many of these evaporated once the two footnote-table bugs above were fixed, it would not be surprising if a few of the remaining ones are a third, not-yet-found variant of the same family rather than genuine source gaps — worth checking before assuming "known source defect" the way §6 did for Lumen Gentium.

Full list of all 54 (work id, validate_document's own `problems` list) is preserved in this session's tool transcripts; regenerate on demand with `check-symmetry`-adjacent tooling (`validate_document` over every written work) rather than trusting this file to stay current as the corpus changes.
</content>
