# Getting read: paid search, citation, and the one country to try it in

Written 2026-09-12. **Nothing here is implemented.** A strategy pass, not a
plan: it exists because a Google Ads account was opened and the keyword list
Google proposed was wrong in a way worth writing down. Everything about the
corpus is measured locally; everything about Google's rules was fetched from
Google's own help pages on the date given; CPC is third-party benchmark data,
sourced and caveated in §7.1.

Companion to `audiences.md` (who arrives and where they stop),
`catholic-growth-and-catechism-languages.md` (where the Church is growing and
what it reads), `copyright.md` §5 (the posture a push makes more visible) and
`../../site/docs/usage.md` (the only measurement that exists).

## TL;DR

**Ads can only be a seeding mechanism, and the account's purpose is to find the
first few hundred readers who will paste a link.** There is no conversion event
on this site and there must not be one, so no campaign can be optimised — only
switched on, pointed somewhere narrow, and read afterwards through the
first-party beacon's country counter.

**Google's suggested keywords are unbuyable.** They are head terms for the
works, not for the apparatus: a person typing "the holy bible" already has a
Bible site and is navigating back to it. The buyable queries are the ones where
a reader arrives holding an **address** — the half of the audience
`audiences.md` says is already well served — because every one of those is a
page that is exactly the answer.

**The head/tail split is by market, not global.** Citation tails have volume in
rich countries and cost real money there; head terms have volume in poor
countries and cost cents. Buy the tail where clicks are expensive and the head
where they are cheap.

**Ad Grants is closed, for two independent reasons**, and the second one is not
about money: it mandates conversion tracking, which means third-party script on
the page, which the project's posture forbids.

**Brazil is an expensive ad market, not a cheap one** — within 11% of the United
States, above Germany and France, and 3–5× a sub-Saharan click (§7.1). The
cheap-Africa play that works is **English**, which is a doctrinal language across
the growth belt and the corpus's deepest, saving 55–74% with no content work.

**The country to try is still Brazil, in Portuguese** — not because it is cheap
or fastest-growing, but because the binding constraint is the maintainer's time
and it is the only market where that time is free. The Philippines is the
zero-preparation control to run beside it.

## 1. The constraint that decides everything else

A personal project, no nonprofit, severely limited time and budget, ads intended
only to bootstrap. Every recommendation below is ranked by **information or
readers per hour of the maintainer's attention**, not per dollar — dollars are
the cheaper of the two inputs here.

This rules out, permanently and not as a matter of sequencing: anything needing
monthly compliance attention, anything needing a legal entity, and any channel
whose unit of work is a weekly post.

## 2. Ad Grants is closed

Checked 2026-09-12 against Google's help pages. Recorded because it looks like
free money and the reasons it is not are non-obvious.

Eligibility in Brazil is real — Associations and Private Foundations both
qualify, validated by **Goodstack** (which replaced TechSoup). The costs are
what close it:

- **Setup**: estatuto approved in assembly and registered at the Registro Civil
  de Pessoas Jurídicas, then CNPJ. An associação also requires members and a
  diretoria named on a public record — it is not a one-person entity.
- **Ongoing**: mandatory monthly accounting regardless of revenue (ECF,
  DCTFWeb, EFD-Reinf, eSocial, RAIS, livros contábeis). Estimated
  **R$3,000–7,000/year to keep a dormant entity alive**, plus an annual assembly
  with a registered ata. Unfiled is worse than nonexistent: fines escalate
  against the CNPJ.

And the compliance regime punishes exactly the traffic a reference work
produces:

| Rule                                               | Consequence                                              |
| -------------------------------------------------- | -------------------------------------------------------- |
| 5% account-wide CTR, monthly                       | two consecutive months → deactivated                     |
| conversion tracking, ≥1 _meaningful_ conversion/mo | mandatory; vanity conversions are themselves a violation |
| no single-word keywords                            | policy violation                                         |
| no keywords at Quality Score 1–2                   | must be paused or removed                                |
| ≥2 ad groups per campaign, ≥2 sitelinks            | structural requirement                                   |

**The conversion requirement is the hard blocker, independent of the money.**
Google Ads conversion tracking means gtag on the page. `decisions.md` §Posture
commits to no third-party code, no cookies, nothing that identifies a reader.
Ad Grants cannot be taken without breaking that, so the entity question never
needs answering.

Same conclusion for paid ads: **run them with no conversion tracking at all.**
Accept that Google's optimiser has nothing to optimise toward, and read results
off the first-party beacon instead (§6).

## 3. What the suggested keywords get wrong

Google builds its suggestions by crawling landing pages and returning the
highest-volume phrase that nominally matches each section. For this site that
procedure cannot succeed, because the highest-volume phrase for every work we
hold is a **habit** query: "the holy bible", "the new testament", "the catholic
catechism", "canon law". The searcher already has a site for that and is
navigating back to it, against free incumbents twenty years old. Nothing
converts because there is nothing to convert to.

Three suggestions were also simply mismatched, which is worth recording as the
general form: **a crawler matching words cannot tell a work from a topic about
the work.**

- "canonization of the bible", "canon of scripture" — readers wanting the
  _history_ of the canon's formation. The word "canon" matched `/ius-canonicum`.
- "bible work" — BibleWorks is Bible software.
- "scriptural prayers", "prayers for the church with scriptures" — Protestant
  intercessory vocabulary; `/preces` is traditional Catholic prayer and will
  disappoint every click.

Of 25 suggestions, two survive as low-bid exact-match experiments ("the catholic
catechism", "canon law"). The rest are waste.

## 4. What is buyable: the address half of the audience

`audiences.md` §1 splits the audience by whether the reader arrives with an
**address** or a **question**, and records that address-holders are well served
by machinery built for exactly them while question-holders meet a wall. That
split is also the keyword strategy: **buy only address queries until the
question wall moves.**

Five families, best first:

1. **Citation lookups.** `CCC 2267`, `catechism paragraph 1324`, `canon 915`,
   `can. 1055`, `CIC canon 751`. The landing page is literally the answer,
   intent is unambiguous, and there are thousands of such pages — one per
   paragraph and one per canon. Volume per term is small; the family is large.
2. **Document titles, especially Latin incipits.** `Rerum Novarum full text`,
   `Humanae Vitae English`, `Fides et Ratio`, `Lumen Gentium 16`. Anyone typing a
   Latin incipit is a serious reader, and vatican.va's own search is the weakest
   part of the incumbent.
3. **The doctrinal office's documents.** The corpus holds far more CDF material
   than vatican.va's index exposes conveniently, and some of it is not reachable
   there at all. Queries like `Fiducia Supplicans text`,
   `Donum Veritatis English` have no good incumbent.
4. **The Latin and parallel axis.** `Vulgate with English`,
   `catechism in Latin`, `Codex Iuris Canonici Latin English`,
   `Clementine Vulgate online`. `ccc.la`, `cic.la` and `summa.la` are genuinely
   hard to find elsewhere. Tiny volume, devoted readers.
5. **Head terms, but only in cheap markets.** See §5.

**Negatives from day one**, because every one of these will otherwise arrive:
`free, pdf, download, app, audio, kjv, niv, esv, nkjv, verse of the day, quotes,
tattoo, sermon, devotional, study guide, bibleworks, software, jw, jehovah,
mormon, lds, lawyer, attorney, law firm, salary, jobs, prayer points`.

## 5. The inversion: head where clicks are cheap, tail where they are dear

The tail and the cheap-country thesis pull against each other, and noticing that
is the whole of the media plan. `catechism paragraph 2267` has effectively no
volume in Tanzania. Head terms have volume there and cost cents, while the same
terms are unaffordable in the United States.

So, by market:

- **Expensive markets** (US, UK, CA, AU, Western Europe, **and Brazil** — §7.1
  measures it within 11% of the United States): citation tail only, exact match,
  pennies per term, no head terms at any price.
- **Cheap markets** (Philippines, India, Kenya, Tanzania, Nigeria, South Africa,
  DR Congo): head terms in the local doctrinal language —
  `catechism of the catholic church`, `catéchisme de l'Église catholique`.

**Brazil sits on the expensive side of this line, which was a surprise** and is
the one place a plausible assumption about it was wrong. It does not change the
recommendation in §7, because that rests on the maintainer's time and on corpus
depth rather than on price — but a Brazilian campaign is a tail campaign, bought
the way a United States campaign is bought.

Four constraints on the cheap-market half, all of which bite before CPC does:

- **Catholic markers are mandatory.** In Nigeria, Kenya and the Philippines the
  dominant Christian search demand is Pentecostal — prayer points, sermon
  outlines, declarations. Without a Catholic-marked term (catechism, canon,
  novena, rosary, a Latin title) the budget buys a flood of cheap irrelevance,
  and cheap waste is still waste.
- **The payload, not the price.** The two largest client chunks are **124 KB and
  184 KB gzipped** (measured 2026-09-12). On metered 3G that is a cost borne by
  the reader. Throttle a canon page and fix the critical path before spending in
  a low-bandwidth market — the ad buys a click, the payload decides whether it
  became a reader. `../../site/docs/shell.md` owns the boot payload;
  `payload-granularity.md` has the prior measurement.
- **Land on the language.** The final URL must carry the prefix —
  `/pt/catechismus/2267`, never `/catechismus/2267`. An ad in Portuguese landing
  on English chrome bounces, and the route structure already supports the
  prefix.
- **Invalid clicks are worst where clicks are cheapest.** Exact match only, no
  Search Partners, no Display Network, and Google's auto-applied recommendations
  off — they re-add broad match silently.

## 6. Measurement: the beacon already answers this, and must not be extended

The instinct to install analytics before spending is right and the work is
already done. `../../site/docs/usage.md`: first-party, bucketed, unlinkable,
since 2026-08-27. Two of its fields are exactly the ad questions —

- **`geo_lang`**, a country × language counter with no key back to the session
  row, which is the before/after signal for a single-country campaign.
- **Retention buckets** (`1`, `4-7`, `15-28` days, from a 28-bit device-local
  bitmask), which answer whether arrivals became readers — the only outcome
  worth buying.

**What cannot be done, and must not be added: per-campaign attribution.** UTM
parameters, a gtag, or any per-visit identifier would break the posture that
makes the beacon defensible. So an ad month is read as a **delta on the target
country's counter, and the retention age distribution a month later** — not as a
conversion rate. That is weaker than a funnel and it is enough to answer "did
this buy readers".

Design consequence: **run one country at a time.** Without attribution,
concurrent campaigns in two countries are still separable by `geo_lang`, but
concurrent campaigns in one country are not separable at all.

## 7. The country to run it in

Ranked for a single experiment. Catholic populations are orders of magnitude from
standing references, not measured here; corpus depth is measured 2026-09-12
against `glossa-corpus/build`; CPC is sourced in §7.1.

| Country      | Content lang  | Corpus depth                          | CPC vs US        | Catholic-marked demand | Prep cost to maintainer                   |
| ------------ | ------------- | ------------------------------------- | ---------------- | ---------------------- | ----------------------------------------- |
| Brazil       | `pt` ✓        | second-deepest; CCC, Compendium, CSDC | **−11%**         | high                   | ~none — native                            |
| Mexico       | `es` ✓        | third-deepest                         | −50%             | high                   | low                                       |
| South Africa | `en` ✓        | deepest                               | −55%             | medium                 | none                                      |
| Kenya / TZ   | `en` / `sw`   | English deepest; `sw` has **no CCC**  | −74%             | medium                 | none in English; high in Swahili          |
| Philippines  | `en` ✓        | deepest                               | −75%             | high                   | none — already English                    |
| India/Kerala | `en` / `ml` ✗ | English deepest; no `ml` content      | −77%             | medium                 | none in English; prohibitive in Malayalam |
| Nigeria      | `en` ✓        | deepest                               | ~−90% (modelled) | low — Pentecostal      | none, but highest invalid-click risk      |
| DR Congo     | `fr` ✓        | fourth-deepest; CCC held              | no data          | medium                 | none, but worst bandwidth                 |

### 7.1 How much cheaper Africa is than Brazil

Measured 2026-09-12 from two independent cross-industry sources. **Read the
ratios, never the absolutes** — the two disagree on the United States by a factor
of four ($7.66 at Statista/Semrush, December 2024; a stated $1–2 Search baseline
at WordStream, September 2025), because each averages a different basket of
verticals.

WordStream indexes 97 countries against the United States on 15,000+
high-volume **English** keywords. Against that index:

| Market       | vs US | Implied vs Brazil |
| ------------ | ----- | ----------------- |
| Brazil       | −11%  | —                 |
| Mexico       | −50%  | ~1.8× cheaper     |
| South Africa | −55%  | ~2× cheaper       |
| Kenya        | −74%  | **~3.4× cheaper** |
| Philippines  | −75%  | ~3.6× cheaper     |
| India        | −77%  | ~4× cheaper       |

Nigeria is in neither dataset; a modelled figure puts it at **₦487** average CPC
(~US$0.32), with Lagos retail around ₦800. Absent from the major benchmarks is
itself the signal — thin data because thin market.

**So: a sub-Saharan click runs roughly 3–5× cheaper than a Brazilian one, and
Brazil is an expensive market, not a cheap one** — within 11% of the United
States, above Germany and France. Brazil has a large mature advertising industry
and its auction reflects that.

Three reasons the 3–5× is an **upper bound** on what this site would actually
save, and the first is the largest:

- **Cross-industry averages are set by insurance, legal and finance.**
  Religious-reference keywords carry near-zero commercial intent and sit near the
  auction floor in every market. Floors differ far less than averages do, so the
  gap compresses for exactly the terms §4 recommends buying.
- **The index is built on English keywords.** Brazil's auction that matters here
  is the Portuguese one, which the index does not measure, and which is thinner.
  This caveat cuts in Brazil's favour and is not quantified.
- **Cheap clicks are only cheap if a budget can be spent.** Catholic-marked
  reference volume in Swahili or Malagasy is very small; a US$5/day budget in
  Tanzania may not clear.

**And CPC is the wrong denominator anyway.** The figure that decides this is cost
per _returning_ reader, and three things move it harder than a 3–5× price gap:
available query volume, bounce from the payload on metered 3G (§5), and whether
the landing language has content at all. A click 3× cheaper onto a language with
21 editions and no Catechism costs more per reader than a Brazilian click onto
258 editions, not less.

**The cheap-Africa play that does work is English, not a vernacular.** English is
a doctrinal language in Nigeria, Kenya, Tanzania, Uganda, Ghana and South Africa;
the corpus is deepest in English; and the saving is 55–74% with **no content work
at all**. That is strictly better than a Swahili campaign, which needs a
Catechism the Holy See does not publish
(`catholic-growth-and-catechism-languages.md`).

**Recommendation: Brazil, in Portuguese.** Not the fastest-growing — Africa is,
decisively, and `catholic-growth-and-catechism-languages.md` should be read
before concluding otherwise. Brazil wins on the constraint that actually binds:

- The maintainer is Brazilian. Ad copy, search idiom, and whether a landing page
  reads naturally are all judgeable **without research**, which in no other
  market is true.
- Portuguese is already the second-deepest language in the corpus and carries
  the CCC, the Compendium and the Social Doctrine — enough to land an ad on.
- Largest Catholic population in the world in absolute terms, and real
  Portuguese query volume to buy — which the cheapest markets do not have.
- **Not on price.** §7.1 measures Brazil within 11% of the United States, so the
  clicks are expensive and the budget buys the citation tail rather than head
  terms. The case for Brazil is time and corpus depth; it survives the price
  finding rather than depending on it.
- Institutional follow-up (seminaries, diocesan formation offices) is possible
  in the maintainer's own language and timezone.

**Preparation, in order, before any spend:**

1. **`cic.pt` does not exist** — the Code of Canon Law is held in
   `de en es fr it la ru` and not Portuguese. It is the one major work missing
   from the recommended market's language.
2. Verify the `pt` chrome is complete and that `/pt/` landing pages read as
   Portuguese rather than as translated English.
3. Throttle `/pt/catechismus/2267` and fix what the payload costs (§5).
4. Decide the head terms in Brazilian usage, not dictionary Portuguese —
   `catecismo da igreja católica`, `código de direito canônico`,
   `doutrina social da igreja`.

**Run the Philippines in English beside it as the control**, because it costs no
preparation at all: English content is the deepest in the corpus, clicks are
among the cheapest anywhere, the Catholic population is third-largest, and
search demand there is genuinely Catholic rather than Pentecostal. If Brazil and
the Philippines behave differently, the difference is the market and not the
campaign.

### The flag specific to a Brazil push

`copyright.md` §5 accepts **Matos Soares** (PD 1 Jan 2028) as a knowingly
accepted, self-resolving exposure, and notes reprint rights are commercially
active with Brazilian publishers. A paid campaign into Brazil, run by an
identifiable Brazilian maintainer, raises the visibility of exactly that edition
in exactly that market.

**Mitigation is cheap and costs the campaign nothing: point Brazilian ads at
`/catechismus`, `/documenta`, `/quaestiones` and the Code, never at
`/scriptura`.** The head terms worth buying there are catechism and canon-law
terms anyway — the Bible is the one work with a strong free incumbent and the
one with live exposure, which is a coincidence worth exploiting.

### 7.2 India, and the one market where a gap becomes a wrong answer

The cheapest market in §7.1 (−77%), and English carries it — formation and
reference among Indian Catholics run in English, so the campaign needs **no
content work**, and `ml` chrome over English text is not the obstacle it looks
like. India also escapes the §5 payload constraint in a way no African market
does: mobile data there is abundant and cheap, so a 124/184 KB boot is not a toll
on the reader.

**Improving the language first is not available here, and the reason is the
Swahili reason.** There is no official Malayalam edition of the Catechism to
acquire — what exists is diocesan and regional grade-school catechism series, not
a translation of the CCC — so `ml` content is outside the scraper model
altogether rather than merely unscheduled
(`catholic-growth-and-catechism-languages.md` on the general form). Checked
2026-09-12. India is therefore an English campaign or none.

It has a landing asset nothing generic competes with. `/calendarium/india` is
published, in English, and carries the saints Kerala actually keeps — Kuriakose
Chavara, Alphonsa, Euphrasia, Mariam Thresia, Joseph Vaz, John de Britto,
Devasahayam (canonised 2022, so interest is live). Those are Catholic-marked,
cheap, high-intent names with a page behind each.

**But India is where the missing CCEO stops being a coverage gap and becomes a
correctness problem.** Of roughly 23 million Indian Catholics, about 4 million
are Syro-Malabar — the second-largest Eastern Catholic church in the world, with
2.3 million in Kerala — plus the Syro-Malankara. They are governed by the **Code
of Canons of the Eastern Churches, not the 1983 Code this corpus holds.** A
Syro-Malabar reader who searches a canon and lands on `/ius-canonicum` is given
law that does not bind them, which is worse than an absence: a reader cannot see
that the answer is the wrong book. §9 treats the CCEO as completeness; here it is
accuracy.

The calendar has the softer form of the same defect. `/calendarium/india` is the
Latin-rite conference's keeping of the General Roman Calendar; the Syro-Malabar
liturgical year is structurally its own. The saints are right and the seasons are
not.

**So India is buyable, as a Catechism, encyclicals and calendar market — and
canon-law terms must stay out of it until the CCEO is in the corpus.**

And the inversion worth keeping: **India is the one market where this corpus's
largest gap faces its largest underserved audience.** The CCEO has no good free
per-canon presence anywhere online. Were it added, `/ius-canonicum` would address
a second code and India would become the best canon-law market in the world
rather than the one to withhold canon law from. That is the strongest argument in
this document for a specific acquisition.

**The Philippines remains the better first cheap-market test** on the same price
(−75%): it has roughly four times India's Catholic population at 79% of the
country against 1.6%, no rite complication, and therefore no page that can answer
the wrong question correctly.

## 8. Wikipedia: why a link gets reverted, and the five cases where it does not

The default position is against us and is correct. **`WP:ELNO` #1 excludes a
site that duplicates a resource already available elsewhere**, and
`decisions.md` §Posture says in our own words that every page reproduces text
with a canonical home on someone else's server. A mirror earns no link.

**Wikisource is the wrong venue entirely** — it hosts texts under free licences
rather than linking out to them.

Two hard rules:

- **Never add the links yourself.** `WP:COI`/`WP:SELFCITE`; self-added external
  links are reverted on sight and a pattern of them gets the domain
  blacklisted, which is not recoverable.
- **`WP:ELNEVER` forbids linking to material that infringes copyright.** The
  corpus repository is private for that reason. This limits any Wikipedia
  presence to the public-domain and clearly-licensed slice, and makes a broad
  attempt actively dangerous to the domain.

Where we are genuinely not a duplicate, and a third party has a reason:

1. **Documents vatican.va does not expose well** — much of the doctrinal
   office's older output, some of it reachable there not at all.
   `pipeline/magisterium-offsite.json` is the census of that gap.
2. **Dead vatican.va URLs.** The Holy See's site has been reorganised
   repeatedly and citations have rotted accordingly. Replacing a dead link with
   a live one is a welcomed edit rather than spam — the most legitimate door
   there is.
3. **Paragraph-level addresses.** A footnote reading "CCC 2267" pointed at a
   whole document is weakly verifiable; `/catechismus/2267` is exactly
   verifiable, which is a `WP:V` argument rather than a promotional one.
4. **Language editions vatican.va does not carry** — `ccc.mg` most sharply.
5. **Latin typical editions** — `ccc.la`, `cic.la`, `summa.la`.

The mechanism to want is not the external-links section. It is being the most
convenient thing to cite, which happens through use.

## 9. Canonists

A promising audience, and **the Latin paths are not the barrier** — they are a
credential. Canonists cite `c. 915` and treat the Latin as normative, so
`/ius-canonicum/915` is the best address they could be given, and `cic.la` is
the text they consider authoritative.

The barrier is apparatus, and the gaps are specific: **no 1917 Code, no CCEO, no
fontes or AAS references, no PCLT authentic interpretations.** Without them the
site is a fast lookup rather than a working tool. The 1917 Code is public
domain, which makes it the cheapest of the four to close and the one a canonist
reaches for most.

**Only three of those four are completeness. The CCEO is correctness**, and §7.2
is where that shows: a reader of one of the Eastern churches is not missing a
canon, they are being shown the wrong code without being able to tell. Rank it
accordingly against the 1917 Code, which is cheaper but costs no reader a wrong
answer.

The Latin paths _are_ a barrier for a different reader: nobody searching in
English guesses `/catechismus/2267`. English aliases redirecting to the Latin
addresses, canonical tags pointing home, would cost little —
`../../site/docs/addresses.md` owns whether that is acceptable.

Canonists are also not reachable by advertising. It is a small closed world —
diocesan tribunals, the canon law societies, the Roman faculties' alumni — where
one email naming a stable URL outperforms any campaign, and where citations
happen in print and are permanent.

## 10. Channels that beat ads for this asset

Ranked by readers per hour of attention, which is the only currency that
matters here.

1. **SEO on the address pages.** `robots.txt` carries no `Disallow` and the
   blanket `noindex` is lifted, so this is live. The site is built to win
   citation queries — thousands of pages, each the exact answer to one. Ads are
   rent; ranking is ownership.
2. **Being pasted.** A guessable, stable URL scheme _is_ the distribution
   channel for a reference work: priests, catechists and arguers paste citations
   constantly. Optimise the share surface — title, OG image, short URL — and ads
   become seeding rather than the channel.
3. **WhatsApp, in the target markets.** Catholic parish and prayer-group life in
   Brazil, Nigeria, Kenya, India and the Philippines runs on it. A pasteable
   page reaches a group of 200 for nothing.
4. **Institutions over individuals.** A seminary librarian or a diocesan
   formation director reaches dozens to hundreds of readers a year for the cost
   of one email. `build/gcatholic-calendar/` already enumerates territories to
   start from.
5. **Dead-link repair on Wikipedia** (§8, case 2).
6. **Paid search**, last, and only as described above.

## 11. Campaign settings, if and when one runs

Recorded so the decisions are not re-derived later.

- Exact match only. No broad, no phrase.
- Search only: Search Partners off, Display off.
- Auto-applied recommendations off — they re-add broad match silently.
- No conversion tracking (§2), therefore manual CPC, not Smart Bidding, which
  requires conversions to function.
- One country per campaign, and one country at a time (§6).
- Final URLs carry the language prefix and point at the text page, never the
  homepage.
- Budget at the level that buys information rather than reach — an estimated
  US$5/day for one month on one country's exact terms is enough to see whether
  `geo_lang` moves. Google will push for ten times that.
- Negatives from §4 loaded before the first impression, not after the first
  invoice.
