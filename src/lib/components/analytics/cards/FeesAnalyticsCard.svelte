<script lang="ts">
	import { ItemFeesCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ChartContainer, Tooltip, type ChartConfig } from "$lib/components/ui/chart";
	import { GetRefundTypeFriendlyName, type RefundType } from "$lib/items/utils";
	import {
		LucideCheck,
		LucideChevronRight,
		LucideDollarSign,
		LucideReceipt,
		LucideReceiptText,
	} from "@lucide/svelte";
	import { useLiveQuery, eq } from "@tanstack/svelte-db";
	import { BarChart, Html, Labels, Text } from "layerchart";
	import { scaleBand } from "d3-scale";
	import { cubicInOut } from "svelte/easing";
	import { GetFeeTypeFriendlyName } from "$lib/fees/utils";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { cn } from "$lib/utils";

	type Props = {
		class?: string;
	};

	let { class: class_name }: Props = $props();

	const fees_query = useLiveQuery((q) => q.from({ fee: ItemFeesCollection }));

	const fees_by_type = $derived.by(() => {
		const fee_totals: Record<string, number> = {
			ALL: 0,
		};

		for (const fee of fees_query.data) {
			if (fee.removed || fee.buyer_paid) continue;

			fee_totals.ALL += fee.amount;

			if (!fee_totals[fee.type]) {
				fee_totals[fee.type] = fee.amount;
			} else {
				fee_totals[fee.type] += fee.amount;
			}
		}

		return Object.entries(fee_totals)
			.map(([type, total]) => ({
				type: GetFeeTypeFriendlyName(type, type == "ALL" ? "Total Fees" : "Other"),
				total,
			}))
			.sort((a, b) => b.total - a.total);
	});
</script>

<FormCard class={cn("max-h-96 divide-transparent", class_name)}>
	<FormCardSection class="flex flex-row items-center justify-between py-2 pr-2.5 pl-5">
		<div class="flex flex-row items-center gap-2">
			<p class="text-sm text-muted-foreground">Fee Breakdown</p>
		</div>

		<Button href="/dashboard/analytics/fees" size="icon" variant="ghost"
			><LucideChevronRight /></Button
		>
	</FormCardSection>
	<FormCardSection class="gap-2 overflow-hidden p-2 pt-0">
		{#each fees_by_type as fee}
			<div class="flex flex-row items-center justify-between rounded-xl bg-muted p-3">
				<p class="text-sm">{fee.type}</p>
				<p class="text-sm font-medium">{FormatCurrency(fee.total)}</p>
			</div>
		{/each}
	</FormCardSection>
</FormCard>
