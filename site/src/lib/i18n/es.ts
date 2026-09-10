/**
 * Spanish UI strings.
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

export const es: Dictionary = {
	'nav.bible': 'Biblia',
	'nav.ccc': 'Catecismo',
	'nav.compendium': 'Compendio',
	'nav.magisterium': 'Magisterio',
	'nav.socialDoctrine': 'Doctrina social',
	'socialDoctrine.landing.title': 'Compendio de la Doctrina Social de la Iglesia',
	'socialDoctrine.landing.tagline':
		'Lo que la Iglesia enseña sobre la vida en sociedad, en 583 números.',
	'nav.canonLaw': 'Derecho canónico',
	'canonLaw.landing.title': 'Código de Derecho Canónico',
	'canonLaw.landing.tagline':
		'El derecho de la Iglesia latina, en 1752 cánones repartidos en siete libros.',
	'canonLaw.canon': 'c.',
	'canonLaw.canons': 'cc.',
	'canonLaw.prevCanon': 'Canon anterior',
	'canonLaw.nextCanon': 'Canon siguiente',
	'canonLaw.readFullTitle': 'Leer el título completo',
	'canonLaw.superseded': 'Redacción sustituida por',
	'nav.prayers': 'Oraciones',
	'nav.bookmarks': 'Marcadores',
	'nav.menu': 'Menú',
	'nav.sections': 'Secciones',
	'nav.works': 'Obras',
	'nav.pages': 'Páginas',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Seguir leyendo',
	'home.tagline':
		'Un sitio de lectura de las Escrituras, el Catecismo y los documentos del Magisterio — gratuito, disponible sin conexión y sin nada que registrar.',
	'home.doors.heading': 'Adónde ir',
	'home.find.heading': 'O escribe una referencia',
	'nav.library': 'Biblioteca',
	'nav.learn': 'Aprender',
	'library.landing.tagline':
		'Todo el corpus, estante por estante — con dónde lo dejó y lo que ha marcado.',
	'schola.landing.title': 'Por dónde empezar',
	'schola.landing.tagline':
		'Una guía breve de lo que hay aquí: qué es cada uno de estos libros, cómo se escribe una cita suya, cómo encontrar un pasaje, y órdenes de lectura que la Iglesia ha propuesto.',
	'schola.start.heading': '¿Nuevo en el catolicismo?',
	'schola.start.body': 'Empieza por el ',
	'schola.start.bodyAfter':
		': la misma enseñanza del Catecismo, mucho más breve, escrita en preguntas y respuestas. Tiene cerca de una décima parte de su extensión y no da nada por supuesto.',
	'schola.bible.heading': '¿Nunca has leído la Biblia?',
	'schola.bible.library':
		'No es un libro sino setenta y tres, escritos a lo largo de más de mil años y reunidos en el orden que la Iglesia fijó — no el orden en que ocurrieron los hechos, ni el más fácil de leer. La mayoría empieza por la primera página y lo deja unas semanas después, en un largo capítulo de ley antigua, porque nada le ha dicho todavía para qué sirve.',
	'schola.bible.step.gospel': 'Empieza por un Evangelio',
	'schola.bible.start':
		'Uno de los cuatro libros breves sobre la vida de Jesús, bien adentro y no al principio. La idea no es nuestra: un Concilio de la Iglesia pidió que se enseñara el recto uso de la Escritura, «sobre todo del Nuevo Testamento y ante todo de los Evangelios». No señaló ninguno en particular, y nosotros tampoco.',
	'schola.bible.whichGospel':
		'Tres se sugieren habitualmente, por tres razones distintas. Cualquiera de ellos es un buen sitio donde estar.',
	'schola.bible.gospel.mark':
		'El más corto. Puedes leerlo entero en una tarde, y haber terminado uno vale más, al principio, que haber elegido el mejor.',
	'schola.bible.gospel.luke':
		'Escrito para alguien de fuera de la fe que quería la historia puesta en orden — que puede ser exactamente tu caso. Sigue sin corte en los Hechos de los Apóstoles, así que es en realidad la primera mitad de un libro más largo.',
	'schola.bible.gospel.john':
		'El que dice abiertamente por qué fue escrito: «para que creáis». Palabras sencillas, y va derecho a la cuestión de quién es Jesús.',
	'schola.bible.step.acts': 'Luego, lo que pasó después',
	'schola.bible.thenActs':
		'Cuando hayas terminado uno, lee lo que hicieron, después de que él se fuera, los que lo conocieron.',
	'schola.bible.acts.why':
		'Los treinta años posteriores al final de los Evangelios: unas docenas de personas asustadas, y cómo lo que habían visto llegó al otro extremo del imperio.',
	'schola.bible.step.old': 'Luego, la mitad más antigua',
	'schola.bible.thenOld':
		'No desde la primera página, y no toda. Unos pocos lugares llevan la historia, y son aquellos a los que los Evangelios remiten una y otra vez.',
	'schola.bible.ot.beginnings': 'Cómo empieza, y cómo se tuerce.',
	'schola.bible.ot.promise':
		'Una familia, y una promesa hecha a ella que sobrevive a todos los suyos.',
	'schola.bible.ot.exodus': 'Un pueblo sacado de la esclavitud, y una ley que se le da para vivir.',
	'schola.bible.ot.psalms':
		'No es un relato: son ciento cincuenta oraciones y cantos. Lee uno cada vez, en cualquier orden. La Iglesia sigue rezándolos a diario.',
	'schola.bible.bothWays':
		'Reconocerás cosas, y eso es lo que se busca, no una coincidencia. La Iglesia lee los libros antiguos a la luz de Cristo y los nuevos a la luz de lo que vino antes — cada mitad explica la otra, y por eso ninguna se lee sola.',
	'schola.books.heading': 'Qué hay aquí, y cómo se identifica',
	'schola.books.lede':
		'Cada uno de estos es una clase distinta de libro, y a cada uno se le remite por un número propio. Los ejemplos muestran la forma: escribe uno así en la caja de búsqueda y llegas al pasaje.',
	'schola.cite.label': 'Se identifica',
	'schola.what.scripture':
		'Las Escrituras tal como la Iglesia las recibe, en ambos Testamentos. Todo lo demás que hay aquí se lee a su luz.',
	'schola.cite.scripture':
		'libro, capítulo y versículo, en las abreviaturas que imprime tu propia edición',
	'schola.what.catechism':
		'Un resumen de lo que cree la Iglesia Católica, en un solo volumen. No es él mismo una fuente: reúne la Escritura, los Padres, la liturgia y la enseñanza de la Iglesia, y cada párrafo dice de dónde viene lo que afirma.',
	'schola.cite.catechism': 'por número de párrafo, corrido desde la primera página hasta la última',
	'schola.what.compendium':
		'La misma enseñanza expuesta en preguntas y respuestas, con cerca de una décima parte de la extensión.',
	'schola.cite.compendium': 'por número de pregunta',
	'schola.what.magisterium':
		'Lo que los papas y los concilios han escrito realmente — encíclicas, constituciones, decretos, declaraciones — cada uno dirigido a un momento y a una cuestión determinados. Cada uno se conoce por sus palabras iniciales en latín.',
	'schola.cite.magisterium':
		'por el nombre del documento, y luego un número de sección dentro de él',
	'schola.what.social':
		'La enseñanza de la Iglesia sobre el trabajo, la propiedad, la familia, la política y la paz, recogida de esos documentos en un solo libro.',
	'schola.cite.social': 'por número de párrafo, bajo la sigla que la obra usa para sí misma',
	'schola.what.law': 'Derecho y no doctrina. Dice lo que la Iglesia exige, y se enmienda.',
	'schola.cite.law': 'por canon, que es como se llaman sus unidades numeradas',
	'schola.what.doctors':
		'Los teólogos a quienes la Iglesia ha declarado Doctores. No lleva autoridad oficial, por grande que sea su autor.',
	'schola.cite.doctors': 'por parte, y luego cuestión — las divisiones propias de la Suma',
	'schola.what.prayers': 'Las palabras que la Iglesia reza, con el latín al lado.',
	'schola.cite.prayers': 'por su nombre; no hay números que citar',
	'schola.places.heading': 'No textos, sino lugares de este sitio',
	'schola.what.library':
		'Todas las obras del sitio en una lista, agrupadas por materia y no por clase.',
	'schola.what.calendar':
		'El día litúrgico — tiempo, color y a quién se celebra — para el país cuyo calendario sigues.',
	'schola.what.bookmarks':
		'Pasajes que has marcado, y dónde lo dejaste por última vez en cada obra. Ambos se guardan en este navegador y no se envían a ninguna parte.',
	'ccc.noCounterpart': 'Sin correspondencia en la otra obra',
	'jumpbox.placeholder': 'Ir a… (p. ej. juan 3,16, ccc 1234)',
	'jumpbox.short': 'Buscar',
	'jumpbox.hint': 'Pulsa / o Ctrl+K para ir a una referencia',
	'jumpbox.noMatch': 'Sin coincidencias',
	'jumpbox.suggestions': 'Sugerencias',
	'settings.label': 'Ajustes',
	'apparatus.label': 'Aparato',
	'apparatus.editionNotes': 'Notas de esta edición',
	'apparatus.commentary': 'Comentario',
	'apparatus.inCommentary': 'Incluido en el comentario anterior.',
	'darkMode.label': 'Modo oscuro',
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Sí',
	'darkMode.off': 'No',
	'sepia.label': 'Sepia',
	'sepia.lightOnly': 'Solo en modo claro',
	'sepia.noHue': 'No en mono',
	'oled.label': 'Negro OLED',
	'oled.darkOnly': 'Solo en modo oscuro',
	'mono.label': 'Monocromo',
	'mono.hint':
		'Compone toda la página en un solo gris, de modo que nada se distinga por el color. El sepia se apaga mientras está activo.',
	'advanced.label': 'Avanzado',
	'library.title': 'Biblioteca sin conexión',
	'library.lede': 'Los textos guardados en este dispositivo se abren sin red alguna.',
	'library.essentials': 'Oraciones y Compendio',
	'library.illustrations': 'Biblia (ilustraciones)',
	'library.illustrationsDetail': 'Biblia (ilustraciones, alta resolución)',
	'library.other': 'Otros textos',
	'library.everything': 'Todo',
	'library.downloadAll': 'Descargar todo',
	'library.download': 'Descargar',
	'library.downloaded': 'En este dispositivo',
	'library.offlineNote': 'Desactiva el modo sin conexión para descargar.',
	'library.remove': 'Quitar de este dispositivo',
	'library.removeConfirm': '¿Quitar?',
	'library.forget': 'Eliminar descargas',
	'library.forgetConfirm': '¿Eliminar todo?',
	'offline.label': 'Modo sin conexión',
	'offline.hint':
		'No usa la red en absoluto: no descarga nada, no busca actualizaciones, no mide nada. Solo se abren los textos que ya están en este dispositivo.',
	'offline.notDownloaded': 'No está en este dispositivo',
	'loadFailed.title': 'Eso no se cargó',
	'loadFailed.hint': 'La página existe: algo falló al obtenerla. Volver a intentarlo suele bastar.',
	'loadFailed.retry': 'Intentar de nuevo',
	'loadFailed.retrying': 'Intentando…',
	'offline.turnOff': 'Desactivar el modo sin conexión',

	'type.label': 'Tamaño y tipo de letra',
	'fontSize.label': 'Tamaño del texto',
	'fontSize.small': 'Pequeño',
	'fontSize.medium': 'Mediano',
	'fontSize.large': 'Grande',
	'fontSize.xlarge': 'Muy grande',
	'fontSize.xxlarge': 'Máximo',
	'face.label': 'Tipo de letra',
	'face.serif': 'Serif',
	'face.sans': 'Sans',
	'print.label': 'Imprimir esta página',
	'toTop.label': 'Volver arriba',
	'install.label': 'Instalar Glossa',
	'install.hint.label': 'Añadir a la pantalla de inicio',
	'install.hint.title': 'Añade Glossa a tu pantalla de inicio',
	'install.hint.stepBefore': 'Se abre como una aplicación y se lee sin conexión. Toca',
	'install.hint.stepAfter': 'y luego «Añadir a pantalla de inicio».',
	'install.hint.dismiss': 'Descartar',
	'update.label': 'Hay una nueva edición disponible',
	'update.title': 'Una nueva edición está lista',
	'update.body': 'Recarga la página para obtener los textos y las correcciones más recientes.',
	'update.action': 'Recargar',
	'update.dismiss': 'Ahora no',
	'edition.label': 'Edición',
	'edition.select': 'Elegir edición',
	'edition.current': 'Edición actual',
	'edition.filter': 'Buscar ediciones',
	'menu.noMatches': 'Sin resultados',
	'unitNav.previous': 'Anterior',
	'unitNav.next': 'Siguiente',
	'bible.prevChapter': 'Capítulo anterior',
	'bible.nextChapter': 'Capítulo siguiente',
	'bible.pickBook': 'Libros y capítulos',
	'bible.landing.title': 'La Biblia',
	'bible.landing.tagline': 'Lee la Biblia entera, libro a libro, capítulo a capítulo.',
	'bible.landing.random': 'Voy a tener suerte',
	'bible.landing.books': 'Libros',
	'bible.chapterUnavailable': 'No disponible en esta edición',
	'bible.introduction': 'Introducción',
	'bible.introUnavailable': 'Todavía no hay introducción en esta lengua',
	'bible.introSource': 'Las introducciones no forman parte del texto sagrado.',
	'bible.testament.ot': 'Antiguo Testamento',
	'bible.testament.nt': 'Nuevo Testamento',
	'bible.group.pentateuch': 'Pentateuco',
	'bible.group.historical': 'Libros Históricos',
	'bible.group.wisdom': 'Libros Sapienciales',
	'bible.group.prophetic': 'Libros Proféticos',
	'bible.group.gospels': 'Evangelios',
	'bible.group.acts': 'Hechos de los Apóstoles',
	'bible.group.pauline': 'Cartas de San Pablo',
	'bible.group.catholicLetters': 'Cartas Católicas',
	'bible.group.revelation': 'Apocalipsis',
	'ccc.prevParagraph': 'Párrafo anterior',
	'ccc.nextParagraph': 'Párrafo siguiente',
	'ccc.inBrief': 'Resumen',
	'ccc.landing.title': 'Catecismo de la Iglesia Católica',
	'ccc.landing.pairTitle': 'Catecismo y Compendio',
	'ccc.landing.tagline':
		'<strong>El Catecismo</strong> expone la doctrina católica en 2.865 números. <strong>El Compendio</strong> presenta la misma doctrina en 598 preguntas y respuestas, según el mismo plan.',
	'ccc.landing.pairTagline':
		'El Catecismo de la Iglesia Católica en 2.865 números, y su Compendio en 598 preguntas.',
	'ccc.tableOfContents': 'Índice',
	'ccc.related': 'Véase también',
	'compendium.landing.title': 'Compendio del Catecismo',
	'compendium.landing.tagline':
		'Preguntas y respuestas que resumen el Catecismo de la Iglesia Católica.',
	'compendium.question': 'Pregunta',
	'compendium.answer': 'Respuesta',
	'compendium.tableOfContents': 'Índice',
	'compendium.prevQuestion': 'Pregunta anterior',
	'compendium.nextQuestion': 'Pregunta siguiente',
	'compendium.condenses': 'Resume CIC ¶¶',
	'ccc.abbrev': 'CIC',
	'ccc.condensedIn': 'En el Compendio',
	'compendium.abbrev': 'Comp.',
	'compendium.noQuestionNumber': 'Sin número de pregunta en este corpus',
	'nav.summa': 'Suma',
	'doctores.landing.title': 'Doctores de la Iglesia',
	'doctores.landing.tagline': 'Las obras teológicas de los Padres y Doctores de la Iglesia.',
	'summa.landing.title': 'Suma Teológica',
	'summa.landing.tagline': 'Tomás de Aquino, en inglés y en el latín en que escribió.',
	'summa.tableOfContents': 'Índice',
	'summa.part': 'Parte',
	'summa.question': 'Cuestión',
	'summa.article': 'Artículo',
	'summa.questionShort': 'C',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Título de la edición en {lang}',
	'summa.titlesFromEdition': 'Títulos de la edición en {lang} — esta no los imprime',
	'summa.prologue': 'Prólogo',
	'summa.objection': 'Objeción',
	'summa.sedContra': 'Por el contrario',
	'summa.corpus': 'Respondo que',
	'summa.reply': 'Respuesta a la objeción',
	'summa.preamble': 'Nota',
	'summa.prevQuestion': 'Cuestión anterior',
	'summa.nextQuestion': 'Cuestión siguiente',
	'summa.noEditionInYourLanguage': 'La Suma no tiene edición en tu lengua. Se muestra en {lang}.',
	'summa.noLatinSupplement':
		'El Suplemento existe solo en inglés: fue compilado tras la muerte de Tomás de Aquino.',
	'index.division': 'División',
	'index.showSubsections': 'Mostrar subsecciones',
	'index.hideSubsections': 'Ocultar subsecciones',
	'prayers.landing.title': 'Oraciones comunes',
	'prayers.landing.tagline': 'Oraciones con el texto latino al lado.',
	'prayers.gloss.versicle':
		'El versículo — la línea que dice o canta a solas quien dirige la oración. La asamblea le contesta con la respuesta que sigue.',
	'prayers.gloss.response':
		'La respuesta — la línea que la asamblea dice o canta a una, contestando al versículo anterior.',
	'prayers.tableOfContents': 'Índice',
	'prayers.seeAlso': 'Véase también',
	'prayers.prevPrayer': 'Oración anterior',
	'prayers.nextPrayer': 'Oración siguiente',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Hoy',
	'prayers.rosary.todayHeading': 'Misterios de hoy',
	'prayers.rosary.openingPrayer': 'Oración inicial',
	'prayers.rosary.decadePrayers': 'Las oraciones de una decena',
	'ref.tooltip.loading': 'Cargando…',
	'ref.tooltip.openCcc': 'Abrir en el Catecismo',
	'ref.tooltip.openBible': 'Abrir en la Biblia',
	'ref.tooltip.openCompendium': 'Abrir en el Compendio',
	'ref.preview.open': 'Abrir',
	'ref.cf': 'cf.',
	'anchor.actions': 'Acciones de referencia',
	'anchor.copy': 'Copiar texto',
	'anchor.copyLink': 'Copiar enlace',
	'anchor.view': 'Ver',
	'anchor.copied': 'Copiado',
	'anchor.copyFailed': 'No se pudo copiar',
	'bookmark.add': 'Guardar',
	'bookmark.remove': 'Quitar marcador',
	'bookmark.library': 'Marcadores',
	'bookmark.library.tagline': 'Todo lo que has marcado mientras leías.',
	'bookmark.empty': 'Aún no has marcado nada.',
	'bookmark.emptyHint':
		'Pulsa el número de un versículo o de un párrafo y elige Guardar, o usa el botón de marcador de la página.',
	'bookmark.about': 'Acerca de estos marcadores',
	'bookmark.deviceOnly':
		'Los marcadores se guardan solo en este navegador. No se envían a ninguna parte, y borrar los datos del navegador los elimina.',
	'bookmark.unavailable': 'No está en la edición que estás leyendo',
	'document.library.tagline':
		'Encíclicas, constituciones conciliares, decretos y declaraciones del Magisterio.',
	'document.filter.heading': 'Filtros',
	'document.filter.author': 'Autor',
	'document.filter.kind': 'Tipo',
	'document.filter.subject': 'Tema',
	'document.filter.search': 'Buscar documentos',
	'document.filter.clear': 'Limpiar',
	'document.filter.results': 'Documentos mostrados',
	'document.filter.noResults': 'Ningún documento coincide con estos filtros.',
	'document.tableOfContents': 'Índice',
	'document.startReading': 'Empezar a leer',
	'document.readFullDocument': 'Leer el documento completo',
	'document.section': 'Sección',
	'document.prevSection': 'Anterior',
	'document.nextSection': 'Siguiente',
	'document.kind.conciliarConstitution': 'Constitución',
	'document.kind.conciliarDecree': 'Decreto',
	'document.kind.conciliarDeclaration': 'Declaración',
	'document.kind.encyclical': 'Encíclica',
	'document.kind.apostolicExhortation': 'Exhortación apostólica',
	'document.kind.apostolicConstitution': 'Constitución apostólica',
	'document.kind.apostolicLetter': 'Carta apostólica',
	'document.kind.cdfDeclaration': 'Declaración de la CDF',
	'document.kind.cdfInstruction': 'Instrucción de la CDF',
	'document.kind.cdfLetter': 'Carta de la CDF',
	'document.kind.cdfDoctrinalNote': 'Nota doctrinal de la CDF',
	'document.kind.cdfResponsum': 'Responsum de la CDF',
	'document.kind.cdfConsiderations': 'Consideraciones de la CDF',
	'document.kindPlural.conciliarConstitution': 'Constituciones',
	'document.kindPlural.conciliarDecree': 'Decretos',
	'document.kindPlural.conciliarDeclaration': 'Declaraciones',
	'document.kindPlural.encyclical': 'Encíclicas',
	'document.kindPlural.apostolicExhortation': 'Exhortaciones apostólicas',
	'document.kindPlural.apostolicConstitution': 'Constituciones apostólicas',
	'document.kindPlural.apostolicLetter': 'Cartas apostólicas',
	'document.kindPlural.cdfDeclaration': 'Declaraciones de la CDF',
	'citation.unavailable': 'No hay texto fuente disponible para esta nota.',
	'colophon.title': 'Colofón',
	'colophon.lede':
		'Qué es este sitio, de dónde vienen sus textos y cuál es nuestra posición al reproducirlos.',
	'colophon.whatThisIs': 'Qué es esto',
	'colophon.whatThisIsBody':
		'Glossa Catholica es un sitio de lectura de las Escrituras, el Catecismo, el Compendio y los documentos del Magisterio, en inglés, portugués y latín. Existe para ser leído, y no se te pide nada más por leerlo:',
	'colophon.pointFree':
		'Gratuito, y siempre gratuito. Sin muro de pago, sin suscripción, sin nada que comprar.',
	'colophon.pointNoAds': 'Sin publicidad, ni colocación patrocinada de ningún tipo.',
	'colophon.pointNoAccounts': 'Sin cuentas. Nada que registrar, nada a lo que acceder.',
	'colophon.pointNoTracking':
		'Sin scripts de seguimiento, sin código de terceros, sin cookies. Solo recuentos de uso anónimos, sin nada que te identifique.',
	'colophon.pointOffline':
		'Construido para seguir funcionando sin conexión una vez lo hayas visitado, de modo que una mala conexión no sea un obstáculo para leer.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica es una iniciativa privada de fieles laicos. No cuenta con aprobación eclesiástica alguna y no habla con autoridad propia.',
	'footer.notEndorsed': 'Sin aprobación de la Santa Sede',
	'colophon.textsTitle': 'Los textos',
	'colophon.textsBody':
		'Cada texto procede de una fuente identificada, y cada obra registra su edición, su página de origen y la fecha en que fue recuperada. La Escritura usa traducciones de dominio público; el Catecismo, el Compendio y los documentos magisteriales provienen de los textos publicados por la propia Santa Sede.',
	'colophon.textsFidelity':
		'El texto nunca se abrevia, nunca se parafrasea, nunca se reescribe y nunca se coloca junto a publicidad. Sí reparamos defectos evidentes —una palabra caída, una cita estropeada, un marcado que se tragó un párrafo—, siempre hacia lo que la propia fuente imprime, nunca hacia lo que nosotros creamos que debería decir.',
	'colophon.countBible': 'ediciones de la Biblia',
	'colophon.countDocuments': 'documentos magisteriales',
	'colophon.privacyTitle': 'Privacidad',
	'colophon.privacyBody1':
		'Sin cuentas, sin cookies, sin publicidad, sin código de terceros. Nada de aquí te sigue fuera de este sitio.',
	'colophon.privacyBody2':
		'Sí contamos cómo se usa el sitio: una medición por visita, cada campo un rango y no un valor exacto —cuánto tiempo estuviste, con qué frecuencia has venido, qué obras abriste. Tu país se cuenta aparte, sin nada que lo una al resto. Describe una visita, no a un visitante, y se conserva durante {days} días.',
	'colophon.privacyBody3':
		'Nunca se envía: lo que escribes en el cuadro de búsqueda, qué pasaje tenías abierto, ni nada que pudiera reconocer tu dispositivo de nuevo. Tus ajustes, marcadores y textos descargados permanecen en tu dispositivo.',
	'colophon.copyrightTitle': 'Derechos de autor',
	'colophon.copyrightBody1':
		'El Catecismo, el Compendio y los documentos magisteriales son propiedad de sus titulares de derechos, principalmente la Libreria Editrice Vaticana y el Dicasterio para la Comunicación.',
	'colophon.copyrightBody2':
		'Cada obra muestra el aviso de derechos de su titular, con las palabras de este, y enlaza a la página de la que fue tomada.',
	'colophon.copyrightBody3':
		'Si posees derechos sobre algún texto de aquí y prefieres que no se publique, escríbenos.',
	'colophon.contactTitle': 'Contacto',
	'colophon.contactBody': 'Para cualquier cosa, incluido lo anterior:',
	'colophon.contactPending':
		'Todavía no se ha fijado una dirección de contacto. Este sitio no debería hacerse público hasta tenerla: el compromiso anterior no significa nada sin un modo de localizarnos.',
	'colophon.illustrationsTitle': 'Las ilustraciones',
	'colophon.illustrationsBody':
		'La Biblia lleva los grabados de Gustave Doré, cada uno junto al versículo que representa: el último y el mayor de sus ciclos bíblicos, grabado en madera a partir de sus dibujos e impreso con el texto, no reunido al final del volumen.',
	'colophon.illustrationsRights':
		'Están en dominio público, como muestran las fechas de abajo, y la reproducción fotográfica fiel de un grabado en dominio público no genera un derecho de autor nuevo.',
	'colophon.countPlates': 'grabados',
	'colophon.countPlateChapters': 'capítulos ilustrados',
	'plates.scansBy': 'Digitalizaciones facilitadas por',
	'plates.enlarge': 'Ampliar {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'Sobre esta imagen',
	'art.detail': 'detalle',
	'colophon.typeTitle': 'La tipografía',
	'colophon.typeBody':
		'Compuesto en EB Garamond, el renacimiento que Georg Duffner y Octavio Pardo hicieron de los tipos que Claude Garamont grabó en la década de 1590, la tradición humanista en la que la Iglesia imprime desde el Renacimiento. Su cirílico es de las mismas manos, pero no revive nada: nunca se grabó un Garamond cirílico, así que el ruso se compone en una forma dibujada para convivir con el resto.',
	'colophon.typeArabic':
		'El árabe queda del todo fuera de su alcance y se compone en Amiri: el renacimiento por Khaled Hosny del nasj grabado para la imprenta de Bulaq en El Cairo en 1905, elegido con el mismo razonamiento que la letra del texto, un tipo de libro histórico concreto y no un dibujo contemporáneo.',
	'colophon.typeInitials':
		'Las iniciales son Pirata One, una letra gótica cuyas mayúsculas siguen siendo legibles al tamaño que exige una capitular, y —para el ruso— Ponomar, que reproduce el tipo eslavo eclesiástico de la Imprenta Sinodal. Ponomar compone la inicial y nunca el texto: una encíclica moderna compuesta entera en tipo sinodal diría algo falso sobre lo que es. Todas están licenciadas bajo la SIL Open Font License y se sirven desde este sitio y no desde un tercero, de modo que leer una página no pide nada al servidor de nadie más.',
	'refs.citedIn': 'Citado en',
	'refs.externalVolume': 'Volumen {volume} en {host} — PDF escaneado',
	'bible.wholeChapter': 'Este capítulo',
	'bible.verseNotInEdition':
		'Este número de versículo no está en esta edición; véase la nota en la fuente de la página',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Nota',
	'bible.noteMissing': 'Esta nota falta en el corpus',
	'bible.chapterArgument': 'Argumento',
	'ccc.readFullChapter': 'Leer el capítulo completo',
	'ccc.noParagraphNumber': 'Sin número de párrafo en este corpus',
	'copyright.sourceTitle': 'Abrir la página de origen',
	'copyright.sourceLabel': 'Fuente',
	'lang.label': 'Lengua',
	'lang.filter': 'Buscar lenguas',
	'lang.more': 'más lenguas',
	'notFound.title': 'No hay nada en esta dirección',
	'notFound.lede': 'La página que pediste no está aquí.',
	'notFound.body':
		'El enlace puede estar mal escrito o anticuado, o puede apuntar a un texto que este sitio no tiene.',
	'notFound.searchHint':
		'Si sabes la referencia que quieres —un libro y un capítulo, un párrafo del Catecismo—, escríbela en el cuadro de búsqueda de la parte superior de esta página.',
	'notFound.credit': 'Basado en British Library, Royal MS 10 E IV, f.\u200a49v',
	'notFound.elsewhere': 'O empieza por una de estas:',
	'notFound.home': 'Inicio',
	'compare.enter': 'Comparar ediciones',
	'compare.exit': 'Salir de la comparación',
	'compare.missing': 'No está presente en esta edición',
	'compare.versificationNote':
		'Estas dos ediciones dividen en algunos puntos los versículos de este capítulo de manera distinta (una variante textual, no una decisión de traducción): el mismo número de versículo no siempre señala la misma frase en ambas columnas.',
	'compare.loading': 'Cargando la segunda lengua…',
	'ui.close': 'Cerrar',
	'shortcuts.title': 'Atajos de teclado',
	'shortcuts.betweenDocuments': 'Entre documentos',
	'shortcuts.withinDocument': 'Dentro del documento',
	'shortcuts.show': 'Mostrar esta lista',
	'help.title': 'Ayuda',
	'help.reading.heading': 'La barra sobre un texto',
	'help.feature.search':
		'Escribe una referencia en la caja de arriba — capítulo y versículo, número de párrafo, el nombre de un documento — y la completa mientras escribes.',
	'help.feature.offline':
		'Añade el sitio a tu pantalla de inicio y se abre como una aplicación. Puedes descargar obras enteras para leerlas sin conexión.',
	'help.feature.contents':
		'Las divisiones de la obra en la que estás — libros, partes, capítulos — para moverte dentro de ella sin volver al principio.',
	'help.feature.compare':
		'Dos ediciones del mismo pasaje, una al lado de otra — el latín junto a tu propia lengua, o una traducción junto a otra.',
	'help.feature.apparatus':
		'Las notas de la edición misma, y cualquier comentario escrito sobre el texto, se ofrecen a su lado y no debajo. Las citas dentro del texto son enlaces, así que una referencia lleva adonde apunta.',
	'help.feature.focus':
		'Despeja todo menos el texto. La salida queda donde estaba la barra, para que nada quede atrapado detrás.',
	'zen.enter': 'Modo de concentración',
	'zen.exit': 'Salir del modo de concentración',
	'nav.calendar': 'Calendario',
	'calendar.title': 'Calendario litúrgico',
	'calendar.tagline':
		'El Calendario Romano General, calculado para cualquier día: su tiempo, su grado, su color.',
	'calendar.national.tagline':
		'{territory}: el Calendario Romano General con las celebraciones que le son propias, calculado para cualquier día: su tiempo, su grado, su color.',
	'calendar.calendar': 'Calendario',
	'calendar.which.general': 'Calendario Romano General',
	'calendar.filter': 'Buscar países',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'América',
	'calendar.region.africa': 'África',
	'calendar.region.middleEast': 'Oriente Medio',
	'calendar.region.asia': 'Asia',
	'calendar.region.oceania': 'Oceanía',
	'calendar.today': 'Hoy',
	'calendar.previousMonth': 'Mes anterior',
	'calendar.nextMonth': 'Mes siguiente',
	'calendar.plainDays': 'Ferias',
	'calendar.noSuchDay': 'No se calcula ningún día litúrgico para esa fecha.',
	'calendar.week': 'semana',
	'calendar.alsoToday': 'También se celebra hoy',
	'calendar.alsoObserved': 'También se conmemora hoy',
	'calendar.obligation': 'Fiesta de precepto',
	'calendar.obligationCanon': 'CIC c. 1246',
	'calendar.sundayCycle': 'Ciclo dominical',
	'calendar.weekdayCycle': 'Ciclo ferial',
	'calendar.psalterWeek': 'Semana del salterio',
	'lectionary.heading': 'Lecturas de la Misa',
	'lectionary.slot.reading': 'Lectura',
	'lectionary.slot.reading1': 'Primera lectura',
	'lectionary.slot.reading2': 'Segunda lectura',
	'lectionary.slot.reading3': 'Tercera lectura',
	'lectionary.slot.reading4': 'Cuarta lectura',
	'lectionary.slot.reading5': 'Quinta lectura',
	'lectionary.slot.reading6': 'Sexta lectura',
	'lectionary.slot.reading7': 'Séptima lectura',
	'lectionary.slot.psalm': 'Salmo responsorial',
	'lectionary.slot.epistle': 'Epístola',
	'lectionary.slot.acclamation': 'Aclamación antes del Evangelio',
	'lectionary.slot.gospel': 'Evangelio',
	'lectionary.slot.sequence': 'Secuencia',
	'lectionary.or': 'o',
	'lectionary.cf': 'Cf.',
	'lectionary.about': 'Acerca de estas lecturas',
	'lectionary.caveat':
		'Los pasajes que señala el Ordo Lectionum Missae, enlazados a las ediciones propias de este sitio — no la traducción que se proclama en una iglesia concreta — y una conferencia episcopal puede adaptar el calendario.',
	'calendar.transferredFrom': 'Trasladado del',
	'calendar.season.advent': 'Adviento',
	'calendar.season.christmas': 'Tiempo de Navidad',
	'calendar.season.lent': 'Cuaresma',
	'calendar.season.triduum': 'Triduo Pascual',
	'calendar.season.easter': 'Tiempo Pascual',
	'calendar.season.ordinary': 'Tiempo Ordinario',
	'calendar.colour.white': 'Blanco',
	'calendar.colour.red': 'Rojo',
	'calendar.colour.green': 'Verde',
	'calendar.colour.violet': 'Morado',
	'calendar.colour.rose': 'Rosa',
	'calendar.colour.black': 'Negro',
	'calendar.colour.blue': 'Azul',
	'calendar.rank.solemnity': 'Solemnidad',
	'calendar.rank.feast': 'Fiesta',
	'calendar.rank.memorial': 'Memoria',
	'calendar.rank.optional-memorial': 'Memoria libre',
	'calendar.rank.commemoration': 'Conmemoración',
	'calendar.rank.sunday': 'Domingo',
	'calendar.rank.weekday': 'Feria',
	'calendar.gloss.season.advent':
		'Las cuatro semanas antes de la Navidad: preparación para la venida del Señor, y comienzo del año de la Iglesia.',
	'calendar.gloss.season.christmas':
		'De la Navidad al Bautismo del Señor, celebrando el nacimiento del Señor y su manifestación al mundo.',
	'calendar.gloss.season.lent':
		'Los cuarenta días desde el Miércoles de Ceniza hasta la Misa vespertina de la Cena del Señor: penitencia, limosna y preparación para la Pascua.',
	'calendar.gloss.season.triduum':
		'Los tres días desde la tarde del Jueves Santo hasta la tarde del Domingo de Pascua — pasión, muerte y resurrección del Señor, y cumbre de todo el año.',
	'calendar.gloss.season.easter':
		'Los cincuenta días de la Pascua a Pentecostés, celebrados como una sola fiesta — «un solo gran domingo».',
	'calendar.gloss.season.ordinary':
		'Las treinta y tres o treinta y cuatro semanas fuera de los demás tiempos. No es tiempo «cualquiera» sino ordenado: las semanas van contadas, y la Iglesia lee de corrido la vida y la enseñanza del Señor. Viene en dos tramos — después del tiempo de Navidad hasta la Cuaresma, y después de Pentecostés hasta el Adviento.',
	'calendar.gloss.rank.solemnity':
		'El grado más alto: la Pascua, la Navidad, la Ascensión, el patrono del lugar. Se celebra con Gloria y Credo, y empieza la tarde anterior.',
	'calendar.gloss.rank.feast':
		'Se celebra dentro del día mismo. Los apóstoles y evangelistas, y los días mayores del Señor y de Nuestra Señora.',
	'calendar.gloss.rank.memorial':
		'Un santo recordado en su día, dentro de la Misa y del Oficio del tiempo. Obligatoria donde se celebra.',
	'calendar.gloss.rank.optional-memorial':
		'Puede celebrarse o no, a elección del sacerdote o de la comunidad. Si no se celebra, el día es simplemente la feria.',
	'calendar.gloss.rank.commemoration':
		'En lo que se convierte una memoria durante la Cuaresma: una oración añadida a la Misa ferial, que el tiempo por lo demás conserva entera.',
	'calendar.gloss.rank.sunday':
		'La fiesta primera — el Día del Señor, celebrado cada semana desde la resurrección. Sólo una solemnidad o una fiesta del Señor puede desplazarlo, y en Adviento, Cuaresma y tiempo pascual ni siquiera ésas.',
	'calendar.gloss.rank.weekday':
		'Un día sin celebración propia. La Misa y el Oficio son los del tiempo, que es lo que hace que valga la pena conocer el tiempo.',
	'calendar.gloss.colour.white':
		'Alegría. Tiempo pascual y tiempo de Navidad, los días del Señor fuera de su pasión, Nuestra Señora, los ángeles, y los santos que no fueron mártires.',
	'calendar.gloss.colour.red':
		'Sangre y fuego. Domingo de Ramos y Viernes Santo, Pentecostés, los apóstoles y evangelistas, y los mártires.',
	'calendar.gloss.colour.green': 'Tiempo ordinario: el color de la esperanza y de lo que crece.',
	'calendar.gloss.colour.violet': 'Adviento y Cuaresma, y también en las Misas por los difuntos.',
	'calendar.gloss.colour.rose':
		'Se usa dos veces al año — el domingo Gaudete, tercero de Adviento, y el domingo Laetare, cuarto de Cuaresma — cuando el ayuno se aligera y el término está a la vista.',
	'calendar.gloss.colour.black': 'Puede usarse en las Misas por los difuntos.',
	'calendar.gloss.colour.blue':
		'El privilegio del azul: se usa en la Inmaculada Concepción en España, en Filipinas y en los pocos otros lugares a los que la Santa Sede lo ha concedido.',
	'calendar.gloss.sundayCycle':
		'Las lecturas dominicales corren en tres años — A, B y C — leyendo por turno a Mateo, Marcos y Lucas, con Juan en la Cuaresma y el tiempo pascual. El ciclo cambia el primer domingo de Adviento, con el año de la Iglesia.',
	'calendar.gloss.weekdayCycle':
		'Las lecturas feriales corren en dos años, I y II: la primera lectura cambia, el evangelio no. Un año litúrgico lleva el nombre del año civil en que termina — los años impares son I, los pares II.',
	'calendar.gloss.psalterWeek':
		'La Liturgia de las Horas reparte los salmos en cuatro semanas, de la I a la IV, que se repiten a lo largo del año. Ésta es la semana cuyos salmos son los de hoy, para quien reza las Horas.',
	'calendar.gloss.obligation':
		'Día en que los fieles están obligados a participar en la Misa y a abstenerse de los trabajos que lo impidan. Todos los domingos, y los demás días que cada conferencia episcopal ha determinado.',
	'calendar.primer.title': '¿Es la primera vez?',
	'calendar.primer.lead':
		'La Iglesia guarda un año propio. Empieza en Adviento, gira en torno a la Pascua y da a cada día un nombre, un grado y un color — y ésos deciden qué se reza y se lee ese día en la Misa y en la Liturgia de las Horas. Así «domingo vigesimotercero del tiempo ordinario» es una dirección: dice a un sacerdote, a un coro o a quien reza en casa qué oraciones y qué lecturas son las de hoy.',
	'calendar.primer.seasons': 'Los tiempos',
	'calendar.primer.ranks': 'Lo que un día puede ser',
	'calendar.primer.colours': 'Los colores',
	'calendar.primer.cycles': 'Los ciclos',
	'calendar.primer.cyclesLead':
		'Tres contadores que, juntos, dicen qué lecturas y qué salmos están señalados para hoy.'
};
