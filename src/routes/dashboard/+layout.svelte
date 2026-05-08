<script>
	import DashboardSidebar from "$lib/components/dashboard/sidebar/DashboardSidebar.svelte";
	import ItemDialogProvider from "$lib/components/items/dialogs/ItemDialogProvider.svelte";
	import NewItemDialog from "$lib/components/items/dialogs/NewItemDialog.svelte";
	import { SidebarInset, SidebarProvider } from "$lib/components/ui/sidebar";
	import DestructiveDialogProvider from "$lib/components/utils/dialogs/DestructiveDialogProvider.svelte";
	import { mode } from "mode-watcher";

	const { children } = $props();
</script>

<svelte:head>
	<meta name="theme-color" content={mode.current == "dark" ? "#161616" : "hsl(0.97 0 0)"} />
</svelte:head>

<SidebarProvider>
	<DashboardSidebar />
	<SidebarInset class="overflow-hidden">
		{@render children()}
	</SidebarInset>
</SidebarProvider>

<NewItemDialog />
<ItemDialogProvider />
<DestructiveDialogProvider />
