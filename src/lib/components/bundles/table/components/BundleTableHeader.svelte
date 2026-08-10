<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import { ButtonGroup, ButtonGroupText } from "$lib/components/ui/button-group";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { cn } from "$lib/utils.js";
	import { LucideChevronDown, LucideWholeWord } from "@lucide/svelte";
	import { FlexRender, type SortingState } from "@tanstack/svelte-table";
	import { GetColumnSizingCssVarWithFallback } from "$lib/table/utils";
	import { GetTableContext, type AppRow, type AppTable } from "$lib/table/init.svelte";
	import type { BundleTableData } from "../../../../../routes/dashboard/bundles/+page.svelte";

	type Props = {
		table: AppTable<BundleTableData>;
		table_rows: AppRow<BundleTableData>[];
		active_letter: string | null;
		onLetterSelect: (letter: string) => void;
	};

	let { table, table_rows, active_letter, onLetterSelect }: Props = $props();

	const table_state = GetTableContext();
	const alphabet = "abcdefghijklmnopqrstuvwxyz".split("");

	let table_headers = $derived.by(() => {
		const all_table_headers = table.getFlatHeaders();

		return all_table_headers.filter((header) => {
			if (header.column.columnDef.meta?.hidden == true) return false;

			if (table_state.strict_visiblity) {
				if (table_state.column_visibility[header.column.id] != true) return false;

				return true;
			}

			return header.column.getIsVisible();
		});
	});

	let available_letters = $derived.by(() => {
		return new Set(
			table_rows
				.map((row) => row.original.name.trim().charAt(0).toLowerCase())
				.filter((character) => /^[a-z]$/.test(character)),
		);
	});

	function GetColumnSortingData(data: SortingState, id: string) {
		const sorting_data = data.find((s) => s.id == id);

		return sorting_data;
	}

	function ToggleSorting(col_id: string, append: boolean = false) {
		const existing_sort = GetColumnSortingData(table_state.sorting, col_id);

		table_state.focused_id = null;

		if (!existing_sort) {
			if (append) {
				if (col_id == "status") {
					// Ensure status filter overrides any sub sorts
					table_state.sorting = [{ id: col_id, desc: false }, ...table_state.sorting];
				} else {
					table_state.sorting = [...table_state.sorting, { id: col_id, desc: false }];
				}
			} else {
				table_state.sorting = [{ id: col_id, desc: false }];
			}
			return;
		}

		if (existing_sort.desc == false) {
			table_state.sorting = table_state.sorting.map((s) => {
				if (s.id != col_id) return s;

				return { id: s.id, desc: true };
			});

			return;
		}

		table_state.sorting = table_state.sorting.filter((s) => s.id != col_id);
	}
</script>

<div
	class="sticky top-0 z-20 shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90"
>
	<div class="border-b border-border/70 px-3 py-2.5">
		<div class="flex items-center gap-3">
			<ScrollArea class="min-w-0 flex-1" orientation="horizontal" scrollbarXClasses="h-1.5">
				<ButtonGroup
					class="min-w-max gap-0 rounded-3xl border border-border/70 bg-muted/35 p-1 shadow-[inset_0_1px_0_hsl(var(--background)/0.8)]"
				>
					{#each alphabet as letter (letter)}
						{@const is_available = available_letters.has(letter)}

						<Button
							size="xs"
							variant="ghost"
							class={cn(
								"min-w-8 rounded-2xl border-0 px-0 font-normal uppercase transition-[transform,background-color,color,box-shadow] duration-150",
								!is_available && "opacity-35",
							)}
							disabled={!is_available}
							onclick={() => onLetterSelect(letter)}
						>
							{letter}
						</Button>
					{/each}
				</ButtonGroup>
			</ScrollArea>
		</div>
	</div>

	<div class="flex h-9 items-center divide-x px-3">
		{#each table_headers as header (header.id)}
			{@const column_def = header.column.columnDef}
			{@const fallback_min_size = column_def.minSize ?? 96}
			{@const column_size_var = GetColumnSizingCssVarWithFallback(
				header.column.id,
				fallback_min_size,
			)}
			{@const align = column_def.meta?.align ?? "right"}
			{@const resize_delta = table.atoms.columnResizing.get().deltaOffset ?? 0}

			{@const sort_data = GetColumnSortingData(table_state.sorting, header.column.id)}

			<div
				class={cn(
					"group/header relative flex h-full shrink-0 flex-row items-center truncate px-3 text-xs text-muted-foreground select-none",
					"data-[cansort=true]:hover:bg-accent data-[cansort=true]:hover:text-accent-foreground",
					align == "left" && "justify-start text-left",
					align == "right" && "justify-end text-right",
					sort_data && "justify-between",
					header.column.columnDef.meta?.flex && "flex-1",
					table_state.selection_enabled == false && "pl-4",
				)}
				data-cansort={header.column.getCanSort()}
				style={header.column.getCanResize()
					? `min-width: ${header.column.columnDef.minSize}px; max-width: ${column_size_var};`
					: header.column.columnDef.meta?.flex
						? `min-width: ${header.column.columnDef.minSize}px;`
						: `min-width: ${header.column.columnDef.minSize}px; max-width: ${header.column.columnDef.minSize}px; `}
			>
				<button
					class="flex h-full w-full flex-row items-center gap-2 truncate text-xs"
					onclick={(ev) => ToggleSorting(header.column.id, ev.shiftKey)}
				>
					{#if sort_data && (align == "right" || column_def.meta?.align == undefined)}
						<LucideChevronDown class={cn("size-4", sort_data.desc && "rotate-180")} />
					{/if}

					<div
						class={cn(
							"flex flex-1 flex-row",
							align == "left" && "justify-start",
							align == "right" && "justify-end",
						)}
					>
						<FlexRender
							content={header.column.columnDef.header}
							context={header.getContext()}
						/>
					</div>

					{#if sort_data && column_def.meta?.align == "left"}
						<LucideChevronDown class={cn("size-4", sort_data.desc && "rotate-180")} />
					{/if}
				</button>

				{#if header.column.getCanResize()}
					<button
						type="button"
						aria-label={`Resize ${typeof column_def.header == "string" ? column_def.header : header.column.id} column`}
						class={cn(
							"absolute top-0 right-0 h-full w-2 cursor-col-resize touch-none select-none",
							"bg-transparent transition-colors hover:bg-border/80",
							header.column.getIsResizing() && "bg-accent",
						)}
						onmousedown={header.getResizeHandler()}
						ontouchstart={header.getResizeHandler()}
					>
					</button>

					{#if header.column.getIsResizing()}
						<div
							class="pointer-events-none absolute top-0 right-0 z-20 h-full w-px bg-primary"
							style="transform: translateX({resize_delta}px);"
						></div>
					{/if}
				{/if}
			</div>
		{/each}
	</div>
</div>
