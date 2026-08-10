<script>
	import { LucideReceipt, LucideReceiptText } from "@lucide/svelte";
	import DashboardSidebarHeader from "../dashboard/sidebar/DashboardSidebarHeader.svelte";
	import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "../ui/sidebar";


</script>

<svelte:head>
    <title>Developer Tools</title>
</svelte:head>

<Sidebar collapsible="icon" variant="sidebar">
    <DashboardSidebarHeader />

    <SidebarContent>
        <SidebarGroup>
            <SidebarGroupLabel>Utilities</SidebarGroupLabel>
            <SidebarGroupContent>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton>
                            {#snippet child({ props })}
                                <a href="/developer/release-notes" {...props}>
									<LucideReceiptText /> Generate Release Notes
								</a>
                            {/snippet}
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    </SidebarContent>
</Sidebar>
