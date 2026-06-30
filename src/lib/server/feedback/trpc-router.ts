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
import { FormatDateStd } from "$lib/utils/formatting";
import { DISCORD_WEBHOOK_URL } from "$env/static/private";

export const feedback_router = router({
	create_new: auth_procedure.input(new_feedback_schema).mutation(async (opts) => {
		const user = opts.ctx.session_data.user;
		const feedback = opts.input;

		const payload = {
			embeds: [
				{
					title: feedback.title,
					description: feedback.content,
					footer: {
						text: `${FormatDateStd(new Date())} by ${user.name}`,
					},
				},
			],
		};

		const res = await fetch(DISCORD_WEBHOOK_URL, {
			method: "POST",
			body: JSON.stringify(payload),
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (res.status != 200) {
			console.log(res.statusText);
			return new Error("Failed to send feedback");
		}
	}),
});
