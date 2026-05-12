<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuSub,
		DropdownMenuSubContent,
		DropdownMenuSubTrigger,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import {
		LucideChevronsUpDown,
		LucideLogOut,
		LucideSettings,
		LucideBuilding,
		LucideCheck,
		LucidePlus,
	} from "@lucide/svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import { WithReturn } from "$lib/utils/navigation";
	import { CurrentSessionQuery, UserWorkspacesQuery } from "$lib/queries/session";
	import { auth_client } from "$lib/auth-client";
	import { goto } from "$app/navigation";
	import type { Snippet } from "svelte";
	import Hashvatar from "$lib/components/utils/Hashvatar.svelte";

	type Props = {
		trigger: Snippet<[Record<string, unknown>]>;
	};

	let { trigger }: Props = $props();

	const user_session_query = createQuery(() => CurrentSessionQuery);
	const user_workspaces_query = createQuery(() => UserWorkspacesQuery);

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

<DropdownMenu>
	<DropdownMenuTrigger>
		{#snippet child({ props })}
			{@render trigger(props)}
		{/snippet}
	</DropdownMenuTrigger>
	<DropdownMenuContent align="end" class="w-64">
		<DropdownMenuItem>
			{#snippet child({ props })}
				<a {...props} href="/settings" use:WithReturn>
					<LucideSettings /> Settings
				</a>
			{/snippet}
		</DropdownMenuItem>

		<DropdownMenuSeparator />

		<DropdownMenuSub>
			<DropdownMenuSubTrigger>
				<LucideBuilding /> Switch Workspace
			</DropdownMenuSubTrigger>
			<DropdownMenuSubContent class="w-56">
				{#if user_workspaces_query.data && user_session_query.data}
					{#each user_workspaces_query.data as workspace (workspace.id)}
						<DropdownMenuItem>
							{#snippet child({ props })}
								<a {...props} href={`/auth/workspace/load/${workspace.id}`} use:WithReturn>
									<Hashvatar hash={workspace.name} size={16} />

									<p class="flex-1">{workspace.name}</p>

									{#if user_session_query.data?.session.activeOrganizationId == workspace.id}
										<LucideCheck />
									{/if}
								</a>
							{/snippet}
						</DropdownMenuItem>
					{/each}

					<DropdownMenuSeparator />

					<DropdownMenuItem class="text-muted-foreground">
						{#snippet child({ props })}
							<a {...props} href="/auth/workspace/create">
								<LucidePlus /> Create New Workspace
							</a>
						{/snippet}
					</DropdownMenuItem>
				{/if}
			</DropdownMenuSubContent>
		</DropdownMenuSub>

		<DropdownMenuItem onSelect={HandleSignOut} variant="destructive"
			><LucideLogOut /> Sign Out</DropdownMenuItem
		>
	</DropdownMenuContent>
</DropdownMenu>
