import { auth } from "$lib/server/auth";
import { redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";
import {
	DoesUserHaveWorkspaceMembership,
	GetPublicOrgDetails,
} from "$lib/server/workspace/utils";

export const load: LayoutServerLoad = async ({ request }) => {
	const user_session = await auth.api.getSession({ headers: request.headers });
	if (!user_session) throw redirect(308, "/auth/login");

	if (user_session.session.activeOrganizationId) {
		const [full_org, org_role] = await Promise.all([
			auth.api.getFullOrganization({ headers: request.headers }),
			auth.api.getActiveMemberRole({ headers: request.headers }),
		]);

		if (!full_org) throw redirect(308, "/auth/workspace/select");

		return { org_role: org_role.role, user_org: GetPublicOrgDetails(full_org), user_session };
	}

	const has_org_membership = await DoesUserHaveWorkspaceMembership(user_session.user.id);
	if (!has_org_membership) throw redirect(308, "/auth/workspace/create");

	throw redirect(308, "/auth/workspace/select");
};
