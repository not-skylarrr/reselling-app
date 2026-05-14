<script lang="ts" module>
	export const workspace_import_schema = z.object({
		name: z.string().min(3),
		slug: z.string().regex(/^[a-z0-9-]*$/),
		labels: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				colour: z.string(),
			}),
		),
		locations: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				colour: z.string(),
			}),
		),
		bundles: z.array(
			z.object({
				id: z.string(),
				name: z.string(),
				bundle_price: z.number(),
				created_at: z.coerce.date(),
				items: z.array(
					z.object({
						id: z.string(),
						name: z.string(),
						price: z.number(),
						parent_id: z.string().nullable(),
					}),
				),
			}),
		),
	});

	type WorkspaceImport = z.infer<typeof workspace_import_schema>;
</script>

<script lang="ts">
	import { goto } from "$app/navigation";

	import { auth_client } from "$lib/auth-client";
	import {
		BundleItemsCollection,
		BundlesCollection,
		ItemAssociationsCollection,
		ItemFeesCollection,
		ItemsCollection,
		LabelJoinsCollection,
		LabelsCollection,
		ListingsCollection,
		LocationsCollection,
	} from "$lib/collections/def.svelte";

	import { Button } from "$lib/components/ui/button";
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle,
	} from "$lib/components/ui/card";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldLabel,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import { Input } from "$lib/components/ui/input";
	import { ApplyTsDbMutation } from "$lib/utils/ts-db/trpc-map";
	import { GenerateQuickId, GenerateRandomString } from "$lib/utils/web-crypto";
	import { LucideDownload, LucideLoaderCircle } from "@lucide/svelte";
	import { createTransaction } from "@tanstack/svelte-db";
	import { createForm } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";
	import { SvelteMap } from "svelte/reactivity";
	import z from "zod";
	import Papa from "papaparse";
	import { GetItemLabelJoinId } from "$lib/collections/lib/utils";

	type ImportStep = "workspace" | "items";

	let step = $state<ImportStep>("workspace");
	let imported_workspace = $state<WorkspaceImport | null>(null);
	let input_ref = $state<HTMLInputElement | null>(null);
	let is_importing_items = $state(false);

	let import_tx = createTransaction({
		autoCommit: false,
		mutationFn: async ({ transaction }) => {
			await ApplyTsDbMutation(transaction, false);
		},
	});

	const import_label_map = new Map<string, string>();
	const import_location_map = new Map<string, string>();
	const import_bundle_item_map = new Map<string, string>();

	let import_workspace_id = "";

	const workspace_form = createForm(() => ({
		defaultValues: {
			name: "",
			slug: "",
		},
		onSubmit: async ({ value }) => {
			if (!imported_workspace) return;

			try {
				const workspace = await auth_client.organization.create(
					{
						name: value.name,
						slug: value.slug,
					},
					{ throw: true },
				);

				import_tx.mutate(() => {
					if (!imported_workspace) return;

					import_workspace_id = workspace.id;

					for (const label of imported_workspace.labels) {
						const new_label_id = GenerateQuickId();

						import_label_map.set(label.id, new_label_id);

						LabelsCollection.insert({
							id: new_label_id,
							content: label.name,
							colour: label.colour,
							created_at: new Date(),
							workspace_id: workspace.id,
						});
					}

					for (const location of imported_workspace.locations) {
						const new_location_id = GenerateQuickId();

						import_location_map.set(location.id, new_location_id);

						LocationsCollection.insert({
							id: new_location_id,
							name: location.name,
							colour: location.colour,
							created_at: new Date(),
							workspace_id: workspace.id,
						});
					}

					for (const bundle of imported_workspace.bundles) {
						const bundle_id = GenerateQuickId();

						BundlesCollection.insert({
							id: bundle_id,
							name: bundle.name,
							completed_price: bundle.bundle_price,
							created_at: new Date(),
							workspace_id: workspace.id,
						});

						for (const item of bundle.items) {
							BundleItemsCollection.insert({
								id: item.id,
								name: item.name,
								price: item.price,
								parent_id: item.parent_id,
								bundle_id: bundle_id,
								workspace_id: workspace.id,
							});
						}
					}
				});

				import_tx.commit();

				await import_tx.isPersisted.promise;

				import_tx = createTransaction({
					autoCommit: false,
					mutationFn: async ({ transaction }) => {
						await ApplyTsDbMutation(transaction, false);
					},
				});

				step = "items";
			} catch (e) {
				console.error(e);

				toast.error("Failed to create workspace");
			}
		},
	}));

	function HandleSelectButtonClick() {
		if (!input_ref) return;

		input_ref.click();
	}

	type InputChangeEvent = Event & {
		currentTarget: EventTarget & HTMLInputElement;
	};

	function HandleInputValueChange(ev: InputChangeEvent) {
		const file = ev.currentTarget.files?.[0];
		if (!file) return toast.error("File not found");

		const file_reader = new FileReader();

		file_reader.onload = (e) => {
			const file_content = e.target?.result;
			if (!file_content) return toast.error("Failed to read file");

			const parsed_content = workspace_import_schema.safeParse(
				JSON.parse(file_content as string),
			);

			if (!parsed_content.success) return toast.error("Invalid workspace import file");

			imported_workspace = parsed_content.data;

			workspace_form.reset({
				name: parsed_content.data.name,
				slug: parsed_content.data.slug,
			});
		};

		file_reader.readAsText(file);
	}

	function HandleInputCsvValueChange(ev: InputChangeEvent) {
		const file = ev.currentTarget.files?.[0];
		if (!file) return toast.error("File not found");

		const file_reader = new FileReader();

		const post_insert_tx = createTransaction({
			autoCommit: false,
			mutationFn: async ({ transaction }) => {
				await ApplyTsDbMutation(transaction, false);
			},
		});

		file_reader.onload = (e) => {
			const file_content = e.target?.result;
			if (!file_content) return toast.error("Failed to read file");

			function toBool(v: unknown) {
				return String(v).toLowerCase() === "true" || String(v) === "1";
			}
			function toNum(v: unknown) {
				const n = Number(v);
				return Number.isFinite(n) ? n : null;
			}
			function toDate(v: unknown) {
				const d = new Date(String(v));
				return Number.isNaN(d.getTime()) ? null : d;
			}
			function toLabels(v: string) {
				const json = JSON.parse(v);
				if (!Array.isArray(json)) return [];

				return json.map((id) => {
					if (import_label_map.has(id)) {
						return import_label_map.get(id)!;
					} else {
						return "";
					}
				});
			}

			is_importing_items = true;

			Papa.parse<Record<string, string>>(file_content as string, {
				header: true,
				skipEmptyLines: "greedy",
				worker: true,
				dynamicTyping: false,
				step: (r_step) => {
					const row = r_step.data;

					const status = row["status"];

					let item_id = GenerateQuickId();
					let listing_id = GenerateQuickId();

					switch (status) {
						case "unlisted":
							import_tx.mutate(() => {
								ItemsCollection.insert({
									id: item_id,
									name: row["name"],
									status: "unlisted",
									status_int: 0,
									purchase_price: toNum(row["purchase_price"]) ?? 0,
									target_sale_price: toNum(row["target_sale_price"]) ?? 0,
									added_at: toDate(row["added_at"]) ?? new Date(),
									purchased_at: toDate(row["purchased_at"]) ?? new Date(),
									storage_location:
										import_location_map.get(row["storage_location"] ?? "") ?? null,
									refund_type: row["refund_type"] ?? null,
									refund_reason: row["refund_reason"] ?? null,
									workspace_id: import_workspace_id,
								});
							});
							break;

						case "listed":
							import_tx.mutate(() => {
								ItemsCollection.insert({
									id: item_id,
									name: row["name"],
									status: "listed",
									status_int: 1,
									purchase_price: toNum(row["purchase_price"]) ?? 0,
									target_sale_price: toNum(row["target_sale_price"]) ?? 0,
									added_at: toDate(row["added_at"]) ?? new Date(),
									purchased_at: toDate(row["purchased_at"]) ?? new Date(),
									storage_location:
										import_location_map.get(row["storage_location"] ?? "") ?? null,
									refund_type: row["refund_type"] ?? null,
									refund_reason: row["refund_reason"] ?? null,
									workspace_id: import_workspace_id,
								});

								ListingsCollection.insert({
									id: listing_id,
									item_id: item_id,
									workspace_id: import_workspace_id,
									status: "active",
									price: toNum(row["list_price"]) ?? 0,
									marketplace_id: "ebay",
									notes: null,
									reference_url: null,
									created_at: toDate(row["listed_at"]) ?? new Date(),
									expires_at: null,
									ended_at: null,
								});

								ItemFeesCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									listing_id: listing_id,
									workspace_id: import_workspace_id,
									type: "listing_fee",
									reference_name: "Imported Listing Fee",
									reference_details: "Automatically generated by importer",
									amount: toNum(row["listing_fees"]) ?? 0,
									buyer_paid: false,
									marketplace_id: "ebay",
									created_at: toDate(row["listed_at"]) ?? new Date(),
									removed: false,
									removal_reason: null,
								});
							});
							break;

						case "sold":
						case "posted":
						case "completed":
							import_tx.mutate(() => {
								ItemsCollection.insert({
									id: item_id,
									name: row["name"],
									status: "sold",
									status_int: 2,
									purchase_price: toNum(row["purchase_price"]) ?? 0,
									target_sale_price: toNum(row["target_sale_price"]) ?? 0,
									added_at: toDate(row["added_at"]) ?? new Date(),
									purchased_at: toDate(row["purchased_at"]) ?? new Date(),
									storage_location:
										import_location_map.get(row["storage_location"] ?? "") ?? null,
									refund_type: row["refund_type"] ?? null,
									refund_reason: row["refund_reason"] ?? null,
									workspace_id: import_workspace_id,
								});

								ListingsCollection.insert({
									id: listing_id,
									item_id: item_id,
									workspace_id: import_workspace_id,
									status: "sold",
									price: toNum(row["sale_price"]) ?? 0,
									marketplace_id: "ebay",
									notes: null,
									reference_url: null,
									created_at: toDate(row["listed_at"]) ?? new Date(),
									expires_at: null,
									ended_at: toDate(row["sold_at"]) ?? null,
								});

								ItemFeesCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									listing_id: listing_id,
									workspace_id: import_workspace_id,
									type: "listing_fee",
									reference_name: "Imported Listing Fee",
									reference_details: "Automatically generated by importer",
									amount: toNum(row["listing_fees"]) ?? 0,
									buyer_paid: false,
									marketplace_id: "ebay",
									created_at: toDate(row["listed_at"]) ?? new Date(),
									removed: false,
									removal_reason: null,
								});

								ItemFeesCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									listing_id: listing_id,
									workspace_id: import_workspace_id,
									type: "final_fee",
									reference_name: "Imported Sale Fee",
									reference_details: "Automatically generated by importer",
									amount: toNum(row["final_fees"]) ?? 0,
									buyer_paid: false,
									marketplace_id: "ebay",
									created_at: toDate(row["sold_at"]) ?? new Date(),
									removed: false,
									removal_reason: null,
								});

								ItemFeesCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									listing_id: listing_id,
									workspace_id: import_workspace_id,
									type: "postage_fee",
									reference_name: "Imported Postage Fee",
									reference_details: "Automatically generated by importer",
									amount: toNum(row["postage_price"]) ?? 0,
									buyer_paid: toBool(row["buyer_paid_postage"]) ?? false,
									marketplace_id: "ebay",
									created_at: toDate(row["sold_at"]) ?? new Date(),
									removed: false,
									removal_reason: null,
								});
							});
							break;

						case "refunded":
							import_tx.mutate(() => {
								ItemsCollection.insert({
									id: item_id,
									name: row["name"],
									status: "refunded",
									status_int: 3,
									purchase_price: toNum(row["purchase_price"]) ?? 0,
									target_sale_price: toNum(row["target_sale_price"]) ?? 0,
									added_at: toDate(row["added_at"]) ?? new Date(),
									purchased_at: toDate(row["purchased_at"]) ?? new Date(),
									storage_location:
										import_location_map.get(row["storage_location"] ?? "") ?? null,
									refund_type: row["refund_type"] ?? null,
									refund_reason: row["refund_reason"] ?? null,
									workspace_id: import_workspace_id,
								});

								ListingsCollection.insert({
									id: listing_id,
									item_id: item_id,
									workspace_id: import_workspace_id,
									status: "sold",
									price: toNum(row["sale_price"]) ?? 0,
									marketplace_id: "ebay",
									notes: null,
									reference_url: null,
									created_at: toDate(row["listed_at"]) ?? new Date(),
									expires_at: null,
									ended_at: toDate(row["sold_at"]) ?? null,
								});

								ItemFeesCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									listing_id: listing_id,
									workspace_id: import_workspace_id,
									type: "listing_fee",
									reference_name: "Imported Listing Fee",
									reference_details: "Automatically generated by importer",
									amount: toNum(row["listing_fees"]) ?? 0,
									buyer_paid: false,
									marketplace_id: "ebay",
									created_at: toDate(row["listed_at"]) ?? new Date(),
									removed: true,
									removal_reason: "Removed due to refund",
								});

								ItemFeesCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									listing_id: listing_id,
									workspace_id: import_workspace_id,
									type: "final_fee",
									reference_name: "Imported Sale Fee",
									reference_details: "Automatically generated by importer",
									amount: toNum(row["final_fees"]) ?? 0,
									buyer_paid: false,
									marketplace_id: "ebay",
									created_at: toDate(row["sold_at"]) ?? new Date(),
									removed: true,
									removal_reason: "Removed due to refund",
								});

								ItemFeesCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									listing_id: listing_id,
									workspace_id: import_workspace_id,
									type: "postage_fee",
									reference_name: "Imported Postage Fee",
									reference_details: "Automatically generated by importer",
									amount: toNum(row["postage_price"]) ?? 0,
									buyer_paid: toBool(row["buyer_paid_postage"]) ?? false,
									marketplace_id: "ebay",
									created_at: toDate(row["sold_at"]) ?? new Date(),
									removed: true,
									removal_reason: "Removed due to refund",
								});

								ItemFeesCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									listing_id: listing_id,
									workspace_id: import_workspace_id,
									type: "refunded_amount",
									reference_name: "Refund Amount",
									reference_details: "Automatically generated by importer",
									amount: toNum(row["refunded_amount"]) ?? 0,
									buyer_paid: false,
									marketplace_id: "ebay",
									created_at: toDate(row["refunded_at"]) ?? new Date(),
									removed: false,
									removal_reason: null,
								});
							});

							break;
					}

					post_insert_tx.mutate(() => {
						for (const label_id of toLabels(row["labels"])) {
							LabelJoinsCollection.insert({
								id: GetItemLabelJoinId(item_id, label_id),
								item_id: item_id,
								label_id: label_id,
								workspace_id: import_workspace_id,
							});
						}
					});

					const association_array: string[] = JSON.parse(row["associations"]);

					if (Array.isArray(association_array) && association_array.length > 0) {
						for (const bundle_item_id of association_array) {
							post_insert_tx.mutate(() => {
								ItemAssociationsCollection.insert({
									id: GenerateQuickId(),
									item_id: item_id,
									subject_id: bundle_item_id,
									type: "bundle-item",
									workspace_id: import_workspace_id,
								});
							});
						}
					}
				},
				complete: async () => {
					try {
						import_tx.commit();

						await import_tx.isPersisted.promise;

						post_insert_tx.commit();

						await post_insert_tx.isPersisted.promise;

						goto("/dashboard");

						toast.success("Import success");
					} catch (e) {
						console.error(e);

						toast.error("Import failed");
					}
				},
				error: (err: any) => {
					console.error(err);

					is_importing_items = false;

					toast.error("Import failed");
				},
			});
		};

		file_reader.readAsText(file);
	}
</script>

<Card class="w-full max-w-xl">
	<CardHeader>
		<CardTitle>Import Legacy Workspace</CardTitle>
		<CardDescription
			>Import your workspace from a previous version of the application</CardDescription
		>
	</CardHeader>

	{#if step == "workspace"}
		{#if imported_workspace}
			<CardContent class="flex flex-col gap-3">
				<FieldGroup>
					<workspace_form.Field name="name">
						{#snippet children(field)}
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Workspace Name</FieldLabel>
									<FieldDescription>The displayed name of the workspace</FieldDescription>
								</FieldContent>

								<FieldControl>
									<Input
										onblur={() => field.handleBlur()}
										onchange={(ev) => field.handleChange(ev.currentTarget.value)}
										value={field.state.value}
									/>
								</FieldControl>
							</Field>
						{/snippet}
					</workspace_form.Field>

					<workspace_form.Field name="slug">
						{#snippet children(field)}
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Workspace URL</FieldLabel>
									<FieldDescription>The URL segment for workspace links</FieldDescription>
								</FieldContent>

								<FieldControl>
									<Input
										onblur={() => field.handleBlur()}
										onchange={(ev) => field.handleChange(ev.currentTarget.value)}
										value={field.state.value}
									/>
								</FieldControl>
							</Field>
						{/snippet}
					</workspace_form.Field>
				</FieldGroup>
			</CardContent>

			<CardFooter>
				<workspace_form.Subscribe selector={(state) => state.isSubmitting}>
					{#snippet children(is_submitting)}
						<Button disabled={is_submitting} onclick={() => workspace_form.handleSubmit()}>
							{#if is_submitting}
								<LucideLoaderCircle class="animate-spin" /> Importing Workspace
							{:else}
								<LucideDownload /> Import Workspace
							{/if}
						</Button>
					{/snippet}
				</workspace_form.Subscribe>
			</CardFooter>
		{:else}
			<input
				bind:this={input_ref}
				class="hidden"
				onchange={HandleInputValueChange}
				type="file"
				accept=".json"
			/>

			<CardFooter>
				<Button class="flex-1" onclick={HandleSelectButtonClick}>Select Workspace File</Button>
			</CardFooter>
		{/if}
	{/if}

	{#if step == "items"}
		<CardFooter>
			<Button class="flex-1" disabled={is_importing_items} onclick={() => input_ref?.click()}>
				{#if is_importing_items}
					<LucideLoaderCircle class="animate-spin" />
				{/if}
				Import Item CSV
			</Button>
		</CardFooter>

		<input
			bind:this={input_ref}
			class="hidden"
			onchange={HandleInputCsvValueChange}
			type="file"
			accept=".csv"
		/>
	{/if}
</Card>
