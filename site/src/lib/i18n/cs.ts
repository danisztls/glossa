/**
 * Čeština UI strings.
 *
 * One module per interface language (see `../i18n.svelte.ts` for the store
 * that picks between them). Keys are the English module's, in its order;
 * anything left out falls back to English rather than showing the key.
 *
 * Added 2026-08-31, with the other content languages that had no interface.
 * The corpus holds 17 editions in Čeština and its readers were reading
 * them inside English chrome, which is the combination `../ui-langs.ts` says
 * the interface list should never leave standing.
 *
 * COMPLETE SINCE 2026-09-02, colophon included. The long colophon prose was
 * deliberately omitted when this file was written: a machine translation of the
 * page explaining how carefully this site handles other people's words would be
 * the one page whose form contradicts its content. That was reversed on the
 * judgement that a reader who cannot read the page cannot weigh it either, and
 * that an English wall is not more honest than a translation -- see
 * `docs/decisions.md`. IT HAS NOT BEEN READ BY A NATIVE SPEAKER.
 * `colophon.whatThisIsStanding` (the canonical standing statement, Can. 216
 * CIC) and `colophon.copyrightBody3` (how a rights holder reaches us) are the
 * two to check first: both are operative rather than descriptive. Deleting a
 * doubtful line is a valid fix -- it falls back to English.
 * Every key `CHROME_KEYS` requires is here, since an unnamed chrome page fails
 * the sync rather than falling back.
 *
 * The language names in `LanguageMenu.svelte` and `corpus.ts` are written in
 * their own language on purpose and are not translated here.
 */

import type { Dictionary } from '../i18n.svelte';

export const cs: Dictionary = {
	'nav.bible': 'Bible',
	'nav.ccc': 'Katechismus',
	'nav.compendium': 'Kompendium',
	'nav.magisterium': 'Učitelský úřad',
	'nav.socialDoctrine': 'Sociální nauka',
	'socialDoctrine.landing.title': 'Kompendium sociální nauky církve',
	'socialDoctrine.landing.tagline': 'Co církev učí o životě ve společnosti, v 583 číslech.',
	'nav.prayers': 'Modlitby',
	'nav.bookmarks': 'Záložky',
	'nav.menu': 'Nabídka',
	'nav.summa': 'Summa',
	'home.title': 'Glossa Catholica',
	'home.continueReading': 'Pokračovat ve čtení',
	'home.works': 'Knihovna',
	'home.ccc.heading': 'Katechismus a Kompendium',
	'home.magisterium.mostRecent': 'Nejnovější',
	'home.prayers.heading': 'Modlitby',
	'unitNav.previous': 'Předchozí',
	'unitNav.next': 'Další',
	'bible.landing.title': 'Bible',
	'bible.landing.tagline': 'Čtěte celou Bibli, knihu po knize, kapitolu po kapitole.',
	// All nine, because `bible-groups.test.ts` requires the set to be
	// complete in every interface language rather than partial: one
	// English heading among eight translated ones reads as a bug.
	'bible.group.pentateuch': 'Pentateuch',
	'bible.group.historical': 'Dějepisné knihy',
	'bible.group.wisdom': 'Mudroslovné knihy',
	'bible.group.prophetic': 'Prorocké knihy',
	'bible.group.gospels': 'Evangelia',
	'bible.group.acts': 'Skutky apoštolů',
	'bible.group.pauline': 'Pavlovy listy',
	'bible.group.catholicLetters': 'Katolické listy',
	'bible.group.revelation': 'Zjevení',
	'ccc.landing.title': 'Katechismus katolické církve',
	'ccc.landing.tagline':
		'<strong>Katechismus</strong> vykládá katolickou nauku ve 2 865 číslovaných odstavcích. <strong>Kompendium</strong> tutéž nauku podává jako 598 otázek a odpovědí podle téhož uspořádání.',
	'document.library.tagline':
		'Encykliky, koncilní konstituce, dekrety a deklarace učitelského úřadu církve.',
	'doctores.landing.title': 'Učitelé církve',
	'doctores.landing.tagline': 'Teologická díla církevních otců a učitelů církve.',
	'summa.landing.title': 'Teologická summa',
	'summa.landing.tagline': 'Tomáš Akvinský, anglicky a v latině, kterou psal.',
	'prayers.landing.title': 'Běžné modlitby',
	'prayers.landing.tagline': 'Modlitby s latinským textem vedle.',
	'colophon.title': 'Tiráž',
	'colophon.lede':
		'Co je tento web, odkud pocházejí jeho texty a jaký je náš postoj k jejich reprodukci.',
	'colophon.whatThisIs': 'Co to je',
	'colophon.whatThisIsBody':
		'Glossa Catholica je čtenářský web pro Písmo, Katechismus, Kompendium a dokumenty magisteria, v angličtině, portugalštině a latině. Existuje proto, aby byl čten, a k jeho čtení se od vás nežádá nic jiného:',
	'colophon.pointFree': 'Zdarma, a vždy zdarma. Žádná placená zeď, žádné předplatné, nic ke koupi.',
	'colophon.pointNoAds': 'Žádná reklama a žádné sponzorované umístění jakéhokoli druhu.',
	'colophon.pointNoAccounts': 'Žádné účty. Není se kam registrovat, není se kam přihlašovat.',
	'colophon.pointNoTracking':
		'Žádné sledovací skripty, žádný kód třetích stran, žádné cookies. Pouze anonymní počty použití, bez čehokoli, co by vás identifikovalo.',
	'colophon.pointOffline':
		'Vytvořeno tak, aby po první návštěvě fungovalo i bez připojení, aby špatné spojení nemuselo být překážkou ve čtení.',
	'colophon.whatThisIsStanding':
		'Glossa Catholica je soukromá iniciativa laických věřících. Nemá žádné církevní schválení a nemluví s žádnou vlastní autoritou.',
	'colophon.textsTitle': 'Texty',
	'colophon.textsBody':
		'Každý text pochází z uvedeného zdroje a každé dílo zaznamenává své vydání, svou zdrojovou stránku a datum, kdy byl získán. Písmo užívá překlady ve veřejném vlastnictví; Katechismus, Kompendium a dokumenty magisteria pocházejí z vlastních publikovaných textů Svatého stolce.',
	'colophon.textsFidelity':
		'Text není nikdy zkracován, nikdy parafrázován, nikdy přepisován a nikdy umisťován vedle reklamy. Zjevné vady opravujeme — vypadlé slovo, poškozenou citaci, značkování, které pohltilo odstavec — vždy směrem k tomu, co tiskne sám zdroj, nikdy směrem k tomu, co si myslíme, že by měl říkat.',
	'colophon.countBible': 'vydání Bible',
	'colophon.countDocuments': 'dokumentů magisteria',
	'colophon.copyrightTitle': 'Autorská práva',
	'colophon.copyrightBody1':
		'Katechismus, Kompendium a dokumenty magisteria jsou majetkem svých držitelů práv — především Libreria Editrice Vaticana a Dikasteria pro komunikaci.',
	'colophon.copyrightBody2':
		'Každé dílo zobrazuje vlastní výhradu autorských práv svého držitele, v jeho znění, a odkazuje na stránku, z níž bylo převzato.',
	'colophon.copyrightBody3':
		'Držíte-li práva k jakémukoli zdejšímu textu a byli byste raději, aby zveřejněn nebyl, napište nám.',
	'colophon.contactTitle': 'Kontakt',
	'colophon.contactBody': 'Pro cokoli, včetně výše uvedeného:',
	'colophon.contactPending':
		'Kontaktní adresa dosud nebyla nastavena. Tento web by neměl být zveřejněn, dokud ji nemá — závazek výše nemá smysl bez způsobu, jak nás zastihnout.',
	'colophon.illustrationsTitle': 'Ilustrace',
	'colophon.illustrationsBody':
		'Bible nese rytiny Gustava Dorého, každou umístěnou u verše, který zobrazuje — poslední a největší z jeho biblických cyklů, řezanou do dřeva podle jeho kreseb a tištěnou spolu s textem, nikoli shromážděnou vzadu.',
	'colophon.illustrationsRights':
		'Jsou ve veřejném vlastnictví, jak ukazují data níže, a věrná fotografická reprodukce rytiny ve veřejném vlastnictví nenese žádné nové vlastní autorské právo.',
	'colophon.countPlates': 'rytin',
	'colophon.countPlateChapters': 'ilustrovaných kapitol',
	'colophon.typeTitle': 'Písmo',
	'colophon.typeBody':
		'Sázeno písmem EB Garamond, obnovou Georga Duffnera a Octavia Parda typů, které Claude Garamont řezal v 90. letech 16. století — humanistické tradice, v níž Církev tiskne od renesance. Jeho cyrilice je od týchž rukou, ale neobnovuje nic: žádná garamondovská cyrilice nebyla nikdy řezána, takže ruština je sázena tvarem nakresleným tak, aby stál vedle ostatních.',
	'colophon.typeArabic':
		'Arabština je zcela mimo jeho dosah a je sázena písmem Amiri — obnovou Khaleda Hosnyho naschí řezaného pro tiskárnu Búláq v Káhiře roku 1905, zvolenou ze stejné úvahy jako textové písmo: konkrétní historické knižní písmo spíše než současná kresba.',
	'colophon.typeInitials':
		'Úvodní iniciály jsou Pirata One, lomené písmo, jehož verzálky zůstávají čitelné ve velikosti, kterou iniciála vyžaduje, a — pro ruštinu — Ponomar, který reprodukuje církevněslovanské písmo Synodální tiskárny. Ponomar sází iniciálu a nikdy text: moderní encyklika vysázená celá synodálním písmem by říkala něco nepravdivého o tom, čím je. Všechna jsou licencována pod SIL Open Font License a poskytována z tohoto webu, nikoli od třetí strany, takže čtení stránky nežádá nic po cizím serveru.'
};
