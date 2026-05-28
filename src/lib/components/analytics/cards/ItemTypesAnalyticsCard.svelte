<script lang="ts">
	import {
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
	} from "$lib/collections/def.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { Button } from "$lib/components/ui/button";
	import { LucideChevronRight, LucideCircle } from "@lucide/svelte";
	import { useLiveQuery, eq, and, count, toArray } from "@tanstack/svelte-db";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { GetAwareColour } from "$lib/components/ui/colour-picker/lib/utils";
	import { mode } from "mode-watcher";
	import { cn } from "$lib/utils";
	import { Skeleton } from "$lib/components/ui/skeleton";

	type Props = {
		class?: string;
	};

	let { class: class_name }: Props = $props();

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

	const is_loading = $derived(labels_query.isLoading || item_count_query.isLoading);

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
</script>

<FormCard class={cn("h-96 divide-transparent", class_name)}>
	<FormCardSection class="flex flex-row items-center justify-between py-2 pr-1.5 pl-5">
		<div class="flex flex-row items-center gap-2">
			<p class="text-sm text-muted-foreground">Inventory By Type</p>
		</div>

		<Button href="/dashboard/analytics/fees" size="icon" variant="ghost"
			><LucideChevronRight /></Button
		>
	</FormCardSection>

	{#if is_loading}
		<FormCardSection class="flex-1 gap-2 overflow-hidden p-2 pt-0">
			<Skeleton class="h-10 rounded-xl"></Skeleton>
			<Skeleton class="h-10 rounded-xl"></Skeleton>
			<Skeleton class="h-10 rounded-xl"></Skeleton>
			<Skeleton class="h-10 rounded-xl"></Skeleton>
			<Skeleton class="h-10 rounded-xl"></Skeleton>
			<Skeleton class="h-10 rounded-xl"></Skeleton>
			<Skeleton class="h-10 rounded-xl"></Skeleton>
		</FormCardSection>
	{:else}
		<FormCardSection class="flex-1 overflow-hidden p-2 pt-0">
			<ScrollArea class="flex-1 overflow-hidden">
				<div class="flex flex-col gap-2">
					{#each label_item_counts as label}
						<div
							class="flex h-10 flex-row items-center justify-between overflow-hidden rounded-xl bg-muted px-3"
						>
							<div class="flex flex-row items-center gap-2">
								<LucideCircle class="size-4" style="color: {label.colour};" />
								<p class="text-sm">{label.name}</p>
							</div>
							<p class="text-sm font-medium">{label.count}</p>
						</div>
					{/each}
				</div>
			</ScrollArea>
		</FormCardSection>
	{/if}
</FormCard>
