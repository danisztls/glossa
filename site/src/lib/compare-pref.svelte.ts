/**
 * Compare-mode preference: whether the reader wants two editions side by
 * side, and which edition goes in the second column. Persisted to
 * localStorage, alongside theme (`theme.svelte.ts`), reading size
 * (`prefs.svelte.ts`) and content language (`content.svelte.ts`).
 *
 * WHY THIS EXISTS RATHER THAN THE URL ALONE. Compare mode shipped as
 * `?compare=1` on the current page and nothing else, which meant it
 * survived exactly as long as the reader stayed on that page: every
 * internal link on the site — next chapter, a citation, a table-of-contents
 * row — is a plain href with no query string, so following any of them
 * silently dropped back to one column. A reader comparing two editions is
 * not comparing one verse; they are reading that way, and having to
 * re-enable it at every chapter boundary is the feature not working.
 *
 * The fix is to treat it as what it is: a READING PREFERENCE, the same kind
 * of thing as the theme or the text size, none of which live in the URL
 * either. Rewriting every internal link to carry the parameter was the
 * alternative and is worse on every axis — it touches every link-generating
 * site in the codebase, it silently fails for any link added later, and it
 * puts a preference into addresses that get shared and bookmarked.
 *
 * THE URL PARAMETER STILL WORKS, and still means something specific: it is
 * how a comparison gets SHARED. A link carrying `?compare=…` opens in
 * compare mode regardless of what the recipient's stored preference says,
 * and (see `syncFromUrl`) adopts it as their preference from then on. So
 * the address bar remains an override and an entry point; it just stops
 * being the only place the state lives.
 *
 * WHAT IS STORED IS A TARGET, NOT A BOOLEAN — `undefined` for off, and
 * otherwise either a work id or the `AUTO` sentinel. That is what lets the
 * preference survive moving between works: a Bible edition id means nothing
 * on a Catechism page, so a reader who turned compare on in the Bible and
 * navigated to the CCC would otherwise land in an unsatisfiable state.
 * `AUTO` means "whichever second edition this route would have picked
 * anyway", which is meaningful everywhere, and a stored work id that isn't
 * available on the current route degrades to it rather than switching
 * compare off (`resolveTarget`) — same "degrade, don't fabricate, don't
 * silently drop the reader's intent" posture as the rest of the site.
 */

import { COMPARE_PARAM } from './compare';
import { readStoredString, writeStoredString } from './storage';

const STORAGE_KEY = 'glossa:compare';

/** "Whichever edition this route picks on its own" — see the module docblock
 *  on why a stored work id alone would not survive navigating between works. */
export const AUTO = 'auto';

class CompareStore {
	/** `undefined` = compare off. Otherwise `AUTO` or a specific work id. */
	target: string | undefined = $state(readStoredString(STORAGE_KEY));

	get active(): boolean {
		return this.target !== undefined;
	}

	set(target: string | undefined) {
		this.target = target;
		writeStoredString(STORAGE_KEY, target);
	}

	/** Turn compare on (defaulting to `AUTO`) or off. */
	toggle() {
		this.set(this.active ? undefined : AUTO);
	}

	/**
	 * Adopt a `?compare=` parameter as the preference.
	 *
	 * Called from reading routes on navigation, guarded by `browser` in
	 * `compare-nav.svelte.ts`. That guard dates from the era when every
	 * route was prerendered and reading `searchParams` server-side threw,
	 * because one prerendered file served every query string that points at
	 * it (see `bible/[book]/[chapter]/+page.svelte`'s `citedRange` docblock,
	 * which documents that trap for `?v=`). Since the site became one SPA
	 * shell with `ssr = false` (`+layout.ts`, docs/decisions.md 2026-08-18)
	 * no route component runs during the build at all, so the guard is now
	 * belt-and-braces rather than load-bearing — kept because it states the
	 * requirement, not because this can run server-side.
	 *
	 * Absence of the parameter is NOT "turn compare off": almost every page
	 * the reader reaches has no parameter, because internal links don't carry
	 * one, and treating that as an instruction would recreate exactly the bug
	 * this module exists to fix. Only an explicit `?compare=0` turns it off,
	 * which gives a shareable "open this WITHOUT compare mode" link for a
	 * reader whose stored preference has it on.
	 */
	syncFromUrl(url: URL) {
		const raw = url.searchParams.get(COMPARE_PARAM);
		if (raw === null) return;
		if (raw === '0') this.set(undefined);
		// `1` was the original on/off-only spelling and still means "on,
		// route's choice of edition" — links using it predate the target and
		// must keep working.
		else this.set(raw === '1' ? AUTO : raw);
	}

	/**
	 * The `?compare=` value that reproduces this preference as a shareable
	 * link — the encode side of `syncFromUrl` above. `undefined` when compare
	 * is off (no param at all, never `compare=0`: a link with no param is the
	 * common, unremarkable case — see `syncFromUrl`'s own reasoning for why
	 * absence must stay silent rather than becoming a loud "off" marker).
	 * `AUTO` encodes as the original `'1'` spelling rather than the literal
	 * string `'auto'`, so the common "just compare, route's choice" case keeps
	 * producing the short, already-familiar address instead of a newer,
	 * longer one nothing about the reader's intent actually calls for.
	 */
	get paramValue(): string | undefined {
		if (this.target === undefined) return undefined;
		return this.target === AUTO ? '1' : this.target;
	}

	/**
	 * Which edition to actually compare against on a route offering
	 * `available` work ids, given `fallback` (what that route would pick on
	 * its own). `undefined` when compare is off, or when the route has no
	 * second edition to offer at all — in which case the preference is left
	 * untouched, so it takes effect again on the next page that does.
	 */
	resolveTarget(available: string[], fallback: string | undefined): string | undefined {
		if (!this.active) return undefined;
		if (this.target !== AUTO && this.target !== undefined && available.includes(this.target)) {
			return this.target;
		}
		return fallback;
	}
}

export const compare = new CompareStore();
