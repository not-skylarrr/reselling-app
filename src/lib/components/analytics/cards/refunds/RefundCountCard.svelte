<script lang="ts">
	import { ItemsCollection } from "$lib/collections/def.svelte";
	import { count, eq, useLiveQuery } from "@tanstack/svelte-db";

	const refund_count_query = useLiveQuery((q) =>
		q
			.from({ items: ItemsCollection })
			.where(({ items }) => eq(items.status, "refunded"))
			.select(({ items }) => ({
				total: count(items.id),
			})),
	);

	const refund_count = $derived(refund_count_query.data[0]?.total ?? 0);
</script>

<div class="flex flex-col gap-2 border-r border-b bg-card p-6">
	<p class="text-sm text-muted-foreground">Total Refunds</p>
	<p class="text-3xl font-medium">{refund_count}</p>
	<p class="text-xs text-muted-foreground">Amount of items refunded to buyers</p>
</div>
