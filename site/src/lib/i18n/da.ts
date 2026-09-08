/**
 * Dansk UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 3 editions in Dansk and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
 *
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `site/docs/colophon.md`. IT HAS NOT BEEN READ BY A NATIVE SPEAKER.
 * `colophon.whatThisIsStanding` and `footer.notEndorsed` (the canonical
 * standing statement, Can. 216 CIC, at full length and in the one line the
 * footer of every page carries) and `colophon.copyrightBody3` (how a rights
 * holder reaches us) are the ones to check first: all three are operative
 * rather than descriptive. Deleting a
 * doubtful line is a valid fix -- it falls back to English.
 * Every key `CHROME_KEYS` requires is here, since an unnamed chrome page fails
 * the sync rather than falling back.
 *
 * THE READER-FACING CONTROLS ARRIVED 2026-09-06 -- the jump box, settings,
 * dark mode, text size, the edition and language pickers, chapter navigation
 * and bookmarks. This file was the shelf titles and the colophon until then,
 * so its reader met their own language around an English interface. Same
 * caveat as everything above: not read by a native speaker.
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

export const da: Dictionary = {
	'nav.bible': 'Bibelen',
	'nav.ccc': 'Katekismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Læreembedet',
	'nav.socialDoctrine': 'Sociallære',
	'socialDoctrine.landing.title': 'Kompendium over Kirkens sociallære',
	'socialDoctrine.landing.tagline': 'Hvad Kirken lærer om livet i samfundet, i 583 numre.',
	'nav.canonLaw': 'Kanonisk ret',
	'canonLaw.landing.title': 'Den kanoniske Lovbog',
	'canonLaw.landing.tagline': 'Den latinske Kirkes ret i 1752 canones fordelt på syv bøger.',
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Can.',
	'canonLaw.prevCanon': 'Forrige canon',
	'canonLaw.nextCanon': 'Næste canon',
	'canonLaw.readFullTitle': 'Læs hele titlen',
	'canonLaw.superseded': 'Ordlyd erstattet af',
	'nav.prayers': 'Bønner',
	'nav.bookmarks': 'Bogmærker',
	'nav.menu': 'Menu',
	'nav.sections': 'Afsnit',
	'nav.works': 'Værker',
	'nav.pages': 'Sider',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Fortsæt læsning',
	'home.tagline':
		'Et læsested for Skriften, Katekismen og Læreembedets dokumenter — gratis, virker offline, og der er intet at tilmelde sig.',
	'home.doors.heading': 'Hvor du kan gå hen',
	'home.find.heading': 'Eller skriv en henvisning',
	'nav.library': 'Bibliotek',
	'nav.learn': 'Lær',
	'library.landing.tagline':
		'Hele samlingen, hylde for hylde — med hvor du slap, og hvad du har markeret.',
	'schola.landing.title': 'Hvor man begynder',
	'schola.landing.tagline':
		'En kort vejledning i, hvad der er her: hvad hver af disse bøger er, hvordan en henvisning til den skrives, hvordan man finder et sted, og læseordener, som Kirken har foreslået.',
	'schola.start.heading': 'Ny i den katolske tro?',
	'schola.start.body': 'Begynd med ',
	'schola.start.bodyAfter':
		': den samme lære som Katekismens, meget kortere, skrevet i spørgsmål og svar. Den fylder omkring en tiendedel og forudsætter intet.',
	'schola.bible.heading': 'Aldrig læst Bibelen?',
	'schola.bible.library':
		'Den er ikke én bog, men treoghalvfjerds, skrevet gennem mere end tusind år og samlet i den orden, Kirken fastholdt — ikke den orden, tingene skete i, og ikke den, der er lettest at læse. De fleste begynder på første side og holder op nogle uger senere, midt i et langt kapitel gammel lov, fordi ingen endnu har fortalt dem, hvad den er til for.',
	'schola.bible.step.gospel': 'Begynd med et evangelium',
	'schola.bible.start':
		'En af fire korte bøger om Jesu liv, langt inde og ikke forrest. Det er ikke vores idé: et kirkemøde bad om, at man lærte den rette brug af Skriften, „især Det Nye Testamente og først og fremmest evangelierne“. Det nævnte intet enkelt, og det gør vi heller ikke.',
	'schola.bible.whichGospel':
		'Tre foreslås almindeligvis, af tre forskellige grunde. Hvilket som helst af dem er et godt sted at være.',
	'schola.bible.gospel.mark':
		'Det korteste. Du kan læse det helt på en eftermiddag, og at have læst ét færdigt er i begyndelsen mere værd end at have valgt det bedste.',
	'schola.bible.gospel.luke':
		'Skrevet til en uden for troen, som ville have historien nedskrevet i orden — hvilket måske er netop dig. Det fortsætter direkte over i Apostlenes Gerninger, så det er i virkeligheden første halvdel af en længere bog.',
	'schola.bible.gospel.john':
		'Det, der lige ud siger, hvorfor det blev skrevet: „for at I skal tro“. Enkle ord, og det går lige til spørgsmålet om, hvem Jesus er.',
	'schola.bible.step.acts': 'Så hvad der skete bagefter',
	'schola.bible.thenActs':
		'Når du har læst ét færdigt, så læs, hvad de, der kendte ham, gjorde, efter at han var borte.',
	'schola.bible.acts.why':
		'De tredive år efter evangeliernes slutning: nogle få dusin forskræmte mennesker, og hvordan det, de havde set, nåede til den anden ende af riget.',
	'schola.bible.step.old': 'Så den ældre halvdel',
	'schola.bible.thenOld':
		'Ikke fra første side, og ikke det hele. Nogle få steder bærer fortællingen, og det er dem, evangelierne bliver ved med at pege tilbage på.',
	'schola.bible.ot.beginnings': 'Hvordan det begynder, og hvordan det går galt.',
	'schola.bible.ot.promise': 'Én familie, og et løfte til den, som overlever alle i den.',
	'schola.bible.ot.exodus': 'Et folk ført ud af slaveri, og en lov at leve efter.',
	'schola.bible.ot.psalms':
		'Ikke en fortælling: hundrede og halvtreds bønner og sange. Læs én ad gangen, i hvilken som helst orden. Kirken beder dem stadig hver dag.',
	'schola.bible.bothWays':
		'Du vil genkende ting, og det er meningen snarere end et tilfælde. Kirken læser de ældre bøger i Kristi lys og de nyere i lyset af det, der gik forud — hver halvdel forklarer den anden, og derfor læses ingen af dem alene.',
	'schola.books.heading': 'Hvad der er her, og hvordan det identificeres',
	'schola.books.lede':
		'Hver af disse er en anden slags bog, og hver henvises der til med sit eget tal. Eksemplerne viser formen: skriv et lignende i søgefeltet, og du lander på stedet.',
	'schola.cite.label': 'Identificeres',
	'schola.what.scripture':
		'Skriften, som Kirken modtager den, i begge testamenter. Alt andet her læses i dens lys.',
	'schola.cite.scripture': 'bog, kapitel og vers, i de forkortelser din egen udgave trykker',
	'schola.what.catechism':
		'Et sammendrag af, hvad Den Katolske Kirke tror, i ét bind. Den er ikke selv en kilde: den samler Skriften, fædrene, liturgien og Kirkens lære, og hvert nummer siger, hvor det, den siger, kommer fra.',
	'schola.cite.catechism': 'efter nummer, løbende ubrudt fra første side til sidste',
	'schola.what.compendium':
		'Den samme lære fremstillet i spørgsmål og svar, i omtrent en tiendedel af længden.',
	'schola.cite.compendium': 'efter spørgsmålsnummer',
	'schola.what.magisterium':
		'Hvad paver og kirkemøder faktisk har skrevet — encyklikaer, konstitutioner, dekreter, erklæringer — hvert rettet til et bestemt øjeblik og et bestemt spørgsmål. Hvert kendes på sine indledende ord på latin.',
	'schola.cite.magisterium': 'efter dokumentets navn, dernæst et afsnitsnummer inde i det',
	'schola.what.social':
		'Kirkens lære om arbejde, ejendom, familien, politik og fred, samlet ud af de dokumenter i én bog.',
	'schola.cite.social': 'efter nummer, under den forkortelse værket bruger om sig selv',
	'schola.what.law': 'Ret og ikke lære. Den siger, hvad Kirken kræver, og den ændres.',
	'schola.cite.law': 'efter canon, som dens nummererede enheder kaldes',
	'schola.what.doctors':
		'De teologer, Kirken har udnævnt til kirkelærere. Det bærer ingen officiel myndighed, hvor stor forfatteren end er.',
	'schola.cite.doctors': 'efter del, dernæst spørgsmål — Summaens egne inddelinger',
	'schola.what.prayers': 'De ord, Kirken beder, med latinen ved siden af.',
	'schola.cite.prayers': 'efter navn; der er ingen numre at citere',
	'schola.places.heading': 'Ikke tekster, men steder på dette websted',
	'schola.what.library':
		'Alle webstedets værker i én liste, grupperet efter emne og ikke efter art.',
	'schola.what.calendar':
		'Den liturgiske dag — tid, farve og hvem der fejres — for det land, hvis kalender du følger.',
	'schola.what.bookmarks':
		'Steder, du har markeret, og hvor du sidst slap i hvert værk. Begge dele bliver i denne browser og sendes ingen steder hen.',
	'ccc.noCounterpart': 'Intet modstykke i det andet værk',
	'jumpbox.placeholder': 'Gå til… (f.eks. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Søg',
	'jumpbox.hint': 'Tryk / eller Ctrl+K for at gå til en henvisning',
	'jumpbox.noMatch': 'Intet fundet',
	'jumpbox.suggestions': 'Forslag',
	'settings.label': 'Indstillinger',
	'apparatus.label': 'Apparat',
	'apparatus.editionNotes': 'Denne udgaves noter',
	'apparatus.commentary': 'Kommentar',
	'apparatus.inCommentary': 'Medtaget i kommentaren ovenfor.',
	'darkMode.label': 'Mørk tilstand',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Til',
	'darkMode.off': 'Fra',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Kun i lys tilstand',
	'sepia.noHue': 'Ikke i monokrom',
	'oled.label': 'OLED-sort',
	'oled.darkOnly': 'Kun i mørk tilstand',
	'mono.label': 'Monokrom',
	'mono.hint':
		'Sætter hele siden i én grå farve, så intet skelnes ved farve. Sepia slås fra, mens den er slået til.',
	'advanced.label': 'Avanceret',
	'library.title': 'Offline-bibliotek',
	'library.lede': 'Tekster gemt på denne enhed åbner helt uden netforbindelse.',
	'library.essentials': 'Bønner og Kompendium',
	'library.illustrations': 'Bibelen (illustrationer)',
	'library.illustrationsDetail': 'Bibelen (illustrationer, høj opløsning)',
	'library.other': 'Andre tekster',
	'library.everything': 'Alt',
	'library.downloadAll': 'Hent alt',
	'library.download': 'Hent',
	'library.downloaded': 'På denne enhed',
	'library.offlineNote': 'Slå offlinetilstand fra for at hente noget.',
	'library.remove': 'Fjern fra denne enhed',
	'library.removeConfirm': 'Fjern?',
	'library.forget': 'Fjern hentet indhold',
	'library.forgetConfirm': 'Fjern alt?',
	'offline.label': 'Offlinetilstand',
	'offline.hint':
		'Bruger slet ingen netforbindelse: intet hentes, der tjekkes ikke for opdateringer, og intet måles. Kun tekster, der allerede er på denne enhed, kan åbnes.',
	'offline.notDownloaded': 'Ikke på denne enhed',
	'loadFailed.title': 'Det blev ikke indlæst',
	'loadFailed.hint':
		'Siden findes — noget gik galt, da den skulle hentes. Et nyt forsøg plejer at virke.',
	'loadFailed.retry': 'Prøv igen',
	'loadFailed.retrying': 'Prøver…',
	'offline.turnOff': 'Slå offlinetilstand fra',
	'type.label': 'Tekststørrelse og skrift',
	'fontSize.label': 'Tekststørrelse',
	'fontSize.small': 'Lille',
	'fontSize.medium': 'Mellem',
	'fontSize.large': 'Stor',
	'fontSize.xlarge': 'Ekstra stor',
	'fontSize.xxlarge': 'Størst',
	'face.label': 'Skrift',
	'face.serif': 'Serif',
	'face.sans': 'Grotesk',
	'print.label': 'Udskriv denne side',
	'toTop.label': 'Tilbage til toppen',
	'install.label': 'Installer Glossa',
	'install.hint.label': 'Føj til hjemmeskærm',
	'install.hint.title': 'Føj Glossa til din hjemmeskærm',
	'install.hint.stepBefore': 'Den åbner som en app og kan læses offline. Tryk på',
	'install.hint.stepAfter': 'og derefter „Føj til hjemmeskærm“.',
	'install.hint.dismiss': 'Afvis',
	'update.label': 'En ny udgave er tilgængelig',
	'update.title': 'En ny udgave er klar',
	'update.body': 'Genindlæs for at hente de nyeste tekster og rettelser.',
	'update.action': 'Genindlæs',
	'update.dismiss': 'Ikke nu',
	'edition.label': 'Udgave',
	'edition.select': 'Vælg udgave',
	'edition.current': 'Nuværende udgave',
	'edition.filter': 'Søg udgaver',
	'menu.noMatches': 'Ingen træffere',
	'unitNav.previous': 'Forrige',
	'unitNav.next': 'Næste',
	'bible.prevChapter': 'Forrige kapitel',
	'bible.nextChapter': 'Næste kapitel',
	'bible.pickBook': 'Bøger og kapitler',
	'bible.landing.title': 'Bibelen',
	'bible.landing.tagline': 'Læs hele Bibelen, bog for bog, kapitel for kapitel.',
	'bible.landing.random': 'Jeg føler mig heldig',
	'bible.landing.books': 'Bøger',
	'bible.chapterUnavailable': 'Ikke tilgængelig i denne udgave',
	'bible.introduction': 'Indledning',
	'bible.introUnavailable': 'Ingen indledning på dette sprog endnu',
	'bible.introSource': 'Indledninger er ikke en del af den bibelske tekst.',
	'bible.testament.ot': 'Det Gamle Testamente',
	'bible.testament.nt': 'Det Nye Testamente',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuken',
	'bible.group.historical': 'Historiske bøger',
	'bible.group.wisdom': 'Visdomsbøger',
	'bible.group.prophetic': 'Profetiske bøger',
	'bible.group.gospels': 'Evangelierne',
	'bible.group.acts': 'Apostlenes Gerninger',
	'bible.group.pauline': 'Paulusbrevene',
	'bible.group.catholicLetters': 'De katolske breve',
	'bible.group.revelation': 'Åbenbaringen',
	'ccc.prevParagraph': 'Forrige afsnit',
	'ccc.nextParagraph': 'Næste afsnit',
	'ccc.inBrief': 'Kort sagt',
	'ccc.landing.title': 'Den Katolske Kirkes Katekismus',
	'ccc.landing.pairTitle': 'Katekismen og Kompendiet',
	'ccc.landing.tagline':
		'<strong>Katekismen</strong> fremlægger den katolske lære i 2.865 nummererede afsnit. <strong>Kompendiet</strong> gengiver den samme lære som 598 spørgsmål og svar efter samme disposition.',
	'ccc.landing.pairTagline':
		'Den Katolske Kirkes Katekismus i 2.865 numre, og dens Kompendium i 598 spørgsmål.',
	'ccc.tableOfContents': 'Indhold',
	'ccc.related': 'Se også',
	'compendium.landing.title': 'Katekismens Kompendium',
	'compendium.landing.tagline':
		'Spørgsmål og svar, der sammenfatter Den Katolske Kirkes Katekismus.',
	'compendium.question': 'Spørgsmål',
	'compendium.answer': 'Svar',
	'compendium.tableOfContents': 'Indhold',
	'compendium.prevQuestion': 'Forrige spørgsmål',
	'compendium.nextQuestion': 'Næste spørgsmål',
	'compendium.condenses': 'Sammenfatter KKK ¶¶',
	'ccc.abbrev': 'KKK',
	'ccc.condensedIn': 'I Kompendiet',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Intet spørgsmålsnummer i dette korpus',
	'document.library.tagline':
		'Encyklikaer, konciliære konstitutioner, dekreter og erklæringer fra Læreembedet.',
	'document.filter.heading': 'Filter',
	'document.filter.author': 'Forfatter',
	'document.filter.kind': 'Type',
	'document.filter.subject': 'Emne',
	'document.filter.search': 'Søg i dokumenter',
	'document.filter.clear': 'Ryd',
	'document.filter.results': 'Viste dokumenter',
	'document.filter.noResults': 'Intet dokument matcher disse filtre.',
	'document.tableOfContents': 'Indhold',
	'document.startReading': 'Begynd at læse',
	'document.readFullDocument': 'Læs hele dokumentet',
	'document.section': 'Afsnit',
	'document.prevSection': 'Forrige',
	'document.nextSection': 'Næste',
	'document.kind.conciliarConstitution': 'Konstitution',
	'document.kind.conciliarDecree': 'Dekret',
	'document.kind.conciliarDeclaration': 'Erklæring',
	'document.kind.encyclical': 'Encyklika',
	'document.kind.apostolicExhortation': 'Apostolisk formaning',
	'document.kind.apostolicConstitution': 'Apostolisk konstitution',
	'document.kind.cdfDeclaration': 'CDF-erklæring',
	'document.kind.cdfInstruction': 'CDF-instruktion',
	'document.kind.cdfLetter': 'CDF-brev',
	'document.kind.cdfDoctrinalNote': 'CDF-doktrinnote',
	'document.kind.cdfResponsum': 'CDF-responsum',
	'document.kind.cdfConsiderations': 'CDF-overvejelser',
	'document.kindPlural.conciliarConstitution': 'Konstitutioner',
	'document.kindPlural.conciliarDecree': 'Dekreter',
	'document.kindPlural.conciliarDeclaration': 'Erklæringer',
	'document.kindPlural.encyclical': 'Encyklikaer',
	'document.kindPlural.apostolicExhortation': 'Apostoliske formaninger',
	'document.kindPlural.apostolicConstitution': 'Apostoliske konstitutioner',
	'document.kindPlural.cdfDeclaration': 'CDF-erklæringer',
	'citation.unavailable': 'Ingen kildetekst tilgængelig for denne note.',
	'doctores.landing.title': 'Kirkelærere',
	'doctores.landing.tagline': 'Kirkefædrenes og kirkelærernes teologiske værker.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Thomas Aquinas, på engelsk og på det latin han skrev.',
	'summa.tableOfContents': 'Indhold',
	'summa.part': 'Del',
	'summa.question': 'Spørgsmål',
	'summa.article': 'Artikel',
	'summa.questionShort': 'Sp.',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titel fra udgaven på {lang}',
	'summa.titlesFromEdition': 'Titler fra udgaven på {lang} — denne udgave trykker ingen',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Indvending',
	'summa.sedContra': 'Derimod',
	'summa.corpus': 'Jeg svarer, at',
	'summa.reply': 'Svar på indvending',
	'summa.preamble': 'Note',
	'summa.prevQuestion': 'Forrige spørgsmål',
	'summa.nextQuestion': 'Næste spørgsmål',
	'summa.noEditionInYourLanguage': 'Summaen findes ikke i en udgave på dit sprog. Vist på {lang}.',
	'summa.noLatinSupplement':
		"Supplementet findes kun på engelsk — det blev sammenstillet efter Aquinas' død.",
	'index.division': 'Afdeling',
	'index.showSubsections': 'Vis underafsnit',
	'index.hideSubsections': 'Skjul underafsnit',
	'prayers.landing.title': 'Almindelige bønner',
	'prayers.landing.tagline': 'Bønner med den latinske tekst ved siden af.',
	'prayers.tableOfContents': 'Indhold',
	'prayers.gloss.versicle':
		'Versiklen — den linje, som den, der leder bønnen, siger eller synger alene. Forsamlingen svarer med svaret, der følger.',
	'prayers.gloss.response':
		'Svaret — den linje, forsamlingen siger eller synger sammen som svar på versiklen foran.',
	'prayers.seeAlso': 'Se også',
	'prayers.prevPrayer': 'Forrige bøn',
	'prayers.nextPrayer': 'Næste bøn',
	'prayers.rosary.today': 'I dag',
	'prayers.rosary.todayHeading': 'Dagens mysterier',
	'prayers.rosary.openingPrayer': 'Indledende bøn',
	'prayers.rosary.decadePrayers': 'Bønnerne i et tiår',
	'ref.tooltip.loading': 'Indlæser…',
	'ref.tooltip.openCcc': 'Åbn i Katekismus',
	'ref.tooltip.openBible': 'Åbn i Bibelen',
	'ref.tooltip.openCompendium': 'Åbn i Kompendium',
	'ref.preview.open': 'Åbn',
	'ref.cf': 'jf.',
	'anchor.actions': 'Handlinger for henvisningen',
	'anchor.copy': 'Kopiér tekst',
	'anchor.copyLink': 'Kopiér link',
	'anchor.view': 'Vis',
	'anchor.copied': 'Kopieret',
	'anchor.copyFailed': 'Kunne ikke kopiere',
	'bookmark.add': 'Bogmærk',
	'bookmark.remove': 'Fjern bogmærke',
	'bookmark.library': 'Bogmærker',
	'bookmark.library.tagline': 'Alt, hvad du har markeret under læsningen.',
	'bookmark.empty': 'Intet markeret endnu.',
	'bookmark.emptyHint':
		'Klik på nummeret på et vers eller et afsnit og vælg Bogmærk, eller brug sidens bogmærkeknap.',
	'bookmark.about': 'Om disse bogmærker',
	'bookmark.deviceOnly':
		'Bogmærker gemmes kun i denne browser. De sendes ingen steder hen, og hvis du rydder browserens data, forsvinder de.',
	'bookmark.unavailable': 'Findes ikke i den udgave, du læser',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Hvad dette websted er, hvor teksterne kommer fra, og hvor vi står med hensyn til at gengive dem.',
	'colophon.whatThisIs': 'Hvad dette er',
	'colophon.whatThisIsBody':
		'Glossa Catholica er et læsested for Skriften, Katekismen, Kompendiet og Læreembedets dokumenter, på engelsk, portugisisk og latin. Det findes for at blive læst, og der bedes ikke om andet af dig for at læse det:',
	'colophon.pointFree':
		'Gratis, og altid gratis. Ingen betalingsmur, intet abonnement, intet at købe.',
	'colophon.pointNoAds': 'Ingen reklamer og ingen sponsoreret placering af nogen art.',
	'colophon.pointNoAccounts': 'Ingen konti. Intet at tilmelde sig, intet at logge ind på.',
	'colophon.pointNoTracking':
		'Ingen sporingsscripts, ingen tredjepartskode, ingen cookies. Kun anonyme brugstællinger, uden noget der identificerer dig.',
	'colophon.pointOffline':
		'Bygget til at blive ved med at virke offline, når du først har besøgt det, så en dårlig forbindelse ikke behøver være en hindring for læsningen.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica er et privat foretagende af lægfolk. Det bærer ingen kirkelig godkendelse og taler med ingen myndighed af sig selv.',
	'footer.notEndorsed': 'Ikke godkendt af Den Hellige Stol',
	'colophon.textsTitle': 'Teksterne',
	'colophon.textsBody':
		'Hver tekst kommer fra en navngiven kilde, og hvert værk angiver sin udgave, sin kildeside og datoen, hvor den blev hentet. Skriften bruger oversættelser i det offentlige domæne; Katekismen, Kompendiet og Læreembedets dokumenter kommer fra Den Hellige Stols egne udgivne tekster.',
	'colophon.textsFidelity':
		'Teksten forkortes aldrig, parafraseres aldrig, omskrives aldrig og placeres aldrig ved siden af reklamer. Vi udbedrer dog åbenlyse fejl — et bortfaldet ord, en forvansket henvisning, opmærkning der slugte et afsnit — altid i retning af hvad kilden selv trykker, aldrig i retning af hvad vi mener den burde sige.',
	'colophon.countBible': 'bibeludgaver',
	'colophon.countDocuments': 'dokumenter fra Læreembedet',
	'colophon.privacyTitle': 'Privatliv',
	'colophon.privacyBody1':
		'Ingen konti, ingen cookies, ingen reklamer, ingen tredjepartskode. Intet her følger dig væk fra dette websted.',
	'colophon.privacyBody2':
		'Vi tæller faktisk, hvordan webstedet bruges: én måling pr. besøg, hvor hvert felt er et interval snarere end en værdi — hvor længe du blev, hvor tit du har været her, hvilke værker du åbnede. Dit land tælles separat, uden at noget forbinder det med resten. Det beskriver et besøg, ikke en besøgende, og gemmes i {days} dage.',
	'colophon.privacyBody3':
		'Aldrig sendt: hvad du skriver i søgefeltet, hvilket sted du havde åbent, eller noget som helst, der kunne genkende din enhed igen. Dine indstillinger, bogmærker og hentede tekster bliver på din enhed.',
	'colophon.copyrightTitle': 'Ophavsret',
	'colophon.copyrightBody1':
		'Katekismen, Kompendiet og Læreembedets dokumenter tilhører deres rettighedshavere — først og fremmest Libreria Editrice Vaticana og Dikasteriet for Kommunikation.',
	'colophon.copyrightBody2':
		'Hvert værk viser sin rettighedshavers egen ophavsretsmeddelelse, med deres ordlyd, og henviser til den side, det er taget fra.',
	'colophon.copyrightBody3':
		'Hvis du har rettigheder til nogen tekst her og hellere så, at den ikke blev offentliggjort, så skriv til os.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'For hvad som helst, herunder ovenstående:',
	'colophon.contactPending':
		'Der er endnu ikke oprettet en kontaktadresse. Dette websted bør ikke offentliggøres, før det har en — forpligtelsen ovenfor betyder intet uden en måde at nå os på.',
	'colophon.illustrationsTitle': 'Illustrationerne',
	'colophon.illustrationsBody':
		'Bibelen bærer Gustave Dorés stik, hvert placeret ved det vers, det skildrer — den sidste og største af hans bibelcyklusser, skåret i træ efter hans tegninger og trykt sammen med teksten frem for samlet bagest.',
	'colophon.illustrationsRights':
		'De er i det offentlige domæne, som datoerne nedenfor viser, og en tro fotografisk gengivelse af et stik i det offentlige domæne bærer ingen ny ophavsret af sig selv.',
	'colophon.countPlates': 'stik',
	'colophon.countPlateChapters': 'illustrerede kapitler',
	'plates.scansBy': 'Scanninger leveret af',
	'plates.enlarge': 'Forstør {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'Om dette billede',
	'art.detail': 'udsnit',
	'colophon.typeTitle': 'Skriften',
	'colophon.typeBody':
		'Sat med EB Garamond, Georg Duffner og Octavio Pardos genoplivning af de typer, Claude Garamont skar i 1590erne — den humanistiske tradition, Kirken har trykt i siden renæssancen. Dens kyrilliske er af de samme hænder, men genopliver intet: der blev aldrig skåret en kyrillisk Garamond, så russisk er sat i en form tegnet til at stå ved siden af resten.',
	'colophon.typeArabic':
		'Arabisk er helt uden for dens rækkevidde og er sat med Amiri — Khaled Hosnys genoplivning af den naskh, der blev skåret til Bulaq-trykkeriet i Kairo i 1905, valgt ud fra samme ræsonnement som tekstskriften: en bestemt historisk bogtype frem for en nutidig tegning.',
	'colophon.typeInitials':
		'Åbningsinitialerne er Pirata One, en gotisk skrift hvis versaler forbliver læselige i den størrelse, en initial kræver, og — for russisk — Ponomar, som gengiver Synodaltrykkeriets kirkeslaviske type. Ponomar sætter initialen og aldrig teksten: en moderne encyklika sat helt igennem med synodaltype ville sige noget usandt om, hvad den er. Alle er licenseret under SIL Open Font License og leveres fra dette websted frem for fra en tredjepart, så det at læse en side ikke beder om noget fra en andens server.',
	'refs.citedIn': 'Citeret i',
	'refs.externalVolume': 'Bind {volume} hos {host} — scannet PDF',
	'bible.wholeChapter': 'Dette kapitel',
	'bible.verseNotInEdition':
		'Dette versnummer findes ikke i denne udgave — se noten i kildeteksten',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Note',
	'bible.noteMissing': 'Denne note mangler i korpusset',
	'bible.chapterArgument': 'Argument',
	'ccc.readFullChapter': 'Læs hele kapitlet',
	'ccc.noParagraphNumber': 'Intet afsnitsnummer i dette korpus',
	'copyright.sourceTitle': 'Åbn den oprindelige kildeside',
	'copyright.sourceLabel': 'Kilde',
	'lang.label': 'Sprog',
	'lang.filter': 'Søg sprog',
	'lang.more': 'flere sprog',
	'notFound.title': 'Intet på denne adresse',
	'notFound.lede': 'Siden, du bad om, findes ikke her.',
	'notFound.body':
		'Linket kan være forkert skrevet eller forældet, eller det kan pege på en tekst, dette websted ikke rummer.',
	'notFound.searchHint':
		'Hvis du kender den henvisning, du ønsker — en bog og et kapitel, et afsnit i Katekismen — så skriv den i søgefeltet øverst på denne side.',
	'notFound.credit': 'Baseret på British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Eller start et af disse steder:',
	'notFound.home': 'Hjem',
	'compare.enter': 'Sammenlign udgaver',
	'compare.exit': 'Afslut sammenligning',
	'compare.missing': 'Findes ikke i denne udgave',
	'compare.versificationNote':
		'Disse to udgaver inddeler nogle steder dette kapitels vers forskelligt (en tekstvariant, ikke et oversættelsesvalg) — det samme versnummer markerer ikke altid den samme sætning i begge spalter.',
	'compare.loading': 'Indlæser det andet sprog…',
	'ui.close': 'Luk',
	'shortcuts.title': 'Tastaturgenveje',
	'shortcuts.betweenDocuments': 'Mellem dokumenter',
	'shortcuts.withinDocument': 'Inden i dokumentet',
	'shortcuts.show': 'Vis denne liste',
	'help.title': 'Hjælp',
	'help.top.heading': 'Linjen øverst på hver side',
	'help.reading.heading': 'Linjen over en tekst',
	'help.feature.search':
		'Skriv en henvisning i feltet øverst — kapitel og vers, et afsnitsnummer, navnet på et dokument — og den fuldføres, mens du skriver.',
	'help.feature.offline':
		'Læg siden på din hjemmeskærm, så åbner den som en app. Du kan hente hele værker og læse dem uden forbindelse.',
	'help.feature.contents':
		'Inddelingerne i det værk, du er i — bøger, dele, kapitler — så du kan bevæge dig inde i det uden at gå tilbage til begyndelsen.',
	'help.feature.compare':
		'To udgaver af det samme sted, side om side — latinen ved siden af dit eget sprog, eller én oversættelse ved siden af en anden.',
	'help.feature.apparatus':
		'En udgaves egne noter, og enhver kommentar skrevet til teksten, tilbydes ved siden af den og ikke under. Henvisninger inde i teksten er links, så en henvisning fører derhen, hvor den peger.',
	'help.feature.focus':
		'Rydder alt bort undtagen teksten. Vejen ud bliver, hvor linjen var, så intet er fanget bag den.',
	'zen.enter': 'Fokustilstand',
	'zen.exit': 'Forlad fokustilstand',
	'nav.calendar': 'Kalender',
	'calendar.title': 'Liturgisk kalender',
	'calendar.tagline':
		'Den almindelige romerske kalender, beregnet for enhver dag — dens tid, dens rang, dens farve.',
	'calendar.calendar': 'Kalender',
	'calendar.which.general': 'Den almindelige romerske kalender',
	'calendar.filter': 'Søg lande',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Mellemøsten',
	'calendar.region.asia': 'Asien',
	'calendar.region.oceania': 'Oceanien',
	'calendar.today': 'I dag',
	'calendar.previousMonth': 'Forrige måned',
	'calendar.nextMonth': 'Næste måned',
	'calendar.plainDays': 'Almindelige hverdage',
	'calendar.noSuchDay': 'Der beregnes ingen liturgisk dag for den dato.',
	'calendar.week': 'uge',
	'calendar.alsoToday': 'Fejres også i dag',
	'calendar.alsoObserved': 'Mindes også i dag',
	'calendar.obligation': 'Påbudt helligdag',
	'calendar.obligationCanon': 'CIC can. 1246',
	'calendar.sundayCycle': 'Søndagscyklus',
	'calendar.weekdayCycle': 'Hverdagscyklus',
	'calendar.psalterWeek': 'Salmeuge',
	'lectionary.heading': 'Læsninger ved messen',
	'lectionary.slot.reading': 'Læsning',
	'lectionary.slot.reading1': 'Første læsning',
	'lectionary.slot.reading2': 'Anden læsning',
	'lectionary.slot.reading3': 'Tredje læsning',
	'lectionary.slot.reading4': 'Fjerde læsning',
	'lectionary.slot.reading5': 'Femte læsning',
	'lectionary.slot.reading6': 'Sjette læsning',
	'lectionary.slot.reading7': 'Syvende læsning',
	'lectionary.slot.psalm': 'Responsoriesalme',
	'lectionary.slot.epistle': 'Epistel',
	'lectionary.slot.acclamation': 'Evangelietilråb',
	'lectionary.slot.gospel': 'Evangelium',
	'lectionary.slot.sequence': 'Sekvens',
	'lectionary.or': 'eller',
	'lectionary.cf': 'Jf.',
	'lectionary.about': 'Om disse læsninger',
	'lectionary.caveat':
		'Læsningerne fastsat af Ordo Lectionum Missae, knyttet til dette websteds egne udgaver — ikke den oversættelse, der forkyndes i nogen bestemt kirke, og en bispekonference kan tilpasse skemaet.',
	'calendar.transferredFrom': 'Flyttet fra',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Juletiden',
	'calendar.season.lent': 'Fasten',
	'calendar.season.triduum': 'Påskens triduum',
	'calendar.season.easter': 'Påsketiden',
	'calendar.season.ordinary': 'Det almindelige kirkeår',
	'calendar.colour.white': 'Hvid',
	'calendar.colour.red': 'Rød',
	'calendar.colour.green': 'Grøn',
	'calendar.colour.violet': 'Violet',
	'calendar.colour.rose': 'Rosa',
	'calendar.colour.black': 'Sort',
	'calendar.colour.blue': 'Blå',
	'calendar.rank.solemnity': 'Højtid',
	'calendar.rank.feast': 'Fest',
	'calendar.rank.memorial': 'Mindedag',
	'calendar.rank.optional-memorial': 'Valgfri mindedag',
	'calendar.rank.commemoration': 'Ihukommelse',
	'calendar.rank.sunday': 'Søndag',
	'calendar.rank.weekday': 'Hverdag',
	'calendar.gloss.season.advent':
		'De fire uger før jul: forberedelse til Herrens komme og begyndelsen på kirkeåret.',
	'calendar.gloss.season.christmas':
		'Fra juledag til Herrens dåb, hvor Herrens fødsel og hans åbenbaring for verden fejres.',
	'calendar.gloss.season.lent':
		'De fyrre dage fra askeonsdag til aftenmessen om Herrens nadver: bod, almisse og forberedelse til påsken.',
	'calendar.gloss.season.triduum':
		'De tre dage fra skærtorsdag aften til påskesøndag aften — Herrens lidelse, død og opstandelse, og højdepunktet i hele året.',
	'calendar.gloss.season.easter':
		'De halvtreds dage fra påske til pinse, fejret som én eneste fest — „én stor søndag“.',
	'calendar.gloss.season.ordinary':
		'De treogtredive eller fireogtredive uger uden for de øvrige tider. Ikke „almindelig“, men ordnet: ugerne tælles, og Kirken læser Herrens liv og lære fortløbende. Den kommer i to stræk — efter juletiden indtil fasten, og efter pinse indtil advent.',
	'calendar.gloss.rank.solemnity':
		'Den højeste grad: påske, jul, Kristi himmelfart, et steds egen værnehelgen. Fejres med Gloria og trosbekendelsen, og begynder aftenen før.',
	'calendar.gloss.rank.feast':
		'Fejres inden for dagen selv. Apostlene og evangelisterne, og Herrens og Vor Frues større dage.',
	'calendar.gloss.rank.memorial':
		'En helgen, der mindes på sin dag, inden for tidens egen messe og tidebøn. Obligatorisk, hvor den holdes.',
	'calendar.gloss.rank.optional-memorial':
		'Kan holdes eller ej, som præsten eller menigheden vælger. Holdes den ikke, er dagen simpelthen hverdagen.',
	'calendar.gloss.rank.commemoration':
		'Hvad en mindedag bliver i fasten: en bøn føjet til hverdagsmessen, som tiden i øvrigt bevarer hel.',
	'calendar.gloss.rank.sunday':
		'Den oprindelige festdag — Herrens dag, fejret hver uge siden opstandelsen. Kun en højtid eller en Herrens fest må fortrænge den, og i advent, faste og påsketid ikke engang de.',
	'calendar.gloss.rank.weekday':
		'En dag uden egen fejring. Messen og tidebønnen er tidens — og det er dét, der gør tiden værd at kende.',
	'calendar.gloss.colour.white':
		'Glæde. Påske- og juletid, Herrens dage uden for hans lidelse, Vor Frue, englene, og de helgener, der ikke var martyrer.',
	'calendar.gloss.colour.red':
		'Blod og ild. Palmesøndag og langfredag, pinsen, apostlene og evangelisterne, og martyrerne.',
	'calendar.gloss.colour.green': 'Tiden over året: håbets farve, og det voksendes.',
	'calendar.gloss.colour.violet': 'Advent og faste, og bæres også ved messer for de afdøde.',
	'calendar.gloss.colour.rose':
		'Bæres to gange om året — på søndagen Gaudete, den tredje i advent, og på søndagen Laetare, den fjerde i fasten — hvor fasten lysner og enden er i sigte.',
	'calendar.gloss.colour.black': 'Må bæres ved messer for de afdøde.',
	'calendar.gloss.colour.blue':
		'Det blå privilegium: bæres ved Marias uplettede undfangelse i Spanien, på Filippinerne og de få andre steder, som Den Hellige Stol har givet det til.',
	'calendar.gloss.sundayCycle':
		'Søndagslæsningerne løber over tre år — A, B og C — og læser Matthæus, Markus og Lukas på skift, med Johannes gennem fasten og påsketiden. Cyklussen skifter på første søndag i advent, med kirkeåret.',
	'calendar.gloss.weekdayCycle':
		'Hverdagslæsningerne løber over to år, I og II: den første læsning skifter, evangeliet ikke. Et liturgisk år hedder efter det kalenderår, det slutter i — ulige år er I, lige år II.',
	'calendar.gloss.psalterWeek':
		'Tidebønnen fordeler salmerne over fire uger, I til IV, som gentages gennem året. Dette er den uge, hvis salmer er dagens, for den, der beder tidebønnerne.',
	'calendar.gloss.obligation':
		'En dag, hvor de troende er forpligtet til at deltage i messen og afholde sig fra arbejde, der ville forhindre det. Hver søndag, og de øvrige dage, som den enkelte bispekonference har bestemt.',
	'calendar.primer.title': 'Ny her?',
	'calendar.primer.lead':
		'Kirken holder sit eget år. Det begynder med advent, drejer om påsken, og giver hver dag et navn, en grad og en farve — og de afgør, hvad der bedes og læses den dag ved messen og i tidebønnen. Så „treogtyvende søndag over året“ er en adresse: den siger en præst, et kor eller enhver, der beder hjemme, hvilke bønner og læsninger der hører til i dag.',
	'calendar.primer.seasons': 'Tiderne',
	'calendar.primer.ranks': 'Hvad en dag kan være',
	'calendar.primer.colours': 'Farverne',
	'calendar.primer.cycles': 'Cyklusserne',
	'calendar.primer.cyclesLead':
		'Tre tællere, som tilsammen siger, hvilke læsninger og salmer der er bestemt for i dag.'
};
