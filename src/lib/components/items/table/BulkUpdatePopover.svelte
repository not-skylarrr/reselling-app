<script lang="ts">
	import { ItemsCollection } from "$lib/collections/def.svelte";
	import ButtonGroupSeparator from "$lib/components/ui/button-group/button-group-separator.svelte";
	import ButtonGroupText from "$lib/components/ui/button-group/button-group-text.svelte";
	import ButtonGroup from "$lib/components/ui/button-group/button-group.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import Separator from "$lib/components/ui/separator/separator.svelte";
	import Plural from "$lib/components/utils/Plural.svelte";
	import { slideFade } from "$lib/utils/transition";
	import { LucideArchive, LucideArchiveX, LucideTrash } from "@lucide/svelte";
	import { fade } from "svelte/transition";

	type Props = {
		item_ids: string[];
	};

	let { item_ids }: Props = $props();

	function ArchiveItems() {
		const first_item = ItemsCollection.get(item_ids[0]);
		if (!first_item) return;

		for (const id of item_ids) {
			ItemsCollection.update(id, (draft) => {
				draft.archived = !first_item.archived;
			});
		}
	}
</script>

<div
	class="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full border bg-popover shadow-lg"
	transition:fade={{ duration: 100 }}
>
	<ButtonGroup>
		<Button onclick={ArchiveItems} variant="ghost"><LucideArchive /></Button>
	</ButtonGroup>
</div>
