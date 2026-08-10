import { admin_router } from "../admin/trpc-router";
import { bundles_router } from "../bundles/trpc-router";
import { feedback_router } from "../feedback/trpc-router";
import { fees_router } from "../fees/trpc-router";
import { items_router } from "../items/trpc-router";
import { listings_router } from "../listings/trpc-router";
import { release_notes_router } from "../release-notes/trpc-router";
import { workspace_router } from "../workspace/trpc-router";
import { router } from "./router";

export const app_router = router({
	admin: admin_router,
	bundles: bundles_router,
	items: items_router,
	listings: listings_router,
	fees: fees_router,
	workspace: workspace_router,
	feedback: feedback_router,
	release_notes: release_notes_router,
});

export type Router = typeof app_router;
