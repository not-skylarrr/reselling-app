<script lang="ts">
	import { beforeNavigate } from "$app/navigation";
	import { page } from "$app/state";
	import {
		ItemFeesCollection,
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
		ListingsCollection,
		LocationsCollection,
	} from "$lib/collections/def.svelte.js";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import ItemNavigationTabs from "$lib/components/items/item-page/ItemNavigationTabs.svelte";
	import ItemQuickActions from "$lib/components/items/item-page/ItemQuickActions.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Tabs } from "$lib/components/ui/tabs";
	import { GetStatusFriendlyName } from "$lib/items/utils";
	import type { WorkspaceLabel } from "$lib/server/db/schema.js";
	import { LucideArchive, LucideChevronDown } from "@lucide/svelte";
	import { eq, isUndefined, not, toArray, useLiveQuery } from "@tanstack/svelte-db";
	import { onMount } from "svelte";
	import { fade } from "svelte/transition";

	let { children, data } = $props();

	let current_tab = $state("details");

	const item_query = useLiveQuery(
		(q) =>
			q
				.from({ item: ItemsCollection })
				.orderBy(({ item }) => item.status_int, "desc")
				.orderBy(({ item }) => item.added_at, "desc")
				.leftJoin({ location: LocationsCollection }, ({ location, item }) =>
					eq(item.storage_location, location.id),
				)
				.select(({ item, location }) => ({
					...item,
					location: location,
					labels: toArray(
						q
							.from({ label_join: LabelJoinsCollection })
							.where(({ label_join }) => eq(label_join.subject_id, item.id))
							.leftJoin({ label: LabelsCollection }, ({ label_join, label }) =>
								eq(label.id, label_join.label_id),
							)
							.where(({ label }) => not(isUndefined(label)))
							.fn.select(({ label }): WorkspaceLabel => {
								return label as WorkspaceLabel;
							}),
					),
					listings: toArray(
						q
							.from({ listing: ListingsCollection })
							.where(({ listing }) => eq(item.id, listing.item_id)),
					),
					fees: toArray(
						q.from({ fee: ItemFeesCollection }).where(({ fee }) => eq(item.id, fee.item_id)),
					),
				}))
				.where(({ item }) => eq(item.id, data.item.id))
				.findOne(),
		[() => data.item],
	);

	let item = $derived(item_query.data ?? data.item);

	const url_pathname_regex = /^\/dashboard\/inventory\/items\/[^/]+(?:\/([^/]+))?\/?$/;

	function SetCurrentTabFromPathname(pathname: string) {
		const is_item_navigation = url_pathname_regex.test(pathname);
		if (!is_item_navigation) return;

		const regex_result = url_pathname_regex.exec(pathname);
		if (!regex_result) return;

		const tab_id = regex_result[1] ?? "details";

		current_tab = tab_id;
	}

	beforeNavigate((navigation) => {
		if (!navigation.to) return;

		SetCurrentTabFromPathname(navigation.to.url.pathname);
	});

	onMount(() => {
		SetCurrentTabFromPathname(page.url.pathname);
	});
</script>

<Tabs value={current_tab}>
	{#snippet child({ props })}
		<DashboardLayoutRoot {...props}>
			<DashboardHeader
				breadcrumbs={[
					{ type: "link", text: "Dashboard", href: "/dashboard" },
					{ type: "link", text: "Inventory", href: "/dashboard/inventory" },
					{ type: "page", text: item.name },
				]}
			></DashboardHeader>
			<DashboardContent class="@container flex-1 gap-0 p-0 md:gap-0 md:p-0" disableScroll>
				<div class="flex flex-row items-center gap-6 border-b px-7 py-6">
					<div class="grid flex-1 gap-1">
						<div class="flex h-7 flex-row items-center gap-3">
							<p class="text-xl font-medium">{item.name}</p>

							{#if item.archived}
								<div transition:fade={{ duration: 200 }}>
									<LucideArchive class="size-4 stroke-muted-foreground" />
								</div>
							{/if}
						</div>

						<p class="text-sm text-muted-foreground">{GetStatusFriendlyName(item.status)}</p>
					</div>

					<ItemQuickActions {item} />
				</div>

				<ItemNavigationTabs {item} />

				<ScrollArea class="flex-1 overflow-hidden">
					<div class="flex min-h-full">
						{@render children()}
					</div>
				</ScrollArea>
			</DashboardContent>
		</DashboardLayoutRoot>
	{/snippet}
</Tabs>
