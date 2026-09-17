<script lang="ts">
	import { ItemFeesCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import UpdateCurrencyPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateCurrencyPopover.svelte";
	import UpdateDatePopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateDatePopover.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import {
		SettingsGroup,
		SettingsGroupHeader,
		SettingsLayout,
	} from "$lib/components/settings/layout";
	import Button from "$lib/components/ui/button/button.svelte";
	import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "$lib/components/ui/empty";
	import EmptyTitle from "$lib/components/ui/empty/empty-title.svelte";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldTitle,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import type { FullItem, ItemWithLabels } from "$lib/server/db/schema";
	import {
		LucideArchive,
		LucideCircleArrowOutDownLeft,
		LucideRotateCcw,
		LucideWrench,
	} from "@lucide/svelte";

	type Props = {
		item: FullItem;
	};

	let { item }: Props = $props();

	const refund_fee_entry = $derived(item.fees.find((f) => f.type == "refunded_amount")!);

	function HandleRefundedAmountChange(val: number) {
		ItemFeesCollection.update(refund_fee_entry.id, (draft) => {
			draft.amount = val;
		});
	}
</script>

<SettingsLayout class="p-6! pt-12!">
	<SettingsGroup>
		<SettingsGroupHeader>Refund Financials</SettingsGroupHeader>
		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Amount Refunded</FieldTitle>
							<FieldDescription>The amount refunded back to the buyer</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateCurrencyPopover
								button_variant="outline"
								label="Update Refund Amount"
								onValueChange={HandleRefundedAmountChange}
								value={refund_fee_entry.amount}
							/>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>
	</SettingsGroup>

	<SettingsGroup>
		<SettingsGroupHeader>Refund Timeline</SettingsGroupHeader>
		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Refund Date</FieldTitle>
							<FieldDescription>The date the refund was processed</FieldDescription>
						</FieldContent>

						<FieldControl>
							<UpdateDatePopover
								button_variant="outline"
								onValueChange={(val) => {
									if (!val) return;

									ItemsCollection.update(item.id, (draft) => {
										draft.refunded_at = val;
									});
								}}
								value={item.refunded_at!}
							/>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>
	</SettingsGroup>

	<SettingsGroup>
		<SettingsGroupHeader>Refund Actions</SettingsGroupHeader>
		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Archive Item</FieldTitle>
							<FieldDescription
								>Archive the item and hide it from your inventory</FieldDescription
							>
						</FieldContent>

						<FieldControl>
							<Button variant="outline"><LucideArchive /> Archive Item</Button>
						</FieldControl>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Reinventory Item</FieldTitle>
							<FieldDescription>Create a new unlisted entry for this item</FieldDescription>
						</FieldContent>

						<FieldControl>
							<Button variant="outline"><LucideRotateCcw /> Reinventory Item</Button>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>
	</SettingsGroup>
</SettingsLayout>
