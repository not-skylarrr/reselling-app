<script lang="ts">
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import SettingsLayout from "$lib/components/settings/layout/SettingsLayout.svelte";
	import SettingsHeader from "$lib/components/settings/layout/SettingsHeader.svelte";
	import SettingsHeaderActions from "$lib/components/settings/layout/SettingsHeaderActions.svelte";
	import { Button } from "$lib/components/ui/button";
	import { LucideArchive, LucideCheck, LucidePlus, LucideTrash } from "@lucide/svelte";
	import {
		createTransaction,
		useLiveQuery,
		type Transaction,
		debounceStrategy,
		createPacedMutations,
	} from "@tanstack/svelte-db";
	import { LabelsCollection, LocationsCollection } from "$lib/collections/def.svelte";
	import { trpc_client } from "$lib/trpc/client";
	import { session_state } from "$lib/utils/session.svelte";
	import {
		CreateColourExportString,
		PLACEHOLDER_COLOUR_DATA,
	} from "$lib/components/ui/colour-picker/lib/utils";
	import { SvelteMap } from "svelte/reactivity";
	import type { UpdateWorkspaceLocation, WorkspaceLocation } from "$lib/server/db/schema";
	import { toast } from "svelte-sonner";
	import ColourPickerPopover from "$lib/components/ui/colour-picker/ColourPickerPopover.svelte";
	import Input from "$lib/components/ui/input/input.svelte";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte";
	import { FormatDateStd } from "$lib/utils/formatting";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { auth_client } from "$lib/auth-client";

	let { data } = $props();

	const locations_query = useLiveQuery((q) =>
		q.from({ label: LocationsCollection }).orderBy(({ label }) => label.created_at, "desc"),
	);

	let location_tx_map = new SvelteMap<string, Transaction>();

	const can_create_location = $derived(
		auth_client.organization.checkRolePermission({
			role: data.org_role,
			permissions: {
				locations: ["create"],
			},
		}),
	);

	const can_update_location = $derived(
		auth_client.organization.checkRolePermission({
			role: data.org_role,
			permissions: {
				locations: ["update"],
			},
		}),
	);

	const can_delete_location = $derived(
		auth_client.organization.checkRolePermission({
			role: data.org_role,
			permissions: {
				locations: ["delete"],
			},
		}),
	);

	const mutate_label = createPacedMutations<{
		id: string;
		field: keyof UpdateWorkspaceLocation;
		value: any;
	}>({
		onMutate: ({ id, field, value }) => {
			LocationsCollection.update(id, (label) => {
				label[field] = value;
			});
		},
		mutationFn: async ({ transaction }) => {
			const updates = transaction.mutations.filter((mut) => mut.type == "update");

			await trpc_client.workspace.locations.update_ts_db.mutate(
				updates.map((change) => ({
					id: change.key,
					changes: change.changes,
				})),
			);

			await LocationsCollection.utils.refetch();

			toast.success("Changes saved...");
		},
		strategy: debounceStrategy({ wait: 500 }),
	});

	function CreateNewLocation() {
		const label_tx = createTransaction({
			autoCommit: false,
			mutationFn: async ({ transaction }) => {
				const inserts = transaction.mutations.filter((m) => m.type == "insert");
				const updates = transaction.mutations.filter((m) => m.type == "update");

				await trpc_client.workspace.locations.insert_ts_db.mutate(
					// @ts-expect-error Typing meh
					inserts.map((mut) => mut.modified),
				);

				await trpc_client.workspace.locations.update_ts_db.mutate(
					updates.map((mut) => ({ id: mut.key, changes: mut.changes })),
				);

				await LocationsCollection.utils.refetch();
			},
		});

		const location_id = GenerateQuickId();

		label_tx.mutate(() => {
			LocationsCollection.insert({
				id: location_id,
				workspace_id: session_state.workspace_id,
				name: "",
				colour: CreateColourExportString(PLACEHOLDER_COLOUR_DATA),
				created_at: new Date(),
			});
		});

		location_tx_map.set(location_id, label_tx);
	}

	async function PersistLocalLocation(location_id: string) {
		if (!location_tx_map.has(location_id)) return;

		const location_tx = location_tx_map.get(location_id)!;

		try {
			await location_tx.commit();

			location_tx_map.delete(location_id);
		} catch (e) {
			console.error(e);

			toast.error("Failed to save label");
		}
	}

	function UpdateLocation<K extends keyof UpdateWorkspaceLocation>(
		location_id: string,
		key: K,
		value: WorkspaceLocation[K],
	) {
		if (location_tx_map.has(location_id)) {
			// Is local draft label
			const label_tx = location_tx_map.get(location_id)!;

			label_tx.mutate(() => {
				LocationsCollection.update(location_id, (label) => {
					label[key] = value;
				});
			});
		} else {
			mutate_label({ id: location_id, field: key, value: value });
		}
	}

	function DeleteLocation(location_id: string, ignore_warning: boolean = false) {
		if (ignore_warning) {
			LabelsCollection.delete(location_id);
			return;
		}

		OpenDestructiveActionDialog({
			title: "Are you sure?",
			description: "This location cannot be recovered once it has been deleted",
			onConfirm: () => {
				LabelsCollection.delete(location_id);
			},
		});
	}
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Settings", href: "/settings" },
			{ type: "page", text: "Workspace Locations" },
		]}
	></DashboardHeader>

	<DashboardContent>
		<SettingsLayout class="flex-1 gap-10" size="lg">
			<SettingsHeader>
				<p class="text-2xl font-medium">Workspace Locations</p>
				<p class="text-sm text-muted-foreground">Track the locations of your inventory items</p>

				{#if can_create_location}
					<SettingsHeaderActions>
						<Button onclick={CreateNewLocation}><LucidePlus /> New Location</Button>
					</SettingsHeaderActions>
				{/if}
			</SettingsHeader>

			{#if locations_query.data.length == 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-2">
					<LucideArchive class="size-9 stroke-muted-foreground stroke-1" />
					<p class="text-sm text-muted-foreground">You have no locations</p>
				</div>
			{:else}
				<div class="@container flex flex-col gap-3">
					<div
						class="grid grid-cols-[32px_1fr_128px] gap-6 border-b pb-3 @lg:grid-cols-[32px_2fr_1fr_128px]"
					>
						<p></p>
						<p class="pl-3 text-xs text-muted-foreground">Name</p>
						<p class=" text-xs text-muted-foreground">Created</p>
					</div>

					{#each locations_query.data as location (location.id)}
						<div
							class="group grid w-full grid-cols-[32px_1fr_128px] items-center gap-6 @lg:grid-cols-[32px_2fr_1fr_128px]"
						>
							<ColourPickerPopover
								buttonVariant="ghost"
								disabled={!can_update_location}
								initialColour={location.colour}
								onColourChange={(colour) => UpdateLocation(location.id, "colour", colour)}
							/>

							<Input
								class="border border-transparent bg-transparent not-read-only:group-hover:border-border"
								readonly={!can_update_location}
								onchange={(ev) => UpdateLocation(location.id, "name", ev.currentTarget.value)}
								placeholder="Location name"
								value={location.name}
							/>

							<p class="hidden text-sm @lg:block">
								{FormatDateStd(location.created_at, true)}
							</p>

							<div class="flex flex-row items-center justify-end gap-2">
								{#if can_delete_location}
									<Button
										class="hidden group-hover:flex"
										onclick={(ev) => DeleteLocation(location.id, ev.shiftKey)}
										size="icon-sm"
										variant="destructive"><LucideTrash /></Button
									>
								{/if}

								{#if location_tx_map.has(location.id)}
									<Button onclick={() => PersistLocalLocation(location.id)} size="icon-sm"
										><LucideCheck /></Button
									>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>
