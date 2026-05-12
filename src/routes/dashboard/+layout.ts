import { session_state } from "$lib/utils/session.svelte";
import { redirect } from "@sveltejs/kit";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = ({ data }) => {
	if (!data.user_session.session.activeOrganizationId)
		throw redirect(308, "/auth/workspace/select");

	session_state.workspace_id = data.user_session.session.activeOrganizationId;
	session_state.user_id = data.user_session.user.id;

	return data;
};
