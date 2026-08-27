<!--
	The reading bar's table of contents: the narrow-screen counterpart to the
	sidebar (`.reading-aside`, app.css), which is desktop-only and has been
	since it was written.

	WHY THE BAR AND NOT THE COLUMN. Two answers to this already existed in the
	tree and both put the list IN the reading column — `/preces` leads with the
	aside in source order, `/documenta` opens with `.toc-inline`, a closed
	`<details>` above the first word. Both spend the top of the page on
	navigation, and both are only reachable from the top of the page: a reader
	at section 200 of an encyclical has to scroll back through everything to
	reach the thing that would have taken them somewhere else. This bar is
	already sticky, is already where every other reading control lives
	(`ReadingBar`'s docblock), and costs the text no vertical space at all — so
	the control that says "where else can I go" is reachable at any depth,
	which is the whole reason a reader wants a table of contents mid-text.

	IT IS THE FIRST CONTROL IN THE ROW. `ReadingBar` runs from what is being
	read to how it is being read; this is the furthest thing in the row from
	"how" — it does not act on the page at all, it leaves it. Bookmark, print
	and roll act on the page in view; the edition controls change what that
	page is made of. Navigation sits ahead of both.

	## ON A PHONE IT IS THE WHOLE VIEWPORT, AND THAT IS AN ADMISSION

	This began as a `.menu-panel` dropdown, the primitive the four edition and
	appearance pickers use. At a laptop width that is the right object. At
	24rem it was a fiction: the panel is `88vw`, so what surrounds it is a
	sliver of text too narrow to read — and that sliver was also the only
	target for the outside-click that dismissed it. A list of 189 questions
	scrolled inside a nested box, with no visible way out, behind a gesture
	aimed at a strip. Full-bleed is not a bigger version of that panel; it is
	the same panel finally saying what it already was, with the dismissal made
	into a control instead of a margin.

	The breakpoint is 48rem, and it is NOT the sidebar's 80rem. Above 48rem
	the anchored card still leaves the text readable around it, which is this
	site's whole posture toward apparatus — a gloss stands beside the text, it
	does not replace it (`Sidenote`, `CitationDisclosure`, the sidebar
	itself). Navigation should not become a MODE any earlier than the screen
	forces it to. Between 48rem and the sidebar's own handover the card is
	what a tablet gets.

	## `<dialog>`, NOT A HAND-ROLLED OVERLAY

	`showModal()` carries the top layer, `::backdrop`, an inert background, a
	focus trap and Escape — all of it native, none of it ours, and all of it
	mandatory once a panel covers the screen: an overlay a reader can tab out
	of into text they cannot see is worse than no overlay. `JumpBox` is the
	other dialog on the site and this follows it exactly, down to the
	`e.target === dialogEl` backdrop test and the transparent dialog whose
	visible box is a child (see its own docblock for why the padding must live
	on the child and not here).

	THE SHELL AND THE SHEET CHROME ARE `app.css`'s — `.dialog-bare`, `.sheet`
	and the `.sheet-*` parts — shared with `JumpBox` and with the header's
	navigation sheet in `+layout.svelte`. Only the CARD is this component's
	own, because only this component has one, and this file's stylesheet is
	that media query and almost nothing else.

	What that replaces is the `Menu` class this used first: `onWindowClick`,
	`onPanelKeydown`, and a window-level Escape handler written here because a
	trigger keeps focus and the panel's own `keydown` therefore never fires.
	All three are the browser's job now. `keepInViewport` goes too — the top
	layer is not `.reading-bar`'s stacking context, so there is nothing left
	to be clipped by and nothing to correct.

	THE CARD IS MODAL TOO, and that is the one thing given up rather than
	gained. Between 48 and 80rem a reader cannot tap a footnote in the text
	while the list is open. That is the price of one code path — one element,
	one open, one close, two stylings — and for a control whose only purpose is
	to take the reader elsewhere it is a price worth paying. The alternative
	was a non-modal `popover` above the breakpoint and a dialog below it: two
	dismissal contracts, two focus stories, one component pretending to be
	both.

	IT RENDERS THE SAME COMPONENT THE SIDEBAR DOES, passed in as a snippet
	rather than rebuilt from props. The call has ten arguments and five of them
	differ per route (which tree, which routing scheme, which kind-floor,
	which anchor function, which borrowed-title label); `comparison` became
	props because eight copies of it differed only in where an array came from,
	and this is the case that argument was distinguishing itself against. The
	route writes the call once and renders it in both places.
-->
<script lang="ts">
	import { tick, type Snippet } from 'svelte';
	import Icon from './Icon.svelte';
	import { computePanelPosition } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		/** The list's own heading — the trigger's accessible name, and the
		    title of the panel it opens, so the button and the thing it opens
		    say the same word. The routes already hold this string for
		    `StructureSidebarToc`'s `heading`; passing it rather than deriving
		    one here keeps the two from drifting. */
		label: string;
		/** The table of contents itself, rendered only while the panel is
		    open. Deliberately not rendered closed: this is the second instance
		    of a tree that runs to 189 rows in the Summa's Secunda Secundae,
		    and there is nothing a hidden copy of it does for anyone. */
		content: Snippet;
	}

	let { label, content }: Props = $props();

	let dialogEl: HTMLDialogElement | undefined = $state();
	let triggerEl: HTMLButtonElement | undefined = $state();
	let open = $state(false);
	/** Where the anchored card sits, in viewport coordinates. Unread below
	 *  the breakpoint, where the dialog IS the viewport — see the CSS. */
	let coords: { top: number; left: number } | undefined = $state();

	/** The width at which the panel stops being the screen and becomes a card
	 *  beside the text. Duplicated in the media query below, which cannot read
	 *  it; the two are one decision and are commented as one. */
	const CARD_QUERY = '(min-width: 48rem)';

	const isCard = () => typeof window !== 'undefined' && window.matchMedia(CARD_QUERY).matches;

	/**
	 * Measure the card against its trigger. `computePanelPosition` puts it
	 * below when it fits and above when it does not, and clamps it inside the
	 * viewport either way — the same positioner `AnchorMenu` and `LinkPreview`
	 * use for panels hung off arbitrary points.
	 *
	 * Nothing to do in sheet form: the dialog is `inset: 0` there and the
	 * coordinates are not read at all. Clearing them rather than leaving them
	 * stale is what makes a rotation from card to sheet and back re-measure
	 * instead of restoring a position from the previous orientation.
	 */
	function reposition() {
		if (!open || !dialogEl || !triggerEl) return;
		if (!isCard()) {
			coords = undefined;
			return;
		}
		coords = computePanelPosition(
			triggerEl.getBoundingClientRect(),
			dialogEl.getBoundingClientRect()
		);
	}

	/**
	 * `await tick()` before `showModal()`, because the list inside is rendered
	 * by `{#if open}` and the dialog has to hold its real size before it can
	 * be measured against the trigger. Both happen in the same task, so there
	 * is no frame in which the card is painted in the wrong place — which is
	 * the flash `AnchorMenu` has to hide with a `visibility` toggle, its own
	 * popover being opened asynchronously by `ontoggle`.
	 */
	async function openPanel() {
		if (dialogEl?.open) return;
		open = true;
		await tick();
		dialogEl?.showModal();
		reposition();
		revealCurrent();
	}

	/**
	 * Open on the reader's own row, not at row 1.
	 *
	 * `StructureSidebarToc` already scrolls its current row into view on
	 * mount, and that effect cannot do this job here: the list mounts while
	 * the dialog is still closed, and a closed `<dialog>` is `display: none`,
	 * where scrolling anything is a no-op. So the panel does it itself, after
	 * `showModal()`. Found by `aria-current`, which the row carries anyway,
	 * rather than by the child's element id — that id is per-instance
	 * (`$props.id()`) and deliberately unknowable from out here.
	 *
	 * Sets `scrollTop` rather than calling `scrollIntoView`, for the reason
	 * `IndexSidebarToc` gives at length: `scrollIntoView` walks every
	 * scrollable ancestor up to the viewport, and the document behind an open
	 * modal is inert but still scrollable — a reader who closed the panel
	 * would find the page somewhere else. Setting one container's `scrollTop`
	 * cannot move the page.
	 *
	 * Centred, not `nearest`: the box has just rendered scrolled to the top,
	 * so `nearest` would bring the row to the bottom edge with the whole list
	 * above it and nothing below. The reader wants to see what surrounds where
	 * they are.
	 */
	function revealCurrent() {
		const box = dialogEl?.querySelector<HTMLElement>('.sheet-body');
		const row = box?.querySelector<HTMLElement>('[aria-current="page"]');
		if (!box || !row) return;
		const rowBox = row.getBoundingClientRect();
		const boxBox = box.getBoundingClientRect();
		box.scrollTop += rowBox.top - boxBox.top - (boxBox.height - rowBox.height) / 2;
	}

	/* Escape and the backdrop both close the dialog natively, so `onclose` is
	   the one place that runs on every dismissal — including the two this
	   component never hears about directly. Focus goes back to the trigger
	   from here for the same reason: otherwise it lands on `<body>` and a
	   keyboard reader is returned to the top of the document rather than to
	   the control they opened. */
	function onClose() {
		open = false;
		coords = undefined;
		triggerEl?.focus();
	}

	/* A click that lands on the dialog ITSELF is a click on the backdrop: the
	   dialog is transparent and has no padding, so every visible pixel belongs
	   to `.sheet-panel` inside it. Same test, and the same reason for it, as
	   `JumpBox`'s `onDialogClick`. Never fires in sheet form, where the panel
	   fills the dialog and there is no backdrop to hit. */
	function onDialogClick(e: MouseEvent) {
		if (e.target === dialogEl) dialogEl.close();
	}

	/**
	 * A panel whose rows are links has to close when one is followed.
	 *
	 * An action rather than an `onclick` on the panel `<div>`, because a click
	 * handler on a non-interactive element is what
	 * `a11y_no_static_element_interactions` is about, and the warning would be
	 * right — the div is not the thing being clicked, the anchor inside it is.
	 *
	 * Modified clicks are left alone. ⌘/Ctrl/shift-click opens the row in a new
	 * tab or window and this page does not move, so closing the panel would
	 * take away the list a reader is opening several rows from.
	 */
	function closeOnFollow(node: HTMLElement) {
		const onclick = (e: MouseEvent) => {
			if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
			if (e.target instanceof Element && e.target.closest('a[href]')) dialogEl?.close();
		};
		node.addEventListener('click', onclick);
		return { destroy: () => node.removeEventListener('click', onclick) };
	}
</script>

<!-- Scroll as well as resize: the card is anchored to a control in a STICKY
     bar, so the trigger moves under the page rather than with it, and a card
     left where it opened drifts off its anchor. The sheet ignores both. -->
<svelte:window onresize={reposition} onscrollcapture={reposition} />

<div class="toc-menu">
	<button
		type="button"
		bind:this={triggerEl}
		class="menu-trigger"
		aria-haspopup="dialog"
		aria-expanded={open}
		aria-label={label}
		title={label}
		onclick={openPanel}
	>
		<Icon name="table-of-contents" />
	</button>

	<!-- Always in the markup, empty until opened: `showModal()` needs an
	     element to be called on, and a closed `<dialog>` is `display: none`, so
	     nothing inside is reachable, focusable or announced meanwhile. The
	     `{#if}` is what keeps the tree itself from being built twice on every
	     page — see `content`'s own note.

	     No `role="dialog"`, no `aria-modal`: `showModal()` carries both.
	     `aria-labelledby` would be the natural name, but the heading it would
	     point at is rendered by the child component under an id this one
	     cannot know, so the label is stated here — the same string the child
	     sets its heading from. -->
	<dialog
		bind:this={dialogEl}
		class="dialog-bare sheet toc-dialog"
		aria-label={label}
		style:--toc-top={coords ? `${coords.top}px` : '0px'}
		style:--toc-left={coords ? `${coords.left}px` : '0px'}
		onclose={onClose}
		onclick={onDialogClick}
	>
		{#if open}
			<div class="sheet-panel">
				<!-- The head carries the list's own title because the child's
				     heading is hidden inside this panel (see the `:global`
				     rule below), which is what keeps the words from appearing
				     twice in the first two lines of the sheet. Why it may not
				     scroll away with the list is `app.css`'s `.sheet-head`:
				     in sheet form this button is the only way out. -->
				<div class="sheet-head">
					<h2 class="sheet-title">{label}</h2>
					<button
						type="button"
						class="sheet-close"
						aria-label={t('ui.close')}
						title={t('ui.close')}
						onclick={() => dialogEl?.close()}
					>
						<Icon name="x" />
					</button>
				</div>
				<div class="sheet-body" use:closeOnFollow>
					{@render content()}
				</div>
			</div>
		{/if}
	</dialog>
</div>

<style>
	/* `.toc-menu` ITSELF IS STYLED IN app.css, NOT HERE, and that is a
	   specificity fact rather than a filing preference: Svelte compiles a
	   scoped rule to `.toc-menu.svelte-hash`, which outranks the plain
	   `.toc-menu { display: none }` that hides this control once the sidebar
	   comes back — so a `display` declared here would quietly win, and the
	   trigger would sit in the bar beside the sidebar it stands in for. The
	   wrapper's whole story is where it appears, so it is stated where the
	   rest of that story is.

	   The dialog and its panel are `.dialog-bare`/`.sheet`/`.sheet-*`, also
	   from app.css, where the sheet is written as the default because the
	   phone is the case it exists for. Everything below is this component's
	   departure from it. */

	/*
	 * The list's own heading, suppressed — `.sheet-head` says the same words
	 * and stays put while the list scrolls under it, which a heading inside
	 * the scroll area cannot do. Reaching into the child is the price of the
	 * sticky header; the alternative was a presentation prop on
	 * `StructureSidebarToc` describing where it was being rendered, which is
	 * the kind of knowledge a component should not have about its caller.
	 *
	 * The `<nav>` keeps its accessible name: `aria-labelledby` resolves
	 * against hidden text by specification, so the heading still names the
	 * landmark it is `display: none` for.
	 */
	.sheet-body :global(.sidebar-toc-heading) {
		display: none;
	}

	/*
	 * ...AND ABOVE 48rem IT IS A CARD AGAIN, anchored to the trigger by
	 * `reposition()`. See the docblock for why the line is here and not at the
	 * sidebar's own 80rem: a screen with room to read around the panel should
	 * still show the text.
	 *
	 * These are the declarations that overrule the shared `.sheet`, and they
	 * do it without `!important`: a scoped selector compiles to
	 * `.toc-dialog.svelte-hash`, which outranks a global single class.
	 *
	 * `inset: auto` first, or the sheet's `inset: 0` keeps winning over `top`
	 * and `left` — a `<dialog>` is `position: fixed` in both forms and all four
	 * insets resolve, not just the two named here.
	 */
	@media (min-width: 48rem) {
		.toc-dialog {
			inset: auto;
			top: var(--toc-top);
			left: var(--toc-left);
			inline-size: 22rem;
			block-size: auto;
			max-block-size: min(30rem, 70vh);
			border: 1px solid var(--color-border);
			border-radius: 0.5rem;
			box-shadow: 0 10px 30px rgb(0 0 0 / 25%);
			overflow: hidden;
		}
	}
</style>
