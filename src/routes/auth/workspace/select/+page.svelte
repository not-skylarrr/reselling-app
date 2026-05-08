<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth_client } from "$lib/auth-client.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemMedia,
		ItemTitle,
	} from "$lib/components/ui/item/index";
	import { GetWorkspaceInitials } from "$lib/utils/workspace.js";
	import { LucideLogOut, LucidePlus } from "@lucide/svelte";

	const { data } = $props();

	let status = $state<"idle" | "pending">();

	async function HandleOrgSelect(org_id: string) {
		await auth_client.organization.setActive(
			{
				organizationId: org_id,
			},
			{
				onRequest: () => {
					status = "pending";
				},
				onSuccess: () => {
					status = "idle";
				},
				onError: () => {
					status = "idle";
				},
			},
		);

		goto("/dashboard");
	}

	function HandleSignOut() {
		auth_client.signOut({
			fetchOptions: {
				onSuccess: () => {
					goto("/auth/login");
				},
			},
		});
	}
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center gap-16 p-6">
	<div class="grid gap-2">
		<h1 class="text-center text-3xl font-semibold">Select Workspace</h1>
		<p class="text-center text-pretty text-muted-foreground">
			Select a workspace to start managing your reselling business
		</p>
	</div>

	{#if data.organizations.length > 0}
		<div class="flex w-full max-w-128 flex-col gap-2">
			{#each data.organizations as org (org.id)}
				<Item variant="outline">
					<ItemMedia variant="icon">
						<div
							class="flex size-12 items-center justify-center rounded-lg bg-muted text-muted-foreground"
						>
							<p>{GetWorkspaceInitials(org.name)}</p>
						</div>
					</ItemMedia>

					<ItemContent>
						<ItemTitle class="text-base font-medium">{org.name}</ItemTitle>
						<ItemDescription>Some meta text</ItemDescription>
					</ItemContent>

					<ItemActions>
						<Button
							disabled={status == "pending"}
							onclick={() => HandleOrgSelect(org.id)}
							variant="outline">Open Workspace</Button
						>
					</ItemActions>
				</Item>
			{/each}
		</div>
	{/if}

	<div class="flex w-full max-w-92 flex-col-reverse items-center gap-3 md:flex-row">
		<Button class="h-10 w-full md:flex-1" onclick={HandleSignOut} variant="outline"
			><LucideLogOut /> Sign Out</Button
		>

		<Button class="h-10 w-full md:flex-1" href="/auth/workspace/create"
			><LucidePlus /> New Workspace</Button
		>
	</div>
</div>
