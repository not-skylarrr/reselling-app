<script lang="ts">
	import { EndListing } from "$lib/collections/actions/listing";
	import { ListingsCollection } from "$lib/collections/def.svelte";
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import { Button } from "$lib/components/ui/button";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemMedia,
		ItemTitle,
	} from "$lib/components/ui/item";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { FormatCurrency } from "$lib/utils/formatting";
	import {
		LucideEllipsisVertical,
		LucideChartLine,
		LucidePlus,
		LucideX,
		LucideCheck,
		LucideInbox,
		LucideSettings,
	} from "@lucide/svelte";
	import { eq, useLiveQuery } from "@tanstack/svelte-db";
	import { formatDistanceStrict } from "date-fns";
	import type { Item as DbItem } from "$lib/server/db/schema";
	import { GetListingExpiryString } from "$lib/listings/utils";

	type Props = {
		item: DbItem;
	};

	let { item }: Props = $props();

	const item_listings = useLiveQuery(
		(q) =>
			q
				.from({ listing: ListingsCollection })
				.where(({ listing }) => eq(listing.item_id, item.id)),
		[() => item],
	);

	const active_item_listings = $derived(item_listings.data.filter((l) => l.status == "active"));
</script>

{#if item.status_int < 2}
	<div class="flex min-h-44 flex-col gap-2 py-4 pt-2">
		<div class="flex h-8 flex-row items-center justify-between gap-1.5 px-4 pr-2">
			<p class="text-sm font-medium">Active Listings</p>

			<div class="flex flex-row gap-2">
				<Button onclick={() => OpenItemDialog(item, "list")} size="icon-sm" variant="ghost"
					><LucidePlus /></Button
				>
				<Button
					onclick={() => OpenItemDialog(item, "listing-history")}
					size="icon-sm"
					variant="ghost"><LucideChartLine /></Button
				>
			</div>
		</div>

		<div class="flex flex-1 flex-col gap-4">
			{#each active_item_listings as listing (listing.id)}
				{@const marketplace = GetMarketplaceData(listing.marketplace_id)}

				<Item class="px-4 py-0 pr-2">
					<ItemMedia variant="icon">
						<MarketplaceMedia class="size-8" marketplace_id={listing.marketplace_id} />
					</ItemMedia>

					<ItemContent class="gap-0">
						<ItemTitle class="font-normal">{marketplace.name}</ItemTitle>
						<ItemDescription class="text-xs"
							>{FormatCurrency(listing.price)} | {GetListingExpiryString(
								listing,
							)}</ItemDescription
						>
					</ItemContent>

					<ItemActions>
						<DropdownMenu>
							<DropdownMenuTrigger>
								{#snippet child({ props })}
									<Button {...props} size="icon-xs" variant="ghost"
										><LucideEllipsisVertical /></Button
									>
								{/snippet}
							</DropdownMenuTrigger>
							<DropdownMenuContent align="end">
								<DropdownMenuItem
									onSelect={() => OpenItemDialog(item, "sell", { listing_id: listing.id })}
									><LucideCheck /> Mark as Sold</DropdownMenuItem
								>
								<DropdownMenuItem
									onSelect={() => OpenItemDialog(item, "update-listing", { listing: listing })}
									><LucideSettings /> Update Listing</DropdownMenuItem
								>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									onSelect={() => EndListing(listing.id, item.id)}
									variant="destructive"><LucideX /> End Listing</DropdownMenuItem
								>
							</DropdownMenuContent>
						</DropdownMenu>
					</ItemActions>
				</Item>
			{/each}

			{#if active_item_listings.length == 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-3">
					<LucideInbox class="size-8 stroke-1 text-muted-foreground" />
					<p class="text-xs text-muted-foreground">This item is not currently listed</p>
				</div>
			{/if}
		</div>
	</div>
{/if}
