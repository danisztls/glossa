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
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Continue reading',
	// The Library door, and the page behind it (`routes/bibliotheca/`). The
	// key was `home.works` and had been written in all thirty-seven languages
	// for a home-page section that no longer existed — the label is the same
	// word, so it was renamed rather than re-translated.
	'nav.library': 'Library',
	// THE ONE IMPERATIVE ON THE BAR, and the trade is deliberate: it is the
	// only label a reader who does not yet know what a "Catechism" is can act
	// on (`docs/research/organization.md` §The bar). It points at
	// `/catechismus`, which keeps its own name everywhere else on the site.
	// Each dictionary uses whatever register its language puts on a nav item —
	// an imperative in the Romance languages and Latin, a verbal noun in the
	// Slavic ones and in Hungarian, where an imperative would read as an order.
	'nav.learn': 'Learn',
	// Both halves of what the page holds, in one sentence: the catalogue, and
	// the reader's own place in it. A library has a catalogue AND a borrowing
	// record.
	'library.landing.tagline':
		'The whole corpus, shelf by shelf — with where you left off and what you have marked.',
	// The placeholder in a paired index row where one of the two works has
	// nothing at that division — see `CatechismIndex.svelte` on why the gap is
	// drawn rather than closed.
	'ccc.noCounterpart': 'No counterpart in the other work',
	'jumpbox.placeholder': 'Jump to… (e.g. john 3:16, ccc 1234)',
	'jumpbox.short': 'Search',
	'jumpbox.hint': 'Press / or Ctrl+K to jump to a reference',
	'jumpbox.noMatch': 'No match',
	// The suggestion listbox's accessible name. The box has no visible
	// heading, and `aria-label` on the dialog names the DIALOG; a listbox
	// inside it is a second widget and owes its own name.
	'jumpbox.suggestions': 'Suggestions',

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
	// THE OFFLINE LIBRARY — `AdvancedSheet.svelte`'s first block. The wave
	// names are NOT here:
	// five of the seven reuse keys the translators have already written
	// (`nav.ccc`, `nav.bible`, `nav.magisterium`, `summa.landing.title`), which
	// is the cheap way to add a surface. Only the two the interface had no word
	// for are below.
	'library.title': 'Offline library',
	'library.lede': 'Texts kept on this device open with no network at all.',
	'library.essentials': 'Prayers and Compendium',
	// Doré's 241 engravings, 482 files and 103 MB — named for what a reader
	// would look for rather than for the artist, who is credited on the
	// colophon and in every plate's own caption. "(illustrations)" and not
	// "illustrated" because the row is not another Bible: it is the pictures
	// alone, and the text is the row above.
	'library.illustrations': 'Bible (illustrations)',
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
	// request, not a wrong address. English only for now: `t()` falls back key
	// by key, so every other interface language gets these in English rather
	// than getting `NotFound`'s wrong answer in their own.
	'loadFailed.title': 'That did not load',
	'loadFailed.hint':
		'The page exists — something went wrong fetching it. Trying again usually works.',
	'loadFailed.retry': 'Try again',
	'loadFailed.retrying': 'Trying…',
	'offline.turnOff': 'Turn off offline mode',

	'fontSize.label': 'Text size',
	'fontSize.larger': 'Larger text',
	'fontSize.smaller': 'Smaller text',
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
	'bible.landing.tagline': 'Read the whole Bible, book by book, chapter by chapter.',
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
	// The page's whole description: `/catechismus` indexes BOTH works, the
	// Compendium having no index of its own. `**` marks the two names for
	// emphasis (`boldMarkup.ts`) — inside the sentence rather than around it,
	// because thirteen translations do not share English word order.
	'ccc.landing.tagline':
		'<strong>The Catechism</strong> sets out Catholic doctrine in 2,865 numbered paragraphs. <strong>The Compendium</strong> restates the same doctrine as 598 questions and answers, on the same outline.',
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
	'doctores.landing.tagline': 'The theological works of the Fathers and Doctors of the Church.',
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
	'prayers.prevPrayer': 'Previous prayer',
	'prayers.nextPrayer': 'Next prayer',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Today',
	'prayers.rosary.todayHeading': 'Today’s mysteries',
	'prayers.rosary.openingPrayer': 'Opening prayer',
	'prayers.rosary.decadePrayers': 'The prayers of a decade',

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
	'bookmark.library.tagline': 'Everything you have marked while reading.',
	'bookmark.empty': 'Nothing marked yet.',
	'bookmark.emptyHint':
		'Click a verse or paragraph number and choose Bookmark, or use the bookmark button on a page.',
	'bookmark.deviceOnly':
		'Bookmarks are kept in this browser only. They are not sent anywhere, and clearing your browser data removes them.',
	'bookmark.unavailable': 'Not in the edition you are reading',

	// Documents (encyclicals, conciliar constitutions/decrees/declarations,
	// docs/corpus-schema.md §Documents) — routes/documenta/** is the
	// consumer, plus the home page's Magisterium group.
	'document.library.tagline':
		'Encyclicals, conciliar constitutions, decrees, and declarations of the Magisterium.',
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
	'colophon.countBible': 'Bible editions',
	'colophon.countDocuments': 'magisterial documents',
	'colophon.copyrightTitle': 'Copyright',
	'colophon.copyrightBody1':
		'The Catechism, the Compendium and the magisterial documents are the property of their rights holders \u2014 principally the Libreria Editrice Vaticana and the Dicastery for Communication.',
	'colophon.copyrightBody2':
		'Each work displays its rights holder\u2019s own copyright notice, in their wording, and links to the page it was taken from.',
	'colophon.copyrightBody3':
		'If you hold rights in any text here and would rather it were not published, write to us.',
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
	'bible.cccAbbrev': 'CCC',
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
	'calendar.date': 'Date',
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
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oceania',
	'calendar.today': 'Today',
	'calendar.previousMonth': 'Previous month',
	'calendar.nextMonth': 'Next month',
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
	'calendar.rank.weekday': 'Weekday'
};
