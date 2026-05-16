<script lang="ts" module>
	export type NewFormBundleItem = {
		id: string;
		name: string;
		price: number;
		parent_id: string | null;
	};

	export function CreateNewFormBundleItem(parent_id: string | null = null): NewFormBundleItem {
		return {
			id: GenerateQuickId(),
			name: "",
			price: 0,
			parent_id: parent_id,
		};
	}
</script>

<script lang="ts">
	import { goto } from "$app/navigation";

	import { BundleItemsCollection, BundlesCollection } from "$lib/collections/def.svelte";

	import NewBundleItemField from "$lib/components/bundles/create/NewBundleItemField.svelte";
	import SeriesInsertTool from "$lib/components/bundles/create/tools/SeriesInsertTool.svelte";

	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import {
		SettingsDescription,
		SettingsHeader,
		SettingsLayout,
		SettingsTitle,
	} from "$lib/components/settings/layout";
	import AlertDialogTitle from "$lib/components/ui/alert-dialog/alert-dialog-title.svelte";
	import { Button } from "$lib/components/ui/button";
	import { ButtonGroup } from "$lib/components/ui/button-group";
	import CurrencyInput from "$lib/components/ui/currency-input/CurrencyInput.svelte";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldError,
		FieldGroup,
		FieldLabel,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import { Input } from "$lib/components/ui/input";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemTitle,
	} from "$lib/components/ui/item";
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import Plural from "$lib/components/utils/Plural.svelte";
	import type { ItemBundle } from "$lib/server/db/schema";
	import { session_state } from "$lib/utils/session.svelte";
	import { ApplyTsDbMutation } from "$lib/utils/ts-db/trpc-map";
	import { GenerateQuickId } from "$lib/utils/web-crypto";
	import { LucideCheck, LucideChevronDown, LucidePlus, LucideX } from "@lucide/svelte";
	import { createTransaction, ilike, queryOnce } from "@tanstack/svelte-db";
	import { createForm, useStore } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";
	import { slide } from "svelte/transition";

	let similar_bundles = $state<ItemBundle[]>([]);
	let similar_bundles_dismissed = $state(false);

	let show_multiline_dialog = $state(false);
	let show_series_tool = $state(false);

	let multiline_item_id = $state("");
	let multiline_parent_id = $state<string | null>(null);
	let multiline_content = $state<string[]>([]);

	let multiline_dialog_res: ((val: boolean) => void) | null = null;

	const form = createForm(() => ({
		defaultValues: {
			name: "",
			price: 0,
			items: [
				{ id: GenerateQuickId(), name: "", price: 0, parent_id: null },
			] as NewFormBundleItem[],
		},
		onSubmit: async ({ value }) => {
			try {
				const tx = createTransaction({
					autoCommit: false,
					mutationFn: async ({ transaction }) => {
						await ApplyTsDbMutation(transaction);
					},
				});

				const bundle_id = GenerateQuickId();

				tx.mutate(() => {
					BundlesCollection.insert(
						{
							id: bundle_id,
							name: value.name,
							completed_price: value.price,
							created_at: new Date(),
							workspace_id: session_state.workspace_id,
						},
						{ optimistic: false },
					);
				});

				for (const item of value.items) {
					tx.mutate(() => {
						BundleItemsCollection.insert(
							{
								id: item.id,
								name: item.name,
								price: item.price,
								parent_id: item.parent_id,
								bundle_id: bundle_id,
								workspace_id: session_state.workspace_id,
							},
							{ optimistic: false },
						);
					});
				}

				try {
					await tx.commit();

					goto("/dashboard/bundles");
				} catch (e) {
					console.error(e);

					toast.error("Failed to create bundle");
				}
			} catch (e) {
				console.error(e);

				toast.error("Failed to create bundle");
			}
		},
	}));

	const base_name = useStore(form.store, (state) => state.values.name);

	function HandleMultilineInput(
		content: string[],
		item_id: string,
		parent_id: string | null = null,
	) {
		show_multiline_dialog = true;

		multiline_item_id = item_id;
		multiline_parent_id = parent_id;
		multiline_content = content;

		return new Promise<boolean>((res) => {
			multiline_dialog_res = res;
		});
	}

	function HandleMultilineInputResponse(paste_as_multi: boolean) {
		// NOTE: This is all kind of messy but it does work ig. Maybe redo one day

		if (!multiline_dialog_res) return;

		show_multiline_dialog = false;

		multiline_dialog_res(paste_as_multi);

		if (paste_as_multi == true) {
			const item_arr = [...form.getFieldValue("items")];

			const item_index = item_arr.findIndex((i) => i.id == multiline_item_id);
			if (item_index == -1) return;

			item_arr[item_index] = { ...item_arr[item_index], name: multiline_content[0] };

			for (let i = 1; i < multiline_content.length; i++) {
				let item = CreateNewFormBundleItem(multiline_parent_id);
				item.name = multiline_content[i];

				item_arr.splice(item_index + i, 0, item);
			}

			form.setFieldValue("items", item_arr);
		}

		multiline_content = [];
		multiline_parent_id = null;
		multiline_item_id = "";
	}

	async function FindSimiliarBundles(name: string) {
		if (name.length == 0) {
			similar_bundles = [];
			return;
		}

		const matching_bundles = await queryOnce((q) =>
			q
				.from({ bundle: BundlesCollection })
				.where(({ bundle }) => ilike(bundle.name, `%${name}%`)),
		);

		console.log(matching_bundles);

		similar_bundles = matching_bundles;
	}
</script>

<svelte:head>
	<title>New Bundle</title>
</svelte:head>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "link", text: "Bundles", href: "/dashboard/bundles" },
			{ type: "page", text: "Create New Bundle" },
		]}
	></DashboardHeader>
	<DashboardContent>
		<SettingsLayout size="lg">
			<FormCard>
				<FormCardSection>
					<FieldGroup>
						<div class="flex flex-col gap-0">
							<form.Field
								name="name"
								listeners={{
									onChangeDebounceMs: 1000,
									onChange: ({ value }) => FindSimiliarBundles(value),
								}}
							>
								{#snippet children(field)}
									<Field orientation="responsive">
										<FieldContent>
											<FieldLabel>Bundle Name</FieldLabel>

											{#if field.state.meta.errors.length > 0}
												<FieldError errors={field.state.meta.errors} />
											{:else}
												<FieldDescription class="hidden @md:block"
													>The name of the completed bundle</FieldDescription
												>
											{/if}
										</FieldContent>

										<FieldControl>
											<Input
												onblur={() => field.handleBlur()}
												oninput={(ev) => field.handleChange(ev.currentTarget.value)}
												placeholder="eg. Friends Complete Series"
												value={field.state.value}
											/>
										</FieldControl>
									</Field>
								{/snippet}
							</form.Field>

							{#if similar_bundles.length > 0 && !similar_bundles_dismissed}
								<div class="pt-3" transition:slide={{ axis: "y" }}>
									<div class="flex flex-col gap-2 rounded-2xl border bg-muted/50 p-2 px-4 pb-4">
										<div class="flex flex-row items-center justify-between">
											<p class="text-xs text-muted-foreground">
												Bundles with similiar names found:
											</p>
											<Button
												class="hover:bg-sidebar-accent!"
												onclick={() => (similar_bundles_dismissed = true)}
												size="icon-xs"
												variant="ghost"><LucideX /></Button
											>
										</div>

										<ul class="flex list-inside list-decimal flex-col gap-1">
											{#each similar_bundles as bundle (bundle.id)}
												<li class="text-sm marker:text-muted-foreground">
													{bundle.name}
												</li>
											{/each}
										</ul>
									</div>
								</div>
							{/if}
						</div>

						<form.Field name="price">
							{#snippet children(field)}
								<Field orientation="responsive">
									<FieldContent>
										<FieldLabel>Bundle Price</FieldLabel>

										{#if field.state.meta.errors.length > 0}
											<FieldError errors={field.state.meta.errors} />
										{:else}
											<FieldDescription class="hidden @md:block"
												>The target sale price of the completed bundle</FieldDescription
											>
										{/if}
									</FieldContent>

									<FieldControl>
										<CurrencyInput
											onblur={() => field.handleBlur()}
											onValueChange={(val) => field.handleChange(val)}
											value={field.state.value}
										/>
									</FieldControl>
								</Field>
							{/snippet}
						</form.Field>
					</FieldGroup>
				</FormCardSection>
				<FormCardSection class="flex flex-row items-center justify-end">
					<Button onclick={() => form.handleSubmit()}><LucideCheck /> Create Bundle</Button>
				</FormCardSection>
			</FormCard>

			<form.Field name="items" mode="array">
				{#snippet children(field)}
					{@const main_items = field.state.value.filter((i) => i.parent_id == null)}

					<FormCard>
						<FormCardSection>
							<Item class="p-0">
								<ItemContent>
									<ItemTitle>Included Items</ItemTitle>
									<ItemDescription class="text-xs"
										>The items included inside this bundle</ItemDescription
									>
								</ItemContent>

								<ItemActions>
									<ButtonGroup>
										<Button
											onclick={() => {
												field.pushValue(CreateNewFormBundleItem());
											}}
											size="sm"
											variant="outline"><LucidePlus /> Add Item</Button
										>
										<DropdownMenu>
											<DropdownMenuTrigger>
												{#snippet child({ props })}
													<Button {...props} size="icon-sm" variant="outline"
														><LucideChevronDown /></Button
													>
												{/snippet}
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem onSelect={() => (show_series_tool = true)}
													>Series Tool</DropdownMenuItem
												>
											</DropdownMenuContent>
										</DropdownMenu>
									</ButtonGroup>
								</ItemActions>
							</Item>
						</FormCardSection>
						<ScrollArea>
							<div class="flex flex-col divide-y">
								{#each main_items as item, index (item.id)}
									{@const sub_items = field.state.value.filter((i) => i.parent_id == item.id)}

									<FormCardSection class="gap-0 p-0">
										<NewBundleItemField
											{index}
											{item}
											{sub_items}
											onItemChange={(new_item) => {
												const index = field.state.value.findIndex((i) => i.id == item.id);
												if (index == -1) return;

												field.replaceValue(index, new_item);
											}}
											onItemDelete={() => {
												const index = field.state.value.findIndex((i) => i.id == item.id);
												if (index == -1) return;

												field.removeValue(index);
											}}
											onSubItemsInsert={(item) => {
												field.pushValue(item);
											}}
											onSubItemChange={(item_id, new_item) => {
												const index = field.state.value.findIndex((i) => i.id == item_id);
												if (index == -1) return;

												field.replaceValue(index, new_item);
											}}
											onSubItemDelete={(item_id) => {
												const index = field.state.value.findIndex((i) => i.id == item_id);
												if (index == -1) return;

												field.removeValue(index);
											}}
											onMultiLinePaste={HandleMultilineInput}
										/>
									</FormCardSection>
								{/each}
							</div>
						</ScrollArea>
					</FormCard>
				{/snippet}
			</form.Field>
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>

<Dialog bind:open={show_multiline_dialog}>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Multiline Input Detected</DialogTitle>
			<DialogDescription
				>Would you like to enter this as one or multiple entries?</DialogDescription
			>
		</DialogHeader>

		<DialogFooter>
			<Button onclick={() => HandleMultilineInputResponse(false)} variant="outline"
				>Paste as 1 Entry</Button
			>

			<Button onclick={() => HandleMultilineInputResponse(true)}
				>Paste as {multiline_content.length}
				<Plural count={multiline_content.length} singular="Entry" plural="Entries" /></Button
			>
		</DialogFooter>
	</DialogContent>
</Dialog>

<SeriesInsertTool
	bind:open={show_series_tool}
	base_name={base_name.current}
	onItemsInsert={(items) => form.setFieldValue("items", items)}
/>
