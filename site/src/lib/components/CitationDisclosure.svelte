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
	 * AND THE MARKER STILL OPENS A POPOVER, at every width — this is the one
	 * place the two apparatuses part company, since a gloss in the margin is
	 * simply read there. A citation is not always read there: the margin is
	 * whatever slack the layout has left, so it narrows as the reader's text
	 * grows (to about 7rem at the largest setting), and a column of stacked
	 * notes beside a densely-cited paragraph does not always say plainly which
	 * of them belongs to the number just passed. Clicking the number answers
	 * that at the number. Below the breakpoint the popover is the whole
	 * apparatus; above it, it is a second way to the same words.
	 *
	 * IT OPENS ON HOVER TOO, on the delays `floating.ts` holds for both cards
	 * a reader can raise from running prose. A link says where it goes and a
	 * footnote marker does not — it names a source without saying what — so if
	 * either of the two deserves a pointer that rests on it, this is the one.
	 * A click still opens it, and a clicked card stays until it is dismissed;
	 * see `byHover`.
	 *
	 * THE CARD REPLACED A BOX INSIDE THE SENTENCE, which is the one thing an
	 * apparatus must not be: opening it reflowed the words around it, so the
	 * sentence the reader was in the middle of moved while they were reading
	 * it, and closing it moved them back. A floating card costs the page no
	 * layout at all. It is the same card a link's preview appears in
	 * (`LinkPreview`, `.floating-panel` in app.css, `floating.ts` for where it
	 * goes), which is the point: a reader who has learned what a small box
	 * over the page means should not have to learn a second one.
	 *
	 * WHAT A SCREEN READER HEARS is the reason the margin note is not hidden
	 * now that its text is reachable twice over. The note stays in the reading
	 * order, right behind the marker, so the citation is still read without
	 * anyone having to open anything; the popover only ever repeats it. The
	 * cost is one extra "collapsed" on the marker, which is a truthful thing
	 * to say about a control that really does open something. The reverse
	 * trade — hiding the note and leaving the popover as the only route —
	 * would charge an interaction for text already on the screen.
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
	import {
		computePanelPosition,
		trackAnchor,
		canHover,
		HOVER_OPEN_MS,
		HOVER_CLOSE_MS
	} from '$lib/floating';
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

	// Whether the citation is ALSO set beside the line that raises it. It no
	// longer decides what the marker is — that is a button either way — only
	// whether the margin gets its copy.
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
		if (open) {
			place();
			return;
		}
		// Every close path lands here, the reader clicking the marker of a
		// card the pointer had opened among them — so the hover claim is
		// dropped on all of them rather than only on the one that set it.
		byHover = false;
		openTimer = cancel(openTimer);
		closeTimer = cancel(closeTimer);
		if (panelEl) panelEl.style.visibility = 'hidden';
	}

	// Only while something is open: this component is mounted once per
	// citation, and a long document section has dozens. A scroll listener per
	// rendered marker is the mistake `AnchorMenu` records not making.
	$effect(() => (open ? trackAnchor(place) : undefined));

	/**
	 * THE POINTER RESTING ON THE MARKER OPENS IT, on the same two delays and
	 * behind the same capability test as a link's preview (`floating.ts`).
	 * Hovering costs the reader nothing, and a footnote marker is the one mark
	 * in running text that names a source without saying what it is — the same
	 * argument `LinkPreview` makes for a link, about the other kind of
	 * reference a sentence can carry. On a touch screen `canHover` is false
	 * and the marker is the tap target it already was.
	 *
	 * `byHover` IS WHAT KEEPS A CLICKED CARD OPEN. The two ways in want
	 * opposite things on the way out: a card the pointer merely summoned
	 * should leave with the pointer, and one the reader clicked for should
	 * stay until they dismiss it. Without the flag the click would be worth
	 * nothing on a hover-capable pointer, since every deliberately-opened card
	 * would evaporate the moment the reader looked away from the number.
	 */
	let byHover = false;
	let openTimer: ReturnType<typeof setTimeout> | undefined;
	let closeTimer: ReturnType<typeof setTimeout> | undefined;

	function cancel(timer: ReturnType<typeof setTimeout> | undefined) {
		if (timer !== undefined) clearTimeout(timer);
		return undefined;
	}

	/**
	 * ENTERING THE CARD COUNTS AS ENTERING THE MARKER, and has to: the two are
	 * `GAP` pixels apart, and the reader crosses that gap to reach a reference
	 * inside the card. Both elements call this, so the pair behaves as one
	 * region — which is also why the close is on a grace period rather than
	 * immediate.
	 */
	function onPointerEnter() {
		if (!canHover()) return;
		closeTimer = cancel(closeTimer);
		if (open || openTimer !== undefined) return;
		openTimer = setTimeout(() => {
			openTimer = undefined;
			// `showPopover()` on an already-open popover throws
			// `InvalidStateError`, and a click can have opened it while this
			// timer was running.
			if (!panelEl || panelEl.matches(':popover-open')) return;
			byHover = true;
			panelEl.showPopover();
		}, HOVER_OPEN_MS);
	}

	function onPointerLeave() {
		openTimer = cancel(openTimer);
		if (!byHover) return;
		closeTimer = cancel(closeTimer);
		closeTimer = setTimeout(() => {
			closeTimer = undefined;
			if (byHover && panelEl?.matches(':popover-open')) panelEl.hidePopover();
		}, HOVER_CLOSE_MS);
	}

	$effect(() => () => {
		cancel(openTimer);
		cancel(closeTimer);
	});
</script>

{#snippet source(labelled: boolean)}{#if citation && citation.text.trim() !== ''}<RefText
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
		>{:else if !labelled}<!-- No entry at all for this marker — a case the pipeline validates
		     against, so a bug rather than a shrug. The marker itself is shown
		     in its place, which is strictly more than nothing: it is what the
		     source printed. The margin note prints that number as its own
		     label, so it passes `labelled` and this branch stands down there
		     rather than saying it twice; the popover, which carries no label,
		     does not. Nothing here claims the source is defective when what is
		     missing is our entry for it. -->{marker}{/if}{/snippet}

<sup class="citation-marker" onpointerenter={onPointerEnter} onpointerleave={onPointerLeave}>
	<button
		bind:this={triggerEl}
		type="button"
		class="citation-trigger"
		popovertarget={panelId}
		aria-expanded={open}
	>
		{marker}
	</button>
</sup>{#if inMargin}<small class="margin-note"
		><span class="margin-note-label" aria-hidden="true">{marker}</span>{@render source(true)}</small
	>{/if}
<!-- `role="note"`, which is ARIA's own word for content ancillary to the
     text it hangs off, and the honest one here: a citation is exactly that.
     NOT `tooltip`, the role `LinkPreview`'s hover card carries — that one
     describes the thing it is anchored to and must hold nothing interactive,
     where this holds the references the reader came for.

     A scripture reference in here previews like any other link, which it
     could not while this card was the only thing in the top layer: the
     preview overlay is a `manual` popover now and is always shown second, so
     it lands above this card rather than behind it. -->
<span
	bind:this={panelEl}
	id={panelId}
	popover="auto"
	role="note"
	ontoggle={onToggle}
	onpointerenter={onPointerEnter}
	onpointerleave={onPointerLeave}
	class="floating-panel citation-popover">{@render source(false)}</span
>

<style>
	/* `.citation-marker` and `.citation-trigger` are global (app.css), shared
	   with `PrayerMystery`, as are `.margin-note` (shared with `Sidenote`) and
	   `.floating-panel` (shared with `LinkPreview` and `AnchorMenu`). What is
	   left here is what only a citation has. */

	.citation-empty {
		font-style: italic;
	}

	/*
	 * The card. Where it sits — fixed, the UA `[popover]` centring reset, no
	 * `z-index` because the top layer decides — is `.floating-panel` in
	 * app.css. Hidden until `place()` has measured it; see there for why that
	 * has to be the stylesheet's starting point rather than the template's.
	 *
	 * CHROME SIZE, NOT READING SIZE — a fixed `rem`, the same as `.margin-note`
	 * and the same as the preview card this borrows its look from. The
	 * `0.9em` it was set at made sense while it was a box inside the sentence,
	 * growing with the words around it. Nothing around it now.
	 */
	.citation-popover {
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
