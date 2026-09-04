# Linking out

Until 2026-09-02 every link this site made pointed at a locus inside its own
corpus, and `llms.txt` said as much: **cite the publisher for the words, link
here for the locus**. An outbound link is a new kind of object here, and the
Acta are still the whole list.

**AAS is a venue, not a work, which is why it is linked and not ingested.**
`AAS 86 (1994), 386-387` addresses a page in a printed volume, and this
corpus's address grammar is unit-based. The Holy See publishes it only as
scanned OCR PDFs, and the citation is a provenance note in the first place —
the reader wants the _document_. It is simultaneously the most-cited absent
source in the corpus (23,245 references) and the one with least to gain from a
parse.

**A derived href, never a table of rows.** An outbound URL table is this
project's known failure shape — the silent stale answer, unverifiable at build
time without network. The volume is in the citation string, so the address is
computed from it, and a derivation cannot rot one entry at a time the way a
typed row can. Prefer a derivation wherever the citation carries the key; where
a row is unavoidable, hold it to the `absent-sources.json` standard.

**The printed year is a CHECK, not an input, and that is the load-bearing
part.** AAS volume _n_ is the year 1908 + _n_ without exception, so the
citation states the same fact twice and both must agree before anything is
linked. Deriving the year would be one line shorter and quietly wrong, because
a long tail of pre-conciliar citations reads `AAS 18 (1885)` — volume 18 of the
**Acta Sanctae Sedis**, written under the later siglum out of habit. Derived,
each becomes a confident link to a real volume forty years wrong; checked,
1908 + 18 ≠ 1885 and the reader is told nothing instead. Of 22,885 references
carrying a volume, 22,417 print a year and 256 disagree.

**What is linked, and what the ceiling is made of.** 16,531 references (71.1%)
resolve to a volume PDF. The largest refusal is not a gap in the code: volumes
95 onward are published one PDF per _month_ under an Italian month name, and a
citation gives volume and page and never a month, so those 5,524 are
unresolvable in principle. The 92 addresses the derivation builds were each
confirmed 200 and `application/pdf` by HEAD.

**The chrome goes inside the disclosure, not on the siglum.** The obvious
affordance is an external-link glyph beside every `AAS 58`, and there are
thousands of them in a column that is already mostly apparatus. A siglum
already opens a card saying what its letters stand for; where the volume can be
read is the same kind of answer, so it rides in that card. It says "scanned
PDF" for two reasons: the reader is owed the format before the tap, and on a
page being read offline the link is dead and this is the only warning there can
be.

**Containment: it is not a slug and must never become one.** `slug` stays null,
`refHref` still declines the segment, and nothing that resolves addresses on
this site sees an AAS volume as one of them — the reference-coverage table is
byte-identical across the change, which is the check that says so. An external
address is a separate optional field for that reason rather than a nullable
slug.

**Acta Sanctae Sedis is a TABLE — the exception the paragraph above asks for
evidence before making.** Two things make a derivation impossible rather than
inconvenient: the filename does not follow from the volume (`ASS-32-1899-900`,
`ASS-33-1900-1`), and the check only half derives, since `year − volume ==
1867` holds from volume 9 up and fails for all eight below it, where the early
volumes span two years apiece. **What licenses the table is that the series is
CLOSED**: it ceased with volume 41 in 1908 and cannot gain one, so the only way
it rots is vatican.va moving the files, which breaks the AAS derivation in the
same breath. **That is the shape of evidence to ask for before writing the next
one — not "the rows are few" but "the set cannot change".**

**The year check is what makes the volume's SPELLING not matter.** A volume
reaches the table three ways because the corpus prints it three ways — a digit
locus, a Roman numeral (`ASS XXVIII (1895-1896)`), and the head of a
comma-chained locus carrying volume, year and pages together — and none needed
a new tolerance, because each is answered by the same two-token check. On the
Roman numerals it earns its keep twice over, refusing `ASS XXII (1930)` and an
`ASS XII (1908)` whose source has set volume XLI as XII. 258 citations link,
across 27 of the 41 volumes.

**A first pass refused the Roman and unbracketed forms as "a different locus
grammar", and that was wrong in a way worth recording.** `ASS XXVIII` is
`ASS 28`; the spelling of a numeral is not a different address, and "`LOCUS_RE`
only reads digits" is a fact about the implementation offered as if it were a
fact about the citation. **The tell is that the refusal had no failure to point
at.** Where a shape is refused, the reason has to name what would go wrong;
where it names only what is currently written, it is a to-do wearing a rule's
clothes.

**What is refused now is refused on the year alone.** The one genuine cost is a
citation printing the DOCUMENT's year rather than the VOLUME's. Accepting ±1
would recover a handful and is the one thing this design refuses — a tolerance
invented to fit the cases in front of it, on a check whose whole value is that
two tokens must agree.

**Still not linked out, deliberately.** The papal minor magisterium — roughly
2,000 citations, every one on vatican.va at an address the citation does not
derive. That family needs a discovery crawl of the pontificate indexes, which
is most of the work of _ingesting_ it, so the question is not "link or parse"
but how much the site wants to be. Denzinger, Migne and Sources Chrétiennes
have no link to give at all.
