<script>
	import { auth_client } from "$lib/auth-client";
	import { Avatar, AvatarFallback } from "$lib/components/ui/avatar";
	import { Button } from "$lib/components/ui/button";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import {
		SidebarHeader,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
	} from "$lib/components/ui/sidebar";
	import Skeleton from "$lib/components/ui/skeleton/skeleton.svelte";
	import { LucideChevronsUpDown } from "@lucide/svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import SidebarHeaderDropdown from "./SidebarHeaderDropdown.svelte";
	import { UserOrgDataQuery } from "$lib/queries/session";
	import Hashvatar from "$lib/components/utils/Hashvatar.svelte";

	const org_query = createQuery(() => UserOrgDataQuery);
</script>

<SidebarHeader>
	<SidebarMenu>
		<SidebarMenuItem>
			<SidebarHeaderDropdown>
				{#snippet trigger(props)}
					<SidebarMenuButton {...props} class="data-[state=open]:bg-sidebar-accent" size="lg">
						{#snippet child({ props })}
							<div {...props}>
								{#if org_query.status == "pending"}
									<Skeleton class="h-8 w-8 rounded-lg bg-sidebar-accent" />

									<div class="flex flex-1 flex-col gap-1">
										<Skeleton class="h-3.5 w-full rounded-lg bg-sidebar-accent" />
										<Skeleton class="h-2.5 w-24 rounded-lg bg-sidebar-accent" />
									</div>

									<LucideChevronsUpDown />
								{:else if org_query.status == "error"}
									<div class="h-8 w-8 rounded-lg bg-destructive"></div>

									<p class="flex-1 text-sm text-destructive">Failed to get session</p>

									<LucideChevronsUpDown />
								{:else}
									<Hashvatar class="size-8 shrink-0" hash={org_query.data.org.name} />

									<div class="grid flex-1 overflow-hidden">
										<p class="line-clamp-1">{org_query.data.org.name}</p>
										<p class="text-xs leading-none text-muted-foreground capitalize">
											{org_query.data.role}
										</p>
									</div>

									<LucideChevronsUpDown />
								{/if}
							</div>
						{/snippet}
					</SidebarMenuButton>
				{/snippet}
			</SidebarHeaderDropdown>
		</SidebarMenuItem>
	</SidebarMenu>
</SidebarHeader>
