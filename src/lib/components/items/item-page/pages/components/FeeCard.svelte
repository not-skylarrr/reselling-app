<script lang="ts">
	import { ItemFeesCollection } from "$lib/collections/def.svelte";
	import UpdateCurrencyPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateCurrencyPopover.svelte";
	import UpdateStringPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateStringPopover.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Collapsible, CollapsibleTrigger } from "$lib/components/ui/collapsible";
	import CollapsibleContent from "$lib/components/ui/collapsible/collapsible-content.svelte";
	import { Field, FieldDescription, FieldTitle } from "$lib/components/ui/field";
	import FieldContent from "$lib/components/ui/field/field-content.svelte";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import type { ItemFee } from "$lib/server/db/schema";
	import { cn } from "$lib/utils";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { LucideChevronDown, LucideRotateCcw, LucideX } from "@lucide/svelte";

	type Props = {
		fee: ItemFee;
	};

	let { fee }: Props = $props();
</script>

<Collapsible>
	<FormCard>
		<FormCardSection class="flex flex-row items-center justify-between">
			<div class="grid">
				<p class="text-sm font-medium">{fee.reference_name}</p>
				<p class="text-xs text-muted-foreground">
					{fee.reference_details.length == 0
						? "No Description Provided"
						: fee.reference_details}
				</p>
			</div>

			<div class="flex flex-row items-center gap-3">
				<UpdateCurrencyPopover
					class={cn((fee.removed || fee.buyer_paid) && "text-muted-foreground line-through")}
					label={`Update ${fee.reference_name}`}
					onValueChange={(val) => {
						ItemFeesCollection.update(fee.id, (draft) => {
							draft.amount = val;
						});
					}}
					value={fee.amount}
				/>

				<CollapsibleTrigger>
					{#snippet child({ props })}
						<Button {...props} class="group" size="icon-xs" variant="ghost"
							><LucideChevronDown class="size-4 group-data-[state=open]:rotate-180" /></Button
						>
					{/snippet}
				</CollapsibleTrigger>
			</div>
		</FormCardSection>

		<CollapsibleContent>
			<FormCardSection class="border-b">
				<Field orientation="horizontal">
					<FieldContent>
						<FieldTitle>Buyer Paid Fee</FieldTitle>
						<FieldDescription>Mark whether the buyer paid this fee</FieldDescription>
					</FieldContent>

					<FieldControl>
						<Select
							type="single"
							onValueChange={(val) => {
								ItemFeesCollection.update(fee.id, (draft) => {
									draft.buyer_paid = val == "buyer";
								});
							}}
							value={fee.buyer_paid ? "buyer" : "seller"}
						>
							<SelectTrigger class="w-full"
								>{fee.buyer_paid ? "Buyer Paid" : "Seller Paid"}</SelectTrigger
							>
							<SelectContent>
								<SelectItem value="seller">Seller Paid</SelectItem>
								<SelectItem value="buyer">Buyer Paid</SelectItem>
							</SelectContent>
						</Select>
					</FieldControl>
				</Field>
			</FormCardSection>

			<FormCardSection>
				{#if fee.removed == false}
					<Field orientation="horizontal">
						<FieldContent>
							<FieldTitle>Remove Fee</FieldTitle>
							<FieldDescription
								>Mark the fee as removed and exclude it from financial data</FieldDescription
							>
						</FieldContent>

						<FieldControl>
							<Button
								onclick={() => {
									ItemFeesCollection.update(fee.id, (draft) => {
										draft.removed = true;
										draft.removal_reason = "Removed by seller";
									});
								}}
								variant="destructive"><LucideX /> Remove Fee</Button
							>
						</FieldControl>
					</Field>
				{:else}
					<Field orientation="horizontal">
						<FieldContent>
							<FieldTitle>Removal Reason</FieldTitle>
							<FieldDescription>The reason the fee was removed</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateStringPopover
								button_variant="outline"
								class="h-9"
								onValueChange={(val) => {
									ItemFeesCollection.update(fee.id, (draft) => {
										draft.removal_reason = val;
									});
								}}
								value={fee.removal_reason ?? ""}
							/>
						</FieldControl>
					</Field>

					<Field orientation="horizontal">
						<FieldContent>
							<FieldTitle>Reinstate Fee</FieldTitle>
							<FieldDescription
								>Mark the fee as reinstated and incude it with financial data</FieldDescription
							>
						</FieldContent>

						<FieldControl>
							<Button
								onclick={() => {
									ItemFeesCollection.update(fee.id, (draft) => {
										draft.removed = false;
										draft.removal_reason = null;
									});
								}}
								variant="outline"><LucideRotateCcw /> Reinstate Fee</Button
							>
						</FieldControl>
					</Field>
				{/if}
			</FormCardSection>
		</CollapsibleContent>
	</FormCard>
</Collapsible>
