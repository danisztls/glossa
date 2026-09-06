/**
 * Norsk UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * ADDED 2026-09-06, and the reason is the calendar. `calendar/names/no.ts`
 * holds the General Roman Calendar's 218 celebrations and the whole Proper of
 * Time in Norsk, read off the calendar GCatholic publishes for this
 * language — so the site could name every day of the year in it and had no
 * chrome to put around them. That is the combination `../ui-langs.ts` says the
 * interface list should never leave standing, arriving from the calendar's
 * side rather than the corpus's.
 *
 * The same 280 keys the other tail dictionaries carry: every chrome page's
 * name and description, the reader-facing controls, the colophon, and all 75
 * `calendar.*` keys — the 44 the calendar page labels itself with and the 31
 * that teach what those labels mean. IT HAS NOT BEEN READ BY A NATIVE
 * SPEAKER. `colophon.whatThisIsStanding` and `footer.notEndorsed` (the
 * canonical standing statement, Can. 216 CIC, at full length and in the one
 * line the footer of every page carries) and `colophon.copyrightBody3` (how a
 * rights holder reaches us) are the ones to check first: all three are
 * operative rather than descriptive. Deleting a doubtful line is a valid fix —
 * it falls back to English.
 *
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const no: Dictionary = {
	'nav.bible': 'Bibelen',
	'nav.ccc': 'Katekismen',
	'nav.compendium': 'Kompendiet',
	'nav.magisterium': 'Læreembetet',
	'nav.socialDoctrine': 'Sosiallære',
	'socialDoctrine.landing.title': 'Kompendium i Kirkens sosiallære',
	'socialDoctrine.landing.tagline':
		'Det Kirken lærer om livet i samfunnet, i 583 nummererte avsnitt.',
	'nav.canonLaw': 'Kirkerett',
	'canonLaw.landing.title': 'Den kanoniske lovbok',
	'canonLaw.landing.tagline': 'Den latinske kirkes lov, i 1 752 kanoner fordelt på sju bøker.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kann.',
	'canonLaw.prevCanon': 'Forrige kanon',
	'canonLaw.nextCanon': 'Neste kanon',
	'canonLaw.readFullTitle': 'Les hele tittelen',
	'canonLaw.superseded': 'Ordlyd erstattet av',
	'nav.prayers': 'Bønner',
	'nav.bookmarks': 'Bokmerker',
	'nav.menu': 'Meny',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Fortsett å lese',
	'home.tagline':
		'Et lesested for Skriften, Katekismen og Læreembetets dokumenter — gratis, uten nett, og uten noe å registrere seg for.',
	'home.doors.heading': 'Hvor vil du gå',
	'home.find.heading': 'Eller skriv en henvisning',
	'nav.library': 'Bibliotek',
	'nav.learn': 'Lær',
	'library.landing.tagline': 'Hele samlingen, hylle for hylle, og det du har merket i den.',
	'schola.landing.title': 'Hvor du begynner',
	'schola.landing.tagline':
		'En kort veiviser til det som er her: hva hver av disse bøkene er, hvordan en henvisning til den skrives, hvordan du finner et sted, og leseordninger Kirken selv har lagt fram.',
	'schola.start.heading': 'Om dette er nytt for deg',
	'schola.start.body': 'Begynn med ',
	'schola.start.bodyAfter':
		': den samme læren som Katekismen, mye kortere, skrevet som spørsmål og svar. Den er omtrent en tidel så lang og forutsetter ingenting.',
	'schola.bible.heading': 'Om du aldri har lest Bibelen',
	'schola.bible.library':
		'Den er ikke én bok, men syttitre, skrevet over mer enn tusen år og bundet i den orden Kirken fastsatte — ikke i den orden hendelsene skjedde, og ikke i den orden som er lettest å lese. De fleste begynner på første side og stopper noen uker senere, i et langt kapittel med gammel lov, fordi ingen ennå har fortalt dem hva den er til for.',
	'schola.bible.step.gospel': 'Begynn med et evangelium',
	'schola.bible.start':
		'En av fire korte bøker om Jesu liv, et godt stykke inn og ikke fremst. Det er ikke vår idé: et kirkemøte ba om at folk skulle læres den rette bruk av Skriften «særlig Det nye testamente og framfor alt evangeliene». Det nevnte ikke ett av dem ved navn, og det gjør ikke vi heller.',
	'schola.bible.whichGospel':
		'Tre blir gjerne anbefalt, av tre ulike grunner. Hvilket som helst av dem er et godt sted å være.',
	'schola.bible.gospel.mark':
		'Det korteste. Du kan lese det hele på en ettermiddag, og å ha lest ett ferdig er mer verdt i begynnelsen enn å ha valgt det beste.',
	'schola.bible.gospel.luke':
		'Skrevet for en utenfor troen som ville ha fortellingen nedtegnet i orden — noe som kan være nettopp deg. Det går rett over i Apostlenes gjerninger, så det er egentlig første halvdel av en lengre bok.',
	'schola.bible.gospel.john':
		'Det som selv sier hvorfor det ble skrevet: «for at dere skal tro». Enkle ord, og det går rett på spørsmålet om hvem Jesus er.',
	'schola.bible.step.acts': 'Så hva som skjedde videre',
	'schola.bible.thenActs':
		'Når du har lest ett ferdig, les hva de som kjente ham gjorde etter at han var borte.',
	'schola.bible.acts.why':
		'De tretti årene etter at evangeliene slutter: noen få dusin redde mennesker, og hvordan det de hadde sett nådde den andre enden av riket.',
	'schola.bible.step.old': 'Så den eldre halvdelen',
	'schola.bible.thenOld':
		'Ikke fra første side, og ikke alt. Noen få steder bærer fortellingen, og det er dem evangeliene stadig peker tilbake på.',
	'schola.bible.ot.beginnings': 'Hvordan det begynner, og hvordan det går galt.',
	'schola.bible.ot.promise': 'Én slekt, og et løfte gitt den som lever lenger enn alle i den.',
	'schola.bible.ot.exodus': 'Et folk ført ut av slaveri, og gitt en lov å leve etter.',
	'schola.bible.ot.psalms':
		'Ikke en fortelling: hundre og femti bønner og sanger. Les én om gangen, i hvilken som helst rekkefølge. Kirken ber dem fremdeles hver dag.',
	'schola.bible.bothWays':
		'Du vil kjenne igjen ting, og det er poenget snarere enn et sammentreff. Kirken leser de eldre bøkene i Kristi lys og de nyere i lys av det som kom før — hver halvdel forklarer den andre, og derfor leses ingen av dem alene.',
	'schola.guide.heading': 'Å finne fram',
	'schola.guide.lede':
		'Teksten er hele siden; alt annet er en betjening du kan overse til du vil ha den.',
	'schola.guide.top.heading': 'Linjen øverst på hver side',
	'schola.guide.reading.heading': 'Linjen over en tekst',
	'schola.feature.search':
		'Skriv en henvisning i feltet øverst — kapittel og vers, et avsnittsnummer, navnet på et dokument — og det fullføres mens du skriver. Trykk / eller Ctrl+K hvor som helst, og ? for de andre snarveiene.',
	'schola.feature.languages':
		'Grensesnittet og teksten velges hver for seg, så du kan lese et verk på ett språk mens knappene står på et annet. Har et verk flere utgaver på ditt språk, velger du også mellom dem.',
	'schola.feature.settings':
		'Tekststørrelse, lyst eller mørkt, sepia, og hvor mye av apparatet du vil ha ved siden av teksten.',
	'schola.feature.offline':
		'Legg stedet på hjemskjermen, så åpnes det som en app. Du kan laste ned hele verk og lese dem uten nett.',
	'schola.feature.contents':
		'Inndelingene i verket du er i — bøker, deler, kapitler — så du kan flytte deg inni det uten å gå tilbake til begynnelsen.',
	'schola.feature.compare':
		'To utgaver av samme sted, side om side — latinen ved siden av ditt eget språk, eller én oversettelse ved siden av en annen.',
	'schola.feature.apparatus':
		'En utgaves egne fotnoter, og enhver kommentar skrevet til teksten, tilbys ved siden av den heller enn under den. Henvisninger inne i teksten er lenker, så en referanse fører dit den peker.',
	'schola.feature.focus':
		'Rydder bort alt annet enn teksten. Veien ut blir stående der linjen var, så ingenting blir sperret inne bak den.',
	'schola.books.heading': 'Hva som er her, og hvordan det henvises til',
	'schola.books.lede':
		'Hver av disse er en ulik slags bok, og hver blir omtalt med et nummer av sitt eget slag. Eksemplene viser formen: skriv en av dem i søkefeltet, så lander du på stedet.',
	'schola.cite.label': 'Henvises til som',
	'schola.what.scripture':
		'Skriften slik Kirken mottar den, i begge testamenter. Alt annet her leses i dens lys.',
	'schola.cite.scripture': 'bok, kapittel og vers, med de forkortelsene din egen utgave trykker',
	'schola.what.catechism':
		'En framstilling av det Den katolske kirke tror, i ett bind. Den er ikke selv en kilde: den samler Skriften, kirkefedrene, liturgien og Kirkens lære, og hvert avsnitt sier hvor det den sier kommer fra.',
	'schola.cite.catechism': 'med avsnittsnummer, som løper ubrutt fra første side til siste',
	'schola.what.compendium':
		'Den samme læren lagt fram som spørsmål og svar, omtrent en tidel så langt.',
	'schola.cite.compendium': 'med spørsmålsnummer',
	'schola.what.magisterium':
		'Det pavene og konsilene faktisk har skrevet — encyklikaer, konstitusjoner, dekreter, erklæringer — hver rettet til et bestemt øyeblikk og et bestemt spørsmål. Hver er kjent ved sine åpningsord på latin.',
	'schola.cite.magisterium': 'med dokumentets navn, deretter et avsnittsnummer inni det',
	'schola.what.social':
		'Kirkens lære om arbeid, eiendom, familien, politikk og fred, samlet ut av de dokumentene i én bok.',
	'schola.cite.social': 'med avsnittsnummer, under det siglum verket bruker om seg selv',
	'schola.what.law': 'Lov snarere enn lære. Den sier hva Kirken krever, og den blir endret.',
	'schola.cite.law': 'med kanon, som er det de nummererte enhetene kalles',
	'schola.what.doctors':
		'De teologene Kirken har utnevnt til kirkelærere. Det bærer ingen offisiell myndighet, hvor stor forfatteren enn er.',
	'schola.cite.doctors': 'med del, deretter spørsmål — Summaens egne inndelinger',
	'schola.what.prayers': 'De ordene Kirken ber, med latinen ved siden av.',
	'schola.cite.prayers': 'ved navn; det er ingen numre å henvise til',
	'schola.places.heading': 'Ikke tekster, men steder på dette nettstedet',
	'schola.what.library': 'Alle verk på stedet i én liste, ordnet etter emne heller enn etter slag.',
	'schola.what.calendar':
		'Den liturgiske dagen — tid, farge, og hvem som feires — for det landet hvis kalender du følger.',
	'schola.what.bookmarks':
		'Steder du har merket, og hvor du sist slapp i hvert verk. Begge holdes i denne nettleseren og sendes ingen steder.',
	'jumpbox.placeholder': 'Gå til… (f.eks. john 3:16, ccc 1234)',
	'jumpbox.short': 'Søk',
	'jumpbox.hint': 'Trykk / eller Ctrl+K for å gå til en henvisning',
	'jumpbox.noMatch': 'Ingen treff',
	'jumpbox.suggestions': 'Forslag',
	'settings.label': 'Innstillinger',
	'darkMode.label': 'Mørk modus',
	'darkMode.auto': 'Automatisk',
	'darkMode.on': 'På',
	'darkMode.off': 'Av',
	'loadFailed.title': 'Det lastet ikke',
	'loadFailed.hint': 'Siden finnes — noe gikk galt under henting. Å prøve igjen pleier å virke.',
	'loadFailed.retry': 'Prøv igjen',
	'loadFailed.retrying': 'Prøver…',
	'fontSize.label': 'Tekststørrelse',
	'fontSize.larger': 'Større tekst',
	'fontSize.smaller': 'Mindre tekst',
	'print.label': 'Skriv ut denne siden',
	'toTop.label': 'Tilbake til toppen',
	'edition.label': 'Utgave',
	'edition.select': 'Velg utgave',
	'edition.current': 'Nåværende utgave',
	'edition.filter': 'Søk i utgaver',
	'menu.noMatches': 'Ingen treff',
	'unitNav.previous': 'Forrige',
	'unitNav.next': 'Neste',
	'bible.prevChapter': 'Forrige kapittel',
	'bible.nextChapter': 'Neste kapittel',
	'bible.pickBook': 'Bøker og kapitler',
	'bible.landing.title': 'Bibelen',
	'bible.landing.tagline': 'Les hele Bibelen, bok for bok, kapittel for kapittel.',
	'bible.landing.books': 'Bøker',
	'bible.introduction': 'Innledning',
	'bible.group.pentateuch': 'Pentateuken',
	'bible.group.historical': 'Historiske bøker',
	'bible.group.wisdom': 'Visdomsbøker',
	'bible.group.prophetic': 'Profetiske bøker',
	'bible.group.gospels': 'Evangelier',
	'bible.group.acts': 'Apostlenes gjerninger',
	'bible.group.pauline': 'Paulusbrevene',
	'bible.group.catholicLetters': 'De katolske brev',
	'bible.group.revelation': 'Johannes’ åpenbaring',
	'ccc.landing.title': 'Den katolske kirkes katekisme',
	'ccc.landing.pairTitle': 'Katekismen og Kompendiet',
	'ccc.landing.tagline':
		'<strong>Katekismen</strong> legger fram katolsk lære i 2 865 nummererte avsnitt. <strong>Kompendiet</strong> gjentar den samme læren som 598 spørsmål og svar, på samme disposisjon.',
	'ccc.landing.pairTagline':
		'Den katolske kirkes katekisme i 2 865 avsnitt, og dens Kompendium i 598 spørsmål.',
	'compendium.landing.title': 'Kompendium til Katekismen',
	'compendium.landing.tagline': 'Spørsmål og svar som sammenfatter Den katolske kirkes katekisme.',
	'compendium.question': 'Spørsmål',
	'compendium.answer': 'Svar',
	'compendium.tableOfContents': 'Innhold',
	'compendium.prevQuestion': 'Forrige spørsmål',
	'compendium.nextQuestion': 'Neste spørsmål',
	'compendium.condenses': 'Sammenfatter KKK ¶¶',
	'ccc.abbrev': 'KKK',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'Ingen spørsmålsnummer i denne samlingen',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Kirkelærere',
	'doctores.landing.tagline': 'De teologiske verkene til Kirkens fedre og lærere.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Thomas Aquinas, på engelsk og på latinen han skrev.',
	'index.division': 'Inndeling',
	'prayers.landing.title': 'Vanlige bønner',
	'prayers.landing.tagline': 'Bønner med den latinske teksten ved siden av.',
	'prayers.gloss.versicle':
		'Versikkelen — linjen den som leder bønnen sier eller synger alene. Forsamlingen svarer med svaret som følger.',
	'prayers.gloss.response':
		'Svaret — linjen forsamlingen sier eller synger sammen, som svar på versikkelen foran.',
	'prayers.seeAlso': 'Se også',
	'anchor.actions': 'Handlinger for henvisning',
	'anchor.copy': 'Kopier tekst',
	'anchor.copyLink': 'Kopier lenke',
	'anchor.view': 'Vis',
	'anchor.copied': 'Kopiert',
	'anchor.copyFailed': 'Kunne ikke kopiere',
	'bookmark.add': 'Bokmerk',
	'bookmark.remove': 'Fjern bokmerke',
	'bookmark.library': 'Bokmerker',
	'bookmark.library.tagline': 'Alt du har merket mens du leste.',
	'bookmark.empty': 'Ingenting merket ennå.',
	'bookmark.emptyHint':
		'Klikk et vers- eller avsnittsnummer og velg Bokmerk, eller bruk bokmerkeknappen på en side.',
	'bookmark.deviceOnly':
		'Bokmerker holdes bare i denne nettleseren. De sendes ingen steder, og å tømme nettleserdataene fjerner dem.',
	'bookmark.unavailable': 'Ikke i utgaven du leser',
	'document.library.tagline':
		'Encyklikaer, konsilkonstitusjoner, dekreter og erklæringer fra Læreembetet.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Hva dette stedet er, hvor tekstene kommer fra, og hvor vi står når det gjelder å gjengi dem.',
	'colophon.whatThisIs': 'Hva dette er',
	'colophon.whatThisIsBody':
		'Glossa Catholica er et lesested for Skriften, Katekismen, Kompendiet og Læreembetets dokumenter, på engelsk, portugisisk og latin. Det finnes for å bli lest, og ingenting annet kreves av deg for å lese det:',
	'colophon.pointFree':
		'Gratis, og alltid gratis. Ingen betalingsmur, intet abonnement, ingenting å kjøpe.',
	'colophon.pointNoAds': 'Ingen reklame, og ingen sponset plassering av noe slag.',
	'colophon.pointNoAccounts':
		'Ingen kontoer. Ingenting å registrere seg for, ingenting å logge inn på.',
	'colophon.pointNoTracking':
		'Ingen sporingsskript, ingen tredjepartskode, ingen informasjonskapsler. Bare anonyme brukstall, uten noe som identifiserer deg.',
	'colophon.pointOffline':
		'Bygd for å fortsette å virke uten nett når du først har vært innom, så en dårlig forbindelse ikke behøver å være en hindring for lesing.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica er et privat foretak av legfolk. Det bærer ingen kirkelig godkjennelse og taler med ingen myndighet av seg selv.',
	'footer.notEndorsed': 'Ikke godkjent av Den hellige stol',
	'colophon.textsTitle': 'Tekstene',
	'colophon.textsBody':
		'Hver tekst kommer fra en navngitt kilde, og hvert verk fører opp sin utgave, sin kildeside og datoen den ble hentet. Skriften bruker oversettelser i det fri; Katekismen, Kompendiet og de læreembetlige dokumentene kommer fra Den hellige stols egne utgitte tekster.',
	'colophon.textsFidelity':
		'Teksten blir aldri forkortet, aldri omskrevet, aldri gjendiktet, og aldri satt ved siden av reklame. Vi retter opplagte feil — et bortfalt ord, en forvansket henvisning, oppmerking som slukte et avsnitt — alltid mot det kilden selv trykker, aldri mot det vi mener den burde si.',
	'colophon.countBible': 'bibelutgaver',
	'colophon.countDocuments': 'læreembetlige dokumenter',
	'colophon.copyrightTitle': 'Opphavsrett',
	'colophon.copyrightBody1':
		'Katekismen, Kompendiet og de læreembetlige dokumentene tilhører sine rettighetshavere — først og fremst Libreria Editrice Vaticana og Dikasteriet for kommunikasjon.',
	'colophon.copyrightBody2':
		'Hvert verk viser rettighetshaverens egen opphavsrettsangivelse, med deres ordlyd, og lenker til siden det ble hentet fra.',
	'colophon.copyrightBody3':
		'Har du rettigheter til noen tekst her og heller vil at den ikke skulle vært utgitt, så skriv til oss.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'For hva som helst, også det ovenfor:',
	'colophon.contactPending':
		'En kontaktadresse er ennå ikke satt. Dette stedet bør ikke gjøres offentlig før det har en — løftet ovenfor betyr ingenting uten en måte å nå oss på.',
	'colophon.illustrationsTitle': 'Illustrasjonene',
	'colophon.illustrationsBody':
		'Bibelen bærer Gustave Dorés tresnitt, hvert plassert ved verset det framstiller — det siste og største av hans bibelsykluser, skåret i tre etter tegningene hans og trykt sammen med teksten heller enn samlet bakerst.',
	'colophon.illustrationsRights':
		'De er i det fri, som datoene nedenfor viser, og en tro fotografisk gjengivelse av et tresnitt i det fri bærer ingen ny opphavsrett av seg selv.',
	'colophon.countPlates': 'tresnitt',
	'colophon.countPlateChapters': 'illustrerte kapitler',
	'art.about': 'Om dette bildet',
	'art.detail': 'utsnitt',
	'colophon.typeTitle': 'Skriften',
	'colophon.typeBody':
		'Satt i EB Garamond, Georg Duffner og Octavio Pardos gjenoppliving av typene Claude Garamont skar på 1590-tallet — den humanistiske tradisjonen Kirken har trykt i siden renessansen. Dens kyrilliske er av de samme hendene, men gjenoppliver ingenting: det ble aldri skåret noen kyrillisk Garamond, så russisken er satt i en form tegnet for å stå ved siden av resten.',
	'colophon.typeArabic':
		'Arabisk ligger helt utenfor dette, og er satt i Amiri — Khaled Hosnys gjenoppliving av den naskh som ble skåret for Bulaq-trykkeriet i Kairo i 1905, valgt av samme grunn som tekstskriften: en bestemt historisk boktype heller enn en samtidig tegning.',
	'colophon.typeInitials':
		'Åpningsinitialene er Pirata One, en frakturskrift hvis versaler holder seg lesbare i den størrelsen en initial krever, og — for russisken — Ponomar, som gjengir Synodaltrykkeriets kirkeslaviske type. Ponomar setter initialen og aldri teksten: en moderne encyklika satt gjennomgående i synodaltype ville si noe usant om hva den er. Alle er lisensiert under SIL Open Font License og leveres fra dette stedet heller enn fra en tredjepart, så å lese en side krever ingenting av noen andres tjener.',
	'copyright.sourceTitle': 'Åpne den opprinnelige kildesiden',
	'copyright.sourceLabel': 'Kilde',
	'lang.label': 'Språk',
	'lang.filter': 'Søk i språk',
	'lang.more': 'flere språk',
	'calendar.title': 'Liturgisk kalender',
	'calendar.tagline':
		'Den allmenne romerske kalenderen, beregnet for hvilken som helst dag — dens tid, dens rang, dens farge.',
	'calendar.date': 'Dato',
	'calendar.calendar': 'Kalender',
	'calendar.which.general': 'Den allmenne romerske kalenderen',
	'calendar.filter': 'Søk i land',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Midtøsten',
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oseania',
	'calendar.today': 'I dag',
	'calendar.previousMonth': 'Forrige måned',
	'calendar.nextMonth': 'Neste måned',
	'calendar.noSuchDay': 'Ingen liturgisk dag er beregnet for den datoen.',
	'calendar.week': 'uke',
	'calendar.alsoToday': 'Feires også i dag',
	'calendar.alsoObserved': 'Markeres også i dag',
	'calendar.obligation': 'Påbudt helligdag',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Søndagsrekke',
	'calendar.weekdayCycle': 'Hverdagsrekke',
	'calendar.psalterWeek': 'Salteruke',
	'calendar.transferredFrom': 'Flyttet fra',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Juletiden',
	'calendar.season.lent': 'Fastetiden',
	'calendar.season.triduum': 'Påsketriduum',
	'calendar.season.easter': 'Påsketiden',
	'calendar.season.ordinary': 'Det alminnelige kirkeår',
	'calendar.colour.white': 'Hvit',
	'calendar.colour.red': 'Rød',
	'calendar.colour.green': 'Grønn',
	'calendar.colour.violet': 'Fiolett',
	'calendar.colour.rose': 'Rosa',
	'calendar.colour.black': 'Svart',
	'calendar.colour.blue': 'Blå',
	'calendar.rank.solemnity': 'Høytid',
	'calendar.rank.feast': 'Fest',
	'calendar.rank.memorial': 'Minnedag',
	'calendar.rank.optional-memorial': 'Valgfri minnedag',
	'calendar.rank.commemoration': 'Kommemorasjon',
	'calendar.rank.sunday': 'Søndag',
	'calendar.rank.weekday': 'Hverdag',
	'calendar.gloss.season.advent':
		'De fire ukene før jul: forberedelse til Herrens komme, og begynnelsen på Kirkens år.',
	'calendar.gloss.season.christmas':
		'Fra juledag til Herrens dåp, der Herrens fødsel og hans åpenbaring for verden feires.',
	'calendar.gloss.season.lent':
		'De førti dagene fra askeonsdag til kveldsmessen om Herrens nattverd: bot, almisse og forberedelse til påsken.',
	'calendar.gloss.season.triduum':
		'De tre dagene fra skjærtorsdag kveld til påskedag kveld — Herrens lidelse, død og oppstandelse, og høydepunktet i hele året.',
	'calendar.gloss.season.easter':
		'De femti dagene fra påske til pinse, feiret som én eneste fest — «én stor søndag».',
	'calendar.gloss.season.ordinary':
		'De trettitre eller trettifire ukene utenfor de andre tidene. Ikke «alminnelig» i betydningen hverdagslig, men ordnet: ukene telles, og Kirken leser Herrens liv og lære fortløpende. Det kommer i to strekk — etter juletiden fram til fasten, og etter pinse fram til advent.',
	'calendar.gloss.rank.solemnity':
		'Den høyeste graden: påske, jul, Kristi himmelfart, et steds egen vernehelgen. Feires med Gloria og trosbekjennelsen, og begynner kvelden før.',
	'calendar.gloss.rank.feast':
		'Feires innenfor dagen selv. Apostlene og evangelistene, og Herrens og Vår Frues større dager.',
	'calendar.gloss.rank.memorial':
		'En helgen som minnes på sin dag, innenfor tidens egen messe og tidebønn. Obligatorisk der den holdes.',
	'calendar.gloss.rank.optional-memorial':
		'Kan holdes eller ikke, som presten eller menigheten velger. Holdes den ikke, er dagen ganske enkelt hverdagen.',
	'calendar.gloss.rank.commemoration':
		'Det en minnedag blir i fastetiden: en bønn føyd til hverdagsmessen, som tiden for øvrig lar stå hel.',
	'calendar.gloss.rank.sunday':
		'Den opprinnelige festdagen — Herrens dag, feiret hver uke siden oppstandelsen. Bare en høytid eller en Herrens fest kan fortrenge den, og i advent, fastetiden og påsketiden ikke engang de.',
	'calendar.gloss.rank.weekday':
		'En dag uten egen feiring. Messen og tidebønnen er tidens — og det er dét som gjør tiden verd å kjenne.',
	'calendar.gloss.colour.white':
		'Glede. Påske- og juletiden, Herrens dager utenom hans lidelse, Vår Frue, englene, og de helgener som ikke var martyrer.',
	'calendar.gloss.colour.red':
		'Blod og ild. Palmesøndag og langfredag, pinsen, apostlene og evangelistene, og martyrene.',
	'calendar.gloss.colour.green': 'Det alminnelige kirkeår: håpets farge, og det voksendes.',
	'calendar.gloss.colour.violet': 'Advent og fastetiden, og bæres også ved messer for de døde.',
	'calendar.gloss.colour.rose':
		'Bæres to ganger i året — på søndagen Gaudete, den tredje i advent, og på søndagen Laetare, den fjerde i fasten — der fasten letner og enden er i sikte.',
	'calendar.gloss.colour.black': 'Kan bæres ved messer for de døde.',
	'calendar.gloss.colour.blue':
		'Det blå privilegium: bæres ved Marias uplettede unnfangelse i Spania, på Filippinene og de få andre stedene Den hellige stol har innvilget det.',
	'calendar.gloss.sundayCycle':
		'Søndagslesningene går over tre år — A, B og C — og leser Matteus, Markus og Lukas etter tur, med Johannes gjennom fasten og påsketiden. Rekken skifter på første søndag i advent, med Kirkens år.',
	'calendar.gloss.weekdayCycle':
		'Hverdagslesningene går over to år, I og II: den første lesningen skifter, evangeliet ikke. Et liturgisk år heter etter det kalenderåret det slutter i — oddetallsår er I, partallsår II.',
	'calendar.gloss.psalterWeek':
		'Tidebønnen fordeler salmene over fire uker, I til IV, som gjentas gjennom året. Dette er den uken hvis salmer er dagens, for den som ber tidebønnene.',
	'calendar.gloss.obligation':
		'En dag da de troende er forpliktet til å delta i messen og til å avstå fra arbeid som ville hindre det. Hver søndag, og de øvrige dagene hver bispekonferanse har fastsatt.',
	'calendar.primer.title': 'Ny her?',
	'calendar.primer.lead':
		'Kirken holder et år av sitt eget. Det begynner med advent, dreier om påsken, og gir hver dag et navn, en rang og en farge — og de avgjør hva som bes og leses den dagen i messen og i tidebønnen. Slik er «den treogtyvende søndag i det alminnelige kirkeår» en adresse: den sier en prest, et kor eller hvem som helst som ber hjemme hvilke bønner og lesninger som hører til i dag.',
	'calendar.primer.seasons': 'Tidene',
	'calendar.primer.ranks': 'Hva en dag kan være',
	'calendar.primer.colours': 'Fargene',
	'calendar.primer.cycles': 'Rekkene',
	'calendar.primer.cyclesLead':
		'Tre tellere som til sammen sier hvilke lesninger og salmer som er fastsatt for i dag.'
};
