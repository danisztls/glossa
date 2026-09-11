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
	'nav.sections': 'Secties',
	'nav.works': 'Werken',
	'nav.pages': 'Pagina’s',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Verder lezen',
	'home.tagline':
		'Een leessite voor de Schrift, de Catechismus en de documenten van het Leergezag — gratis, ook offline bruikbaar, en er is niets om u voor aan te melden.',
	'home.doors.heading': 'Waarheen',
	'nav.library': 'Bibliotheek',
	'nav.learn': 'Leren',
	'library.landing.tagline':
		'De hele collectie, plank voor plank — met waar u gebleven was en wat u hebt gemarkeerd.',
	'schola.landing.title': 'Waar te beginnen',
	'schola.landing.tagline':
		'Een korte gids bij wat hier staat: wat elk van deze boeken is, de tien geboden en de andere lijsten die de Kerk een katholiek vraagt te kennen, en waar u kunt beginnen met lezen.',
	'schola.start.heading': 'Nieuw in het katholieke geloof?',
	'schola.start.body': 'Begin met het ',
	'schola.start.bodyAfter':
		': dezelfde leer als de Catechismus, veel korter, geschreven in vragen en antwoorden. Het is ongeveer een tiende zo lang en veronderstelt niets.',
	'schola.bible.heading': 'Nooit de Bijbel gelezen?',
	'schola.bible.library':
		'Zij is niet één boek maar drieënzeventig, geschreven over meer dan duizend jaar en gebundeld in de orde waarop de Kerk zich heeft vastgelegd — niet de orde waarin de dingen gebeurden, en niet die welke het gemakkelijkst leest. De meesten beginnen op de eerste bladzijde en houden enkele weken later op, in een lang hoofdstuk oud recht, omdat niemand hun nog heeft gezegd waartoe het dient.',
	'schola.bible.step.gospel': 'Begin met een evangelie',
	'schola.bible.start':
		'Een van vier korte boeken over het leven van Jezus, ver naar binnen en niet vooraan. Het is niet ons idee: een concilie van de Kerk vroeg dat het juiste gebruik van de Schrift zou worden onderwezen, „vooral van het Nieuwe Testament en bovenal van de evangeliën”. Het noemde er geen enkel afzonderlijk, en wij evenmin.',
	'schola.bible.whichGospel':
		'Drie worden gewoonlijk voorgesteld, om drie verschillende redenen. Elk daarvan is een goede plaats om te zijn.',
	'schola.bible.gospel.mark':
		'Het kortste. U kunt het in één middag helemaal lezen, en er één uit hebben is in het begin meer waard dan het beste gekozen te hebben.',
	'schola.bible.gospel.luke':
		'Geschreven voor iemand buiten het geloof die het verhaal op orde gezet wilde hebben — wat precies u kan zijn. Het loopt rechtstreeks door in de Handelingen van de Apostelen, en is dus eigenlijk de eerste helft van een langer boek.',
	'schola.bible.gospel.john':
		'Dat wat ronduit zegt waarom het geschreven is: „opdat gij gelooft”. Eenvoudige woorden, en het gaat recht op de vraag af wie Jezus is.',
	'schola.bible.step.acts': 'Dan wat er daarna gebeurde',
	'schola.bible.thenActs':
		'Wanneer u er één uit hebt, lees dan wat zij die hem gekend hadden deden nadat hij was heengegaan.',
	'schola.bible.acts.why':
		'De dertig jaar na het einde van de evangeliën: enkele tientallen bange mensen, en hoe wat zij gezien hadden de andere kant van het rijk bereikte.',
	'schola.bible.step.old': 'Dan de oudere helft',
	'schola.bible.thenOld':
		'Niet vanaf de eerste bladzijde, en niet alles. Enkele plaatsen dragen het verhaal, en het zijn die waarnaar de evangeliën steeds terugwijzen.',
	'schola.bible.ot.beginnings': 'Hoe het begint, en hoe het misgaat.',
	'schola.bible.ot.promise': 'Één familie, en een belofte aan haar die allen in haar overleeft.',
	'schola.bible.ot.exodus': 'Een volk uit slavernij geleid, en een wet om naar te leven.',
	'schola.bible.ot.psalms':
		'Geen verhaal: honderdvijftig gebeden en liederen. Lees er één tegelijk, in welke volgorde ook. De Kerk bidt ze nog elke dag.',
	'schola.bible.bothWays':
		'U zult dingen herkennen, en dat is de bedoeling en geen toeval. De Kerk leest de oudere boeken in het licht van Christus en de nieuwere in het licht van wat eraan voorafging — elke helft verklaart de andere, en daarom wordt geen van beide alleen gelezen.',
	'schola.books.heading': 'Wat hier staat',
	'schola.what.scripture':
		'De Schrift zoals de Kerk haar ontvangt, in beide Testamenten. Al het andere hier wordt in haar licht gelezen.',
	'schola.what.catechism':
		'Een samenvatting van wat de Katholieke Kerk gelooft, in één band. Hij is zelf geen bron: hij verzamelt de Schrift, de Vaders, de liturgie en de leer van de Kerk, en elk nummer zegt waar vandaan komt wat het beweert.',
	'schola.what.compendium':
		'Dezelfde leer uiteengezet in vragen en antwoorden, op ongeveer een tiende van de lengte.',
	'schola.what.magisterium':
		'Wat pausen en concilies werkelijk hebben geschreven — encyclieken, constituties, decreten, verklaringen — elk gericht tot een bepaald ogenblik en een bepaalde vraag. Elk is bekend naar zijn beginwoorden in het Latijn.',
	'schola.what.social':
		'De leer van de Kerk over arbeid, eigendom, het gezin, de politiek en de vrede, uit die documenten in één boek verzameld.',
	'schola.what.law': 'Recht en geen leer. Het zegt wat de Kerk vereist, en het wordt gewijzigd.',
	'schola.what.doctors':
		'De theologen die de Kerk tot kerkleraar heeft uitgeroepen. Het draagt geen ambtelijk gezag, hoe groot de schrijver ook is.',
	'schola.what.prayers': 'De woorden die de Kerk bidt, met het Latijn ernaast.',
	'schola.places.heading': 'Geen teksten, maar plaatsen op deze site',
	'schola.what.library':
		'Alle werken van de site in één lijst, gegroepeerd naar onderwerp en niet naar soort.',
	'schola.what.questions':
		'Een ingang voor wie een vraag heeft en geen verwijzing. Elk onderwerp verzamelt de passages die het beantwoorden — eerst de Catechismus — en elk woord daarvan is van de Kerk zelf.',
	'schola.what.calendar':
		'De liturgische dag — tijd, kleur en wie wordt gevierd — voor het land waarvan u de kalender volgt.',
	'schola.what.bookmarks':
		'Plaatsen die u gemarkeerd hebt, en waar u in elk werk het laatst gebleven bent. Beide blijven in deze browser en worden nergens heen gestuurd.',
	'schola.what.census':
		'Wat deze bibliotheek bevat en hoe ver zij reikt — hoeveel werken, in welke talen, en hoeveel daarvan iemand die uw taal leest werkelijk kan bereiken.',
	'ccc.noCounterpart': 'Geen tegenhanger in het andere werk',
	'jumpbox.placeholder': 'Ga naar… (bv. jn 3,16, ccc 1234)',
	'jumpbox.short': 'Zoeken',
	'jumpbox.hint': 'Druk op / of Ctrl+K om naar een verwijzing te gaan',
	'jumpbox.noMatch': 'Niets gevonden',
	'jumpbox.suggestions': 'Suggesties',
	'settings.label': 'Instellingen',
	'apparatus.label': 'Apparaat',
	'apparatus.editionNotes': 'Aantekeningen van deze uitgave',
	'apparatus.commentary': 'Commentaar',
	'apparatus.inCommentary': 'Opgenomen in het commentaar hierboven.',
	'darkMode.label': 'Donkere modus',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Aan',
	'darkMode.off': 'Uit',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Alleen in lichte modus',
	'sepia.noHue': 'Niet in mono',
	'oled.label': 'OLED-zwart',
	'oled.darkOnly': 'Alleen in donkere modus',
	'mono.label': 'Monochroom',
	'mono.hint':
		'Zet de hele pagina in één grijstint, zodat niets meer aan kleur te onderscheiden is. Sepia wordt uitgeschakeld zolang dit aanstaat.',
	'advanced.label': 'Geavanceerd',
	'library.title': 'Offline bibliotheek',
	'library.lede':
		'Teksten die op dit apparaat bewaard zijn, openen zonder enige internetverbinding.',
	'library.essentials': 'Gebeden en Compendium',
	'library.illustrations': 'Bijbel (illustraties)',
	'library.illustrationsDetail': 'Bijbel (illustraties, hoge resolutie)',
	'library.other': 'Overige teksten',
	'library.everything': 'Alles',
	'library.downloadAll': 'Alles downloaden',
	'library.download': 'Downloaden',
	'library.downloaded': 'Op dit apparaat',
	'library.offlineNote': 'Schakel de offline modus uit om iets te downloaden.',
	'library.remove': 'Verwijderen van dit apparaat',
	'library.removeConfirm': 'Verwijderen?',
	'library.forget': 'Downloads verwijderen',
	'library.forgetConfirm': 'Alles verwijderen?',
	'offline.label': 'Offline modus',
	'offline.hint':
		'Gebruikt helemaal geen internet: er wordt niets gedownload, niet op updates gecontroleerd en niets gemeten. Alleen teksten die al op dit apparaat staan, gaan open.',
	'offline.notDownloaded': 'Niet op dit apparaat',
	'loadFailed.title': 'Dat is niet geladen',
	'loadFailed.hint':
		'De pagina bestaat — er ging iets mis bij het ophalen ervan. Opnieuw proberen helpt meestal.',
	'loadFailed.retry': 'Opnieuw proberen',
	'loadFailed.retrying': 'Bezig…',
	'offline.turnOff': 'Offline modus uitschakelen',
	'type.label': 'Tekstgrootte en lettertype',
	'fontSize.label': 'Tekstgrootte',
	'fontSize.small': 'Klein',
	'fontSize.medium': 'Middel',
	'fontSize.large': 'Groot',
	'fontSize.xlarge': 'Extra groot',
	'fontSize.xxlarge': 'Grootst',
	'face.label': 'Lettertype',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Deze pagina afdrukken',
	'toTop.label': 'Terug naar boven',
	'install.label': 'Glossa installeren',
	'install.hint.label': 'Toevoegen aan beginscherm',
	'install.hint.title': 'Voeg Glossa toe aan uw beginscherm',
	'install.hint.stepBefore': 'Zij opent als een app en leest offline. Tik op',
	'install.hint.stepAfter': 'dan „Toevoegen aan beginscherm”.',
	'install.hint.dismiss': 'Sluiten',
	'update.label': 'Er is een nieuwe editie beschikbaar',
	'update.title': 'Een nieuwe editie is klaar',
	'update.body': 'Herlaad om de nieuwste teksten en correcties op te halen.',
	'update.action': 'Herladen',
	'update.dismiss': 'Niet nu',
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
	'bible.landing.random': 'Verras me',
	'bible.chapterUnavailable': 'Niet beschikbaar in deze uitgave',
	'bible.introduction': 'Inleiding',
	'bible.introUnavailable': 'Nog geen inleiding in deze taal',
	'bible.introSource': 'Inleidingen maken geen deel uit van de bijbeltekst.',
	'bible.testament.ot': 'Oude Testament',
	'bible.testament.nt': 'Nieuwe Testament',
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
	'ccc.prevParagraph': 'Vorige paragraaf',
	'ccc.nextParagraph': 'Volgende paragraaf',
	'ccc.inBrief': 'In het kort',
	'ccc.landing.title': 'Catechismus van de Katholieke Kerk',
	'ccc.landing.pairTitle': 'Catechismus en Compendium',
	'ccc.landing.tagline':
		'<strong>De Catechismus</strong> zet de katholieke leer uiteen in 2.865 genummerde paragrafen. <strong>Het Compendium</strong> geeft dezelfde leer weer als 598 vragen en antwoorden, volgens dezelfde indeling.',
	'ccc.landing.pairTagline':
		'De Catechismus van de Katholieke Kerk in 2.865 nummers, en zijn Compendium in 598 vragen.',
	'ccc.tableOfContents': 'Inhoud',
	'ccc.related': 'Zie ook',
	'compendium.landing.title': 'Compendium van de Catechismus',
	'compendium.landing.tagline':
		'Vragen en antwoorden die de Catechismus van de Katholieke Kerk samenvatten.',
	'compendium.question': 'Vraag',
	'compendium.answer': 'Antwoord',
	'compendium.tableOfContents': 'Inhoud',
	'compendium.prevQuestion': 'Vorige vraag',
	'compendium.nextQuestion': 'Volgende vraag',
	'compendium.condenses': 'Vat CKK ¶¶ samen',
	'ccc.abbrev': 'CKK',
	'ccc.condensedIn': 'In het Compendium',
	'compendium.abbrev': 'Comp.',
	'compendium.noQuestionNumber': 'Geen vraagnummer in dit corpus',
	'document.library.tagline':
		'Encyclieken, conciliaire constituties, decreten en verklaringen van het Leergezag.',
	'document.filter.heading': 'Filter',
	'document.filter.author': 'Auteur',
	'document.filter.kind': 'Type',
	'document.filter.subject': 'Onderwerp',
	'document.filter.search': 'Documenten zoeken',
	'document.filter.clear': 'Wissen',
	'document.filter.results': 'Getoonde documenten',
	'document.filter.noResults': 'Geen document voldoet aan deze filters.',
	'document.tableOfContents': 'Inhoud',
	'document.startReading': 'Beginnen met lezen',
	'document.readFullDocument': 'Lees het volledige document',
	'document.section': 'Sectie',
	'document.prevSection': 'Vorige',
	'document.nextSection': 'Volgende',
	'document.kind.conciliarConstitution': 'Constitutie',
	'document.kind.conciliarDecree': 'Decreet',
	'document.kind.conciliarDeclaration': 'Verklaring',
	'document.kind.encyclical': 'Encycliek',
	'document.kind.apostolicExhortation': 'Apostolische exhortatie',
	'document.kind.apostolicConstitution': 'Apostolische constitutie',
	'document.kind.apostolicLetter': 'Apostolische brief',
	'document.kind.cdfDeclaration': 'CDF-verklaring',
	'document.kind.cdfInstruction': 'CDF-instructie',
	'document.kind.cdfLetter': 'CDF-brief',
	'document.kind.cdfDoctrinalNote': 'CDF-leerstellige nota',
	'document.kind.cdfResponsum': 'CDF-responsum',
	'document.kind.cdfConsiderations': 'CDF-overwegingen',
	'document.kindPlural.conciliarConstitution': 'Constituties',
	'document.kindPlural.conciliarDecree': 'Decreten',
	'document.kindPlural.conciliarDeclaration': 'Verklaringen',
	'document.kindPlural.encyclical': 'Encyclieken',
	'document.kindPlural.apostolicExhortation': 'Apostolische exhortaties',
	'document.kindPlural.apostolicConstitution': 'Apostolische constituties',
	'document.kindPlural.apostolicLetter': 'Apostolische brieven',
	'document.kindPlural.cdfDeclaration': 'CDF-verklaringen',
	'citation.unavailable': 'Geen brontekst beschikbaar voor deze aantekening.',
	'doctores.landing.title': 'Kerkleraren',
	'doctores.landing.tagline': 'De theologische werken van de kerkvaders en kerkleraren.',
	'summa.landing.title': 'Summa Theologiae',
	'summa.landing.tagline': 'Thomas van Aquino, in het Engels en in het Latijn dat hij schreef.',
	'summa.tableOfContents': 'Inhoud',
	'summa.part': 'Deel',
	'summa.question': 'Kwestie',
	'summa.article': 'Artikel',
	'summa.questionShort': 'Kw.',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titel uit de {lang}-uitgave',
	'summa.titlesFromEdition': 'Titels uit de {lang}-uitgave — deze drukt er geen',
	'summa.prologue': 'Proloog',
	'summa.objection': 'Bezwaar',
	'summa.sedContra': 'Daarentegen',
	'summa.corpus': 'Ik antwoord dat',
	'summa.reply': 'Antwoord op bezwaar',
	'summa.preamble': 'Aantekening',
	'summa.prevQuestion': 'Vorige kwestie',
	'summa.nextQuestion': 'Volgende kwestie',
	'summa.noEditionInYourLanguage': 'De Summa heeft geen uitgave in uw taal. Getoond in het {lang}.',
	'summa.noLatinSupplement':
		'Het Supplement bestaat alleen in het Engels — het werd samengesteld na de dood van Thomas van Aquino.',
	'index.division': 'Onderdeel',
	'index.showSubsections': 'Subonderdelen tonen',
	'index.hideSubsections': 'Subonderdelen verbergen',
	'prayers.landing.title': 'Gebruikelijke gebeden',
	'prayers.landing.tagline': 'Gebeden met de Latijnse tekst ernaast.',
	'prayers.tableOfContents': 'Inhoud',
	'prayers.gloss.versicle':
		'Het versikel — de regel die de voorganger alleen zegt of zingt. De gemeenschap antwoordt daarop met het antwoord dat volgt.',
	'prayers.gloss.response':
		'Het antwoord — de regel die de gemeenschap samen zegt of zingt, als antwoord op het versikel ervoor.',
	'prayers.seeAlso': 'Zie ook',
	'prayers.prevPrayer': 'Vorig gebed',
	'prayers.nextPrayer': 'Volgend gebed',
	'prayers.rosary.today': 'Vandaag',
	'prayers.rosary.todayHeading': 'De geheimen van vandaag',
	'prayers.rosary.openingPrayer': 'Openingsgebed',
	'prayers.rosary.decadePrayers': 'De gebeden van een tientje',
	'ref.tooltip.loading': 'Bezig…',
	'ref.tooltip.openCcc': 'Openen in Catechismus',
	'ref.tooltip.openBible': 'Openen in Bijbel',
	'ref.tooltip.openCompendium': 'Openen in Compendium',
	'ref.preview.open': 'Openen',
	'ref.cf': 'vgl.',
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
	'bookmark.about': 'Over deze bladwijzers',
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
	'colophon.privacyTitle': 'Privacy',
	'colophon.privacyBody1':
		'Geen accounts, geen cookies, geen reclame, geen code van derden. Niets hier volgt u van deze site af.',
	'colophon.privacyBody2':
		'Wij tellen wel hoe de site gebruikt wordt: één meting per bezoek, elk veld een bereik in plaats van een waarde — hoe lang u bleef, hoe vaak u hier al geweest bent, welke werken u geopend hebt. Uw land wordt apart geteld, zonder enige koppeling aan de rest. Het beschrijft een bezoek, geen bezoeker, en wordt {days} dagen bewaard.',
	'colophon.privacyBody3':
		'Nooit verzonden: wat u in het zoekvak typt, welke passage u open had, of iets waarmee uw apparaat opnieuw herkend zou kunnen worden. Uw instellingen, bladwijzers en gedownloade teksten blijven op uw apparaat.',
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
	'plates.scansBy': 'Scans aangeleverd door',
	'plates.enlarge': '{title} vergroten',
	'plates.zoom': 'Zoomen',
	'art.about': 'Over deze afbeelding',
	'art.detail': 'detail',
	'colophon.typeTitle': 'De letter',
	'colophon.typeBody':
		'Gezet uit EB Garamond, de herleving door Georg Duffner en Octavio Pardo van de letters die Claude Garamont in de jaren 1590 sneed — de humanistische traditie waarin de Kerk sinds de Renaissance drukt. Het cyrillisch is van dezelfde handen maar herleeft niets: er is nooit een cyrillische Garamond gesneden, dus het Russisch is gezet in een vorm die getekend is om naast de rest te staan.',
	'colophon.typeArabic':
		'Het Arabisch gaat daar geheel aan voorbij en is gezet uit Amiri — de herleving door Khaled Hosny van het naskh dat in 1905 voor de Bulaq-pers in Caïro werd gesneden, gekozen op dezelfde grond als de tekstletter: een bepaalde historische boekletter in plaats van een hedendaagse tekening.',
	'colophon.typeInitials':
		'De openingsinitialen zijn Pirata One, een gebroken schrift waarvan de kapitalen leesbaar blijven op de grootte die een initiaal vraagt, en — voor het Russisch — Ponomar, dat de kerkslavische letter van de Synodale Drukkerij weergeeft. Ponomar zet de initiaal en nooit de tekst: een moderne encycliek geheel in synodale letter zou iets onwaars zeggen over wat zij is. Alle zijn gelicentieerd onder de SIL Open Font License en worden vanaf deze site geleverd in plaats van door een derde partij, zodat het lezen van een pagina niets vraagt van andermans server.',
	'refs.citedIn': 'Aangehaald in',
	'refs.externalVolume': 'Deel {volume} op {host} — gescande PDF',
	'bible.wholeChapter': 'Dit hoofdstuk',
	'bible.verseNotInEdition':
		'Dit versnummer komt niet voor in deze uitgave — zie de aantekening in de broncode van de pagina',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Aantekening',
	'bible.noteMissing': 'Deze aantekening ontbreekt in het corpus',
	'bible.chapterArgument': 'Argument',
	'ccc.readFullChapter': 'Lees het volledige hoofdstuk',
	'ccc.noParagraphNumber': 'Geen paragraafnummer in dit corpus',
	'copyright.sourceTitle': 'De oorspronkelijke bronpagina openen',
	'copyright.sourceLabel': 'Bron',
	'lang.label': 'Taal',
	'lang.filter': 'Talen zoeken',
	'lang.more': 'meer talen',
	'notFound.title': 'Niets op dit adres',
	'notFound.lede': 'De pagina die u zocht, staat hier niet.',
	'notFound.body':
		'De koppeling is mogelijk verkeerd getypt of verouderd, of zij verwijst naar een tekst die deze site niet heeft.',
	'notFound.searchHint':
		'Als u de verwijzing kent die u zoekt — een boek en hoofdstuk, een paragraaf van de Catechismus — typ die dan in het zoekvak bovenaan deze pagina.',
	'notFound.credit': 'Naar British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Of begin bij een van deze:',
	'notFound.home': 'Home',
	'compare.enter': 'Uitgaven vergelijken',
	'compare.exit': 'Vergelijking sluiten',
	'compare.missing': 'Niet aanwezig in deze uitgave',
	'compare.versificationNote':
		'Deze twee uitgaven verdelen de verzen van dit hoofdstuk op sommige plaatsen anders (een tekstvariant, geen vertaalkeuze) — hetzelfde versnummer duidt niet altijd dezelfde zin aan in beide kolommen.',
	'compare.loading': 'De tweede taal wordt geladen…',
	'ui.close': 'Sluiten',
	'shortcuts.title': 'Sneltoetsen',
	'shortcuts.betweenDocuments': 'Tussen documenten',
	'shortcuts.withinDocument': 'Binnen het document',
	'shortcuts.show': 'Toon deze lijst',
	'help.title': 'Help',
	'help.reading.heading': 'De balk boven een tekst',
	'help.feature.offline':
		'Zet de site op uw beginscherm en zij opent als een app. U kunt hele werken downloaden om zonder verbinding te lezen.',
	'help.feature.contents':
		'De indelingen van het werk waarin u bent — boeken, delen, hoofdstukken — zodat u zich erbinnen kunt bewegen zonder naar het begin terug te gaan.',
	'help.feature.compare':
		'Twee uitgaven van dezelfde plaats naast elkaar — het Latijn naast uw eigen taal, of de ene vertaling naast de andere.',
	'help.feature.apparatus':
		'De eigen noten van een uitgave, en elke commentaar op de tekst geschreven, worden ernaast aangeboden en niet eronder. Verwijzingen binnen de tekst zijn koppelingen, zodat een verwijzing gaat waar zij heen wijst.',
	'help.feature.focus':
		'Ruimt alles op behalve de tekst. De uitweg blijft waar de balk was, zodat er niets achter opgesloten raakt.',
	'zen.enter': 'Focusmodus',
	'zen.exit': 'Focusmodus verlaten',
	'nav.calendar': 'Kalender',
	'calendar.title': 'Liturgische kalender',
	'calendar.tagline':
		'De Algemene Romeinse Kalender, berekend voor elke dag — zijn tijd, zijn rang, zijn kleur.',
	'calendar.national.tagline': '{name}, met de eigen vieringen, berekend voor elke dag.',
	'calendar.calendar': 'Kalender',
	'calendar.which.general': 'Algemene Romeinse Kalender',
	'calendar.filter': 'Landen zoeken',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Amerika',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Midden-Oosten',
	'calendar.region.asia': 'Azië',
	'calendar.region.oceania': 'Oceanië',
	'calendar.today': 'Vandaag',
	'calendar.previousMonth': 'Vorige maand',
	'calendar.nextMonth': 'Volgende maand',
	'calendar.plainDays': 'Gewone weekdagen',
	'calendar.noSuchDay': 'Voor die datum wordt geen liturgische dag berekend.',
	'calendar.week': 'week',
	'calendar.alsoToday': 'Vandaag ook gevierd',
	'calendar.alsoObserved': 'Vandaag ook herdacht',
	'calendar.obligation': 'Verplichte feestdag',
	'calendar.obligationCanon': 'CIC can. 1246',
	'calendar.sundayCycle': 'Zondagscyclus',
	'calendar.weekdayCycle': 'Weekdagcyclus',
	'calendar.psalterWeek': 'Psalmweek',
	'lectionary.heading': 'Lezingen bij de mis',
	'lectionary.slot.reading': 'Lezing',
	'lectionary.slot.reading1': 'Eerste lezing',
	'lectionary.slot.reading2': 'Tweede lezing',
	'lectionary.slot.reading3': 'Derde lezing',
	'lectionary.slot.reading4': 'Vierde lezing',
	'lectionary.slot.reading5': 'Vijfde lezing',
	'lectionary.slot.reading6': 'Zesde lezing',
	'lectionary.slot.reading7': 'Zevende lezing',
	'lectionary.slot.psalm': 'Antwoordpsalm',
	'lectionary.slot.epistle': 'Epistel',
	'lectionary.slot.acclamation': 'Evangelieacclamatie',
	'lectionary.slot.gospel': 'Evangelie',
	'lectionary.slot.sequence': 'Sequentia',
	'lectionary.or': 'of',
	'lectionary.cf': 'Vgl.',
	'lectionary.about': 'Over deze lezingen',
	'lectionary.caveat':
		'De perikopen die de Ordo Lectionum Missae voorschrijft, gekoppeld aan de eigen uitgaven van deze site — niet de vertaling die in een bepaalde kerk wordt voorgelezen, en een bisschoppenconferentie kan het rooster aanpassen.',
	'calendar.transferredFrom': 'Overgebracht van',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Kersttijd',
	'calendar.season.lent': 'Veertigdagentijd',
	'calendar.season.triduum': 'Paastriduüm',
	'calendar.season.easter': 'Paastijd',
	'calendar.season.ordinary': 'Door het jaar',
	'calendar.colour.white': 'Wit',
	'calendar.colour.red': 'Rood',
	'calendar.colour.green': 'Groen',
	'calendar.colour.violet': 'Paars',
	'calendar.colour.rose': 'Roze',
	'calendar.colour.black': 'Zwart',
	'calendar.colour.blue': 'Blauw',
	'calendar.rank.solemnity': 'Hoogfeest',
	'calendar.rank.feast': 'Feest',
	'calendar.rank.memorial': 'Gedachtenis',
	'calendar.rank.optional-memorial': 'Vrije gedachtenis',
	'calendar.rank.commemoration': 'Herdenking',
	'calendar.rank.sunday': 'Zondag',
	'calendar.rank.weekday': 'Weekdag',
	'calendar.gloss.season.advent':
		'De vier weken vóór Kerstmis: voorbereiding op de komst van de Heer, en het begin van het jaar van de Kerk.',
	'calendar.gloss.season.christmas':
		'Van Kerstmis tot de Doop van de Heer, waarin de geboorte van de Heer en zijn verschijning aan de wereld gevierd worden.',
	'calendar.gloss.season.lent':
		'De veertig dagen van Aswoensdag tot de avondmis van het Laatste Avondmaal: boete, aalmoes en voorbereiding op Pasen.',
	'calendar.gloss.season.triduum':
		'De drie dagen van de avond van Witte Donderdag tot de avond van Paaszondag — lijden, dood en verrijzenis van de Heer, en de top van heel het jaar.',
	'calendar.gloss.season.easter':
		'De vijftig dagen van Pasen tot Pinksteren, gevierd als één enkel feest — „één grote zondag”.',
	'calendar.gloss.season.ordinary':
		'De drieëndertig of vierendertig weken buiten de andere tijden. Niet „gewoon” maar geordend: de weken worden geteld, en de Kerk leest het leven en het onderricht van de Heer doorlopend. Hij komt in twee stukken — na de kersttijd tot de veertigdagentijd, en na Pinksteren tot de advent.',
	'calendar.gloss.rank.solemnity':
		'De hoogste rang: Pasen, Kerstmis, Hemelvaart, de patroon van een plaats. Gevierd met Gloria en Credo, en beginnend op de vooravond.',
	'calendar.gloss.rank.feast':
		'Gevierd binnen de dag zelf. De apostelen en evangelisten, en de grotere dagen van de Heer en van Onze-Lieve-Vrouw.',
	'calendar.gloss.rank.memorial':
		'Een heilige die op zijn of haar dag herdacht wordt, binnen de mis en het officie van de tijd. Verplicht waar zij gevierd wordt.',
	'calendar.gloss.rank.optional-memorial':
		'Mag gevierd worden of niet, naar keuze van de priester of de gemeenschap. Wordt zij niet gevierd, dan is de dag eenvoudig de weekdag.',
	'calendar.gloss.rank.commemoration':
		'Wat een gedachtenis in de veertigdagentijd wordt: een gebed toegevoegd aan de mis van de weekdag, die de tijd voor het overige heel laat.',
	'calendar.gloss.rank.sunday':
		'Het oorspronkelijke feest — de dag des Heren, elke week gevierd sinds de verrijzenis. Alleen een hoogfeest of een feest van de Heer mag hem verdringen, en in de advent, de veertigdagentijd en de paastijd zelfs die niet.',
	'calendar.gloss.rank.weekday':
		'Een dag zonder eigen viering. De mis en het officie zijn die van de tijd, wat de tijd de moeite van het kennen waard maakt.',
	'calendar.gloss.colour.white':
		'Vreugde. Paastijd en kersttijd, de dagen van de Heer buiten zijn lijden, Onze-Lieve-Vrouw, de engelen, en de heiligen die geen martelaar waren.',
	'calendar.gloss.colour.red':
		'Bloed en vuur. Palmzondag en Goede Vrijdag, Pinksteren, de apostelen en evangelisten, en de martelaren.',
	'calendar.gloss.colour.green': 'De tijd door het jaar: de kleur van de hoop en van wat groeit.',
	'calendar.gloss.colour.violet':
		'Advent en veertigdagentijd, en ook gedragen in missen voor de overledenen.',
	'calendar.gloss.colour.rose':
		'Tweemaal per jaar gedragen — op zondag Gaudete, de derde van de advent, en op zondag Laetare, de vierde van de veertigdagentijd — waar het vasten lichter wordt en het einde in zicht komt.',
	'calendar.gloss.colour.black': 'Mag gedragen worden in missen voor de overledenen.',
	'calendar.gloss.colour.blue':
		'Het voorrecht van het blauw: gedragen op Onbevlekte Ontvangenis in Spanje, op de Filipijnen en in de weinige andere plaatsen waaraan de Heilige Stoel het verleend heeft.',
	'calendar.gloss.sundayCycle':
		'De zondagslezingen lopen over drie jaar — A, B en C — waarin om beurten Matteüs, Marcus en Lucas gelezen worden, met Johannes door de veertigdagentijd en de paastijd. De cyclus wisselt op de eerste zondag van de advent, met het jaar van de Kerk.',
	'calendar.gloss.weekdayCycle':
		'De weekdaglezingen lopen over twee jaar, I en II: de eerste lezing verandert, het evangelie niet. Een liturgisch jaar heet naar het kalenderjaar waarin het eindigt — oneven jaren zijn I, even jaren II.',
	'calendar.gloss.psalterWeek':
		'Het getijdengebed verdeelt de psalmen over vier weken, I tot IV, die zich door het jaar heen herhalen. Dit is de week wier psalmen die van vandaag zijn, voor wie de getijden bidt.',
	'calendar.gloss.obligation':
		'Een dag waarop de gelovigen gehouden zijn aan de mis deel te nemen en zich te onthouden van werk dat hen zou verhinderen. Elke zondag, en de overige dagen die elke bisschoppenconferentie heeft vastgesteld.',
	'calendar.primer.title': 'Nieuw hier?',
	'calendar.primer.lead':
		'De Kerk houdt een eigen jaar. Het begint met de advent, draait om Pasen, en geeft elke dag een naam, een rang en een kleur — en die bepalen wat er die dag gebeden en gelezen wordt in de mis en in het getijdengebed. Zo is „drieëntwintigste zondag door het jaar” een adres: het zegt een priester, een koor of wie thuis bidt welke gebeden en lezingen bij vandaag horen.',
	'calendar.primer.seasons': 'De tijden',
	'calendar.primer.ranks': 'Wat een dag kan zijn',
	'calendar.primer.colours': 'De kleuren',
	'calendar.primer.cycles': 'De cycli',
	'calendar.primer.cyclesLead':
		'Drie tellers die samen zeggen welke lezingen en psalmen voor vandaag bestemd zijn.'
};
