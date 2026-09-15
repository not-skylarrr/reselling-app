<script lang="ts">
	import {
		ItemMetadataDefinitionsCollection,
		LabelsCollection,
		MetadataLabelJoinsCollection,
	} from "$lib/collections/def.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import SidebarLabelSelector from "$lib/components/labels/SidebarLabelSelector.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import {
		SettingsDescription,
		SettingsHeader,
		SettingsLayout,
		SettingsTitle,
	} from "$lib/components/settings/layout";
	import SettingsHeaderActions from "$lib/components/settings/layout/SettingsHeaderActions.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldLabel,
	} from "$lib/components/ui/field";
	import ScrollArea from "$lib/components/ui/scroll-area/scroll-area.svelte";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import { Tooltip, TooltipTrigger } from "$lib/components/ui/tooltip";
	import TooltipContent from "$lib/components/ui/tooltip/tooltip-content.svelte";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte";
	import { GetMetadataTypeName } from "$lib/items/metadata";
	import type { ItemMetadataDefinition } from "$lib/server/db/schema";
	import { session_state } from "$lib/utils/session.svelte";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { LucideInbox, LucideLoaderCircle, LucidePlus, LucideTrash } from "@lucide/svelte";
	import { eq, toArray, useLiveQuery } from "@tanstack/svelte-db";

	const metadata_definitions_query = useLiveQuery((q) =>
		q.from({ definition: ItemMetadataDefinitionsCollection }).select(({ definition }) => ({
			...definition,
			label_joins: toArray(
				q
					.from({ label_join: MetadataLabelJoinsCollection })
					.where(({ label_join }) => eq(label_join.definition_id, definition.id))
					.innerJoin({ label: LabelsCollection }, ({ label_join, label }) =>
						eq(label.id, label_join.label_id),
					)
					.select(({ label_join, label }) => ({
						...label_join,
						label: label,
					})),
			),
		})),
	);

	function CreateNewField() {
		const id = GenerateQuickId();

		ItemMetadataDefinitionsCollection.insert({
			id,
			workspace_id: session_state.workspace_id,
			name: "",
			type: "string",
			required: false,
			created_at: new Date(),
		});
	}

	function UpdateFieldKey<K extends keyof ItemMetadataDefinition>(
		field_id: string,
		key: K,
		value: ItemMetadataDefinition[K],
	) {
		ItemMetadataDefinitionsCollection.update(field_id, (definition) => {
			definition[key] = value;
		});
	}

	function HandleLabelsChange(definition_id: string, label_ids: string[]) {
		const definition = metadata_definitions_query.data.find((def) => def.id == definition_id);
		if (!definition) throw new Error("Invalid definition id");

		for (const label_join of definition.label_joins) {
			if (!label_ids.includes(label_join.label_id))
				MetadataLabelJoinsCollection.delete(label_join.id);
		}

		const existing_label_ids = new Set(definition.label_joins.map((join) => join.label_id));

		for (const label_id of label_ids) {
			if (!existing_label_ids.has(label_id)) {
				MetadataLabelJoinsCollection.insert({
					id: GenerateQuickId(),
					definition_id,
					label_id,
					workspace_id: session_state.workspace_id,
					created_at: new Date(),
				});
			}
		}
	}

	function HandleFieldDelete(field_id: string) {
		OpenDestructiveActionDialog({
			title: "Are you sure?",
			description: "Once deleted this field cannot be recovered",
			onConfirm: async () => {
				ItemMetadataDefinitionsCollection.delete(field_id);
			},
		});
	}
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Settings", href: "/settings" },
			{ type: "page", text: "Item Metadata" },
		]}
	/>

	<DashboardContent>
		<SettingsLayout size="lg">
			<SettingsHeader>
				<SettingsTitle>Item Metadata</SettingsTitle>
				<SettingsDescription
					>Define additional metadata fields for an item type</SettingsDescription
				>

				<SettingsHeaderActions>
					<Button onclick={() => CreateNewField()}><LucidePlus /> New Field</Button>
				</SettingsHeaderActions>
			</SettingsHeader>

			{#if metadata_definitions_query.data.length == 0}
				<div class="flex flex-1 flex-col items-center justify-center gap-2">
					<LucideInbox class="size-9 stroke-muted-foreground stroke-1" />
					<p class="text-sm">Nothing to display</p>
				</div>
			{:else}
				<ScrollArea class="flex-1 overflow-hidden">
					<div class="flex flex-col gap-6">
						{#each metadata_definitions_query.data as definition (definition.id)}
							<FormCard>
								<FormCardSection
									class="group flex flex-row items-center justify-between gap-6 py-2"
								>
									<input
										class="h-8 flex-1 border-none text-base font-medium outline-none"
										onchange={(ev) =>
											UpdateFieldKey(definition.id, "name", ev.currentTarget.value)}
										placeholder="Field Name (eg: CEX Price etc.)"
										value={definition.name}
									/>

									{#if definition.$synced == false}
										<LucideLoaderCircle class="size-4 animate-spin stroke-muted-foreground" />
									{/if}

									<Tooltip>
										<TooltipTrigger>
											{#snippet child({ props })}
												<Button
													{...props}
													class="hidden group-hover:flex"
													onclick={() => HandleFieldDelete(definition.id)}
													size="icon-sm"
													variant="destructive"><LucideTrash /></Button
												>
											{/snippet}
										</TooltipTrigger>
										<TooltipContent>
											<p>Delete Field</p>
										</TooltipContent>
									</Tooltip>
								</FormCardSection>

								<FormCardSection>
									<FieldGroup>
										<Field orientation="responsive">
											<FieldContent>
												<FieldLabel>Labels</FieldLabel>
												<FieldDescription>The labels that use this field</FieldDescription>
											</FieldContent>

											<FieldContent>
												<SidebarLabelSelector
													class="self-end"
													labels={definition.label_joins.map((join) => join.label)}
													onLabelsChange={(label_ids) =>
														HandleLabelsChange(definition.id, label_ids)}
												/>
											</FieldContent>
										</Field>

										<Field orientation="responsive">
											<FieldContent>
												<FieldLabel>Field Type</FieldLabel>
												<FieldDescription>The type of the metadata value</FieldDescription>
											</FieldContent>

											<FieldContent>
												<Select
													type="single"
													onValueChange={(val) =>
														UpdateFieldKey(definition.id, "type", val as any)}
													value={definition.type}
												>
													<SelectTrigger class="min-w-64 self-end">
														{GetMetadataTypeName(definition.type)}
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="string">Text</SelectItem>
														<SelectItem value="currency">Currency</SelectItem>
														<SelectItem value="number">Number</SelectItem>
													</SelectContent>
												</Select>
											</FieldContent>
										</Field>

										<Field orientation="responsive">
											<FieldContent>
												<FieldLabel>Field Required</FieldLabel>
												<FieldDescription
													>Whether the field is required when creating an item</FieldDescription
												>
											</FieldContent>

											<FieldContent>
												<Select
													type="single"
													onValueChange={(val) =>
														UpdateFieldKey(definition.id, "required", val == "yes")}
													value={definition.required ? "yes" : "no"}
												>
													<SelectTrigger class="min-w-64 self-end">
														{definition.required ? "Yes" : "No"}
													</SelectTrigger>
													<SelectContent>
														<SelectItem value="yes">Yes</SelectItem>
														<SelectItem value="no">No</SelectItem>
													</SelectContent>
												</Select>
											</FieldContent>
										</Field>
									</FieldGroup>
								</FormCardSection>
							</FormCard>
						{/each}
					</div>
				</ScrollArea>
			{/if}
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>
