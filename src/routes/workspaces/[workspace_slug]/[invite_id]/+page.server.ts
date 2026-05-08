import { auth } from "$lib/server/auth";
import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { db } from "$lib/server/db";

export const load: PageServerLoad = async ({ params, request, url }) => {
	const user_session = await auth.api.getSession({ headers: request.headers });
	if (!user_session) throw redirect(308, `/auth/login?ref=${encodeURIComponent(url.pathname)}`);

	const invitation = await db.query.invitation.findFirst({
		where: (table, ops) =>
			ops.and(ops.eq(table.id, params.invite_id), ops.eq(table.status, "pending")),
	});

	if (!invitation)
		throw error(404, {
			message: "The invitation you provided is invalid or does not exist.",
		});

	if (!invitation.org_slug)
		throw error(500, {
			message: "The invitation you provided is invalid or does not exist.",
		});

	const workspace = await db.query.organization.findFirst({
		where: (table, ops) => ops.eq(table.slug, invitation.org_slug!),
	});

	if (!workspace)
		throw error(404, {
			message: "Invitation does not exist",
		});

	return {
		workspace: {
			name: workspace.name,
			logo: workspace.logo,
		},
		invitation: invitation,
	};
};
