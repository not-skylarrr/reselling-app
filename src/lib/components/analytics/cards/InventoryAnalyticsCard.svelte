<script lang="ts">
	import { ItemFeesCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import Plural from "$lib/components/utils/Plural.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { and, count, eq, inArray, sum, useLiveQuery } from "@tanstack/svelte-db";

	const items_query = useLiveQuery((q) =>
		q
			.from({ items: ItemsCollection })
			.where(({ items }) => inArray(items.status, ["unlisted", "listed"]))
			.select(({ items }) => ({
				total: count(items.id),
			})),
	);

	const item_count = $derived(items_query.data.length > 0 ? items_query.data[0].total : 0);
</script>

<div class="flex flex-col gap-2 border-r border-b bg-card p-6">
	<p class="text-sm text-muted-foreground">Current Inventory</p>
	<p class="text-3xl font-medium">{item_count}</p>
	<p class="text-xs text-muted-foreground">
		Total <Plural count={item_count} singular="item" plural="items" /> in storage
	</p>
</div>
