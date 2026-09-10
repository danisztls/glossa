/**
 * Which description of a document to show, given a reader's language.
 *
 * A document may have two: the one on its manifest, written by READING that
 * edition (`site/descriptions.json`), and a rendering of some edition's
 * reading into the reader's language (`loadTranslatedDescriptions`, keyed by
 * slug because a translation is prose about the document rather than about an
 * edition of it).
 *
 * A READING IN THE READER'S OWN LANGUAGE BEATS A TRANSLATION INTO IT. Both are
 * in the language he wants; only one of them was written by somebody looking
 * at the text it describes. That case is real and not rare — 22 Portuguese
 * editions have been read on their own terms — and it is the only ordering
 * under which correcting a reading cannot be silently overruled by a
 * translation of a different edition's reading.
 *
 * Never a placeholder and never a machine translation of a missing reading:
 * `manifest.description` is absent for a work nobody has read yet, and the
 * translations only ever hold renderings of a reading that exists
 * (`site/descriptions.json`, `origin`).
 *
 * `/documenta` prints this under a row and `linkPreviewContent.ts` previews a
 * whole-document link with it, which is why the rule lives in neither: one is
 * synchronous over descriptions it already holds and the other awaits them,
 * and a rule kept in both places is a rule half of it will be corrected in.
 */
export function preferredDescription(
	manifest: { description?: string; language: string },
	uiLang: string,
	translated: Record<string, string>,
	slug: string
): string | undefined {
	const own = manifest.description?.trim() || undefined;
	if (own && manifest.language === uiLang) return own;
	return translated[slug]?.trim() || own;
}
