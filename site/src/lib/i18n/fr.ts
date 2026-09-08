/**
 * French UI strings.
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

export const fr: Dictionary = {
	'nav.bible': 'Bible',
	'nav.ccc': 'Catéchisme',
	'nav.compendium': 'Abrégé',
	'nav.magisterium': 'Magistère',
	'nav.socialDoctrine': 'Doctrine sociale',
	'socialDoctrine.landing.title': 'Compendium de la doctrine sociale de l’Église',
	'socialDoctrine.landing.tagline':
		'Ce que l’Église enseigne sur la vie en société, en 583 numéros.',
	'nav.canonLaw': 'Droit canonique',
	'canonLaw.landing.title': 'Code de droit canonique',
	'canonLaw.landing.tagline':
		'Le droit de l’Église latine, en 1752 canons répartis en sept livres.',
	'canonLaw.canon': 'Can.',
	'canonLaw.canons': 'Cann.',
	'canonLaw.prevCanon': 'Canon précédent',
	'canonLaw.nextCanon': 'Canon suivant',
	'canonLaw.readFullTitle': 'Lire tout le titre',
	'canonLaw.superseded': 'Rédaction remplacée par',
	'nav.prayers': 'Prières',
	'nav.bookmarks': 'Signets',
	'nav.menu': 'Menu',
	'nav.sections': 'Sections',
	'nav.works': 'Œuvres',
	'nav.pages': 'Pages',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Reprendre la lecture',
	'home.tagline':
		'Un site de lecture des Écritures, du Catéchisme et des documents du Magistère — gratuit, consultable hors ligne, et sans aucune inscription.',
	'home.doors.heading': 'Où aller',
	'home.find.heading': 'Ou tapez une référence',
	'nav.library': 'Bibliothèque',
	'nav.learn': 'Apprendre',
	'library.landing.tagline':
		'L’ensemble du corpus, rayon par rayon — avec l’endroit où vous vous êtes arrêté et ce que vous avez marqué.',
	'schola.landing.title': 'Par où commencer',
	'schola.landing.tagline':
		'Un guide bref de ce qui se trouve ici : ce qu’est chacun de ces livres, comment s’écrit une citation, comment trouver un passage, et des ordres de lecture que l’Église a proposés.',
	'schola.start.heading': 'Vous découvrez le catholicisme ?',
	'schola.start.body': 'Commencez par l’',
	'schola.start.bodyAfter':
		' : le même enseignement que le Catéchisme, beaucoup plus court, écrit en questions et réponses. Il fait environ le dixième de sa longueur et ne suppose rien.',
	'schola.bible.heading': 'Jamais lu la Bible ?',
	'schola.bible.library':
		'Ce n’est pas un livre mais soixante-treize, écrits sur plus de mille ans et réunis dans l’ordre que l’Église a fixé — non l’ordre où les événements se sont produits, ni celui qui se lit le plus aisément. La plupart des gens commencent à la première page et s’arrêtent quelques semaines plus tard, dans un long chapitre de loi ancienne, parce que rien ne leur a encore dit à quoi cela sert.',
	'schola.bible.step.gospel': 'Commencez par un Évangile',
	'schola.bible.start':
		'L’un des quatre livres brefs sur la vie de Jésus, bien à l’intérieur et non en tête. L’idée n’est pas de nous : un Concile de l’Église a demandé que soit enseigné le juste usage de l’Écriture, « surtout du Nouveau Testament et avant tout des Évangiles ». Il n’en a désigné aucun en particulier, et nous non plus.',
	'schola.bible.whichGospel':
		'Trois sont couramment proposés, pour trois raisons différentes. N’importe lequel est un bon endroit où se trouver.',
	'schola.bible.gospel.mark':
		'Le plus court. Vous pouvez le lire en entier en une après-midi, et en avoir fini un vaut mieux, au départ, que d’avoir choisi le meilleur.',
	'schola.bible.gospel.luke':
		'Écrit pour quelqu’un du dehors qui voulait le récit mis en ordre — ce qui est peut-être exactement votre cas. Il enchaîne directement sur les Actes des Apôtres : c’est en réalité la première moitié d’un livre plus long.',
	'schola.bible.gospel.john':
		'Celui qui dit franchement pourquoi il a été écrit : « afin que vous croyiez ». Des mots simples, et il va droit à la question de savoir qui est Jésus.',
	'schola.bible.step.acts': 'Puis ce qui s’est passé ensuite',
	'schola.bible.thenActs':
		'Quand vous en aurez fini un, lisez ce qu’ont fait, après son départ, ceux qui l’avaient connu.',
	'schola.bible.acts.why':
		'Les trente ans qui suivent la fin des Évangiles : quelques dizaines de gens effrayés, et comment ce qu’ils avaient vu a atteint l’autre bout de l’empire.',
	'schola.bible.step.old': 'Puis la moitié plus ancienne',
	'schola.bible.thenOld':
		'Pas depuis la première page, et pas en entier. Quelques endroits portent le récit, et ce sont ceux vers lesquels les Évangiles ne cessent de renvoyer.',
	'schola.bible.ot.beginnings': 'Comment cela commence, et comment cela tourne mal.',
	'schola.bible.ot.promise':
		'Une famille, et une promesse qui lui est faite et survit à tous les siens.',
	'schola.bible.ot.exodus':
		'Un peuple tiré de l’esclavage, et une loi qui lui est donnée pour vivre.',
	'schola.bible.ot.psalms':
		'Non un récit : cent cinquante prières et chants. Lisez-en un à la fois, dans n’importe quel ordre. L’Église les prie encore chaque jour.',
	'schola.bible.bothWays':
		'Vous reconnaîtrez des choses, et c’est le but plutôt qu’une coïncidence. L’Église lit les livres anciens à la lumière du Christ et les récents à la lumière de ce qui a précédé — chaque moitié explique l’autre, et c’est pourquoi aucune ne se lit seule.',
	'schola.books.heading': 'Ce qui est ici, et comment cela s’identifie',
	'schola.books.lede':
		'Chacun de ces livres est d’un genre différent, et chacun se désigne par un numéro qui lui est propre. Les exemples montrent la forme : tapez-en un semblable dans la case de recherche et vous arrivez au passage.',
	'schola.cite.label': 'S’identifie',
	'schola.what.scripture':
		'Les Écritures telles que l’Église les reçoit, dans les deux Testaments. Tout le reste ici se lit à leur lumière.',
	'schola.cite.scripture':
		'livre, chapitre et verset, dans les abréviations qu’imprime votre propre édition',
	'schola.what.catechism':
		'Un résumé de ce que croit l’Église catholique, en un seul volume. Il n’est pas lui-même une source : il rassemble l’Écriture, les Pères, la liturgie et l’enseignement de l’Église, et chaque numéro dit d’où vient ce qu’il avance.',
	'schola.cite.catechism':
		'par numéro, courant sans interruption de la première page à la dernière',
	'schola.what.compendium':
		'Le même enseignement exposé en questions et réponses, au dixième environ de la longueur.',
	'schola.cite.compendium': 'par numéro de question',
	'schola.what.magisterium':
		'Ce que les papes et les conciles ont effectivement écrit — encycliques, constitutions, décrets, déclarations — chacun adressé à un moment et à une question déterminés. Chacun est connu par ses premiers mots latins.',
	'schola.cite.magisterium': 'par le nom du document, puis un numéro de section à l’intérieur',
	'schola.what.social':
		'L’enseignement de l’Église sur le travail, la propriété, la famille, la politique et la paix, recueilli de ces documents en un seul livre.',
	'schola.cite.social': 'par numéro, sous le sigle que l’ouvrage emploie pour lui-même',
	'schola.what.law':
		'Du droit et non de la doctrine. Il dit ce que l’Église exige, et il est amendé.',
	'schola.cite.law': 'par canon, nom que portent ses unités numérotées',
	'schola.what.doctors':
		'Les théologiens que l’Église a déclarés Docteurs. Cela ne porte aucune autorité officielle, si grand que soit l’auteur.',
	'schola.cite.doctors': 'par partie, puis question — les divisions propres à la Somme',
	'schola.what.prayers': 'Les paroles que l’Église prie, avec le latin à côté.',
	'schola.cite.prayers': 'par leur nom ; il n’y a pas de numéros à citer',
	'schola.places.heading': 'Non des textes, mais des lieux de ce site',
	'schola.what.library':
		'Toutes les œuvres du site en une liste, groupées par sujet et non par genre.',
	'schola.what.calendar':
		'Le jour liturgique — temps, couleur, et qui est fêté — pour le pays dont vous suivez le calendrier.',
	'schola.what.bookmarks':
		'Les passages que vous avez marqués, et où vous vous êtes arrêté dans chaque œuvre. Les deux restent dans ce navigateur et ne sont envoyés nulle part.',
	'ccc.noCounterpart': 'Pas de correspondance dans l’autre ouvrage',
	'jumpbox.placeholder': 'Aller à… (p. ex. jean 3,16, ccc 1234)',
	'jumpbox.short': 'Rechercher',
	'jumpbox.hint': 'Appuyez sur / ou Ctrl+K pour aller à une référence',
	'jumpbox.noMatch': 'Aucun résultat',
	'jumpbox.suggestions': 'Suggestions',
	'settings.label': 'Paramètres',
	'apparatus.label': 'Apparat',
	'apparatus.editionNotes': 'Notes de cette édition',
	'apparatus.commentary': 'Commentaire',
	'apparatus.inCommentary': 'Inclus dans le commentaire ci-dessus.',
	'darkMode.label': 'Mode sombre',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Oui',
	'darkMode.off': 'Non',
	'sepia.label': 'Sépia',
	'sepia.lightOnly': 'Mode clair seul',
	'sepia.noHue': 'Pas en mono',
	'oled.label': 'Noir OLED',
	'oled.darkOnly': 'Mode sombre seul',
	'mono.label': 'Monochrome',
	'mono.hint':
		'Compose toute la page dans un seul gris, de sorte que rien ne se distingue par la couleur. Le sépia s’éteint tant qu’il est actif.',
	'advanced.label': 'Avancé',
	'library.title': 'Bibliothèque hors ligne',
	'library.lede': 'Les textes conservés sur cet appareil s’ouvrent sans aucun réseau.',
	'library.essentials': 'Prières et Abrégé',
	'library.illustrations': 'Bible (illustrations)',
	'library.illustrationsDetail': 'Bible (illustrations, haute résolution)',
	'library.other': 'Autres textes',
	'library.everything': 'Tout',
	'library.downloadAll': 'Tout télécharger',
	'library.download': 'Télécharger',
	'library.downloaded': 'Sur cet appareil',
	'library.offlineNote': 'Désactivez le mode hors ligne pour télécharger.',
	'library.remove': 'Retirer de cet appareil',
	'library.removeConfirm': 'Retirer ?',
	'library.forget': 'Supprimer les téléchargements',
	'library.forgetConfirm': 'Tout supprimer ?',
	'offline.label': 'Mode hors ligne',
	'offline.hint':
		'N’utilise aucun réseau : rien n’est téléchargé, aucune mise à jour n’est recherchée, rien n’est mesuré. Seuls les textes déjà présents sur cet appareil s’ouvrent.',
	'offline.notDownloaded': 'Absent de cet appareil',
	'loadFailed.title': 'Cela n’a pas été chargé',
	'loadFailed.hint':
		'La page existe — quelque chose s’est mal passé lors de sa récupération. Réessayer suffit le plus souvent.',
	'loadFailed.retry': 'Réessayer',
	'loadFailed.retrying': 'Nouvel essai…',
	'offline.turnOff': 'Désactiver le mode hors ligne',

	'type.label': 'Taille du texte et police',
	'fontSize.label': 'Taille du texte',
	'fontSize.small': 'Petit',
	'fontSize.medium': 'Moyen',
	'fontSize.large': 'Grand',
	'fontSize.xlarge': 'Très grand',
	'fontSize.xxlarge': 'Maximum',
	'face.label': 'Police',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Imprimer cette page',
	'toTop.label': 'Revenir en haut',
	'install.label': 'Installer Glossa',
	'install.hint.label': 'Sur l’écran d’accueil',
	'install.hint.title': 'Ajoutez Glossa à votre écran d’accueil',
	'install.hint.stepBefore': 'Elle s’ouvre comme une application et se lit hors ligne. Touchez',
	'install.hint.stepAfter': 'puis « Sur l’écran d’accueil ».',
	'install.hint.dismiss': 'Ignorer',
	'update.label': 'Une nouvelle édition est disponible',
	'update.title': 'Une nouvelle édition est prête',
	'update.body': 'Rechargez pour recevoir les derniers textes et corrections.',
	'update.action': 'Recharger',
	'update.dismiss': 'Pas maintenant',
	'edition.label': 'Édition',
	'edition.select': 'Choisir l’édition',
	'edition.current': 'Édition actuelle',
	'edition.filter': 'Rechercher une édition',
	'menu.noMatches': 'Aucun résultat',
	'unitNav.previous': 'Précédent',
	'unitNav.next': 'Suivant',
	'bible.prevChapter': 'Chapitre précédent',
	'bible.nextChapter': 'Chapitre suivant',
	'bible.pickBook': 'Livres et chapitres',
	'bible.landing.title': 'La Bible',
	'bible.landing.tagline': 'Lisez toute la Bible, livre après livre, chapitre après chapitre.',
	'bible.landing.random': "J'ai de la chance",
	'bible.landing.books': 'Livres',
	'bible.chapterUnavailable': 'Non disponible dans cette édition',
	'bible.introduction': 'Introduction',
	'bible.introUnavailable': 'Pas encore d’introduction dans cette langue',
	'bible.introSource': 'Les introductions ne font pas partie du texte de l’Écriture.',
	'bible.testament.ot': 'Ancien Testament',
	'bible.testament.nt': 'Nouveau Testament',
	'bible.group.pentateuch': 'Pentateuque',
	'bible.group.historical': 'Livres historiques',
	'bible.group.wisdom': 'Livres poétiques et sapientiaux',
	'bible.group.prophetic': 'Livres prophétiques',
	'bible.group.gospels': 'Évangiles',
	'bible.group.acts': 'Actes des Apôtres',
	'bible.group.pauline': 'Épîtres de saint Paul',
	'bible.group.catholicLetters': 'Épîtres catholiques',
	'bible.group.revelation': 'Apocalypse',
	'ccc.prevParagraph': 'Paragraphe précédent',
	'ccc.nextParagraph': 'Paragraphe suivant',
	'ccc.inBrief': 'En bref',
	'ccc.landing.title': 'Catéchisme de l’Église catholique',
	'ccc.landing.pairTitle': 'Catéchisme et Abrégé',
	'ccc.landing.tagline':
		'<strong>Le Catéchisme</strong> expose la doctrine catholique en 2 865 numéros. <strong>Le Compendium</strong> reprend la même doctrine en 598 questions et réponses, selon le même plan.',
	'ccc.landing.pairTagline':
		'Le Catéchisme de l’Église catholique en 2 865 numéros, et son Abrégé en 598 questions.',
	'ccc.tableOfContents': 'Table des matières',
	'ccc.related': 'Voir aussi',
	'compendium.landing.title': 'Abrégé du Catéchisme',
	'compendium.landing.tagline':
		'Questions et réponses résumant le Catéchisme de l’Église catholique.',
	'compendium.question': 'Question',
	'compendium.answer': 'Réponse',
	'compendium.tableOfContents': 'Table des matières',
	'compendium.prevQuestion': 'Question précédente',
	'compendium.nextQuestion': 'Question suivante',
	'compendium.condenses': 'Résume CEC ¶¶',
	'ccc.abbrev': 'CEC',
	'ccc.condensedIn': 'Dans le Compendium',
	'compendium.abbrev': 'Comp.',
	'compendium.noQuestionNumber': 'Pas de numéro de question dans ce corpus',
	'nav.summa': 'Somme',
	'doctores.landing.title': 'Docteurs de l’Église',
	'doctores.landing.tagline': 'Les œuvres théologiques des Pères et Docteurs de l’Église.',
	'summa.landing.title': 'Somme théologique',
	'summa.landing.tagline': 'Thomas d’Aquin, en anglais et dans le latin qu’il a écrit.',
	'summa.tableOfContents': 'Table des matières',
	'summa.part': 'Partie',
	'summa.question': 'Question',
	'summa.article': 'Article',
	'summa.questionShort': 'Q',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Titre tiré de l’édition en {lang}',
	'summa.titlesFromEdition': 'Titres tirés de l’édition en {lang} — celle-ci n’en imprime aucun',
	'summa.prologue': 'Prologue',
	'summa.objection': 'Objection',
	'summa.sedContra': 'Au contraire',
	'summa.corpus': 'Réponse',
	'summa.reply': 'Réponse à l’objection',
	'summa.preamble': 'Note',
	'summa.prevQuestion': 'Question précédente',
	'summa.nextQuestion': 'Question suivante',
	'summa.noEditionInYourLanguage':
		'La Somme n’a pas d’édition dans votre langue. Elle est présentée en {lang}.',
	'summa.noLatinSupplement':
		'Le Supplément n’existe qu’en anglais : il a été compilé après la mort de Thomas d’Aquin.',
	'index.division': 'Division',
	'index.showSubsections': 'Afficher les sous-sections',
	'index.hideSubsections': 'Masquer les sous-sections',
	'prayers.landing.title': 'Prières usuelles',
	'prayers.landing.tagline': 'Des prières avec le texte latin en regard.',
	'prayers.gloss.versicle':
		'Le verset — la ligne que dit ou chante seul celui qui conduit la prière. L’assemblée y répond par le répons qui suit.',
	'prayers.gloss.response':
		'Le répons — la ligne que l’assemblée dit ou chante ensemble, en réponse au verset qui précède.',
	'prayers.tableOfContents': 'Table des matières',
	'prayers.seeAlso': 'Voir aussi',
	'prayers.prevPrayer': 'Prière précédente',
	'prayers.nextPrayer': 'Prière suivante',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Aujourd’hui',
	'prayers.rosary.todayHeading': 'Mystères du jour',
	'prayers.rosary.openingPrayer': 'Prière d’ouverture',
	'prayers.rosary.decadePrayers': 'Les prières d’une dizaine',
	'ref.tooltip.loading': 'Chargement…',
	'ref.tooltip.openCcc': 'Ouvrir dans le Catéchisme',
	'ref.tooltip.openBible': 'Ouvrir dans la Bible',
	'ref.tooltip.openCompendium': 'Ouvrir dans l’Abrégé',
	'ref.preview.open': 'Ouvrir',
	'ref.cf': 'cf.',
	'anchor.actions': 'Actions de référence',
	'anchor.copy': 'Copier le texte',
	'anchor.copyLink': 'Copier le lien',
	'anchor.view': 'Voir',
	'anchor.copied': 'Copié',
	'anchor.copyFailed': 'Copie impossible',
	'bookmark.add': 'Marquer',
	'bookmark.remove': 'Retirer le signet',
	'bookmark.library': 'Signets',
	'bookmark.library.tagline': 'Tout ce que vous avez marqué en lisant.',
	'bookmark.empty': 'Rien de marqué pour l’instant.',
	'bookmark.emptyHint':
		'Cliquez sur le numéro d’un verset ou d’un paragraphe et choisissez Marquer, ou utilisez le bouton de signet de la page.',
	'bookmark.about': 'À propos de ces signets',
	'bookmark.deviceOnly':
		'Les signets sont conservés dans ce navigateur uniquement. Ils ne sont envoyés nulle part, et effacer les données du navigateur les supprime.',
	'bookmark.unavailable': 'Absent de l’édition que vous lisez',
	'document.library.tagline':
		'Encycliques, constitutions conciliaires, décrets et déclarations du Magistère.',
	'document.filter.heading': 'Filtres',
	'document.filter.author': 'Auteur',
	'document.filter.kind': 'Type',
	'document.filter.subject': 'Sujet',
	'document.filter.search': 'Rechercher un document',
	'document.filter.clear': 'Effacer',
	'document.filter.results': 'Documents affichés',
	'document.filter.noResults': 'Aucun document ne correspond à ces filtres.',
	'document.tableOfContents': 'Table des matières',
	'document.startReading': 'Commencer la lecture',
	'document.readFullDocument': 'Lire le document intégral',
	'document.section': 'Section',
	'document.prevSection': 'Précédent',
	'document.nextSection': 'Suivant',
	'document.kind.conciliarConstitution': 'Constitution',
	'document.kind.conciliarDecree': 'Décret',
	'document.kind.conciliarDeclaration': 'Déclaration',
	'document.kind.encyclical': 'Encyclique',
	'document.kind.apostolicExhortation': 'Exhortation apostolique',
	'document.kind.apostolicConstitution': 'Constitution apostolique',
	'document.kind.cdfDeclaration': 'Déclaration de la CDF',
	'document.kind.cdfInstruction': 'Instruction de la CDF',
	'document.kind.cdfLetter': 'Lettre de la CDF',
	'document.kind.cdfDoctrinalNote': 'Note doctrinale de la CDF',
	'document.kind.cdfResponsum': 'Responsum de la CDF',
	'document.kind.cdfConsiderations': 'Considérations de la CDF',
	'document.kindPlural.conciliarConstitution': 'Constitutions',
	'document.kindPlural.conciliarDecree': 'Décrets',
	'document.kindPlural.conciliarDeclaration': 'Déclarations',
	'document.kindPlural.encyclical': 'Encycliques',
	'document.kindPlural.apostolicExhortation': 'Exhortations apostoliques',
	'document.kindPlural.apostolicConstitution': 'Constitutions apostoliques',
	'document.kindPlural.cdfDeclaration': 'Déclarations de la CDF',
	'citation.unavailable': 'Aucun texte source disponible pour cette note.',
	'colophon.title': 'Colophon',
	'colophon.lede':
		'Ce qu’est ce site, d’où viennent ses textes, et notre position sur leur reproduction.',
	'colophon.whatThisIs': 'Ce que c’est',
	'colophon.whatThisIsBody':
		'Glossa Catholica est un site de lecture des Écritures, du Catéchisme, de l’Abrégé et des documents du Magistère, en anglais, en portugais et en latin. Il existe pour être lu, et rien d’autre ne vous est demandé pour le lire :',
	'colophon.pointFree':
		'Gratuit, et toujours gratuit. Pas de péage, pas d’abonnement, rien à acheter.',
	'colophon.pointNoAds': 'Aucune publicité, ni placement sponsorisé d’aucune sorte.',
	'colophon.pointNoAccounts': 'Aucun compte. Rien à créer, rien à quoi se connecter.',
	'colophon.pointNoTracking':
		'Pas de scripts de pistage, pas de code tiers, pas de cookies. Seulement des comptages d’usage anonymes, rien qui vous identifie.',
	'colophon.pointOffline':
		'Conçu pour continuer à fonctionner hors ligne une fois que vous l’avez visité, afin qu’une mauvaise connexion ne soit pas un obstacle à la lecture.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica est une initiative privée de fidèles laïcs. Elle ne bénéficie d’aucune approbation ecclésiastique et ne parle d’aucune autorité propre.',
	'footer.notEndorsed': 'Sans approbation du Saint-Siège',
	'colophon.textsTitle': 'Les textes',
	'colophon.textsBody':
		'Chaque texte provient d’une source nommée, et chaque ouvrage consigne son édition, sa page d’origine et la date à laquelle il a été récupéré. L’Écriture utilise des traductions du domaine public ; le Catéchisme, l’Abrégé et les documents du Magistère proviennent des textes publiés par le Saint-Siège lui-même.',
	'colophon.textsFidelity':
		'Le texte n’est jamais abrégé, jamais paraphrasé, jamais réécrit, et jamais placé à côté d’une publicité. Nous réparons bien les défauts manifestes — un mot tombé, une citation abîmée, un balisage qui a avalé un paragraphe — toujours vers ce que la source elle-même imprime, jamais vers ce que nous pensons qu’elle devrait dire.',
	'colophon.countBible': 'éditions de la Bible',
	'colophon.countDocuments': 'documents du Magistère',
	'colophon.privacyTitle': 'Confidentialité',
	'colophon.privacyBody1':
		'Aucun compte, aucun cookie, aucune publicité, aucun code tiers. Rien ici ne vous suit en dehors de ce site.',
	'colophon.privacyBody2':
		'Nous mesurons bien l’usage du site : une mesure par visite, chaque champ étant une fourchette plutôt qu’une valeur — combien de temps vous êtes resté, à quelle fréquence vous êtes venu, quelles œuvres vous avez ouvertes. Votre pays est compté séparément, sans rien qui le relie au reste. Cela décrit une visite, non un visiteur, et c’est conservé pendant {days} jours.',
	'colophon.privacyBody3':
		'Jamais envoyés : ce que vous tapez dans la case de recherche, le passage que vous aviez ouvert, ou tout ce qui pourrait reconnaître à nouveau votre appareil. Vos paramètres, vos signets et vos textes téléchargés restent sur votre appareil.',
	'colophon.copyrightTitle': 'Droit d’auteur',
	'colophon.copyrightBody1':
		'Le Catéchisme, l’Abrégé et les documents du Magistère sont la propriété de leurs ayants droit — principalement la Libreria Editrice Vaticana et le Dicastère pour la Communication.',
	'colophon.copyrightBody2':
		'Chaque ouvrage affiche la mention de droits de son ayant droit, dans ses propres termes, et renvoie à la page dont il a été tiré.',
	'colophon.copyrightBody3':
		'Si vous détenez des droits sur un texte présent ici et préférez qu’il ne soit pas publié, écrivez-nous.',
	'colophon.contactTitle': 'Contact',
	'colophon.contactBody': 'Pour tout, y compris ce qui précède :',
	'colophon.contactPending':
		'Aucune adresse de contact n’a encore été fixée. Ce site ne devrait pas être rendu public tant qu’il n’en a pas une — l’engagement ci-dessus n’a pas de sens sans un moyen de nous joindre.',
	'colophon.illustrationsTitle': 'Les illustrations',
	'colophon.illustrationsBody':
		'La Bible porte les gravures de Gustave Doré, chacune placée au verset qu’elle représente — le dernier et le plus vaste de ses cycles bibliques, gravé sur bois d’après ses dessins et imprimé avec le texte plutôt que rassemblé en fin de volume.',
	'colophon.illustrationsRights':
		'Elles sont dans le domaine public, comme le montrent les dates ci-dessous, et la reproduction photographique fidèle d’une gravure du domaine public ne crée aucun droit d’auteur nouveau.',
	'colophon.countPlates': 'gravures',
	'colophon.countPlateChapters': 'chapitres illustrés',
	'plates.scansBy': 'Numérisations fournies par',
	'plates.enlarge': 'Agrandir {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'À propos de cette image',
	'art.detail': 'détail',
	'colophon.typeTitle': 'Les caractères',
	'colophon.typeBody':
		'Composé en EB Garamond, la renaissance par Georg Duffner et Octavio Pardo des caractères que Claude Garamont grava dans les années 1590 — la tradition humaniste dans laquelle l’Église imprime depuis la Renaissance. Son cyrillique est de la même main mais ne ressuscite rien : aucun Garamond cyrillique n’a jamais été gravé, et le russe est donc composé dans une forme dessinée pour tenir auprès du reste.',
	'colophon.typeArabic':
		'L’arabe lui échappe entièrement et se compose en Amiri — la renaissance par Khaled Hosny du naskh gravé pour l’imprimerie de Boulaq au Caire en 1905, choisie selon le même raisonnement que la police du texte : un type de livre historique précis plutôt qu’un dessin contemporain.',
	'colophon.typeInitials':
		'Les lettrines sont en Pirata One, une gothique dont les capitales restent lisibles à la taille qu’exige une lettrine, et — pour le russe — en Ponomar, qui reproduit le caractère slavon de l’Imprimerie synodale. Ponomar ne compose que la lettrine et jamais le texte : une encyclique moderne composée entièrement en caractère synodal dirait d’elle quelque chose de faux. Toutes sont sous licence SIL Open Font License et servies depuis ce site plutôt que par un tiers, de sorte que lire une page ne demande rien au serveur de personne d’autre.',
	'refs.citedIn': 'Cité dans',
	'refs.externalVolume': 'Volume {volume} sur {host} — PDF numérisé',
	'bible.wholeChapter': 'Ce chapitre',
	'bible.verseNotInEdition':
		'Ce numéro de verset n’est pas dans cette édition — voir la note dans la source de la page',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Note',
	'bible.noteMissing': 'Cette note manque dans le corpus',
	'bible.chapterArgument': 'Argument',
	'ccc.readFullChapter': 'Lire tout le chapitre',
	'ccc.noParagraphNumber': 'Pas de numéro de paragraphe dans ce corpus',
	'copyright.sourceTitle': 'Ouvrir la page source d’origine',
	'copyright.sourceLabel': 'Source',
	'lang.label': 'Langue',
	'lang.filter': 'Rechercher une langue',
	'lang.more': 'autres langues',
	'notFound.title': 'Rien à cette adresse',
	'notFound.lede': 'La page que vous avez demandée n’est pas ici.',
	'notFound.body':
		'Le lien est peut-être mal saisi ou périmé, ou il pointe vers un texte que ce site ne porte pas.',
	'notFound.searchHint':
		'Si vous connaissez la référence voulue — un livre et un chapitre, un paragraphe du Catéchisme — tapez-la dans le champ de recherche en haut de cette page.',
	'notFound.credit': 'D\u2019apr\u00e8s British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'Ou partez de l’une de celles-ci :',
	'notFound.home': 'Accueil',
	'compare.enter': 'Comparer les éditions',
	'compare.exit': 'Quitter la comparaison',
	'compare.missing': 'Absent de cette édition',
	'compare.versificationNote':
		'Ces deux éditions découpent par endroits les versets de ce chapitre différemment (une variante textuelle, non un choix de traduction) — le même numéro de verset ne marque pas toujours la même phrase dans les deux colonnes.',
	'compare.loading': 'Chargement de la seconde langue…',
	'ui.close': 'Fermer',
	'shortcuts.title': 'Raccourcis clavier',
	'shortcuts.betweenDocuments': 'Entre les documents',
	'shortcuts.withinDocument': 'Dans le document',
	'shortcuts.show': 'Afficher cette liste',
	'help.title': 'Aide',
	'help.top.heading': 'La barre en haut de chaque page',
	'help.reading.heading': 'La barre au-dessus d’un texte',
	'help.feature.search':
		'Tapez une référence dans la case du haut — un chapitre et un verset, un numéro de paragraphe, le nom d’un document — et elle se complète à mesure.',
	'help.feature.offline':
		'Ajoutez le site à votre écran d’accueil et il s’ouvre comme une application. Vous pouvez télécharger des œuvres entières pour les lire hors ligne.',
	'help.feature.contents':
		'Les divisions de l’œuvre où vous êtes — livres, parties, chapitres — pour vous y déplacer sans revenir au début.',
	'help.feature.compare':
		'Deux éditions du même passage, côte à côte — le latin à côté de votre propre langue, ou une traduction à côté d’une autre.',
	'help.feature.apparatus':
		'Les notes propres à une édition, et tout commentaire écrit sur le texte, sont offerts à côté de lui et non en dessous. Les citations dans le texte sont des liens : une référence mène là où elle pointe.',
	'help.feature.focus':
		'Efface tout sauf le texte. La sortie reste où était la barre, pour que rien ne soit pris derrière.',
	'zen.enter': 'Mode concentration',
	'zen.exit': 'Quitter le mode concentration',
	'nav.calendar': 'Calendrier',
	'calendar.title': 'Calendrier liturgique',
	'calendar.tagline':
		'Le calendrier romain général, calculé pour n’importe quel jour : son temps, son degré, sa couleur.',
	'calendar.calendar': 'Calendrier',
	'calendar.which.general': 'Calendrier romain général',
	'calendar.filter': 'Chercher un pays',
	'calendar.region.europe': 'Europe',
	'calendar.region.americas': 'Amériques',
	'calendar.region.africa': 'Afrique',
	'calendar.region.middleEast': 'Proche-Orient',
	'calendar.region.asia': 'Asie',
	'calendar.region.oceania': 'Océanie',
	'calendar.today': 'Aujourd’hui',
	'calendar.previousMonth': 'Mois précédent',
	'calendar.nextMonth': 'Mois suivant',
	'calendar.plainDays': 'Féries simples',
	'calendar.noSuchDay': 'Aucun jour liturgique n’est calculé pour cette date.',
	'calendar.week': 'semaine',
	'calendar.alsoToday': 'Également célébré aujourd’hui',
	'calendar.alsoObserved': 'Également observé aujourd’hui',
	'calendar.obligation': 'Fête d’obligation',
	'calendar.obligationCanon': 'CIC Can. 1246',
	'calendar.sundayCycle': 'Cycle dominical',
	'calendar.weekdayCycle': 'Cycle férial',
	'calendar.psalterWeek': 'Semaine du psautier',
	'lectionary.heading': 'Lectures de la messe',
	'lectionary.slot.reading': 'Lecture',
	'lectionary.slot.reading1': 'Première lecture',
	'lectionary.slot.reading2': 'Deuxième lecture',
	'lectionary.slot.reading3': 'Troisième lecture',
	'lectionary.slot.reading4': 'Quatrième lecture',
	'lectionary.slot.reading5': 'Cinquième lecture',
	'lectionary.slot.reading6': 'Sixième lecture',
	'lectionary.slot.reading7': 'Septième lecture',
	'lectionary.slot.psalm': 'Psaume responsorial',
	'lectionary.slot.epistle': 'Épître',
	'lectionary.slot.acclamation': 'Acclamation de l’Évangile',
	'lectionary.slot.gospel': 'Évangile',
	'lectionary.slot.sequence': 'Séquence',
	'lectionary.or': 'ou',
	'lectionary.cf': 'Cf.',
	'lectionary.about': 'À propos de ces lectures',
	'lectionary.caveat':
		'Les passages fixés par l’Ordo Lectionum Missae, reliés aux éditions propres à ce site — non la traduction proclamée dans une église particulière, et une conférence épiscopale peut adapter le calendrier.',
	'calendar.transferredFrom': 'Transféré du',
	'calendar.season.advent': 'Avent',
	'calendar.season.christmas': 'Temps de Noël',
	'calendar.season.lent': 'Carême',
	'calendar.season.triduum': 'Triduum pascal',
	'calendar.season.easter': 'Temps pascal',
	'calendar.season.ordinary': 'Temps ordinaire',
	'calendar.colour.white': 'Blanc',
	'calendar.colour.red': 'Rouge',
	'calendar.colour.green': 'Vert',
	'calendar.colour.violet': 'Violet',
	'calendar.colour.rose': 'Rose',
	'calendar.colour.black': 'Noir',
	'calendar.colour.blue': 'Bleu',
	'calendar.rank.solemnity': 'Solennité',
	'calendar.rank.feast': 'Fête',
	'calendar.rank.memorial': 'Mémoire',
	'calendar.rank.optional-memorial': 'Mémoire facultative',
	'calendar.rank.commemoration': 'Commémoraison',
	'calendar.rank.sunday': 'Dimanche',
	'calendar.rank.weekday': 'Férie',
	'calendar.gloss.season.advent':
		'Les quatre semaines avant Noël : préparation à la venue du Seigneur, et commencement de l’année de l’Église.',
	'calendar.gloss.season.christmas':
		'De Noël au Baptême du Seigneur, célébrant la naissance du Seigneur et sa manifestation au monde.',
	'calendar.gloss.season.lent':
		'Les quarante jours du mercredi des Cendres à la messe du soir de la Cène du Seigneur : pénitence, aumône et préparation à Pâques.',
	'calendar.gloss.season.triduum':
		'Les trois jours du soir du Jeudi saint au soir du dimanche de Pâques — passion, mort et résurrection du Seigneur, et sommet de toute l’année.',
	'calendar.gloss.season.easter':
		'Les cinquante jours de Pâques à la Pentecôte, célébrés comme une seule fête — « un seul grand dimanche ».',
	'calendar.gloss.season.ordinary':
		'Les trente-trois ou trente-quatre semaines hors des autres temps. Non pas « quelconque » mais ordonné : les semaines sont comptées, et l’Église lit d’un bout à l’autre la vie et l’enseignement du Seigneur. Il vient en deux tranches — après le temps de Noël jusqu’au Carême, et après la Pentecôte jusqu’à l’Avent.',
	'calendar.gloss.rank.solemnity':
		'Le rang le plus élevé : Pâques, Noël, l’Ascension, le patron d’un lieu. Célébrée avec le Gloria et le Credo, et commençant la veille au soir.',
	'calendar.gloss.rank.feast':
		'Célébrée dans la journée même. Les apôtres et les évangélistes, et les grands jours du Seigneur et de Notre-Dame.',
	'calendar.gloss.rank.memorial':
		'Un saint fait mémoire en son jour, dans la messe et l’office du temps. Obligatoire là où elle est célébrée.',
	'calendar.gloss.rank.optional-memorial':
		'Peut être célébrée ou non, au choix du prêtre ou de la communauté. Si elle ne l’est pas, le jour est simplement la férie.',
	'calendar.gloss.rank.commemoration':
		'Ce que devient une mémoire pendant le Carême : une oraison ajoutée à la messe fériale, que le temps garde par ailleurs entière.',
	'calendar.gloss.rank.sunday':
		'La fête première — le jour du Seigneur, célébré chaque semaine depuis la résurrection. Seule une solennité ou une fête du Seigneur peut l’écarter, et pendant l’Avent, le Carême et le temps pascal, pas même celles-là.',
	'calendar.gloss.rank.weekday':
		'Un jour sans célébration propre. La messe et l’office sont ceux du temps, ce qui rend le temps digne d’être connu.',
	'calendar.gloss.colour.white':
		'La joie. Temps pascal et temps de Noël, les jours du Seigneur hors de sa passion, Notre-Dame, les anges, et les saints qui ne furent pas martyrs.',
	'calendar.gloss.colour.red':
		'Le sang et le feu. Le dimanche des Rameaux et le Vendredi saint, la Pentecôte, les apôtres et les évangélistes, et les martyrs.',
	'calendar.gloss.colour.green':
		'Le temps ordinaire : la couleur de l’espérance et de ce qui croît.',
	'calendar.gloss.colour.violet':
		'L’Avent et le Carême, et porté aussi aux messes pour les défunts.',
	'calendar.gloss.colour.rose':
		'Porté deux fois l’an — le dimanche Gaudete, troisième de l’Avent, et le dimanche Laetare, quatrième du Carême — là où le jeûne s’allège et où la fin est en vue.',
	'calendar.gloss.colour.black': 'Peut être porté aux messes pour les défunts.',
	'calendar.gloss.colour.blue':
		'Le privilège du bleu : porté pour l’Immaculée Conception en Espagne, aux Philippines et dans les quelques autres lieux auxquels le Saint-Siège l’a accordé.',
	'calendar.gloss.sundayCycle':
		'Les lectures dominicales courent sur trois ans — A, B et C — lisant tour à tour Matthieu, Marc et Luc, avec Jean pendant le Carême et le temps pascal. Le cycle tourne au premier dimanche de l’Avent, avec l’année de l’Église.',
	'calendar.gloss.weekdayCycle':
		'Les lectures fériales courent sur deux ans, I et II : la première lecture change, l’évangile non. Une année liturgique porte le nom de l’année civile où elle s’achève — les années impaires sont I, les paires II.',
	'calendar.gloss.psalterWeek':
		'La liturgie des Heures répartit les psaumes sur quatre semaines, I à IV, qui se répètent au long de l’année. Voici de quelle semaine sont les psaumes d’aujourd’hui, pour qui prie les Heures.',
	'calendar.gloss.obligation':
		'Un jour où les fidèles sont tenus de participer à la messe et de s’abstenir des travaux qui les en empêcheraient. Tous les dimanches, et les autres jours que chaque conférence des évêques a déterminés.',
	'calendar.primer.title': 'Vous découvrez ?',
	'calendar.primer.lead':
		'L’Église tient une année qui lui est propre. Elle commence à l’Avent, tourne autour de Pâques, et donne à chaque jour un nom, un rang et une couleur — et ceux-ci décident de ce qui est prié et lu ce jour-là à la messe et à la liturgie des Heures. Ainsi « vingt-troisième dimanche du temps ordinaire » est une adresse : elle dit à un prêtre, à un chœur, ou à qui prie chez soi, quelles prières et quelles lectures sont celles d’aujourd’hui.',
	'calendar.primer.seasons': 'Les temps',
	'calendar.primer.ranks': 'Ce qu’un jour peut être',
	'calendar.primer.colours': 'Les couleurs',
	'calendar.primer.cycles': 'Les cycles',
	'calendar.primer.cyclesLead':
		'Trois compteurs qui, ensemble, disent quelles lectures et quels psaumes sont prévus pour aujourd’hui.'
};
