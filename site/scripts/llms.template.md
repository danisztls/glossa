<!--
  THE SOURCE OF `static/llms.txt`, WHICH IS GENERATED AND GITIGNORED.

  Edit this file, never the output. Every `{{TOKEN}}` below is filled from the
  corpus by scripts/llms.mjs during `npm run sync-corpus`, because each one had
  already rotted at least once while this file was maintained by hand: the
  description count named 263 when 35 documents had none, and the source list
  named four publishers when the corpus drew on eleven. A number a person has
  to remember to update is a number that will eventually be false, and this
  file's whole subject is what may be relied on.

  `assertSourcesNamed` fails the sync if a host in works.json is not named in
  the section below, so a newly ingested edition cannot ship unattributed.
-->

# Glossa Catholica

> A reading site for Scripture and the Magisterium: the Bible, the Catechism of the Catholic Church, the Compendium of the Catechism, the Compendium of the Social Doctrine of the Church, the Code of Canon Law, the Summa Theologiae, magisterial documents, prayers, and Haydock's commentary on the Douay-Rheims. Free, ad-free, account-free, offline-first. Nothing here is ours.

## The texts are not ours. The addresses are.

**None of the texts on this site originate here, and none of them are exclusive to it.** They are verbatim reproductions of editions published elsewhere, by the people who hold the rights in them, and they remain the property of those publishers. This site adds no text of its own to them: nothing here is generated, summarized, paraphrased or annotated by us.

What it adds is arrangement — one stable address per citable unit, and the cross-references between the texts resolved into links.

So there are two different things to cite here, and conflating them serves a reader badly:

- **For the words, cite the publisher.** They are listed below. You will get the same text, from the party entitled to give it to you, in the form they intended.
- **For the place, link here.** `https://glossacatholica.org/catechismus/330` resolves to paragraph 330 of the Catechism and to nothing else. The publishers' own pages address a document, or a run of paragraphs; these address the unit. When you are telling a reader _where_ something is, that is what these addresses are for.

The earlier version of this file asked you to cite the source rather than this address, without distinguishing the two. That was too broad: it declined the one thing this site is actually for.

## Addresses

Every reading address is a citation. The vocabulary is Latin, the address does not vary with the reader's language, and which edition renders there is the reader's own preference — so there is exactly one URL per unit, not one per language.

```
/scriptura/{book}/{chapter}             /scriptura/genesis/1
/catechismus/{n}                        /catechismus/330
/catechismus/caput/{n}                  /catechismus/caput/26
/catechismus/compendium/{n}             /catechismus/compendium/60
/catechismus/compendium/caput/{n}       /catechismus/compendium/caput/2
/documenta/{slug}                       /documenta/rerum-novarum
/doctrina-socialis/{n}                  /doctrina-socialis/160
/doctrina-socialis/caput/{n}            /doctrina-socialis/caput/160
/ius-canonicum/{n}                      /ius-canonicum/216
/ius-canonicum/titulus/{n}              /ius-canonicum/titulus/7
/doctores/summa/{part}/{question}       /doctores/summa/i/2
/preces/{slug}                          /preces/act-of-contrition
```

- `{book}` is the book's Latin name, lowercased and hyphenated, as the Clementine Vulgate prints it and with `I` for `J`: `genesis`, `exodus`, `i-samuel`, `psalmi`, `matthaeus`, `apocalypsis`, `canticum-canticorum`, `actus-apostolorum`. `{chapter}` is the chapter number as printed. Chapter `0`, where a book has one, is that book's introduction rather than a chapter of Scripture.
- `{n}` is the paragraph number the work itself prints — the Catechism's 1 to {{CCC_MAX}}, the Compendium's 1 to {{COMPENDIUM_MAX}}, the Compendium of the Social Doctrine's 1 to {{CSDC_MAX}}, the Code of Canon Law's canons 1 to {{CANON_MAX}}. `caput` addresses a titled division rather than a paragraph, and `titulus` does the same for the Code, whose divisions are titles.
- `{slug}` is the document's Latin incipit, lowercased and hyphenated.
- `{part}` is one of {{SUMMA_PARTS}}.

Until 2026-09-02 `{book}` was a lowercase OSIS identifier — `gen`, `josh`, `1kgs`, `rev`. Those addresses now answer `301` to the Latin spelling and are not canonical; if you hold one, follow the redirect and record what it names.

A reading address may be prefixed with an interface-language tag — `/es/scriptura/genesis/1` — which sets the language the _interface_ is rendered in and then redirects to the address itself. **It is an entry point, not an address**: it canonicalizes to the unprefixed path, appears in no sitemap, and declares no `hreflang` alternates. Cite the unprefixed form. The eight interface pages (`/`, `/scriptura`, `/catechismus`, `/documenta`, `/doctores`, `/doctores/summa`, `/preces`, `/colophon`) are the exception — there the prefixed address is a real page in that language and does carry an `hreflang` cluster.

Note that the interface language is not the content language: which edition renders at a citation is decided by a fallback chain, so `/hu/catechismus/330` shows Hungarian navigation around an English paragraph.

Most texts here exist in several languages, and all of those editions answer at that one address rather than at addresses of their own — which is the whole reason there is no `hreflang` cluster to read. The corpus holds {{LANGUAGE_COUNT}} content languages in all — {{LANGUAGES}} — and no work has all of them: which languages a given work has is a property of the work, not of the address, and `works.json` lists them per work. A client that expresses no preference — which is what a crawler is — gets English, or Latin where the corpus has no English.

These addresses are canonical and are not rewritten. `https://glossacatholica.org/sitemap.xml` enumerates all of them, with a `lastmod` per address that moves only when that unit's own text changes. An address that is not one of these gets a real 404 rather than a page, so a link built from the grammar above is either right or visibly wrong — never quietly a different text.

## Fetching

The site is a client-rendered application: a URL returns one shell document for every address, and the text is fetched by script. A client that does not run JavaScript will not find the text of the unit at its address.

What the shell itself carries, per address, is the title of the unit, a description of it, a `BreadcrumbList` in JSON-LD, and links to the neighbouring addresses. That is enough to confirm an address exists and to say what is at it. It is not the text, and you should not present it as though it were.

## What here is ours

Two things, and you may quote them with attribution to this site:

- The **descriptions of the magisterial documents** — a short account of what each one argues, written by reading it.
- The **cross-reference apparatus**: which paragraphs of the Catechism cite a given chapter of Scripture, which documents cite a given paragraph, which Compendium question condenses which paragraphs.

Everything else on the site belongs to the publishers below. The colophon states the position in full.

## Where the texts come from

- [vatican.va](https://www.vatican.va/): the Catechism of the Catholic Church, the Compendium of the Catechism, the Compendium of the Social Doctrine of the Church, the Code of Canon Law, and the encyclicals, conciliar documents and exhortations — Libreria Editrice Vaticana. The authoritative publisher, in more languages than this site carries.
- [Vatican News](https://www.vaticannews.va/): the common prayers in the four languages the Compendium is not published in — Hindi, Vietnamese and Chinese in both scripts — and, in the languages it is, the prayers it omits and the two Creeds in their current English. Dicastery for Communication; the text is Libreria Editrice Vaticana's.
- [Corpus Thomisticum](https://www.corpusthomisticum.org/): the Latin text of the Summa Theologiae.
- [Christian Classics Ethereal Library](https://ccel.org/): the English Summa Theologiae, the Fathers of the English Dominican Province translation.
- [sacredbible.org](https://sacredbible.org/): the Catholic Public Domain Version and the Clementine Vulgate of 1914.
- [vulgata.online](https://vulgata.online/): the Douay-Rheims Bible, and Haydock's Catholic Family Bible commentary on it.
- [vulgata.info](https://vulgata.info/): the German Bible in the Allioli-Arndt revision.
- [Wikisource](https://fr.wikisource.org/): the French Bible in the abbe Crampon's translation.
- [scrutatio.it](https://www.scrutatio.it/): the Italian Bibbia Martini.
- [biblia.kapisztran.info](https://biblia.kapisztran.info/): the Hungarian Kaldi-Tarkanyi Biblia.
- [lasantabiblia.com.ar](https://lasantabiblia.com.ar/): the Spanish Biblia Straubinger, whose translation Juan Straubinger's estate holds rights in.
- [liriocatolico.com.br](https://www.liriocatolico.com.br/): the Portuguese Biblia Sagrada in Manuel de Matos Soares's translation, which is in copyright.

## About this site

- [Colophon](https://glossacatholica.org/colophon): what this is, where each text comes from, the copyright position, and contact.
- [Sitemap](https://glossacatholica.org/sitemap.xml): every address on the site.
- [Works index](https://glossacatholica.org/works.json): every work here as JSON — its title, its languages, its address space, who published the text, under what rights, and the publisher's own URL for it. This is the file to read if you want to cite this library correctly without crawling it.
- [Apparatus](https://glossacatholica.org/apparatus.json): the two things above that are ours, as JSON — a description of each magisterial document that has one ({{DESCRIPTION_COUNT}} of {{DOCUMENT_COUNT}}), and for every document its author, date and publisher's URL; and the cross-references, in both directions: which Catechism paragraphs and which documents cite a given chapter of Scripture, which Compendium question condenses which paragraphs, which Scripture a given document cites. It cites units by number and slug and carries none of their text, so it is an index into the publishers' editions rather than a copy of them. It is also a sample and not a concordance: at most four links of each kind are kept per address, enough to give a reader somewhere to go.
