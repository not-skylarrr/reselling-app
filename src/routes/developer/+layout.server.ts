import { auth } from "$lib/server/auth";
import { error, redirect } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ request }) => {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session) throw redirect(307, "/auth/login");

	if (session.user.role != "admin")
		throw error(403, { message: "You are not allowed to view this page" });

	return { session };
};
