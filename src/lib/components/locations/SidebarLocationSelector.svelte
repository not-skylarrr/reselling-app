<script lang="ts">
	import { LocationsCollection } from "$lib/collections/def.svelte";
	import { useLiveQuery } from "@tanstack/svelte-db";
	import { Button, type ButtonVariant } from "../ui/button";
	import { LucideLoaderCircle, LucidePlus } from "@lucide/svelte";
	import LocationMarker from "./LocationMarker.svelte";
	import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
	} from "../ui/command";
	import { computeCommandScore } from "bits-ui";
	import {
		CreateColourExportString,
		PLACEHOLDER_COLOUR_DATA,
	} from "../ui/colour-picker/lib/utils";
	import { session_state } from "$lib/utils/session.svelte";
	import { cn } from "$lib/utils";
	import { createHotkey } from "@tanstack/svelte-hotkeys";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import RawMarker from "../labels/RawMarker.svelte";
	import { GetColourFromString } from "$lib/utils/colour/hash";

	type Props = {
		button_variant?: ButtonVariant;
		class?: string;
		enableHotkey?: boolean;
		location_id: string | null;
		onLocationChange: (location_id: string | null) => void;
	};

	let {
		button_variant = "ghost",
		class: class_name,
		enableHotkey = false,
		location_id,
		onLocationChange,
	}: Props = $props();

	let open = $state(false);
	let filter_query = $state("");

	const locations_query = useLiveQuery((q) => q.from({ location: LocationsCollection }));

	const location = $derived(locations_query.data.find((loc) => loc.id == location_id));

	const filtered_locations = $derived.by(() => {
		return locations_query.data
			.map(
				(location) => [location, computeCommandScore(location.name, filter_query, [])] as const,
			)
			.filter(([_, score]) => score > 0)
			.sort(([_a, a_score], [_b, b_score]) => b_score - a_score)
			.map(([location]) => location);
	});

	function HandleLocationSelect(new_location_id: string | null) {
		if (location_id == new_location_id) {
			onLocationChange(null);
		} else {
			onLocationChange(new_location_id);
		}
	}

	async function CreateNewLocation(location_name: string) {
		const previous_id = location_id;
		const new_location_id = GenerateQuickId();

		try {
			const tx = LocationsCollection.insert({
				id: new_location_id,
				name: location_name,
				colour: CreateColourExportString(GetColourFromString(location_name)),
				created_at: new Date(),
				workspace_id: session_state.workspace_id,
			});

			HandleLocationSelect(new_location_id);

			filter_query = "";

			await tx.isPersisted.promise;
		} catch (e) {
			HandleLocationSelect(previous_id);
		}
	}

	function HandleOpenChangeComplete(open: boolean) {
		if (open == false) {
			filter_query = "";
		}
	}

	createHotkey(
		"S",
		() => (open = !open),
		() => ({ enabled: enableHotkey }),
	);
</script>

<Popover bind:open onOpenChangeComplete={HandleOpenChangeComplete}>
	<PopoverTrigger>
		{#snippet child({ props })}
			<Button
				{...props}
				class={cn("font-normal", class_name)}
				size="xs"
				variant={button_variant}
			>
				{#if locations_query.isLoading}
					<LucideLoaderCircle class="animate-spin" />
					<p class="text-sm text-muted-foreground">Loading</p>
				{:else if location_id == null || !location}
					<p class="text-sm text-muted-foreground">No Location</p>
				{:else}
					<LocationMarker {location} />
					<p class="text-sm">{location.name}</p>
				{/if}
			</Button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent align="end" class="p-0">
		<Command shouldFilter={false}>
			<CommandInput bind:value={filter_query} rootClass="h-8" placeholder="Search Locations" />
			<CommandList>
				<CommandGroup heading="Workspace Locations">
					{#each filtered_locations as location (location.id)}
						<CommandItem
							class="rounded-4xl"
							onSelect={() => HandleLocationSelect(location.id)}
							value={location.name}><LocationMarker {location} /> {location.name}</CommandItem
						>
					{/each}

					{#if filtered_locations.length == 0 && filter_query.length > 0}
						<CommandItem class="rounded-4xl" onSelect={() => CreateNewLocation(filter_query)}
							><RawMarker colour_data={GetColourFromString(filter_query)} /> Create Location "{filter_query}"</CommandItem
						>
					{/if}
				</CommandGroup>

				<CommandEmpty>No Locations To Display</CommandEmpty>
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>
