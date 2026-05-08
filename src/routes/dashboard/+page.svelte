<script lang="ts">
	import { ItemsCollection } from "$lib/collections/def.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { OpenNewItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte";
	import NewItemDialog from "$lib/components/items/dialogs/NewItemDialog.svelte";
	import { Button } from "$lib/components/ui/button";
	import type { ItemStatus } from "$lib/server/db/schema";
	import { LucidePlus } from "@lucide/svelte";
	import { createLiveQueryCollection, eq, useLiveQuery } from "@tanstack/svelte-db";

	let displayed_type = $state<ItemStatus>("unlisted");

	const items_query = useLiveQuery((q) =>
		q.from({ item: ItemsCollection }).where(({ item }) => eq(item.status, displayed_type))
	);
</script>

<DashboardLayoutRoot>
	<DashboardHeader breadcrumbs={[{ type: "page", text: "Dashboard" }]} />
</DashboardLayoutRoot>
