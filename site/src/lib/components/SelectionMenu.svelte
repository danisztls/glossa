<!--
	The popover a highlight raises: bookmark, copy, copy link.

	MOUNTED ONCE IN `+layout.svelte`, never imported anywhere else — the
	arrangement `LinkPreview` already stands on, and for its reason. Every
	reading route sets text, and a component each of them had to render is one
	edit per route to add the feature and one more route that quietly does
	without it. One listener on the document reads whatever the reader
	highlighted and asks the MARKUP which unit it lies in, so a route opts in
	by saying what its units are (`data-unit-href`) rather than by knowing this
	component exists.

	WHAT IT SAVES IS THE UNIT, NOT THE WORDS. A bookmark here is an address and
	nothing else, so a highlight has to resolve to one — `selection.ts` holds
	that decision and the reasoning behind it, including why a Bible highlight
	drawn across three verses saves the passage and a document highlight saves
	the section it started in.

	THIS PANEL IS `AnchorMenu` WITH VIEW DROPPED. A reader who highlights a
	sentence is looking at it; an eye offering to take them to the address they
	are standing on is a control that does nothing. Everything else is the
	same, deliberately — the same three glyphs, the same shared row
	(`styles/menus.css`), the same glyph-swap confirmation, the same live
	region — because copying a whole verse from its number and a phrase from a
	highlight is one gesture at two grains, and two panels that disagreed about
	how they look would make it read as two features.

	THE COPY IS WHERE THE HIGHLIGHT'S PRECISION GOES. What the address cannot
	hold, the clipboard can: the copy takes exactly the words on screen, in the
	edition on screen, with the unit's citation under them. That is the one
	thing this panel does that the unit number's cannot.

	AND THE BOOKMARK KEEPS THE WORDS TOO, which is a deliberate break with
	"a bookmark is an address and nothing else" — `bookmarks.svelte.ts` records
	what that costs and why a highlight earns it. The address still decides
	everything the library derives; the quote is the part of the reader's act
	that no address can hold.

	POINTERUP, NOT `selectionchange`. Opening on every selection change would
	drag the panel along under the pointer for the length of a sentence.
	`selectionchange` is used for the opposite: a highlight the reader has
	cleared takes the panel with it. The keyboard path is `keyup`, which is
	where a shift-arrow selection settles.

	DESKTOP ONLY, gated on `canHover()`. A touch screen raises its own
	selection callout over the words, with its own copy button and its own
	handles; a second panel would be fighting the platform for the same strip
	of screen and losing — the callout is drawn above the selection, in the top
	layer of a layer this page cannot reach.
-->
<script lang="ts">
	import { t } from '$lib/i18n.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import { parseHref } from '$lib/address';
	import { canHover } from '$lib/floating';
	import { AnchoredPanel } from '$lib/floating.svelte';
	import {
		APPARATUS_SELECTOR,
		elideQuote,
		quoteWithCitation,
		shareHref,
		spanAddress,
		tidyQuote
	} from '$lib/selection';
	import Icon from './Icon.svelte';

	/** The highlight this panel is about, cloned from the reader's selection so
	 *  a later collapse cannot empty the range under the buttons. It is also
	 *  the panel's ANCHOR: a `Range` reports a rectangle exactly as an element
	 *  does, which is the whole of what `AnchoredPanel` asks of one. */
	let range: Range | undefined = $state();
	/** The address the highlight resolved to — what gets bookmarked, linked and
	 *  cited. */
	let href: string | undefined = $state();
	/** The edition those words were read in, for the LINK alone. A bookmark
	 *  stays edition-free on purpose (`bookmarks.svelte.ts`); a link handed to
	 *  somebody else is the opposite artifact and wants to show them exactly
	 *  what the sender saw. */
	let edition: string | undefined = $state();

	interface Context {
		unit: string;
		/** The element the address came off, for measuring what the highlight
		 *  left behind inside it — see `cutInto`. */
		element: HTMLElement;
		surface: HTMLElement;
		edition: string | undefined;
	}

	const card = new AnchoredPanel('', () => range);

	/** Which copy button was pressed and how it went, so that button alone
	 *  swaps its glyph. `AnchorMenu`'s arrangement, cleared on the same timer. */
	let status: { action: 'copy' | 'copyLink'; ok: boolean } | undefined = $state();
	let statusTimer: ReturnType<typeof setTimeout> | undefined;

	const bookmarked = $derived(href !== undefined && bookmarks.has(href));
	const bookmarkLabel = $derived(bookmarked ? t('bookmark.remove') : t('bookmark.add'));
	/** Announced, not shown — the glyph is what a sighted reader sees. */
	const announcement = $derived(
		status ? (status.ok ? t('anchor.copied') : t('anchor.copyFailed')) : ''
	);

	/**
	 * The unit a node sits in, and the reading surface it sits on.
	 *
	 * `closest` finds the NEAREST `data-unit-href`, which is what makes one
	 * attribute serve both grains: a chapter route puts it on every verse, and
	 * a single-unit page puts it on `.reading-text` itself, where the whole
	 * page is the unit. A highlight in matter that is numbered nowhere — a
	 * chapter introduction, an appendix the source printed with no number —
	 * therefore resolves to the page's own address, which is exactly what the
	 * bookmark control on that page already saves.
	 *
	 * `[popover]` is refused because text inside an open card is not the text
	 * of the page: a footnote's source, a hover preview's excerpt and this
	 * panel's own live region are all inside the reading surface in the
	 * markup, and all of them are apparatus over it rather than part of it.
	 */
	function context(node: Node): Context | undefined {
		const el = node instanceof Element ? node : node.parentElement;
		if (!el || el.closest('[popover]')) return undefined;
		const surface = el.closest<HTMLElement>('.reading-text');
		const unit = el.closest<HTMLElement>('[data-unit-href]');
		if (!surface || !unit || !surface.contains(unit)) return undefined;
		const href = unit.dataset.unitHref;
		// `data-edition` is the SURFACE's, never a unit's: every unit on a page
		// is the same edition, and in compare mode each column is its own
		// surface and its own edition. A surface that declares none — the
		// Bible's book introduction — copies a link with no pin, which is an
		// ordinary link and still a good one.
		return href
			? { unit: href, element: unit, surface, edition: surface.dataset.edition }
			: undefined;
	}

	/**
	 * Every unit the highlight actually covers, in document order.
	 *
	 * THE ENDS OF A RANGE DO NOT NAME THE UNITS AT ITS ENDS, which is what
	 * made a highlight drawn across three verses bookmark the first one. A
	 * selection that finishes on an element boundary reports its
	 * `endContainer` as the PARENT with an offset — so walking up from it
	 * found `.reading-text`, whose `data-unit-href` is the page's own address,
	 * and a bare chapter has no verse for `spanAddress` to close a passage at.
	 * It degraded to the start, silently and plausibly.
	 *
	 * Reading the units out of the range's own CONTENTS asks the question the
	 * right way round. A clone carries every partially covered ancestor, so a
	 * highlight starting mid-verse still brings that verse with it, and the
	 * common ancestor — the surface — is not in it at all, which is exactly
	 * the element that was being mistaken for a unit.
	 *
	 * Empty is the ordinary case and not a failure: a highlight inside one
	 * unit contains no unit element, and on a single-unit page the surface IS
	 * the unit. Both fall back to the boundary contexts below.
	 */
	function unitsCovered(range: Range): string[] {
		const fragment = range.cloneContents();
		return [...fragment.querySelectorAll<HTMLElement>('[data-unit-href]')]
			.filter((el) => tidyQuote(el.textContent ?? '') !== '')
			.flatMap((el) => (el.dataset.unitHref ? [el.dataset.unitHref] : []));
	}

	function dismiss() {
		card.hide();
		range = undefined;
		href = undefined;
		edition = undefined;
	}

	/**
	 * Read the reader's selection and decide whether this panel is about it.
	 *
	 * Every refusal is a dismissal rather than a no-op: the panel may already
	 * be open over the PREVIOUS highlight, and a reader who has just selected
	 * something else must not be left with buttons acting on words they can no
	 * longer see.
	 */
	function evaluate() {
		if (!canHover()) return;
		const selection = document.getSelection();
		if (!selection || selection.isCollapsed || selection.rangeCount === 0) return dismiss();

		const live = selection.getRangeAt(0);
		// A highlight of nothing but whitespace — a drag that overshot the end
		// of a paragraph, a double-click on the gap between two verses — is a
		// selection the browser reports and the reader did not make.
		if (!tidyQuote(live.toString())) return dismiss();

		// A `Range` is always in document order however the reader drew it, so
		// start and end are first and last rather than anchor and focus.
		const from = context(live.startContainer);
		const to = context(live.endContainer);
		// One reading surface: compare mode's two columns are two of them, and
		// a highlight drawn across the divider belongs to neither.
		if (!from || !to || from.surface !== to.surface) return dismiss();

		const covered = unitsCovered(live);
		href = spanAddress(covered[0] ?? from.unit, covered[covered.length - 1] ?? to.unit);
		edition = from.edition;
		range = live.cloneRange();
		// Already open over an extended selection: re-measure rather than
		// re-show, which would throw on a popover that is showing.
		if (card.shown) card.place();
		else card.show();
	}

	/**
	 * The words the reader highlighted, with the apparatus taken out.
	 *
	 * Read at COPY time and not at open time: a reader may extend the
	 * highlight with the panel open, and the words on the clipboard have to be
	 * the words on the screen.
	 */
	function quote(): string {
		if (!range) return '';
		return textOf(range.cloneContents());
	}

	/**
	 * The same words as the LIBRARY will show them, which is not quite the same
	 * artifact.
	 *
	 * A row in `/signata` is read cold, months later, with nothing around it;
	 * the clipboard is pasted into a sentence the reader is writing, where the
	 * elision marks would be theirs to place. So the stored quotation says
	 * where it was cut from and the copied one does not — see `elideQuote`.
	 */
	function excerpt(): string {
		if (!range) return '';
		return elideQuote(quote(), {
			head: cutInto(range, 'head'),
			tail: cutInto(range, 'tail')
		});
	}

	/**
	 * Whether words the reader did not take stand before the highlight, or
	 * after it, inside the unit at that end.
	 *
	 * The UNIT is the frame and not the surface, because the unit is what the
	 * bookmark names: a highlight covering the whole of verse 3 is a whole
	 * quotation of what the row cites, however much of the chapter runs on
	 * either side of it. Apparatus is taken out first, or a verse whose number
	 * precedes its first word would be cut into at the head every time.
	 */
	function cutInto(live: Range, side: 'head' | 'tail'): boolean {
		const unit = context(side === 'head' ? live.startContainer : live.endContainer)?.element;
		if (!unit) return false;
		const rest = document.createRange();
		rest.selectNodeContents(unit);
		if (side === 'head') rest.setEnd(live.startContainer, live.startOffset);
		else rest.setStart(live.endContainer, live.endOffset);
		return textOf(rest.cloneContents()) !== '';
	}

	/** A cloned fragment as the words in it, with the apparatus taken out. The
	 *  fragment is a copy, so removing from it takes nothing off the page. */
	function textOf(fragment: DocumentFragment): string {
		for (const el of fragment.querySelectorAll(APPARATUS_SELECTOR)) el.remove();
		return tidyQuote(fragment.textContent ?? '');
	}

	function flash(action: 'copy' | 'copyLink', ok: boolean) {
		status = { action, ok };
		clearTimeout(statusTimer);
		statusTimer = setTimeout(() => (status = undefined), 1600);
	}

	/** The glyph a copy button shows right now: itself, or the verdict. */
	function glyph(action: 'copy' | 'copyLink', resting: 'copy' | 'link') {
		if (status?.action !== action) return resting;
		return status.ok ? 'check' : 'x';
	}

	async function write(action: 'copy' | 'copyLink', text: string) {
		try {
			await navigator.clipboard.writeText(text);
			flash(action, true);
		} catch {
			// Denied permission, an insecure context, or a browser without the
			// API. Nothing to recover — say so and leave the panel open.
			flash(action, false);
		}
	}

	/**
	 * `citation-label.ts` IS IMPORTED HERE AND NOT AT THE TOP, because this
	 * component is rendered by `+layout.svelte` and a static import from a
	 * component the layout renders is boot-chunk code on every route
	 * (site/CLAUDE.md) — that module reaches the corpus readers, the manifests
	 * and the existence sets, for a string nothing needs until a reader
	 * presses Copy. The copy is already asynchronous (the clipboard is), so
	 * the wait costs nothing anybody can see, and by the time a highlight
	 * exists the page's own indexes have long been primed.
	 */
	async function copyText() {
		const text = quote();
		if (!text) return flash('copy', false);
		const target = href ? parseHref(href) : undefined;
		if (!target) return write('copy', text);
		const { citationFor } = await import('$lib/citation-label');
		await write('copy', quoteWithCitation(text, citationFor(target)));
	}

	/**
	 * The link, which is the one thing here that has to survive being sent to
	 * somebody else.
	 *
	 * THREE PARTS, and the address is only the first. The unit's canonical URL
	 * says which paragraph; `?ed=` says which edition it was read in
	 * (`edition-pin.ts`); the text directive says which words, and the
	 * recipient's browser finds them. The last two are what make it
	 * deterministic rather than approximate — a link to `#s3` alone opens
	 * whatever edition the recipient prefers, at a section that may be a page
	 * long, and says nothing about the sentence that was worth sending.
	 *
	 * Built from the range at COPY time, like the quotation and for the same
	 * reason: the reader may have extended the highlight since the panel
	 * opened, and the link has to name what is on the screen.
	 */
	async function copyLink() {
		if (!href) return flash('copyLink', false);
		const link = shareHref(href, edition, quote());
		await write('copyLink', new URL(link, location.href).href);
	}

	/**
	 * A close by any route — Escape, a light dismiss, another popover
	 * superseding this one — has to reach the state this component holds, or
	 * the next highlight is measured against a range the reader has forgotten.
	 */
	function onToggle(e: ToggleEvent) {
		card.onToggle(e);
		if (!card.open) {
			range = undefined;
			href = undefined;
			edition = undefined;
			status = undefined;
		}
	}

	/**
	 * KEEP THE HIGHLIGHT ALIVE WHILE A BUTTON IS PRESSED, and the panel does
	 * not work without it: a press anywhere outside a selection collapses it,
	 * so by the time `click` ran there would be no words left to copy and no
	 * unit left to bookmark. Preventing the default keeps them selected under
	 * the reader's own eyes, which is what a native selection callout does
	 * too.
	 *
	 * Attached to the element rather than written as `onmousedown` in the
	 * markup because the panel is a container, not a control — a handler on a
	 * bare `<div>` is a static element claiming an interaction, which is
	 * exactly what the a11y lint exists to catch, and here the claim would be
	 * false: what is interactive is the three buttons inside.
	 */
	$effect(() => {
		const panel = card.panel;
		if (!panel) return;
		const keepSelection = (e: MouseEvent) => e.preventDefault();
		panel.addEventListener('mousedown', keepSelection);
		return () => panel.removeEventListener('mousedown', keepSelection);
	});

	$effect(() => () => clearTimeout(statusTimer));
</script>

<!-- The selection settles on the pointer coming up, and the panel is placed
     from there. A pointerup INSIDE the panel is a button being pressed, not a
     highlight being made: re-evaluating there would measure a selection the
     reader has not touched and, on the release that dismissed the panel,
     bring it back. -->
<!-- AFTER THE GESTURE, NOT INSIDE IT, and the panel does not open at all
     without the deferral. Light dismiss is not a listener that can be
     out-ordered: the browser records the pointerDOWN target and acts on
     pointerUP, after the event has finished dispatching, hiding every `auto`
     popover that is not an ancestor of what was pressed. A panel shown from
     inside that pointerup is therefore opened and shut in one gesture, with
     nothing to see and nothing logged. It is also why a `popovertarget`
     button works: that one toggles on `click`, which is dispatched after
     pointerup — after light dismiss has already run and found nothing open.

     One task later is the whole fix, and it pays for a second thing on the
     way: Firefox settles `selectionchange` after pointerup, so a selection
     read inside the gesture can still be the PREVIOUS one. -->
<svelte:window
	onpointerup={(e) => {
		// Read now, not in the callback: by then the panel may have been
		// dismissed and `e.target` is no longer worth asking about.
		if (e.target instanceof Node && card.panel?.contains(e.target)) return;
		setTimeout(evaluate);
	}}
	onkeyup={(e) => {
		// Where a shift-arrow selection comes to rest. Everything else — a
		// letter typed into the jump box, a bare arrow scrolling the page —
		// leaves the selection alone and must leave the panel alone with it.
		// Deferred too, so both paths reach `evaluate` the same way.
		if (e.key === 'Shift' || e.shiftKey) setTimeout(evaluate);
	}}
/>
<!-- The one thing `selectionchange` is for: a highlight the reader cleared,
     by a click anywhere or by starting a new one. Opening is `pointerup`'s,
     or the panel would follow the pointer across the sentence being drawn. -->
<svelte:document
	onselectionchange={() => {
		if (!range) return;
		const selection = document.getSelection();
		if (!selection || selection.isCollapsed) dismiss();
	}}
/>

<!-- `data-link-preview="off"` sits on the panel and is inherited by
     everything inside, so no action here can raise a hover preview on top of
     the popover the reader just opened. What keeps the highlight alive while
     a button is pressed is the `mousedown` listener above. -->
<div
	bind:this={card.panel}
	popover="auto"
	ontoggle={onToggle}
	class="panel-surface floating-panel actions-panel"
	data-link-preview="off"
>
	<ul
		class="panel-actions"
		role="menu"
		aria-orientation="horizontal"
		aria-label={t('anchor.actions')}
	>
		<li role="none">
			<button
				type="button"
				role="menuitemcheckbox"
				aria-checked={bookmarked}
				class="panel-action"
				class:bookmarked
				aria-label={bookmarkLabel}
				title={bookmarkLabel}
				onclick={() => href && bookmarks.toggle(href, { quote: excerpt(), edition })}
			>
				<Icon name="bookmark" filled={bookmarked} />
			</button>
		</li>
		<li role="none">
			<button
				type="button"
				role="menuitem"
				class="panel-action"
				aria-label={t('anchor.copy')}
				title={t('anchor.copy')}
				onclick={copyText}
			>
				<Icon name={glyph('copy', 'copy')} />
			</button>
		</li>
		<li role="none">
			<button
				type="button"
				role="menuitem"
				class="panel-action"
				aria-label={t('anchor.copyLink')}
				title={t('anchor.copyLink')}
				onclick={copyLink}
			>
				<Icon name={glyph('copyLink', 'link')} />
			</button>
		</li>
	</ul>
	<p class="visually-hidden" aria-live="polite">{announcement}</p>
</div>
