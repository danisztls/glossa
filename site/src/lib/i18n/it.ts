/**
 * Italian UI strings.
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

export const it: Dictionary = {
	'nav.bible': 'Bibbia',
	'nav.ccc': 'Catechismo',
	'nav.compendium': 'Compendio',
	'nav.magisterium': 'Magistero',
	'nav.socialDoctrine': 'Dottrina sociale',
	'socialDoctrine.landing.title': 'Compendio della Dottrina Sociale della Chiesa',
	'socialDoctrine.landing.tagline': 'Ciò che la Chiesa insegna sulla vita sociale, in 583 numeri.',
	'socialDoctrine.abbrev': 'CDSC',
	'nav.canonLaw': 'Diritto canonico',
	'canonLaw.landing.title': 'Codice di Diritto Canonico',
	'canonLaw.landing.tagline':
		'Il diritto della Chiesa latina, in 1752 canoni distribuiti in sette libri.',
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Cann.',
	'canonLaw.prevCanon': 'Canone precedente',
	'canonLaw.nextCanon': 'Canone successivo',
	'canonLaw.readFullTitle': 'Leggi tutto il titolo',
	'canonLaw.superseded': 'Formulazione sostituita da',
	'nav.prayers': 'Preghiere',
	'nav.bookmarks': 'Segnalibri',
	'nav.menu': 'Menu',
	'nav.sections': 'Sezioni',
	'nav.works': 'Opere',
	'nav.pages': 'Pagine',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Continua a leggere',
	'home.tagline':
		'Un sito di lettura delle Scritture, del Catechismo e dei documenti del Magistero — gratuito, disponibile offline e senza alcuna iscrizione.',
	'home.doors.heading': 'Dove andare',
	'nav.library': 'Biblioteca',
	'nav.learn': 'Imparare',
	'library.landing.tagline':
		'L’intero corpus, scaffale per scaffale — con il punto in cui vi siete fermati e ciò che avete segnato.',
	'schola.landing.title': 'Da dove cominciare',
	'schola.landing.tagline':
		'Una guida breve a quel che c’è qui: che cosa è ciascuno di questi libri, i dieci comandamenti e gli altri elenchi che la Chiesa chiede a un cattolico di conoscere, e da dove cominciare a leggere.',
	'schola.start.heading': 'Nuovo al cattolicesimo?',
	'schola.start.body': 'Comincia dal ',
	'schola.start.bodyAfter':
		': lo stesso insegnamento del Catechismo, molto più breve, scritto in domande e risposte. È lungo circa un decimo e non dà nulla per scontato.',
	'schola.bible.heading': 'Non hai mai letto la Bibbia?',
	'schola.bible.library':
		'Non è un libro ma settantatré, scritti nell’arco di più di mille anni e raccolti nell’ordine che la Chiesa ha stabilito — non l’ordine in cui i fatti sono accaduti, né quello più facile da leggere. I più cominciano dalla prima pagina e smettono qualche settimana dopo, in un lungo capitolo di legge antica, perché nulla ha ancora detto loro a che cosa serva.',
	'schola.bible.step.gospel': 'Comincia da un Vangelo',
	'schola.bible.start':
		'Uno dei quattro libri brevi sulla vita di Gesù, ben dentro e non in testa. L’idea non è nostra: un Concilio della Chiesa ha chiesto che si insegnasse il retto uso della Scrittura, «soprattutto del Nuovo Testamento e anzitutto dei Vangeli». Non ne ha indicato nessuno in particolare, e neppure noi.',
	'schola.bible.whichGospel':
		'Tre sono comunemente suggeriti, per tre ragioni diverse. Uno qualsiasi è un buon posto dove stare.',
	'schola.bible.gospel.mark':
		'Il più corto. Puoi leggerlo tutto in un pomeriggio, e averne finito uno vale più, all’inizio, che aver scelto il migliore.',
	'schola.bible.gospel.luke':
		'Scritto per qualcuno fuori dalla fede che voleva la storia messa in ordine — il che può essere esattamente il tuo caso. Prosegue diritto negli Atti degli Apostoli, quindi è in realtà la prima metà di un libro più lungo.',
	'schola.bible.gospel.john':
		'Quello che dice apertamente perché è stato scritto: «perché crediate». Parole semplici, e va dritto alla questione di chi sia Gesù.',
	'schola.bible.step.acts': 'Poi quel che accadde dopo',
	'schola.bible.thenActs':
		'Quando ne avrai finito uno, leggi che cosa fecero, dopo che egli se ne fu andato, quelli che lo avevano conosciuto.',
	'schola.bible.acts.why':
		'I trent’anni dopo la fine dei Vangeli: qualche decina di persone spaventate, e come ciò che avevano visto arrivò all’altro capo dell’impero.',
	'schola.bible.step.old': 'Poi la metà più antica',
	'schola.bible.thenOld':
		'Non dalla prima pagina, e non tutta. Alcuni luoghi portano la storia, e sono quelli a cui i Vangeli continuano a rimandare.',
	'schola.bible.ot.beginnings': 'Come comincia, e come va storta.',
	'schola.bible.ot.promise':
		'Una famiglia, e una promessa fatta a essa che sopravvive a tutti i suoi.',
	'schola.bible.ot.exodus': 'Un popolo tratto fuori dalla schiavitù, e una legge data per vivere.',
	'schola.bible.ot.psalms':
		'Non un racconto: centocinquanta preghiere e canti. Leggine uno per volta, in qualunque ordine. La Chiesa li prega ancora ogni giorno.',
	'schola.bible.bothWays':
		'Riconoscerai delle cose, e questo è il punto e non una coincidenza. La Chiesa legge i libri antichi alla luce di Cristo e quelli recenti alla luce di ciò che è venuto prima — ciascuna metà spiega l’altra, ed è per questo che nessuna si legge da sola.',
	'schola.books.heading': 'Che cosa c’è qui',
	'schola.what.scripture':
		'Le Scritture come la Chiesa le riceve, in entrambi i Testamenti. Tutto il resto qui si legge alla loro luce.',
	'schola.what.catechism':
		'Un riassunto di ciò che la Chiesa Cattolica crede, in un solo volume. Non è esso stesso una fonte: raccoglie la Scrittura, i Padri, la liturgia e l’insegnamento della Chiesa, e ogni numero dice da dove viene ciò che afferma.',
	'schola.what.compendium':
		'Lo stesso insegnamento esposto in domande e risposte, a circa un decimo della lunghezza.',
	'schola.what.magisterium':
		'Ciò che i papi e i concili hanno effettivamente scritto — encicliche, costituzioni, decreti, dichiarazioni — ciascuno rivolto a un momento e a una questione determinati. Ciascuno è noto per le sue parole iniziali in latino.',
	'schola.what.social':
		'L’insegnamento della Chiesa sul lavoro, la proprietà, la famiglia, la politica e la pace, raccolto da quei documenti in un solo libro.',
	'schola.what.law': 'Diritto e non dottrina. Dice ciò che la Chiesa richiede, e viene emendato.',
	'schola.what.doctors':
		'I teologi che la Chiesa ha dichiarato Dottori. Non porta alcuna autorità ufficiale, per quanto grande sia il suo autore.',
	'schola.what.prayers': 'Le parole che la Chiesa prega, con il latino accanto.',
	'schola.places.heading': 'Non testi, ma luoghi di questo sito',
	'schola.what.library':
		'Tutte le opere del sito in un solo elenco, raggruppate per materia e non per genere.',
	'schola.what.questions':
		'Un ingresso per chi ha una domanda e non un riferimento. Ognuna raccoglie i passi che vi rispondono — il Catechismo per primo — e ogni loro parola è della Chiesa stessa.',
	'schola.what.calendar':
		'Il giorno liturgico — tempo, colore e chi si celebra — per il paese di cui segui il calendario.',
	'schola.what.bookmarks':
		'I passi che hai segnato, e dove ti sei fermato in ciascuna opera. Entrambi restano in questo browser e non sono inviati da nessuna parte.',
	'schola.what.census':
		'Che cosa contiene questa biblioteca e fin dove arriva — quante opere, in quali lingue, e quanto di ciascuna un lettore della tua stessa lingua può davvero raggiungere.',
	'schola.formulas.decalogue': 'I dieci comandamenti',
	'ccc.noCounterpart': 'Nessuna corrispondenza nell’altra opera',
	'jumpbox.placeholder': 'Vai a… (es. giovanni 3,16, ccc 1234)',
	'jumpbox.short': 'Cerca',
	'jumpbox.hint': 'Premi / o Ctrl+K per andare a un riferimento',
	'jumpbox.noMatch': 'Nessuna corrispondenza',
	'jumpbox.suggestions': 'Suggerimenti',
	'settings.label': 'Impostazioni',
	'apparatus.label': 'Apparato',
	'apparatus.editionNotes': 'Le note di questa edizione',
	'apparatus.commentary': 'Commento',
	'apparatus.inCommentary': 'Incluso nel commento sopra.',
	'darkMode.label': 'Modo scuro',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Sì',
	'darkMode.off': 'No',
	'sepia.label': 'Seppia',
	'sepia.lightOnly': 'Solo modo chiaro',
	'sepia.noHue': 'Non in mono',
	'oled.label': 'Nero OLED',
	'oled.darkOnly': 'Solo modo scuro',
	'mono.label': 'Monocromatico',
	'mono.hint':
		'Compone l’intera pagina in un unico grigio, così nulla si distingue per il colore. Il seppia si spegne mentre è attivo.',
	'advanced.label': 'Avanzate',
	'library.title': 'Biblioteca offline',
	'library.lede': 'I testi tenuti su questo dispositivo si aprono senza alcuna rete.',
	'library.essentials': 'Preghiere e Compendio',
	'library.illustrations': 'Bibbia (illustrazioni)',
	'library.illustrationsDetail': 'Bibbia (illustrazioni, alta risoluzione)',
	'library.other': 'Altri testi',
	'library.everything': 'Tutto',
	'library.downloadAll': 'Scarica tutto',
	'library.download': 'Scarica',
	'library.downloaded': 'Su questo dispositivo',
	'library.offlineNote': 'Disattiva la modalità offline per scaricare.',
	'library.remove': 'Rimuovi da questo dispositivo',
	'library.removeConfirm': 'Rimuovere?',
	'library.forget': 'Rimuovi i download',
	'library.forgetConfirm': 'Rimuovere tutto?',
	'offline.label': 'Modalità offline',
	'offline.hint':
		'Non usa affatto la rete: non scarica nulla, non cerca aggiornamenti, non misura nulla. Si aprono soltanto i testi già presenti su questo dispositivo.',
	'offline.notDownloaded': 'Non presente su questo dispositivo',
	'loadFailed.title': 'Non si è caricato',
	'loadFailed.hint':
		'La pagina esiste — qualcosa è andato storto nel recuperarla. Riprovare di solito basta.',
	'loadFailed.retry': 'Riprova',
	'loadFailed.retrying': 'Tentativo…',
	'offline.turnOff': 'Disattiva la modalità offline',

	'type.label': 'Dimensione e carattere del testo',
	'fontSize.label': 'Dimensione del testo',
	'fontSize.small': 'Piccolo',
	'fontSize.medium': 'Medio',
	'fontSize.large': 'Grande',
	'fontSize.xlarge': 'Molto grande',
	'fontSize.xxlarge': 'Massimo',
	'face.label': 'Carattere',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Stampa questa pagina',
	'toTop.label': 'Torna su',
	'install.label': 'Installa Glossa',
	'install.hint.label': 'Aggiungi a Home',
	'install.hint.title': 'Aggiungi Glossa alla schermata Home',
	'install.hint.stepBefore': 'Si apre come un’app e si legge offline. Tocca',
	'install.hint.stepAfter': 'poi «Aggiungi a Home».',
	'install.hint.dismiss': 'Chiudi',
	'update.label': 'È disponibile una nuova edizione',
	'update.title': 'Una nuova edizione è pronta',
	'update.body': 'Ricarica per ottenere gli ultimi testi e le correzioni.',
	'update.action': 'Ricarica',
	'update.dismiss': 'Non ora',
	'edition.label': 'Edizione',
	'edition.select': 'Scegli l’edizione',
	'edition.current': 'Edizione attuale',
	'edition.filter': 'Cerca edizioni',
	'menu.noMatches': 'Nessun risultato',
	'unitNav.previous': 'Precedente',
	'unitNav.next': 'Successivo',
	'bible.prevChapter': 'Capitolo precedente',
	'bible.nextChapter': 'Capitolo successivo',
	'bible.pickBook': 'Libri e capitoli',
	'bible.landing.title': 'La Bibbia',
	'bible.landing.tagline': 'Leggi tutta la Bibbia, libro per libro, capitolo per capitolo.',
	'bible.landing.random': 'Mi sento fortunato',
	'bible.chapterUnavailable': 'Non disponibile in questa edizione',
	'bible.introduction': 'Introduzione',
	'bible.introUnavailable': 'Ancora nessuna introduzione in questa lingua',
	'bible.introSource': 'Le introduzioni non fanno parte del testo sacro.',
	'bible.testament.ot': 'Antico Testamento',
	'bible.testament.nt': 'Nuovo Testamento',
	'bible.group.pentateuch': 'Pentateuco',
	'bible.group.historical': 'Libri Storici',
	'bible.group.wisdom': 'Libri Sapienziali',
	'bible.group.prophetic': 'Libri Profetici',
	'bible.group.gospels': 'Vangeli',
	'bible.group.acts': 'Atti degli Apostoli',
	'bible.group.pauline': 'Lettere Paoline',
	'bible.group.catholicLetters': 'Lettere Cattoliche',
	'bible.group.revelation': 'Apocalisse',
	'ccc.prevParagraph': 'Paragrafo precedente',
	'ccc.nextParagraph': 'Paragrafo successivo',
	'ccc.inBrief': 'In sintesi',
	'ccc.landing.title': 'Catechismo della Chiesa Cattolica',
	'ccc.landing.pairTitle': 'Catechismo e Compendio',
	'ccc.landing.tagline':
		'<strong>Il Catechismo</strong> espone la dottrina cattolica in 2.865 numeri. <strong>Il Compendio</strong> ripropone la stessa dottrina in 598 domande e risposte, secondo lo stesso ordine.',
	'ccc.landing.pairTagline':
		'Il Catechismo della Chiesa Cattolica in 2.865 numeri, e il suo Compendio in 598 domande.',
	'ccc.tableOfContents': 'Indice',
	'ccc.related': 'Vedi anche',
	'compendium.landing.title': 'Compendio del Catechismo',
	'compendium.landing.tagline':
		'Domande e risposte che riassumono il Catechismo della Chiesa Cattolica.',
	'compendium.question': 'Domanda',
	'compendium.answer': 'Risposta',
	'compendium.tableOfContents': 'Indice',
	'compendium.prevQuestion': 'Domanda precedente',
	'compendium.nextQuestion': 'Domanda successiva',
	'compendium.condenses': 'Riassume CCC ¶¶',
	'ccc.abbrev': 'CCC',
	'ccc.condensedIn': 'Nel Compendio',
	'compendium.abbrev': 'Comp.',
	'compendium.noQuestionNumber': 'Nessun numero di domanda in questo corpus',
	'nav.summa': 'Somma',
	'doctores.landing.title': 'Dottori della Chiesa',
	'doctores.landing.tagline': 'Le opere teologiche dei Padri e Dottori della Chiesa.',
	'summa.landing.title': 'Somma teologica',
	'summa.landing.tagline': 'Tommaso d’Aquino, in inglese e nel latino in cui scrisse.',
	'summa.tableOfContents': 'Indice',
	'summa.part': 'Parte',
	'summa.question': 'Questione',
	'summa.article': 'Articolo',
	'summa.questionShort': 'Q',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titolo dall’edizione in {lang}',
	'summa.titlesFromEdition': 'Titoli dall’edizione in {lang} — questa non ne stampa',
	'summa.prologue': 'Prologo',
	'summa.objection': 'Obiezione',
	'summa.sedContra': 'In contrario',
	'summa.corpus': 'Rispondo che',
	'summa.reply': 'Risposta all’obiezione',
	'summa.preamble': 'Nota',
	'summa.prevQuestion': 'Questione precedente',
	'summa.nextQuestion': 'Questione successiva',
	'summa.noEditionInYourLanguage':
		'La Somma non ha un’edizione nella tua lingua. È mostrata in {lang}.',
	'summa.noLatinSupplement':
		'Il Supplemento esiste solo in inglese: fu compilato dopo la morte di Tommaso d’Aquino.',
	'index.division': 'Divisione',
	'index.showSubsections': 'Mostra sottosezioni',
	'index.hideSubsections': 'Nascondi sottosezioni',
	'prayers.landing.title': 'Preghiere comuni',
	'prayers.landing.tagline': 'Preghiere con il testo latino a fronte.',
	'prayers.gloss.versicle':
		'Il versetto — la riga che chi guida la preghiera dice o canta da solo. L’assemblea gli risponde con la risposta che segue.',
	'prayers.gloss.response':
		'La risposta — la riga che l’assemblea dice o canta insieme, rispondendo al versetto che la precede.',
	'prayers.tableOfContents': 'Indice',
	'prayers.seeAlso': 'Vedi anche',
	'prayers.prevPrayer': 'Preghiera precedente',
	'prayers.nextPrayer': 'Preghiera successiva',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Oggi',
	'prayers.rosary.todayHeading': 'Misteri di oggi',
	'prayers.rosary.openingPrayer': 'Preghiera iniziale',
	'prayers.rosary.decadePrayers': 'Le preghiere di una decina',
	'ref.tooltip.loading': 'Caricamento…',
	'ref.tooltip.openCcc': 'Apri nel Catechismo',
	'ref.tooltip.openBible': 'Apri nella Bibbia',
	'ref.tooltip.openCompendium': 'Apri nel Compendio',
	'ref.preview.open': 'Apri',
	'ref.cf': 'cfr.',
	'anchor.actions': 'Azioni di riferimento',
	'anchor.copy': 'Copia il testo',
	'anchor.copyLink': 'Copia il collegamento',
	'anchor.view': 'Vedi',
	'anchor.copied': 'Copiato',
	'anchor.copyFailed': 'Copia non riuscita',
	'bookmark.add': 'Segna',
	'bookmark.remove': 'Togli il segnalibro',
	'bookmark.library': 'Segnalibri',
	'bookmark.library.tagline': 'Tutto ciò che hai segnato leggendo.',
	'bookmark.empty': 'Non hai ancora segnato nulla.',
	'bookmark.emptyHint':
		'Fai clic sul numero di un versetto o di un paragrafo e scegli Segna, oppure usa il pulsante segnalibro della pagina.',
	'bookmark.about': 'Su questi segnalibri',
	'bookmark.deviceOnly':
		'I segnalibri restano solo in questo browser. Non vengono inviati da nessuna parte, e cancellare i dati del browser li rimuove.',
	'bookmark.unavailable': 'Non presente nell’edizione che stai leggendo',
	'document.library.tagline':
		'Encicliche, costituzioni conciliari, decreti e dichiarazioni del Magistero.',
	'document.filter.heading': 'Filtri',
	'document.filter.author': 'Autore',
	'document.filter.kind': 'Tipo',
	'document.filter.subject': 'Argomento',
	'document.filter.search': 'Cerca documenti',
	'document.filter.clear': 'Azzera',
	'document.filter.results': 'Documenti mostrati',
	'document.filter.noResults': 'Nessun documento corrisponde a questi filtri.',
	'document.tableOfContents': 'Indice',
	'document.startReading': 'Inizia a leggere',
	'document.readFullDocument': 'Leggi il documento completo',
	'document.section': 'Sezione',
	'document.prevSection': 'Precedente',
	'document.nextSection': 'Successivo',
	'document.kind.conciliarConstitution': 'Costituzione',
	'document.kind.conciliarDecree': 'Decreto',
	'document.kind.conciliarDeclaration': 'Dichiarazione',
	'document.kind.encyclical': 'Enciclica',
	'document.kind.apostolicExhortation': 'Esortazione apostolica',
	'document.kind.apostolicConstitution': 'Costituzione apostolica',
	'document.kind.apostolicLetter': 'Lettera apostolica',
	'document.kind.cdfDeclaration': 'Dichiarazione della CDF',
	'document.kind.cdfInstruction': 'Istruzione della CDF',
	'document.kind.cdfLetter': 'Lettera della CDF',
	'document.kind.cdfDoctrinalNote': 'Nota dottrinale della CDF',
	'document.kind.cdfResponsum': 'Responsum della CDF',
	'document.kind.cdfConsiderations': 'Considerazioni della CDF',
	'document.kindPlural.conciliarConstitution': 'Costituzioni',
	'document.kindPlural.conciliarDecree': 'Decreti',
	'document.kindPlural.conciliarDeclaration': 'Dichiarazioni',
	'document.kindPlural.encyclical': 'Encicliche',
	'document.kindPlural.apostolicExhortation': 'Esortazioni apostoliche',
	'document.kindPlural.apostolicConstitution': 'Costituzioni apostoliche',
	'document.kindPlural.apostolicLetter': 'Lettere apostoliche',
	'document.kindPlural.cdfDeclaration': 'Dichiarazioni della CDF',
	'citation.unavailable': 'Nessun testo di riferimento disponibile per questa nota.',
	'colophon.title': 'Colophon',
	'colophon.lede':
		'Che cos’è questo sito, da dove vengono i suoi testi e come ci poniamo nel riprodurli.',
	'colophon.whatThisIs': 'Che cos’è',
	'colophon.whatThisIsBody':
		'Glossa Catholica è un sito di lettura delle Scritture, del Catechismo, del Compendio e dei documenti del Magistero, in inglese, portoghese e latino. Esiste per essere letto, e nient’altro ti è chiesto per leggerlo:',
	'colophon.pointFree':
		'Gratuito, e sempre gratuito. Nessun abbonamento, nessun accesso a pagamento, nulla da comprare.',
	'colophon.pointNoAds': 'Nessuna pubblicità, né alcuna forma di collocazione sponsorizzata.',
	'colophon.pointNoAccounts': 'Nessun account. Niente a cui iscriversi, niente a cui accedere.',
	'colophon.pointNoTracking':
		'Nessuno script di tracciamento, nessun codice di terze parti, nessun cookie. Solo conteggi d’uso anonimi, nulla che ti identifichi.',
	'colophon.pointOffline':
		'Costruito per continuare a funzionare offline una volta che l’hai visitato, così che una connessione scarsa non sia un ostacolo alla lettura.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica è un’iniziativa privata di fedeli laici. Non ha alcuna approvazione ecclesiastica e non parla con autorità propria.',
	'footer.notEndorsed': 'Senza approvazione della Santa Sede',
	'colophon.textsTitle': 'I testi',
	'colophon.textsBody':
		'Ogni testo proviene da una fonte dichiarata, e ogni opera registra la sua edizione, la sua pagina d’origine e la data in cui è stata recuperata. La Scrittura usa traduzioni di pubblico dominio; il Catechismo, il Compendio e i documenti del Magistero vengono dai testi pubblicati dalla Santa Sede stessa.',
	'colophon.textsFidelity':
		'Il testo non è mai abbreviato, mai parafrasato, mai riscritto, e mai accostato a pubblicità. Ripariamo invece i difetti evidenti — una parola caduta, una citazione rovinata, un markup che ha inghiottito un paragrafo — sempre verso ciò che la fonte stessa stampa, mai verso ciò che noi pensiamo dovrebbe dire.',
	'colophon.countBible': 'edizioni della Bibbia',
	'colophon.countDocuments': 'documenti del Magistero',
	'colophon.privacyTitle': 'Privacy',
	'colophon.privacyBody1':
		'Nessun account, nessun cookie, nessuna pubblicità, nessun codice di terze parti. Niente qui ti segue fuori da questo sito.',
	'colophon.privacyBody2':
		'Contiamo comunque come viene usato il sito: una misurazione per visita, ogni campo un intervallo anziché un valore — quanto sei rimasto, quante volte sei stato qui, quali opere hai aperto. Il tuo paese è contato separatamente, senza alcun collegamento con il resto. Descrive una visita, non un visitatore, ed è conservato per {days} giorni.',
	'colophon.privacyBody3':
		'Mai inviato: ciò che scrivi nella casella di ricerca, quale passo avevi aperto, o qualunque cosa possa riconoscere di nuovo il tuo dispositivo. Le tue impostazioni, i segnalibri e i testi scaricati restano sul tuo dispositivo.',
	'colophon.copyrightTitle': 'Diritto d’autore',
	'colophon.copyrightBody1':
		'Il Catechismo, il Compendio e i documenti del Magistero sono proprietà dei rispettivi titolari dei diritti — principalmente la Libreria Editrice Vaticana e il Dicastero per la Comunicazione.',
	'colophon.copyrightBody2':
		'Ogni opera mostra la nota di copyright del suo titolare, nelle sue parole, e rimanda alla pagina da cui è stata presa.',
	'colophon.copyrightBody3':
		'Se detieni diritti su un testo qui presente e preferisci che non sia pubblicato, scrivici.',
	'colophon.contactTitle': 'Contatti',
	'colophon.contactBody': 'Per qualsiasi cosa, compreso quanto sopra:',
	'colophon.contactPending':
		'Non è ancora stato fissato un indirizzo di contatto. Questo sito non dovrebbe essere reso pubblico finché non ne ha uno — l’impegno qui sopra non ha senso senza un modo per raggiungerci.',
	'colophon.illustrationsTitle': 'Le illustrazioni',
	'colophon.illustrationsBody':
		'La Bibbia porta le incisioni di Gustave Doré, ciascuna posta al versetto che raffigura — l’ultimo e il più ampio dei suoi cicli biblici, inciso su legno dai suoi disegni e stampato con il testo anziché raccolto in fondo al volume.',
	'colophon.illustrationsRights':
		'Sono di pubblico dominio, come mostrano le date qui sotto, e la riproduzione fotografica fedele di un’incisione di pubblico dominio non genera alcun nuovo diritto d’autore.',
	'colophon.countPlates': 'incisioni',
	'colophon.countPlateChapters': 'capitoli illustrati',
	'plates.scansBy': 'Scansioni fornite da',
	'plates.enlarge': 'Ingrandisci {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'Su questa immagine',
	'art.detail': 'particolare',
	'colophon.typeTitle': 'I caratteri',
	'colophon.typeBody':
		'Composto in EB Garamond, la rinascita a opera di Georg Duffner e Octavio Pardo dei caratteri che Claude Garamont incise negli anni 1590 — la tradizione umanistica in cui la Chiesa stampa fin dal Rinascimento. Il suo cirillico è della stessa mano ma non fa rivivere nulla: un Garamond cirillico non è mai stato inciso, così il russo è composto in una forma disegnata per stare accanto al resto.',
	'colophon.typeArabic':
		'L’arabo le sfugge del tutto ed è composto in Amiri — la rinascita a opera di Khaled Hosny del naskh inciso per la stamperia di Bulaq al Cairo nel 1905, scelta con lo stesso ragionamento del carattere del testo: un preciso tipo librario storico anziché un disegno contemporaneo.',
	'colophon.typeInitials':
		'I capilettera sono in Pirata One, una gotica le cui maiuscole restano leggibili alla dimensione che un capolettera richiede, e — per il russo — in Ponomar, che riproduce il carattere slavo ecclesiastico della Stamperia sinodale. Ponomar compone il capolettera e mai il testo: un’enciclica moderna composta interamente in carattere sinodale direbbe di sé qualcosa di falso. Tutti sono sotto licenza SIL Open Font License e serviti da questo sito anziché da terzi, così che leggere una pagina non chieda nulla al server di nessun altro.',
	'refs.citedIn': 'Citato in',
	'refs.externalVolume': 'Volume {volume} su {host} — PDF scansionato',
	'bible.wholeChapter': 'Questo capitolo',
	'bible.verseNotInEdition':
		'Questo numero di versetto non è in questa edizione — vedi la nota nella fonte della pagina',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Nota',
	'bible.noteMissing': 'Questa nota manca nel corpus',
	'bible.chapterArgument': 'Argomento',
	'ccc.readFullChapter': 'Leggi tutto il capitolo',
	'ccc.noParagraphNumber': 'Nessun numero di paragrafo in questo corpus',
	'copyright.sourceTitle': 'Apri la pagina di origine',
	'copyright.sourceLabel': 'Fonte',
	'lang.label': 'Lingua',
	'lang.filter': 'Cerca lingue',
	'lang.more': 'altre lingue',
	'notFound.title': 'Non c’è nulla a questo indirizzo',
	'notFound.lede': 'La pagina che hai chiesto non è qui.',
	'notFound.body':
		'Il collegamento può essere scritto male o non più valido, oppure può puntare a un testo che questo sito non porta.',
	'notFound.searchHint':
		'Se conosci il riferimento che cerchi — un libro e un capitolo, un paragrafo del Catechismo — scrivilo nel campo di ricerca in cima a questa pagina.',
	'notFound.credit': 'Da British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Oppure parti da una di queste:',
	'notFound.home': 'Home',
	'compare.enter': 'Confronta le edizioni',
	'compare.exit': 'Esci dal confronto',
	'compare.missing': 'Non presente in questa edizione',
	'compare.versificationNote':
		'Queste due edizioni dividono in alcuni punti i versetti di questo capitolo in modo diverso (una variante testuale, non una scelta di traduzione) — lo stesso numero di versetto non segna sempre la stessa frase nelle due colonne.',
	'compare.loading': 'Caricamento della seconda lingua…',
	'ui.close': 'Chiudi',
	'shortcuts.title': 'Scorciatoie da tastiera',
	'shortcuts.betweenDocuments': 'Tra i documenti',
	'shortcuts.withinDocument': 'Nel documento',
	'shortcuts.show': 'Mostra questo elenco',
	'help.title': 'Aiuto',
	'help.reading.heading': 'La barra sopra un testo',
	'help.feature.offline':
		'Aggiungi il sito alla schermata iniziale e si apre come un’app. Puoi scaricare opere intere per leggerle senza connessione.',
	'help.feature.contents':
		'Le divisioni dell’opera in cui ti trovi — libri, parti, capitoli — per muoverti al suo interno senza tornare all’inizio.',
	'help.feature.compare':
		'Due edizioni dello stesso passo, affiancate — il latino accanto alla tua lingua, o una traduzione accanto a un’altra.',
	'help.feature.apparatus':
		'Le note proprie di un’edizione, e qualunque commento scritto sul testo, sono offerti accanto a esso e non sotto. Le citazioni dentro il testo sono collegamenti: un riferimento porta dove punta.',
	'help.feature.focus':
		'Toglie tutto tranne il testo. L’uscita resta dov’era la barra, così nulla rimane intrappolato dietro.',
	'zen.enter': 'Modalità concentrazione',
	'zen.exit': 'Esci dalla modalità concentrazione',
	'nav.calendar': 'Calendario',
	'calendar.title': 'Calendario liturgico',
	'calendar.tagline':
		'Il Calendario Romano Generale, calcolato per qualunque giorno: il suo tempo, il suo grado, il suo colore.',
	'calendar.national.tagline':
		'{name}, con le celebrazioni che gli sono proprie, calcolato per qualunque giorno.',
	'calendar.calendar': 'Calendario',
	'calendar.which.general': 'Calendario Romano Generale',
	'calendar.filter': 'Cerca paesi',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Americhe',
	'calendar.region.africa': 'Africa',
	'calendar.region.middleEast': 'Medio Oriente',
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oceania',
	'calendar.today': 'Oggi',
	'calendar.previousMonth': 'Mese precedente',
	'calendar.nextMonth': 'Mese successivo',
	'calendar.plainDays': 'Ferie semplici',
	'calendar.noSuchDay': 'Per quella data non è calcolato alcun giorno liturgico.',
	'calendar.week': 'settimana',
	'calendar.alsoToday': 'Oggi si celebra anche',
	'calendar.alsoObserved': 'Oggi ricorre anche',
	'calendar.obligation': 'Festa di precetto',
	'calendar.obligationCanon': 'CIC Can. 1246',
	'calendar.sundayCycle': 'Ciclo domenicale',
	'calendar.weekdayCycle': 'Ciclo feriale',
	'calendar.psalterWeek': 'Settimana del salterio',
	'lectionary.heading': 'Letture della Messa',
	'lectionary.slot.reading': 'Lettura',
	'lectionary.slot.reading1': 'Prima Lettura',
	'lectionary.slot.reading2': 'Seconda Lettura',
	'lectionary.slot.reading3': 'Terza Lettura',
	'lectionary.slot.reading4': 'Quarta Lettura',
	'lectionary.slot.reading5': 'Quinta Lettura',
	'lectionary.slot.reading6': 'Sesta Lettura',
	'lectionary.slot.reading7': 'Settima Lettura',
	'lectionary.slot.psalm': 'Salmo Responsoriale',
	'lectionary.slot.epistle': 'Epistola',
	'lectionary.slot.acclamation': 'Canto al Vangelo',
	'lectionary.slot.gospel': 'Vangelo',
	'lectionary.slot.sequence': 'Sequenza',
	'lectionary.or': 'o',
	'lectionary.cf': 'Cfr.',
	'lectionary.about': 'Su queste letture',
	'lectionary.caveat':
		'I passi stabiliti dall’Ordo Lectionum Missae, collegati alle edizioni proprie di questo sito — non la traduzione proclamata in una chiesa particolare, e una conferenza episcopale può adattare il calendario delle letture.',
	'calendar.transferredFrom': 'Trasferito dal',
	'calendar.season.advent': 'Avvento',
	'calendar.season.christmas': 'Tempo di Natale',
	'calendar.season.lent': 'Quaresima',
	'calendar.season.triduum': 'Triduo pasquale',
	'calendar.season.easter': 'Tempo di Pasqua',
	'calendar.season.ordinary': 'Tempo Ordinario',
	'calendar.colour.white': 'Bianco',
	'calendar.colour.red': 'Rosso',
	'calendar.colour.green': 'Verde',
	'calendar.colour.violet': 'Viola',
	'calendar.colour.rose': 'Rosaceo',
	'calendar.colour.black': 'Nero',
	'calendar.colour.blue': 'Azzurro',
	'calendar.rank.solemnity': 'Solennità',
	'calendar.rank.feast': 'Festa',
	'calendar.rank.memorial': 'Memoria',
	'calendar.rank.optional-memorial': 'Memoria facoltativa',
	'calendar.rank.commemoration': 'Commemorazione',
	'calendar.rank.sunday': 'Domenica',
	'calendar.rank.weekday': 'Feria',
	'calendar.gloss.season.advent':
		'Le quattro settimane prima del Natale: preparazione alla venuta del Signore, e inizio dell’anno della Chiesa.',
	'calendar.gloss.season.christmas':
		'Dal Natale al Battesimo del Signore, celebrando la nascita del Signore e la sua manifestazione al mondo.',
	'calendar.gloss.season.lent':
		'I quaranta giorni dal Mercoledì delle Ceneri alla Messa vespertina nella Cena del Signore: penitenza, elemosina e preparazione alla Pasqua.',
	'calendar.gloss.season.triduum':
		'I tre giorni dalla sera del Giovedì Santo alla sera della Domenica di Pasqua — passione, morte e risurrezione del Signore, e culmine di tutto l’anno.',
	'calendar.gloss.season.easter':
		'I cinquanta giorni dalla Pasqua alla Pentecoste, celebrati come un’unica festa — «una sola grande domenica».',
	'calendar.gloss.season.ordinary':
		'Le trentatré o trentaquattro settimane fuori dagli altri tempi. Non tempo «qualunque» ma ordinato: le settimane sono contate, e la Chiesa legge di seguito la vita e l’insegnamento del Signore. Viene in due tratti — dopo il tempo di Natale fino alla Quaresima, e dopo la Pentecoste fino all’Avvento.',
	'calendar.gloss.rank.solemnity':
		'Il grado più alto: la Pasqua, il Natale, l’Ascensione, il patrono di un luogo. Si celebra con il Gloria e il Credo, e comincia la sera prima.',
	'calendar.gloss.rank.feast':
		'Si celebra entro il giorno stesso. Gli apostoli e gli evangelisti, e i giorni maggiori del Signore e della Madonna.',
	'calendar.gloss.rank.memorial':
		'Un santo ricordato nel suo giorno, dentro la Messa e l’Ufficio del tempo. Obbligatoria dove si celebra.',
	'calendar.gloss.rank.optional-memorial':
		'Si può celebrare o no, a scelta del sacerdote o della comunità. Se non si celebra, il giorno è semplicemente la feria.',
	'calendar.gloss.rank.commemoration':
		'Ciò che una memoria diventa in Quaresima: un’orazione aggiunta alla Messa feriale, che il tempo per il resto mantiene intera.',
	'calendar.gloss.rank.sunday':
		'La festa prima — il Giorno del Signore, celebrato ogni settimana dalla risurrezione. Solo una solennità o una festa del Signore può spostarla, e in Avvento, Quaresima e tempo pasquale nemmeno quelle.',
	'calendar.gloss.rank.weekday':
		'Un giorno senza celebrazione propria. La Messa e l’Ufficio sono quelli del tempo, ed è questo a rendere il tempo la cosa da conoscere.',
	'calendar.gloss.colour.white':
		'Gioia. Tempo pasquale e tempo di Natale, i giorni del Signore fuori dalla sua passione, la Madonna, gli angeli, e i santi che non furono martiri.',
	'calendar.gloss.colour.red':
		'Sangue e fuoco. Domenica delle Palme e Venerdì Santo, la Pentecoste, gli apostoli e gli evangelisti, e i martiri.',
	'calendar.gloss.colour.green': 'Tempo ordinario: il colore della speranza e di ciò che cresce.',
	'calendar.gloss.colour.violet': 'Avvento e Quaresima, e portato anche nelle Messe per i defunti.',
	'calendar.gloss.colour.rose':
		'Portato due volte l’anno — la domenica Gaudete, terza d’Avvento, e la domenica Laetare, quarta di Quaresima — dove il digiuno si alleggerisce e la fine è in vista.',
	'calendar.gloss.colour.black': 'Può essere portato nelle Messe per i defunti.',
	'calendar.gloss.colour.blue':
		'Il privilegio dell’azzurro: portato per l’Immacolata Concezione in Spagna, nelle Filippine e nei pochi altri luoghi a cui la Santa Sede l’ha concesso.',
	'calendar.gloss.sundayCycle':
		'Le letture domenicali corrono su tre anni — A, B e C — leggendo a turno Matteo, Marco e Luca, con Giovanni lungo la Quaresima e il tempo pasquale. Il ciclo cambia alla prima domenica d’Avvento, con l’anno della Chiesa.',
	'calendar.gloss.weekdayCycle':
		'Le letture feriali corrono su due anni, I e II: la prima lettura cambia, il Vangelo no. Un anno liturgico prende il nome dall’anno civile in cui finisce — gli anni dispari sono I, i pari II.',
	'calendar.gloss.psalterWeek':
		'La Liturgia delle Ore distribuisce i salmi su quattro settimane, dalla I alla IV, che si ripetono lungo l’anno. Questa è la settimana i cui salmi sono quelli di oggi, per chi prega le Ore.',
	'calendar.gloss.obligation':
		'Giorno in cui i fedeli sono tenuti a partecipare alla Messa e ad astenersi dai lavori che lo impedirebbero. Tutte le domeniche, e gli altri giorni che ciascuna conferenza episcopale ha determinato.',
	'calendar.primer.title': 'È la prima volta?',
	'calendar.primer.lead':
		'La Chiesa custodisce un anno suo. Comincia con l’Avvento, gira intorno alla Pasqua e dà a ogni giorno un nome, un grado e un colore — e questi decidono che cosa si prega e si legge quel giorno alla Messa e nella Liturgia delle Ore. Così «ventitreesima domenica del tempo ordinario» è un indirizzo: dice a un sacerdote, a un coro, o a chi prega in casa, quali orazioni e quali letture sono quelle di oggi.',
	'calendar.primer.seasons': 'I tempi',
	'calendar.primer.ranks': 'Che cosa può essere un giorno',
	'calendar.primer.colours': 'I colori',
	'calendar.primer.cycles': 'I cicli',
	'calendar.primer.cyclesLead':
		'Tre contatori che, insieme, dicono quali letture e quali salmi sono assegnati a oggi.'
};
