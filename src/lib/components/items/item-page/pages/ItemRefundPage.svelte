<script lang="ts">
	import { Empty, EmptyDescription, EmptyHeader, EmptyMedia } from "$lib/components/ui/empty";
	import EmptyTitle from "$lib/components/ui/empty/empty-title.svelte";
	import type { ItemWithLabels } from "$lib/server/db/schema";
	import { LucideWrench } from "@lucide/svelte";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();
</script>

<Empty>
	<EmptyHeader>
		<EmptyMedia variant="icon">
			<LucideWrench />
		</EmptyMedia>

		<EmptyTitle>Work in Progress</EmptyTitle>
		<EmptyDescription>This page will be done soon... probably...</EmptyDescription>
	</EmptyHeader>
</Empty>
