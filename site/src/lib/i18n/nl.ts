/**
 * Nederlands UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 9 editions in Nederlands and its readers were reading
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
 * The language names in `lang-names.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const nl: Dictionary = {
	'nav.bible': 'Bijbel',
	'nav.ccc': 'Catechismus',
	'nav.compendium': 'Compendium',
	'nav.magisterium': 'Leergezag',
	'nav.socialDoctrine': 'Sociale leer',
	'socialDoctrine.landing.title': 'Compendium van de sociale leer van de Kerk',
	'socialDoctrine.landing.tagline':
		'Wat de Kerk leert over het leven in de samenleving, in 583 nummers.',
	'nav.canonLaw': 'Kerkelijk recht',
	'canonLaw.landing.title': 'Wetboek van Canoniek Recht',
	'canonLaw.landing.tagline':
		'Het recht van de Latijnse Kerk, in 1752 canones verdeeld over zeven boeken.',
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Cann.',
	'canonLaw.prevCanon': 'Vorige canon',
	'canonLaw.nextCanon': 'Volgende canon',
	'canonLaw.readFullTitle': 'Lees de hele titel',
	'canonLaw.superseded': 'Tekst vervangen door',
	'nav.prayers': 'Gebeden',
	'nav.bookmarks': 'Bladwijzers',
	'nav.menu': 'Menu',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Verder lezen',
	'home.tagline':
		'Een leessite voor de Schrift, de Catechismus en de documenten van het Leergezag — gratis, ook offline bruikbaar, en er is niets om u voor aan te melden.',
	'home.doors.heading': 'Waarheen',
	'home.find.heading': 'Of typ een verwijzing',
	'nav.library': 'Bibliotheek',
	'nav.learn': 'Leren',
	'library.landing.tagline':
		'De hele collectie, plank voor plank — met waar u gebleven was en wat u hebt gemarkeerd.',
	'jumpbox.placeholder': 'Ga naar… (bv. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Zoeken',
	'jumpbox.hint': 'Druk op / of Ctrl+K om naar een verwijzing te gaan',
	'jumpbox.noMatch': 'Niets gevonden',
	'jumpbox.suggestions': 'Suggesties',
	'settings.label': 'Instellingen',
	'darkMode.label': 'Donkere modus',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Aan',
	'darkMode.off': 'Uit',
	'loadFailed.title': 'Dat is niet geladen',
	'loadFailed.hint':
		'De pagina bestaat — er ging iets mis bij het ophalen ervan. Opnieuw proberen helpt meestal.',
	'loadFailed.retry': 'Opnieuw proberen',
	'loadFailed.retrying': 'Bezig…',
	'fontSize.label': 'Tekstgrootte',
	'fontSize.larger': 'Grotere tekst',
	'fontSize.smaller': 'Kleinere tekst',
	'print.label': 'Deze pagina afdrukken',
	'toTop.label': 'Terug naar boven',
	'edition.label': 'Uitgave',
	'edition.select': 'Uitgave kiezen',
	'edition.current': 'Huidige uitgave',
	'edition.filter': 'Uitgaven zoeken',
	'menu.noMatches': 'Geen resultaten',
	'unitNav.previous': 'Vorige',
	'unitNav.next': 'Volgende',
	'bible.prevChapter': 'Vorig hoofdstuk',
	'bible.nextChapter': 'Volgend hoofdstuk',
	'bible.pickBook': 'Boeken en hoofdstukken',
	'bible.landing.title': 'De Bijbel',
	'bible.landing.tagline': 'Lees de hele Bijbel, boek voor boek, hoofdstuk voor hoofdstuk.',
	'bible.landing.books': 'Boeken',
	'bible.introduction': 'Inleiding',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuch',
	'bible.group.historical': 'Historische boeken',
	'bible.group.wisdom': 'Wijsheidsboeken',
	'bible.group.prophetic': 'Profetische boeken',
	'bible.group.gospels': 'Evangeliën',
	'bible.group.acts': 'Handelingen van de Apostelen',
	'bible.group.pauline': 'Brieven van Paulus',
	'bible.group.catholicLetters': 'Katholieke brieven',
	'bible.group.revelation': 'Openbaring',
	'ccc.landing.title': 'Catechismus van de Katholieke Kerk',
	'ccc.landing.pairTitle': 'Catechismus en Compendium',
	'ccc.landing.tagline':
		'<strong>De Catechismus</strong> zet de katholieke leer uiteen in 2.865 genummerde paragrafen. <strong>Het Compendium</strong> geeft dezelfde leer weer als 598 vragen en antwoorden, volgens dezelfde indeling.',
	'ccc.landing.pairTagline':
		'De Catechismus van de Katholieke Kerk in 2.865 nummers, en zijn Compendium in 598 vragen.',
	'ccc.abbrev': 'CKK',
	'compendium.abbrev': 'Comp.',
	'document.library.tagline':
		'Encyclieken, conciliaire constituties, decreten en verklaringen van het Leergezag.',
	'doctores.landing.title': 'Kerkleraren',
	'doctores.landing.tagline': 'De theologische werken van de kerkvaders en kerkleraren.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Thomas van Aquino, in het Engels en in het Latijn dat hij schreef.',
	'index.division': 'Onderdeel',
	'prayers.landing.title': 'Gebruikelijke gebeden',
	'prayers.landing.tagline': 'Gebeden met de Latijnse tekst ernaast.',
	'prayers.seeAlso': 'Zie ook',
	'anchor.actions': 'Acties bij de verwijzing',
	'anchor.copy': 'Tekst kopiëren',
	'anchor.copyLink': 'Koppeling kopiëren',
	'anchor.view': 'Bekijken',
	'anchor.copied': 'Gekopieerd',
	'anchor.copyFailed': 'Kopiëren mislukt',
	'bookmark.add': 'Markeren',
	'bookmark.remove': 'Bladwijzer verwijderen',
	'bookmark.library': 'Bladwijzers',
	'bookmark.library.tagline': 'Alles wat u tijdens het lezen gemarkeerd hebt.',
	'bookmark.empty': 'Nog niets gemarkeerd.',
	'bookmark.emptyHint':
		'Klik op het nummer van een vers of alinea en kies Markeren, of gebruik de bladwijzerknop op de pagina.',
	'bookmark.deviceOnly':
		'Bladwijzers blijven alleen in deze browser. Zij worden nergens heen gestuurd, en het wissen van uw browsergegevens verwijdert ze.',
	'bookmark.unavailable': 'Niet in de uitgave die u leest',
	'colophon.title': 'Colofon',
	'colophon.lede':
		'Wat deze site is, waar haar teksten vandaan komen, en hoe wij staan tegenover het reproduceren ervan.',
	'colophon.whatThisIs': 'Wat dit is',
	'colophon.whatThisIsBody':
		'Glossa Catholica is een leessite voor de Schrift, de Catechismus, het Compendium en de documenten van het Leergezag, in het Engels, het Portugees en het Latijn. Zij bestaat om gelezen te worden, en er wordt niets anders van u gevraagd om haar te lezen:',
	'colophon.pointFree':
		'Gratis, en altijd gratis. Geen betaalmuur, geen abonnement, niets te koop.',
	'colophon.pointNoAds': 'Geen reclame, en geen gesponsorde plaatsing van welke aard ook.',
	'colophon.pointNoAccounts':
		'Geen accounts. Niets om u voor aan te melden, niets om op in te loggen.',
	'colophon.pointNoTracking':
		'Geen trackingscripts, geen code van derden, geen cookies. Alleen anonieme gebruikstellingen, met niets dat u identificeert.',
	'colophon.pointOffline':
		'Gebouwd om offline te blijven werken zodra u haar bezocht hebt, zodat een slechte verbinding geen belemmering voor het lezen hoeft te zijn.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica is een particulier initiatief van lekengelovigen. Zij draagt geen kerkelijke goedkeuring en spreekt met geen enkel eigen gezag.',
	'footer.notEndorsed': 'Zonder goedkeuring van de Heilige Stoel',
	'colophon.textsTitle': 'De teksten',
	'colophon.textsBody':
		'Elke tekst komt van een met name genoemde bron, en elk werk vermeldt zijn editie, zijn bronpagina en de datum waarop hij is opgehaald. De Schrift gebruikt vertalingen in het publieke domein; de Catechismus, het Compendium en de documenten van het Leergezag komen uit de door de Heilige Stoel zelf gepubliceerde teksten.',
	'colophon.textsFidelity':
		'De tekst wordt nooit ingekort, nooit geparafraseerd, nooit herschreven en nooit naast reclame geplaatst. Wij herstellen wel duidelijke gebreken — een weggevallen woord, een verminkte verwijzing, opmaak die een alinea heeft opgeslokt — altijd in de richting van wat de bron zelf drukt, nooit in de richting van wat wij denken dat er zou moeten staan.',
	'colophon.countBible': 'Bijbeledities',
	'colophon.countDocuments': 'documenten van het Leergezag',
	'colophon.copyrightTitle': 'Auteursrecht',
	'colophon.copyrightBody1':
		'De Catechismus, het Compendium en de documenten van het Leergezag zijn eigendom van hun rechthebbenden — voornamelijk de Libreria Editrice Vaticana en het Dicasterie voor Communicatie.',
	'colophon.copyrightBody2':
		'Elk werk toont de eigen auteursrechtvermelding van zijn rechthebbende, in diens bewoordingen, en verwijst naar de pagina waaraan het is ontleend.',
	'colophon.copyrightBody3':
		'Als u rechten bezit op enige tekst hier en liever niet zou zien dat deze gepubliceerd wordt, schrijf ons dan.',
	'colophon.contactTitle': 'Contact',
	'colophon.contactBody': 'Voor alles, ook het bovenstaande:',
	'colophon.contactPending':
		'Er is nog geen contactadres ingesteld. Deze site mag niet openbaar worden gemaakt voordat zij er een heeft — de bovenstaande toezegging betekent niets zonder een manier om ons te bereiken.',
	'colophon.illustrationsTitle': 'De illustraties',
	'colophon.illustrationsBody':
		'De Bijbel draagt de gravures van Gustave Doré, elk geplaatst bij het vers dat zij uitbeeldt — de laatste en grootste van zijn Bijbelcycli, in hout gesneden naar zijn tekeningen en met de tekst meegedrukt in plaats van achterin verzameld.',
	'colophon.illustrationsRights':
		'Zij bevinden zich in het publieke domein, zoals de data hieronder tonen, en een getrouwe fotografische reproductie van een gravure in het publieke domein draagt geen nieuw eigen auteursrecht.',
	'colophon.countPlates': 'gravures',
	'colophon.countPlateChapters': 'geïllustreerde hoofdstukken',
	'art.about': 'Over deze afbeelding',
	'art.detail': 'detail',
	'colophon.typeTitle': 'De letter',
	'colophon.typeBody':
		'Gezet uit EB Garamond, de herleving door Georg Duffner en Octavio Pardo van de letters die Claude Garamont in de jaren 1590 sneed — de humanistische traditie waarin de Kerk sinds de Renaissance drukt. Het cyrillisch is van dezelfde handen maar herleeft niets: er is nooit een cyrillische Garamond gesneden, dus het Russisch is gezet in een vorm die getekend is om naast de rest te staan.',
	'colophon.typeArabic':
		'Het Arabisch gaat daar geheel aan voorbij en is gezet uit Amiri — de herleving door Khaled Hosny van het naskh dat in 1905 voor de Bulaq-pers in Caïro werd gesneden, gekozen op dezelfde grond als de tekstletter: een bepaalde historische boekletter in plaats van een hedendaagse tekening.',
	'colophon.typeInitials':
		'De openingsinitialen zijn Pirata One, een gebroken schrift waarvan de kapitalen leesbaar blijven op de grootte die een initiaal vraagt, en — voor het Russisch — Ponomar, dat de kerkslavische letter van de Synodale Drukkerij weergeeft. Ponomar zet de initiaal en nooit de tekst: een moderne encycliek geheel in synodale letter zou iets onwaars zeggen over wat zij is. Alle zijn gelicentieerd onder de SIL Open Font License en worden vanaf deze site geleverd in plaats van door een derde partij, zodat het lezen van een pagina niets vraagt van andermans server.',
	'copyright.sourceTitle': 'De oorspronkelijke bronpagina openen',
	'copyright.sourceLabel': 'Bron',
	'lang.label': 'Taal',
	'lang.filter': 'Talen zoeken',
	'lang.more': 'meer talen'
};
