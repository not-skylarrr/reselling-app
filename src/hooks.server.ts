import { sequence } from "@sveltejs/kit/hooks";
import { app_router } from "$lib/server/trpc/app-router";
import { createContext } from "$lib/server/trpc/context";
import { auth } from "$lib/server/auth";
import { svelteKitHandler } from "better-auth/svelte-kit";
import { building } from "$app/environment";
import type { Handle, ServerInit } from "@sveltejs/kit";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { createInitialModeExpression } from "mode-watcher";

const AuthHandle: Handle = async ({ event, resolve }) => {
	return svelteKitHandler({ event, resolve, auth, building });
};

const TrpcHandle: Handle = async ({ event, resolve }) => {
	if (!event.url.pathname.startsWith("/trpc")) {
		return resolve(event);
	}

	return fetchRequestHandler({
		router: app_router,
		req: event.request,
		endpoint: "/trpc",
		createContext: () => createContext(event),
		allowMethodOverride: true,
	});
};

const ThemeHandle: Handle = async ({ event, resolve }) => {
	return resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace(
				"%modewatcher.snippet%",
				createInitialModeExpression({ defaultMode: "light" }),
			),
	});
};

export const handle = sequence(ThemeHandle, AuthHandle, TrpcHandle);

export const init: ServerInit = async () => {};
