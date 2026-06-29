<script lang="ts">
	import LabelMarkers from "$lib/components/labels/LabelMarkers.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { useItemTypeAnalytics } from "$lib/hooks/analytics/inventory.svelte";
	import {
		LucideCircle,
		LucideListSortDescending,
		LucideListSortAscending,
	} from "@lucide/svelte";
	import InventoryTypeChart from "../charts/InventoryTypeChart.svelte";
	import InventoryAnalyticsCard from "../cards/InventoryAnalyticsCard.svelte";
	import ItemTypeAnalyticsCard from "../cards/ItemTypeAnalyticsCard.svelte";
	import TotalRevenueAnalyticsCard from "../cards/TotalRevenueAnalyticsCard.svelte";
	import PotentialRevenueAnalyticsCard from "../cards/PotentialRevenueAnalyticsCard.svelte";
	import {
		AnalyticsCardSection,
		AnalyticsContent,
		AnalyticsHeader,
		AnalyticsLinkAction,
		AnalyticsSection,
		AnalyticsTitle,
	} from "../layout";
	import { Button } from "$lib/components/ui/button";

	const analytics = useItemTypeAnalytics();

	let reverse_breakdown = $state(false);

	const item_type_data = $derived(
		reverse_breakdown ? [...analytics.item_type_data].reverse() : analytics.item_type_data,
	);
</script>

<AnalyticsSection>
	<AnalyticsHeader>
		<AnalyticsTitle>Inventory by Type</AnalyticsTitle>
		<AnalyticsLinkAction href="/dashboard/analytics/inventory" />
	</AnalyticsHeader>

	<AnalyticsContent
		class="flex max-h-240 min-h-128 flex-col overflow-hidden lg:h-128 lg:max-h-128"
	>
		<AnalyticsCardSection>
			<InventoryAnalyticsCard />
			<ItemTypeAnalyticsCard />
			<TotalRevenueAnalyticsCard />
			<PotentialRevenueAnalyticsCard />
		</AnalyticsCardSection>

		<div
			class="flex max-h-128 min-h-0 flex-col-reverse overflow-hidden lg:flex-1 lg:flex-row lg:px-6"
		>
			<div
				class="flex min-h-0 w-full flex-col gap-3 border-t pt-3 pb-3 lg:w-96 lg:flex-none lg:border-t-0 lg:border-r"
			>
				<div class="flex flex-row items-center justify-between pr-2">
					<p class="font-medium">Label Breakdown</p>

					<Button
						onclick={() => (reverse_breakdown = !reverse_breakdown)}
						size="icon-sm"
						variant="ghost"
					>
						{#if reverse_breakdown}
							<LucideListSortAscending />
						{:else}
							<LucideListSortDescending />
						{/if}
					</Button>
				</div>
				<ScrollArea class="h-full min-h-0 flex-1" type="always">
					<div class="flex flex-col gap-2 px-6 pb-3 lg:pr-4 lg:pl-0">
						{#each item_type_data as entry}
							{#if entry.type == "label-item"}
								<div class="flex min-w-0 items-center justify-between gap-4">
									<div class="flex min-w-0 items-center gap-2">
										<LabelMarkers labels={[entry.label]} />

										<p class="truncate text-base">
											{entry.label.content}
										</p>
									</div>

									<p class="inline-flex items-center gap-3">
										<span class="text-sm text-muted-foreground">
											({((entry.total / analytics.total_items) * 100).toFixed(1)}%)
										</span>

										{entry.total}
									</p>
								</div>
							{/if}

							{#if entry.type == "unassigned"}
								<div class="flex min-w-0 items-center justify-between gap-4">
									<div class="flex min-w-0 items-center gap-2">
										<LucideCircle
											class="size-3.5 fill-muted-foreground stroke-2"
											style="stroke: var(--background)"
										/>
										<p class="truncate text-base">Unknown</p>
									</div>

									<p class="inline-flex items-center gap-3">
										<span class="text-sm text-muted-foreground">
											({((entry.total / analytics.total_items) * 100).toFixed(1)}%)
										</span>

										{entry.total}
									</p>
								</div>
							{/if}
						{/each}
					</div>
				</ScrollArea>
			</div>

			<div class="flex min-w-0 flex-1 items-center justify-center py-3">
				<InventoryTypeChart class="max-h-48 lg:max-h-64" />
			</div>
		</div>
	</AnalyticsContent>
</AnalyticsSection>
