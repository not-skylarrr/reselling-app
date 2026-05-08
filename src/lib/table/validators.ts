import { z } from "zod";

export const table_search_filter_schema = z.object({
	id: z.string(),
	key: z.string(),
	silent: z.boolean().optional(),
	required: z.boolean().optional(),
	defaultOpen: z.boolean().optional(),
	value: z.object({
		operator: z.string(),
		value: z.unknown(),
	}),
});

export type TableSearchFilter = z.infer<typeof table_search_filter_schema>;
