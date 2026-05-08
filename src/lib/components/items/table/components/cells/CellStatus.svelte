<script lang="ts">
	import ItemStatusBadge from "$lib/components/items/reusable/ItemStatusBadge.svelte";
	import Badge from "$lib/components/ui/badge/badge.svelte";
	import type { ItemStatus } from "$lib/server/db/schema";
	import { LucideCircleCheck } from "@lucide/svelte";

	type Props = {
		value: ItemStatus;
	};

	let { value }: Props = $props();
</script>

<ItemStatusBadge status={value} />
