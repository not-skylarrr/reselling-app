import type { Context } from "./context";
import { auth } from "../auth";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";

export const t = initTRPC.context<Context>().create({
	transformer: superjson
});

export const router = t.router;

const auth_middleware = t.middleware(async ({ ctx, next }) => {
	const session = await auth.api.getSession({ headers: ctx.headers });
	if (!session) throw new TRPCError({ code: "UNAUTHORIZED" });

	return next({
		ctx: {
			...ctx,
			session_data: session
		}
	});
});

export const auth_procedure = t.procedure.use(auth_middleware);
