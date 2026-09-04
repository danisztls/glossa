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

import { i18n } from './i18n.svelte';
import {
	baseLang,
	contentLangChain,
	defaultDocumentWorkId,
	defaultWorkId,
	getDocumentGroup,
	listEditions
} from './corpus';
import { readStoredJson, writeStoredJson } from './storage';

/**
 * `'prayer'` joins this union rather than getting a fourth `#documentOverrides`-
 * style side map: prayers are one canonical work per language, same as the
 * Compendium, so `workIdFor('prayer')`/`langFor('prayer')` already do the
 * right thing with no new code below -- unlike documents, which genuinely
 * need a per-slug override map because there's no single "the document
 * edition" (see this file's docblock).
 *
 * `'summa'` joins on the same terms, and is the member for which
 * `defaultWorkId` most visibly cannot return the reader's own language: the
 * work ships EN + LA and no Portuguese. That is handled entirely inside
 * `defaultWorkId` (see `corpus.ts`'s `CONTENT_LANG_FALLBACK`), so nothing
 * here changes. It is also where Latin becoming an interface language pays
 * off twice: a reader who sets the interface to Latin gets the Corpus
 * Thomisticum by default rather than by override, and the Supplementum still
 * falls back to English per address, because that fallback was never a
 * property of this store.
 *
 * `'social-doctrine'` joins on the Compendium's terms — one canonical work per
 * language, ten of them — and is the member whose absence is likeliest, since
 * twenty-four interface languages have no edition of it. That costs nothing
 * here either: `defaultWorkId` walks `CONTENT_LANG_FALLBACK` and answers
 * English, which is what every other work type already does for a reader the
 * corpus cannot meet in their own language.
 *
 * `'canon-law'` joins on those same terms, seven editions, and is the second
 * member after `'summa'` with no Portuguese: vatican.va publishes the Code in
 * Portuguese as a PDF and nothing here reads one. `CONTENT_LANG_FALLBACK`
 * answers English, and the Latin edition is the one a canonist would reach
 * for anyway — it is the only one of the seven that is not a translation.
 */
export type WorkTypeKey =
	'bible' | 'canon-law' | 'catechism' | 'compendium' | 'prayer' | 'social-doctrine' | 'summa';

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
	 * Whether an override still applies.
	 *
	 * ONE RULE FOR EVERY EDITION SINCE 2026-08-24, when Latin became an
	 * interface language (`UI_LANGS`, docs/decisions.md). Until then this
	 * method carried a second clause: an override naming an edition in a
	 * language the interface did not have — in practice the Clementine —
	 * survived every UI switch, because no UI language defaulted to it and so
	 * no interface event could be read as the reader changing their mind
	 * about Latin. That clause was an escape hatch for a reader the language
	 * menu could not serve. The menu serves them now: a reader who wants
	 * Latin picks Latin, and gets the Vulgate, the Summa's Latin and Latin
	 * chrome from one choice that persists on its own terms.
	 *
	 * What is left is the rule the module docblock states, applied to
	 * everything: an override is stamped with the UI language it was made
	 * under and goes dormant while the interface is elsewhere. It is not
	 * deleted, so returning to that language revives it.
	 */
	#stillApplies(override: Override): boolean {
		return override.forUiLang === i18n.lang;
	}

	/** The stored override for `type`, or undefined if there is none or it's stale (see module docblock). */
	#activeOverride(type: WorkTypeKey): Override | undefined {
		const override = this.#overrides[type];
		if (!override) return undefined;
		return this.#stillApplies(override) ? override : undefined;
	}

	/** Effective work id, e.g. "bible.matos-soares.pt" / "ccc.en". undefined if none. */
	workIdFor(type: WorkTypeKey): string | undefined {
		return this.#activeOverride(type)?.workId ?? defaultWorkId(type, i18n.lang);
	}

	/** Effective bare content language for a type, e.g. "pt". Falls back to i18n.lang. */
	langFor(type: WorkTypeKey): string {
		return baseLang(this.tagFor(type));
	}

	/**
	 * `langFor` WITHOUT the region dropped — `"en-GB"`, not `"en"`.
	 *
	 * The bare form is what almost every caller wants: it picks a citation
	 * grammar, a book-abbreviation table, a `lang` attribute. But it cannot
	 * tell `prayer.common.en-gb` from `prayer.common.en` (docs/decisions.md
	 * §Addresses and editions) — it answers "en" for both — and a route that keys its
	 * `byLang` map on the full tag needs the full tag back, or a reader who
	 * chose English (UK) silently reads the collection's USA wording on the
	 * five pages where the choice is the whole point.
	 */
	tagFor(type: WorkTypeKey): string {
		const workId = this.workIdFor(type);
		const edition = workId && listEditions(type).find((w) => w.id === workId);
		return edition ? edition.language : i18n.lang;
	}

	/**
	 * The ONE language a page presenting the Catechism and its Compendium
	 * together is in — `/catechismus`, which indexes both because they are one
	 * outline at two lengths.
	 *
	 * It cannot be `langFor` of either type, and the reason is the fallback:
	 * six languages carry one work and not the other (`la` and `mg` have the
	 * Catechism, `hu`/`ro`/`sl`/`sv` the Compendium), so `langFor('catechism')`
	 * answers "en" for a Hungarian reader and the page would then show an
	 * English Catechism column beside their Hungarian Compendium — an edition
	 * they did not ask for, next to one they did.
	 *
	 * So it reads the reader's EXPLICIT choice, from whichever of the two they
	 * have one for. Picking a language on that page writes an override for each
	 * work that HAS one and clears the other (`EditionMenu`), which is what
	 * keeps the two in step and what makes reading either of them here
	 * equivalent.
	 *
	 * WITH NO OVERRIDE IT WALKS `contentLangChain`, AND FOR TWO DAYS IT DID
	 * NOT — it answered `i18n.lang` outright, which is a language the pair may
	 * not exist in. `/catechismus` then rendered NOTHING: `getWork('ccc.pl')`
	 * and `getWork('compendium.pl')` are both undefined, so `columns` was
	 * empty, `tree` was empty, and `work` being undefined took the `ReadingBar`
	 * with it — a blank page with no edition menu on it, which is the one
	 * shape a reader cannot recover from, since the control that would have
	 * let them pick a language is the control that is missing. Twelve
	 * languages carry one of the two works; the interface has more, so
	 * TWENTY-TWO of them saw the blank page, `pl`, `ru` and `ar` included from
	 * the day this method was written.
	 *
	 * The chain is what the rest of the corpus already resolves through
	 * (`editionInLang`), so this is the same answer arrived at the same way —
	 * and it keeps the reason the method exists at all, because the chain
	 * stops at the reader's OWN language whenever that language has either
	 * work. A Hungarian reader still gets `hu` and a Compendium alone, never
	 * an English Catechism beside it; a Hebrew reader gets `en`, which is a
	 * fallback rather than a mismatch, because their language has neither.
	 *
	 * It asks both works per candidate rather than resolving each separately.
	 * That is the whole difference between this and `langFor`, and it is
	 * deliberate: one language for the page, chosen as the first one that can
	 * supply the page at all.
	 */
	catechismPairLang(): string {
		const chosen = this.overrideLangFor('catechism') ?? this.overrideLangFor('compendium');
		if (chosen) return chosen;
		for (const candidate of contentLangChain(i18n.lang)) {
			if (this.#hasEditionIn('catechism', candidate)) return candidate;
			if (this.#hasEditionIn('compendium', candidate)) return candidate;
		}
		return i18n.lang;
	}

	#hasEditionIn(type: WorkTypeKey, lang: string): boolean {
		return listEditions(type).some((w) => baseLang(w.language) === lang);
	}

	/** The bare language of an EXPLICIT override for `type`, or undefined when
	 *  the reader has never picked one — `tagFor` without the fallback. */
	overrideLangFor(type: WorkTypeKey): string | undefined {
		const workId = this.#activeOverride(type)?.workId;
		if (!workId) return undefined;
		const edition = listEditions(type).find((w) => w.id === workId);
		return edition ? baseLang(edition.language) : undefined;
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
		// Same staleness rule as `#activeOverride`, for the same reason: two
		// rules that differ only by which map they read is how they drift
		// apart. It no longer needs the slug's edition list to decide —
		// `#stillApplies` stopped asking what language the picked edition is
		// in when Latin joined `UI_LANGS`.
		const active = override && this.#stillApplies(override) ? override : undefined;
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
