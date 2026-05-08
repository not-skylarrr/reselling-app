<script lang="ts">
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemTitle,
	} from "$lib/components/ui/item";
	import { CalculateItemProfit, CalculateTotalFees } from "$lib/items/utils";
	import type { Item as DbItem, ItemFee, ItemListing } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";

	type Props = {
		item: DbItem;
		fees: ItemFee[];
		listings: ItemListing[];
	};

	let { item, fees, listings }: Props = $props();

	const total_fees = $derived(CalculateTotalFees(fees));
</script>

<div class="flex flex-col gap-10">
	<div class="flex flex-col gap-3">
		<p class="px-4 text-xl font-medium">Overview</p>

		<FormCard>
			<FormCardSection>
				<Item class="p-0">
					<ItemContent>
						<ItemTitle>Total Fees</ItemTitle>
						<ItemDescription>The total fees you paid on this item</ItemDescription>
					</ItemContent>

					<ItemActions>
						<p>{FormatCurrency(total_fees)}</p>
					</ItemActions>
				</Item>
			</FormCardSection>
			<FormCardSection>
				<Item class="p-0">
					<ItemContent>
						<ItemTitle>Final Profit</ItemTitle>
						<ItemDescription>The total profit of this item</ItemDescription>
					</ItemContent>

					<ItemActions>
						<p>
							{FormatCurrency(CalculateItemProfit({ item, fees, listings }) ?? 0)}
						</p>
					</ItemActions>
				</Item>
			</FormCardSection>
		</FormCard>
	</div>

	<div class="flex flex-col gap-3">
		<p class="px-4 text-xl font-medium">Item Costs</p>

		<FormCard>
			<FormCardSection>
				<Item class="p-0">
					<ItemContent>
						<ItemTitle>Purchase Price</ItemTitle>
						<ItemDescription>The price the item was purchased at</ItemDescription>
					</ItemContent>

					<ItemActions>
						<p>{FormatCurrency(item.purchase_price)}</p>
					</ItemActions>
				</Item>
			</FormCardSection>
		</FormCard>
	</div>

	{#if fees.length > 0}
		<div class="flex flex-col gap-3">
			<p class="px-4 text-xl font-medium">Item Fees</p>
			<FormCard>
				{#each fees as fee (fee.id)}
					<FormCardSection>
						<Item class="p-0">
							<ItemContent>
								<ItemTitle>{fee.reference_name}</ItemTitle>
								<ItemDescription>{fee.reference_details}</ItemDescription>
							</ItemContent>

							<ItemActions>
								<p>{FormatCurrency(fee.amount)}</p>
							</ItemActions>
						</Item>
					</FormCardSection>
				{/each}
			</FormCard>
		</div>
	{/if}
</div>
