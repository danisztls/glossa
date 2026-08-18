<script lang="ts">
	import LegacyPage from '../../ccc/[n]/+page.svelte';
	import type { CccLangData } from '../../ccc/[n]/+page';

	type LegacyData = { n: number; byLang: Partial<Record<string, CccLangData>> };
	let { data }: { data: unknown } = $props();
	const legacyData = $derived(data as LegacyData);
</script>

<LegacyPage data={legacyData} />
