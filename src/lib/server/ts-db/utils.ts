import z, { ZodObject, type ZodRawShape } from "zod";
import { TsDbOrderByNode, TsDbWhereNode } from "./validator";

export const TsDbFilterSchema = z.object({
	where: TsDbWhereNode.optional(),
	orderBy: z.array(TsDbOrderByNode).optional(),
	limit: z.number().optional(),
});

export function TsDbUpdateSchema<V extends ZodRawShape>(validator: ZodObject<V>) {
	return z.array(
		z.object({
			id: z.string(),
			changes: validator.partial(),
		}),
	);
}
