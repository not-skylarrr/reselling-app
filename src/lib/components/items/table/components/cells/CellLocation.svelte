<script lang="ts">
	import LocationBadge from "$lib/components/locations/LocationBadge.svelte";

	type Props = {
		location_id: string | null;
	};

	let { location_id }: Props = $props();
</script>

{#if location_id}
	<LocationBadge {location_id} />
{:else}
	<p class="text-muted-foreground">-</p>
{/if}
