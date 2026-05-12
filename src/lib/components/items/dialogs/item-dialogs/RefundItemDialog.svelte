<script lang="ts">
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import {
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemMedia,
		ItemTitle,
	} from "$lib/components/ui/item";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import { GetListingDurationString } from "$lib/listings/utils";
	import { createForm } from "@tanstack/svelte-form";
	import type { ItemDialogProps } from "../dialog-state.svelte";
	import { Field, FieldLabel } from "$lib/components/ui/field";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";

	let { item, request_close, meta }: ItemDialogProps<"refund"> = $props();

	const form = createForm(() => ({
		defaultValues: {
			amount: meta.listing.price,
		},
	}));

	let marketplace = $derived(GetMarketplaceData(meta.listing.marketplace_id));
</script>

<DialogContent class="w-full sm:max-w-xl">
	<DialogHeader>
		<DialogTitle>Refund Listing</DialogTitle>
		<DialogDescription>Refund a partial or full amount from this listing</DialogDescription>
	</DialogHeader>

	<Item variant="outline">
		<ItemMedia>
			<MarketplaceMedia marketplace_id={meta.listing.marketplace_id} />
		</ItemMedia>

		<ItemContent class="select-none">
			<ItemTitle>{marketplace.name}</ItemTitle>
			<ItemDescription class="text-xs">{GetListingDurationString(meta.listing)}</ItemDescription
			>
		</ItemContent>

		<ItemActions>
			<p>{FormatCurrency(meta.listing.price)}</p>
		</ItemActions>
	</Item>

	<div class="grid gap-6">
		<form.Field name="amount">
			{#snippet children(field)}
				<Field>
					<FieldLabel>Refunded Amount</FieldLabel>
					<CurrencyInput onValueChange={field.handleChange} value={field.state.value} />
				</Field>
			{/snippet}
		</form.Field>
	</div>
</DialogContent>
