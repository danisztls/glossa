import { computePanelPosition, trackAnchor } from './floating';

/**
 * One native popover placed against something in the page: its state, where
 * it goes, and the four lines of ceremony a `[popover]` needs that nothing
 * about a given panel's content has anything to do with.
 *
 * THE REACTIVE HALF OF `floating.ts`, split by file extension rather than by
 * subject — `$state` and `$effect` only work in a `.svelte.ts` module, so the
 * pure geometry (`computePanelPosition`, `keepInViewport`, `inlineShift`) and
 * the plain listener plumbing (`trackAnchor`) stay next door where they can
 * be unit-tested in a `node` environment with no layout to measure.
 *
 * IT EXISTS BECAUSE THE SAME TWENTY LINES WERE WRITTEN A THIRD TIME. The
 * popover a footnote marker opens (`NoteCard`), the popover a unit number
 * opens (`AnchorMenu`) and the card a plate's caption opens (`Plate`) are
 * three unrelated pieces of apparatus that agree completely about mechanism:
 * measure on `toggle`, write `top`/`left`/`visibility` straight to the
 * element, mirror the browser's open state back into Svelte, and track the
 * anchor while — and only while — something is open. Each had its own copy,
 * each with its own paragraph explaining the same ordering hazard, and the
 * third copy is what made the point: this is not three behaviours that happen
 * to look alike, it is one behaviour with three contents.
 *
 * WHAT DELIBERATELY DID NOT MOVE, on `menu.svelte.ts`'s principle: the
 * markup, the styling and the content. A consumer still writes its own
 * `<span popover>` (or `<div>`), its own ARIA, its own scoped CSS and its own
 * trigger. Only what was genuinely identical is here. That also sidesteps a
 * real limitation rather than merely preferring to: a panel rendered by a
 * shared component could not be styled by the component that opens it without
 * `:global`, because Svelte's scoped classes stop at the component boundary —
 * and these three panels want three different widths, paddings and type.
 *
 * `LinkPreview` is NOT a consumer and should not become one. It is the hover
 * card, and it dismisses on scroll where these track (see `trackAnchor` on
 * why that difference is a statement about what a panel IS), it is
 * `popover="manual"` so that it can sit over an `auto` popover without
 * light-dismissing it, and it fades rather than appearing. Nothing here would
 * fit it without a flag per difference.
 */
export class AnchoredPanel {
	/** The panel's element id, so a `<button popovertarget>` can name it.
	 *  Expected to come from `$props.id()`, which is per INSTANCE — a chapter
	 *  renders dozens of these and each needs an id of its own. Empty for a
	 *  panel nothing names, which is a panel shown imperatively. */
	readonly id: string;

	/** The trigger, when it is in the same component — `bind:this` target.
	 *  Read through `#anchor`, so a consumer whose trigger lives elsewhere
	 *  passes a getter to the constructor instead and leaves this unset. */
	trigger: HTMLElement | undefined = $state();

	/** The panel itself — `bind:this` target, always. */
	panel: HTMLElement | undefined = $state();

	/** Mirrors the popover's own state: for the trigger's `aria-expanded`,
	 *  and to decide whether tracking the anchor is worth a listener. */
	open: boolean = $state(false);

	readonly #anchor: () => HTMLElement | undefined;

	/**
	 * CONSTRUCTED DURING COMPONENT INITIALISATION, which is not decoration:
	 * the constructor declares the `$effect` that owns this panel's tracking,
	 * and a rune outside init has no component to attach to.
	 */
	constructor(id: string, anchor?: () => HTMLElement | undefined) {
		this.id = id;
		this.#anchor = anchor ?? (() => this.trigger);
		// Only while open. One of these per note, per unit number and per
		// plate means a long chapter has dozens, and a scroll listener per
		// rendered marker is the mistake `AnchorMenu` records not making.
		// Tracking rather than dismissing because these were opened on
		// purpose — see `trackAnchor`.
		$effect(() => (this.open ? trackAnchor(() => this.place()) : undefined));
	}

	/**
	 * PLACED IMPERATIVELY, not through a template, because the ordering is
	 * the whole difficulty. `toggle` fires AFTER the popover is shown, so a
	 * coordinate that travelled back through Svelte's update cycle would
	 * leave one painted frame at the panel's static position — which for a
	 * marker mid-paragraph is the middle of the sentence. The panel starts
	 * `visibility: hidden` (`.floating-panel` in app.css) and is revealed
	 * here, in the same synchronous turn that measures it, so there is no
	 * such frame to see.
	 *
	 * It cannot be measured any earlier either: a closed popover is
	 * `display: none`, and `getBoundingClientRect` on one is all zeroes.
	 */
	place() {
		const anchor = this.#anchor();
		if (!this.panel || !anchor) return;
		const at = computePanelPosition(
			anchor.getBoundingClientRect(),
			this.panel.getBoundingClientRect()
		);
		this.panel.style.top = `${at.top}px`;
		this.panel.style.left = `${at.left}px`;
		this.panel.style.visibility = 'visible';
	}

	/**
	 * The one thing native dismissal does NOT do is tell Svelte. Escape, a
	 * light dismiss and another popover superseding this one all hide the
	 * element without touching anything here, which would leave the trigger's
	 * `aria-expanded` reading `true` over a panel nobody can see. `toggle` is
	 * the one event every close path fires.
	 *
	 * An arrow property so a consumer can hand it straight to `ontoggle`
	 * without it losing `this`; the work is a method, so a subclass can add
	 * to it (`NoteCard` drops its hover claim there) and a component that
	 * needs one more line can call this and then write it.
	 */
	onToggle = (e: ToggleEvent) => this.toggled(e.newState === 'open');

	toggled(open: boolean) {
		this.open = open;
		if (open) this.place();
		else if (this.panel) this.panel.style.visibility = 'hidden';
	}

	/** Whether the element is actually showing, asked of the DOM rather than
	 *  of `open` — the two agree except inside the same turn as a call below,
	 *  and these are the guards that keep them agreeing. */
	get shown(): boolean {
		return this.panel?.matches(':popover-open') ?? false;
	}

	/** Show it without a declared invoker, for a trigger that cannot carry
	 *  `popovertarget` — the attribute is valid on `<button>` only, and a
	 *  unit number is deliberately a real `<a href>`. The guard is required,
	 *  not tidy: `showPopover()` on an already-open popover throws
	 *  `InvalidStateError`. */
	show() {
		if (this.panel && !this.shown) this.panel.showPopover();
	}

	hide() {
		if (this.panel && this.shown) this.panel.hidePopover();
	}
}
