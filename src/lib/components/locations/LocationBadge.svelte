<script lang="ts">
	import type { WorkspaceLocation } from "$lib/server/db/schema";
	import { eq, useLiveQuery } from "@tanstack/svelte-db";
	import Badge from "../ui/badge/badge.svelte";
	import LocationMarker from "./LocationMarker.svelte";
	import { LocationsCollection } from "$lib/collections/def.svelte";

	type Props = {
		location_id: string | null;
	};

	let { location_id }: Props = $props();

	const location_query = useLiveQuery(
		(q) =>
			q
				.from({ location: LocationsCollection })
				.where(({ location }) => eq(location.id, location_id ?? ""))
				.findOne(),
		[() => location_id],
	);

	const location = $derived(location_query.data);
</script>

{#if location}
	<Badge class="bg-background" variant="outline">
		<LocationMarker {location} />
		{location.name}
	</Badge>
{/if}
