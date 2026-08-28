<script lang="ts">
	/**
	 * The shelf for the Fathers and Doctors of the Church.
	 *
	 * It holds ONE work today, and that is the whole reason it exists: the
	 * Summa sat in the main navigation as a peer of Scripture, the Catechism,
	 * the Magisterium and the prayers, which are the Church's own texts, when
	 * what it is is one Doctor's writing about them. The shelf is the category
	 * that was missing; the patristic works that will join it are sized in
	 * `docs/research/summa-and-fathers.md` and not yet ingested.
	 *
	 * DELIBERATELY NOT IN `NAV_ITEMS`, and nothing on the site links here
	 * (2026-08-28). The Summa is awaiting a quality pass, so the shelf is
	 * reachable by address, by the jump box, by a cross-reference from the
	 * Catechism and through the sitemap — but not by browsing. Putting it back
	 * is one line in `+layout.svelte`.
	 *
	 * A plain list rather than a `IndexSidebarToc` consumer: a sidebar
	 * mirroring a one-item list is a copy of the page beside itself, the same
	 * rule `/doctores/summa`'s own sidebar states about the parts it shows.
	 */
	import { languageDisplayName, summaLangs } from '$lib/corpus';
	import { t } from '$lib/i18n.svelte';

	/** Every edition the corpus carries, named in its own language — the same
	 *  vocabulary the edition menu and the compare columns use. Two today, and
	 *  the honest thing for a shelf to say about a work is which of them a
	 *  reader will find behind the link. */
	const editions = $derived(summaLangs().map((lang) => languageDisplayName(lang)));
</script>

<svelte:head>
	<title>{t('doctores.landing.title')} — {t('home.title')}</title>
</svelte:head>

<div class="content-column">
	<h1>{t('doctores.landing.title')}</h1>
	<p class="page-tagline">{t('doctores.landing.tagline')}</p>

	<ul class="work-list index-list">
		<li>
			<a class="work-link" href="/doctores/summa">{t('summa.landing.title')}</a>
			<p class="work-tagline">{t('summa.landing.tagline')}</p>
			{#if editions.length}
				<p class="work-extent">{editions.join(' · ')}</p>
			{/if}
		</li>
	</ul>
</div>

<style>
	.content-column {
		max-inline-size: 44rem;
		margin-inline: auto;
	}

	/* `.page-tagline` (styles/components.css) plus the room this page wants
	   under it — the work list starts straight after, with no rule between. */
	.page-tagline {
		margin-block-end: 2rem;
	}

	.work-link {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.work-tagline,
	.work-extent {
		color: var(--color-text-muted);
		margin-block: 0.25rem 0;
	}

	.work-extent {
		font-size: 0.875rem;
	}
</style>
