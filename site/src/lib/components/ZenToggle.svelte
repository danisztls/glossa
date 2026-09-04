<!--
	The way into focus mode, and — once in — the only visible way back out.

	`CompareToggle`'s shape exactly: a `.menu-trigger` icon button carrying
	`aria-pressed` rather than `aria-expanded`, because one click flips a state
	and there is no panel to imply it. What it flips is `$lib/zen.svelte.ts`,
	and what that does is `styles/zen.css`; nothing here knows what gets
	hidden.

	IT TAKES NO PROPS AND READS THE STORE DIRECTLY, where `CompareToggle` is
	handed its state and its handler. The difference is real rather than a
	slip: comparison is a property of the page a route owns and can only
	answer for, and focus mode is a property of the reader that outlives every
	route. A prop would mean each of the seventeen callers of `ReadingBar`
	threading through a value none of them decides.

	IT IS THE FIRST CONTROL IN THE ROW, placed by where it has to be FOUND
	rather than by what it acts on — the only control in the bar placed that
	way. Once it is pressed it is the only thing on the bar a reader can see,
	and the bar is the only chrome left on the page; so it goes at the edge the
	row packs against, which is also the edge every line of the text below
	begins from. It does not move between the two modes, because
	`styles/zen.css` hides its siblings without taking their boxes.

	It sat LAST until then, on the argument that the row runs from what is
	being read to how it is being read (see `ReadingBar`) and this is the
	outermost thing on that axis. That reasoning was sound and rested on
	something that stopped being true: while the mode used `display: none`, the
	toggle became the row's only child the moment it was pressed and was packed
	against the inline start regardless of where it had been written. Hidden
	siblings keep their boxes now, and a button at the end would be stranded in
	the middle of a bar that looks empty.

	Either way it stays outside `.reading-bar-editions`, whose three controls
	read as one phrase that a fourth would break.

	NOT HIDDEN ON A PHONE, unlike the shortcut sheet's trigger beside it in the
	header. That one is hidden below 640px because it describes eight keys
	nobody has; this one is worth MORE on a small screen, not less — the
	sidebar is already gone there and the chrome is a larger share of what the
	reader can see at once.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import { t } from '$lib/i18n.svelte';
	import { zen } from '$lib/zen.svelte';

	/* Read inside the template rather than captured at init, the same as
	   `CompareToggle`'s: the label has to follow a language switch while the
	   button is on screen. */
	const label = $derived(zen.on ? t('zen.exit') : t('zen.enter'));
</script>

<button
	type="button"
	class="menu-trigger zen-toggle"
	class:active={zen.on}
	aria-pressed={zen.on}
	aria-label={label}
	title={label}
	onclick={() => zen.toggle()}
>
	<Icon name={zen.on ? 'minimize' : 'maximize'} />
</button>

<style>
	/* The pressed state `CompareToggle` uses, for the same reason and with the
	   same tokens — two toggles in one row that marked themselves differently
	   would read as two kinds of control. It is only ever seen for the instant
	   before the rest of the row goes: once focus mode is on, this button is
	   alone on the bar and the accent is what says the page is in a mode
	   rather than merely quiet. */
	.zen-toggle.active {
		color: var(--color-accent-contrast);
		background: var(--color-accent);
		border-color: var(--color-accent);
	}
</style>
