<script lang="ts">
	/**
	 * The jump box: a combobox over the whole canonical address space.
	 *
	 * It was a parser with a text field in front of it — type a finished
	 * citation, press Enter, navigate or be told "no match". That still works
	 * and is still the fastest path for a reader who knows the address, but it
	 * was the ONLY path, and three quarters of the corpus has no address a
	 * reader would ever type: a document, a prayer and a Summa question are
	 * reached by name, and nobody types `/documenta/lumen-gentium`.
	 *
	 * `suggest.ts` answers that half — what the fragment could become, in the
	 * reader's own citation grammar — and this component is its keyboard and
	 * its list. The parser is still here and still runs on Enter, as the
	 * fallback for a shape the suggester declined to complete (see `submit`);
	 * what changed is that the reader can now SEE where they are about to go
	 * before they commit to it, which is the only thing that makes a divergent
	 * Psalm number (`suggest.ts`'s docblock) a choice rather than a surprise.
	 *
	 * WHY `aria-activedescendant` AND NOT ROVING FOCUS. Focus must stay in the
	 * text field — the reader is still typing — so the active option is named
	 * rather than focused, which is the combobox pattern's whole point. The
	 * options are therefore not tabbable and are moved through with the arrow
	 * keys alone; a mouse still clicks them directly.
	 */
	import { goto } from '$app/navigation';
	import { revealRow } from '$lib/reveal-row';
	import { hrefFor } from '$lib/address';
	import { parseReference, type ParsedBibleReference } from '$lib/refparse';
	import { resolveBookToken } from '$lib/book-token';
	import { usage } from '$lib/usage';
	import {
		cccParagraphExists,
		getCanonicalBook,
		loadQuaestiones,
		loadSectionHeadings,
		prayerIndexLang
	} from '$lib/corpus';
	import type { SectionHeadings } from '$lib/section-headings';
	import { availableSpecimens } from '$lib/specimens';
	import type { TopicIndex } from '$lib/types';
	import { ensureAllIndexes, type BibleBookMeta } from '$lib/corpus-index';
	import { content } from '$lib/content.svelte';
	import type { suggest as suggestFn } from '$lib/suggest';
	import { highlight } from '$lib/highlight';
	import { i18n, t } from '$lib/i18n.svelte';
	import { isOverlayOpen, isTypingTarget } from '$lib/shortcuts';
	import Icon from './Icon.svelte';

	// CCC scope for jump-box resolution: a single content language for now
	// (see `ccc/[n]` route) — once the reading route carries a language,
	// this should resolve against whichever the reader currently has open.
	const DEFAULT_CCC_LANG = 'en';

	let open = $state(false);
	let query = $state('');
	let notFound = $state(false);
	/** Index into `suggestions`, or -1 for "nothing chosen yet". Enter then
	 *  falls through to the parser, which is the behaviour that predates the
	 *  list and the one a reader typing a full citation still expects. */
	let active = $state(-1);
	let inputEl: HTMLInputElement | undefined = $state();
	let dialogEl: HTMLDialogElement | undefined = $state();
	let listEl: HTMLUListElement | undefined = $state();

	/**
	 * The suggester and its loose matcher both arrive after the box does.
	 *
	 * `fuzzysort` is 7.5 KB gzipped and this component sits in the layout
	 * header, so a static import would put it in the boot chunk of every route
	 * — paid by every reader for a tier only some of them reach. It is fetched
	 * when the box first opens instead, which is hundreds of milliseconds
	 * before anyone has typed the three characters `suggest.ts` requires before
	 * it consults a matcher at all, and it stays in the shell precache
	 * afterwards (`sw-policy.ts` takes every build asset that is not corpus
	 * content), so the second open and every offline one are instant.
	 *
	 * `SUGGEST.TS` ITSELF NOW COMES THE SAME WAY, and it is the far larger half
	 * of that argument: it reaches `refs-grammar.ts` (186 KB of source) and
	 * `titles.ts` (49 KB), and this component is rendered — not merely
	 * importable — by the root layout on every route, so all of it was
	 * synchronous boot-chunk code standing behind a `{#if open}` that is false
	 * until a reader reaches for the box. Deferring `fuzzysort` while statically
	 * importing the module that CONSUMES it was saving the 7.5 KB and paying the
	 * 235 KB behind it.
	 *
	 * `suggester` is `undefined` until the box has been opened once, which is
	 * exactly the window in which `suggestions` must be empty anyway: nothing
	 * can be suggested for a box nobody has opened.
	 *
	 * `fuzzyReady` exists only to re-run the query: injecting the ranker
	 * mutates module state that `$derived` cannot see, and without a signal a
	 * list already on screen would keep the answer it computed a moment before
	 * the matcher landed. `suggester` lands through `$state` and so needs no
	 * such signal — reading it in `suggestions` is the dependency.
	 */
	let fuzzyReady = $state(false);
	let suggester: typeof suggestFn | undefined = $state();
	/**
	 * The two tables `suggest()` cannot read for itself, fetched with the
	 * suggester and handed to it as arguments.
	 *
	 * `headings` is the reader's own shard — every heading printed inside a
	 * document, the Code and the Compendium of the Social Doctrine, in the
	 * edition each will open in (`$lib/section-headings.ts`). `topics` is
	 * which questions this build published; what is MATCHED for them is in
	 * the dictionaries, which are resident already.
	 *
	 * Both land through `$state`, so the list re-derives when they arrive and
	 * neither needs a `fuzzyReady`-style signal. Both are reloaded whenever
	 * the box opens under a language they were not fetched for — the shard is
	 * per language, and a reader who switches would otherwise keep completing
	 * headings in the one they left.
	 */
	let headings: SectionHeadings | undefined = $state();
	let topics: TopicIndex | undefined = $state();
	let loadedFor: string | undefined;

	async function loadSuggester() {
		void loadTables();
		if (suggester && fuzzyReady) return;
		// Both in flight at once: neither needs the other to be fetched, and the
		// ranker is injected into the module rather than passed to it.
		// `ensureAllIndexes` and not a narrowed set: the suggester ranges over the
		// whole address space by definition — a fragment can become a chapter, a
		// paragraph, a question, a document or a prayer, and which one is the
		// answer, not the question.
		const [{ setFuzzyRanker, suggest }, { default: fuzzysort }] = await Promise.all([
			import('$lib/suggest'),
			import('fuzzysort'),
			ensureAllIndexes()
		]);
		setFuzzyRanker((needle, haystack) =>
			fuzzysort
				// 0.3, NOT fuzzysort's default 0.5, and the number is measured
				// rather than taste. fuzzysort penalises by target length, and this
				// corpus's names are long: a real typo lands between 0.33 and 0.39
				// ("rerm novarum" 0.386, "magnifca" 0.345, "sacrosanctm" 0.337,
				// "rosry" 0.336), so 0.5 found four of sixteen plausible
				// misspellings and 0.35 found ten. Swept over a battery of
				// sixteen typos and thirteen queries whose literal reading must
				// not move, 0.3 is the knee: fourteen right answers on top, no
				// literal row displaced, and queries that already had a good
				// answer gain almost no rows. 0.25 is where the first regression
				// appears and the lists start filling with noise.
				//
				// `limit` is generous rather than tight: `suggest.ts` caps rows per
				// kind afterwards, and a cap applied before scoring would silently
				// drop the good match sitting behind forty documents that happen to
				// share a letter.
				.go(needle, haystack, { key: 'text', limit: 40, threshold: 0.3 })
				.map((hit) => ({ index: hit.obj.index, score: hit.score }))
		);
		fuzzyReady = true;
		suggester = suggest;
	}

	/** The per-language half of the load, kept apart because it has to be able
	 *  to run again: the suggester and the ranker are the same in every
	 *  language and are fetched once. */
	async function loadTables() {
		const lang = i18n.lang;
		if (loadedFor === lang) return;
		loadedFor = lang;
		const [shard, published] = await Promise.all([loadSectionHeadings(lang), loadQuaestiones()]);
		// Guard against a slower earlier language landing last.
		if (loadedFor !== lang) return;
		headings = shard;
		topics = published;
	}

	/**
	 * Recomputed on every keystroke, from indexes already in memory — no fetch,
	 * no debounce. `content.workIdFor`/`langFor` are read here rather than
	 * inside `suggest` so the store stays the component's dependency and the
	 * suggester stays a pure function of its arguments.
	 */
	const suggestions = $derived.by(() => {
		// Read so the list recomputes when the loose matcher lands — see
		// `fuzzyReady`. The value itself says nothing this expression wants.
		void fuzzyReady;
		return open && suggester
			? suggester(query, {
					lang: i18n.lang,
					bibleWorkId: content.workIdFor('bible'),
					cccLang: content.langFor('catechism'),
					compendiumLang: content.langFor('compendium'),
					// The INDEX edition, not the reading one: `prayer.common.en-gb`
					// is five prayers and nothing else, so indexing off it would
					// offer a reader who prefers English (UK) five of the
					// twenty-eight they can actually reach (`corpus.ts`'s
					// `prayerIndexLang`).
					prayerLang: prayerIndexLang(content.langFor('prayer')),
					socialDoctrineLang: content.langFor('social-doctrine'),
					canonLawLang: content.langFor('canon-law'),
					summaLang: content.langFor('summa'),
					headings,
					topics
				})
			: [];
	});

	/**
	 * THE EMPTY BOX TEACHES, BECAUSE IT IS THE ONE STATE WITH ROOM TO.
	 *
	 * A reader who opens this box sees a field and, under it, forty rems of
	 * nothing until they type. What that space held was a placeholder with two
	 * examples crammed into it — `Jump to… (e.g. john 3:16, ccc 1234)` — which
	 * is a sentence truncated on every phone, teaching two of the seven
	 * notations this corpus is addressed by.
	 *
	 * So the notations go in the panel, one row per work, and the placeholder
	 * goes back to naming the field. `$lib/specimens.ts` holds the table and
	 * says why it is a module: this is the fourth surface to teach it.
	 *
	 * IT IS THE FIRST OPEN THAT SEES THEM, mostly, which is the other half of
	 * the query surviving a close (`openBox`). A reader with a query in the
	 * field gets their own results back instead, so the lesson shows to
	 * somebody who has not used the box and gets out of the way of everybody
	 * who has.
	 *
	 * `fuzzyReady` is read for its signal and not its value: the gate below is
	 * `listWorksOfType`, which reads a registry no rune watches, and the load
	 * that fills it is the same `ensureAllIndexes()` this flag waits on.
	 * Without it the legend computed once against an empty registry and stayed
	 * empty for the life of the page.
	 */
	const examples = $derived.by(() => {
		void fuzzyReady;
		return availableSpecimens(content.workIdFor('bible'), content.langFor('bible'));
	});

	/**
	 * A specimen goes into the FIELD and nowhere else.
	 *
	 * `/schola` and the home page draw the same forms and leave them inert,
	 * for a reason that holds here too: `CCC 1234` is a meaningful citation,
	 * so an example that navigated would drop a reader who is being taught a
	 * form into the middle of a work they did not choose. What this box has
	 * that neither page has is somewhere better to put it — the reader sees
	 * the list answer under their own eyes and still presses Enter themselves.
	 *
	 * The caret goes to the end, where Tab-completion already leaves it: the
	 * number is the part a reader will want to change, and it is the part at
	 * the end.
	 */
	function fillExample(text: string) {
		query = text;
		active = -1;
		notFound = false;
		inputEl?.focus();
		queueMicrotask(() => inputEl?.setSelectionRange(query.length, query.length));
	}

	// The active row cannot outlive the list it indexes: a keystroke that
	// shortens the results would otherwise leave `aria-activedescendant`
	// pointing at an option that no longer exists.
	$effect(() => {
		if (active >= suggestions.length) active = -1;
	});

	function optionId(index: number): string {
		return `jump-option-${index}`;
	}

	/**
	 * `showModal()`, not an `open` flag on the element: only the modal form
	 * puts the dialog in the top layer, renders `::backdrop`, makes the rest
	 * of the document inert, and TRAPS FOCUS — which is what this box lacked
	 * as a pair of divs, where Tab walked straight out of the modal and into
	 * the page behind it.
	 *
	 * `open` mirrors that rather than driving it. The element is always in the
	 * DOM (a closed `<dialog>` is `display: none`), because `showModal()`
	 * needs something to be called on; the flag is only here so the shortcut
	 * handler below can tell whether the box is up, so `inputEl` is bound
	 * before the box opens rather than a microtask later, and so the
	 * suggester does no work for a box nobody is looking at.
	 */
	function openBox() {
		notFound = false;
		active = -1;
		open = true;
		void loadSuggester();
		dialogEl?.showModal();
		// `showModal()` focuses the first focusable descendant, which is this
		// input — said explicitly because that is a fact about the field's
		// position in the markup, and a close button added above it one day
		// would silently take the focus instead.
		inputEl?.focus();
		/*
		 * THE QUERY SURVIVES THE CLOSE, and this is what makes that bearable.
		 *
		 * It was cleared here, so every open started from nothing: a reader who
		 * jumped to `John 3:16`, read it, and came back for `John 3:17` retyped
		 * the book. A reader whose spelling missed had to retype the whole
		 * attempt to fix one letter. Neither is a query the box should be
		 * making them say twice — and the parser's own history was the thing
		 * the reader was reaching back for.
		 *
		 * Selecting it is the half that keeps a NEW query cheap: the old text
		 * is replaced by the first character typed, so nothing has to be
		 * cleared by hand, while Enter, the arrows and an edit to one letter
		 * all still have it. That is what a browser's own address bar does on
		 * focus, for the same two cases.
		 */
		inputEl?.select();
	}

	function closeBox() {
		dialogEl?.close();
	}

	/**
	 * Escape, a `close()` call, and a backdrop click all end up here. Nothing
	 * dismisses this box without firing `close`, so this is the only place
	 * `open` is ever cleared.
	 */
	function onClose() {
		open = false;
	}

	function onWindowKeydown(e: KeyboardEvent) {
		// Escape is the dialog's own, and reaches it whether or not focus is
		// inside — which is the fix for a real defect, not a tidy-up: the old
		// markup stopped keydown propagation at the panel, so Escape typed in
		// the field (where focus always is) never reached the window handler
		// that was supposed to act on it, and the box could only be dismissed
		// by clicking the backdrop.
		// `open` alone was the guard until the shortcut sheet joined the three
		// dialogs: `showModal()` leaves a window keydown firing, so every
		// overlay has to be excluded, not only this component's own.
		if (open || isOverlayOpen(document)) return;
		// `/` on the printed symbol, `K` on the physical position, for the
		// reason `shortcuts.ts` sets out at length: no position means "slash"
		// across layouts, and no layout-mapped character means "the K key" on
		// the two non-Latin interface languages this site publishes. Matching
		// `e.key === 'k'` here meant Ctrl+K simply did not exist for a reader
		// on a Cyrillic or Arabic layout, where it produces `л` and `ن`.
		const isSlash = e.key === '/' && !isTypingTarget(e.target);
		const isCtrlK = e.code === 'KeyK' && (e.metaKey || e.ctrlKey);
		if (isSlash || isCtrlK) {
			e.preventDefault();
			openBox();
		}
	}

	/**
	 * A click on the dimmed surround. `::backdrop` is painted by the dialog
	 * and cannot be a target itself, so such a click arrives with the
	 * `<dialog>` as its target — which is only unambiguous because the
	 * element carries no padding of its own (the visible panel inside does),
	 * so its box and the panel's coincide exactly and there is no dead border
	 * region that would read as "outside".
	 */
	function onDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) closeBox();
	}

	/**
	 * Arrow keys move the active row and wrap; Home/End jump to the ends; Tab
	 * completes. Everything else is left to the field, including Enter, which
	 * the form's submit handler owns.
	 *
	 * TAB COMPLETES RATHER THAN NAVIGATES, and only with a row chosen. Enter is
	 * already "go there", so a Tab that did the same would be a second key for
	 * one action; what the box had no key for was "put that in the field and let
	 * me keep typing" — which is the useful half, because a suggestion is
	 * usually a PREFIX of where the reader is going. Completing `John 3` and
	 * then typing `:16` is two operations the box could not previously chain.
	 *
	 * With no row chosen, Tab is left alone: it is the only way out of a modal
	 * dialog by keyboard, and taking it hostage would trap a reader who opened
	 * the box by accident.
	 */
	function onInputKeydown(e: KeyboardEvent) {
		if (suggestions.length === 0) return;
		if (e.key === 'Tab' && !e.shiftKey && active >= 0) {
			e.preventDefault();
			query = suggestions[active].completion;
			// The list re-derives from the new text, so the old index would name
			// a different row — and the completed query is itself a query, whose
			// own first row may now be something else. Nothing stays chosen.
			active = -1;
			// The caret goes to the end: a completion is a prefix the reader is
			// about to extend, and browsers otherwise keep the old selection.
			queueMicrotask(() => inputEl?.setSelectionRange(query.length, query.length));
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			active = active >= suggestions.length - 1 ? 0 : active + 1;
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			active = active <= 0 ? suggestions.length - 1 : active - 1;
		} else if (e.key === 'Home' && active >= 0) {
			e.preventDefault();
			active = 0;
		} else if (e.key === 'End' && active >= 0) {
			e.preventDefault();
			active = suggestions.length - 1;
		} else {
			return;
		}
		scrollActiveIntoView();
	}

	/* Nudges the active suggestion inside the results list and nothing else.
	   `scrollIntoView` would walk out to the viewport, and the document behind
	   an open modal is inert but still scrollable — arrowing through results
	   would quietly move the page the reader comes back to. Same argument
	   `TocMenu.revealCurrent` makes; the arithmetic is in `$lib/reveal-row`. */
	function scrollActiveIntoView() {
		const row = listEl?.children[active];
		if (row instanceof HTMLElement) revealRow(row);
	}

	function choose(href: string) {
		// A jump box that answers is the whole point of the jump box; a jump box
		// that does not is the best expansion signal the site produces. Both
		// outcomes are counted, never the query — see `usage.noteJump`.
		usage.noteJump('hit');
		closeBox();
		goto(href);
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
	 * or a Psalm the reader's numbering doesn't have) navigated to an address
	 * the edge worker's route manifest doesn't recognize (`src/worker.ts`,
	 * `route-manifest.ts`) — a 404 where the box could simply have said no
	 * match, and stayed open with the query still typed.
	 */
	function chapterExists(osis: string, chapter: number): boolean {
		return getCanonicalBook(osis)?.chapters.includes(chapter) ?? false;
	}

	/**
	 * Enter.
	 *
	 * A chosen row wins outright — the reader has read where it goes. With
	 * nothing chosen the parser runs exactly as it always did, which keeps a
	 * complete citation a one-keystroke operation and keeps the shapes the
	 * suggester declines to complete (a verse list, an `ff` tail) working.
	 * Only when BOTH decline is "no match" the honest answer, and the box
	 * stays open with the query still in it.
	 */
	function submit() {
		if (active >= 0 && suggestions[active]) {
			choose(suggestions[active].href);
			return;
		}

		const ref = parseReference(query);
		notFound = false;

		if (ref.kind === 'ccc') {
			if (!cccParagraphExists(DEFAULT_CCC_LANG, ref.n)) {
				usage.noteJump('miss', 'out-of-range', 'ccc');
				notFound = true;
				return;
			}
			choose(hrefFor({ kind: 'ccc', n: ref.n }));
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
				usage.noteJump('miss', 'unknown-book');
				notFound = true;
				return;
			}

			const target = singleChapterFixup(resolved.book, ref);
			if (!chapterExists(resolved.book.osis, target.chapter)) {
				// The book IS named, and the chapter is not ours to serve — the
				// one miss that says which text to look at. Lower-cased because
				// the schema stores identifiers, not OSIS spelling.
				usage.noteJump('miss', 'out-of-range', resolved.book.osis.toLowerCase());
				notFound = true;
				return;
			}

			// `refparse` has always understood "john 1:1-7"; the range end used
			// to be parsed and then dropped here. It now rides along as `?v=`,
			// the same shape citation links use (see `refHref`), so a typed
			// range highlights the passage instead of just landing on its
			// first verse.
			choose(
				hrefFor({
					kind: 'bible',
					osis: resolved.book.osis,
					chapter: target.chapter,
					// `hrefFor` spells the extent: `?v=` only when it spans more
					// than one verse, `#v` always.
					...(target.verse
						? {
								from: target.verse,
								to: Math.max(target.verse, target.verseEnd ?? target.verse)
							}
						: {})
				})
			);
			return;
		}

		// The suggester found somewhere to go even though the parser could not
		// read the query as a citation — a title, a siglum, a section name. Its
		// first row is the answer rather than a refusal.
		if (suggestions.length > 0) {
			choose(suggestions[0].href);
			return;
		}

		usage.noteJump('miss', 'no-match');
		notFound = true;
	}

	function onSubmit(e: SubmitEvent) {
		e.preventDefault();
		submit();
	}

	function onInput() {
		notFound = false;
		active = -1;
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

	NO `data-help`, unlike every other control in the bar: the panel below
	teaches its own notation, with the field the reader is about to type in
	directly above it, and the help sheet's copy of the same lesson was one
	that could fall out of step with the box (2026-09-10, by direction).
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
</button>

<!--
	No `role="dialog"`, no `aria-modal`, no `tabindex="-1"`: a `<dialog>` shown
	with `showModal()` already carries all three, and `aria-modal` on top of it
	is redundant at best. `aria-label` stays — the box has no visible heading,
	only a placeholder, and a placeholder is not a name.

	The content is rendered unconditionally rather than behind `{#if open}`. A
	closed `<dialog>` is `display: none`, so nothing here is reachable, focusable
	or announced while the box is shut, and `showModal()` has an element to be
	called on.
-->
<dialog
	bind:this={dialogEl}
	class="dialog-bare"
	aria-label={t('jumpbox.placeholder')}
	onclose={onClose}
	onclick={onDialogClick}
>
	<div class="panel panel-surface">
		<form onsubmit={onSubmit}>
			<!--
				`aria-expanded` follows whether there is a list to expand INTO,
				not whether the dialog is up: a combobox with no options is
				collapsed, and saying otherwise sends a screen-reader user
				looking for a listbox that is not rendered.
			-->
			<input
				bind:this={inputEl}
				bind:value={query}
				oninput={onInput}
				onkeydown={onInputKeydown}
				type="text"
				role="combobox"
				aria-expanded={suggestions.length > 0}
				aria-controls="jump-listbox"
				aria-autocomplete="list"
				aria-activedescendant={active >= 0 ? optionId(active) : undefined}
				placeholder={t('jumpbox.field')}
				autocomplete="off"
				spellcheck="false"
			/>
		</form>

		<!--
			THE NOTATION LEGEND, and it lives where the results will. A reader
			learns in one open that the space under the field is where the box
			answers — and the rows are replaced by real suggestions the moment
			there is a query, which is the same space saying the same thing.

			A `<button>` and not a link or a chip: it puts its own text in the
			field (`fillExample`), which is not navigation and must not be
			drawn as it. `tabindex="-1"` for the reason the suggestion rows
			carry it — focus belongs to the field, the list is named by
			`aria-activedescendant` rather than entered, and Tab is spoken for
			(it completes, and with no row chosen it is the only way out of a
			modal). Nothing here is unreachable by keyboard: every row is a
			string the reader can type, which is the whole lesson.

			IT PRINTS `Specimen.typed` AND NOT `Specimen.text`, which is the one
			thing this legend does that `/schola`'s column must not: those rows
			teach a citation and are written as the work prints it, where every
			row here is a string that goes into the field above it. The box
			folds case and drops an abbreviation's stop, so printing `Comp. 123`
			would state a precision it does not ask for.

			PRAYERS HAVE NO ROW because they have no notation — they are cited
			by name, which is what the lead sentence above the rows says, and
			an invented shape would teach a form that does not exist.
		-->
		{#if query.trim() === '' && examples.length > 0}
			<div class="examples">
				<p class="examples-lead">{t('jumpbox.searches')}</p>
				<ul class="examples-list">
					{#each examples as example (example.key)}
						<li>
							<button type="button" tabindex="-1" onclick={() => fillExample(example.typed)}>
								<span class="example-work">{t(example.labelKey)}</span>
								<span class="example-form">{example.typed}</span>
							</button>
						</li>
					{/each}
				</ul>
			</div>
		{/if}

		{#if suggestions.length > 0}
			<!-- A result previews under a cursor and never under a thumb: the
			     reader typed an address in order to GO to it, so a peek in the way
			     of the tap is an obstacle. See `citation-links.ts`. -->
			<ul
				bind:this={listEl}
				id="jump-listbox"
				role="listbox"
				aria-label={t('jumpbox.suggestions')}
				data-link-preview="hover"
			>
				{#each suggestions as suggestion, index (suggestion.href)}
					<li
						id={optionId(index)}
						role="option"
						aria-selected={index === active}
						class:active={index === active}
					>
						<!--
							The row is an anchor, not a button with a `goto`: the
							address is a real URL, so it opens in a new tab on a
							middle click, copies from the context menu, and is
							announced as a link. `onclick` still calls `choose`
							so the dialog closes and the SPA navigates.
						-->
						<a
							href={suggestion.href}
							tabindex="-1"
							onclick={(e) => {
								if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
								e.preventDefault();
								choose(suggestion.href);
							}}
							onmousemove={() => (active = index)}
						>
							<span class="row">
								<!--
									Segments, never `{@html}`: the strings being marked are
									corpus titles, and a highlighter that built markup would
									be injecting whatever a document is called into the page.

									Written without a break inside the element — Svelte keeps
									the whitespace, and a newline before the first segment is
									a leading space in front of every label.
								-->
								<span class="label"
									>{#each highlight( suggestion.label, query, { loose: true } ) as segment}{#if segment.hit}<mark
												>{segment.text}</mark
											>{:else}{segment.text}{/if}{/each}</span
								>
								<span class="badge label-micro">{suggestion.badge}</span>
							</span>
							{#if suggestion.detail}
								<!--
									The detail is marked literally and never loosely: it is
									not what the row was matched on, so a subsequence found
									in a pontiff's name or a chapter span would be a
									coincidence drawn as evidence.
								-->
								<span class="detail"
									>{#each highlight(suggestion.detail, query) as segment}{#if segment.hit}<mark
												>{segment.text}</mark
											>{:else}{segment.text}{/if}{/each}</span
								>
							{/if}
						</a>
					</li>
				{/each}
			</ul>
		{/if}

		{#if notFound}
			<p class="not-found">{t('jumpbox.noMatch')}: “{query}”</p>
		{/if}

		<!--
			THE FOOT NAMES THE KEYS THAT CURRENTLY DO SOMETHING, and nothing
			else. It read "Press / or Ctrl+K to jump to a reference" until
			2026-09-10, which is a true sentence in the one place it was never
			printed: those two keys OPEN this box and are inert inside it, where
			this line is the only thing on screen. The keys that were live —
			Tab and Enter, the two the box's whole grammar rests on — were named
			nowhere at all.

			Each row is conditional on the same state its handler tests, so the
			legend cannot promise a key that would do nothing: arrows need a
			list, Tab needs a row chosen (`onInputKeydown` leaves it alone
			otherwise, being the only way out of a modal), Enter needs something
			to submit. Escape is the one that is always true.

			With nothing typed only Escape is true, and the line is that one key
			alone rather than the sentence it used to be: what the box will look
			through is said by the legend above, in the rows themselves.
		-->
		<p class="keys">
			{#if suggestions.length > 0}
				<span><kbd>↑</kbd><kbd>↓</kbd>{t('jumpbox.key.move')}</span>
			{/if}
			{#if active >= 0}
				<span><kbd>Tab</kbd>{t('jumpbox.key.complete')}</span>
			{/if}
			{#if query.trim() !== ''}
				<span><kbd>Enter</kbd>{t('jumpbox.key.go')}</span>
			{/if}
			<span><kbd>Esc</kbd>{t('ui.close')}</span>
		</p>
	</div>
</dialog>

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

	/* The label is short enough now to survive most widths, but on a phone the
	   header still has five controls competing for one row — collapse to the
	   icon alone there, which conveys "search" on its own and keeps the same
	   activation target.

	   THIS USED TO HIDE A `/` HINT HERE TOO. The hint is gone from every width
	   now, and `Help.svelte`'s trigger says why: a row can afford to name
	   one key, and the key worth naming is the one whose control is otherwise
	   invisible. `/` still opens this box. */
	@media (max-width: 640px) {
		.trigger-text {
			display: none;
		}

		/* With the label gone this is an icon button like the others, so it drops
		   `.wide`'s auto width and becomes the identical 2.25rem square. */
		.trigger {
			width: 2.25rem;
			padding-inline: 0;
		}
	}

	/*
	 * The dialog element itself is nothing but position — the UA stylesheet's
	 * border, padding and background cleared, the visible box `.panel` inside
	 * it, which is what makes `onDialogClick`'s `e.target === dialogEl` test
	 * mean "the reader clicked the backdrop". That reset and the backdrop's
	 * tint are `app.css`'s `.dialog-bare`, shared with `TocMenu` and the
	 * header's navigation sheet; what is left here is where this one sits.
	 *
	 * `margin` replaces the old flex backdrop: `auto` on three sides is the
	 * UA's centring, and 12vh on the block start is the same "sits high, not
	 * dead centre" placement the `padding-top: 12vh` gave. No `z-index` —
	 * a modal dialog is in the top layer, above every stacking context there
	 * is, which is what the old `z-index: 100` was reaching for.
	 */
	dialog {
		width: min(32rem, 90vw);
		margin: 12vh auto auto;
		/* The panel may reach to within a hair of the fold, and on a tall
		   viewport that is most of the screen. Before this it could not: the
		   list carried a `max-height: min(24rem, 55vh)` and nothing else was
		   bounded, so on a 900px window the results stopped 380px short of the
		   bottom and scrolled INSIDE a panel with a third of the page empty
		   under it. The cap belongs to the dialog, which is the only box that
		   knows where the fold is. `dvh` and not `vh`: on a phone the two
		   differ by the browser's own chrome, and `vh` is the taller one. */
		max-block-size: calc(100dvh - 12vh - 1rem);
	}

	/* `[open]` is not decoration — a closed `<dialog>` is `display: none` from
	   the UA stylesheet, and a bare `dialog { display: flex }` would override
	   it and leave the box on screen for ever. `.sheet` in `menus.css` carries
	   the same guard for the same reason. */
	dialog[open] {
		display: flex;
	}

	/* A `.panel-surface` (styles/components.css) with room to breathe: this one
	   holds an input and a result list rather than a row of menu items, and it
	   is the only panel on the site a reader types into. */
	.panel {
		padding: 1rem;
		/* The flex column that turns the dialog's cap into the list's: the
		   field and the foot take what they need, `ul` takes the rest.
		   `min-block-size: 0` is what lets it be smaller than its content —
		   without it a flex item refuses to shrink past that and the panel
		   grows straight through the cap above. */
		flex: 1 1 auto;
		min-block-size: 0;
		display: flex;
		flex-direction: column;
	}

	/* `--color-bg-elevated`, not `--color-bg`: the panel is already `--color-bg`,
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
		border-radius: var(--radius-md);
		background: var(--color-bg-elevated);
		color: var(--color-text);
	}

	/*
	 * THE FOCUS INDICATOR MOVES INTO THE BORDER HERE, which is what every
	 * bordered text field on the site does — `.menu-filter` (styles/menus.css),
	 * `/documenta`'s `.doc-search` and `/quaestiones`' `.topic-search` carry
	 * these same four declarations.
	 *
	 * `app.css`'s `:focus-visible` is a 2px outline at a 2px offset. That is
	 * correct for buttons and links, which are focused in RESPONSE to the
	 * reader. This input is autofocused the moment the dialog opens, so the
	 * ring is the modal's resting state rather than a response to anything —
	 * and an offset rectangle drawn around an already-bordered rounded field
	 * stacks into a double frame that reads as an OS dialog rather than as part
	 * of the page.
	 *
	 * The indicator is NOT removed, it is relocated: the border turns
	 * ultramarine and doubles in weight, drawn as an inset shadow under the
	 * border rather than as a wider border, so the field does not move as it
	 * gains it. It was a soft 3px halo of the same colour until then — a glow
	 * a form library ships, and the only blurred edge anywhere on this page.
	 * Solid still clears 1.4.11's 3:1 against the surfaces it edges by a wide
	 * margin (8.49:1 on light, 7.01:1 on sepia, 7.02:1 on dark, measured
	 * against the field background rather than the page).
	 *
	 * `outline: 2px solid transparent` rather than `outline: none` — under
	 * forced-colors the transparent outline is repainted in the user's own
	 * focus colour, so high-contrast mode keeps a real ring even though the
	 * shadow below is dropped there.
	 */
	input:focus-visible {
		outline: 2px solid transparent;
		outline-offset: 2px;
		border-color: var(--color-apparatus);
		box-shadow: inset 0 0 0 1px var(--color-apparatus);
	}

	/* No height of its own: `flex: 0 1 auto` grows the list with its content
	   and shrinks it to whatever the dialog's cap leaves, so a short list is
	   a short panel and a long one runs to the fold. `suggest.ts` caps the
	   count; this caps the pixels, and only where the viewport does. */
	ul {
		list-style: none;
		margin: 0.6rem 0 0;
		padding: 0;
		flex: 0 1 auto;
		min-block-size: 0;
		overflow-y: auto;
	}

	/* Rows are anchors, so the site's link colour would paint every one of them
	   red. A suggestion is a destination, not a citation — it takes the body
	   colour and lets the active row carry the emphasis instead. */
	a {
		display: block;
		padding: 0.4rem 0.5rem;
		border-radius: var(--radius-md);
		color: var(--color-text);
		text-decoration: none;
	}

	li.active a,
	a:hover {
		background: var(--color-bg-elevated);
	}

	/* The legend that stands where the results will. It shrinks and scrolls
	   on the same terms the result list does — a short viewport is the case
	   where seven rows and a field do not both fit, and the rows are the half
	   that can be given up. */
	.examples {
		margin: 0.6rem 0 0;
		flex: 0 1 auto;
		min-block-size: 0;
		overflow-y: auto;
	}

	.examples-lead {
		margin: 0 0 0.3rem;
		padding-inline: 0.5rem;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}

	.examples-list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	/* The work on the leading edge and the form on the trailing one, which
	   makes the specimens a column a reader can read down without reading the
	   names at all. Same row geometry as a suggestion, a little tighter: this
	   is a legend and seven of them stand where eight results would. */
	.examples-list button {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
		inline-size: 100%;
		padding: 0.25rem 0.5rem;
		border: none;
		border-radius: var(--radius-md);
		background: transparent;
		font: inherit;
		font-size: 0.85rem;
		color: var(--color-text-muted);
		text-align: start;
		cursor: pointer;
	}

	.examples-list button:hover {
		background: var(--color-bg-elevated);
	}

	/* The name yields before the form does. A specimen clipped is a specimen
	   taught wrong, where a work's name is the half a reader can infer from
	   the form beside it — so the ellipsis is on this column and the chip
	   below refuses to shrink at all. */
	.example-work {
		min-inline-size: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	/* `.cite-example`'s chip from `/schola`, to the declaration: the interface
	   face on a hairline, tabular figures, muted. That page's own note says
	   why it is not a monospace and not coloured — it is drawn as something to
	   TYPE, in the idiom the keycaps in this box's foot already use, and the
	   two now sit one above the other. */
	.example-form {
		flex: 0 0 auto;
		padding: 0.1rem 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		background: var(--color-bg-elevated);
		font-family: var(--font-sans);
		font-size: 0.8rem;
		font-variant-numeric: tabular-nums;
		white-space: nowrap;
	}

	/* The row's hover is the chip's own colour, so on a hovered row the chip
	   takes the panel's instead. Without this the two surfaces meet and the
	   specimen loses its box to the row it is sitting in. */
	.examples-list button:hover .example-form {
		background: var(--color-bg);
	}

	/* The active row is marked by more than its background: a reader in forced
	   colours, or anyone for whom a 4% surface shift is not a signal, gets the
	   inline start border too.

	   IT RUNS STRAIGHT, WHICH COSTS THE ROW ITS CORNERS ON THAT SIDE. An inset
	   bar is clipped by the radius it is drawn inside, so a 3px marker on a
	   `--radius-md` row tapers to nothing at both ends and reads as a
	   rendering fault rather than as a mark. The two start corners go square
	   and the bar is a bar; the end side keeps its radius, since nothing is
	   drawn against it. */
	li.active a {
		box-shadow: inset 3px 0 0 0 var(--color-apparatus);
		border-start-start-radius: 0;
		border-end-start-radius: 0;
	}

	.row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.label {
		font-size: 0.98rem;
	}

	/*
	 * The matched run, and the one place on this site a `<mark>` appears.
	 *
	 * NOT the UA's yellow: these rows sit on the panel in three themes, and a
	 * fixed background that reads as emphasis on parchment reads as damage on
	 * dark. A tint mixed from `--color-apparatus` moves with the theme the same
	 * way the focus ring does, and stays a tint — the text keeps the row's own
	 * colour, because a mark that recoloured the label would make eight rows of
	 * suggestions look like eight links inside a list of links.
	 *
	 * Weight rather than colour carries it where the tint cannot: under
	 * forced-colors the background is dropped, and `mark` there is repainted in
	 * the user's own Mark/MarkText pair, so the emphasis survives twice over.
	 * 600 and not bolder — the label is set at 0.98rem and a heavier step
	 * reflows the row enough to jitter the list as the reader types.
	 */
	mark {
		background: color-mix(in srgb, var(--color-apparatus) 18%, transparent);
		color: inherit;
		font-weight: 600;
		border-radius: var(--radius-sm);
	}

	/* The detail is muted and one line; a tint there would fight the ellipsis
	   for the reader's attention. Weight alone. */
	.detail mark {
		background: transparent;
	}

	.badge {
		flex: none;
	}

	/* One line, ellipsized: a Summa question title or a Catechism chapter
	   heading is longer than this panel and wrapping it turns an eight-row list
	   into a page of prose. */
	.detail {
		display: block;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.keys {
		margin: 0.5rem 0 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		/* It may not take space from the list above it, which is the only part
		   of this panel that scrolls. */
		flex: none;
	}

	/* One line of pairs, wrapping as a whole pair: a keycap orphaned from its
	   word is a puzzle. `column-gap` is the space BETWEEN pairs and the 0.3rem
	   inside each is the `kbd`'s own margin, so the two never read as one gap. */
	.keys {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		column-gap: 0.9rem;
		row-gap: 0.3rem;
	}

	/* Not `.key`'s keycap from `Help.svelte`: that one is a picture of a
	   keyboard and this is a footnote under a field the reader is typing in.
	   A hairline box at the text's own size, and the sans face because a key
	   is a label printed on a thing, not a word in a sentence. */
	kbd {
		margin-inline-end: 0.3rem;
		padding: 0.05rem 0.3rem;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-family: var(--font-sans);
		font-size: 0.75rem;
		line-height: 1.4;
		color: var(--color-text-muted);
		/* The arrows are a pair and read as one control: no gap between them
		   beyond their own borders, so `↑↓ Move` is three things and not four. */
		white-space: nowrap;
	}

	kbd + kbd {
		margin-inline-start: -0.15rem;
	}

	.not-found {
		margin: 0.5rem 0 0;
		font-size: 0.85rem;
		color: var(--color-accent);
	}
</style>
