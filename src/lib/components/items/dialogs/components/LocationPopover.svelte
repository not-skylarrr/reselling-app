<script lang="ts">
	import { LocationsCollection } from "$lib/collections/def.svelte";
	import LocationBadge from "$lib/components/locations/LocationBadge.svelte";
	import LocationMarker from "$lib/components/locations/LocationMarker.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import {
		CreateColourExportString,
		PLACEHOLDER_COLOUR_DATA,
	} from "$lib/components/ui/colour-picker/lib/utils";
	import {
		Command,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
	} from "$lib/components/ui/command";
	import CommandEmpty from "$lib/components/ui/command/command-empty.svelte";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { session_state } from "$lib/utils/session.svelte";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { LucideCheck, LucidePlus, LucidePackage } from "@lucide/svelte";
	import { useLiveQuery } from "@tanstack/svelte-db";
	import { computeCommandScore } from "bits-ui";

	type Props = {
		location_id: string | null;
		onLocationIdChange: (location_id: string | null) => void;
	};

	let { location_id, onLocationIdChange }: Props = $props();

	let open = $state(false);
	let filter_query = $state("");

	const locations_query = useLiveQuery((q) => q.from({ location: LocationsCollection }));

	const filtered_locations = $derived.by(() => {
		return locations_query.data
			.map(
				(location) => [location, computeCommandScore(location.name, filter_query, [])] as const,
			)
			.filter(([_, score]) => score > 0)
			.sort(([_a, a_score], [_b, b_score]) => b_score - a_score)
			.map(([location]) => location);
	});

	const selected_location = $derived(
		location_id ? locations_query.data.find((location) => location.id == location_id) : null,
	);

	function ToggleLocation(new_location_id: string) {
		if (location_id == new_location_id) {
			onLocationIdChange(null);
		} else {
			onLocationIdChange(new_location_id);
		}
	}

	function CreateNewlocation(location_name: string) {
		const location_id = GenerateQuickId();

		LocationsCollection.insert({
			id: location_id,
			name: location_name,
			colour: CreateColourExportString(PLACEHOLDER_COLOUR_DATA),
			created_at: new Date(),
			workspace_id: session_state.workspace_id,
		});

		onLocationIdChange(location_id);
	}

	function HandleOpenChangeComplete(open: boolean) {
		if (open == false) {
			filter_query = "";
		}
	}
</script>

<Popover bind:open onOpenChangeComplete={HandleOpenChangeComplete}>
	<PopoverTrigger>
		{#snippet child({ props })}
			<button {...props} class="rounded-full" type="button">
				<Badge class="hover:bg-accent" role="button" size="lg" variant="outline">
					{#if !selected_location}
						<LucidePackage />
						Add Location
					{:else}
						<LocationMarker location={selected_location} />
						{selected_location.name}
					{/if}
				</Badge>
			</button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent align="start" class="p-0" side="top">
		<Command shouldFilter={false}>
			<CommandInput bind:value={filter_query} placeholder="Search locations" rootClass="h-8" />
			<CommandList>
				<CommandGroup heading="Workspace locations">
					{#each filtered_locations as location (location.id)}
						<CommandItem
							class="rounded-4xl"
							onSelect={() => ToggleLocation(location.id)}
							value={location.name}
						>
							<LocationMarker {location} />

							<p class="flex-1">{location.name}</p>

							{#if location_id == location.id}
								<LucideCheck />
							{/if}
						</CommandItem>
					{/each}

					{#if filtered_locations.length == 0 && filter_query.length > 0}
						<CommandItem class="rounded-4xl" onSelect={() => CreateNewlocation(filter_query)}
							><LucidePlus class="stroke-muted-foreground" /> Create location "{filter_query}"</CommandItem
						>
					{/if}
				</CommandGroup>

				<CommandEmpty>No Locations To Display</CommandEmpty>
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>
