<script lang="ts">
	import { ListingsCollection } from "$lib/collections/def.svelte";
	import Plural from "$lib/components/utils/Plural.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { count, eq, sum, useLiveQuery } from "@tanstack/svelte-db";

	const sold_listings_query = useLiveQuery((q) =>
		q
			.from({ listing: ListingsCollection })
			.select(({ listing }) => ({ item_id: listing.item_id, price: listing.price })),
	);

	const revenue_amount = $derived.by((): number => {
		if (!sold_listings_query.data) return 0;

		const price_map = new Map<string, number>();

		for (const listing of sold_listings_query.data) {
			if (price_map.has(listing.item_id)) {
				const curr_price = price_map.get(listing.item_id)!;

				if (listing.price > curr_price) {
					price_map.set(listing.item_id, listing.price);
				}
			} else {
				price_map.set(listing.item_id, listing.price);
			}
		}

		return price_map
			.values()
			.toArray()
			.reduce((total, amount) => {
				return total + amount;
			}, 0);
	});
</script>

<div class="flex flex-col gap-2 border-r border-b bg-card p-6">
	<p class="text-sm text-muted-foreground">Potential Revenue</p>
	<p class="text-3xl font-medium">{FormatCurrency(revenue_amount)}</p>
	<p class="text-xs text-muted-foreground">If all listings are completed</p>
</div>
