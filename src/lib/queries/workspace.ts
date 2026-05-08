import { trpc_client } from "$lib/trpc/client";
import { ParseSubsetOptions, ParseWhereFilters } from "$lib/utils/ts-db";
import { queryOptions } from "@tanstack/svelte-query";

export const GetWorkspaceLocationsQuery = queryOptions({
	queryKey: ["user-session", "workspace-locations", "ts-db"],
	queryFn: async (ctx) => {
		const { limit, sorts, where } = ParseSubsetOptions(ctx.meta?.loadSubsetOptions);

		const labels = await trpc_client.workspace.locations.get_ts_db.query({
			where: where,
			orderBy: sorts,
			limit: limit,
		});

		return labels;
	},
});
