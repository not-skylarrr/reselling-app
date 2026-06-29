<script lang="ts">
	import UpdateItemPriceInput from "$lib/components/items/item-page/UpdateItemPriceInput.svelte";
	import { Button } from "$lib/components/ui/button";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import type { FullItem } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import {
		LucideEllipsisVertical,
		LucideInfo,
		LucidePackage,
		LucidePlus,
	} from "@lucide/svelte";
	import ViewFeesDialog from "./components/ViewFeesDialog.svelte";
	import { CalculateItemProfit, CalculateTotalFees } from "$lib/items/utils";
	import { Separator } from "$lib/components/ui/separator";
	import { ListingsCollection } from "$lib/collections/def.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { cn } from "$lib/utils";
	import UpdateDatePopover from "./components/UpdateDatePopover.svelte";

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
	<div class="flex justify-center">
		<div class="flex w-full max-w-3xl flex-col gap-4 px-3 py-6">
			<p class="px-4 text-lg font-medium">Sale Details</p>

			<div class="flex flex-col gap-1 px-4">
				<div class="flex flex-1 flex-col gap-2">
					<div class="flex flex-row items-center justify-between">
						<p class="text-sm text-muted-foreground">Sale Date</p>

						<UpdateDatePopover
							value={sold_listing.ended_at}
							onValueChange={(val) => {
								if (!val) return;

								ListingsCollection.update(sold_listing.id, (draft) => {
									draft.ended_at = val;
								});
							}}
						/>
					</div>

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

						<ViewFeesDialog {item} type="listing_fee" fees={listing_fees} title="Listing Fees">
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

						<ViewFeesDialog {item} type="final_fee" fees={final_fees} title="Final Fees">
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

						<ViewFeesDialog {item} type="postage_fee" fees={postage_fees} title="Postage Costs">
							{#snippet trigger({ props })}
								<Button {...props} size="xs" variant="ghost"
									>{FormatCurrency(total_postage_fees)}</Button
								>
							{/snippet}
						</ViewFeesDialog>
					</div>
				</div>
			</div>

			<Separator />

			<div class="flex flex-col gap-1 px-4">
				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Fees & Postage</p>

					<p class="h-7 pr-2.5 text-sm">{FormatCurrency(total_fees)}</p>
				</div>

				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Total Profit</p>

					<p
						class={cn(
							"h-7 pr-2.5 text-sm",
							final_profit != null &&
								(final_profit == 0
									? "text-muted-foreground"
									: final_profit < 0
										? "text-destructive"
										: "text-success"),
						)}
					>
						{FormatCurrency(final_profit ?? 0)}
					</p>
				</div>
			</div>
		</div>
	</div>
{/if}
