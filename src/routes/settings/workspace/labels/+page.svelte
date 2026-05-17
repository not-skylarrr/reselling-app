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
		eq,
		toArray,
		count,
	} from "@tanstack/svelte-db";
	import { LabelJoinsCollection, LabelsCollection } from "$lib/collections/def.svelte";
	import { trpc_client } from "$lib/trpc/client";
	import { session_state } from "$lib/utils/session.svelte";
	import {
		CreateColourExportString,
		PLACEHOLDER_COLOUR_DATA,
	} from "$lib/components/ui/colour-picker/lib/utils";
	import { SvelteMap } from "svelte/reactivity";
	import type { UpdateWorkspaceLabel, WorkspaceLabel } from "$lib/server/db/schema";
	import { toast } from "svelte-sonner";
	import ColourPickerPopover from "$lib/components/ui/colour-picker/ColourPickerPopover.svelte";
	import Input from "$lib/components/ui/input/input.svelte";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte";
	import { FormatDateStd } from "$lib/utils/formatting";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { auth_client } from "$lib/auth-client";

	let { data } = $props();

	const labels_query = useLiveQuery((q) =>
		q
			.from({ label: LabelsCollection })
			.orderBy(({ label }) => label.created_at, "desc")
			.select(({ label }) => ({
				...label,
				label_joins: toArray(
					q
						.from({ join: LabelJoinsCollection })
						.where(({ join }) => eq(join.label_id, label.id)),
				),
			})),
	);

	let label_tx_map = new SvelteMap<string, Transaction>();

	const can_create_label = $derived(
		auth_client.organization.checkRolePermission({
			role: data.org_role,
			permissions: {
				labels: ["create"],
			},
		}),
	);

	const can_update_label = $derived(
		auth_client.organization.checkRolePermission({
			role: data.org_role,
			permissions: {
				labels: ["update"],
			},
		}),
	);

	const can_delete_label = $derived(
		auth_client.organization.checkRolePermission({
			role: data.org_role,
			permissions: {
				labels: ["delete"],
			},
		}),
	);

	const mutate_label = createPacedMutations<{
		id: string;
		field: keyof UpdateWorkspaceLabel;
		value: any;
	}>({
		onMutate: ({ id, field, value }) => {
			LabelsCollection.update(id, (label) => {
				label[field] = value;
			});
		},
		mutationFn: async ({ transaction }) => {
			const updates = transaction.mutations.filter((mut) => mut.type == "update");

			await trpc_client.workspace.labels.update_ts_db.mutate(
				updates.map((change) => ({
					id: change.key,
					changes: change.changes,
				})),
			);

			await LabelsCollection.utils.refetch();

			toast.success("Changes saved...");
		},
		strategy: debounceStrategy({ wait: 500 }),
	});

	function CreateNewLabel() {
		const label_tx = createTransaction({
			autoCommit: false,
			mutationFn: async ({ transaction }) => {
				const inserts = transaction.mutations.filter((m) => m.type == "insert");
				const updates = transaction.mutations.filter((m) => m.type == "update");

				await trpc_client.workspace.labels.insert_ts_db.mutate(
					// @ts-expect-error Typing meh
					inserts.map((mut) => mut.modified),
				);

				await trpc_client.workspace.labels.update_ts_db.mutate(
					updates.map((mut) => ({ id: mut.key, changes: mut.changes })),
				);

				await LabelsCollection.utils.refetch();
			},
		});

		const label_id = GenerateQuickId();

		label_tx.mutate(() => {
			LabelsCollection.insert({
				id: label_id,
				workspace_id: session_state.workspace_id,
				content: "",
				colour: CreateColourExportString(PLACEHOLDER_COLOUR_DATA),
				created_at: new Date(),
			});
		});

		label_tx_map.set(label_id, label_tx);
	}

	async function PersistLocalLabel(label_id: string) {
		if (!label_tx_map.has(label_id)) return;

		const label_tx = label_tx_map.get(label_id)!;

		try {
			await label_tx.commit();

			label_tx_map.delete(label_id);
		} catch (e) {
			console.error(e);

			toast.error("Failed to save label");
		}
	}

	function UpdateLabel<K extends keyof UpdateWorkspaceLabel>(
		label_id: string,
		key: K,
		value: WorkspaceLabel[K],
	) {
		if (label_tx_map.has(label_id)) {
			// Is local draft label
			const label_tx = label_tx_map.get(label_id)!;

			label_tx.mutate(() => {
				LabelsCollection.update(label_id, (label) => {
					label[key] = value;
				});
			});
		} else {
			mutate_label({ id: label_id, field: key, value: value });
		}
	}

	function DeleteLabel(label_id: string, ignore_warning: boolean = false) {
		if (ignore_warning) {
			LabelsCollection.delete(label_id);
			return;
		}

		OpenDestructiveActionDialog({
			title: "Are you sure?",
			description: "This label cannot be recovered once it has been deleted",
			onConfirm: () => {
				LabelsCollection.delete(label_id);
			},
		});
	}
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Settings", href: "/settings" },
			{ type: "page", text: "Workspace Labels" },
		]}
	></DashboardHeader>

	<DashboardContent>
		<SettingsLayout size="lg">
			<SettingsHeader>
				<p class="text-2xl font-medium">Workspace Labels</p>
				<p class="text-sm text-muted-foreground">
					The labels used to group and filter your inventory items
				</p>

				{#if can_create_label}
					<SettingsHeaderActions>
						<Button onclick={CreateNewLabel}><LucidePlus /> New Label</Button>
					</SettingsHeaderActions>
				{/if}
			</SettingsHeader>

			{#if labels_query.data.length == 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-2">
					<LucideArchive class="size-9 stroke-muted-foreground stroke-1" />
					<p class="text-sm text-muted-foreground">You have no labels</p>
				</div>
			{:else}
				<div class="@container flex flex-col gap-3">
					<div
						class="grid grid-cols-[32px_1fr_128px] gap-6 border-b pb-3 @lg:grid-cols-[32px_2fr_1fr_128px]"
					>
						<p></p>
						<p class="pl-3 text-xs text-muted-foreground">Name</p>
						<p class=" text-xs text-muted-foreground">Item Count</p>
					</div>

					{#each labels_query.data as label (label.id)}
						<div
							class="group grid w-full grid-cols-[32px_1fr_32px_128px] items-center gap-6 @lg:grid-cols-[32px_2fr_1fr_128px]"
						>
							<ColourPickerPopover
								buttonVariant="ghost"
								disabled={!can_update_label}
								initialColour={label.colour}
								onColourChange={(colour) => UpdateLabel(label.id, "colour", colour)}
							/>

							<Input
								class="border border-transparent bg-transparent not-read-only:group-hover:border-border"
								readonly={!can_update_label}
								onchange={(ev) => UpdateLabel(label.id, "content", ev.currentTarget.value)}
								placeholder="Label name"
								value={label.content}
							/>

							<p class="hidden text-sm @lg:block">
								{label.label_joins.length}
							</p>

							<div class="flex flex-row items-center justify-end gap-2">
								{#if can_delete_label}
									<Button
										class="hidden group-hover:flex"
										onclick={(ev) => DeleteLabel(label.id, ev.shiftKey)}
										size="icon-sm"
										variant="destructive"><LucideTrash /></Button
									>
								{/if}

								{#if label_tx_map.has(label.id)}
									<Button onclick={() => PersistLocalLabel(label.id)} size="icon-sm"
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
