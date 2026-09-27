import type { AppRow } from "$lib/table/init.svelte";
import type { RowData } from "@tanstack/svelte-table";
import type { Component } from "svelte";
import type { TableSearchFilter } from "../validators";

export type FilterDef<T extends RowData> = {
	id: string;
	accessor_fn?: (row: T) => any;
	allow_swap: boolean;
	available_operations: FilterOperation[];
	display_meta: {
		icon?: IconDefinition;
		name: string;
	};
	func: FilterFunction<T>;
	hidden: boolean;
	meta: Record<string, any>;
	multi: boolean;
	merge_behavior?: "overwrite" | "merge" | "append";
};

export type FilterOperation = {
	id: string;
	hide?: boolean;
	label: string;
	label_multi?: string;
};

export type FilterFunction<T extends RowData> = (
	row: AppRow<T>,
	column_id: keyof T,
	filter_def: FilterDef<T>,
	filter_value: TableSearchFilter["value"],
) => boolean;

export type FilterDefinitions<T extends RowData> = Record<string, FilterDef<T>>;

export type IconDefinition = {
	component: Component<any>;
	props?: Record<string, any>;
};
