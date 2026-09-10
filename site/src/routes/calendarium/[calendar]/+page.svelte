<script lang="ts">
	/**
	 * `/calendarium/br` is `/calendarium` opened on Brazil's calendar.
	 *
	 * IT RENDERS THE PAGE ABOVE RATHER THAN COPYING IT, which is the whole of
	 * this file. The two addresses differ in one thing — which calendar the page
	 * opens on — and every argument the page makes about its controls, its
	 * address bar and its listing is the same argument at both. A second copy
	 * would be a second place for the picker's history writes to drift.
	 *
	 * The picker still works here, and choosing another country rewrites the
	 * path: `/calendarium/br` -> `/calendarium/ie`, or `/calendarium` for the
	 * general calendar. That write is `history.replaceState` like every other
	 * one this page makes, so it costs no navigation even across routes — see
	 * `addressFor` and `mirror` there.
	 */
	import Calendarium from '../+page.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<Calendarium opensOn={data.calendar} />
