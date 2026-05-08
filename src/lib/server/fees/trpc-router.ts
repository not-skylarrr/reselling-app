import z from "zod";
import { auth_procedure, router } from "../trpc/router";
import { TsDbOrderByNode, TsDbWhereNode } from "../ts-db/validator";
import { CreateDrizzleFilters } from "../ts-db/filters";
import {
	item_fees,
	items,
	new_item_fee_schema,
	new_item_schema,
	update_item_fee_schema,
	type FullItem,
	type Item,
	type ItemFee,
} from "../db/schema";
import { and, eq } from "drizzle-orm";
import { GetSessionWorkspaceID } from "../auth";
import { db } from "../db";
import { TsDbUpdateSchema } from "../ts-db/utils";

export const fees_router = router({
	get_ts_db: auth_procedure
		.input(
			z.object({
				where: TsDbWhereNode.optional(),
				orderBy: z.array(TsDbOrderByNode).optional(),
				limit: z.number().optional(),
			}),
		)
		.query(async (opts): Promise<ItemFee[]> => {
			const session_data = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session_data.session);

			const { where, orderBy, limit } = CreateDrizzleFilters(
				{
					orderBy: opts.input.orderBy,
					where: opts.input.where,
					limit: opts.input.limit,
				},
				{ dbTable: item_fees, defaultWhere: eq(item_fees.workspace_id, workspace_id) },
			);

			const returned_items = await db.query.item_fees.findMany({
				where,
				orderBy,
				limit,
			});

			return returned_items;
		}),
	insert_ts_db: auth_procedure.input(z.array(new_item_fee_schema)).mutation(async (opts) => {
		const session_data = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session_data.session);

		const inserted_items = await Promise.allSettled(
			opts.input.map(async (insertion) => {
				return db.insert(item_fees).values({
					...insertion,
					workspace_id: workspace_id,
				});
			}),
		);

		console.log(inserted_items);

		const failed_insertions = inserted_items.filter((r) => r.status == "rejected");

		return {
			failed_insertions: failed_insertions,
			insert_count: opts.input.length - failed_insertions.length,
		};
	}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_item_fee_schema))
		.mutation(async (opts) => {
			const session_data = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session_data.session);

			const update_results = await Promise.allSettled(
				opts.input.map(async (update) => {
					const raw_update: Partial<ItemFee> = { ...update.changes };

					return db
						.update(item_fees)
						.set(raw_update)
						.where(and(eq(item_fees.id, update.id), eq(item_fees.workspace_id, workspace_id)));
				}),
			);

			const failed_updates = update_results.filter((r) => r.status == "rejected");

			return {
				failed_updates: failed_updates,
				update_count: opts.input.length - failed_updates.length,
			};
		}),
});
