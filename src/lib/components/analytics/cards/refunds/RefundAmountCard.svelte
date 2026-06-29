<script lang="ts">
	import { ItemFeesCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { count, eq, sum, useLiveQuery } from "@tanstack/svelte-db";

	const refund_fees_query = useLiveQuery((q) =>
		q
			.from({ fees: ItemFeesCollection })
			.where(({ fees }) => eq(fees.type, "refunded_amount"))
			.select(({ fees }) => ({
				total: sum(fees.amount),
			})),
	);

	const refunded_amount = $derived(refund_fees_query.data[0]?.total ?? 0);
</script>

<div class="flex flex-col gap-2 border-r border-b bg-card p-6">
	<p class="text-sm text-muted-foreground">Amount Refunded</p>
	<p
		class="text-3xl font-medium text-destructive data-[empty=true]:text-foreground"
		data-empty={refunded_amount == 0}
	>
		{FormatCurrency(refunded_amount * -1)}
	</p>
	<p class="text-xs text-muted-foreground">Amount refunded to buyers</p>
</div>
