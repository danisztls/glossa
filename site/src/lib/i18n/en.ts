/**
 * English UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). English is the fallback for every key any other
 * dictionary leaves out, so a translation may be partial without breaking a
 * page — `t()` reaches for `en` before it gives up and shows the key.
 */

import type { Dictionary } from '../i18n.svelte';

export const en: Dictionary = {
	'nav.bible': 'Bible',
	'nav.ccc': 'Catechism',
	'nav.compendium': 'Compendium',
	// "Magisterium" over "Documents"/"Magisterial Documents" — the name
	// shown in the navbar and the home-page Library group; the route path
	// stays `/documents` regardless (URL and display name needn't match,
	// and `/documents` stays accurate as encyclicals/exhortations/CDF
	// documents join the 16 Vatican II texts already here).
	'nav.magisterium': 'Magisterium',
	'nav.socialDoctrine': 'Social Doctrine',
	'socialDoctrine.landing.title': 'Compendium of the Social Doctrine of the Church',
	'socialDoctrine.landing.tagline':
		'What the Church teaches about life in society, in 583 numbered paragraphs.',
	// The siglum this work is cited by, which no edition of it prints: the
	// Compendium's own abbreviations table names AAS, DS and the parts of the
	// Summa and never itself, so each form here is the one that language's
	// citations settled on rather than one the text hands us. `CSDC` is the
	// international form and the answer every dictionary without a key of its
	// own falls back to. NOT `SDC`, and not `DSI` in Portuguese: both name the
	// social doctrine, not the 2004 volume that numbers it.
	'socialDoctrine.abbrev': 'CSDC',
	'nav.canonLaw': 'Canon Law',
	'canonLaw.landing.title': 'Code of Canon Law',
	'canonLaw.landing.tagline': 'The law of the Latin Church, in 1,752 canons across seven books.',
	// `Can.` is the abbreviation every edition of the Code prints and every
	// citation of it uses, including in languages that spell the word
	// differently — so it is a translatable key rather than a constant, and
	// most dictionaries will still answer `Can.`
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Cann.',
	'canonLaw.prevCanon': 'Previous canon',
	'canonLaw.nextCanon': 'Next canon',
	'canonLaw.readFullTitle': 'Read the whole title',
	// The disclosure over a wording a later act replaced. It names what the
	// text under it IS, because the alternative — a label like "History" —
	// leaves a reader to guess whether they are looking at the law.
	'canonLaw.superseded': 'Wording replaced by',
	'nav.prayers': 'Prayers',
	'nav.bookmarks': 'Bookmarks',
	'nav.menu': 'Menu',
	// THE FOOTER'S INDEX, AND THE THREE KEYS IT NEEDED THAT NOTHING ELSE HAD.
	// Every link in it was already written in all thirty-seven languages —
	// the bar's five, the catalogue's works, Bookmarks — because the footer
	// invents no destination the site did not already name. These three are
	// the frame around them, and they are English-only for now on the rule
	// this file opens with: `t()` falls back key by key, so a dictionary that
	// has not been revisited shows two English column heads over links in its
	// own language rather than a page that fails.
	//
	// `nav.sections` is the accessible name of the footer's `<nav>`, and it
	// exists because `nav.menu` is the header's. Two navigation landmarks
	// announced as "Menu" is a screen reader telling a reader they are back
	// where they started.
	'nav.sections': 'Sections',
	// The two column heads, and the split is the site's own: a WORK is text
	// somebody else wrote and this site reproduces, a PAGE is something this
	// site made — a catalogue, a calendar computed in the browser, a guide,
	// the reader's own marks. That is the same line `/bibliotheca` draws when
	// it shelves the works and puts Bookmarks last.
	'nav.works': 'Works',
	'nav.pages': 'Pages',
	'home.title': 'Glossa Catholica',
	// NAMED FOR WHAT IT IS, NOT FOR WHERE IT RENDERS, and that is the whole
	// point of the third name in as many days: `home.continueReading`, then
	// `library.continueReading`, then this. The section moved off the home page
	// (a surface empty for every first-time reader), then off `/bibliotheca`
	// and onto `/signata`, and each move made the key name a claim the codebase
	// was no longer keeping. `reading-position.ts` is the module behind it and
	// the section is that module's one rendering, so the key can now outlive
	// wherever it is put. The label is the same words in all thirty-seven
	// languages, so every rename was mechanical rather than re-translated.
	'reading.continue': 'Continue reading',

	// --- `/`, the home page (`routes/+page.svelte`) --------------------------
	//
	// THREE KEYS, AND THE PAGE'S WHOLE BILL. Everything else on `/` is a name
	// or a sentence some other page already wrote in all thirty-seven
	// languages: each door is titled by `nav.*` and described by the tagline its
	// own landing page carries, and the shortcut line under the specimens is
	// `jumpbox.hint`. That is the same discipline `/bibliotheca` states for
	// itself, and it is why a page that gained two sections cost three strings.
	//
	// **`/` IS IN `CHROME_PATHS` AND STAYS THERE** (2026-09-06, by direction),
	// which these three were the one exception to until they were translated
	// later the same day. `route-manifest.ts` holds three pages out of that
	// list because a cluster must not claim a page is written in a language it
	// is not; the root cannot take that remedy — a home page in no sitemap row
	// and no `hreflang` cluster is worse than one whose two section headings
	// fall through to English. What the rule
	// actually protects is intact either way: `/`'s own `<title>` and
	// description are `home.title` and the five work names
	// `scripts/route-titles.mjs` composes, and all six are written everywhere.
	//
	// THE TAGLINE IS THE SENTENCE THIS SITE NEVER HAD. `route-titles.mjs` says
	// so in its own docblock — "`/` has no `description` key because it has no
	// tagline" — and composes the meta description out of work names instead.
	// The condition on switching that composition over was that this key be
	// translated, and it was met on 2026-09-06 — all 37 carry it; whether the
	// description SHOULD become the tagline is a separate call, and unmade.
	// It says what the site is and what it costs, in the order
	// `colophon.pointFree` and `colophon.pointOffline` say it, and counts
	// nothing (`CLAUDE.md` §Documentation conventions).
	'home.tagline':
		'A reading site for the Scriptures, the Catechism and the documents of the Magisterium — free, offline, and nothing to sign up for.',
	// The heading over the four doors. NOT "Where to begin", which is
	// `schola.landing.title` and a different promise: that page proposes an
	// order to read in, and this one only says which way the rooms are. A
	// translation should keep it a direction and not an instruction.
	'home.doors.heading': 'Where to go',
	// The third way in (`docs/research/organization.md` §The three ways in),
	// after the day and the doors. "Or" is load-bearing: it is the alternative
	// to the four doors above it for a reader who already holds an address,
	// and the section under it is three specimens and the keyboard shortcut.
	// "Reference" is the word `jumpbox.hint` already uses for the thing typed.
	'home.find.heading': 'Or type a reference',
	// The Library door, and the page behind it (`routes/bibliotheca/`). The
	// key was `home.works` and had been written in all thirty-seven languages
	// for a home-page section that no longer existed — the label is the same
	// word, so it was renamed rather than re-translated.
	'nav.library': 'Library',
	// THE ONE IMPERATIVE ON THE BAR, and the trade is deliberate: it is the
	// only label a reader who does not yet know what a "Catechism" is can act
	// on (`docs/research/organization.md` §The bar). It named `/catechismus`
	// for one day and names `/schola` since — the word was chosen for a reader
	// who cannot yet name a division, and it pointed at a table of divisions.
	// Each dictionary uses whatever register its language puts on a nav item —
	// an imperative in the Romance languages and Latin, a verbal noun in the
	// Slavic ones and in Hungarian, where an imperative would read as an order.
	'nav.learn': 'Learn',
	// What the page holds, which is the catalogue and a way in to the reader's
	// own marks. It named the reading positions too until 2026-09-06, when
	// those moved to `/signata`; the other thirty-six dictionaries still carry
	// the older sentence, which describes a page linking to the record rather
	// than holding it — a smaller error than English asserting a section that
	// is not there, and the direction to correct in when anyone revisits them.
	'library.landing.tagline': 'The whole corpus, shelf by shelf, and what you have marked in it.',

	// --- `/bibliotheca/census`, the library counted (`routes/bibliotheca/census/`)
	//
	// ENGLISH ONLY, AND THAT IS WHY THE PAGE IS NOT IN `CHROME_PATHS`. `t()`
	// falls back key by key, so every interface renders this page with its
	// own chrome around English labels; what it must not do is declare an
	// `hreflang` cluster in every language over strings written in one
	// (`route-manifest.ts` argues the gate, `PLAN.md` sizes the promotion).
	// The numbers need no dictionary — a digit is a digit — and every name in
	// a ranking is the corpus's own, out of the edition the reader has open.
	//
	// NOT ONE SHELF HEADING IS WRITTEN HERE except the two that name nothing
	// on a shelf. The library's sections already have names everywhere
	// (`CENSUS_SHELF_KEYS` in `census.ts` maps each onto the key its own
	// landing page is titled by), on the rule `shelves.ts` states for the
	// catalogue: a second set of headings for the same shelves is a second set
	// to keep true.
	'census.title': 'Census',
	'census.tagline': 'How far this library reaches, counted.',
	// The three sections, named for the questions they answer rather than for
	// the shape of the data under them — "Totals" and "Tables" would describe
	// the markup.
	'census.holdings': 'What is here',
	// NAMED FOR WHAT IT MEASURES, where its neighbours are named for the
	// question they answer. The matrix is the one section of the page a reader
	// arrives looking for by name — "does this library have my language" — and
	// "What a reader can reach" describes the axis without naming the subject.
	'census.reach': 'Multilingual coverage',
	'census.cited': 'What is cited',
	'census.citers': 'Where the cross-references come from',
	// The two shelf headings the library's own sections do not supply, and the
	// two that name no shelf: they lead the list side by side, because the
	// collection and the apparatus over it are the frame the seven works sit
	// in. Bare nouns and not "The whole collection" — every other heading here
	// is the name of a work with no article in front of it, and a definite
	// article on two entries of nine reads as a different kind of entry.
	'census.shelf.library': 'Collection',
	'census.shelf.apparatus': 'Apparatus',
	// THE SENTENCES. One per shelf, with its numbers substituted in by
	// `censusProse` — every `{placeholder}` is a fact the build derives, and
	// `census.test.ts` fails on one without the other in either direction.
	//
	// A SENTENCE AND NOT A ROW OF COUNTS, and the apparatus is why: as a list
	// of six numbers under a total, four of them summed to a fifth of it and
	// read as broken. They were not — a cross-reference is an edge and those
	// were its endpoints — but nothing on the list said so. Prose can state a
	// relation; a column of figures can only invite arithmetic.
	'census.prose.library':
		'{editions} editions of {works} works, in {contentLanguages} of the languages they were written or translated into, at {addresses} addresses. The interface itself speaks {interfaceLanguages}.',
	'census.prose.bible':
		'{books} books between them, in {languages} languages — {editions} editions, {annotated} of them carrying a commentary.',
	'census.prose.catechism':
		'The Catechism’s {paragraphs} paragraphs in {languages} languages, and its Compendium’s {questions} questions in {compendiumLanguages}.',
	'census.prose.socialDoctrine': '{paragraphs} paragraphs, in {languages} languages.',
	'census.prose.prayer': '{prayers} prayers, in {languages} languages.',
	'census.prose.canonLaw': '{canons} canons, in {languages} languages.',
	// "described here" is where the page says which prose on this site was
	// written here rather than by a publisher — the one thing here that is not
	// somebody else's fact.
	//
	// It ended "described here in our own words" until the possessive went.
	// Saying where prose CAME FROM is what a reader needs and is checkable;
	// saying it is ours is a claim to standing, and `docs/colophon.md` settled
	// that the site claims nothing rather than claiming it in the weakest
	// available place. `llms.txt` was corrected in the same breath, and
	// `docs/writing-voice.md` carries the rule.
	'census.prose.magisterium':
		'{documents} documents in {languages} languages, {described} of them described here.',
	// Named for the work and not for the shelf, because the shelf holds one
	// work: "{n} books" will be true when a second Doctor lands and is a
	// generous way to describe one.
	'census.prose.doctores':
		'The Summa Theologiae — {questions} questions in {parts} parts, {articles} articles — in {languages} languages.',
	'census.prose.apparatus':
		'{references} cross-references, running from {citingPlaces} citing places to {citedAddresses} cited addresses.',
	// The matrix. One line above it, because a reader meeting a grid of forty
	// columns needs to know what a cell is before the shape means anything.
	'census.reachLede':
		'Each column is one of the languages the interface speaks, ordered by how much of the library it carries. A filled cell is a work a reader of that language can read in full.',
	'census.reachRow': '{languages} of {total} languages · {of} addressable',
	'census.reachCell': '{value} of {of}',
	'census.reachNone': 'nothing in this language',
	// THE METHOD, STATED ONCE AND ABOVE THE TABLES, because both of its
	// clauses change what the numbers mean and a reader who meets them after
	// the tables has already read them wrongly. `site/docs/census.md` carries
	// the measurements behind each.
	'census.method':
		'A ranking counts the distinct places that cite a passage, not how many verses a quotation runs to. An edition’s own footnotes are left out, and so is a work citing itself: neither is evidence of how the rest of the library reads it.',
	'census.derived': 'Every number here is counted when the site is built.',
	'census.unavailable':
		'This build has not been counted. The census is written when the corpus is synced, and a site built from the sample texts has none.',
	// The number column's accessible name. The rows are addresses and counts,
	// so the count needs saying once for a reader who cannot see the column
	// head over it.
	'census.timesCited': 'Places that cite it',
	// One heading per table, and the same five strings label the chips that
	// show and hide them — a chip named anything else would be a sixth name
	// for a table already named on the page.
	'census.rank.books': 'Books of Scripture',
	'census.rank.chapters': 'Chapters of Scripture',
	'census.rank.documents': 'Documents of the Magisterium',
	'census.rank.ccc': 'Paragraphs of the Catechism',
	// There is no `census.rank.summa`: the Summa's rows are named by
	// `doctores.landing.title`, the shelf's own name, which is what
	// `CENSUS_SHELF_KEYS` and `CITER_KIND_KEYS` already do for it — one name
	// among four naming shelves must not be a single book (`rankLabelKey`).
	// THE THREE `i` BUTTONS, and each names what it is about rather than saying
	// "more information": a trigger with no text of its own is read out by its
	// label alone, and three buttons called the same thing on one page are
	// three buttons a screen reader cannot tell apart. `art.about`,
	// `bookmark.about` and `lectionary.about` are the same shape.
	'census.about.derived': 'About these numbers',
	'census.about.reach': 'About this coverage',
	'census.about.cited': 'About this ranking',
	// The chips' group label. `CitedBy` points its filters at the panel's own
	// heading; here the heading is "What is cited", which names the section and
	// not the choice, so the group says what pressing one does.
	'census.rankFilter': 'What to rank',
	// THE PAGER. A kind now publishes up to a hundred rows and the page shows
	// twenty at once, so the `<nav>` beneath the table needs its own
	// accessible name, distinct from the chips' group above it and from every
	// other `<nav>` on the page. The position between the two buttons is a
	// sentence rather than a numbered strip of pages — nothing about rank 87
	// is worth landing on directly, and a reader who has scrolled past the
	// top of the list still needs to know where they are.
	//
	// TWO NAMES BECAUSE THE PAGE HAS TWO RANKINGS and a `<nav>` is a landmark:
	// both pagers would otherwise announce as "Ranking pages", which is the
	// collision the footer's own `<nav>` is named against. The buttons and the
	// position are shared, those being read out inside a landmark that has
	// already said which list it pages.
	'census.rankPages': 'Ranking pages',
	'census.absentPages': 'Pages of editions not held',
	'census.absentAuthorPages': 'Pages of works not held',
	// THE ARROWS' ACCESSIBLE NAMES AND NOT THEIR LABELS. Each button draws
	// `arrow-left`/`arrow-right` and prints nothing, so `aria-label` is the
	// whole of what a screen reader has to go on — and a picture announces
	// nothing at all. They stay one word: the landmark above has named the
	// list, so "Previous page of the ranking of works this library does not
	// hold" would be a sentence rebuilding a name the reader has just heard.
	'census.rankPrev': 'Previous',
	'census.rankNext': 'Next',
	'census.rankPageOf': 'Page {page} of {pages}',
	// UNDER THE BREAKDOWN, AND IT CLOSES AN ARITHMETIC. The rows below name
	// only the citers a ranking counts, so they sum to less than the total the
	// ledger states — this says by how much and refers back to the rules that
	// took the difference out, rather than printing a row for a family no
	// table on this page counts.
	'census.citersLede':
		'{counted} of the {references} cross-references count towards the ranking above. The rest are set aside by the two rules under it.',

	// THE FOURTH SECTION, and named in the same family as the two that open
	// the page — "What is here", "What is cited" — because it answers the
	// same shape of question: what is cited, and not held. Its rows carry a
	// name and no link, the address being exactly what is missing.
	'census.absent': 'What is cited and not held',
	// TWO LISTS UNDER ONE HEADING, and the plainest true names for them: one
	// holds people, the other holds books. Both earlier attempts overreached.
	// "Whose works this library is cited for" ran the relation BACKWARDS —
	// this library's own apparatus does the citing, and nobody cites the
	// library for Augustine. "The editions those texts are printed in" was
	// false of most of the second list, which holds a gazette, a code, a
	// liturgical book and a catechetical directory beside the critical-edition
	// series. "What a citation names"/"what it abbreviates" was true and
	// described the GRAMMAR of the row rather than the thing, which is a
	// distinction the reader has no reason to hold.
	//
	// A handful of rows in the first list are anonymous works rather than
	// people — the Didache, the Shepherd of Hermas — because the apparatus
	// puts them where it puts an author. The method note concedes it; a
	// heading cannot.
	'census.absentAuthors': 'Authors',
	'census.absentEditions': 'Works',
	// A FOURTH `i` BUTTON, one section past the three the comment above
	// `census.about.derived` counts, and it has to read apart from
	// `census.about.cited` — both sit on this page, and a screen reader
	// meeting "About this ranking" twice cannot tell which table either one
	// is over. "List" is also the word that tells a reader what is different
	// about the rows under it before they reach the method that says why.
	'census.about.absent': 'About this list',
	// PRINTED UNCONDITIONALLY ON PAPER, like the other three methods on this
	// page. Two things a reader needs before the rows mean anything: a row
	// names a work the corpus's own apparatus asks for and this library does
	// not hold, so there is no address to give it; and the list corrects
	// itself rather than being curated, a row leaving it on its own the day
	// the work it names is ingested. Counted the same way as the ranking
	// above it — distinct citing places, not how many times a citation
	// repeats.
	'census.absentMethod':
		'A row is a work this corpus’s own apparatus names and this library does not hold, so there is no address to link to. It counts the distinct places that cite it, the same rule the ranking above it is counted by. A work leaves this list on its own the day it is ingested. The first list holds the authors, read from the citations themselves and gathered across the languages that spell a name differently — with a few anonymous works among them, the Didache and the Shepherd of Hermas, which the apparatus credits where it would credit an author. The second holds books: critical-edition series, the Holy See’s gazettes, a doctrinal sourcebook, a code, liturgical books, a catechetical directory.',
	// CLOSES THE SAME ARITHMETIC `census.citersLede` closes one section up,
	// and for the same reason: a list of a few dozen names reads as the whole
	// of what this library lacks, and it is a small part of it. Most of what
	// a footnote fails to resolve names nothing any list could rank at all —
	// an unexpanded "Ibid." chief among them, which is why that count is
	// broken out rather than folded into the rest.
	'census.absentLede':
		'{works} works are ranked below. A much larger number of citations — {unread} — resolve to nothing at all and name no work this or any list could rank, of which {ibidem} are an “Ibid.” whose antecedent could not be carried across a footnote run.',

	// --- `/schola`, the guide (`routes/schola/`) -----------------------------
	//
	// NOT ONE OF THESE KEYS IS A NAME. Every book, part and document named on
	// that page is titled by the corpus itself in the reader's own content
	// language, every work's heading is the key that work's own landing page
	// is titled by, and every feature's heading is the key its own control is
	// labelled by — so nothing on the page is named twice and a translated
	// interface cannot disagree with its own guide.
	//
	// WHAT IS WRITTEN HERE IS SENTENCES: what a work is, what its unit of
	// citation is called, and what a feature does. That is the part
	// `docs/research/audiences.md` §5 actually stops at — not where a work is,
	// but what KIND of thing it is, what authority it carries, and what `CCC 1`
	// means when somebody writes it down.
	//
	// Until all thirty-seven dictionaries carry them, `/schola` stays out of
	// `CHROME_PATHS` — see `route-manifest.ts`, which holds `/calendarium` and
	// `/catechismus/compendium` out by the same gate.
	'schola.landing.title': 'Where to begin',
	'schola.landing.tagline':
		'A short guide to what is here: what each of these books is, how a citation of it is written, how to find a passage, and orders for reading that the Church has set out.',
	// THE ONE PLACE THIS SITE SPEAKS FOR ITSELF. It has a heading of its own
	// now — the reader's own question — where it was a stray paragraph under
	// the page's tagline with a line of small print beneath saying whose advice
	// it was. Both the accent rule that set it apart and that line are gone: a
	// page whose every other section lists what exists does not need a caption
	// to say that a paragraph beginning "begin with" is advice.
	//
	// SPLIT AROUND THE LINK, because the work it recommends is a page a reader
	// should be able to open from the sentence naming it. The two halves are
	// one sentence and must be translated as one — `install.hint.*` is split
	// around a glyph for the same reason and carries the same warning.
	'schola.start.heading': 'New to Catholicism?',
	'schola.start.body': 'Begin with the ',
	'schola.start.bodyAfter':
		': the same teaching as the Catechism, much shorter, written as questions and answers. It is about a tenth the length and assumes nothing.',

	// THE SECOND PLACE THIS SITE SPEAKS FOR ITSELF, and the last one allowed.
	// Its heading is the reader's own question, which is what tells it apart
	// from the sections that only list what exists.
	//
	// IT IS SET AS THREE NUMBERED STAGES, so the keys come in pairs: a stage
	// title of three or four words that can be read at a glance, and a blurb
	// under it for the reader who does not stop there. The title carries the
	// instruction — translate it as one, not as a noun phrase — and the blurb
	// carries the reason. Neither repeats the other.
	//
	// WHY IT HAS TO BE OURS. The Church states a narrative frame and never a
	// reading plan. `Dei Verbum` 25 asks that the faithful be taught the right
	// use of Scripture "especially the New Testament and above all the
	// Gospels" — a priority, not a sequence. `Verbum Domini` 41 says the two
	// Testaments are read in each other's light — a way of reading, not an
	// order. CCC 54-64's stages of revelation name no books at all. Every
	// year-long plan on sale supplies the missing list itself; so does this,
	// and the difference is that it says so.
	//
	// WRITTEN FOR SOMEONE WITH NO FORMATION AT ALL — who cannot name a book of
	// the Bible and has not met the word "Gospel". Short sentences, no term of
	// art used before it is explained, and no sentence that assumes the reader
	// has already decided to believe any of it.
	'schola.bible.heading': 'Never read the Bible?',
	'schola.bible.library':
		'It is not one book but seventy-three, written over more than a thousand years and bound in the order the Church settled on — not the order events happened in, and not the order that is easiest to read. Most people start at the first page and stop a few weeks later, in a long chapter of ancient law, because nothing has yet told them what it is for.',
	'schola.bible.step.gospel': 'Start with a Gospel',
	'schola.bible.start':
		'Four short books tell the life of Jesus. They sit past the middle of the Bible rather than at the front, which is why most people who start at page one never reach them. Begin there instead. A Council of the Church asked the same: that people be taught the right use of Scripture, “especially the New Testament and above all the Gospels”.',
	'schola.bible.whichGospel':
		'Each is argued for as the one to open first. Pick whichever reason sounds like yours.',
	'schola.bible.gospel.matt':
		"Has the Sermon on the Mount at its centre — the Beatitudes, the Lord's Prayer, most of what people quote without knowing where it comes from. It was the Church's first choice for centuries.",
	'schola.bible.gospel.mark':
		'The shortest. You can read the whole thing in an afternoon, and having finished one is worth more at the start than having chosen the best one.',
	'schola.bible.gospel.luke':
		'Written for someone outside the faith who wanted the story set down in order — which may be exactly you. It runs straight on into the Acts of the Apostles, so it is really the first half of a longer book.',
	'schola.bible.gospel.john':
		'The one that says outright why it was written: “that you may believe”. Plain words, and it goes straight at the question of who Jesus is.',
	'schola.bible.step.acts': 'Then what happened next',
	'schola.bible.thenActs':
		'When you have finished one, read what the people who knew him did after he was gone.',
	// A card with only a name on it for a day, on the reasoning that the stage
	// above has four books to tell apart and this one has a single book to
	// name. That is an argument about DISAMBIGUATION, and a card's second line
	// is not for telling one book from another — it is for telling a reader who
	// has never opened a Bible what they would be opening.
	'schola.bible.acts.why':
		'The thirty years after the Gospels end: a few dozen frightened people, and how what they had seen reached the far side of the empire.',
	'schola.bible.step.old': 'Then the older half',
	'schola.bible.thenOld':
		'Not from the first page, and not all of it. A few places carry the story, and they are the ones the Gospels keep pointing back to.',
	'schola.bible.ot.beginnings': 'How it begins, and how it goes wrong.',
	'schola.bible.ot.promise': 'One family, and a promise made to it that outlives everyone in it.',
	'schola.bible.ot.exodus': 'A people brought out of slavery, and given a law to live by.',
	'schola.bible.ot.psalms':
		'Not a story: a hundred and fifty prayers and songs. Read one at a time, in any order. The Church still prays these every day.',
	'schola.bible.bothWays':
		'You will recognise things, and that is the point rather than a coincidence. The Church reads the older books in the light of Christ and the newer ones in the light of what came before — each half explains the other, which is why neither is read alone.',
	// WHAT EACH WORK IS, AND WHAT ITS NUMBER MEANS. Two sentences per work: the
	// first is what kind of thing it is and what authority it carries, the
	// second is what a citation of it names. The heading above each is the key
	// its own landing page is titled by, and the specimen beside it is written
	// in `SPECIMENS` — a shape, not a reference to anything.
	//
	// A citation is the part nothing else on the site teaches. A reader who has
	// never seen one does not know that `CCC 1234` names a PARAGRAPH running
	// unbroken through the whole work, or that the Code numbers canons and not
	// pages — and the jump box reads every one of these notations back, which
	// is what the lede sends them to do with one.
	//
	// IDENTIFIED, NOT CITED (2026-09-07, by direction). "Cite" is the word for
	// what these numbers are for and it is a word the reader this section is
	// written for does not have yet — `audiences.md` §5 stops at the vocabulary
	// of the corpus, and the label was part of that vocabulary. The keys stay
	// `schola.cite.*`: the works ARE cited by these numbers, which is a fact
	// about the world and the right name for the strings; the label is what the
	// reader reads.
	//
	// **THE LABEL AND THE CLAUSE UNDER IT ARE ONE SENTENCE.** Every
	// `schola.cite.*` value opens with the preposition — "by paragraph number",
	// "by canon" — so the label has to be the participle that reads into it:
	// "Identified" + "by paragraph number". Translate the pair together, and
	// keep whichever half of the preposition your language puts where.
	'schola.books.heading': 'What is here, and how it is identified',
	'schola.books.lede':
		'Each of these is a different kind of book, and each is referred to by a number of its own. The examples show the form: type one like it into the search box and you land on the passage.',
	'schola.cite.label': 'Identified',
	'schola.what.scripture':
		'The Scriptures as the Church receives them, in both Testaments. Everything else here is read in their light.',
	'schola.cite.scripture': 'book, chapter and verse, in the abbreviations your own edition prints',
	'schola.what.catechism':
		'A summary of what the Catholic Church believes, in one volume. It is not itself a source: it gathers Scripture, the Fathers, the liturgy and the Church’s teaching, and every paragraph says where what it says comes from.',
	'schola.cite.catechism': 'by paragraph number, running unbroken from the first page to the last',
	'schola.what.compendium':
		'The same teaching set out as questions and answers, at about a tenth the length.',
	'schola.cite.compendium': 'by question number',
	'schola.what.magisterium':
		'What popes and councils have actually written — encyclicals, constitutions, decrees, declarations — each addressed to a particular moment and a particular question. Each is known by its opening words in Latin.',
	'schola.cite.magisterium': 'by the document’s name, then a section number inside it',
	'schola.what.social':
		'The Church’s teaching on work, property, the family, politics and peace, gathered out of those documents into one book.',
	'schola.cite.social': 'by paragraph number, under the siglum the work uses for itself',
	'schola.what.law':
		'Law rather than doctrine. It states what the Church requires, and it is amended.',
	'schola.cite.law': 'by canon, which is what its numbered units are called',
	// The second sentence is `doctores.landing.tagline`'s, word for word, and
	// deliberately not a paraphrase of it: two surfaces making the same claim
	// about the same works in two wordings is two sentences to keep true, and
	// this is the claim on which the site must not be found saying two things.
	// The first sentences differ because the jobs do — the card sits under a
	// title that already says Doctors and names the category, while this row
	// has to say what a Doctor IS, which is the whole reason a guide exists.
	'schola.what.doctors':
		'The theologians the Church has named Doctors. Their works are not infallible or final.',
	'schola.cite.doctors': 'by part, then question — the Summa’s own divisions',
	'schola.what.prayers': 'The words the Church prays, with the Latin beside them.',
	'schola.cite.prayers': 'by name; there are no numbers to cite',

	// THE THREE THAT ARE PAGES AND NOT TEXTS, so they take a `what` line and no
	// `cite` line at all: a calendar is addressed by a date and a bookmark by
	// whatever the reader marked, and inventing a notation for either would
	// teach a citation form that does not exist. They were rows in the chrome
	// guide above until 2026-09-06; a reader looking for the Library wants
	// somewhere to go rather than a button, which is the section they are in
	// now. Each is titled by the key its own destination is labelled by.
	'schola.places.heading': 'Not texts, but places on this site',
	'schola.what.library':
		'Every work on the site in one list, grouped by subject rather than by kind.',
	'schola.what.calendar':
		'The liturgical day — season, colour, and who is kept — for the country whose calendar you follow.',
	'schola.what.bookmarks':
		'Passages you have marked, and where you last left off in each work. Both are kept in this browser and are not sent anywhere.',
	// The placeholder in a paired index row where one of the two works has
	// nothing at that division — see `CatechismIndex.svelte` on why the gap is
	// drawn rather than closed.
	'ccc.noCounterpart': 'No counterpart in the other work',
	// THE LONG FORM IS THE ACCESSIBLE NAME AND NOT THE PLACEHOLDER, which is
	// the split made when the box grew a legend of its own: the trigger and
	// the dialog are named by this, where a screen-reader user gets no benefit
	// from brevity and does benefit from the examples, and the field itself
	// says `jumpbox.field` with the notations printed under it in full.
	'jumpbox.placeholder': 'Jump to… (e.g. john 3:16, ccc 1234)',
	// What the field says with nothing in it. Two words, because everything
	// the old placeholder crammed in after them is now a row in the panel.
	'jumpbox.field': 'Jump to…',
	'jumpbox.short': 'Search',
	// The lead over the notation legend — one row per work, the form beside
	// the name (`$lib/specimens.ts`). It carries the half the rows cannot: a
	// name is not a notation, and three quarters of this corpus is reached by
	// one. NOT a duplicate of `jumpbox.hint` below and not to be merged with
	// it — that one is the home page's line, where the box is shut and the
	// shortcut it names is true.
	'jumpbox.searches': 'Type a reference, or a name — pick an example to try it.',
	'jumpbox.hint': 'Press / or Ctrl+K to jump to a reference',
	'jumpbox.noMatch': 'No match',
	// The suggestion listbox's accessible name. The box has no visible
	// heading, and `aria-label` on the dialog names the DIALOG; a listbox
	// inside it is a second widget and owes its own name.
	'jumpbox.suggestions': 'Suggestions',
	// The key legend along the foot: one row per key that currently does
	// something, a `<kbd>` chip beside a word. With nothing typed that is
	// Escape alone. Single words, matching `ui.close` (reused for Esc) —
	// four of them have to sit on one line.
	'jumpbox.key.move': 'Move',
	'jumpbox.key.complete': 'Complete',
	'jumpbox.key.go': 'Go',

	// Appearance menu — SettingsMenu.svelte is the consumer; the dark-mode
	// and sepia stores are theme.svelte.ts, the text size is prefs.svelte.ts.
	// `sepia.lightOnly` is shown only while dark mode is actually active, to
	// explain why the sepia switch beside it is greyed out — it shares that
	// switch's row, so it has to stay to about fifteen characters.
	// `oled.darkOnly` is the mirror of it, under the same length limit, and
	// shows while LIGHT is what the reader is looking at.
	// `sepia.noHue` is the THIRD note that row can show: monochrome suspends
	// sepia the same way dark does, so the switch has two different reasons
	// to be greyed out and has to say which one applies. Same length limit.
	// `mono.label` names the setting and `mono.hint` says what it costs —
	// the label is a row title of the same width as the others, so the
	// sentence goes in the switch's `title` instead of beside it. Naming it
	// for the mechanism rather than for an audience is deliberate and was
	// arrived at the hard way: this row was once "Shape cues" and then
	// "Colour-blind", and a reader who wants a grey page should not have to
	// identify themselves to find it.
	// KEEP THE THREE `darkMode` OPTIONS SHORT. They are three cells of one
	// full-width segmented control inside a ~13rem panel, set uppercase at
	// 0.68rem, so a long word in any language pushes the panel wider.
	// SETTINGS AND NOT APPEARANCE SINCE OFFLINE MODE joined the panel
	// (`SettingsMenu.svelte` argues the rename). The trigger's icon did not
	// change with it: the sliders glyph reads as "settings" already, which is
	// half the reason the wider name fits.
	'settings.label': 'Settings',
	// The panel choosing what is set BESIDE the text — an edition's own
	// footnotes, and any commentary written on it. "Apparatus" is the word the
	// trade uses and the word this site's own prose uses throughout
	// (docs/decisions.md); "Notes" would have been plainer and would also have
	// been wrong for the half of the panel that is a separate work.
	'apparatus.label': 'Apparatus',
	'apparatus.editionNotes': "This edition's notes",
	'apparatus.commentary': 'Commentary',
	'apparatus.inCommentary': 'Included in the commentary above.',
	'darkMode.label': 'Dark mode',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'On',
	'darkMode.off': 'Off',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Light mode only',
	'sepia.noHue': 'Not in mono',
	'oled.label': 'OLED black',
	'oled.darkOnly': 'Dark mode only',
	'mono.label': 'Monochrome',
	'mono.hint':
		'Sets the whole page in a single grey, so nothing is told apart by colour. Sepia turns off while it is on.',
	// OFFLINE MODE — `AdvancedSheet.svelte`'s second block, and
	// `NotDownloaded.svelte` when it has refused something. `offline.hint` is
	// the sentence under the switch AND the body of that page, deliberately:
	// they are one sentence, and a reader who read it in the panel should
	// recognise it when it comes true. It names the price ("only texts already
	// here") rather than the mechanism, which is why it mentions neither the
	// service worker, nor the cache, nor the beacon.
	// Two surfaces, one word: the row in `SettingsMenu` that opens the panel,
	// and the panel's own title. One word because the panel names its two
	// blocks itself ("Offline library", "Offline mode"), so naming the subject
	// in the title too ("Advanced network") would say it three times.
	'advanced.label': 'Advanced',
	// THE OFFLINE LIBRARY — `AdvancedSheet.svelte`'s first block. Most of the
	// wave names are NOT here:
	// several of them reuse keys the translators have already written
	// (`nav.ccc`, `nav.bible`, `nav.magisterium`, `summa.landing.title`), which
	// is the cheap way to add a surface. Only the ones the interface had no
	// word for are below.
	'library.title': 'Offline library',
	'library.lede': 'Texts kept on this device open with no network at all.',
	'library.essentials': 'Prayers and Compendium',
	// Doré's engravings at the two widths a chapter draws — named for what a
	// reader would look for rather than for the artist, who is credited on the
	// colophon and in every plate's own caption. "(illustrations)" and not
	// "illustrated" because the row is not another Bible: it is the pictures
	// alone, and the text is the row above.
	'library.illustrations': 'Bible (illustrations)',
	// The same pictures at `PLATE_DETAIL_WIDTH`, which the viewer fetches only
	// when a reader zooms. A row of its own because it costs several times the
	// one above and is worth nothing to a reader who does not zoom — see
	// `WAVE_FOR_KIND`. It says "high resolution" rather than a pixel count: the
	// number is a fact about the file and the shelf is a question about what
	// the reader wants to be able to do.
	'library.illustrationsDetail': 'Bible (illustrations, high resolution)',
	'library.other': 'Other texts',
	// The totals row. A noun for the sum of the shelves, not a verb: the
	// buttons beside it say what can be done to it.
	'library.everything': 'Everything',
	'library.downloadAll': 'Download everything',
	// `library.download`, `library.remove` and their `…Confirm` are the names
	// of ICONS — a downward arrow and a bin — so they are the button's
	// `aria-label` and its `title` and are never rendered as text. A verb
	// alone, therefore: the row already says which shelf, and an icon button
	// whose label repeats the row reads it twice to a screen reader.
	'library.download': 'Download',
	'library.downloaded': 'On this device',
	'library.offlineNote': 'Turn offline mode off to download anything.',
	'library.remove': 'Remove from this device',
	'library.removeConfirm': 'Remove?',
	'library.forget': 'Remove downloads',
	'library.forgetConfirm': 'Remove everything?',
	'offline.label': 'Offline mode',
	'offline.hint':
		'Uses no network at all: nothing is downloaded, no update is checked for, nothing is measured. Only texts already on this device will open.',
	'offline.notDownloaded': 'Not on this device',
	// Reached from `+error.svelte` when a load threw while ONLINE — a dropped
	// request, not a wrong address. In all 37 since 2026-09-06; it was English
	// everywhere until then, which was better than `NotFound`'s wrong answer in
	// the reader's own and is not what a reader one retry from the page needs.
	'loadFailed.title': 'That did not load',
	'loadFailed.hint':
		'The page exists — something went wrong fetching it. Trying again usually works.',
	'loadFailed.retry': 'Try again',
	'loadFailed.retrying': 'Trying…',
	'offline.turnOff': 'Turn off offline mode',

	// THE READING BAR'S TYPE PANEL — `TypeMenu.svelte`; the store is
	// prefs.svelte.ts. `type.label` names the panel and its "Aa" trigger, and
	// has to cover both rows, which is why the trigger stopped reading
	// `fontSize.label`: that key names the size row and nothing else.
	'type.label': 'Text size and typeface',
	'fontSize.label': 'Text size',
	// THE FIVE STOPS ON THE SIZE RAIL, in order. The dots are wordless — they
	// grow along the rail, which is what says which end is which without a word
	// to translate — so these are the tooltip and the accessible name, and the
	// only place the sizes are named at all. Keep them to a word or two: one is
	// read at a time, over a dot, never as a row of labels.
	'fontSize.small': 'Small',
	'fontSize.medium': 'Medium',
	'fontSize.large': 'Large',
	'fontSize.xlarge': 'Extra large',
	'fontSize.xxlarge': 'Largest',
	// THE FACES ARE NAMED BY CLASS AND NOT BY FONT — "Serif", never "EB
	// Garamond" — because the site may set the text in another face and the
	// reader's stored choice outlives the name. It is also the vocabulary the
	// advice a low-vision or dyslexic reader has been given is written in.
	// KEEP BOTH SHORT: two cells of one segmented control in a ~9rem panel,
	// uppercase at 0.72rem, so about eight characters each before the panel
	// widens. A language takes its own typographers' short pair — `de` Serif /
	// Grotesk, `ja` 明朝 / ゴシック — rather than a literal translation.
	'face.label': 'Typeface',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Print this page',
	'toTop.label': 'Return to top',

	// Home-screen install — InstallButton.svelte (Chromium) and
	// InstallHint.svelte (iOS); the gating lives in install.svelte.ts.
	// The hint's instruction is split around the Share glyph because the
	// icon sits mid-sentence and names a button on the reader's own screen.
	// Both halves must be translated as one sentence, and the wording
	// tracks Apple's own: iOS spells the entry "Add to Home Screen".
	'install.label': 'Install Glossa',
	'install.hint.label': 'Add to Home Screen',
	'install.hint.title': 'Add Glossa to your Home Screen',
	'install.hint.stepBefore': 'It opens like an app and reads offline. Tap',
	'install.hint.stepAfter': 'then “Add to Home Screen”.',
	'install.hint.dismiss': 'Dismiss',

	// The update offer — UpdateBanner.svelte. Worded as an EDITION rather than
	// a version because that is what a reader of this site is actually being
	// offered: the corpus index ships inside the app bundle, so a superseded
	// copy is a superseded table of contents, not merely older code.
	'update.label': 'A new edition is available',
	'update.title': 'A new edition is ready',
	'update.body': 'Reload to pick up the latest texts and corrections.',
	'update.action': 'Reload',
	'update.dismiss': 'Not now',

	// Edition/version selector — EditionMenu.svelte is the consumer; store is content.svelte.ts.
	'edition.label': 'Edition',
	'edition.select': 'Choose edition',
	'edition.current': 'Current edition',
	// The search box the edition and language pickers grow once they are long
	// enough to scroll — see menu-filter.ts for where that threshold is and why.
	'edition.filter': 'Search editions',
	'menu.noMatches': 'No matches',

	// The only words the prev/next row at the foot of a reading page
	// PRINTS, in every route and every language. What is being stepped
	// through — a chapter, a question, a prayer — is named by the
	// per-route strings below, which reach the reader as the link's
	// `aria-label` and tooltip rather than as text; see UnitNav's
	// docblock for why the visible half had to shrink.
	'unitNav.previous': 'Previous',
	'unitNav.next': 'Next',
	'bible.prevChapter': 'Previous chapter',
	'bible.nextChapter': 'Next chapter',
	'bible.pickBook': 'Books & chapters',
	'bible.landing.title': 'The Bible',
	// A tagline says what the work is and how large it is, which is what the
	// Code's and the Social Doctrine's already do. The line this replaced —
	// "Read the whole Bible, book by book, chapter by chapter" — said neither:
	// it described the act of reading a book. 73 is a property of the canon
	// rather than of what is synced, and every edition in `bible-index.json`
	// carries it, so it does not rot. It is also the number that tells a
	// reader holding a 66-book Bible that this is not the same list.
	//
	// A translation should keep "receives" in the theological sense — the
	// canon as the Church has received it, not as it obtained a copy.
	// `schola.what.scripture` opens with the same clause and is the wording
	// to follow where a dictionary has already settled one.
	'bible.landing.tagline':
		'The Scriptures as the Church receives them, in 73 books across both Testaments.',
	'bible.landing.random': "I'm feeling lucky",
	'bible.landing.books': 'Books',
	// The canonical book/chapter structure is edition-independent, so the
	// picker can offer a chapter the reader's current edition lacks.
	'bible.chapterUnavailable': 'Not available in this edition',
	'bible.introduction': 'Introduction',
	'bible.introUnavailable': 'No introduction in this language yet',
	'bible.introSource': 'Introductions are not part of the scripture text.',
	'bible.testament.ot': 'Old Testament',
	'bible.testament.nt': 'New Testament',
	'bible.group.pentateuch': 'The Pentateuch',
	'bible.group.historical': 'Historical Books',
	'bible.group.wisdom': 'Wisdom Books',
	'bible.group.prophetic': 'Prophetic Books',
	'bible.group.gospels': 'Gospels',
	'bible.group.acts': 'Acts of the Apostles',
	'bible.group.pauline': 'Pauline Letters',
	'bible.group.catholicLetters': 'Catholic Letters',
	'bible.group.revelation': 'Revelation',

	'ccc.prevParagraph': 'Previous paragraph',
	'ccc.nextParagraph': 'Next paragraph',
	'ccc.inBrief': 'In Brief',
	'ccc.landing.title': 'Catechism of the Catholic Church',
	// THE PAIR UNDER ONE NAME, for `/bibliotheca`, where the Catechism and its
	// Compendium are one card leading to the one index that holds both. `ccc.landing.title` names the Catechism alone and is what
	// every OTHER surface wants, `/schola`'s row and the `<head>` included, so
	// this is a second key rather than a rewrite of that one.
	//
	// In all 37 since 2026-09-06, and it cost nothing to write: the two halves
	// were already translated (`ccc.landing.title`, `compendium.landing.title`)
	// and this is the pair under one name.
	//
	// TWO NAMES AND NOT THE FORMAL TITLE: it read "Catechism & Compendium of
	// the Catholic Church" until 2026-09-06, which is a title that has to be
	// read to the end before it says anything the first two words did not. A
	// card is scanned down its left edge; "of the Catholic Church" is where
	// the sentence under it starts.
	'ccc.landing.pairTitle': 'Catechism & Compendium',
	// The page's whole description: `/catechismus` indexes BOTH works, the
	// Compendium having no index of its own. `**` marks the two names for
	// emphasis (`boldMarkup.ts`) — inside the sentence rather than around it,
	// because thirteen translations do not share English word order.
	'ccc.landing.tagline':
		'<strong>The Catechism</strong> sets out Catholic doctrine in 2,865 numbered paragraphs. <strong>The Compendium</strong> restates the same doctrine as 598 questions and answers, on the same outline.',
	// THE SAME TWO FACTS IN ONE CLAUSE, for the card `ccc.landing.pairTitle`
	// names. A masthead's tagline has the width of the page and two sentences
	// with two names in bold read as a masthead; in a 16rem card they were six
	// lines against its neighbours' three, and a grid whose rows are all the
	// height of the tallest card pays for that six times over.
	//
	// IT CARRIES THE FORMAL TITLE the card's name drops, which is what a
	// sentence under a short name is for — and it is shorter than the clause
	// it replaced, so the row every card is as tall as did not grow.
	//
	// In all 37 since 2026-09-06, with `pairTitle` and for its reason: the card
	// is one surface, so a translated title over an English sentence about two
	// works it has stopped naming was never one of the available states.
	'ccc.landing.pairTagline':
		'The Catechism of the Catholic Church in 2,865 paragraphs, and its Compendium in 598 questions.',
	'ccc.tableOfContents': 'Table of Contents',
	'ccc.related': 'See also',

	// Compendium of the CCC — routes/catechismus/compendium/** is the consumer.
	'compendium.landing.title': 'Compendium of the Catechism',
	'compendium.landing.tagline':
		'Questions and answers summarizing the Catechism of the Catholic Church.',
	'compendium.question': 'Question',
	'compendium.answer': 'Answer',
	'compendium.tableOfContents': 'Table of Contents',
	'compendium.prevQuestion': 'Previous question',
	'compendium.nextQuestion': 'Next question',
	'compendium.condenses': 'Condenses CCC ¶¶',
	'ccc.abbrev': 'CCC',
	'ccc.condensedIn': 'In the Compendium',
	'compendium.abbrev': 'Comp.',
	'compendium.noQuestionNumber': 'No question number in this corpus',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Doctors of the Church',
	// The shelf is named for what it will hold — the Summa and the patristic
	// works — not for what is synced today, which is why the line names the
	// category and counts nothing.
	//
	// It said "no official authority" until 2026-09-07, and that was not
	// merely strong but false: naming a Doctor is itself an official act, and
	// the consent of the Fathers is a recognised rule for reading Scripture.
	// What is true is the narrower claim, and it is made of the WORKS rather
	// than of their authors — this site can say a book is not the last word;
	// ranking the standing of the Fathers is not its business.
	//
	// A translation should read "final" as DEFINITIVE — not the last word on
	// a question — and not as final in time.
	'doctores.landing.tagline':
		'The Fathers and Doctors of the Church. Their works are not infallible or final.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Thomas Aquinas, in English and in the Latin he wrote.',
	'summa.tableOfContents': 'Table of Contents',
	'summa.part': 'Part',
	'summa.question': 'Question',
	'summa.article': 'Article',
	// Abbreviated forms, for the sidebar's 17rem column and the landing
	// page's question grid, where the word is repeated on every row and
	// says nothing the position does not.
	'summa.questionShort': 'Q',
	'summa.articleShort': 'Art.',
	// A tooltip on one borrowed title, and the line that STATES the same
	// thing for a page where every title is borrowed. The Corpus
	// Thomisticum prints no question or article titles at all, so under
	// Latin that is all of them, and marking each row typographically
	// distinguished nothing from nothing.
	'summa.titleFromEdition': 'Title from the {lang} edition',
	'summa.titlesFromEdition': 'Titles from the {lang} edition — this one prints none',
	'summa.prologue': 'Prologue',
	// The division names are kept in the Latin every citation uses: a
	// footnote reads `ad 3` and `co.`, and translating the heading would
	// leave the reader to guess which paragraph the reference means.
	'summa.objection': 'Objection',
	'summa.sedContra': 'On the contrary',
	'summa.corpus': 'I answer that',
	'summa.reply': 'Reply to Objection',
	'summa.preamble': 'Note',
	'summa.prevQuestion': 'Previous question',
	'summa.nextQuestion': 'Next question',
	// Named no language until 2026-08-24, when it named Portuguese — the
	// only other interface language there was. There are fourteen now, so the
	// sentence says "your language" and lets `{lang}` name the one shown.
	'summa.noEditionInYourLanguage': 'The Summa has no edition in your language. Shown in {lang}.',
	'summa.noLatinSupplement':
		'The Supplement exists in English only — it was compiled after Aquinas’ death.',
	// The index table's first column, for a screen reader only — the column of
	// titles needs no label on screen, but a table whose row-header column has
	// no name at all reads as though the works are the only variable.
	'index.division': 'Division',
	'index.showSubsections': 'Show subsections',
	'index.hideSubsections': 'Hide subsections',

	// Common Prayers (docs/corpus-schema.md §Prayers) — routes/preces/**
	// is the consumer, plus the home page's compact Prayers section.
	'prayers.landing.title': 'Common Prayers',
	'prayers.landing.tagline': 'Prayers with the Latin text alongside.',
	'prayers.tableOfContents': 'Table of Contents',
	// What the letter in a dialogue's margin means — `PrayerBlocks` opens these
	// from the label itself. Keyed by the block's ROLE and never by the letter,
	// because the corpus prints four (V./R. in English and Portuguese, D./C. in
	// French and Portuguese) for the same two parts: an expansion would be
	// wrong for three of them, so these name who speaks instead.
	'prayers.gloss.versicle':
		'The versicle — the line the one leading the prayer says or sings alone. The assembly answers it with the response that follows.',
	'prayers.gloss.response':
		'The response — the line the assembly says or sings together, answering the versicle before it.',
	// The heading over the passages under a glossed prayer — the Gospel it is
	// drawn from, the Catechism's article on it, the Compendium's questions.
	// "See also" and not "Sources": the Ave's second half is nobody's Scripture,
	// and the Catechism is not where the prayer came from. What is true of all
	// of them is only that they are somewhere else to read about it.
	'prayers.seeAlso': 'See also',
	'prayers.prevPrayer': 'Previous prayer',
	'prayers.nextPrayer': 'Next prayer',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to, and `PrayerMysteries` shows the one set
	// appointed to a day (`PrayerGroupEntry.days`) with a control to step
	// through the week. The weekday is NOT a string here: `Intl` names it in
	// the reader's own language, so these are the buttons that move it and the
	// badge marking where the reader started.
	//
	// `today` REPLACES the weekday on the day the reader arrived on rather than
	// standing beside it — the control prints one name for the day it is
	// showing, and on that one day "Today" is the more useful of the two.
	//
	// `todayHeading` has no consumer. It titled a banner over all four sets
	// while the page listed them, then labelled a button back to today while
	// the badge was one; both are gone. Kept rather than deleted because it is
	// translated in every dictionary and nothing here tests for an unused key,
	// so removing it means removing forty translated strings on a guess that
	// no surface wants the phrase again.
	'prayers.rosary.today': 'Today',
	// The day strip's own name, and the trigger over each set's rubric. The
	// seven buttons are named by `Intl` — their visible letters repeat (English
	// has two T's and two S's), so the day's full name is each one's
	// `aria-label`, and these two are the chrome around them.
	'prayers.rosary.chooseDay': 'The day whose mysteries are shown',
	'prayers.rosary.whenPrayed': 'When this set is prayed',
	// `previousDay`/`nextDay` labelled a pair of arrows that stepped one day at
	// a time. The strip replaced them: seven days visible at once, any of them
	// one press away. Kept for `todayHeading`'s reason — translated everywhere,
	// and nothing here tests for an unused key.
	'prayers.rosary.previousDay': 'The day before',
	'prayers.rosary.nextDay': 'The day after',
	'prayers.rosary.todayHeading': 'Today’s mysteries',
	// The two section labels this page writes for itself. The third — over the
	// concluding prayer — is NOT here: every edition heads its own conclusion
	// ("Prayer concluding the Rosary", "Schlussgebet", "Oración tras el
	// rosario"), so the page takes that line as the heading it already is
	// rather than printing our own words above it.
	'prayers.rosary.openingPrayer': 'Opening prayer',
	'prayers.rosary.mysteries': 'The mysteries',
	'prayers.rosary.decadePrayers': 'The prayers of a decade',
	// THE ONLY PROSE ON THIS SITE THAT EXPLAINS A PRAYER RATHER THAN PRINTING
	// ONE. Everything else under /preces is the source's text reproduced; these
	// eight strings are written here, and they exist because the source's four
	// directions assume the reader already knows what a decade is, what the
	// beads are for, and what "announce the mystery" means. Somebody who has
	// never prayed the Rosary cannot start from them. The source's own
	// directions are still printed underneath, in its own words and marked as
	// its own — this stands beside them, not over them.
	//
	// Written short and flat on purpose: every sentence names one thing to do.
	// No sentence tells the reader what to feel, and none says the prayer is
	// easy — a first Rosary is twenty minutes of unfamiliar repetition, and a
	// page that pretends otherwise is the reason somebody stops halfway.
	// The fold's own name. "How-to" and not the source's "How to pray the
	// Rosary?", which repeated the page's `<h1>` two lines under it and asked a
	// question the row already answers by being pressable.
	'prayers.rosary.howTo': 'How-to',
	'prayers.rosary.howTo.lead':
		'The Rosary is a short round of prayers said five times over, while you hold one scene from the life of Jesus and Mary in mind. The beads only count for you, so that your attention can stay on the scene. Fingers do as well.',
	'prayers.rosary.howTo.begin': 'Begin',
	'prayers.rosary.howTo.beginBody':
		'Make the sign of the cross, and say the opening prayer printed below.',
	'prayers.rosary.howTo.decades': 'Say five decades',
	'prayers.rosary.howTo.decadesBody':
		'A decade is one mystery and the prayers that follow it. Read the first mystery, stop long enough to picture it, then say:',
	// The last sentence carries the source's third direction, which said only
	// "An invocation may be added after each decade" — true, unexplained, and
	// the one thing in those four sentences this walkthrough had not already
	// said better.
	'prayers.rosary.howTo.decadesAfter':
		'Then move to the next mystery and do the same, until all five are done. Each of the ten Hail Marys is one bead. You may add one more short prayer at the end of each decade.',
	'prayers.rosary.howTo.finish': 'Finish',
	// `{0}` and `{1}` are the two prayers this sentence names, rendered as
	// links to them — `slotted` in `rosary.ts` carries why they are holes in a
	// whole sentence rather than three keys. Move them where the target
	// language wants them; do not translate the digits.
	'prayers.rosary.howTo.finishBody':
		'Say the {0} and the prayer after it, printed at the foot of this page. Many people add the {1} or another prayer to Our Lady afterwards.',

	// Reference tooltips/popovers — RefText.svelte is the consumer.
	'ref.tooltip.loading': 'Loading…',
	'ref.tooltip.openCcc': 'Open in Catechism',
	'ref.tooltip.openBible': 'Open in Bible',
	'ref.tooltip.openCompendium': 'Open in Compendium',
	'ref.preview.open': 'Open',
	'ref.cf': 'cf.',

	// The unit-number popover and the bookmark library — AnchorMenu.svelte,
	// BookmarkButton.svelte and routes/signata are the consumers. The
	// library's section headings deliberately reuse `nav.*` rather than
	// declaring their own: they name the same four works.
	'anchor.actions': 'Reference actions',
	'anchor.copy': 'Copy text',
	'anchor.copyLink': 'Copy link',
	'anchor.view': 'View',
	'anchor.copied': 'Copied',
	'anchor.copyFailed': "Couldn't copy",
	'bookmark.add': 'Bookmark',
	'bookmark.remove': 'Remove bookmark',
	'bookmark.library': 'Bookmarks',
	// "Everything you have marked while reading" restated the card's title and
	// stopped short of the page: `/signata` also carries Continue reading, and
	// the reading position is the one thing there that the word Bookmarks does
	// not name. Second person is right on this card and on no other — it is
	// the only one about the reader's own act — and `library.landing.tagline`
	// already says "what you have marked" in every dictionary.
	'bookmark.library.tagline': 'What you have marked, and where you left off reading.',
	'bookmark.empty': 'Nothing marked yet.',
	'bookmark.emptyHint':
		'Click a verse or paragraph number and choose Bookmark, or use the bookmark button on a page.',
	// The `i` beside the heading has no text of its own, so this is its
	// accessible name and not a courtesy.
	'bookmark.about': 'About these bookmarks',
	'bookmark.deviceOnly':
		'Bookmarks are kept in this browser only. They are not sent anywhere, and clearing your browser data removes them.',
	'bookmark.unavailable': 'Not in the edition you are reading',

	// Documents (encyclicals, conciliar constitutions/decrees/declarations,
	// docs/corpus-schema.md §Documents) — routes/documenta/** is the
	// consumer, plus the home page's Magisterium group.
	// It listed four genres and then restated the card's own title. The list
	// was also short of the shelf: apostolic exhortations and the doctrinal
	// documents of the CDF are as permanent here as the encyclicals, and a
	// list has to be edited every time a genre is ingested where a category
	// does not.
	//
	// What replaced it is the distinction `shelves.ts` itself draws, and the
	// one that separates this card from the Catechism's: a dated act cited
	// singly, against a synthesis read through. `schola.what.magisterium`
	// says the same thing at guide length and keeps the genre list, which is
	// the right register there and not here.
	'document.library.tagline':
		'What popes and councils have written, each addressed to a moment and a question.',
	// The `/documenta` filter panel (that route's `+page.svelte`). It replaced
	// the pontificate table of contents on 2026-08-31: 272 documents is past
	// what a list of anchors helps with, and the three facets a reader
	// actually narrows by are who wrote it, what kind of document it is, and
	// what it is about.
	//
	// THE SUBJECT TERMS THEMSELVES ARE NOT HERE AND CANNOT BE. They are an
	// open vocabulary written per document in `site/document-tags.json`, so
	// each new coinage would be fourteen inventions rather than fourteen
	// lookups — the cost `route-titles.mjs`'s CHROME_KEYS docblock warns
	// about, paid every time someone tags a document. They render verbatim in
	// the language they were written in; only the panel around them is
	// translated.
	//
	// `filter.results` names the count for a screen reader; the count itself
	// is rendered as digits, which need no translation and no plural rule.
	'document.filter.heading': 'Filter',
	'document.filter.author': 'Author',
	'document.filter.kind': 'Type',
	'document.filter.subject': 'Subject',
	// The box at the head of the panel. It reads title, author, kind,
	// description and tags together, so it is 'search documents' and not
	// 'search titles' — and it is what makes the 53-term subject facet
	// safe to have cut down from 232 (site/document-tags.json).
	'document.filter.search': 'Search documents',
	'document.filter.clear': 'Clear',
	'document.filter.results': 'Documents shown',
	'document.filter.noResults': 'No document matches these filters.',
	'document.tableOfContents': 'Table of Contents',
	'document.startReading': 'Start reading',
	'document.readFullDocument': 'Read the full document',
	'document.section': 'Section',
	'document.prevSection': 'Previous',
	'document.nextSection': 'Next',
	'document.kind.conciliarConstitution': 'Constitution',
	'document.kind.conciliarDecree': 'Decree',
	'document.kind.conciliarDeclaration': 'Declaration',
	'document.kind.encyclical': 'Encyclical',
	'document.kind.apostolicExhortation': 'Apostolic Exhortation',
	'document.kind.apostolicConstitution': 'Apostolic Constitution',
	'document.kind.apostolicLetter': 'Apostolic Letter',
	'document.kind.motuProprio': 'Motu Proprio',
	'document.kind.bull': 'Bull',
	'document.kind.cdfDeclaration': 'CDF Declaration',
	'document.kind.cdfInstruction': 'CDF Instruction',
	'document.kind.cdfLetter': 'CDF Letter',
	'document.kind.cdfDoctrinalNote': 'CDF Doctrinal Note',
	'document.kind.cdfResponsum': 'CDF Responsum',
	'document.kind.cdfConsiderations': 'CDF Considerations',
	'document.kindPlural.conciliarConstitution': 'Constitutions',
	'document.kindPlural.conciliarDecree': 'Decrees',
	'document.kindPlural.conciliarDeclaration': 'Declarations',
	'document.kindPlural.encyclical': 'Encyclicals',
	'document.kindPlural.apostolicExhortation': 'Apostolic Exhortations',
	'document.kindPlural.apostolicConstitution': 'Apostolic Constitutions',
	'document.kindPlural.apostolicLetter': 'Apostolic Letters',
	'document.kindPlural.cdfDeclaration': 'CDF Declarations',

	// A citation whose source text is a confirmed gap in the source page
	// itself, not a parsing failure (docs/research/vatican-documents.md §6)
	// — ProseBlocks.svelte's citation disclosure, shared by CCC and
	// document sections.
	'citation.unavailable': 'No source text available for this note.',

	'colophon.title': 'Colophon',
	'colophon.lede':
		'What this site is, where its texts come from, and where we stand on reproducing them.',
	'colophon.whatThisIs': 'What this is',
	'colophon.whatThisIsBody':
		'Glossa Catholica is a reading site for the Scriptures, the Catechism, the Compendium, and the documents of the Magisterium, in English, Portuguese and Latin. It exists to be read, and nothing else is asked of you for reading it:',
	'colophon.pointFree': 'Free, and always free. No paywall, no subscription, nothing to buy.',
	'colophon.pointNoAds': 'No advertising, and no sponsored placement of any kind.',
	'colophon.pointNoAccounts': 'No accounts. Nothing to sign up for, nothing to log in to.',
	'colophon.pointNoTracking':
		'No tracking scripts, no third-party code, no cookies. Anonymous usage counts only, with nothing that identifies you.',
	'colophon.pointOffline':
		'Built to keep working offline once you have visited it, so a poor connection need not be a barrier to reading.',
	// The site's canonical standing, stated where a reader asks what this is
	// rather than in the copyright section — that section is addressed to a
	// rights holder, and this is addressed to the reader. Can. 216 CIC
	// reserves the name "Catholic" to undertakings holding the consent of
	// competent ecclesiastical authority; this site holds none, and the whole
	// point of the paragraph is that nobody should have to guess.
	//
	// WHAT IT DELIBERATELY DOES NOT SAY IS WHAT IS OURS. There is prose here
	// that is not the publishers': descriptions.json holds 385 editorial
	// descriptions written here, rendered on /documenta and in the shell head.
	// A sentence on this page claiming them was drafted and removed. A reader
	// meets that prose beside a document, not on the colophon, so the claim
	// belongs in the reading interface and marked per item — which is a
	// mechanism nobody has built yet. Until it exists this is a KNOWN GAP,
	// left open on purpose rather than papered over with a paragraph most
	// readers never reach.
	'colophon.whatThisIsStanding':
		'Glossa Catholica is a private undertaking of the lay faithful. It carries no ecclesiastical approbation and speaks with no authority of its own.',
	// THE SAME CLAIM AS ABOVE, IN A LINE, IN THE FOOTER OF EVERY PAGE. The
	// paragraph above is read by whoever goes to the colophon; the name that
	// provokes it is in the wordmark at every address the site answers, so the
	// disclaimer has to reach as far as the name does.
	//
	// "the Holy See" rather than "the Vatican", which names the state and not
	// the authority, and rather than "ecclesiastical approbation", which is the
	// exact term and one no footer can carry.
	//
	// IT IS THIS SHORT BECAUSE OF WHERE IT SITS. The line directly above it is
	// the link to the colophon, so the disclaimer does not have to carry its
	// own context — the full statement is one line and one click away. Move it
	// away from that link and it would need to say more than this.
	'footer.notEndorsed': 'Not endorsed by the Holy See',
	'colophon.textsTitle': 'The texts',
	'colophon.textsBody':
		'Every text comes from a named source, and every work records its edition, its source page and the date it was retrieved. Scripture uses public-domain translations; the Catechism, the Compendium and the magisterial documents come from the Holy See\u2019s own published texts.',
	'colophon.textsFidelity':
		'The text is never abridged, never paraphrased, never rewritten, and never placed beside advertising. We do repair plain defects \u2014 a dropped word, a mangled citation, markup that swallowed a paragraph \u2014 always toward what the source itself prints, never toward what we think it should say.',
	// WHY THE SCRIPTURE MAY BE IN ENGLISH ON A PAGE WHOSE CHROME IS NOT. The
	// interface reaches further than the corpus does, so a reader in most of
	// these languages meets a Bible in English and nothing anywhere said why.
	//
	// The second paragraph is the part that could not be derived and the part
	// worth saying: for three languages the gap is not somebody's unfinished
	// work. Swedish has no public-domain Catholic translation in existence;
	// the Slovenian and Arabic ones do exist and have never been typed up.
	// `docs/research/bible-texts.md` §The three that are blocked holds the
	// evidence for each, down to the verse the Swedish alternatives fail at.
	//
	// It NAMES the three rather than interpolating a list, because the two
	// halves of the sentence are two different reasons and a list cannot carry
	// them. The colophon page renders it only while the corpus still agrees
	// that all three lack an edition (`BLOCKED_BIBLE_LANGS`) — a claim about
	// the world, checked against the one part of it a manifest can answer.
	'colophon.textsLanguages':
		'The interface reaches further than the library does. Where we hold no Scripture in the language you are reading in, the text is shown in the nearest language we do hold, which is usually English; the work you are reading always names the edition it is.',
	'colophon.textsLanguagesBlocked':
		'For three of them that is not a matter of time. There has never been a Catholic Bible in Swedish that is out of copyright — the free Swedish versions are Lutheran, and depart from the Latin at the verses the difference turns on. Slovenian and Arabic both have a Catholic Bible old enough to be free, and neither survives as anything but photographs of its pages.',
	'colophon.countBible': 'Bible editions',
	'colophon.countDocuments': 'magisterial documents',
	// The expansion of `colophon.pointNoTracking`, which stays where it is as
	// the summary. Three paragraphs and no more: what is absent, what is
	// counted, what never leaves the device. site/docs/usage.md carries the
	// reasoning — a reader wants the claims, not the argument for them.
	//
	// The retention is interpolated from `RETENTION_DAYS` rather than typed, the
	// rule the work counts follow. It is 400 and not 365 deliberately: thirteen
	// months, so a month has the same month a year earlier to be compared with.
	'colophon.privacyTitle': 'Privacy',
	'colophon.privacyBody1':
		'No accounts, no cookies, no advertising, no third-party code. Nothing here follows you off this site.',
	'colophon.privacyBody2':
		'We do count how the site is used: one measurement per visit, every field a range rather than a value \u2014 how long you stayed, how often you have been here, which works you opened. Your country is counted separately, with nothing joining it to the rest. It describes a visit, not a visitor, and is kept for {days} days.',
	'colophon.privacyBody3':
		'Never sent: what you type into the search box, which passage you had open, or anything that could recognise your device again. Your settings, bookmarks and downloaded texts stay on your device.',
	'colophon.copyrightTitle': 'Copyright',
	'colophon.copyrightBody1':
		'The Catechism, the Compendium and the magisterial documents are the property of their rights holders \u2014 principally the Libreria Editrice Vaticana and the Dicastery for Communication.',
	'colophon.copyrightBody2':
		'Each work displays its rights holder\u2019s own copyright notice, in their wording, and links to the page it was taken from.',
	'colophon.copyrightBody3':
		'If you hold rights in any text here and would rather it were not published, write to us.',
	// NOT A DONATION ASK, AND THE HEADING IS WHERE THAT IS LOST. The list
	// under "what this is" promises there is nothing to buy, and a heading a
	// reader takes for an appeal contradicts it before the body can explain.
	// "Contribute" was the first heading here and went for exactly that:
	// English carries it, Portuguese "Contribuir" reads as money, and forty
	// dictionaries would each have had to notice on their own. This one has a
	// cognate in most of them, which is the point — it arrives in the next
	// language as the same word rather than as a translator's choice. Nothing
	// in this section asks for money, and the heading must not say otherwise.
	//
	// Two items, and neither of them enumerates. A defect is easier to see from
	// outside the site than in, and a licence is the rights holder's to give.
	// The list is not closed and does not need a line saying so: the section
	// below it opens "for anything at all", one address for both.
	//
	// It does NOT say what a defect looks like. `colophon.textsFidelity`, two
	// sections up, already names a dropped word and a mangled citation and
	// promises they get repaired, so a second list here reads as padding.
	//
	// `colophon.copyrightBody3` is the same address for the opposite request —
	// a rights holder asking for a text to come down — and the two sit a
	// section apart so neither reads as a condition of the other.
	'colophon.participateTitle': 'Participate',
	'colophon.participateBody': 'Write to us if:',
	'colophon.participateDefect': 'you have found a defect.',
	'colophon.participateRights':
		'you hold the rights to a text you think belongs here, and would let it be published.',
	'colophon.contactTitle': 'Contact',
	'colophon.contactBody': 'For anything at all, including the above:',
	'colophon.contactPending':
		'A contact address has not been set yet. This site should not be made public until it has one \u2014 the commitment above is not meaningful without a way to reach us.',
	'colophon.illustrationsTitle': 'The illustrations',
	// Deliberately does NOT name the collection, its publisher or any date:
	// the credit line under this section is generated from the collection's
	// own manifest and already prints the title, the artist with his dates,
	// the 1866 edition and the modern reproduction. Prose that repeated them
	// would be a second, hand-typed copy of a generated fact — the thing the
	// credit exists to prevent.
	'colophon.illustrationsBody':
		'The Bible carries Gustave Doré’s engravings, each one placed at the verse it depicts — the last and largest of his Bible cycles, cut in wood from his drawings and printed with the text rather than gathered at the back.',
	'colophon.illustrationsRights':
		'They are in the public domain, as the dates below show, and a faithful photographic reproduction of a public-domain engraving carries no new copyright of its own.',
	'colophon.countPlates': 'engravings',
	'colophon.countPlateChapters': 'chapters illustrated',
	'plates.scansBy': 'Scans provided by',
	// The picture in the reading column is a control that opens it over the
	// page, and `{title}` is the plate's own name — so the label names the
	// thing being enlarged rather than saying "enlarge image" twenty-seven
	// times down a chapter of Genesis. `plates.zoom` is one name for a toggle
	// in both of its states; `aria-pressed` says which state it is in, which
	// is what saves fourteen dictionaries a second string for "zoom out".
	'plates.enlarge': 'Enlarge {title}',
	'plates.zoom': 'Zoom',
	// `ArtFigure`'s caption trigger, whose only content is the `info` glyph —
	// so unlike a plate's, whose visible content is the plate's own title, it
	// has no text to take an accessible name from and this string is the name.
	// A picture, not a plate: these illustrate a landing page and there is
	// nothing to enlarge and no title on screen.
	'art.about': 'About this picture',
	// The only interface word in an artwork's caption. Everything else in one is
	// a proper noun and a date, held beside the asset in `landing-art.ts` rather
	// than in every dictionary — which is why the pictures cost two keys between
	// them. Rendered in parentheses after the identification.
	//
	// IT IS NOT A LIE AND IT IS NOT AN APOLOGY. Both pictures are horizontal
	// bands cut out of much taller paintings — Antonello's Jerome is 4731×6000
	// and what ships is 1600×727 — so a credit with no "(detail)" beside it
	// would tell a reader the work itself is that shape. It stays true of the
	// Library's, which a press now opens over the page: what opens is the
	// shipped file whole, not the panel. `assets/README.md` holds each crop
	// box.
	'art.detail': 'detail',
	'colophon.typeTitle': 'The type',
	'colophon.typeBody':
		'Set in EB Garamond, Georg Duffner and Octavio Pardo\u2019s revival of the types Claude Garamont cut in the 1590s \u2014 the humanist tradition the Church has printed in since the Renaissance. Its Cyrillic is by the same hands but revives nothing: no Garamond Cyrillic was ever cut, so the Russian is set in a form drawn to sit beside the rest.',
	'colophon.typeArabic':
		'Arabic is beyond it altogether, and is set in Amiri \u2014 Khaled Hosny\u2019s revival of the naskh cut for the Bulaq press in Cairo in 1905, chosen on the same reasoning as the text face: a particular historical book type rather than a contemporary drawing.',
	'colophon.typeInitials':
		'The opening initials are Pirata One, a blackletter whose capitals stay legible at the size a drop cap demands, and \u2014 for the Russian \u2014 Ponomar, which reproduces the Church Slavonic type of the Synodal Press. Ponomar sets the initial and never the text: a modern encyclical set throughout in Synodal type would say something untrue about what it is. All are licensed under the SIL Open Font License and served from this site rather than from a third party, so reading a page asks nothing of anyone else\u2019s server.',
	// One panel for every work that cites a verse — the Catechism and the
	// magisterial documents together, so the verse is named once and
	// everything citing it sits beside it. Each entry carries its own
	// work's name, so the heading names no work at all.
	'refs.citedIn': 'Cited in',
	// The one line in the apparatus that sends the reader off this site: an
	// AAS citation names a volume of the Holy See's gazette, which this corpus
	// does not hold and vatican.va publishes as a scanned PDF. It says so —
	// the reader is owed the format before the tap, not after it, and on a
	// page being read offline the link is dead and this is the only warning of
	// that there can be. `{volume}` is "58 (1966)", `{host}` "vatican.va".
	'refs.externalVolume': 'Volume {volume} at {host} — scanned PDF',
	'bible.wholeChapter': 'This chapter',
	'bible.verseNotInEdition':
		'This verse number is not in this edition — see the note in the page source',
	'bible.verseAbbrev': 'v.',
	// Challoner's apparatus in the Douay-Rheims (docs/corpus-schema.md). The
	// argument is the summary an annotated edition prints under the chapter
	// number; it is never labelled on the page — printed Bibles set it as an
	// unlabelled paragraph — so this string reaches only assistive technology.
	'bible.note': 'Note',
	'bible.noteMissing': 'This note is missing from the corpus',
	'bible.chapterArgument': 'Argument',
	// The reading view's advisory for a chapter the editions here divide
	// differently ($lib/divergence.ts, docs/research/bible-edition-divergence.md).
	// One sentence per kind, because the kinds differ in what a reader is owed:
	// a `merge-split` costs one number, an `arrangement` costs the whole book,
	// and a `span-shift` costs nothing visible at all. Plain and unalarmed,
	// like `compare.versificationNote` — a disclosed limitation is not an error.
	// The label is not printed; it tells assistive technology this is apparatus.
	'bible.divergence.label': 'A note on this chapter’s verse numbers',
	'bible.divergence.arrangement':
		'The editions here arrange this book differently, so one chapter and verse number names different text in each.',
	'bible.divergence.merge-split':
		'One edition here divides a verse in this chapter that the other keeps whole, so the numbers after it are one apart.',
	'bible.divergence.re-division':
		'The editions here divide this passage into verses on different principles, so one number does not name the same words in each.',
	'bible.divergence.textual-variant':
		'One edition here carries words in this chapter that the other does not; the difference is in the text, not in the numbering.',
	'bible.divergence.span-shift':
		'The editions here count the same verses in this chapter, but across a span in the middle the same number names different text.',
	'bible.divergence.local-repartition':
		'One edition here moves a clause across a verse boundary in this chapter and restores it a verse or two later, so a citation can land beside the wrong sentence.',
	'ccc.readFullChapter': 'Read the full chapter',
	'ccc.noParagraphNumber': 'No paragraph number in this corpus',
	'copyright.sourceTitle': 'Open the original source page',
	'copyright.sourceLabel': 'Source',
	'lang.label': 'Language',
	'lang.filter': 'Search languages',
	'lang.more': 'more languages',

	// Static 404 — routes/404/+page.svelte, an ordinary SPA route (there is
	// no build/404.html any more — the build emits only index.html and the
	// offline fallback) reached directly or via +error.svelte for an
	// invalid deep link, with src/worker.ts preserving the HTTP 404 status
	// before the SPA starts. See that route file's own docblock.
	'notFound.title': 'Nothing at this address',
	'notFound.lede': 'The page you asked for is not here.',
	'notFound.body':
		'The link may be mistyped or out of date, or it may point to a text this site does not carry.',
	'notFound.searchHint':
		'If you know the reference you want — a book and chapter, a paragraph of the Catechism — type it into the search box at the top of this page.',
	// The 404 illustration's credit line. ONE STRING PER LANGUAGE INCLUDING THE
	// SHELFMARK, rather than a "Based on" prefix with the shelfmark appended in
	// the markup, because the word order is not the same everywhere: Hungarian
	// puts `nyom\u00e1n` AFTER the source it qualifies, so a prefix would read
	// backwards there. Several languages use the art-credit convention for
	// this rather than a literal "based on" -- French `D\u2019apr\u00e8s`, German
	// `Nach`, Swedish `Efter` -- which is the register a museum label uses.
	//
	// It says "based on" and not the bare shelfmark because the image is an
	// AI-retouched version of the folio, not a reproduction of it: the mitre
	// and crozier carry ornament the manuscript does not have. Naming the
	// source without that qualifier would claim to BE f. 49v.
	'notFound.credit': 'Based on British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Or start from one of these:',
	'notFound.home': 'Home',

	// Compare mode (side-by-side, unit-aligned comparison) — CompareToggle.svelte
	// and CompareGrid.svelte are the consumers.
	'compare.enter': 'Compare editions',
	'compare.exit': 'Exit comparison',
	'compare.missing': 'Not present in this edition',
	'compare.versificationNote':
		'These two editions divide this chapter’s verses differently in places (a textual variant, not a translation choice) — the same verse number does not always mark the same sentence in both columns.',
	'compare.loading': 'Loading the second language…',
	// The dismiss control on a panel that covers the screen — the table of
	// contents sheet (`TocMenu`) and the navigation sheet (`+layout.svelte`).
	// Its own name, not the panel's: below the breakpoint the panel IS the
	// viewport and this button is the only way out of it, so it says what it
	// does rather than repeating the heading beside it. Named `ui.` because
	// the second consumer proved it was never the table of contents' string.
	'ui.close': 'Close',
	'shortcuts.title': 'Keyboard shortcuts',
	'shortcuts.betweenDocuments': 'Between documents',
	'shortcuts.withinDocument': 'Within the document',
	'shortcuts.show': 'Show this list',

	// THE CHROME, ONE SENTENCE EACH — the sheet the `?` button opens, which was
	// a section of `/schola` until 2026-09-07 (`site/docs/finding.md`). The
	// heading beside each of these is the key the control itself is labelled by
	// (`jumpbox.short`, `settings.label`, `compare.enter`, …), so a reader who
	// reads a row and then goes looking for the control finds the same word.
	// Only the sentence is new writing.
	//
	// Each says what the thing DOES, and none of them recommends.
	//
	// WHERE A CONTROL LIVES IS THE GROUP HEADING. The sheet draws only the rows
	// whose control is on the page in front of the reader, so the heading is
	// what says which bar the ones under it are on — the reading bar being the
	// one a reader does not always have. The jump box and the install button are
	// headed by their own labels instead (`$lib/help.ts`), so the sentences
	// under them are the only new writing they cost.
	'help.title': 'Help',
	'help.reading.heading': 'The bar above a text',
	'help.feature.search':
		'Type a reference into the box at the top — a chapter and verse, a paragraph number, the name of a document — and it completes it as you type.',
	'help.feature.offline':
		'Add the site to your home screen and it opens like an app. You can download whole works to read with no connection.',
	'help.feature.contents':
		'The divisions of the work you are in — books, parts, chapters — so you can move about inside it without going back to the start.',
	'help.feature.compare':
		'Two editions of the same passage, side by side — the Latin beside your own language, or one translation beside another.',
	'help.feature.apparatus':
		'An edition’s own footnotes, and any commentary written on the text, are offered beside it rather than under it. Citations inside the text are links, so a reference goes where it points.',
	'help.feature.focus':
		'Clears everything but the text. The way out stays where the bar was, so nothing is trapped behind it.',
	// Focus mode — `ZenToggle.svelte`, and the `Esc` row of the shortcut sheet.
	// The code calls it `zen`, after the editors that popularised the
	// arrangement; the reader is told "focus", because this site publishes the
	// Catechism and the Code of Canon Law and a school of Buddhist meditation
	// is not the register its chrome is written in. See `zen.svelte.ts`.
	'zen.enter': 'Focus mode',
	'zen.exit': 'Leave focus mode',
	// ---------------------------------------------------------- Calendar
	// The liturgical calendar is computed, not read: `$lib/calendar` derives
	// every day from the date of Easter and a table of the Church's fixed
	// celebrations. These are the only words on the page that are not a
	// celebration's own name.
	'nav.calendar': 'Calendar',
	'calendar.title': 'Liturgical Calendar',
	'calendar.tagline':
		'The General Roman Calendar, computed for any day — its season, its rank, its colour.',
	// A country calendar's page (`calendar/national/languages.ts`), set under
	// its heading and, with the markup stripped, used as the page's description
	// by `route-titles.mjs` — so the sentence a reader meets and the one a
	// search result prints are the same sentence.
	//
	// `{name}` IS THE CALENDAR'S OWN NAME AND IT OPENS THE LINE:
	// `Calendário Litúrgico Brasileiro`, written out per calendar rather than
	// composed, because the adjective follows the noun in Portuguese and
	// precedes and declines it in German. Everything after it is built from
	// `calendar.tagline`'s own clauses in that same dictionary, so the
	// participle agrees with that language's word for calendar for free.
	//
	// IT SAYS WHAT A NATIONAL CALENDAR IS AND STOPS. The season, the rank and
	// the colour are the general page's tagline, and they are as true of the
	// Roman calendar as of Brazil's — what a reader arriving here has to be
	// told is the one thing that differs, which is the propers. A description
	// is 160 characters and these names are long.
	//
	// WHAT IT MUST NOT DO is put an article or a preposition in front of the
	// placeholder. A name is a title in apposition here; the same line built
	// around a territory from `Intl.DisplayNames` printed "as United States
	// keeps it", "wie Schweiz ihn feiert", "tel que le célèbre France", and no
	// rule can supply the article, since which countries take one is a fact
	// about each language's own list.
	'calendar.national.tagline': '{name}, with the celebrations proper to it, computed for any day.',
	'calendar.calendar': 'Calendar',
	'calendar.which.general': 'General Roman Calendar',
	'calendar.filter': 'Search countries',
	// The regions the calendar picker groups its flags by. They are the
	// source's own grouping (`national/index.ts`), not a geography: "Americas"
	// is one region because the picker is a control and five headings is what
	// fits above a grid.
	'calendar.region.europe': 'Europe',
	'calendar.region.americas': 'The Americas',
	'calendar.region.africa': 'Africa',
	'calendar.region.middleEast': 'The Middle East',
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oceania',
	'calendar.today': 'Today',
	'calendar.previousMonth': 'Previous month',
	'calendar.nextMonth': 'Next month',
	// The listing drops the days that say nothing - a third of a month,
	// reading "Weekday" beside an empty name - and this shows them. ONE NAME
	// IN BOTH STATES: `aria-pressed` carries whether they are on screen, so
	// the label names the rows rather than the action, and it uses the same
	// word the rank column prints on them.
	'calendar.plainDays': 'Plain weekdays',
	'calendar.noSuchDay': 'No liturgical day is computed for that date.',
	'calendar.week': 'week',
	'calendar.alsoToday': 'Also kept today',
	'calendar.alsoObserved': 'Also observed today',
	'calendar.obligation': 'Holy day of obligation',
	// Names the canon rather than asserting the fact on its own authority —
	// the Code is in the corpus in seven languages and the link goes to it.
	'calendar.obligationCanon': 'CIC c. 1246',
	'calendar.sundayCycle': 'Sunday cycle',
	'calendar.weekdayCycle': 'Weekday cycle',
	'calendar.psalterWeek': 'Psalter week',
	'lectionary.heading': 'Readings at Mass',
	'lectionary.slot.reading': 'Reading',
	'lectionary.slot.reading1': 'First Reading',
	'lectionary.slot.reading2': 'Second Reading',
	'lectionary.slot.reading3': 'Third Reading',
	'lectionary.slot.reading4': 'Fourth Reading',
	'lectionary.slot.reading5': 'Fifth Reading',
	'lectionary.slot.reading6': 'Sixth Reading',
	'lectionary.slot.reading7': 'Seventh Reading',
	'lectionary.slot.psalm': 'Responsorial Psalm',
	'lectionary.slot.epistle': 'Epistle',
	'lectionary.slot.acclamation': 'Gospel Acclamation',
	'lectionary.slot.gospel': 'Gospel',
	'lectionary.slot.sequence': 'Sequence',
	'lectionary.or': 'or',
	// A slot this site does not serve: the source printed an antiphon or a
	// sequence and NO address for it, so there is nothing to resolve and the
	// words are the lectionary's own.
	//
	// IT SAYS WHAT IS MISSING AND NOT WHAT THE TEXT IS. It read `not a
	// scriptural text` until 2026-09-07, which asserted something about the
	// text on evidence that was only about the SOURCE — and was over-strong for
	// a verse like "The seed is the word of God, Christ is the sower", which
	// USCCB prints with no address because it is composed rather than quoted.
	// The key was renamed rather than reworded, so that thirty-nine
	// translations of the old claim could not go on making it.
	//
	// AND `here` RATHER THAN `in this corpus`, which is the wording it carried
	// for a day and which this repository's own vocabulary makes false: `raw/`
	// holds the page and the words are on it. What is absent is not the text
	// from the corpus but the text from what the site SERVES, and `here` is the
	// only one of the two a reader can check. `bible.noteMissing` and
	// `ccc.noParagraphNumber` keep `corpus` and are right to: a note or a
	// paragraph number the corpus genuinely does not have is a different
	// absence, not the same sentence in other words.
	'lectionary.textMissing': 'Not available here',
	// The word the source puts before a passage it points at rather than
	// appoints — USCCB writes both "See" and "Cf." and this is what both
	// become, so a citation is not half in the reader's language.
	'lectionary.cf': 'Cf.',
	// The `i` beside the heading has no text of its own, so this is its
	// accessible name and not a courtesy.
	'lectionary.about': 'About these readings',
	'lectionary.caveat':
		'The passages appointed by the Ordo Lectionum Missae, linked to this ' +
		'site’s own editions — not the translation proclaimed in any particular ' +
		'church, and a conference may adapt the schedule.',
	// `/calendarium/liturgia`. Five keys, and the page is otherwise labelled out
	// of `calendar.*` and `lectionary.*`, which are written in all thirty-seven:
	// it prints the same day, the same slots and the same caveat, at length.
	// These four are English-only until they are not, on the rule this file
	// opens with — `t()` falls back key by key — and the page is deliberately
	// outside `CHROME_PATHS`, so no cluster claims otherwise (`route-manifest.ts`).
	'liturgy.title': 'The day’s liturgy',
	// The word at the foot of the day card, printed as small caps by the CSS —
	// `LinkPreview`'s `ref.preview.open` is the same device and the same
	// reasoning about where the uppercasing belongs.
	'liturgy.read': 'Read',
	// The link's accessible name and its tooltip. It CONTAINS the visible word
	// above, which is the label-in-name rule: an accessible name of "The day's
	// liturgy" over a link reading "Read" gives a voice control user two names
	// for one target.
	'liturgy.readTheDay': 'Read the day’s liturgy',
	'liturgy.prayers': 'Prayers for this day',
	// A citation this corpus cannot resolve WHOLE prints no text at all
	// (`$lib/liturgy`), and this is what stands in its place — worded as what
	// the site will not do rather than as an error, because nothing failed: the
	// citation above it is still a link to the chapter.
	'liturgy.passageWithheld':
		'This edition cannot give the whole passage, so none of it is printed here.',
	'calendar.transferredFrom': 'Transferred from',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Christmas Time',
	'calendar.season.lent': 'Lent',
	'calendar.season.triduum': 'Paschal Triduum',
	'calendar.season.easter': 'Easter Time',
	'calendar.season.ordinary': 'Ordinary Time',
	'calendar.colour.white': 'White',
	'calendar.colour.red': 'Red',
	'calendar.colour.green': 'Green',
	'calendar.colour.violet': 'Violet',
	'calendar.colour.rose': 'Rose',
	'calendar.colour.black': 'Black',
	'calendar.colour.blue': 'Blue',
	'calendar.rank.solemnity': 'Solemnity',
	'calendar.rank.feast': 'Feast',
	'calendar.rank.memorial': 'Memorial',
	'calendar.rank.optional-memorial': 'Optional memorial',
	'calendar.rank.commemoration': 'Commemoration',
	'calendar.rank.sunday': 'Sunday',
	'calendar.rank.weekday': 'Weekday',
	/*
	 * THE GLOSSES: what each of those words means, for a reader who has met
	 * none of them before. Every one is shown twice — behind the term itself
	 * in the day's card (`TermGloss`) and in the primer at the foot of
	 * `/calendarium` — so a definition is written once and cannot come to
	 * disagree with itself.
	 */
	'calendar.gloss.season.advent':
		'The four weeks before Christmas: preparation for the Lord’s coming, and the beginning of the Church’s year.',
	'calendar.gloss.season.christmas':
		'From Christmas Day to the Baptism of the Lord, keeping the Lord’s birth and his manifestation to the world.',
	'calendar.gloss.season.lent':
		'The forty days from Ash Wednesday to the evening Mass of the Lord’s Supper: penance, almsgiving and preparation for Easter.',
	'calendar.gloss.season.triduum':
		'The three days from the evening of Holy Thursday to the evening of Easter Sunday — the Lord’s passion, death and resurrection, and the summit of the whole year.',
	'calendar.gloss.season.easter':
		'The fifty days from Easter to Pentecost, kept as one continuous feast — “one great Sunday”.',
	'calendar.gloss.season.ordinary':
		'The thirty-three or thirty-four weeks outside the other seasons. Not “plain” but ordered: the weeks are numbered, and the Church reads through the Lord’s life and teaching in course. It comes in two stretches — after Christmas Time until Lent, and after Pentecost until Advent.',
	'calendar.gloss.rank.solemnity':
		'The highest rank: Easter, Christmas, the Ascension, a place’s own patron. Kept with the Gloria and the Creed, and beginning the evening before.',
	'calendar.gloss.rank.feast':
		'Kept within the day itself. The apostles and evangelists, and the greater days of the Lord and of Our Lady.',
	'calendar.gloss.rank.memorial':
		'A saint remembered on his or her day, within the season’s own Mass and Office. Obligatory wherever it is kept.',
	'calendar.gloss.rank.optional-memorial':
		'May be kept or not, as the priest or community chooses. Left unkept, the day is simply the weekday.',
	'calendar.gloss.rank.commemoration':
		'What a memorial becomes in Lent: a prayer added to the ferial Mass, which the season otherwise keeps whole.',
	'calendar.gloss.rank.sunday':
		'The original feast day — the Lord’s Day, kept every week since the resurrection. Only a solemnity or a feast of the Lord may displace one, and in Advent, Lent and Easter Time not even those.',
	'calendar.gloss.rank.weekday':
		'A day with no celebration of its own. The Mass and the Office are the season’s, which is what makes the season worth knowing.',
	'calendar.gloss.colour.white':
		'Joy. Easter and Christmas Time, the Lord’s days other than of his passion, Our Lady, the angels, and saints who were not martyrs.',
	'calendar.gloss.colour.red':
		'Blood and fire. Palm Sunday and Good Friday, Pentecost, the apostles and evangelists, and the martyrs.',
	'calendar.gloss.colour.green': 'Ordinary Time: the colour of hope, and of things growing.',
	'calendar.gloss.colour.violet': 'Advent and Lent, and worn also in Masses for the dead.',
	'calendar.gloss.colour.rose':
		'Worn twice a year — Gaudete Sunday, the third of Advent, and Laetare Sunday, the fourth of Lent — where the fast lightens and the end is in sight.',
	'calendar.gloss.colour.black': 'May be worn in Masses for the dead.',
	'calendar.gloss.colour.blue':
		'The privilege of blue: worn for the Immaculate Conception in Spain, the Philippines and the few other places the Holy See has granted it to.',
	'calendar.gloss.sundayCycle':
		'The Sunday readings run over three years — A, B and C — reading Matthew, Mark and Luke in turn, with John through Lent and Easter Time. The cycle turns on the First Sunday of Advent, with the Church’s year.',
	'calendar.gloss.weekdayCycle':
		'The weekday readings run over two years, I and II: the first reading changes, the Gospel does not. A liturgical year is named for the calendar year it ends in — odd years are I, even years II.',
	'calendar.gloss.psalterWeek':
		'The Liturgy of the Hours spreads the psalms over four weeks, I to IV, repeating through the year. This is which week’s psalms are today’s, for anyone praying the Hours.',
	'calendar.gloss.obligation':
		'A day on which the faithful are bound to take part in Mass, and to keep from work that would prevent it. Every Sunday, and the other days each conference of bishops has determined.',
	'calendar.primer.title': 'New to this?',
	'calendar.primer.lead':
		'The Church keeps a year of its own. It begins with Advent, turns on Easter, and gives every day a name, a rank and a colour — and those decide what is prayed and read at Mass and in the Liturgy of the Hours that day. So “Twenty-third Sunday in Ordinary Time” is an address: it tells a priest, a choir, or anyone praying at home which prayers and readings belong to today.',
	'calendar.primer.seasons': 'The seasons',
	'calendar.primer.ranks': 'What a day can be',
	'calendar.primer.colours': 'The colours',
	'calendar.primer.cycles': 'The cycles',
	'calendar.primer.cyclesLead':
		'Three counters, which together say which readings and psalms are appointed for today.',

	// --- `/quaestiones`, the topics (`routes/quaestiones/`) -----------------
	//
	// A TOPIC'S TITLE AND ITS QUESTION ARE TWO DIFFERENT REGISTERS and the
	// pairing is the whole point of the page. The title is the site's own
	// plain naming of the subject; the QUESTION is written in the reader's
	// voice, because `docs/research/topics.md` found that nobody arrives at a
	// subject — they arrive at a sentence, and a page that lists only subjects
	// makes them translate their sentence into our vocabulary first.
	//
	// That makes these the only strings on the site written as somebody else's
	// words. Two rules follow, and a translator needs both: the question must
	// stay a question the reader would actually type, in whatever their
	// language's plainest register is — NOT a formal rendering of the English
	// — and it must never be made lighter than the thing it asks about. Three
	// of these are asked by people in trouble.
	//
	// NOTHING HERE EVALUATES OR ADVISES, on `docs/writing-voice.md`'s standing
	// rule. A question names what a reader wants to know; the answer is the
	// Catechism's paragraphs and is not restated in any of these keys.
	//
	// A THIRD KEY PER TOPIC IS RENDERED NOWHERE. `keywords` is the words a
	// reader would type that the two strings above do not happen to use, and
	// it exists because those two are written to be read: `mors-voluntaria`
	// says `taken their own life` and never `killed himself`, `crematio` never
	// says `urn`, `contraceptio` never says `the pill`. Writing the terms into
	// the questions instead would cost the register the page is built on, so
	// they sit out of sight and `topic-search.ts` matches them.
	//
	// TRANSLATE THEM, DO NOT TRANSPOSE THEM. This is the one key here where a
	// literal rendering is the wrong answer twice over: the reader's word is
	// `camisinha` and not `condom`, and their superstition is `macumba` and
	// not the English one. Anything already in the title or the question is
	// already matched and does not belong here; a term is worth its place only
	// if somebody would type it and the page would otherwise miss them.
	'quaestiones.landing.title': 'Questions',
	// NAMES THE THREE WORKS IT QUOTES, and it named one until the Compendium
	// of the Social Doctrine and the Code joined it. The second clause is the
	// promise and has to keep saying the same thing in every language: the
	// arrangement is ours and not one word of the text is.
	'quaestiones.landing.tagline':
		'Passages of the Catechism, the Social Doctrine and canon law, gathered by the question someone arrives holding. The gathering is the work done here; every word of the text is the Church’s own, and each passage links to where it stands.',
	// THE SAME PROMISE IN ONE CLAUSE, for the card in `ShelfGrid.svelte`. The
	// tagline above has the width of a masthead; in a 16rem card beside
	// sentences of one line it was five, and a grid whose rows are all the
	// height of the tallest card pays for that eight times over. What it drops
	// is the second sentence — that the gathering is the work and the text is
	// the Church's own — which is the page's own disclosure and is read on the
	// page, not on the way to it.
	'quaestiones.landing.cardTagline':
		'Passages of the Catechism, the Social Doctrine and canon law, gathered by question.',
	'quaestiones.landing.none': 'No questions have been written for this build.',
	// The search box over the list. A placeholder and an accessible name at
	// once, so it says what it searches rather than just "Search": this page
	// is one list among many and the reader may have arrived from another.
	'quaestiones.search.label': 'Search these questions',
	'quaestiones.search.none': 'No question here matches those words.',
	// THE DOORWAYS ARE NOT NAMED HERE, and they used to be. They still sort the
	// file (`site/quaestiones.json` argues them) and they still set the order
	// these shelves are drawn in; what they no longer do is head the page. Four
	// headings over sixteen was a level of grouping the reader had to read past
	// to reach the level that actually says where a question is, and the widest
	// of them held sixty topics across six shelves — "what people argue about"
	// is true of every one of them and directs nobody.
	'quaestiones.passages.heading': 'From the Catechism',
	// SAID ONLY WHERE IT IS TRUE — the page renders it when the topic carries
	// a `lead`, and nowhere else. It is the site admitting an arrangement of
	// its own over somebody else's text, which docs/decisions.md §Posture
	// requires be visible rather than silent. "None has been left out" is the
	// operative half and must survive translation intact: `lead` reorders a
	// span and never trims one.
	'quaestiones.passages.reordered':
		'These paragraphs are not in the Catechism’s own order. The one that answers the question directly is placed first; none has been left out.',
	// THE SECOND AND THIRD WORKS THE PAGE QUOTES, each headed by its own name
	// because they do not teach at the same level: the Catechism summarises,
	// the Compendium develops, the Code binds. A reader who cannot see which
	// of the three they are reading has been handed a composite nobody wrote.
	//
	// Each blurb says WHAT KIND OF ANSWER FOLLOWS and nothing about its
	// content — the heading names the work, the blurb names the register, and
	// the text speaks for itself. "The law of the Latin Church" is a plain
	// statement of scope and is doing real work: a reader who has come this
	// far in trouble should know a canon is not a counsel.
	'quaestiones.socialDoctrine.heading': 'From the Social Doctrine',
	'quaestiones.socialDoctrine.blurb':
		'The Compendium of the Social Doctrine of the Church, where it takes the Catechism’s summary further.',
	'quaestiones.documents.heading': 'Documents',
	'quaestiones.documents.blurb':
		'Where the Church has treated the question at length, or has written since the Catechism.',
	'quaestiones.canons.heading': 'In the Code',
	'quaestiones.canons.blurb': 'The law of the Latin Church, where it settles the question.',
	// The sixteen shelves, in `site/quaestiones.json`'s order, and with the
	// doorway headings gone these are the whole navigation of the page.
	//
	// WHICH IS WHY THEY NAME THEIR CONTENTS. They were written as situations —
	// "Whether any of it is true", "Why am I not allowed to", "When it has
	// gone" — on the reasoning that a reader arrives holding a situation and
	// not a subject. True of the QUESTIONS, and it is still how they are
	// written; false of a heading standing over a shut shelf, which is read
	// cold and has one line to say what is behind it. A reader scanning
	// sixteen of these has to be able to stop at the right one without opening
	// three, so each says its subject in the plainest words that cover the
	// shelf without over-promising: `the-rules` is not "Morality", which would
	// claim the whole of it, and `the-body` is not "Purity", which is a word
	// the reader who needs that shelf may not use of themselves.
	'quaestiones.cluster.credibility': 'Faith & reason',
	'quaestiones.cluster.other-christians': 'What divides Christians',
	'quaestiones.cluster.catholics-arguing': 'Authority & change in the Church',
	'quaestiones.cluster.the-rules': 'The hard teachings',
	'quaestiones.cluster.public-square': 'Politics & the common good',
	'quaestiones.cluster.other-faiths': 'Other religions & cultures',
	'quaestiones.cluster.death-and-dying': 'Illness, dying & death',
	'quaestiones.cluster.marriage': 'Marriage & annulment',
	'quaestiones.cluster.the-household': 'Children & the household',
	'quaestiones.cluster.the-body': 'Sex & the body',
	'quaestiones.cluster.forgiveness': 'Guilt & forgiveness',
	'quaestiones.cluster.despair': 'Despair & losing faith',
	'quaestiones.cluster.the-unseen': 'Angels, demons & the unseen',
	'quaestiones.cluster.practice': 'Catholic practice',
	'quaestiones.cluster.money-and-work': 'Money, work & vocation',
	'quaestiones.cluster.justice': 'Justice & human dignity',
	// The topics themselves, in `site/quaestiones.json`'s own order — by
	// doorway, and within a doorway roughly by the band it came from. Two
	// entries that look like one subject twice are the pair that file
	// describes: the argument and the person it happened to.
	//
	// --- the argument ---
	'quaestiones.dei-existentia.title': 'Whether God exists',
	'quaestiones.dei-existentia.question': 'Is there anyone there at all?',
	'quaestiones.dei-existentia.keywords':
		'proof of god, evidence, arguments, five ways, aquinas, agnostic, faith and reason',
	'quaestiones.malum.title': 'Suffering and evil',
	'quaestiones.malum.question': 'If God is good, why did he let it happen?',
	'quaestiones.malum.keywords':
		'problem of evil, theodicy, why me, pain, tragedy, injustice, cancer, innocent children',
	'quaestiones.scandalum-cleri.title': 'Abuse in the Church',
	'quaestiones.scandalum-cleri.question': 'Why should anyone trust it after that?',
	'quaestiones.scandalum-cleri.keywords':
		'sex abuse, priests, cover up, scandal, bishops, victims, safeguarding, minors, seminary, left the church, laicised, zero tolerance',
	'quaestiones.lex-naturalis.title': 'Morality without God',
	'quaestiones.lex-naturalis.question': 'Why would anyone need religion to be good?',
	'quaestiones.lex-naturalis.keywords':
		'natural law, ethics, right and wrong, relativism, secular morality, good without god',
	'quaestiones.scriptura-inspirata.title': 'Whether the Bible can be trusted',
	'quaestiones.scriptura-inspirata.question': 'Who wrote it, and why believe what it says?',
	'quaestiones.scriptura-inspirata.keywords':
		'inspiration, inerrancy, contradictions, literal, myth, historical accuracy, errors',
	'quaestiones.canon-scripturae.title': 'Why the Catholic Bible has more books',
	'quaestiones.canon-scripturae.question': 'Were books added, or were they taken away?',
	'quaestiones.canon-scripturae.keywords':
		'deuterocanonical, apocrypha, seven books, maccabees, tobit, judith, sirach, wisdom, protestant bible, trent',
	'quaestiones.creatio-et-scientia.title': 'Creation and science',
	'quaestiones.creatio-et-scientia.question': 'Hasn’t science settled how the world began?',
	'quaestiones.creatio-et-scientia.keywords':
		'evolution, big bang, genesis, six days, darwin, adam and eve, creationism, age of the earth, dinosaurs',
	'quaestiones.iesus-christus.title': 'Who Jesus was',
	'quaestiones.iesus-christus.question': 'Did any of it actually happen?',
	'quaestiones.iesus-christus.keywords':
		'historical jesus, resurrection, divinity, son of god, gospels, eyewitness, myth, nazareth',
	'quaestiones.novissima.title': 'What happens after death',
	'quaestiones.novissima.question': 'Is that all there is?',
	'quaestiones.novissima.keywords':
		'heaven, hell, judgment, afterlife, eternal life, soul, resurrection of the body, last things',
	'quaestiones.atheismus.title': 'Atheism and unbelief',
	'quaestiones.atheismus.question': 'What does the Church say about people who do not believe?',
	'quaestiones.atheismus.keywords':
		'atheist, agnostic, unbeliever, secular, nonreligious, invincible ignorance, good atheists',
	'quaestiones.culpae-praeteritae.title': 'The Church’s record',
	'quaestiones.culpae-praeteritae.question': 'How could the Church have done that?',
	'quaestiones.culpae-praeteritae.keywords':
		'inquisition, crusades, galileo, heresy trials, torture, witch trials, past sins, apology, history of the church',
	'quaestiones.divitiae-ecclesiae.title': 'The Church’s wealth',
	'quaestiones.divitiae-ecclesiae.question': 'Why not sell it and give the money away?',
	'quaestiones.divitiae-ecclesiae.keywords':
		'sell the vatican, gold, art, treasures, rich church, poor church, the collection, donations, property, vatican bank',
	'quaestiones.colonialismus.title': 'Colonialism and indigenous peoples',
	'quaestiones.colonialismus.question': 'The missionaries came with the conquerors. What now?',
	'quaestiones.colonialismus.keywords':
		'conquest, missions, native, amazon, colonisation, land rights, ancestral culture, evangelisation',
	'quaestiones.beata-virgo.title': 'Mary',
	'quaestiones.beata-virgo.question': 'Why do Catholics give her so much?',
	'quaestiones.beata-virgo.keywords':
		'virgin mary, immaculate conception, assumption, mother of god, marian devotion, worship, perpetual virginity, brothers of jesus, our lady',
	'quaestiones.sancti-et-imagines.title': 'The saints, statues and images',
	'quaestiones.sancti-et-imagines.question': 'Is praying to a saint idolatry?',
	'quaestiones.sancti-et-imagines.keywords':
		'icons, graven images, intercession, praying to saints, veneration, second commandment, canonisation',
	'quaestiones.purgatorium.title': 'Purgatory and indulgences',
	'quaestiones.purgatorium.question': 'Where is any of that in the Bible?',
	'quaestiones.purgatorium.keywords':
		'temporal punishment, prayers for the dead, plenary indulgence, souls, tetzel, purification, offering a mass',
	'quaestiones.primatus-romani-pontificis.title': 'The Pope',
	'quaestiones.primatus-romani-pontificis.question': 'Why should one man have that authority?',
	'quaestiones.primatus-romani-pontificis.keywords':
		'papacy, infallibility, peter, the rock, vatican, primacy, papal authority, holy father, keys',
	'quaestiones.papa-reprehensus.title': 'When the Pope is wrong',
	'quaestiones.papa-reprehensus.question': 'May a Catholic say so, and about what?',
	'quaestiones.papa-reprehensus.keywords':
		'criticising the pope, bad popes, heresy, correction, obedience, francis, resist, filial correction',
	'quaestiones.dissensus.title': 'Disagreeing with the Church',
	'quaestiones.dissensus.question': 'What if my conscience says otherwise?',
	'quaestiones.dissensus.keywords':
		'dissent, disobey, cafeteria catholic, cannot accept, obey the church, private judgment',
	'quaestiones.traditio-et-scriptura.title': 'Scripture and Tradition',
	'quaestiones.traditio-et-scriptura.question': 'Isn’t the Bible enough on its own?',
	'quaestiones.traditio-et-scriptura.keywords':
		'sola scriptura, bible alone, deposit of faith, apostolic tradition, magisterium, oral teaching',
	'quaestiones.iustificatio.title': 'Faith and works',
	'quaestiones.iustificatio.question': 'Do Catholics think they earn heaven?',
	'quaestiones.iustificatio.keywords':
		'sola fide, faith alone, grace, justification, saved, luther, merit, works of the law, once saved always saved',
	'quaestiones.confessio-sacerdoti.title': 'Confessing to a priest',
	'quaestiones.confessio-sacerdoti.question': 'Why not go straight to God?',
	'quaestiones.confessio-sacerdoti.keywords':
		'reconciliation, absolution, penance, seal of confession, secrecy, examination of conscience, telling a man my sins',
	'quaestiones.eucharistia.title': 'The Eucharist',
	'quaestiones.eucharistia.question': 'Is it bread, or is it not?',
	'quaestiones.eucharistia.keywords':
		'real presence, transubstantiation, communion, host, symbol, body and blood, last supper, adoration, blessed sacrament',
	'quaestiones.unitas-christianorum.title': 'Christian division',
	'quaestiones.unitas-christianorum.question': 'Why are there so many churches?',
	'quaestiones.unitas-christianorum.keywords':
		'protestants, evangelicals, orthodox, denominations, ecumenism, schism, reformation, one true church, split',
	'quaestiones.doctrinae-progressus.title': 'Whether teaching changes',
	'quaestiones.doctrinae-progressus.question': 'Has the Church changed its mind?',
	'quaestiones.doctrinae-progressus.keywords':
		'development of doctrine, contradiction, reversal, newman, usury, slavery, limbo, past teaching, u-turn',
	'quaestiones.concilium-vaticanum-secundum.title': 'The Second Vatican Council',
	'quaestiones.concilium-vaticanum-secundum.question':
		'Did the Church become something else in 1965?',
	'quaestiones.concilium-vaticanum-secundum.keywords':
		'vatican ii, novus ordo, tridentine, latin mass, traditionalist, sspx, lefebvre, rupture, continuity',
	'quaestiones.usus-antiquior.title': 'The older Mass',
	'quaestiones.usus-antiquior.question': 'Why was it taken away?',
	'quaestiones.usus-antiquior.keywords':
		'latin mass, tridentine, traditional mass, extraordinary form, vetus ordo, novus ordo, summorum pontificum, traditionis custodes, ad orientem',
	'quaestiones.synodalitas.title': 'Who governs the Church',
	'quaestiones.synodalitas.question': 'Who actually decides anything?',
	'quaestiones.synodalitas.keywords':
		'synod, synodality, bishops, collegiality, laity, curia, hierarchy, governance, consultation',
	'quaestiones.mulieres-in-ecclesia.title': 'Women in the Church',
	'quaestiones.mulieres-in-ecclesia.question': 'Is it run by men, for men?',
	'quaestiones.mulieres-in-ecclesia.keywords':
		'feminism, patriarchy, leadership, roles, altar servers, lay ministry, equality',
	'quaestiones.charismata.title': 'Charismatic gifts and healing',
	'quaestiones.charismata.question': 'Was what I felt from God?',
	'quaestiones.charismata.keywords':
		'charismatic renewal, speaking in tongues, prophecy, pentecostal, gifts of the spirit, faith healing, resting in the spirit',
	'quaestiones.caritas.title': 'What the Church means by love',
	'quaestiones.caritas.question': 'We love each other. Why is that not the answer?',
	'quaestiones.caritas.keywords':
		'charity, agape, eros, romantic, feelings, unconditional, true love, deus caritas est, enemies, benedict xvi',
	'quaestiones.contraceptio.title': 'Contraception',
	'quaestiones.contraceptio.question': 'Why is it forbidden, when almost everyone does it?',
	'quaestiones.contraceptio.keywords':
		'birth control, the pill, condoms, iud, vasectomy, sterilisation, natural family planning, nfp, billings, humanae vitae, rhythm method',
	'quaestiones.fecundatio-artificialis.title': 'IVF and embryos',
	'quaestiones.fecundatio-artificialis.question':
		'Why forbid the treatment that would give us a child?',
	'quaestiones.fecundatio-artificialis.keywords':
		'in vitro, fertility treatment, frozen embryos, surrogacy, artificial insemination, donor eggs, donum vitae',
	'quaestiones.concubinatus.title': 'Sex before marriage',
	'quaestiones.concubinatus.question': 'Why does living together first count against us?',
	'quaestiones.concubinatus.keywords':
		'cohabitation, fornication, premarital, sleeping together, moving in, engaged, virginity, hooking up',
	'quaestiones.divortium.title': 'Divorce and remarriage',
	'quaestiones.divortium.question': 'Why can a marriage not simply end?',
	'quaestiones.divortium.keywords':
		'separation, indissolubility, second marriage, civil divorce, broken marriage',
	'quaestiones.homosexualitas.title': 'Homosexuality',
	'quaestiones.homosexualitas.question': 'What does the Church ask of someone who is gay?',
	'quaestiones.homosexualitas.keywords':
		'lesbian, same-sex, lgbt, orientation, intrinsically disordered, sodomy, sexual acts',
	'quaestiones.identitas-sexualis.title': 'Gender and transition',
	'quaestiones.identitas-sexualis.question': 'What does the Church say about being trans?',
	'quaestiones.identitas-sexualis.keywords':
		'transgender, pronouns, sex change, gender theory, nonbinary, dysphoria, hormones, surgery',
	'quaestiones.ordinatio-mulierum.title': 'Women priests and deacons',
	'quaestiones.ordinatio-mulierum.question': 'Why can a woman not be ordained?',
	'quaestiones.ordinatio-mulierum.keywords':
		'female priest, deaconess, ordination, ordinatio sacerdotalis, holy orders, altar',
	'quaestiones.caelibatus.title': 'Married priests',
	'quaestiones.caelibatus.question': 'Why must a priest be celibate?',
	'quaestiones.caelibatus.keywords':
		'celibacy, priests marrying, eastern rite, discipline, shortage of priests, married clergy, vow',
	'quaestiones.abortus.title': 'Abortion',
	'quaestiones.abortus.question': 'Why does the Church treat it as the gravest of them?',
	'quaestiones.abortus.keywords':
		'unborn, foetus, termination, pro-life, excommunication, rape, ectopic pregnancy, morning after pill',
	'quaestiones.euthanasia.title': 'Euthanasia and assisted dying',
	'quaestiones.euthanasia.question': 'Why refuse someone a death without pain?',
	'quaestiones.euthanasia.keywords':
		'assisted suicide, mercy killing, right to die, lethal injection, palliative care, terminally ill, dignity in dying',
	'quaestiones.poena-capitalis.title': 'The death penalty',
	'quaestiones.poena-capitalis.question': 'The Church once allowed it. What changed?',
	'quaestiones.poena-capitalis.keywords':
		'capital punishment, execution, executed, inadmissible, life sentence, murderers, gallows, lethal injection',
	'quaestiones.castitas.title': 'Chastity',
	'quaestiones.castitas.question': 'What is being asked, and of whom?',
	'quaestiones.castitas.keywords':
		'purity, lust, self-control, dating, single, modesty, temptation, impurity, virtue',
	'quaestiones.mendacium.title': 'Lying and reputation',
	'quaestiones.mendacium.question': 'Is a small lie really a sin?',
	'quaestiones.mendacium.keywords':
		'white lie, gossip, calumny, detraction, slander, honesty, secrets, mental reservation',
	'quaestiones.capitalismus.title': 'Property and wealth',
	'quaestiones.capitalismus.question': 'Is the Church for capitalism or against it?',
	'quaestiones.capitalismus.keywords':
		'private property, free market, the rich, universal destination of goods, ownership, greed',
	'quaestiones.socialismus.title': 'Socialism and Marxism',
	'quaestiones.socialismus.question': 'Why has the Church condemned it so many times?',
	'quaestiones.socialismus.keywords':
		'communism, liberation theology, redistribution, class struggle, left wing, collectivism, soviet',
	'quaestiones.labor.title': 'Work and the economy',
	'quaestiones.labor.question': 'What does the Church ask of an employer?',
	'quaestiones.labor.keywords':
		'workers, employees, unions, business, rerum novarum, laborem exercens, working conditions, dignity of work, boss',
	'quaestiones.migratio.title': 'Migration and refugees',
	'quaestiones.migratio.question': 'How many is a country obliged to take?',
	'quaestiones.migratio.keywords':
		'immigration, migrants, borders, asylum, deportation, illegal, foreigners, welcome',
	'quaestiones.bellum.title': 'War and peace',
	'quaestiones.bellum.question': 'When, if ever, may a country fight?',
	'quaestiones.bellum.keywords':
		'just war, military, army, pacifism, nuclear weapons, conscientious objection, invasion, soldiers, arms trade',
	'quaestiones.civitas-et-oboedientia.title': 'The State and obedience',
	'quaestiones.civitas-et-oboedientia.question': 'How far does a citizen have to obey?',
	'quaestiones.civitas-et-oboedientia.keywords':
		'government, unjust law, civil disobedience, authority, resistance, laws, politics, taxes',
	'quaestiones.suffragium.title': 'How a Catholic may vote',
	'quaestiones.suffragium.question': 'Is any party ruled out?',
	'quaestiones.suffragium.keywords':
		'voting, elections, candidate, single issue, non-negotiable, ballot, politicians, lesser evil',
	'quaestiones.sub-imperio-atheo.title': 'Living under a hostile State',
	'quaestiones.sub-imperio-atheo.question': 'May a Catholic hide it, or must they refuse?',
	'quaestiones.sub-imperio-atheo.keywords':
		'persecution, communist regime, underground church, martyrdom, dictatorship, secret police, informing',
	'quaestiones.civitas-catholica.title': 'Whether the State should be Catholic',
	'quaestiones.civitas-catholica.question': 'Was religious liberty the mistake?',
	'quaestiones.civitas-catholica.keywords':
		'confessional state, integralism, church and state, separation, catholic country, throne and altar, secularism',
	'quaestiones.libertas-religiosa.title': 'Religious liberty',
	'quaestiones.libertas-religiosa.question':
		'May anyone be made to believe, or stopped from believing?',
	'quaestiones.libertas-religiosa.keywords':
		'dignitatis humanae, tolerance, forced conversion, error has no rights, conscience, secular state, proselytising by force',
	'quaestiones.oecologia.title': 'Ecology and climate',
	'quaestiones.oecologia.question': 'Why is this the Church’s business?',
	'quaestiones.oecologia.keywords':
		'climate change, environment, laudato si, global warming, pollution, animals, recycling, creation, integral ecology',
	'quaestiones.paupertas.title': 'Poverty',
	'quaestiones.paupertas.question': 'What is required of those who have enough?',
	'quaestiones.paupertas.keywords':
		'the poor, charity, almsgiving, homeless, beggars, preferential option, hunger, inequality',
	'quaestiones.technologia.title': 'Technology and artificial intelligence',
	'quaestiones.technologia.question': 'What does the Church say about machines that think?',
	'quaestiones.technologia.keywords':
		'ai, robots, algorithms, automation, transhumanism, chatgpt, computers, antiqua et nova',
	'quaestiones.communicatio-socialis.title': 'Media and public speech',
	'quaestiones.communicatio-socialis.question': 'What is owed to the truth in public?',
	'quaestiones.communicatio-socialis.keywords':
		'journalism, news, propaganda, free speech, censorship, fake news, television, internet',
	'quaestiones.iudaismus.title': 'Judaism',
	'quaestiones.iudaismus.question': 'What does the Church say about the Jewish people?',
	'quaestiones.iudaismus.keywords':
		'jews, antisemitism, israel, old covenant, deicide, nostra aetate, holocaust, chosen people',
	'quaestiones.islam.title': 'Islam',
	'quaestiones.islam.question': 'What does the Church say about Muslims?',
	'quaestiones.islam.keywords':
		'quran, allah, same god, mohammed, interreligious dialogue, mosque, sharia',
	'quaestiones.salus-extra-ecclesiam.title': 'Salvation outside the Church',
	'quaestiones.salus-extra-ecclesiam.question': 'What about everyone who is not Catholic?',
	'quaestiones.salus-extra-ecclesiam.keywords':
		'no salvation outside the church, extra ecclesiam, other religions, invincible ignorance, baptism of desire, unbaptised, pagans',
	'quaestiones.proselytismus.title': 'Whether to convert anyone',
	'quaestiones.proselytismus.question': 'Should the Church still be trying?',
	'quaestiones.proselytismus.keywords':
		'evangelisation, mission, converting, proselytism, preaching, witness, missionaries, door to door',
	'quaestiones.inculturatio.title': 'Faith and culture',
	'quaestiones.inculturatio.question': 'Must a convert give up the customs they were raised in?',
	'quaestiones.inculturatio.keywords':
		'traditions, syncretism, ancestors, local rites, pagan practices, adaptation',
	'quaestiones.polygamia.title': 'Polygamy',
	'quaestiones.polygamia.question': 'What becomes of the other wives if a man is baptised?',
	'quaestiones.polygamia.keywords':
		'many wives, plural marriage, converts, pauline privilege, africa, concubines',
	'quaestiones.superstitio.title': 'Superstition and inherited practice',
	'quaestiones.superstitio.question': 'Was what my grandmother did superstition?',
	'quaestiones.superstitio.keywords':
		'charms, amulets, evil eye, luck, curses, witchcraft, spells, folk religion, blessing away an illness',
	'quaestiones.evangelium-prosperitatis.title': 'Prosperity preaching',
	'quaestiones.evangelium-prosperitatis.question': 'Does God reward faith with money?',
	'quaestiones.evangelium-prosperitatis.keywords':
		'prosperity gospel, health and wealth, televangelist, seed offering, name it and claim it, megachurch, giving to be blessed',
	// --- when something has happened ---
	'quaestiones.post-mortem.title': 'When someone has died',
	'quaestiones.post-mortem.question': 'Where is he now, and is there anything I can do for him?',
	'quaestiones.post-mortem.keywords':
		'grief, bereavement, funeral, wake, burial, mass for the dead, praying for the dead, mourning, loss',
	'quaestiones.infans-non-baptizatus.title': 'A child who died unbaptised',
	'quaestiones.infans-non-baptizatus.question': 'What does the Church say became of them?',
	'quaestiones.infans-non-baptizatus.keywords':
		'limbo, unbaptised baby, stillborn, miscarried, infant death, died before baptism, hope',
	'quaestiones.mors-voluntaria.title': 'After a suicide',
	'quaestiones.mors-voluntaria.question':
		'Someone has taken their own life. Is there hope for them?',
	'quaestiones.mors-voluntaria.keywords':
		'killed himself, funeral for a suicide, damned, mental illness, depression, mortal sin, church burial',
	'quaestiones.aegritudo.title': 'After a diagnosis',
	'quaestiones.aegritudo.question': 'What does the Church say to someone who is ill?',
	'quaestiones.aegritudo.keywords':
		'illness, cancer, hospital, anointing of the sick, chronic pain, terminal, healing, suffering',
	'quaestiones.finis-vitae.title': 'A parent who is dying',
	'quaestiones.finis-vitae.question': 'Must every treatment be continued to the end?',
	'quaestiones.finis-vitae.keywords':
		'end of life, life support, feeding tube, ventilator, extraordinary means, hospice, do not resuscitate, withdrawing treatment, coma',
	'quaestiones.crematio.title': 'Cremation',
	'quaestiones.crematio.question': 'May a Catholic be cremated, and may the ashes be scattered?',
	'quaestiones.crematio.keywords':
		'urn, columbarium, burial, funeral home, keeping the ashes at home, ad resurgendum cum christo, incineration, grave',
	'quaestiones.matrimonium.title': 'Getting married',
	'quaestiones.matrimonium.question': 'What is it that makes a marriage a marriage?',
	'quaestiones.matrimonium.keywords':
		'wedding, sacrament of marriage, vows, consent, validity, marriage preparation, convalidation, civil marriage, banns',
	'quaestiones.matrimonium-mixtum.title': 'Marrying someone who is not Catholic',
	'quaestiones.matrimonium-mixtum.question': 'What is required, and of which of us?',
	'quaestiones.matrimonium-mixtum.keywords':
		'mixed marriage, non-catholic spouse, protestant husband, dispensation, disparity of cult, raising the children catholic, unbaptised partner',
	'quaestiones.infidelitas-coniugis.title': 'When a spouse has been unfaithful',
	'quaestiones.infidelitas-coniugis.question': 'Am I allowed to leave?',
	'quaestiones.infidelitas-coniugis.keywords':
		'cheated on me, affair, betrayed, separation, divorce, forgive him, move out, annulment, take him back, adultery, another woman, another man',
	'quaestiones.nullitas-matrimonii.title': 'Annulment',
	'quaestiones.nullitas-matrimonii.question': 'Am I still married?',
	'quaestiones.nullitas-matrimonii.keywords':
		'tribunal, declaration of nullity, invalid marriage, defect of consent, petition, remarrying in the church',
	'quaestiones.communio-post-divortium.title': 'Communion after a divorce',
	'quaestiones.communio-post-divortium.question': 'May I receive?',
	'quaestiones.communio-post-divortium.keywords':
		'divorced and remarried, amoris laetitia, chapter eight, state of grace, living as brother and sister, spiritual communion, excommunicated',
	'quaestiones.graviditas.title': 'Pregnancy and miscarriage',
	'quaestiones.graviditas.question': 'Was it already a person?',
	'quaestiones.graviditas.keywords':
		'stillbirth, unborn child, ensoulment, when life begins, prenatal, losing the baby, naming the child',
	'quaestiones.sterilitas.title': 'Infertility',
	'quaestiones.sterilitas.question': 'We cannot have children. What is left to us?',
	'quaestiones.sterilitas.keywords':
		'cannot conceive, childless, trying for a baby, adoption, fertility treatment, ivf, naprotechnology',
	'quaestiones.adoptio.title': 'Adoption',
	'quaestiones.adoptio.question': 'Is the child ours in the Church’s eyes?',
	'quaestiones.adoptio.keywords':
		'adopted, fostering, orphan, birth parents, legal relationship, baptising an adopted child, marrying an adopted sibling, can we adopt, foster care',
	'quaestiones.educatio-filiorum.title': 'Raising a child in the faith',
	'quaestiones.educatio-filiorum.question': 'What if they will not come to Mass?',
	'quaestiones.educatio-filiorum.keywords':
		'teenager, first communion, confirmation, refuses, catholic school, homeschooling, catechism, sunday morning, make them go, godless school, sacraments for children, dragging them',
	'quaestiones.filius-a-fide-lapsus.title': 'A child who has left the faith',
	'quaestiones.filius-a-fide-lapsus.question': 'Where did we go wrong?',
	'quaestiones.filius-a-fide-lapsus.keywords':
		'lapsed, fallen away, stopped going to mass, my son left the church, my daughter is an atheist, no longer practises, blame',
	'quaestiones.parentes.title': 'Honouring a parent',
	'quaestiones.parentes.question': 'What if they do not deserve it?',
	'quaestiones.parentes.keywords':
		'fourth commandment, honour thy father and mother, estranged, no contact, abusive mother, cut them off, filial piety, obey my parents, in laws, grown children',
	'quaestiones.cura-parentum.title': 'A parent growing old',
	'quaestiones.cura-parentum.question':
		'They cannot manage alone any more, and I cannot do it all.',
	'quaestiones.cura-parentum.keywords':
		'care home, nursing home, dementia, alzheimer, elderly, carer, siblings who do nothing, guilt, burnout, looking after mum, old age, respite',
	'quaestiones.amissio-operis.title': 'Losing work',
	'quaestiones.amissio-operis.question': 'Does the Church say anything about being out of work?',
	'quaestiones.amissio-operis.keywords':
		'unemployment, lost my job, redundancy, fired, jobless, cannot provide, dismissal, looking for work',
	// --- what is hard to ask ---
	'quaestiones.remissio-peccatorum.title': 'Whether a sin can be forgiven',
	'quaestiones.remissio-peccatorum.question': 'Is there anything too grave to be forgiven?',
	'quaestiones.remissio-peccatorum.keywords':
		'unforgivable, sin against the holy spirit, mortal sin, beyond forgiveness, too far gone, despair, mercy',
	'quaestiones.pornographia.title': 'Pornography',
	'quaestiones.pornographia.question':
		'What does the Church say about it, and about not being able to stop?',
	'quaestiones.pornographia.keywords':
		'addiction, habit, relapse, online, filters, chastity, lust, purity',
	'quaestiones.masturbatio.title': 'Masturbation',
	'quaestiones.masturbatio.question': 'Is it always a mortal sin?',
	'quaestiones.masturbatio.keywords':
		'habit, impurity, self-abuse, adolescent, relapse, addiction, confession, imputability',
	'quaestiones.reditus.title': 'Confession after a long time',
	'quaestiones.reditus.question': 'What happens if the last confession was years ago?',
	'quaestiones.reditus.keywords':
		'been away, coming back to the church, how to confess, forgot how, general confession, lapsed, first confession in years',
	'quaestiones.scrupulositas.title': 'When confession never feels finished',
	'quaestiones.scrupulositas.question': 'Did I confess it properly?',
	'quaestiones.scrupulositas.keywords':
		'scruples, scrupulosity, ocd, anxiety, repeating confessions, doubt, obsessive, never enough, reassurance',
	'quaestiones.post-abortum.title': 'After an abortion',
	'quaestiones.post-abortum.question': 'Can this be forgiven?',
	'quaestiones.post-abortum.keywords':
		'guilt, excommunication, healing, regret, absolution, the child, shame, years later',
	'quaestiones.post-contraceptionem.title': 'After contraception or a sterilisation',
	'quaestiones.post-contraceptionem.question': 'We already did it. What now?',
	'quaestiones.post-contraceptionem.keywords':
		'vasectomy, tubal ligation, sterilised, already on the pill, reversal, confession, undoing it',
	'quaestiones.adulterium.title': 'After an affair',
	'quaestiones.adulterium.question': 'Do I have to tell?',
	'quaestiones.adulterium.keywords':
		'infidelity, cheating, unfaithful, mistress, telling my wife, adultery, betrayal, forgiveness',
	'quaestiones.homosexualitas-vivenda.title': 'Being gay and Catholic',
	'quaestiones.homosexualitas-vivenda.question': 'What am I supposed to do with my life?',
	'quaestiones.homosexualitas-vivenda.keywords':
		'same-sex attraction, celibacy, loneliness, friendship, coming out, partner, courage',
	'quaestiones.mortis-desiderium.title': 'Wanting to die',
	'quaestiones.mortis-desiderium.question': 'If I did it, would God forgive it?',
	'quaestiones.mortis-desiderium.keywords':
		'suicidal, want to die, self-harm, hopeless, ending it, thoughts, help, despair, alone',
	'quaestiones.venia-danda.title': 'Someone I cannot forgive',
	'quaestiones.venia-danda.question': 'Do I have to?',
	'quaestiones.venia-danda.keywords':
		'resentment, bitterness, abuse, anger, reconcile, letting go, enemies',
	'quaestiones.dubium-fidei.title': 'Losing belief',
	'quaestiones.dubium-fidei.question': 'I still go to Mass and I no longer believe any of it.',
	'quaestiones.dubium-fidei.keywords':
		'doubt, lost my faith, going through the motions, dark night, dryness, unbelief, pretending',
	'quaestiones.amor-dei.title': 'Whether God loves me',
	'quaestiones.amor-dei.question': 'I believe it about everyone else.',
	'quaestiones.amor-dei.keywords':
		'unlovable, worthless, does god care, hate myself, unworthy, disgusting, feel nothing, ashamed, forgotten by god, too far gone',
	'quaestiones.oratio-inaudita.title': 'When prayer is not answered',
	'quaestiones.oratio-inaudita.question': 'I asked, and nothing happened.',
	'quaestiones.oratio-inaudita.keywords':
		'god is silent, no reply, begged, novena, petition, gave up praying, not listening, nothing changed, miracle that never came, why me',
	// --- ordinary questions ---
	'quaestiones.divinatio.title': 'Astrology and divination',
	'quaestiones.divinatio.question': 'Horoscopes, tarot, the dead — what is actually forbidden?',
	'quaestiones.divinatio.keywords':
		'ouija, mediums, fortune telling, psychic, palm reading, crystals, new age, seance, zodiac, spiritism',
	'quaestiones.signa.title': 'Signs',
	'quaestiones.signa.question': 'Was that a sign, or was it a coincidence?',
	'quaestiones.signa.keywords':
		'god told me, providence, discernment, a dream, kept happening, opened the bible at random, asked for proof, meant to be, fate, luck, repeating numbers, guidance',
	'quaestiones.mortui.title': 'Ghosts and the dead',
	'quaestiones.mortui.question': 'Can the dead come back?',
	'quaestiones.mortui.keywords':
		'spirits, hauntings, dreaming of the dead, visits, seances, necromancy, presence, seeing a relative',
	'quaestiones.daemones.title': 'Demons and exorcism',
	'quaestiones.daemones.question': 'Does the Church still do that?',
	'quaestiones.daemones.keywords':
		'possession, devil, satan, evil spirits, deliverance, exorcist, oppression, spiritual warfare',
	'quaestiones.angeli.title': 'Angels',
	'quaestiones.angeli.question': 'Is a guardian angel a real thing?',
	'quaestiones.angeli.keywords':
		'archangel, michael, cherubim, seraphim, spirits, prayer to saint michael',
	'quaestiones.apparitiones.title': 'Apparitions and private revelation',
	'quaestiones.apparitiones.question': 'Does a Catholic have to believe in them?',
	'quaestiones.apparitiones.keywords':
		'fatima, lourdes, guadalupe, medjugorje, visionaries, approved, messages, seers, secrets',
	'quaestiones.miracula-et-reliquiae.title': 'Miracles and relics',
	'quaestiones.miracula-et-reliquiae.question': 'Are bones and incorrupt bodies really venerated?',
	'quaestiones.miracula-et-reliquiae.keywords':
		'shroud of turin, healings, canonisation, first class relic, eucharistic miracle, saint bodies',
	'quaestiones.experientia-mortis-proximae.title': 'Near-death experiences',
	'quaestiones.experientia-mortis-proximae.question':
		'Do people who came back see what they say they saw?',
	'quaestiones.experientia-mortis-proximae.keywords':
		'near death experience, nde, tunnel of light, out of body, clinically dead, visions of heaven, resuscitated',
	'quaestiones.finis-mundi.title': 'The end of the world',
	'quaestiones.finis-mundi.question': 'Is any of the end-times talk the Church’s?',
	'quaestiones.finis-mundi.keywords':
		'apocalypse, rapture, antichrist, revelation, second coming, tribulation, prophecies, three days of darkness, doomsday, armageddon',
	'quaestiones.oratio.title': 'Praying',
	'quaestiones.oratio.question': 'I do not know how it is done.',
	'quaestiones.oratio.keywords':
		'prayer, how to pray, rosary, meditation, contemplation, distracted, silence, lectio divina, retreat, spiritual exercises, mental prayer, words to use',
	'quaestiones.ieiunium.title': 'Fasting and abstinence',
	'quaestiones.ieiunium.question': 'What is required, and on which days?',
	'quaestiones.ieiunium.keywords':
		'lent, ash wednesday, good friday, meat on a friday, eucharistic fast, giving something up, penance, one hour before communion',
	'quaestiones.dominica.title': 'Sunday Mass',
	'quaestiones.dominica.question': 'What happens if it is missed?',
	'quaestiones.dominica.keywords':
		'sunday obligation, missing mass, holy days of obligation, working on a sunday, mortal sin, travelling, mass on television, precept',
	'quaestiones.otium.title': 'Rest and leisure',
	'quaestiones.otium.question': 'Is there anything wrong with doing nothing?',
	'quaestiones.otium.keywords':
		'sabbath, holidays, idleness, hobbies, burnout, overwork, free time',
	'quaestiones.initiatio-adultorum.title': 'Becoming Catholic as an adult',
	'quaestiones.initiatio-adultorum.question': 'Where does anyone even start?',
	'quaestiones.initiatio-adultorum.keywords':
		'rcia, ocia, convert, catechumen, join the church, never confirmed, baptised as a baby, instruction, how long does it take, easter vigil, sponsor, converting',
	'quaestiones.baptismus-infantium.title': 'Baptising a baby',
	'quaestiones.baptismus-infantium.question': 'Who may be a godparent, and what is asked of them?',
	'quaestiones.baptismus-infantium.keywords':
		'godfather, godmother, sponsor, christening, delaying baptism, requirements, non-practising godparent, certificate',
	'quaestiones.organorum-donatio.title': 'Organ donation',
	'quaestiones.organorum-donatio.question': 'May organs be given, in life or after death?',
	'quaestiones.organorum-donatio.keywords':
		'donor card, transplant, brain death, blood donation, body to science, kidney, corneas',
	'quaestiones.corpus-ornandum.title': 'Tattoos and the body',
	'quaestiones.corpus-ornandum.question': 'Is anything forbidden about what is done to it?',
	'quaestiones.corpus-ornandum.keywords':
		'piercing, cosmetic surgery, body modification, gym, dieting, appearance, vanity',
	'quaestiones.decimae.title': 'Giving and tithing',
	'quaestiones.decimae.question': 'How much is a Catholic supposed to give?',
	'quaestiones.decimae.keywords':
		'tithe, ten per cent, collection, donations, supporting the parish, offering, church money',
	'quaestiones.vota-et-iuramenta.title': 'Vows and oaths',
	'quaestiones.vota-et-iuramenta.question': 'What is a promise made to God?',
	'quaestiones.vota-et-iuramenta.keywords':
		'promise to god, swearing, novena promise, consecration, breaking a vow, dispensation, swearing in court',
	'quaestiones.vocatio.title': 'What to do with a life',
	'quaestiones.vocatio.question': 'How is anyone supposed to know?',
	'quaestiones.vocatio.keywords':
		'vocation, discernment, calling, priesthood, religious life, seminary, career, marriage or priesthood, what god wants',
	'quaestiones.merces-iusta.title': 'A just wage, and striking',
	'quaestiones.merces-iusta.question': 'What is a wage supposed to cover?',
	'quaestiones.merces-iusta.keywords':
		'minimum wage, living wage, union, salary, employer, overtime, unpaid, exploitation',
	'quaestiones.pecunia-collocanda.title': 'Investing and speculation',
	'quaestiones.pecunia-collocanda.question': 'Is there a wrong way to make money with money?',
	'quaestiones.pecunia-collocanda.keywords':
		'stocks, usury, interest, crypto, gambling, betting, ethical funds, lottery',
	'quaestiones.tributum.title': 'Tax',
	'quaestiones.tributum.question': 'Is cheating on it a sin?',
	'quaestiones.tributum.keywords':
		'taxes, evasion, cash in hand, declaring income, customs, smuggling, tax return',
	'quaestiones.invidia.title': 'Envy',
	'quaestiones.invidia.question': 'Why does everyone else’s life look better than mine?',
	'quaestiones.invidia.keywords':
		'jealousy, comparison, social media, resentment, coveting, begrudging, other people succeeding',
	'quaestiones.acedia.title': 'Sloth and acedia',
	'quaestiones.acedia.question': 'Is no longer caring a sin?',
	'quaestiones.acedia.keywords':
		'apathy, laziness, burnout, spiritual dryness, indifference, procrastination, noonday devil, listless',
	'quaestiones.discrimen-gentium.title': 'Racism',
	'quaestiones.discrimen-gentium.question': 'What has the Church actually said about it?',
	'quaestiones.discrimen-gentium.keywords':
		'race, discrimination, prejudice, xenophobia, equality, slavery, indigenous peoples, skin colour',
	'quaestiones.mercatura-hominum.title': 'Trafficking and prostitution',
	'quaestiones.mercatura-hominum.question': 'What does the Church say about buying a person?',
	'quaestiones.mercatura-hominum.keywords':
		'human trafficking, slavery, exploitation, sex work, pimps, forced labour, brothel',
	'quaestiones.violentia-domestica.title': 'Violence at home',
	'quaestiones.violentia-domestica.question': 'What does the Church say to someone being hurt?',
	'quaestiones.violentia-domestica.keywords':
		'domestic violence, abuse, beaten, my husband hits me, leaving him, safety, children, separation, restraining order',
	'quaestiones.violentia-digitalis.title': 'Reputation, privacy and what is said online',
	'quaestiones.violentia-digitalis.question': 'What is owed to somebody’s name?',
	'quaestiones.violentia-digitalis.keywords':
		'cyberbullying, doxxing, cancelling, defamation, social media, gossip, screenshots, exposure',
	'quaestiones.debilitas.title': 'Disability',
	'quaestiones.debilitas.question': 'What does the Church say about a life others call diminished?',
	'quaestiones.debilitas.keywords':
		'down syndrome, special needs, wheelchair, prenatal screening, carers, autism, institution',
	'quaestiones.carceres.title': 'Prison and torture',
	'quaestiones.carceres.question': 'What may be done to someone who has done wrong?',
	'quaestiones.carceres.keywords':
		'prisoners, punishment, rehabilitation, life sentence, criminals, visiting, solitary confinement',
	'quaestiones.defensio-sui.title': 'Self-defence',
	'quaestiones.defensio-sui.question': 'May a person defend themselves, and how far?',
	'quaestiones.defensio-sui.keywords':
		'guns, weapons, intruder, protecting my family, force, killing an attacker, violence',
	'quaestiones.proles-suscipienda.title': 'Whether to have children',
	'quaestiones.proles-suscipienda.question': 'Is it wrong to decide not to?',
	'quaestiones.proles-suscipienda.keywords':
		'having children, childfree, family size, responsible parenthood, how many children, delaying, career, overpopulation'
};
