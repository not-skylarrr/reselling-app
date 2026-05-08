import type { ParsedOrderBy } from "@tanstack/db";
import {
	and,
	or,
	not,
	eq,
	ne,
	gt,
	gte,
	lt,
	lte,
	like,
	ilike,
	inArray,
	notInArray,
	isNull,
	isNotNull,
	between,
	notBetween,
	exists,
	notExists,
	type SQL,
	asc,
	desc
} from "drizzle-orm";
import type { TsDbWhereNode } from "./validator";

type CreateDrizzleFiltersInput = {
	where?: TsDbWhereNode;
	limit?: number;
	orderBy?: ParsedOrderBy[];
};

type CreateDrizzleFiltersOptions = {
	defaultWhere?: SQL;
	dbTable: any;
};

export function CreateDrizzleFilters(
	{ orderBy, limit, where }: CreateDrizzleFiltersInput,
	{ defaultWhere, dbTable }: CreateDrizzleFiltersOptions
) {
	const parsed_order_by = ParseTanstackDbOrders(orderBy, dbTable);
	const parsed_where = ParseTanstackDbFilters(where, dbTable);

	return {
		orderBy: parsed_order_by,
		limit: limit,
		where: defaultWhere ? and(defaultWhere, parsed_where) : parsed_where
	};
}

const DrizzleFilters: Record<string, any> = {
	and,
	or,
	not,
	eq,
	ne,
	gt,
	gte,
	lt,
	lte,
	like,
	ilike,
	inArray,
	notInArray,
	isNull,
	isNotNull,
	between,
	notBetween,
	exists,
	notExists
};

type FilterKey = keyof typeof DrizzleFilters;

export function ParseTanstackDbFilters(filter: TsDbWhereNode | undefined, db_table: any): any {
	if (!filter) return undefined;

	if (filter.type == "func") {
		if (!(filter.name in DrizzleFilters)) {
			throw new Error(`Invalid func type: ${filter.name}`);
		}

		const filter_func = DrizzleFilters[filter.name as FilterKey];

		const args = filter.args.map((arg) => ParseTanstackDbFilters(arg, db_table));

		return filter_func(...args);
	}

	if (filter.type == "ref") {
		return db_table[filter.path[0]];
	}

	return filter.value;
}

export function ParseTanstackDbOrders(orders: ParsedOrderBy[] = [], db_table: any) {
	const order_by: SQL[] = [];

	for (let order of orders) {
		if (order.direction == "asc") {
			order_by.push(asc(db_table[order.field[0]]));
		} else {
			order_by.push(desc(db_table[order.field[0]]));
		}
	}

	return order_by;
}
