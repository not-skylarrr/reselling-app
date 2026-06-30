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
	import { WithObjectDefaults } from "$lib/utils/other";
	import { session_state } from "$lib/utils/session.svelte";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { LucideLink } from "@lucide/svelte";
	import { useLiveQuery, toArray, eq } from "@tanstack/svelte-db";
	import { computeCommandScore } from "bits-ui";
	import { toast } from "svelte-sonner";

	type Props = {
		bundle_item_id: string | null;
		onSelectedBundleChange: (bundle_id: string | null) => void;
	};

	let { bundle_item_id, onSelectedBundleChange }: Props = $props();

	let dialog_open = $state(false);
	let dialog_bundle_id = $state<string | null>(null);
	let dialog_query = $state("");

	type CommandResult = {
		type: "bundle" | "bundle-item";
		id: string;
		label: string;
		value: string;
	};

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

	type CommandResults = {
		type: "bundles" | "bundle-items";
		items: CommandResult[];
	};

	const command_results = $derived.by((): CommandResults => {
		if (!dialog_bundle_id) {
			return {
				type: "bundles",
				items: FilterCommandResults(
					all_bundles_query.data.map(
						(bundle): CommandResult => ({
							type: "bundle",
							id: bundle.id,
							label: bundle.name,
							value: bundle.name,
						}),
					),
					dialog_query,
					{ type: "bundle" },
				),
			};
		}

		const selected_bundle = all_bundles_query.data.find((b) => b.id == dialog_bundle_id);
		if (!selected_bundle) return { type: "bundles", items: [] };

		return {
			type: "bundle-items",
			items: FilterCommandResults(
				selected_bundle.items.map(
					(item): CommandResult => ({
						type: "bundle-item",
						id: item.id,
						label: item.name,
						value: item.name,
					}),
				),
				dialog_query,
				{ allowFallback: true, type: "bundle-item" },
			),
		};
	});

	type FilterCommandResultsOptions = {
		allowFallback?: boolean;
		fallbackPrefix?: string;
		fallbackInputThreshold?: number;
		fallbackResultThreshold?: number;
		type: "bundle" | "bundle-item";
	};

	function FilterCommandResults(
		results: CommandResult[],
		input: string,
		opts: FilterCommandResultsOptions,
	) {
		const {
			allowFallback,
			fallbackPrefix,
			fallbackResultThreshold,
			fallbackInputThreshold,
			type,
		} = WithObjectDefaults(opts, {
			allowFallback: false,
			fallbackPrefix: "Create Item",
			fallbackInputThreshold: 3,
			fallbackResultThreshold: 2,
		});

		const filtered_results = results
			.map((result) => [result, computeCommandScore(result.value, input, [])] as const)
			.filter(([_, score]) => score > 0);

		if (
			allowFallback &&
			filtered_results.length <= fallbackResultThreshold &&
			input.length >= fallbackInputThreshold
		) {
			filtered_results.push([
				{
					type: type,
					id: `fallback-${GenerateQuickId()}`,
					label: `${fallbackPrefix} "${input}"`,
					value: input,
				},
				0.01,
			]);
		}

		return filtered_results
			.sort(([_a, a_score], [_b, b_score]) => b_score - a_score)
			.map(([result]) => result);
	}

	const selected_bundle_item = $derived(bundle_item_query.data ?? undefined);

	async function HandleResultSelect(result: CommandResult) {
		if (result.type == "bundle") {
			dialog_bundle_id = result.id;
			dialog_query = "";
			return;
		}

		if (result.type == "bundle-item") {
			let bundle_item_id = result.id;

			dialog_open = false;

			if (result.id.startsWith("fallback-")) {
				if (!dialog_bundle_id) return toast.error("Failed to get parent bundle id");

				bundle_item_id = GenerateQuickId();

				const tx = BundleItemsCollection.insert(
					{
						id: bundle_item_id,
						bundle_id: dialog_bundle_id,
						workspace_id: session_state.workspace_id,
						name: result.value,
						price: 0,
						parent_id: null,
					},
					{ optimistic: false },
				);

				const toast_id = GenerateQuickId();

				toast.loading("Creating bundle item...", { id: toast_id });

				try {
					await tx.isPersisted.promise;

					toast.success("Bundle item created!", { id: toast_id });
				} catch {
					toast.error("Failed to create bundle item...");

					dialog_open = true;
					return;
				}
			}

			onSelectedBundleChange(bundle_item_id);
			return;
		}
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
		<Command shouldFilter={false}>
			<CommandInput
				placeholder={dialog_bundle_id == null ? "Search Bundles" : "Search Bundle Items"}
				bind:value={dialog_query}
			/>

			<CommandList>
				<CommandGroup
					heading={command_results.type == "bundles" ? "Workspace Bundles" : "Bundle Items"}
				>
					{#if command_results.type == "bundles" && dialog_query.length == 0}
						<CommandEmpty>Start Typing Bundle Name</CommandEmpty>
					{:else}
						{#each command_results.items as result (result.id)}
							<CommandItem class="h-10" onSelect={() => HandleResultSelect(result)}
								>{result.label}</CommandItem
							>
						{/each}

						<CommandEmpty>No Results Found</CommandEmpty>
					{/if}
				</CommandGroup>
			</CommandList>
		</Command>
	</DialogContent>
</Dialog>
