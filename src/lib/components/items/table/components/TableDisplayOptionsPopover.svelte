<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { LucideSettings } from "@lucide/svelte";
	import type { Table } from "@tanstack/svelte-table";
	import type { InventoryItemData } from "$lib/collections/query-collections";
	import { cn } from "$lib/utils";
	import { GetTableContext } from "$lib/table/init.svelte";

	type Props = {
		table: Table<InventoryItemData>;
	};

	let { table }: Props = $props();

	const table_state = GetTableContext();

	let open = $state(false);

	const STATIC_COL_IDS = new Set(["name"]);

	const all_columns = $derived(
		table.getAllColumns().filter((col) => col.columnDef.meta?.hidden != true),
	);

	function IsColumnVisible(col_id: string) {
		return table_state.column_visibility[col_id] == true;
	}

	function ToggleColumnVisibility(col_id: string) {
		if (STATIC_COL_IDS.has(col_id)) return;

		const visibility_obj = Object.assign({}, table_state.column_visibility);

		visibility_obj[col_id] = !visibility_obj[col_id];

		table_state.SetColumnVisibility(visibility_obj);
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button {...props} size="icon-sm" variant="outline">
				<LucideSettings />
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent align="end">
		<div class="grid gap-3">
			<p class="text-xs text-muted-foreground">Displayed Columns</p>
			<div class="flex flex-row flex-wrap gap-2">
				{#each all_columns as column (column.id)}
					{@const header =
						typeof column.columnDef.header == "string"
							? column.columnDef.header
							: "Unknown Field"}
					{@const visible = IsColumnVisible(column.id)}

					<button
						class={cn(
							"line-clamp-1 h-6 rounded-full border border-transparent bg-transparent px-2 text-xs text-muted-foreground transition-colors duration-200",
							"disabled:opacity-50",
							"hover:bg-accent",
							visible && "border-border bg-secondary text-secondary-foreground",
						)}
						disabled={STATIC_COL_IDS.has(column.id)}
						data-id={column.id}
						onclick={() => ToggleColumnVisibility(column.id)}
					>
						{header}
					</button>
				{/each}
			</div>
		</div>
	</PopoverContent>
</Popover>
