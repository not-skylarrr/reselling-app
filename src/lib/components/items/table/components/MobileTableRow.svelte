<script lang="ts">
	import { type Row } from "@tanstack/svelte-table";
	import { cn } from "$lib/utils";
	import { onDestroy } from "svelte";
	import type { InventoryItemData } from "$lib/collections/query-collections";
	import LabelBadgeDisplay from "$lib/components/labels/LabelBadgeDisplay.svelte";
	import ItemStatusBadge from "../../reusable/ItemStatusBadge.svelte";
	import LocationBadge from "$lib/components/locations/LocationBadge.svelte";
	import { Field, FieldLabel } from "$lib/components/ui/field";
	import type { FullItem } from "$lib/server/db/schema";

	type Props = {
		focused: boolean;
		selectedRowCount: number;
		selectedRowIds: string[];
		onDouble?: () => void;
		onFocus: () => void;
		onFocusBlock: () => void;
		onFocusUnblock: () => void;
		row: Row<FullItem>;
		strictColVisibility?: boolean;
	};

	let { focused, onFocusUnblock, row }: Props = $props();

	let el = $state<HTMLElement | null>(null);

	const item = $derived(row.original);

	$effect(() => {
		if (focused && el) {
			el.focus({ preventScroll: true });
		}
	});

	onDestroy(() => {
		onFocusUnblock();
	});
</script>

<a
	class={cn("flex h-32 flex-col gap-6 p-4", "hover:bg-accent")}
	href={`/dashboard/inventory/items/${item.id}`}
>
	<div class="flex flex-row items-center justify-between gap-3">
		<p class="line-clamp-1 truncate">{item.name}</p>

		<ItemStatusBadge status={item.status} />
	</div>

	<div class="grid grid-cols-2 gap-6">
		<Field class="flex-1">
			<FieldLabel class="text-xs font-normal text-muted-foreground">Labels</FieldLabel>

			{#if item.labels.length > 0}
				<LabelBadgeDisplay labels={item.labels} />
			{:else}
				<p class="text-sm text-muted-foreground">N/A</p>
			{/if}
		</Field>

		<Field class="w-auto min-w-32">
			<FieldLabel class="text-xs font-normal text-muted-foreground">Location</FieldLabel>

			<div class="flex flex-row items-center">
				{#if item.storage_location}
					<LocationBadge location_id={item.storage_location} />
				{:else}
					<p class="text-sm text-muted-foreground">N/A</p>
				{/if}
			</div>
		</Field>
	</div>
</a>
