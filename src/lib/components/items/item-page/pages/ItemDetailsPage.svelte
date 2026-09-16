<script lang="ts">
	import {
		ItemMetadataCollection,
		ItemMetadataDefinitionsCollection,
		ItemsCollection,
		LabelJoinsCollection,
	} from "$lib/collections/def.svelte";
	import { GetItemLabelJoinId } from "$lib/collections/lib/utils";
	import AddMetadataDropdown from "$lib/components/dashboard/inventory/item-metadata/AddMetadataDropdown.svelte";
	import UpdateCurrencyPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateCurrencyPopover.svelte";
	import UpdateDatePopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateDatePopover.svelte";
	import UpdateItemLabelsPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateItemLabelsPopover.svelte";
	import UpdateItemLocationPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateItemLocationPopover.svelte";
	import UpdateNumberPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateNumberPopover.svelte";
	import UpdateStringPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateStringPopover.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { SettingsLayout } from "$lib/components/settings/layout";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldTitle,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import {
		ParseItemMetadataField,
		SerializeItemMetadataField,
		type ItemMetadataType,
	} from "$lib/items/metadata";
	import type { ItemWithLabels } from "$lib/server/db/schema";
	import { session_state } from "$lib/utils/session.svelte";
	import { LucideCopy, LucideInbox } from "@lucide/svelte";
	import { eq, useLiveQuery } from "@tanstack/svelte-db";
	import { toast } from "svelte-sonner";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();

	const metadata_query = useLiveQuery(
		(q) =>
			q
				.from({ metadata: ItemMetadataCollection })
				.where(({ metadata }) => eq(metadata.item_id, item.id))
				.innerJoin(
					{ definition: ItemMetadataDefinitionsCollection },
					({ metadata, definition }) => eq(metadata.metadata_id, definition.id),
				)
				.select(({ definition, metadata }) => ({
					...metadata,
					definition: definition,
				})),
		[() => item],
	);

	function HandleItemIdCopy() {
		navigator.clipboard.writeText(item.id);

		toast.success("Copied Item ID");
	}

	function HandleLabelsChange(label_ids: string[]) {
		const current_label_ids = new Set(item.labels.map((label) => label.id));

		for (const label_id of label_ids) {
			if (current_label_ids.delete(label_id)) continue;

			LabelJoinsCollection.insert({
				id: GetItemLabelJoinId(item.id, label_id),
				type: "item-label",
				subject_id: item.id,
				label_id,
				workspace_id: session_state.workspace_id,
			});
		}

		for (const label_id of current_label_ids) {
			LabelJoinsCollection.delete(GetItemLabelJoinId(item.id, label_id));
		}
	}

	function HandleMetadataValueChange(metadata_id: string, type: ItemMetadataType, val: any) {
		const val_string = SerializeItemMetadataField(type, val);

		ItemMetadataCollection.update(metadata_id, (meta) => {
			meta.value_string = val_string;
		});
	}
</script>

<SettingsLayout class="px-6 py-6!" size="xl">
	<div class="grid gap-6 @3xl:grid-cols-2">
		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Item ID</FieldTitle>
							<FieldDescription>The internal ID of the item</FieldDescription>
						</FieldContent>

						<FieldControl>
							<Button
								class="text-sm font-normal text-muted-foreground"
								onclick={HandleItemIdCopy}
								size="xs"
								variant="outline"><LucideCopy /> {item.id}</Button
							>
						</FieldControl>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Item Name</FieldTitle>
							<FieldDescription>The name of the item you are tracking</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateStringPopover
								button_variant="outline"
								label="Update Item Name"
								onValueChange={(val) =>
									ItemsCollection.update(item.id, (draft) => {
										draft.name = val;
									})}
								value={item.name}
							/>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>

		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Item Labels</FieldTitle>
							<FieldDescription>The labels used to classify the item</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateItemLabelsPopover
								button_variant="outline"
								labels={item.labels}
								onLabelsChange={HandleLabelsChange}
							/>
						</FieldControl>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Storage Location</FieldTitle>
							<FieldDescription>The storage location reference for the item</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateItemLocationPopover
								button_variant="outline"
								onLocationChange={(val) => {
									ItemsCollection.update(item.id, (draft) => {
										draft.storage_location = val;
									});
								}}
								location_id={item.storage_location}
							/>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>

		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Purchase Price</FieldTitle>
							<FieldDescription>The price the item was purchased for</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateCurrencyPopover
								button_variant="outline"
								label="Update Purchase Price"
								onValueChange={(val) =>
									ItemsCollection.update(item.id, (draft) => {
										draft.purchase_price = val;
									})}
								value={item.purchase_price}
							/>
						</FieldControl>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Target Sale Price</FieldTitle>
							<FieldDescription>The expected sale price of the item</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateCurrencyPopover
								button_variant="outline"
								label="Update Purchase Price"
								onValueChange={(val) =>
									ItemsCollection.update(item.id, (draft) => {
										draft.target_sale_price = val;
									})}
								value={item.target_sale_price}
							/>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>

		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Registration Date</FieldTitle>
							<FieldDescription>The date the item was added to the application</FieldDescription
							>
						</FieldContent>

						<FieldControl>
							<UpdateDatePopover
								button_variant="outline"
								onValueChange={(val) => {
									if (!val) return;

									ItemsCollection.update(item.id, (draft) => {
										draft.added_at = val;
									});
								}}
								value={item.added_at}
							/>
						</FieldControl>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Purchase Date</FieldTitle>
							<FieldDescription>The date the item was purchased</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateDatePopover
								button_variant="outline"
								onValueChange={(val) => {
									if (!val) return;

									ItemsCollection.update(item.id, (draft) => {
										draft.purchased_at = val;
									});
								}}
								value={item.purchased_at}
							/>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>

		<FormCard class="min-h-44">
			<FormCardSection class="flex flex-row items-center justify-between">
				<p class="font-medium">Additional Metadata</p>

				<AddMetadataDropdown
					{item}
					used_meta_ids={metadata_query.data.map((meta) => meta.definition.id)}
				/>
			</FormCardSection>

			{#if metadata_query.data.length == 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-3">
					<LucideInbox class="size-6 stroke-muted-foreground stroke-1" />
					<p class="text-sm">No Additional Metadata</p>
				</div>
			{:else}
				<FormCardSection>
					<FieldGroup>
						{#each metadata_query.data as metadata (metadata.id)}
							<Field orientation="responsive-centered">
								<FieldContent>
									<FieldTitle>{metadata.definition.name}</FieldTitle>
									<FieldDescription
										>No Description Provided | {metadata.definition.required
											? "Required"
											: "Optional"}</FieldDescription
									>
								</FieldContent>

								<FieldControl>
									{#if metadata.definition.type == "string"}
										<UpdateStringPopover
											button_variant="outline"
											class="max-w-full min-w-0 shrink! text-left"
											label={`Update ${metadata.definition.name}`}
											onValueChange={(val) =>
												HandleMetadataValueChange(metadata.id, metadata.definition.type, val)}
											value={metadata.value_string}
										/>
									{/if}

									{#if metadata.definition.type == "number"}
										<UpdateNumberPopover
											button_variant="outline"
											class="w-full min-w-0 truncate"
											label={`Update ${metadata.definition.name}`}
											onValueChange={(val) =>
												HandleMetadataValueChange(metadata.id, metadata.definition.type, val)}
											value={ParseItemMetadataField(
												metadata.definition.type,
												metadata.value_string,
											)}
										/>
									{/if}

									{#if metadata.definition.type == "currency"}
										<UpdateCurrencyPopover
											button_variant="outline"
											class="w-full min-w-0 truncate"
											label={`Update ${metadata.definition.name}`}
											onValueChange={(val) =>
												HandleMetadataValueChange(metadata.id, metadata.definition.type, val)}
											value={ParseItemMetadataField(
												metadata.definition.type,
												metadata.value_string,
											)}
										/>
									{/if}
								</FieldControl>
							</Field>
						{/each}
					</FieldGroup>
				</FormCardSection>
			{/if}
		</FormCard>
	</div>
</SettingsLayout>
