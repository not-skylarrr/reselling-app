<script lang="ts">
	import { ItemFeesCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ChartContainer, Tooltip, type ChartConfig } from "$lib/components/ui/chart";
	import { GetRefundTypeFriendlyName, type RefundType } from "$lib/items/utils";
	import { LucideCheck, LucideChevronRight, LucideDollarSign } from "@lucide/svelte";
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

	const chart_config = {
		total: { label: "Total", color: "var(--chart-4)" },
	} satisfies ChartConfig;
</script>

<FormCard class={cn("max-h-96", class_name)}>
	<FormCardSection class="flex flex-row items-center justify-between p-2 pl-6">
		<div class="flex flex-row items-center gap-2">
			<LucideDollarSign class="size-4 stroke-foreground/70" />
			<p class="text-sm">Fees By Type</p>
		</div>

		<Button href="/dashboard/analytics/fees" size="sm"
			>View Details <LucideChevronRight /></Button
		>
	</FormCardSection>
	<FormCardSection class="overflow-hidden p-2">
		<ChartContainer
			class="aspect-auto min-h-0 overflow-hidden"
			style="height: {fees_by_type.length * 48}px;"
			config={chart_config}
		>
			<BarChart
				axis="x"
				class="max-h-full"
				data={fees_by_type}
				orientation="horizontal"
				yScale={scaleBand().padding(0.25)}
				y="type"
				rule={false}
				series={[{ key: "total", label: "Total", color: chart_config.total.color }]}
				padding={{ right: 8, left: 8 }}
				props={{
					bars: {
						stroke: "none",
						radius: 10,
						rounded: "all",
						motion: { type: "tween", duration: 500, easing: cubicInOut },
					},
					highlight: { area: { fill: "none" } },
					yAxis: {
						tickLabelProps: {
							textAnchor: "start",
							dx: 8,
							class: "stroke-none font-medium! fill-foreground!",
						},
						tickLength: 0,
					},
					xAxis: {
						tickLabelProps: { display: "none" },
					},
					grid: {
						class: "hidden",
					},
				}}
			>
				{#snippet labels({ context })}
					<Labels>
						{#snippet children({ textProps, data })}
							<Text
								{...textProps}
								x={context.width - 8}
								textAnchor="end"
								value={FormatCurrency(data.xValue)}
							/>
						{/snippet}
					</Labels>
				{/snippet}

				{#snippet aboveContext({ context })}
					<Html zIndex={50} pointerEvents={false}>
						{#each context.data as row}
							<div
								class="absolute flex items-center gap-2 text-xs [&_svg]:size-4"
								style={`left: 8px; top: ${context.yScale(row.type)}px; height: ${context.yScale.bandwidth?.()}px;`}
							>
								<LucideCheck />
								<span>{row.type}</span>
							</div>
						{/each}
					</Html>
				{/snippet}

				{#snippet tooltip()}
					<Tooltip hideLabel>
						{#snippet formatter({ value })}
							<div
								class="flex items-center justify-between gap-4 rounded-xl p-1 text-xs text-muted-foreground"
							>
								<p>Total Paid</p>

								<p class="text-foreground">{FormatCurrency(value as number)}</p>
							</div>
						{/snippet}
					</Tooltip>
				{/snippet}
			</BarChart>
		</ChartContainer>
	</FormCardSection>
</FormCard>
