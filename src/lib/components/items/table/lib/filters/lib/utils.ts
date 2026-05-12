import type { QueryClient } from "@tanstack/svelte-query";
import type { Table } from "@tanstack/svelte-table";
import { Alphabet, GenerateRandomString } from "$lib/utils/web-crypto";
import type { TableSearchFilter } from "$lib/table/validators";

export type CreateFilterOptions = {
	defaultOpen?: boolean;
	key?: string;
	required?: boolean;
	silent?: boolean;
};

export function CreateTableFilter(
	id: string,
	operator: string,
	value: unknown,
	options: CreateFilterOptions = {
		key: GenerateRandomString(Alphabet("a-z", "A-Z"), 16),
	},
): TableSearchFilter {
	return {
		id,
		key: options.key ?? GenerateRandomString(Alphabet("a-z", "A-Z"), 16),
		silent: options.silent,
		required: options.required,
		defaultOpen: options.defaultOpen,
		value: {
			operator,
			value,
		},
	};
}

export function PrefetchFilterQueries(table: Table<any>, query_client: QueryClient) {
	const columns = table.getAllColumns();

	for (const column of columns) {
		if (column.columnDef.meta?.filter) {
			const filter = column.columnDef.meta?.filter;

			if (filter.id == "option" && !Array.isArray(filter.meta.options)) {
				query_client.prefetchQuery({
					queryKey: ["filter-options", column.id],
					queryFn: () => filter.meta.options(),
				});
			}
		}
	}
}

export function NavigateDataObject(data: any, key: string | number | symbol): unknown {
	if (typeof key != "string") return data[key];

	const path_segments = key.split(".").filter((seg) => seg.length > 0);

	let reduced_data = data;

	for (const seg of path_segments) {
		if (reduced_data[seg] == undefined) return undefined;

		reduced_data = reduced_data[seg];
	}

	return reduced_data;
}
