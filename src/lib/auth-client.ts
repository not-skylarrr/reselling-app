import { createAuthClient } from "better-auth/svelte";
import {
	adminClient,
	inferOrgAdditionalFields,
	organizationClient,
} from "better-auth/client/plugins";
import { admin_role, org_ac, owner_role, member_role } from "./auth/permissions";
import type { auth } from "./server/auth";

export const auth_client = createAuthClient({
	baseURL: import.meta.env.VITE_BASE_URL,
	plugins: [
		adminClient(),
		organizationClient({
			ac: org_ac,
			roles: {
				owner: owner_role,
				admin: admin_role,
				member: member_role,
			},
			schema: inferOrgAdditionalFields<typeof auth>(),
		}),
	],
	fetchOptions: {},
});
