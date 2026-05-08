import { error, redirect } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import { GetPublicOrgDetails } from "$lib/server/workspace/utils";
import { auth, type ServerWorkspace } from "$lib/server/auth";
import type { AuthOrganizationRole } from "$lib/auth/permissions";

export type LeaveWorkspaceData = {
	user_org: ServerWorkspace;
	user_role: AuthOrganizationRole;
};

export const load: PageServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw redirect(308, "/auth/login");

	const [org, role_req] = await Promise.all([
		auth.api.getFullOrganization({ headers: request.headers }),
		auth.api.getActiveMemberRole({ headers: request.headers }),
	]);

	if (!org) throw redirect(308, "/auth/workspace/select");

	if (role_req.role == "owner")
		throw error(403, {
			message:
				"As the workspace owner, you cannot leave a workspace. You must delete the workspace instead.",
		});

	return {
		user_org: GetPublicOrgDetails(org),
		user_role: role_req.role,
	};
};

export const ssr = false;
