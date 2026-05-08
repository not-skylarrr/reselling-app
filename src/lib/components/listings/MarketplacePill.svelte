<script lang="ts">
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { Badge } from "../ui/badge";
	import MarketplaceMedia from "./MarketplaceMedia.svelte";

	type Props = {
		marketplace_id: string;
	};

	let { marketplace_id }: Props = $props();

	const marketplace = $derived(GetMarketplaceData(marketplace_id));
</script>

<Badge class="bg-background" variant="outline">
	<MarketplaceMedia class="size-5" {marketplace_id} />

	{marketplace.name}
</Badge>
