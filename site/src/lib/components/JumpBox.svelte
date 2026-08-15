<script lang="ts">
	import { goto } from '$app/navigation';
	import { parseReference } from '$lib/refparse';
	import { findBookByAbbrev, getCccParagraph, listBibleWorks, workIdToEdition } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';

	// CCC scope for jump-box resolution: a single content language for now
	// (see `ccc/[n]` route) — once the reading route carries a language,
	// this should resolve against whichever the reader currently has open.
	const DEFAULT_CCC_LANG = 'en';

	/**
	 * Bible resolution tries every Bible work present in the corpus and
	 * returns the first whose abbrevs match, so e.g. `jo 3,16` (a
	 * Matos Soares-only abbreviation) and `john 3:16` (a CPDV-only one) each
	 * resolve against the edition that actually recognizes them.
	 */
	function resolveBibleBook(token: string) {
		for (const work of listBibleWorks()) {
			const book = findBookByAbbrev(work.id, token);
			if (book) return { workId: work.id, book };
		}
		return undefined;
	}

	let open = $state(false);
	let query = $state('');
	let notFound = $state(false);
	let inputEl: HTMLInputElement | undefined = $state();

	function isTypingTarget(el: EventTarget | null): boolean {
		if (!(el instanceof HTMLElement)) return false;
		const tag = el.tagName;
		return tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable;
	}

	function openBox() {
		open = true;
		notFound = false;
		query = '';
		queueMicrotask(() => inputEl?.focus());
	}

	function closeBox() {
		open = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		if (open) {
			if (e.key === 'Escape') closeBox();
			return;
		}
		const isSlash = e.key === '/' && !isTypingTarget(e.target);
		const isCtrlK = (e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey);
		if (isSlash || isCtrlK) {
			e.preventDefault();
			openBox();
		}
	}

	function submit() {
		const ref = parseReference(query);
		notFound = false;

		if (ref.kind === 'ccc') {
			const paragraph = getCccParagraph(DEFAULT_CCC_LANG, ref.n);
			if (!paragraph) {
				notFound = true;
				return;
			}
			closeBox();
			goto(`/ccc/${ref.n}`);
			return;
		}

		if (ref.kind === 'bible') {
			const resolved = resolveBibleBook(ref.book);
			if (!resolved) {
				notFound = true;
				return;
			}
			const edition = workIdToEdition(resolved.workId);
			const hash = ref.verse ? `#v${ref.verse}` : '';
			closeBox();
			goto(`/bible/${edition}/${resolved.book.osis}/${ref.chapter}${hash}`);
			return;
		}

		notFound = true;
	}

	function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		submit();
	}
</script>

<svelte:window onkeydown={onWindowKeydown} />

<button type="button" class="trigger" onclick={openBox} aria-haspopup="dialog">
	<span aria-hidden="true">🔎</span>
	<span>{t('jumpbox.placeholder')}</span>
	<kbd>/</kbd>
</button>

{#if open}
	<div class="backdrop" role="presentation" onclick={closeBox}>
		<div
			class="dialog"
			role="dialog"
			aria-modal="true"
			aria-label={t('jumpbox.placeholder')}
			tabindex="-1"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
		>
			<form onsubmit={onSubmit}>
				<input
					bind:this={inputEl}
					bind:value={query}
					type="text"
					placeholder={t('jumpbox.placeholder')}
					autocomplete="off"
					spellcheck="false"
				/>
			</form>
			<p class="hint">{t('jumpbox.hint')}</p>
			{#if notFound}
				<p class="not-found">{t('jumpbox.noMatch')}: “{query}”</p>
			{/if}
		</div>
	</div>
{/if}

<style>
	.trigger {
		display: inline-flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.4rem 0.75rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: var(--color-bg-elevated);
		color: var(--color-text-muted);
		font-size: 0.9rem;
		cursor: pointer;
	}

	.trigger kbd {
		font-family: var(--font-sans);
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		padding: 0 0.35rem;
		font-size: 0.75rem;
	}

	.backdrop {
		position: fixed;
		inset: 0;
		background: rgb(0 0 0 / 35%);
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding-top: 12vh;
		z-index: 100;
	}

	.dialog {
		width: min(32rem, 90vw);
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		box-shadow: 0 10px 40px rgb(0 0 0 / 25%);
		padding: 1rem;
	}

	input {
		width: 100%;
		font-size: 1.1rem;
		padding: 0.5rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: var(--color-bg);
		color: var(--color-text);
	}

	.hint {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.not-found {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: var(--color-accent);
	}
</style>
