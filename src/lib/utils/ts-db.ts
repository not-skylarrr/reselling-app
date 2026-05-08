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
} from "@tanstack/db";
import type { TsDbOrderByNode, TsDbWhereNode } from "../server/ts-db/validator";
import type { TableSearchFilter } from "$lib/components/items/table/lib/validators";

export function ParseSubsetOptions(subset: LoadSubsetOptions | undefined) {
	const parsed_where = ParseWhereFilters(subset?.where);

	const { sorts, limit } = parseLoadSubsetOptions({
		orderBy: subset?.orderBy,
		limit: subset?.limit,
	});

	return { where: parsed_where || undefined, sorts, limit };
}

export function ParseWhereFilters(where: any | undefined) {
	const parsed_where = parseWhereExpression(where, {
		handlers: {
			// ---------- LOGICAL ----------
			and: (...conditions): TsDbWhereNode => ({
				type: "func",
				name: "and",
				args: conditions,
			}),

			or: (...conditions): TsDbWhereNode => ({
				type: "func",
				name: "or",
				args: conditions,
			}),

			not: (condition): TsDbWhereNode => ({
				type: "func",
				name: "not",
				args: [condition],
			}),

			// ---------- EQUALITY ----------
			eq: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "eq",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			ne: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "ne",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			// ---------- COMPARISON ----------
			gt: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "gt",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			gte: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "gte",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			lt: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "lt",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			lte: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "lte",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			// ---------- STRING ----------
			like: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "like",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			ilike: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "ilike",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			// ---------- SET ----------
			in: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "inArray",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			notInArray: (field, value): TsDbWhereNode => ({
				type: "func",
				name: "notInArray",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value },
				],
			}),

			// ---------- NULL ----------
			isNull: (field): TsDbWhereNode => ({
				type: "func",
				name: "isNull",
				args: [{ type: "ref", path: field }],
			}),

			isNotNull: (field): TsDbWhereNode => ({
				type: "func",
				name: "isNotNull",
				args: [{ type: "ref", path: field }],
			}),

			// ---------- RANGE ----------
			between: (field, min, max): TsDbWhereNode => ({
				type: "func",
				name: "between",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value: min },
					{ type: "val", value: max },
				],
			}),

			notBetween: (field, min, max): TsDbWhereNode => ({
				type: "func",
				name: "notBetween",
				args: [
					{ type: "ref", path: field },
					{ type: "val", value: min },
					{ type: "val", value: max },
				],
			}),

			// ---------- SUBQUERY ----------
			exists: (condition): TsDbWhereNode => ({
				type: "func",
				name: "exists",
				args: [condition],
			}),

			notExists: (condition): TsDbWhereNode => ({
				type: "func",
				name: "notExists",
				args: [condition],
			}),
		},
	});

	return parsed_where;
}

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

type TanstackFilterKey = keyof typeof TanstackDbFilters;

type TanstackOrderByQueryNode = {
	expression: any;
	options: {
		direction: "asc" | "desc";
		nulls: "first" | "last";
		locale?: string;
		stringSort?: "lexical" | "locale";
	};
};

function ResolveRefPath(source: any, path: Array<string | number>) {
	let current = source;

	for (const segment of path) {
		if (current == null) return undefined;
		current = current[segment];
	}

	return current;
}

export function ParseAstSegToLiveQuery(filter: TsDbWhereNode | undefined, refs: any): any {
	if (!filter) return undefined;

	if (filter.type == "func") {
		if (filter.name == "exists" || filter.name == "notExists") {
			throw new Error(`Unsupported TanStack DB filter func type: ${filter.name}`);
		}

		if (!(filter.name in TanstackDbFilters)) {
			throw new Error(`Invalid TanStack DB func type: ${filter.name}`);
		}

		const filter_func = TanstackDbFilters[filter.name as TanstackFilterKey];
		const args = filter.args.map((arg) => ParseAstSegToLiveQuery(arg, refs));

		return filter_func(...args);
	}

	if (filter.type == "ref") {
		return ResolveRefPath(refs, filter.path);
	}

	return filter.value;
}

export function ParseTanstackDbOrderByNodeToQuery(
	order_by: TsDbOrderByNode,
	refs: any,
): TanstackOrderByQueryNode | undefined {
	if (order_by.field.length === 0) return undefined;

	const expression = ResolveRefPath(refs, order_by.field);
	if (expression == null) return undefined;

	return {
		expression,
		options: {
			direction: order_by.direction,
			nulls: order_by.nulls,
			locale: order_by.locale,
			stringSort: order_by.stringSort,
		},
	};
}

export function ParseTanstackDbOrderByNodesToQuery(
	order_by: TsDbOrderByNode[] = [],
	refs: any,
): TanstackOrderByQueryNode[] {
	return order_by
		.map((node) => ParseTanstackDbOrderByNodeToQuery(node, refs))
		.filter((node): node is TanstackOrderByQueryNode => Boolean(node));
}
