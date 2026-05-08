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
