<script lang="ts">
	import { EndListing } from "$lib/collections/actions/listing";
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { Button } from "$lib/components/ui/button";
	import ResponsiveActionMenu from "$lib/components/ui/responsive-actions/ResponsiveActionMenu.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import Plural from "$lib/components/utils/Plural.svelte";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import {
		GetListingDurationString,
		GetListingExpiryString,
		GetListingStatusFriendlyName,
	} from "$lib/listings/utils";
	import type { FullItem, ItemListingStatus } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import {
		LucideCheck,
		LucideEllipsisVertical,
		LucideList,
		LucidePlus,
		LucideSettings,
		LucideStore,
		LucideX,
	} from "@lucide/svelte";

	type Props = {
		item: FullItem;
	};

	let { item }: Props = $props();

	const listing_order: ItemListingStatus[] = ["sold", "active", "expired", "cancelled"];

	const ordered_listings = $derived(
		[...item.listings].sort((a, b) => {
			const a_index = listing_order.indexOf(a.status);
			const b_index = listing_order.indexOf(b.status);

			return a_index - b_index;
		}),
	);
</script>

<div class="flex flex-col gap-2">
	<p class="px-4 text-lg font-medium">Item Listings</p>

	<FormCard class="divide-transparent @3xl:h-78.5">
		{#if ordered_listings.length > 0}
			<FormCardSection class="flex-1 gap-0 overflow-hidden p-0">
				<div class="flex h-12 flex-row items-center justify-between border-b pr-2 pl-4">
					<p class="text-xs text-muted-foreground">
						{ordered_listings.length}
						<Plural count={ordered_listings.length} singular="Listing" plural="Listings" />
					</p>

					<Select type="multiple" value={["completed"]}>
						<SelectTrigger size="sm">All Listings</SelectTrigger>
						<SelectContent align="end">
							<SelectItem value="completed">Completed</SelectItem>
							<SelectItem value="active">Active</SelectItem>
							<SelectItem value="expired">Expired</SelectItem>
							<SelectItem value="cancelled">Cancelled</SelectItem>
						</SelectContent>
					</Select>
				</div>
				<ScrollArea class="flex-1 overflow-hidden">
					<div class="flex flex-col gap-2 p-2">
						{#each ordered_listings as listing (listing.id)}
							{@const marketplace = GetMarketplaceData(listing.marketplace_id)}

							<div class="flex h-14 flex-row items-center gap-4 rounded-xl bg-muted px-3">
								<MarketplaceMedia marketplace_id={listing.marketplace_id} />

								<div class="grid flex-1">
									<p class="text-sm font-medium">{marketplace.name}</p>
									<p class="text-sm text-muted-foreground">
										{GetListingStatusFriendlyName(listing.status)} - {#if listing.status == "active"}
											{GetListingExpiryString(listing)}
										{:else}
											{GetListingDurationString(listing)}
										{/if}
									</p>
								</div>

								<ResponsiveActionMenu
									actions={[
										{
											label: "Mark as Sold",
											icon: LucideCheck,
											onSelect: () => OpenItemDialog(item, "sell", { listing_id: listing.id }),
										},
										{
											label: "Manage Listing",
											icon: LucideSettings,
											onSelect: () =>
												OpenItemDialog(item, "update-listing", { listing: listing }),
										},
										{
											label: "End Listing",
											icon: LucideX,
											onSelect: () => EndListing(listing.id, item.id),
											variant: "destructive",
										},
									]}
									align="end"
								>
									{#snippet trigger(props)}
										<Button {...props} size="icon-sm" variant="ghost"
											><LucideEllipsisVertical /></Button
										>
									{/snippet}
								</ResponsiveActionMenu>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</FormCardSection>
		{:else}
			<FormCardSection class="flex flex-1 flex-col gap-6">
				<div class="flex flex-1 items-center justify-center py-6">
					<p class="text-sm text-muted-foreground">No Listings To Display</p>
				</div>
				<Button onclick={() => OpenItemDialog(item, "list")} variant="outline"
					><LucidePlus /> Create Item Listing</Button
				>
			</FormCardSection>
		{/if}
	</FormCard>
</div>
