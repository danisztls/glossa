<!--
	The popover a unit number opens: copy, copy link, view, bookmark.

	WHY THE NUMBER STOPPED BEING A PLAIN LINK. The unit number is the most
	touched affordance in the reader and it did exactly one thing — navigate —
	which for a Bible verse meant navigating to text already on the screen.
	Everything else a reader wants from an address they can see (quote it, send
	it, come back to it) required selecting text by hand and reconstructing the
	URL from the address bar. The number is still a real `<a href>`, so
	⌘/ctrl-click, middle-click and the native context menu are untouched; only
	the plain left click is intercepted (see `ReferenceNumber.svelte`).

	The panel does NOT close on copy or on bookmark — the reader needs to see
	the confirmation and the changed state, the same reasoning `AppearanceMenu`
	records for staying open while a reader watches the page change. `Open` is
	an ordinary link and closes by navigating.

	A ROW OF ICONS, NOT A LIST OF ROWS. Four actions with four distinct glyphs
	do not need four lines of prose next to a paragraph of text — a vertical
	list here reads as a page of its own opening over the one being read. The
	labels are carried by `title`, so they surface the way every other icon
	control on this site surfaces its name, and the panel is exactly the size
	of the row.

	THE COPY CONFIRMATION IS THE ICON, not a line of text. Swapping the pressed
	button's glyph for a tick (or a cross when the clipboard refuses) says the
	same thing in the place the reader is already looking, and — unlike a
	message appearing under the row — cannot resize a panel that may be flipped
	above its anchor, where a height change moves every button out from under
	the pointer. A visually-hidden live region carries the same words for
	assistive tech, which has no glyph to read.

	`data-link-preview="off"` sits on the panel, not on the `Open` link: it is
	inherited by everything inside, so no action here can ever raise a hover
	preview of its own on top of the popover the reader just opened.

	`View`, not `Open`: "open" reads as a second thing appearing — a panel, a
	tab, the popover's own sibling — where all this does is take the reader to
	the address. An eye rather than an open book for the same reason, and
	because a book glyph beside three abstract ones looked like it named the
	work rather than the act.
-->
<script lang="ts">
	import { t } from '$lib/i18n.svelte';
	import { bookmarks } from '$lib/bookmarks.svelte';
	import { parseBookmarkHref } from '$lib/bookmark-target';
	import { resolveBookmark } from '$lib/bookmarkContent';
	import { computePanelPosition } from '$lib/floating';
	import Icon from './Icon.svelte';
	import type { Menu } from './menu.svelte';

	interface Props {
		menu: Menu;
		/** The unit's full, canonical, fragment-bearing address — what gets
		 *  bookmarked and copied. */
		canonicalHref: string;
		/** Where `View` goes. Usually the same address; for an in-page unit it
		 *  is the bare `#v{n}`/`#s{n}` the number already linked to. */
		navHref: string;
	}

	let { menu, canonicalHref, navHref }: Props = $props();

	let panelEl: HTMLElement | undefined = $state();
	let coords: { top: number; left: number } | undefined = $state();
	/** Which copy button was pressed and how it went, so that button alone
	 *  swaps its glyph. Cleared on a timer; the panel is free to be closed and
	 *  reopened in the meantime, which discards it with the component. */
	let status: { action: 'copy' | 'copyLink'; ok: boolean } | undefined = $state();
	let statusTimer: ReturnType<typeof setTimeout> | undefined;

	const bookmarked = $derived(bookmarks.has(canonicalHref));

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

	async function copyText() {
		const target = parseBookmarkHref(canonicalHref);
		const resolved = target ? await resolveBookmark(target) : undefined;
		if (!resolved || !resolved.text) {
			flash('copy', false);
			return;
		}
		// Citation after the text, on its own line: what a reader pastes into a
		// message or a note wants to read as the quotation first.
		await write('copy', `${resolved.text}\n— ${resolved.title}`);
	}

	async function copyLink() {
		await write('copyLink', new URL(canonicalHref, location.href).href);
	}

	const bookmarkLabel = $derived(bookmarked ? t('bookmark.remove') : t('bookmark.add'));
	/** Announced, not shown — the glyph is what a sighted reader sees. */
	const announcement = $derived(
		status ? (status.ok ? t('anchor.copied') : t('anchor.copyFailed')) : ''
	);

	// Measured once the panel is in the DOM — its own size is the input, so
	// this cannot run before it renders. Nothing inside the row resizes it
	// afterwards: every action is a fixed square, and the confirmation is a
	// glyph swap rather than a line of text appearing under the row. That is
	// what the icon-only confirmation buys, since a panel flipped above its
	// anchor has its top edge moved by any height change at all.
	$effect(() => {
		if (!panelEl || !menu.triggerEl) return;
		coords = computePanelPosition(
			menu.triggerEl.getBoundingClientRect(),
			panelEl.getBoundingClientRect()
		);
	});

	// Unlike `LinkPreview`, which dismisses on scroll because a hover preview
	// the reader never asked for should not follow them, this panel was opened
	// deliberately: it tracks instead. `capture: true` is required for the same
	// reason it is there — `scroll` doesn't bubble, so a plain window listener
	// never sees the reading aside's own scrolling.
	let frame: number | undefined;
	function reposition() {
		if (frame !== undefined) return;
		frame = requestAnimationFrame(() => {
			frame = undefined;
			if (!panelEl || !menu.triggerEl) return;
			coords = computePanelPosition(
				menu.triggerEl.getBoundingClientRect(),
				panelEl.getBoundingClientRect()
			);
		});
	}

	$effect(() => () => {
		clearTimeout(statusTimer);
		if (frame !== undefined) cancelAnimationFrame(frame);
	});
</script>

<!-- The outside-click listener lives HERE, not on the trigger, because this
     component only exists while the popover is open. Mounted on the trigger it
     would be one window listener per rendered unit number — a hundred-odd of
     them on a long Bible chapter, all but one of which return immediately. -->
<svelte:window onclick={menu.onWindowClick} onscrollcapture={reposition} onresize={reposition} />

<!-- The `<ul role="menu">` with `role="none"` wrappers is the same accessible
     structure every other menu on the site uses (`LanguageMenu` et al.):
     layout elements between a menu and its items would otherwise break the
     parent/child relationship assistive tech reads. It is horizontal here, and
     says so. Each action is icon-only, so each carries both an `aria-label`
     (the icon has no text to attach one to — see `Icon.svelte`) and a `title`,
     which is what actually shows the name on hover. -->
<div
	bind:this={panelEl}
	class="anchor-menu-panel"
	data-link-preview="off"
	style:top={coords ? `${coords.top}px` : '0'}
	style:left={coords ? `${coords.left}px` : '0'}
	style:visibility={coords ? 'visible' : 'hidden'}
>
	<ul
		class="anchor-menu-row"
		role="menu"
		aria-orientation="horizontal"
		aria-label={t('anchor.actions')}
		onkeydown={menu.onPanelKeydown}
	>
		<li role="none">
			<button
				type="button"
				role="menuitem"
				class="anchor-menu-item"
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
				class="anchor-menu-item"
				aria-label={t('anchor.copyLink')}
				title={t('anchor.copyLink')}
				onclick={copyLink}
			>
				<Icon name={glyph('copyLink', 'link')} />
			</button>
		</li>
		<li role="none">
			<a
				role="menuitem"
				class="anchor-menu-item"
				href={navHref}
				aria-label={t('anchor.view')}
				title={t('anchor.view')}
				onclick={menu.close}
			>
				<Icon name="eye" />
			</a>
		</li>
		<li role="none">
			<button
				type="button"
				role="menuitemcheckbox"
				aria-checked={bookmarked}
				class="anchor-menu-item"
				class:bookmarked
				aria-label={bookmarkLabel}
				title={bookmarkLabel}
				onclick={() => bookmarks.toggle(canonicalHref)}
			>
				<Icon name="bookmark" filled={bookmarked} />
			</button>
		</li>
	</ul>
	<p class="visually-hidden" aria-live="polite">{announcement}</p>
</div>

<style>
	/*
	 * Fixed, not absolute: the trigger can be a verse number mid-line or a
	 * paragraph number in the margin at `-3.25rem`, and only measured
	 * coordinates (`floating.ts`) can know whether the panel fits. Above
	 * `.menu-panel`'s z-index 50 and below `LinkPreview`'s 70, which is the
	 * order those two already have and which this sits between: it is opened
	 * deliberately, so it outranks a header dropdown, but a preview a reader
	 * is pointing at should still land on top.
	 */
	.anchor-menu-panel {
		position: fixed;
		z-index: 60;
		background: var(--color-bg);
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		box-shadow: 0 10px 30px rgb(0 0 0 / 25%);
		padding: 0.3rem 0.35rem;
		font-family: var(--font-sans);
	}

	.anchor-menu-row {
		display: flex;
		align-items: center;
		gap: 0.15rem;
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.anchor-menu-item {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 2.4rem;
		height: 2.4rem;
		padding: 0;
		border: none;
		border-radius: 0.4rem;
		background: transparent;
		color: var(--color-text);
		/* Larger than the header's icon buttons on purpose: this panel is a
		   touch target opened from a number set at 0.75em, often on a phone. */
		font-size: 1.15rem;
		line-height: 1;
		cursor: pointer;
	}

	.anchor-menu-item:hover {
		background: var(--color-bg-elevated);
		color: var(--color-accent);
	}

	.anchor-menu-item:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: -2px;
	}

	.anchor-menu-item.bookmarked,
	.anchor-menu-item.bookmarked:hover {
		color: var(--color-bookmark);
	}
</style>
