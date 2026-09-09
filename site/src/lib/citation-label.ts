/**
 * An address written as the reader would CITE it, and whether it still names
 * anything.
 *
 * ONE NOTATION, BECAUSE THE LIBRARY IS WHERE EVERY WORK MEETS. `/signata` is
 * the only page that prints Scripture, the Catechism, its Compendium, the
 * Summa, the Social Doctrine, the Code, the prayers and the documents in one
 * column, and until this module it printed each of them in whatever form the
 * surface that produced the row happened to use — a chapter heading from one
 * reading route, a scholastic citation from another, a bare question label
 * from a third. The forms here are the ones `/schola` TEACHES (its `specimens`
 * table), read out of the same tables rather than re-spelled: a page that
 * teaches `CCC 1234` and then files a mark under "1. The Sacraments of
 * Christian Initiation" has taught nothing.
 *
 * INDEX TIER ONLY, AND THAT IS THE POINT. Every reader here is synchronous —
 * `bookAbbrev`, `getBook`, the manifests, the existence sets — so a row costs
 * no fetch. The library used to `await` a content file per row to print two
 * clamped lines under each citation; with the excerpt gone, nothing on the
 * page needs the text at all, and the hover/tap card fetches it only for the
 * one row a reader actually asks about.
 *
 * IT IS NOT `linkPreviewContent.ts`'s CARD TITLE, deliberately. That names the
 * unit a card is SHOWING, with the work's own apparatus attached
 * (`S.Th. II-II, q. 184, a. 3 — <title>`); this is the address as a citation.
 * The two agree wherever the citation is all there is to say and differ where
 * the card has room for more, which is the right relation between a heading
 * and a reference.
 *
 * THE VERSE MARK COMES FROM `chapterVerseSep`, never a literal —
 * `citation-punctuation.test.ts` is a source scan that exists because three
 * separate surfaces typed `:` and were right in exactly one language.
 */

import {
	canonLawCanonExists,
	canonLawTitleFor,
	canonLawWorkId,
	cccParagraphExists,
	compendiumQuestionExists,
	getCccChapterBreadcrumb,
	documentSectionExists,
	getBook,
	getCompendiumChapterFor,
	getDocumentManifest,
	getPrayerMeta,
	isUnpublished,
	prayerExists,
	socialDoctrineChapterFor,
	socialDoctrineParagraphExists,
	socialDoctrineWorkId,
	summaArticleExists,
	summaQuestionExists,
	summaWorkIdFor
} from './corpus';
import { runHasInRange } from './corpus-index';
import { summaPartFromSlug, type Address } from './address';
import { bookAbbrev } from './refs-grammar';
import { chapterVerseSep } from './citation-style';
import { content } from './content.svelte';
import { t } from './i18n.svelte';

/** The work id a prayer edition is published under. `prayers.{lang}` is what
 *  `bookmarkContent.ts` asked `isUnpublished` for until 2026-09-07, which is
 *  not an id this corpus has ever used — so the guard passed for a withheld
 *  edition as readily as for a published one. */
export function prayerWorkId(lang: string): string {
	return `prayer.common.${lang}`;
}

/**
 * The Summa's citation, in the scholastic short form `/schola` prints.
 *
 * `STh` and not `S.Th.` because that is the specimen the site teaches, and the
 * part is the WORK's spelling (`II-II`) rather than the URL slug — a citation
 * is read, not typed into an address bar.
 */
function summaCitation(target: Extract<Address, { kind: 'summa' }>): string {
	const part = summaPartFromSlug(target.part) ?? target.part.toUpperCase();
	const question = `STh ${part}, ${target.question}`;
	return target.article === null ? question : `${question}, ${target.article}`;
}

/**
 * Scripture, in the reader's own edition's abbreviation and punctuation.
 *
 * The name falls back twice and each fallback is a different failure: a
 * language with no abbreviation table at all (`bookAbbrev` answers nothing for
 * the whole language) keeps the edition's full book name, which is a correct
 * citation and merely a longer one; an edition that does not carry the book
 * keeps the OSIS id, so a mark on a deuterocanonical book a reader has
 * switched away from still says which book it was.
 */
function bibleCitation(target: Extract<Address, { kind: 'bible' }>): string {
	const workId = content.workIdFor('bible');
	const book = workId ? getBook(workId, target.osis) : undefined;
	const name = bookAbbrev(target.osis, content.langFor('bible')) ?? book?.name ?? target.osis;
	const at = `${name} ${target.chapter}`;
	if (target.from === undefined) return at;
	const to = target.to ?? target.from;
	const verses = target.from === to ? `${target.from}` : `${target.from}-${to}`;
	return at + chapterVerseSep() + verses;
}

/** A document is cited by its own incipit — `Dei Verbum 12` — which is how
 *  the Catechism cites one throughout. The slug stands where the reader's
 *  language carries no edition, the way `documentGroupTitle` already does:
 *  a citation nobody can read is still better than a blank row. */
function documentCitation(target: Extract<Address, { kind: 'document' }>): string {
	const workId = content.documentWorkIdFor(target.slug);
	const manifest = workId ? getDocumentManifest(workId) : undefined;
	const title = manifest?.short_title ?? target.slug;
	return target.n === undefined ? title : `${title} ${target.n}`;
}

/**
 * The address, as a citation in the reader's own language.
 *
 * A CHAPTER IS CITED BY THE NUMBER IT OPENS AT (`CCC 1210`), not by its
 * heading. The address IS that number — `/catechismus/caput/1210` — and the
 * heading is what the preview card carries; citing the heading here would
 * give the one column on the site where every work meets two notations, one
 * of which the site teaches nowhere.
 */
export function citationFor(target: Address): string {
	switch (target.kind) {
		case 'bible':
			return bibleCitation(target);
		case 'ccc':
		case 'cccChapter':
			return `${t('ccc.abbrev')} ${target.n}`;
		case 'compendium':
		case 'compendiumChapter':
			return `${t('compendium.abbrev')} ${target.n}`;
		// A literal, as `/schola`'s specimen has it: this work has no
		// abbreviation key in any dictionary, and minting one to spell a
		// siglum every language already prints as `CSDC` would be a decision
		// about the interface rather than about the citation.
		case 'socialDoctrine':
		case 'socialDoctrineChapter':
			return `CSDC ${target.n}`;
		case 'canonLaw':
		case 'canonLawTitle':
			return `${t('canonLaw.canon')} ${target.n}`;
		case 'summa':
			return summaCitation(target);
		case 'document':
			return documentCitation(target);
		// A prayer is cited by its title and by nothing else — the collection
		// is not numbered and no siglum names it. The slug stands for an
		// edition the reader's language does not carry, as a document's does.
		case 'prayer':
			return getPrayerMeta(content.langFor('prayer'), target.slug)?.title ?? target.slug;
		// A topic has no citation, because it is not a unit of anybody's text —
		// it is a page of this site, and what names it is its own title. The
		// key is the fallback too: `t()` returns the key for a dictionary that
		// has not got it, which prints something recognisable rather than
		// blank, and every other branch here degrades the same way.
		case 'topic':
			return t(`quaestiones.${target.slug}.title`);
	}
}

/**
 * Whether the address still names something the reader can open.
 *
 * THE SYNCHRONOUS HALF OF WHAT `resolveBookmark`'s `undefined` USED TO MEAN.
 * The library learned that a mark was dead by fetching its text and getting
 * nothing back; with no fetch left to make, the same question is asked of the
 * index tier — which carries every existence set, down to the verse numbers of
 * each chapter (`BibleBookMeta` in `corpus-index.ts`). A withheld edition is
 * checked first in every branch, because that is the one cause that makes a
 * whole work vanish at once.
 */
export function addressResolves(target: Address): boolean {
	switch (target.kind) {
		case 'bible': {
			const workId = content.workIdFor('bible');
			if (!workId || isUnpublished(workId)) return false;
			const chapter = getBook(workId, target.osis)?.chapters.find((c) => c.n === target.chapter);
			if (!chapter) return false;
			if (target.from === undefined) return true;
			// The cited verses, or one of them: an edition whose versification
			// puts the span elsewhere carries none of it, which is what
			// `resolveBible` refuses to invent an excerpt for.
			const to = target.to ?? target.from;
			return runHasInRange(chapter.verses, target.from, to);
		}
		case 'ccc': {
			const lang = content.langFor('catechism');
			return !isUnpublished(`ccc.${lang}`) && cccParagraphExists(lang, target.n);
		}
		// A DIVISION ADDRESS IS ASKED THE ROUTE'S QUESTION, NOT THE PREVIEW'S,
		// and the four of them are one rule. `/catechismus/caput/{n}` says so
		// in as many words -- "a start that exists in one language's tree may
		// fall mid-chapter in the other's, and landing mid-chapter should
		// still show the whole enclosing chapter rather than nothing" -- and
		// its three siblings 404 on "no division CONTAINS this number". So
		// what this marker reports is whether following the link shows the
		// reader something, which is the only thing "not in the edition you
		// are reading" can honestly mean. The preview resolvers ask the
		// stricter "does this number OPEN a division", because a card has to
		// pick one division to title itself with.
		case 'cccChapter': {
			const lang = content.langFor('catechism');
			if (isUnpublished(`ccc.${lang}`)) return false;
			return getCccChapterBreadcrumb(lang, target.n).length > 0;
		}
		case 'compendium': {
			const lang = content.langFor('compendium');
			return !isUnpublished(`compendium.${lang}`) && compendiumQuestionExists(lang, target.n);
		}
		case 'compendiumChapter': {
			const lang = content.langFor('compendium');
			if (isUnpublished(`compendium.${lang}`)) return false;
			return getCompendiumChapterFor(lang, target.n) !== undefined;
		}
		case 'socialDoctrine': {
			const lang = content.langFor('social-doctrine');
			return (
				!isUnpublished(socialDoctrineWorkId(lang)) && socialDoctrineParagraphExists(lang, target.n)
			);
		}
		case 'socialDoctrineChapter': {
			const lang = content.langFor('social-doctrine');
			if (isUnpublished(socialDoctrineWorkId(lang))) return false;
			return socialDoctrineChapterFor(lang, target.n) !== undefined;
		}
		case 'canonLaw': {
			const lang = content.langFor('canon-law');
			return !isUnpublished(canonLawWorkId(lang)) && canonLawCanonExists(lang, target.n);
		}
		case 'canonLawTitle': {
			const lang = content.langFor('canon-law');
			if (isUnpublished(canonLawWorkId(lang))) return false;
			return canonLawTitleFor(lang, target.n) !== undefined;
		}
		case 'document': {
			const workId = content.documentWorkIdFor(target.slug);
			if (!workId || isUnpublished(workId)) return false;
			return target.n === undefined
				? getDocumentManifest(workId) !== undefined
				: documentSectionExists(workId, target.n);
		}
		case 'summa': {
			const part = summaPartFromSlug(target.part);
			if (!part || !summaQuestionExists(part, target.question)) return false;
			const workId = summaWorkIdFor(content.langFor('summa'), part, target.question);
			if (!workId || isUnpublished(workId)) return false;
			return target.article === null || summaArticleExists(part, target.question, target.article);
		}
		case 'prayer': {
			const lang = content.langFor('prayer');
			return !isUnpublished(prayerWorkId(lang)) && prayerExists(lang, target.slug);
		}
		// THE ONE KIND THIS CANNOT ANSWER, and it says so rather than guessing
		// wrong in the expensive direction. Every branch above asks the index
		// tier, which carries each work's existence sets; the topic list is
		// deliberately NOT in that tier (`corpus-index.ts`, and the reasoning
		// is that a topic's anchors answer neither "does this address exist"
		// nor "where does its text live"). So a withdrawn topic is caught by
		// the edge, which reads the route manifest, and by the 404 in the
		// route's own `load` — while answering `false` here would quietly
		// discard a reader's mark on every topic, since none of them can be
		// found. A topic is also never `unpublished`: that switch withholds a
		// WORK, and this is not one.
		case 'topic':
			return true;
	}
}
