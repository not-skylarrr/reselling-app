import type { ServerInvitation, ServerWorkspace, ServerWorkspaceMember } from "../auth";
import { db } from "../db";

export async function DoesUserHaveWorkspaceMembership(user_id: string) {
	const workspaces = await db.query.member.findMany({
		where: (table, ops) => ops.eq(table.userId, user_id),
	});

	return workspaces.length > 0;
}

type FullOrg = ServerWorkspace & {
	members: ServerWorkspaceMember[];
	invitations: ServerInvitation[];
};

export function GetPublicOrgDetails(full_org: FullOrg): ServerWorkspace {
	return {
		id: full_org.id,
		name: full_org.name,
		slug: full_org.slug,
		createdAt: full_org.createdAt,
		logo: full_org.logo,
		metadata: full_org.metadata,
	};
}
