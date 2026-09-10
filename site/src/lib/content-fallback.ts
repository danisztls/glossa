/**
 * Where a reader of one content language looks next, and nothing else.
 *
 * A LEAF MODULE BECAUSE THE BUILD HAS TO AGREE WITH IT. It lived in
 * `corpus.ts` until `sync-corpus.mjs` had to resolve, per language, which
 * edition of each work a reader of that language opens (the section-heading
 * shards) — and Node cannot import `corpus.ts`, which reaches
 * `import.meta.glob`. `lang-names.ts` was split out for the same reason:
 * a table a build script and the browser must not disagree about cannot live
 * where only the browser can read it.
 *
 * `corpus.ts` re-exports all three names, so nothing that reads them had to
 * move.
 */
// WITH THE EXTENSION, like `titles.ts`'s own imports and `route-manifest.ts`'s:
// `sync-corpus.mjs` reads this module under Node's type-stripping loader,
// which will not resolve an extensionless relative specifier. Vite resolves it
// either way, so tidying it away breaks the SYNC and not the site.
import { baseLang } from './lang-names.ts';

/**
 * The order a content language is fallen back to when the reader's own has no
 * edition of a work — one row per content language, most preferred first.
 *
 * ENGLISH THEN LATIN ENDS EVERY ROW, and that is the invariant, not a
 * default: English is the language more readers can read and the only one the
 * whole corpus exists in, and Latin is the normative text and always complete
 * where it exists, so a chain that ends in the two of them can always answer.
 * A row that dropped them would strand its readers on whatever
 * `defaultWorkId` shows last-resort. `fallbackTailIsEnglishThenLatin` in the
 * tests asserts it of every row.
 *
 * IT WAS ONE GLOBAL `['en', 'la']` UNTIL 2026-08-26, which stated where a
 * reader ends up and nothing about where they should look first. Every work
 * type used to have an edition in both interface languages, so the question
 * never arose — `defaultWorkId` took "the first edition" and the answer
 * happened to be English because `en` sorts before `la` and `pt`. The Summa
 * broke that (EN + LA, no Portuguese before 2055, docs/decisions.md §Scope)
 * and the Catechism's eight editions made it routine: most readers here now
 * have a language the corpus reaches for some works and not others.
 *
 * WHAT A ROW IS FOR is the reader who cannot have their own language on this
 * address and would rather have a near one than a far one:
 *
 *   - `mg: ['fr', …]` is the row this table was written for. French is
 *     co-official in Madagascar and the language the Church there works in
 *     alongside Malagasy; sending a Malagasy reader to English first was
 *     wrong on the ground, and `mg` has exactly one work (the Catechism), so
 *     it is a reader who falls back constantly.
 *   - `la: ['it', …]` for the same kind of reason pointing the other way:
 *     Italian is the closest living language to the Latin the reader chose
 *     and the Holy See's own working language.
 *   - `es: ['pt', …]` and `pt: ['es', …]`, which is where the fallback buys
 *     the most: Portuguese carries 112 works to Spanish's three, and the two
 *     are close enough to read across.
 *   - `ar: ['fr', …]` and `hu: ['de', …]`: the second language those readers
 *     are likeliest to already have.
 *   - `sk: ['cs', …]`, added 2026-08-31 and the `mg` case again in a different
 *     family. Slovak has ONE work in the corpus, so a Slovak reader falls back
 *     on nearly every address; Czech has fifteen, and Czech is the one
 *     language in Europe a Slovak reader can be assumed to read without
 *     having learned it — a shared state until 1993, and Czech has stayed the
 *     dominant publishing and dubbing language in Slovakia since. The
 *     comprehension is famously ASYMMETRIC, which is why the reverse row does
 *     not exist: Czech readers under forty follow Slovak markedly less well
 *     than the other way round, and `cs: ['sk', …]` would move exactly one
 *     document out of English for them.
 *   - `be: ['pl', …]`, and it is the row here chosen AGAINST the closer
 *     language rather than for it. Byelorussian and Russian are nearly
 *     mutually intelligible and Belarus is thoroughly Russophone, so `ru`
 *     is what a reader-in-general would want — but it moves TWO works out
 *     of English, because Russian's ten are almost a subset of
 *     Byelorussian's thirty-one. Polish moves twenty-eight, and the
 *     readership this table is about is Belarusian CATHOLICS, whose church
 *     is historically and demographically Polish-facing: the Latin-rite
 *     population concentrates around Grodno, and Polish has been its
 *     catechetical language for centuries. A row that buys two documents is
 *     not a claim about a readership, it is a rounding error with an
 *     opinion attached.
 *
 * ONE NEIGHBOUR PER ROW AT MOST, deliberately. A longer row reads as a
 * ranking of languages by how close they are, which is an argument nobody
 * wins and which the corpus cannot settle; one neighbour is a claim about a
 * specific readership, and each of the six above is defensible on its own.
 * The rows that name none are not gaps — a German, Polish, Slovenian,
 * Swedish or Russian reader who cannot have their own language is better
 * served by English than by a language they are being guessed into.
 *
 * SIZE IS A TIEBREAKER AND NEVER THE CRITERION, which is worth stating
 * because the measurement invites the opposite. Ranking every language by how
 * many works a row would move out of English recommends Italian to everybody
 * — it is the second-largest corpus here, so it "wins" for Dutch, Danish,
 * Croatian, Finnish and Hebrew alike, none of whose readers read it. The
 * readership question is asked first and the count only chooses among the
 * languages that survive it. Measured 2026-08-31, the rows move 19, 33,
 * 53, 134, 110, 90, 45, 15 and 28 works respectively; `it: ['es', …]` moves two,
 * and is kept because an Italian reader has 240 works and the row is a
 * rounding error either way.
 *
 * NO ROW UNLOCKS ANYTHING, WHICH IS WHAT MAKES THE READERSHIP TEST DECISIVE.
 * Measured across every candidate weighed on 2026-08-31: not one work a
 * neighbour holds is absent from English or Latin, so a row never decides
 * whether a reader can reach an address — only which language they meet it
 * in. There is no access benefit to weigh against guessing a readership
 * wrong, and that asymmetry is why the bar for a row is a claim someone can
 * defend rather than a number that looks large.
 *
 * NINE CONTENT LANGUAGES DELIBERATELY HAVE NO ROW — `nl`, `da`, `cs`, `hr`,
 * `fi`, `lv`, `sw`, `vi`, `he` and the eight reach languages beside them.
 * Three near-misses are worth recording so they are not re-proposed:
 *
 *   - `da: ['sv', …]` and `fi: ['sv', …]`. Written Danish and Swedish are
 *     close, and Swedish is co-official in Finland. Both fail on the same
 *     fact: Danish and Finnish readers' English is stronger than their
 *     Swedish, and Swedish here is one work — the Compendium.
 *   - `uk: ['ru', …]` and `lv: ['ru', …]`. Both move real work out of English
 *     (10 and 9) and both unlock nothing, per the paragraph above. They are
 *     rejected for DIFFERENT reasons, and only one of them is about politics.
 *     Ukrainian Catholics are overwhelmingly the Greek Catholic Church, which
 *     the Soviet state liquidated in 1946 and forcibly absorbed into the
 *     Moscow Patriarchate until 1989; routing that readership's magisterium
 *     through Russian is not an awkward default but close to the inverse of
 *     what the row would mean. Latvian is the ordinary kind of near-miss:
 *     Latgale is both the Catholic region and the Russian-speaking one, so
 *     the row was true of readers over fifty and is getting less true every
 *     year — Russian left the schools entirely in 2025, Latvian is Baltic and
 *     shares no intelligibility with Russian at all, and `lv` already carries
 *     19 works of its own. A fallback row should encode a durable fact about
 *     a readership; this one has a direction and it points away.
 *   - `nl: ['de', …]`, `vi: ['fr', …]` and `sw: ['fr', …]` are the three that
 *     would also ELECT A DIFFERENT CATECHISM (see below). None survives the
 *     readership test: Dutch readers have the highest English proficiency
 *     measured anywhere, French among Vietnamese Catholics is generational,
 *     and Swahili's readership is split between anglophone East Africa and
 *     francophone Central Africa, so English serves the larger half.
 *
 * A ROW ALSO ELECTS THE CATECHISM, which is the cost that is easy to miss.
 * `ONE_EDITION_AUTOMATIC` fills the first edition in the chain that has one,
 * and `catechismPairLang` renders `/catechismus` in the first chain language
 * carrying either work — so `nl: ['de', …]` would not merely re-rank a
 * fallback, it would give every Dutch reader a German Catechism, downloaded
 * uninvited. Check a proposed row against `ccc.*` and `compendium.*` before
 * arguing it on readership alone: of the candidates weighed on 2026-08-31,
 * every one that changed the elected edition was also one the readership test
 * rejected, and that convergence is luck rather than a rule.
 *
 * KEYED ON CONTENT LANGUAGE (see `ContentLang` in types.ts) — all of them
 * interface languages since the superset flip, and most of them without a row.
 * An unlisted tag gets the tail alone, so a language ingested before its row
 * is written degrades to the old global behaviour rather than to nothing, and
 * `lt`, `sq`, `uk` and `hi` are deliberately left there: each is one work or
 * two, no neighbour of any of them passes the two tests above (Polish is not
 * intelligible to a Lithuanian reader, and Russian for `uk` is not this
 * project's call to make), and English is what the tail already says.
 */
export const CONTENT_LANG_FALLBACK: Readonly<Record<string, readonly string[]>> = {
	en: ['en', 'la'],
	pt: ['es', 'en', 'la'],
	la: ['it', 'en', 'la'],
	de: ['en', 'la'],
	es: ['pt', 'en', 'la'],
	fr: ['it', 'en', 'la'],
	it: ['es', 'en', 'la'],
	mg: ['fr', 'en', 'la'],
	pl: ['en', 'la'],
	ru: ['en', 'la'],
	ar: ['fr', 'en', 'la'],
	hu: ['de', 'en', 'la'],
	ro: ['it', 'en', 'la'],
	sl: ['en', 'la'],
	sv: ['en', 'la'],
	sk: ['cs', 'en', 'la'],
	be: ['pl', 'en', 'la'],
	// THE ONLY PAIR HERE THAT IS ONE LANGUAGE. Every other row names a
	// neighbour a reader can make something of; these two name each other,
	// and a reader of either can read the other with effort, because the
	// difference is the script and not the words. So the pair is mutual,
	// which no other row is — the asymmetry elsewhere is real (a Slovak
	// reader reads Czech far more easily than the reverse is assumed), and
	// here there is none to encode.
	//
	// It is also the cheapest neighbour in the table: `prayer.common.zh` and
	// `prayer.common.zht` are the whole of the corpus in either, so the
	// offline fill's per-language cost (see `contentLangChain` below) is one
	// prayer collection rather than a Compendium.
	zh: ['zht', 'en', 'la'],
	zht: ['zh', 'en', 'la']
};

/** The tail every row ends in, and what an unlisted language falls back to. */
export const CONTENT_LANG_FALLBACK_TAIL = ['en', 'la'] as const;

/**
 * Where a reader of `base` looks after their own language.
 *
 * A row names the reader's own language only where it is also part of
 * someone's tail (`en`, `la`); every caller puts the reader's own language
 * first anyway, so the repetition costs nothing and keeps every row ending
 * the same way.
 */
export function fallbackFor(base: string): readonly string[] {
	return CONTENT_LANG_FALLBACK[base] ?? CONTENT_LANG_FALLBACK_TAIL;
}

/**
 * A reader's content languages in preference order: their own, then their
 * row, deduped. `editionInLang` walks the same order one edition at a time,
 * so the two cannot disagree about what a reader's languages are.
 *
 * THE OFFLINE FILL TAKES THIS SAME CHAIN, and that is a decision with a
 * price. The download planner's three automatic waves fill per language (see
 * `AUTOMATIC_WAVES` in sw-policy.ts), so a neighbour row is not free there the
 * way it is when resolving one address: a reader whose row names a neighbour
 * pays ~290 KB raw of essentials for it — its Compendium, and its prayers
 * where it has them — before being asked. Nine of the fifteen rows name such
 * a neighbour.
 *
 * IT IS NOT ~3.3 MB, which is what this said until 2026-08-26 and which was
 * the Catechism's doing rather than the chain's. Eight editions made the
 * per-language figure a per-EDITION one, and `ONE_EDITION_AUTOMATIC` in
 * sw-policy.ts now takes exactly one — so the chain's own cost is the cheap
 * part again, which is what the argument below always assumed.
 *
 * IT IS WORTH THAT because the alternative fails in the one condition the
 * offline library exists for. A short download chain would leave a Romanian
 * reader routed to the Italian Catechism with no Italian Catechism on the
 * device — the fallback would stop working exactly when the network does,
 * which is when a reader most needs the address to resolve to something. A
 * reader's languages are one list, and a fallback nobody can read offline is
 * not a fallback.
 */
export function contentLangChain(lang: string): string[] {
	return [...new Set([lang, ...fallbackFor(baseLang(lang))])];
}
