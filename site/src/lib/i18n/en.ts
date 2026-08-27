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
	'nav.prayers': 'Prayers',
	'nav.bookmarks': 'Bookmarks',
	'nav.menu': 'Menu',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Continue reading',
	'home.works': 'Library',
	// Home page's Catechism/Compendium section — see routes/+page.svelte's
	// module docblock for why this is ONE table of contents, not two.
	'home.ccc.heading': 'Catechism & Compendium',
	'home.ccc.noCounterpart': 'No counterpart in the other work',
	'home.magisterium.mostRecent': 'Latest',
	'jumpbox.placeholder': 'Jump to… (e.g. john 3:16, ccc 1234)',
	'jumpbox.short': 'Search',
	'jumpbox.hint': 'Press / or Ctrl+K to jump to a reference',
	'jumpbox.noMatch': 'No match',
	// The suggestion listbox's accessible name. The box has no visible
	// heading, and `aria-label` on the dialog names the DIALOG; a listbox
	// inside it is a second widget and owes its own name.
	'jumpbox.suggestions': 'Suggestions',

	// Appearance menu — AppearanceMenu.svelte is the consumer; the dark-mode
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
	'appearance.label': 'Appearance',
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

	'ccc.prevParagraph': 'Previous',
	'ccc.nextParagraph': 'Next',
	'ccc.inBrief': 'In Brief',
	'ccc.landing.title': 'Catechism of the Catholic Church',
	'ccc.landing.tagline': 'The complete Catechism.',
	'ccc.tableOfContents': 'Table of Contents',
	'ccc.related': 'See also',

	// Compendium of the CCC — routes/compendium/** is the consumer.
	'compendium.landing.title': 'Compendium of the Catechism',
	'compendium.landing.tagline':
		'Questions and answers summarizing the Catechism of the Catholic Church.',
	'compendium.question': 'Question',
	'compendium.answer': 'Answer',
	'compendium.tableOfContents': 'Table of Contents',
	'compendium.prevQuestion': 'Previous question',
	'compendium.nextQuestion': 'Next question',
	'compendium.condenses': 'Condenses CCC ¶¶',
	'compendium.noQuestionNumber': 'No question number in this corpus',
	'nav.summa': 'Summa',
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
	'index.showSubsections': 'Show subsections',
	'index.hideSubsections': 'Hide subsections',

	// Common Prayers (docs/corpus-schema.md §Prayers) — routes/prayers/**
	// is the consumer, plus the home page's compact Prayers section.
	'prayers.landing.title': 'Common Prayers',
	'prayers.landing.tagline': 'Prayers with the Latin text alongside.',
	'prayers.tableOfContents': 'Table of Contents',
	'prayers.prevPrayer': 'Previous prayer',
	'prayers.nextPrayer': 'Next prayer',
	// The Rosary reader's own chrome — routes/prayers/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Today',
	'prayers.rosary.todayHeading': 'Today’s mysteries',
	'prayers.rosary.openingPrayer': 'Opening prayer',
	'prayers.rosary.decadePrayers': 'The prayers of a decade',
	'home.prayers.heading': 'Prayers',
	'home.prayers.browseAll': 'Browse all prayers',

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
	// docs/corpus-schema.md §Documents) — routes/documents/** is the
	// consumer, plus the home page's Magisterium group.
	'document.library.tagline':
		'Encyclicals, conciliar constitutions, decrees, and declarations of the Magisterium.',
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
		'No analytics, no tracking scripts, no third-party code. The server that sends you these pages keeps ordinary request logs, as any web server does; nothing beyond that watches what you read.',
	'colophon.pointOffline':
		'Built to keep working offline once you have visited it, so a poor connection need not be a barrier to reading.',
	'colophon.textsTitle': 'The texts',
	'colophon.textsBody':
		'Every text comes from a named source, and every work records its edition, its source page and the date it was retrieved. Scripture uses public-domain translations; the Catechism, the Compendium and the magisterial documents come from the Holy See\u2019s own published texts. We reproduce them unaltered \u2014 and where our copy of a work has turned out incomplete, we leave it out of the site rather than show you a text with gaps you cannot see.',
	'colophon.countBible': 'Bible editions',
	'colophon.countDocuments': 'magisterial documents',
	'colophon.copyrightTitle': 'Copyright',
	'colophon.copyrightBody1':
		'The Catechism, the Compendium and the magisterial documents are the property of their rights holders \u2014 principally the Libreria Editrice Vaticana and the Dicastery for Communication. We reproduce them here without having asked permission first. We say so plainly rather than leave it to be discovered: this is a deliberate choice, not an oversight.',
	'colophon.copyrightBody2':
		'We make that choice because these texts are the Church\u2019s teaching, addressed to everyone, and because the concern rights holders have stated is the integrity of the text. So the text is never abridged, never paraphrased, never rewritten, and never placed beside advertising. We do repair plain defects in the published pages \u2014 a dropped word, a mangled citation, markup that swallowed a paragraph \u2014 always toward what the source itself prints, never toward what we might think it should say. We do not change its meaning, do not substitute our own wording, and do not annotate or editorialise. Every correction is recorded on its own, with the original, the replacement and the reason; nothing is ever changed silently. Each work displays its rights holder\u2019s own copyright notice, in their wording, and links to the page it was taken from.',
	'colophon.copyrightBody3':
		'If you hold rights in any text here and would rather it were not published, write to us and we will take it down promptly. No argument, and no need to involve anyone else first.',
	'colophon.contactTitle': 'Contact',
	'colophon.contactBody': 'For anything at all, including the above:',
	'colophon.contactPending':
		'A contact address has not been set yet. This site should not be made public until it has one \u2014 the commitment above is not meaningful without a way to reach us.',
	'colophon.buildTitle': 'How it is made',
	'colophon.buildBody':
		'The texts are collected from their published sources, parsed into a structured corpus, and rendered as static pages. Corrections to source defects are recorded individually, with the original wording, the corrected wording, and the reason \u2014 no text is ever silently changed.',
	'colophon.typeTitle': 'The type',
	'colophon.typeBody':
		'Set in EB Garamond, Georg Duffner and Octavio Pardo\u2019s revival of the types Claude Garamont cut in the 1590s \u2014 the humanist tradition the Church has printed in since the Renaissance. The opening initials are Pirata One, a blackletter whose capitals stay legible at the size a drop cap demands. Both are licensed under the SIL Open Font License and served from this site rather than from a third party, so reading a page asks nothing of anyone else\u2019s server.',
	// One panel for every work that cites a verse — the Catechism and the
	// magisterial documents together, so the verse is named once and
	// everything citing it sits beside it. Each entry carries its own
	// work's name, so the heading names no work at all.
	'refs.citedIn': 'Cited in',
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

	// Static 404 — routes/404/+page.svelte, an ordinary SPA route (there is
	// no build/404.html any more — the build emits only index.html and the
	// offline fallback) reached directly or via +error.svelte for an
	// invalid deep link, with src/worker.ts preserving the HTTP 404 status
	// before the SPA starts. See that route file's own docblock.
	'notFound.title': 'Nothing at this address',
	'notFound.lede': 'The page you asked for is not here.',
	'notFound.body':
		'The link may be mistyped or out of date, or it may point to a text this site does not carry. Nothing here is behind a login or a paywall, so if a page exists, it can be reached.',
	'notFound.searchHint':
		'If you know the reference you want — a book and chapter, a paragraph of the Catechism — type it into the search box at the top of this page.',
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
	// The table of contents panel's dismiss control (`TocMenu`). Its own
	// name, not the panel's: below 48rem the panel is the whole viewport
	// and this button is the only way out of it, so it says what it does
	// rather than repeating the heading beside it.
	'toc.close': 'Close'
};
