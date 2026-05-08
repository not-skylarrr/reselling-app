<script lang="ts">
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import { GetStatusForegroundColour, GetStatusFriendlyName } from "$lib/items/utils";
	import type { ItemStatus } from "$lib/server/db/schema";
	import { cn } from "$lib/utils";
	import ItemStatusMarker from "./ItemStatusMarker.svelte";

	type Props = {
		status: ItemStatus;
	};

	let { status }: Props = $props();
</script>

<Badge
	class={cn(GetStatusForegroundColour(status), "bg-background font-normal")}
	variant="outline"
>
	<ItemStatusMarker {status} />

	<p class="text-foreground">
		{GetStatusFriendlyName(status)}
	</p>
</Badge>
