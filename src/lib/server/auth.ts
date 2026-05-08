import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "$lib/server/db";
import { admin, organization } from "better-auth/plugins";
import { BETTER_AUTH_SECRET } from "$env/static/private";
import { PUBLIC_ORIGIN } from "$env/static/public";
import { admin_role, org_ac, owner_role, member_role } from "../auth/permissions";
import { getRequestEvent } from "$app/server";
import { sveltekitCookies } from "better-auth/svelte-kit";

export const auth = betterAuth({
	baseURL: PUBLIC_ORIGIN,
	database: drizzleAdapter(db, {
		provider: "pg",
	}),
	emailAndPassword: {
		enabled: true,
	},
	plugins: [
		admin(),
		organization({
			ac: org_ac,
			organizationHooks: {
				beforeCreateInvitation: async ({ invitation, organization }) => {
					return {
						data: {
							...invitation,
							org_name: organization.name,
							org_slug: organization.slug,
						},
					};
				},
			},
			roles: {
				owner: owner_role,
				admin: admin_role,
				member: member_role,
			},
			schema: {
				invitation: {
					additionalFields: {
						org_name: { type: "string", required: false, returned: true, input: false },
						org_slug: { type: "string", required: false, returned: true, input: false },
					},
				},
			},
		}),
		sveltekitCookies(getRequestEvent),
	],
	secret: BETTER_AUTH_SECRET,
});

export type ServerUser = (typeof auth.$Infer.Session)["user"];
export type ServerSession = (typeof auth.$Infer.Session)["session"];
export type ServerWorkspace = typeof auth.$Infer.Organization;
export type ServerInvitation = typeof auth.$Infer.Invitation;
export type ServerWorkspaceMember = typeof auth.$Infer.Member;

export function GetSessionWorkspaceID(session: ServerSession) {
	if (!session.activeOrganizationId) throw new Error("No active organization on session");

	return { workspace_id: session.activeOrganizationId };
}
