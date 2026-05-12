<script lang="ts">
	import {
		Sidebar,
		SidebarContent,
		SidebarFooter,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
		SidebarMenuBadge,
	} from "$lib/components/ui/sidebar";
	import {
		LucideInbox,
		LucideLayoutGrid,
		LucidePackage,
		LucidePlus,
		LucideTable,
	} from "@lucide/svelte";
	import DashboardSidebarHeader from "./DashboardSidebarHeader.svelte";
	import DashboardSidebarFooter from "./DashboardSidebarFooter.svelte";

	type Props = {
		is_admin: boolean;
	};

	let { is_admin }: Props = $props();
</script>

<Sidebar collapsible="icon" variant="inset">
	<DashboardSidebarHeader />

	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupLabel>Sales Dashboard</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Inbox">
							{#snippet child({ props })}
								<a href="/dashboard/notifications" {...props}>
									<LucideInbox /> Inbox
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Analytics">
							{#snippet child({ props })}
								<a href="/dashboard/analytics" {...props}>
									<LucideLayoutGrid /> Analytics
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Inventory">
							{#snippet child({ props })}
								<a href="/dashboard/inventory" {...props}>
									<LucideTable /> Inventory
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>

		<SidebarGroup>
			<SidebarGroupLabel>Item Bundles</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Inbox">
							{#snippet child({ props })}
								<a href="/dashboard/bundles/new" {...props}>
									<LucidePlus /> New Bundle
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>

					<SidebarMenuItem>
						<SidebarMenuButton tooltipContent="Analytics">
							{#snippet child({ props })}
								<a href="/dashboard/bundles" {...props}>
									<LucidePackage /> Your Bundles
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>

	<DashboardSidebarFooter {is_admin} />
</Sidebar>
