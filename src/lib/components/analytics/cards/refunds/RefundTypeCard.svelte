<script lang="ts">
	import { ItemsCollection } from "$lib/collections/def.svelte";
	import Plural from "$lib/components/utils/Plural.svelte";
	import { GetRefundTypeFriendlyName } from "$lib/items/utils";
	import { useLiveQuery, eq, count } from "@tanstack/svelte-db";

	const refund_type_query = useLiveQuery((q) =>
		q
			.from({ items: ItemsCollection })
			.where(({ items }) => eq(items.status, "refunded"))
			.groupBy(({ items }) => items.refund_type)
			.select(({ items }) => ({
				type: items.refund_type,
				total: count(items.refund_type),
			}))
			.orderBy(({ $selected }) => $selected.total, "desc"),
	);

	const most_common_type_data = $derived.by(() => {
		if (refund_type_query.data.length == 0) return { label: "N/A", count: 0 };

		return {
			// @ts-expect-error input not typed correctly
			label: GetRefundTypeFriendlyName(refund_type_query.data[0].type, "N/A"),
			count: refund_type_query.data[0].total,
		};
	});
</script>

<div class="flex flex-col gap-2 border-r border-b bg-card p-6 @lg:col-span-2">
	<p class="text-sm text-muted-foreground">Most Common Reason</p>
	<p class="text-3xl font-medium">{most_common_type_data.label}</p>
	<p class="text-xs text-muted-foreground">
		{most_common_type_data.count}
		<Plural count={most_common_type_data.count} singular="item" plural="items" /> affected by this
		reason
	</p>
</div>
