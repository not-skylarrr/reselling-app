<script lang="ts">
	import { BundlesCollection, BundleItemsCollection } from "$lib/collections/def.svelte";
	import { Badge } from "$lib/components/ui/badge";
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
	} from "$lib/components/ui/command";
	import { Dialog, DialogContent, DialogTrigger } from "$lib/components/ui/dialog";
	import { LucideLink } from "@lucide/svelte";
	import { useLiveQuery, toArray, eq } from "@tanstack/svelte-db";

	type Props = {
		bundle_item_id: string | null;
		onSelectedBundleChange: (bundle_id: string | null) => void;
	};

	let { bundle_item_id, onSelectedBundleChange }: Props = $props();

	let dialog_open = $state(false);
	let dialog_bundle_id = $state<string | null>(null);
	let dialog_query = $state("");

	const all_bundles_query = useLiveQuery((q) =>
		q.from({ bundle: BundlesCollection }).select(({ bundle }) => ({
			...bundle,
			items: toArray(
				q
					.from({ item: BundleItemsCollection })
					.where(({ item }) => eq(item.bundle_id, bundle.id))
					.orderBy(({ item }) => item.name, "asc"),
			),
		})),
	);

	const bundle_item_query = useLiveQuery(
		(q) =>
			q
				.from({ bundle_item: BundleItemsCollection })
				.where(({ bundle_item }) => eq(bundle_item.id, bundle_item_id))
				.findOne(),
		[() => bundle_item_id],
	);

	const selected_bundle_item = $derived(bundle_item_query.data ?? undefined);

	const displayed_bundle = $derived(
		dialog_bundle_id ? all_bundles_query.data.find((b) => b.id == dialog_bundle_id) : undefined,
	);

	function HandleBundleSelect(bundle_id: string) {
		dialog_bundle_id = bundle_id;
		dialog_query = "";
	}

	function HandleBundleItemSelect(item_id: string) {
		onSelectedBundleChange(item_id);

		dialog_open = false;
	}

	function HandleEscapePress(ev: Event) {
		if (dialog_bundle_id != null) {
			ev.preventDefault();

			dialog_bundle_id = null;
			dialog_query = "";
		}
	}
</script>

<Dialog bind:open={dialog_open}>
	<DialogTrigger>
		{#snippet child({ props })}
			<button {...props} class="rounded-full" type="button">
				<Badge class="hover:bg-accent" size="lg" variant="outline">
					<LucideLink />

					{#if selected_bundle_item}
						{selected_bundle_item.name}
					{:else}
						No Association
					{/if}
				</Badge>
			</button>
		{/snippet}
	</DialogTrigger>
	<DialogContent
		class="p-0 sm:max-w-xl"
		onEscapeKeydown={HandleEscapePress}
		showCloseButton={false}
	>
		<Command>
			<CommandInput
				placeholder={dialog_bundle_id == null ? "Search Bundles" : "Search Bundle Items"}
				bind:value={dialog_query}
			/>

			<CommandList>
				{#if !displayed_bundle}
					{#if dialog_query.length > 0}
						<CommandGroup heading="Workspace Bundles">
							{#each all_bundles_query.data as bundle (bundle.id)}
								<CommandItem
									class="h-10"
									onSelect={() => HandleBundleSelect(bundle.id)}
									value={bundle.name}>{bundle.name}</CommandItem
								>
							{/each}
						</CommandGroup>
					{:else}
						<CommandEmpty>Start Typing To Select</CommandEmpty>
					{/if}
				{:else}
					<CommandGroup heading={displayed_bundle.name}>
						{#each displayed_bundle.items as item (item.id)}
							<CommandItem
								class="h-10"
								onSelect={() => HandleBundleItemSelect(item.id)}
								value={item.name}>{item.name}</CommandItem
							>
						{/each}
					</CommandGroup>
				{/if}
			</CommandList>
		</Command>
	</DialogContent>
</Dialog>
