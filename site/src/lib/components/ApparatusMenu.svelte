<!--
	Which apparatus is set beside the text: the edition's own notes, and any
	commentary written on it.

	A PANEL RATHER THAN A MENU, on `AppearanceMenu`'s template and for the
	argument its docblock already makes — several controls answering one
	question ("what is set beside this text?") want a panel, not a row of
	icons or a list of alternatives. What makes it a panel here specifically is
	that the choices are not exclusive: a reader can have Challoner's notes and
	Haydock's catena beside the same verse, which is the arrangement this site
	is named for. So the rows are `menuitemcheckbox` switches, and NOT the
	`menuitemradio` rows `EditionMenu` and `ComparisonEditionMenu` use — those
	two ask which single edition, and copying their ARIA here would tell a
	screen reader the choices are mutually exclusive when they are not.

	IT IS NOT IN `.reading-bar-editions`, and that is deliberate. That wrapper
	is `flex-wrap: nowrap` so its three controls read as one phrase — "this
	edition, compared with, that edition" — and a fourth control inside it
	either breaks the phrase or joins a line that already carries two
	unpredictably wide edition names. This sits before it: the apparatus is a
	property of the text being read, so it belongs with the text-level controls
	and ahead of the edition trio rather than inside it.

	THE EDITION'S OWN NOTES ARE IN THE SAME LIST AS THE COMMENTARIES, though
	they are stored quite differently — one is inside the edition's own verses
	and the other is a work of its own. The reader is choosing among apparatus,
	and which side of that boundary a given apparatus falls on is our problem.
	Their defaults differ and that asymmetry is real: an edition's notes are
	part of the edition already chosen, a commentary is an opt-in. See
	`apparatus-prefs.svelte.ts`.
-->
<script lang="ts">
	import { apparatusPrefs } from '$lib/apparatus-prefs.svelte';
	import { keepInViewport } from '$lib/floating';
	import { t } from '$lib/i18n.svelte';
	import type { WorkManifest } from '$lib/types';
	import Icon from './Icon.svelte';
	import { Menu } from './menu.svelte';

	interface Props {
		/** The edition being read, whose own notes are the first row. Omitted
		    where the reader's edition carries none, which is most of them. */
		edition?: { workId: string; title: string };
		/** Commentaries with something to say at THIS address — see
		    `commentariesAt`. Empty is an ordinary state and, with no annotated
		    edition either, is what makes the whole trigger disappear. */
		commentaries: WorkManifest[];
	}

	let { edition, commentaries }: Props = $props();

	const menu = new Menu();
</script>

<svelte:window onclick={menu.onWindowClick} />

<div class="menu" bind:this={menu.containerEl}>
	<button
		type="button"
		bind:this={menu.triggerEl}
		class="menu-trigger"
		aria-haspopup="menu"
		aria-expanded={menu.open}
		aria-label={t('apparatus.label')}
		title={t('apparatus.label')}
		onclick={menu.toggle}
	>
		<Icon name="notebook-pen" />
	</button>
	{#if menu.open}
		<div
			class="panel-surface menu-panel apparatus-panel"
			use:keepInViewport
			role="menu"
			tabindex="-1"
			aria-label={t('apparatus.label')}
			onkeydown={menu.onPanelKeydown}
		>
			{#if edition}
				{@const on = apparatusPrefs.editionNotesEnabled(edition.workId)}
				<div class="field" role="none">
					<span class="field-label label-micro">{t('apparatus.editionNotes')}</span>
					<div class="field-control" role="none">
						<button
							type="button"
							role="menuitemcheckbox"
							aria-checked={on}
							aria-label={edition.title}
							class="switch-btn"
							onclick={() => apparatusPrefs.setEditionNotes(edition.workId, !on)}
						>
							<span class="switch" class:on></span>
						</button>
						<span class="note">{edition.title}</span>
					</div>
				</div>
			{/if}

			{#each commentaries as work (work.id)}
				{@const on = apparatusPrefs.commentaryEnabled(work.id)}
				<div class="field" role="none">
					<span class="field-label label-micro">{t('apparatus.commentary')}</span>
					<div class="field-control" role="none">
						<button
							type="button"
							role="menuitemcheckbox"
							aria-checked={on}
							aria-label={work.title}
							class="switch-btn"
							onclick={() => apparatusPrefs.setCommentary(work.id, !on)}
						>
							<span class="switch" class:on></span>
						</button>
						<span class="note">{work.short_title}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	/*
	 * The rows themselves are `menus.css` — see the block there on why they are
	 * global rather than scoped, which is that this panel is the second to use
	 * them. What stays here is the panel's own two decisions: how tall a row is
	 * and how much air the stack sits in.
	 *
	 * BOTH MATCH `AppearanceMenu`'s deliberately. They are the two panels the
	 * reading bar and the header open, a reader meets them within a click of
	 * each other, and rows of two different heights would read as two different
	 * kinds of control for what is the same kind of choice.
	 */
	.apparatus-panel {
		padding: 0.4rem;
		--control-height: 1.7rem;
	}
</style>
