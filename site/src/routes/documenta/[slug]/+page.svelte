<script lang="ts">
	import LegacyPage from '../../documents/[slug]/+page.svelte';
	import type { PageData as LegacyPageData } from '../../documents/[slug]/$types';

	let { data }: { data: unknown } = $props();
	const legacyData = $derived(data as LegacyPageData);
</script>

<LegacyPage data={legacyData} />
