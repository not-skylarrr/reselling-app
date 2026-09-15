<script lang="ts">
	import { ItemMetadataCollection } from "$lib/collections/def.svelte";
	import { Item, ItemActions, ItemContent, ItemTitle } from "$lib/components/ui/item";
	import { ParseItemMetadataField, SerializeItemMetadataField } from "$lib/items/metadata";
	import type { ItemMetadata, ItemMetadataDefinition } from "$lib/server/db/schema";
	import UpdateCurrencyPopover from "../item-pages/components/UpdateCurrencyPopover.svelte";
	import UpdateNumberPopover from "../item-pages/components/UpdateNumberPopover.svelte";
	import UpdateStringPopover from "../item-pages/components/UpdateStringPopover.svelte";

	type Props = {
		metadata: ItemMetadata & {
			definition: ItemMetadataDefinition;
		};
	};

	let { metadata }: Props = $props();

	function HandleValueChange(val: any) {
		const val_string = SerializeItemMetadataField(metadata.definition.type, val);

		ItemMetadataCollection.update(metadata.id, (meta) => {
			meta.value_string = val_string;
		});
	}
</script>

<Item class="h-7 flex-nowrap p-0">
	<ItemContent class="min-w-0">
		<ItemTitle class="w-full min-w-0 truncate text-sm font-normal text-muted-foreground"
			>{metadata.definition.name}</ItemTitle
		>
	</ItemContent>

	<ItemActions class="max-w-[60%] min-w-0 shrink">
		{#if metadata.definition.type == "string"}
			<UpdateStringPopover
				class="max-w-full min-w-0 shrink! text-left"
				onValueChange={(val) => HandleValueChange(val)}
				value={metadata.value_string}
			/>
		{/if}

		{#if metadata.definition.type == "number"}
			<UpdateNumberPopover
				class="w-full min-w-0 truncate"
				onValueChange={(val) => HandleValueChange(val)}
				value={ParseItemMetadataField(metadata.definition.type, metadata.value_string)}
			/>
		{/if}

		{#if metadata.definition.type == "currency"}
			<UpdateCurrencyPopover
				class="w-full min-w-0 truncate"
				onValueChange={(val) => HandleValueChange(val)}
				value={ParseItemMetadataField(metadata.definition.type, metadata.value_string)}
			/>
		{/if}
	</ItemActions>
</Item>
