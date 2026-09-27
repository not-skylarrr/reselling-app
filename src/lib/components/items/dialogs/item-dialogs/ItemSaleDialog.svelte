<script lang="ts">
	import {
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import { and, eq, useLiveQuery } from "@tanstack/svelte-db";
	import type { ItemDialogProps } from "../dialog-state.svelte";
	import { ListingsCollection } from "$lib/collections/def.svelte";
	import { LucideCheck, LucideChevronRight, LucideLoaderCircle } from "@lucide/svelte";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { GetListingDurationString, GetListingStatusFriendlyName } from "$lib/listings/utils";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemMedia,
		ItemTitle,
	} from "$lib/components/ui/item";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { cn } from "$lib/utils";
	import { Button } from "$lib/components/ui/button";
	import { createForm } from "@tanstack/svelte-form";
	import { Field, FieldError, FieldLabel } from "$lib/components/ui/field";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import { MarkListingSold } from "$lib/collections/actions/listing";
	import { toast } from "svelte-sonner";

	let { item, request_close, meta }: ItemDialogProps<"sell"> = $props();

	const active_listings_query = useLiveQuery(
		(q) =>
			q
				.from({ listing: ListingsCollection })
				.where(({ listing }) =>
					and(eq(listing.item_id, item.id), eq(listing.status, "active")),
				),
		[() => item],
	);

	type DialogPage = "listing-select" | "sale-details";

	// svelte-ignore state_referenced_locally
	let listing_id = $state<string | null>(meta.listing_id ?? null);

	let displayed_page = $state<DialogPage>(
		// svelte-ignore state_referenced_locally
		listing_id == null ? "listing-select" : "sale-details",
	);

	let selected_listing = $derived(
		active_listings_query.data.find((listing) => listing.id == listing_id),
	);

	let selected_marketplace = $derived(
		selected_listing ? GetMarketplaceData(selected_listing.marketplace_id) : null,
	);

	const form = createForm(() => ({
		defaultValues: {
			sale_price: selected_listing?.price ?? 0,
			sale_fee: 0,
			postage_fee: 0,
			buyer_paid_postage: false,
		},
		onSubmit: async ({ value }) => {
			if (!listing_id || !selected_listing) return;

			try {
				MarkListingSold(listing_id, item.id, {
					sale_price: value.sale_price,
					sale_fee: value.sale_fee,
					postage_cost: value.postage_fee,
					buyer_paid_postage: value.buyer_paid_postage,
					marketplace_id: selected_listing.marketplace_id,
				});

				request_close();

				toast.success("Item marked as sold");
			} catch (e) {
				console.error(e);

				toast.error("Failed to mark item as sold");
			}
		},
	}));

	$effect(() => {
		const initial_sale_price = selected_listing?.price;

		if (initial_sale_price != undefined) {
			form.setFieldValue("sale_price", initial_sale_price);
		}
	});
</script>

<DialogContent class="flex max-h-180 flex-col overflow-hidden sm:max-w-xl">
	{#if displayed_page == "listing-select" || !selected_listing}
		<DialogHeader>
			<DialogTitle>Select Listing</DialogTitle>
			<DialogDescription>Select the listing where the sale occured</DialogDescription>
		</DialogHeader>

		{#if active_listings_query.isLoading}
			<div class="flex flex-col items-center justify-center gap-2 py-6">
				<LucideLoaderCircle class="size-8 animate-spin" />
				<p class="text-xs text-muted-foreground">Loading Listings</p>
			</div>
		{:else}
			<ScrollArea class="min-h-0 flex-1">
				<div class="flex flex-col gap-4">
					{#each active_listings_query.data as listing (listing.id)}
						{@const marketplace = GetMarketplaceData(listing.marketplace_id)}

						<Item
							class={cn("hover:bg-accent/50", listing_id == listing.id && "bg-accent")}
							onclick={() => (listing_id = listing.id)}
							tabindex={0}
							variant="outline"
						>
							<ItemMedia>
								<MarketplaceMedia marketplace_id={marketplace.id} />
							</ItemMedia>

							<ItemContent class="select-none">
								<ItemTitle class="text-base">{marketplace.name}</ItemTitle>
								<ItemDescription>{GetListingDurationString(listing)}</ItemDescription>
							</ItemContent>

							<ItemActions>
								<p class="text-muted-foreground">
									{GetListingStatusFriendlyName(listing.status)}
								</p>
							</ItemActions>
						</Item>
					{/each}
				</div>
			</ScrollArea>

			<DialogFooter>
				<Button disabled={listing_id == null} onclick={() => (displayed_page = "sale-details")}
					>Select Listing <LucideChevronRight /></Button
				>
			</DialogFooter>
		{/if}
	{/if}

	{#if displayed_page == "sale-details" && selected_listing}
		<DialogHeader>
			<DialogTitle>Sale Details</DialogTitle>
			<DialogDescription>Enter the details regarding the sale of this listing</DialogDescription
			>
		</DialogHeader>

		{#if selected_marketplace}
			<Item variant="outline">
				<ItemMedia>
					<MarketplaceMedia marketplace_id={selected_marketplace.id} />
				</ItemMedia>

				<ItemContent class="select-none">
					<ItemTitle class="text-base">{selected_marketplace.name}</ItemTitle>
					<ItemDescription>{GetListingDurationString(selected_listing)}</ItemDescription>
				</ItemContent>

				<ItemActions>
					<Button
						onclick={() => {
							form.reset();

							displayed_page = "listing-select";
						}}
						size="sm"
						variant="outline">Change Listing</Button
					>
				</ItemActions>
			</Item>
		{/if}

		<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
			<form.Field name="sale_price">
				{#snippet children(field)}
					<Field>
						<FieldLabel>Sale Price</FieldLabel>
						<CurrencyInput
							onblur={field.handleBlur}
							onValueChange={field.handleChange}
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Field>
				{/snippet}
			</form.Field>

			<form.Field name="sale_fee">
				{#snippet children(field)}
					<Field>
						<FieldLabel>Final Sale Fee</FieldLabel>
						<CurrencyInput
							onblur={field.handleBlur}
							onValueChange={field.handleChange}
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Field>
				{/snippet}
			</form.Field>

			<form.Field name="postage_fee">
				{#snippet children(field)}
					<Field>
						<FieldLabel>Postage Cost</FieldLabel>
						<CurrencyInput
							onblur={field.handleBlur}
							onValueChange={field.handleChange}
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Field>
				{/snippet}
			</form.Field>

			<form.Field name="buyer_paid_postage">
				{#snippet children(field)}
					<Field>
						<FieldLabel>Buyer Paid Postage</FieldLabel>
						<Select
							type="single"
							onValueChange={(val) => field.handleChange(val == "yes")}
							value={field.state.value ? "yes" : "no"}
						>
							<SelectTrigger>
								{field.state.value ? "Yes" : "No"}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="yes">Yes</SelectItem>
								<SelectItem value="no">No</SelectItem>
							</SelectContent>
						</Select>
						<FieldError errors={field.state.meta.errors} />
					</Field>
				{/snippet}
			</form.Field>
		</div>

		<DialogFooter>
			<Button onclick={() => form.handleSubmit()}><LucideCheck /> Mark as Sold</Button>
		</DialogFooter>
	{/if}
</DialogContent>
