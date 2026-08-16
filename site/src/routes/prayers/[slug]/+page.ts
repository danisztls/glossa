import { error } from '@sveltejs/kit';
import {
	getAdjacentPrayer,
	getPrayerAsync,
	getWork,
	listPrayerGroups,
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
	// client-side, and the whole site is prerendered with no server to
	// consult that preference at request time. So this embeds EVERY
	// language's copy of this slug up front; the component picks which one
	// to show reactively from `content.langFor('prayer')`.
	const byLang: Record<string, PrayerByLang> = {};
	for (const lang of prayerLangs()) {
		const work = getWork(`prayer.common.${lang}`);
		if (!work) continue;
		const prayer = await getPrayerAsync(lang, slug);
		if (!prayer) continue; // this language's corpus doesn't have this slug (gappy fixtures / v1 asymmetry)
		const group = listPrayerGroups(lang).find((g) => g.prayers.some((p) => p.slug === slug));
		byLang[lang] = {
			prayer,
			work,
			group: group ? { id: group.id, title: group.title } : undefined,
			prev: getAdjacentPrayer(lang, slug, 'prev'),
			next: getAdjacentPrayer(lang, slug, 'next')
		};
	}

	if (Object.keys(byLang).length === 0) {
		error(404, 'Prayer not found in this corpus');
	}

	return { slug, byLang };
};
