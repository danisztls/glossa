<!--
	Thin wrapper around the icon library (@lucide/svelte, docs/decisions.md
	#3, MIT/ISC, inline SVG). This is the ONLY file in the app that imports
	from `@lucide/svelte` — every other component asks for an icon by name
	through this component, so swapping icon libraries later is a one-file
	change instead of a grep-and-replace across the app.

	Icons are always `currentColor` (they inherit the surrounding text
	color) and sized in `em` (they scale with whatever font-size the
	control around them uses) rather than a fixed pixel size. `@lucide/svelte`
	is `sideEffects: false`, so importing named icons from the package root
	still tree-shakes to only the icons actually referenced in `ICONS` below
	— nothing pulls in the full ~1500-icon set.

	Icons are always decorative (`aria-hidden`, enforced here, not a prop):
	per docs/decisions.md's accessibility bar, a control whose only content
	is an icon must carry its own `aria-label` (the button/link, not this
	component) — an icon has no text to attach a label to, so there's
	nothing useful an icon-level label prop would do here.
-->
<script lang="ts" module>
	import Search from '@lucide/svelte/icons/search';
	import Menu from '@lucide/svelte/icons/menu';
	import Languages from '@lucide/svelte/icons/languages';
	import Palette from '@lucide/svelte/icons/palette';
	import Type from '@lucide/svelte/icons/type';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import BookOpen from '@lucide/svelte/icons/book-open';
	import Check from '@lucide/svelte/icons/check';
	import Columns2 from '@lucide/svelte/icons/columns-2';
	import Printer from '@lucide/svelte/icons/printer';
	import Download from '@lucide/svelte/icons/download';
	// Lucide's `share` is the iOS glyph (a box with an arrow leaving the top),
	// not the three-node graph — that one is `share-2`. The distinction matters
	// here: InstallHint tells the reader to tap a specific button on their own
	// screen, so the icon in the sentence has to be the one they are looking at.
	import Share from '@lucide/svelte/icons/share';
	import X from '@lucide/svelte/icons/x';

	const ICONS = {
		search: Search,
		menu: Menu,
		languages: Languages,
		palette: Palette,
		type: Type,
		plus: Plus,
		minus: Minus,
		'rotate-ccw': RotateCcw,
		'book-open': BookOpen,
		check: Check,
		'columns-2': Columns2,
		printer: Printer,
		download: Download,
		share: Share,
		x: X
	};

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		class?: string;
	}

	let { name, class: className }: Props = $props();
	const IconComponent = $derived(ICONS[name]);
</script>

<IconComponent size="1em" aria-hidden="true" class={className} />
