import { GetSessionWorkspaceID } from "../auth";
import { db } from "../db";
import {
	item_listings,
	new_listing_schema,
	update_listing_schema,
	type ItemListing,
	type NewItemListing,
} from "../db/schema";
import { auth_procedure, router } from "../trpc/router";
import { CreateDrizzleFilters } from "../ts-db/filters";
import { TsDbFilterSchema, TsDbUpdateSchema } from "../ts-db/utils";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

export const listings_router = router({
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const session_data = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session_data.session);

		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{ dbTable: item_listings, defaultWhere: eq(item_listings.workspace_id, workspace_id) },
		);

		const returned_listings = await db.query.item_listings.findMany({
			where,
			orderBy,
			limit,
		});

		return returned_listings;
	}),
	insert_ts_db: auth_procedure.input(z.array(new_listing_schema)).mutation(async (opts) => {
		const session_data = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session_data.session);

		await db.insert(item_listings).values(
			opts.input.map(
				(listing): NewItemListing => ({
					...listing,
					workspace_id: workspace_id,
				}),
			),
		);
	}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_listing_schema))
		.mutation(async (opts) => {
			const session_data = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session_data.session);

			const update_results = await Promise.allSettled(
				opts.input.map(async (update) => {
					const raw_update: Partial<ItemListing> = { ...update.changes };

					return db
						.update(item_listings)
						.set(raw_update)
						.where(
							and(
								eq(item_listings.id, update.id),
								eq(item_listings.workspace_id, workspace_id),
							),
						);
				}),
			);

			const failed_updates = update_results.filter((r) => r.status == "rejected");

			return {
				failed_updates: failed_updates,
				update_count: opts.input.length - failed_updates.length,
			};
		}),
});
