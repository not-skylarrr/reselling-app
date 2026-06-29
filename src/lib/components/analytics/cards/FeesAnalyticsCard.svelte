<script lang="ts">
	import { ItemFeesCollection } from "$lib/collections/def.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { and, eq, sum, useLiveQuery } from "@tanstack/svelte-db";

	const fees_query = useLiveQuery((q) =>
		q
			.from({ fees: ItemFeesCollection })
			.where(({ fees }) => and(eq(fees.buyer_paid, false), eq(fees.removed, false)))
			.select(({ fees }) => ({
				total: sum(fees.amount,
			})),
	);

	const total_fees = $derived(fees_query.data.length > 0 ? fees_query.data[0].total : 0);
</script>

<div class="flex flex-col gap-2 border-r border-b bg-card p-6">
	<p class="text-sm text-muted-foreground">Total Fees Paid</p>
	<p class="text-3xl font-medium">{FormatCurrency(total_fees)}</p>
	<p class="text-xs text-muted-foreground">Listing, Final & Postage Fees</p>
</div>
