# Languages the pipeline reads

Which editions are crawled and parsed, and what a new language costs. What the
site does with them is `site/docs/languages.md`.

**Every edition the source publishes as HTML is parsed, not just the ones with
a dictionary.** Four of the Compendium's ten HTML languages had no interface
translation, and that is not a reason to decline the text: a reader of
Hungarian gets the Compendium in Hungarian and everything else in English
through `CONTENT_LANG_FALLBACK`, which is better than getting the Compendium in
English too.

**The Magisterium is taken in every language the Holy See publishes it in and
this parser can read.** `DEFAULT_LANGS` was English and Portuguese and had been
read as a scope decision; it was a crawl-budget decision made when reaching
further meant ~2,400 requests against someone else's server. Both halves had
stopped being true — the pages were already in `raw/`, so 354 editions became
1,237 for 369 new requests. The languages are the ones `DIVISIONS` has a
division vocabulary for, which is a statement about what can be parsed rather
than about what is worth having.

**A division vocabulary is a table, and the cheapest useful entry is the
nouns.** `_NUMERAL` reads `CAPUT III` with no vocabulary at all, so five of the
twelve languages added in one day got an empty entry.

**A table written from the language is a table nothing measured.** Every entry
was read off the pages fetched that day, and the reading kept three languages
honest: Danish `DEL` scored 31 and is the preposition phrase "del i" in every
one, Croatian `DIO` scored 3 and all three are inside "vidio", Finnish `LUKU`
scored 1 and it is John's seventeenth chapter named in a sentence.

**Latin says "the other of two" where the other tables say "second".**
`PARS ALTERA` is the entry that would not have been guessed, and reading it as
anything else numbers Sacrosanctum Concilium 1, 3, 4. 163 Latin encyclicals sat
unparsed in `raw/` for the want of that one table.

**Asking a server about a new language should cost what the language costs.**
Deriving a translation's URL by substitution is how the corpus learned that
most of them 404, but it makes the price of ASKING the whole document count:
2,816 requests for eleven languages, 2,740 of them 404s. Every page carries a
switcher naming its document's real editions, and reading it off the copy in
`raw/` turns that into 76. `Crawl-delay: 2` is a commitment about our conduct,
not a budget to spend down, so a cheaper way to ask the same question is not an
optimisation.

**A language column with a hole in it is a claim about someone else's server,
and it has to be written down.** `translations-checked.json` held 125 records
while 619 pages sat under `raw/` carrying the same answer, classified on every
run and forgotten when the run ended.
`pipeline/scrapers/record_translations.py` reads them off cache and writes them
down. It is a separate script rather than a flag on the scraper because a
status is established deliberately, never as a side effect of a parse — a
scraper that appends to its own input turns one bad run into a permanent record
— and it writes nothing for a page that PARSES, because that would be a parse
we lost dressed up as a translation that does not exist.

**`pdf-only` is a status and the first that does not mean absent.** Filing an
edition vatican.va publishes only as a PDF under `stub-page` would read as "the
Church never published this in English". The two absences point in opposite
directions, one at the source and one at us, and only the second is ours to
close.

**A discovery regex narrowed to what the parser can read silently decides what
the LEDGER can know.** `_VATII_LINK_RE` required `.html`, so seventeen Vatican
II editions published as PDFs had never been seen and no ledger said they
existed — while Hebrew looked complete, because the one Hebrew edition that is
HTML had been captured. The ledger's whole job is to tell "asked and the answer
was no" from "never asked", so `_VATII_PDF_LINK_RE` reads them off the same
index rather than a hand-written table.

**Most of the Magisterium outside English prints no paragraph numbers, and that
is the edition rather than a defeat.** 328 editions store their whole text in
`appendix.json` under the headings the source does print, and so have no
citable address at all.

## Reading a region of a file nobody had read

**Before adding a source, read the whole of the one you have.** Every
Compendium edition prints the two Creeds and the Our Father in its body, in the
same page `prayers.py` was already reading Appendix A out of; nothing had ever
read that region because the scraper was written to look for an appendix. Eight
prayer editions were completed without one request, and the four PDF-only
Compendium editions gave four more the same way.

**What made a reader safe in four languages nobody here reads is that the Latin
does every job.** The page is parallel text, so the printed Latin is the ANCHOR
(titles read off `prayer.common.en`'s own Latin column rather than retyped),
the BOUND (where a prayer's Latin stops its vernacular stops, which is what
cuts twenty-four prayers apart), and the CHECK (every extracted Latin word
folded against the English appendix's). Not one line of the reader tests a
vernacular string.

**Two limits are the file's and are recorded as the file's.** The Belarusian
PDF prints a Latin column and publishes none of it — its accents are separate
positioned glyphs, and two readers fail differently and both irrecoverably.
That is `latin_unreadable`, deliberately not `no_latin`, which says the SOURCE
printed nothing: a reader has to be able to tell "not printed" from "not
readable", and only one of the two is a fact about the book.

**A downstream repair outlives the bug it was written for and then starts
producing it.** poppler ends a `<word>` where the font forces it to, so
`poppler_lines` was joining on the tag and putting a space inside `sæcula`; the
threshold that fixes it is measured (over 37,757 word pairs the gap is bimodal
with an empty band between 0.1pt and 0.7pt). `PdfEdition.repair_small_caps` was
that same defect patched one layer too late, and with the cause fixed it became
damage, closing `«ВЕРУЮ В БОГА»` into `«ВЕРУЮ ВБОГА»`.

**A number that explains a symptom is not evidence that it caused it.** A
missing line of the Russian Nicene Creed looked exactly like
`furniture_strip=0.17` landing on a block that opens at y=101.1; `_in_furniture`
compares the BASELINE, so the head clears at ~89 and the body at ~110. Acting
on the plausible reading would have re-admitted 164 running heads to fix a line
that was somewhere else. The diff of the rebuilt work is the evidence.
