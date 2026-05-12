import { bundles_router } from "../bundles/trpc-router";
import { feedback_router } from "../feedback/trpc-router";
import { fees_router } from "../fees/trpc-router";
import { items_router } from "../items/trpc-router";
import { listings_router } from "../listings/trpc-router";
import { workspace_router } from "../workspace/trpc-router";
import { router } from "./router";

export const app_router = router({
	bundles: bundles_router,
	items: items_router,
	listings: listings_router,
	fees: fees_router,
	workspace: workspace_router,
	feedback: feedback_router,
});

export type Router = typeof app_router;
