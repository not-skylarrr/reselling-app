<script lang="ts">
	import { ItemsCollection, LabelJoinsCollection } from "$lib/collections/def.svelte";
	import { GetItemLabelJoinId } from "$lib/collections/lib/utils";
	import ItemStatusMarker from "$lib/components/items/reusable/ItemStatusMarker.svelte";
	import LabelDisplay from "$lib/components/labels/LabelDisplay.svelte";
	import SidebarLabelSelector from "$lib/components/labels/SidebarLabelSelector.svelte";
	import SidebarLocationSelector from "$lib/components/locations/SidebarLocationSelector.svelte";
	import { Item, ItemActions, ItemContent, ItemTitle } from "$lib/components/ui/item";
	import { GetStatusFriendlyName } from "$lib/items/utils";
	import type { Item as DbItem, ItemWithLabels, WorkspaceLabel } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import { session_state } from "$lib/utils/session.svelte";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();

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

{#if item}
	<div class="flex flex-col gap-1 px-4 py-2 pr-2">
		<Item class="h-7 p-0">
			<ItemContent>
				<ItemTitle class="text-sm font-normal text-muted-foreground">Status</ItemTitle>
			</ItemContent>

			<ItemActions>
				<div class="flex flex-row items-center gap-1.5 pr-2">
					<ItemStatusMarker status={item.status} />
					<p>
						{GetStatusFriendlyName(item.status)}
					</p>
				</div>
			</ItemActions>
		</Item>

		<Item class="h-7 p-0">
			<ItemContent>
				<ItemTitle class="text-sm font-normal text-muted-foreground">Labels</ItemTitle>
			</ItemContent>

			<ItemActions>
				<SidebarLabelSelector
					enableHotkey={true}
					labels={item.labels}
					onLabelsChange={HandleLabelsChange}
				/>
			</ItemActions>
		</Item>

		<Item class="h-7 p-0">
			<ItemContent>
				<ItemTitle class="text-sm font-normal text-muted-foreground">Location</ItemTitle>
			</ItemContent>

			<ItemActions>
				<SidebarLocationSelector
					enableHotkey={true}
					location_id={item.storage_location}
					onLocationChange={(location_id) =>
						ItemsCollection.update(item.id, (item) => {
							item.storage_location = location_id;
						})}
				/>
			</ItemActions>
		</Item>
	</div>
{/if}
