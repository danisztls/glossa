<script lang="ts">
	import LegacyPage from '../../../../compendium/caput/[n]/+page.svelte';
	import type { CompendiumChapterLangData } from '../../../../compendium/caput/[n]/+page';

	type LegacyData = { n: number; byLang: Partial<Record<string, CompendiumChapterLangData>> };
	let { data }: { data: unknown } = $props();
	const legacyData = $derived(data as LegacyData);
</script>

<LegacyPage data={legacyData} />
