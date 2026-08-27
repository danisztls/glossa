<script lang="ts">
	/**
	 * One numbered footnote reference: the superscript marker, and the
	 * citation it names.
	 *
	 * WHERE THERE IS A MARGIN, THE CITATION IS SET IN IT — open, beside the
	 * line that raises it, in the same `.margin-note` an annotated edition's
	 * gloss gets (`Sidenote.svelte`, `sidenotes.svelte.ts`). This component
	 * used to argue the opposite: that a source is a few words wanted only on
	 * demand, and so belongs behind a control. That reasoning was about a
	 * disclosure that pushes the rest of the page down — the mechanism
	 * `PLAN.md` #3 names as the one the designed reading experience replaces
	 * — and it stops applying the moment the note costs the text nothing,
	 * which is what the margin is. What a reader actually wants to know of a
	 * quoted sentence is where it comes from, and 3,698 of the Catechism's
	 * citations average 26 characters: short enough to sit in a 13rem column
	 * without ever being fetched.
	 *
	 * BELOW THE BREAKPOINT IT IS A POPOVER, and here the two apparatuses part
	 * company. A gloss becomes a block under its line, because a gloss is a
	 * paragraph and a paragraph wants the width. A citation is a phrase, and
	 * it used to open as a boxed span INSIDE the sentence — which is the one
	 * thing an apparatus must not do: opening it reflowed the words around it,
	 * so the sentence the reader was in the middle of moved while they were
	 * reading it, and closing it moved them back. The floating card costs the
	 * page no layout at all. It is the same card a link's preview appears in
	 * (`LinkPreview`, `.floating-panel` in app.css, `floating.ts` for where it
	 * goes), which is the point: a reader who has learned what a small box
	 * over the page means should not have to learn a second one.
	 *
	 * NATIVE `popover`, DECLARATIVELY INVOKED, and that is what deleted the
	 * awkward part of this component. `popovertarget` is valid on `<button>`
	 * and the trigger here IS one — unlike `ReferenceNumber`, whose trigger is
	 * a real `<a href>` and so has to show its panel by hand — so the browser
	 * owns the open state, the light dismiss, Escape, the top layer and
	 * returning focus to the marker. THE OPEN STATE USED TO BE THE CALLER'S:
	 * `ProseBlocks` and `HeadingText` each kept a `SvelteSet` of open markers,
	 * keyed by block and position because a source can cite the same footnote
	 * twice in one paragraph and the two must open independently. Both sets
	 * are gone. `$props.id()` is per INSTANCE, and there is one instance per
	 * occurrence, so the case the key existed for answers itself.
	 *
	 * The boolean kept here is not that state: it is what the state is FOR —
	 * `aria-expanded`, which the reader's screen reader is owed, and the
	 * scroll tracking, which is only worth attaching while something is open.
	 *
	 * Extracted when a second reading surface needed it. A STRUCTURE HEADING
	 * can carry the same apparatus a paragraph can — the CCC's EN mirror
	 * prints a `<sup>` reference on two of its headings, sourcing the phrase
	 * each one quotes (docs/corpus-schema.md, "A heading can carry citations")
	 * — and `HeadingText` renders it, so the marker, the trigger, the card and
	 * the three ways a citation can be empty have one owner instead of a copy
	 * per surface.
	 *
	 * A MARKER HAS TO STAY PHRASING CONTENT: this renders inside prose `<p>`s.
	 * An earlier `<sup><details>…</details></sup>` looked inline in CSS but was
	 * invalid HTML (`details` is flow content), and browsers repaired the DOM
	 * by ending the paragraph at the footnote. A `<span popover>` is phrasing
	 * wherever it sits and leaves the flow entirely once open, so the same
	 * trap is not reachable from here again.
	 *
	 * NOT for a citation the source printed inline — the PT Catechism's
	 * parenthesised Scripture locators (`CccCitation.label`). Those are text
	 * the source actually prints and render as themselves, never as a marker;
	 * callers test `label` first and never reach this.
	 */
	import type { CccCitation } from '$lib/types';
	import RefText from '$lib/components/RefText.svelte';
	import { sidenoteRoom } from '$lib/sidenotes.svelte';
	import { computePanelPosition, trackAnchor } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/** The printed reference — "25". Shown in the superscript, and shown
		    again in place of the citation when there is no entry for it. */
		marker: string;
		/** The entry `marker` points at, or undefined when the corpus has
		    none (a validated-against case, so it means a bug, not a shrug). */
		citation: CccCitation | undefined;
		/** Bare content language, for `RefText`'s citation grammar. */
		lang: string;
		/** Corpus work id of the text being read, when the caller knows it. Only
		    the few works listed in `refs-grammar.ts`'s `WORK_CONFIGS` read
		    differently for it — English works that number the books of Kings
		    the Douay way — and passing nothing reads the work as its language
		    reads. */
		work?: string;
	}

	let { marker, citation, lang, work }: Props = $props();

	// In the margin the citation is on screen no matter what, so the marker is
	// not a disclosure control and does not claim to be one.
	const inMargin = $derived(sidenoteRoom.margin);

	/** Per INSTANCE, which is per occurrence — see the docblock on why that is
	 *  the whole of the keying problem this used to hand to its callers. */
	const panelId = $props.id();

	let triggerEl: HTMLElement | undefined = $state();
	let panelEl: HTMLElement | undefined = $state();
	/** Mirrors the popover's own state. Read for `aria-expanded` — the browser
	 *  exposes that implicitly for a `popovertarget` invoker, but not every
	 *  engine's mapping has landed, and a control whose state is only implied
	 *  is worth two attributes. */
	let open = $state(false);

	/**
	 * PLACED IMPERATIVELY, not through the template, because the ordering is
	 * the whole difficulty. `toggle` fires AFTER the popover is shown, so a
	 * coordinate that travelled back through Svelte's update cycle would leave
	 * one painted frame at the panel's static position — which for a marker
	 * mid-paragraph is the middle of the sentence. The panel starts
	 * `visibility: hidden` in CSS and is revealed here, in the same
	 * synchronous turn that measures it, so there is no such frame to see.
	 *
	 * It cannot be measured any earlier either: a closed popover is
	 * `display: none`, and `getBoundingClientRect` on one is all zeroes.
	 */
	function place() {
		if (!panelEl || !triggerEl) return;
		const at = computePanelPosition(
			triggerEl.getBoundingClientRect(),
			panelEl.getBoundingClientRect()
		);
		panelEl.style.top = `${at.top}px`;
		panelEl.style.left = `${at.left}px`;
		panelEl.style.visibility = 'visible';
	}

	/**
	 * The one thing native dismissal does NOT do is tell Svelte. Escape, a
	 * light dismiss and another popover superseding this one all hide the
	 * element without touching anything here, which would leave the marker's
	 * `aria-expanded` reading `true` over a card nobody can see. `toggle` is
	 * the one event every close path fires.
	 */
	function onToggle(e: ToggleEvent) {
		open = e.newState === 'open';
		if (open) place();
		else if (panelEl) panelEl.style.visibility = 'hidden';
	}

	// Only while something is open: this component is mounted once per
	// citation, and a long document section has dozens. A scroll listener per
	// rendered marker is the mistake `AnchorMenu` records not making.
	//
	// `inMargin` is in the condition because a viewport widening past the
	// breakpoint takes the whole `{:else}` branch away, and removing an open
	// popover from the document closes it without firing `toggle` — which
	// would otherwise leave this tracking a panel that no longer exists.
	$effect(() => (open && !inMargin ? trackAnchor(place) : undefined));
</script>

{#snippet source()}{#if citation && citation.text.trim() !== ''}<RefText
			text={citation.text}
			{lang}
			{work}
		/>{:else if citation}<!-- Deliberately empty source: a handful of citations in the Vatican II
		     corpus point at a footnote-list entry that is itself
		     missing/truncated in the source page, not a parsing failure
		     (docs/research/vatican-documents.md §6, "Known source defects" — 4
		     confirmed cases). No fabricated text to show, so say so rather than
		     rendering a dead-looking empty box. --><span
			class="citation-empty">{t('citation.unavailable')}</span
		>{:else if !inMargin}<!-- No entry at all for this marker — a case the pipeline validates
		     against, so a bug rather than a shrug. The marker itself is shown
		     in its place, which is strictly more than nothing: it is what the
		     source printed. In the margin the note's own label is already
		     that marker, so this branch would print it twice; the label
		     stands alone instead, and nothing here claims the source is
		     defective when what is missing is our entry for it. -->{marker}{/if}{/snippet}

{#if inMargin}
	<sup class="citation-marker citation-marker-static" aria-hidden="true">{marker}</sup>
	<small class="margin-note"
		><span class="margin-note-label" aria-hidden="true">{marker}</span>{@render source()}</small
	>
{:else}
	<sup class="citation-marker">
		<button
			bind:this={triggerEl}
			type="button"
			class="citation-trigger"
			popovertarget={panelId}
			aria-expanded={open}
		>
			{marker}
		</button>
	</sup>
	<!-- `data-link-preview="off"` is inherited by everything inside, so a
	     scripture link in the citation cannot raise a hover preview of its own
	     — which would render BEHIND this card rather than over it, since an
	     open popover is in the top layer and the preview overlay is not.
	     The links themselves still work; only the peek at them is suppressed. -->
	<span
		bind:this={panelEl}
		id={panelId}
		popover="auto"
		ontoggle={onToggle}
		class="floating-panel citation-popover"
		data-link-preview="off">{@render source()}</span
	>
{/if}

<style>
	/* `.citation-marker` and `.citation-trigger` are global (app.css), shared
	   with `PrayerMystery`, as are `.margin-note` (shared with `Sidenote`) and
	   `.floating-panel` (shared with `LinkPreview` and `AnchorMenu`). What is
	   left here is what only a citation has. */

	/* Static in the margin layout: no button, so the accent colour
	   `.citation-trigger` carries has to come from somewhere, and the mark is
	   no longer something to click. Hidden from assistive technology, since the
	   citation it points at is already next in the reading order and the number
	   is then decoration. */
	.citation-marker-static {
		color: var(--color-accent);
		user-select: none;
	}

	.citation-empty {
		font-style: italic;
	}

	/*
	 * The card. `position: fixed` and the `inset`/`margin` resets are against
	 * the UA's `[popover]` rule, which wants to centre it in the viewport
	 * instead; `place()` supplies the real coordinates. Hidden until it has
	 * them — see `place()` for why that has to be CSS's starting point rather
	 * than something the template decides.
	 *
	 * No `z-index`: an open popover is in the top layer, above every stacking
	 * context on the page.
	 *
	 * CHROME SIZE, NOT READING SIZE — a fixed `rem`, the same as `.margin-note`
	 * and the same as the preview card this borrows its look from. The
	 * `0.9em` it was set at made sense while it was a box inside the sentence,
	 * growing with the words around it. Nothing around it now.
	 */
	.citation-popover {
		position: fixed;
		inset: auto;
		margin: 0;
		visibility: hidden;
		max-width: min(24rem, calc(100vw - 1rem));
		padding: 0.5rem 0.7rem;
		font-size: 0.85rem;
		font-style: normal;
		line-height: 1.5;
		color: var(--color-text);
		overflow-wrap: break-word;
	}
</style>
