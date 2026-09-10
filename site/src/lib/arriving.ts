/**
 * Which unit on this page the reader ARRIVED at, when the address named one.
 *
 * `/documenta/antiqua-et-nova#s3` is a section's whole address — it is what
 * `hrefFor` writes, what the unit number's popover copies, and what a citation
 * anywhere on the site resolves to — so following one has to say which section
 * it meant. Until this existed only the Bible chapter reader did: every other
 * block-unit reader rendered `id="s3"`, let the browser scroll there, and
 * marked nothing, which leaves a reader who followed a link into the middle of
 * a long document to work out for themselves where the thing they were sent to
 * begins.
 *
 * NOT `:target`, WHICH IS WHAT THIS LOOKS LIKE A JOB FOR. The Bible reader's
 * `directVerse` records the reason and it applies unchanged to every reader
 * here: the component is REUSED across units, so the router replaces the
 * sections in place, and browsers can leave `:target` matched on a reused
 * `#s3` element after a new, hashless address has been installed. Reading the
 * fragment as an ordinary reactive input scopes the mark to the current URL,
 * so navigating from a linked section to a document that names none has no
 * mark rather than a stale one.
 *
 * It is a function rather than a derived value because it is asked once per
 * rendered unit — a long document is hundreds of calls per render, and each is
 * a string comparison against a value the page already holds. Reading
 * `page.url.hash` inside the render is what registers the dependency, so the
 * mark moves when the fragment does, including for an in-page jump that never
 * leaves the route.
 */

import { page } from '$app/state';

/** Whether the URL's fragment names the element with this id. */
export function isArriving(id: string): boolean {
	const hash = page.url.hash;
	return hash.length > 1 && hash.slice(1) === id;
}
