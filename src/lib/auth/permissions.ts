import { createAccessControl } from "better-auth/plugins";
import { defaultStatements } from "better-auth/plugins/organization/access";

const access_control_statement = {
	...defaultStatements,
	bundles: ["create", "update", "delete"],
	items: ["create", "update", "delete"],
	labels: ["create", "view", "update", "delete"],
	locations: ["create", "view", "update", "delete"],
	organization: ["update", "delete"],
} as const;

export type AccessControlPermissions = typeof access_control_statement;

export type RolePermissionInput<
	T extends Record<string, readonly unknown[]> = AccessControlPermissions,
> = {
	[K in keyof T]?: T[K][number][];
};

export const org_ac = createAccessControl(access_control_statement);

export type AuthOrganizationRole = "member" | "admin" | "owner";

export const member_role = org_ac.newRole({
	bundles: ["create", "update"],
	items: ["create", "update"],
	labels: ["view"],
	locations: ["view"],
});

export const admin_role = org_ac.newRole({
	bundles: ["create", "update", "delete"],
	items: ["create", "update", "delete"],
	labels: ["create", "view", "update", "delete"],
	locations: ["create", "view", "update", "delete"],
	member: ["create", "update", "delete"],
	invitation: ["create", "cancel"],
	organization: ["update"],
});

export const owner_role = org_ac.newRole({
	bundles: ["create", "update", "delete"],
	items: ["create", "update", "delete"],
	labels: ["create", "view", "update", "delete"],
	locations: ["create", "view", "update", "delete"],
	member: ["create", "update", "delete"],
	invitation: ["create", "cancel"],
	organization: ["update", "delete"],
});
