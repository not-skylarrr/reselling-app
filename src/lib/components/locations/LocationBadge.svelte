<script lang="ts">
	import type { WorkspaceLocation } from "$lib/server/db/schema";
	import { eq, useLiveQuery } from "@tanstack/svelte-db";
	import Badge from "../ui/badge/badge.svelte";
	import LocationMarker from "./LocationMarker.svelte";
	import { LocationsCollection } from "$lib/collections/def.svelte";

	type Props = {
		location: WorkspaceLocation | undefined;
	};

	let { location }: Props = $props();
</script>

{#if location}
	<Badge class="bg-background" variant="outline">
		<LocationMarker {location} />
		{location.name}
	</Badge>
{/if}
