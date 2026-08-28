import { i18n } from '$lib/i18n.svelte';
import { isUiLang } from '$lib/ui-langs';

/**
 * `/pt/catechismus` puts the interface into Portuguese.
 *
 * ARRIVING AT ONE OF THESE IS AN EXPLICIT LANGUAGE CHOICE, and `i18n.set`
 * persists it exactly as the language switcher does. That is deliberate and it
 * has a cost worth stating: a reader who has chosen English and follows a
 * shared `/pt/preces` link has their stored choice changed. The alternative —
 * render Portuguese without remembering it — is worse, not better, because
 * every link on the page that follows is UNPREFIXED (see `CHROME_PATHS`), so
 * the reader would be thrown back into English on their first click. These
 * addresses exist to be entry points from a search result in the reader's own
 * language; honouring the language for one page and then dropping it would
 * answer the search and lose the reader.
 *
 * In `load` rather than an `$effect` in a layout component: this runs before
 * the page renders, so the first paint is already in the right language.
 * `app.html`'s pre-paint block reads the same path for `<html lang>` and
 * `dir`, which is the half that has to happen even earlier — an Arabic reader
 * whose direction flips after hydration watches the whole page change sides.
 */
export function load({ params }: { params: { uilang: string } }) {
	// The matcher has already answered this; the guard is for the type, and
	// costs an array scan on a navigation that is doing a great deal more.
	if (isUiLang(params.uilang)) i18n.set(params.uilang);
	return {};
}
