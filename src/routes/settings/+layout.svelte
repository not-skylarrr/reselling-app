<script>
	import SettingsSidebar from "$lib/components/dashboard/sidebar/SettingsSidebar.svelte";
	import ItemDialogProvider from "$lib/components/items/dialogs/ItemDialogProvider.svelte";
	import NewItemDialog from "$lib/components/items/dialogs/NewItemDialog.svelte";
	import { SidebarInset, SidebarProvider } from "$lib/components/ui/sidebar";
	import DestructiveDialogProvider from "$lib/components/utils/dialogs/DestructiveDialogProvider.svelte";

	const { children, data } = $props();
</script>

<SidebarProvider>
	<SettingsSidebar user_org={data.user_org} user_role={data.org_role} />
	<SidebarInset class="overflow-hidden">
		{@render children()}
	</SidebarInset>
</SidebarProvider>

<DestructiveDialogProvider />
