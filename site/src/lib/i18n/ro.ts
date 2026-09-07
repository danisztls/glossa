/**
 * Romanian UI strings.
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

export const ro: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Catehism',
	'nav.compendium': 'Compendiu',
	'nav.magisterium': 'Magisteriu',
	'nav.socialDoctrine': 'Doctrina socială',
	'socialDoctrine.landing.title': 'Compendiul doctrinei sociale a Bisericii',
	'socialDoctrine.landing.tagline':
		'Ce învață Biserica despre viața în societate, în 583 de numere.',
	'nav.canonLaw': 'Drept canonic',
	'canonLaw.landing.title': 'Codul de Drept Canonic',
	'canonLaw.landing.tagline': 'Dreptul Bisericii latine, în 1752 de canoane în șapte cărți.',
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Can.',
	'canonLaw.prevCanon': 'Canonul precedent',
	'canonLaw.nextCanon': 'Canonul următor',
	'canonLaw.readFullTitle': 'Citește tot titlul',
	'canonLaw.superseded': 'Text înlocuit prin',
	'nav.prayers': 'Rugăciuni',
	'nav.bookmarks': 'Semne de carte',
	'nav.menu': 'Meniu',
	'nav.sections': 'Secțiuni',
	'nav.works': 'Opere',
	'nav.pages': 'Pagini',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Continuați lectura',
	'home.tagline':
		'Un sit de lectură pentru Scriptură, Catehism și documentele Magisteriului — gratuit, disponibil offline și fără nimic la care să vă înregistrați.',
	'home.doors.heading': 'Unde să mergeți',
	'home.find.heading': 'Sau tastați o referință',
	'nav.library': 'Bibliotecă',
	'nav.learn': 'Învață',
	'library.landing.tagline':
		'Întregul corpus, raft cu raft — împreună cu locul unde ați rămas și cu ce ați marcat.',
	'schola.landing.title': 'De unde să începeți',
	'schola.landing.tagline':
		'Un ghid scurt al celor de aici: ce este fiecare dintre aceste cărți, cum se scrie o trimitere la ea, cum se găsește un pasaj, și ordini de lectură pe care Biserica le-a propus.',
	'schola.start.heading': 'Nou în catolicism?',
	'schola.start.body': 'Începeți cu ',
	'schola.start.bodyAfter':
		': aceeași învățătură ca a Catehismului, mult mai scurtă, scrisă în întrebări și răspunsuri. Are cam a zecea parte din întindere și nu presupune nimic.',
	'schola.bible.heading': 'Nu ați citit niciodată Biblia?',
	'schola.bible.library':
		'Nu este o carte, ci șaptezeci și trei, scrise de-a lungul a peste o mie de ani și strânse în ordinea pe care Biserica a stabilit-o — nu ordinea în care s-au petrecut lucrurile și nici cea care se citește cel mai ușor. Cei mai mulți încep la prima pagină și se opresc câteva săptămâni mai târziu, într-un capitol lung de lege veche, fiindcă nimeni nu le-a spus încă la ce folosește.',
	'schola.bible.step.gospel': 'Începeți cu o Evanghelie',
	'schola.bible.start':
		'Una dintre cele patru cărți scurte despre viața lui Isus, mult înăuntru și nu în față. Ideea nu este a noastră: un Conciliu al Bisericii a cerut să fie învățată dreapta folosire a Scripturii, „mai ales a Noului Testament și înainte de toate a Evangheliilor”. Nu a numit niciuna anume, și nici noi nu o vom face.',
	'schola.bible.whichGospel':
		'Trei sunt de obicei propuse, din trei motive diferite. Oricare dintre ele este un loc bun în care să fiți.',
	'schola.bible.gospel.mark':
		'Cea mai scurtă. O puteți citi în întregime într-o după-amiază, iar a fi terminat una prețuiește mai mult, la început, decât a fi ales-o pe cea mai bună.',
	'schola.bible.gospel.luke':
		'Scrisă pentru cineva din afara credinței care voia povestirea așezată în ordine — ceea ce s-ar putea să fiți chiar dumneavoastră. Se continuă direct în Faptele Apostolilor, așa că este de fapt prima jumătate a unei cărți mai lungi.',
	'schola.bible.gospel.john':
		'Cea care spune deschis de ce a fost scrisă: „ca voi să credeți”. Cuvinte simple, și merge drept la întrebarea cine este Isus.',
	'schola.bible.step.acts': 'Apoi ce s-a întâmplat mai departe',
	'schola.bible.thenActs':
		'Când ați terminat una, citiți ce au făcut, după plecarea lui, cei care îl cunoscuseră.',
	'schola.bible.acts.why':
		'Cei treizeci de ani de după sfârșitul Evangheliilor: câteva zeci de oameni înspăimântați, și cum ceea ce văzuseră a ajuns la celălalt capăt al imperiului.',
	'schola.bible.step.old': 'Apoi jumătatea mai veche',
	'schola.bible.thenOld':
		'Nu de la prima pagină și nu toată. Câteva locuri poartă povestirea, și sunt tocmai acelea la care Evangheliile trimit necontenit.',
	'schola.bible.ot.beginnings': 'Cum începe și cum o ia razna.',
	'schola.bible.ot.promise':
		'O familie, și o făgăduință făcută ei care îi supraviețuiește tuturor.',
	'schola.bible.ot.exodus': 'Un popor scos din robie, și o lege dată lui spre a trăi.',
	'schola.bible.ot.psalms':
		'Nu o povestire: o sută cincizeci de rugăciuni și cântări. Citiți câte una, în orice ordine. Biserica le rostește și astăzi în fiecare zi.',
	'schola.bible.bothWays':
		'Veți recunoaște lucruri, iar acesta este rostul, nu o întâmplare. Biserica citește cărțile mai vechi în lumina lui Cristos și pe cele mai noi în lumina a ceea ce a fost înainte — fiecare jumătate o lămurește pe cealaltă, și de aceea niciuna nu se citește singură.',
	'schola.books.heading': 'Ce se află aici și cum se identifică',
	'schola.books.lede':
		'Fiecare dintre acestea este un alt fel de carte, și la fiecare se trimite printr-un număr propriu. Exemplele arată forma: scrieți unul asemenea în caseta de căutare și ajungeți la pasaj.',
	'schola.cite.label': 'Se identifică',
	'schola.what.scripture':
		'Scripturile așa cum le primește Biserica, în ambele Testamente. Tot restul de aici se citește în lumina lor.',
	'schola.cite.scripture':
		'carte, capitol și verset, în prescurtările pe care le tipărește ediția dumneavoastră',
	'schola.what.catechism':
		'Un rezumat a ceea ce crede Biserica Catolică, într-un singur volum. El însuși nu este izvor: adună Scriptura, Părinții, liturgia și învățătura Bisericii, și fiecare paragraf spune de unde vine ceea ce afirmă.',
	'schola.cite.catechism':
		'după numărul paragrafului, curgând neîntrerupt de la prima pagină la ultima',
	'schola.what.compendium':
		'Aceeași învățătură așezată în întrebări și răspunsuri, la cam a zecea parte din întindere.',
	'schola.cite.compendium': 'după numărul întrebării',
	'schola.what.magisterium':
		'Ceea ce papii și conciliile au scris cu adevărat — enciclice, constituții, decrete, declarații — fiecare adresat unui moment anume și unei chestiuni anume. Fiecare este cunoscut după cuvintele lui de început în latină.',
	'schola.cite.magisterium': 'după numele documentului, apoi un număr de secțiune dinăuntrul lui',
	'schola.what.social':
		'Învățătura Bisericii despre muncă, proprietate, familie, politică și pace, strânsă din acele documente într-o singură carte.',
	'schola.cite.social':
		'după numărul paragrafului, sub sigla pe care opera o folosește pentru sine',
	'schola.what.law': 'Drept, nu doctrină. Spune ce cere Biserica, și se amendează.',
	'schola.cite.law': 'după canon, cum se numesc unitățile lui numerotate',
	'schola.what.doctors':
		'Teologii pe care Biserica i-a numit Învățători. Nu poartă nicio autoritate oficială, oricât de mare ar fi autorul.',
	'schola.cite.doctors': 'după parte, apoi chestiune — diviziunile proprii ale Summei',
	'schola.what.prayers': 'Cuvintele cu care se roagă Biserica, având latina alături.',
	'schola.cite.prayers': 'după nume; nu sunt numere de citat',
	'schola.places.heading': 'Nu texte, ci locuri de pe acest sit',
	'schola.what.library':
		'Toate operele sitului într-o singură listă, grupate după subiect, nu după fel.',
	'schola.what.calendar':
		'Ziua liturgică — timpul, culoarea și cine este prăznuit — pentru țara al cărei calendar îl urmați.',
	'schola.what.bookmarks':
		'Pasajele pe care le-ați însemnat, și unde ați rămas ultima dată în fiecare operă. Amândouă se păstrează în acest navigator și nu se trimit nicăieri.',
	'ccc.noCounterpart': 'Fără corespondent în cealaltă lucrare',
	'jumpbox.placeholder': 'Salt la… (ex. ioan 3,16, ccc 1234)',
	'jumpbox.short': 'Caută',
	'jumpbox.hint': 'Apăsați / sau Ctrl+K pentru a sări la o referință',
	'jumpbox.noMatch': 'Nicio potrivire',
	'jumpbox.suggestions': 'Sugestii',
	'settings.label': 'Setări',
	'apparatus.label': 'Aparat',
	'apparatus.editionNotes': 'Notele acestei ediții',
	'apparatus.commentary': 'Comentariu',
	'apparatus.inCommentary': 'Inclus în comentariul de mai sus.',
	'darkMode.label': 'Mod întunecat',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Pornit',
	'darkMode.off': 'Oprit',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Doar în mod luminos',
	'sepia.noHue': 'Nu în mono',
	'oled.label': 'Negru OLED',
	'oled.darkOnly': 'Doar în mod întunecat',
	'mono.label': 'Monocrom',
	'mono.hint':
		'Așază toată pagina într-un singur gri, astfel încât nimic nu se deosebește prin culoare. Cât timp este pornit, sepia se oprește.',
	'advanced.label': 'Avansat',
	'library.title': 'Bibliotecă offline',
	'library.lede': 'Textele păstrate pe acest dispozitiv se deschid fără nicio rețea.',
	'library.essentials': 'Rugăciuni și Compendiu',
	'library.illustrations': 'Biblia (ilustrații)',
	'library.illustrationsDetail': 'Biblia (ilustrații, rezoluție înaltă)',
	'library.other': 'Alte texte',
	'library.everything': 'Tot',
	'library.downloadAll': 'Descarcă tot',
	'library.download': 'Descarcă',
	'library.downloaded': 'Pe acest dispozitiv',
	'library.offlineNote': 'Dezactivează modul offline pentru a descărca.',
	'library.remove': 'Elimină de pe acest dispozitiv',
	'library.removeConfirm': 'Elimini?',
	'library.forget': 'Șterge descărcările',
	'library.forgetConfirm': 'Ștergi tot?',
	'offline.label': 'Mod offline',
	'offline.hint':
		'Nu folosește deloc rețeaua: nu se descarcă nimic, nu se caută actualizări, nu se măsoară nimic. Se deschid doar textele aflate deja pe acest dispozitiv.',
	'offline.notDownloaded': 'Nu se află pe acest dispozitiv',
	'loadFailed.title': 'Aceasta nu s-a încărcat',
	'loadFailed.hint':
		'Pagina există — ceva a mers prost la aducerea ei. O nouă încercare rezolvă de obicei.',
	'loadFailed.retry': 'Încercați din nou',
	'loadFailed.retrying': 'Se încearcă…',
	'offline.turnOff': 'Dezactivează modul offline',

	'fontSize.label': 'Mărimea textului',
	'fontSize.larger': 'Text mai mare',
	'fontSize.smaller': 'Text mai mic',
	'print.label': 'Tipăriți această pagină',
	'toTop.label': 'Înapoi sus',
	'install.label': 'Instalați Glossa',
	'install.hint.label': 'Adăugați pe ecranul principal',
	'install.hint.title': 'Adăugați Glossa pe ecranul principal',
	'install.hint.stepBefore': 'Se deschide ca o aplicație și se citește offline. Atingeți',
	'install.hint.stepAfter': 'apoi „Adaugă pe ecranul principal”.',
	'install.hint.dismiss': 'Închideți',
	'update.label': 'O nouă ediție este disponibilă',
	'update.title': 'O nouă ediție este gata',
	'update.body': 'Reîncărcați pentru a primi cele mai noi texte și corecturi.',
	'update.action': 'Reîncărcați',
	'update.dismiss': 'Nu acum',
	'edition.label': 'Ediție',
	'edition.select': 'Alegeți ediția',
	'edition.current': 'Ediția curentă',
	'edition.filter': 'Caută ediții',
	'menu.noMatches': 'Niciun rezultat',
	'unitNav.previous': 'Înapoi',
	'unitNav.next': 'Înainte',
	'bible.prevChapter': 'Capitolul precedent',
	'bible.nextChapter': 'Capitolul următor',
	'bible.pickBook': 'Cărți și capitole',
	'bible.landing.title': 'Biblia',
	'bible.landing.tagline': 'Citiți întreaga Biblie, carte cu carte, capitol cu capitol.',
	'bible.landing.random': 'Mă simt norocos',
	'bible.landing.books': 'Cărți',
	'bible.chapterUnavailable': 'Indisponibil în această ediție',
	'bible.introduction': 'Introducere',
	'bible.introUnavailable': 'Încă nicio introducere în această limbă',
	'bible.introSource': 'Introducerile nu fac parte din textul Scripturii.',
	'bible.testament.ot': 'Vechiul Testament',
	'bible.testament.nt': 'Noul Testament',
	'bible.group.pentateuch': 'Pentateuhul',
	'bible.group.historical': 'Cărțile istorice',
	'bible.group.wisdom': 'Cărțile sapiențiale',
	'bible.group.prophetic': 'Cărțile profetice',
	'bible.group.gospels': 'Evangheliile',
	'bible.group.acts': 'Faptele Apostolilor',
	'bible.group.pauline': 'Epistolele Sfântului Pavel',
	'bible.group.catholicLetters': 'Epistolele catolice',
	'bible.group.revelation': 'Apocalipsa',
	'ccc.prevParagraph': 'Paragraful precedent',
	'ccc.nextParagraph': 'Paragraful următor',
	'ccc.inBrief': 'Pe scurt',
	'ccc.landing.title': 'Catehismul Bisericii Catolice',
	'ccc.landing.pairTitle': 'Catehism și Compendiu',
	'ccc.landing.tagline':
		'<strong>Catehismul</strong> expune învățătura catolică în 2.865 de paragrafe numerotate. <strong>Compendiul</strong> reia aceeași învățătură în 598 de întrebări și răspunsuri, după aceeași structură.',
	'ccc.landing.pairTagline':
		'Catehismul Bisericii Catolice în 2.865 de paragrafe, iar Compendiul său în 598 de întrebări.',
	'ccc.tableOfContents': 'Cuprins',
	'ccc.related': 'Vezi și',
	'compendium.landing.title': 'Compendiul Catehismului',
	'compendium.landing.tagline':
		'Întrebări și răspunsuri care rezumă Catehismul Bisericii Catolice.',
	'compendium.question': 'Întrebare',
	'compendium.answer': 'Răspuns',
	'compendium.tableOfContents': 'Cuprins',
	'compendium.prevQuestion': 'Întrebarea precedentă',
	'compendium.nextQuestion': 'Întrebarea următoare',
	'compendium.condenses': 'Rezumă CBC ¶¶',
	'ccc.abbrev': 'CBC',
	'ccc.condensedIn': 'În Compendiu',
	'compendium.abbrev': 'Comp.',
	'compendium.noQuestionNumber': 'Fără număr de întrebare în acest corpus',
	'nav.summa': 'Summa',
	'doctores.landing.title': 'Învățătorii Bisericii',
	'doctores.landing.tagline': 'Operele teologice ale Părinților și Învățătorilor Bisericii.',
	'summa.landing.title': 'Summa theologiae',
	'summa.landing.tagline': 'Toma de Aquino, în engleză și în latina în care a scris.',
	'summa.tableOfContents': 'Cuprins',
	'summa.part': 'Partea',
	'summa.question': 'Întrebarea',
	'summa.article': 'Articolul',
	'summa.questionShort': 'Î.',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titlu din ediția în {lang}',
	'summa.titlesFromEdition': 'Titluri din ediția în {lang} — aceasta nu are titluri',
	'summa.prologue': 'Prolog',
	'summa.objection': 'Obiecție',
	'summa.sedContra': 'Dimpotrivă',
	'summa.corpus': 'Răspund că',
	'summa.reply': 'Răspuns la obiecție',
	'summa.preamble': 'Notă',
	'summa.prevQuestion': 'Întrebarea precedentă',
	'summa.nextQuestion': 'Întrebarea următoare',
	'summa.noEditionInYourLanguage':
		'Summa nu are o ediție în limba dumneavoastră. Este afișată ediția în {lang}.',
	'summa.noLatinSupplement':
		'Supplementum există numai în engleză — a fost alcătuit după moartea lui Toma.',
	'index.division': 'Diviziune',
	'index.showSubsections': 'Arată subsecțiunile',
	'index.hideSubsections': 'Ascunde subsecțiunile',
	'prayers.landing.title': 'Rugăciuni',
	'prayers.landing.tagline': 'Rugăciuni cu textul latin alături.',
	'prayers.gloss.versicle':
		'Versetul — rândul pe care cel ce conduce rugăciunea îl spune sau îl cântă singur. Adunarea îi răspunde cu răspunsul care urmează.',
	'prayers.gloss.response':
		'Răspunsul — rândul pe care adunarea îl spune sau îl cântă împreună, răspunzând versetului dinaintea lui.',
	'prayers.tableOfContents': 'Cuprins',
	'prayers.seeAlso': 'Vezi și',
	'prayers.prevPrayer': 'Rugăciunea precedentă',
	'prayers.nextPrayer': 'Rugăciunea următoare',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Astăzi',
	'prayers.rosary.todayHeading': 'Misterele de astăzi',
	'prayers.rosary.openingPrayer': 'Rugăciunea de început',
	'prayers.rosary.decadePrayers': 'Rugăciunile unei decade',
	'ref.tooltip.loading': 'Se încarcă…',
	'ref.tooltip.openCcc': 'Deschide în Catehism',
	'ref.tooltip.openBible': 'Deschide în Biblie',
	'ref.tooltip.openCompendium': 'Deschide în Compendiu',
	'ref.preview.open': 'Deschide',
	'ref.cf': 'cf.',
	'anchor.actions': 'Acțiuni pentru referință',
	'anchor.copy': 'Copiază textul',
	'anchor.copyLink': 'Copiază linkul',
	'anchor.view': 'Vezi',
	'anchor.copied': 'Copiat',
	'anchor.copyFailed': 'Nu s-a putut copia',
	'bookmark.add': 'Semn de carte',
	'bookmark.remove': 'Elimină semnul de carte',
	'bookmark.library': 'Semne de carte',
	'bookmark.library.tagline': 'Tot ce ați marcat în timpul lecturii.',
	'bookmark.empty': 'Nimic marcat încă.',
	'bookmark.emptyHint':
		'Dați clic pe numărul unui verset sau al unui paragraf și alegeți Semn de carte, ori folosiți butonul de semn de carte al paginii.',
	'bookmark.about': 'Despre aceste semne de carte',
	'bookmark.deviceOnly':
		'Semnele de carte rămân doar în acest browser. Nu sunt trimise nicăieri, iar ștergerea datelor browserului le elimină.',
	'bookmark.unavailable': 'Nu se află în ediția pe care o citiți',
	'document.library.tagline':
		'Enciclice, constituții conciliare, decrete și declarații ale Magisteriului.',
	'document.filter.heading': 'Filtre',
	'document.filter.author': 'Autor',
	'document.filter.kind': 'Tip',
	'document.filter.subject': 'Subiect',
	'document.filter.search': 'Caută documente',
	'document.filter.clear': 'Șterge',
	'document.filter.results': 'Documente afișate',
	'document.filter.noResults': 'Niciun document nu corespunde acestor filtre.',
	'document.tableOfContents': 'Cuprins',
	'document.startReading': 'Începeți lectura',
	'document.readFullDocument': 'Citiți documentul integral',
	'document.section': 'Secțiune',
	'document.prevSection': 'Înapoi',
	'document.nextSection': 'Înainte',
	'document.kind.conciliarConstitution': 'Constituție',
	'document.kind.conciliarDecree': 'Decret',
	'document.kind.conciliarDeclaration': 'Declarație',
	'document.kind.encyclical': 'Enciclică',
	'document.kind.apostolicExhortation': 'Exortație apostolică',
	'document.kind.apostolicConstitution': 'Constituție apostolică',
	'document.kind.cdfDeclaration': 'Declarație a Congregației pentru Doctrina Credinței',
	'document.kind.cdfInstruction': 'Instrucțiune a Congregației pentru Doctrina Credinței',
	'document.kind.cdfLetter': 'Scrisoare a Congregației pentru Doctrina Credinței',
	'document.kind.cdfDoctrinalNote': 'Notă doctrinară a Congregației pentru Doctrina Credinței',
	'document.kind.cdfResponsum': 'Responsum al Congregației pentru Doctrina Credinței',
	'document.kind.cdfConsiderations': 'Considerații ale Congregației pentru Doctrina Credinței',
	'document.kindPlural.conciliarConstitution': 'Constituții',
	'document.kindPlural.conciliarDecree': 'Decrete',
	'document.kindPlural.conciliarDeclaration': 'Declarații',
	'document.kindPlural.encyclical': 'Enciclice',
	'document.kindPlural.apostolicExhortation': 'Exortații apostolice',
	'document.kindPlural.apostolicConstitution': 'Constituții apostolice',
	'document.kindPlural.cdfDeclaration': 'Declarații ale Congregației pentru Doctrina Credinței',
	'citation.unavailable': 'Nu există text-sursă pentru această notă.',
	'colophon.title': 'Colofon',
	'colophon.lede':
		'Ce este acest sit, de unde vin textele lui și care este poziția noastră față de reproducerea lor.',
	'colophon.whatThisIs': 'Ce este',
	'colophon.whatThisIsBody':
		'Glossa Catholica este un sit de lectură pentru Scriptură, Catehism, Compendiu și documentele Magisteriului, în engleză, portugheză și latină. Există pentru a fi citit și nimic altceva nu vi se cere pentru a-l citi:',
	'colophon.pointFree':
		'Gratuit, și mereu gratuit. Fără zid de plată, fără abonament, nimic de cumpărat.',
	'colophon.pointNoAds': 'Fără publicitate și fără niciun fel de plasare sponsorizată.',
	'colophon.pointNoAccounts':
		'Fără conturi. Nimic la care să vă înregistrați, nimic în care să vă autentificați.',
	'colophon.pointNoTracking':
		'Fără scripturi de urmărire, fără cod de la terți, fără cookie-uri. Doar numărători de utilizare anonime, nimic care să vă identifice.',
	'colophon.pointOffline':
		'Construit ca să funcționeze offline după ce l-ați vizitat o dată, astfel încât o conexiune slabă să nu fie o piedică în calea lecturii.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica este o inițiativă privată a credincioșilor laici. Nu are nicio aprobare ecleziastică și nu vorbește cu autoritate proprie.',
	'footer.notEndorsed': 'Fără aprobarea Sfântului Scaun',
	'colophon.textsTitle': 'Textele',
	'colophon.textsBody':
		'Fiecare text provine dintr-o sursă numită, iar fiecare lucrare își consemnează ediția, pagina-sursă și data preluării. Scriptura folosește traduceri din domeniul public; Catehismul, Compendiul și documentele magisteriale provin din textele publicate de însuși Sfântul Scaun.',
	'colophon.textsFidelity':
		'Textul nu este niciodată prescurtat, niciodată parafrazat, niciodată rescris și niciodată așezat lângă publicitate. În schimb, reparăm defectele evidente — un cuvânt căzut, o trimitere stâlcită, un marcaj care a înghițit un paragraf — întotdeauna către ceea ce tipărește sursa însăși, niciodată către ceea ce credem noi că ar trebui să spună.',
	'colophon.countBible': 'ediții biblice',
	'colophon.countDocuments': 'documente magisteriale',
	'colophon.privacyTitle': 'Confidențialitate',
	'colophon.privacyBody1':
		'Fără conturi, fără cookie-uri, fără publicitate, fără cod de la terți. Nimic de aici nu vă urmărește în afara acestui sit.',
	'colophon.privacyBody2':
		'Numărăm totuși cum este folosit situl: o măsurătoare pe vizită, fiecare câmp fiind un interval, nu o valoare — cât timp ați stat, cât de des ați fost aici, ce opere ați deschis. Țara dumneavoastră este numărată separat, fără nimic care s-o lege de rest. Descrie o vizită, nu un vizitator, și este păstrată {days} de zile.',
	'colophon.privacyBody3':
		'Nu se trimite niciodată ce introduceți în caseta de căutare, ce pasaj aveați deschis, sau nimic care ar putea recunoaște din nou dispozitivul dumneavoastră. Setările, semnele de carte și textele descărcate rămân pe dispozitivul dumneavoastră.',
	'colophon.copyrightTitle': 'Drepturi de autor',
	'colophon.copyrightBody1':
		'Catehismul, Compendiul și documentele magisteriale sunt proprietatea deținătorilor lor de drepturi — în principal Libreria Editrice Vaticana și Dicasterul pentru Comunicare.',
	'colophon.copyrightBody2':
		'Fiecare lucrare afișează nota de copyright a deținătorului ei de drepturi, în formularea lui, și trimite la pagina de unde a fost preluată.',
	'colophon.copyrightBody3':
		'Dacă dețineți drepturi asupra vreunui text de aici și ați prefera să nu fie publicat, scrieți-ne.',
	'colophon.contactTitle': 'Contact',
	'colophon.contactBody': 'Pentru orice, inclusiv pentru cele de mai sus:',
	'colophon.contactPending':
		'O adresă de contact nu a fost încă stabilită. Acest sit nu ar trebui făcut public până când nu are una — angajamentul de mai sus nu înseamnă nimic fără o cale de a ne fi scris.',
	'colophon.illustrationsTitle': 'Ilustrațiile',
	'colophon.illustrationsBody':
		'Biblia poartă gravurile lui Gustave Doré, fiecare așezată la versetul pe care îl înfățișează — ultimul și cel mai întins dintre ciclurile lui biblice, gravat în lemn după desenele sale și tipărit împreună cu textul, nu adunat la sfârșitul volumului.',
	'colophon.illustrationsRights':
		'Sunt în domeniul public, după cum arată datele de mai jos, iar reproducerea fotografică fidelă a unei gravuri din domeniul public nu naște un drept de autor nou.',
	'colophon.countPlates': 'gravuri',
	'colophon.countPlateChapters': 'capitole ilustrate',
	'plates.scansBy': 'Scanări puse la dispoziție de',
	'plates.enlarge': 'Mărește {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'Despre această imagine',
	'art.detail': 'detaliu',
	'colophon.typeTitle': 'Litera',
	'colophon.typeBody':
		'Cules cu EB Garamond, reînvierea de către Georg Duffner și Octavio Pardo a caracterelor tăiate de Claude Garamont în anii 1590 — tradiția umanistă în care Biserica tipărește încă din Renaștere. Chirilica sa vine din aceleași mâini, dar nu reînvie nimic: un Garamond chirilic nu a fost tăiat niciodată, așa că rusa este culeasă într-o formă desenată ca să stea alături de restul.',
	'colophon.typeArabic':
		'Araba îi rămâne cu totul în afara puterii și este culeasă cu Amiri — reînvierea de către Khaled Hosny a naskh-ului tăiat pentru tipografia din Bulaq, la Cairo, în 1905, aleasă după același raționament ca litera textului: un anume caracter de carte istoric, nu un desen contemporan.',
	'colophon.typeInitials':
		'Inițialele sunt Pirata One, o literă gotică ale cărei majuscule rămân lizibile la mărimea pe care o cere o inițială, iar — pentru rusă — Ponomar, care reproduce litera slavonă bisericească a Tipografiei Sinodale. Ponomar culege inițiala și niciodată textul: o enciclică modernă culeasă în întregime cu literă sinodală ar spune despre sine ceva neadevărat. Toate sunt licențiate sub SIL Open Font License și sunt servite de pe acest sit, nu de la terți, așa încât citirea unei pagini nu cere nimic de la serverul nimănui altcuiva.',
	'refs.citedIn': 'Citat în',
	'refs.externalVolume': 'Volumul {volume} pe {host} — PDF scanat',
	'bible.wholeChapter': 'Acest capitol',
	'bible.verseNotInEdition':
		'Acest număr de verset nu se află în această ediție — vedeți nota din sursa paginii',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Notă',
	'bible.noteMissing': 'Această notă lipsește din corpus',
	'bible.chapterArgument': 'Argument',
	'ccc.readFullChapter': 'Citiți capitolul întreg',
	'ccc.noParagraphNumber': 'Fără număr de paragraf în acest corpus',
	'copyright.sourceTitle': 'Deschideți pagina-sursă originală',
	'copyright.sourceLabel': 'Sursă',
	'lang.label': 'Limbă',
	'lang.filter': 'Caută limbi',
	'lang.more': 'alte limbi',
	'notFound.title': 'Nimic la această adresă',
	'notFound.lede': 'Pagina pe care ați cerut-o nu este aici.',
	'notFound.body':
		'Linkul poate fi greșit tastat sau învechit, ori poate trimite la un text pe care acest sit nu îl are.',
	'notFound.searchHint':
		'Dacă știți referința pe care o căutați — o carte și un capitol, un paragraf din Catehism — scrieți-o în caseta de căutare din capul acestei pagini.',
	'notFound.credit': 'Dup\u0103 British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Sau porniți de la una dintre acestea:',
	'notFound.home': 'Pagina principală',
	'compare.enter': 'Comparați edițiile',
	'compare.exit': 'Ieșiți din comparație',
	'compare.missing': 'Nu se află în această ediție',
	'compare.versificationNote':
		'Aceste două ediții împart pe alocuri altfel versetele acestui capitol (o variantă textuală, nu o alegere de traducere) — același număr de verset nu marchează întotdeauna aceeași frază în ambele coloane.',
	'compare.loading': 'Se încarcă a doua limbă…',
	'ui.close': 'Închide',
	'shortcuts.title': 'Scurtături de tastatură',
	'shortcuts.betweenDocuments': 'Între documente',
	'shortcuts.withinDocument': 'În document',
	'shortcuts.show': 'Afișează această listă',
	'help.title': 'Ajutor',
	'help.top.heading': 'Bara din capul fiecărei pagini',
	'help.reading.heading': 'Bara de deasupra unui text',
	'help.feature.search':
		'Scrieți o trimitere în caseta de sus — capitol și verset, un număr de paragraf, numele unui document — și o completează pe măsură ce scrieți.',
	'help.feature.offline':
		'Adăugați situl pe ecranul de pornire și se deschide ca o aplicație. Puteți descărca opere întregi spre a le citi fără conexiune.',
	'help.feature.contents':
		'Diviziunile operei în care vă aflați — cărți, părți, capitole — ca să vă mișcați înăuntrul ei fără a vă întoarce la început.',
	'help.feature.compare':
		'Două ediții ale aceluiași pasaj, una lângă alta — latina alături de limba dumneavoastră, sau o traducere alături de alta.',
	'help.feature.apparatus':
		'Notele proprii ale unei ediții, și orice comentariu scris pe text, sunt oferite alături de el, nu dedesubt. Citările dinăuntrul textului sunt legături, așa că o trimitere duce unde arată.',
	'help.feature.focus':
		'Înlătură tot în afară de text. Ieșirea rămâne unde era bara, ca nimic să nu fie prins în spatele ei.',
	'zen.enter': 'Mod de concentrare',
	'zen.exit': 'Ieșiți din modul de concentrare',
	'nav.calendar': 'Calendar',
	'calendar.title': 'Calendar liturgic',
	'calendar.tagline':
		'Calendarul Roman General, calculat pentru orice zi — timpul ei, gradul ei, culoarea ei.',
	'calendar.calendar': 'Calendar',
	'calendar.which.general': 'Calendarul Roman General',
	'calendar.filter': 'Caută țări',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Americile',
	'calendar.region.africa': 'Africa',
	'calendar.region.middleEast': 'Orientul Mijlociu',
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oceania',
	'calendar.today': 'Astăzi',
	'calendar.previousMonth': 'Luna precedentă',
	'calendar.nextMonth': 'Luna următoare',
	'calendar.plainDays': 'Zile de rând',
	'calendar.noSuchDay': 'Pentru acea dată nu se calculează nicio zi liturgică.',
	'calendar.week': 'săptămâna',
	'calendar.alsoToday': 'Astăzi se mai celebrează',
	'calendar.alsoObserved': 'Astăzi se mai ține',
	'calendar.obligation': 'Sărbătoare de poruncă',
	'calendar.obligationCanon': 'CIC can. 1246',
	'calendar.sundayCycle': 'Ciclul duminical',
	'calendar.weekdayCycle': 'Ciclul ferial',
	'calendar.psalterWeek': 'Săptămâna psaltirii',
	'lectionary.heading': 'Lecturile de la Liturghie',
	'lectionary.slot.reading': 'Lectură',
	'lectionary.slot.reading1': 'Lectura I',
	'lectionary.slot.reading2': 'Lectura a II-a',
	'lectionary.slot.reading3': 'Lectura a III-a',
	'lectionary.slot.reading4': 'Lectura a IV-a',
	'lectionary.slot.reading5': 'Lectura a V-a',
	'lectionary.slot.reading6': 'Lectura a VI-a',
	'lectionary.slot.reading7': 'Lectura a VII-a',
	'lectionary.slot.psalm': 'Psalmul responsorial',
	'lectionary.slot.epistle': 'Epistolă',
	'lectionary.slot.acclamation': 'Aclamația la Evanghelie',
	'lectionary.slot.gospel': 'Evanghelia',
	'lectionary.slot.sequence': 'Secvența',
	'lectionary.or': 'sau',
	'lectionary.notScripture': 'nu este un text scripturistic',
	'lectionary.cf': 'Cf.',
	'lectionary.about': 'Despre aceste lecturi',
	'lectionary.caveat':
		'Pasajele rânduite de Ordo Lectionum Missae, legate de edițiile proprii ale acestui sit — nu traducerea proclamată într-o anumită biserică, iar o conferință episcopală poate adapta orânduirea lor.',
	'calendar.transferredFrom': 'Transferat din',
	'calendar.season.advent': 'Advent',
	'calendar.season.christmas': 'Timpul Crăciunului',
	'calendar.season.lent': 'Postul Mare',
	'calendar.season.triduum': 'Triduumul Pascal',
	'calendar.season.easter': 'Timpul Pascal',
	'calendar.season.ordinary': 'Timpul de peste an',
	'calendar.colour.white': 'Alb',
	'calendar.colour.red': 'Roșu',
	'calendar.colour.green': 'Verde',
	'calendar.colour.violet': 'Violet',
	'calendar.colour.rose': 'Roz',
	'calendar.colour.black': 'Negru',
	'calendar.colour.blue': 'Albastru',
	'calendar.rank.solemnity': 'Solemnitate',
	'calendar.rank.feast': 'Sărbătoare',
	'calendar.rank.memorial': 'Memorial',
	'calendar.rank.optional-memorial': 'Memorial facultativ',
	'calendar.rank.commemoration': 'Comemorare',
	'calendar.rank.sunday': 'Duminică',
	'calendar.rank.weekday': 'Zi de rând',
	'calendar.gloss.season.advent':
		'Cele patru săptămâni dinaintea Crăciunului: pregătire pentru venirea Domnului și începutul anului Bisericii.',
	'calendar.gloss.season.christmas':
		'De la Crăciun la Botezul Domnului, celebrând nașterea Domnului și arătarea sa lumii.',
	'calendar.gloss.season.lent':
		'Cele patruzeci de zile de la Miercurea Cenușii până la Liturghia de seară a Cinei Domnului: pocăință, milostenie și pregătire pentru Paști.',
	'calendar.gloss.season.triduum':
		'Cele trei zile de la seara Joii Sfinte până la seara Duminicii Paștilor — patima, moartea și învierea Domnului, culmea întregului an.',
	'calendar.gloss.season.easter':
		'Cele cincizeci de zile de la Paști la Rusalii, celebrate ca o singură sărbătoare — „o singură mare duminică”.',
	'calendar.gloss.season.ordinary':
		'Cele treizeci și trei sau treizeci și patru de săptămâni din afara celorlalte timpuri. Nu „oarecare”, ci rânduit: săptămânile sunt numărate, iar Biserica citește pe rând viața și învățătura Domnului. Vine în două părți — după timpul Crăciunului până în Postul Mare, și după Rusalii până în Advent.',
	'calendar.gloss.rank.solemnity':
		'Cel mai înalt grad: Paștile, Crăciunul, Înălțarea, patronul unui loc. Se celebrează cu Mărire și Crez și începe în seara dinainte.',
	'calendar.gloss.rank.feast':
		'Se celebrează în cuprinsul zilei înseși. Apostolii și evangheliștii, și zilele mai mari ale Domnului și ale Preacuratei.',
	'calendar.gloss.rank.memorial':
		'Un sfânt pomenit în ziua sa, în cadrul Liturghiei și Oficiului timpului. Obligatorie acolo unde se ține.',
	'calendar.gloss.rank.optional-memorial':
		'Poate fi ținută sau nu, la alegerea preotului sau a comunității. Dacă nu este ținută, ziua este pur și simplu zi de rând.',
	'calendar.gloss.rank.commemoration':
		'Ceea ce devine o comemorare în Postul Mare: o rugăciune adăugată Liturghiei de rând, pe care timpul o păstrează în rest întreagă.',
	'calendar.gloss.rank.sunday':
		'Sărbătoarea dintâi — ziua Domnului, ținută în fiecare săptămână de la înviere. Doar o solemnitate sau o sărbătoare a Domnului o poate înlocui, iar în Advent, Postul Mare și timpul pascal nici acelea.',
	'calendar.gloss.rank.weekday':
		'Zi fără celebrare proprie. Liturghia și Oficiul sunt ale timpului — și tocmai asta face timpul vrednic de cunoscut.',
	'calendar.gloss.colour.white':
		'Bucurie. Timpul pascal și timpul Crăciunului, zilele Domnului în afara patimii sale, Preacurata, îngerii și sfinții care nu au fost martiri.',
	'calendar.gloss.colour.red':
		'Sânge și foc. Duminica Floriilor și Vinerea Sfântă, Rusaliile, apostolii și evangheliștii, și martirii.',
	'calendar.gloss.colour.green': 'Timpul de peste an: culoarea speranței și a ceea ce crește.',
	'calendar.gloss.colour.violet':
		'Adventul și Postul Mare, și se poartă și la Liturghiile pentru cei răposați.',
	'calendar.gloss.colour.rose':
		'Se poartă de două ori pe an — în duminica Gaudete, a treia din Advent, și în duminica Laetare, a patra din Postul Mare — acolo unde postul se luminează și sfârșitul se vede.',
	'calendar.gloss.colour.black': 'Poate fi purtat la Liturghiile pentru cei răposați.',
	'calendar.gloss.colour.blue':
		'Privilegiul albastrului: se poartă la Neprihănita Zămislire în Spania, în Filipine și în puținele alte locuri cărora Sfântul Scaun l-a acordat.',
	'calendar.gloss.sundayCycle':
		'Lecturile duminicale se desfășoară pe trei ani — A, B și C — citind pe rând pe Matei, Marcu și Luca, cu Ioan în Postul Mare și în timpul pascal. Ciclul se schimbă în prima duminică din Advent, odată cu anul Bisericii.',
	'calendar.gloss.weekdayCycle':
		'Lecturile de peste săptămână se desfășoară pe doi ani, I și II: prima lectură se schimbă, Evanghelia nu. Un an liturgic poartă numele anului civil în care se încheie — anii impari sunt I, cei pari II.',
	'calendar.gloss.psalterWeek':
		'Liturgia orelor împarte psalmii pe patru săptămâni, de la I la IV, care se repetă de-a lungul anului. Aceasta este săptămâna ai cărei psalmi sunt cei de azi, pentru oricine se roagă orele.',
	'calendar.gloss.obligation':
		'Zi în care credincioșii sunt obligați să ia parte la Liturghie și să se abțină de la muncile care i-ar împiedica. Toate duminicile, și celelalte zile pe care le-a stabilit fiecare conferință episcopală.',
	'calendar.primer.title': 'Prima dată aici?',
	'calendar.primer.lead':
		'Biserica ține un an al ei. Începe cu Adventul, se învârte în jurul Paștilor și dă fiecărei zile un nume, un grad și o culoare — iar acestea hotărăsc ce se roagă și ce se citește în ziua aceea la Liturghie și în Liturgia orelor. Astfel „duminica a douăzeci și treia de peste an” este o adresă: îi spune unui preot, unui cor sau oricui se roagă acasă ce rugăciuni și ce lecturi sunt ale zilei de azi.',
	'calendar.primer.seasons': 'Timpurile',
	'calendar.primer.ranks': 'Ce poate fi o zi',
	'calendar.primer.colours': 'Culorile',
	'calendar.primer.cycles': 'Ciclurile',
	'calendar.primer.cyclesLead':
		'Trei numărători care, împreună, spun ce lecturi și ce psalmi sunt rânduiți pentru azi.'
};
