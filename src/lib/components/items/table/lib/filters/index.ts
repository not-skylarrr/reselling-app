import type { Row } from "@tanstack/svelte-table";

export function AdvancedFilter<T>(
	row: Row<T>,
	column_id: string,
	filter_val: any,
	addMeta: (meta: any) => void,
) {
	const cell = row.getAllCellsByColumnId()[column_id];
	if (!cell) return true;
	const meta = cell.column.columnDef.meta;

	if (!meta || !meta.filter) return true;

	return meta.filter.func(row, column_id as keyof T, meta.filter, filter_val);
}
