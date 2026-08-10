<script>
	import DeveloperSidebar from "$lib/components/developer/DeveloperSidebar.svelte";
	import { SidebarInset, SidebarProvider } from "$lib/components/ui/sidebar";


	const { children, data } = $props();
</script>

<SidebarProvider>
    <DeveloperSidebar />

    <SidebarInset class="overflow-hidden">
        {@render children()}
    </SidebarInset>
</SidebarProvider>
