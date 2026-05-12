<script lang="ts">
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarHeader,
		SidebarMenuButton,
		SidebarMenuItem,
	} from "$lib/components/ui/sidebar";
	import SidebarMenu from "$lib/components/ui/sidebar/sidebar-menu.svelte";
	import {
		LucideCircleUser,
		LucideSettings2,
		LucideTags,
		LucidePackage,
		LucideChevronLeft,
		LucideBuilding,
		LucideDownload,
		LucideArrowLeftRight,
		LucideLogOut,
	} from "@lucide/svelte";
	import DashboardSidebarHeader from "./DashboardSidebarHeader.svelte";
	import { Button, buttonVariants } from "$lib/components/ui/button";
	import { NavigationReturn } from "$lib/utils/navigation";
	import type { AuthOrganizationRole } from "$lib/auth/permissions";
	import { auth_client } from "$lib/auth-client";
	import type { ServerWorkspace } from "$lib/server/auth";
	import { cn } from "$lib/utils";

	type Props = {
		user_org: ServerWorkspace;
		user_role: AuthOrganizationRole;
	};

	let { user_org, user_role }: Props = $props();

	const can_manage_labels = $derived(
		auth_client.organization.checkRolePermission({
			permissions: {
				labels: ["create", "update", "delete"],
			},
			role: user_role,
		}),
	);

	const can_manage_locations = $derived(
		auth_client.organization.checkRolePermission({
			permissions: {
				locations: ["create", "update", "delete"],
			},
			role: user_role,
		}),
	);
</script>

<Sidebar variant="inset">
	<SidebarHeader>
		<div class="flex flex-row">
			<button
				class={cn(
					buttonVariants({
						size: "sm",
						variant: "ghost",
					}),
					"hover:bg-sidebar-accent!",
				)}
				use:NavigationReturn={{ fallback: "/dashboard" }}><LucideChevronLeft /> Return</button
			>
		</div>
	</SidebarHeader>

	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton>
							{#snippet child({ props })}
								<a href="/settings" {...props}>
									<LucideSettings2 /> Preferences
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton>
							{#snippet child({ props })}
								<a href="/settings" {...props}>
									<LucideCircleUser /> Profile
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<SidebarGroup>
			<SidebarGroupLabel>Workspace</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton>
							{#snippet child({ props })}
								<a href="/settings/workspace/labels" {...props}>
									<LucideTags /> Labels
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton>
							{#snippet child({ props })}
								<a href="/settings/workspace/locations" {...props}>
									<LucidePackage /> Storage Locations
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<SidebarGroup>
			<SidebarGroupLabel>{user_org.name}</SidebarGroupLabel>

			<SidebarGroupContent>
				<SidebarMenu>
					{#if user_role == "admin" || user_role == "owner"}
						<SidebarMenuItem>
							<SidebarMenuButton>
								{#snippet child({ props })}
									<a href="/settings/workspace/manage" {...props}>
										<LucideBuilding /> Workspace
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>

						<SidebarMenuItem>
							<SidebarMenuButton>
								{#snippet child({ props })}
									<a href="/settings/workspace/members" {...props}>
										<LucideCircleUser /> Members
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>

						<SidebarMenuItem>
							<SidebarMenuButton>
								{#snippet child({ props })}
									<a href="/settings/workspace/import" {...props}>
										<LucideArrowLeftRight /> Import & Export
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/if}

					{#if user_role != "owner"}
						<SidebarMenuItem>
							<SidebarMenuButton class="[&_svg]:stroke-destructive">
								{#snippet child({ props })}
									<a href="/settings/workspace/leave" {...props}>
										<LucideLogOut /> Leave Workspace
									</a>
								{/snippet}
							</SidebarMenuButton>
						</SidebarMenuItem>
					{/if}
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>
</Sidebar>
