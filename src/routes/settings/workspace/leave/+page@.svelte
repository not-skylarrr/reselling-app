<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth_client } from "$lib/auth-client";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import {
		SettingsDescription,
		SettingsHeader,
		SettingsLayout,
		SettingsTitle,
	} from "$lib/components/settings/layout";
	import { Button } from "$lib/components/ui/button";
	import { LucideCheck, LucideX } from "@lucide/svelte";
	import type { LeaveWorkspaceData } from "./+page.server";

	let { data }: { data: LeaveWorkspaceData } = $props();

	let loading = $state(false);

	function HandleAccept() {
		const org_id = data.user_org.id;
		if (!org_id) return;

		auth_client.organization.leave({
			organizationId: org_id,
			fetchOptions: {
				onRequest: () => {
					loading = true;
				},
				onError: () => {
					loading = false;
				},
				onSuccess: () => {
					goto("/auth/workspace/select");
				},
			},
		});
	}
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center gap-12 p-6">
	<div class="grid gap-2">
		<h1 class="text-center text-3xl font-semibold">Leave Workspace</h1>
		<p class="text-center text-pretty text-muted-foreground">
			You will lose access to all workspace data from "{data.user_org.name}"
		</p>
	</div>

	<div class="flex w-full max-w-92 flex-col-reverse items-center gap-3 md:flex-row">
		<Button
			class="h-10 w-full md:flex-1"
			href="/settings"
			disabled={loading == true}
			variant="outline"
		>
			<LucideX /> Cancel
		</Button>

		<Button class="h-10 w-full md:flex-1" disabled={loading == true} onclick={HandleAccept}>
			<LucideCheck /> Leave Workspace
		</Button>
	</div>
</div>
