import { error } from '@sveltejs/kit';
import {
	getSocialDoctrineRangeAsync,
	getWork,
	loadSocialDoctrineOutline,
	socialDoctrineChapterFor,
	socialDoctrineLangs,
	socialDoctrineWorkId
} from '$lib/corpus';
import type { DocumentSection, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

/**
 * A whole division of the Compendium of the Social Doctrine, addressed by the
 * paragraph it opens at — the Catechism's chapter address, for the same
 * reason: the divisions carry no number of their own that a reader could
 * cite, and the paragraph they open at is a fact about the text.
 *
 * THE SPAN IS THE SAME IN EVERY LANGUAGE, unlike the Catechism's, whose
 * editions genuinely disagree about where a chapter starts. These ten
 * editions are translations of one numbered text and the anchors are unioned
 * across the seven that print a division label, which agree exactly
 * (`socialDoctrineChapterStarts` in scripts/sync-corpus.mjs). So this
 * resolves the span once per language only to skip an edition that stops
 * short of it.
 */
interface SocialDoctrineChapterLangData {
	span: [number, number];
	paragraphs: DocumentSection[];
	work: WorkManifest;
}

export const load: PageLoad = async ({ params }) => {
	const n = Number(params.n);

	const byLang: Partial<Record<string, SocialDoctrineChapterLangData>> = {};
	for (const lang of socialDoctrineLangs()) {
		const work = getWork(socialDoctrineWorkId(lang));
		if (!work) continue;
		// Resolved from `n` rather than trusted to BE a division start, the
		// way the Catechism's chapter route does it: landing mid-division
		// shows the division, not nothing.
		const span = socialDoctrineChapterFor(lang, n);
		if (!span) continue;
		const paragraphs = await getSocialDoctrineRangeAsync(lang, span[0], span[1]);
		if (paragraphs.length === 0) continue;
		await loadSocialDoctrineOutline(lang);
		byLang[lang] = { span, paragraphs, work };
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'No division of the Compendium of the Social Doctrine contains this paragraph');
	}

	return { n, byLang };
};
