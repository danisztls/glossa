/**
 * Effective content edition per work type — the edition/version selector's
 * store (EditionMenu.svelte is the consumer).
 *
 * Reverses the original "UI language is independent of content language"
 * decision — see the rewritten docblock in `i18n.svelte.ts` and the
 * docs/decisions.md entry this change calls for (reported alongside this
 * module). With no explicit override, the content edition for each work
 * type follows the UI language via `corpus.defaultWorkId(type, i18n.lang)`.
 * An explicit override — the reader deliberately picking an edition, e.g.
 * the Portuguese Matos Soares Bible while reading an English interface — is
 * remembered, but only for as long as the UI language it was chosen under
 * stays current (stored as `{ workId, forUiLang }`). That's what makes
 * "switching the interface language switches the content language" hold
 * even for readers who've made an explicit pick: the override doesn't
 * survive a language switch, so the next read falls through to the new
 * language's default again instead of silently keeping a stale edition in
 * the wrong-looking language.
 *
 * Backed by `$state` in a `.svelte.ts` module (not a plain object/closure)
 * so reads inside components stay reactive both to the override changing
 * and to `i18n.lang` changing underneath it — every getter below reads
 * `i18n.lang` itself rather than caching it, which is what makes that work.
 */

import { i18n } from './i18n.svelte';
import { baseLang, defaultWorkId, listEditions } from './corpus';

export type WorkTypeKey = 'bible' | 'catechism' | 'compendium';

interface Override {
	workId: string;
	/** The UI language this override was made under; the override is ignored once `i18n.lang` moves past it. */
	forUiLang: string;
}

type OverrideMap = Partial<Record<WorkTypeKey, Override>>;

const STORAGE_KEY = 'depositum:content-override';

function readStored(): OverrideMap {
	if (typeof localStorage === 'undefined') return {};
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return {};
		const parsed: unknown = JSON.parse(raw);
		return parsed && typeof parsed === 'object' ? (parsed as OverrideMap) : {};
	} catch {
		// Corrupt/foreign localStorage value — behave as if nothing were stored
		// rather than throwing during module init.
		return {};
	}
}

function writeStored(overrides: OverrideMap) {
	if (typeof localStorage === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

class ContentStore {
	#overrides: OverrideMap = $state(readStored());

	/** The stored override for `type`, or undefined if there is none or it's stale (see module docblock). */
	#activeOverride(type: WorkTypeKey): Override | undefined {
		const override = this.#overrides[type];
		return override && override.forUiLang === i18n.lang ? override : undefined;
	}

	/** Effective work id, e.g. "bible.matos-soares.pt" / "ccc.en". undefined if none. */
	workIdFor(type: WorkTypeKey): string | undefined {
		return this.#activeOverride(type)?.workId ?? defaultWorkId(type, i18n.lang);
	}

	/** Effective bare content language for a type, e.g. "pt". Falls back to i18n.lang. */
	langFor(type: WorkTypeKey): string {
		const workId = this.workIdFor(type);
		const edition = workId && listEditions(type).find((w) => w.id === workId);
		return edition ? baseLang(edition.language) : i18n.lang;
	}

	/** Set (or clear, with null) the reader's explicit edition override. */
	set(type: WorkTypeKey, workId: string | null) {
		const next: OverrideMap = { ...this.#overrides };
		if (workId === null) {
			delete next[type];
		} else {
			next[type] = { workId, forUiLang: i18n.lang };
		}
		this.#overrides = next;
		writeStored(next);
	}
}

export const content = new ContentStore();
