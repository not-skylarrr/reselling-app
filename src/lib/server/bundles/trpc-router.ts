import { and, eq, inArray } from "drizzle-orm";
import { auth, GetSessionWorkspaceID } from "../auth";
import { db } from "../db";
import {
	item_bundles,
	bundle_items,
	new_item_bundle_schema,
	update_item_bundle_schema,
	type ItemBundle,
	new_bundle_item_schema,
	update_bundle_item_schema,
	type BundleItem,
} from "../db/schema";
import { auth_procedure, router } from "../trpc/router";
import { CreateDrizzleFilters } from "../ts-db/filters";
import { TsDbFilterSchema, TsDbUpdateSchema } from "../ts-db/utils";
import z from "zod";
import { TRPCError } from "@trpc/server";

const bundle_items_router = router({
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{ dbTable: bundle_items, defaultWhere: eq(item_bundles.workspace_id, workspace_id) },
		);

		const returned_items = await db.query.bundle_items.findMany({
			where,
			orderBy,
			limit,
		});

		return returned_items;
	}),
	insert_ts_db: auth_procedure.input(z.array(new_bundle_item_schema)).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const inserted_bundle_items = await Promise.allSettled(
			opts.input.map(async (insertion) => {
				return db.insert(bundle_items).values({
					...insertion,
					workspace_id: workspace_id,
				});
			}),
		);

		const failed_insertions = inserted_bundle_items.filter((r) => r.status == "rejected");

		return {
			failed_insertions: failed_insertions,
			insert_count: opts.input.length - failed_insertions.length,
		};
	}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_bundle_item_schema))
		.mutation(async (opts) => {
			const session_data = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session_data.session);

			const update_results = await Promise.allSettled(
				opts.input.map(async (update) => {
					const raw_update: Partial<BundleItem> = { ...update.changes };

					return db
						.update(bundle_items)
						.set(raw_update)
						.where(
							and(eq(bundle_items.id, update.id), eq(bundle_items.workspace_id, workspace_id)),
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
		const session_data = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session_data.session);

		await db
			.delete(bundle_items)
			.where(
				and(inArray(bundle_items.id, opts.input), eq(bundle_items.workspace_id, workspace_id)),
			);
	}),
});

export const bundles_router = router({
	get_ts_db: auth_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{ dbTable: item_bundles, defaultWhere: eq(item_bundles.workspace_id, workspace_id) },
		);

		const returned_items = await db.query.item_bundles.findMany({
			where,
			orderBy,
			limit,
		});

		return returned_items;
	}),
	insert_ts_db: auth_procedure.input(z.array(new_item_bundle_schema)).mutation(async (opts) => {
		const { session } = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session);

		const { success: has_permission } = await auth.api.hasPermission({
			body: {
				permissions: {
					bundles: ["create"],
				},
			},
			headers: opts.ctx.headers,
		});

		if (!has_permission)
			throw new TRPCError({
				code: "FORBIDDEN",
				message: "You do not have permission to create a bundle",
			});

		const inserted_bundles = await Promise.allSettled(
			opts.input.map(async (insertion) => {
				return db.insert(item_bundles).values({
					...insertion,
					workspace_id: workspace_id,
				});
			}),
		);

		const failed_insertions = inserted_bundles.filter((r) => r.status == "rejected");

		return {
			failed_insertions: failed_insertions,
			insert_count: opts.input.length - failed_insertions.length,
		};
	}),
	update_ts_db: auth_procedure
		.input(TsDbUpdateSchema(update_item_bundle_schema))
		.mutation(async (opts) => {
			const session_data = opts.ctx.session_data;

			const { workspace_id } = GetSessionWorkspaceID(session_data.session);

			const update_results = await Promise.allSettled(
				opts.input.map(async (update) => {
					const raw_update: Partial<ItemBundle> = { ...update.changes };

					return db
						.update(item_bundles)
						.set(raw_update)
						.where(
							and(eq(item_bundles.id, update.id), eq(item_bundles.workspace_id, workspace_id)),
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
		const session_data = opts.ctx.session_data;

		const { workspace_id } = GetSessionWorkspaceID(session_data.session);

		await db
			.delete(item_bundles)
			.where(
				and(inArray(item_bundles.id, opts.input), eq(item_bundles.workspace_id, workspace_id)),
			);
	}),

	items: bundle_items_router,
});
