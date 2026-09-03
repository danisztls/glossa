# Prayers beyond vatican.va: the survey for the remaining interface languages

Survey conducted 2026-09-02 (read-only: web search plus live page checks, and a scan of the corpus already on disk — no capture, no ingestion). Written up 2026-09-03 at the point where the work that costs no fetches was finished and the work that costs fetches had not begun. Companion to `prayers.md`, which is the original proposal and describes the vatican.va half; `copyright.md` for the rights posture; `pipeline/CLAUDE.md` §Prayers for what the code does today.

**This document exists so that the next wave can be started or abandoned on evidence rather than re-surveyed.** It is not a plan of record — it is what a survey found, what was decided, and the one decision that was left open.

## TL;DR

**vatican.va is exhausted.** Fourteen editions of the Compendium, ten HTML and four PDF, are all read; every one of them now carries the two Creeds, the Our Father and the Hail Mary. There is no Catechism and no Compendium in Polish, Dutch, Czech, Slovak, Croatian, Vietnamese, Korean, Tagalog, Ukrainian, Finnish, Danish, Latvian, Swahili, Hebrew, Hindi, Malayalam or Igbo, so nothing further is reachable by re-parsing.

**Fourteen of the thirty-four interface languages have prayers; twenty do not.** Those twenty are `ar cs da fi he hi hr ig ko lv mg ml nl pl sk sw tl uk vi zh`. Thirteen of them were surveyed for a national bishops'-conference source — `mg pl nl cs sk hr fi da lv vi ko tl uk` — and the remaining seven (`ar he hi ig ml sw zh`) were not, on the ground that a conference source in those languages was not expected to be findable by the same method and none was stumbled on.

**The survey does not come back clean, and that is its value.** Three languages are ready to capture, five need more digging, three are risky, and one cannot be sourced at all without breaking the rule this corpus runs on. **Two of them defeat the two-witness rule outright**, and that is the rule working rather than failing: no amount of searching makes a second witness exist where there is only one publisher.

## 1. Why this is a separate wave, and why it is last

Everything before it cost **no fetches**. The Compendium prints the two Creeds and the Our Father in its own body, in the same file Appendix A was already being read from, and the four PDF editions had been in `raw/` since August — so eleven editions were completed and four created out of files already on disk. This wave is the opposite: thirteen languages, twenty-six or so captures from hosts nobody here has ever fetched from, a small reader each, and a rights position to record per edition.

**Its risk is not parsing but sourcing.** A conference page is a handful of prayers in one language on one page; the reader for it is fifty lines. What is hard is knowing that the text is what the Church in that country actually prints. That is why the wave is per-language and why it is last: a language whose witnesses disagree is held back on its own, and the others still ship.

## 2. The three decisions already taken

Taken 2026-09-02 before the survey was acted on, and they still hold:

- **Go past vatican.va to national bishops'-conference sources**, for the languages where one clearly exists. Not to devotional sites, not to aggregators.
- **Ship what exists.** A three-prayer edition is published and labelled as such rather than withheld. The site's partial-edition machinery was built for `prayer.common.en-gb`'s five of twenty-eight and generalises; `prayer.common.la` has always been 24 of 28.
- **Two witnesses must agree**, normalised for case, punctuation and whitespace, for anything sourced outside vatican.va. This is the standard `prayer.common.la` already holds itself to, and it needs nobody to read the language. **A disagreement is recorded, not resolved by preference.**

## 3. What the sources can and cannot give

**The Catechism never prints the Hail Mary whole.** Every occurrence in `ccc-la` is commentary quoting a phrase. So a language sourced from a national Catechism reaches three of the four prayers and never all four — the Hail Mary has to come from somewhere else, or the edition ships as three and says so.

**The nearest thing to a general answer is a national Catechism**, which several conferences do host. It is the same shape `ccc-la` already gives Latin: where a conference hosts the Catechism, the Creeds and the Our Father are in it, in catechetical paragraphs rather than as a list.

**Malagasy is not the free win it looked like.** Its Catechism mirror on vatican.va omits the two-column Creed box entirely — `185-421_mg.html` runs from ¶193 to Chapter One with commentary only, and the ¶2759 file's first blockquote is a patristic quotation, not the Our Father. Checked directly, 2026-09-02. So `mg` belongs in this wave and not the previous one.

## 4. The survey, by tier

**The hosts below were reached and read; the exact paths were not all recorded, so treat the host and the finding as the result and re-confirm the URL at capture time.** Nothing here has been fetched into `raw/`.

### Ready — two properly-hosted sources each

| Lang | What was found                                                                                                                                                                  |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `da` | The best in the set. `katolsk.dk` carries all four prayers with the Latin on one clean page; corroborated by Danmarks Unge Katolikker.                                          |
| `nl` | Both Creeds in a table on `rkkerk.nl`, the conference's own portal; the Hail Mary on the National Liturgy Council's site.                                                       |
| `cs` | A `cirkev.cz` page plus `modlitba.cz` — one of the very few pages found anywhere that names the Nicene Creed alongside the Apostles' rather than printing only the shorter one. |

### Workable, more digging

| Lang | The catch                                                                                                                                                                                                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ko` | CBCK confirms the 2018 _가톨릭 기도서_ as the authorised book but hosts a preface, not the text. The verbatim text was found via Catholic Peace Broadcasting citing that book — so the second witness is a broadcaster quoting the first, which may not be independent enough. |
| `lv` | `katolis.lv` scatters the four across subpages, and **its Hail Mary was never directly confirmed**.                                                                                                                                                                            |
| `hr` | HBK hosts the whole Catechism as one large PDF. The text is in there, in catechetical paragraphs rather than as a list. `PdfSource` (added in the PDF-editions wave) is the shape that reads it.                                                                               |
| `vi` | HDGM Vietnam has the prayers, buried inside essays of ~7,600 words.                                                                                                                                                                                                            |
| `pl` | **`episkopat.pl` has no prayers page at all.** Falls back to Opoka and a diocesan PDF — legitimate, one step further from the conference than the tier above.                                                                                                                  |

### Risky

| Lang | Why                                                                                                                                                                                                                                                                                                                                                          |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sk` | The one KBS-hosted Catechism page is JS/frames and returns no text. The fallbacks are parish sites.                                                                                                                                                                                                                                                          |
| `fi` | **Finland has exactly one Catholic publisher** — `katolinen.fi`, the single national diocese. Every other Finnish prayer page found is Evangelical Lutheran, **whose Our Father differs at the doxology**, so a careless second witness is worse than none.                                                                                                  |
| `uk` | Sourced on both rites: `rkc.org.ua` for the Latin rite, `docs.ugcc.ua` plus the UGCC catechism for the Byzantine. Their Our Father matches word for word. **But the Byzantine Marian prayer may be the Theotokos hymn rather than the Ave Maria** — unchecked. Do not treat the two rites as agreeing witnesses beyond the Our Father until that is settled. |

### Not sourceable today

| Lang | Why                                                                                                                                                                                                                                                                                                                                    |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tl` | CBCP hosts no prayer text. The one legitimate national catechism — the _Catechism for Filipino Catholics_, CBCP/ECCCE with Word & Life Publications — is not hosted verbatim by either rights holder. Every copy found is a blog, Scribd or pdfcoffee mirror. Publishing from those would break the sourcing rule this corpus runs on. |

`mg` was not surveyed for a conference source; only its vatican.va Catechism was checked (§3).

## 5. The open decision

**Finnish and Tagalog defeat the two-witness rule, and nothing about them will change with more searching.** Finland has one Catholic publisher in the country; Tagalog has none hosting the text. The options are:

- a **single named source with the departure recorded** — in the manifest, in the same voice `latin_unreadable` and `absent` already use, so a reader can see that this edition was held to a weaker standard than the rest; or
- **leave those two out**, and let `CONTENT_LANG_FALLBACK` carry those readers as it does today.

This was put to the person directing the work on 2026-09-03 and not answered. **It is not a judgment call to take mid-task** — it is a decision about the standard the corpus holds itself to, and it belongs with the same person who chose the two-witness rule in the first place. Nothing in this wave should start on `fi` or `tl` until it is settled; the other eleven do not depend on it.

## 6. The corpus cannot supply a third witness, and that was checked rather than assumed

The Magisterium is held in most of these languages, so a document quoting the Our Father in full would have been a Vatican-published witness for free. **Scanning all 1,983 `sections.json` and `appendix.json` files for each language's opening words found one Czech work, one Latvian and four Swahili — every one a phrase inside running prose, none a prayer text.** There is nothing to reuse. (Re-run the scan before relying on this: the corpus has grown since, and the answer is cheap to recompute.)

## 7. What the code already has, and the four things it does not

The waves before this one left more machinery in place than they needed, because these editions were foreseen:

- **`LangSpec` already carries** `absent` (entries the source does not print), `headed_but_empty`, `no_latin`, `latin_unreadable` (printed but unreadable — a fact about the file), `copyright_notice` and `copyright_note` (per-edition rights, which every one of these editions will need, since none of them is Libreria Editrice Vaticana), and `appendix_slugs`.
- **`expected_slugs()` composes the expectation from what the spec actually holds**, so a three-prayer edition validates as three prayers rather than failing against a 28-slug constant.
- **`PdfSource` exists** and dispatches in `read_source`, which is what Croatia's Catechism PDF needs.
- **`prayer_sources()` reads provenance off the `LangSpec`**, so a per-prayer source that is not a Compendium page is already expressible.
- **The site needs nothing for ten of the thirteen.** `mg pl nl cs sk hr fi da lv vi` are already in `ContentLang`, `LANGUAGE_NAMES` and (some) `CONTENT_LANG_FALLBACK`. All thirteen are already interface languages.

What is **not** in place, and each is small:

1. **`LangSpec.appendix` is `AnySource`, not `AnySource | None`.** Every edition so far has a Compendium appendix; a conference-sourced one has no Compendium page at all. `expected_slugs()` already composes from what is present, so nothing downstream branches — but the field and `build_manifest`'s source list have to allow the absence.
2. **`run()` requires a Rosary entry** and raises `f"{lang}: Appendix A parser produced no Rosary entry"` when the appendix produces none. With no appendix there is no Rosary, and that check has to move under "if there is an appendix".
3. **`build_manifest`'s first note and `creed_source_note` both assume a Compendium.** They are derived from the spec now rather than hardcoded, so the fix is a branch and not a rewrite — but an edition sourced from `katolsk.dk` must not describe itself as Appendix A of anything.
4. **`ko`, `tl` and `uk` are missing from `ContentLang` and `LANGUAGE_NAMES`** in `site/src/lib/`. An unnamed tag degrades silently to itself — `ccc.mg` offered itself in the edition menu as "mg" for five days (decisions.md §Languages). Add the row the same day the work ships, not after.

## 8. The shape of the work, per language

1. **Capture both witnesses into `raw/prayers-<lang>-<source>/`**, write-once, at whatever crawl delay each host asks for. This is the only wave that fetches from a host other than vatican.va, so read each `robots.txt` rather than assuming the two-second rule.
2. **A short reader per source.** The payload is four prayers; the cost is that there are twenty-six of them.
3. **`LangSpec` gains the edition** with `appendix=None`, `creeds`/`our_father` pointing at the chosen witness, and a `hail_mary` source (a field that does not exist yet — or the Hail Mary arrives through whichever source carries it).
4. **The collection's title comes from the source's own heading**, never invented — the rule the corpus already applies to every work title.
5. **Rights are per edition.** None of these is LEV. Romanian is the precedent already in the file: its Compendium is published in Romania by Editura Presa Bună under a LEV grant and the manifest records both.
6. **A disagreement between witnesses holds the language back** and is written down. That is the failure mode this tier is designed to have.

## 9. Where to stop

**If this needs trimming, cut from the end rather than the middle.** The three Ready languages are worth doing on their own — Danish, Dutch and Czech are three interface languages whose readers currently get English prayers, and each is an afternoon. The five Workable ones are the bulk of the wave. The three Risky ones and Malagasy are where the cost per language stops being predictable, and `fi`/`tl` should not start at all until §5 is answered.
