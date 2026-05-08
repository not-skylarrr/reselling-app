<script lang="ts">
	import { Checkbox } from "$lib/components/ui/checkbox";
	import {
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldError,
		FieldGroup,
		FieldLabel,
	} from "$lib/components/ui/field";
	import { AVAILABLE_MARKETPLACES } from "$lib/data/marketplaces/data";
	import { SvelteSet } from "svelte/reactivity";
	import type { ItemDialogProps } from "../dialog-state.svelte";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemMedia,
		ItemTitle,
	} from "$lib/components/ui/item";
	import MarketplaceMedia from "$lib/components/listings/MarketplaceMedia.svelte";
	import { Button } from "$lib/components/ui/button";
	import { createForm } from "@tanstack/svelte-form";
	import { ListItem, type NewListingConfig } from "$lib/collections/actions/listing";
	import { toast } from "svelte-sonner";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { LucideCheck, LucideChevronRight } from "@lucide/svelte";
	import { cn } from "$lib/utils";
	import DurationPicker from "$lib/components/ui/duration-picker/DurationPicker.svelte";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import z from "zod";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import { Separator } from "$lib/components/ui/separator";

	let { item, request_close }: ItemDialogProps<"list"> = $props();

	type ListingSteps = "marketplace-select" | "listing-config";

	let listing_step = $state<ListingSteps>("marketplace-select");
	let selected_marketplaces = new SvelteSet<string>();

	const form = createForm(() => ({
		defaultValues: {
			listings: [] as NewListingConfig[],
		},
		onSubmit: ({ value }) => {
			ListItem(item.id, {
				listings: value.listings,
			});

			request_close();
		},
	}));

	function GetNextButtonText() {
		switch (listing_step) {
			case "marketplace-select":
				return "Next";

			case "listing-config":
				if (selected_marketplaces.size > 1) return "Create Listings";

				return "Create Listing";
		}
	}

	function GetIsBackVisible() {
		return listing_step != "marketplace-select";
	}

	function HandleNext() {
		if (listing_step == "marketplace-select") {
			const listing_config: NewListingConfig[] = selected_marketplaces
				.values()
				.toArray()
				.map((marketplace_id) => ({
					marketplace_id: marketplace_id,
					list_price: item.target_sale_price,
					listing_fee: 0,
					duration_ms: null,
				}));

			if (listing_config.length == 0)
				return toast.error("You must select at least one marketplace");

			form.setFieldValue("listings", listing_config);

			listing_step = "listing-config";
			return;
		}

		form.handleSubmit();
	}

	function HandleBack() {
		switch (listing_step) {
			case "listing-config":
				listing_step = "marketplace-select";
		}
	}

	function ToggleSelectedMarketplace(marketplace_id: string) {
		if (selected_marketplaces.has(marketplace_id)) {
			selected_marketplaces.delete(marketplace_id);
		} else {
			selected_marketplaces.add(marketplace_id);
		}
	}
</script>

<DialogContent class="grid-rows-[auto_minmax(0,1fr)_auto] sm:max-w-xl">
	<DialogHeader>
		<DialogTitle>Create new listing</DialogTitle>
		<DialogDescription>Track the various marketplace listings for this item</DialogDescription>
	</DialogHeader>

	{#if listing_step == "marketplace-select"}
		<div class="min-h-0 space-y-2 overflow-y-auto pr-1">
			{#each AVAILABLE_MARKETPLACES as marketplace (marketplace.id)}
				{@const selected = selected_marketplaces.has(marketplace.id)}
				<Item
					class={cn(selected && "bg-accent/50")}
					onclick={() => ToggleSelectedMarketplace(marketplace.id)}
					tabindex={0}
					variant="outline"
				>
					<ItemMedia>
						<MarketplaceMedia marketplace_id={marketplace.id} />
					</ItemMedia>

					<ItemContent class="select-none">
						<ItemTitle>{marketplace.name}</ItemTitle>
						<ItemDescription>{marketplace.domain}</ItemDescription>
					</ItemContent>

					<ItemActions>
						<Checkbox checked={selected} />
					</ItemActions>
				</Item>
			{/each}
		</div>

		<DialogFooter>
			<Button disabled={selected_marketplaces.size == 0} onclick={() => HandleNext()}
				>{GetNextButtonText()} <LucideChevronRight /></Button
			>
		</DialogFooter>
	{/if}

	{#if listing_step == "listing-config"}
		<form.Field name="listings" mode="array">
			{#snippet children(field)}
				<div class="min-h-0 space-y-8 overflow-y-auto pr-1">
					{#each field.state.value as config, index (config.marketplace_id)}
						{@const marketplace = GetMarketplaceData(config.marketplace_id)}

						<FieldGroup class="gap-4">
							<div class="flex flex-row items-center gap-3">
								<p class="text-lg font-medium">{marketplace.name}</p>
							</div>

							<form.Field
								name={`listings[${index}].list_price`}
								validators={{ onBlur: z.number().min(0, "List price cannot be negative") }}
							>
								{#snippet children(field)}
									<Field orientation="responsive">
										<FieldContent>
											<FieldLabel>List Price</FieldLabel>

											{#if field.state.meta.errors.length > 0}
												<FieldError errors={field.state.meta.errors} />
											{:else}
												<FieldDescription>The list price on this marketplace</FieldDescription>
											{/if}
										</FieldContent>

										<FieldControl>
											<CurrencyInput
												onblur={field.handleBlur}
												onValueChange={field.handleChange}
												value={field.state.value}
											/>
										</FieldControl>
									</Field>
								{/snippet}
							</form.Field>

							<form.Field
								name={`listings[${index}].listing_fee`}
								validators={{ onBlur: z.number().min(0, "Listing fees cannot be negative") }}
							>
								{#snippet children(field)}
									<Field orientation="responsive">
										<FieldContent>
											<FieldLabel>Listing Fees</FieldLabel>

											{#if field.state.meta.errors.length > 0}
												<FieldError errors={field.state.meta.errors} />
											{:else}
												<FieldDescription>The listing fees on this marketplace</FieldDescription
												>
											{/if}
										</FieldContent>

										<FieldControl>
											<CurrencyInput
												onblur={field.handleBlur}
												onValueChange={field.handleChange}
												value={field.state.value}
											/>
										</FieldControl>
									</Field>
								{/snippet}
							</form.Field>

							<Separator />

							<form.Field name={`listings[${index}].duration_ms`}>
								{#snippet children(field)}
									<Field orientation="responsive">
										<FieldContent>
											<FieldLabel>Enable Auto Re-listing</FieldLabel>

											{#if field.state.meta.errors.length > 0}
												<FieldError errors={field.state.meta.errors} />
											{:else}
												<FieldDescription
													>Add a listing duration to manage relisting</FieldDescription
												>
											{/if}
										</FieldContent>

										<FieldControl>
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
										</FieldControl>
									</Field>
								{/snippet}
							</form.Field>

							<form.Subscribe selector={(state) => state.values.listings[index].duration_ms}>
								{#snippet children(duration_ms)}
									{#if duration_ms != null}
										<form.Field name={`listings[${index}].duration_ms`}>
											{#snippet children(field)}
												<Field orientation="responsive">
													<FieldContent>
														<FieldLabel>Listing Duration</FieldLabel>

														{#if field.state.meta.errors.length > 0}
															<FieldError errors={field.state.meta.errors} />
														{:else}
															<FieldDescription
																>The duration of this marketplace listing</FieldDescription
															>
														{/if}
													</FieldContent>

													<FieldControl>
														<DurationPicker
															onDurationChange={field.handleChange}
															duration={field.state.value ?? 0}
														/>
													</FieldControl>
												</Field>
											{/snippet}
										</form.Field>
									{/if}
								{/snippet}
							</form.Subscribe>
						</FieldGroup>
					{/each}
				</div>
			{/snippet}
		</form.Field>

		<DialogFooter>
			<Button onclick={() => HandleBack()} variant="ghost">Back</Button>

			<Button onclick={() => HandleNext()}><LucideCheck /> {GetNextButtonText()}</Button>
		</DialogFooter>
	{/if}
</DialogContent>
