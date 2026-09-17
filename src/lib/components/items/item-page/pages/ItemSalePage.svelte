<script lang="ts">
	import { ItemsCollection, ListingsCollection } from "$lib/collections/def.svelte";
	import UpdateCurrencyPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateCurrencyPopover.svelte";
	import UpdateDatePopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateDatePopover.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import {
		SettingsGroup,
		SettingsGroupHeader,
		SettingsLayout,
	} from "$lib/components/settings/layout";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldTitle,
	} from "$lib/components/ui/field";
	import { CalculateItemProfit, CalculateTotalFees } from "$lib/items/utils";
	import { GetListingDurationString } from "$lib/listings/utils";
	import type { FullItem, ItemWithLabels } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { LucideCopy } from "@lucide/svelte";
	import { formatDistanceStrict } from "date-fns";

	type Props = {
		item: FullItem;
	};

	let { item }: Props = $props();

	const sold_listing = $derived(item.listings.find((l) => l.status == "sold")!);

	const sold_listing_fees = $derived(item.fees.filter((f) => f.listing_id == sold_listing.id));

	const total_listing_fees = $derived(
		CalculateTotalFees(item.fees.filter((f) => f.type == "listing_fee")),
	);

	const final_sale_fee = $derived(
		CalculateTotalFees(sold_listing_fees.filter((f) => f.type == "final_fee")),
	);

	const profit_excluding_refund = $derived(
		CalculateItemProfit({
			item,
			listings: item.listings,
			fees: [...item.fees].filter((f) => f.type != "refunded_amount"),
		}) ?? 0,
	);

	const item_profit = $derived(
		CalculateItemProfit({ item, listings: item.listings, fees: item.fees }) ?? 0,
	);

	const initial_listing = $derived(
		[...item.listings].sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0],
	);

	function HandlePurchasePriceChange(val: number) {
		ItemsCollection.update(item.id, (draft) => {
			draft.purchase_price = val;
		});
	}

	function HandleSalePriceChange(val: number) {
		ListingsCollection.update(sold_listing.id, (draft) => {
			draft.price = val;
		});
	}

	function HandleSaleDateChange(val: Date | null) {
		if (!val) return;

		ListingsCollection.update(sold_listing.id, (draft) => {
			draft.ended_at = val;
		});
	}
</script>

<SettingsLayout class="p-6! pt-12!">
	<SettingsGroup>
		<SettingsGroupHeader>Sale Financials</SettingsGroupHeader>

		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Item Cost</FieldTitle>
							<FieldDescription>The cost to acquire the item itself</FieldDescription>
						</FieldContent>

						<FieldContent>
							<UpdateCurrencyPopover
								button_variant="outline"
								label="Update Purchase Price"
								onValueChange={HandlePurchasePriceChange}
								value={item.purchase_price}
							/>
						</FieldContent>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Listings Fees</FieldTitle>
							<FieldDescription>The total listing fees paid for this item</FieldDescription>
						</FieldContent>

						<FieldContent>
							<Button
								class="text-sm font-normal"
								href={`/dashboard/inventory/items/${item.id}/fees`}
								size="xs"
								variant="outline"
							>
								{FormatCurrency(total_listing_fees)}
							</Button>
						</FieldContent>
					</Field>
				</FieldGroup>
			</FormCardSection>

			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Final Sale Price</FieldTitle>
							<FieldDescription>The final amount the buyer paid for the item</FieldDescription>
						</FieldContent>

						<FieldContent>
							<UpdateCurrencyPopover
								button_variant="outline"
								label="Update Final Sale Price"
								onValueChange={HandleSalePriceChange}
								value={sold_listing.price}
							/>
						</FieldContent>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Final Fees</FieldTitle>
							<FieldDescription>The final amount the buyer paid for the item</FieldDescription>
						</FieldContent>

						<FieldContent>
							<Button
								class="text-sm font-normal"
								href={`/dashboard/inventory/items/${item.id}/fees`}
								size="xs"
								variant="outline"
							>
								{FormatCurrency(final_sale_fee)}
							</Button>
						</FieldContent>
					</Field>
				</FieldGroup>
			</FormCardSection>

			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Total Fees Paid</FieldTitle>
							<FieldDescription>The total of all fees paid</FieldDescription>
						</FieldContent>

						<FieldContent>
							<Button
								class="text-sm font-normal data-[negative=true]:text-destructive data-[positive=true]:text-success"
								data-negative={item_profit < 0}
								data-positive={item_profit > 0}
								size="xs"
								variant="outline"
							>
								{FormatCurrency(
									CalculateTotalFees(
										[...item.fees].filter((f) => f.type != "refunded_amount"),
									) * -1,
								)}</Button
							>
						</FieldContent>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Final Sale Profit</FieldTitle>
							<FieldDescription>The total profit after fees have been deducted</FieldDescription
							>
						</FieldContent>

						<FieldContent>
							<Button
								class="text-sm font-normal data-[negative=true]:text-destructive data-[positive=true]:text-success"
								data-negative={profit_excluding_refund < 0}
								data-positive={profit_excluding_refund > 0}
								size="xs"
								variant="outline"
							>
								{FormatCurrency(profit_excluding_refund)}</Button
							>
						</FieldContent>
					</Field>
				</FieldGroup>
			</FormCardSection>

			{#if item.status == "refunded"}
				{@const refund_fee = item.fees.find((f) => f.type == "refunded_amount")}

				<FormCardSection>
					<FieldGroup>
						{#if refund_fee}
							<Field orientation="responsive-centered">
								<FieldContent>
									<FieldTitle>Refund Amount</FieldTitle>
									<FieldDescription>The amount refunded to the buyer</FieldDescription>
								</FieldContent>

								<FieldContent>
									<Button
										class="text-sm font-normal"
										href={`/dashboard/inventory/items/${item.id}/refund`}
										size="xs"
										variant="outline"
									>
										{FormatCurrency(refund_fee.amount)}</Button
									>
								</FieldContent>
							</Field>
						{/if}

						<Field orientation="responsive-centered">
							<FieldContent>
								<FieldTitle>Final Profit</FieldTitle>
								<FieldDescription>The total profit after fees and refunds</FieldDescription>
							</FieldContent>

							<FieldContent>
								<Button
									class="text-sm font-normal data-[negative=true]:text-destructive data-[positive=true]:text-success"
									data-negative={item_profit < 0}
									data-positive={item_profit > 0}
									size="xs"
									variant="outline"
								>
									{FormatCurrency(item_profit)}</Button
								>
							</FieldContent>
						</Field>
					</FieldGroup>
				</FormCardSection>
			{/if}
		</FormCard>
	</SettingsGroup>

	<SettingsGroup>
		<SettingsGroupHeader>Sale Timeline</SettingsGroupHeader>

		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Sale Date</FieldTitle>
							<FieldDescription>The date the item was sold</FieldDescription>
						</FieldContent>

						<FieldContent>
							<UpdateDatePopover
								button_variant="outline"
								onValueChange={HandleSaleDateChange}
								value={sold_listing.ended_at!}
							/>
						</FieldContent>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Listing Duration</FieldTitle>
							<FieldDescription>The time it took for the item to be sold</FieldDescription>
						</FieldContent>

						<FieldContent>
							<Button class="text-sm font-normal capitalize" size="xs" variant="outline">
								{formatDistanceStrict(
									initial_listing.created_at,
									sold_listing.ended_at!,
								)}</Button
							>
						</FieldContent>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>
	</SettingsGroup>
</SettingsLayout>
