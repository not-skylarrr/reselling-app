<script lang="ts">
	import { TabsList, TabsTrigger } from "$lib/components/ui/tabs";
	import { ItemIsOrPassedStatus } from "$lib/items/utils";
	import type { ItemWithLabels } from "$lib/server/db/schema";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();
</script>

<div class="h-9 w-full shrink-0 border-b px-3">
	<TabsList variant="line">
		<TabsTrigger value="details">
			{#snippet child({ props })}
				<a {...props} href={`/dashboard/inventory/items/${item.id}`}>Item Details</a>
			{/snippet}
		</TabsTrigger>

		<TabsTrigger value="listings">
			{#snippet child({ props })}
				<a {...props} href={`/dashboard/inventory/items/${item.id}/listings`}>Listings</a>
			{/snippet}
		</TabsTrigger>

		<TabsTrigger value="sale">
			{#snippet child({ props })}
				<a {...props} href={`/dashboard/inventory/items/${item.id}/sale`}>Sale Details</a>
			{/snippet}
		</TabsTrigger>

		<TabsTrigger value="fees">
			{#snippet child({ props })}
				<a {...props} href={`/dashboard/inventory/items/${item.id}/fees`}>Manage Fees</a>
			{/snippet}
		</TabsTrigger>

		<TabsTrigger value="refund">
			{#snippet child({ props })}
				<a {...props} href={`/dashboard/inventory/items/${item.id}/refund`}>Refund Details</a>
			{/snippet}
		</TabsTrigger>

		<TabsTrigger value="destructive">
			{#snippet child({ props })}
				<a {...props} href={`/dashboard/inventory/items/${item.id}/destructive`}>Danger Zone</a>
			{/snippet}
		</TabsTrigger>
	</TabsList>
</div>
