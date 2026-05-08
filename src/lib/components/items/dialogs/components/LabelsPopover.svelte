<script lang="ts">
	import { LabelsCollection } from "$lib/collections/def.svelte";
	import LabelDisplay from "$lib/components/labels/LabelDisplay.svelte";
	import LabelMarkers from "$lib/components/labels/LabelMarkers.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import {
		CreateColourExportString,
		PLACEHOLDER_COLOUR_DATA,
	} from "$lib/components/ui/colour-picker/lib/utils";
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
	} from "$lib/components/ui/command";
	import { Popover, PopoverContent, PopoverTrigger } from "$lib/components/ui/popover";
	import { session_state } from "$lib/utils/session.svelte";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { LucideCheck, LucidePlus, LucideTags } from "@lucide/svelte";
	import { useLiveQuery } from "@tanstack/svelte-db";
	import { computeCommandScore } from "bits-ui";

	type Props = {
		label_ids: string[];
		onLabelIdsChange: (labels_ids: string[]) => void;
	};

	let { label_ids, onLabelIdsChange }: Props = $props();

	let open = $state(false);
	let filter_query = $state("");

	const labels_query = useLiveQuery(
		(q) => q.from({ label: LabelsCollection }),
		[() => label_ids],
	);

	const filtered_labels = $derived.by(() => {
		return labels_query.data
			.map((label) => [label, computeCommandScore(label.content, filter_query, [])] as const)
			.filter(([_, score]) => score > 0)
			.sort(([_a, a_score], [_b, b_score]) => b_score - a_score)
			.map(([label]) => label);
	});

	const selected_labels = $derived(
		labels_query.data.filter((label) => label_ids.includes(label.id)),
	);

	function ToggleLabel(label_id: string) {
		if (label_ids.includes(label_id)) {
			onLabelIdsChange(label_ids.filter((id) => id != label_id));
		} else {
			onLabelIdsChange([...label_ids, label_id]);
		}
	}

	function CreateNewLabel(label_name: string) {
		const label_id = GenerateQuickId();

		LabelsCollection.insert({
			id: label_id,
			content: label_name,
			colour: CreateColourExportString(PLACEHOLDER_COLOUR_DATA),
			created_at: new Date(),
			workspace_id: session_state.workspace_id,
		});

		ToggleLabel(label_id);
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
					{#if label_ids.length == 0}
						<LucideTags />
						Add Labels
					{:else}
						<LabelDisplay {label_ids} />
					{/if}
				</Badge>
			</button>
		{/snippet}
	</PopoverTrigger>
	<PopoverContent align="start" class="p-0" side="top">
		<Command shouldFilter={false}>
			<CommandInput bind:value={filter_query} placeholder="Search Labels" rootClass="h-8" />
			<CommandList>
				<CommandGroup heading="Workspace Labels">
					{#each filtered_labels as label (label.id)}
						<CommandItem
							class="rounded-4xl"
							onSelect={() => ToggleLabel(label.id)}
							value={label.content}
						>
							<LabelMarkers labels={[label]} />
							<p class="flex-1">{label.content}</p>

							{#if selected_labels.includes(label)}
								<LucideCheck />
							{/if}
						</CommandItem>
					{/each}

					{#if filtered_labels.length == 0 && filter_query.length > 0}
						<CommandItem class="rounded-4xl" onSelect={() => CreateNewLabel(filter_query)}
							><LucidePlus class="stroke-muted-foreground" /> Create Label "{filter_query}"</CommandItem
						>
					{/if}
				</CommandGroup>

				<CommandEmpty>No Labels To Display</CommandEmpty>
			</CommandList>
		</Command>
	</PopoverContent>
</Popover>
