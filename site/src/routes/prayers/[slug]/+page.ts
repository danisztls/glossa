import { error } from '@sveltejs/kit';
import {
	getAdjacentPrayer,
	getPrayerAsync,
	getWork,
	listPrayerGroups,
	prayerIndexLang,
	prayerLangs,
	type PrayerMeta
} from '$lib/corpus';
import type { Prayer, WorkManifest } from '$lib/types';
import type { PageLoad } from './$types';

export interface PrayerByLang {
	prayer: Prayer;
	work: WorkManifest;
	/** The `/prayers` group this slug belongs to, for the breadcrumb — found
	 *  by the same title-match `listPrayerGroups` uses, so a slug missing
	 *  from every group (shouldn't happen: it means `prayerExists` answered
	 *  true but no structure section claims it) degrades to no breadcrumb
	 *  link rather than a crash. */
	group?: { id: string; title: string };
	prev?: PrayerMeta;
	next?: PrayerMeta;
}

export const load: PageLoad = async ({ params }) => {
	const slug = params.slug;

	// Prayer URLs stay edition-free (docs/decisions.md #2, same as CCC/
	// Compendium) — the edition comes from a stored preference applied
	// client-side, and this route renders only in the browser (`ssr = false`,
	// `+layout.ts`) — but `load` only re-runs on navigation, not when a
	// stored preference changes on its own, so reading it there wouldn't
	// keep the page honest anyway. So this embeds EVERY
	// language's copy of this slug up front; the component picks which one
	// to show reactively from `content.langFor('prayer')`.
	const byLang: Record<string, PrayerByLang> = {};
	for (const lang of prayerLangs()) {
		const work = getWork(`prayer.common.${lang}`);
		if (!work) continue;
		const prayer = await getPrayerAsync(lang, slug);
		if (!prayer) continue; // this language's corpus doesn't have this slug (gappy fixtures / v1 asymmetry)
		// The TEXT is this edition's; the BREADCRUMB and the prev/next chain are
		// the collection's (`prayerIndexLang`). They come apart only for
		// `prayer.common.en-gb`, which holds five prayers: reading its own
		// adjacency would walk a reader from the Magnificat to the Benedictus
		// past three prayers it does not print but they can still read, and
		// would put them in a section heading that lists five entries.
		const index = prayerIndexLang(lang);
		const group = listPrayerGroups(index).find((g) => g.prayers.some((p) => p.slug === slug));
		byLang[lang] = {
			prayer,
			work,
			group: group ? { id: group.id, title: group.title } : undefined,
			prev: getAdjacentPrayer(index, slug, 'prev'),
			next: getAdjacentPrayer(index, slug, 'next')
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'Prayer not found in this corpus');
	}

	return { slug, byLang };
};
