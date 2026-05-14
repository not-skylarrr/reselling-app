import type { FilterDef, FilterOperation, IconDefinition } from "../types";
import { z } from "zod";
import { NavigateDataObject } from "./utils";

type BaseFilterOptions<T> = {
	accessor_fn?: (row: T) => any;
	hidden?: boolean;
	icon?: IconDefinition;
	name: string;
};

type NumberFilterOptions<T> = BaseFilterOptions<T> & {
	variant?: "default" | "currency";
};

export const NumberFilter = <T>({
	accessor_fn,
	hidden = false,
	icon,
	name,
	variant,
}: NumberFilterOptions<T>): FilterDef<T> => {
	return {
		id: "number",
		accessor_fn: accessor_fn,
		allow_swap: true,
		available_operations: [
			{ id: "greater-than", label: "Greater than" },
			{ id: "less-than", label: "Less than" },
			{ id: "greater-than-eq", label: "Greater than or equal to" },
			{ id: "less-than-eq", label: "Less than or equal to" },
		],
		display_meta: {
			icon: icon,
			name: name,
		},
		func: (row, col_id, filter, value) => {
			const value_safe_parse = z.number().safeParse(value.value);
			if (!value_safe_parse.success) return true;

			const column_value = filter.accessor_fn
				? filter.accessor_fn(row.original)
				: NavigateDataObject(row.original, col_id);

			if (typeof column_value != "number") return true;

			const parsed_filter_value = value_safe_parse.data;

			switch (value.operator) {
				case "greater-than":
					return column_value > parsed_filter_value;

				case "less-than":
					return column_value < parsed_filter_value;

				case "greater-than-eq":
					return column_value >= parsed_filter_value;

				case "less-than-eq":
					return column_value <= parsed_filter_value;
			}

			return false;
		},
		hidden: hidden,
		meta: {
			variant,
			allowMultiple: true,
		},
		multi: false,
		merge_behavior: "append",
	};
};

type OptionFilterOptions<T> = BaseFilterOptions<T> & {
	columnArray?: boolean;
	multiLabel?: string;
	options: OptionFilterOption[] | (() => OptionFilterOption[] | Promise<OptionFilterOption[]>);
	getKey: (data: T) => string;
};

export type OptionFilterOption = {
	icon?: IconDefinition;
	label: string;
	value: string;
};

export const OptionFilter = <T>({
	accessor_fn,
	columnArray = false,
	multiLabel,
	hidden = false,
	icon,
	name,
	options,
	getKey,
}: OptionFilterOptions<T>): FilterDef<T> => {
	const available_operations: FilterOperation[] = columnArray
		? [
				{
					id: "option:includes",
					label: "includes",
					label_multi: "includes any of",
				},
				{
					id: "option:includes-all",
					label: "includes all",
					label_multi: "includes all",
				},
				{ id: "option:excludes", label: "excludes", label_multi: "excludes any of" },
				{ id: "option:excludes-all", label: "excludes all" },
			]
		: [
				{ id: "option:includes", label: "is", label_multi: "is any of" },
				{ id: "option:excludes", label: "is not", label_multi: "is not" },
			];

	return {
		id: "option",
		accessor_fn: accessor_fn,
		allow_swap: false,
		available_operations: available_operations,
		display_meta: {
			icon: icon,
			name: name,
		},
		func: (row, col_id, _filter, value) => {
			const filter_value_validation = z.array(z.string()).safeParse(value.value);

			if (!filter_value_validation.success) return true;

			const column_value = NavigateDataObject(row.original, col_id);
			const parsed_filter_value = filter_value_validation.data;

			if (Array.isArray(column_value)) {
				const key_arr = column_value.map((data) => getKey(data));

				if (value.operator == "option:includes") {
					return key_arr.some((val) => parsed_filter_value.includes(val));
				}

				if (value.operator == "option:includes-all") {
					return parsed_filter_value.every((val) => key_arr.includes(val));
				}

				if (value.operator == "option:excludes") {
					return !parsed_filter_value.some((val) => key_arr.includes(val));
				}

				if (value.operator == "option:excludes-all") {
					return !parsed_filter_value.every((val) => key_arr.includes(val));
				}

				return false;
			}

			if (!column_value) return false;

			const operation_avail = available_operations.findIndex((o) => o.id == value.operator);
			if (operation_avail == -1) return false;

			if (value.operator == "option:includes") {
				// @ts-expect-error Fix this later
				return parsed_filter_value.includes(getKey(column_value));
			}

			if (value.operator == "option:excludes") {
				// @ts-expect-error Fix this later
				return !parsed_filter_value.includes(getKey(column_value));
			}

			if (value.operator == "option:includes-all") {
				return false;
			}

			if (value.operator == "option:excludes-all") {
				return false;
			}

			return false;
		},
		hidden: hidden,
		meta: {
			columnArray: columnArray,
			multiLabel: multiLabel,
			options: options,
		},
		multi: true,
		merge_behavior: "merge",
	};
};

type DateFilterOptions<T> = BaseFilterOptions<T>;

export const DateFilter = <T>({
	accessor_fn,
	hidden = false,
	icon,
	name,
}: DateFilterOptions<T>): FilterDef<T> => {
	const available_operations: FilterOperation[] = [
		{ id: "date:less-than", label: "Before" },
		{ id: "date:equal", label: "Is" },
		{ id: "date:greater-than", label: "After" },
	];

	return {
		id: "date",
		accessor_fn: accessor_fn,
		allow_swap: true,
		available_operations: available_operations,
		display_meta: {
			icon: icon,
			name: name,
		},
		func: (row, col_id, filter, value) => {
			const filter_value_validation = z.coerce.date().safeParse(value.value);
			if (!filter_value_validation.success) return true;

			const column_raw = filter.accessor_fn
				? filter.accessor_fn(row.original)
				: NavigateDataObject(row.original, col_id);
			if (column_raw == null) return false;

			const column_date = new Date(column_raw);
			const filter_date = filter_value_validation.data;

			if (isNaN(column_date.getTime())) return true;

			const col_day = new Date(
				column_date.getFullYear(),
				column_date.getMonth(),
				column_date.getDate(),
			).getTime();
			const flt_day = new Date(
				filter_date.getFullYear(),
				filter_date.getMonth(),
				filter_date.getDate(),
			).getTime();

			switch (value.operator) {
				case "date:less-than":
					return col_day < flt_day;
				case "date:equal":
					return col_day === flt_day;
				case "date:greater-than":
					return col_day > flt_day;
			}

			return true;
		},
		hidden: hidden,
		meta: {
			allowMultiple: true,
		},
		multi: false,
		merge_behavior: "append",
	};
};

type StringFilterOptions<T> = BaseFilterOptions<T>;

export const StringFilter = <T>({
	accessor_fn,
	hidden = false,
	icon,
	name,
}: StringFilterOptions<T>): FilterDef<T> => {
	const available_operations: FilterOperation[] = [
		{ id: "string:exact", hide: true, label: "Is" },
		{ id: "string:starts-with", label: "Starts with" },
		{ id: "string:includes", label: "Includes" },
		{ id: "string:not-includes", label: "Does not include" },
		{ id: "string:ends-with", label: "Ends with" },
	];

	return {
		id: "string",
		accessor_fn: accessor_fn,
		allow_swap: true,
		available_operations: available_operations,
		display_meta: {
			icon: icon,
			name: name,
		},
		func: (row, col_id, _filter, value) => {
			const filter_value_validation = z.string().safeParse(value.value);
			if (!filter_value_validation.success) return true;

			const column_value = NavigateDataObject(row.original, col_id);

			if (column_value == null) return false;

			if (typeof column_value != "string") {
				console.warn("Attempted to string filter a non string value");
				return true;
			}

			const parsed_column_value = column_value.toLocaleLowerCase();
			const parsed_filter_value = filter_value_validation.data.toLocaleLowerCase();

			const operation_available = available_operations.findIndex((o) => o.id == value.operator);
			if (operation_available == -1) return false;

			if (value.operator == "string:exact") {
				return parsed_column_value == parsed_filter_value;
			}

			if (value.operator == "string:includes") {
				return parsed_column_value.includes(parsed_filter_value);
			}

			if (value.operator == "string:not-includes") {
				return parsed_column_value.includes(parsed_filter_value) == false;
			}

			if (value.operator == "string:starts-with") {
				return parsed_column_value.startsWith(parsed_filter_value);
			}

			if (value.operator == "string:ends-with") {
				return parsed_column_value.endsWith(parsed_filter_value);
			}

			return true;
		},
		hidden: hidden,
		meta: {},
		multi: false,
		merge_behavior: "append",
	};
};
