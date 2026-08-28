<script lang="ts">
	/**
	 * The colophon.
	 *
	 * docs/research/copyright.md §5 lists this page as part of the adopted
	 * posture, not as documentation of it: hosting Church-owned texts
	 * without prior permission is a coherent position only if the position
	 * is stated openly, with a contact address, and with a standing
	 * commitment to comply promptly if a rights holder writes. Absent this
	 * page, the same act is just an unexplained omission. That is why
	 * PLAN.md ranks a page of prose above features that took far longer.
	 *
	 * Written as plain statements in the first person plural, and not
	 * hedged. A colophon that equivocates about what it is doing fails at
	 * the one job it has.
	 *
	 * The work counts are derived from the corpus rather than written into
	 * the copy, so the page cannot drift from what the site actually serves
	 * the way a hand-typed number would.
	 */
	import { isUnpublished, listDocuments, listWorks } from '$lib/corpus';
	import { plateCredits } from '$lib/corpus-index';
	import { CONTACT_EMAIL, REPOSITORY_URL } from '$lib/colophon';
	import { t } from '$lib/i18n.svelte';

	const works = listWorks();
	const bibleEditions = works.filter((w) => w.type === 'bible').length;

	/**
	 * Documents whose text this site actually SERVES, which is not the same as
	 * documents the corpus contains. A work switched off still has a manifest
	 * and still has an address (which redirects to the source), so counting
	 * registry entries would quote a number this page cannot back up — on the
	 * one page whose entire job is to be believable.
	 *
	 * Counted per slug, and a slug survives if ANY of its editions is
	 * published: a document whose Portuguese text was withheld for a bad parse
	 * is still readable in English, and saying otherwise would understate the
	 * library as badly as the other error overstates it.
	 */
	const documentCount = listDocuments().filter((group) =>
		Object.values(group.manifests).some((m) => m && !isUnpublished(m.id))
	).length;

	/**
	 * The illustration collections, credited from their own manifests rather
	 * than from prose written here — the same rule the work counts above
	 * follow, and for a stronger reason: this is the page that says what the
	 * site does with other people's material, and a hand-typed attribution is
	 * one that can quietly stop matching what is actually served.
	 *
	 * The section renders only when a collection is present, so a
	 * fixture-backed or plates-free build says nothing rather than crediting
	 * an artist whose work is not on the page.
	 */
	const collections = Object.values(plateCredits);
</script>

<svelte:head>
	<title>{t('colophon.title')} — {t('home.title')}</title>
</svelte:head>

<article class="content-column colophon">
	<h1>{t('colophon.title')}</h1>
	<p class="lede">{t('colophon.lede')}</p>

	<h2>{t('colophon.whatThisIs')}</h2>
	<p>{t('colophon.whatThisIsBody')}</p>
	<ul class="plain">
		<li>{t('colophon.pointFree')}</li>
		<li>{t('colophon.pointNoAds')}</li>
		<li>{t('colophon.pointNoAccounts')}</li>
		<li>{t('colophon.pointNoTracking')}</li>
		<li>{t('colophon.pointOffline')}</li>
	</ul>

	<h2>{t('colophon.textsTitle')}</h2>
	<p>{t('colophon.textsBody')}</p>
	<p class="counts">
		{bibleEditions}
		{t('colophon.countBible')} · {documentCount}
		{t('colophon.countDocuments')}
	</p>

	<h2>{t('colophon.copyrightTitle')}</h2>
	<!--
		The load-bearing paragraphs. Three claims, in this order because it is
		the order a rights holder would want them: what we did, what we did
		not do, and what we will do if asked.
	-->
	<p>{t('colophon.copyrightBody1')}</p>
	<p>{t('colophon.copyrightBody2')}</p>
	<p><strong>{t('colophon.copyrightBody3')}</strong></p>

	<h2>{t('colophon.contactTitle')}</h2>
	{#if CONTACT_EMAIL}
		<p>
			{t('colophon.contactBody')}
			<a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
		</p>
	{:else}
		<!--
			Deliberately visible rather than silently absent — see
			`$lib/colophon.ts`. The whole page is premised on being reachable;
			shipping it unreachable would be worse than not shipping it.
		-->
		<p class="pending">{t('colophon.contactPending')}</p>
	{/if}

	<h2>{t('colophon.buildTitle')}</h2>
	<p>{t('colophon.buildBody')}</p>
	{#if REPOSITORY_URL}
		<p><a href={REPOSITORY_URL} rel="external noopener" target="_blank">{REPOSITORY_URL}</a></p>
	{/if}

	{#if collections.length > 0}
		<h2>{t('colophon.illustrationsTitle')}</h2>
		<p>{t('colophon.illustrationsBody')}</p>
		{#each collections as collection (collection.title)}
			<p class="credit">
				<em>{collection.title}</em>. {collection.artist}, {collection.edition}.
				{collection.reproduction}.
				<br />
				{t('colophon.illustrationsScans')}
				<a href={collection.provider_url} rel="external noopener" target="_blank"
					>{collection.provider}</a
				>
			</p>
		{/each}
	{/if}

	<!-- Both faces are OFL, which requires the copyright notice and licence to
	     travel with them; the licence texts ship as static/fonts/OFL-*.txt and
	     this is the human-readable half of that obligation. It also belongs on
	     a colophon in the older sense of the word. -->
	<h2>{t('colophon.typeTitle')}</h2>
	<p>{t('colophon.typeBody')}</p>
</article>

<style>
	.colophon {
		font-family: var(--font-serif);
		line-height: 1.7;
	}

	.colophon h1 {
		margin-bottom: 0.5rem;
	}

	.credit {
		font-size: 0.95em;
		color: var(--color-text-muted);
	}

	.lede {
		font-size: 1.15rem;
		color: var(--color-text-muted);
		margin-top: 0;
	}

	.colophon h2 {
		font-size: 0.8rem;
		font-family: var(--font-sans);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		color: var(--color-text-muted);
		margin-top: 2.5rem;
		padding-bottom: 0.4rem;
		border-bottom: 1px solid var(--color-border);
	}

	.plain {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.plain li {
		padding: 0.2rem 0 0.2rem 1.1rem;
		position: relative;
	}

	.plain li::before {
		content: '—';
		position: absolute;
		inset-inline-start: 0;
		color: var(--color-text-muted);
	}

	.counts {
		font-family: var(--font-sans);
		font-size: 0.85rem;
		color: var(--color-text-muted);
		font-variant-numeric: tabular-nums;
	}

	/* Marked as unfinished on the page itself, not merely in a comment. */
	.pending {
		font-family: var(--font-sans);
		font-size: 0.9rem;
		padding: 0.7rem 0.9rem;
		border: 1px dashed var(--color-accent);
		border-radius: 0.4rem;
		color: var(--color-text-muted);
	}
</style>
