/**
 * Where a heading of the Code of Canon Law points, and the chain of headings
 * above a canon.
 *
 * `socialDoctrineNav.ts`'s two questions, asked by the same four surfaces —
 * the landing index, the reading sidebar on both routes, and the breadcrumb
 * on both routes — and answered here rather than four times, which is that
 * module's whole reason for existing.
 *
 * THE TITLE VIEW IS THE READING SURFACE AND THE CANON PAGE IS THE CITATION
 * SURFACE. A reader following an outline is going somewhere to read, and
 * `/ius-canonicum/1311` gives them one canon out of a title of fifty-three;
 * the canon page is reached by its number, which is the form `CIC can. 1311`
 * takes anyway.
 */
import { hrefFor } from './address';
import { canonLawOutline, canonLawTitleFor } from './corpus';
import { contains } from './components/structureToc';
import { documentHeadingParts, type DisplayTitle } from './titles';
import type { StructureNode } from './types';

/**
 * The reading page this heading is read on, at the heading itself.
 *
 * `#s{n}` is the id `/ius-canonicum/titulus/[n]` puts on the first inner
 * heading of a run, and it is omitted where `at` opens the unit — there the
 * heading IS the page's `<h1>` and carries no such id, so the fragment would
 * name nothing and the browser would leave the reader at the previous page's
 * scroll offset.
 */
export function canonLawHeadingHref(lang: string, at: number): string {
	const span = canonLawTitleFor(lang, at);
	if (!span) return hrefFor({ kind: 'canonLaw', n: at });
	const unit = hrefFor({ kind: 'canonLawTitle', n: span[0] });
	return at === span[0] ? unit : `${unit}#s${at}`;
}

/** One crumb: the node, and where it sits among its own siblings — which is
 *  what `marker()` needs to abbreviate a printed label. */
export interface CanonLawCrumb {
	node: StructureNode;
	siblings: StructureNode[];
	index: number;
}

/**
 * Every heading whose span contains `n`, outermost first.
 *
 * THE CODE IS THE DEEPEST TRAIL IN THIS CORPUS — book, part, section, title,
 * chapter, article, six levels where the Compendium of the Social Doctrine
 * has two — so this walk routinely returns four or five crumbs where that
 * one returns one. The descent takes the FIRST containing child at each
 * level and not every one: canon 1311 opens Book VI, its Part I and its Title
 * I together, and those are nested rather than parallel.
 */
export function canonLawTrail(lang: string, n: number): CanonLawCrumb[] {
	const crumbs: CanonLawCrumb[] = [];
	let siblings = canonLawOutline(lang);
	for (;;) {
		const index = siblings.findIndex((node) => contains(node, n));
		if (index === -1) return crumbs;
		const node = siblings[index];
		crumbs.push({ node, siblings, index });
		if (!node.children || node.children.length === 0) return crumbs;
		siblings = node.children;
	}
}

/**
 * A division's title with the canon range the source prints inside it
 * removed — `ECCLESIASTICAL LAWS (Cann. 7 - 22)` -> `ECCLESIASTICAL LAWS`.
 *
 * FIVE OF THE SEVEN EDITIONS PRINT IT AND TWO DO NOT (Latin and Russian
 * print none), so leaving it in gives the same page two shapes depending on
 * the reader's edition, and gives five of them the range twice: once inside
 * the heading and once on the line below, which this site derives for every
 * division of every work. Stripping it here rather than in the corpus is the
 * point — `structure.json` keeps what the edition printed, and this is a
 * decision about a page.
 *
 * Anchored to the END and requiring a digit, so a division whose NAME ends
 * in a parenthesis keeps it.
 *
 * IT READS PAST A TRAILING RUN OF CLOSING TAGS, because it is also applied to
 * `title_html` — 160 Italian divisions carry one, and the edition sets the
 * range INSIDE the emphasis it closes the heading with (`… </b> (<b>Cann. 35
 * – 93)</b>`). Anchored at `$` alone the `</b>` defeated the match, so the
 * sidebar and the body headings printed a range the breadcrumb beside them
 * had dropped. Whatever emphasis the range was wrapped in goes with it.
 */
export function canonLawTitleText(title: string): string {
	return (
		title.replace(/\s*\((?=[^()]*\d)[^()]*\)(?:\s*<\/[a-zA-Z][^>]*>)*\s*$/u, '').trim() || title
	);
}

/**
 * A division's heading, split into the ordinal it opens with and the name
 * after it, with the printed range gone.
 *
 * THE STRIP HAS TO HAPPEN FIRST, and doing it last is what made five of the
 * seven editions shout. `normalizeCase` (titles.ts) rewrites a heading only
 * when it is ALL-CAPS, and `(Cann. 35 - 93)` is not: the `ann` of the range
 * the source prints inside the title is lower-case, so every heading carrying
 * one failed the test and came through as `SINGULAR ADMINISTRATIVE ACTS`
 * while the headings beside it — Book II's, and every heading in the two
 * editions that print no range at all — read `The People of God`. One page
 * showed both forms in one breadcrumb.
 *
 * So this is the pair, in the order that works, and every surface takes it
 * from here rather than composing the two itself.
 */
export function canonLawHeadingParts(title: string, lang: string): DisplayTitle {
	return documentHeadingParts(canonLawTitleText(title), lang);
}

/**
 * The division nouns the seven editions print, and what each shortens to.
 *
 * THE WORDS ARE `KIND_LABELS`' (titles.ts), NOT A SECOND VOCABULARY. That
 * table is what the Catechism, the Compendium and every document already
 * abbreviate a chapter with, so a reader who has seen `Ch. 3` on one page
 * must not meet `Chap. III` on another — which is exactly what shipped for a
 * day. `canonLawNav.test.ts` asserts the agreement per language through
 * `kindLabelWord`, in the same shape `menu-filter.test.ts` uses to hold two
 * language tables together.
 *
 * KEYED BY THE PRINTED NOUN even so, because the kind is not on the outline:
 * `buildDocumentOutline` stamps every node it builds `kind: 'sub'`
 * (corpus.ts), and the source's own word survives only in the `label`.
 * Reading the label is also what makes the French parts degrade correctly —
 * `PREMIÈRE PARTIE` puts the ordinal first, matches nothing here, and prints
 * as the source prints it.
 *
 * TWO ENTRIES HAVE NO COUNTERPART TO AGREE WITH, and both are the Code being
 * unlike the rest of the corpus rather than a divergence:
 *
 *  - **`title`.** No other work here has a division of that name, so
 *    `StructureNode['kind']` has no such member and `KIND_LABELS` no such
 *    column. `Tit.` is this module's, and the test has nothing to check it
 *    against.
 *  - **Russian `article`.** `KIND_LABELS` carries no `article` for `ru`, `hu`,
 *    `pl`, `ro`, `sl` or `sv` — the six languages the Catechism, the one work
 *    with that kind, is not published in. The Code IS published in Russian, so
 *    `Ст.` is filled in here; the day a Russian work needs it in the shared
 *    table, that is where it goes.
 *
 * BOOK, PART AND SECTION ARE ABSENT, on the shared table's own judgement:
 * `KIND_LABELS` abbreviates `chapter` and `article` and spells `part` and
 * `section` out. Book and part are the top of the tree — twenty rows per
 * edition, where the index gives the label a line of its own — and section is
 * eight rows. The 265 below them are what repeat a noun beside a name in a
 * column that has to hold both, which is the same judgement the Code itself
 * makes: `Art.` is the one level every edition already abbreviates.
 *
 * (German is also why this stays keyed on the printed noun rather than routed
 * through `kindLabelWord` at call time: the Code's German edition prints
 * `SEKTION` and `KIND_LABELS.de.section` is `Abschnitt` — a different WORD,
 * not a shorter one, and printing it would put a noun on the page that the
 * page it names does not use. Leaving `section` out settles that too.)
 */
const CANON_LAW_LABEL_SHORT: Record<string, Record<string, string>> = {
	en: { TITLE: 'Tit.', CHAPTER: 'Ch.', ART: 'Art.' },
	la: { TITULUS: 'Tit.', CAPUT: 'Cap.', ART: 'Art.' },
	it: { TITOLO: 'Tit.', CAPITOLO: 'Cap.', ARTICOLO: 'Art.' },
	es: { TITULO: 'Tít.', CAPITULO: 'Cap.', ART: 'Art.' },
	fr: { TITRE: 'Tit.', CHAPITRE: 'Ch.', ART: 'Art.' },
	de: { TITEL: 'Tit.', KAPITEL: 'Kap.', ARTIKEL: 'Art.' },
	ru: { ТИТУЛ: 'Тит.', ГЛАВА: 'Гл.', СТ: 'Ст.' }
};

/** Accents off, upper-cased — `documentLabelKind`'s fold (structureToc.ts),
 *  which is what lets one table answer for `TÍTULO` and `TITULO` at once.
 *  Cyrillic carries no combining marks here and folds to itself. */
function foldNoun(word: string): string {
	return word.normalize('NFD').replace(/\p{M}/gu, '').toUpperCase();
}

/** A run of letters with no lower-case in it — `cic.py`'s `_is_shouted`, and
 *  the same question: is this label set in capitals? */
function isShouted(text: string): boolean {
	const letters = [...text].filter((c) => /\p{L}/u.test(c));
	return letters.length > 0 && letters.every((c) => c.toLocaleUpperCase() === c);
}

/**
 * A printed division label with its noun abbreviated — `CHAPTER I` ->
 * `CH. I`, `Art. 1` unchanged, `PREMIÈRE PARTIE` unchanged.
 *
 * THE SOURCE'S OWN NUMERAL IS KEPT, and that is the whole difference from
 * `marker()` (structureToc.ts), whose short form is unusable here for the
 * reason `/doctrina-socialis`'s breadcrumb records and a sharper one: it
 * numbers a row by its position among its TREE siblings, and the Code
 * restarts `TITLE I` inside every book and part. Four different places would
 * read `Tit. 1`. Shortening the NOUN touches nothing a citation is made of.
 *
 * The abbreviation takes the label's own case register, so an edition that
 * shouts its headings goes on shouting: a table whose values are capitalised
 * where the source capitalises would be a second copy of that fact, and the
 * index sets some of these rows through `text-transform: uppercase` and some
 * not (`.rank-sub .kind-label`, StructureIndex.svelte).
 */
export function canonLawLabelText(label: string, lang: string): string {
	const table = CANON_LAW_LABEL_SHORT[lang.split('-')[0].toLowerCase()];
	if (!table) return label;
	const m = /^(\p{L}+)\.?(\s*)(\S.*)?$/u.exec(label.trim());
	if (!m || !m[3]) return label;
	const short = table[foldNoun(m[1])];
	if (!short) return label;
	return `${isShouted(m[1]) ? short.toLocaleUpperCase() : short} ${m[3]}`;
}
