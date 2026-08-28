<!--
	Thin wrapper around the icon library (@lucide/svelte, docs/decisions.md
	#3, MIT/ISC, inline SVG). This is the ONLY file in the app that imports
	from `@lucide/svelte` — every other component asks for an icon by name
	through this component, so swapping icon libraries later is a one-file
	change instead of a grep-and-replace across the app.

	Icons are always `currentColor` (they inherit the surrounding text
	color) and sized in `em` (they scale with whatever font-size the
	control around them uses) rather than a fixed pixel size.

	`filled` fills the glyph with `currentColor` instead of leaving it an
	outline. Lucide's icons are outlines by default, and for a two-state
	control the outline/solid pair is the state — a bookmark the reader has
	saved reads as filled without needing a second glyph or a colour the
	reader has to learn. `@lucide/svelte`
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
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Plus from '@lucide/svelte/icons/plus';
	import Minus from '@lucide/svelte/icons/minus';
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
	import Bookmark from '@lucide/svelte/icons/bookmark';
	import Eye from '@lucide/svelte/icons/eye';
	import Copy from '@lucide/svelte/icons/copy';
	import Link from '@lucide/svelte/icons/link';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import ExternalLink from '@lucide/svelte/icons/external-link';
	// Two dice rather than a single face (`dice-5`): one die reads as a
	// number — the five — where the pair reads as the act of rolling, which
	// is what the control does.
	import Dices from '@lucide/svelte/icons/dices';
	// The one affordance in the app that means "there is an explanation here":
	// a heading whose rows need a caveat carries it as a `title` on this glyph
	// rather than as a line of prose beside them (StructureSidebarToc's
	// `headingNote`).
	import Info from '@lucide/svelte/icons/info';
	// The plain arrow, not `arrow-up-to-line` or `chevron-up`: it is the same
	// shape UnitNav draws for "back" and "onward", rotated, so movement through
	// the text reads as one vocabulary wherever the control appears. Those two
	// were the text characters `&larr;`/`&rarr;` until they became icons here;
	// `arrow-left`/`arrow-right` are what keeps that vocabulary one drawing
	// rather than a glyph beside a font's idea of the same glyph.
	// Three ruled lines with a leader dot at the end of each: a printed
	// contents page, which is what the panel it opens is. `list` would have
	// said "a list" of anything at all, and `list-tree` draws the nesting at a
	// size where the branches close up into a smudge.
	import TableOfContents from '@lucide/svelte/icons/table-of-contents';
	// The magnifier with a sign in it, not `expand`/`maximize`: those two draw
	// a frame growing to fill a screen, which is what a video player's
	// fullscreen control means. This one means the picture stays where it is
	// and the reader gets closer to it, which is what the plate viewer does.
	import ZoomIn from '@lucide/svelte/icons/zoom-in';
	import ZoomOut from '@lucide/svelte/icons/zoom-out';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';

	const ICONS = {
		search: Search,
		menu: Menu,
		'sliders-horizontal': SlidersHorizontal,
		plus: Plus,
		minus: Minus,
		'book-open': BookOpen,
		check: Check,
		'columns-2': Columns2,
		printer: Printer,
		download: Download,
		share: Share,
		x: X,
		bookmark: Bookmark,
		eye: Eye,
		copy: Copy,
		link: Link,
		'trash-2': Trash2,
		'external-link': ExternalLink,
		dices: Dices,
		info: Info,
		'table-of-contents': TableOfContents,
		'zoom-in': ZoomIn,
		'zoom-out': ZoomOut,
		'arrow-up': ArrowUp,
		'arrow-left': ArrowLeft,
		'arrow-right': ArrowRight
	};

	export type IconName = keyof typeof ICONS;
</script>

<script lang="ts">
	interface Props {
		name: IconName;
		class?: string;
		filled?: boolean;
	}

	let { name, class: className, filled = false }: Props = $props();
	const IconComponent = $derived(ICONS[name]);
</script>

<IconComponent
	size="1em"
	fill={filled ? 'currentColor' : 'none'}
	aria-hidden="true"
	class={className}
/>
