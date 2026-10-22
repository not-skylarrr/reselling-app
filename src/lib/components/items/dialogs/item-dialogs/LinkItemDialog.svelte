<script lang="ts">
	import { Button } from "$lib/components/ui/button";
	import {
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import { createTransaction, eq, toArray, useLiveQuery } from "@tanstack/svelte-db";
	import type { ItemDialogProps } from "../dialog-state.svelte";
	import {
		BundleItemsCollection,
		BundlesCollection,
		ItemAssociationsCollection,
	} from "$lib/collections/def.svelte";
	import {
		Command,
		CommandEmpty,
		CommandGroup,
		CommandInput,
		CommandItem,
		CommandList,
	} from "$lib/components/ui/command";
	import {
		LucideCheck,
		LucideChevronDown,
		LucideChevronRight,
		LucideLink,
		LucidePackage,
	} from "@lucide/svelte";
	import Plural from "$lib/components/utils/Plural.svelte";
	import {
		Item,
		ItemContent,
		ItemDescription,
		ItemMedia,
		ItemTitle,
	} from "$lib/components/ui/item";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { toast } from "svelte-sonner";
	import { session_state } from "$lib/utils/session.svelte";
	import { ApplyTsDbMutation } from "$lib/utils/ts-db/trpc-map";
	import ItemAssociations from "$lib/components/dashboard/inventory/inventory-sidebar/components/ItemAssociations.svelte";

	let { item, request_close }: ItemDialogProps<"link"> = $props();

	let current_step = $state(0);

	let bundle_id = $state<string | null>(null);
	let item_id = $state<string | null>(null);

	const bundles_query = useLiveQuery((q) =>
		q
			.from({ bundle: BundlesCollection })
			.orderBy(({ bundle }) => bundle.name, "desc")
			.select(({ bundle }) => ({
				...bundle,
				items: toArray(
					q
						.from({ item: BundleItemsCollection })
						.where(({ item }) => eq(item.bundle_id, bundle.id)),
				),
			})),
	);

	const selected_bundle = $derived(
		bundle_id ? bundles_query.data.find((b) => b.id == bundle_id) : undefined,
	);

	const selected_item = $derived(
		item_id && selected_bundle ? selected_bundle.items.find((i) => i.id == item_id) : undefined,
	);

	async function HandleAssociationCreate() {
		if (!selected_item) return toast.error("No bundle item selected");

		try {
			const tx = createTransaction({
				autoCommit: false,
				mutationFn: async ({ transaction }) => {
					await ApplyTsDbMutation(transaction);
				},
			});

			const child_ids = IsBundleItemGroupHeader(selected_item.id);

			if (child_ids.length > 0) {
				tx.mutate(() => {
					for (const id of child_ids) {
						ItemAssociationsCollection.insert({
							id: GenerateQuickId(),
							item_id: item.id,
							subject_id: id,
							type: "bundle-item",
							workspace_id: session_state.workspace_id,
						});
					}
				});
			} else {
				tx.mutate(() => {
					ItemAssociationsCollection.insert({
						id: GenerateQuickId(),
						item_id: item.id,
						subject_id: selected_item.id,
						type: "bundle-item",
						workspace_id: session_state.workspace_id,
					});
				});
			}

			tx.commit();

			await tx.isPersisted.promise;

			request_close();

			toast.success("Association created successfully");
		} catch (e) {
			console.error(e);

			toast.error("Failed to sync association");
		}
	}

	function IsBundleItemGroupHeader(item_id: string): string[] {
		if (!selected_bundle) return [];

		const header_ids: Map<string, string[]> = new Map();

		for (const item of selected_bundle.items) {
			if (item.parent_id) {
				if (header_ids.has(item.parent_id)) {
					header_ids.get(item.parent_id)!.push(item.id);
				} else {
					header_ids.set(item.parent_id, [item.id]);
				}
			}
		}

		if (!header_ids.has(item_id)) return [];

		return header_ids.get(item_id)!;
	}

	function GoBack() {
		if (current_step == 0) return;

		current_step -= 1;
	}

	function GoForward() {
		if (current_step == 2) return;

		current_step += 1;
	}
</script>

<DialogContent class="max-h-128 w-full grid-rows-[auto_minmax(0,1fr)_auto] gap-6 sm:max-w-xl">
	{#if current_step == 0}
		<DialogHeader>
			<DialogTitle>Select Bundle</DialogTitle>
			<DialogDescription>Select the bundle the item is part of</DialogDescription>
		</DialogHeader>

		<Command class="gap-3 p-0">
			<CommandInput placeholder="Search Bundles..." />

			<CommandList>
				<CommandGroup>
					{#each bundles_query.data as bundle (bundle.id)}
						<CommandItem
							class="h-16 gap-4 px-4 data-selected:bg-accent/75"
							onSelect={() => (bundle_id = bundle.id)}
							value={bundle.name}
						>
							<LucidePackage class="size-5 stroke-muted-foreground" />

							<div class="grid flex-1">
								<p class="text-sm font-medium">{bundle.name}</p>
								<p class="text-xs text-muted-foreground">
									{bundle.items.length}
									<Plural count={bundle.items.length} singular="Item" plural="Items" />
								</p>
							</div>

							{#if bundle_id == bundle.id}
								<LucideCheck />
							{/if}
						</CommandItem>
					{/each}
				</CommandGroup>

				<CommandEmpty>No Results Found</CommandEmpty>
			</CommandList>
		</Command>

		<DialogFooter>
			<Button disabled={bundle_id == null} onclick={() => GoForward()}
				>Select Bundle
				<LucideChevronRight />
			</Button>
		</DialogFooter>
	{/if}

	{#if current_step == 1 && selected_bundle}
		<DialogHeader>
			<DialogTitle>Select Bundle Item</DialogTitle>
			<DialogDescription
				>Select the item inside the bundle you want to link to</DialogDescription
			>
		</DialogHeader>

		<Command class="gap-3 p-0">
			<CommandInput placeholder="Search Items..." />

			<CommandList>
				<CommandGroup>
					{#each selected_bundle.items as item (item.id)}
						<CommandItem
							class="h-12 gap-4 px-4 data-selected:bg-accent/75"
							onSelect={() => (item_id = item.id)}
							value={item.name}
						>
							<LucidePackage class="size-5 stroke-muted-foreground" />

							<div class="grid flex-1">
								<p class="text-sm font-medium">{item.name}</p>
							</div>

							{#if item_id == item.id}
								<LucideCheck />
							{/if}
						</CommandItem>
					{/each}
				</CommandGroup>

				<CommandEmpty>No Results Found</CommandEmpty>
			</CommandList>
		</Command>

		<DialogFooter>
			<Button onclick={() => GoBack()} variant="ghost">Go Back</Button>
			<Button disabled={item_id == null} onclick={() => GoForward()}
				>Select Item
				<LucideChevronRight />
			</Button>
		</DialogFooter>
	{/if}

	{#if current_step == 2 && selected_bundle && selected_item}
		<DialogHeader>
			<DialogTitle>Confirm Association</DialogTitle>
			<DialogDescription>Are you sure you want to associate these items?</DialogDescription>
		</DialogHeader>

		<div class="grid grid-cols-[1fr_36px_1fr] gap-3 py-6">
			<div class="flex flex-col items-center justify-center gap-3">
				<LucidePackage class="size-8 stroke-muted-foreground stroke-1" />
				<div class="grid">
					<p class="text-center text-base font-medium text-pretty">{item.name}</p>
					<p class="text-center text-xs text-muted-foreground">Inventory Item</p>
				</div>
			</div>

			<div class="flex items-center justify-center">
				<LucideChevronRight class="size-4 stroke-muted-foreground" />
			</div>

			<div class="flex flex-col items-center justify-center gap-3">
				<LucidePackage class="size-8 stroke-muted-foreground stroke-1" />

				<div class="grid">
					<p class="text-center text-base font-medium text-pretty">{selected_item.name}</p>
					<p class="text-center text-xs text-muted-foreground">{selected_bundle.name}</p>
				</div>
			</div>
		</div>

		<DialogFooter>
			<Button onclick={() => GoBack()} variant="ghost">Go Back</Button>
			<Button disabled={item_id == null} onclick={() => HandleAssociationCreate()}
				><LucideCheck /> Confirm Association</Button
			>
		</DialogFooter>
	{/if}
</DialogContent>
