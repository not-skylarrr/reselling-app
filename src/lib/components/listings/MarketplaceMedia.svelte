<script lang="ts">
	import VintedIcon from "$lib/assets/vinted.svg";
	import EbayIcon from "$lib/assets/ebay.svg";
	import { cn } from "$lib/utils";
	import { LucideImage } from "@lucide/svelte";

	const MarketplaceIcons: Record<string, string> = {
		ebay: EbayIcon,
		vinted: VintedIcon,
	};

	type Props = {
		class?: string;
		marketplace_id: string;
	};

	let { class: class_name, marketplace_id }: Props = $props();

	const marketplace_icon_src = $derived(GetMarketplaceIcon(marketplace_id));

	function GetMarketplaceIcon(marketplace_id: string) {
		if (MarketplaceIcons[marketplace_id]) return MarketplaceIcons[marketplace_id];

		return null;
	}
</script>

{#if marketplace_icon_src}
	<img
		alt="Marketplace Icon"
		class={cn("size-10 object-contain", class_name)}
		src={marketplace_icon_src}
	/>
{:else}
	<div
		class={cn("flex size-10 items-center justify-center bg-muted object-contain", class_name)}
	>
		<LucideImage class="text-muted-foreground" />
	</div>
{/if}
