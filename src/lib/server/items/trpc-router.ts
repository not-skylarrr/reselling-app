import z from "zod";
import { auth_procedure, router } from "../trpc/router";
import { TsDbOrderByNode, TsDbWhereNode } from "../ts-db/validator";
import { CreateDrizzleFilters } from "../ts-db/filters";
import {
	item_associations,
	item_metadata,
	items,
	label_join_table,
	new_item_association_schema,
	new_item_metadata_schema,
	new_item_schema,
	update_item_association_schema,
	update_item_metadata_schema,
	update_item_schema,
	type Item,
	type ItemAssociation,
	type ItemMetadata,
} from "../db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { GetSessionWorkspaceID } from "../auth";
import { db } from "../db";
import { TsDbFilterSchema, TsDbUpdateSchema } from "../ts-db/utils";
import { GetStatusInt } from "$lib/items/utils";
import { isBefore, subDays } from "date-fns";

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

		await db
			.delete(label_join_table)
			.where(
				and(
					eq(label_join_table.workspace_id, workspace_id),
					inArray(label_join_table.item_id, opts.input),
				),
			);
	}),
});

const metadata_router = router({
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
		const { where, orderBy, limit } = CreateDrizzleFilters(
			{ orderBy: opts.input.orderBy, where: opts.input.where, limit: opts.input.limit },
			{ dbTable: item_metadata, defaultWhere: eq(item_metadata.workspace_id, workspace_id) },
		);

		return db.query.item_metadata.findMany({ where, orderBy, limit });
	}),
	insert_ts_db: auth_procedure
		.input(z.array(new_item_metadata_schema))
		.mutation(async (opts) => {
			const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
			const insert_results = await Promise.allSettled(
				opts.input.map((insertion) =>
					db.insert(item_metadata).values({ ...insertion, workspace_id }),
				),
			);
			const failed_insertions = insert_results.filter((result) => result.status === "rejected");

			return { failed_insertions, insert_count: opts.input.length - failed_insertions.length };
		}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_item_metadata_schema))
		.mutation(async (opts) => {
			const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
			const update_results = await Promise.allSettled(
				opts.input.map((update) =>
					db
						.update(item_metadata)
						.set(update.changes as Partial<ItemMetadata>)
						.where(
							and(
								eq(item_metadata.id, update.id),
								eq(item_metadata.workspace_id, workspace_id),
							),
						),
				),
			);
			const failed_updates = update_results.filter((result) => result.status === "rejected");

			return { failed_updates, update_count: opts.input.length - failed_updates.length };
		}),
	delete_ts_db: auth_procedure.input(z.array(z.string())).mutation(async (opts) => {
		const { workspace_id } = GetSessionWorkspaceID(opts.ctx.session_data.session);
		await db
			.delete(item_metadata)
			.where(
				and(
					inArray(item_metadata.id, opts.input),
					eq(item_metadata.workspace_id, workspace_id),
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

			console.log(opts.input);

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

	export_items_csv: auth_procedure.query(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const workspace_items = await db.query.items.findMany({
			where: (table, ops) => ops.eq(table.workspace_id, workspace_id),
			with: {
				associations: true,
			},
		});

		const mapped_rows = workspace_items.map((item) => ({}));
	}),

	auto_archive_items: auth_procedure.mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const archive_date = subDays(new Date(), 7);

		const non_archived_sold_items = await db.query.items.findMany({
			where: (table, ops) =>
				ops.and(
					ops.eq(table.archived, false),
					ops.gte(table.status_int, 2),
					ops.eq(table.workspace_id, workspace_id),
				),
			with: {
				listings: {
					where: (table, ops) => ops.eq(table.status, "sold"),
				},
			},
		});

		const eligible_items = non_archived_sold_items.filter((item) => {
			if (item.listings.length == 0) return false;

			const sold_listing = item.listings[0];

			// Should not be possible but ignore the item if so
			if (!sold_listing.ended_at) return false;

			return isBefore(sold_listing.ended_at, archive_date);
		});

		const ids_to_archive = eligible_items.map((item) => item.id);

		await db
			.update(items)
			.set({ archived: true })
			.where(and(inArray(items.id, ids_to_archive), eq(items.workspace_id, workspace_id)));

		return ids_to_archive.length;
	}),

	assocations: association_router,
	metadata: metadata_router,
});
