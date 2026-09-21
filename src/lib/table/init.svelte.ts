import type { TsDbWhereNode } from "$lib/server/ts-db/validator";
import { createContext } from "svelte";
import {
	columnFilteringFeature,
	columnResizingFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	createFilteredRowModel,
	createSortedRowModel,
	filterFns,
	rowSelectionFeature,
	rowSortingFeature,
	sortFns,
	tableFeatures,
	type ColumnFiltersState,
	type ColumnSizingState,
	type RowData,
	type RowSelectionState,
	type SortingState,
	type TableOptions,
	type ColumnVisibilityState,
} from "@tanstack/svelte-table";
import type { TableSearchFilter } from "./validators";
import { Alphabet, GenerateRandomString } from "$lib/utils/web-crypto";
import {
	GetLocalColumnDisplayState,
	GetLocalColumnSizingState,
	GetLocalHideArchivedState,
	SetLocalColumnDisplayState,
	SetLocalColumnSizingState,
	SetLocalHideArchivedState,
} from "./stores";

type TableStateInit = {
	key?: string;
	filters?: TableSearchFilter[];
	sorting?: SortingState;
	focused_id?: string | null;
	column_visibility?: ColumnVisibilityState;
	default_column_visibility: ColumnVisibilityState;
	col_sizing?: Record<string, number>;
	selection_enabled?: boolean;
	strict_visibility?: boolean;
	local?: Partial<TableStateStores>;
};

type TableStateStores = {
	get_col_visiblity: (
		key: string | undefined,
		default_state: ColumnVisibilityState,
	) => ColumnVisibilityState;
	set_col_visiblity: (
		key: string | undefined,
		default_state: ColumnVisibilityState,
		state: ColumnVisibilityState,
	) => void;
	get_col_sizing: (key: string | undefined) => Record<string, number>;
	set_col_sizing: (key: string | undefined, state: Record<string, number>) => void;
	get_hide_archived: (key: string | undefined) => boolean | undefined;
	set_hide_archived: (key: string | undefined, state: boolean) => void;
};

export class TableState {
	readonly key: string | undefined;

	filters = $state<TableSearchFilter[]>([]);
	sorting = $state<SortingState>([]);
	focused_id = $state<string | null>(null);
	column_visibility = $state<ColumnVisibilityState>({});
	default_column_visibility = $state<ColumnVisibilityState>({});
	row_selection = $state<RowSelectionState>({});
	col_sizing = $state<Record<string, number>>({});
	hotkey_container = $state<HTMLElement | null>(null);
	hotkey_active = $state(false);
	selection_enabled = $state(true);
	strict_visiblity = $state(false);
	hide_archived = $state(true);

	local = $state<TableStateStores>({
		get_col_sizing: GetLocalColumnSizingState,
		set_col_sizing: SetLocalColumnSizingState,
		get_col_visiblity: GetLocalColumnDisplayState,
		set_col_visiblity: SetLocalColumnDisplayState,
		get_hide_archived: GetLocalHideArchivedState,
		set_hide_archived: SetLocalHideArchivedState,
	});

	constructor(initial: TableStateInit) {
		this.key = initial?.key;

		if (initial?.local) {
			if (initial.local.get_col_sizing) {
				this.local.get_col_sizing = initial.local.get_col_sizing;
			}

			if (initial.local.set_col_sizing) {
				this.local.set_col_sizing = initial.local.set_col_sizing;
			}

			if (initial.local.get_col_visiblity) {
				this.local.get_col_visiblity = initial.local.get_col_visiblity;
			}

			if (initial.local.set_col_visiblity) {
				this.local.set_col_visiblity = initial.local.set_col_visiblity;
			}

			if (initial.local.get_hide_archived) {
				this.local.get_hide_archived = initial.local.get_hide_archived;
			}

			if (initial.local.set_hide_archived) {
				this.local.set_hide_archived = initial.local.set_hide_archived;
			}
		}

		if (initial?.filters) {
			this.filters = initial.filters;
		}

		if (initial?.sorting) this.sorting = initial.sorting;

		if (initial?.focused_id != undefined) this.focused_id = initial.focused_id;

		if (initial?.strict_visibility != undefined)
			this.strict_visiblity = initial.strict_visibility;

		this.default_column_visibility = initial.default_column_visibility;

		if (initial?.column_visibility) {
			this.column_visibility = initial.column_visibility;
		} else if (this.local?.get_col_visiblity) {
			this.column_visibility = this.local.get_col_visiblity(
				this.key,
				this.default_column_visibility,
			);
		}

		if (initial?.col_sizing) {
			this.col_sizing = initial.col_sizing;
		} else if (this.local?.get_col_sizing) {
			this.col_sizing = this.local.get_col_sizing(this.key);
		}

		if (initial?.selection_enabled != undefined) {
			this.selection_enabled = initial.selection_enabled;
		}

		const local_hide_archived = this.local.get_hide_archived(this.key);
		if (local_hide_archived != undefined) {
			this.hide_archived = local_hide_archived;
		}
	}

	SetHotkeyContainer(container: HTMLElement | null) {
		this.hotkey_container = container;
	}

	SetHotkeyActive(active: boolean) {
		this.hotkey_active = active;
	}

	IsHotkeyActive() {
		if (this.hotkey_active) return true;
		if (!this.hotkey_container) return false;
		if (typeof document === "undefined") return false;
		const active = document.activeElement;

		if (!(active instanceof HTMLElement)) return false;

		return this.hotkey_container.contains(active);
	}

	DoesFilterExist(key: string) {
		const index = this.filters.findIndex((f) => f.key === key);

		return index != -1;
	}

	AddFilter(
		filter: TableSearchFilter,
		options: boolean | { mode?: "overwrite" | "merge" | "append" } = true,
	) {
		const mode =
			typeof options === "boolean"
				? options
					? "overwrite"
					: "merge"
				: (options.mode ?? "overwrite");

		const next_filter: TableSearchFilter = {
			...filter,
			key: filter.key ?? CreateFilterKey(),
		};

		if (mode === "append") {
			this.filters = [...this.filters, next_filter];
			this.focused_id = null;
			return;
		}

		if (mode === "merge") {
			let overwrite_index = this.filters.findIndex((f) => f.id == next_filter.id);

			if (overwrite_index > -1) {
				const existing_filter = this.filters[overwrite_index];

				const existing_values = Array.isArray(existing_filter.value.value)
					? existing_filter.value.value
					: [];
				const next_values = Array.isArray(next_filter.value.value)
					? next_filter.value.value
					: [];

				const merged_filter: TableSearchFilter = {
					id: next_filter.id,
					key: existing_filter.key ?? next_filter.key,
					value: {
						operator: next_filter.value.operator,
						value: [...existing_values, ...next_values],
					},
				};

				this.filters = this.filters.map((filter, index) =>
					index === overwrite_index ? merged_filter : filter,
				);

				this.focused_id = null;
				return;
			}
		}

		const filtered = this.filters.filter((f) => f.id != next_filter.id);

		filtered.push(next_filter);

		this.filters = filtered;
		this.focused_id = null;
	}

	RemoveFilter(filter_id: string) {
		this.filters = this.filters.filter((f) => f.id != filter_id);
	}

	RemoveFilterByKey(filter_key: string) {
		this.filters = this.filters.filter((f) => f.key != filter_key);
	}

	UpdateFilterByKey(filter_key: string, updates: Partial<TableSearchFilter["value"]>) {
		const index = this.filters.findIndex((f) => f.key === filter_key);
		if (index === -1) return;

		const existing = this.filters[index];
		const next = { ...existing, value: { ...existing.value, ...updates } };

		this.filters = this.filters.map((f, i) => (i === index ? next : f));
	}

	ClearFilters() {
		this.filters = [];
		this.focused_id = null;
	}

	GetVisibleFilters() {
		return this.filters.filter((filter) => filter.silent != true);
	}

	SetColumnFilters(
		updater: ColumnFiltersState | ((prev: ColumnFiltersState) => ColumnFiltersState),
	) {
		const next_filters = typeof updater == "function" ? updater(this.filters) : updater;

		this.filters = next_filters as TableSearchFilter[];
	}

	SetSorting(updater: SortingState | ((prev: SortingState) => SortingState)) {
		this.sorting = typeof updater == "function" ? updater(this.sorting) : updater;
	}

	SetColumnVisibility(
		updater: ColumnVisibilityState | ((prev: ColumnVisibilityState) => ColumnVisibilityState),
	) {
		this.column_visibility =
			typeof updater == "function" ? updater(this.column_visibility) : updater;

		this.local.set_col_visiblity(
			this.key,
			this.default_column_visibility,
			this.column_visibility,
		);
	}

	SetRowSelection(
		updater: RowSelectionState | ((prev: RowSelectionState) => RowSelectionState),
	) {
		this.row_selection = typeof updater == "function" ? updater(this.row_selection) : updater;
	}

	SetHideArchived(hide_archived: boolean) {
		this.hide_archived = hide_archived;
		this.local.set_hide_archived(this.key, hide_archived);
	}

	SetColumnSizing(
		updater: ColumnSizingState | ((prev: ColumnSizingState) => ColumnSizingState),
	) {
		const next_value = typeof updater == "function" ? updater({ ...this.col_sizing }) : updater;
		const normalized = this.#NormalizeColumnSizing(next_value);

		this.col_sizing = normalized;

		if (this.local?.set_col_sizing) {
			this.local.set_col_sizing(this.key, normalized);
		}
	}

	#NormalizeColumnSizing(value: Record<string, unknown>): Record<string, number> {
		const normalized: Record<string, number> = {};

		for (const [k, size] of Object.entries(value)) {
			if (typeof size != "number" || Number.isNaN(size)) continue;
			normalized[k] = size;
		}

		return normalized;
	}

	private NormalizeNode(node: TsDbWhereNode | undefined): TsDbWhereNode | undefined {
		if (!node) return undefined;
		if (node.type !== "func") return node;

		const normalized_args = node.args
			.map((arg) => this.NormalizeNode(arg))
			.filter((arg): arg is TsDbWhereNode => Boolean(arg));

		if (node.name === "and" || node.name === "or") {
			const flattened_args = normalized_args.flatMap((arg) => {
				if (arg.type === "func" && arg.name === node.name) {
					return arg.args;
				}
				return [arg];
			});

			if (flattened_args.length === 0) return undefined;
			if (flattened_args.length === 1) return flattened_args[0];

			return {
				...node,
				args: flattened_args,
			};
		}

		if (node.name === "not") {
			if (normalized_args.length === 0) return undefined;
			return {
				...node,
				args: [normalized_args[0]],
			};
		}

		return {
			...node,
			args: normalized_args,
		};
	}
}

function CreateFilterKey() {
	const random_segment = GenerateRandomString(Alphabet("a-z", "A-Z", "0-9"), 12);

	return `filter_${Date.now()}}_${random_segment}`;
}

export const [GetTableContext, SetTableContext] = createContext<TableState>();

export const DefaultTableFeatures = tableFeatures({
	columnFilteringFeature,
	columnResizingFeature,
	columnSizingFeature,
	columnVisibilityFeature,
	rowSelectionFeature,
	rowSortingFeature,
	filteredRowModel: createFilteredRowModel(),
	sortedRowModel: createSortedRowModel(),
	filterFns,
	sortFns,
});

export type DefaultTableFeatures = typeof DefaultTableFeatures;
export type AppTable<TData extends RowData> = import("@tanstack/svelte-table").Table<
	DefaultTableFeatures,
	TData
>;
export type AppRow<TData extends RowData> = import("@tanstack/svelte-table").Row<
	DefaultTableFeatures,
	TData
>;

type DefaultTableOptions<TData extends RowData> = TableOptions<DefaultTableFeatures, TData>;

export function DefaultTableProps<T extends RowData>(
	table_state: TableState,
	opts: Omit<DefaultTableOptions<T>, "features" | "columns" | "data" | "getRowId"> = {},
): Omit<DefaultTableOptions<T>, "columns" | "data"> {
	return {
		features: DefaultTableFeatures,
		state: {
			get columnFilters() {
				return table_state.filters;
			},
			get columnVisibility() {
				return table_state.column_visibility;
			},
			get rowSelection() {
				return table_state.row_selection;
			},
			get sorting() {
				return table_state.sorting;
			},
			get columnSizing() {
				return table_state.col_sizing;
			},
		},
		columnResizeMode: "onChange",
		onColumnVisibilityChange: (updater) => table_state.SetColumnVisibility(updater),
		onRowSelectionChange: (updater) => table_state.SetRowSelection(updater),
		onColumnSizingChange: (updater) => table_state.SetColumnSizing(updater),
		onSortingChange: (updater) => table_state.SetSorting(updater),
		onColumnFiltersChange: (updater) => table_state.SetColumnFilters(updater),
		...opts,
	};
}
