<script lang="ts">
	import UpdateItemPriceInput from "$lib/components/items/item-page/UpdateItemPriceInput.svelte";
	import { Button } from "$lib/components/ui/button";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import type { FullItem } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { LucideEllipsisVertical, LucideInfo, LucidePackage } from "@lucide/svelte";
	import ViewFeesDialog from "./components/ViewFeesDialog.svelte";
	import { CalculateItemProfit, CalculateTotalFees } from "$lib/items/utils";
	import { Separator } from "$lib/components/ui/separator";
	import { ListingsCollection } from "$lib/collections/def.svelte";

	type Props = {
		item: FullItem;
	};

	let { item }: Props = $props();

	const sold_listing = $derived(item.listings.find((l) => l.status == "sold"));

	const listing_fees = $derived(item.fees.filter((fee) => fee.type == "listing_fee"));
	const final_fees = $derived(item.fees.filter((fee) => fee.type == "final_fee"));
	const postage_fees = $derived(item.fees.filter((fee) => fee.type == "postage_fee"));

	const total_fees = $derived(CalculateTotalFees(item.fees, true));
	const total_listing_fees = $derived(CalculateTotalFees(listing_fees));
	const total_final_fees = $derived(CalculateTotalFees(final_fees));
	const total_postage_fees = $derived(CalculateTotalFees(postage_fees));

	const final_profit = $derived(
		CalculateItemProfit({ item: item, listings: item.listings, fees: item.fees }),
	);
</script>

{#if sold_listing}
	<div class="flex h-80 flex-col gap-4 border-b p-6">
		<div class="flex h-7 flex-row items-center gap-3">
			<p class="text-lg font-medium">Sale Details</p>
		</div>

		<div class="flex flex-1 flex-col gap-2">
			<div class="flex flex-row items-center justify-between">
				<p class="text-sm text-muted-foreground">Sale Price</p>

				<UpdateItemPriceInput
					label="Update Sale Price"
					price={sold_listing.price}
					onPriceChange={(val) => {
						if (!sold_listing) return;

						ListingsCollection.update(sold_listing.id, (draft) => {
							draft.price = val;
						});
					}}
				/>
			</div>

			<div class="flex flex-row items-center justify-between">
				<div class="flex flex-row items-center gap-1">
					<p class="text-sm text-muted-foreground">Listing Fees</p>
				</div>

				<ViewFeesDialog fees={listing_fees} title="Listing Fees">
					{#snippet trigger({ props })}
						<Button {...props} size="xs" variant="ghost"
							>{FormatCurrency(total_listing_fees)}</Button
						>
					{/snippet}
				</ViewFeesDialog>
			</div>

			<div class="flex flex-row items-center justify-between">
				<div class="flex flex-row items-center gap-1">
					<p class="text-sm text-muted-foreground">Final Fees</p>
				</div>

				<ViewFeesDialog fees={final_fees} title="Final Fees">
					{#snippet trigger({ props })}
						<Button {...props} size="xs" variant="ghost"
							>{FormatCurrency(total_final_fees)}</Button
						>
					{/snippet}
				</ViewFeesDialog>
			</div>

			<div class="flex flex-row items-center justify-between">
				<div class="flex flex-row items-center gap-1">
					<p class="text-sm text-muted-foreground">Postage Costs</p>
				</div>

				<ViewFeesDialog fees={postage_fees} title="Postage Costs">
					{#snippet trigger({ props })}
						<Button {...props} size="xs" variant="ghost"
							>{FormatCurrency(total_postage_fees)}</Button
						>
					{/snippet}
				</ViewFeesDialog>
			</div>
		</div>

		<Separator />

		<div class="flex flex-col gap-2">
			<div class="flex flex-row items-center justify-between">
				<p class="text-sm text-muted-foreground">Fees & Postage</p>

				<p class="pr-2.5 text-sm">{FormatCurrency(total_fees)}</p>
			</div>

			<div class="flex flex-row items-center justify-between">
				<p class="text-sm text-muted-foreground">Total Profit</p>

				<p class="pr-2.5 text-sm">{FormatCurrency(final_profit ?? 0)}</p>
			</div>
		</div>
	</div>
{/if}
