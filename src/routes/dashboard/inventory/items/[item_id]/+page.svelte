<script lang="ts">
	import { EndListing } from "$lib/collections/actions/listing.js";
	import { ItemsCollection, LabelJoinsCollection } from "$lib/collections/def.svelte.js";
	import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items.js";
	import { GetItemLabelJoinId } from "$lib/collections/lib/utils.js";
	import ItemFeesPage from "$lib/components/dashboard/inventory/item-pages/ItemFeesPage.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte.js";
	import SidebarLabelSelector from "$lib/components/labels/SidebarLabelSelector.svelte";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import SidebarLocationSelector from "$lib/components/locations/SidebarLocationSelector.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemTitle,
	} from "$lib/components/ui/item/index.js";
	import ResponsiveActionMenu from "$lib/components/ui/responsive-actions/ResponsiveActionMenu.svelte";
	import { Tabs, TabsContent, TabsList, TabsTrigger } from "$lib/components/ui/tabs";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte.js";
	import {
		CalculateFeesByType,
		CalculateItemProfit,
		CalculateTotalFees,
		GetStatusFriendlyName,
	} from "$lib/items/utils.js";
	import {
		GetListingDurationString,
		GetListingExpiryString,
		GetListingStatusFriendlyName,
	} from "$lib/listings/utils.js";
	import { FormatCurrency } from "$lib/utils/formatting.js";
	import { session_state } from "$lib/utils/session.svelte.js";
	import {
		LucideDollarSign,
		LucideEllipsisVertical,
		LucideImage,
		LucideInbox,
		LucidePlus,
		LucideSettings,
		LucideX,
	} from "@lucide/svelte";
	import { eq, useLiveQuery } from "@tanstack/svelte-db";

	let { data } = $props();

	let tab = $state("listings");

	const item_query = useLiveQuery(
		(q) =>
			q
				.from({ item: ItemsWithAllMetaCollection })
				.where(({ item }) => eq(item.id, data.item.id))
				.findOne(),
		[() => data.item.id],
	);

	let item = $derived(item_query.data ?? data.item);

	let active_listings = $derived(item.listings.filter((l) => l.status == "active"));

	let previous_listings = $derived(
		item.listings.filter((l) => !["active", "sold"].includes(l.status)),
	);

	let sold_listing = $derived(item.listings.find((l) => l.status == "sold"));

	let postage_fee = $derived(item.fees.find((fee) => fee.type == "postage_fee"));

	let fee_breakdown = $derived(CalculateFeesByType(item.fees));
	let total_fees = $derived(CalculateTotalFees(item.fees));

	let item_profit = $derived(
		CalculateItemProfit({ item, listings: item.listings, fees: item.fees }),
	);

	function HandleLabelsChange(label_ids: string[]) {
		const current_label_set = new Set<string>(item.labels.map((l) => l.id));

		const new_label_ids: string[] = [];

		for (const label_id of label_ids) {
			if (current_label_set.has(label_id)) {
				current_label_set.delete(label_id);
			} else {
				new_label_ids.push(label_id);
			}
		}

		for (const label_id of new_label_ids) {
			LabelJoinsCollection.insert({
				id: GetItemLabelJoinId(item.id, label_id),
				item_id: item.id,
				label_id: label_id,
				workspace_id: session_state.workspace_id,
			});
		}

		const removed_ids = current_label_set.values();

		for (const label_id of removed_ids) {
			LabelJoinsCollection.delete(GetItemLabelJoinId(item.id, label_id));
		}
	}
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "link", text: "Inventory", href: "/dashboard/inventory" },
			{ type: "page", text: item.name },
		]}
	></DashboardHeader>

	<DashboardContent class="@container p-0 md:p-0">
		<div class="flex flex-row items-center gap-6 border-b p-6">
			<div class="flex size-14 items-center justify-center rounded-lg bg-muted">
				<LucideImage class="stroke-muted-foreground" />
			</div>
			<div class="grid flex-1">
				<p class="text-xl font-medium">{item.name}</p>
				<p class="text-sm text-muted-foreground">{GetStatusFriendlyName(item.status)}</p>
			</div>

			<div class="hidden flex-row gap-3 @xl:flex">
				{#if item.status_int < 2}
					<Button><LucidePlus /> Create Listing</Button>
				{/if}
			</div>
		</div>

		<div class="flex flex-col border-b p-6 @xl:hidden">
			{#if item.status_int < 2}
				<Button><LucidePlus /> Create Listing</Button>
			{/if}
		</div>

		<div class="flex flex-col gap-2 border-b p-6">
			<div class="flex flex-row items-center justify-between">
				<p class="text-sm text-muted-foreground">Labels</p>

				<SidebarLabelSelector labels={item.labels} onLabelsChange={HandleLabelsChange} />
			</div>

			<div class="flex flex-row items-center justify-between">
				<p class="text-sm text-muted-foreground">Storage Location</p>

				<SidebarLocationSelector
					location_id={item.storage_location}
					onLocationChange={(location_id) =>
						ItemsCollection.update(item.id, (item) => {
							item.storage_location = location_id;
						})}
				/>
			</div>
		</div>

		<div class="flex flex-1 flex-col">
			<Tabs class="flex-1" bind:value={tab}>
				<div class="sticky top-0 flex w-full border-b bg-background">
					<TabsList class="mx-auto h-12! w-full max-w-3xl px-6" variant="line">
						<TabsTrigger value="listings">Listings</TabsTrigger>

						<TabsTrigger value="finances">Finances</TabsTrigger>

						<TabsTrigger value="bundles">Bundles</TabsTrigger>
					</TabsList>
				</div>

				<TabsContent
					class="@container mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 p-6"
					value="listings"
				>
					{#if item.listings.length == 0}
						<div class="m-auto flex flex-col items-center justify-center gap-2">
							<LucideInbox class="size-8 stroke-muted-foreground stroke-1" />
							<p class="text-sm text-muted-foreground">This item is not listed</p>
						</div>
					{:else}
						{#if sold_listing}
							<div class="flex flex-col gap-3">
								<div class="flex flex-row items-center justify-between pr-4">
									<h5 class="px-4 text-xl font-medium">Sold Listing</h5>
								</div>

								<FormCard>
									<FormCardSection class="flex flex-row items-center justify-between py-1 pr-1">
										<MarketplaceMedia
											class="h-7"
											marketplace_id={sold_listing.marketplace_id}
										/>

										<ResponsiveActionMenu
											actions={[
												{
													icon: LucideSettings,
													label: "Manage Listing",
													onSelect: () =>
														OpenItemDialog(item, "update-listing", { listing: sold_listing }),
												},
											]}
											align="end"
										>
											{#snippet trigger(props)}
												<Button
													{...props}
													class="text-muted-foreground"
													size="icon-sm"
													variant="ghost"><LucideEllipsisVertical /></Button
												>
											{/snippet}
										</ResponsiveActionMenu>
									</FormCardSection>
									<FormCardSection class="grid grid-cols-1 @md:grid-cols-2 @2xl:grid-cols-3">
										<div class="grid gap-1.5">
											<p class="text-xs text-muted-foreground">Status</p>
											<p>{GetListingStatusFriendlyName(sold_listing.status)}</p>
										</div>

										<div class="grid gap-1.5">
											<p class="text-xs text-muted-foreground">Duration</p>
											<p>{GetListingDurationString(sold_listing)}</p>
										</div>

										<div class="grid gap-1.5">
											<p class="text-xs text-muted-foreground">Total Fees</p>
											<p>
												{FormatCurrency(
													CalculateTotalFees(
														item.fees.filter((fee) => fee.listing_id == sold_listing.id),
													),
												)}
											</p>
										</div>
									</FormCardSection>
								</FormCard>
							</div>
						{/if}

						{#if active_listings.length > 0}
							<div class="flex flex-col gap-3">
								<div class="flex flex-row items-center justify-between pr-4">
									<h5 class="px-4 text-xl font-medium">Active Listings</h5>
								</div>

								{#each active_listings as listing (listing.id)}
									<FormCard>
										<FormCardSection
											class="flex flex-row items-center justify-between py-1 pr-1"
										>
											<MarketplaceMedia class="h-7" marketplace_id={listing.marketplace_id} />

											<ResponsiveActionMenu
												actions={[
													{
														icon: LucideDollarSign,
														label: "Mark as Sold",
														onSelect: () =>
															OpenItemDialog(item, "sell", { listing_id: listing.id }),
													},
													{
														icon: LucideSettings,
														label: "Manage Listing",
														onSelect: () =>
															OpenItemDialog(item, "update-listing", { listing: listing }),
													},
													{
														icon: LucideX,
														label: "End Listing",
														onSelect: () =>
															OpenDestructiveActionDialog({
																title: "Are you sure?",
																description: "Are you sure you want to end this listing?",
																action_label: "End Listing",
																onConfirm: () => {
																	EndListing(listing.id, item.id);
																},
															}),
														variant: "destructive",
													},
												]}
												align="end"
											>
												{#snippet trigger(props)}
													<Button
														{...props}
														class="text-muted-foreground"
														size="icon-sm"
														variant="ghost"><LucideEllipsisVertical /></Button
													>
												{/snippet}
											</ResponsiveActionMenu>
										</FormCardSection>

										<FormCardSection class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
											<div class="grid gap-1.5">
												<p class="text-xs text-muted-foreground">Status</p>
												<p>{GetListingStatusFriendlyName(listing.status)}</p>
											</div>

											<div class="grid gap-1.5">
												<p class="text-xs text-muted-foreground">Expires in</p>
												<p>{GetListingExpiryString(listing)}</p>
											</div>

											<div class="grid gap-1.5">
												<p class="text-xs text-muted-foreground">Total Fees</p>
												<p>
													{FormatCurrency(
														CalculateTotalFees(
															item.fees.filter((fee) => fee.listing_id == listing.id),
														),
													)}
												</p>
											</div>
										</FormCardSection>
									</FormCard>
								{/each}
							</div>
						{/if}

						{#if previous_listings.length > 0}
							<div class="flex flex-col gap-3">
								<div class="flex flex-row items-center justify-between pr-4">
									<h5 class="px-4 text-xl font-medium">Previous Listings</h5>
								</div>

								{#each previous_listings as listing (listing.id)}
									<FormCard>
										<FormCardSection
											class="flex flex-row items-center justify-between py-1 pr-1"
										>
											<MarketplaceMedia class="h-7" marketplace_id={listing.marketplace_id} />

											<ResponsiveActionMenu
												actions={[
													{
														icon: LucideSettings,
														label: "Manage Listing",
														onSelect: () =>
															OpenItemDialog(item, "update-listing", { listing: listing }),
													},
												]}
												align="end"
											>
												{#snippet trigger(props)}
													<Button
														{...props}
														class="text-muted-foreground"
														size="icon-sm"
														variant="ghost"><LucideEllipsisVertical /></Button
													>
												{/snippet}
											</ResponsiveActionMenu>
										</FormCardSection>

										<FormCardSection class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
											<div class="grid gap-1.5">
												<p class="text-xs text-muted-foreground">Status</p>
												<p>{GetListingStatusFriendlyName(listing.status)}</p>
											</div>

											<div class="grid gap-1.5">
												<p class="text-xs text-muted-foreground">Duration</p>
												<p>{GetListingDurationString(listing)}</p>
											</div>

											<div class="grid gap-1.5">
												<p class="text-xs text-muted-foreground">Total Fees</p>
												<p>
													{FormatCurrency(
														CalculateTotalFees(
															item.fees.filter((fee) => fee.listing_id == listing.id),
														),
													)}
												</p>
											</div>
										</FormCardSection>
									</FormCard>
								{/each}
							</div>
						{/if}
					{/if}
				</TabsContent>

				<TabsContent
					class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-10 p-6"
					value="finances"
				>
					<ItemFeesPage {item} fees={item.fees} listings={item.listings} />
				</TabsContent>

				<TabsContent
					class="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6"
					value="item-fees"
				>
					<FormCard>
						{#each item.fees as fee (fee.id)}
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
					</FormCard>
				</TabsContent>
			</Tabs>
		</div>
	</DashboardContent>
</DashboardLayoutRoot>
