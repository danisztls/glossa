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

const STORAGE_KEY = 'depositum:ui-lang';

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
		'nav.menu': 'Menu',
		'home.title': 'Depositum',
		'home.tagline': 'The Bible and the Catechism of the Catholic Church, free to read.',
		'home.continueReading': 'Continue reading',
		'home.works': 'Library',
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

		// Reference tooltips/popovers — RefText.svelte is the consumer.
		'ref.tooltip.loading': 'Loading…',
		'ref.tooltip.openCcc': 'Open in Catechism',
		'ref.tooltip.openBible': 'Open in Bible',
		'ref.tooltip.openCompendium': 'Open in Compendium',
		'ref.cf': 'cf.',

		// Documents (encyclicals, conciliar constitutions/decrees/declarations,
		// docs/corpus-schema.md §Documents) — routes/documents/** is the
		// consumer, plus the home page's Magisterium group.
		'document.library.tagline':
			'Encyclicals, conciliar constitutions, decrees, and declarations of the Magisterium.',
		'document.tableOfContents': 'Table of Contents',
		'document.startReading': 'Start reading',
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

		'unpublished.tag': 'Not published here',
		'unpublished.heading': 'This text is not published here',
		'unpublished.explain':
			'We reproduced this work until its rights holder asked us not to, and we stopped. The text below has been removed from this site; everything else about the work is unchanged.',
		'unpublished.readAt': 'Read it at',
		'colophon.title': 'Colophon',
		'colophon.lede':
			'What this site is, where its texts come from, and where we stand on reproducing them.',
		'colophon.whatThisIs': 'What this is',
		'colophon.whatThisIsBody':
			'Depositum is a reading site for the Scriptures, the Catechism, the Compendium, and the documents of the Magisterium, in English and Portuguese. It exists to be read, and nothing else is asked of you for reading it:',
		'colophon.pointFree': 'Free, and always free.',
		'colophon.pointNoAds': 'No advertising, and no sponsored placement of any kind.',
		'colophon.pointNoAccounts': 'No accounts. Nothing to sign up for, nothing to log in to.',
		'colophon.pointNoTracking': 'No analytics and no third-party scripts. Nothing here reports on your reading.',
		'colophon.pointOffline':
			'Works offline once visited, so a poor connection is not a barrier to reading.',
		'colophon.textsTitle': 'The texts',
		'colophon.textsBody':
			'Every text is reproduced in full and unaltered from a named source, and every work carries its own edition, its source page, and the date it was retrieved. Scripture uses public-domain translations. The Catechism, the Compendium and the magisterial documents are reproduced from the Holy See\u2019s own published texts.',
		'colophon.countBible': 'Bible editions',
		'colophon.countDocuments': 'magisterial documents',
		'colophon.copyrightTitle': 'Copyright',
		'colophon.copyrightBody1':
			'The Catechism, the Compendium and the magisterial documents are the property of their rights holders \u2014 principally the Libreria Editrice Vaticana and the Dicastery for Communication. We reproduce them here without having asked permission first. We say so plainly rather than leave it to be discovered: this is a deliberate choice, not an oversight.',
		'colophon.copyrightBody2':
			'We make that choice because these texts are the Church\u2019s teaching, addressed to everyone, and because the concern rights holders have stated is the integrity of the text. So the text is never abridged, never paraphrased, never edited, and never placed beside advertising. Each work displays its rights holder\u2019s own copyright notice, in their wording, and links to the page it was taken from.',
		'colophon.copyrightBody3':
			'If you hold rights in any text here and would rather it were not published, write to us and we will take it down promptly. No argument, and no need to involve anyone else first.',
		'colophon.contactTitle': 'Contact',
		'colophon.contactBody': 'For anything at all, including the above:',
		'colophon.contactPending':
			'A contact address has not been set yet. This site should not be made public until it has one \u2014 the commitment above is not meaningful without a way to reach us.',
		'colophon.buildTitle': 'How it is made',
		'colophon.buildBody':
			'The texts are collected from their published sources, parsed into a structured corpus, and rendered as static pages. Corrections to source defects are recorded individually, with the original wording, the corrected wording, and the reason \u2014 no text is ever silently changed.',
		'bible.citedInCcc': 'Cited in the Catechism',
		'bible.wholeChapter': 'This chapter',
		'bible.verseNotInEdition': 'This verse number is not in this edition — see the note in the page source',
		'bible.verseAbbrev': 'v.',
		'ccc.readFullChapter': 'Read the full chapter',
		'ccc.showSubsections': 'Show subsections',
		'ccc.hideSubsections': 'Hide subsections',
		'ccc.noParagraphNumber': 'No paragraph number in this corpus',
		'copyright.sourceTitle': 'Open the original source page',
		'lang.label': 'Language'
	},
	pt: {
		'nav.bible': 'Bíblia',
		'nav.ccc': 'Catecismo',
		'nav.compendium': 'Compêndio',
		'nav.magisterium': 'Magistério',
		'nav.menu': 'Menu',
		'home.title': 'Depositum',
		'home.tagline': 'A Bíblia e o Catecismo da Igreja Católica, livres para ler.',
		'home.continueReading': 'Continuar lendo',
		'home.works': 'Biblioteca',
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

		'ref.tooltip.loading': 'Carregando…',
		'ref.tooltip.openCcc': 'Abrir no Catecismo',
		'ref.tooltip.openBible': 'Abrir na Bíblia',
		'ref.tooltip.openCompendium': 'Abrir no Compêndio',
		'ref.cf': 'cf.',

		'document.library.tagline':
			'Encíclicas, constituições conciliares, decretos e declarações do Magistério.',
		'document.tableOfContents': 'Índice',
		'document.startReading': 'Começar a leitura',
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

		'unpublished.tag': 'N\u00e3o publicado aqui',
		'unpublished.heading': 'Este texto n\u00e3o \u00e9 publicado aqui',
		'unpublished.explain':
			'Reproduzimos esta obra at\u00e9 que o seu titular de direitos nos pediu que n\u00e3o o fiz\u00e9ssemos, e par\u00e1mos. O texto foi removido deste site; tudo o resto sobre a obra permanece inalterado.',
		'unpublished.readAt': 'Leia em',
		'colophon.title': 'Colof\u00e3o',
		'colophon.lede':
			'O que \u00e9 este site, de onde v\u00eam os seus textos e qual a nossa posi\u00e7\u00e3o quanto \u00e0 sua reprodu\u00e7\u00e3o.',
		'colophon.whatThisIs': 'O que \u00e9 isto',
		'colophon.whatThisIsBody':
			'O Depositum \u00e9 um site de leitura das Escrituras, do Catecismo, do Compêndio e dos documentos do Magist\u00e9rio, em portugu\u00eas e em ingl\u00eas. Existe para ser lido, e nada mais lhe \u00e9 pedido para o ler:',
		'colophon.pointFree': 'Gratuito, e sempre gratuito.',
		'colophon.pointNoAds': 'Sem publicidade nem qualquer conte\u00fado patrocinado.',
		'colophon.pointNoAccounts': 'Sem contas. Nada para registar, nada para iniciar sess\u00e3o.',
		'colophon.pointNoTracking':
			'Sem an\u00e1lises de tr\u00e1fego e sem scripts de terceiros. Nada aqui relata a sua leitura.',
		'colophon.pointOffline':
			'Funciona sem liga\u00e7\u00e3o depois da primeira visita, para que uma liga\u00e7\u00e3o fraca n\u00e3o impe\u00e7a a leitura.',
		'colophon.textsTitle': 'Os textos',
		'colophon.textsBody':
			'Cada texto \u00e9 reproduzido na \u00edntegra e sem altera\u00e7\u00f5es a partir de uma fonte identificada, e cada obra indica a sua edi\u00e7\u00e3o, a p\u00e1gina de origem e a data em que foi obtida. As Escrituras usam tradu\u00e7\u00f5es de dom\u00ednio p\u00fablico. O Catecismo, o Compêndio e os documentos do Magist\u00e9rio s\u00e3o reproduzidos a partir dos textos publicados pela Santa S\u00e9.',
		'colophon.countBible': 'edi\u00e7\u00f5es b\u00edblicas',
		'colophon.countDocuments': 'documentos do Magist\u00e9rio',
		'colophon.copyrightTitle': 'Direitos de autor',
		'colophon.copyrightBody1':
			'O Catecismo, o Compêndio e os documentos do Magist\u00e9rio pertencem aos seus titulares de direitos \u2014 principalmente a Libreria Editrice Vaticana e o Dicast\u00e9rio para a Comunica\u00e7\u00e3o. Reproduzimo-los aqui sem ter pedido autoriza\u00e7\u00e3o pr\u00e9via. Dizemo-lo com clareza em vez de o deixar por descobrir: \u00e9 uma escolha deliberada, n\u00e3o um descuido.',
		'colophon.copyrightBody2':
			'Fazemos essa escolha porque estes textos s\u00e3o o ensino da Igreja, dirigido a todos, e porque a preocupa\u00e7\u00e3o manifestada pelos titulares de direitos \u00e9 a integridade do texto. Por isso o texto nunca \u00e9 abreviado, nunca parafraseado, nunca editado e nunca colocado junto a publicidade. Cada obra apresenta o aviso de direitos do seu titular, nas palavras dele, e liga \u00e0 p\u00e1gina de onde foi retirada.',
		'colophon.copyrightBody3':
			'Se detiver direitos sobre algum texto aqui presente e preferir que n\u00e3o seja publicado, escreva-nos e retiramo-lo prontamente. Sem discuss\u00e3o, e sem necessidade de envolver mais ningu\u00e9m.',
		'colophon.contactTitle': 'Contacto',
		'colophon.contactBody': 'Para qualquer assunto, incluindo o acima:',
		'colophon.contactPending':
			'Ainda n\u00e3o foi definido um endere\u00e7o de contacto. Este site n\u00e3o deve ser tornado p\u00fablico enquanto n\u00e3o o tiver \u2014 o compromisso acima n\u00e3o tem sentido sem uma forma de nos contactar.',
		'colophon.buildTitle': 'Como \u00e9 feito',
		'colophon.buildBody':
			'Os textos s\u00e3o recolhidos das suas fontes publicadas, analisados para um corpus estruturado e apresentados como p\u00e1ginas est\u00e1ticas. As corre\u00e7\u00f5es a defeitos das fontes s\u00e3o registadas uma a uma, com a reda\u00e7\u00e3o original, a corrigida e o motivo \u2014 nenhum texto \u00e9 alterado em sil\u00eancio.',
		'bible.citedInCcc': 'Citado no Catecismo',
		'bible.wholeChapter': 'Este capítulo',
		'bible.verseNotInEdition': 'Este número de versículo não existe nesta edição',
		'bible.verseAbbrev': 'v.',
		'ccc.readFullChapter': 'Ler o capítulo completo',
		'ccc.showSubsections': 'Mostrar subsecções',
		'ccc.hideSubsections': 'Ocultar subsecções',
		'ccc.noParagraphNumber': 'Sem número de parágrafo neste corpus',
		'copyright.sourceTitle': 'Abrir a página de origem',
		'lang.label': 'Idioma'
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
