<script lang="ts">
	import { LocationsCollection } from "$lib/collections/def.svelte";
	import LocationBadge from "$lib/components/locations/LocationBadge.svelte";
	import type { WorkspaceLocation } from "$lib/server/db/schema";
	import { useLiveQuery, eq } from "@tanstack/svelte-db";

	type Props = {
		location_id: string | null;
	};

	let { location_id }: Props = $props();

	const location = useLiveQuery((q) =>
		q
			.from({ location: LocationsCollection })
			.where(({ location }) => eq(location.id, location_id))
			.findOne(),
	);
</script>

{#if location.data}
	<LocationBadge location={location.data} />
{:else}
	<p class="text-muted-foreground">-</p>
{/if}
