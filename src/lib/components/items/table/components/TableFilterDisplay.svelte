<script lang="ts">
	import type { AppColumn, AppTable } from "$lib/table/init.svelte";
	import type { FilterDef } from "../lib/filters/types";
	import FilterPill from "./filters/FilterPill.svelte";
	import FilterPillLeading from "./filters/FilterPillLeading.svelte";
	import FilterPillOperation from "./filters/FilterPillOperation.svelte";
	import FilterPillOptionValue from "./filters/FilterPillOptionValue.svelte";
	import FilterPillClose from "./filters/FilterPillClose.svelte";
	import FilterPillNumberValue from "./filters/FilterPillNumberValue.svelte";
	import FilterPillStringValue from "./filters/FilterPillStringValue.svelte";
	import FilterPillDateValue from "./filters/FilterPillDateValue.svelte";
	import FilterPillBooleanValue from "./filters/FilterPillBooleanValue.svelte";
	import { onDestroy } from "svelte";
	import type { TableSearchFilter } from "$lib/table/validators";
	import Plural from "$lib/components/utils/Plural.svelte";

	type Props = {
		filters: TableSearchFilter[];
		table: AppTable<any>;
	};

	let { filters = $bindable(), table }: Props = $props();

	const FILTER_VALUE_DEBOUNCE_MS = 180;
	const pending_filter_updates = new Map<string, ReturnType<typeof setTimeout>>();

	const table_columns = $derived(table.getAllColumns());
	const visible_filters = $derived(filters.filter((f) => f.silent !== true));

	function GetColumnFilterDef(column: AppColumn<any>): FilterDef<any> {
		const filter = column.columnDef.meta?.filter;
		if (!filter) throw new Error("No filter config found");

		return filter;
	}

	function GetFilterKey(filter: TableSearchFilter, index: number) {
		return filter.key ?? `${filter.id}-${index}`;
	}

	function GetColumnsOfSameType(col_id: string) {
		const column = table_columns.find((c) => c.id == col_id);
		if (!column || !column.columnDef.meta?.filter) return [];

		const column_type = column.columnDef.meta.filter.id;

		const matching_columns = table_columns.filter(
			(c) => c.columnDef.meta?.filter?.id == column_type && !c.columnDef.meta?.filter.hidden,
		);

		return matching_columns;
	}

	function ApplyFilterUpdate(filter_key: string, updates: Partial<TableSearchFilter["value"]>) {
		const index = filters.findIndex((f, i) => GetFilterKey(f, i) === filter_key);
		if (index === -1) return;

		const next = { ...filters[index], value: { ...filters[index].value, ...updates } };
		filters = filters.map((f, i) => (i === index ? next : f));
	}

	function UpdateFilter(
		filter_key: string,
		updates: Partial<TableSearchFilter["value"]>,
		options: { debounce?: boolean } = {},
	) {
		if (!options.debounce) {
			const existing_timeout = pending_filter_updates.get(filter_key);
			if (existing_timeout) {
				clearTimeout(existing_timeout);
				pending_filter_updates.delete(filter_key);
			}

			ApplyFilterUpdate(filter_key, updates);
			return;
		}

		const existing_timeout = pending_filter_updates.get(filter_key);
		if (existing_timeout) {
			clearTimeout(existing_timeout);
		}

		const timeout = setTimeout(() => {
			ApplyFilterUpdate(filter_key, updates);
			pending_filter_updates.delete(filter_key);
		}, FILTER_VALUE_DEBOUNCE_MS);

		pending_filter_updates.set(filter_key, timeout);
	}

	function UpdateFilterIdByKey(filter_key: string, next_id: string) {
		const index = filters.findIndex((f, i) => GetFilterKey(f, i) === filter_key);
		if (index === -1) return;

		filters = filters.map((f, i) => (i === index ? { ...f, id: next_id } : f));
	}

	function RemoveFilter(filter_key: string) {
		const existing_timeout = pending_filter_updates.get(filter_key);

		if (existing_timeout) {
			clearTimeout(existing_timeout);
			pending_filter_updates.delete(filter_key);
		}

		filters = filters.filter((f, i) => GetFilterKey(f, i) !== filter_key);
	}

	onDestroy(() => {
		for (const timeout of pending_filter_updates.values()) {
			clearTimeout(timeout);
		}

		pending_filter_updates.clear();
	});
</script>

{#if visible_filters.length > 0}
	{#each visible_filters as filter, index (filter.key)}
		{@const filter_column = table_columns.find((col) => col.id == filter.id)}
		{@const filter_key = GetFilterKey(filter, index)}

		{#if filter_column}
			{@const filter_def = GetColumnFilterDef(filter_column)}

			<FilterPill>
				<FilterPillLeading
					def={filter_def}
					options={GetColumnsOfSameType(filter.id)}
					onFilterIdUpdate={(filter_id) => {
						UpdateFilterIdByKey(filter_key, filter_id);
					}}
				/>

				<FilterPillOperation
					multi={Array.isArray(filter.value.value) && filter.value.value.length > 1}
					onSelectedChange={(id) => UpdateFilter(filter_key, { operator: id })}
					operations={filter_def.available_operations}
					selected={filter.value.operator}
				/>

				{#if filter_def.id == "option"}
					<FilterPillOptionValue
						id={filter.id}
						def={filter_def}
						defaultOpen={filter.defaultOpen}
						multi={filter_def.multi}
						multiLabel={filter_def.meta.multiLabel}
						onSelectedOptionChange={(value, prevent_removal = false) => {
							if (value.length == 0 && !prevent_removal) return RemoveFilter(filter_key);

							UpdateFilter(filter_key, { value: value });
						}}
						options={filter_def.meta.options}
						selectedOption={filter.value.value as string | string[]}
					/>
				{/if}

				{#if filter_def.id == "number"}
					<FilterPillNumberValue
						defaultOpen={filter.defaultOpen}
						placeholder={`${filter.value.operator.startsWith("greater-than") ? "Min" : "Max"} ${filter_def.display_meta.name}`}
						onValueChange={(val) =>
							UpdateFilter(filter_key, { value: val }, { debounce: true })}
						value={filter.value.value as number}
						variant={filter_def.meta.variant}
					/>
				{/if}

				{#if filter_def.id == "date"}
					<FilterPillDateValue
						defaultOpen={filter.defaultOpen}
						onValueChange={(val) => UpdateFilter(filter_key, { value: val })}
						value={filter.value.value instanceof Date ? filter.value.value : undefined}
					/>
				{/if}

				{#if filter_def.id == "string"}
					<FilterPillStringValue
						columnName={filter_column.columnDef.header as string}
						defaultOpen={filter.defaultOpen}
						placeholder="Search Text"
						onBlur={(val) => {
							if (val.length == 0) {
								RemoveFilter(filter_key);
							}
						}}
						onValueChange={(val) =>
							UpdateFilter(filter_key, { value: val }, { debounce: true })}
						value={filter.value.value as string}
					/>
				{/if}

				{#if filter_def.id == "boolean"}
					<FilterPillBooleanValue
						falseLabel={filter_def.meta.falseLabel}
						trueLabel={filter_def.meta.trueLabel}
						value={filter.value.value as boolean}
						onValueChange={(value) => UpdateFilter(filter_key, { value })}
					/>
				{/if}

				{#if filter.required != true}
					<FilterPillClose onClose={() => RemoveFilter(filter_key)} />
				{/if}
			</FilterPill>
		{/if}
	{/each}
{/if}
