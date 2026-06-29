<script lang="ts">
	import { ListingsCollection } from "$lib/collections/def.svelte";
	import Plural from "$lib/components/utils/Plural.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { count, eq, sum, useLiveQuery } from "@tanstack/svelte-db";

	const sold_listings_query = useLiveQuery((q) =>
		q
			.from({ listing: ListingsCollection })
			.where(({ listing }) => eq(listing.status, "sold"))
			.select(({ listing }) => ({
				total: count(listing.id),
				amount: sum(listing.price),
			})),
	);

	const total_sales = $derived(
		sold_listings_query.data.length > 0 ? sold_listings_query.data[0].total : 0,
	);

	const total_sale_amount = $derived(
		sold_listings_query.data.length > 0 ? sold_listings_query.data[0].amount : 0,
	);
</script>

<div class="flex flex-col gap-2 border-r border-b bg-card p-6">
	<p class="text-sm text-muted-foreground">Total Revenue</p>
	<p class="text-3xl font-medium">{FormatCurrency(total_sale_amount)}</p>
	<p class="text-xs text-muted-foreground">
		Total revenue from {total_sales}
		<Plural count={total_sales} singular="sale" plural="sales" />
	</p>
</div>
