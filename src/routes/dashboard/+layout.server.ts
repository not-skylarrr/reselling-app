import { auth } from "$lib/server/auth";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import { DoesUserHaveWorkspaceMembership } from "$lib/server/workspace/utils";

export const load: LayoutServerLoad = async ({ request }) => {
	const user_session = await auth.api.getSession({ headers: request.headers });
	if (!user_session) throw redirect(308, "/auth/login");

	if (user_session.session.activeOrganizationId) {
		const user_role = await auth.api.getActiveMemberRole({ headers: request.headers });

		return { user_session, user_role: user_role.role };
	}

	const has_org_membership = await DoesUserHaveWorkspaceMembership(user_session.user.id);
	if (!has_org_membership) throw redirect(308, "/auth/workspace/create");

	throw redirect(308, "/auth/workspace/select");
};
