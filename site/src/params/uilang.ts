import { isUiLang } from '$lib/ui-langs';

/**
 * Matches `/pt`, `/ar`, `/la` — an interface language naming itself in a path.
 *
 * A matcher rather than a check inside the route, because without one
 * `[uilang]` would swallow `/scriptura` and every other top-level path and
 * answer them with the wrong page. The list is `UI_LANGS` through `isUiLang`,
 * never a literal: the set has changed four times since 2026-08-24 and a
 * second copy is a second answer.
 *
 * Only the seven chrome pages live under it (`CHROME_PATHS`). A reading
 * address takes no language prefix — it names a citation, which is the same
 * citation in every language.
 */
export function match(param: string): boolean {
	return isUiLang(param);
}
