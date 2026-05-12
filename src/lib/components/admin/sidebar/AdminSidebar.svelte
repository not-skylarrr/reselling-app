<script lang="ts">
	import DashboardSidebarHeader from "$lib/components/dashboard/sidebar/DashboardSidebarHeader.svelte";
	import {
		Sidebar,
		SidebarContent,
		SidebarGroup,
		SidebarGroupContent,
		SidebarGroupLabel,
		SidebarMenu,
		SidebarMenuButton,
		SidebarMenuItem,
	} from "$lib/components/ui/sidebar";
	import { LucideMessageSquare } from "@lucide/svelte";
</script>

<Sidebar collapsible="icon" variant="inset">
	<DashboardSidebarHeader />

	<SidebarContent>
		<SidebarGroup>
			<SidebarGroupLabel>Feedback</SidebarGroupLabel>
			<SidebarGroupContent>
				<SidebarMenu>
					<SidebarMenuItem>
						<SidebarMenuButton>
							{#snippet child({ props })}
								<a {...props} href="/admin/feedback">
									<LucideMessageSquare /> View Feedback
								</a>
							{/snippet}
						</SidebarMenuButton>
					</SidebarMenuItem>
				</SidebarMenu>
			</SidebarGroupContent>
		</SidebarGroup>
	</SidebarContent>
</Sidebar>
