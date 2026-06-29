<script lang="ts">
	import {
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
	} from "$lib/collections/def.svelte";
	import { ChartContainer, type ChartConfig } from "$lib/components/ui/chart";
	import { GetAwareColour } from "$lib/components/ui/colour-picker/lib/utils";
	import { cn } from "$lib/utils";
	import { and, count, eq, inArray, sum, useLiveQuery } from "@tanstack/svelte-db";
	import { PieChart } from "layerchart";
	import { mode } from "mode-watcher";

	type Props = {
		class?: string;
	};

	let { class: class_name }: Props = $props();

	let container_ref = $state<HTMLDivElement | null>(null);
	let container_min_size = $state(0);

	const item_count_query = useLiveQuery((q) =>
		q
			.from({ items: ItemsCollection })
			.where(({ items }) => inArray(items.status, ["unlisted", "listed"]))
			.select(({ items }) => ({
				total: count(items.id),
			})),
	);

	const total_items = $derived(
		item_count_query.data.length > 0 ? item_count_query.data[0].total : 0,
	);

	const label_counts_query = useLiveQuery((q) =>
		q
			.from({ label_join: LabelJoinsCollection })
			.groupBy(({ label_join }) => label_join.label_id)
			.innerJoin({ item: ItemsCollection }, ({ item, label_join }) =>
				eq(item.id, label_join.subject_id),
			)
			.where(({ item }) => inArray(item.status, ["unlisted", "listed"]))
			.select(({ label_join }) => ({
				label_id: label_join.label_id,
				total: count(label_join.label_id),
			}))
			.orderBy(({ $selected }) => $selected.total, "asc"),
	);

	const labels_query = useLiveQuery((q) => q.from({ labels: LabelsCollection }));

	const chart_data = $derived.by(() => {
		if (labels_query.data.length == 0 || label_counts_query.data.length == 0) return [];

		let accounted_for_total = 0;

		const label_data = label_counts_query.data
			.map(({ label_id, total }) => {
				accounted_for_total += total;

				const label = labels_query.data.find((l) => l.id == label_id);
				if (!label) return null;

				return {
					label_id: label_id,
					label_name: label.content,
					count: total,
					colour: GetAwareColour(label.colour, mode.current),
				};
			})
			.filter((val) => val != null);

		if (total_items - accounted_for_total > 0) {
			label_data.push({
				label_id: "unaccounted",
				label_name: "Unknown",
				count: total_items - accounted_for_total,
				colour: "var(--chart-1)",
			});
		}

		return label_data;
	});

	const chart_config = $derived.by(() => {
		const config_object: Record<string, { label: string; colour: string }> = {};

		for (const obj of chart_data) {
			config_object[obj.label_id] = { label: obj.label_name, colour: obj.colour };
		}

		return config_object satisfies ChartConfig;
	});

	const inner_radius = $derived(Math.max(container_min_size * 0.35, 40));

	$effect(() => {
		if (!container_ref) return;

		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				const is_container = entry.target.isEqualNode(container_ref);
				if (!is_container) continue;

				const min_size = Math.min(entry.contentRect.width, entry.contentRect.height);

				container_min_size = min_size;
			}
		});

		observer.observe(container_ref);

		return () => {
			observer.disconnect();
		};
	});
</script>

<div
	bind:this={container_ref}
	class={cn("relative flex h-full w-full", class_name)}
	data-chart-container
>
	<ChartContainer config={chart_config} class="aspect-square w-full">
		<PieChart
			data={chart_data}
			key="label_name"
			value="count"
			c="colour"
			innerRadius={inner_radius}
			props={{ pie: { motion: "tween" } }}
		/>
	</ChartContainer>

	<div class="absolute top-1/2 left-1/2 grid -translate-1/2">
		<p class="text-center text-2xl font-medium">{total_items}</p>
		<p class="text-center text-xs text-muted-foreground">Total Items</p>
	</div>
</div>
