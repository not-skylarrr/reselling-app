<script lang="ts">
	import { eq, useLiveQuery } from "@tanstack/svelte-db";
	import type { ItemDialogProps } from "../dialog-state.svelte";
	import { ItemFeesCollection } from "$lib/collections/def.svelte";
	import {
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemTitle,
	} from "$lib/components/ui/item";
	import { FormatCurrency } from "$lib/utils/formatting";
	import Separator from "$lib/components/ui/separator/separator.svelte";

	let { item }: ItemDialogProps<"fee-details"> = $props();

	const item_fees_query = useLiveQuery(
		(q) => q.from({ fee: ItemFeesCollection }).where(({ fee }) => eq(fee.item_id, item.id)),
		[() => item],
	);

	const total_fees = $derived(
		item_fees_query.data.reduce((total, fee) => {
			return total + fee.amount;
		}, 0),
	);
</script>

<DialogContent class="sm:max-w-xl">
	<DialogHeader>
		<DialogTitle>Item Fees</DialogTitle>
		<DialogDescription>A breakdown of the fees on this item</DialogDescription>
	</DialogHeader>

	<div class="flex flex-col gap-4">
		{#each item_fees_query.data as fee (fee.id)}
			<Item class="p-0">
				<ItemContent>
					<ItemTitle>{fee.reference_name}</ItemTitle>
					<ItemDescription>{fee.reference_details}</ItemDescription>
				</ItemContent>

				<ItemActions>
					<p>{FormatCurrency(fee.amount)}</p>
				</ItemActions>
			</Item>
		{/each}

		<Separator />

		<Item class="p-0">
			<ItemContent>
				<ItemTitle>Total Fees</ItemTitle>
				<ItemDescription>The total amount of fees for this item</ItemDescription>
			</ItemContent>

			<ItemActions>
				<p>{FormatCurrency(total_fees)}</p>
			</ItemActions>
		</Item>
	</div>
</DialogContent>
