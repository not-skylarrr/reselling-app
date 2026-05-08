import z from "zod";
import { auth_procedure, router } from "../trpc/router";
import { TsDbOrderByNode, TsDbWhereNode } from "../ts-db/validator";
import { CreateDrizzleFilters } from "../ts-db/filters";
import {
	item_associations,
	items,
	new_item_association_schema,
	new_item_schema,
	update_item_association_schema,
	update_item_schema,
	type Item,
	type ItemAssociation,
} from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { GetSessionWorkspaceID } from "../auth";
import { db } from "../db";
import { TsDbFilterSchema, TsDbUpdateSchema } from "../ts-db/utils";
import { GetStatusInt } from "$lib/items/utils";

const association_router = router({
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{
				dbTable: item_associations,
				defaultWhere: eq(item_associations.workspace_id, workspace_id),
			},
		);

		const returned_associations = await db.query.item_associations.findMany({
			where,
			orderBy,
			limit,
		});

		return returned_associations;
	}),
	insert_ts_db: auth_procedure
		.input(z.array(new_item_association_schema))
		.mutation(async (opts) => {
			const { session } = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session);

			const inserted_items = await Promise.allSettled(
				opts.input.map(async (insertion) => {
					return db.insert(item_associations).values({
						...insertion,
						workspace_id: workspace_id,
					});
				}),
			);

			const failed_insertions = inserted_items.filter((r) => r.status == "rejected");

			return {
				failed_insertions: failed_insertions,
				insert_count: opts.input.length - failed_insertions.length,
			};
		}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_item_association_schema))
		.mutation(async (opts) => {
			const { session } = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session);

			const update_results = await Promise.allSettled(
				opts.input.map(async (update) => {
					const raw_update: Partial<ItemAssociation> = { ...update.changes };

					return db
						.update(item_associations)
						.set(raw_update)
						.where(
							and(
								eq(item_associations.id, update.id),
								eq(item_associations.workspace_id, workspace_id),
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
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		await db
			.delete(item_associations)
			.where(
				and(
					eq(item_associations.workspace_id, workspace_id),
					inArray(item_associations.id, opts.input),
				),
			);
	}),
});

export const items_router = router({
	get_ts_db: auth_procedure
		.input(
			z.object({
				where: TsDbWhereNode.optional(),
				orderBy: z.array(TsDbOrderByNode).optional(),
				limit: z.number().optional(),
			}),
		)
		.query(async (opts): Promise<Item[]> => {
			const session_data = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session_data.session);

			const { where, orderBy, limit } = CreateDrizzleFilters(
				{
					orderBy: opts.input.orderBy,
					where: opts.input.where,
					limit: opts.input.limit,
				},
				{ dbTable: items, defaultWhere: eq(items.workspace_id, workspace_id) },
			);

			const returned_items = await db.query.items.findMany({
				where,
				orderBy,
				limit,
			});

			return returned_items;
		}),
	insert_ts_db: auth_procedure.input(z.array(new_item_schema)).mutation(async (opts) => {
		const session_data = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session_data.session);

		const inserted_items = await Promise.allSettled(
			opts.input.map(async (insertion) => {
				return db.insert(items).values({
					...insertion,
					added_at: new Date(),
					workspace_id: workspace_id,
				});
			}),
		);

		const failed_insertions = inserted_items.filter((r) => r.status == "rejected");

		return {
			failed_insertions: failed_insertions,
			insert_count: opts.input.length - failed_insertions.length,
		};
	}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_item_schema))
		.mutation(async (opts) => {
			const session_data = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session_data.session);

			const update_results = await Promise.allSettled(
				opts.input.map(async (update) => {
					const raw_update: Partial<Item> = { ...update.changes };

					if (raw_update.status) {
						raw_update.status_int = GetStatusInt(raw_update.status);
					}

					return db
						.update(items)
						.set(raw_update)
						.where(and(eq(items.id, update.id), eq(items.workspace_id, workspace_id)));
				}),
			);

			const failed_updates = update_results.filter((r) => r.status == "rejected");

			return {
				failed_updates: failed_updates,
				update_count: opts.input.length - failed_updates.length,
			};
		}),
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const session_data = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session_data.session);

		await db
			.delete(items)
			.where(and(inArray(items.id, opts.input), eq(items.workspace_id, workspace_id)));
	}),

	assocations: association_router,
});
