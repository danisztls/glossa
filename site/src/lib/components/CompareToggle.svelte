<!--
	The entry point for compare mode — a plain icon button, same visual
	family as the icon-button controls in the header (`.menu-trigger`,
	app.css), but a toggle rather than a menu: one click flips state, there is
	no panel to open. `aria-pressed` carries the on/off state to assistive
	tech since there's no visible panel to imply it the way `aria-expanded`
	does for the menu controls.

	Rendered by each reading route (not this component) only when a second
	edition actually exists to compare against — same "hide, don't disable"
	posture `EditionMenu` already takes when there's nothing to offer
	(`{#if ctx && editions.length > 0}`), so this component doesn't need a
	`disabled` prop of its own: if it's on the page, comparing is possible.

	`enterLabel`/`exitLabel` default to the generic "Compare editions"/"Exit
	comparison" copy every other caller wants, but are overridable: the
	prayer route's second column is a Latin FIELD on the same work, not a
	second edition (docs/corpus-schema.md "Prayers" — "Latin is a field, not
	an edition"), so calling it a compared "edition" there would be
	inaccurate, not just imprecise. Read reactively inside the template
	(never captured into a plain variable at init) so the label still updates
	if the reader switches UI language while the button is on screen.
-->
<script lang="ts">
	import Icon from './Icon.svelte';
	import { t } from '$lib/i18n.svelte';

	interface Props {
		active: boolean;
		onclick: () => void;
		enterLabel?: string;
		exitLabel?: string;
	}

	let { active, onclick, enterLabel, exitLabel }: Props = $props();

	const label = $derived(
		active ? (exitLabel ?? t('compare.exit')) : (enterLabel ?? t('compare.enter'))
	);
</script>

<button
	type="button"
	class="menu-trigger compare-toggle"
	class:active
	aria-pressed={active}
	aria-label={label}
	title={label}
	{onclick}
>
	<Icon name="columns-2" />
</button>

<style>
	/* `.menu-trigger` (app.css) already gives the right icon-button shape;
	   this only adds the pressed/active state — the same accent treatment
	   `.menu-item.current` uses for "this is the active choice" elsewhere in
	   the chrome, kept local since no other `.menu-trigger` needs a
	   persistent pressed state (the theme/font-size/edition triggers open a
	   panel instead of toggling in place). */
	.compare-toggle.active {
		color: var(--color-accent-contrast);
		background: var(--color-accent);
		border-color: var(--color-accent);
	}
</style>
