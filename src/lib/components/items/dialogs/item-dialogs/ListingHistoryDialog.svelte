<script lang="ts">
	import {
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import { eq, toArray, useLiveQuery } from "@tanstack/svelte-db";
	import type { ItemDialogProps } from "../dialog-state.svelte";
	import { ItemFeesCollection, ListingsCollection } from "$lib/collections/def.svelte";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemMedia,
		ItemTitle,
	} from "$lib/components/ui/item";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { FormatCurrency, FormatDateStd } from "$lib/utils/formatting";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import {
		Collapsible,
		CollapsibleContent,
		CollapsibleTrigger,
	} from "$lib/components/ui/collapsible";
	import { Button } from "$lib/components/ui/button";
	import { LucideChevronDown } from "@lucide/svelte";
	import { formatDistanceStrict } from "date-fns";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import type { ItemListing } from "$lib/server/db/schema";
	import { GetListingStatusFriendlyName } from "$lib/listings/utils";

	let { item }: ItemDialogProps<"listing-history"> = $props();

	const listings_query = useLiveQuery(
		(q) =>
			q
				.from({ listing: ListingsCollection })
				.where(({ listing }) => eq(listing.item_id, item.id))
				.orderBy(({ listing }) => [listing.created_at], "desc")
				.select(({ listing }) => ({
					...listing,
					fees: toArray(
						q
							.from({ fee: ItemFeesCollection })
							.where(({ fee }) => eq(fee.listing_id, listing.id)),
					),
				})),
		[() => item],
	);

	const sold_listings = $derived(listings_query.data.filter((l) => l.status == "sold"));
	const active_listings = $derived(listings_query.data.filter((l) => l.status == "active"));
	const prev_listings = $derived(
		listings_query.data.filter((l) => l.status != "active" && l.status != "sold"),
	);

	function GetPrevListingDurationString(listing: ItemListing) {
		let start_date = listing.created_at;
		let end_date = listing.expires_at;

		if (listing.ended_at) {
			end_date = listing.ended_at;
		}

		return `${FormatDateStd(start_date)} - ${FormatDateStd(end_date)}`;
	}
</script>

<DialogContent class="flex max-h-180 flex-col overflow-hidden sm:max-w-2xl">
	<DialogHeader>
		<DialogTitle>Listing History</DialogTitle>
		<DialogDescription>All listings associated with this item</DialogDescription>
	</DialogHeader>

	<ScrollArea class="min-h-0 flex-1">
		<div class="flex flex-col gap-6">
			{#if item.status_int > 1}
				<div class="flex shrink-0 flex-col gap-3">
					<p class="text-base font-medium">Sold Listings ({sold_listings.length})</p>

					{#if sold_listings.length == 0}
						<div class="flex flex-col items-center justify-center py-6">
							<p class="text-xs text-muted-foreground">This item has no sold listings</p>
						</div>
					{/if}

					{#each sold_listings as listing (listing.id)}
						{@const marketplace = GetMarketplaceData(listing.marketplace_id)}

						{@const listing_fees = listing.fees
							.filter((l) => l.type == "listing_fee")
							.reduce((total, fee) => {
								return total + fee.amount;
							}, 0)}

						{@const final_fees = listing.fees
							.filter((l) => l.type == "final_fee")
							.reduce((total, fee) => {
								return total + fee.amount;
							}, 0)}

						{@const total_fees = listing.fees.reduce((total, fee) => {
							return total + fee.amount;
						}, 0)}

						<Collapsible>
							<div class="flex flex-col gap-3 rounded-lg bg-muted p-3">
								<Item class="p-0">
									<ItemMedia>
										<MarketplaceMedia marketplace_id={listing.marketplace_id} />
									</ItemMedia>

									<ItemContent>
										<ItemTitle>{marketplace.name}</ItemTitle>
										<ItemDescription class="text-xs"
											>{GetListingStatusFriendlyName(listing.status)} | Expires {formatDistanceStrict(
												listing.expires_at,
												new Date(),
												{
													addSuffix: true,
												},
											)}</ItemDescription
										>
									</ItemContent>

									<ItemActions>
										<CollapsibleTrigger>
											{#snippet child({ props })}
												<Button {...props} class="group" size="icon-sm" variant="ghost"
													><LucideChevronDown
														class="group-data-[state=open]:rotate-180"
													/></Button
												>
											{/snippet}
										</CollapsibleTrigger>
									</ItemActions>
								</Item>

								<CollapsibleContent>
									<div class="flex flex-col gap-3 border-t pt-3 pr-3">
										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Listing Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The listing fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(listing_fees)}</p>
											</ItemActions>
										</Item>

										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Final Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The final sale fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(final_fees)}</p>
											</ItemActions>
										</Item>

										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Total Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The total fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(total_fees)}</p>
											</ItemActions>
										</Item>
									</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					{/each}
				</div>
			{/if}

			{#if item.status_int < 2}
				<div class="flex shrink-0 flex-col gap-3">
					<p class="text-base font-medium">Active Listings ({active_listings.length})</p>

					{#if active_listings.length == 0}
						<div class="flex flex-col items-center justify-center py-6">
							<p class="text-xs text-muted-foreground">This item has no active listings</p>
						</div>
					{/if}

					{#each active_listings as listing (listing.id)}
						{@const marketplace = GetMarketplaceData(listing.marketplace_id)}

						{@const listing_fees = listing.fees
							.filter((l) => l.type == "listing_fee")
							.reduce((total, fee) => {
								return total + fee.amount;
							}, 0)}

						{@const final_fees = listing.fees
							.filter((l) => l.type == "final_fee")
							.reduce((total, fee) => {
								return total + fee.amount;
							}, 0)}

						{@const total_fees = listing.fees.reduce((total, fee) => {
							return total + fee.amount;
						}, 0)}

						<Collapsible>
							<div class="flex flex-col gap-3 rounded-lg bg-muted p-3">
								<Item class="p-0">
									<ItemMedia>
										<MarketplaceMedia marketplace_id={listing.marketplace_id} />
									</ItemMedia>

									<ItemContent>
										<ItemTitle>{marketplace.name}</ItemTitle>
										<ItemDescription class="text-xs"
											>{GetListingStatusFriendlyName(listing.status)} | Expires {formatDistanceStrict(
												listing.expires_at,
												new Date(),
												{
													addSuffix: true,
												},
											)}</ItemDescription
										>
									</ItemContent>

									<ItemActions>
										<CollapsibleTrigger>
											{#snippet child({ props })}
												<Button {...props} class="group" size="icon-sm" variant="ghost"
													><LucideChevronDown
														class="group-data-[state=open]:rotate-180"
													/></Button
												>
											{/snippet}
										</CollapsibleTrigger>
									</ItemActions>
								</Item>

								<CollapsibleContent>
									<div class="flex flex-col gap-3 border-t pt-3 pr-3">
										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Listing Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The listing fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(listing_fees)}</p>
											</ItemActions>
										</Item>

										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Final Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The final sale fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(final_fees)}</p>
											</ItemActions>
										</Item>

										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Total Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The total fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(total_fees)}</p>
											</ItemActions>
										</Item>
									</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					{/each}
				</div>
			{/if}

			<div class="flex flex-col gap-3">
				<p class="text-base font-medium">Previous Listings ({prev_listings.length})</p>

				<div class="flex flex-col gap-3">
					{#if prev_listings.length == 0}
						<div class="flex flex-col items-center justify-center py-6">
							<p class="text-xs text-muted-foreground">This item has no previous listings</p>
						</div>
					{/if}

					{#each prev_listings as listing (listing.id)}
						{@const marketplace = GetMarketplaceData(listing.marketplace_id)}

						{@const listing_fees = listing.fees
							.filter((l) => l.type == "listing_fee")
							.reduce((total, fee) => {
								return total + fee.amount;
							}, 0)}

						{@const final_fees = listing.fees
							.filter((l) => l.type == "final_fee")
							.reduce((total, fee) => {
								return total + fee.amount;
							}, 0)}

						{@const total_fees = listing.fees.reduce((total, fee) => {
							return total + fee.amount;
						}, 0)}

						<Collapsible>
							<div class="flex flex-col gap-3 rounded-lg bg-muted p-3">
								<Item class="p-0">
									<ItemMedia>
										<MarketplaceMedia marketplace_id={listing.marketplace_id} />
									</ItemMedia>

									<ItemContent>
										<ItemTitle>{marketplace.name}</ItemTitle>
										<ItemDescription class="text-xs"
											>{GetListingStatusFriendlyName(listing.status)} | {GetPrevListingDurationString(
												listing,
											)}</ItemDescription
										>
									</ItemContent>

									<ItemActions>
										<CollapsibleTrigger>
											{#snippet child({ props })}
												<Button {...props} class="group" size="icon-sm" variant="ghost"
													><LucideChevronDown
														class="group-data-[state=open]:rotate-180"
													/></Button
												>
											{/snippet}
										</CollapsibleTrigger>
									</ItemActions>
								</Item>

								<CollapsibleContent>
									<div class="flex flex-col gap-3 border-t pt-3 pr-3">
										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Listing Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The listing fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(listing_fees)}</p>
											</ItemActions>
										</Item>

										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Final Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The final sale fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(final_fees)}</p>
											</ItemActions>
										</Item>

										<Item class="p-0">
											<ItemContent>
												<ItemTitle class="text-sm font-normal">Total Fees</ItemTitle>
												<ItemDescription class="text-xs"
													>The total fees associated to this listing</ItemDescription
												>
											</ItemContent>

											<ItemActions>
												<p>{FormatCurrency(total_fees)}</p>
											</ItemActions>
										</Item>
									</div>
								</CollapsibleContent>
							</div>
						</Collapsible>
					{/each}
				</div>
			</div>
		</div>
	</ScrollArea>
</DialogContent>
