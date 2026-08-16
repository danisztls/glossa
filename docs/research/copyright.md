# Copyright status of the texts we want to host

Research conducted 2026-08-13 (Claude + researcher agent, ~34 sources; links at the end of each section).

## TL;DR

Essentially everything on vatican.va is under active, asserted copyright: the Holy See claims perpetual worldwide rights over all magisterial acts through the Libreria Editrice Vaticana (LEV), and the English CCC is separately administered by the USCCB in the US. There is a documented enforcement history — cease-and-desist letters to Flocknote ("Read the Catechism in a Year", ~100k subscribers) and to blogger Brandon Vogt (reformatting _Lumen Fidei_ as an ePub) — but enforcement is reactive, complaint-driven, and aimed at high-visibility redistribution. vatican.va has no terms-of-use page and a permissive `robots.txt` (`Allow: *`, `Crawl-delay: 2`), so scraping is technically unblocked but confers no reproduction right.

## 1. Who holds what

- **LEV holds the base copyright** over everything papal/magisterial. A 1978 decree plus the 31 May 2005 Sodano decree entrust LEV with "every moral copyright and all the exclusive financial rights — without any exception — permanently and throughout the world" over all acts of the papal Magisterium. Primary source: [LEV copyright page](https://www.vatican.va/roman_curia/institutions_connected/lev/docs_lev/copyright_en.htm).
- The Holy See is a **Berne member since 1935**; Vatican copyright law incorporates Italian Law 633/1941 (life+70). Enforceable in the US and Brazil.
- Vatican Law No. CXXXII (2011), Art. 4 §3: "**Reproduction in another format is considered, to all legal intents and purposes, to be a new publication of the work**" — converting vatican.va HTML into a database/reader is itself the restricted act.
- **Each vernacular CCC translation is a separate copyrighted work**, co-held by the local bishops' conference and LEV for that territory:
  - English (incl. the text on vatican.va): "© 1994 United States Catholic Conference — Libreria Editrice Vaticana"; **USCCB administers US permissions**. Canada: Concacan Inc.
  - Portuguese: published in Brazil by Edições Loyola / Edições CNBB; assume the same conference–LEV split with the **CNBB** as counterparty (inference from structural parallel; no published Brazilian permissions policy was found).
- Copyright notices on vatican.va are inconsistent (some modern encyclicals carry only "© Dicastery for Communication") — absence of a notice is **not** a license under Berne.

## 2. Licensing pathways (they exist)

- **USCCB, English CCC** ([Use of the Catechism](https://www.usccb.org/committees/catechism/use-catechism-catholic-church)):
  - Under 5,000 words: no permission needed, with exact notice, verbatim text.
  - Non-commercial over 5,000 words (i.e. hosting the whole CCC): **written permission required, royalty-free**. Submit the work for accuracy/consistency review; provide three copies; carry the exact notice. Discretionary — "hundreds of requests" a year, not all granted.
  - Commercial: permission + 10% of list price to the Holy See.
  - Serialization is prohibited (this is what killed Flocknote's daily-email project).
- **LEV grants permissions to free sites**: [Papal Encyclicals Online](https://www.papalencyclicals.net/about) (one layman, ad-free) holds explicit written LEV permission to reprint papal documents electronically. It hosts older documents and **links out to vatican.va for modern ones** — the operative risk-management pattern.
- LEV contact: `ufficiostampa.lev@spc.va` / LEV _ufficio diritti_. No self-service portal exists.
- **CNBB (Portuguese CCC)**: no published policy; would require writing to Edições CNBB directly.

## 3. Enforcement history (all letters, no lawsuits)

- **Flocknote / Matt Warner, 2012–13**: free daily CCC email, 100k+ subscribers → formal C&D from USCCB lawyers; shut down even after offering to pay licensing fees. ([CWR](https://www.catholicworldreport.com/2022/01/20/copyright-and-the-catechism-of-the-catholic-church-make-for-some-legal-surprises/))
- **Brandon Vogt**: free ePub reformattings of _Lumen Fidei_ taken down; documented other cases (podcasters, diocesan web staff reprimanded). ([Free the Word](https://brandonvogt.com/free-word/), [First Things](https://firstthings.com/free-the-word-on-copyright-control-of-catholic-texts/))
- **No GitHub DMCA takedowns found** from the Vatican or USCCB. Unlicensed CCC JSON datasets ([nossbigg/catechism-ccc-json](https://github.com/nossbigg/catechism-ccc-json), [aseemsavio/catholicism-in-json](https://github.com/aseemsavio/catholicism-in-json)), the reddit catebot (running since ~2014), and small CCC reference sites persist unmolested for years.
- Risk scales with visibility: Flocknote was fine until it was huge.

## 4. Bible translations (separate problem, different owners)

Bible rights are mostly held by **commercial publishers and para-church bodies** — NCC (RSV/NRSV), CCD/USCCB (NABRE: even _free_ digital apps require a license and fee), SBB, Paulus, Editora Ave-Maria. These enforce like ordinary publishers; the "free the word" political argument does not transfer to them.

Public domain options:

| Language   | Safe now                                                                                                              | Notes                                                                                                                                                                     |
| ---------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| English    | Douay-Rheims (Challoner), CPDV, WEB Catholic Edition, Clementine Vulgate                                              | WEB-C name is trademarked (use only for unaltered copies). See `bible-texts.md` for quality assessment.                                                                   |
| Portuguese | Figueiredo (1778–90, PD, archaic), Almeida 1819 (Protestant canon), Bíblia Portuguesa Mundial (PD, draft)             | Ave Maria, CNBB, Jerusalém, Peregrino, SBB versions: copyrighted, do not host.                                                                                            |
| Portuguese | **Matos Soares** — PD in Brazil/Portugal on **1 Jan 2028** (translator died 1957; life+70 from 1 Jan following death) | Currently circulates freely (liriocatolico, padrepauloricardo, archive.org) with no visible enforcement, but reprint rights are commercially active (Ecclesiae, Realeza). |

## 5. Adopted posture (decision, 2026-08-13)

Host the current texts (CCC, encyclicals — Church-owned material) verbatim with full attribution, **without prior permission, and comply promptly if asked** — explicitly as a political statement in the Vogt/"Free the Word" lineage. Scope notes:

- The statement applies to **Church-owned texts only** (LEV/USCCB/CNBB). Bible translations use public-domain texts (plus Matos Soares as a knowingly accepted, self-resolving exposure).
- Text stays **verbatim, complete, attributed**, with exact copyright notices — textual integrity is the rights holders' stated core concern.
- A **colophon page** states the position openly: free/ad-free/no accounts, verbatim reproduction, contact address, "rights holders may write and we will respond."
- Architecture makes takedown a config change: corpus out of the public git repo (fetched at build, gitignored — the [encyclicals-press](https://github.com/mggarofalo/encyclicals-press) model), per-document provenance metadata (source URL, retrieval date, edition), per-work unpublish/degrade-to-link-out fallback.
- Scraping: respect `Crawl-delay: 2` (≤0.5 req/s).

## 6. Encyclicals and conciliar documents (2026-08-15)

Checked the rendered copyright notice on four documents spanning the widest possible date range (`Rerum Novarum` 1891, `Familiaris Consortio` 1981, `Centesimus Annus` 1991, `Laudato Si'` 2015) — full methodology and table in `vatican-documents.md` §4. Two findings, stated plainly:

- **vatican.va serves the identical, generic "Copyright © Dicastery for Communication" notice on the 1891 encyclical as on the 2015 one.** There is no age-based signal in the notice itself — the Holy See's legal position (Vatican Law CXXXII (2011) Art. 4 §3, treating any reformat as a new publication) does not carve out older texts, and vatican.va's uniform notice reflects that. **There is therefore no copyright reason to prefer older documents when prioritizing what to ingest** — the "maybe Leo XIII is safer than John Paul II" intuition doesn't hold up against the site's own posture. Prioritization stays citation-driven (see `vatican-documents.md` §1), not risk-driven.
- **Vatican II documents carry no visible copyright notice at all** in the older frameset template they're served under. Per this document's own stated principle above, silence is not a license under Berne — treat Vatican II texts as carrying the same LEV/Dicastery claim as everything else, not as differently- or un-postured.

This matches, rather than diverges from, the CCC's existing posture (§5 above), so no new decision is needed — the adopted stance covers this material as written. One nuance worth naming: `papalencyclicals.net`, the precedent this document already cites (§2) as an existing risk-managed pattern, resolves the older-document question by holding **explicit written LEV permission**, not by relying on a public-domain-by-age theory. This project's posture (host without prior permission, comply if asked) is a different, more exposed risk posture for the same material — a deliberate choice already made in §5, not a gap this section surfaces, but worth restating now that the material in question has grown to include a 19th-century encyclical.

## Open questions

- St. Charles Borromeo's (scborromeo.org) permission basis for hosting the full CCC — unverified; they are the de-facto upstream for much of the ecosystem.
- EWTN's rights basis for its document library — undocumented publicly.
- Whether the CNBB has any permissions process for the Portuguese CCC.
- Magisterium AI's licensing is opaque; cannot be cited as precedent either way.
