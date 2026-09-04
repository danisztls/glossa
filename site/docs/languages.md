# Languages

Interface language, content language, and what separates them. Which editions
exist at all is `pipeline/docs/languages.md`.

**Content language follows UI language**, with a per-work-type override as the
escape hatch. One switch, fewer surprising states; the override sleeps and
wakes on the UI language it was made under.

**`UiLang` and `ContentLang` are two sets.** They answer different questions —
a content language arrives when someone ingests a text, an interface language
when someone writes a dictionary — and either moves alone. **Do not derive one
from the other**: use `isUiLang`/`UI_LANGS`, never a literal list.

**A content language with no chrome is the honest state, and a whole work in
one is the case that does not wait.** A reader of a finished work inside an
English interface is worse off than a reader of one work in a tail language
(English chrome around English content is at least consistent), so a dictionary
is owed where the corpus can already fill a reader's language. What the
asymmetry must NOT do is leave the edition unnamed: `LANGUAGE_NAMES` is keyed
on `ContentLang`, and an unnamed tag degrades silently to itself — `ccc.mg`
offered itself in the edition menu as "mg".

**The rule was a sentence in a docblock, and nothing read it, so it came back
in five languages at once.** `UI_LANGS` became a superset of the content
languages in August and that was the whole of the enforcement; three later
ingestions each brought a language nobody had written a dictionary for, each
inside a commit about something else. Nothing broke — `t()` falls back per key
— and the only visible trace was an edition menu offering bare tags.

**So the fix is a check and not three more list entries.** `sync-corpus.mjs`
reads the real corpus, folds every manifest's `language` to its base tag, and
exits 1 on one with no `LANGUAGE_NAMES` entry or no dictionary. It has to live
in the sync rather than in vitest, which runs on fixtures. **Two tables, not
one, because the failures differ**: no dictionary leaves a reader inside
English chrome, no name leaves the menu offering a bare tag as a title. The
check could not be written until both tables left `corpus.ts` for a leaf module
(`lang-names.ts`), since Node cannot import anything reaching
`corpus-index.ts`'s glob. **A rule stated where the one process that could
check it cannot read it is a rule nobody is enforcing.**

## Tags

**A tag is an IDENTITY; a subtag is a VARIANT.** Every table that matters keys
on `baseLang`, which folds `zh-Hant` to `zh` — and folding is the point of it,
since that is how `prayer.common.en` and `.en-gb` become one row.
`pairEditions` makes it literal: it keeps the first edition per base language
and drops the rest. Under `zh-Hant` the Traditional prayers would be a regional
variant of the Simplified ones, unofferable and chosen for the reader by a
default nobody wrote — right for English spelling, wrong for a script. So the
app keeps Vatican News's `zht`, `bcp47()` in `ui-langs.ts` converts wherever a
tag leaves for a machine, and the URL keeps `zht` because a path segment
carries no BCP-47 obligation. **The real alternative was never `zh-Hant`; it
was `zh-Hant` plus a script exception inside `baseLang`**, and BCP-47 has no
way to say "these two are peers."

**`direction.css` must match `:lang(zh-Hant)` and not `:lang(zht)`, after
`:lang(zh)` rather than before it**: `:lang()` matches on hyphen-delimited
prefixes, so `zh-Hant` matches both selectors at equal weight and source order
is the whole of what separates them.

**The `Intl` half of that bargain is a test, because it cannot fail loudly.** A
three-letter primary subtag is structurally valid, so `Intl` does not throw and
the answer comes back in the browser's default locale — `library.ts` printed
`24.1` to a reader whose panel says `24,1` everywhere else. `i18n.test.ts`
scans `src/` for a `new Intl.*` handed a bare lang-shaped identifier without
`bcp47(`. **A shim is only as good as the places that remember it, so the
places are checked rather than documented.**

**And `zh-TW` does not fold to `zh`.** `browserLangs` reduces a browser tag to
its primary subtag, which is right for regional pairs and wrong for a script:
a Taiwanese reader would negotiate into Simplified chrome. `SCRIPT_VARIANTS` is
checked before the fold, and `app.html` carries its own copy for the pre-paint
pass — a disagreement there swaps every glyph at hydration. (Writing `zht.ts`
also revealed that `zh.ts` had drifted: its whole colophon was in Traditional
characters. Nothing mechanical can see that.)

## Falling back

**Content fallback is per language, at most one neighbour deep, and always ends
English then Latin.** `CONTENT_LANG_FALLBACK` was one global `['en', 'la']`,
which said where a reader ends up and nothing about where they should look
first. English then Latin ends every row and a test asserts it: English is the
only language the whole corpus exists in and Latin is complete wherever it
exists.

Each neighbour row rests on a claim about a specific readership rather than on
a ranking of languages by distance — `mg → fr` (the language the Church in
Madagascar works in, and `mg` has one work), `la → it`, `es ↔ pt`, `ar → fr`,
`hu → de`. **One neighbour at most, deliberately**: a longer row is a ranking
of languages by closeness, which is an argument nobody wins. A row that names
none is not a gap.

**The offline fill follows the same chain, three languages deep**
(`OFFLINE_LANG_DEPTH`). One order, walked by both edition resolution and the
download planner, so what a reader is routed to is what they have offline. The
cap is there because the fill is per language at ~3.3 MB: uncapped, a Spanish
reader would fill four languages against a German reader's three for a
preference neither expressed. **Every reader should pay about the same.** It
caps the fill and not the chain — `editionInLang` still walks every row to its
end.

**Direction is a property of the text, not of the reader.** `<html dir>`
follows the interface language; a content region takes its direction from the
`lang` it already declares. Write CSS in logical properties.

**Vulgate is the canonical versification.** Conversion is applied
unconditionally for divergent books rather than as a fallback, because a wrong
chapter does not fail an existence check — `Joel 3:1-5` resolves to real but
wrong text.

## Reading a printed label

**A division label is read in the language it was printed in.** `titles.ts`
strips the label a source prints on top of a structure title (`PART ONE`,
`ERSTER ABSCHNITT`), because `kind` and `n` already carry it and the site
prints its own translated marker. The table is a **second copy** of the
vocabulary `compendium.py` matches, deliberately not a generated one: the
scraper's copy decides what a heading _is_ and fails `validate` when wrong,
this one decides how a heading _reads_ and shows an unstripped label. Different
failure modes, and the source they both describe is a frozen capture.

**One language can print one kind two ways**, so the table is keyed by language
and the first entry that matches wins — French numbers its Compendium chapters
in roman numerals and its Catechism chapters in ordinal words.

**Title case is the only safe guess from an ALL-CAPS heading.** Sentence case
is unavailable: from `CREDO IN GESÙ CRISTO` nothing distinguishes `CRISTO` from
`FEDE`, and lower-casing a name is a loss no later pass can repair. So the same
pass runs everywhere and only its list of function words is per language — the
one thing that can be lower-cased with no risk. The ceiling is stated rather
than filed as a bug: German adjectives stay capitalised, because only a lexicon
separates them from the nouns German capitalises by rule.

**A list entry that is a coin flip does not go on the list.** Polish `i` is
both "and" and roman one; Hungarian `vagy` is both "or" and "you are". In both
cases the entry would have been right more often than not, which is not the
standard — the list's whole warrant is that lower-casing its members is
_always_ safe.

**A roman numeral that is a word is a per-language fact.** `DI`, `DIX`, `MI`
and `VI` satisfy every roman-numeral rule and are Italian, French, Hungarian
and Swedish words. The exclusions were counted out of the corpus, the same way
the acronym list is built.

**A description must be read, not recalled, and a translation is not a
reading.** `site/descriptions.json` carries `origin: "read" | "translated"`
plus a `from` chain, so correcting a reading marks every translation of it
stale by inspection. A fluent wrong summary is indistinguishable on the page
from a real one.

## The interface has addresses; the corpus does not

Eight chrome pages answer under an interface-language prefix (`/pt/catechismus`)
and ~5,800 reading addresses deliberately do not. A reading address names a
**citation**, the same citation in every language; a chrome page has no
citation in it at all, so its Portuguese version is a genuinely different page
rather than the same page relabelled.

**Prefixing the reading addresses was refused.** A Hungarian reader at
`/hu/catechismus/330` would be shown the ENGLISH Catechism through the fallback
chain, so `/hu/…` and `/en/…` would be byte-identical in the only part a
crawler weighs. Publishing that as an `hreflang` alternate is a false claim; it
would also take 5,811 addresses to 81,368 and force a `<sitemapindex>`.

**A reading address takes a prefix as an ENTRY POINT, and that refusal is
unchanged.** Every objection above is about PUBLICATION, and none reaches an
address that is never published: `/es/scriptura/genesis/1` is served, persists
Spanish exactly as the switcher does, is replaced in the bar by the bare path,
canonicalizes to it, is in no sitemap and declares no alternates. **What forced
it is that the site teaches the prefix and then refuses it** — a reader who has
seen `/pt/catechismus` writes `/pt/catechismus/330`, and extrapolating the rule
was the natural move.

**`?lang=es` was the cheaper answer and was refused.** It needs no edge work at
all, and it would not be a new category (`?compare=` is already read, written
and persisted the same way). What refuses it is that it leaves
`/pt/scriptura/…` a 404 and answers the question with a THIRD way of naming a
language. Twenty lines at the edge is the price of one rule.

**One prefix, never two.** `parseLangEntry` calls `isCanonicalPath`, which
calls back into it, so `/es/pt/catechismus/330` would otherwise peel a segment
per round and answer 200 — an address with 34×34 spellings.

**Every member of a cluster declares the whole cluster, and each
self-canonicalizes.** The unprefixed path is `x-default` and not "the English
page": it NEGOTIATES, which is a different claim, and `/en/catechismus` exists
separately because pinning English is a different thing from getting it. A
prefixed page canonicalizing to the bare path would ask to be de-indexed.

**Arriving at a prefixed page persists the language**, and the cost is stated
rather than hidden: a reader who has chosen English and follows a shared
`/pt/summa` link has their stored choice changed. Every link on the page that
follows is unprefixed, so honouring the language for one page and dropping it
would answer the search and lose the reader on their first click. These are
entry points, not a parallel site — which is why the internal link graph needs
no prefix-awareness at all.

**Not one new translated string was written.** `CHROME_KEYS` maps each chrome
page to keys the dictionaries already carry, so the head a Portuguese searcher
matches on is the sentence the page then shows them. Inventing a
`meta.description` key would have been thirty-three sentences needing
thirty-three speakers.

**`chromeNames` has no fallback to English, unlike `t()`.** A cluster whose
Portuguese member is described in English tells a search engine the page is
Portuguese and then shows it English. A missing key fails the sync instead.

**`dir` is why the edge writes `<html lang>` too.** An Arabic reader landing on
`/ar/catechismus` would otherwise watch the page flip sides once the app boots.
