<script lang="ts">
	import { ItemFeesCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import UpdateItemPriceInput from "$lib/components/items/item-page/UpdateItemPriceInput.svelte";
	import { Separator } from "$lib/components/ui/separator";
	import { GetRefundTypeFriendlyName } from "$lib/items/utils";
	import type { FullItem } from "$lib/server/db/schema";
	import RefundTypePopover from "./components/RefundTypePopover.svelte";
	import UpdateStringPopover from "./components/UpdateStringPopover.svelte";

	type Props = {
		item: FullItem;
	};

	let { item }: Props = $props();

	const refund_fee = $derived(item.fees.find((fee) => fee.type == "refunded_amount"));
</script>

{#if refund_fee}
	<div class="flex h-80 flex-col gap-4 border-b p-6 px-3.5">
		<div class="flex h-7 flex-row items-center justify-between px-2.5">
			<p class="text-lg font-medium">Refund Details</p>
		</div>

		<div class="flex flex-1 flex-col gap-2">
			<div class="flex flex-row items-center justify-between px-2.5">
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

			<Separator class="my-2" />

			<div class="flex flex-col gap-2">
				<div class="flex flex-col justify-between">
					<p class="h-7 px-2.5 text-sm text-muted-foreground">Refund Type</p>

					<RefundTypePopover
						align="start"
						class="self-start"
						type={item.refund_type}
						onTypeChange={(type) => {
							ItemsCollection.update(item.id, (draft) => {
								draft.refund_type = type;
							});
						}}
					/>
				</div>

				<div class="flex flex-col">
					<div class="flex h-7 flex-row items-center px-2.5">
						<p class="text-sm text-muted-foreground">Refund Reason</p>
					</div>

					<UpdateStringPopover
						label="Update Refund Reason"
						onValueChange={(val) => {
							ItemsCollection.update(item.id, (draft) => {
								draft.refund_reason = val;
							});
						}}
						value={item.refund_reason ?? ""}
						variant="textarea"
					/>
				</div>
			</div>
		</div>
	</div>
{/if}
