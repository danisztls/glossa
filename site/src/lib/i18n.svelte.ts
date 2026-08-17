/**
 * UI string dictionary.
 *
 * UI language now DRIVES content language (reversing the original "the URL
 * carries content choice, setting carries UI language" decision recorded in
 * docs/decisions.md — see the entry this change adds there). Switching this
 * switches both the site's chrome AND, by default, which edition of the
 * Bible/CCC/Compendium is shown (see `$lib/content.svelte.ts`). A reader who
 * wants to read a different edition than their interface language implies
 * still can — the edition/version selector lets them override it — but that
 * override is scoped to the UI language it was made under, so changing the
 * interface language changes the content language too unless the reader
 * re-picks an edition after switching.
 */

export type UiLang = 'en' | 'pt';

const STORAGE_KEY = 'glossa:ui-lang';

type Dictionary = Record<string, string>;

const dictionaries: Record<UiLang, Dictionary> = {
	en: {
		'nav.bible': 'Bible',
		'nav.ccc': 'Catechism',
		'nav.compendium': 'Compendium',
		// "Magisterium" over "Documents"/"Magisterial Documents" — the name
		// shown in the navbar and the home-page Library group; the route path
		// stays `/documents` regardless (URL and display name needn't match,
		// and `/documents` stays accurate as encyclicals/exhortations/CDF
		// documents join the 16 Vatican II texts already here).
		'nav.magisterium': 'Magisterium',
		'nav.prayers': 'Prayers',
		'nav.menu': 'Menu',
		'home.title': 'Glossa Catholica',
		'home.tagline': 'Scripture and the Magisterium, free to read.',
		'home.continueReading': 'Continue reading',
		'home.works': 'Library',
		// Home page's Catechism/Compendium section — see routes/+page.svelte's
		// module docblock for why this is ONE table of contents, not two.
		'home.ccc.heading': 'Catechism & Compendium',
		'home.ccc.noCounterpart': 'No counterpart in the other work',
		'home.magisterium.mostRecent': 'Most recently added',
		'jumpbox.placeholder': 'Jump to… (e.g. john 3:16, ccc 1234)',
		'jumpbox.short': 'Search',
		'jumpbox.hint': 'Press / or Ctrl+K to jump to a reference',
		'jumpbox.noMatch': 'No match',

		// Theme menu (auto/light/dark/sepia) — ThemeMenu.svelte is the consumer.
		'theme.label': 'Theme',
		'theme.auto': 'Auto',
		'theme.light': 'Light',
		'theme.dark': 'Dark',
		'theme.sepia': 'Sepia',

		// Font size menu — FontSizeMenu.svelte is the consumer; store is prefs.svelte.ts.
		'fontSize.label': 'Text size',
		'fontSize.larger': 'Larger text',
		'fontSize.smaller': 'Smaller text',
		'fontSize.reset': 'Reset text size',

		// Edition/version selector — EditionMenu.svelte is the consumer; store is content.svelte.ts.
		'edition.label': 'Edition',
		'edition.select': 'Choose edition',
		'edition.current': 'Current edition',

		'bible.prevChapter': 'Previous chapter',
		'bible.nextChapter': 'Next chapter',
		'bible.pickBook': 'Books & chapters',
		'bible.landing.title': 'The Bible',
		'bible.landing.tagline': 'Read the whole Bible, book by book, chapter by chapter.',
		'bible.landing.continue': 'Continue where you left off',
		'bible.landing.start': 'Start reading',
		'bible.landing.books': 'Books',
		// The canonical book/chapter structure is edition-independent, so the
		// picker can offer a chapter the reader's current edition lacks.
		'bible.chapterUnavailable': 'Not available in this edition',
		'bible.testament.ot': 'Old Testament',
		'bible.testament.nt': 'New Testament',

		'ccc.prevParagraph': 'Previous',
		'ccc.nextParagraph': 'Next',
		'ccc.inBrief': 'In Brief',
		'ccc.tableOfContents': 'Table of Contents',
		'ccc.related': 'See also',

		// Compendium of the CCC — routes/compendium/** is the consumer.
		'compendium.landing.title': 'Compendium of the Catechism',
		'compendium.landing.tagline':
			'598 questions and answers summarizing the Catechism of the Catholic Church.',
		'compendium.question': 'Question',
		'compendium.answer': 'Answer',
		'compendium.tableOfContents': 'Table of Contents',
		'compendium.prevQuestion': 'Previous question',
		'compendium.nextQuestion': 'Next question',
		'compendium.condenses': 'Condenses CCC ¶¶',

		// Common Prayers (docs/corpus-schema.md §Prayers) — routes/prayers/**
		// is the consumer, plus the home page's compact Prayers section.
		'prayers.landing.title': 'Common Prayers',
		'prayers.landing.tagline':
			'Twenty-four prayers every Catholic should know, from the Compendium of the Catechism’s appendix — with the Latin text alongside wherever the source prints one.',
		'prayers.latin': 'Latin',
		'prayers.showLatin': 'Show Latin text',
		'prayers.hideLatin': 'Hide Latin text',
		'prayers.prevPrayer': 'Previous prayer',
		'prayers.nextPrayer': 'Next prayer',
		'home.prayers.heading': 'Prayers',
		'home.prayers.tagline': 'Two dozen prayers every Catholic should know, by heart.',
		'home.prayers.browseAll': 'Browse all prayers',

		// Reference tooltips/popovers — RefText.svelte is the consumer.
		'ref.tooltip.loading': 'Loading…',
		'ref.tooltip.openCcc': 'Open in Catechism',
		'ref.tooltip.openBible': 'Open in Bible',
		'ref.tooltip.openCompendium': 'Open in Compendium',
		'ref.preview.open': 'Open',
		'ref.cf': 'cf.',

		// Documents (encyclicals, conciliar constitutions/decrees/declarations,
		// docs/corpus-schema.md §Documents) — routes/documents/** is the
		// consumer, plus the home page's Magisterium group.
		'document.library.tagline':
			'Encyclicals, conciliar constitutions, decrees, and declarations of the Magisterium.',
		'document.tableOfContents': 'Table of Contents',
		'document.startReading': 'Start reading',
		'document.readFullDocument': 'Read the full document',
		'document.section': 'Section',
		'document.prevSection': 'Previous',
		'document.nextSection': 'Next',
		'document.kind.conciliarConstitution': 'Constitution',
		'document.kind.conciliarDecree': 'Decree',
		'document.kind.conciliarDeclaration': 'Declaration',
		'document.kind.encyclical': 'Encyclical',
		'document.kind.apostolicExhortation': 'Apostolic Exhortation',
		'document.kind.apostolicConstitution': 'Apostolic Constitution',
		'document.kind.cdfDeclaration': 'CDF Declaration',
		'document.kindPlural.conciliarConstitution': 'Constitutions',
		'document.kindPlural.conciliarDecree': 'Decrees',
		'document.kindPlural.conciliarDeclaration': 'Declarations',
		'document.kindPlural.encyclical': 'Encyclicals',
		'document.kindPlural.apostolicExhortation': 'Apostolic Exhortations',
		'document.kindPlural.apostolicConstitution': 'Apostolic Constitutions',
		'document.kindPlural.cdfDeclaration': 'CDF Declarations',

		// A citation whose source text is a confirmed gap in the source page
		// itself, not a parsing failure (docs/research/vatican-documents.md §6)
		// — CccParagraphText.svelte's citation disclosure, shared by CCC and
		// document sections.
		'citation.unavailable': 'No source text available for this note.',

		'unpublished.tag': 'Not shown here',
		'unpublished.quality.heading': 'We are not showing this text yet',
		'unpublished.quality.explain':
			'Our copy of this work came out incomplete \u2014 parts of it are missing, and we would rather show you nothing than show you a text with gaps you cannot see. It will come back once we can render it properly.',
		'unpublished.rights.heading': 'This text is not published here',
		'unpublished.rights.explain':
			'We reproduced this work until its rights holder asked us not to, and we stopped. The text has been removed from this site; everything else about the work is unchanged.',
		'unpublished.readAt': 'Read it at',
		'colophon.title': 'Colophon',
		'colophon.lede':
			'What this site is, where its texts come from, and where we stand on reproducing them.',
		'colophon.whatThisIs': 'What this is',
		'colophon.whatThisIsBody':
			'Glossa Catholica is a reading site for the Scriptures, the Catechism, the Compendium, and the documents of the Magisterium, in English and Portuguese. It exists to be read, and nothing else is asked of you for reading it:',
		'colophon.pointFree': 'Free, and always free. No paywall, no subscription, nothing to buy.',
		'colophon.pointNoAds': 'No advertising, and no sponsored placement of any kind.',
		'colophon.pointNoAccounts': 'No accounts. Nothing to sign up for, nothing to log in to.',
		'colophon.pointNoTracking':
			'No analytics, no tracking scripts, no third-party code. The server that sends you these pages keeps ordinary request logs, as any web server does; nothing beyond that watches what you read.',
		'colophon.pointOffline':
			'Built to keep working offline once you have visited it, so a poor connection need not be a barrier to reading.',
		'colophon.textsTitle': 'The texts',
		'colophon.textsBody':
			'Every text comes from a named source, and every work records its edition, its source page and the date it was retrieved. Scripture uses public-domain translations; the Catechism, the Compendium and the magisterial documents come from the Holy See\u2019s own published texts. We reproduce them unaltered \u2014 and where our copy of a work has turned out incomplete, we withhold it and link to the source instead, rather than show you a text with gaps you cannot see.',
		'colophon.countBible': 'Bible editions',
		'colophon.countDocuments': 'magisterial documents',
		'colophon.copyrightTitle': 'Copyright',
		'colophon.copyrightBody1':
			'The Catechism, the Compendium and the magisterial documents are the property of their rights holders \u2014 principally the Libreria Editrice Vaticana and the Dicastery for Communication. We reproduce them here without having asked permission first. We say so plainly rather than leave it to be discovered: this is a deliberate choice, not an oversight.',
		'colophon.copyrightBody2':
			'We make that choice because these texts are the Church\u2019s teaching, addressed to everyone, and because the concern rights holders have stated is the integrity of the text. So the text is never abridged, never paraphrased, never rewritten, and never placed beside advertising. We do repair plain defects in the published pages \u2014 a dropped word, a mangled citation, markup that swallowed a paragraph \u2014 always toward what the source itself prints, never toward what we might think it should say. We do not change its meaning, do not substitute our own wording, and do not annotate or editorialise. Every correction is recorded on its own, with the original, the replacement and the reason; nothing is ever changed silently. Each work displays its rights holder\u2019s own copyright notice, in their wording, and links to the page it was taken from.',
		'colophon.copyrightBody3':
			'If you hold rights in any text here and would rather it were not published, write to us and we will take it down promptly. No argument, and no need to involve anyone else first.',
		'colophon.contactTitle': 'Contact',
		'colophon.contactBody': 'For anything at all, including the above:',
		'colophon.contactPending':
			'A contact address has not been set yet. This site should not be made public until it has one \u2014 the commitment above is not meaningful without a way to reach us.',
		'colophon.buildTitle': 'How it is made',
		'colophon.buildBody':
			'The texts are collected from their published sources, parsed into a structured corpus, and rendered as static pages. Corrections to source defects are recorded individually, with the original wording, the corrected wording, and the reason \u2014 no text is ever silently changed.',
		'colophon.typeTitle': 'The type',
		'colophon.typeBody':
			'Set in EB Garamond, Georg Duffner and Octavio Pardo\u2019s revival of the types Claude Garamont cut in the 1590s \u2014 the humanist tradition the Church has printed in since the Renaissance. The opening initials are Pirata One, a blackletter whose capitals stay legible at the size a drop cap demands. Both are licensed under the SIL Open Font License and served from this site rather than from a third party, so reading a page asks nothing of anyone else\u2019s server.',
		'bible.citedInCcc': 'Cited in the Catechism',
		'bible.wholeChapter': 'This chapter',
		'bible.verseNotInEdition':
			'This verse number is not in this edition — see the note in the page source',
		'bible.verseAbbrev': 'v.',
		'ccc.readFullChapter': 'Read the full chapter',
		'ccc.showSubsections': 'Show subsections',
		'ccc.hideSubsections': 'Hide subsections',
		'ccc.noParagraphNumber': 'No paragraph number in this corpus',
		'copyright.sourceTitle': 'Open the original source page',
		'lang.label': 'Language',

		// Static 404 — routes/404/+page.svelte, prerendered to build/404.html
		// and served by the host for unmatched paths. See that file's docblock.
		'notFound.title': 'Nothing at this address',
		'notFound.lede': 'The page you asked for is not here.',
		'notFound.body':
			'The link may be mistyped or out of date, or it may point to a text this site does not carry. Nothing here is behind a login or a paywall, so if a page exists, it can be reached.',
		'notFound.searchHint':
			'If you know the reference you want — a book and chapter, a paragraph of the Catechism — type it into the search box at the top of this page.',
		'notFound.elsewhere': 'Or start from one of these:',
		'notFound.home': 'Home',

		// Compare mode (side-by-side, unit-aligned comparison) — CompareToggle.svelte
		// and CompareGrid.svelte are the consumers.
		'compare.enter': 'Compare editions',
		'compare.exit': 'Exit comparison',
		'compare.missing': 'Not present in this edition',
		'compare.versificationNote':
			'These two editions divide this chapter’s verses differently in places (a textual variant, not a translation choice) — the same verse number does not always mark the same sentence in both columns.',
		'compare.loading': 'Loading the second language…'
	},
	pt: {
		'nav.bible': 'Bíblia',
		'nav.ccc': 'Catecismo',
		'nav.compendium': 'Compêndio',
		'nav.magisterium': 'Magistério',
		'nav.prayers': 'Orações',
		'nav.menu': 'Menu',
		'home.title': 'Glossa Catholica',
		'home.tagline': 'Escritura e Magistério, livres para ler.',
		'home.continueReading': 'Continuar lendo',
		'home.works': 'Biblioteca',
		'home.ccc.heading': 'Catecismo e Compêndio',
		'home.ccc.noCounterpart': 'Sem correspondência na outra obra',
		'home.magisterium.mostRecent': 'Adicionado mais recentemente',
		'jumpbox.placeholder': 'Ir para… (ex: jo 3,16, ccc 1234)',
		'jumpbox.short': 'Buscar',
		'jumpbox.hint': 'Pressione / ou Ctrl+K para ir a uma referência',
		'jumpbox.noMatch': 'Nenhum resultado',

		'theme.label': 'Tema',
		'theme.auto': 'Automático',
		'theme.light': 'Claro',
		'theme.dark': 'Escuro',
		'theme.sepia': 'Sépia',

		'fontSize.label': 'Tamanho do texto',
		'fontSize.larger': 'Aumentar texto',
		'fontSize.smaller': 'Diminuir texto',
		'fontSize.reset': 'Repor tamanho do texto',

		'edition.label': 'Edição',
		'edition.select': 'Escolher edição',
		'edition.current': 'Edição atual',

		'bible.prevChapter': 'Capítulo anterior',
		'bible.nextChapter': 'Próximo capítulo',
		'bible.pickBook': 'Livros e capítulos',
		'bible.landing.title': 'A Bíblia',
		'bible.landing.tagline': 'Leia toda a Bíblia, livro por livro, capítulo por capítulo.',
		'bible.landing.continue': 'Continuar de onde parou',
		'bible.landing.start': 'Começar a leitura',
		'bible.landing.books': 'Livros',
		'bible.chapterUnavailable': 'Não disponível nesta edição',
		'bible.testament.ot': 'Antigo Testamento',
		'bible.testament.nt': 'Novo Testamento',

		'ccc.prevParagraph': 'Anterior',
		'ccc.nextParagraph': 'Próximo',
		'ccc.inBrief': 'Resumindo',
		'ccc.tableOfContents': 'Índice',
		'ccc.related': 'Veja também',

		'compendium.landing.title': 'Compêndio do Catecismo',
		'compendium.landing.tagline':
			'598 perguntas e respostas que resumem o Catecismo da Igreja Católica.',
		'compendium.question': 'Pergunta',
		'compendium.answer': 'Resposta',
		'compendium.tableOfContents': 'Índice',
		'compendium.prevQuestion': 'Pergunta anterior',
		'compendium.nextQuestion': 'Próxima pergunta',
		'compendium.condenses': 'Condensa os §§',

		'prayers.landing.title': 'Orações Comuns',
		'prayers.landing.tagline':
			'Vinte e quatro orações que todo católico deveria conhecer, do apêndice do Compêndio do Catecismo — com o texto em latim ao lado onde a fonte o imprime.',
		'prayers.latin': 'Latim',
		'prayers.showLatin': 'Mostrar texto em latim',
		'prayers.hideLatin': 'Ocultar texto em latim',
		'prayers.prevPrayer': 'Oração anterior',
		'prayers.nextPrayer': 'Próxima oração',
		'home.prayers.heading': 'Orações',
		'home.prayers.tagline': 'Duas dezenas de orações que todo católico deveria saber de cor.',
		'home.prayers.browseAll': 'Ver todas as orações',

		'ref.tooltip.loading': 'Carregando…',
		'ref.tooltip.openCcc': 'Abrir no Catecismo',
		'ref.tooltip.openBible': 'Abrir na Bíblia',
		'ref.tooltip.openCompendium': 'Abrir no Compêndio',
		'ref.preview.open': 'Abrir',
		'ref.cf': 'cf.',

		'document.library.tagline':
			'Encíclicas, constituições conciliares, decretos e declarações do Magistério.',
		'document.tableOfContents': 'Índice',
		'document.startReading': 'Começar a leitura',
		'document.readFullDocument': 'Ler o documento completo',
		'document.section': 'Secção',
		'document.prevSection': 'Anterior',
		'document.nextSection': 'Próximo',
		'document.kind.conciliarConstitution': 'Constituição',
		'document.kind.conciliarDecree': 'Decreto',
		'document.kind.conciliarDeclaration': 'Declaração',
		'document.kind.encyclical': 'Encíclica',
		'document.kind.apostolicExhortation': 'Exortação Apostólica',
		'document.kind.apostolicConstitution': 'Constituição Apostólica',
		'document.kind.cdfDeclaration': 'Declaração da CDF',
		'document.kindPlural.conciliarConstitution': 'Constituições',
		'document.kindPlural.conciliarDecree': 'Decretos',
		'document.kindPlural.conciliarDeclaration': 'Declarações',
		'document.kindPlural.encyclical': 'Encíclicas',
		'document.kindPlural.apostolicExhortation': 'Exortações Apostólicas',
		'document.kindPlural.apostolicConstitution': 'Constituições Apostólicas',
		'document.kindPlural.cdfDeclaration': 'Declarações da CDF',

		'citation.unavailable': 'Sem texto de fonte disponível para esta nota.',

		'unpublished.tag': 'N\u00e3o apresentado aqui',
		'unpublished.quality.heading': 'Ainda n\u00e3o apresentamos este texto',
		'unpublished.quality.explain':
			'A nossa c\u00f3pia desta obra ficou incompleta \u2014 faltam-lhe partes, e preferimos n\u00e3o mostrar nada a mostrar um texto com falhas que n\u00e3o consegue ver. Voltar\u00e1 quando o conseguirmos apresentar corretamente.',
		'unpublished.rights.heading': 'Este texto n\u00e3o \u00e9 publicado aqui',
		'unpublished.rights.explain':
			'Reproduzimos esta obra at\u00e9 que o seu titular de direitos nos pediu que n\u00e3o o fiz\u00e9ssemos, e par\u00e1mos. O texto foi removido deste site; tudo o resto sobre a obra permanece inalterado.',
		'unpublished.readAt': 'Leia em',
		'colophon.title': 'Colof\u00e3o',
		'colophon.lede':
			'O que \u00e9 este site, de onde v\u00eam os seus textos e qual a nossa posi\u00e7\u00e3o quanto \u00e0 sua reprodu\u00e7\u00e3o.',
		'colophon.whatThisIs': 'O que \u00e9 isto',
		'colophon.whatThisIsBody':
			'A Glossa Catholica \u00e9 um site de leitura das Escrituras, do Catecismo, do Compêndio e dos documentos do Magist\u00e9rio, em portugu\u00eas e em ingl\u00eas. Existe para ser lido, e nada mais lhe \u00e9 pedido para o ler:',
		'colophon.pointFree':
			'Gratuito, e sempre gratuito. Sem barreira de pagamento, sem subscri\u00e7\u00e3o, nada para comprar.',
		'colophon.pointNoAds': 'Sem publicidade nem qualquer conte\u00fado patrocinado.',
		'colophon.pointNoAccounts': 'Sem contas. Nada para registar, nada para iniciar sess\u00e3o.',
		'colophon.pointNoTracking':
			'Sem an\u00e1lises de tr\u00e1fego, sem scripts de rastreio, sem c\u00f3digo de terceiros. O servidor que lhe envia estas p\u00e1ginas guarda registos de pedidos, como qualquer servidor web; nada al\u00e9m disso observa o que l\u00ea.',
		'colophon.pointOffline':
			'Feito para continuar a funcionar sem liga\u00e7\u00e3o depois da primeira visita, para que uma liga\u00e7\u00e3o fraca n\u00e3o tenha de impedir a leitura.',
		'colophon.textsTitle': 'Os textos',
		'colophon.textsBody':
			'Cada texto prov\u00e9m de uma fonte identificada, e cada obra indica a sua edi\u00e7\u00e3o, a p\u00e1gina de origem e a data em que foi obtida. As Escrituras usam tradu\u00e7\u00f5es de dom\u00ednio p\u00fablico; o Catecismo, o Compêndio e os documentos do Magist\u00e9rio prov\u00eam dos textos publicados pela Santa S\u00e9. Reproduzimo-los sem altera\u00e7\u00f5es \u2014 e quando a nossa c\u00f3pia de uma obra ficou incompleta, retiramo-la e ligamos \u00e0 fonte, em vez de lhe mostrar um texto com falhas que n\u00e3o consegue ver.',
		'colophon.countBible': 'edi\u00e7\u00f5es b\u00edblicas',
		'colophon.countDocuments': 'documentos do Magist\u00e9rio',
		'colophon.copyrightTitle': 'Direitos de autor',
		'colophon.copyrightBody1':
			'O Catecismo, o Compêndio e os documentos do Magist\u00e9rio pertencem aos seus titulares de direitos \u2014 principalmente a Libreria Editrice Vaticana e o Dicast\u00e9rio para a Comunica\u00e7\u00e3o. Reproduzimo-los aqui sem ter pedido autoriza\u00e7\u00e3o pr\u00e9via. Dizemo-lo com clareza em vez de o deixar por descobrir: \u00e9 uma escolha deliberada, n\u00e3o um descuido.',
		'colophon.copyrightBody2':
			'Fazemos essa escolha porque estes textos s\u00e3o o ensino da Igreja, dirigido a todos, e porque a preocupa\u00e7\u00e3o manifestada pelos titulares de direitos \u00e9 a integridade do texto. Por isso o texto nunca \u00e9 abreviado, nunca parafraseado, nunca reescrito e nunca colocado junto a publicidade. Corrigimos defeitos evidentes das p\u00e1ginas publicadas \u2014 uma palavra em falta, uma refer\u00eancia truncada, marca\u00e7\u00e3o que engoliu um par\u00e1grafo \u2014 sempre no sentido do que a pr\u00f3pria fonte imprime, nunca no sentido do que julgamos que deveria dizer. N\u00e3o alteramos o seu significado, n\u00e3o substitu\u00edmos as suas palavras pelas nossas e n\u00e3o anotamos nem comentamos. Cada corre\u00e7\u00e3o \u00e9 registada em separado, com o original, a substitui\u00e7\u00e3o e o motivo; nada \u00e9 alterado em sil\u00eancio. Cada obra apresenta o aviso de direitos do seu titular, nas palavras dele, e liga \u00e0 p\u00e1gina de onde foi retirada.',
		'colophon.copyrightBody3':
			'Se detiver direitos sobre algum texto aqui presente e preferir que n\u00e3o seja publicado, escreva-nos e retiramo-lo prontamente. Sem discuss\u00e3o, e sem necessidade de envolver mais ningu\u00e9m.',
		'colophon.contactTitle': 'Contacto',
		'colophon.contactBody': 'Para qualquer assunto, incluindo o acima:',
		'colophon.contactPending':
			'Ainda n\u00e3o foi definido um endere\u00e7o de contacto. Este site n\u00e3o deve ser tornado p\u00fablico enquanto n\u00e3o o tiver \u2014 o compromisso acima n\u00e3o tem sentido sem uma forma de nos contactar.',
		'colophon.buildTitle': 'Como \u00e9 feito',
		'colophon.buildBody':
			'Os textos s\u00e3o recolhidos das suas fontes publicadas, analisados para um corpus estruturado e apresentados como p\u00e1ginas est\u00e1ticas. As corre\u00e7\u00f5es a defeitos das fontes s\u00e3o registadas uma a uma, com a reda\u00e7\u00e3o original, a corrigida e o motivo \u2014 nenhum texto \u00e9 alterado em sil\u00eancio.',
		'colophon.typeTitle': 'Os tipos',
		'colophon.typeBody':
			'Composto em EB Garamond, o renascimento por Georg Duffner e Octavio Pardo dos tipos que Claude Garamont gravou na d\u00e9cada de 1590 \u2014 a tradi\u00e7\u00e3o humanista em que a Igreja imprime desde o Renascimento. As iniciais s\u00e3o Pirata One, uma letra g\u00f3tica cujas mai\u00fasculas permanecem leg\u00edveis no tamanho que uma capitular exige. Ambas as fontes t\u00eam licen\u00e7a SIL Open Font License e s\u00e3o servidas a partir deste s\u00edtio e n\u00e3o de terceiros, de modo que ler uma p\u00e1gina nada exige do servidor de outrem.',
		'bible.citedInCcc': 'Citado no Catecismo',
		'bible.wholeChapter': 'Este capítulo',
		'bible.verseNotInEdition': 'Este número de versículo não existe nesta edição',
		'bible.verseAbbrev': 'v.',
		'ccc.readFullChapter': 'Ler o capítulo completo',
		'ccc.showSubsections': 'Mostrar subsecções',
		'ccc.hideSubsections': 'Ocultar subsecções',
		'ccc.noParagraphNumber': 'Sem número de parágrafo neste corpus',
		'copyright.sourceTitle': 'Abrir a página de origem',
		'lang.label': 'Idioma',

		'notFound.title': 'Nada neste endereço',
		'notFound.lede': 'A página que pediu não está aqui.',
		'notFound.body':
			'A ligação pode estar mal escrita ou desatualizada, ou pode apontar para um texto que este sítio não contém. Nada aqui exige conta nem pagamento, por isso, se uma página existe, é acessível.',
		'notFound.searchHint':
			'Se souber a referência que procura — um livro e capítulo, um parágrafo do Catecismo — escreva-a na caixa de pesquisa no topo desta página.',
		'notFound.elsewhere': 'Ou comece por uma destas:',
		'notFound.home': 'Início',

		'compare.enter': 'Comparar edições',
		'compare.exit': 'Sair da comparação',
		'compare.missing': 'Não presente nesta edição',
		'compare.versificationNote':
			'Estas duas edições dividem os versículos deste capítulo de forma diferente em alguns pontos (uma variante textual, não uma escolha de tradução) — o mesmo número de versículo nem sempre assinala a mesma frase nas duas colunas.',
		'compare.loading': 'A carregar o segundo idioma…'
	}
};

function readStored(): UiLang | null {
	if (typeof localStorage === 'undefined') return null;
	const value = localStorage.getItem(STORAGE_KEY);
	return value === 'en' || value === 'pt' ? value : null;
}

class I18nStore {
	lang: UiLang = $state(readStored() ?? 'en');

	set(lang: UiLang) {
		this.lang = lang;
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem(STORAGE_KEY, lang);
		}
	}

	t(key: string): string {
		return dictionaries[this.lang][key] ?? dictionaries.en[key] ?? key;
	}
}

export const i18n = new I18nStore();

/** Convenience helper, reactive when called from within a component. */
export function t(key: string): string {
	return i18n.t(key);
}
