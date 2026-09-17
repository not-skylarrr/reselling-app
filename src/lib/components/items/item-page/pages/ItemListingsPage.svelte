<script lang="ts">
	import { ItemFeesCollection, ListingsCollection } from "$lib/collections/def.svelte";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { SettingsGroupHeader, SettingsLayout } from "$lib/components/settings/layout";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldTitle,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { GetListingDurationString, GetListingStatusFriendlyName } from "$lib/listings/utils";
	import type {
		ItemFee,
		ItemListing,
		ItemListingStatus,
		ItemWithLabels,
	} from "$lib/server/db/schema";
	import { FormatCurrency, FormatDateStd } from "$lib/utils/formatting";
	import { LucideChevronRight } from "@lucide/svelte";
	import { and, eq, toArray, useLiveQuery } from "@tanstack/svelte-db";
	import { OpenItemDialog } from "../../dialogs/dialog-state.svelte";
	import { CalculateFeesByType, CalculateTotalFees } from "$lib/items/utils";
	import SettingsGroup from "$lib/components/settings/layout/SettingsGroup.svelte";
	import ListingCard from "./components/ListingCard.svelte";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();

	const listings_query = useLiveQuery(
		(q) =>
			q
				.from({ listing: ListingsCollection })
				.where(({ listing }) => eq(listing.item_id, item.id))
				.select(({ listing }) => ({
					...listing,
					fees: toArray(
						q
							.from({ fees: ItemFeesCollection })
							.where(({ fees }) =>
								and(eq(fees.type, "listing_fee"), eq(fees.listing_id, listing.id)),
							),
					),
				})),
		[() => item],
	);

	type ListingsByStatus = Record<
		ItemListingStatus,
		(ItemListing & {
			fees: ItemFee[];
		})[]
	>;

	const listings_by_status = $derived.by(() => {
		let status_object: ListingsByStatus = {
			active: [],
			sold: [],
			expired: [],
			cancelled: [],
		};

		for (const listing of listings_query.data) {
			status_object[listing.status].push(listing);
		}

		return status_object;
	});
</script>

<SettingsLayout class="p-6! pt-12!">
	{#if listings_by_status.sold.length > 0}
		<SettingsGroup>
			<SettingsGroupHeader>Sold Listing</SettingsGroupHeader>

			<ListingCard {item} listing={listings_by_status.sold[0]} />
		</SettingsGroup>
	{/if}

	{#if listings_by_status.active.length > 0}
		<SettingsGroup>
			<SettingsGroupHeader>Active Listings</SettingsGroupHeader>

			{#each listings_by_status.active as listing (listing.id)}
				<ListingCard {item} {listing} />
			{/each}
		</SettingsGroup>
	{/if}

	{#if listings_by_status.expired.length > 0}
		<SettingsGroup>
			<SettingsGroupHeader>Expired Listings</SettingsGroupHeader>

			{#each listings_by_status.expired as listing (listing.id)}
				<ListingCard {item} {listing} />
			{/each}
		</SettingsGroup>
	{/if}

	{#if listings_by_status.expired.length > 0}
		<SettingsGroup>
			<SettingsGroupHeader>Cancelled Listings</SettingsGroupHeader>

			{#each listings_by_status.cancelled as listing (listing.id)}
				<ListingCard {item} {listing} />
			{/each}
		</SettingsGroup>
	{/if}
</SettingsLayout>
