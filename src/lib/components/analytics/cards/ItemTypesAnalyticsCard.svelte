<script lang="ts">
	import {
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
	} from "$lib/collections/def.svelte";
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
		LucideCircle,
		LucideDollarSign,
		LucideFileChartColumn,
	} from "@lucide/svelte";
	import { useLiveQuery, eq, and, count, toArray } from "@tanstack/svelte-db";
	import { BarChart, Html, Labels, Text } from "layerchart";
	import { scaleBand } from "d3-scale";
	import { cubicInOut } from "svelte/easing";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { GetAwareColour } from "$lib/components/ui/colour-picker/lib/utils";
	import { mode } from "mode-watcher";

	const item_count_query = useLiveQuery((q) =>
		q.from({ item: ItemsCollection }).select(({ item }) => ({
			count: count(item.id),
		})),
	);

	const labels_query = useLiveQuery((q) =>
		q.from({ label: LabelsCollection }).select(({ label }) => ({
			label: label,
			label_joins: toArray(
				q
					.from({ label_join: LabelJoinsCollection })
					.where(({ label_join }) =>
						and(eq(label_join.label_id, label.id), eq(label_join.type, "item-label")),
					),
			),
		})),
	);

	const label_item_counts = $derived.by(() => {
		const item_count = item_count_query.data[0]?.count ?? 0;

		const label_type_count: Record<string, { name: string; colour: string; count: number }> =
			{};

		const items_with_label = new Set<string>();

		for (const label_data of labels_query.data) {
			label_type_count[label_data.label.id] = {
				name: label_data.label.content,
				colour: GetAwareColour(label_data.label.colour, mode.current),
				count: label_data.label_joins.length,
			};

			for (const join of label_data.label_joins) {
				items_with_label.add(join.subject_id);
			}
		}

		label_type_count["no-label"] = {
			name: "Unlabelled",
			colour: "var(--muted-foreground)",
			count: item_count - items_with_label.size,
		};

		return Object.entries(label_type_count)
			.map(([id, { name, colour, count }]) => ({ name, colour, count }))
			.filter(({ count }) => count > 0)
			.sort((a, b) => b.count - a.count);
	});

	const chart_config = {
		count: { label: "Count", color: "var(--chart-4)" },
	} satisfies ChartConfig;
</script>

<FormCard class="h-96">
	<FormCardSection class="flex flex-row items-center justify-between p-2 pl-6">
		<p class="text-sm font-medium">Inventory Overview</p>

		<Button href="/dashboard/analytics/inventory" size="sm"
			>View Details <LucideChevronRight /></Button
		>
	</FormCardSection>
	<FormCardSection class="overflow-hidden p-2">
		<ScrollArea class="flex-1 overflow-hidden">
			<div class="relative">
				<ChartContainer
					class="aspect-auto min-h-0 overflow-hidden"
					style="height: {label_item_counts.length * 48}px;"
					config={chart_config}
				>
					<BarChart
						axis="x"
						class="max-h-full"
						data={label_item_counts}
						orientation="horizontal"
						yScale={scaleBand().padding(0.25)}
						y="name"
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
									<div
										class="absolute flex items-center gap-2 text-xs [&_svg]:size-4"
										style={`left: 8px; top: ${context.yScale(row.name)}px; height: ${context.yScale.bandwidth?.()}px;`}
									>
										<LucideCircle style="color: {row.colour};" />
										<span>{row.name}</span>
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
										<p>Total Items</p>

										<p class="text-foreground">{value}</p>
									</div>
								{/snippet}
							</Tooltip>
						{/snippet}
					</BarChart>
				</ChartContainer>
			</div>
		</ScrollArea>
	</FormCardSection>
</FormCard>
