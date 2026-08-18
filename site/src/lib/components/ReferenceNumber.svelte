<!--
	The small, copyable unit number used in the reading text: CCC paragraphs,
	Compendium questions, and Scripture verses.  Keeping it as a real link is
	important: the number is the address of the text beside it, not decoration.

	`placement="margin"` is for independently-addressable blocks in a continuous
	reader; `placement="inline"` keeps Bible verse numbers in the prose flow.
	The component owns the interaction and responsive treatment so the three
	readers cannot slowly acquire different conventions for the same affordance.
-->
<script lang="ts">
	interface Props {
		n: number;
		href: string;
		label: string;
		placement: 'inline' | 'margin';
		/** A verse named by the arriving citation receives the same emphasis as its passage. */
		emphasized?: boolean;
	}

	let { n, href, label, placement, emphasized = false }: Props = $props();
</script>

<a
	class="reference-number {placement}"
	class:emphasized
	{href}
	aria-label={label}
	data-link-preview="off">{n}</a
>

<style>
	.reference-number {
		color: var(--color-apparatus);
		font-family: var(--font-sans);
		font-size: max(var(--font-size-min), 0.75em);
		font-weight: 650;
		font-variant-numeric: tabular-nums;
		font-feature-settings: 'tnum';
		line-height: 1;
		text-decoration: none;
		text-decoration-thickness: 1px;
		text-underline-offset: 0.18em;
		border-radius: 0.15em;
	}

	.reference-number:hover {
		color: var(--color-accent);
		text-decoration: underline;
	}

	.reference-number:focus-visible {
		outline: 2px solid var(--color-focus-ring);
		outline-offset: 2px;
		color: var(--color-accent);
	}

	.reference-number.inline {
		display: inline-block;
		vertical-align: super;
		margin-inline-end: 0.22em;
		user-select: none;
	}

	.reference-number.margin {
		position: absolute;
		inset-inline-start: -3.25rem;
		top: 0.2em;
		width: 2.75rem;
		text-align: end;
	}

	.reference-number.emphasized {
		color: var(--color-accent);
	}

	@media (max-width: 60rem) {
		.reference-number.margin {
			position: static;
			display: block;
			width: auto;
			margin-bottom: 0.2rem;
			text-align: start;
		}
	}
</style>
