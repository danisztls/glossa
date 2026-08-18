<script lang="ts">
	import { goto } from '$app/navigation';
	import { parseReference, type ParsedBibleReference } from '$lib/refparse';
	import { resolveBookToken } from '$lib/book-token';
	import { cccParagraphExists, getCanonicalBook } from '$lib/corpus';
	import type { BibleBookMeta } from '$lib/corpus-index';
	import { content } from '$lib/content.svelte';
	import { t } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';

	// CCC scope for jump-box resolution: a single content language for now
	// (see `ccc/[n]` route) — once the reading route carries a language,
	// this should resolve against whichever the reader currently has open.
	const DEFAULT_CCC_LANG = 'en';

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

	/**
	 * Read `Jd 3` / `Philem 6` as a VERSE of a one-chapter book.
	 *
	 * Jude, Philemon, Obadiah, 2 and 3 John have no chapter to cite, so both
	 * languages cite them "Book <verse>" — `refs.ts` encodes the same
	 * convention for citation strings (`SINGLE_CHAPTER_BOOKS`). `refparse`
	 * can't apply it, being corpus-agnostic; here the resolved book says how
	 * many chapters it actually has, so a bare number that can't be a chapter
	 * is read as the verse it must be. A range typed without a verse
	 * separator (`jude 3-5`) rides along the same way — that is what
	 * `chapterEnd` exists for.
	 */
	function singleChapterFixup(book: BibleBookMeta, ref: ParsedBibleReference) {
		const only = book.chapters.length === 1 ? book.chapters[0].n : undefined;
		if (only !== undefined && ref.verse === undefined && ref.chapter !== only) {
			return { chapter: only, verse: ref.chapter, verseEnd: ref.chapterEnd };
		}
		return { chapter: ref.chapter, verse: ref.verse, verseEnd: ref.verseEnd };
	}

	/**
	 * Checked against the CANONICAL chapter union, not the matched edition:
	 * the destination is edition-free, so `gen 50` must be reachable when any
	 * edition has it. Without this, a plausible-but-wrong chapter (`gen 99`,
	 * or a Psalm the reader's numbering doesn't have) navigated to a
	 * prerendered page that doesn't exist — a 404 where the box could simply
	 * have said no match, and stayed open with the query still typed.
	 */
	function chapterExists(osis: string, chapter: number): boolean {
		return getCanonicalBook(osis)?.chapters.includes(chapter) ?? false;
	}

	function submit() {
		const ref = parseReference(query);
		notFound = false;

		if (ref.kind === 'ccc') {
			if (!cccParagraphExists(DEFAULT_CCC_LANG, ref.n)) {
				notFound = true;
				return;
			}
			closeBox();
			goto(`/catechismus/${ref.n}`);
			return;
		}

		if (ref.kind === 'bible') {
			// Edition-free target: `resolveBookToken` reads the token against
			// every edition (so "jo 3,16", "john 3:16" and "são joão 3,16" all
			// resolve), preferring the reader's own where two editions disagree
			// about what an abbreviation means — "jn" is John in English and
			// Jonas in Portuguese. The destination still names only the book and
			// chapter: which edition renders there is the reader's standing
			// preference, not this lookup's to decide.
			const resolved = resolveBookToken(ref.book, { preferWorkId: content.workIdFor('bible') });
			if (!resolved) {
				notFound = true;
				return;
			}

			const target = singleChapterFixup(resolved.book, ref);
			if (!chapterExists(resolved.book.osis, target.chapter)) {
				notFound = true;
				return;
			}

			// `refparse` has always understood "john 1:1-7"; the range end used
			// to be parsed and then dropped here. It now rides along as `?v=`,
			// the same shape citation links use (see `refHref`), so a typed
			// range highlights the passage instead of just landing on its
			// first verse.
			const hash = target.verse ? `#v${target.verse}` : '';
			const query =
				target.verse !== undefined &&
				target.verseEnd !== undefined &&
				target.verseEnd > target.verse
					? `?v=${target.verse}-${target.verseEnd}`
					: '';
			closeBox();
			goto(`/scriptura/${resolved.book.osis}/${target.chapter}${query}${hash}`);
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

<!--
	The trigger shows a short label (`jumpbox.short` — "Search"), not the
	full "Jump to… (e.g. john 3:16, ccc 1234)" placeholder. That long string
	is a teaching aid: it belongs where the reader is about to type, not
	sitting permanently in the header taking a third of the bar's width to
	explain a control nobody has activated yet. `aria-label` keeps the long
	form, since a screen-reader user gets no benefit from the visual brevity
	and does benefit from the examples.
-->
<button
	type="button"
	class="menu-trigger wide trigger"
	onclick={openBox}
	aria-haspopup="dialog"
	aria-label={t('jumpbox.placeholder')}
>
	<Icon name="search" />
	<span class="trigger-text" aria-hidden="true">{t('jumpbox.short')}</span>
	<kbd aria-hidden="true">/</kbd>
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
	/*
	 * The box comes from `.menu-trigger` (app.css) — same height, border, radius
	 * and background as every other control in the header — plus `.wide`, since
	 * this one carries a label and cannot be the fixed square the icon-only
	 * triggers are. This rule keeps ONLY what is specific to search.
	 *
	 * It used to redeclare the whole box with its own padding, which computed to
	 * about 32px tall against the others' 36px: the four-pixel step that made the
	 * header row look assembled rather than designed.
	 */
	.trigger {
		gap: 0.45rem;
		color: var(--color-text-muted);
		font-size: 0.9rem;
	}

	.trigger kbd {
		font-family: var(--font-sans);
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		padding: 0 0.35rem;
		font-size: 0.75rem;
	}

	/* The label is short enough now to survive most widths, but on a phone the
	   header still has five controls competing for one row — collapse to the
	   icon alone there, which conveys "search" on its own and keeps the same
	   activation target. The `/` hint goes too: there is no physical keyboard
	   to press it on. */
	@media (max-width: 640px) {
		.trigger-text,
		.trigger kbd {
			display: none;
		}

		/* With the label gone this is an icon button like the others, so it drops
		   `.wide`'s auto width and becomes the identical 2.25rem square. */
		.trigger {
			width: 2.25rem;
			padding-inline: 0;
		}
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

	/* `--color-bg-elevated`, not `--color-bg`: the dialog is already `--color-bg`,
	   so a field painted the same colour sits on the panel's own plane and is
	   held apart from it by nothing but a 1px border. The elevated token moves
	   in the right direction in every theme without needing a per-theme value —
	   warmer and slightly darker on light and sepia, lighter on dark — so the
	   field reads as a distinct surface either way. */
	input {
		width: 100%;
		font-size: 1.1rem;
		padding: 0.5rem 0.6rem;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: var(--color-bg-elevated);
		color: var(--color-text);
	}

	/*
	 * THE FOCUS INDICATOR MOVES INTO THE BORDER HERE, and this is the one place
	 * on the site where overriding the global ring is right.
	 *
	 * `app.css`'s `:focus-visible` is a 2px outline at a 2px offset. That is
	 * correct for buttons and links, which are focused in RESPONSE to the
	 * reader. This input is autofocused the moment the dialog opens, so the
	 * ring is the modal's resting state rather than a response to anything —
	 * and an offset rectangle drawn around an already-bordered rounded field
	 * stacks into a double frame that reads as an OS dialog rather than as part
	 * of the page.
	 *
	 * The indicator is NOT removed, it is relocated: the border itself turns
	 * ultramarine and gains a soft halo of the same colour. That still clears
	 * 1.4.11's 3:1 against the surfaces it edges by a wide margin (8.49:1 on
	 * light, 7.01:1 on sepia, 7.02:1 on dark, measured against the field
	 * background rather than the page).
	 *
	 * `outline: 2px solid transparent` rather than `outline: none` — under
	 * forced-colors the transparent outline is repainted in the user's own
	 * focus colour, so high-contrast mode keeps a real ring even though the
	 * halo below is dropped there.
	 */
	input:focus-visible {
		outline: 2px solid transparent;
		outline-offset: 2px;
		border-color: var(--color-apparatus);
		box-shadow: 0 0 0 3px color-mix(in srgb, var(--color-apparatus) 20%, transparent);
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
