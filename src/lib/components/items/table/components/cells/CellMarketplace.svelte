<script lang="ts">
	import MarketplacePill from "$lib/components/listings/MarketplacePill.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";

	type Props = {
		marketplace_ids: string[];
	};

	let { marketplace_ids }: Props = $props();
</script>

{#if marketplace_ids.length > 0}
	<div class="flex flex-row gap-2">
		{#each marketplace_ids as marketplace_id (marketplace_id)}
			<MarketplacePill {marketplace_id} />
		{/each}
	</div>
{:else}
	<p class="text-muted-foreground">-</p>
{/if}
