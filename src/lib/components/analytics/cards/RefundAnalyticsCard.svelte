<script lang="ts">
	import { ItemsCollection } from "$lib/collections/def.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ChartContainer, Tooltip, type ChartConfig } from "$lib/components/ui/chart";
	import {
		GetRefundTypeFriendlyName,
		RefundTypeIcons,
		type RefundType,
	} from "$lib/items/utils";
	import {
		LucideCheck,
		LucideChevronRight,
		LucideDollarSign,
		LucideFileChartColumn,
	} from "@lucide/svelte";
	import { useLiveQuery, eq } from "@tanstack/svelte-db";
	import { BarChart, Html, Labels, Text } from "layerchart";
	import { scaleBand } from "d3-scale";
	import { cubicInOut } from "svelte/easing";

	const refunded_items_query = useLiveQuery((q) =>
		q.from({ item: ItemsCollection }).where(({ item }) => eq(item.status, "refunded")),
	);

	const refund_count_by_type = $derived.by(() => {
		const refund_count: Record<string, number> = {
			TOTAL: 0,
			ITEM_DAMAGED: 0,
			NOT_AS_DESCRIBED: 0,
			ORDER_CANCELLED: 0,
			CUSTOM: 0,
		};

		for (const item of refunded_items_query.data) {
			if (!item.refund_type) continue;

			refund_count.TOTAL += 1;

			if (item.refund_type in refund_count) {
				refund_count[item.refund_type as RefundType] += 1;
			}
		}

		return Object.entries(refund_count)
			.map(([type, count]) => ({
				raw_type: type,
				type: GetRefundTypeFriendlyName(type, "Total Refunds"),
				count,
			}))
			.sort((a, b) => b.count - a.count);
	});

	const chart_config = {
		count: { label: "Count", color: "var(--chart-4)" },
	} satisfies ChartConfig;
</script>

<FormCard>
	<FormCardSection class="flex flex-row items-center justify-between p-2 pl-4">
		<p class="text-sm text-muted-foreground">Refunds & Returns</p>

		<Button href="/dashboard/analytics/refunds" size="sm"
			>View Details <LucideChevronRight /></Button
		>
	</FormCardSection>
	<FormCardSection class="overflow-hidden p-2">
		<ChartContainer class="aspect-auto h-60 min-h-0 overflow-hidden" config={chart_config}>
			<BarChart
				axis="x"
				class="max-h-full"
				data={refund_count_by_type}
				orientation="horizontal"
				yScale={scaleBand().padding(0.25)}
				y="type"
				rule={false}
				series={[{ key: "count", label: "Count", color: chart_config.count.color }]}
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
								value={`${data.xValue}`}
							/>
						{/snippet}
					</Labels>
				{/snippet}

				{#snippet aboveContext({ context })}
					<Html zIndex={50} pointerEvents={false}>
						{#each context.data as row}
							{@const Icon =
								RefundTypeIcons[row.raw_type as RefundType] ?? LucideFileChartColumn}

							<div
								class="absolute flex items-center gap-2 text-xs [&_svg]:size-4 [&_svg]:stroke-foreground/70"
								style={`left: 8px; top: ${context.yScale(row.type)}px; height: ${context.yScale.bandwidth?.()}px;`}
							>
								<Icon />
								<span>{row.type}</span>
							</div>
						{/each}
					</Html>
				{/snippet}

				{#snippet tooltip()}
					<Tooltip hideLabel>
						{#snippet formatter({ item, value })}
							<div
								class="flex items-center justify-between gap-4 rounded-xl p-1 text-xs text-muted-foreground"
							>
								<p>Total Refunds</p>

								<p class="text-foreground">{value}</p>
							</div>
						{/snippet}
					</Tooltip>
				{/snippet}
			</BarChart>
		</ChartContainer>
	</FormCardSection>
</FormCard>
