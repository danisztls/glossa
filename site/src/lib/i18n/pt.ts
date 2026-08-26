/**
 * Portuguese UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). English is the fallback for every key any other
 * dictionary leaves out, so a translation may be partial without breaking a
 * page — `t()` reaches for `en` before it gives up and shows the key.
 */

import type { Dictionary } from '../i18n.svelte';

export const pt: Dictionary = {
	'nav.bible': 'Bíblia',
	'nav.ccc': 'Catecismo',
	'nav.compendium': 'Compêndio',
	'nav.magisterium': 'Magistério',
	'nav.prayers': 'Orações',
	'nav.bookmarks': 'Marcadores',
	'nav.menu': 'Menu',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Continuar lendo',
	'home.works': 'Biblioteca',
	'home.ccc.heading': 'Catecismo e Compêndio',
	'home.ccc.noCounterpart': 'Sem correspondência na outra obra',
	'home.magisterium.mostRecent': 'Mais recente',
	'jumpbox.placeholder': 'Ir para… (ex: jo 3,16, ccc 1234)',
	'jumpbox.short': 'Buscar',
	'jumpbox.hint': 'Pressione / ou Ctrl+K para ir a uma referência',
	'jumpbox.noMatch': 'Nenhum resultado',

	'appearance.label': 'Aparência',
	'darkMode.label': 'Modo escuro',
	// 'Auto', not 'Automático': see the note in the English dictionary — the
	// three share one segmented control, and 'AUTOMÁTICO' set uppercase is
	// wider than the cell that holds it.
	'darkMode.auto': 'Auto',
	'darkMode.on': 'Ligado',
	'darkMode.off': 'Desligado',
	'sepia.label': 'Sépia',
	'sepia.lightOnly': 'Só no modo claro',
	'sepia.noHue': 'Não no mono',
	'oled.label': 'Preto OLED',
	'oled.darkOnly': 'Só no modo escuro',
	'mono.label': 'Monocromático',
	'mono.hint':
		'Compõe a página inteira num único cinzento, para que nada se distinga pela cor. O sépia desliga-se enquanto estiver ativo.',

	'fontSize.label': 'Tamanho do texto',
	'fontSize.larger': 'Aumentar texto',
	'fontSize.smaller': 'Diminuir texto',
	'print.label': 'Imprimir esta página',

	// "Ecrã Principal" and "Adicionar ao Ecrã Principal" are iOS's own
	// pt-PT wording — the reader is being told to find that exact entry in
	// their share sheet, so the string has to match what Apple prints
	// there rather than read as a natural translation of the English.
	'install.label': 'Instalar a Glossa',
	'install.hint.label': 'Adicionar ao Ecrã Principal',
	'install.hint.title': 'Adicione a Glossa ao seu Ecrã Principal',
	'install.hint.stepBefore': 'Abre como uma aplicação e lê-se sem ligação. Toque em',
	'install.hint.stepAfter': 'e depois em «Adicionar ao Ecrã Principal».',
	'install.hint.dismiss': 'Dispensar',

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
	'bible.introduction': 'Introdução',
	'bible.introUnavailable': 'Ainda não há introdução nesta língua',
	'bible.introSource': 'As introduções não fazem parte do texto da Escritura.',
	'bible.testament.ot': 'Antigo Testamento',
	'bible.testament.nt': 'Novo Testamento',

	'ccc.prevParagraph': 'Anterior',
	'ccc.nextParagraph': 'Próximo',
	'ccc.inBrief': 'Resumindo',
	'ccc.landing.title': 'Catecismo da Igreja Católica',
	'ccc.landing.tagline': 'O Catecismo completo.',
	'ccc.tableOfContents': 'Índice',
	'ccc.related': 'Veja também',

	'compendium.landing.title': 'Compêndio do Catecismo',
	'compendium.landing.tagline': 'Perguntas e respostas que resumem o Catecismo da Igreja Católica.',
	'compendium.question': 'Pergunta',
	'compendium.answer': 'Resposta',
	'compendium.tableOfContents': 'Índice',
	'compendium.prevQuestion': 'Pergunta anterior',
	'compendium.nextQuestion': 'Próxima pergunta',
	'compendium.condenses': 'Condensa os §§',
	'compendium.noQuestionNumber': 'Sem número de pergunta neste corpus',
	'nav.summa': 'Suma',
	'summa.landing.title': 'Suma Teológica',
	'summa.landing.tagline': 'Tomás de Aquino, em inglês e no latim em que escreveu.',
	'summa.tableOfContents': 'Índice',
	'summa.part': 'Parte',
	'summa.question': 'Questão',
	'summa.article': 'Artigo',
	'summa.questionShort': 'Q',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Título da edição em {lang}',
	'summa.prologue': 'Prólogo',
	'summa.objection': 'Objecção',
	'summa.sedContra': 'Em sentido contrário',
	'summa.corpus': 'Respondo que',
	'summa.reply': 'Resposta à objecção',
	'summa.preamble': 'Nota',
	'summa.prevQuestion': 'Questão anterior',
	'summa.nextQuestion': 'Questão seguinte',
	'summa.noEditionInYourLanguage': 'A Suma não tem edição na sua língua. Apresentada em {lang}.',
	'summa.noLatinSupplement':
		'O Suplemento existe apenas em inglês — foi compilado após a morte de Tomás de Aquino.',
	'index.showSubsections': 'Mostrar subsecções',
	'index.hideSubsections': 'Ocultar subsecções',

	'prayers.landing.title': 'Orações Comuns',
	'prayers.landing.tagline': 'Orações com o texto em latim ao lado.',
	'prayers.tableOfContents': 'Índice',
	'prayers.prevPrayer': 'Oração anterior',
	'prayers.nextPrayer': 'Próxima oração',
	// The Rosary reader's own chrome — routes/prayers/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Hoje',
	'prayers.rosary.todayHeading': 'Mistérios de hoje',
	'prayers.rosary.openingPrayer': 'Oração inicial',
	'prayers.rosary.decadePrayers': 'As orações de uma dezena',
	'home.prayers.heading': 'Orações',
	'home.prayers.browseAll': 'Ver todas as orações',

	'ref.tooltip.loading': 'Carregando…',
	'ref.tooltip.openCcc': 'Abrir no Catecismo',
	'ref.tooltip.openBible': 'Abrir na Bíblia',
	'ref.tooltip.openCompendium': 'Abrir no Compêndio',
	'ref.preview.open': 'Abrir',
	'ref.cf': 'cf.',

	'anchor.actions': 'Ações da referência',
	'anchor.copy': 'Copiar texto',
	'anchor.copyLink': 'Copiar endereço',
	'anchor.view': 'Ver',
	'anchor.copied': 'Copiado',
	'anchor.copyFailed': 'Não foi possível copiar',
	'bookmark.add': 'Marcar',
	'bookmark.remove': 'Remover marcador',
	'bookmark.library': 'Marcadores',
	'bookmark.library.tagline': 'Tudo o que marcou durante a leitura.',
	'bookmark.empty': 'Ainda não há nada marcado.',
	'bookmark.emptyHint':
		'Clique no número de um versículo ou parágrafo e escolha Marcar, ou use o botão de marcador numa página.',
	'bookmark.deviceOnly':
		'Os marcadores ficam apenas neste navegador. Não são enviados para lado nenhum, e limpar os dados do navegador remove-os.',
	'bookmark.unavailable': 'Não está na edição que está a ler',

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

	'colophon.title': 'Colof\u00e3o',
	'colophon.lede':
		'O que \u00e9 este site, de onde v\u00eam os seus textos e qual a nossa posi\u00e7\u00e3o quanto \u00e0 sua reprodu\u00e7\u00e3o.',
	'colophon.whatThisIs': 'O que \u00e9 isto',
	'colophon.whatThisIsBody':
		'A Glossa Catholica \u00e9 um site de leitura das Escrituras, do Catecismo, do Compêndio e dos documentos do Magist\u00e9rio, em portugu\u00eas, ingl\u00eas e latim. Existe para ser lido, e nada mais lhe \u00e9 pedido para o ler:',
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
		'Cada texto prov\u00e9m de uma fonte identificada, e cada obra indica a sua edi\u00e7\u00e3o, a p\u00e1gina de origem e a data em que foi obtida. As Escrituras usam tradu\u00e7\u00f5es de dom\u00ednio p\u00fablico; o Catecismo, o Compêndio e os documentos do Magist\u00e9rio prov\u00eam dos textos publicados pela Santa S\u00e9. Reproduzimo-los sem altera\u00e7\u00f5es \u2014 e quando a nossa c\u00f3pia de uma obra ficou incompleta, deixamo-la fora do site, em vez de lhe mostrar um texto com falhas que n\u00e3o consegue ver.',
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
	'refs.citedIn': 'Citado em',
	'bible.cccAbbrev': 'CIC',
	'bible.wholeChapter': 'Este capítulo',
	'bible.verseNotInEdition': 'Este número de versículo não existe nesta edição',
	'bible.verseAbbrev': 'v.',
	'bible.note': 'Nota',
	'bible.noteMissing': 'Esta nota falta no corpus',
	'bible.chapterArgument': 'Argumento',
	'ccc.readFullChapter': 'Ler o capítulo completo',
	'ccc.noParagraphNumber': 'Sem número de parágrafo neste corpus',
	'copyright.sourceTitle': 'Abrir a página de origem',
	'copyright.sourceLabel': 'Fonte',
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
};
