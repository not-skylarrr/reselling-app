<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth_client } from "$lib/auth-client";
	import { query_client } from "$lib/queries/client.svelte.js";
	import { UserOrgDataQuery } from "$lib/queries/session.js";
	import { GetNavigationReturnUrl } from "$lib/utils/navigation";
	import { LucideLoaderCircle } from "@lucide/svelte";
	import { onMount } from "svelte";
	import { toast } from "svelte-sonner";

	let { data } = $props();

	const PersonalizedRedirects: Record<string, string> = {
		"inventory-item": "/dashboard/inventory",
		"bundle-view": "/dashboard/bundles",
	};

	// Def a bad name, but gets the id of views that are workspace context specific
	// Allows a redirect to a view that wont error out when permissions change
	function GetPersonalizedURLId(url: string) {
		if (/\/dashboard\/inventory\/items\/[a-zA-Z0-9]*/.test(url)) {
			return "inventory-item";
		}

		if (/\/dashboard\/bundles\/[a-zA-Z0-9]*/.test(url)) {
			return "bundle-view";
		}

		return null;
	}

	async function SetActiveWorkspace(workspace_id: string) {
		const result = await auth_client.organization.setActive({
			organizationId: workspace_id,
		});

		if (result.error) {
			console.error(result.error);

			return toast.error("Failed to load workspace. Please sign out and try again...");
		}

		query_client.invalidateQueries({ queryKey: ["user-session"] });

		await query_client.prefetchQuery(UserOrgDataQuery);

		const return_path = GetNavigationReturnUrl("/dashboard");

		const view_id = GetPersonalizedURLId(return_path);

		if (view_id) {
			const redirect_url = PersonalizedRedirects[view_id];

			if (redirect_url) {
				goto(redirect_url);
				return;
			}
		}

		goto(return_path);
	}

	onMount(() => {
		SetActiveWorkspace(data.workspace_id);
	});
</script>

<div class="flex flex-col items-center justify-center gap-2">
	<LucideLoaderCircle class="size-8 animate-spin" />
	<p class="text-sm">Loading Workspace</p>
</div>
