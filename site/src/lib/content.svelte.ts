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
 *
 * DOCUMENTS GET A SECOND, PARALLEL OVERRIDE MAP (`#documentOverrides`),
 * NOT A FOURTH `WorkTypeKey`: the three keys above each name a work TYPE
 * with a small, fixed edition list (`listEditions('bible')` etc.) — but a
 * document "type" is really N independent works, one per slug
 * (`corpus.ts`'s `DocumentGroup`), each with its own EN/PT pair. There's no
 * single "the document edition" to remember; there's one per slug a reader
 * might have opened. So the override key here is the document's `slug`,
 * not a `WorkTypeKey`, and `documentWorkIdFor`/`documentLangFor`/
 * `setDocument` are `WorkTypeKey`'s siblings, not implemented in terms of
 * it — but same shape, same staleness rule, same reasoning throughout.
 */

import { i18n, isUiLang } from './i18n.svelte';
import {
	baseLang,
	defaultDocumentWorkId,
	defaultWorkId,
	getDocumentGroup,
	listEditions
} from './corpus';
import { readStoredJson, writeStoredJson } from './storage';
import type { WorkManifest } from './types';

/**
 * `'prayer'` joins this union rather than getting a fourth `#documentOverrides`-
 * style side map: prayers are one canonical work per language, same as the
 * Compendium, so `workIdFor('prayer')`/`langFor('prayer')` already do the
 * right thing with no new code below -- unlike documents, which genuinely
 * need a per-slug override map because there's no single "the document
 * edition" (see this file's docblock).
 *
 * `'summa'` joins on the same terms, and is the first member for which
 * `defaultWorkId` cannot return the reader's own language: the work ships
 * EN + LA and no Portuguese. That is handled entirely inside `defaultWorkId`
 * (see `corpus.ts`'s `CONTENT_LANG_FALLBACK`), so nothing here changes --
 * but note the consequence for `#stillApplies`: a Portuguese reader's
 * effective Summa edition is English, English IS a UI language, so an
 * explicit pick of the Latin Summa persists across UI switches while a pick
 * of the English one does not. That is the intended reading of the Latin
 * rule, not an accident of this work having no Portuguese.
 */
export type WorkTypeKey = 'bible' | 'catechism' | 'compendium' | 'prayer' | 'summa';

interface Override {
	workId: string;
	/** The UI language this override was made under; the override is ignored once `i18n.lang` moves past it. */
	forUiLang: string;
}

type OverrideMap = Partial<Record<WorkTypeKey, Override>>;
/** Slug -> override, the document analogue of `OverrideMap` (see module docblock). */
type DocumentOverrideMap = Record<string, Override>;

const STORAGE_KEY = 'glossa:content-override';
const DOCUMENT_STORAGE_KEY = 'glossa:content-override-documents';

/**
 * `readStoredJson` already returns the `{}` fallback for "unavailable",
 * "absent" and "malformed JSON" — what it can't know is our shape, so a
 * stored value that parsed fine but isn't an override map (e.g. foreign
 * localStorage content that happens to be valid JSON) still needs this
 * extra check rather than being cast and trusted.
 */
function readStored(): OverrideMap {
	const parsed = readStoredJson<unknown>(STORAGE_KEY, {});
	return parsed && typeof parsed === 'object' ? (parsed as OverrideMap) : {};
}

function readDocumentStored(): DocumentOverrideMap {
	const parsed = readStoredJson<unknown>(DOCUMENT_STORAGE_KEY, {});
	return parsed && typeof parsed === 'object' ? (parsed as DocumentOverrideMap) : {};
}

class ContentStore {
	#overrides: OverrideMap = $state(readStored());
	#documentOverrides: DocumentOverrideMap = $state(readDocumentStored());

	/**
	 * Whether an override still applies, given the language of the edition it
	 * names.
	 *
	 * The reset-on-UI-switch rule (module docblock) exists so that a reader
	 * who picked the Portuguese Bible under an English interface, then
	 * deliberately switches the interface to Portuguese, gets Portuguese
	 * content throughout rather than a stale pick. That reasoning holds only
	 * while the picked language is one the interface *has*.
	 *
	 * Latin breaks that premise rather than the mechanism. No UI language
	 * will ever default to the Latin Bible, so for a reader who wants it the
	 * override is not an escape hatch from a sensible default — it is the
	 * only path to the text they came for, and there is no interface event
	 * that should be read as "they changed their mind about Latin." So an
	 * override whose own language is not a UI language persists until the
	 * reader changes it, and everything else keeps the old rule exactly.
	 */
	#stillApplies(override: Override, editions: WorkManifest[]): boolean {
		const picked = editions.find((w) => w.id === override.workId);
		if (picked && !isUiLang(baseLang(picked.language))) return true;
		return override.forUiLang === i18n.lang;
	}

	/** The stored override for `type`, or undefined if there is none or it's stale (see module docblock). */
	#activeOverride(type: WorkTypeKey): Override | undefined {
		const override = this.#overrides[type];
		if (!override) return undefined;
		return this.#stillApplies(override, listEditions(type)) ? override : undefined;
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
		writeStoredJson(STORAGE_KEY, next);
	}

	/** Document analogue of `workIdFor`, keyed by the document's `slug` rather than a `WorkTypeKey` — see module docblock. */
	documentWorkIdFor(slug: string): string | undefined {
		const override = this.#documentOverrides[slug];
		// Same staleness rule as `#activeOverride`, for the same reason. No
		// document has a Latin edition yet, but the rule belongs to the
		// override rather than to the work type, and two rules that differ
		// only by which map they read is how they drift apart.
		const editions = override
			? (Object.values(getDocumentGroup(slug)?.manifests ?? {}).filter(
					(m) => m !== undefined
				) as WorkManifest[])
			: [];
		const active = override && this.#stillApplies(override, editions) ? override : undefined;
		return active?.workId ?? defaultDocumentWorkId(slug, i18n.lang);
	}

	/** Document analogue of `langFor`. */
	documentLangFor(slug: string): string {
		const workId = this.documentWorkIdFor(slug);
		const group = workId ? getDocumentGroup(slug) : undefined;
		const manifest = group && Object.values(group.manifests).find((m) => m?.id === workId);
		return manifest ? baseLang(manifest.language) : i18n.lang;
	}

	/** Document analogue of `set`. */
	setDocument(slug: string, workId: string | null) {
		const next: DocumentOverrideMap = { ...this.#documentOverrides };
		if (workId === null) {
			delete next[slug];
		} else {
			next[slug] = { workId, forUiLang: i18n.lang };
		}
		this.#documentOverrides = next;
		writeStoredJson(DOCUMENT_STORAGE_KEY, next);
	}
}

export const content = new ContentStore();
