import type { QueryClient } from "@tanstack/svelte-query";
import type { Table } from "@tanstack/svelte-table";
import { Alphabet, GenerateRandomString } from "$lib/utils/web-crypto";
import type { TableSearchFilter } from "../../validators";

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
