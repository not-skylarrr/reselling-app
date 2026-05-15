<script lang="ts">
	import { LabelsCollection } from "$lib/collections/def.svelte";
	import { useLiveQuery } from "@tanstack/svelte-db";
	import LabelMarkers from "./LabelMarkers.svelte";
	import { LucideCheck, LucideLoader, LucidePlus } from "@lucide/svelte";
	import Button from "../ui/button/button.svelte";
	import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
	} from "../ui/command";
	import {
		CreateColourExportString,
		PLACEHOLDER_COLOUR_DATA,
	} from "../ui/colour-picker/lib/utils";
	import { session_state } from "$lib/utils/session.svelte";
	import { computeCommandScore } from "bits-ui";
	import { cn } from "$lib/utils";
	import { createHotkey } from "@tanstack/svelte-hotkeys";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import type { WorkspaceLabel } from "$lib/server/db/schema";

	type Props = {
		class?: string;
		enableHotkey?: boolean;
		labels: WorkspaceLabel[];
		onLabelsChange: (label_ids: string[]) => void;
	};

	let { class: class_name, enableHotkey = false, labels, onLabelsChange }: Props = $props();

	let open = $state(false);
	let filter_query = $state("");

	const labels_query = useLiveQuery((q) => q.from({ label: LabelsCollection }));

	const selected_label_set = $derived(new Set(labels.map((l) => l.id)));

	const filtered_labels = $derived.by(() => {
		return labels_query.data
			.map((label) => [label, computeCommandScore(label.content, filter_query, [])] as const)
			.filter(([_, score]) => score > 0)
			.sort(([_a, a_score], [_b, b_score]) => b_score - a_score)
			.map(([label]) => label);
	});

	function ToggleLabel(label_id: string) {
		if (selected_label_set.has(label_id)) {
			onLabelsChange(labels.filter((l) => l.id != label_id).map((l) => l.id));
		} else {
			onLabelsChange([...labels.map((l) => l.id), label_id]);
		}
	}

	async function CreateNewLabel(label_name: string) {
		const label_id = GenerateQuickId();

		try {
			const tx = LabelsCollection.insert({
				id: label_id,
				content: label_name,
				colour: CreateColourExportString(PLACEHOLDER_COLOUR_DATA),
				created_at: new Date(),
				workspace_id: session_state.workspace_id,
			});

			ToggleLabel(label_id);

			filter_query = "";

			await tx.isPersisted.promise;
		} catch (e) {
			ToggleLabel(label_id);
		}
	}

	function HandleOpenChangeComplete(open: boolean) {
		if (open == false) {
			filter_query = "";
		}
	}

	createHotkey(
		"L",
		() => (open = !open),
		() => ({ enabled: enableHotkey }),
	);
</script>

{#if labels_query.isLoading}
	<Button class={cn("font-normal", class_name)} disabled={true} size="xs" variant="ghost">
		<LucideLoader class="size-3 animate-spin" />
		<p class="text-sm text-muted-foreground">Loading</p>
	</Button>
{:else}
	<Popover bind:open onOpenChangeComplete={HandleOpenChangeComplete}>
		<PopoverTrigger>
			{#snippet child({ props })}
				<Button {...props} class={cn("font-normal", class_name)} size="xs" variant="ghost">
					{#if labels.length == 0}
						<p class="text-sm text-muted-foreground">No Labels</p>
					{:else}
						<LabelMarkers {labels} />

						{#if labels.length == 1}
							<p class="text-sm">
								{labels[0].content}
							</p>
						{:else}
							<p class="text-sm">
								{labels.length} Labels
							</p>
						{/if}
					{/if}
				</Button>
			{/snippet}
		</PopoverTrigger>
		<PopoverContent align="end" class="p-0">
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

								{#if selected_label_set.has(label.id)}
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
{/if}
