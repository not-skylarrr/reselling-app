import { db } from "../db";
import { user } from "../db/auth.schema";
import { admin_procedure, router } from "../trpc/router";
import { CreateDrizzleFilters } from "../ts-db/filters";
import { TsDbFilterSchema } from "../ts-db/utils";

const user_router = router({
	get_ts_db: admin_procedure.input(TsDbFilterSchema).query(async (opts) => {
		const { where, orderBy, limit } = CreateDrizzleFilters(
			{
				orderBy: opts.input.orderBy,
				where: opts.input.where,
				limit: opts.input.limit,
			},
			{ dbTable: user },
		);

		const users = await db.query.user.findMany({
			where,
			orderBy,
			limit,
		});

		return users;
	}),
});

export const admin_router = router({
	users: user_router,
});
