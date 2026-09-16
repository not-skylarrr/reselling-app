<script lang="ts">
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Field, FieldContent, FieldTitle } from "$lib/components/ui/field";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { CalculateTotalFees } from "$lib/items/utils";
	import { GetListingStatusFriendlyName } from "$lib/listings/utils";
	import type { ItemFee, ItemListing, ItemWithLabels } from "$lib/server/db/schema";
	import { FormatCurrency, FormatDateStd } from "$lib/utils/formatting";
	import { LucideChevronRight } from "@lucide/svelte";

	type Props = {
		listing: ItemListing & {
			fees: ItemFee[];
		};
		item: ItemWithLabels;
	};

	let { listing, item }: Props = $props();

	const marketplace = $derived(GetMarketplaceData(listing.marketplace_id));
</script>

<FormCard>
	<FormCardSection class="flex flex-row items-center-safe justify-between py-1">
		<div class="flex flex-row items-center gap-4">
			<MarketplaceMedia marketplace_id={listing.marketplace_id} />

			<p class="font-medium">{marketplace.name} Listing</p>
		</div>

		<p
			data-active={listing.status == "active"}
			class="text-sm text-muted-foreground data-[active=true]:text-success"
		>
			{GetListingStatusFriendlyName(listing.status)}
		</p>
	</FormCardSection>
	<FormCardSection class="gap-4">
		<div class="grid grid-cols-2 gap-4 gap-x-6">
			<Field orientation="horizontal">
				<FieldContent>
					<FieldTitle class="font-normal">List Price</FieldTitle>
				</FieldContent>

				<p class="text-end text-sm text-muted-foreground">
					{FormatCurrency(listing.price)}
				</p>
			</Field>

			<Field orientation="horizontal">
				<FieldContent>
					<FieldTitle class="font-normal">Total Fees</FieldTitle>
				</FieldContent>

				<p class="text-end text-sm text-muted-foreground">
					{FormatCurrency(CalculateTotalFees(listing.fees))}
				</p>
			</Field>
		</div>

		<div class="grid grid-cols-2 gap-x-6">
			<Field orientation="horizontal">
				<FieldContent>
					<FieldTitle class="font-normal">Start Date</FieldTitle>
				</FieldContent>

				<p class="text-end text-sm text-muted-foreground">
					{FormatDateStd(listing.created_at, true)}
				</p>
			</Field>

			{#if listing.ended_at}
				<Field orientation="horizontal">
					<FieldContent>
						<FieldTitle class="font-normal">Ended At</FieldTitle>
					</FieldContent>

					<p class="text-end text-sm text-muted-foreground">
						{FormatDateStd(listing.ended_at, true)}
					</p>
				</Field>
			{:else}
				<Field orientation="horizontal">
					<FieldContent>
						<FieldTitle class="font-normal">Expiry Date</FieldTitle>
					</FieldContent>

					<p class="text-end text-sm text-muted-foreground">
						{#if listing.expires_at}
							{FormatDateStd(listing.expires_at, true)}
						{:else}
							No Expiry Date
						{/if}
					</p>
				</Field>
			{/if}
		</div>
	</FormCardSection>

	<FormCardSection class="flex flex-row items-center justify-end gap-3 p-2">
		<Button size="sm" variant="outline">View Listing Fees <LucideChevronRight /></Button>

		{#if listing.status == "active"}
			<Button onclick={() => OpenItemDialog(item, "sell", { listing_id: listing.id })} size="sm"
				>Mark as Sold <LucideChevronRight /></Button
			>
		{/if}
	</FormCardSection>
</FormCard>
