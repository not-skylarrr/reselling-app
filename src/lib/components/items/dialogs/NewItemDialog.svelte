<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { Dialog, DialogContent, DialogHeader, DialogTitle } from "$lib/components/ui/dialog";
	import { Input } from "$lib/components/ui/input";
	import {
		StructuredDialogDescription,
		StructuredDialogHeader,
		StructuredDialogLayout,
		StructuredDialogSection,
		StructuredDialogTitle,
	} from "$lib/components/ui/structured-dialog";
	import { createForm, useStore } from "@tanstack/svelte-form";
	import { item_dialog_state, OpenItemDialog } from "./dialog-state.svelte";
	import { Field, FieldLabel } from "$lib/components/ui/field";
	import { createHotkey } from "@tanstack/svelte-hotkeys";
	import { LucidePlus } from "@lucide/svelte";
	import { Switch } from "$lib/components/ui/switch";
	import {
		FeeGroupsCollection,
		ItemAssociationsCollection,
		ItemsCollection,
		LabelJoinsCollection,
	} from "$lib/collections/def.svelte";
	import { session_state } from "$lib/utils/session.svelte";
	import PurchaseDatePopover from "./components/PurchaseDatePopover.svelte";
	import LabelsPopover from "./components/LabelsPopover.svelte";
	import LocationPopover from "./components/LocationPopover.svelte";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import type { Item } from "$lib/server/db/schema";
	import { eq, inArray, and, createTransaction, useLiveQuery } from "@tanstack/svelte-db";
	import { ApplyTsDbMutation } from "$lib/utils/ts-db/trpc-map";
	import NewItemBundleSelector from "./components/NewItemBundleSelector.svelte";
	import { toast } from "svelte-sonner";
	import type { Prettify } from "$lib/utils/types";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { slideFade } from "$lib/utils/transition";

	const form = createForm(() => ({
		defaultValues: {
			name: "",
			purchase_price: 0,
			target_sale_price: 0,
			purchase_date: new Date(),
			labels: [] as string[],
			storage_location: null as string | null,
			list_on_submit: false,
			associated_bundle_item: null as string | null,
		},
		onSubmit: async ({ value }) => {
			const tx = createTransaction({
				autoCommit: false,
				mutationFn: async ({ transaction }) => {
					await ApplyTsDbMutation(transaction);
				},
			});

			const item: Item = {
				id: GenerateQuickId(),
				status: "unlisted",
				status_int: 0,
				name: value.name,
				storage_location: value.storage_location,
				purchase_price: value.purchase_price,
				target_sale_price: value.target_sale_price,
				added_at: new Date(),
				purchased_at: value.purchase_date,
				refund_type: null,
				refund_reason: null,
				workspace_id: session_state.workspace_id,
				refunded_at: null,
			};

			tx.mutate(() => {
				ItemsCollection.insert(item);

				for (const label_id of value.labels) {
					LabelJoinsCollection.insert({
						id: GenerateQuickId(),
						type: "item-label",
						label_id: label_id,
						subject_id: item.id,
						workspace_id: session_state.workspace_id,
					});
				}

				if (value.associated_bundle_item != null) {
					ItemAssociationsCollection.insert({
						id: GenerateQuickId(),
						type: "bundle-item",
						item_id: item.id,
						subject_id: value.associated_bundle_item!,
						workspace_id: session_state.workspace_id,
					});
				}
			});

			try {
				await tx.commit();

				form.reset();

				item_dialog_state.new_item_dialog_open = false;

				if (value.list_on_submit) {
					OpenItemDialog(item, "list");
				}
			} catch (e) {
				console.error(e);

				tx.rollback();

				toast.error("Error while registering item. Creation reverted...");
			}
		},
	}));

	const item_label_ids = useStore(form.store, (state) => state.values.labels);
	const target_sale_price = useStore(form.store, (state) => state.values.target_sale_price);

	const fee_groups_query = useLiveQuery(
		(q) =>
			q
				.from({ label_join: LabelJoinsCollection })
				.where(({ label_join }) =>
					and(
						eq(label_join.type, "fee-association"),
						inArray(label_join.label_id, item_label_ids.current),
					),
				)
				.innerJoin({ fee_group: FeeGroupsCollection }, ({ fee_group, label_join }) =>
					eq(fee_group.id, label_join.subject_id),
				)
				.select(({ fee_group }) => fee_group),
		[() => item_label_ids],
	);

	const estimated_fees = $derived.by(() => {
		if (fee_groups_query.data.length == 0) return null;

		let highest_percentage = 0;

		for (const fee_group of fee_groups_query.data) {
			if (fee_group.fee_value_perc > highest_percentage) {
				highest_percentage = fee_group.fee_value_perc;
			}
		}

		const fee_value = (target_sale_price.current / 100) * highest_percentage;

		return fee_value;
	});

	function HandleOpenChangeComplete(open: boolean) {
		if (open == false) {
			form.reset();
		}
	}

	createHotkey("C", () => {
		item_dialog_state.new_item_dialog_open = !item_dialog_state.new_item_dialog_open;
	});
</script>

<Dialog
	bind:open={item_dialog_state.new_item_dialog_open}
	onOpenChangeComplete={HandleOpenChangeComplete}
>
	<DialogContent class="p-0 sm:max-w-2xl" showCloseButton={false}>
		<StructuredDialogLayout>
			<StructuredDialogHeader>
				<StructuredDialogTitle>Register New Item</StructuredDialogTitle>
				<StructuredDialogDescription>
					Start tracking a newly purchased item
				</StructuredDialogDescription>
			</StructuredDialogHeader>

			<StructuredDialogSection class="grid grid-cols-1 gap-6 md:grid-cols-2">
				<form.Field name="name">
					{#snippet children(field)}
						<Field class="md:col-span-2">
							<FieldLabel>Item Name</FieldLabel>

							<Input
								onblur={() => field.handleBlur()}
								onchange={(ev) => field.handleChange(ev.currentTarget.value)}
								placeholder="Item Name"
								value={field.state.value}
							/>
						</Field>
					{/snippet}
				</form.Field>

				<form.Field name="purchase_price">
					{#snippet children(field)}
						<Field>
							<FieldLabel>Purchase Price</FieldLabel>

							<CurrencyInput
								onValueChange={(val) => field.handleChange(val)}
								value={field.state.value}
							/>
						</Field>
					{/snippet}
				</form.Field>

				<form.Field name="target_sale_price">
					{#snippet children(field)}
						<Field>
							<FieldLabel>Target Sale Price</FieldLabel>

							<CurrencyInput
								onValueChange={(val) => field.handleChange(val)}
								value={field.state.value}
							/>

							{#if estimated_fees != null}
								<p class="text-xs text-muted-foreground" transition:slideFade={{ axis: "y" }}>
									Estimated Final Fees: {FormatCurrency(estimated_fees)}
								</p>
							{/if}
						</Field>
					{/snippet}
				</form.Field>

				<div class="flex flex-row flex-wrap gap-2 md:col-span-2">
					<form.Field name="purchase_date">
						{#snippet children(field)}
							<PurchaseDatePopover date={field.state.value} onDateChange={field.handleChange} />
						{/snippet}
					</form.Field>

					<form.Field name="labels">
						{#snippet children(field)}
							<LabelsPopover
								label_ids={field.state.value}
								onLabelIdsChange={field.handleChange}
							/>
						{/snippet}
					</form.Field>

					<form.Field name="storage_location">
						{#snippet children(field)}
							<LocationPopover
								location_id={field.state.value}
								onLocationIdChange={field.handleChange}
							/>
						{/snippet}
					</form.Field>

					<form.Field name="associated_bundle_item">
						{#snippet children(field)}
							<NewItemBundleSelector
								bundle_item_id={field.state.value}
								onSelectedBundleChange={field.handleChange}
							/>
						{/snippet}
					</form.Field>
				</div>
			</StructuredDialogSection>

			<StructuredDialogSection class="flex flex-row items-center justify-end gap-6">
				<form.Field name="list_on_submit">
					{#snippet children(field)}
						<div class="flex flex-row items-center gap-2">
							<Switch
								size="sm"
								checked={field.state.value}
								onCheckedChange={(val) => field.handleChange(val)}
							/>
							<p class="text-xs text-muted-foreground">Immediately List</p>
						</div>
					{/snippet}
				</form.Field>

				<Button onclick={() => form.handleSubmit()}><LucidePlus /> Register Item</Button>
			</StructuredDialogSection>
		</StructuredDialogLayout>
	</DialogContent>
</Dialog>
