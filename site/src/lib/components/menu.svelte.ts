/**
 * The behavior half of the site's dropdown menus.
 *
 * `app.css` has long carried the LOOK of these menus as shared `.menu` /
 * `.menu-trigger` / `.menu-panel` / `.menu-item` primitives. This carries the
 * matching BEHAVIOR — open state, close-on-outside-click, close-on-Escape,
 * and returning focus to the trigger — which until now was hand-rolled,
 * identically, in all five menu components (theme, font size, edition,
 * comparison edition, language). Theme and font size have since merged into
 * one `SettingsMenu`, so there are four — plus `AnchorMenu`, the popover a
 * unit number opens, which is the first consumer whose trigger is an anchor
 * rather than a button and the first whose panel needs measured positioning
 * (`floating.ts`) because it hangs off arbitrary points in flowing prose
 * rather than off a fixed header control.
 *
 * `AnchorMenu` is also the first consumer to take only HALF of this. It is a
 * native `popover`, so `onWindowClick` and `onPanelKeydown` are the browser's
 * job there and it uses neither; what it still wants is `open`, `triggerEl`,
 * and `close` — the state, so Svelte knows whether to render the panel at
 * all, and the trigger, so the panel knows what to measure against. The four
 * header menus use the whole class, and cannot follow it into the top layer
 * without CSS anchor positioning (Baseline January 2026), because their
 * panels are `position: absolute` inside their triggers.
 *
 * WHY IT WAS DUPLICATED, AND WHY THAT NO LONGER APPLIES. `ThemeMenu`'s
 * docblock (now `SettingsMenu`'s) recorded the reason: "Svelte has no
 * cross-file scoped style or behavior sharing below a full component." That
 * was true of the Svelte 4 component model, where the only unit of reuse was
 * a component, and wrapping
 * five different panels (two `<ul>`s, a stepper `<div>`, differing ARIA and
 * differing keyboard handling) in one would have meant a prop for every
 * difference. Runes changed the unit: `$state` works in a `.svelte.ts` module,
 * so a plain object can own reactive state on a component's behalf while the
 * component keeps its own markup. Each menu still writes its own panel, its
 * own ARIA and its own `choose`; only the parts that were genuinely identical
 * moved here.
 *
 * WHAT DELIBERATELY DID NOT MOVE: the `choose` handlers. Every menu closes and
 * refocuses after a pick — that shared step is `closeAndRefocus` below — but
 * WHAT a pick does differs per menu (a theme, a font scale, a reading edition,
 * a compare target), and `SettingsMenu` deliberately does not close on a
 * pick at all, because a reader adjusting how the page looks wants to keep
 * clicking and watching it change. A shared "choose" would have had to take
 * that behavior as a flag, which is the shape this module exists to avoid.
 *
 * `BookChapterPicker` is NOT a user of this and shouldn't become one, despite
 * running visibly similar outside-click and Escape handling. Its open state is
 * WHICH BOOK is expanded (`openOsis`, a book id) rather than a boolean, its two
 * variants anchor their popover two different ways (`absolute` vs `fixed`),
 * and it re-measures panel placement on open and on resize. Nothing here would
 * fit it without growing a second, parallel set of semantics.
 */

/**
 * One dropdown's open/close state and the handlers that maintain it.
 *
 * Handlers are arrow properties, not methods, so a component can pass them
 * straight to `onclick`/`onkeydown` without them losing `this` on the way.
 */
export class Menu {
	open = $state(false);

	/** The `.menu` wrapper — what an outside click is measured against, so the
	 *  trigger and the panel both count as "inside". Bound with `bind:this`. */
	containerEl: HTMLElement | undefined = $state();

	/** The trigger, so focus can return to it on Escape or after a pick —
	 *  otherwise closing the panel drops focus to `<body>` and a keyboard
	 *  reader has to tab back through the page to where they were. Typed
	 *  `HTMLElement` rather than `HTMLButtonElement` because `AnchorMenu`'s
	 *  trigger is the unit number itself, which stays a real `<a href>` so
	 *  that ⌘-click and the native context menu keep working. */
	triggerEl: HTMLElement | undefined = $state();

	toggle = () => {
		this.open = !this.open;
	};

	close = () => {
		this.open = false;
	};

	/** Close and hand focus back to the trigger — every menu does this on
	 *  Escape, and each one that closes on a pick does it there too. */
	closeAndRefocus = () => {
		this.open = false;
		this.triggerEl?.focus();
	};

	/**
	 * Closes on any click outside the trigger+panel. Attached to the WINDOW
	 * rather than to a backdrop element, so the rest of the page stays
	 * clickable: unlike `JumpBox`'s modal dialog, these are lightweight menus,
	 * not dialogs that should block interaction with the page behind them.
	 *
	 * A CONTROL THAT REMOVES ITSELF ON CLICK IS NOT AN OUTSIDE CLICK, and
	 * `contains()` alone cannot tell the difference. Svelte 5 delegates
	 * `click` and flushes the update before the event finishes bubbling, so
	 * by the time this runs the clicked element may already be out of the
	 * document — and a detached node is contained by nothing, which reads here
	 * as "the reader clicked the page" and closes the panel.
	 *
	 * `LanguageMenu`'s "+ more" is the first: it is rendered only while there
	 * is more to show, so clicking it destroys it and the panel it had just
	 * expanded shut itself. `isConnected` is the discriminator — the click
	 * happened while the element was still in the tree, so whether it was
	 * inside was decided then, and a node that is no longer anywhere cannot
	 * be judged now. The alternative was `stopPropagation` at that one call
	 * site, which fixes the instance and leaves the trap for the next menu
	 * with a row that disappears when it is taken.
	 */
	onWindowClick = (e: MouseEvent) => {
		if (!this.open) return;
		if (!(e.target instanceof Node) || !e.target.isConnected) return;
		if (this.containerEl && !this.containerEl.contains(e.target)) {
			this.close();
		}
	};

	/**
	 * Escape closes the panel and restores focus. Menus with their own
	 * additional keys (`SettingsMenu`'s arrows) call this first and then
	 * handle the rest — this only ever acts on Escape, so it composes.
	 */
	onPanelKeydown = (e: KeyboardEvent) => {
		if (e.key !== 'Escape') return;
		e.preventDefault();
		this.closeAndRefocus();
	};
}
