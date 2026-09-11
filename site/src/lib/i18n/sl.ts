/**
 * Slovenian UI strings.
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

export const sl: Dictionary = {
	'nav.bible': 'Sveto pismo',
	'nav.ccc': 'Katekizem',
	'nav.compendium': 'Kompendij',
	'nav.magisterium': 'Učiteljstvo',
	'nav.socialDoctrine': 'Družbeni nauk',
	'socialDoctrine.landing.title': 'Kompendij družbenega nauka Cerkve',
	'socialDoctrine.landing.tagline': 'Kaj Cerkev uči o življenju v družbi, v 583 številkah.',
	'nav.canonLaw': 'Kanonsko pravo',
	'canonLaw.landing.title': 'Zakonik cerkvenega prava',
	'canonLaw.landing.tagline': 'Pravo latinske Cerkve v 1752 kanonih v sedmih knjigah.',
	'canonLaw.canon': 'Kan.',
	'canonLaw.canons': 'Kan.',
	'canonLaw.prevCanon': 'Prejšnji kanon',
	'canonLaw.nextCanon': 'Naslednji kanon',
	'canonLaw.readFullTitle': 'Preberi celoten naslov',
	'canonLaw.superseded': 'Besedilo nadomeščeno z',
	'nav.prayers': 'Molitve',
	'nav.bookmarks': 'Zaznamki',
	'nav.menu': 'Meni',
	'nav.sections': 'Razdelki',
	'nav.works': 'Dela',
	'nav.pages': 'Strani',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Nadaljujte branje',
	'home.tagline':
		'Bralno spletišče za Sveto pismo, katekizem in dokumente učiteljstva — brezplačno, deluje tudi brez povezave in nikamor se ni treba vpisati.',
	'home.doors.heading': 'Kam naprej',
	'nav.library': 'Knjižnica',
	'nav.learn': 'Učenje',
	'library.landing.tagline':
		'Celotna zbirka, polica za polico — z mestom, kjer ste ostali, in tem, kar ste označili.',
	'schola.landing.title': 'Kje začeti',
	'schola.landing.tagline':
		'Kratek vodnik po tem, kar je tu: kaj je vsaka od teh knjig, deset božjih zapovedi in drugi seznami, ki naj bi jih poznal vsak katoličan, in kje začeti brati.',
	'schola.start.heading': 'Novi v katolištvu?',
	'schola.start.body': 'Najboljši začetek je ',
	'schola.start.bodyAfter':
		': isti nauk kakor v katekizmu, veliko krajši, zapisan v vprašanjih in odgovorih. Obsega približno desetino in ničesar ne predpostavlja.',
	'schola.bible.heading': 'Svetega pisma niste nikoli brali?',
	'schola.bible.library':
		'Ni ena knjiga, ampak triinsedemdeset, pisanih čez več kakor tisoč let in zbranih v redu, ki ga je določila Cerkev — ne v redu, po katerem so se stvari zgodile, in ne v tistem, ki se najlaže bere. Večina začne na prvi strani in neha nekaj tednov pozneje, sredi dolgega poglavja starodavnega zakona, ker jim še nihče ni povedal, čemu je to.',
	'schola.bible.step.gospel': 'Začnite z evangelijem',
	'schola.bible.start':
		'Ena od štirih kratkih knjig o Jezusovem življenju, globoko znotraj in ne spredaj. Zamisel ni naša: cerkveni koncil je prosil, naj se uči prava raba Svetega pisma, »zlasti Nove zaveze in predvsem evangelijev«. Nobenega ni imenoval posebej, in tudi mi ga ne bomo.',
	'schola.bible.whichGospel':
		'Trije se navadno predlagajo, iz treh različnih razlogov. Kateri koli od njih je dober kraj, kjer biti.',
	'schola.bible.gospel.mark':
		'Najkrajši. Preberete ga lahko v celoti v enem popoldnevu, in na začetku je več vredno enega končati kakor izbrati najboljšega.',
	'schola.bible.gospel.luke':
		'Napisan za nekoga zunaj vere, ki je hotel zgodbo zapisano po vrsti — kar ste morda prav vi. Nadaljuje se naravnost v Apostolska dela, tako da je v resnici prva polovica daljše knjige.',
	'schola.bible.gospel.john':
		'Tisti, ki naravnost pove, zakaj je bil napisan: »da bi verovali«. Preproste besede, in gre naravnost k vprašanju, kdo je Jezus.',
	'schola.bible.step.acts': 'Nato, kaj se je zgodilo potem',
	'schola.bible.thenActs':
		'Ko boste enega končali, preberite, kaj so po njegovem odhodu storili tisti, ki so ga poznali.',
	'schola.bible.acts.why':
		'Trideset let po koncu evangelijev: nekaj deset prestrašenih ljudi, in to, kako je tisto, kar so videli, prišlo na drugi konec cesarstva.',
	'schola.bible.step.old': 'Nato starejša polovica',
	'schola.bible.thenOld':
		'Ne od prve strani in ne vsa. Nekaj mest nosi pripoved, in prav nanje evangeliji vedno znova kažejo nazaj.',
	'schola.bible.ot.beginnings': 'Kako se začne in kako gre narobe.',
	'schola.bible.ot.promise': 'Ena družina in obljuba, dana njej, ki preživi vse v njej.',
	'schola.bible.ot.exodus':
		'Ljudstvo, izpeljano iz sužnosti, in postava, dana mu, da bi po njej živelo.',
	'schola.bible.ot.psalms':
		'Ne pripoved: sto petdeset molitev in pesmi. Berite po eno, v poljubnem redu. Cerkev jih moli vsak dan še danes.',
	'schola.bible.bothWays':
		'Marsikaj boste prepoznali, in prav to je namen, ne naključje. Cerkev bere starejše knjige v luči Kristusa in novejše v luči tega, kar je bilo prej — vsaka polovica pojasnjuje drugo, in zato se nobena ne bere sama.',
	'schola.books.heading': 'Kaj je tu',
	'schola.what.scripture':
		'Sveto pismo, kakor ga Cerkev prejema, v obeh zavezah. Vse drugo tu se bere v njegovi luči.',
	'schola.what.catechism':
		'Povzetek tega, kar katoliška Cerkev veruje, v enem zvezku. Sam ni vir: zbira Sveto pismo, očete, bogoslužje in nauk Cerkve, in vsak člen pove, od kod je tisto, kar trdi.',
	'schola.what.compendium':
		'Isti nauk, podan v vprašanjih in odgovorih, v približno desetini obsega.',
	'schola.what.magisterium':
		'Kar so papeži in koncili dejansko napisali — okrožnice, konstitucije, odloki, izjave — vsak naslovljen na določen trenutek in določeno vprašanje. Vsak je znan po svojih začetnih latinskih besedah.',
	'schola.what.social':
		'Nauk Cerkve o delu, lastnini, družini, politiki in miru, zbran iz teh dokumentov v eno knjigo.',
	'schola.what.law': 'Pravo in ne nauk. Pove, kaj Cerkev zahteva, in se spreminja.',
	'schola.what.doctors':
		'Teologi, ki jih je Cerkev razglasila za učitelje. Ne nosi nobene uradne avtoritete, naj bo pisec še tako velik.',
	'schola.what.prayers': 'Besede, s katerimi Cerkev moli, z latinščino ob njih.',
	'schola.places.heading': 'Ne besedila, ampak kraji na tem spletišču',
	'schola.what.library':
		'Vsa dela spletišča v enem seznamu, razvrščena po predmetu in ne po vrsti.',
	'schola.what.questions':
		'Vstop za bralca, ki ima vprašanje, ne pa navedbe. Vsako vprašanje zbere odlomke, ki nanj odgovarjajo — najprej iz Katekizma — in vsaka beseda v njih je Cerkve same.',
	'schola.what.calendar':
		'Bogoslužni dan — čas, barva in kdo se obhaja — za deželo, katere koledar se držite.',
	'schola.what.bookmarks':
		'Odlomki, ki ste jih označili, in kje ste nazadnje ostali pri vsakem delu. Oboje ostaja v tem brskalniku in se nikamor ne pošilja.',
	'schola.what.census':
		'Kaj hrani ta knjižnica in kako daleč sega — koliko del, v katerih jezikih, in koliko od vsakega dela je bralcu v njegovem jeziku dejansko dosegljivo.',
	'schola.formulas.decalogue': 'Deset božjih zapovedi',
	'ccc.noCounterpart': 'Ni ustreznika v drugem delu',
	'jumpbox.placeholder': 'Skoči na… (npr. janez 3,16, ccc 1234)',
	'jumpbox.short': 'Iskanje',
	'jumpbox.hint': 'Pritisnite / ali Ctrl+K za skok na navedbo',
	'jumpbox.noMatch': 'Ni zadetkov',
	'jumpbox.suggestions': 'Predlogi',
	'settings.label': 'Nastavitve',
	'apparatus.label': 'Aparat',
	'apparatus.editionNotes': 'Opombe te izdaje',
	'apparatus.commentary': 'Komentar',
	'apparatus.inCommentary': 'Vključeno v komentar zgoraj.',
	'darkMode.label': 'Temni način',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Vklop',
	'darkMode.off': 'Izklop',
	'sepia.label': 'Sepija',
	'sepia.lightOnly': 'Le v svetlem',
	'sepia.noHue': 'Ne v mono',
	'oled.label': 'Črna OLED',
	'oled.darkOnly': 'Le v temnem',
	'mono.label': 'Enobarvno',
	'mono.hint':
		'Vso stran postavi v en sam sivi ton, tako da barva ničesar ne loči. Dokler je vklopljeno, je sepija izklopljena.',
	'advanced.label': 'Napredno',
	'library.title': 'Knjižnica brez povezave',
	'library.lede': 'Besedila, shranjena v tej napravi, se odprejo povsem brez omrežja.',
	'library.essentials': 'Molitve in Kompendij',
	'library.illustrations': 'Biblija (ilustracije)',
	'library.illustrationsDetail': 'Biblija (ilustracije, visoka ločljivost)',
	'library.other': 'Druga besedila',
	'library.everything': 'Vse',
	'library.downloadAll': 'Prenesi vse',
	'library.download': 'Prenesi',
	'library.downloaded': 'V tej napravi',
	'library.offlineNote': 'Izklopite način brez povezave za prenos.',
	'library.remove': 'Odstrani iz te naprave',
	'library.removeConfirm': 'Odstranim?',
	'library.forget': 'Odstrani prenose',
	'library.forgetConfirm': 'Odstranim vse?',
	'offline.label': 'Način brez povezave',
	'offline.hint':
		'Sploh ne uporablja omrežja: nič se ne prenese, posodobitve se ne preverjajo, nič se ne meri. Odprejo se samo besedila, ki so že v tej napravi.',
	'offline.notDownloaded': 'Ni v tej napravi',
	'loadFailed.title': 'To se ni naložilo',
	'loadFailed.hint':
		'Stran obstaja — pri njenem pridobivanju je šlo nekaj narobe. Ponoven poskus običajno uspe.',
	'loadFailed.retry': 'Poskusite znova',
	'loadFailed.retrying': 'Poskus…',
	'offline.turnOff': 'Izklopi način brez povezave',

	'type.label': 'Velikost besedila in pisava',
	'fontSize.label': 'Velikost besedila',
	'fontSize.small': 'Majhno',
	'fontSize.medium': 'Srednje',
	'fontSize.large': 'Veliko',
	'fontSize.xlarge': 'Zelo veliko',
	'fontSize.xxlarge': 'Največje',
	'face.label': 'Pisava',
	'face.serif': 'Serifna',
	'face.sans': 'Neserifna',
	'print.label': 'Natisnite to stran',
	'toTop.label': 'Nazaj na vrh',
	'install.label': 'Namestite Glosso',
	'install.hint.label': 'Dodaj na začetni zaslon',
	'install.hint.title': 'Dodajte Glosso na začetni zaslon',
	'install.hint.stepBefore': 'Odpre se kot aplikacija in se bere brez povezave. Tapnite',
	'install.hint.stepAfter': 'nato »Dodaj na začetni zaslon«.',
	'install.hint.dismiss': 'Zapri',
	'update.label': 'Na voljo je nova izdaja',
	'update.title': 'Nova izdaja je pripravljena',
	'update.body': 'Znova naložite stran, da dobite najnovejša besedila in popravke.',
	'update.action': 'Znova naloži',
	'update.dismiss': 'Ne zdaj',
	'edition.label': 'Izdaja',
	'edition.select': 'Izberite izdajo',
	'edition.current': 'Trenutna izdaja',
	'edition.filter': 'Iskanje izdaj',
	'menu.noMatches': 'Ni zadetkov',
	'unitNav.previous': 'Nazaj',
	'unitNav.next': 'Naprej',
	'bible.prevChapter': 'Prejšnje poglavje',
	'bible.nextChapter': 'Naslednje poglavje',
	'bible.pickBook': 'Knjige in poglavja',
	'bible.landing.title': 'Sveto pismo',
	'bible.landing.tagline':
		'Preberite celotno Sveto pismo, knjigo za knjigo, poglavje za poglavjem.',
	'bible.landing.random': 'Počutim se srečnega',
	'bible.chapterUnavailable': 'V tej izdaji ni na voljo',
	'bible.introduction': 'Uvod',
	'bible.introUnavailable': 'V tem jeziku uvoda še ni',
	'bible.introSource': 'Uvodi niso del svetopisemskega besedila.',
	'bible.testament.ot': 'Stara zaveza',
	'bible.testament.nt': 'Nova zaveza',
	'bible.group.pentateuch': 'Peteroknjižje',
	'bible.group.historical': 'Zgodovinske knjige',
	'bible.group.wisdom': 'Modrostne knjige',
	'bible.group.prophetic': 'Preroške knjige',
	'bible.group.gospels': 'Evangeliji',
	'bible.group.acts': 'Apostolska dela',
	'bible.group.pauline': 'Pisma svetega Pavla',
	'bible.group.catholicLetters': 'Katoliška pisma',
	'bible.group.revelation': 'Razodetje',
	'ccc.prevParagraph': 'Prejšnji odstavek',
	'ccc.nextParagraph': 'Naslednji odstavek',
	'ccc.inBrief': 'Na kratko',
	'ccc.landing.title': 'Katekizem katoliške Cerkve',
	'ccc.landing.pairTitle': 'Katekizem in Kompendij',
	'ccc.landing.tagline':
		'<strong>Katekizem</strong> predstavlja katoliški nauk v 2865 oštevilčenih členih. <strong>Kompendij</strong> isti nauk podaja v 598 vprašanjih in odgovorih, po isti razčlenitvi.',
	'ccc.landing.pairTagline':
		'Katekizem katoliške Cerkve v 2865 členih in njegov Kompendij v 598 vprašanjih.',
	'ccc.tableOfContents': 'Kazalo',
	'ccc.related': 'Glej tudi',
	'compendium.landing.title': 'Kompendij katekizma',
	'compendium.landing.tagline': 'Vprašanja in odgovori, ki povzemajo Katekizem katoliške Cerkve.',
	'compendium.question': 'Vprašanje',
	'compendium.answer': 'Odgovor',
	'compendium.tableOfContents': 'Kazalo',
	'compendium.prevQuestion': 'Prejšnje vprašanje',
	'compendium.nextQuestion': 'Naslednje vprašanje',
	'compendium.condenses': 'Povzema KKC ¶¶',
	'ccc.abbrev': 'KKC',
	'ccc.condensedIn': 'V Kompendiju',
	'compendium.abbrev': 'Komp.',
	'compendium.noQuestionNumber': 'V tem korpusu ni številke vprašanja',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Cerkveni učitelji',
	'doctores.landing.tagline': 'Teološka dela cerkvenih očetov in učiteljev.',
	'summa.landing.title': 'Summa theologiae',
	'summa.landing.tagline': 'Tomaž Akvinski, v angleščini in v latinščini, v kateri je pisal.',
	'summa.tableOfContents': 'Kazalo',
	'summa.part': 'Del',
	'summa.question': 'Vprašanje',
	'summa.article': 'Člen',
	'summa.questionShort': 'Vpr.',
	'summa.articleShort': 'Čl.',
	'summa.titleFromEdition': 'Naslov iz izdaje v jeziku {lang}',
	'summa.titlesFromEdition': 'Naslovi iz izdaje v jeziku {lang} — ta izdaja jih nima',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Ugovor',
	'summa.sedContra': 'Nasprotno',
	'summa.corpus': 'Odgovarjam',
	'summa.reply': 'Odgovor na ugovor',
	'summa.preamble': 'Opomba',
	'summa.prevQuestion': 'Prejšnje vprašanje',
	'summa.nextQuestion': 'Naslednje vprašanje',
	'summa.noEditionInYourLanguage':
		'Summa nima izdaje v vašem jeziku. Prikazana je izdaja v jeziku {lang}.',
	'summa.noLatinSupplement':
		'Supplementum obstaja samo v angleščini — sestavljen je bil po Tomaževi smrti.',
	'index.division': 'Razdelitev',
	'index.showSubsections': 'Pokaži podpoglavja',
	'index.hideSubsections': 'Skrij podpoglavja',
	'prayers.landing.title': 'Molitve',
	'prayers.landing.tagline': 'Molitve z latinskim besedilom ob strani.',
	'prayers.gloss.versicle':
		'Vrstica, ki jo tisti, ki vodi molitev, izgovori ali zapoje sam; zbrani mu odgovorijo z odgovorom, ki sledi.',
	'prayers.gloss.response':
		'Vrstica, ki jo zbrani izgovorijo ali zapojejo skupaj, v odgovor na vrstico voditelja pred njo.',
	'prayers.tableOfContents': 'Kazalo',
	'prayers.seeAlso': 'Glej tudi',
	'prayers.prevPrayer': 'Prejšnja molitev',
	'prayers.nextPrayer': 'Naslednja molitev',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Danes',
	'prayers.rosary.todayHeading': 'Današnje skrivnosti',
	'prayers.rosary.openingPrayer': 'Uvodna molitev',
	'prayers.rosary.decadePrayers': 'Molitve ene desetke',
	'ref.tooltip.loading': 'Nalaganje…',
	'ref.tooltip.openCcc': 'Odpri v katekizmu',
	'ref.tooltip.openBible': 'Odpri v Svetem pismu',
	'ref.tooltip.openCompendium': 'Odpri v kompendiju',
	'ref.preview.open': 'Odpri',
	'ref.cf': 'prim.',
	'anchor.actions': 'Dejanja za navedbo',
	'anchor.copy': 'Kopiraj besedilo',
	'anchor.copyLink': 'Kopiraj povezavo',
	'anchor.view': 'Poglej',
	'anchor.copied': 'Kopirano',
	'anchor.copyFailed': 'Kopiranje ni uspelo',
	'bookmark.add': 'Zaznamek',
	'bookmark.remove': 'Odstrani zaznamek',
	'bookmark.library': 'Zaznamki',
	'bookmark.library.tagline': 'Vse, kar ste označili med branjem.',
	'bookmark.empty': 'Še nič ni označeno.',
	'bookmark.emptyHint':
		'Kliknite številko vrstice ali odstavka in izberite Zaznamek ali pa uporabite gumb za zaznamek na strani.',
	'bookmark.about': 'O teh zaznamkih',
	'bookmark.deviceOnly':
		'Zaznamki ostanejo samo v tem brskalniku. Nikamor jih ne pošiljamo, izbris podatkov brskalnika pa jih odstrani.',
	'bookmark.unavailable': 'Ni v izdaji, ki jo berete',
	'document.library.tagline': 'Okrožnice, koncilske konstitucije, odloki in izjave učiteljstva.',
	'document.filter.heading': 'Filtri',
	'document.filter.author': 'Avtor',
	'document.filter.kind': 'Vrsta',
	'document.filter.subject': 'Tema',
	'document.filter.search': 'Iskanje dokumentov',
	'document.filter.clear': 'Počisti',
	'document.filter.results': 'Prikazani dokumenti',
	'document.filter.noResults': 'Noben dokument ne ustreza tem filtrom.',
	'document.tableOfContents': 'Kazalo',
	'document.startReading': 'Začnite brati',
	'document.readFullDocument': 'Preberite celoten dokument',
	'document.section': 'Razdelek',
	'document.prevSection': 'Nazaj',
	'document.nextSection': 'Naprej',
	'document.kind.conciliarConstitution': 'Konstitucija',
	'document.kind.conciliarDecree': 'Odlok',
	'document.kind.conciliarDeclaration': 'Izjava',
	'document.kind.encyclical': 'Okrožnica',
	'document.kind.apostolicExhortation': 'Apostolska spodbuda',
	'document.kind.apostolicConstitution': 'Apostolska konstitucija',
	'document.kind.apostolicLetter': 'Apostolsko pismo',
	'document.kind.cdfDeclaration': 'Izjava Kongregacije za nauk vere',
	'document.kind.cdfInstruction': 'Navodilo Kongregacije za nauk vere',
	'document.kind.cdfLetter': 'Pismo Kongregacije za nauk vere',
	'document.kind.cdfDoctrinalNote': 'Doktrinarna nota Kongregacije za nauk vere',
	'document.kind.cdfResponsum': 'Responsum Kongregacije za nauk vere',
	'document.kind.cdfConsiderations': 'Premisleki Kongregacije za nauk vere',
	'document.kindPlural.conciliarConstitution': 'Konstitucije',
	'document.kindPlural.conciliarDecree': 'Odloki',
	'document.kindPlural.conciliarDeclaration': 'Izjave',
	'document.kindPlural.encyclical': 'Okrožnice',
	'document.kindPlural.apostolicExhortation': 'Apostolske spodbude',
	'document.kindPlural.apostolicConstitution': 'Apostolske konstitucije',
	'document.kindPlural.apostolicLetter': 'Apostolska pisma',
	'document.kindPlural.cdfDeclaration': 'Izjave Kongregacije za nauk vere',
	'citation.unavailable': 'Za to opombo izvirno besedilo ni na voljo.',
	'colophon.title': 'Kolofon',
	'colophon.lede':
		'Kaj je to spletišče, od kod so njegova besedila in kako gledamo na njihovo objavljanje.',
	'colophon.whatThisIs': 'Kaj je to',
	'colophon.whatThisIsBody':
		'Glossa Catholica je bralno spletišče za Sveto pismo, katekizem, kompendij in dokumente učiteljstva, v angleščini, portugalščini in latinščini. Obstaja zato, da se bere, in za branje se od vas ne zahteva nič drugega:',
	'colophon.pointFree':
		'Brezplačno in vedno brezplačno. Brez plačljivega zidu, brez naročnine, ničesar ni treba kupiti.',
	'colophon.pointNoAds': 'Brez oglasov in brez kakršnega koli sponzoriranega umeščanja.',
	'colophon.pointNoAccounts': 'Brez računov. Nikamor se ni treba vpisati, nikamor prijaviti.',
	'colophon.pointNoTracking':
		'Brez sledilnih skriptov, brez kode tretjih oseb, brez piškotkov. Le anonimna štetja uporabe, nič, kar bi vas identificiralo.',
	'colophon.pointOffline':
		'Zgrajeno tako, da po enem obisku deluje tudi brez povezave, da slaba povezava ne bi bila ovira za branje.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica je zasebna pobuda laiških vernikov. Nima nobene cerkvene odobritve in ne govori z lastno avtoriteto.',
	'footer.notEndorsed': 'Brez odobritve Svetega sedeža',
	'colophon.textsTitle': 'Besedila',
	'colophon.textsBody':
		'Vsako besedilo prihaja iz imenovanega vira, vsako delo pa beleži svojo izdajo, izvorno stran in datum prevzema. Sveto pismo uporablja prevode v javni lasti; katekizem, kompendij in dokumenti učiteljstva prihajajo iz besedil, ki jih je objavil Sveti sedež sam.',
	'colophon.textsFidelity':
		'Besedilo nikoli ni okrajšano, nikoli parafrazirano, nikoli na novo napisano in nikoli postavljeno ob oglas. Očitne napake pa popravljamo — izpadlo besedo, popačeno navedbo, oznake, ki so požrle odstavek — vselej v smeri tega, kar vir sam tiska, nikoli v smeri tega, kar bi po našem mnenju moralo pisati.',
	'colophon.textsLanguages':
		'Vmesnik seže dlje kakor knjižnica. Kjer Svetega pisma nimamo v jeziku, v katerem berete, je besedilo prikazano v najbližjem jeziku, ki ga imamo, običajno v angleščini; delo, ki ga berete, vselej pove, katera izdaja je.',
	'colophon.textsLanguagesBlocked':
		'Pri treh od njih to ni vprašanje časa. Katoliškega Svetega pisma v švedščini, ki bi bilo prosto avtorskih pravic, ni bilo nikoli — proste švedske različice so luteranske in se od latinščine ločijo prav pri tistih vrsticah, kjer je razlika pomembna. Slovenščina in arabščina imata vsaka svoje katoliško Sveto pismo, dovolj staro, da je prosto, a nobeno se ni ohranilo drugače kakor v fotografijah svojih strani.',
	'colophon.countBible': 'svetopisemskih izdaj',
	'colophon.countDocuments': 'dokumentov učiteljstva',
	'colophon.privacyTitle': 'Zasebnost',
	'colophon.privacyBody1':
		'Brez računov, piškotkov, oglaševanja in kode tretjih oseb. Nič tukaj vas ne spremlja zunaj tega spletišča.',
	'colophon.privacyBody2':
		'Štejemo, kako je spletišče uporabljeno: ena meritev na obisk, vsako polje razpon in ne vrednost — kako dolgo ste ostali, kako pogosto ste že bili tu, katera dela ste odprli. Vaša država se šteje ločeno, brez povezave z ostalim. Opisuje obisk, ne obiskovalca, in se hrani {days} dni.',
	'colophon.privacyBody3':
		'Nikoli ne pošljemo: kaj vtipkate v iskalno polje, kateri odlomek ste imeli odprt, ali karkoli, kar bi lahko znova prepoznalo vašo napravo. Vaše nastavitve, zaznamki in preneseno besedilo ostanejo na vaši napravi.',
	'colophon.copyrightTitle': 'Avtorske pravice',
	'colophon.copyrightBody1':
		'Katekizem, kompendij in dokumenti učiteljstva so last svojih imetnikov pravic — predvsem Libreria Editrice Vaticana in Dikasterija za komunikacijo.',
	'colophon.copyrightBody2':
		'Vsako delo prikazuje avtorskopravno obvestilo svojega imetnika pravic, v njegovem besedilu, in se sklicuje na stran, s katere je bilo vzeto.',
	'colophon.copyrightBody3':
		'Če imate pravice na katerem koli besedilu tukaj in bi raje videli, da ni objavljeno, nam pišite.',
	'colophon.contactTitle': 'Stik',
	'colophon.contactBody': 'Za kar koli, tudi za zgornje:',
	'colophon.contactPending':
		'Naslov za stik še ni določen. To spletišče ne bi smelo postati javno, dokler ga nima — zgornja zaveza brez poti do nas ne pomeni nič.',
	'colophon.illustrationsTitle': 'Ilustracije',
	'colophon.illustrationsBody':
		'Sveto pismo nosi grafike Gustava Doréja, vsako pri vrstici, ki jo upodablja — zadnji in največji med njegovimi svetopisemskimi cikli: po njegovih risbah vrezan v les in natisnjen z besedilom, ne zbran na koncu knjige.',
	'colophon.illustrationsRights':
		'So v javni lasti, kakor kažejo letnice spodaj, in zvesta fotografska reprodukcija grafike v javni lasti ne ustvari nove avtorske pravice.',
	'colophon.countPlates': 'grafik',
	'colophon.countPlateChapters': 'ilustriranih poglavij',
	'plates.scansBy': 'Skene je omogočil',
	'plates.enlarge': 'Povečaj {title}',
	'plates.zoom': 'Povečava',
	'art.about': 'O tej sliki',
	'art.detail': 'izsek',
	'colophon.typeTitle': 'Črke',
	'colophon.typeBody':
		'Stavljeno v EB Garamond, obuditvi črk, ki jih je v devetdesetih letih 16. stoletja rezal Claude Garamont, izpod rok Georga Duffnerja in Octavia Parda — v humanistični tradiciji, v kateri Cerkev tiska že od renesanse. Njegova cirilica je izpod istih rok, a ne obuja ničesar: cirilskega Garamonda ni nikoli nihče rezal, zato je ruščina stavljena v obliki, narisani tako, da stoji ob boku ostalemu.',
	'colophon.typeArabic':
		'Arabščina mu je povsem nedosegljiva in je stavljena v Amiri — Khaled Hosny je z njo obudil naskh, rezan za tiskarno Bulaq v Kairu leta 1905; izbran je po istem premisleku kot črka besedila: določena zgodovinska knjižna črka in ne sodobna risba.',
	'colophon.typeInitials':
		'Začetnice so Pirata One, gotica, katere verzalke ostanejo berljive v velikosti, ki jo zahteva inicialka, za ruščino pa Ponomar, ki povzema cerkvenoslovansko črko Sinodalne tiskarne. Ponomar stavi inicialko in nikoli besedila: sodobna okrožnica, v celoti stavljena v sinodalni črki, bi o sebi povedala nekaj neresničnega. Vse so pod licenco SIL Open Font License in jih streže to spletišče, ne tretja oseba, tako da branje strani ne zahteva ničesar od strežnika kogar koli drugega.',
	'refs.citedIn': 'Navedeno v',
	'refs.externalVolume': 'Zvezek {volume} na {host} — skenirani PDF',
	'bible.wholeChapter': 'To poglavje',
	'bible.verseNotInEdition': 'Te številke vrstice v tej izdaji ni — glejte opombo v viru strani',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Opomba',
	'bible.noteMissing': 'Ta opomba manjka v korpusu',
	'bible.chapterArgument': 'Povzetek',
	'ccc.readFullChapter': 'Preberite celotno poglavje',
	'ccc.noParagraphNumber': 'V tem korpusu ni številke odstavka',
	'copyright.sourceTitle': 'Odprite izvirno izvorno stran',
	'copyright.sourceLabel': 'Vir',
	'lang.label': 'Jezik',
	'lang.filter': 'Iskanje jezikov',
	'lang.more': 'več jezikov',
	'notFound.title': 'Na tem naslovu ni ničesar',
	'notFound.lede': 'Strani, ki ste jo zahtevali, ni tukaj.',
	'notFound.body':
		'Povezava je morda napačno vtipkana ali zastarela, morda pa kaže na besedilo, ki ga to spletišče nima.',
	'notFound.searchHint':
		'Če veste, katero navedbo iščete — knjigo in poglavje, odstavek katekizma —, jo vtipkajte v iskalno polje na vrhu te strani.',
	'notFound.credit': 'Po British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Ali pa začnite pri enem od teh:',
	'notFound.home': 'Domov',
	'compare.enter': 'Primerjaj izdaji',
	'compare.exit': 'Končaj primerjavo',
	'compare.missing': 'V tej izdaji ni prisotno',
	'compare.versificationNote':
		'Ti dve izdaji ponekod različno delita vrstice tega poglavja (besedilna različica, ne prevajalska odločitev) — ista številka vrstice ne označuje vedno istega stavka v obeh stolpcih.',
	'compare.loading': 'Nalaganje drugega jezika…',
	'ui.close': 'Zapri',
	'shortcuts.title': 'Bližnjice na tipkovnici',
	'shortcuts.betweenDocuments': 'Med dokumenti',
	'shortcuts.withinDocument': 'Znotraj dokumenta',
	'shortcuts.show': 'Pokaži ta seznam',
	'help.title': 'Pomoč',
	'help.reading.heading': 'Vrstica nad besedilom',
	'help.feature.offline':
		'Dodajte spletišče na začetni zaslon in odpre se kakor aplikacija. Cela dela lahko prenesete in jih berete brez povezave.',
	'help.feature.contents':
		'Razdelitve dela, v katerem ste — knjige, deli, poglavja — da se premikate po njem, ne da bi se vračali na začetek.',
	'help.feature.compare':
		'Dve izdaji istega odlomka druga ob drugi — latinščina ob vašem jeziku, ali en prevod ob drugem.',
	'help.feature.apparatus':
		'Lastne opombe izdaje in vsak komentar, napisan k besedilu, so ponujeni ob njem in ne pod njim. Navedbe znotraj besedila so povezave, tako da napotilo vodi tja, kamor kaže.',
	'help.feature.focus':
		'Počisti vse razen besedila. Izhod ostane tam, kjer je bila vrstica, da nič ne obtiči za njo.',
	'zen.enter': 'Način zbranosti',
	'zen.exit': 'Zapusti način zbranosti',
	'nav.calendar': 'Koledar',
	'calendar.title': 'Bogoslužni koledar',
	'calendar.tagline':
		'Splošni rimski koledar, izračunan za katerikoli dan — njegov čas, njegov red, njegova barva.',
	'calendar.national.tagline': '{name} z lastnimi praznovanji, izračunan za katerikoli dan.',
	'calendar.calendar': 'Koledar',
	'calendar.which.general': 'Splošni rimski koledar',
	'calendar.filter': 'Iskanje držav',
	'calendar.region.europe': 'Evropa',
	'calendar.region.americas': 'Amerike',
	'calendar.region.africa': 'Afrika',
	'calendar.region.middleEast': 'Bližnji vzhod',
	'calendar.region.asia': 'Azija',
	'calendar.region.oceania': 'Oceanija',
	'calendar.today': 'Danes',
	'calendar.previousMonth': 'Prejšnji mesec',
	'calendar.nextMonth': 'Naslednji mesec',
	'calendar.plainDays': 'Navadni delavniki',
	'calendar.noSuchDay': 'Za ta datum ni izračunanega bogoslužnega dne.',
	'calendar.week': 'teden',
	'calendar.alsoToday': 'Danes se obhaja tudi',
	'calendar.alsoObserved': 'Danes se spominjamo tudi',
	'calendar.obligation': 'Zapovedani praznik',
	'calendar.obligationCanon': 'CIC kan. 1246',
	'calendar.sundayCycle': 'Nedeljski krog',
	'calendar.weekdayCycle': 'Delavniški krog',
	'calendar.psalterWeek': 'Teden psalterija',
	'lectionary.heading': 'Berila pri maši',
	'lectionary.slot.reading': 'Berilo',
	'lectionary.slot.reading1': 'Prvo berilo',
	'lectionary.slot.reading2': 'Drugo berilo',
	'lectionary.slot.reading3': 'Tretje berilo',
	'lectionary.slot.reading4': 'Četrto berilo',
	'lectionary.slot.reading5': 'Peto berilo',
	'lectionary.slot.reading6': 'Šesto berilo',
	'lectionary.slot.reading7': 'Sedmo berilo',
	'lectionary.slot.psalm': 'Spremljevalni psalm',
	'lectionary.slot.epistle': 'Poslanica',
	'lectionary.slot.acclamation': 'Vzklik pred evangelijem',
	'lectionary.slot.gospel': 'Evangelij',
	'lectionary.slot.sequence': 'Sekvenca',
	'lectionary.or': 'ali',
	'lectionary.cf': 'Prim.',
	'lectionary.about': 'O teh berilih',
	'lectionary.caveat':
		'Odlomki, ki jih določa Ordo lectionum Missae, povezani z izdajami tega spletišča — ne s prevodom, kakor se bere v kateri koli posamezni cerkvi, škofovska konferenca pa lahko razpored prilagodi.',
	'calendar.transferredFrom': 'Prestavljeno z',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Božični čas',
	'calendar.season.lent': 'Postni čas',
	'calendar.season.triduum': 'Velikonočno tridnevje',
	'calendar.season.easter': 'Velikonočni čas',
	'calendar.season.ordinary': 'Med letom',
	'calendar.colour.white': 'Bela',
	'calendar.colour.red': 'Rdeča',
	'calendar.colour.green': 'Zelena',
	'calendar.colour.violet': 'Vijolična',
	'calendar.colour.rose': 'Rožnata',
	'calendar.colour.black': 'Črna',
	'calendar.colour.blue': 'Modra',
	'calendar.rank.solemnity': 'Slovesni praznik',
	'calendar.rank.feast': 'Praznik',
	'calendar.rank.memorial': 'Obvezni god',
	'calendar.rank.optional-memorial': 'Neobvezni god',
	'calendar.rank.commemoration': 'Spomin',
	'calendar.rank.sunday': 'Nedelja',
	'calendar.rank.weekday': 'Delavnik',
	'calendar.gloss.season.advent':
		'Štirje tedni pred božičem: priprava na Gospodov prihod in začetek cerkvenega leta.',
	'calendar.gloss.season.christmas':
		'Od božiča do Jezusovega krsta, ko se obhaja Gospodovo rojstvo in njegovo razodetje svetu.',
	'calendar.gloss.season.lent':
		'Štirideset dni od pepelnične srede do večerne maše Gospodove večerje: pokora, miloščina in priprava na veliko noč.',
	'calendar.gloss.season.triduum':
		'Trije dnevi od večera velikega četrtka do večera velikonočne nedelje — Gospodovo trpljenje, smrt in vstajenje, vrhunec vsega leta.',
	'calendar.gloss.season.easter':
		'Petdeset dni od velike noči do binkošti, obhajanih kot en sam praznik — „ena velika nedelja“.',
	'calendar.gloss.season.ordinary':
		'Triintrideset ali štiriintrideset tednov zunaj drugih časov. Ne „navaden“, ampak urejen: tedni so šteti, Cerkev pa zaporedoma bere Gospodovo življenje in nauk. Prihaja v dveh delih — po božičnem času do posta, in po binkoštih do adventa.',
	'calendar.gloss.rank.solemnity':
		'Najvišja stopnja: velika noč, božič, vnebohod, zavetnik kraja. Obhaja se s Slavo in Vero ter se začne prejšnji večer.',
	'calendar.gloss.rank.feast':
		'Obhaja se znotraj samega dne. Apostoli in evangelisti ter večji Gospodovi in Marijini dnevi.',
	'calendar.gloss.rank.memorial':
		'Svetnik, ki se ga spominjamo na njegov dan, znotraj maše in bogoslužnega branja tega časa. Obvezen tam, kjer se obhaja.',
	'calendar.gloss.rank.optional-memorial':
		'Lahko se obhaja ali ne, po izbiri duhovnika ali občestva. Če se ne obhaja, je dan preprosto delavnik.',
	'calendar.gloss.rank.commemoration':
		'To, kar god postane v postnem času: molitev, dodana delavniški maši, ki jo čas sicer ohranja celo.',
	'calendar.gloss.rank.sunday':
		'Prvotni praznik — Gospodov dan, obhajan vsak teden od vstajenja. Le slovesni praznik ali Gospodov praznik ga sme izriniti, v adventu, postu in velikonočnem času pa niti ta ne.',
	'calendar.gloss.rank.weekday':
		'Dan brez lastnega obhajanja. Maša in bogoslužno branje sta iz danega časa — in prav to dela čas vrednega poznavanja.',
	'calendar.gloss.colour.white':
		'Veselje. Velikonočni in božični čas, Gospodovi dnevi zunaj njegovega trpljenja, Marija, angeli in svetniki, ki niso bili mučenci.',
	'calendar.gloss.colour.red':
		'Kri in ogenj. Cvetna nedelja in veliki petek, binkošti, apostoli in evangelisti ter mučenci.',
	'calendar.gloss.colour.green': 'Med letom: barva upanja in tega, kar raste.',
	'calendar.gloss.colour.violet': 'Advent in postni čas, nosi pa se tudi pri mašah za rajne.',
	'calendar.gloss.colour.rose':
		'Nosi se dvakrat na leto — na nedeljo Gaudete, tretjo adventno, in na nedeljo Laetare, četrto postno — kjer se post razsvetli in konec je na vidiku.',
	'calendar.gloss.colour.black': 'Sme se nositi pri mašah za rajne.',
	'calendar.gloss.colour.blue':
		'Prednost modre: nosi se ob Brezmadežnem spočetju v Španiji, na Filipinih in v redkih drugih krajih, ki jim jo je Sveti sedež podelil.',
	'calendar.gloss.sundayCycle':
		'Nedeljska berila tečejo v treh letih — A, B in C — in po vrsti berejo Mateja, Marka in Luka, z Janezom skozi postni in velikonočni čas. Cikel se zamenja na prvo adventno nedeljo, skupaj s cerkvenim letom.',
	'calendar.gloss.weekdayCycle':
		'Delavniška berila tečejo v dveh letih, I in II: prvo berilo se menja, evangelij ne. Liturgično leto se imenuje po koledarskem letu, v katerem se konča — liha leta so I, soda II.',
	'calendar.gloss.psalterWeek':
		'Bogoslužje ur razporeja psalme na štiri tedne, od I do IV, ki se ponavljajo skozi leto. To je teden, čigar psalmi so današnji, za vsakogar, ki moli ure.',
	'calendar.gloss.obligation':
		'Dan, ko so verniki dolžni udeležiti se maše in se vzdržati del, ki bi jim to preprečila. Vsaka nedelja in drugi dnevi, ki jih je določila posamezna škofovska konferenca.',
	'calendar.primer.title': 'Ste tu prvič?',
	'calendar.primer.lead':
		'Cerkev ohranja svoje lastno leto. Začne se z adventom, se obrača okrog velike noči in vsakemu dnevu da ime, stopnjo in barvo — te pa odločajo, kaj se ta dan moli in bere pri maši in v bogoslužju ur. Tako je „triindvajseta nedelja med letom“ naslov: duhovniku, zboru ali komur koli, ki moli doma, pove, katere molitve in berila pripadajo današnjemu dnevu.',
	'calendar.primer.seasons': 'Liturgični časi',
	'calendar.primer.ranks': 'Kaj je lahko dan',
	'calendar.primer.colours': 'Barve',
	'calendar.primer.cycles': 'Cikli',
	'calendar.primer.cyclesLead':
		'Trije števci, ki skupaj povedo, katera berila in psalmi so določeni za danes.'
};
