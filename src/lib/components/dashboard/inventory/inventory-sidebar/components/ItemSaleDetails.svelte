<script lang="ts">
	import { ItemFeesCollection, ListingsCollection } from "$lib/collections/def.svelte";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import { Item, ItemActions, ItemContent, ItemTitle } from "$lib/components/ui/item";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { type Item as DbItem } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { and, eq, useLiveQuery } from "@tanstack/svelte-db";

	type Props = {
		item: DbItem;
	};

	let { item }: Props = $props();

	const sold_listing_query = useLiveQuery(
		(q) =>
			q
				.from({ listing: ListingsCollection })
				.where(({ listing }) => and(eq(listing.status, "sold"), eq(listing.item_id, item.id)))
				.findOne(),
		[() => item.id],
	);

	const item_fees_query = useLiveQuery(
		(q) => q.from({ fee: ItemFeesCollection }).where(({ fee }) => eq(fee.item_id, item.id)),
		[() => item.id],
	);

	const listing = $derived(sold_listing_query.data);
	const item_fees = $derived(item_fees_query.data);

	const total_fees = $derived(
		item_fees.reduce((total, fee) => {
			if (fee.buyer_paid) return total;

			return total + fee.amount;
		}, 0),
	);

	const item_profit = $derived.by(() => {
		if (!listing) return 0;

		return listing.price - item.purchase_price - total_fees;
	});
</script>

{#if item && listing}
	{@const marketplace = GetMarketplaceData(listing.marketplace_id)}

	<div class="flex flex-col gap-1 px-4 py-2 pb-4">
		<div class="flex h-8 flex-row items-center justify-between">
			<p class="text-sm font-medium">Sale Details</p>

			<MarketplaceMedia class="size-8" marketplace_id={marketplace.id} />
		</div>

		<Item class="h-7 p-0">
			<ItemContent>
				<ItemTitle class="text-sm font-normal text-muted-foreground">Sale Price</ItemTitle>
			</ItemContent>

			<ItemActions>
				<p>{FormatCurrency(listing.price)}</p>
			</ItemActions>
		</Item>

		<Item class="h-7 p-0">
			<ItemContent>
				<ItemTitle class="text-sm font-normal text-muted-foreground">Total Fees</ItemTitle>
			</ItemContent>

			<ItemActions>
				<p>{FormatCurrency(total_fees)}</p>
			</ItemActions>
		</Item>

		<Item class="h-7 p-0">
			<ItemContent>
				<ItemTitle class="text-sm font-normal text-muted-foreground">Final Profit</ItemTitle>
			</ItemContent>

			<ItemActions>
				<p>{FormatCurrency(item_profit)}</p>
			</ItemActions>
		</Item>
	</div>
{/if}
