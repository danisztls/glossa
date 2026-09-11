/**
 * Swedish UI strings.
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

export const sv: Dictionary = {
	'nav.bible': 'Bibeln',
	'nav.ccc': 'Katekesen',
	'nav.compendium': 'Kompendiet',
	'nav.magisterium': 'Läroämbetet',
	'nav.socialDoctrine': 'Sociallära',
	'socialDoctrine.landing.title': 'Kompendium över kyrkans sociallära',
	'socialDoctrine.landing.tagline': 'Vad kyrkan lär om livet i samhället, i 583 nummer.',
	'nav.canonLaw': 'Kanonisk rätt',
	'canonLaw.landing.title': 'Kyrkans lagbok',
	'canonLaw.landing.tagline': 'Den latinska kyrkans rätt, i 1752 canones fördelade på sju böcker.',
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Cann.',
	'canonLaw.prevCanon': 'Föregående canon',
	'canonLaw.nextCanon': 'Nästa canon',
	'canonLaw.readFullTitle': 'Läs hela avdelningen',
	'canonLaw.superseded': 'Lydelse ersatt av',
	'nav.prayers': 'Böner',
	'nav.bookmarks': 'Bokmärken',
	'nav.menu': 'Meny',
	'nav.sections': 'Avsnitt',
	'nav.works': 'Verk',
	'nav.pages': 'Sidor',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Fortsätt läsa',
	'home.tagline':
		'En läsesajt för Skriften, katekesen och läroämbetets dokument — gratis, fungerar offline, och ingenting att registrera sig för.',
	'home.doors.heading': 'Vart du ska',
	'nav.library': 'Bibliotek',
	'nav.learn': 'Lär dig',
	'library.landing.tagline':
		'Hela samlingen, hylla för hylla — med var du slutade och vad du har markerat.',
	'schola.landing.title': 'Var man börjar',
	'schola.landing.tagline':
		'En kort vägledning till vad som finns här: vad var och en av dessa böcker är, tio Guds bud och de andra listor Kyrkan vill att en katolik ska kunna, och var man börjar läsa.',
	'schola.start.heading': 'Ny i katolsk tro?',
	'schola.start.body': 'Börja med ',
	'schola.start.bodyAfter':
		': samma lära som katekesens, mycket kortare, skriven i frågor och svar. Det är ungefär en tiondel så långt och förutsätter ingenting.',
	'schola.bible.heading': 'Aldrig läst Bibeln?',
	'schola.bible.library':
		'Den är inte en bok utan sjuttiotre, skrivna under mer än tusen år och samlade i den ordning kyrkan stannade för — inte den ordning händelserna skedde i, och inte den som är lättast att läsa. De flesta börjar på första sidan och slutar några veckor senare, mitt i ett långt kapitel gammal lag, eftersom ingen ännu har sagt dem vad den är till för.',
	'schola.bible.step.gospel': 'Börja med ett evangelium',
	'schola.bible.start':
		'En av fyra korta böcker om Jesu liv, långt in och inte främst. Det är inte vår idé: ett kyrkomöte bad att man skulle lära ut det rätta bruket av Skriften, ”särskilt Nya testamentet och framför allt evangelierna”. Det nämnde inget enskilt, och det gör inte vi heller.',
	'schola.bible.whichGospel':
		'Tre brukar föreslås, av tre olika skäl. Vilket som helst av dem är ett bra ställe att vara på.',
	'schola.bible.gospel.mark':
		'Det kortaste. Du kan läsa det helt på en eftermiddag, och att ha läst ut ett är i början värt mer än att ha valt det bästa.',
	'schola.bible.gospel.luke':
		'Skrivet för någon utanför tron som ville ha berättelsen nedtecknad i ordning — vilket kan vara just du. Det fortsätter rakt in i Apostlagärningarna, så det är i själva verket första hälften av en längre bok.',
	'schola.bible.gospel.john':
		'Det som rent ut säger varför det skrevs: ”för att ni skall tro”. Enkla ord, och det går rakt på frågan om vem Jesus är.',
	'schola.bible.step.acts': 'Sedan vad som hände därefter',
	'schola.bible.thenActs':
		'När du har läst ut ett, läs vad de som kände honom gjorde sedan han var borta.',
	'schola.bible.acts.why':
		'De trettio åren efter evangeliernas slut: några dussin skrämda människor, och hur det de hade sett nådde andra sidan av riket.',
	'schola.bible.step.old': 'Sedan den äldre hälften',
	'schola.bible.thenOld':
		'Inte från första sidan, och inte allt. Några få ställen bär berättelsen, och det är dem evangelierna hela tiden pekar tillbaka på.',
	'schola.bible.ot.beginnings': 'Hur det börjar, och hur det går fel.',
	'schola.bible.ot.promise': 'En familj, och ett löfte till den som överlever alla i den.',
	'schola.bible.ot.exodus': 'Ett folk som förs ut ur slaveri, och en lag att leva efter.',
	'schola.bible.ot.psalms':
		'Ingen berättelse: hundrafemtio böner och sånger. Läs en i taget, i vilken ordning som helst. Kyrkan ber dem alltjämt varje dag.',
	'schola.bible.bothWays':
		'Du kommer att känna igen saker, och det är meningen snarare än en tillfällighet. Kyrkan läser de äldre böckerna i Kristi ljus och de nyare i ljuset av det som kom före — varje hälft förklarar den andra, och därför läses ingen av dem ensam.',
	'schola.books.heading': 'Vad som finns här',
	'schola.what.scripture':
		'Skriften så som kyrkan tar emot den, i båda testamentena. Allt annat här läses i dess ljus.',
	'schola.what.catechism':
		'En sammanfattning av vad Katolska kyrkan tror, i en enda volym. Den är inte själv en källa: den samlar Skriften, fäderna, liturgin och kyrkans lära, och varje punkt säger varifrån det den påstår kommer.',
	'schola.what.compendium':
		'Samma lära framställd i frågor och svar, på ungefär en tiondel av längden.',
	'schola.what.magisterium':
		'Vad påvar och kyrkomöten faktiskt har skrivit — encyklikor, konstitutioner, dekret, deklarationer — vart och ett riktat till ett bestämt ögonblick och en bestämd fråga. Vart och ett är känt efter sina inledande ord på latin.',
	'schola.what.social':
		'Kyrkans lära om arbete, egendom, familjen, politiken och freden, hämtad ur de dokumenten och samlad i en bok.',
	'schola.what.law': 'Rätt och inte lära. Den säger vad kyrkan kräver, och den ändras.',
	'schola.what.doctors':
		'De teologer kyrkan har utnämnt till kyrkolärare. Det bär ingen officiell auktoritet, hur stor författaren än är.',
	'schola.what.prayers': 'Orden kyrkan ber, med latinet bredvid.',
	'schola.places.heading': 'Inte texter, utan platser på den här sidan',
	'schola.what.library':
		'Alla verk på sidan i en lista, grupperade efter ämne och inte efter slag.',
	'schola.what.questions':
		'En ingång för den som har en fråga men ingen hänvisning. Var och en samlar de ställen som besvarar den — katekesen först — och varje ord i dem är Kyrkans eget.',
	'schola.what.calendar':
		'Den liturgiska dagen — tid, färg och vem som firas — för det land vars kalender du följer.',
	'schola.what.bookmarks':
		'Ställen du har markerat, och var du senast slutade i varje verk. Bådadera stannar i den här webbläsaren och skickas ingenstans.',
	'schola.what.census':
		'Vad det här biblioteket innehåller och hur långt det räcker — hur många verk, på vilka språk, och hur mycket av vart och ett en läsare av ditt eget språk faktiskt kan nå.',
	'schola.formulas.decalogue': 'Tio Guds bud',
	'ccc.noCounterpart': 'Ingen motsvarighet i det andra verket',
	'jumpbox.placeholder': 'Gå till… (t.ex. joh 3:16, ccc 1234)',
	'jumpbox.short': 'Sök',
	'jumpbox.hint': 'Tryck / eller Ctrl+K för att gå till en hänvisning',
	'jumpbox.noMatch': 'Ingen träff',
	'jumpbox.suggestions': 'Förslag',
	'settings.label': 'Inställningar',
	'apparatus.label': 'Apparat',
	'apparatus.editionNotes': 'Den här utgåvans noter',
	'apparatus.commentary': 'Kommentar',
	'apparatus.inCommentary': 'Ingår i kommentaren ovan.',
	'darkMode.label': 'Mörkt läge',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'På',
	'darkMode.off': 'Av',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Endast ljust läge',
	'sepia.noHue': 'Ej i mono',
	'oled.label': 'OLED-svart',
	'oled.darkOnly': 'Endast mörkt läge',
	'mono.label': 'Monokrom',
	'mono.hint':
		'Sätter hela sidan i en enda grå ton, så att ingenting skiljs åt med färg. Sepia stängs av så länge det är på.',
	'advanced.label': 'Avancerat',
	'library.title': 'Offlinebibliotek',
	'library.lede': 'Texter som finns på den här enheten öppnas helt utan nätverk.',
	'library.essentials': 'Böner och Kompendiet',
	'library.illustrations': 'Bibeln (illustrationer)',
	'library.illustrationsDetail': 'Bibeln (illustrationer, hög upplösning)',
	'library.other': 'Övriga texter',
	'library.everything': 'Allt',
	'library.downloadAll': 'Hämta allt',
	'library.download': 'Hämta',
	'library.downloaded': 'På den här enheten',
	'library.offlineNote': 'Stäng av offlineläget för att hämta.',
	'library.remove': 'Ta bort från den här enheten',
	'library.removeConfirm': 'Ta bort?',
	'library.forget': 'Ta bort hämtningar',
	'library.forgetConfirm': 'Ta bort allt?',
	'offline.label': 'Offlineläge',
	'offline.hint':
		'Använder inget nätverk alls: inget hämtas, ingen uppdatering söks, inget mäts. Endast texter som redan finns på den här enheten öppnas.',
	'offline.notDownloaded': 'Finns inte på den här enheten',
	'loadFailed.title': 'Det gick inte att läsa in',
	'loadFailed.hint':
		'Sidan finns — något gick fel när den skulle hämtas. Att försöka igen brukar räcka.',
	'loadFailed.retry': 'Försök igen',
	'loadFailed.retrying': 'Försöker…',
	'offline.turnOff': 'Stäng av offlineläget',

	'type.label': 'Textstorlek och typsnitt',
	'fontSize.label': 'Textstorlek',
	'fontSize.small': 'Liten',
	'fontSize.medium': 'Mellan',
	'fontSize.large': 'Stor',
	'fontSize.xlarge': 'Extra stor',
	'fontSize.xxlarge': 'Störst',
	'face.label': 'Typsnitt',
	'face.serif': 'Serif',
	'face.sans': 'Grotesk',
	'print.label': 'Skriv ut sidan',
	'toTop.label': 'Tillbaka till toppen',
	'install.label': 'Installera Glossa',
	'install.hint.label': 'Lägg till på hemskärmen',
	'install.hint.title': 'Lägg till Glossa på hemskärmen',
	'install.hint.stepBefore': 'Den öppnas som en app och kan läsas offline. Tryck på',
	'install.hint.stepAfter': 'och sedan ”Lägg till på hemskärmen”.',
	'install.hint.dismiss': 'Stäng',
	'update.label': 'En ny utgåva är tillgänglig',
	'update.title': 'En ny utgåva är klar',
	'update.body': 'Ladda om för att hämta de senaste texterna och rättelserna.',
	'update.action': 'Ladda om',
	'update.dismiss': 'Inte nu',
	'edition.label': 'Utgåva',
	'edition.select': 'Välj utgåva',
	'edition.current': 'Nuvarande utgåva',
	'edition.filter': 'Sök utgåvor',
	'menu.noMatches': 'Inga träffar',
	'unitNav.previous': 'Föregående',
	'unitNav.next': 'Nästa',
	'bible.prevChapter': 'Föregående kapitel',
	'bible.nextChapter': 'Nästa kapitel',
	'bible.pickBook': 'Böcker och kapitel',
	'bible.landing.title': 'Bibeln',
	'bible.landing.tagline': 'Läs hela Bibeln, bok för bok, kapitel för kapitel.',
	'bible.landing.random': 'Jag har tur',
	'bible.chapterUnavailable': 'Inte tillgängligt i den här utgåvan',
	'bible.introduction': 'Inledning',
	'bible.introUnavailable': 'Ingen inledning på detta språk ännu',
	'bible.introSource': 'Inledningarna hör inte till bibeltexten.',
	'bible.testament.ot': 'Gamla testamentet',
	'bible.testament.nt': 'Nya testamentet',
	'bible.group.pentateuch': 'Moseböckerna',
	'bible.group.historical': 'Historieböckerna',
	'bible.group.wisdom': 'Vishetsböckerna',
	'bible.group.prophetic': 'Profetböckerna',
	'bible.group.gospels': 'Evangelierna',
	'bible.group.acts': 'Apostlagärningarna',
	'bible.group.pauline': 'Paulusbreven',
	'bible.group.catholicLetters': 'Katolska breven',
	'bible.group.revelation': 'Uppenbarelseboken',
	'ccc.prevParagraph': 'Föregående stycke',
	'ccc.nextParagraph': 'Nästa stycke',
	'ccc.inBrief': 'I korthet',
	'ccc.landing.title': 'Katolska kyrkans katekes',
	'ccc.landing.pairTitle': 'Katekesen och Kompendiet',
	'ccc.landing.tagline':
		'<strong>Katekesen</strong> framställer den katolska läran i 2 865 numrerade punkter. <strong>Kompendiet</strong> återger samma lära i 598 frågor och svar, efter samma disposition.',
	'ccc.landing.pairTagline':
		'Katolska kyrkans katekes i 2 865 punkter, och dess kompendium i 598 frågor.',
	'ccc.tableOfContents': 'Innehåll',
	'ccc.related': 'Se även',
	'compendium.landing.title': 'Katekesens kompendium',
	'compendium.landing.tagline': 'Frågor och svar som sammanfattar Katolska kyrkans katekes.',
	'compendium.question': 'Fråga',
	'compendium.answer': 'Svar',
	'compendium.tableOfContents': 'Innehåll',
	'compendium.prevQuestion': 'Föregående fråga',
	'compendium.nextQuestion': 'Nästa fråga',
	'compendium.condenses': 'Sammanfattar KKK ¶¶',
	'ccc.abbrev': 'KKK',
	'ccc.condensedIn': 'I Kompendiet',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Inget frågenummer i detta korpus',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Kyrkolärare',
	'doctores.landing.tagline': 'Kyrkofädernas och kyrkolärarnas teologiska verk.',
	'summa.landing.title': 'Summa theologiae',
	'summa.landing.tagline': 'Thomas av Aquino, på engelska och på det latin han skrev.',
	'summa.tableOfContents': 'Innehåll',
	'summa.part': 'Del',
	'summa.question': 'Fråga',
	'summa.article': 'Artikel',
	'summa.questionShort': 'Fr.',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titel från utgåvan på {lang}',
	'summa.titlesFromEdition': 'Titlar från utgåvan på {lang} — denna utgåva har inga',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Invändning',
	'summa.sedContra': 'Häremot står',
	'summa.corpus': 'Jag svarar att',
	'summa.reply': 'Svar på invändningen',
	'summa.preamble': 'Anmärkning',
	'summa.prevQuestion': 'Föregående fråga',
	'summa.nextQuestion': 'Nästa fråga',
	'summa.noEditionInYourLanguage':
		'Summan finns inte i någon utgåva på ditt språk. Här visas utgåvan på {lang}.',
	'summa.noLatinSupplement':
		'Supplementet finns endast på engelska — det sammanställdes efter Thomas död.',
	'index.division': 'Avdelning',
	'index.showSubsections': 'Visa underavsnitt',
	'index.hideSubsections': 'Dölj underavsnitt',
	'prayers.landing.title': 'Böner',
	'prayers.landing.tagline': 'Böner med den latinska texten bredvid.',
	'prayers.gloss.versicle':
		'Versikeln — raden som den som leder bönen läser eller sjunger ensam. Församlingen svarar med svaret som följer.',
	'prayers.gloss.response':
		'Svaret — raden som församlingen läser eller sjunger tillsammans, till svar på versikeln före den.',
	'prayers.tableOfContents': 'Innehåll',
	'prayers.seeAlso': 'Se även',
	'prayers.prevPrayer': 'Föregående bön',
	'prayers.nextPrayer': 'Nästa bön',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'I dag',
	'prayers.rosary.todayHeading': 'Dagens hemligheter',
	'prayers.rosary.openingPrayer': 'Inledande bön',
	'prayers.rosary.decadePrayers': 'Bönerna i en dekad',
	'ref.tooltip.loading': 'Läser in…',
	'ref.tooltip.openCcc': 'Öppna i katekesen',
	'ref.tooltip.openBible': 'Öppna i Bibeln',
	'ref.tooltip.openCompendium': 'Öppna i kompendiet',
	'ref.preview.open': 'Öppna',
	'ref.cf': 'jfr',
	'anchor.actions': 'Åtgärder för hänvisningen',
	'anchor.copy': 'Kopiera text',
	'anchor.copyLink': 'Kopiera länk',
	'anchor.view': 'Visa',
	'anchor.copied': 'Kopierat',
	'anchor.copyFailed': 'Kunde inte kopiera',
	'bookmark.add': 'Bokmärk',
	'bookmark.remove': 'Ta bort bokmärke',
	'bookmark.library': 'Bokmärken',
	'bookmark.library.tagline': 'Allt du har markerat under läsningen.',
	'bookmark.empty': 'Inget markerat ännu.',
	'bookmark.emptyHint':
		'Klicka på numret för en vers eller ett stycke och välj Bokmärk, eller använd sidans bokmärkesknapp.',
	'bookmark.about': 'Om dessa bokmärken',
	'bookmark.deviceOnly':
		'Bokmärken sparas endast i den här webbläsaren. De skickas ingenstans, och om du rensar webbläsarens data försvinner de.',
	'bookmark.unavailable': 'Finns inte i utgåvan du läser',
	'document.library.tagline':
		'Encyklikor, konciliekonstitutioner, dekret och deklarationer från läroämbetet.',
	'document.filter.heading': 'Filter',
	'document.filter.author': 'Författare',
	'document.filter.kind': 'Typ',
	'document.filter.subject': 'Ämne',
	'document.filter.search': 'Sök dokument',
	'document.filter.clear': 'Rensa',
	'document.filter.results': 'Visade dokument',
	'document.filter.noResults': 'Inget dokument matchar dessa filter.',
	'document.tableOfContents': 'Innehåll',
	'document.startReading': 'Börja läsa',
	'document.readFullDocument': 'Läs hela dokumentet',
	'document.section': 'Avsnitt',
	'document.prevSection': 'Föregående',
	'document.nextSection': 'Nästa',
	'document.kind.conciliarConstitution': 'Konstitution',
	'document.kind.conciliarDecree': 'Dekret',
	'document.kind.conciliarDeclaration': 'Deklaration',
	'document.kind.encyclical': 'Encyklika',
	'document.kind.apostolicExhortation': 'Apostolisk maning',
	'document.kind.apostolicConstitution': 'Apostolisk konstitution',
	'document.kind.apostolicLetter': 'Apostoliskt brev',
	'document.kind.cdfDeclaration': 'Deklaration från Troskongregationen',
	'document.kind.cdfInstruction': 'Instruktion från Troskongregationen',
	'document.kind.cdfLetter': 'Skrivelse från Troskongregationen',
	'document.kind.cdfDoctrinalNote': 'Läromässig not från Troskongregationen',
	'document.kind.cdfResponsum': 'Responsum från Troskongregationen',
	'document.kind.cdfConsiderations': 'Överväganden från Troskongregationen',
	'document.kindPlural.conciliarConstitution': 'Konstitutioner',
	'document.kindPlural.conciliarDecree': 'Dekret',
	'document.kindPlural.conciliarDeclaration': 'Deklarationer',
	'document.kindPlural.encyclical': 'Encyklikor',
	'document.kindPlural.apostolicExhortation': 'Apostoliska maningar',
	'document.kindPlural.apostolicConstitution': 'Apostoliska konstitutioner',
	'document.kindPlural.apostolicLetter': 'Apostoliska brev',
	'document.kindPlural.cdfDeclaration': 'Deklarationer från Troskongregationen',
	'citation.unavailable': 'Ingen källtext finns för den här noten.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Vad den här sajten är, varifrån dess texter kommer och hur vi ser på att återge dem.',
	'colophon.whatThisIs': 'Vad det här är',
	'colophon.whatThisIsBody':
		'Glossa Catholica är en läsesajt för Skriften, katekesen, kompendiet och läroämbetets dokument, på engelska, portugisiska och latin. Den finns till för att läsas, och inget annat begärs av dig för att läsa den:',
	'colophon.pointFree':
		'Gratis, och alltid gratis. Ingen betalvägg, ingen prenumeration, ingenting att köpa.',
	'colophon.pointNoAds': 'Ingen reklam, och ingen sponsrad placering av något slag.',
	'colophon.pointNoAccounts':
		'Inga konton. Ingenting att registrera sig för, ingenting att logga in på.',
	'colophon.pointNoTracking':
		'Inga spårningsskript, ingen kod från tredje part, inga kakor. Endast anonym användningsstatistik, ingenting som identifierar dig.',
	'colophon.pointOffline':
		'Byggd för att fortsätta fungera offline när du väl har besökt den, så att en dålig uppkoppling inte behöver vara ett hinder för läsningen.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica är ett privat initiativ av lekmannatroende. Det har ingen kyrklig approbation och talar inte med egen auktoritet.',
	'footer.notEndorsed': 'Utan Heliga stolens godkännande',
	'colophon.textsTitle': 'Texterna',
	'colophon.textsBody':
		'Varje text kommer från en namngiven källa, och varje verk anger sin utgåva, sin källsida och datumet då den hämtades. Skriften använder översättningar i public domain; katekesen, kompendiet och läroämbetets dokument kommer från Heliga stolens egna publicerade texter.',
	'colophon.textsFidelity':
		'Texten förkortas aldrig, parafraseras aldrig, skrivs aldrig om och placeras aldrig intill reklam. Däremot rättar vi uppenbara fel — ett bortfallet ord, en förvanskad hänvisning, en uppmärkning som svalt ett stycke — alltid mot vad källan själv trycker, aldrig mot vad vi tycker att den borde säga.',
	'colophon.textsLanguages':
		'Gränssnittet räcker längre än biblioteket. Där vi inte har Skriften på det språk du läser på visas texten på det närmaste språk vi har, oftast engelska; verket du läser anger alltid vilken utgåva det är.',
	'colophon.textsLanguagesBlocked':
		'För tre av dem är det inte en fråga om tid. Det har aldrig funnits en katolsk bibel på svenska som är fri från upphovsrätt — de fria svenska versionerna är lutherska och avviker från latinet just vid de verser där skillnaden betyder något. Slovenskan och arabiskan har var sin katolsk bibel gammal nog att vara fri, och ingen av dem finns kvar annat än som fotografier av sina sidor.',
	'colophon.countBible': 'bibelutgåvor',
	'colophon.countDocuments': 'dokument från läroämbetet',
	'colophon.privacyTitle': 'Integritet',
	'colophon.privacyBody1':
		'Inga konton, inga kakor, ingen reklam, ingen kod från tredje part. Ingenting här följer dig när du lämnar sajten.',
	'colophon.privacyBody2':
		'Vi räknar faktiskt hur sajten används: en mätning per besök, där varje fält är ett intervall snarare än ett värde — hur länge du stannade, hur ofta du har varit här, vilka verk du öppnade. Ditt land räknas separat, utan något som binder samman det med resten. Det beskriver ett besök, inte en besökare, och sparas i {days} dagar.',
	'colophon.privacyBody3':
		'Skickas aldrig: vad du skriver i sökrutan, vilket ställe du hade öppet, eller något som skulle kunna känna igen din enhet igen. Dina inställningar, bokmärken och hämtade texter stannar på din enhet.',
	'colophon.copyrightTitle': 'Upphovsrätt',
	'colophon.copyrightBody1':
		'Katekesen, kompendiet och läroämbetets dokument tillhör sina rättighetshavare — främst Libreria Editrice Vaticana och Dikasteriet för kommunikation.',
	'colophon.copyrightBody2':
		'Varje verk visar sin rättighetshavares egen upphovsrättsnotis, med deras ordalydelse, och länkar till sidan den hämtades från.',
	'colophon.copyrightBody3':
		'Om du innehar rättigheter till någon text här och hellre ser att den inte publiceras, skriv till oss.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'För vad som helst, även det ovanstående:',
	'colophon.contactPending':
		'Någon kontaktadress har ännu inte bestämts. Den här sajten bör inte göras offentlig förrän den har en — löftet ovan betyder ingenting utan ett sätt att nå oss.',
	'colophon.illustrationsTitle': 'Illustrationerna',
	'colophon.illustrationsBody':
		'Bibeln bär Gustave Dorés gravyrer, var och en placerad vid den vers den skildrar — den sista och största av hans bibelsviter, skuren i trä efter hans teckningar och tryckt tillsammans med texten i stället för samlad sist i bandet.',
	'colophon.illustrationsRights':
		'De är fria, vilket årtalen nedan visar, och en trogen fotografisk återgivning av en fri gravyr ger ingen ny upphovsrätt.',
	'colophon.countPlates': 'gravyrer',
	'colophon.countPlateChapters': 'illustrerade kapitel',
	'plates.scansBy': 'Skanningar tillhandahållna av',
	'plates.enlarge': 'Förstora {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'Om den här bilden',
	'art.detail': 'detalj',
	'colophon.typeTitle': 'Typsnittet',
	'colophon.typeBody':
		'Satt med EB Garamond, Georg Duffners och Octavio Pardos återupplivande av de typer Claude Garamont skar på 1590-talet — den humanistiska tradition kyrkan har tryckt i sedan renässansen. Dess kyrilliska är av samma händer men återupplivar ingenting: någon kyrillisk Garamond har aldrig skurits, så ryskan sätts i en form ritad för att stå bredvid de övriga.',
	'colophon.typeArabic':
		'Arabiskan ligger helt utanför den och sätts med Amiri — Khaled Hosnys återupplivande av den naskh som skars för Bulaqtryckeriet i Kairo 1905, vald efter samma resonemang som brödtexten: en bestämd historisk boktyp och inte en samtida teckning.',
	'colophon.typeInitials':
		'Anfangerna är Pirata One, en frakturstil vars versaler förblir läsbara i den storlek en anfang kräver, och — för ryskan — Ponomar, som återger Synodaltryckeriets kyrkslaviska stil. Ponomar sätter anfangen och aldrig texten: en modern encyklika satt helt i synodalstil skulle säga något osant om sig själv. Alla är licensierade under SIL Open Font License och levereras från den här sajten och inte från tredje part, så att läsa en sida begär ingenting av någon annans server.',
	'refs.citedIn': 'Citeras i',
	'refs.externalVolume': 'Band {volume} på {host} — skannad PDF',
	'bible.wholeChapter': 'Detta kapitel',
	'bible.verseNotInEdition':
		'Det här versnumret finns inte i den här utgåvan — se noten i sidans källa',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Not',
	'bible.noteMissing': 'Den här noten saknas i korpuset',
	'bible.chapterArgument': 'Innehållsöversikt',
	'ccc.readFullChapter': 'Läs hela kapitlet',
	'ccc.noParagraphNumber': 'Inget styckenummer i detta korpus',
	'copyright.sourceTitle': 'Öppna den ursprungliga källsidan',
	'copyright.sourceLabel': 'Källa',
	'lang.label': 'Språk',
	'lang.filter': 'Sök språk',
	'lang.more': 'fler språk',
	'notFound.title': 'Ingenting på den här adressen',
	'notFound.lede': 'Sidan du bad om finns inte här.',
	'notFound.body':
		'Länken kan vara felskriven eller föråldrad, eller peka på en text som den här sajten inte har.',
	'notFound.searchHint':
		'Om du vet vilken hänvisning du vill ha — en bok och ett kapitel, ett stycke i katekesen — skriv in den i sökrutan högst upp på sidan.',
	'notFound.credit': 'Efter British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Eller börja från någon av dessa:',
	'notFound.home': 'Startsida',
	'compare.enter': 'Jämför utgåvor',
	'compare.exit': 'Avsluta jämförelsen',
	'compare.missing': 'Finns inte i den här utgåvan',
	'compare.versificationNote':
		'De här två utgåvorna delar in kapitlets verser olika på sina ställen (en textvariant, inte ett översättningsval) — samma versnummer markerar inte alltid samma mening i båda spalterna.',
	'compare.loading': 'Läser in det andra språket…',
	'ui.close': 'Stäng',
	'shortcuts.title': 'Kortkommandon',
	'shortcuts.betweenDocuments': 'Mellan dokument',
	'shortcuts.withinDocument': 'I dokumentet',
	'shortcuts.show': 'Visa den här listan',
	'help.title': 'Hjälp',
	'help.reading.heading': 'Raden ovanför en text',
	'help.feature.offline':
		'Lägg till sidan på hemskärmen så öppnas den som en app. Du kan hämta hela verk för att läsa utan uppkoppling.',
	'help.feature.contents':
		'Indelningarna i det verk du är i — böcker, delar, kapitel — så att du kan röra dig inuti det utan att gå tillbaka till början.',
	'help.feature.compare':
		'Två utgåvor av samma ställe, sida vid sida — latinet bredvid ditt eget språk, eller en översättning bredvid en annan.',
	'help.feature.apparatus':
		'En utgåvas egna noter, och varje kommentar skriven till texten, erbjuds bredvid den och inte under. Hänvisningar inne i texten är länkar, så en hänvisning leder dit den pekar.',
	'help.feature.focus':
		'Rensar bort allt utom texten. Vägen ut står kvar där raden var, så att ingenting blir instängt bakom den.',
	'zen.enter': 'Fokusläge',
	'zen.exit': 'Avsluta fokusläget',
	'nav.calendar': 'Kalender',
	'calendar.title': 'Liturgisk kalender',
	'calendar.tagline':
		'Den allmänna romerska kalendern, uträknad för vilken dag som helst — dess tid, dess grad, dess färg.',
	'calendar.national.tagline': '{name}, med egna firningar, uträknad för vilken dag som helst.',
	'calendar.calendar': 'Kalender',
	'calendar.which.general': 'Allmänna romerska kalendern',
	'calendar.filter': 'Sök länder',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Mellanöstern',
	'calendar.region.asia': 'Asien',
	'calendar.region.oceania': 'Oceanien',
	'calendar.today': 'I dag',
	'calendar.previousMonth': 'Föregående månad',
	'calendar.nextMonth': 'Nästa månad',
	'calendar.plainDays': 'Vanliga vardagar',
	'calendar.noSuchDay': 'Ingen liturgisk dag beräknas för det datumet.',
	'calendar.week': 'vecka',
	'calendar.alsoToday': 'Firas även i dag',
	'calendar.alsoObserved': 'Uppmärksammas även i dag',
	'calendar.obligation': 'Påbjuden helgdag',
	'calendar.obligationCanon': 'CIC can. 1246',
	'calendar.sundayCycle': 'Söndagscykel',
	'calendar.weekdayCycle': 'Vardagscykel',
	'calendar.psalterWeek': 'Psaltarvecka',
	'lectionary.heading': 'Läsningar vid mässan',
	'lectionary.slot.reading': 'Läsning',
	'lectionary.slot.reading1': 'Första läsningen',
	'lectionary.slot.reading2': 'Andra läsningen',
	'lectionary.slot.reading3': 'Tredje läsningen',
	'lectionary.slot.reading4': 'Fjärde läsningen',
	'lectionary.slot.reading5': 'Femte läsningen',
	'lectionary.slot.reading6': 'Sjätte läsningen',
	'lectionary.slot.reading7': 'Sjunde läsningen',
	'lectionary.slot.psalm': 'Responsoriepsalm',
	'lectionary.slot.epistle': 'Epistel',
	'lectionary.slot.acclamation': 'Evangelieacklamation',
	'lectionary.slot.gospel': 'Evangelium',
	'lectionary.slot.sequence': 'Sekvens',
	'lectionary.or': 'eller',
	'lectionary.cf': 'Jfr',
	'lectionary.about': 'Om dessa läsningar',
	'lectionary.caveat':
		'De avsnitt som anges i Ordo Lectionum Missae, länkade till den här sajtens egna utgåvor — inte den översättning som läses i någon särskild kyrka, och en biskopskonferens kan anpassa schemat.',
	'calendar.transferredFrom': 'Flyttad från',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Jultiden',
	'calendar.season.lent': 'Fastan',
	'calendar.season.triduum': 'Påsktriduum',
	'calendar.season.easter': 'Påsktiden',
	'calendar.season.ordinary': 'Tiden under året',
	'calendar.colour.white': 'Vitt',
	'calendar.colour.red': 'Rött',
	'calendar.colour.green': 'Grönt',
	'calendar.colour.violet': 'Violett',
	'calendar.colour.rose': 'Rosa',
	'calendar.colour.black': 'Svart',
	'calendar.colour.blue': 'Blått',
	'calendar.rank.solemnity': 'Högtid',
	'calendar.rank.feast': 'Fest',
	'calendar.rank.memorial': 'Minnesdag',
	'calendar.rank.optional-memorial': 'Fri minnesdag',
	'calendar.rank.commemoration': 'Åminnelse',
	'calendar.rank.sunday': 'Söndag',
	'calendar.rank.weekday': 'Vardag',
	'calendar.gloss.season.advent':
		'De fyra veckorna före jul: förberedelse för Herrens ankomst och början på kyrkoåret.',
	'calendar.gloss.season.christmas':
		'Från juldagen till Herrens dop, då Herrens födelse och hans uppenbarelse för världen firas.',
	'calendar.gloss.season.lent':
		'De fyrtio dagarna från askonsdagen till kvällsmässan om Herrens sista måltid: bot, allmosa och förberedelse för påsken.',
	'calendar.gloss.season.triduum':
		'De tre dagarna från skärtorsdagens kväll till påskdagens kväll — Herrens lidande, död och uppståndelse, och höjdpunkten på hela året.',
	'calendar.gloss.season.easter':
		'De femtio dagarna från påsk till pingst, firade som en enda fest — ”en enda stor söndag”.',
	'calendar.gloss.season.ordinary':
		'De trettiotre eller trettiofyra veckorna utanför de övriga tiderna. Inte ”vanlig” utan ordnad: veckorna räknas, och kyrkan läser Herrens liv och undervisning i följd. Den kommer i två sträckor — efter jultiden fram till fastan, och efter pingst fram till advent.',
	'calendar.gloss.rank.solemnity':
		'Den högsta graden: påsk, jul, Kristi himmelsfärd, en plats eget skyddshelgon. Firas med Gloria och trosbekännelsen, och börjar kvällen innan.',
	'calendar.gloss.rank.feast':
		'Firas inom dagen själv. Apostlarna och evangelisterna, och Herrens och Vår Frus större dagar.',
	'calendar.gloss.rank.memorial':
		'Ett helgon som åminns på sin dag, inom tidens egen mässa och tidebön. Obligatorisk där den firas.',
	'calendar.gloss.rank.optional-memorial':
		'Får firas eller inte, som prästen eller församlingen väljer. Firas den inte är dagen helt enkelt vardagen.',
	'calendar.gloss.rank.commemoration':
		'Vad en åminnelse blir under fastan: en bön som läggs till vardagsmässan, som tiden i övrigt håller hel.',
	'calendar.gloss.rank.sunday':
		'Den ursprungliga högtiden — Herrens dag, firad varje vecka sedan uppståndelsen. Endast en högtid eller en Herrens fest får tränga undan den, och under advent, fastan och påsktiden inte ens de.',
	'calendar.gloss.rank.weekday':
		'En dag utan eget firande. Mässan och tidebönen är tidens — vilket är det som gör tiden värd att känna till.',
	'calendar.gloss.colour.white':
		'Glädje. Påsktiden och jultiden, Herrens dagar utanför hans lidande, Vår Fru, änglarna, och de helgon som inte var martyrer.',
	'calendar.gloss.colour.red':
		'Blod och eld. Palmsöndagen och långfredagen, pingsten, apostlarna och evangelisterna, och martyrerna.',
	'calendar.gloss.colour.green': 'Tiden under året: hoppets färg, och det växandes.',
	'calendar.gloss.colour.violet': 'Advent och fastan, och bärs också vid mässor för de avlidna.',
	'calendar.gloss.colour.rose':
		'Bärs två gånger om året — på söndagen Gaudete, den tredje i advent, och på söndagen Laetare, den fjärde i fastan — där fastan lättar och slutet är i sikte.',
	'calendar.gloss.colour.black': 'Får bäras vid mässor för de avlidna.',
	'calendar.gloss.colour.blue':
		'Det blå privilegiet: bärs på Marie obefläckade avlelse i Spanien, på Filippinerna och på de få andra platser som Heliga stolen har beviljat det.',
	'calendar.gloss.sundayCycle':
		'Söndagsläsningarna löper över tre år — A, B och C — och läser Matteus, Markus och Lukas i tur och ordning, med Johannes genom fastan och påsktiden. Cykeln vänder på första söndagen i advent, med kyrkoåret.',
	'calendar.gloss.weekdayCycle':
		'Vardagsläsningarna löper över två år, I och II: den första läsningen växlar, evangeliet inte. Ett liturgiskt år heter efter det kalenderår det slutar i — udda år är I, jämna år II.',
	'calendar.gloss.psalterWeek':
		'Tidegärden fördelar psalmerna över fyra veckor, I till IV, som upprepas genom året. Detta är den vecka vars psalmer är dagens, för den som ber tidegärden.',
	'calendar.gloss.obligation':
		'En dag då de troende är skyldiga att delta i mässan och avstå från arbete som skulle hindra dem. Varje söndag, och de övriga dagar som varje biskopskonferens har bestämt.',
	'calendar.primer.title': 'Ny här?',
	'calendar.primer.lead':
		'Kyrkan håller ett eget år. Det börjar med advent, vänder kring påsken, och ger varje dag ett namn, en grad och en färg — och de avgör vad som bes och läses den dagen i mässan och i tidegärden. Så ”tjugotredje söndagen under året” är en adress: den säger en präst, en kör eller den som ber hemma vilka böner och läsningar som hör till i dag.',
	'calendar.primer.seasons': 'Tiderna',
	'calendar.primer.ranks': 'Vad en dag kan vara',
	'calendar.primer.colours': 'Färgerna',
	'calendar.primer.cycles': 'Cyklerna',
	'calendar.primer.cyclesLead':
		'Tre räknare som tillsammans säger vilka läsningar och psalmer som är bestämda för i dag.'
};
