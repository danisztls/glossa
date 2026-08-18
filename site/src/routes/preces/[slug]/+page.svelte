<script lang="ts">
	import LegacyPage from '../../prayers/[slug]/+page.svelte';
	import type { PrayerByLang } from '../../prayers/[slug]/+page';

	type LegacyData = { slug: string; byLang: Record<string, PrayerByLang> };
	let { data }: { data: unknown } = $props();
	const legacyData = $derived(data as LegacyData);
</script>

<LegacyPage data={legacyData} />
