<script lang="ts">
	import {
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
		ListingsCollection,
		ItemFeesCollection,
		LocationsCollection,
	} from "$lib/collections/def.svelte.js";
	import { GetItemLabelJoinId } from "$lib/collections/lib/utils.js";
	import UpdateStringPopover from "$lib/components/dashboard/inventory/item-pages/components/UpdateStringPopover.svelte";
	import ItemJourney from "$lib/components/dashboard/inventory/item-pages/ItemJourney.svelte";
	import ItemListingsView from "$lib/components/dashboard/inventory/item-pages/ItemListingsView.svelte";
	import ItemPurchaseView from "$lib/components/dashboard/inventory/item-pages/ItemPurchaseView.svelte";
	import ItemRefundView from "$lib/components/dashboard/inventory/item-pages/ItemRefundView.svelte";
	import ItemSoldView from "$lib/components/dashboard/inventory/item-pages/ItemSoldView.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { OpenItemDialog } from "$lib/components/items/dialogs/dialog-state.svelte.js";
	import SidebarLabelSelector from "$lib/components/labels/SidebarLabelSelector.svelte";
	import SidebarLocationSelector from "$lib/components/locations/SidebarLocationSelector.svelte";
	import { Button } from "$lib/components/ui/button/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { GetStatusFriendlyName } from "$lib/items/utils.js";
	import type { WorkspaceLabel } from "$lib/server/db/schema.js";
	import { session_state } from "$lib/utils/session.svelte.js";
	import {
		LucideIterationCw,
		LucidePlus,
		LucidePackage,
		LucideTextCursor,
	} from "@lucide/svelte";
	import { eq, toArray, useLiveQuery, not, isUndefined } from "@tanstack/svelte-db";

	let { data } = $props();

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

	function HandleLabelsChange(label_ids: string[]) {
		const current_label_set = new Set<string>(item.labels.map((l) => l.id));

		const new_label_ids: string[] = [];

		for (const label_id of label_ids) {
			if (current_label_set.has(label_id)) {
				current_label_set.delete(label_id);
			} else {
				new_label_ids.push(label_id);
			}
		}

		for (const label_id of new_label_ids) {
			LabelJoinsCollection.insert({
				id: GetItemLabelJoinId(item.id, label_id),
				type: "item-label",
				subject_id: item.id,
				label_id: label_id,
				workspace_id: session_state.workspace_id,
			});
		}

		const removed_ids = current_label_set.values();

		for (const label_id of removed_ids) {
			LabelJoinsCollection.delete(GetItemLabelJoinId(item.id, label_id));
		}
	}
</script>

<DashboardLayoutRoot>
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
				<p class="text-xl font-medium">{item.name}</p>

				<p class="text-sm text-muted-foreground">{GetStatusFriendlyName(item.status)}</p>
			</div>

			<div class="hidden flex-row gap-3 @2xl:flex">
				<UpdateStringPopover
					label="Update Item Name"
					value={item.name}
					onValueChange={(name) => {
						ItemsCollection.update(item.id, (draft) => {
							draft.name = name;
						});
					}}
					type="dialog"
				>
					{#snippet trigger({ props })}
						<Button {...props} variant="outline"><LucideTextCursor /> Rename Item</Button>
					{/snippet}
				</UpdateStringPopover>

				{#if item.status_int < 2}
					<Button onclick={() => OpenItemDialog(item, "list")}
						><LucidePlus /> Create Listing</Button
					>
				{/if}

				{#if item.status_int == 2}
					<Button href={`/dashboard/inventory/items/${item.id}/refund`}
						><LucideIterationCw /> Mark as Refunded</Button
					>
				{/if}

				{#if item.status_int == 3}
					<Button><LucidePackage /> Mark as Returned</Button>
				{/if}
			</div>
		</div>

		<div class="hidden flex-col gap-2 border-b px-7 py-6 @2xl:flex">
			<div class="flex flex-row items-center justify-between">
				<p class="text-sm text-muted-foreground">Labels</p>

				<SidebarLabelSelector labels={item.labels} onLabelsChange={HandleLabelsChange} />
			</div>

			<div class="flex flex-row items-center justify-between">
				<p class="text-sm text-muted-foreground">Storage Location</p>

				<SidebarLocationSelector
					location_id={item.storage_location}
					onLocationChange={(location_id) =>
						ItemsCollection.update(item.id, (item) => {
							item.storage_location = location_id;
						})}
				/>
			</div>
		</div>

		<div class="flex flex-1 flex-col overflow-hidden @4xl:flex-row @4xl:divide-x">
			<ScrollArea class="flex-1 overflow-hidden">
				<div class="flex min-h-full flex-col">
					<div class="flex justify-center @2xl:hidden">
						<div class="flex w-full max-w-3xl flex-col gap-2 border-b px-7 py-6">
							<div class="flex flex-row items-center justify-between">
								<p class="text-sm text-muted-foreground">Labels</p>

								<SidebarLabelSelector
									labels={item.labels}
									onLabelsChange={HandleLabelsChange}
								/>
							</div>

							<div class="flex flex-row items-center justify-between">
								<p class="text-sm text-muted-foreground">Storage Location</p>

								<SidebarLocationSelector
									location_id={item.storage_location}
									onLocationChange={(location_id) =>
										ItemsCollection.update(item.id, (item) => {
											item.storage_location = location_id;
										})}
								/>
							</div>
						</div>
					</div>

					<div class="flex flex-1 flex-col divide-y">
						{#if item.status_int == 3}
							<ItemRefundView {item} />
						{/if}

						{#if item.status_int >= 2}
							<ItemSoldView {item} />
						{/if}

						<ItemListingsView {item} />

						<ItemPurchaseView {item} />

						<div class="flex @4xl:hidden">
							<ItemJourney class="px-4" {item} />
						</div>
					</div>
				</div>
			</ScrollArea>

			<div class="hidden w-96 flex-col overflow-hidden @4xl:flex">
				<ItemJourney {item} />
			</div>
		</div>

		<div class="flex flex-col-reverse gap-3 border-t bg-card p-6 @2xl:hidden">
			<UpdateStringPopover
				label="Update Item Name"
				value={item.name}
				onValueChange={(name) => {
					ItemsCollection.update(item.id, (draft) => {
						draft.name = name;
					});
				}}
				type="dialog"
			>
				{#snippet trigger({ props })}
					<Button {...props} variant="outline"><LucideTextCursor /> Rename Item</Button>
				{/snippet}
			</UpdateStringPopover>

			{#if item.status_int < 2}
				<Button><LucidePlus /> Create Listing</Button>
			{/if}

			{#if item.status_int == 2}
				<Button><LucideIterationCw /> Mark as Refunded</Button>
			{/if}

			{#if item.status_int == 3}
				<Button><LucidePackage /> Mark as Returned</Button>
			{/if}
		</div>
	</DashboardContent>
</DashboardLayoutRoot>
