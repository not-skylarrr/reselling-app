<script lang="ts">
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import {
		createTransaction,
		eq,
		isUndefined,
		not,
		queryOnce,
		toArray,
		useLiveQuery,
	} from "@tanstack/svelte-db";
	import { error } from "@sveltejs/kit";
	import { ItemsWithAllMetaCollection } from "$lib/collections/lib/items";
	import {
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
		ListingsCollection,
		ItemFeesCollection,
	} from "$lib/collections/def.svelte";
	import type { WorkspaceLabel } from "$lib/server/db/schema";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import { LucideImage, LucideLoaderCircle } from "@lucide/svelte";
	import {
		GetRefundTypeFriendlyName,
		GetStatusFriendlyName,
		RefundTypeFriendlyNames,
	} from "$lib/items/utils.js";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { createForm } from "@tanstack/svelte-form";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldLabel,
	} from "$lib/components/ui/field/index.js";
	import { SettingsLayout } from "$lib/components/settings/layout";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import { Textarea } from "$lib/components/ui/textarea";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import { Separator } from "$lib/components/ui/separator";
	import { Checkbox } from "$lib/components/ui/checkbox";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { Button } from "$lib/components/ui/button";
	import { ApplyTsDbMutation } from "$lib/utils/ts-db/trpc-map.js";
	import { toast } from "svelte-sonner";
	import { GenerateQuickId } from "$lib/utils/web-crypto.js";
	import { session_state } from "$lib/utils/session.svelte.js";
	import { goto } from "$app/navigation";

	let { data } = $props();

	const item_query = useLiveQuery(
		(q) =>
			q
				.from({ item: ItemsCollection })
				.orderBy(({ item }) => item.status_int, "desc")
				.orderBy(({ item }) => item.added_at, "desc")
				.select(({ item }) => ({
					...item,
					labels: toArray(
						q
							.from({ label_join: LabelJoinsCollection })
							.where(({ label_join }) => eq(label_join.item_id, item.id))
							.leftJoin({ label: LabelsCollection }, ({ label_join, label }) =>
								eq(label.id, label_join.label_id),
							)
							.where(({ label }) => not(isUndefined(label)))
							.fn.select(({ label }): WorkspaceLabel => {
								return label as WorkspaceLabel;
							}),
					),
					listings: toArray(
						q
							.from({ listing: ListingsCollection })
							.where(({ listing }) => eq(item.id, listing.item_id)),
					),
					fees: toArray(
						q.from({ fee: ItemFeesCollection }).where(({ fee }) => eq(item.id, fee.item_id)),
					),
				}))
				.where(({ item }) => eq(item.id, data.item.id))
				.findOne(),
		[() => data.item],
	);

	let item = $derived(item_query.data ?? data.item);

	const sold_listing = $derived(item.listings.find((l) => l.status == "sold"));

	const form = createForm(() => ({
		defaultValues: {
			refund_type: "ITEM_DAMAGED",
			refund_reason: "",
			amount_refunded: sold_listing?.price ?? 0,
			waived_fee_ids: [] as string[],
		},
		onSubmit: async ({ value }) => {
			if (!sold_listing) return toast.error("Sold listing cannot be found");

			const tx = createTransaction({
				autoCommit: false,
				mutationFn: async ({ transaction }) => {
					await ApplyTsDbMutation(transaction);
				},
			});

			tx.mutate(() => {
				if (!sold_listing) return toast.error("Sold listing cannot be found");

				ItemsCollection.update(item.id, (new_item) => {
					new_item.status = "refunded";
					new_item.status_int = 3;
					new_item.refund_type = value.refund_type;
					new_item.refund_reason = value.refund_reason;
				});

				ItemFeesCollection.insert(
					{
						id: GenerateQuickId(),
						type: "refunded_amount",
						item_id: item.id,
						listing_id: sold_listing.id,
						workspace_id: session_state.workspace_id,
						reference_name: "Refunded Amount",
						reference_details: "Automatically Generated",
						amount: value.amount_refunded,
						buyer_paid: false,
						marketplace_id: sold_listing.marketplace_id,
						created_at: new Date(),
						removed: false,
						removal_reason: null,
					},
					{ optimistic: false },
				);
			});

			if (value.waived_fee_ids.length > 0) {
				tx.mutate(() => {
					for (const fee_id of value.waived_fee_ids) {
						ItemFeesCollection.update(fee_id, (fee) => {
							fee.removed = true;
							fee.removal_reason = "Waived by item refund";
						});
					}
				});
			}

			try {
				await tx.commit();

				goto(`/dashboard/inventory/items/${item.id}`);

				toast.success("Item marked as refunded");
			} catch (e) {
				console.error(e);
				toast.error("Failed to mark as refunded");
			}
		},
	}));
</script>

<SettingsLayout class="px-3 py-6! pt-12!">
	<FormCard>
		<FormCardSection>
			<FieldGroup>
				<form.Field name="amount_refunded">
					{#snippet children(field)}
						<Field orientation="responsive">
							<FieldContent>
								<FieldLabel>Amount Refunded</FieldLabel>
								<FieldDescription
									>The amount of the sale price returned to the buyer</FieldDescription
								>
							</FieldContent>

							<FieldControl>
								<CurrencyInput onValueChange={field.handleChange} value={field.state.value} />
							</FieldControl>
						</Field>
					{/snippet}
				</form.Field>
			</FieldGroup>
		</FormCardSection>
	</FormCard>

	<FormCard>
		<FormCardSection>
			<FieldGroup>
				<form.Field name="refund_type">
					{#snippet children(field)}
						<Field orientation="responsive">
							<FieldContent>
								<FieldLabel>Refund Type</FieldLabel>
								<FieldDescription>The classification of the refund reason</FieldDescription>
							</FieldContent>

							<FieldControl>
								<Select
									type="single"
									onValueChange={field.handleChange}
									value={field.state.value}
								>
									<SelectTrigger class="w-full">
										{GetRefundTypeFriendlyName(field.state.value)}
									</SelectTrigger>
									<SelectContent>
										{#each Object.entries(RefundTypeFriendlyNames) as [value, label] (value)}
											<SelectItem {value}>{label}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							</FieldControl>
						</Field>
					{/snippet}
				</form.Field>
			</FieldGroup>
		</FormCardSection>
		<FormCardSection>
			<FieldGroup>
				<form.Field name="refund_reason">
					{#snippet children(field)}
						<Field class="gap-3">
							<FieldContent>
								<FieldLabel>Refund Reason</FieldLabel>
								<FieldDescription
									>A more detailed description of the reason for the refund</FieldDescription
								>
							</FieldContent>

							<Textarea
								onchange={(ev) => field.handleChange(ev.currentTarget.value)}
								placeholder="eg. Order arrived damaged from courier"
								value={field.state.value}
							/>
						</Field>
					{/snippet}
				</form.Field>
			</FieldGroup>
		</FormCardSection>
	</FormCard>

	<FormCard>
		<FormCardSection>
			<Field class="gap-3">
				<FieldContent>
					<FieldLabel>Waived Fees</FieldLabel>
					<FieldDescription
						>Select any fees that have been waived by the marketplace</FieldDescription
					>
				</FieldContent>
			</Field>
		</FormCardSection>
		<FormCardSection>
			<form.Field name="waived_fee_ids" mode="array">
				{#snippet children(field)}
					<div class="flex flex-col gap-4">
						{#each item.fees as fee (fee.id)}
							{#if fee.buyer_paid == false}
								<div class="flex flex-row items-center gap-4">
									<div class="grid flex-1">
										<p class="text-sm font-medium">{fee.reference_name}</p>
										<p class="text-xs text-muted-foreground">
											{FormatCurrency(fee.amount)}
										</p>
									</div>

									<Checkbox
										checked={field.state.value.includes(fee.id)}
										onCheckedChange={() => {
											const index = field.state.value.indexOf(fee.id);
											if (index == -1) {
												field.pushValue(fee.id);
											} else {
												field.removeValue(index);
											}
										}}
									/>
								</div>
							{/if}
						{/each}
					</div>
				{/snippet}
			</form.Field>
		</FormCardSection>
	</FormCard>

	<div class="flex flex-row items-center justify-end">
		<form.Subscribe selector={(state) => state.isSubmitting}>
			{#snippet children(is_submitting)}
				<Button disabled={is_submitting} onclick={() => form.handleSubmit()}>
					{#if is_submitting}
						<LucideLoaderCircle class="animate-spin" />
					{/if}
					Mark as Refunded
				</Button>
			{/snippet}
		</form.Subscribe>
	</div>
</SettingsLayout>
