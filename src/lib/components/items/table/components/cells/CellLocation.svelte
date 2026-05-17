<script lang="ts">
	import LocationBadge from "$lib/components/locations/LocationBadge.svelte";
	import type { WorkspaceLocation } from "$lib/server/db/schema";

	type Props = {
		location: WorkspaceLocation | undefined;
	};

	let { location }: Props = $props();
</script>

{#if location}
	<LocationBadge {location} />
{:else}
	<p class="text-muted-foreground">-</p>
{/if}
