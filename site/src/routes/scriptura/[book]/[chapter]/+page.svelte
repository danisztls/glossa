<script lang="ts">
	import LegacyPage from '../../../bible/[book]/[chapter]/+page.svelte';
	import type { BiblePageData } from '../../../bible/[book]/[chapter]/+page';

	type LegacyData = BiblePageData;
	let { data }: { data: unknown } = $props();
	const legacyData = $derived(data as LegacyData);
</script>

<LegacyPage data={legacyData} />
