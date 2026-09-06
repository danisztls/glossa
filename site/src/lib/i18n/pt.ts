/**
 * Portuguese UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). English is the fallback for every key any other
 * dictionary leaves out, so a translation may be partial without breaking a
 * page — `t()` reaches for `en` before it gives up and shows the key.
 *
 * ONE `pt`, WRITTEN NEUTRAL, AND BRAZILIAN WHERE NEUTRAL IS NOT ON OFFER.
 * `pt` carries no region because the site knows languages and not countries
 * (`dates.ts`, `docs/languages.md`), so this dictionary belongs to no country
 * either: where both sides of the Atlantic share a form it takes the shared
 * one — 'inscrever-se', 'site', the impersonal third person rather than an
 * explicit 'você' or 'si'. Where they share none it takes Brazil, the larger
 * part of its readers: seção/gênero/canônico/anônimo, baixar, link, tela,
 * gerund and not 'estar a', “aspas” and not «aspas».
 *
 * IT WAS EUROPEAN AND ALREADY DRIFTING — the calendar strings, written later,
 * were Brazilian while the colophon was not — and a mixed dictionary costs
 * more than style: `install.hint.*` names an entry in the reader's own OS
 * menu, so the wrong variant sends them looking for words their phone does
 * not print.
 */

import type { Dictionary } from '../i18n.svelte';

export const pt: Dictionary = {
	'nav.bible': 'Bíblia',
	'nav.ccc': 'Catecismo',
	'nav.compendium': 'Compêndio',
	'nav.magisterium': 'Magistério',
	'nav.socialDoctrine': 'Doutrina social',
	'socialDoctrine.landing.title': 'Compêndio da Doutrina Social da Igreja',
	'socialDoctrine.landing.tagline':
		'O que a Igreja ensina sobre a vida em sociedade, em 583 números.',
	'nav.canonLaw': 'Direito Canônico',
	'canonLaw.landing.title': 'Código de Direito Canônico',
	'canonLaw.landing.tagline':
		'O direito da Igreja latina, em 1752 cânones distribuídos por sete livros.',
	'canonLaw.canon': 'Cân.',
	'canonLaw.canons': 'Cân.',
	'canonLaw.prevCanon': 'Cânon anterior',
	'canonLaw.nextCanon': 'Próximo cânon',
	'canonLaw.readFullTitle': 'Ler o título inteiro',
	'canonLaw.superseded': 'Redação substituída por',
	'nav.prayers': 'Orações',
	'nav.bookmarks': 'Marcadores',
	'nav.menu': 'Menu',
	'nav.sections': 'Seções',
	'nav.works': 'Obras',
	'nav.pages': 'Páginas',
	'home.title': 'Glossa Catholica',
	'reading.continue': 'Continuar lendo',
	'home.tagline':
		'Um site de leitura das Escrituras, do Catecismo e dos documentos do Magistério — gratuito, disponível offline e sem nada em que se inscrever.',
	'home.doors.heading': 'Para onde ir',
	'home.find.heading': 'Ou escreva uma referência',
	'nav.library': 'Biblioteca',
	'nav.learn': 'Aprender',
	'library.landing.tagline':
		'Todo o corpus, prateleira a prateleira — com o ponto onde parou e o que marcou.',
	'schola.landing.title': 'Por onde começar',
	'schola.landing.tagline':
		'Um guia breve do que está aqui: o que é cada um destes livros, como se escreve uma citação sua, como encontrar uma passagem, e ordens de leitura que a Igreja propôs.',
	'schola.start.heading': 'Se isto é novo para você',
	'schola.start.body': 'Comece pelo ',
	'schola.start.bodyAfter':
		': o mesmo ensinamento do Catecismo, muito mais curto, escrito em perguntas e respostas. Tem cerca de um décimo da extensão e não pressupõe nada.',
	'schola.bible.heading': 'Se nunca leu a Bíblia',
	'schola.bible.library':
		'Não é um livro, mas setenta e três, escritos ao longo de mais de mil anos e reunidos na ordem que a Igreja fixou — não a ordem em que os acontecimentos se deram, nem a ordem mais fácil de ler. A maioria das pessoas começa na primeira página e desiste algumas semanas depois, num longo capítulo de lei antiga, porque nada lhes disse ainda para que ele serve.',
	'schola.bible.step.gospel': 'Comece por um Evangelho',
	'schola.bible.start':
		'Um de quatro livros curtos sobre a vida de Jesus, bem lá dentro e não à frente. A ideia não é nossa: um Concílio da Igreja pediu que se ensinasse o reto uso da Escritura, “sobretudo do Novo Testamento e antes de tudo dos Evangelhos”. Não indicou nenhum em particular, e nós também não.',
	'schola.bible.whichGospel':
		'Três são habitualmente sugeridos, por três razões diferentes. Qualquer deles é um bom lugar para estar.',
	'schola.bible.gospel.mark':
		'O mais curto. Pode lê-lo inteiro numa tarde, e ter terminado um vale mais, no princípio, do que ter escolhido o melhor.',
	'schola.bible.gospel.luke':
		'Escrito para alguém de fora da fé que queria a história posta em ordem — o que pode ser exatamente o seu caso. Continua diretamente nos Atos dos Apóstolos, e por isso é na verdade a primeira metade de um livro mais longo.',
	'schola.bible.gospel.john':
		'O que diz abertamente por que foi escrito: “para que acrediteis”. Palavras simples, e vai direto à questão de quem é Jesus.',
	'schola.bible.step.acts': 'Depois, o que aconteceu em seguida',
	'schola.bible.thenActs':
		'Quando tiver terminado um, leia o que fizeram, depois de Ele partir, os que o conheceram.',
	'schola.bible.acts.why':
		'Os trinta anos após o fim dos Evangelhos: algumas dezenas de pessoas assustadas, e como o que tinham visto chegou ao outro extremo do império.',
	'schola.bible.step.old': 'Depois, a metade mais antiga',
	'schola.bible.thenOld':
		'Não a partir da primeira página, e não toda. Alguns lugares conduzem a história, e são aqueles para os quais os Evangelhos não param de remeter.',
	'schola.bible.ot.beginnings': 'Como começa, e como dá errado.',
	'schola.bible.ot.promise':
		'Uma família, e uma promessa que lhe é feita e sobrevive a todos os seus.',
	'schola.bible.ot.exodus': 'Um povo tirado da escravidão, e uma lei que lhe é dada para viver.',
	'schola.bible.ot.psalms':
		'Não é uma história: são cento e cinquenta orações e cânticos. Leia um de cada vez, em qualquer ordem. A Igreja ainda os reza todos os dias.',
	'schola.bible.bothWays':
		'Vai reconhecer coisas, e isso é o ponto, não uma coincidência. A Igreja lê os livros mais antigos à luz de Cristo e os mais recentes à luz do que veio antes — cada metade explica a outra, e é por isso que nenhuma se lê sozinha.',
	'schola.guide.heading': 'Como se orientar',
	'schola.guide.lede':
		'O texto é toda a página; tudo o mais é um comando que pode ignorar até querer usá-lo.',
	'schola.guide.top.heading': 'A barra no topo de todas as páginas',
	'schola.guide.reading.heading': 'A barra acima de um texto',
	'schola.feature.search':
		'Escreva uma referência na caixa do topo — capítulo e versículo, número de parágrafo, o nome de um documento — e ela a completa à medida que escreve. Pressione / ou Ctrl+K de qualquer lugar, e ? para os outros atalhos.',
	'schola.feature.languages':
		'A interface e o texto são escolhidos separadamente, e por isso pode ler uma obra numa língua enquanto os botões ficam em outra. Onde uma obra tem várias edições na sua língua, escolhe também entre elas.',
	'schola.feature.settings':
		'Tamanho do texto, claro ou escuro, sépia, e quanto do aparato quer ao lado do texto.',
	'schola.feature.offline':
		'Adicione o site à tela de início e ele abre como um aplicativo. Pode baixar obras inteiras para ler sem conexão.',
	'schola.feature.contents':
		'As divisões da obra em que está — livros, partes, capítulos — para se mover dentro dela sem voltar ao começo.',
	'schola.feature.compare':
		'Duas edições da mesma passagem, lado a lado — o latim ao lado da sua própria língua, ou uma tradução ao lado de outra.',
	'schola.feature.apparatus':
		'As notas da própria edição, e qualquer comentário escrito sobre o texto, são oferecidos ao lado dele e não abaixo. As citações dentro do texto são links, e por isso uma referência leva aonde aponta.',
	'schola.feature.focus':
		'Limpa tudo menos o texto. A saída fica onde a barra estava, para que nada fique preso atrás dela.',
	'schola.books.heading': 'O que está aqui, e como se cita',
	'schola.books.lede':
		'Cada um destes é um gênero de livro diferente, e cada um é referido por um número próprio. Os exemplos mostram a forma: escreva um assim na caixa de busca e chega à passagem.',
	'schola.cite.label': 'Cita-se',
	'schola.what.scripture':
		'As Escrituras tal como a Igreja as recebe, nos dois Testamentos. Tudo o mais que está aqui se lê à luz delas.',
	'schola.cite.scripture': 'livro, capítulo e versículo, nas abreviaturas que a sua edição imprime',
	'schola.what.catechism':
		'Um resumo do que a Igreja Católica crê, num só volume. Não é ele próprio uma fonte: reúne a Escritura, os Padres, a liturgia e o ensinamento da Igreja, e cada parágrafo diz de onde vem o que afirma.',
	'schola.cite.catechism': 'por número de parágrafo, contínuo da primeira à última página',
	'schola.what.compendium':
		'O mesmo ensinamento exposto em perguntas e respostas, com cerca de um décimo da extensão.',
	'schola.cite.compendium': 'por número de pergunta',
	'schola.what.magisterium':
		'O que os papas e os concílios efetivamente escreveram — encíclicas, constituições, decretos, declarações — cada um dirigido a um momento e a uma questão determinados. Cada um é conhecido pelas suas palavras iniciais em latim.',
	'schola.cite.magisterium': 'pelo nome do documento, e depois um número de seção dentro dele',
	'schola.what.social':
		'O ensinamento da Igreja sobre o trabalho, a propriedade, a família, a política e a paz, colhido desses documentos num só livro.',
	'schola.cite.social': 'por número de parágrafo, sob a sigla que a obra usa para si mesma',
	'schola.what.law': 'Direito, e não doutrina. Diz o que a Igreja exige, e é emendado.',
	'schola.cite.law': 'por cânon, que é como se chamam as suas unidades numeradas',
	'schola.what.doctors':
		'Os teólogos que a Igreja declarou Doutores. Não tem autoridade oficial, por maior que seja o seu autor.',
	'schola.cite.doctors': 'por parte, e depois questão — as divisões próprias da Suma',
	'schola.what.prayers': 'As palavras que a Igreja reza, com o latim ao lado.',
	'schola.cite.prayers': 'pelo nome; não há números a citar',
	'schola.places.heading': 'Não textos, mas lugares deste site',
	'schola.what.library':
		'Todas as obras do site numa só lista, agrupadas por assunto e não por gênero.',
	'schola.what.calendar':
		'O dia litúrgico — tempo, cor e quem se celebra — para o país cujo calendário segue.',
	'schola.what.bookmarks':
		'Passagens que marcou, e onde parou pela última vez em cada obra. Os dois ficam neste navegador e não são enviados para lugar nenhum.',
	'ccc.noCounterpart': 'Sem correspondência na outra obra',
	'jumpbox.placeholder': 'Ir para… (ex: jo 3,16, ccc 1234)',
	'jumpbox.short': 'Buscar',
	'jumpbox.hint': 'Pressione / ou Ctrl+K para ir a uma referência',
	'jumpbox.noMatch': 'Nenhum resultado',
	'jumpbox.suggestions': 'Sugestões',

	'settings.label': 'Configurações',
	'apparatus.label': 'Aparato',
	'apparatus.editionNotes': 'Notas desta edição',
	'apparatus.commentary': 'Comentário',
	'apparatus.inCommentary': 'Incluídas no comentário acima.',
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
		'Compõe a página inteira num único cinza, para que nada se distinga pela cor. O sépia é desligado enquanto ele estiver ativo.',

	'advanced.label': 'Avançado',
	'library.title': 'Biblioteca offline',
	'library.lede': 'Os textos salvos neste dispositivo abrem sem rede nenhuma.',
	'library.essentials': 'Orações e Compêndio',
	'library.illustrations': 'Bíblia (ilustrações)',
	'library.illustrationsDetail': 'Bíblia (ilustrações, alta resolução)',
	'library.other': 'Outros textos',
	'library.everything': 'Tudo',
	'library.downloadAll': 'Baixar tudo',
	'library.download': 'Baixar',
	'library.downloaded': 'Neste dispositivo',
	'library.offlineNote': 'Desative o modo offline para baixar.',
	'library.remove': 'Remover deste dispositivo',
	'library.removeConfirm': 'Remover?',
	'library.forget': 'Remover os downloads',
	'library.forgetConfirm': 'Remover tudo?',
	'offline.label': 'Modo offline',
	'offline.hint':
		'Não usa a rede de forma alguma: não baixa nada, não procura atualizações, não mede nada. Só abrem os textos que já estão neste dispositivo.',
	'offline.notDownloaded': 'Não está neste dispositivo',
	'loadFailed.title': 'Isso não carregou',
	'loadFailed.hint': 'A página existe — algo falhou ao buscá-la. Tentar de novo costuma resolver.',
	'loadFailed.retry': 'Tentar de novo',
	'loadFailed.retrying': 'Tentando…',
	'offline.turnOff': 'Desativar o modo offline',

	'fontSize.label': 'Tamanho do texto',
	'fontSize.larger': 'Aumentar texto',
	'fontSize.smaller': 'Diminuir texto',
	'print.label': 'Imprimir esta página',
	'toTop.label': 'Voltar ao topo',

	// "Tela de Início" and "Adicionar à Tela de Início" are iOS's own pt-BR
	// wording, capitals and crase included — the reader is being told to find
	// that exact entry in their share sheet, so the string has to match what
	// Apple prints there rather than read as a natural translation of the
	// English. THIS IS THE KEY WHERE NEUTRAL IS NOT AVAILABLE AT ALL — Apple
	// prints "Adicionar ao ecrã principal" in Portugal, a different sentence in
	// a different case, and no wording is both — so the rule above decides it.
	'install.label': 'Instalar a Glossa',
	'install.hint.label': 'Adicionar à Tela de Início',
	'install.hint.title': 'Adicione a Glossa à Tela de Início',
	'install.hint.stepBefore': 'Abre como um aplicativo e pode ser lida sem conexão. Toque em',
	'install.hint.stepAfter': 'e depois em “Adicionar à Tela de Início”.',
	'install.hint.dismiss': 'Dispensar',

	'update.label': 'Há uma nova edição disponível',
	'update.title': 'Nova edição pronta',
	'update.body': 'Recarregue para receber os textos e as correções mais recentes.',
	'update.action': 'Recarregar',
	'update.dismiss': 'Agora não',

	'edition.label': 'Edição',
	'edition.select': 'Escolher edição',
	'edition.current': 'Edição atual',
	'edition.filter': 'Buscar edições',
	'menu.noMatches': 'Nenhum resultado',

	'unitNav.previous': 'Anterior',
	'unitNav.next': 'Próximo',
	'bible.prevChapter': 'Capítulo anterior',
	'bible.nextChapter': 'Próximo capítulo',
	'bible.pickBook': 'Livros e capítulos',
	'bible.landing.title': 'A Bíblia',
	'bible.landing.tagline': 'Leia toda a Bíblia, livro por livro, capítulo por capítulo.',
	'bible.landing.random': 'Estou com sorte',
	'bible.landing.books': 'Livros',
	'bible.chapterUnavailable': 'Não disponível nesta edição',
	'bible.introduction': 'Introdução',
	'bible.introUnavailable': 'Ainda não há introdução nesta língua',
	'bible.introSource': 'As introduções não fazem parte do texto da Escritura.',
	'bible.testament.ot': 'Antigo Testamento',
	'bible.testament.nt': 'Novo Testamento',
	'bible.group.pentateuch': 'Pentateuco',
	'bible.group.historical': 'Livros Históricos',
	'bible.group.wisdom': 'Livros Sapienciais',
	'bible.group.prophetic': 'Livros Proféticos',
	'bible.group.gospels': 'Evangelhos',
	'bible.group.acts': 'Atos dos Apóstolos',
	'bible.group.pauline': 'Cartas Paulinas',
	'bible.group.catholicLetters': 'Cartas Católicas',
	'bible.group.revelation': 'Apocalipse',

	'ccc.prevParagraph': 'Parágrafo anterior',
	'ccc.nextParagraph': 'Próximo parágrafo',
	'ccc.inBrief': 'Resumindo',
	'ccc.landing.title': 'Catecismo da Igreja Católica',
	'ccc.landing.pairTitle': 'Catecismo e Compêndio',
	'ccc.landing.tagline':
		'<strong>O Catecismo</strong> expõe a doutrina católica em 2.865 parágrafos numerados. <strong>O Compêndio</strong> retoma a mesma doutrina em 598 perguntas e respostas, segundo o mesmo plano.',
	'ccc.landing.pairTagline':
		'O Catecismo da Igreja Católica em 2.865 parágrafos, e o seu Compêndio em 598 perguntas.',
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
	'ccc.abbrev': 'CIC',
	'ccc.condensedIn': 'No Compêndio',
	'compendium.abbrev': 'Comp.',
	'compendium.noQuestionNumber': 'Sem número de pergunta neste corpus',
	'nav.summa': 'Suma',
	'doctores.landing.title': 'Doutores da Igreja',
	'doctores.landing.tagline': 'As obras teológicas dos Padres e Doutores da Igreja.',
	'summa.landing.title': 'Suma Teológica',
	'summa.landing.tagline': 'Tomás de Aquino, em inglês e no latim em que escreveu.',
	'summa.tableOfContents': 'Índice',
	'summa.part': 'Parte',
	'summa.question': 'Questão',
	'summa.article': 'Artigo',
	'summa.questionShort': 'Q',
	'summa.articleShort': 'Art.',
	'summa.titleFromEdition': 'Título da edição em {lang}',
	'summa.titlesFromEdition': 'Títulos da edição em {lang} — esta não os imprime',
	'summa.prologue': 'Prólogo',
	'summa.objection': 'Objeção',
	'summa.sedContra': 'Em sentido contrário',
	'summa.corpus': 'Respondo que',
	'summa.reply': 'Resposta à objeção',
	'summa.preamble': 'Nota',
	'summa.prevQuestion': 'Questão anterior',
	'summa.nextQuestion': 'Próxima questão',
	'summa.noEditionInYourLanguage': 'A Suma não tem edição na sua língua. Apresentada em {lang}.',
	'summa.noLatinSupplement':
		'O Suplemento existe apenas em inglês — foi compilado após a morte de Tomás de Aquino.',
	'index.division': 'Divisão',
	'index.showSubsections': 'Mostrar subseções',
	'index.hideSubsections': 'Ocultar subseções',

	'prayers.landing.title': 'Orações Comuns',
	'prayers.landing.tagline': 'Orações com o texto em latim ao lado.',
	'prayers.gloss.versicle':
		'O versículo — a linha que quem dirige a oração diz ou canta sozinho. A assembleia lhe responde com a resposta que vem em seguida.',
	'prayers.gloss.response':
		'A resposta — a linha que a assembleia diz ou canta em conjunto, respondendo ao versículo anterior.',
	'prayers.tableOfContents': 'Índice',
	'prayers.seeAlso': 'Veja também',
	'prayers.prevPrayer': 'Oração anterior',
	'prayers.nextPrayer': 'Próxima oração',
	// The Rosary reader's own chrome — routes/preces/[slug] renders the
	// source's directions as a how-to and marks the set whose weekday it is
	// (`PrayerGroupEntry.days`). The weekday itself is never named: the
	// heading says "today" and the set's own printed name says which.
	'prayers.rosary.today': 'Hoje',
	'prayers.rosary.todayHeading': 'Mistérios de hoje',
	'prayers.rosary.openingPrayer': 'Oração inicial',
	'prayers.rosary.decadePrayers': 'As orações de uma dezena',

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
		'Os marcadores ficam apenas neste navegador. Não são enviados para lugar nenhum, e limpar os dados do navegador os remove.',
	'bookmark.unavailable': 'Não está na edição que está lendo',

	'document.library.tagline':
		'Encíclicas, constituições conciliares, decretos e declarações do Magistério.',
	'document.filter.heading': 'Filtros',
	'document.filter.author': 'Autor',
	'document.filter.kind': 'Tipo',
	'document.filter.subject': 'Assunto',
	'document.filter.search': 'Buscar documentos',
	'document.filter.clear': 'Limpar',
	'document.filter.results': 'Documentos exibidos',
	'document.filter.noResults': 'Nenhum documento corresponde a estes filtros.',
	'document.tableOfContents': 'Índice',
	'document.startReading': 'Começar a leitura',
	'document.readFullDocument': 'Ler o documento completo',
	'document.section': 'Seção',
	'document.prevSection': 'Anterior',
	'document.nextSection': 'Próximo',
	'document.kind.conciliarConstitution': 'Constituição',
	'document.kind.conciliarDecree': 'Decreto',
	'document.kind.conciliarDeclaration': 'Declaração',
	'document.kind.encyclical': 'Encíclica',
	'document.kind.apostolicExhortation': 'Exortação Apostólica',
	'document.kind.apostolicConstitution': 'Constituição Apostólica',
	'document.kind.cdfDeclaration': 'Declaração da CDF',
	'document.kind.cdfInstruction': 'Instrução da CDF',
	'document.kind.cdfLetter': 'Carta da CDF',
	'document.kind.cdfDoctrinalNote': 'Nota doutrinal da CDF',
	'document.kind.cdfResponsum': 'Responsum da CDF',
	'document.kind.cdfConsiderations': 'Considerações da CDF',
	'document.kindPlural.conciliarConstitution': 'Constituições',
	'document.kindPlural.conciliarDecree': 'Decretos',
	'document.kindPlural.conciliarDeclaration': 'Declarações',
	'document.kindPlural.encyclical': 'Encíclicas',
	'document.kindPlural.apostolicExhortation': 'Exortações Apostólicas',
	'document.kindPlural.apostolicConstitution': 'Constituições Apostólicas',
	'document.kindPlural.cdfDeclaration': 'Declarações da CDF',

	'citation.unavailable': 'Sem texto de fonte disponível para esta nota.',

	'colophon.title': 'Colofão',
	'colophon.lede':
		'O que é este site, de onde vêm os seus textos e qual a nossa posição quanto à sua reprodução.',
	'colophon.whatThisIs': 'O que é isto',
	'colophon.whatThisIsBody':
		'A Glossa Catholica é um site de leitura das Escrituras, do Catecismo, do Compêndio e dos documentos do Magistério, em português, inglês e latim. Existe para ser lido, e nada mais é pedido para lê-lo:',
	'colophon.pointFree':
		'Gratuito, e sempre gratuito. Sem barreira de pagamento, sem assinatura, nada para comprar.',
	'colophon.pointNoAds': 'Sem publicidade nem qualquer conteúdo patrocinado.',
	'colophon.pointNoAccounts': 'Sem contas. Nada em que se inscrever, nada em que fazer login.',
	'colophon.pointNoTracking':
		'Sem scripts de rastreamento, sem código de terceiros, sem cookies. Apenas contagens de uso anônimas, sem nada que o identifique.',
	'colophon.pointOffline':
		'Feito para continuar funcionando offline depois da primeira visita, para que uma conexão fraca não precise impedir a leitura.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica é uma iniciativa privada de fiéis leigos. Não tem aprovação eclesiástica e não fala com autoridade própria.',
	'footer.notEndorsed': 'Sem aprovação da Santa Sé',
	'colophon.textsTitle': 'Os textos',
	'colophon.textsBody':
		'Cada texto vem de uma fonte identificada, e cada obra indica a sua edição, a página de origem e a data em que foi obtida. As Escrituras usam traduções de domínio público; o Catecismo, o Compêndio e os documentos do Magistério vêm dos textos publicados pela Santa Sé.',
	'colophon.textsFidelity':
		'O texto nunca é abreviado, nunca parafraseado, nunca reescrito e nunca colocado junto a publicidade. Corrigimos defeitos evidentes — uma palavra faltando, uma referência truncada, marcação que engoliu um parágrafo — sempre no sentido do que a própria fonte imprime, nunca no sentido do que julgamos que deveria dizer.',
	'colophon.countBible': 'edições bíblicas',
	'colophon.countDocuments': 'documentos do Magistério',
	// Operative rather than descriptive, like `whatThisIsStanding` and
	// `copyrightBody3`: this is the notice the LGPD argument in
	// site/docs/usage.md rests on, so a loose line here misstates what the site
	// does rather than merely reading oddly. Terms are this dictionary's own —
	// 'código de terceiros' and 'uso' from `pointNoTracking`.
	'colophon.privacyTitle': 'Privacidade',
	'colophon.privacyBody1':
		'Sem contas, sem cookies, sem publicidade, sem código de terceiros. Nada aqui o segue para fora deste site.',
	'colophon.privacyBody2':
		'Contamos, isso sim, como o site é usado: uma medição por visita, com cada campo em faixas e não em valores exatos — quanto tempo ficou, quantas vezes já nos visitou, que obras abriu. O país é contado à parte, sem nada que o ligue ao resto. Descreve uma visita, não um visitante, e é conservada por {days} dias.',
	'colophon.privacyBody3':
		'Nunca são enviados: o que escreve na caixa de busca, que passagem estava aberta, ou qualquer coisa que permita reconhecer o seu dispositivo de novo. Suas configurações, marcadores e textos baixados ficam no seu dispositivo.',
	'colophon.copyrightTitle': 'Direitos autorais',
	'colophon.copyrightBody1':
		'O Catecismo, o Compêndio e os documentos do Magistério pertencem aos seus titulares de direitos — principalmente a Libreria Editrice Vaticana e o Dicastério para a Comunicação.',
	'colophon.copyrightBody2':
		'Cada obra apresenta o aviso de direitos do seu titular, nas palavras dele, e traz o link da página de onde foi retirada.',
	'colophon.copyrightBody3':
		'Se detiver direitos sobre algum texto aqui presente e preferir que não seja publicado, escreva para nós.',
	'colophon.contactTitle': 'Contato',
	'colophon.contactBody': 'Para qualquer assunto, inclusive o acima:',
	'colophon.contactPending':
		'Ainda não foi definido um endereço de contato. Este site não deve ser tornado público enquanto não o tiver — o compromisso acima não faz sentido sem uma forma de nos escrever.',
	'colophon.illustrationsTitle': 'As ilustrações',
	'colophon.illustrationsBody':
		'A Bíblia traz as gravuras de Gustave Doré, cada uma junto ao versículo que representa — o último e o maior dos seus ciclos bíblicos, gravado em madeira a partir dos seus desenhos e impresso com o texto, não reunido no fim do volume.',
	'colophon.illustrationsRights':
		'Estão em domínio público, como mostram as datas abaixo, e a reprodução fotográfica fiel de uma gravura em domínio público não gera direito autoral novo.',
	'colophon.countPlates': 'gravuras',
	'colophon.countPlateChapters': 'capítulos ilustrados',
	'plates.scansBy': 'Digitalizações fornecidas por',
	'plates.enlarge': 'Ampliar {title}',
	'plates.zoom': 'Zoom',
	'art.about': 'Sobre esta imagem',
	'art.detail': 'detalhe',
	'colophon.typeTitle': 'Os tipos',
	'colophon.typeBody':
		'Composto em EB Garamond, o renascimento por Georg Duffner e Octavio Pardo dos tipos que Claude Garamont gravou na década de 1590 — a tradição humanista em que a Igreja imprime desde o Renascimento. O seu cirílico é das mesmas mãos, mas não renasce de nada: nunca se gravou um Garamond cirílico, e por isso o russo é composto numa forma desenhada para conviver com o resto.',
	'colophon.typeArabic':
		'O árabe está inteiramente fora do alcance dele e é composto em Amiri — o renascimento por Khaled Hosny do naskh gravado para a imprensa de Bulaq, no Cairo, em 1905, escolhido pelo mesmo raciocínio que a letra do texto: um tipo de livro histórico preciso e não um desenho contemporâneo.',
	'colophon.typeInitials':
		'As iniciais são Pirata One, uma letra gótica cujas maiúsculas continuam legíveis no tamanho que uma capitular exige, e — para o russo — Ponomar, que reproduz o tipo eslavo eclesiástico da Imprensa Sinodal. Ponomar compõe a inicial e nunca o texto: uma encíclica moderna composta inteiramente em tipo sinodal diria algo falso sobre o que ela é. Todas têm licença SIL Open Font License e são servidas a partir deste site, e não de terceiros, de modo que ler uma página não exige nada do servidor de mais ninguém.',
	'refs.citedIn': 'Citado em',
	'refs.externalVolume': 'Volume {volume} em {host} — PDF digitalizado',
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
	'lang.filter': 'Buscar idiomas',
	'lang.more': 'mais idiomas',

	'notFound.title': 'Nada neste endereço',
	'notFound.lede': 'A página que pediu não está aqui.',
	'notFound.body':
		'O link pode estar mal escrito ou desatualizado, ou pode apontar para um texto que este site não contém.',
	'notFound.searchHint':
		'Se souber a referência que procura — um livro e capítulo, um parágrafo do Catecismo — escreva-a na caixa de busca no topo desta página.',
	'notFound.credit': 'Baseado em British Library, Royal MS 10 E IV, f. 49v',
	'notFound.elsewhere': 'Ou comece por uma destas:',
	'notFound.home': 'Início',

	'compare.enter': 'Comparar edições',
	'compare.exit': 'Sair da comparação',
	'compare.missing': 'Não presente nesta edição',
	'compare.versificationNote':
		'Estas duas edições dividem os versículos deste capítulo de forma diferente em alguns pontos (uma variante textual, não uma escolha de tradução) — o mesmo número de versículo nem sempre assinala a mesma frase nas duas colunas.',
	'compare.loading': 'Carregando o segundo idioma…',
	'ui.close': 'Fechar',
	'shortcuts.title': 'Atalhos de teclado',
	'shortcuts.betweenDocuments': 'Entre documentos',
	'shortcuts.withinDocument': 'Dentro do documento',
	'shortcuts.show': 'Mostrar esta lista',
	'zen.enter': 'Modo de concentração',
	'zen.exit': 'Sair do modo de concentração',
	'nav.calendar': 'Calendário',
	'calendar.title': 'Calendário Litúrgico',
	'calendar.tagline':
		'O Calendário Romano Geral, calculado para qualquer dia — o tempo, o grau e a cor.',
	'calendar.calendar': 'Calendário',
	'calendar.which.general': 'Calendário Romano Geral',
	'calendar.filter': 'Buscar países',
	'calendar.region.europe': 'Europa',
	'calendar.region.americas': 'Américas',
	'calendar.region.africa': 'África',
	'calendar.region.middleEast': 'Oriente Médio',
	'calendar.region.asia': 'Ásia',
	'calendar.region.oceania': 'Oceania',
	'calendar.today': 'Hoje',
	'calendar.previousMonth': 'Mês anterior',
	'calendar.nextMonth': 'Próximo mês',
	'calendar.plainDays': 'Dias feriais',
	'calendar.noSuchDay': 'Nenhum dia litúrgico é calculado para essa data.',
	'calendar.week': 'semana',
	'calendar.alsoToday': 'Também hoje',
	'calendar.alsoObserved': 'Também se observa hoje',
	'calendar.obligation': 'Dia santo de guarda',
	'calendar.obligationCanon': 'CIC cân. 1246',
	'calendar.sundayCycle': 'Ciclo dominical',
	'calendar.weekdayCycle': 'Ciclo ferial',
	'calendar.psalterWeek': 'Semana do saltério',
	'lectionary.heading': 'Leituras da missa',
	'lectionary.slot.reading': 'Leitura',
	'lectionary.slot.reading1': 'Primeira leitura',
	'lectionary.slot.reading2': 'Segunda leitura',
	'lectionary.slot.reading3': 'Terceira leitura',
	'lectionary.slot.reading4': 'Quarta leitura',
	'lectionary.slot.reading5': 'Quinta leitura',
	'lectionary.slot.reading6': 'Sexta leitura',
	'lectionary.slot.reading7': 'Sétima leitura',
	'lectionary.slot.psalm': 'Salmo responsorial',
	'lectionary.slot.epistle': 'Epístola',
	'lectionary.slot.acclamation': 'Aclamação ao Evangelho',
	'lectionary.slot.gospel': 'Evangelho',
	'lectionary.slot.sequence': 'Sequência',
	'lectionary.or': 'ou',
	'lectionary.notScripture': 'texto não bíblico',
	'lectionary.cf': 'Cf.',
	'lectionary.about': 'Sobre estas leituras',
	'lectionary.caveat':
		'As passagens indicadas pelo Ordo Lectionum Missae, ligadas às edições ' +
		'deste site — não a tradução proclamada numa igreja em particular, e ' +
		'uma conferência episcopal pode adaptar o esquema.',
	'calendar.transferredFrom': 'Transferido de',
	'calendar.season.advent': 'Advento',
	'calendar.season.christmas': 'Tempo do Natal',
	'calendar.season.lent': 'Quaresma',
	'calendar.season.triduum': 'Tríduo Pascal',
	'calendar.season.easter': 'Tempo Pascal',
	'calendar.season.ordinary': 'Tempo Comum',
	'calendar.colour.white': 'Branco',
	'calendar.colour.red': 'Vermelho',
	'calendar.colour.green': 'Verde',
	'calendar.colour.violet': 'Roxo',
	'calendar.colour.rose': 'Rosa',
	'calendar.colour.black': 'Preto',
	'calendar.colour.blue': 'Azul',
	'calendar.rank.solemnity': 'Solenidade',
	'calendar.rank.feast': 'Festa',
	'calendar.rank.memorial': 'Memória',
	'calendar.rank.optional-memorial': 'Memória facultativa',
	'calendar.rank.commemoration': 'Comemoração',
	'calendar.rank.sunday': 'Domingo',
	'calendar.rank.weekday': 'Féria',
	/* Ver `en.ts`: as glosas aparecem no cartão do dia e no rodapé de
	   `/calendarium`. */
	'calendar.gloss.season.advent':
		'As quatro semanas antes do Natal: preparação para a vinda do Senhor, e início do ano da Igreja.',
	'calendar.gloss.season.christmas':
		'Do Natal ao Batismo do Senhor, celebrando o nascimento do Senhor e a sua manifestação ao mundo.',
	'calendar.gloss.season.lent':
		'Os quarenta dias da Quarta-feira de Cinzas até a Missa vespertina da Ceia do Senhor: penitência, esmola e preparação para a Páscoa.',
	'calendar.gloss.season.triduum':
		'Os três dias da tarde da Quinta-feira Santa à tarde do Domingo de Páscoa — paixão, morte e ressurreição do Senhor, e o ápice de todo o ano.',
	'calendar.gloss.season.easter':
		'Os cinquenta dias da Páscoa a Pentecostes, celebrados como uma única festa — “um só grande domingo”.',
	'calendar.gloss.season.ordinary':
		'As trinta e três ou trinta e quatro semanas fora dos outros tempos. Não é tempo “qualquer”, e sim ordenado: as semanas são numeradas, e a Igreja percorre a vida e o ensinamento do Senhor em ordem. Vem em duas etapas — depois do Tempo do Natal até a Quaresma, e depois de Pentecostes até o Advento.',
	'calendar.gloss.rank.solemnity':
		'O grau mais alto: a Páscoa, o Natal, a Ascensão, o padroeiro do lugar. Celebra-se com Glória e Credo, e começa na tarde do dia anterior.',
	'calendar.gloss.rank.feast':
		'Celebra-se dentro do próprio dia. Os apóstolos e evangelistas, e os dias maiores do Senhor e de Nossa Senhora.',
	'calendar.gloss.rank.memorial':
		'Um santo lembrado no seu dia, dentro da Missa e do Ofício do tempo. Obrigatória onde é celebrada.',
	'calendar.gloss.rank.optional-memorial':
		'Pode ser celebrada ou não, à escolha do sacerdote ou da comunidade. Se não for, o dia é simplesmente a féria.',
	'calendar.gloss.rank.commemoration':
		'O que uma memória se torna na Quaresma: uma oração acrescentada à Missa ferial, que o tempo mantém no mais.',
	'calendar.gloss.rank.sunday':
		'A festa primordial — o Dia do Senhor, celebrado toda semana desde a ressurreição. Só uma solenidade ou uma festa do Senhor pode substituí-lo, e no Advento, na Quaresma e no Tempo Pascal nem isso.',
	'calendar.gloss.rank.weekday':
		'Dia sem celebração própria. A Missa e o Ofício são os do tempo — o que torna o tempo a coisa a saber.',
	'calendar.gloss.colour.white':
		'Alegria. Tempo Pascal e Tempo do Natal, os dias do Senhor fora da sua paixão, Nossa Senhora, os anjos e os santos não mártires.',
	'calendar.gloss.colour.red':
		'Sangue e fogo. Domingo de Ramos e Sexta-feira Santa, Pentecostes, os apóstolos e evangelistas, e os mártires.',
	'calendar.gloss.colour.green': 'Tempo Comum: a cor da esperança e do que cresce.',
	'calendar.gloss.colour.violet': 'Advento e Quaresma, e também nas Missas pelos falecidos.',
	'calendar.gloss.colour.rose':
		'Usado duas vezes por ano — no domingo Gaudete, terceiro do Advento, e no domingo Laetare, quarto da Quaresma — quando o jejum se alivia e o fim se avizinha.',
	'calendar.gloss.colour.black': 'Pode ser usado nas Missas pelos falecidos.',
	'calendar.gloss.colour.blue':
		'O privilégio do azul: usado na Imaculada Conceição na Espanha, nas Filipinas e nos poucos outros lugares a que a Santa Sé o concedeu.',
	'calendar.gloss.sundayCycle':
		'As leituras dominicais correm em três anos — A, B e C — lendo Mateus, Marcos e Lucas por vez, com João na Quaresma e no Tempo Pascal. O ciclo vira no primeiro domingo do Advento, com o ano da Igreja.',
	'calendar.gloss.weekdayCycle':
		'As leituras feriais correm em dois anos, I e II: a primeira leitura muda, o Evangelho não. O ano litúrgico recebe o nome do ano civil em que termina — anos ímpares são I, anos pares II.',
	'calendar.gloss.psalterWeek':
		'A Liturgia das Horas distribui os salmos por quatro semanas, I a IV, que se repetem ao longo do ano. Esta é a semana cujos salmos são os de hoje, para quem reza as Horas.',
	'calendar.gloss.obligation':
		'Dia em que os fiéis são obrigados a participar da Missa e a se abster dos trabalhos que o impeçam. Todos os domingos, e os demais dias que cada conferência episcopal determinou.',
	'calendar.primer.title': 'Primeira vez por aqui?',
	'calendar.primer.lead':
		'A Igreja guarda um ano próprio. Começa no Advento, gira em torno da Páscoa e dá a cada dia um nome, um grau e uma cor — e são eles que decidem o que se reza e se lê na Missa e na Liturgia das Horas naquele dia. Assim, “23º Domingo do Tempo Comum” é um endereço: diz a um sacerdote, a um coro ou a quem reza em casa quais orações e leituras são as de hoje.',
	'calendar.primer.seasons': 'Os tempos',
	'calendar.primer.ranks': 'O que um dia pode ser',
	'calendar.primer.colours': 'As cores',
	'calendar.primer.cycles': 'Os ciclos',
	'calendar.primer.cyclesLead':
		'Três contadores que, juntos, dizem quais leituras e salmos estão marcados para hoje.'
};
