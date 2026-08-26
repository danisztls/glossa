<!--
	"I'm feeling lucky": opens one verse of the reader's own Bible edition,
	drawn at random.

	A BUTTON, NOT A LINK, because the roll happens on the click. An `<a>` has
	to know where it goes before it is clicked, so its href would name the
	verse chosen when the page rendered — surprising for a reader who hovers
	and hesitates, and impossible to re-roll without re-mounting the page.
	Middle-click and copy-link are the price, and they cost nothing for a
	destination meant to be unknown until it opens: both work normally once
	the reader is standing on the verse.

	IT ROLLS IN THE READER'S EDITION, not in "the Bible" — `randomVerse`
	walks `content.workIdFor('bible')`'s own books, so a Vulgate reader lands
	somewhere the Vulgate actually has, and the destination carries no
	edition (docs/decisions.md §Addresses and editions) like every other
	reference URL.

	RENDERS NOTHING when there are no verses to roll, following the
	"hide, don't disable" posture `EditionMenu` and `CompareToggle` already
	take here. That case is real: it is what a corpus that failed to sync
	looks like.
-->
<script lang="ts">
	import { goto } from '$app/navigation';
	import { hrefFor } from '$lib/address';
	import { content } from '$lib/content.svelte';
	import { listBooks, randomVerse } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';
	import Icon from './Icon.svelte';

	const workId = $derived(content.workIdFor('bible'));

	// Asked without rolling — the question is whether the control belongs on
	// the page, and answering it with a discarded verse would be a different
	// verse from the one the click produces anyway.
	const hasVerses = $derived(
		!!workId && listBooks(workId).some((book) => book.chapters.some((c) => c.verses.length > 0))
	);

	const label = $derived(t('bible.landing.random'));

	function openRandomVerse() {
		if (!workId) return;
		const verse = randomVerse(workId);
		if (!verse) return;
		goto(
			hrefFor({
				kind: 'bible',
				osis: verse.osis,
				chapter: verse.chapter,
				from: verse.verse,
				to: verse.verse
			})
		);
	}
</script>

{#if hasVerses}
	<button
		type="button"
		class="menu-trigger random-verse"
		aria-label={label}
		title={label}
		onclick={openRandomVerse}
	>
		<Icon name="dices" />
	</button>
{/if}
