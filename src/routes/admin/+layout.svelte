<script>
	import AdminSidebar from "$lib/components/admin/sidebar/AdminSidebar.svelte";
	import { SidebarInset, SidebarProvider } from "$lib/components/ui/sidebar";

	const { children, data } = $props();
</script>

<svelte:head>
	<title>Admin Dashboard</title>
</svelte:head>

<SidebarProvider>
	<AdminSidebar />
	<SidebarInset class="overflow-hidden">
		{@render children()}
	</SidebarInset>
</SidebarProvider>
