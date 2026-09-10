# Topic anchor review: whether the passages answer the question asked

The method and the findings of a quality pass over `site/quaestiones.json`,
opened 2026-09-10 and run a cluster at a time. **The grades are not here** —
they are one row per topic in `site/quaestiones-review.json`, beside the file
they grade and inside the reach of a test. This page holds what the reading
taught, which is the half that would rot into a table.

Companion to `docs/research/topics.md`, which decided _which_ topics exist and
holds the shipping blocklist; between them, that file says what may ship and
this one says whether what shipped works.

**The test is one sentence.** A reader arrives holding the topic's own
`question`, in their own words, and reads the anchored passages in the anchored
order. Do they leave with it answered, without a sentence of ours explaining
what the passages mean? Anything else — the topic being interesting, the
paragraphs being about the right subject, the anchor being tidy — is not the
test.

**The question is the specification, and the title is not.** Every defect this
pass has found has the same shape: a topic whose _title_ is anchored perfectly
and whose _question_ is not anchored at all. `pornographia` is CCC 2354 and
always was, and "and about not being able to stop?" was in no paragraph on the
page; `amor-dei` is CCC 218–221 and "I believe it about everyone else" was in
none of them. Read the question clause by clause, and the keywords too — a
keyword is a promise the search bar keeps.

## The scale

Four grades, and each one implies a different action.

| Grade             | What it means                                                                                                | Action                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| **A — answers**   | The passages answer the question as asked, in their own words.                                               | none                             |
| **B — obliquely** | The answer is there, but the reader has to carry it across from a passage written about an adjacent thing.   | watch; replace if a text arrives |
| **C — partial**   | Something the title, question or keywords promise has no anchored text behind it, and the corpus has a text. | fix here; the note names the fix |
| **D — held**      | The missing half needs a document the corpus does not have.                                                  | see the blocklist in `topics.md` |

A grade is about the anchors, not about the writing. A question written worse
than the passages deserve is a `docs/writing-voice.md` matter and gets a note,
not a grade.

**B is a real grade and not a soft A.** The Catechism is not organised by the
questions people ask it, so a topic will sometimes have exactly one paragraph
that bears on the reader's situation and it will be filed under something else.
That is worth shipping and worth recording, because the day a better text is
ingested the note says where to put it.

**Only A and B are ever stored**, and the test enforces it. A C is fixed in the
pass that finds it — that is what distinguishes it from a D, which is the corpus
falling short and belongs to the blocklist in `topics.md`. So a C survives only
as the `was` field on the row that replaced it, and a row left at C would be a
to-do wearing a verdict's clothes.

## Reviewed

The grades themselves are in **`site/quaestiones-review.json`**, one row per
topic: the grade, the date, the grade it replaced where there was one, the
anchor set it was formed on, and the note. They live there rather than in a
table here because a grade is a claim about a particular anchor set and anchor
sets change — `quaestiones.test.ts` recomputes each signature from
`quaestiones.json` and fails when one has drifted, which is the single defect a
markdown table could never report. Read them with:

```sh
jq -r '.reviewed | to_entries[] | "\(.value.grade)  \(.key)"' site/quaestiones-review.json | sort
```

Every cluster has been read, each in a single sitting:

| Cluster                        | Read       |
| ------------------------------ | ---------- |
| `private-shame / the-body`     | 2026-09-10 |
| `private-shame / despair`      | 2026-09-10 |
| `private-shame / forgiveness`  | 2026-09-10 |
| `life-event / marriage`        | 2026-09-10 |
| `life-event / death-and-dying` | 2026-09-10 |
| `life-event / the-household`   | 2026-09-10 |
| `ordinary / the-unseen`        | 2026-09-10 |
| `ordinary / practice`          | 2026-09-10 |
| `ordinary / money-and-work`    | 2026-09-10 |
| `ordinary / justice`           | 2026-09-10 |
| `argument / credibility`       | 2026-09-10 |
| `argument / other-christians`  | 2026-09-10 |
| `argument / catholics-arguing` | 2026-09-10 |
| `argument / the-rules`         | 2026-09-10 |
| `argument / public-square`     | 2026-09-10 |
| `argument / other-faiths`      | 2026-09-10 |

That is all sixteen, and every topic in the file now has a row. Whether the
rows and the topics still agree is the test's question, not this table's. What follows is what the reading taught, which is
the part a table cannot hold.

## What the pass keeps finding

**A keyword must not promise what the blocklist refuses.**
`pornographia` led its keywords with _addiction_, which `topics.md` holds back as
a topic precisely because CCC 2288–2291 is about temperance and not compulsion.
The search bar was offering the word the blocklist says this corpus cannot
answer. The fix was to anchor the nearest true thing — diminished imputability,
and self-mastery as long work — not to drop the word.

**An in-brief paragraph earns its place when it is the only one that names the
act.** CCC 2399 is one of two paragraphs in the whole Catechism that say
"sterilization"; the other is 2297, which sits between torture and kidnapping and
is the wrong room to send this reader into. Anchoring a summary paragraph is
otherwise a smell — `finis-mundi` was the only topic that did it before this —
because in-brief text restates what the article already said at length.

**A title is a poor oracle for a Catechism span, exactly as it is for a
document.** `quaestiones.json` already says to read a document's description
before naming it; the same trap is set in the Catechism's own headings.
`vocatio` — "What to do with a life" — was anchored on CCC 1877–1889, which is
headed _the communal character of the human vocation_ and is about subsidiarity,
socialisation and the state. A reader asking how anyone is supposed to know what
to do with their life got thirteen paragraphs of social philosophy. **Read the
paragraphs under a heading before trusting the heading**, and search for the
reader's situation rather than for the topic's own word.

**A span can be too wide as easily as too short, and the subset scan cannot see
it.** `discrimen-gentium` reached CSDC 144–148 for the equal dignity of all
people and carried two sections on male and female complementarity into a page
about racism; `defensio-sui` carried CSDC 500–501 on wars of aggression into a
page about an intruder in a house. Nothing fails, nothing duplicates, and the
reader is handed material addressed to somebody else. Ask of every unit at the
end of a span whether this reader would have read that far.

**Where two magisterial texts differ, keep both. It is not this pass's business
to choose between them.** CSDC 405 states the death-penalty teaching as it stood
before CCC 2267 was revised in 2018 — _the traditional teaching of the Church
does not exclude the death penalty_ — and the first draft of this review dropped
it from `carceres` on the ground that `poena-capitalis` carries the current
paragraph. That was wrong, and it was wrong in the specific way the whole file
guards against (2026-09-10, by direction): a topic names spans and the works
speak, and silently withholding the older of two magisterial texts is a gloss
with no words in it. **Removing a passage for being superseded is an editorial
act; removing one for being about somebody else is not.** Only the second is
this pass's to make.

What the case actually exposes is a gap in the site, recorded under the open
question below: the reader sees both and is told when neither was written.

**The wrong door hurts more than a thin page.** `graviditas` is titled
_Pregnancy and miscarriage_, its keywords are _stillbirth_ and _losing the
baby_, and its second paragraph called abortion an abominable crime. That is not
a coverage defect — 2270 answers the question — but a paragraph aimed at a
reader who is not this one, and it is the failure `topics.md` built the doorways
to prevent.

**A subset is a signal, not a rule.** `quaestiones.json` forbids two topics with
the same anchor set and says nothing about a topic every one of whose units also
appears on a neighbour. Sometimes that is right — `masturbatio` sits inside
`pornographia` and should, since a reader asking whether it is always a mortal
sin deserves the two paragraphs that answer them and not the five that answer
somebody else. Sometimes it means the narrower topic was never anchored for its
own question at all, which is what `reditus` (inside `scrupulositas`) and
`communio-post-divortium` (inside `nullitas-matrimonii`) turned out to be. Read
the pair before deciding which it is; and note that widening one topic can
swallow a neighbour that was distinct the day before, as `pornographia`'s fix
did.

**The scan found one pair that was not a subset but a duplicate.**
`mors-voluntaria` and `mortis-desiderium` — the bereaved and the reader
themselves, the pair `topics.md` argues for most explicitly — carried CCC
2280–2283 with `lead` 2283 and `samaritanus-bonus`, in both entries. Two
identical pages, which is the one thing the file's own rule names. Fixed
2026-09-10 by giving the bereaved reader the canons their keywords ask for:
can. 1176, funerals are owed to the deceased faithful, and can. 1184, the list of
those deprived of them, on which suicide does not appear. `life-event /
death-and-dying` has not otherwise been read.

**A canon can answer what the Catechism can only name.** `post-abortum` said
excommunication and stopped, because CCC 2272 stops; the sentence that matters to
that reader is can. 1357, where a confessor may remit it in the internal forum.
Reach for the Code where the reader's own word is a legal one — _excommunicated_,
_annulment_, _defect of consent_ — and note that the Code is current where the
Catechism's own procedural sentences are not: 1463 reads as though a bishop must
be found, and the canon beside it is what settles the question.

**Widen before you reach.** `dubium-fidei` held CCC 162 alone, and the
paragraphs that answer it were 163–165 — the Catechism's own next heading,
sitting directly underneath the anchor the topic already had. Read what is
beside the anchor before searching the rest of the book.

**A `lead` is a compensation, and a better span retires it.** `amor-dei` led on
219 because its span opened on Israel's history and the reader needed the
strongest sentence first. Anchoring 604–605 — _there is not, never has been, and
never will be a single human being for whom Christ did not suffer_ — put a direct
answer at the top of the page on its own, so the field came out. The page now
carries no reordering disclosure because there is no reordering, which is the
better state: `lead` is the most editorial thing this site does.

**A keyword may over-reach where the alternative is silence, and that is a
decision, not a defect.** `mortis-desiderium` carries _self-harm_ and _alone_,
both of which `topics.md` holds back as topics because the corpus has nothing
addressed to them. Kept deliberately: the nearest true page is this one, its
2282 does speak to diminished responsibility, and a search that returns nothing
serves that reader worse than one that returns this. Distinguish it from
`pornographia`'s _addiction_, where a true paragraph existed and simply was not
anchored.

**Two topics sharing a paragraph is fine; sharing an anchor set is not.**
`pornographia` now reaches into `castitas`'s 2337–2350 for one paragraph and into
`masturbatio`'s ground for another, and stays a distinct page because the set and
its order differ. The rule the file states is about the whole set.

**A paragraph is addressed to somebody, and it is not always the reader.**
`iesus-christus` asks "Did any of it actually happen?" and was anchored on CCC
422–429, half of which is the Catechism's own section _At the heart of
catechesis: Christ_ — written to whoever is doing the teaching, down to "every
catechist should be able to apply to himself the mysterious words of Jesus".
The heading test above catches a paragraph about the wrong subject; this one
catches a paragraph addressed to the wrong person, and Part One is full of the
seam. Ask who a paragraph is talking to before asking what it is about.

**Where a work qualifies its own claim, anchor the qualification.** CCC 639–644
makes the historical case for the Resurrection — 1 Cor 15 dated to about A.D.
56, witnesses still living, disciples who did not believe the women — and 647
says that no one was an eyewitness to the Resurrection itself and no evangelist
describes it. A page carrying only the first is an argument; a page carrying
both is the Church saying what she does and does not claim, which is the only
thing a quotation is for here. It is the same reflex that keeps CSDC 405 beside
CCC 2267, arrived at from the other direction.

**A paragraph opening on "this" needs its antecedent on the same page.** CCC 847
is the sentence a reader asking about good atheists needs, and it begins "This
affirmation is not aimed at those who…" — where the affirmation is _extra
ecclesiam nulla salus_ at 846, on `salus-extra-ecclesiam` and not here. CCC 1260
says the same thing and stands alone, so `atheismus` took 1260. Read an anchor's
first clause as a stranger would: a pronoun with nothing on the page to point at
is a passage the reader cannot use, however well it answers.

**The Catechism answers an objection where it raises it, and that is rarely the
article named after the doctrine.** Eight of the nine topics in `argument /
other-christians` were anchored on the article that states the teaching and
missed the paragraph that meets the objection. `beata-virgo` had ten paragraphs
of Marian ecclesiology and not CCC 500, which opens "Against this doctrine the
objection is sometimes raised that the Bible mentions brothers and sisters of
Jesus" and answers it in four sentences. `iustificatio` had the whole treatise
on merit and not 2005 — "we cannot rely on our feelings or our works to conclude
that we are justified and saved" — which is the one a reader asking about _once
saved always saved_ came for. `unitas-christianorum` had ecumenism and not 838,
the only paragraph that says _Orthodox_. A doorway called `argument` is anchored
by the objector's vocabulary and not by the doctrine's name: take each keyword,
search the Catechism for that word, and read what comes back before trusting the
article the topic is obviously about.

**A `documents` list can reopen a blocklist decision from the side, and that is
not this pass's to do.** `concilium-vaticanum-secundum` carries the keywords
_latin mass_, _tridentine_, _sspx_ and _lefebvre_, and `docs/research/topics.md`
holds the Latin Mass back as a topic. The anchor fix is the one the keyword rule
above already prescribes — the nearest true thing, here CCC 1124–1125 and
1205–1206 on what may and may not be changed in the liturgy. But the corpus also
holds _Summorum Pontificum_ and _Traditionis Custodes_, and naming both under
`documents` would put the blocked subject on a shipping page without anybody
deciding to. Anchors are this pass's to change; a blocklist is not, and the row
says so rather than doing it quietly.

**A `lead` is also the right answer when the section has to stay whole.** The
rule above — a better span retires a lead — has a converse this cluster needed.
`dissensus` asks "What if my conscience says otherwise?", and the sentence that
answers it is CCC 1790, "a human being must always obey the certain judgment of
his conscience", which sits ninth in an article whose earlier paragraphs are the
formation of conscience and whose later ones are the qualification. Cutting to
1790 would drop the qualification; reordering by declaring reversed spans would
do the same reordering with no disclosure. `lead` moves the one paragraph,
leaves none out, and says on the page that it did.

**A paragraph in the wrong topic is a paragraph missing from the right one, and
the two fixes are one edit.** Three times now the thing being cut for dilution
turned out to be exactly what a neighbour lacked: CCC 126, the historicity of
the Gospels, was padding on `canon-scripturae` and is the answer on
`iesus-christus`; CCC 887, synods and episcopal conferences, was padding on
`primatus-romani-pontificis` and is the only paragraph in the Catechism that
says _synod_, which `synodalitas` needed; CCC 2275, embryos as disposable
biological material, was padding on `abortus` and is _frozen embryos_ on
`fecundatio-artificialis`. So when a span is too wide, do not just narrow it —
ask which topic wants the part you are removing. Two of the three moves also
ended a subset pair, which the scan had been reporting for months as a thing to
think about rather than a thing to do.

**A keyword is the only index into what the topic layer has never touched.** The
subset scan finds two topics that overlap; nothing finds a headed article of a
work that no topic reaches at all. `castitas` promised _purity_, _modesty_ and
_impurity_, and the Catechism's whole ninth-commandment article — 2517–2533,
purity of heart and modesty, four paragraphs of which are about clothing,
advertisements and what children are taught — was on no topic in the file.
Nothing was wrong that any check could see. The keyword was the only witness.

**A one-paragraph topic is not a thin one.** This pass spent most of its effort
widening spans, and the opposite error was waiting at the end of it. `islam` is
CCC 841 and `migratio` is CCC 2241, and in both cases that single paragraph is
the entire treatment the Catechism gives the subject — 841 says Muslims "adore
the one, merciful God" and there is no 842 on the matter; 2241 states the
obligation, the state's right to condition it, and the immigrant's own duties,
all three. Padding either would mean reaching for something general and calling
it an answer. The measure is whether the question is answered, never how much of
the page is filled.

## Open: the corpus has dates and the reader is not told them

**A magisterial text is not timeless, and this site currently renders it as
though it were.** CCC 2267 was rewritten in 2018; CSDC 405 was written in 2004
and quotes the paragraph 2267 replaced; _Fiducia Supplicans_ postdates all three
documents `homosexualitas` names. A topic that quotes two of these puts them in
one column, in the same type, with nothing between them — and a reader with no
reason to suspect a gap reads the older as current. `topics.md`'s blocklist
already names this for texts the corpus **lacks** ("a stale answer reads as a
current one"); `carceres` is the same failure arriving from texts the corpus
**has**.

The answer is not to choose — that was tried and reverted above. It is to say
when. What that needs, roughly in order of cost:

- **A date per work is already in the corpus**, and this review said otherwise
  until 2026-09-10. Every document manifest carries `promulgated`, and so do
  the Compendium's (2004-04-02) and the Code's (1983-01-25); the Catechism's
  is `null` and its `edition` string names the 1993/1997 second typical
  edition instead. So the cheap end of this is a read, not a scrape.
  `retrieved_at` remains a different fact — when a page was fetched.
- **A visible mark where a quoted unit has been revised since.** CCC 2267 is the
  case with a name; there will be others, and nobody has counted them.
- **A rule for the topic file.** Probably: where a topic quotes texts from both
  sides of a revision, it says so — but any such note is a sentence of ours
  between the heading and the quotation, which is the one thing
  `/quaestiones` promises not to do. That tension is unresolved and is the
  reason this is an open question rather than a plan.

This is bigger than the topic route: it is true of `/catechismus`,
`/doctrina-socialis` and `/documenta` alike, and belongs beside them rather than
here once somebody takes it up.

## Noticed while reading, and not a topic's fault

**can. 868 §1 2° renders in Latin in the English Code.** The English edition
carries _"spes habeatur fundata eum in religione catholica educatum iri, firma
§3; quae si prorsus deficiat, baptismus secundum praescripta iuris particularis
differatur, monitis de ratione parentibus"_ where the other clauses are English.
This is on `baptismus-infantium` and would be on any topic naming that canon.
Check whether the source page is like this before treating it as a parse defect —
the clause was amended in 2016 and an untranslated amendment is a plausible state
for the Holy See's own English text.

## How to run a batch

Read the paragraphs, in the topic's declared order, with the lead first:

```sh
jq -r --arg s pornographia \
  --slurpfile ccc "$CORPUS_DIR"/build/ccc.en/paragraphs.json \
  '($ccc[0]|INDEX(.n|tostring)) as $by
   | .topics[$s].ccc[] | range(.[0];.[1]+1) | tostring
   | $by[.] | "— CCC \(.n)\(if .in_brief then " [in brief]" else "" end)\n\(.text)\n"' \
  site/quaestiones.json
```

`build/csdc.en/sections.json` and `build/cic.en/sections.json` hold the other two
works, keyed the same way but carrying `blocks[].html` rather than `.text`. Read
the topic's three strings out of `src/lib/i18n/en.ts` at the same time; the
question is what is being tested and it is not in this file.

Before a batch, list the topics whose units all appear on some other topic — the
subset signal above. It is mechanical and the sync does not do it:

```sh
jq -r '.topics | to_entries
  | map({k: .key, u: [(.value.ccc//[]), (.value.csdc//[]), (.value.canons//[])]
      | to_entries | map(.key as $w | .value[] | range(.[0]; .[1]+1) | "\($w):\(.)")}) as $t
  | $t[] as $a | $t[] | select(.k != $a.k and (($a.u - .u) | length) == 0)
  | "\($a.k) (\($a.u|length)) is inside \(.k) (\(.u|length))"' \
  site/quaestiones.json
```

Then write the rows. Each is `grade`, `reviewed`, an optional `was`, the
`anchors` signature and the `note`, keyed by slug in `quaestiones.json`'s own
order. **Write `anchors` last, after the fixes**, since it states the set the
grade was formed on and the fixes are part of the pass. Its shape is
`ccc 2354,2351-2352 | csdc 204-208 | canons 1176 | lead 2283 | documents a,b`,
each work omitted when the topic has none, and `quaestiones.test.ts` recomputes
it — so a typo fails rather than sitting there.

A batch is one cluster. The first pass over all sixteen finished 2026-09-10, so
a batch now is a re-read: a topic whose anchors moved and whose row the test
refuses, a topic added to the file, or a cluster reopened because the corpus
gained a text a row names as missing. Read the B rows first — each one says
what would replace it.
