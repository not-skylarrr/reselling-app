import type { TableSearchFilter } from "$lib/components/items/table/lib/validators";
import {
	type LoadSubsetOptions,
	and as tsAnd,
	or as tsOr,
	not as tsNot,
	eq as tsEq,
	gt as tsGt,
	gte as tsGte,
	lt as tsLt,
	lte as tsLte,
	like as tsLike,
	ilike as tsIlike,
	inArray as tsInArray,
	isNull as tsIsNull,
	parseLoadSubsetOptions,
	parseWhereExpression,
	type Collection,
	type Ref,
	type WithVirtualProps,
} from "@tanstack/db";
import z from "zod";

const TanstackDbFilters: Record<string, any> = {
	and: tsAnd,
	or: tsOr,
	not: tsNot,
	eq: tsEq,
	ne: (left: any, right: any) => tsNot(tsEq(left, right)),
	gt: tsGt,
	gte: tsGte,
	lt: tsLt,
	lte: tsLte,
	like: tsLike,
	ilike: tsIlike,
	inArray: tsInArray,
	notInArray: (left: any, right: any) => tsNot(tsInArray(left, right)),
	isNull: tsIsNull,
	isNotNull: (arg: any) => tsNot(tsIsNull(arg)),
	between: (left: any, min: any, max: any) => tsAnd(tsGte(left, min), tsLte(left, max)),
	notBetween: (left: any, min: any, max: any) => tsOr(tsLt(left, min), tsGt(left, max)),
};

export function CreateTsDbFilterFromTable<T extends object>(
	col: Ref<WithVirtualProps<T>>,
	filters: TableSearchFilter[],
	logical_join: "or" | "and",
) {
	const logic_operator = logical_join == "or" ? tsOr : tsAnd;

	const ts_db_filters = filters.map((filter) => {
		const [filter_type, operator_val] = filter.value.operator.split(":");

		switch (filter_type) {
			case "string":
				return BuildStringFilter(col, filter);

			case "number":
				return BuildNumberFilter(col, filter);

			default:
				throw new Error(`Invalid filter type: ${filter_type}`);
		}
	});
}

function BuildStringFilter<T extends object>(
	col: Ref<WithVirtualProps<T>>,
	filter: TableSearchFilter,
) {
	const parsed_value = z.string().safeParse(filter.value.value);
	if (!parsed_value.success) return null;

	const value = parsed_value.data.trim();
	if (value.length == 0) return null;

	// @ts-expect-error fix later
	const column = col[filter.id as keyof T];
	if (!column) return null;

	const [_, operator_val] = filter.value.operator.split(":");

	switch (operator_val) {
		case "exact":
			return tsEq(column, value);
		case "starts-with":
			return tsIlike(column, `${value}%`);
		case "includes":
			return tsIlike(
				column,
				`${value
					.split(" ")
					.map((seg) => `%${seg}%`)
					.join(" ")}`,
			);
		case "not-includes":
			return tsNot(tsIlike(column, `%${value}%`));
		case "ends-with":
			return tsIlike(column, `%${value}`);
		default:
			return null;
	}
}

function BuildNumberFilterCondition<T extends object>(
	col: Ref<WithVirtualProps<T>>,
	filter: TableSearchFilter,
): SQL | null {
	const parsed_value = z.number().safeParse(filter.value.value);
	if (!parsed_value.success) return null;

	// @ts-expect-error fix later
	const column = col[filter.id as keyof T];
	if (!column) return null;

	const [_, operator_val] = filter.value.operator.split(":");

	switch (operator_val) {
		case "greater-than":
			return tsGt(column, parsed_value.data);
		case "less-than":
			return tsLt(column, parsed_value.data);
		case "greater-than-eq":
			return tsGte(column, parsed_value.data);
		case "less-than-eq":
			return tsLte(column, parsed_value.data);
		default:
			return null;
	}
}
