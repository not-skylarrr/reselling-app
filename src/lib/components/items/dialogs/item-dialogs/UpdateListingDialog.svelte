<script lang="ts">
	import { createForm } from "@tanstack/svelte-form";
	import type { ItemDialogProps } from "../dialog-state.svelte";
	import {
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import {
		Item,
		ItemMedia,
		ItemTitle,
		ItemDescription,
		ItemContent,
		ItemActions,
	} from "$lib/components/ui/item";
	import { GetListingDurationString, GetListingExpiryString } from "$lib/listings/utils";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import { Field, FieldDescription, FieldError, FieldLabel } from "$lib/components/ui/field";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import DurationPicker from "$lib/components/ui/duration-picker/DurationPicker.svelte";
	import { addHours, endOfDay } from "date-fns";
	import z from "zod";
	import { Button } from "$lib/components/ui/button";
	import { LucideCheck, LucideX } from "@lucide/svelte";
	import { toast } from "svelte-sonner";
	import { ListingsCollection } from "$lib/collections/def.svelte";
	import { EndListing } from "$lib/collections/actions/listing";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";

	let { item, request_close, meta }: ItemDialogProps<"update-listing"> = $props();

	const form = createForm(() => ({
		defaultValues: {
			price: meta.listing.price,
			duration:
				meta.listing.expires_at != null
					? meta.listing.expires_at.getTime() - meta.listing.created_at.getTime()
					: null,
		},
		onSubmit: ({ value }) => {
			try {
				ListingsCollection.update(meta.listing.id, (listing) => {
					listing.price = value.price;

					if (value.duration != null) {
						listing.expires_at = new Date(meta.listing.created_at.getTime() + value.duration);
					}
				});

				request_close();
			} catch (e) {
				console.error(e);

				toast.error("Failed to update listing");
			}
		},
	}));

	const minimum_duration = $derived(
		addHours(new Date(), 1).getTime() - meta.listing.created_at.getTime(),
	);
	const marketplace = $derived(GetMarketplaceData(meta.listing.marketplace_id));

	function HandleListingEnd() {
		try {
			EndListing(meta.listing.id, item.id);

			request_close();
		} catch (e) {
			console.error(e);

			toast.error("Failed to end listing");
		}
	}
</script>

<DialogContent class="@container sm:max-w-xl">
	<DialogHeader>
		<DialogTitle>Update Listing</DialogTitle>
		<DialogDescription>Update the details of a listing</DialogDescription>
	</DialogHeader>

	<Item variant="outline">
		<ItemMedia>
			<MarketplaceMedia marketplace_id={marketplace.id} />
		</ItemMedia>

		<ItemContent class="select-none">
			<ItemTitle class="text-base">{marketplace.name}</ItemTitle>
			<ItemDescription>{GetListingDurationString(meta.listing)}</ItemDescription>
		</ItemContent>

		<ItemActions class="hidden @md:flex">
			<Button onclick={HandleListingEnd} size="sm" variant="outline"
				><LucideX /> End Listing</Button
			>
		</ItemActions>
	</Item>

	<div class="grid grid-cols-1 gap-6">
		<form.Field name="price">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Listing Price</FieldLabel>
					<CurrencyInput
						onblur={field.handleBlur}
						onValueChange={field.handleChange}
						value={field.state.value}
					/>
					<FieldError errors={field.state.meta.errors} />
				</Field>
			{/snippet}
		</form.Field>

		<form.Field name="duration">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Enable Auto Re-listing</FieldLabel>

					<Select
						type="single"
						onValueChange={(val) => {
							if (val == "yes") {
								field.handleChange(0);
							} else {
								field.handleChange(null);
							}
						}}
						value={field.state.value == null ? "no" : "yes"}
					>
						<SelectTrigger class="w-full">
							<p>{field.state.value == null ? "No" : "Yes"}</p>
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="yes">Yes</SelectItem>
							<SelectItem value="no">No</SelectItem>
						</SelectContent>
					</Select>
				</Field>
			{/snippet}
		</form.Field>

		<form.Subscribe selector={(state) => state.values.duration}>
			{#snippet children(duration_ms)}
				{#if duration_ms != null}
					<form.Field
						name="duration"
						validators={{
							onChange: z.number().min(minimum_duration, "Duration cannot be this low"),
						}}
					>
						{#snippet children(field)}
							<Field>
								<FieldLabel>Listing Duration</FieldLabel>

								<DurationPicker
									onDurationChange={field.handleChange}
									duration={field.state.value ?? 0}
								/>
							</Field>
						{/snippet}
					</form.Field>
				{/if}
			{/snippet}
		</form.Subscribe>
	</div>

	<DialogFooter>
		<Button onclick={() => form.handleSubmit()}><LucideCheck /> Save Changes</Button>
	</DialogFooter>
</DialogContent>
