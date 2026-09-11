/**
 * German UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * THE CALENDAR ARRIVED 2026-09-06, in two passes on one day -- the 44
 * `calendar.*` keys `/calendarium` labels itself with, its seasons, ranks and
 * colours among them, and then the 31 that TEACH those words
 * (`calendar.gloss.*`, `calendar.primer.*`). Those 31 are prose rather than
 * labels and are what held the page out of `CHROME_PATHS`: both keys
 * `CHROME_KEYS` reads are labels, so the coded gate would have opened on a
 * page whose whole primer was English. Same caveat as everything above.
 *
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const de: Dictionary = {
	'nav.bible': 'Bibel',
	'nav.ccc': 'Katechismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Lehramt',
	'nav.socialDoctrine': 'Soziallehre',
	'socialDoctrine.landing.title': 'Kompendium der Soziallehre der Kirche',
	'socialDoctrine.landing.tagline':
		'Was die Kirche über das Leben in der Gesellschaft lehrt, in 583 Nummern.',
	'nav.canonLaw': 'Kirchenrecht',
	'canonLaw.landing.title': 'Codex des kanonischen Rechtes',
	'canonLaw.landing.tagline':
		'Das Recht der lateinischen Kirche in 1752 Canones in sieben Büchern.',
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Cann.',
	'canonLaw.prevCanon': 'Vorheriger Canon',
	'canonLaw.nextCanon': 'Nächster Canon',
	'canonLaw.readFullTitle': 'Ganzen Titel lesen',
	'canonLaw.superseded': 'Fassung ersetzt durch',
	'nav.prayers': 'Gebete',
	'nav.bookmarks': 'Lesezeichen',
	'nav.menu': 'Menü',
	'nav.sections': 'Bereiche',
	'nav.works': 'Werke',
	'nav.pages': 'Seiten',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Weiterlesen',
	'home.tagline':
		'Eine Leseseite für die Heilige Schrift, den Katechismus und die Dokumente des Lehramts — kostenlos, offline nutzbar und ohne Anmeldung.',
	'home.doors.heading': 'Wohin',
	'home.find.heading': 'Oder eine Stelle eintippen',
	'nav.library': 'Bibliothek',
	'nav.learn': 'Lernen',
	'library.landing.tagline':
		'Der ganze Bestand, Regal für Regal — mit der Stelle, an der Sie aufgehört haben, und dem, was Sie markiert haben.',
	'schola.landing.title': 'Wo anfangen',
	'schola.landing.tagline':
		'Ein kurzer Wegweiser durch das, was hier steht: was jedes dieser Bücher ist, die Zehn Gebote und die anderen Listen, von denen die Kirche möchte, dass ein Katholik sie kennt, und wo man mit dem Lesen beginnt.',
	'schola.start.heading': 'Neu im katholischen Glauben?',
	'schola.start.body': 'Beginnen Sie mit dem ',
	'schola.start.bodyAfter':
		': dieselbe Lehre wie im Katechismus, viel kürzer, in Fragen und Antworten geschrieben. Es hat etwa ein Zehntel des Umfangs und setzt nichts voraus.',
	'schola.bible.heading': 'Noch nie die Bibel gelesen?',
	'schola.bible.library':
		'Sie ist nicht ein Buch, sondern dreiundsiebzig, über mehr als tausend Jahre geschrieben und in der Ordnung zusammengestellt, auf die die Kirche sich festgelegt hat — nicht in der Ordnung des Geschehens und nicht in der, die sich am leichtesten liest. Die meisten fangen auf der ersten Seite an und hören ein paar Wochen später auf, in einem langen Kapitel altem Recht, weil ihnen noch niemand gesagt hat, wozu das da ist.',
	'schola.bible.step.gospel': 'Fangen Sie mit einem Evangelium an',
	'schola.bible.start':
		'Eines von vier kurzen Büchern über das Leben Jesu, weit drinnen und nicht vorn. Das ist nicht unser Einfall: ein Konzil der Kirche hat verlangt, den rechten Gebrauch der Schrift zu lehren, „vor allem des Neuen Testamentes und zuerst der Evangelien“. Es hat keines einzeln genannt, und wir tun es auch nicht.',
	'schola.bible.whichGospel':
		'Drei werden gewöhnlich vorgeschlagen, aus drei verschiedenen Gründen. Jedes davon ist ein guter Ort, um zu sein.',
	'schola.bible.gospel.mark':
		'Das kürzeste. Sie können es an einem Nachmittag ganz lesen, und eines beendet zu haben ist am Anfang mehr wert, als das beste gewählt zu haben.',
	'schola.bible.gospel.luke':
		'Geschrieben für jemanden außerhalb des Glaubens, der die Geschichte der Reihe nach aufgezeichnet haben wollte — was genau Sie sein könnten. Es geht ohne Bruch in die Apostelgeschichte über, ist also eigentlich die erste Hälfte eines längeren Buches.',
	'schola.bible.gospel.john':
		'Das, welches offen sagt, warum es geschrieben wurde: „damit ihr glaubt“. Einfache Worte, und es geht geradewegs auf die Frage zu, wer Jesus ist.',
	'schola.bible.step.acts': 'Dann, was danach geschah',
	'schola.bible.thenActs':
		'Wenn Sie eines beendet haben, lesen Sie, was die taten, die ihn gekannt hatten, nachdem er fort war.',
	'schola.bible.acts.why':
		'Die dreißig Jahre nach dem Ende der Evangelien: ein paar Dutzend verängstigte Menschen, und wie das, was sie gesehen hatten, ans andere Ende des Reiches gelangte.',
	'schola.bible.step.old': 'Dann die ältere Hälfte',
	'schola.bible.thenOld':
		'Nicht von der ersten Seite an, und nicht ganz. Ein paar Stellen tragen die Geschichte, und es sind die, auf die die Evangelien immer wieder zurückweisen.',
	'schola.bible.ot.beginnings': 'Wie es beginnt, und wie es schiefgeht.',
	'schola.bible.ot.promise':
		'Eine Familie, und eine ihr gegebene Verheißung, die alle in ihr überdauert.',
	'schola.bible.ot.exodus':
		'Ein Volk aus der Sklaverei herausgeführt, und ein Gesetz, nach dem es leben soll.',
	'schola.bible.ot.psalms':
		'Keine Erzählung: hundertfünfzig Gebete und Lieder. Lesen Sie eines nach dem anderen, in beliebiger Reihenfolge. Die Kirche betet sie bis heute täglich.',
	'schola.bible.bothWays':
		'Sie werden Dinge wiedererkennen, und das ist der Sinn und kein Zufall. Die Kirche liest die älteren Bücher im Licht Christi und die neueren im Licht dessen, was vorher war — jede Hälfte erklärt die andere, und darum wird keine allein gelesen.',
	'schola.books.heading': 'Was hier steht',
	'schola.books.lede':
		'Jedes davon ist eine andere Art Buch, und die Zeile darunter sagt, welche. Öffnen Sie das Suchfeld oben auf der Seite, um zu sehen, wie auf jedes verwiesen wird, und um direkt zu einer Stelle zu gelangen.',
	'schola.what.scripture':
		'Die Schrift, wie die Kirche sie empfängt, in beiden Testamenten. Alles andere hier wird in ihrem Licht gelesen.',
	'schola.what.catechism':
		'Eine Zusammenfassung dessen, was die Katholische Kirche glaubt, in einem Band. Er ist selbst keine Quelle: er sammelt die Schrift, die Väter, die Liturgie und die Lehre der Kirche, und jede Nummer sagt, woher stammt, was sie sagt.',
	'schola.what.compendium': 'Dieselbe Lehre in Fragen und Antworten, etwa ein Zehntel so lang.',
	'schola.what.magisterium':
		'Was Päpste und Konzilien tatsächlich geschrieben haben — Enzykliken, Konstitutionen, Dekrete, Erklärungen — jeweils an einen bestimmten Augenblick und eine bestimmte Frage gerichtet. Jedes wird nach seinen lateinischen Anfangsworten benannt.',
	'schola.what.social':
		'Die Lehre der Kirche über Arbeit, Eigentum, Familie, Politik und Frieden, aus jenen Dokumenten in einem Buch gesammelt.',
	'schola.what.law':
		'Recht und nicht Lehre. Es sagt, was die Kirche fordert, und es wird geändert.',
	'schola.what.doctors':
		'Die Theologen, die die Kirche zu Lehrern erklärt hat. Es trägt keine amtliche Autorität, so groß sein Verfasser auch sei.',
	'schola.what.prayers': 'Die Worte, die die Kirche betet, mit dem Lateinischen daneben.',
	'schola.places.heading': 'Keine Texte, sondern Orte auf dieser Seite',
	'schola.what.library':
		'Alle Werke der Seite in einer Liste, nach Sachgebiet geordnet und nicht nach Gattung.',
	'schola.what.questions':
		'Ein Zugang für einen Leser, der eine Frage hat und keinen Verweis. Jede Frage sammelt die Stellen, die sie beantworten — zuerst aus dem Katechismus —, und jedes Wort darin ist das der Kirche selbst.',
	'schola.what.calendar':
		'Der liturgische Tag — Zeit, Farbe und wessen gedacht wird — für das Land, dessen Kalender Sie folgen.',
	'schola.what.bookmarks':
		'Stellen, die Sie gemerkt haben, und wo Sie in jedem Werk zuletzt aufgehört haben. Beides bleibt in diesem Browser und wird nirgendwohin gesendet.',
	'schola.what.census':
		'Was diese Bibliothek enthält und wie weit sie reicht — wie viele Werke, in welchen Sprachen, und wie viel davon ein Leser Ihrer Sprache tatsächlich erreichen kann.',
	'schola.formulas.heading': 'Die Zehn Gebote, und was sonst noch auswendig gelernt wird',
	'schola.formulas.lede':
		'Keine Zusammenfassung von dieser Seite: das sind die Listen, die die Kirche selbst am Ende des Kompendiums abdruckt, für jeden, der im Glauben unterwiesen wird. Jedes Wort unten ist aus Ihrer eigenen Ausgabe zitiert.',
	'ccc.noCounterpart': 'Keine Entsprechung im anderen Werk',
	'jumpbox.placeholder': 'Springe zu… (z. B. johannes 3,16, ccc 1234)',
	'jumpbox.short': 'Suchen',
	'jumpbox.hint': '/ oder Strg+K drücken, um zu einer Stelle zu springen',
	'jumpbox.noMatch': 'Kein Treffer',
	'jumpbox.suggestions': 'Vorschläge',
	'settings.label': 'Einstellungen',
	'apparatus.label': 'Apparat',
	'apparatus.editionNotes': 'Anmerkungen dieser Ausgabe',
	'apparatus.commentary': 'Kommentar',
	'apparatus.inCommentary': 'Im obigen Kommentar enthalten.',
	'darkMode.label': 'Dunkelmodus',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'An',
	'darkMode.off': 'Aus',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Nur im Hellmodus',
	'sepia.noHue': 'Nicht in Mono',
	'oled.label': 'OLED-Schwarz',
	'oled.darkOnly': 'Nur im Dunkelmodus',
	'mono.label': 'Monochrom',
	'mono.hint':
		'Setzt die ganze Seite in ein einziges Grau, sodass nichts an der Farbe zu erkennen ist. Sepia wird ausgeschaltet, solange es an ist.',
	'advanced.label': 'Erweitert',
	'library.title': 'Offline-Bibliothek',
	'library.lede': 'Texte auf diesem Gerät öffnen sich ganz ohne Netz.',
	'library.essentials': 'Gebete und Kompendium',
	'library.illustrations': 'Bibel (Illustrationen)',
	'library.illustrationsDetail': 'Bibel (Illustrationen, hohe Auflösung)',
	'library.other': 'Weitere Texte',
	'library.everything': 'Alles',
	'library.downloadAll': 'Alles herunterladen',
	'library.download': 'Laden',
	'library.downloaded': 'Auf diesem Gerät',
	'library.offlineNote': 'Schalten Sie den Offline-Modus aus, um etwas zu laden.',
	'library.remove': 'Von diesem Gerät entfernen',
	'library.removeConfirm': 'Entfernen?',
	'library.forget': 'Downloads entfernen',
	'library.forgetConfirm': 'Alles entfernen?',
	'offline.label': 'Offline-Modus',
	'offline.hint':
		'Verwendet überhaupt kein Netz: nichts wird heruntergeladen, nicht nach Aktualisierungen gesucht, nichts gemessen. Nur Texte, die bereits auf diesem Gerät sind, lassen sich öffnen.',
	'offline.notDownloaded': 'Nicht auf diesem Gerät',
	'loadFailed.title': 'Das ließ sich nicht laden',
	'loadFailed.hint':
		'Die Seite gibt es — beim Abrufen ging etwas schief. Ein zweiter Versuch hilft meistens.',
	'loadFailed.retry': 'Erneut versuchen',
	'loadFailed.retrying': 'Wird versucht…',
	'offline.turnOff': 'Offline-Modus ausschalten',

	'type.label': 'Schriftgröße und Schriftart',
	'fontSize.label': 'Schriftgröße',
	'fontSize.small': 'Klein',
	'fontSize.medium': 'Mittel',
	'fontSize.large': 'Groß',
	'fontSize.xlarge': 'Sehr groß',
	'fontSize.xxlarge': 'Größte',
	'face.label': 'Schriftart',
	'face.serif': 'Serif',
	'face.sans': 'Grotesk',
	'print.label': 'Diese Seite drucken',
	'toTop.label': 'Nach oben',
	'install.label': 'Glossa installieren',
	'install.hint.label': 'Zum Home-Bildschirm',
	'install.hint.title': 'Glossa zum Home-Bildschirm hinzufügen',
	'install.hint.stepBefore': 'Sie öffnet sich wie eine App und liest sich offline. Tippen Sie auf',
	'install.hint.stepAfter': 'dann „Zum Home-Bildschirm“.',
	'install.hint.dismiss': 'Schließen',
	'update.label': 'Eine neue Ausgabe ist verfügbar',
	'update.title': 'Eine neue Ausgabe ist bereit',
	'update.body': 'Neu laden, um die neuesten Texte und Korrekturen zu erhalten.',
	'update.action': 'Neu laden',
	'update.dismiss': 'Jetzt nicht',
	'edition.label': 'Ausgabe',
	'edition.select': 'Ausgabe wählen',
	'edition.current': 'Aktuelle Ausgabe',
	'edition.filter': 'Ausgaben suchen',
	'menu.noMatches': 'Keine Treffer',
	'unitNav.previous': 'Zurück',
	'unitNav.next': 'Weiter',
	'bible.prevChapter': 'Vorheriges Kapitel',
	'bible.nextChapter': 'Nächstes Kapitel',
	'bible.pickBook': 'Bücher und Kapitel',
	'bible.landing.title': 'Die Bibel',
	'bible.landing.tagline': 'Lesen Sie die ganze Bibel, Buch für Buch, Kapitel für Kapitel.',
	'bible.landing.random': 'Auf gut Glück',
	'bible.landing.books': 'Bücher',
	'bible.chapterUnavailable': 'In dieser Ausgabe nicht verfügbar',
	'bible.introduction': 'Einleitung',
	'bible.introUnavailable': 'Noch keine Einleitung in dieser Sprache',
	'bible.introSource': 'Die Einleitungen gehören nicht zum Schrifttext.',
	'bible.testament.ot': 'Altes Testament',
	'bible.testament.nt': 'Neues Testament',
	'bible.group.pentateuch': 'Pentateuch',
	'bible.group.historical': 'Geschichtsbücher',
	'bible.group.wisdom': 'Lehrbücher',
	'bible.group.prophetic': 'Prophetenbücher',
	'bible.group.gospels': 'Evangelien',
	'bible.group.acts': 'Apostelgeschichte',
	'bible.group.pauline': 'Paulusbriefe',
	'bible.group.catholicLetters': 'Katholische Briefe',
	'bible.group.revelation': 'Offenbarung',
	'ccc.prevParagraph': 'Vorheriger Absatz',
	'ccc.nextParagraph': 'Nächster Absatz',
	'ccc.inBrief': 'Kurztext',
	'ccc.landing.title': 'Katechismus der Katholischen Kirche',
	'ccc.landing.pairTitle': 'Katechismus & Kompendium',
	'ccc.landing.tagline':
		'<strong>Der Katechismus</strong> legt die katholische Lehre in 2.865 nummerierten Abschnitten dar. <strong>Das Kompendium</strong> gibt dieselbe Lehre in 598 Fragen und Antworten wieder, nach derselben Gliederung.',
	'ccc.landing.pairTagline':
		'Der Katechismus der Katholischen Kirche in 2.865 Abschnitten und sein Kompendium in 598 Fragen.',
	'ccc.tableOfContents': 'Inhaltsverzeichnis',
	'ccc.related': 'Siehe auch',
	'compendium.landing.title': 'Kompendium des Katechismus',
	'compendium.landing.tagline':
		'Fragen und Antworten, die den Katechismus der Katholischen Kirche zusammenfassen.',
	'compendium.question': 'Frage',
	'compendium.answer': 'Antwort',
	'compendium.tableOfContents': 'Inhaltsverzeichnis',
	'compendium.prevQuestion': 'Vorherige Frage',
	'compendium.nextQuestion': 'Nächste Frage',
	'compendium.condenses': 'Fasst KKK ¶¶ zusammen',
	'ccc.abbrev': 'KKK',
	'ccc.condensedIn': 'Im Kompendium',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Keine Fragenummer in diesem Korpus',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Kirchenlehrer',
	'doctores.landing.tagline': 'Die theologischen Werke der Kirchenväter und Kirchenlehrer.',
	'summa.landing.title': 'Summa theologiae',
	'summa.landing.tagline': 'Thomas von Aquin, auf Englisch und in dem Latein, in dem er schrieb.',
	'summa.tableOfContents': 'Inhaltsverzeichnis',
	'summa.part': 'Teil',
	'summa.question': 'Quaestio',
	'summa.article': 'Artikel',
	'summa.questionShort': 'Qu.',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titel aus der Ausgabe auf {lang}',
	'summa.titlesFromEdition': 'Titel aus der Ausgabe auf {lang} — diese druckt keine',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Einwand',
	'summa.sedContra': 'Dagegen spricht',
	'summa.corpus': 'Ich antworte',
	'summa.reply': 'Antwort auf den Einwand',
	'summa.preamble': 'Anmerkung',
	'summa.prevQuestion': 'Vorherige Quaestio',
	'summa.nextQuestion': 'Nächste Quaestio',
	'summa.noEditionInYourLanguage':
		'Die Summa hat keine Ausgabe in Ihrer Sprache. Gezeigt wird die Ausgabe auf {lang}.',
	'summa.noLatinSupplement':
		'Das Supplementum gibt es nur auf Englisch — es wurde nach dem Tod des Aquinaten zusammengestellt.',
	'index.division': 'Abschnitt',
	'index.showSubsections': 'Unterabschnitte zeigen',
	'index.hideSubsections': 'Unterabschnitte verbergen',
	'prayers.landing.title': 'Gebete',
	'prayers.landing.tagline': 'Gebete mit dem lateinischen Text daneben.',
	'prayers.gloss.versicle':
		'Der Versikel — die Zeile, die der Vorbeter allein spricht oder singt. Die Gemeinde antwortet darauf mit der folgenden Antwort.',
	'prayers.gloss.response':
		'Die Antwort — die Zeile, die die Gemeinde gemeinsam spricht oder singt, als Antwort auf den Versikel davor.',
	'prayers.tableOfContents': 'Inhaltsverzeichnis',
	'prayers.seeAlso': 'Siehe auch',
	'prayers.prevPrayer': 'Vorheriges Gebet',
	'prayers.nextPrayer': 'Nächstes Gebet',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Heute',
	'prayers.rosary.todayHeading': 'Geheimnisse von heute',
	'prayers.rosary.openingPrayer': 'Eröffnungsgebet',
	'prayers.rosary.decadePrayers': 'Die Gebete eines Gesätzes',
	'ref.tooltip.loading': 'Wird geladen…',
	'ref.tooltip.openCcc': 'Im Katechismus öffnen',
	'ref.tooltip.openBible': 'In der Bibel öffnen',
	'ref.tooltip.openCompendium': 'Im Kompendium öffnen',
	'ref.preview.open': 'Öffnen',
	'ref.cf': 'vgl.',
	'anchor.actions': 'Aktionen zur Stelle',
	'anchor.copy': 'Text kopieren',
	'anchor.copyLink': 'Link kopieren',
	'anchor.view': 'Ansehen',
	'anchor.copied': 'Kopiert',
	'anchor.copyFailed': 'Kopieren fehlgeschlagen',
	'bookmark.add': 'Merken',
	'bookmark.remove': 'Lesezeichen entfernen',
	'bookmark.library': 'Lesezeichen',
	'bookmark.library.tagline': 'Alles, was Sie beim Lesen markiert haben.',
	'bookmark.empty': 'Noch nichts markiert.',
	'bookmark.emptyHint':
		'Klicken Sie auf die Nummer eines Verses oder Absatzes und wählen Sie Merken, oder nutzen Sie die Lesezeichen-Schaltfläche der Seite.',
	'bookmark.about': 'Über diese Lesezeichen',
	'bookmark.deviceOnly':
		'Lesezeichen bleiben nur in diesem Browser. Sie werden nirgendwohin gesendet, und das Löschen der Browserdaten entfernt sie.',
	'bookmark.unavailable': 'Nicht in der Ausgabe, die Sie lesen',
	'document.library.tagline':
		'Enzykliken, Konzilskonstitutionen, Dekrete und Erklärungen des Lehramts.',
	'document.filter.heading': 'Filter',
	'document.filter.author': 'Autor',
	'document.filter.kind': 'Art',
	'document.filter.subject': 'Thema',
	'document.filter.search': 'Dokumente suchen',
	'document.filter.clear': 'Zurücksetzen',
	'document.filter.results': 'Angezeigte Dokumente',
	'document.filter.noResults': 'Kein Dokument entspricht diesen Filtern.',
	'document.tableOfContents': 'Inhaltsverzeichnis',
	'document.startReading': 'Zu lesen beginnen',
	'document.readFullDocument': 'Das ganze Dokument lesen',
	'document.section': 'Abschnitt',
	'document.prevSection': 'Zurück',
	'document.nextSection': 'Weiter',
	'document.kind.conciliarConstitution': 'Konstitution',
	'document.kind.conciliarDecree': 'Dekret',
	'document.kind.conciliarDeclaration': 'Erklärung',
	'document.kind.encyclical': 'Enzyklika',
	'document.kind.apostolicExhortation': 'Apostolisches Schreiben',
	'document.kind.apostolicConstitution': 'Apostolische Konstitution',
	'document.kind.apostolicLetter': 'Apostolischer Brief',
	'document.kind.cdfDeclaration': 'Erklärung der Glaubenskongregation',
	'document.kind.cdfInstruction': 'Instruktion der Glaubenskongregation',
	'document.kind.cdfLetter': 'Schreiben der Glaubenskongregation',
	'document.kind.cdfDoctrinalNote': 'Lehrmäßige Note der Glaubenskongregation',
	'document.kind.cdfResponsum': 'Responsum der Glaubenskongregation',
	'document.kind.cdfConsiderations': 'Erwägungen der Glaubenskongregation',
	'document.kindPlural.conciliarConstitution': 'Konstitutionen',
	'document.kindPlural.conciliarDecree': 'Dekrete',
	'document.kindPlural.conciliarDeclaration': 'Erklärungen',
	'document.kindPlural.encyclical': 'Enzykliken',
	'document.kindPlural.apostolicExhortation': 'Apostolische Schreiben',
	'document.kindPlural.apostolicConstitution': 'Apostolische Konstitutionen',
	'document.kindPlural.apostolicLetter': 'Apostolische Briefe',
	'document.kindPlural.cdfDeclaration': 'Erklärungen der Glaubenskongregation',
	'citation.unavailable': 'Für diese Anmerkung ist kein Quellentext verfügbar.',
	'colophon.title': 'Kolophon',
	'colophon.lede':
		'Was diese Seite ist, woher ihre Texte kommen und wie wir zu ihrer Wiedergabe stehen.',
	'colophon.whatThisIs': 'Was das hier ist',
	'colophon.whatThisIsBody':
		'Glossa Catholica ist eine Leseseite für die Heilige Schrift, den Katechismus, das Kompendium und die Dokumente des Lehramts, auf Englisch, Portugiesisch und Latein. Sie besteht, um gelesen zu werden, und mehr wird Ihnen fürs Lesen nicht abverlangt:',
	'colophon.pointFree':
		'Kostenlos, und immer kostenlos. Keine Bezahlschranke, kein Abonnement, nichts zu kaufen.',
	'colophon.pointNoAds': 'Keine Werbung und keinerlei gesponserte Platzierung.',
	'colophon.pointNoAccounts':
		'Keine Konten. Nichts, wofür man sich registriert, nichts, wo man sich anmeldet.',
	'colophon.pointNoTracking':
		'Keine Tracking-Skripte, kein Code von Dritten, keine Cookies. Nur anonyme Nutzungszahlen, nichts, was Sie identifiziert.',
	'colophon.pointOffline':
		'So gebaut, dass sie nach einem Besuch offline weiterarbeitet, damit eine schlechte Verbindung kein Hindernis fürs Lesen ist.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica ist ein privates Unternehmen von Laiengläubigen. Es trägt keine kirchliche Approbation und spricht mit keiner eigenen Autorität.',
	'footer.notEndorsed': 'Nicht vom Heiligen Stuhl gebilligt',
	'colophon.textsTitle': 'Die Texte',
	'colophon.textsBody':
		'Jeder Text stammt aus einer benannten Quelle, und jedes Werk verzeichnet seine Ausgabe, seine Quellseite und das Datum des Abrufs. Die Schrift verwendet gemeinfreie Übersetzungen; Katechismus, Kompendium und die lehramtlichen Dokumente stammen aus den vom Heiligen Stuhl selbst veröffentlichten Texten.',
	'colophon.textsFidelity':
		'Der Text wird nie gekürzt, nie umschrieben, nie neu geschrieben und nie neben Werbung gestellt. Offensichtliche Mängel bessern wir sehr wohl aus — ein ausgefallenes Wort, eine verstümmelte Zitatangabe, ein Markup, das einen Absatz verschluckt hat — stets hin zu dem, was die Quelle selbst druckt, nie hin zu dem, was wir für richtig halten.',
	'colophon.countBible': 'Bibelausgaben',
	'colophon.countDocuments': 'lehramtliche Dokumente',
	'colophon.privacyTitle': 'Datenschutz',
	'colophon.privacyBody1':
		'Keine Konten, keine Cookies, keine Werbung, kein Code von Dritten. Nichts hier verfolgt Sie über diese Seite hinaus.',
	'colophon.privacyBody2':
		'Wir zählen jedoch, wie die Seite genutzt wird: eine Messung pro Besuch, wobei jedes Feld eher einen Bereich als einen Wert angibt — wie lange Sie geblieben sind, wie oft Sie schon hier waren, welche Werke Sie geöffnet haben. Ihr Land wird gesondert gezählt, ohne dass es mit dem Übrigen verknüpft wird. Sie beschreibt einen Besuch, keinen Besucher, und wird {days} Tage lang aufbewahrt.',
	'colophon.privacyBody3':
		'Nie gesendet: was Sie in das Suchfeld eingeben, welche Stelle Sie geöffnet hatten, oder irgendetwas, das Ihr Gerät wiedererkennen könnte. Ihre Einstellungen, Lesezeichen und heruntergeladenen Texte bleiben auf Ihrem Gerät.',
	'colophon.copyrightTitle': 'Urheberrecht',
	'colophon.copyrightBody1':
		'Der Katechismus, das Kompendium und die lehramtlichen Dokumente sind Eigentum ihrer Rechteinhaber — vor allem der Libreria Editrice Vaticana und des Dikasteriums für die Kommunikation.',
	'colophon.copyrightBody2':
		'Jedes Werk zeigt den Urheberrechtsvermerk seines Rechteinhabers in dessen Wortlaut und verweist auf die Seite, von der es stammt.',
	'colophon.copyrightBody3':
		'Wenn Sie Rechte an einem Text hier halten und lieber nicht möchten, dass er veröffentlicht wird, schreiben Sie uns.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'Für alles, auch für das Obige:',
	'colophon.contactPending':
		'Eine Kontaktadresse ist noch nicht festgelegt. Diese Seite sollte nicht öffentlich gemacht werden, bevor es eine gibt — die obige Zusage ist ohne einen Weg, uns zu erreichen, nicht viel wert.',
	'colophon.illustrationsTitle': 'Die Illustrationen',
	'colophon.illustrationsBody':
		'Die Bibel trägt Gustave Dorés Stiche, jeden bei dem Vers, den er darstellt — der letzte und größte seiner Bibelzyklen, nach seinen Zeichnungen in Holz geschnitten und mit dem Text gedruckt statt am Ende des Bandes gesammelt.',
	'colophon.illustrationsRights':
		'Sie sind gemeinfrei, wie die Daten unten zeigen, und die getreue fotografische Wiedergabe eines gemeinfreien Stichs begründet kein neues Urheberrecht.',
	'colophon.countPlates': 'Stiche',
	'colophon.countPlateChapters': 'illustrierte Kapitel',
	'plates.scansBy': 'Scans bereitgestellt von',
	'plates.enlarge': '{title} vergrößern',
	'plates.zoom': 'Zoom',
	'art.about': 'Über dieses Bild',
	'art.detail': 'Ausschnitt',
	'colophon.typeTitle': 'Die Schrift',
	'colophon.typeBody':
		'Gesetzt in EB Garamond, Georg Duffners und Octavio Pardos Wiederbelebung der Typen, die Claude Garamont in den 1590er Jahren schnitt — jene humanistische Tradition, in der die Kirche seit der Renaissance druckt. Ihr Kyrillisch stammt von denselben Händen, belebt aber nichts wieder: Ein kyrillischer Garamond wurde nie geschnitten, also steht das Russische in einer Form, die eigens dazu gezeichnet wurde, neben dem Übrigen zu bestehen.',
	'colophon.typeArabic':
		'Das Arabische liegt ganz außerhalb ihrer Reichweite und steht in Amiri — Khaled Hosnys Wiederbelebung des Nas-chī, das 1905 für die Bulaq-Presse in Kairo geschnitten wurde, gewählt nach derselben Überlegung wie die Textschrift: eine bestimmte historische Buchtype statt einer zeitgenössischen Zeichnung.',
	'colophon.typeInitials':
		'Die Initialen sind Pirata One, eine gebrochene Schrift, deren Versalien in der Größe, die eine Initiale verlangt, lesbar bleiben, und — für das Russische — Ponomar, die die kirchenslawische Type der Synodaldruckerei wiedergibt. Ponomar setzt die Initiale und nie den Text: Eine moderne Enzyklika, durchgehend in Synodaltype gesetzt, würde etwas Unwahres über sie sagen. Alle stehen unter der SIL Open Font License und werden von dieser Seite ausgeliefert und nicht von Dritten, sodass das Lesen einer Seite von niemandes Server sonst etwas verlangt.',
	'refs.citedIn': 'Zitiert in',
	'refs.externalVolume': 'Band {volume} auf {host} — gescanntes PDF',
	'bible.wholeChapter': 'Dieses Kapitel',
	'bible.verseNotInEdition':
		'Diese Versnummer steht nicht in dieser Ausgabe — siehe die Anmerkung in der Seitenquelle',
	'bible.verseAbbrev': 'V.',
	'bible.note': 'Anmerkung',
	'bible.noteMissing': 'Diese Anmerkung fehlt im Korpus',
	'bible.chapterArgument': 'Inhaltsangabe',
	'ccc.readFullChapter': 'Das ganze Kapitel lesen',
	'ccc.noParagraphNumber': 'Keine Absatznummer in diesem Korpus',
	'copyright.sourceTitle': 'Die ursprüngliche Quellseite öffnen',
	'copyright.sourceLabel': 'Quelle',
	'lang.label': 'Sprache',
	'lang.filter': 'Sprachen suchen',
	'lang.more': 'weitere Sprachen',
	'notFound.title': 'Unter dieser Adresse ist nichts',
	'notFound.lede': 'Die Seite, nach der Sie gefragt haben, ist nicht hier.',
	'notFound.body':
		'Der Link kann vertippt oder veraltet sein, oder er verweist auf einen Text, den diese Seite nicht führt.',
	'notFound.searchHint':
		'Wenn Sie die gesuchte Stelle kennen — ein Buch und ein Kapitel, einen Absatz des Katechismus — tippen Sie sie in das Suchfeld oben auf dieser Seite.',
	'notFound.credit': 'Nach British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Oder beginnen Sie bei einem davon:',
	'notFound.home': 'Startseite',
	'compare.enter': 'Ausgaben vergleichen',
	'compare.exit': 'Vergleich beenden',
	'compare.missing': 'In dieser Ausgabe nicht vorhanden',
	'compare.versificationNote':
		'Diese beiden Ausgaben teilen die Verse dieses Kapitels stellenweise verschieden ein (eine Textvariante, keine Übersetzungsentscheidung) — dieselbe Versnummer bezeichnet nicht immer denselben Satz in beiden Spalten.',
	'compare.loading': 'Die zweite Sprache wird geladen…',
	'ui.close': 'Schließen',
	'shortcuts.title': 'Tastenkürzel',
	'shortcuts.betweenDocuments': 'Zwischen Dokumenten',
	'shortcuts.withinDocument': 'Innerhalb des Dokuments',
	'shortcuts.show': 'Diese Liste anzeigen',
	'help.title': 'Hilfe',
	'help.reading.heading': 'Die Leiste über einem Text',
	'help.feature.offline':
		'Legen Sie die Seite auf Ihren Startbildschirm, und sie öffnet sich wie eine App. Sie können ganze Werke herunterladen und ohne Verbindung lesen.',
	'help.feature.contents':
		'Die Gliederung des Werkes, in dem Sie sind — Bücher, Teile, Kapitel — damit Sie sich darin bewegen können, ohne an den Anfang zurückzugehen.',
	'help.feature.compare':
		'Zwei Ausgaben derselben Stelle nebeneinander — das Lateinische neben Ihrer eigenen Sprache, oder eine Übersetzung neben einer anderen.',
	'help.feature.apparatus':
		'Die eigenen Anmerkungen einer Ausgabe und jeder zum Text geschriebene Kommentar werden daneben angeboten und nicht darunter. Zitate im Text sind Verweise, eine Stelle führt also dorthin, wohin sie zeigt.',
	'help.feature.focus':
		'Räumt alles außer dem Text weg. Der Weg hinaus bleibt, wo die Leiste war, damit nichts dahinter eingeschlossen ist.',
	'zen.enter': 'Fokusmodus',
	'zen.exit': 'Fokusmodus beenden',
	'nav.calendar': 'Kalender',
	'calendar.title': 'Liturgischer Kalender',
	'calendar.tagline':
		'Der Allgemeine Römische Kalender, für jeden Tag berechnet — seine Zeit, seinen Rang, seine Farbe.',
	'calendar.national.tagline': '{name}, mit den eigenen Feiern, für jeden Tag berechnet.',
	'calendar.calendar': 'Kalender',
	'calendar.which.general': 'Allgemeiner Römischer Kalender',
	'calendar.filter': 'Länder suchen',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Naher Osten',
	'calendar.region.asia': 'Asien',
	'calendar.region.oceania': 'Ozeanien',
	'calendar.today': 'Heute',
	'calendar.previousMonth': 'Voriger Monat',
	'calendar.nextMonth': 'Nächster Monat',
	'calendar.plainDays': 'Einfache Wochentage',
	'calendar.noSuchDay': 'Für dieses Datum wird kein liturgischer Tag berechnet.',
	'calendar.week': 'Woche',
	'calendar.alsoToday': 'Heute ebenfalls gefeiert',
	'calendar.alsoObserved': 'Heute ebenfalls begangen',
	'calendar.obligation': 'Gebotener Feiertag',
	'calendar.obligationCanon': 'CIC Can. 1246',
	'calendar.sundayCycle': 'Lesejahr',
	'calendar.weekdayCycle': 'Jahresreihe',
	'calendar.psalterWeek': 'Psalterwoche',
	'lectionary.heading': 'Lesungen in der Messe',
	'lectionary.slot.reading': 'Lesung',
	'lectionary.slot.reading1': 'Erste Lesung',
	'lectionary.slot.reading2': 'Zweite Lesung',
	'lectionary.slot.reading3': 'Dritte Lesung',
	'lectionary.slot.reading4': 'Vierte Lesung',
	'lectionary.slot.reading5': 'Fünfte Lesung',
	'lectionary.slot.reading6': 'Sechste Lesung',
	'lectionary.slot.reading7': 'Siebte Lesung',
	'lectionary.slot.psalm': 'Antwortpsalm',
	'lectionary.slot.epistle': 'Epistel',
	'lectionary.slot.acclamation': 'Ruf vor dem Evangelium',
	'lectionary.slot.gospel': 'Evangelium',
	'lectionary.slot.sequence': 'Sequenz',
	'lectionary.or': 'oder',
	'lectionary.cf': 'Vgl.',
	'lectionary.about': 'Über diese Lesungen',
	'lectionary.caveat':
		'Die vom Ordo Lectionum Missae festgelegten Abschnitte, verknüpft mit den eigenen Ausgaben dieser Seite — nicht die in einer bestimmten Kirche verkündete Übersetzung, und eine Bischofskonferenz kann die Leseordnung anpassen.',
	'calendar.transferredFrom': 'Übertragen vom',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Weihnachtszeit',
	'calendar.season.lent': 'Fastenzeit',
	'calendar.season.triduum': 'Österliches Triduum',
	'calendar.season.easter': 'Osterzeit',
	'calendar.season.ordinary': 'Zeit im Jahreskreis',
	'calendar.colour.white': 'Weiß',
	'calendar.colour.red': 'Rot',
	'calendar.colour.green': 'Grün',
	'calendar.colour.violet': 'Violett',
	'calendar.colour.rose': 'Rosa',
	'calendar.colour.black': 'Schwarz',
	'calendar.colour.blue': 'Blau',
	'calendar.rank.solemnity': 'Hochfest',
	'calendar.rank.feast': 'Fest',
	'calendar.rank.memorial': 'Gebotener Gedenktag',
	'calendar.rank.optional-memorial': 'Nicht gebotener Gedenktag',
	'calendar.rank.commemoration': 'Kommemoration',
	'calendar.rank.sunday': 'Sonntag',
	'calendar.rank.weekday': 'Wochentag',
	'calendar.gloss.season.advent':
		'Die vier Wochen vor Weihnachten: Vorbereitung auf das Kommen des Herrn und Beginn des Kirchenjahres.',
	'calendar.gloss.season.christmas':
		'Vom Weihnachtstag bis zur Taufe des Herrn — die Geburt des Herrn und seine Erscheinung vor der Welt.',
	'calendar.gloss.season.lent':
		'Die vierzig Tage vom Aschermittwoch bis zur Abendmesse vom Letzten Abendmahl: Buße, Almosen und Vorbereitung auf Ostern.',
	'calendar.gloss.season.triduum':
		'Die drei Tage vom Abend des Gründonnerstags bis zum Abend des Ostersonntags — Leiden, Tod und Auferstehung des Herrn, und der Höhepunkt des ganzen Jahres.',
	'calendar.gloss.season.easter':
		'Die fünfzig Tage von Ostern bis Pfingsten, als ein einziges Fest begangen — „ein einziger großer Sonntag“.',
	'calendar.gloss.season.ordinary':
		'Die dreiunddreißig oder vierunddreißig Wochen außerhalb der übrigen Zeiten. Nicht „gewöhnlich“, sondern geordnet: die Wochen sind gezählt, und die Kirche liest das Leben und die Lehre des Herrn fortlaufend. Sie kommt in zwei Abschnitten — nach der Weihnachtszeit bis zur Fastenzeit, und nach Pfingsten bis zum Advent.',
	'calendar.gloss.rank.solemnity':
		'Der höchste Rang: Ostern, Weihnachten, Christi Himmelfahrt, der eigene Patron eines Ortes. Mit Gloria und Credo begangen, und am Vorabend beginnend.',
	'calendar.gloss.rank.feast':
		'Innerhalb des Tages selbst begangen. Die Apostel und Evangelisten und die größeren Tage des Herrn und Unserer Lieben Frau.',
	'calendar.gloss.rank.memorial':
		'Ein Heiliger, an seinem Tag im Messformular und im Stundengebet der Zeit begangen. Verpflichtend, wo er gehalten wird.',
	'calendar.gloss.rank.optional-memorial':
		'Kann gehalten werden oder nicht, wie der Priester oder die Gemeinde es wählt. Bleibt er ungehalten, ist der Tag einfach der Wochentag.',
	'calendar.gloss.rank.commemoration':
		'Was ein Gedenktag in der Fastenzeit wird: ein Gebet, das der Messe des Wochentags hinzugefügt wird, die die Zeit im Übrigen unangetastet lässt.',
	'calendar.gloss.rank.sunday':
		'Der ursprüngliche Festtag — der Tag des Herrn, seit der Auferstehung jede Woche begangen. Nur ein Hochfest oder ein Herrenfest darf ihn verdrängen, und in Advent, Fastenzeit und Osterzeit nicht einmal diese.',
	'calendar.gloss.rank.weekday':
		'Ein Tag ohne eigene Feier. Messe und Stundengebet sind die der Zeit — was die Zeit zu dem macht, was zu wissen sich lohnt.',
	'calendar.gloss.colour.white':
		'Freude. Oster- und Weihnachtszeit, die Tage des Herrn außerhalb seines Leidens, Unsere Liebe Frau, die Engel und die Heiligen, die nicht Märtyrer waren.',
	'calendar.gloss.colour.red':
		'Blut und Feuer. Palmsonntag und Karfreitag, Pfingsten, die Apostel und Evangelisten und die Märtyrer.',
	'calendar.gloss.colour.green':
		'Die Zeit im Jahreskreis: die Farbe der Hoffnung und des Wachsenden.',
	'calendar.gloss.colour.violet': 'Advent und Fastenzeit, und auch in Messen für die Verstorbenen.',
	'calendar.gloss.colour.rose':
		'Zweimal im Jahr getragen — am Sonntag Gaudete, dem dritten des Advents, und am Sonntag Laetare, dem vierten der Fastenzeit — wo das Fasten sich lichtet und das Ende in Sicht ist.',
	'calendar.gloss.colour.black': 'Darf in Messen für die Verstorbenen getragen werden.',
	'calendar.gloss.colour.blue':
		'Das Blau-Privileg: getragen zur Unbefleckten Empfängnis in Spanien, auf den Philippinen und an den wenigen anderen Orten, denen der Heilige Stuhl es gewährt hat.',
	'calendar.gloss.sundayCycle':
		'Die Sonntagslesungen laufen über drei Jahre — A, B und C — und lesen der Reihe nach Matthäus, Markus und Lukas, mit Johannes durch Fastenzeit und Osterzeit. Der Zyklus wechselt am ersten Adventssonntag, mit dem Kirchenjahr.',
	'calendar.gloss.weekdayCycle':
		'Die Wochentagslesungen laufen über zwei Jahre, I und II: die erste Lesung wechselt, das Evangelium nicht. Ein Kirchenjahr trägt den Namen des Kalenderjahres, in dem es endet — ungerade Jahre sind I, gerade Jahre II.',
	'calendar.gloss.psalterWeek':
		'Das Stundengebet verteilt die Psalmen auf vier Wochen, I bis IV, die sich durch das Jahr wiederholen. Dies ist die Woche, deren Psalmen heute an der Reihe sind, für alle, die die Horen beten.',
	'calendar.gloss.obligation':
		'Ein Tag, an dem die Gläubigen verpflichtet sind, an der Messe teilzunehmen und Arbeiten zu unterlassen, die sie daran hindern würden. Jeder Sonntag, und die weiteren Tage, die jede Bischofskonferenz bestimmt hat.',
	'calendar.primer.title': 'Zum ersten Mal hier?',
	'calendar.primer.lead':
		'Die Kirche hält ein eigenes Jahr. Es beginnt mit dem Advent, dreht sich um Ostern und gibt jedem Tag einen Namen, einen Rang und eine Farbe — und die entscheiden, was an diesem Tag in der Messe und im Stundengebet gebetet und gelesen wird. „Dreiundzwanzigster Sonntag im Jahreskreis“ ist also eine Adresse: sie sagt einem Priester, einem Chor oder jedem, der zu Hause betet, welche Gebete und Lesungen zu heute gehören.',
	'calendar.primer.seasons': 'Die Zeiten',
	'calendar.primer.ranks': 'Was ein Tag sein kann',
	'calendar.primer.colours': 'Die Farben',
	'calendar.primer.cycles': 'Die Zyklen',
	'calendar.primer.cyclesLead':
		'Drei Zähler, die zusammen sagen, welche Lesungen und Psalmen für heute vorgesehen sind.'
};
