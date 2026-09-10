# Topics: what a reader arrives doubting, and whether this corpus can answer

Written 2026-09-09. **Nothing here is implemented.** This is a topic-selection
pass for `PLAN.md` gap 17 — the site's first entry by _subject_ rather than by
address. It names the topics worth carrying, says which reader each one is for,
and reports whether the corpus already holds an anchor for it. Where a claim is
measured against the corpus or a dated survey it says so; the rest is judgment.

Companion to `docs/research/audiences.md`, which found that the site's readers
split in half on one question — do they arrive with an ADDRESS or with a
QUESTION — and that everyone in the second half hits the same wall. This
document is about what the second half is holding when they hit it.

## A topic is not a subject; it is a doorway

`site/document-tags.json` already carries a closed 53-term subject vocabulary,
and it is the wrong shape for this. Those terms are **browse axes over
documents** — `labour`, `ecclesiology`, `missions` — chosen so a facet row
partitions the document set usefully. A reader who wants to know whether the
Church permits IVF does not think the words `human life`, and the document that
answers them is not what they want either: they want a paragraph.

The deeper error is subtler, and the first draft of this document made it.
**Nobody arrives at "marriage."** They arrive at _my husband will not come to
Mass_, or _we cannot have children_, or _is my first marriage still binding_ —
three different topics with three different anchor sets, all of them filed under
one subject word that answers none of them. Sorting by subject produces a
library catalogue. Sorting by **what happened to the reader in the hour before
they typed** produces the list.

The clearest case is abortion. As an argument it is CCC 2270–2275 and
`evangelium-vitae`'s legal and philosophical chapters. But `evangelium-vitae` 99
addresses, in the second person, a woman who has had one — and she is not
looking for the argument, has probably already lost it, and will never click a
topic called "Abortion." **Same corpus, same document, different door.** Any
topic touching sin, failure or grief splits this way, and the split is invisible
to a subject list.

### The four doorways

| Doorway               | What the reader is holding                 | How they phrase it               | Where they came from       |
| --------------------- | ------------------------------------------ | -------------------------------- | -------------------------- |
| **The argument**      | a position, and an opponent                | "the Church's view on X"         | an argument, online or not |
| **The life event**    | something that just happened               | "my father died", "I'm pregnant" | their own life             |
| **The private shame** | something they did, or cannot stop doing   | "is it a mortal sin to…"         | 2 a.m., incognito window   |
| **The obstacle**      | one thing blocking a decision already made | "I could convert, but Mary"      | halfway in                 |

The argument doorway is the one every survey measures and the only one the first
draft of this document covered. It is probably the smallest of the four by
volume and certainly the least changeable by a page of citations — nobody loses
an argument to the Catechism. **The other three are where a corpus of verbatim
sources is worth more than any commentary**, because the reader is not looking
to be persuaded; they are looking for what the Church actually said, in its own
words, about the exact thing that happened to them.

## What kind of doubt is it

Three kinds, and the corpus answers them unequally well.

| Doubt        | The reader's sentence                  | What answers it                              |
| ------------ | -------------------------------------- | -------------------------------------------- |
| a **claim**  | "Is any of this true?"                 | the CCC, Scripture, the councils             |
| a **rule**   | "Why am I not allowed to?"             | the CCC's Part Three, the moral corpus       |
| a **record** | "How could the Church have done that?" | mostly nothing here — see the coverage check |

## The tribes, and the question each one will not type

Not politics and not rank — the reader's relation to the Church. The same topic
word means a different question to each, and the last column is the point: every
tribe has a question underneath the one it asks, which it will not type because
typing it would concede something.

| Tribe                               | Asks about                             | Will not type                                |
| ----------------------------------- | -------------------------------------- | -------------------------------------------- |
| Cradle Catholic, non-practising     | rules, weddings, godparents            | "am I still allowed back"                    |
| The returner, after years           | confession, missing Mass               | "how much do I have to confess"              |
| Convert from evangelicalism         | Mary, papacy, purgatory                | "did I waste twenty years"                   |
| Deconstructing / exvangelical       | purity culture, hell, authority        | "was I harmed, or just disobedient"          |
| Spiritual-but-not-religious Gen Z   | astrology, meditation, energy          | "is any of this actually real"               |
| The civilizational convert          | tradition, beauty, order, natalism     | "do I have to believe it, or only prefer it" |
| Trad / Latin Mass                   | liturgy, Vatican II, the Pope          | "is my parish's Mass valid"                  |
| Charismatic                         | healing, tongues, deliverance          | "is what I felt from God"                    |
| Progressive / synodal               | women, LGBT, governance                | "can teaching change, or only practice"      |
| Folk-Catholic (LatAm, Africa, Asia) | saints, promises, the ancestors, luck  | "is what my grandmother did superstition"    |
| Persecuted church (NG, CN, ME, UA)  | martyrdom, obedience, war              | "may I hide that I am Catholic"              |
| Political Catholic, either wing     | immigration, capitalism, abortion, war | "does the Church agree with my party"        |

Two observations worth keeping. **The civilizational convert is new** and this
corpus answers them unusually well and unusually bluntly: `placuit-deo` exists
to say that salvation is neither self-improvement nor belonging to a culture,
which is precisely their unasked question. And **the folk-Catholic reader is the
largest tribe on this list globally** and the one no English-language topic page
is ever built for, though `africae-munus`, `ecclesia-in-america` and CCC
2110–2117 are all pointed straight at them.

## What was consulted

Dated, because every one of these will move.

- **Pew, 30 Apr 2025**, US Catholics on Church teaching. Majorities want change
  on birth control (84%), IVF (83%), communion for cohabiting couples (76%),
  women deacons (68%), married priests (63%), blessing same-sex couples (60%),
  women priests (59%), same-sex marriage (50%). Weekly Mass attenders run 17–20
  points lower on each, but are still a majority on cohabitation (59%). That
  question list is the best available inventory of _which teachings a Catholic is
  likely to be looking up because they doubt it_.
- **Pew, 26 Sep 2024**, the same battery across six Latin American countries and
  the US: majorities favour women priests in every country surveyed except
  Mexico. The dissent is not a North American artifact, which matters for a site
  whose largest content languages are Portuguese and Spanish.
- **Pew, 15 Dec 2025**, why people leave. Former Catholics: no longer believe the
  teachings (46%), clergy scandals (39%), unhappy with the teaching on social and
  political issues (37%). Those who became "nones" add that one can be moral
  without religion (81%) and that they distrust religious leaders (52%). Those
  who became Protestant say instead that their spiritual needs were unmet (52%).
- **PRRI**, former Catholics: loss of belief (69%), scandals (39%), the teaching
  about LGBTQ people (36%).
- **Catholic Answers' own topic index**, as an inventory of what an apologetics
  desk is actually asked: Trinity, Incarnation, Real Presence, confession, papal
  and episcopal authority, Mary and the saints, Scripture and Tradition, faith
  and works, the last things.
- **Dignitas Infinita (2024) §§33–62**, the Magisterium's own recent list of what
  it takes the live questions to be — and it is in the corpus.
- **SECAM's report on polygamy (Mar 2026)**, from the Synod's study groups:
  evidence that the Church's own list of live pastoral questions is not the
  American one.

Two of these sets barely overlap. The apologetics desk gets asked about
transubstantiation; the surveys find people leaving over contraception and abuse.
**A topic list built from either alone is half a list.**

## The candidate set

Grouped by doorway, then by band. Each topic gives the reader's own sentence and
a corpus anchor. CCC ranges are the Catechism's **own captured headings** with
their paragraph spans, read out of `build/ccc.en/structure.json`; document slugs
were checked to exist in `build/`. Anchors marked _(none)_ are the finding, not
an omission.

The set is deliberately over-wide — it is a brainstorm, not a shipping list.
Cutting it is a separate act, and cutting is easier from too many.

---

## Doorway 1: the argument

The tribal, public, googled-mid-fight door. Seven bands, and the only doorway
any survey measures.

### A. Is any of it true? — the seeker, the unbeliever, the 46%

| Topic                        | The sentence                        | Anchor                                                                        |
| ---------------------------- | ----------------------------------- | ----------------------------------------------------------------------------- |
| God's existence              | "Is there anyone there?"            | CCC 27–43; `fides-et-ratio`; `summa` I q.2                                    |
| Suffering and evil           | "Then why did he let it happen?"    | CCC 309–314 ("Providence and the scandal of evil"); `spe-salvi`               |
| Morality without God         | "I can be good without this."       | CCC 1954–1960; `veritatis-splendor`                                           |
| Is the Bible reliable        | "Who wrote it, and why believe it?" | CCC 105–108; `dei-verbum`; `providentissimus-deus`, `divino-afflante-spiritu` |
| Science, evolution, creation | "Hasn't science settled this?"      | CCC 282–289; `humani-generis`; `fides-et-ratio`                               |
| Who Jesus was                | "Did any of it happen?"             | CCC 422–682; `redemptor-hominis`                                              |
| Death and what follows       | "Is that all there is?"             | CCC 1020–1050 — heaven 1023–29, purgatory 1030–32, hell 1033–37               |
| Atheism and secularism       | "Religion is what's wrong with us." | `gaudium-et-spes` 19–21; CCC 2123–2128                                        |

### B. How could the Church have done that? — the one who left, the 39%

The band with the highest measured demand and the **thinnest corpus**.

| Topic                          | The sentence                    | Anchor                                                              |
| ------------------------------ | ------------------------------- | ------------------------------------------------------------------- |
| The abuse crisis               | "You protected them."           | `dignitas-infinita` §43 — and little else                           |
| Inquisition, Crusades, Galileo | "Look at your history."         | CCC 2298, 827; `tertio-millennio-adveniente`                        |
| The Church's wealth            | "Sell the Vatican."             | `dilexi-te`; `evangelii-gaudium` 53–60, 197–201                     |
| Clericalism and power          | "It is run by men, for men."    | `evangelii-gaudium`; `christifideles-laici`                         |
| The Church and the Jews        | "Where were you?"               | `nostra-aetate` 4; CCC 597, 839–840                                 |
| Colonialism and native peoples | "You came with the conquerors." | `querida-amazonia`; `ecclesia-in-america`; tag `indigenous peoples` |

### C. The other Christian's objection — the 52% who left for a Protestant church

| Topic                       | The sentence                  | Anchor                                                                                |
| --------------------------- | ----------------------------- | ------------------------------------------------------------------------------------- |
| Mary                        | "You worship her."            | CCC 963–975, 2673–2679; `lumen-gentium` 52–69; `redemptoris-mater`, `marialis-cultus` |
| The saints, statues, images | "That is idolatry."           | CCC 946–962, 2132                                                                     |
| Purgatory and indulgences   | "Where is that in the Bible?" | CCC 1030–1032, 1471–1479                                                              |
| The Pope, infallibility     | "One man cannot be that."     | `vati.pastor-aeternus`; CCC 880–892; `lumen-gentium` 22–25                            |
| Scripture and Tradition     | "The Bible alone is enough."  | `dei-verbum` 7–10; CCC 74–100                                                         |
| Faith and works             | "Are Catholics even saved?"   | CCC 1987–2029; `veritatis-splendor`                                                   |
| Confession to a priest      | "Why not go straight to God?" | CCC 1422–1498; `reconciliatio-et-paenitentia`                                         |
| The Eucharist               | "It is a symbol."             | CCC 1373–1381; `encyclical.mysterium`, `eccl-de-euch`, `sacramentum-caritatis`        |
| Why 73 books                | "You added books."            | CCC 120; `dei-verbum` 11                                                              |
| Christian division          | "Why not just be Christians?" | `ut-unum-sint`; `unitatis-redintegratio`; tag `Christian unity`                       |

### D. Why am I not allowed to? — the Catholic inside, and the whole Pew battery

The band where the reader is likeliest to arrive from a search engine, and where
a half-quoted answer does the most damage. Almost every row is a teaching a
measured majority of US and Latin American Catholics wants changed.

| Topic                           | Demand (Pew 2025)            | Anchor                                                                                                |
| ------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------- |
| Contraception                   | 84% want it permitted        | CCC 2366–2372; `casti-connubii`, `humanae-vitae`                                                      |
| IVF, surrogacy, embryos         | 83%                          | CCC 2373–2379; `donum-vitae`, `dignitas-personae`, `dignitas-infinita`                                |
| Sex before marriage, cohabiting | 76% (communion)              | CCC 2350, 2390–2391; `persona-humana` 7                                                               |
| Divorce and remarriage          | —                            | CCC 1650–1651, 2382–2386; `familiaris-consortio` 84; `amoris-laetitia` 296–312                        |
| Homosexuality, same-sex unions  | 60% blessings / 50% marriage | CCC 2357–2359; `persona-humana` 8, `homosexualitatis-problema`, `legal-recognition-homosexual-unions` |
| Gender, transition              | —                            | `dignitas-infinita` (Gender Theory, Sex Change)                                                       |
| Women priests and deacons       | 59% / 68%                    | `inter-insigniores`, `responsum-ordinatio-sacerdotalis`                                               |
| Married priests                 | 63%                          | `encyclical.sacerdotalis`; `presbyterorum-ordinis` 16                                                 |
| Abortion                        | —                            | CCC 2270–2275; `evangelium-vitae`; `dignitas-infinita`                                                |
| Euthanasia, assisted suicide    | —                            | CCC 2276–2283; `iura-et-bona`, `samaritanus-bonus`                                                    |
| The death penalty               | —                            | CCC 2267; `fratelli-tutti`                                                                            |
| Pornography, masturbation, lust | —                            | CCC 2351–2356; `persona-humana` 9                                                                     |
| Sunday obligation               | —                            | CCC 2168–2195; `sacrosanctum-concilium`                                                               |
| Addiction                       | —                            | CCC 2290–2291 — three sentences, and nothing else                                                     |
| Lying, gossip, reputation       | —                            | CCC 2464–2513                                                                                         |
| Money, work, debt               | —                            | CCC 2401–2463; `laborem-exercens`                                                                     |

### E. The public square — where politics is the doorway to the faith

37% of former Catholics name the Church's social and political teaching as a
reason for leaving, and they do not all mean the same teaching. This band is
where the corpus is at its strongest, and where a reader is likeliest to find
that the Church does not sit where their tribe assumed.

| Topic                          | Anchor                                                                                                              |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Capitalism, wealth, property   | `rerum-novarum`, `quadragesimo-anno`, `centesimus-annus`; `csdc`                                                    |
| Socialism, communism, Marxism  | `quod-apostolici-muneris`, `divini-redemptoris`, `libertatis-nuntius`, `libertatis-conscientia`, `centesimus-annus` |
| Labour, wages, unions          | `rerum-novarum`, `laborem-exercens`                                                                                 |
| Migration and refugees         | `fratelli-tutti`; `dignitas-infinita`; tag `migrants`                                                               |
| War, peace, arms               | CCC 2307–2317; `pacem` (Pacem in Terris), `gaudium-et-spes` 79–82, `fratelli-tutti`                                 |
| Nation, State, obedience       | CCC 2234–2246; `immortale-dei`, `diuturnum`; tag `Church and State`                                                 |
| Religious liberty, persecution | `dignitatis-humanae`; `mit-brennender-sorge`; tag `persecution`                                                     |
| Ecology and climate            | CCC 2415–2418; `laudato-si`, `laudate-deum`                                                                         |
| Poverty                        | `dilexi-te`, `populorum`, `sollicitudo-rei-socialis`, `csdc`                                                        |
| Technology and AI              | `antiqua-et-nova`; `laudato-si` 102–114; CCC 2293–2294                                                              |
| Media, speech, misinformation  | CCC 2493–2499; `inter-mirifica`                                                                                     |

### F. The neighbour of another faith — the languages this site is actually in

The site serves Arabic, Hebrew, Vietnamese, Ukrainian, Polish, Chinese and
Malagasy readers. A topic list drawn only from US survey data serves none of
them, and the continental exhortations exist precisely to be their band.

| Topic                              | Anchor                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------ |
| Islam                              | `nostra-aetate` 3; CCC 841; `lumen-gentium` 16; `ecclesia-in-medio-oriente`          |
| Judaism                            | `nostra-aetate` 4; CCC 839–840                                                       |
| Salvation outside the Church       | CCC 839–848 ("The Church and non-Christians"); `dominus-iesus`, `redemptoris-missio` |
| Polygamy                           | `familiaris-consortio` 19; `ecclesia-in-africa`, `africae-munus`                     |
| Superstition, magic, the ancestors | CCC 2110–2117; `africae-munus`                                                       |
| Prosperity preaching, new sects    | `evangelii-gaudium` 89–94; `ecclesia-in-america`                                     |
| Inculturation                      | `redemptoris-missio` 52–54; `slavorum-apostoli`; `querida-amazonia`                  |
| Living under an atheist State      | `divini-redemptoris`, `mit-brennender-sorge`, `ecclesia-in-asia`                     |

### G. Catholics arguing with Catholics — the band that is all comment section

Invisible to every survey, because a survey asks whether you are Catholic, not
which kind. It is a large share of religious argument online, it is where the
convert lands about eighteen months in, and the corpus answers it better than it
answers band B.

| Topic                          | The sentence                            | Anchor                                                                                     |
| ------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------ |
| Does teaching ever change      | "You changed it before."                | CCC 66–67; `vati.dei-filius`; `donum-veritatis`                                            |
| May I disagree with the Church | "Not on THIS one."                      | `donum-veritatis`; CCC 1776–1802 (conscience), 892                                         |
| Criticising the Pope           | "He is wrong and I can say so."         | `vati.pastor-aeternus`; CCC 880–892; `mysterium-ecclesiae`                                 |
| Did Vatican II break it        | "Everything went wrong in 1965."        | the 16 `vatii.*`; `lumen-gentium` 8                                                        |
| The Latin Mass                 | "They took it away."                    | `sacrosanctum-concilium`; `summorum-pontificum` and `traditionis-custodes`, which disagree |
| Should the State be Catholic   | "Liberalism was the mistake."           | `immortale-dei`, `libertas`, `quas-primas` vs `dignitatis-humanae`                         |
| Synodality and governance      | "Who decides anything?"                 | `lumen-gentium` 22–27; `christifideles-laici`; `pastores-gregis`                           |
| Women in the Church            | "It is run by men."                     | `collaboration-of-men-and-women`; `inter-insigniores`                                      |
| Charismatic gifts, healing     | "Is what I felt from God?"              | CCC 799–801, 2003                                                                          |
| How a Catholic may vote        | "Not for that party, surely."           | `catholics-in-political-life`; CCC 2240–2246                                               |
| Proselytising                  | "Should we even try to convert people?" | `aspects-of-evangelization`; `redemptoris-missio`; `evangelii-nuntiandi`                   |

**"Does teaching ever change" is the keystone of the whole list.** It sits under
contraception, the death penalty, usury, slavery, religious liberty and Vatican
II at once, and how a reader answers it decides whether any other page here is
worth trusting. If one topic ships first, it is probably this one.

---

## Doorway 2: the life event

Nothing on this list is a controversy, no survey counts it, and it is plausibly
the largest doorway by volume. The reader is not looking for a position. They
are looking for what the Church says about the thing that happened on Tuesday.

| The event                      | What they type                            | Anchor                                             |
| ------------------------------ | ----------------------------------------- | -------------------------------------------------- |
| Someone died                   | "where is he now"                         | CCC 1020–1050; `spe-salvi`                         |
| A child died                   | "unbaptised babies"                       | CCC 1261, 1257–1261; `pastoralis-actio`            |
| A suicide                      | "is she in hell"                          | CCC 2280–2283 — 2283 is the paragraph they need    |
| A diagnosis                    | "why me"                                  | CCC 1499–1532; CCC 309–314                         |
| A dying parent                 | "must we keep the feeding tube"           | `iura-et-bona`, `samaritanus-bonus`; CCC 2278–2279 |
| Choosing cremation             | "may the ashes be scattered"              | `ad-resurgendum-cum-christo` — the whole document  |
| Getting married                | "what makes it a marriage"                | CCC 1601–1666; `cic` cc. 1055–1165                 |
| Marrying a non-Catholic        | "will the children have to be Catholic"   | CCC 1633–1637; `cic` cc. 1124–1129                 |
| A previous marriage            | "what an annulment actually is"           | `cic` cc. 1671–1707; `familiaris-consortio` 84     |
| Divorce, and Communion         | "may I receive"                           | CCC 1650–1651; `amoris-laetitia` 296–312           |
| Pregnancy, miscarriage         | "was it a person"                         | `quaestio-de-abortu`; `donum-vitae`; CCC 2270      |
| Infertility                    | "may we do IVF"                           | CCC 2373–2379; `donum-vitae`, `dignitas-personae`  |
| A child who left the faith     | "where did I go wrong"                    | CCC 2221–2231; `familiaris-consortio` 36–41        |
| Losing work, debt              | "does the Church say anything about this" | `laborem-exercens`; CCC 2427–2436                  |
| Emigrating                     | "leaving my country"                      | `fratelli-tutti` 129–141; `ecclesia-in-america`    |
| Growing old, being useless     | "what am I for now"                       | `familiaris-consortio` 27; CCC 2218                |
| Coming back after twenty years | "how do I even start"                     | CCC 1422–1498; `reconciliatio-et-paenitentia`      |

---

## Doorway 3: the private shame

Typed at 2 a.m., in a private window, by someone who would never ask a person.
The volume is high, the intent is not argument, and **the entry must resolve to
the pastoral paragraph rather than the condemning one** — otherwise the page
does harm. `evangelium-vitae` 99 versus CCC 2270–2275 is the whole design of
this band in one example.

| What happened                     | What they type               | Anchor                                               |
| --------------------------------- | ---------------------------- | ---------------------------------------------------- |
| Pornography                       | "I cannot stop"              | CCC 2354, 2351–2356; 1264 (concupiscence remains)    |
| Masturbation                      | "is it always mortal"        | CCC 2352 — the second half of the paragraph          |
| An abortion, years ago            | "can I be forgiven"          | `evangelium-vitae` 99                                |
| Contraception, or a sterilisation | "we already did"             | `familiaris-consortio` 33–34 (gradualness); CCC 1735 |
| An affair                         | "should I tell"              | CCC 2380–2381; 2487 (reparation)                     |
| Being gay and Catholic            | "what am I supposed to do"   | CCC 2358–2359 — not 2357                             |
| Drinking, drugs, gambling         | "am I an addict or a sinner" | CCC 2290–2291, 2413 — thin, see the gaps             |
| Self-harm, an eating disorder     | "is this a sin"              | CCC 2288–2289 — thin                                 |
| Wanting to die                    | "would God forgive it"       | CCC 2280–2283; `samaritanus-bonus`                   |
| Someone I cannot forgive          | "do I have to"               | CCC 2842–2845; `dives-in-misericordia`               |
| I do not believe any more         | "and I still go to Mass"     | CCC 162, 2088–2089; `spe-salvi` 1–9                  |
| Fear that God cannot forgive      | "the unforgivable sin"       | CCC 1846–1848, 982, 1864                             |
| Scrupulosity                      | "did I confess it properly"  | CCC 1454–1460; 1735 (imputability)                   |
| Not having confessed in years     | "what do I even say"         | CCC 1450–1460; `reconciliatio-et-paenitentia` 31     |

---

## Doorway 4: the ordinary question

Neither a fight nor a crisis. Somebody simply wants to know, and the volume is
enormous — `docs/research/audiences.md` §1 picked one of these ("_a Igreja
permite cremação?_") as its example query without noticing it was a genre.

### H. The supernatural, and what the Church says is real

The highest-volume band on this page and the one absent from every serious
topic list, because it embarrasses the people who write them.

| Topic                              | Anchor                                         |
| ---------------------------------- | ---------------------------------------------- |
| Astrology, tarot, crystals, luck   | CCC 2115–2117 — names each practice explicitly |
| Manifesting, "the universe"        | CCC 2110–2117; `placuit-deo`                   |
| Ghosts and the dead                | CCC 2116; 1030–1032                            |
| Demons, possession, exorcism       | CCC 391–395, 550, 1673                         |
| Angels, guardian angels            | CCC 328–336                                    |
| Yoga, mindfulness, meditation      | CCC 2705–2719 — _Orationis Formas_ absent      |
| Apparitions and private revelation | CCC 66–67; `signum-magnum`                     |
| Miracles, relics, the incorrupt    | CCC 156, 1674–1676                             |
| Near-death experiences             | CCC 1021–1022                                  |
| The end of the world, Antichrist   | CCC 668–682                                    |
| Freemasonry                        | tag `Freemasonry`; `humanum-genus`             |

### I. The body, the calendar and ordinary practice

| Topic                               | Anchor                                      |
| ----------------------------------- | ------------------------------------------- |
| Cremation, ashes, burial            | `ad-resurgendum-cum-christo`; CCC 2300–2301 |
| Fasting, Lent, meat on Friday       | CCC 1434–1439, 2043; `cic` cc. 1249–1253    |
| Organ donation, transplants         | CCC 2296; `evangelium-vitae` 86             |
| Tattoos, cosmetic surgery, the body | CCC 2288–2289                               |
| Alcohol and drugs                   | CCC 2290–2291                               |
| Sunday work and rest                | CCC 2184–2188; `laborem-exercens` 25        |
| Missing Mass                        | CCC 2180–2183; `cic` c. 1247                |
| Godparents, baptising a baby        | `pastoralis-actio`; `cic` cc. 872–874       |
| Tithing and giving                  | CCC 2043; `cic` c. 222                      |
| Vows, promises, swearing            | CCC 2101–2109, 2150–2155                    |

### J. Work, money and time

| Topic                          | Anchor                                                                |
| ------------------------------ | --------------------------------------------------------------------- |
| What to do with my life        | `christus-vivit` 248–298; CCC 1877–1889                               |
| Ambition, burnout, hustle      | CCC 2427–2428; `laborem-exercens` 9                                   |
| Debt, interest, credit         | `oeconomicae-et-pecuniariae-quaestiones` — _Vix Pervenit_ absent      |
| Investing, speculation, crypto | `oeconomicae-et-pecuniariae-quaestiones`; `caritas-in-veritate` 40–45 |
| A just wage, striking          | `rerum-novarum`; `laborem-exercens` 19–20; CCC 2434–2435              |
| Tax, and cheating on it        | CCC 2240, 2409                                                        |
| Rest and leisure               | CCC 2184–2188; `gaudete-in-domino`                                    |
| Envy and comparison            | CCC 2538–2540                                                         |
| Sloth, acedia, boredom         | CCC 1866, 2094, 2733 — 2733 is about prayer specifically              |

### K. Justice and the person

Band E is the systems half of social doctrine; this is the half about a person
in front of you, and it maps almost one-to-one onto `dignitas-infinita`'s own
enumeration of grave violations.

| Topic                              | Anchor                                                            |
| ---------------------------------- | ----------------------------------------------------------------- |
| Racism and antisemitism            | CCC 1934–1935, 2488; `nostra-aetate` 4; `fratelli-tutti`          |
| Caste and social exclusion         | CCC 1934–1935; `ecclesia-in-asia`                                 |
| Human trafficking, prostitution    | `dignitas-infinita`; CCC 2355, 2414                               |
| Domestic violence                  | `dignitas-infinita` (Violence Against Women); CCC 2356            |
| Disability                         | `dignitas-infinita` (Marginalization of People with Disabilities) |
| Prisons, torture, criminal justice | CCC 2266–2267, 2297–2298                                          |
| Self-defence and weapons           | CCC 2263–2265, 2316                                               |
| Bullying and digital violence      | `dignitas-infinita` (Digital Violence); `antiqua-et-nova`         |
| Animals and how we eat             | CCC 2415–2418                                                     |
| Whether to have children at all    | `laudato-si` 50; `humanae-vitae` 10; CCC 2368                     |

## What the coverage check found

**The corpus answers the rule and the claim; it barely answers the record.**
Every topic in bands A, D, E and F has at least one magisterial anchor and most
have several. Band B has almost none — and band B is where 39% of the people who
left say they left.

**The structural reason this section gave for that expired the day it was
written** (rechecked 2026-09-10). It said an apostolic letter is not a kind this
corpus takes, and cited `docs/decisions.md`, which says the opposite: letters,
constitutions, motu proprios and bulls are selected rather than taken whole, by
the citation rule stated there. The selection landed in `corpus/1bfaa38` on
2026-09-09, the same day this section was written, and nothing told this file.
Every work named here as out of reach carries `type: document` in `build/`
today, which is all a topic's `documents` field asks of one: _Tertio Millennio
Adveniente_, _Salvifici Doloris_, _Dies Domini_, _Mulieris Dignitatem_,
_Indulgentiarum Doctrina_, _Ordinatio Sacerdotalis_. Band B is thin for the
ordinary reason — nobody has anchored it — and not for a structural one.

_Fiducia Supplicans_ is the part of the claim that survives, checked again and
still absent while the three earlier documents on the same subject are present:
a topic page on homosexuality built today is silently two years out of date.

**A topic that cannot be answered properly does not ship, and the gap is
recorded here rather than left implicit** (decided 2026-09-09). The reader who
lands on a topic resolving to three sentences concludes the Church has nothing to
say, which is worse than never offering the topic. So the list below is the
shipping blocklist, and every line is a claim that the corpus — not the Church —
is what falls short.

| Held back                     | Why                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Addiction; self-harm          | CCC 2288–2291 is all there is, and it is about temperance, not compulsion                                                                |
| Mental illness, loneliness    | nothing addressed to it in the kinds this corpus takes                                                                                   |
| Grief that does not lift      | _Salvifici Doloris_ has arrived, but a topic's Catechism block is the page's answer and CCC 1680–1683 is the funeral and not the mourner |
| Yoga and Christian meditation | _Orationis Formas_ absent                                                                                                                |
| Debt and interest             | _Vix Pervenit_ absent                                                                                                                    |
| Same-sex blessings            | three earlier documents present, _Fiducia Supplicans_ absent — the worst case, since a stale answer reads as a current one               |

The absent documents are to be acquired later, at which point the held topics
become shippable without the list changing shape. What must not happen is a
topic shipping over a corpus that answers an older question than the one asked.

**A blocklist is a claim about the corpus on a day, and the corpus is not
frozen.** Three rows were removed on 2026-09-10 because the documents they were
waiting for had already arrived — one of them on the day the row was written. A
row that reads "_X_ absent" is checkable in one command and none of them were
rechecked. That is the same failure as a stale answer, pointing the other way:
there, the reader is told something no longer taught; here, the reader is told
nothing at all about something the corpus can now answer. Recheck before
trusting a row:

```sh
for n in orationis-formas vix-pervenit fiducia-supplicans; do
  ls -d "$CORPUS_DIR"/build/*."$n".* >/dev/null 2>&1 \
    && echo "$n PRESENT — this row has expired" || echo "$n absent"
done
```

### Released by the corpus, and unwritten

| Was held back  | What arrived                                                                                                    | What a topic would get                                                                                                              |
| -------------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Band B         | apostolic letters as a published kind, _Tertio Millennio Adveniente_ among them                                 | the three of band B's six that never shipped: the Church's record, the Church's wealth, colonialism                                 |
| The Latin Mass | _Summorum Pontificum_ and _Traditionis Custodes_, beside _Missale Romanum_, _Magnum Principium_, _Mediator Dei_ | both sides of a live disagreement, which is the state `quaestiones.json` asks for. _Ecclesia Dei_ and _Desiderio Desideravi_ absent |

**Band B was half-written already and this file did not say so.** Three of its
six shipped without anyone striking the blocklist row: the abuse crisis is
`scandalum-cleri`, the Church and the Jews is `iudaismus`, and clericalism is
split between `mulieres-in-ecclesia` and `synodalitas`. A row covering a whole
band hides that, which is a second way for a row to go stale — not the corpus
moving under it, but the topic file moving past it. **Hold back named topics,
never a band.**

**Grief that does not lift was released and then held again**, on a reason that
is not about a missing document at all: a topic's Catechism block is the page's
answer, and CCC 1680–1683 is the funeral rather than the mourner. Anchoring it
there would put a reader who cannot stop grieving in front of the rite for the
body, which is the door mismatch `graviditas` was fixed for. _Salvifici
Doloris_ can be named and not quoted, and a page whose only real answer is a
link is the three-sentence page this list exists to prevent.

Releasing a row is not shipping a topic: each of these still needs a slug, a
cluster, a question worth typing, strings in the dictionaries, and — the binding
constraint today — a description for every document it names. See _Still open_.

One further hole belongs to no document: **anything after the corpus's last
fetch.** A topic page dates faster than a document page, because a topic is a
promise to be current and a document is not.

## The mechanism this suggests

Accepted 2026-09-09 as the direction, not yet as a design.

`build/ccc.en/paragraphs.json` carries a `citations` array on **1,877 of the
2,865 paragraphs** (measured 2026-09-09), and those citations are both scriptural
and magisterial. CCC 2357 carries `Gen 19:1-29; Rom 1:24-27; 1 Cor 6:10;
1 Tim 1:10` and `CDF, Persona humana 8` — which is to say the Bible passages and
the magisterial document this topic needs **are already in the corpus, chosen by
the Catechism rather than by us**. And `structure.json` carries the Catechism's
own heading "Chastity and homosexuality" with the span `[2357, 2359]`.

So the editorial act need not be "choose the passages for homosexuality". It can
be **"this topic is that heading"** — one mapping, topic to CCC span — and the
Scripture and the documents fall out of the Catechism's own footnotes. Same
posture as everywhere else here: derive it, and let a third party verify rather
than serve. The judgment stays small, sits in tracked source beside
`document-tags.json` and `descriptions.json`, and is checkable against a printed
book.

It does not cover everything. Bands B and E are thin in the CCC and rich in the
documents, where the existing tag vocabulary is the better index; and a topic
with no CCC heading (addiction, AI) needs its span chosen rather than read. But
it means the page starts from something the Church wrote.

## What this set deliberately leaves out

- **Devotional and liturgical how-to** — how to pray the Rosary, what happens at
  Mass, what to say in confession. Real demand, but `/preces` and `/schola`
  already own it.
- **News.** Whatever a pontificate is being argued about this month. It dates in
  weeks and this corpus is not built to keep up.
- **A verdict.** The set is chosen so that every topic resolves to _passages_.
  The moment an entry needs a sentence of our own explaining what the passages
  mean, it has left the arrangement this project's name promises.

## What shipped

`/quaestiones` landed 2026-09-09 with **twelve topics, three from each
doorway** — the slice chosen so the hardest cases were attempted first rather
than deferred. Three of the twelve carry the pastoral ordering this document
argued for, and two of those are the reason it exists: `mors-voluntaria` leads
on CCC 2283 and `homosexualitas` on 2358.

| Doorway       | Shipped                                                            |
| ------------- | ------------------------------------------------------------------ |
| argument      | whether teaching changes, contraception, homosexuality             |
| life event    | cremation, after a suicide, annulment                              |
| private shame | whether a sin can be forgiven, pornography, confession after years |
| ordinary      | astrology and divination, fasting, organ donation                  |

The mechanism held: every topic anchors spans of the Catechism, and the
Scripture and magisterial citations come from those paragraphs' own footnotes.
Nothing in the shipped set required a passage to be chosen by hand.
`site/docs/topics.md` records what the route cost to add.

### The second pass, the same day

The rest of the candidate set followed immediately, and the count is in the
sync's own summary line rather than here. Nine topics carry a `lead`, and the
pairs the doorways predicted are all present: `abortus` beside `post-abortum`,
`fecundatio-artificialis` beside `sterilitas` (which leads on CCC 2379, not on
the prohibition), `homosexualitas` beside `homosexualitas-vivenda`,
`mors-voluntaria` beside `mortis-desiderium`. Portuguese was written at the same
time, which makes `pt` the first dictionary after `en` to carry the route.

**Six candidates were dropped rather than blocked**, and the distinction
matters: a blocked topic is waiting for a document, a dropped one has nothing
of its own to resolve to.

| Dropped                     | Why                                                                |
| --------------------------- | ------------------------------------------------------------------ |
| Emigrating                  | CCC 2241 entire, and that paragraph is already `migratio`          |
| Growing old                 | CCC 2218 answers the grown child, not the reader who asked         |
| Freemasonry                 | no Catechism paragraph at all; `humanum-genus` cannot carry a page |
| Manifesting, "the universe" | resolves to `divinatio`'s and `superstitio`'s paragraphs exactly   |
| Caste and social exclusion  | CCC 1934–1938, which is `discrimen-gentium`                        |
| Animals and how we eat      | CCC 2416–2418, which is inside `oecologia`                         |

The rule they teach is the one the file now states: **where two doors produce
the same anchor set in the same order, there is one topic and not two.** The
door has to change what the reader is given, not merely what they were asked.

The blocklist above is unchanged and still holds.

## Decided

- **A topic the corpus cannot answer properly does not ship**, and the gap is
  documented rather than filled with a thin page. The blocklist is above.
- **The absent documents are acquired later.** Held topics ship when their
  document arrives; the shape of the list does not change to accommodate the
  absence.
- **Derive the passages from the Catechism's own apparatus** rather than
  assembling them by hand, per the mechanism above.

## Settled by shipping

1. **How many ship.** All of them, save the blocklist and the six dropped
   above. The `document-tags.json` discipline turned out to be the wrong
   analogy: a tag that names one document is a useless facet, but a topic that
   resolves to two Catechism paragraphs and a document written about exactly
   that is a page worth reading. What makes a topic thin is the corpus having
   nothing, not the anchor being short.
2. **One entry per topic, or one per doorway?** Per doorway, but only where the
   doorway changes the answer. Four pairs earned it and six candidates were
   dropped for failing the test.
3. **What the route is called.** `quaestiones`.
4. **Whether doorway 3 can be built at all in this register.** It can, and
   `lead` is the whole mechanism: the topics that use it are the ones carrying
   the field in `site/quaestiones.json`, the page discloses it in the reader's
   own language, and the sync refuses one that has drifted. The ordering is
   still a judgment about a reader's state and is meant to be argued with — one
   field, one number, in tracked source. **A `lead` is a compensation, and a
   better span retires it**: `amor-dei` led on CCC 219 while its only anchor was
   God's love for Israel, and stopped needing to when CCC 604–605 — _not a
   single human being for whom Christ did not suffer_ — was anchored ahead of
   it.

## Still open

- **What the shipped anchors still cannot answer.** The blocklist above is
  about topics that could not ship; this is about the ones that did. The pass
  that read them is `docs/research/topic-anchor-review.md`, finished 2026-09-10
  over all sixteen clusters, grading each topic on whether a reader holding its
  `question` leaves with it answered; the grades are rows in
  `site/quaestiones-review.json`, checked by `quaestiones.test.ts` against the
  anchor set each was formed on. What remains is what those rows record: every
  B names what would replace it, and several name a text the corpus does not
  have — which is this list's business rather than that pass's.
- **Thirty-eight documents have no description, and that is what actually
  blocks the released topics.** `site/descriptions.json` covers 290 of the 328
  English document works (measured 2026-09-10); the 38 without one are entirely
  motu proprios, apostolic letters, apostolic constitutions and bulls — the same
  four families `decisions.md` selects from rather than takes whole, and the
  same ones the blocklist wrongly called absent. Every document the released
  topics would name is in that 38: _Summorum Pontificum_, _Traditionis
  Custodes_, _Missale Romanum_, _Tertio Millennio Adveniente_. `quaestiones.json`
  requires the description to be read before a document is named, so a topic
  cannot honestly name any of them yet. A description is written by reading the
  document (PLAN.md gap 16), and the documents are in the corpus.
- **The topics the corpus released.** The blocklist above stopped
  holding back band B and the Latin Mass on 2026-09-10, because the documents
  each was waiting for had arrived without anything rechecking the row. That is
  four topics — the Church's record, the Church's wealth, colonialism, the older
  Mass — and none has a slug, a cluster or a question yet. The last is the
  interesting case: it would carry
  _Summorum Pontificum_ and _Traditionis Custodes_ together, which is what
  `quaestiones.json` asks for where two magisterial texts differ, and it would
  land on the reader PLAN.md gap 19 is about — the one shown both and told when
  neither was written.
- **The other thirty-five dictionaries.** `en` and `pt` carry the keys; until
  all of them do, `/quaestiones` stays out of `CHROME_PATHS` and the sitemap on
  `route-manifest.ts`'s own terms. This is now the largest single block of
  untranslated chrome on the site.
- **Whether a topic should be bookmarkable.** The address supports it and
  `bookmarkContent.ts` already groups topics; nothing offers the mark yet.
