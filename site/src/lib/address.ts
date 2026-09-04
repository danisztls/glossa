/**
 * A place in the corpus, and the one grammar that writes it as a URL and
 * reads it back.
 *
 * WHY ONE MODULE. "A place in the corpus" used to be four near-identical
 * discriminated unions -- one in the reference grammar, one for the hover
 * preview, one for bookmarks, plus `route-manifest.ts`'s own path splitting --
 * with the href string as the interchange format between them. Every one of
 * them had to be taught the same shape when the Summa arrived, and the edge
 * worker's idea of a valid address was a different piece of code from the one
 * that had written the link. `Address` is that shape, `hrefFor` is the only
 * place a canonical reference URL is written, and `parseHref` is the only
 * place one is read.
 *
 * IMPORTS NOTHING, deliberately and permanently. `route-manifest.ts`
 * re-exports the Summa part table from here and is loaded by `src/worker.ts`
 * at the Cloudflare edge and by `scripts/sync-corpus.mjs` under plain Node --
 * neither of which has a bundler, a DOM, or the corpus. This is the same
 * arrangement `refs-grammar.ts` already has with `refs.ts`: the grammar half
 * runs anywhere, the corpus-bound half does not.
 *
 * WHY PARSING IS REGEXES AND NOT A REPLAY OF HOW THE LINK WAS BUILT:
 * `parseHref` does not reconstruct a reference, it reads an address that has
 * already been written. `refs.ts` canonicalises chapter/verse numbers into
 * this corpus's Vulgate address space *before* the href exists (see
 * `resolveVulgate`), so a URL's numbers ARE the Vulgate numbers. Feeding them
 * through `versification.ts` a second time would risk double-converting a
 * chapter that only needed shifting once -- which is why nothing here imports
 * it.
 *
 * TOLERANT, NOT STRICT. An address this site never generates (a negative
 * chapter, a malformed query, a hand-edited URL) degrades to `undefined`
 * rather than throwing: every caller treats that as "not a place", which is
 * a bookmark the library quietly omits, a link with no hover preview, or a
 * 404 from the edge -- never an error a reader sees.
 */

export type Address =
	| {
			kind: 'bible';
			osis: string;
			chapter: number;
			/** The cited extent, set together. `from === to` is a single verse;
			 *  both absent is a bare chapter link, which names the chapter's
			 *  opening rather than a cited passage. */
			from?: number;
			to?: number;
			/** The verse to scroll to, when it is NOT the extent's start.
			 *
			 *  A citation's verse list arrives from range expansion AND from
			 *  comma lists, so "Jn 1:7,1,4" spans verses 1-7 but is *about*
			 *  verse 7 -- `refHref` has always emitted `?v=1-7#v7` for it. The
			 *  extent and the landing place are genuinely two facts, and this is
			 *  the only field that can hold the second. Absent in the ordinary
			 *  case, where they coincide. */
			anchor?: number;
	  }
	| { kind: 'ccc'; n: number }
	| { kind: 'cccChapter'; n: number }
	| { kind: 'compendium'; n: number }
	| { kind: 'compendiumChapter'; n: number }
	/** A paragraph of the Compendium of the Social Doctrine of the Church,
	 *  or one of its chapters by the paragraph it opens at. Addressed per
	 *  paragraph rather than as one page with fragments — the way the
	 *  Catechism is and unlike a document — because that is how the work is
	 *  cited: "CSDC 160" names a paragraph. */
	| { kind: 'socialDoctrine'; n: number }
	| { kind: 'socialDoctrineChapter'; n: number }
	/** A canon of the Code of Canon Law, or one of its reading units by the
	 *  canon it opens at. Addressed per canon for the same reason the
	 *  Compendium of the Social Doctrine is addressed per paragraph: "CIC
	 *  can. 216" names a canon, wherever it is printed. The unit is a TITLE
	 *  of the Code and not a book or a chapter — see `canonLawUnitStarts` in
	 *  `scripts/sync-corpus.mjs`. */
	| { kind: 'canonLaw'; n: number }
	| { kind: 'canonLawTitle'; n: number }
	/** A document, or one numbered section of it. `n` absent is the whole
	 *  document: a section is a FRAGMENT on the document's single page
	 *  (`#s{n}`), not a page of its own -- `documents/[slug]/[n]` was retired
	 *  2026-08-17 (site/docs/shell.md; 9,315 prerendered files for one section
	 *  of text each). */
	| { kind: 'document'; slug: string; n?: number }
	/** A Summa question, or one article of it (`#a3`). Articles are fragments
	 *  for the same reason document sections are, following that same 2026-08-17
	 *  decision rather than minting 3,113 addresses for one article each.
	 *  `part` is the URL slug (`i`, `i-ii`, ...), not the work's own spelling
	 *  of it -- see `summaPartSlug`. */
	| { kind: 'summa'; part: string; question: number; article: number | null }
	| { kind: 'prayer'; slug: string };

/**
 * The Summa's parts, as they appear in a URL.
 *
 * Lower-cased Roman, which is what the work's own citations already use
 * (`STh I-II, 79, 1`) and therefore the least surprising thing to see in an
 * address. It lives in the module that imports nothing because
 * `scripts/sync-corpus.mjs` needs the same mapping to lay out the content
 * files and the worker needs it to validate an address.
 */
const SUMMA_PART_SLUGS: Record<string, string> = {
	I: 'i',
	'I-II': 'i-ii',
	'II-II': 'ii-ii',
	III: 'iii',
	Suppl: 'suppl'
};

export function summaPartSlug(part: string): string {
	const slug = SUMMA_PART_SLUGS[part];
	if (!slug) throw new Error(`unknown Summa part ${JSON.stringify(part)}`);
	return slug;
}

/** The inverse of `summaPartSlug`; `undefined` for anything not a part. */
export function summaPartFromSlug(slug: string): string | undefined {
	return Object.keys(SUMMA_PART_SLUGS).find((part) => SUMMA_PART_SLUGS[part] === slug);
}

/**
 * The Bible's books, as they appear in a URL: OSIS id -> Latin slug.
 *
 * A reader URL is edition-free and Latin, and the book segment was the one
 * part of it that was neither -- `/scriptura/rev/22` addressed the Apocalypse
 * by an English-derived interchange id on a site whose every other path
 * segment is Latin. This table is the same arrangement `SUMMA_PART_SLUGS`
 * above already has, and for the same reason: the corpus keys everything on
 * the OSIS id (content file paths, `corpus-routes.json`, the apparatus, the
 * cross-reference index), so the Latin spelling is converted at the address
 * boundary and nowhere else. `parseHref` still hands back an `osis`.
 *
 * DERIVED, NOT INVENTED. Every name is `bible.clementina.la`'s own -- the
 * Latin edition in the corpus carries a `name` for each of its 73 books -- with
 * `ae` for `æ`, spaces hyphenated, and `J` folded to `I`. The fold is the one
 * departure, and it is one internal authority against another: the Clementine
 * prints `Joannes` and `Josue`, while `BOOK_VARIANTS_LA` in `refs-grammar.ts`
 * -- the citation table, corroborated against the Latin Catechism's own printed
 * sigla -- reads `Io` and `Ios` throughout. The checked table wins.
 *
 * So a name judged wrong here is a CORPUS defect and is fixed in
 * `pipeline/corrections/`, not by hand-editing this table: the URL says what
 * the Latin book list on the page says, which is the whole point of it.
 */
const BIBLE_BOOK_SLUGS: Record<string, string> = {
	// pentateuch
	gen: 'genesis',
	exod: 'exodus',
	lev: 'leviticus',
	num: 'numeri',
	deut: 'deuteronomium',
	// historical
	josh: 'iosue',
	judg: 'iudices',
	ruth: 'ruth',
	'1sam': 'i-samuel',
	'2sam': 'ii-samuel',
	'1kgs': 'i-reges',
	'2kgs': 'ii-reges',
	'1chr': 'i-paralipomenon',
	'2chr': 'ii-paralipomenon',
	ezra: 'esdras',
	neh: 'nehemias',
	tob: 'tobias',
	jdt: 'iudith',
	esth: 'esther',
	'1macc': 'i-machabaeus',
	'2macc': 'ii-machabaeus',
	// wisdom
	job: 'iob',
	ps: 'psalmi',
	prov: 'proverbia',
	eccl: 'ecclesiastes',
	song: 'canticum-canticorum',
	wis: 'sapientia',
	sir: 'ecclesiasticus',
	// prophetic
	isa: 'isaias',
	jer: 'ieremias',
	lam: 'lamentationes',
	bar: 'baruch',
	ezek: 'ezechiel',
	dan: 'daniel',
	hos: 'osee',
	joel: 'ioel',
	amos: 'amos',
	obad: 'abdias',
	jonah: 'ionas',
	mic: 'michaeas',
	nah: 'nahum',
	hab: 'habacuc',
	zeph: 'sophonias',
	hag: 'aggaeus',
	zech: 'zacharias',
	mal: 'malachias',
	// gospels
	matt: 'matthaeus',
	mark: 'marcus',
	luke: 'lucas',
	john: 'ioannes',
	// acts
	acts: 'actus-apostolorum',
	// pauline
	rom: 'romani',
	'1cor': 'i-corinthii',
	'2cor': 'ii-corinthii',
	gal: 'galatae',
	eph: 'ephesii',
	phil: 'philippenses',
	col: 'colossenses',
	'1thess': 'i-thessalonicenses',
	'2thess': 'ii-thessalonicenses',
	'1tim': 'i-timotheus',
	'2tim': 'ii-timotheus',
	titus: 'titus',
	phlm: 'philemon',
	heb: 'hebraei',
	// catholicLetters
	jas: 'iacobus',
	'1pet': 'i-petrus',
	'2pet': 'ii-petrus',
	'1john': 'i-ioannes',
	'2john': 'ii-ioannes',
	'3john': 'iii-ioannes',
	jude: 'iudas',
	// revelation
	rev: 'apocalypsis'
};

/** Lazily inverted, because `bookFromSlug` runs on every address the edge
 *  worker validates and a 73-key linear scan per request is not free. */
let BIBLE_SLUG_TO_OSIS: Record<string, string> | undefined;

export function bookSlug(osis: string): string {
	const slug = BIBLE_BOOK_SLUGS[osis];
	if (!slug) throw new Error(`unknown Bible book ${JSON.stringify(osis)}`);
	return slug;
}

/** The inverse of `bookSlug`; `undefined` for anything not a book. */
export function bookFromSlug(slug: string): string | undefined {
	if (!BIBLE_SLUG_TO_OSIS) {
		BIBLE_SLUG_TO_OSIS = {};
		for (const [osis, s] of Object.entries(BIBLE_BOOK_SLUGS)) BIBLE_SLUG_TO_OSIS[s] = osis;
	}
	return BIBLE_SLUG_TO_OSIS[slug];
}

/**
 * The OSIS spelling a URL used before the Latin slugs (2026-09-02).
 *
 * The ONLY reader of the old vocabulary, and it is deliberately not part of
 * the grammar: `parseHref` and `isCanonicalPath` know Latin and nothing else,
 * so `/scriptura/josh/1` is not an address by any reading. What consumes this
 * is the edge's 301 and the one-shot bookmark migration -- both of which run
 * BEFORE the grammar, which is what keeps "there is no compatibility layer"
 * true of the addresses themselves.
 */
export function bookFromLegacySlug(slug: string): string | undefined {
	return slug in BIBLE_BOOK_SLUGS ? slug : undefined;
}

/**
 * The id of a pontificate's section on `/documenta`, from the manifest's
 * `pontiff_or_council` string ("Leo XIII" -> `pontiff-leo-xiii`).
 *
 * NOT AN `Address`, and it is here anyway. It addresses nothing in the
 * corpus — a pontificate is a grouping the library page invents, not a work
 * or a unit — so it gets no `kind` and `parseHref` never reads it. What puts
 * it in this module is the rule the module exists to enforce: it is written
 * in one place (`/documenta`, as the `id` on the group's `<details>` and in
 * its sidebar) and read in another (the home page's Magisterium list, which
 * links into that group), and a fragment written by two functions that
 * merely agree today is the same defect `Address` was made to end. The
 * pontiff string both sides pass comes from the same manifest field, so the
 * derivation is all that has to hold.
 *
 * Diacritics are folded and everything that is not a letter or a digit
 * becomes a hyphen, which keeps a Roman numeral ("Pius XI") and a name with
 * an accent ("François") in the ASCII an `id` is safest as.
 */
export function pontiffAnchor(pontiff: string): string {
	return `pontiff-${pontiff
		.normalize('NFD')
		.replace(/\p{Diacritic}/gu, '')
		.toLowerCase()
		.replace(/[^\p{Letter}\p{Number}]+/gu, '-')
		.replace(/^-|-$/g, '')}`;
}

/** The canonical URL for an address. The only place one is written. */
export function hrefFor(a: Address): string {
	switch (a.kind) {
		case 'bible': {
			// The extent goes in the QUERY and the scroll target stays in the
			// hash rather than inventing a `#v1-7` fragment: `#v1` remains a real
			// id on a real element, so browsers scroll natively with no
			// JavaScript. Only emitted when the range spans more than one verse
			// -- a single-verse citation is fully described by its anchor.
			const span = a.from !== undefined && a.to !== undefined && a.to > a.from;
			const query = span ? `?v=${a.from}-${a.to}` : '';
			const hash = a.from !== undefined ? `#v${a.anchor ?? a.from}` : '';
			// Edition-free (site/docs/addresses.md, which the Bible now follows
			// too): which edition renders here is the reader's standing
			// preference, never the link's to decide.
			return `/scriptura/${bookSlug(a.osis)}/${a.chapter}${query}${hash}`;
		}
		case 'ccc':
			return `/catechismus/${a.n}`;
		case 'cccChapter':
			return `/catechismus/caput/${a.n}`;
		// Nested under the Catechism because that is what the work is: the
		// *Compendium Catechismi Catholicae Ecclesiae*, 598 questions over the
		// same outline the Catechism prints at length (`toc-pairing.ts`). It
		// was `/compendium/{n}` until 2026-08-28; there is no compatibility
		// layer, so the old address is now invalid like every other retired
		// one (site/docs/addresses.md).
		case 'compendium':
			return `/catechismus/compendium/${a.n}`;
		case 'compendiumChapter':
			return `/catechismus/compendium/caput/${a.n}`;
		// `doctrina socialis` is the work's own Latin name for its subject, and
		// the shelf is the work: nothing else in the corpus belongs under it
		// today, and a second social-teaching compendium would be an edition
		// of this one rather than a peer. Unnested for that reason — the
		// Compendium of the Catechism sits under `/catechismus` because the
		// Catechism it condenses is there to sit under.
		case 'socialDoctrine':
			return `/doctrina-socialis/${a.n}`;
		case 'socialDoctrineChapter':
			return `/doctrina-socialis/caput/${a.n}`;
		// `ius canonicum` is the Latin for the subject, and the shelf is the
		// work, on `doctrina-socialis`' reasoning: the Code is the only canon
		// law this corpus holds, and the Eastern Code would be a peer under
		// the same shelf rather than a reason to nest this one. `titulus` is
		// the Code's own word for the division a reader reads through.
		case 'canonLaw':
			return `/ius-canonicum/${a.n}`;
		case 'canonLawTitle':
			return `/ius-canonicum/titulus/${a.n}`;
		case 'document':
			return a.n === undefined ? `/documenta/${a.slug}` : `/documenta/${a.slug}#s${a.n}`;
		// Nested under `/doctores`, the shelf for the Fathers and Doctors of the
		// Church, because a work by one theologian is not a peer of Scripture,
		// the Catechism or the Magisterium — see site/docs/addresses.md
		// and editions. It was `/summa/{part}/{question}` until 2026-08-28, and
		// there is no compatibility layer, exactly as with `/compendium/{n}`.
		case 'summa': {
			const base = `/doctores/summa/${a.part}/${a.question}`;
			return a.article === null ? base : `${base}#a${a.article}`;
		}
		case 'prayer':
			return `/preces/${a.slug}`;
	}
}

// A fixed, obviously-fake origin: `URL`'s relative-reference constructor needs
// *some* absolute base to resolve against, and its value is never read below
// except to detect that an href resolved to a DIFFERENT origin (i.e. was
// itself absolute, and thus external -- `https://vatican.va/...` parses fine
// against this base but keeps its own origin, which is exactly the signal used
// to reject it).
const INTERNAL_BASE = 'https://glossa.internal.invalid';

// `[a-z-]`, with no digits: every Latin slug spells its number as a lower-cased
// Roman numeral (`i-samuel`), so dropping `0-9` makes the OSIS spelling fail the
// grammar outright rather than half-matching it. The two vocabularies cannot blur.
const BIBLE_RE = /^\/scriptura\/([a-z-]+)\/(\d+)$/;
const CCC_CHAPTER_RE = /^\/catechismus\/caput\/(\d+)$/;
const CCC_RE = /^\/catechismus\/(\d+)$/;
// Both are anchored, so neither can be reached by CCC_RE (which admits only
// digits after `/catechismus/`) and the order these are tried in is free.
const COMPENDIUM_CHAPTER_RE = /^\/catechismus\/compendium\/caput\/(\d+)$/;
const COMPENDIUM_RE = /^\/catechismus\/compendium\/(\d+)$/;
// Anchored like the Compendium's pair above, so the order they are tried in
// is free.
const SOCIAL_DOCTRINE_CHAPTER_RE = /^\/doctrina-socialis\/caput\/(\d+)$/;
const SOCIAL_DOCTRINE_RE = /^\/doctrina-socialis\/(\d+)$/;
const CANON_LAW_TITLE_RE = /^\/ius-canonicum\/titulus\/(\d+)$/;
const CANON_LAW_RE = /^\/ius-canonicum\/(\d+)$/;
const DOCUMENT_RE = /^\/documenta\/([a-z0-9-]+)$/;
const PRAYER_RE = /^\/preces\/([a-z0-9-]+)$/;
const SUMMA_RE = /^\/doctores\/summa\/([a-z-]+)\/(\d+)$/;
const ARTICLE_ANCHOR_RE = /^#a(\d+)$/;
const SECTION_ANCHOR_RE = /^#s(\d+)$/;
const VERSE_SPAN_RE = /^(\d+)-(\d+)$/;
const VERSE_ANCHOR_RE = /^#v(\d+)$/;

/**
 * A number in its one canonical spelling, or `undefined`.
 *
 * Reader routes have never emitted leading zeroes. Rejecting them here means
 * one resource has one canonical spelling, rather than making
 * /catechismus/01234 and /catechismus/1234 indistinguishable cache keys.
 *
 * `min` is 0 for a Bible chapter and 1 everywhere else: `/scriptura/{book}/0`
 * is a book's introduction (docs/corpus-schema.md §Book introductions), which
 * fits the numbering the reader already knows because no book has a chapter 0
 * to collide with. `00` and `01` stay rejected either way. Whether any given
 * `/scriptura/{book}/0` is real is still decided by the route manifest, not
 * here: only books with an introduction carry a 0.
 */
function canonicalNumber(segment: string, min: 0 | 1): number | undefined {
	if (!/^(0|[1-9]\d*)$/.test(segment)) return undefined;
	const value = Number(segment);
	if (!Number.isSafeInteger(value) || value < min) return undefined;
	return value;
}

/**
 * Read an address out of an href, or `undefined` for anything that is not one
 * -- nav chrome, an external URL, a legacy English path (`/ccc/1`,
 * `/prayers/x`, deliberately invalid site-wide -- docs/decisions.md
 * §Addresses and editions), a retired shape (`/compendium/39`, which moved
 * under `/catechismus/` on 2026-08-28), or a stored value from a future
 * version of this grammar.
 *
 * `undefined` is always "not a place", never an error; see the module
 * docblock.
 */
export function parseHref(href: string | null | undefined): Address | undefined {
	if (!href) return undefined;

	let url: URL;
	try {
		url = new URL(href, INTERNAL_BASE);
	} catch {
		return undefined;
	}
	if (url.origin !== INTERNAL_BASE) return undefined; // absolute -> external, or a scheme we don't address (mailto:, ...)

	const path = url.pathname;

	const bible = BIBLE_RE.exec(path);
	if (bible) {
		const chapter = canonicalNumber(bible[2], 0);
		if (chapter === undefined) return undefined;
		const osis = bookFromSlug(bible[1]);
		if (osis === undefined) return undefined;

		const anchorMatch = VERSE_ANCHOR_RE.exec(url.hash);
		const anchorVerse = anchorMatch ? canonicalNumber(anchorMatch[1], 1) : undefined;

		// `?v=` names the WHOLE cited extent and takes priority over the anchor,
		// which only ever names one verse of it. A hand-edited URL may disagree
		// with itself; the span is the more informative of the two, so it wins
		// rather than the parser picking whichever happens to be checked first.
		const span = VERSE_SPAN_RE.exec(url.searchParams.get('v') ?? '');
		if (span) {
			const from = canonicalNumber(span[1], 1);
			const to = canonicalNumber(span[2], 1);
			if (from !== undefined && to !== undefined && to > from) {
				return anchorVerse !== undefined && anchorVerse !== from
					? { kind: 'bible', osis, chapter, from, to, anchor: anchorVerse }
					: { kind: 'bible', osis, chapter, from, to };
			}
		}

		// No usable span: a lone anchor is a single-verse extent.
		if (anchorVerse !== undefined) {
			return { kind: 'bible', osis, chapter, from: anchorVerse, to: anchorVerse };
		}
		return { kind: 'bible', osis, chapter };
	}

	const cccChapter = CCC_CHAPTER_RE.exec(path);
	if (cccChapter) return numbered('cccChapter', cccChapter[1]);

	const ccc = CCC_RE.exec(path);
	if (ccc) return numbered('ccc', ccc[1]);

	const compendiumChapter = COMPENDIUM_CHAPTER_RE.exec(path);
	if (compendiumChapter) return numbered('compendiumChapter', compendiumChapter[1]);

	const compendium = COMPENDIUM_RE.exec(path);
	if (compendium) return numbered('compendium', compendium[1]);

	const socialDoctrineChapter = SOCIAL_DOCTRINE_CHAPTER_RE.exec(path);
	if (socialDoctrineChapter) return numbered('socialDoctrineChapter', socialDoctrineChapter[1]);

	const socialDoctrine = SOCIAL_DOCTRINE_RE.exec(path);
	if (socialDoctrine) return numbered('socialDoctrine', socialDoctrine[1]);

	// The unit before the canon, like the chapter before the paragraph above:
	// `/ius-canonicum/titulus/7` must not be read as canon `titulus`.
	const canonLawTitle = CANON_LAW_TITLE_RE.exec(path);
	if (canonLawTitle) return numbered('canonLawTitle', canonLawTitle[1]);

	const canonLaw = CANON_LAW_RE.exec(path);
	if (canonLaw) return numbered('canonLaw', canonLaw[1]);

	const document = DOCUMENT_RE.exec(path);
	if (document) {
		const anchor = SECTION_ANCHOR_RE.exec(url.hash);
		const n = anchor ? canonicalNumber(anchor[1], 1) : undefined;
		return { kind: 'document', slug: document[1], ...(n !== undefined ? { n } : {}) };
	}

	const prayer = PRAYER_RE.exec(path);
	if (prayer) return { kind: 'prayer', slug: prayer[1] };

	const summa = SUMMA_RE.exec(path);
	if (summa) {
		const question = canonicalNumber(summa[2], 1);
		if (question === undefined) return undefined;
		// The part slug is NOT checked against `SUMMA_PART_SLUGS` here. A slug
		// that names no part is an address that resolves to nothing, which every
		// caller already handles the same way it handles a question number the
		// corpus doesn't carry -- the route manifest decides existence, this
		// decides shape.
		const article = ARTICLE_ANCHOR_RE.exec(url.hash);
		const n = article ? canonicalNumber(article[1], 1) : undefined;
		return { kind: 'summa', part: summa[1], question, article: n ?? null };
	}

	return undefined;
}

function numbered(
	kind:
		| 'ccc'
		| 'cccChapter'
		| 'compendium'
		| 'compendiumChapter'
		| 'socialDoctrine'
		| 'socialDoctrineChapter'
		| 'canonLaw'
		| 'canonLawTitle',
	segment: string
): Address | undefined {
	const n = canonicalNumber(segment, 1);
	return n === undefined ? undefined : { kind, n };
}

/**
 * An address the hover preview can show: everything except a whole prayer and
 * a whole document.
 *
 * Both exclusions are the same rule -- an unanchored link is navigation, not a
 * quotable unit. `/documenta/{slug}` opens an entire encyclical, and prayers
 * have no inline link surface at all; teaching either one to `PreviewTarget`
 * would silently give every prayer link on the site a popover it does not have
 * today.
 *
 * A Summa QUESTION is deliberately not excluded even though it, too, is a
 * page. This work cites itself constantly -- 5,180 of the links on a Summa
 * page point back into the Summa -- and a reader following `Q[74], A[2]`
 * mid-argument wants to see what it says without losing their place, which is
 * exactly the case the preview was built for. A question is a page, but it is
 * also a unit.
 */
export type PreviewTarget =
	| Exclude<Address, { kind: 'prayer' } | { kind: 'document' }>
	| { kind: 'document'; slug: string; n: number };

/** `parseHref`, restricted to what the hover preview can show. */
export function previewTarget(href: string | null | undefined): PreviewTarget | undefined {
	const a = parseHref(href);
	if (!a) return undefined;
	if (a.kind === 'prayer') return undefined;
	if (a.kind === 'document') return a.n === undefined ? undefined : { ...a, n: a.n };
	return a;
}
