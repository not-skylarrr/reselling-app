<script lang="ts">
	import { FlexRender } from "@tanstack/svelte-table";
	import type { BundleTableData } from "../../../../../routes/dashboard/bundles/+page.svelte";
	import { GetTableContext, type AppRow } from "$lib/table/init.svelte";
	import { GetColumnSizingCssVarWithFallback } from "$lib/table/utils";
	import { cn } from "$lib/utils";
	import { Field, FieldLabel } from "$lib/components/ui/field";
	import { GetBundleCompletionStats } from "../lib/utils";

	type Props = {
		row: AppRow<BundleTableData>;
	};

	let { row }: Props = $props();

	const table_state = GetTableContext();

	const bundle = $derived(row.original);

	const completion = $derived(GetBundleCompletionStats(bundle));

	let visible_cells = $derived(
		row.getVisibleCells().filter((cell) => {
			if (cell.column.columnDef.meta?.hidden == true) return false;

			if (table_state.strict_visiblity) {
				if (table_state.column_visibility[cell.column.id] != true) return false;

				return true;
			}

			return true;
		}),
	);
</script>

<a
	class="flex h-28 flex-col gap-4 overflow-hidden p-4 outline-none hover:bg-accent"
	href={`/dashboard/bundles/${row.original.id}`}
	role="row"
>
	<p class="font-medium">{bundle.name}</p>

	<div class="grid grid-cols-2 gap-6">
		<Field class="flex-1">
			<FieldLabel class="text-xs font-normal text-muted-foreground">Included Items</FieldLabel>

			<p class="text-sm">{bundle.items.length}</p>
		</Field>

		<Field class="w-auto min-w-32">
			<FieldLabel class="text-xs font-normal text-muted-foreground">Completion</FieldLabel>

			<p class="text-sm">{completion.completion_perc}%</p>
		</Field>
	</div>
</a>
