import z from "zod";

export const TsDbOrderByNode = z.object({
	direction: z.union([z.literal("asc"), z.literal("desc")]),
	field: z.array(z.union([z.string(), z.number()])),
	locale: z.string().optional(),
	nulls: z.union([z.literal("first"), z.literal("last")]),
	stringSort: z.union([z.literal("lexical"), z.literal("locale")]).optional()
});

export type TsDbOrderByNode = z.infer<typeof TsDbOrderByNode>;

const TsDbWhereFuncParser = z.object({
	type: z.literal("func"),
	name: z.string(),
	get args() {
		return z.array(z.union([TsDbWhereFuncParser, TsDbWhereRefParser, TsDbWhereValParser]));
	}
});

const TsDbWhereRefParser = z.object({
	type: z.literal("ref"),
	path: z.array(z.string())
});

const TsDbWhereValParser = z.object({
	type: z.literal("val"),
	value: z.any()
});

export const TsDbWhereNode = z.union([
	TsDbWhereFuncParser,
	TsDbWhereRefParser,
	TsDbWhereValParser
]);

export type TsDbWhereFuncNode = z.infer<typeof TsDbWhereFuncParser>;
export type TsDbWhereRefNode = z.infer<typeof TsDbWhereRefParser>;
export type TsDbWhereValNode = z.infer<typeof TsDbWhereValParser>;

export type TsDbWhereNode = z.infer<typeof TsDbWhereNode>;
