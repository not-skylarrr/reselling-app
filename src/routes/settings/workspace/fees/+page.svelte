<script lang="ts">
	import {
		FeeGroupsCollection,
		LabelJoinsCollection,
		LabelsCollection,
	} from "$lib/collections/def.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import SidebarLabelSelector from "$lib/components/labels/SidebarLabelSelector.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import {
		SettingsLayout,
		SettingsHeader,
		SettingsTitle,
		SettingsDescription,
	} from "$lib/components/settings/layout";
	import { Button } from "$lib/components/ui/button";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldLabel,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import {
		InputGroupAddon,
		InputGroupInput,
		InputGroupText,
	} from "$lib/components/ui/input-group";
	import InputGroup from "$lib/components/ui/input-group/input-group.svelte";
	import { NumberInput } from "$lib/components/ui/number-input";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { Tooltip, TooltipContent, TooltipTrigger } from "$lib/components/ui/tooltip";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte";
	import type { FeeGroup, UpdateFeeGroup } from "$lib/server/db/schema";
	import { GetStringArrayDiff } from "$lib/utils/other";
	import { session_state } from "$lib/utils/session.svelte";
	import { ApplyTsDbMutation } from "$lib/utils/ts-db/trpc-map";
	import { GenerateAssociationId, GenerateQuickId } from "$lib/utils/web-crypto";
	import { LucidePlus, LucideTrash } from "@lucide/svelte";
	import {
		createPacedMutations,
		createTransaction,
		debounceStrategy,
		useLiveQuery,
		toArray,
		eq,
		and,
		type Transaction,
		queryOnce,
	} from "@tanstack/svelte-db";
	import { toast } from "svelte-sonner";
	import { SvelteMap } from "svelte/reactivity";

	const pending_insertion_map = new SvelteMap<string, Transaction>();

	const fee_groups_query = useLiveQuery((q) =>
		q.from({ group: FeeGroupsCollection }).select(({ group }) => ({
			...group,
			labels: toArray(
				q
					.from({ label_join: LabelJoinsCollection })
					.where(({ label_join }) =>
						and(eq(label_join.subject_id, group.id), eq(label_join.type, "fee-association")),
					)
					.innerJoin({ label: LabelsCollection }, ({ label, label_join }) =>
						eq(label.id, label_join.label_id),
					)
					.select(({ label }) => label),
			),
		})),
	);

	const debounced_mutate = createPacedMutations<{
		id: string;
		field: keyof UpdateFeeGroup;
		value: any;
	}>({
		onMutate: ({ id, field, value }) => {
			FeeGroupsCollection.update(id, (draft) => {
				// @ts-expect-error idk why this is a problem
				draft[field] = value;
			});
		},
		mutationFn: async ({ transaction }) => {
			await ApplyTsDbMutation(transaction);

			toast.success("Changes saved");
		},
		strategy: debounceStrategy({ wait: 500 }),
	});

	function InsertNewGroup() {
		const group_id = GenerateQuickId();

		const tx = createTransaction({
			autoCommit: false,
			mutationFn: async ({ transaction }) => {
				await ApplyTsDbMutation(transaction, false);
			},
		});

		tx.mutate(() => {
			FeeGroupsCollection.insert({
				id: group_id,
				name: "",
				fee_value_perc: 0,
				workspace_id: session_state.workspace_id,
			});
		});

		pending_insertion_map.set(group_id, tx);
	}

	function UpdateGroupValue<K extends keyof UpdateFeeGroup>(
		group_id: string,
		key: K,
		value: FeeGroup[K],
	) {
		const insert_transaction = pending_insertion_map.get(group_id);

		if (insert_transaction && value != undefined) {
			insert_transaction.mutate(() => {
				FeeGroupsCollection.update(group_id, (draft) => {
					draft[key] = value;
				});
			});

			return;
		}

		debounced_mutate({ id: group_id, field: key, value: value });
	}

	function HandleLabelsChange(group_id: string, label_ids: string[]) {
		const group = fee_groups_query.data.find((g) => g.id == group_id);
		if (!group) return;

		const [insertions, deletions] = GetStringArrayDiff(
			group.labels.map((l) => l.id),
			label_ids,
		);

		for (const insertion of insertions) {
			UpdateGroupLabel(group.id, insertion, true);
		}

		for (const deletion of deletions) {
			UpdateGroupLabel(group.id, deletion, false);
		}
	}

	function UpdateGroupLabel(group_id: string, label_id: string, is_insert: boolean) {
		const insert_transaction = pending_insertion_map.get(group_id);

		if (insert_transaction) {
			insert_transaction.mutate(() => {
				if (is_insert) {
					LabelJoinsCollection.insert({
						id: GenerateAssociationId(label_id, group_id),
						type: "fee-association",
						label_id: label_id,
						subject_id: group_id,
						workspace_id: session_state.workspace_id,
					});
				} else {
					LabelJoinsCollection.delete(GenerateAssociationId(label_id, group_id));
				}
			});
		} else {
			if (is_insert) {
				LabelJoinsCollection.insert({
					id: GenerateAssociationId(label_id, group_id),
					type: "fee-association",
					label_id: label_id,
					subject_id: group_id,
					workspace_id: session_state.workspace_id,
				});
			} else {
				LabelJoinsCollection.delete(GenerateAssociationId(label_id, group_id));
			}
		}
	}

	async function HandleLocalSave(group_id: string) {
		const tx = pending_insertion_map.get(group_id);
		if (!tx) return;

		await tx.commit();

		pending_insertion_map.delete(group_id);
	}

	function HandleLocalCancel(group_id: string) {
		const tx = pending_insertion_map.get(group_id);
		if (!tx) return;

		tx.rollback();

		pending_insertion_map.delete(group_id);
	}

	function HandleGroupDelete(group_id: string) {
		OpenDestructiveActionDialog({
			title: "Are you sure?",
			description: "Once deleted this group cannot be recovered",
			onConfirm: async () => {
				const group_joins = await queryOnce((q) =>
					q
						.from({ label_join: LabelJoinsCollection })
						.where(({ label_join }) => eq(label_join.subject_id, group_id)),
				);

				for (const join of group_joins) {
					LabelJoinsCollection.delete(join.id);
				}

				FeeGroupsCollection.delete(group_id);
			},
		});
	}
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Settings", href: "/settings" },
			{ type: "page", text: "Fee Calculation" },
		]}
	></DashboardHeader>

	<DashboardContent>
		<SettingsLayout class="@container" size="lg">
			<div class="flex flex-row items-center justify-between gap-3">
				<SettingsHeader>
					<SettingsTitle>Fee Calculation</SettingsTitle>
					<SettingsDescription
						>Define item catagories to allow for predicted fee calculations based off of
						marketplace fees</SettingsDescription
					>
				</SettingsHeader>

				<div class="hidden flex-row gap-2 @xl:flex">
					<Button onclick={() => InsertNewGroup()}><LucidePlus /> New Fee Group</Button>
				</div>
			</div>

			<ScrollArea class="flex-1 overflow-hidden">
				<div class="flex flex-col gap-4">
					{#each fee_groups_query.data as group (group.id)}
						<FormCard>
							<FormCardSection
								class="group flex flex-row items-center justify-between gap-6 py-2"
							>
								<input
									class="h-8 border-none text-base font-medium outline-none"
									onchange={(ev) => UpdateGroupValue(group.id, "name", ev.currentTarget.value)}
									placeholder="Group Name (eg. Mugs, CDs, etc.)"
									value={group.name}
								/>

								{#if !pending_insertion_map.has(group.id)}
									<Tooltip>
										<TooltipTrigger>
											{#snippet child({ props })}
												<Button
													{...props}
													class="hidden group-hover:flex"
													onclick={() => HandleGroupDelete(group.id)}
													size="icon-sm"
													variant="destructive"><LucideTrash /></Button
												>
											{/snippet}
										</TooltipTrigger>
										<TooltipContent>
											<p>Delete Fee Group</p>
										</TooltipContent>
									</Tooltip>
								{/if}
							</FormCardSection>

							<FormCardSection>
								<FieldGroup>
									<Field orientation="responsive">
										<FieldContent>
											<FieldLabel>Group Labels</FieldLabel>
											<FieldDescription>The item labels included in this group</FieldDescription
											>
										</FieldContent>
										<FieldControl>
											<SidebarLabelSelector
												class="self-end"
												labels={group.labels}
												onLabelsChange={(label_ids) => HandleLabelsChange(group.id, label_ids)}
											/>
										</FieldControl>
									</Field>

									<Field orientation="responsive">
										<FieldContent>
											<FieldLabel>Fee Percentage</FieldLabel>
											<FieldDescription
												>The percentage of the value of the item in fees</FieldDescription
											>
										</FieldContent>
										<FieldControl>
											<InputGroup>
												<NumberInput
													allowNegative={false}
													max={100}
													onValueChange={(val) =>
														UpdateGroupValue(group.id, "fee_value_perc", val ?? 0)}
													value={group.fee_value_perc}
												>
													{#snippet child({ props })}
														<InputGroupInput {...props} />
													{/snippet}
												</NumberInput>
												<InputGroupAddon align="inline-end">
													<InputGroupText>%</InputGroupText>
												</InputGroupAddon>
											</InputGroup>
										</FieldControl>
									</Field>
								</FieldGroup>
							</FormCardSection>

							{#if pending_insertion_map.has(group.id)}
								<FormCardSection class="flex flex-row items-center justify-end gap-3 py-1.5">
									<Button
										onclick={() => HandleLocalCancel(group.id)}
										size="sm"
										variant="outline">Cancel</Button
									>
									<Button onclick={() => HandleLocalSave(group.id)} size="sm"
										>Create Group</Button
									>
								</FormCardSection>
							{/if}
						</FormCard>
					{/each}
				</div>
			</ScrollArea>
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>
