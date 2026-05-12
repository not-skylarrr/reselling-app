import z from "zod";
import { admin_procedure, auth_procedure, router } from "../trpc/router";
import { TsDbFilterSchema, TsDbUpdateSchema } from "../ts-db/utils";
import {
	feedback_table,
	new_feedback_schema,
	update_feedback_schema,
	type UserFeedback,
} from "../db/schema";
import { db } from "../db";
import { CreateDrizzleFilters } from "../ts-db/filters";
import { eq } from "drizzle-orm";

export const feedback_router = router({
	insert_ts_db: auth_procedure.input(z.array(new_feedback_schema)).mutation(async (opts) => {
		await db
			.insert(feedback_table)
			.values(
				opts.input.map((feedback) => ({
					...feedback,
					created_by: opts.ctx.session_data.user.id,
				})),
			);
	}),
	get_ts_db: admin_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{ dbTable: feedback_table },
		);

		const feedback = await db.query.feedback_table.findMany({
			where,
			orderBy,
			limit,
		});

		return feedback;
	}),
	update_ts_db: admin_procedure
		.input(TsDbUpdateSchema(update_feedback_schema))
		.mutation(async (opts) => {
			const update_results = await Promise.allSettled(
				opts.input.map(async (update) => {
					const raw_update: Partial<UserFeedback> = { ...update.changes };

					return db
						.update(feedback_table)
						.set(raw_update)
						.where(eq(feedback_table.id, update.id));
				}),
			);

			const failed_updates = update_results.filter((r) => r.status == "rejected");

			return {
				failed_updates: failed_updates,
				update_count: opts.input.length - failed_updates.length,
			};
		}),
});
