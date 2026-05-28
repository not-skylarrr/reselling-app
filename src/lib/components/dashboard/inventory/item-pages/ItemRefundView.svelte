<script lang="ts">
	import { ItemFeesCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import UpdateItemPriceInput from "$lib/components/items/item-page/UpdateItemPriceInput.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Separator } from "$lib/components/ui/separator";
	import { GetRefundTypeFriendlyName } from "$lib/items/utils";
	import type { FullItem } from "$lib/server/db/schema";
	import { LucideEye } from "@lucide/svelte";
	import RefundTypePopover from "./components/RefundTypePopover.svelte";
	import UpdateStringPopover from "./components/UpdateStringPopover.svelte";
	import UpdateDatePopover from "./components/UpdateDatePopover.svelte";

	type Props = {
		item: FullItem;
	};

	let { item }: Props = $props();

	const refund_fee = $derived(item.fees.find((fee) => fee.type == "refunded_amount"));
</script>

{#if refund_fee}
	<div class="flex justify-center">
		<div class="flex w-full max-w-3xl flex-col gap-4 px-3 py-6">
			<p class="px-4 text-lg font-medium">Refund Details</p>

			<div class="flex flex-col gap-1 px-4">
				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Amount Refunded</p>

					<UpdateItemPriceInput
						label="Update Refund Amount"
						price={refund_fee.amount}
						onPriceChange={(val) => {
							if (!refund_fee) return;

							ItemFeesCollection.update(refund_fee.id, (draft) => {
								draft.amount = val;
							});
						}}
					/>
				</div>

				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Refund Type</p>

					<RefundTypePopover
						align="end"
						type={item.refund_type}
						onTypeChange={(type) => {
							ItemsCollection.update(item.id, (draft) => {
								draft.refund_type = type;
							});
						}}
					/>
				</div>

				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Refund Date</p>

					<UpdateDatePopover
						align="end"
						value={item.refunded_at}
						onValueChange={(val) => {
							if (!val) return;

							ItemsCollection.update(item.id, (draft) => {
								draft.refunded_at = val;
							});
						}}
					/>
				</div>

				<div class="flex flex-row items-start justify-between">
					<p class="pt-1.5 text-sm text-muted-foreground">Refund Reason</p>

					<UpdateStringPopover
						class="max-h-64 max-w-84 items-start justify-end truncate overflow-hidden"
						label="Refund Reason"
						onValueChange={(val) => {
							ItemsCollection.update(item.id, (draft) => {
								draft.refund_reason = val;
							});
						}}
						type="dialog"
						value={item.refund_reason ?? ""}
						variant="textarea"
					>
						{#snippet trigger({ props })}
							<Button
								{...props}
								class="text-sm font-normal [&_svg]:stroke-muted-foreground"
								size="xs"
								variant="ghost"><LucideEye /> View Refund Reason</Button
							>
						{/snippet}
					</UpdateStringPopover>
				</div>
			</div>
		</div>
	</div>
{/if}
