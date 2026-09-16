<script lang="ts">
	import {
		SettingsGroup,
		SettingsGroupHeader,
		SettingsLayout,
	} from "$lib/components/settings/layout";
	import type { Item, ItemFee, ItemFeeType } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import FeeCard from "./components/FeeCard.svelte";

	type Props = {
		item: Item & {
			fees: ItemFee[];
		};
	};

	let { item }: Props = $props();

	type FeesByType = Record<ItemFeeType, ItemFee[]>;

	const fees_by_type = $derived.by(() => {
		let fee_object: FeesByType = {
			listing_fee: [],
			final_fee: [],
			postage_fee: [],
			refunded_amount: [],
			custom: [],
		};

		for (const fee of item.fees) {
			fee_object[fee.type].push(fee);
		}

		return fee_object;
	});

	type FeeTotalsByType = Record<ItemFeeType, number>;

	const fee_totals_by_type = $derived.by(() => {
		let fee_totals_object: FeeTotalsByType = {
			listing_fee: 0,
			final_fee: 0,
			postage_fee: 0,
			refunded_amount: 0,
			custom: 0,
		};

		for (const fee of item.fees) {
			if (fee.removed || fee.buyer_paid) continue;

			fee_totals_object[fee.type] += fee.amount;
		}

		return fee_totals_object;
	});
</script>

<SettingsLayout class="p-6! pt-12! md:gap-6">
	{#if fees_by_type.refunded_amount.length > 0}
		<SettingsGroup>
			<div class="flex flex-row items-center justify-between px-4">
				<SettingsGroupHeader class="px-0">Refunds</SettingsGroupHeader>

				<p class="text-sm text-muted-foreground">
					{FormatCurrency(fee_totals_by_type.refunded_amount)}
				</p>
			</div>

			{#each fees_by_type.refunded_amount as fee (fee.id)}
				<FeeCard {fee} />
			{/each}
		</SettingsGroup>
	{/if}

	{#if fees_by_type.postage_fee.length > 0}
		<SettingsGroup>
			<div class="flex flex-row items-center justify-between px-4">
				<SettingsGroupHeader class="px-0">Postage Costs</SettingsGroupHeader>

				<p class="text-sm text-muted-foreground">
					{FormatCurrency(fee_totals_by_type.postage_fee)}
				</p>
			</div>

			{#each fees_by_type.postage_fee as fee (fee.id)}
				<FeeCard {fee} />
			{/each}
		</SettingsGroup>
	{/if}

	{#if fees_by_type.final_fee.length > 0}
		<SettingsGroup>
			<div class="flex flex-row items-center justify-between px-4">
				<SettingsGroupHeader class="px-0">Sale Fees</SettingsGroupHeader>

				<p class="text-sm text-muted-foreground">
					{FormatCurrency(fee_totals_by_type.final_fee)}
				</p>
			</div>

			{#each fees_by_type.final_fee as fee (fee.id)}
				<FeeCard {fee} />
			{/each}
		</SettingsGroup>
	{/if}

	{#if fees_by_type.listing_fee.length > 0}
		<SettingsGroup>
			<div class="flex flex-row items-center justify-between px-4">
				<SettingsGroupHeader class="px-0">Listing Fees</SettingsGroupHeader>

				<p class="text-sm text-muted-foreground">
					{FormatCurrency(fee_totals_by_type.listing_fee)}
				</p>
			</div>

			{#each fees_by_type.listing_fee as fee (fee.id)}
				<FeeCard {fee} />
			{/each}
		</SettingsGroup>
	{/if}
</SettingsLayout>
