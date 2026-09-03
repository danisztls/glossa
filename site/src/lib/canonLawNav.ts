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
import { contains, documentLabelKind } from './components/structureToc';
import { documentHeadingParts, kindLabelWord, type DisplayTitle } from './titles';
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
 * The division nouns the Code prints that the SHARED recogniser cannot
 * reach, and the kind each names.
 *
 * `documentLabelKind` (structureToc.ts) is asked first and answers for the
 * six Latin-script spellings of `title`, which joined `LABEL_KIND_WORDS` on
 * 2026-09-03. What is left here is what could not join it, for two different
 * reasons, and neither is a preference:
 *
 *  - **The chapter and article nouns would change 148 other works.** Adding
 *    `CAPUT`, `CAPITOLO`, `CHAPITRE`, `KAPITEL`, `ARTICOLO`, `ARTIKEL` and
 *    `ART` to the shared table is not inert the way the title nouns were
 *    (measured over all 1,668 `structure.json` files: the title nouns match
 *    `cic.*` and nothing else; these match 148 works besides). Those works
 *    take `marker()`'s DERIVED form, which numbers a row by its position
 *    among its tree siblings — and `vatii.christus-dominus.la` prints `CAPUT
 *    II` and `CAPUT III` with no `CAPUT I` above them, so they would be
 *    renumbered `Cap. 1` and `Cap. 2`. A long label is a cost; a wrong number
 *    is a lie.
 *  - **`documentLabelKind` reads Latin script only** (`[A-Z]+`, its own
 *    docblock), so the Russian edition's nouns are invisible to it whatever
 *    the table says. Widening that fold is a change to how every Cyrillic
 *    label in the corpus is read, for four kinds and not one.
 *
 * THE WORDS ARE NOT HERE AT ALL, which is the point of the shape: this maps a
 * printed noun to a KIND, and `kindLabelWord` turns the kind into the word
 * (`KIND_LABELS`, titles.ts). There is one abbreviation vocabulary on the
 * site and the Code reads it, so a reader cannot meet `Ch. 3` on one page and
 * `Chap. III` on the next — which is what shipped for a day, when this held
 * words of its own.
 *
 * KEYED BY THE PRINTED NOUN rather than by the node's kind because the
 * outline carries none: `buildDocumentOutline` stamps every node `sub`
 * (corpus.ts), and the source's own word survives only in the `label`.
 * Reading the label is also what makes the French parts degrade correctly —
 * `PREMIÈRE PARTIE` puts its ordinal first, matches nothing, and prints as
 * the source prints it.
 */
const CANON_LAW_EXTRA_NOUNS: Partial<Record<string, StructureNode['kind']>> = {
	CAPUT: 'chapter',
	CAPITOLO: 'chapter',
	CHAPITRE: 'chapter',
	KAPITEL: 'chapter',
	ART: 'article',
	ARTICOLO: 'article',
	ARTIKEL: 'article',
	ГЛАВА: 'chapter',
	ТИТУЛ: 'title',
	СТ: 'article'
};

/**
 * The kinds this shortens, which is the shared table's own judgement and not
 * a second one: `KIND_LABELS` abbreviates `title`, `chapter` and `article`
 * and spells `part` and `section` out, on the reasoning in its docblock —
 * the deep kinds repeat at a density where the word is more column than
 * information, the shallow ones head a page and can afford it.
 *
 * `book` is absent from the union entirely, so it degrades here with no entry
 * needed. Section is the one place the Code and the shared table would have
 * disagreed about the WORD rather than its length — the German edition prints
 * `SEKTION` and `KIND_LABELS.de.section` is `Abschnitt` — and excluding the
 * kind settles that too.
 */
const CANON_LAW_SHORTENED = new Set<StructureNode['kind']>(['title', 'chapter', 'article']);

/** Accents off, upper-cased — `documentLabelKind`'s own fold, repeated for
 *  the entries above that it cannot reach. Cyrillic carries no combining
 *  marks here and folds to itself. */
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
 * shouts its headings goes on shouting: capitalising the shared table's
 * values would be a second copy of a fact that belongs to the edition, and
 * the index sets some of these rows through `text-transform: uppercase` and
 * some not (`.rank-sub .kind-label`, StructureIndex.svelte).
 */
export function canonLawLabelText(label: string, lang: string): string {
	const m = /^(\p{L}+)\.?(\s*)(\S.*)?$/u.exec(label.trim());
	if (!m || !m[3]) return label;
	const kind = documentLabelKind(m[1]) ?? CANON_LAW_EXTRA_NOUNS[foldNoun(m[1])];
	if (!kind || !CANON_LAW_SHORTENED.has(kind)) return label;
	const short = kindLabelWord(kind, lang);
	if (!short) return label;
	return `${isShouted(m[1]) ? short.toLocaleUpperCase() : short} ${m[3]}`;
}
