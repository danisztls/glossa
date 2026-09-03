import { error } from '@sveltejs/kit';
import {
	canonLawLangs,
	canonLawTitleFor,
	canonLawWorkId,
	getCanonLawRangeAsync,
	getWork,
	loadCanonLawOutline
} from '$lib/corpus';
import type { DocumentSection, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * A whole reading unit of the Code — a title, or a book where its canons run
 * ahead of its first title — addressed by the canon it opens at.
 *
 * ADDRESSED BY ITS OPENING CANON for the reason the Catechism's chapters and
 * the Compendium of the Social Doctrine's are: a division has no number of
 * its own that a reader could cite (`TITLE I` is four different places in the
 * Code), while the canon it opens at is a fact about the text and unique in
 * it.
 *
 * THE SPAN IS THE SAME IN EVERY LANGUAGE. The seven editions are translations
 * of one divided text, and the anchors are unioned across all of them
 * (`canonLawUnitStarts` in scripts/sync-corpus.mjs), so this resolves the span
 * per language only to skip an edition that stops short of it.
 */
interface CanonLawTitleLangData {
	span: [number, number];
	canons: DocumentSection[];
	work: WorkManifest;
}

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);

	const byLang: Partial<Record<string, CanonLawTitleLangData>> = {};
	for (const lang of canonLawLangs()) {
		const work = getWork(canonLawWorkId(lang));
		if (!work) continue;
		// Resolved from `n` rather than trusted to BE a unit start, the way
		// the Catechism's chapter route does it: landing mid-unit shows the
		// unit, not nothing.
		const span = canonLawTitleFor(lang, n);
		if (!span) continue;
		const canons = await getCanonLawRangeAsync(lang, span[0], span[1]);
		if (canons.length === 0) continue;
		await loadCanonLawOutline(lang);
		byLang[lang] = { span, canons, work };
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'No division of the Code of Canon Law contains this canon');
	}

	return { n, byLang };
};
