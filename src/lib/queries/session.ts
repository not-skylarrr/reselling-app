import { auth_client } from "$lib/auth-client";
import { queryOptions } from "@tanstack/svelte-query";

export const CurrentSessionQuery = queryOptions({
	queryKey: ["user-session", "session"],
	queryFn: async () => {
		const session = await auth_client.getSession();

		if (session.error) {
			console.error(session.error);

			throw new Error("Failed to get current session");
		}

		return session.data;
	},
});

export const UserWorkspacesQuery = queryOptions({
	queryKey: ["user-session", "workspaces"],
	queryFn: async () => {
		const workspaces = await auth_client.organization.list();

		if (workspaces.error) {
			console.error(workspaces.error);

			throw new Error("Failed to get user workspaces");
		}

		return workspaces.data;
	},
});

export const UserOrgDataQuery = queryOptions({
	queryKey: ["user-session", "org-data"],
	queryFn: async () => {
		const [session_req, org_req, role_req] = await Promise.all([
			auth_client.getSession(),
			auth_client.organization.getFullOrganization(),
			auth_client.organization.getActiveMemberRole(),
		]);

		if (session_req.error) throw new Error("Failed to get session");
		if (org_req.error) throw new Error("Failed to get org");
		if (!role_req.data) throw new Error("Failed to get role");

		return { session: session_req.data, org: org_req.data, role: role_req.data.role };
	},
});
