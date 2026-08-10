<script lang="ts">
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import {
		SettingsDescription,
		SettingsGroup,
		SettingsHeader,
		SettingsLayout,
		SettingsTitle,
	} from "$lib/components/settings/layout";
	import Button from "$lib/components/ui/button/button.svelte";
	import { DatePicker } from "$lib/components/ui/date-picker";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldLabel,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import Input from "$lib/components/ui/input/input.svelte";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import type { ReleaseChangeData, ReleaseChangeType } from "$lib/server/release-notes/types";
	import { GetReleaseTypeLabel, ReleaseTypeLabels } from "$lib/utils/release-notes";
	import { LucideCheck, LucidePlus, LucideX } from "@lucide/svelte";
	import { createForm } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";

	function GetUtcReleaseDate(value: Date) {
		const selected_utc_midnight = new Date(
			Date.UTC(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0),
		);
		const now = new Date();
		const current_utc_midnight = new Date(
			Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
		);

		if (selected_utc_midnight.getTime() === current_utc_midnight.getTime()) return now;

		return selected_utc_midnight;
	}

	function GetReleaseTimestampString(value: Date) {
		return GetUtcReleaseDate(value)
			.toISOString()
			.replace(/\.\d{3}Z/, "Z");
	}

	function GetReleaseFileName(value: Date) {
		return `${GetReleaseTimestampString(value).replaceAll(":", "-")}.json`;
	}

	function DownloadReleaseFile(file_name: string, file_content: string) {
		const blob = new Blob([file_content], { type: "application/json;charset=utf-8" });
		const download_url = URL.createObjectURL(blob);
		const link = document.createElement("a");

		link.href = download_url;
		link.download = file_name;
		link.click();
		URL.revokeObjectURL(download_url);
	}

	const PLACEHOLDER_RELEASE_TITLE = "Untitled Release";

	let form = createForm(() => ({
		defaultValues: {
			release_date: new Date(),
			changes: [] as ReleaseChangeData[],
		},
		onSubmit: ({ value }) => {
			const changes = value.changes.map((change) => ({
				...change,
				title: change.title.trim(),
				details:
					change.details
						?.map((detail) => detail.trim())
						.filter((detail) => detail.length > 0) ?? [],
			}));

			if (changes.length === 0) {
				toast.error("Add at least one release change");
				return;
			}

			if (changes.some((change) => change.title.length === 0)) {
				toast.error("Each change needs a title");
				return;
			}

			if (changes.some((change) => change.details.length === 0)) {
				toast.error("Each change needs at least one detail");
				return;
			}

			const file_name = GetReleaseFileName(value.release_date);

			const file_content = JSON.stringify(
				{
					title: PLACEHOLDER_RELEASE_TITLE,
					released_at: GetReleaseTimestampString(value.release_date),
					changes,
				},
				null,
				"\t",
			);

			DownloadReleaseFile(file_name, `${file_content}\n`);
			toast.success(`Downloaded ${file_name}`);
		},
	}));
</script>

<svelte:head>
	<title>Developer | Release Notes</title>
</svelte:head>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Developer", href: "/developer" },
			{ type: "page", text: "Release Notes Tool" },
		]}
	/>
	<DashboardContent>
		<SettingsLayout>
			<SettingsHeader>
				<SettingsTitle>Create New Release</SettingsTitle>
				<SettingsDescription>Create a new release note metadata file</SettingsDescription>
			</SettingsHeader>

			<SettingsGroup>
				<FormCard>
					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Release Date</FieldLabel>
									<FieldDescription>The release date of the update</FieldDescription>
								</FieldContent>

								<FieldControl>
									<form.Field name="release_date">
										{#snippet children(field)}
											<DatePicker
												onValueChange={(val) => field.handleChange(val ?? new Date())}
												value={field.state.value}
											/>
										{/snippet}
									</form.Field>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>
					<FormCardSection>
						<form.Field name="changes" mode="array">
							{#snippet children(changes_field)}
								<div class="flex flex-col gap-4">
									<div class="flex flex-row items-center justify-between">
										<p class="text-base font-medium">Release Changes</p>

										<Button
											onclick={() => {
												changes_field.pushValue({
													title: "",
													type: "added",
													details: [""],
												});
											}}
											size="sm"><LucidePlus /> Add Change</Button
										>
									</div>

									{#if changes_field.state.value.length == 0}
										<div class="flex items-center justify-center py-6">
											<p class="text-sm text-muted-foreground">No Changes Added</p>
										</div>
									{:else}
										<div class="flex flex-col gap-12">
											{#each changes_field.state.value as change, index}
												<div class="grid grid-cols-2 gap-3">
													<form.Field name={`changes[${index}].title`}>
														{#snippet children(field)}
															<Input
																onchange={(ev) => field.handleChange(ev.currentTarget.value)}
																placeholder="eg. Table Performance"
																value={field.state.value}
															/>
														{/snippet}
													</form.Field>

													<form.Field name={`changes[${index}].type`}>
														{#snippet children(field)}
															<Select
																type="single"
																onValueChange={(val) =>
																	field.handleChange(val as ReleaseChangeType)}
																value={field.state.value}
															>
																<SelectTrigger class="w-full">
																	{GetReleaseTypeLabel(field.state.value)}
																</SelectTrigger>
																<SelectContent>
																	{#each Object.entries(ReleaseTypeLabels) as [key, label] (key)}
																		<SelectItem value={key}>{label}</SelectItem>
																	{/each}
																</SelectContent>
															</Select>
														{/snippet}
													</form.Field>

													<form.Field name={`changes[${index}].details`} mode="array">
														{#snippet children(field)}
															<div class="col-span-2 flex flex-col gap-3">
																{#each field.state.value as detail, detail_index}
																	<div class="flex flex-row gap-3 pt-2">
																		<form.Field
																			name={`changes[${index}].details[${detail_index}]`}
																		>
																			{#snippet children(field)}
																				<Input
																					onchange={(ev) =>
																						field.handleChange(ev.currentTarget.value)}
																					placeholder="eg. Change sub detail"
																					value={field.state.value}
																				/>
																			{/snippet}
																		</form.Field>

																		{#if (change.details?.length ?? 0) > 1}
																			<Button
																				onclick={() => field.removeValue(detail_index)}
																				size="icon"
																				variant="destructive"><LucideX /></Button
																			>
																		{/if}
																	</div>
																{/each}

																<div class="grid grid-cols-2 gap-3">
																	<Button onclick={() => field.pushValue("")} variant="outline"
																		><LucidePlus /> Add New Detail</Button
																	>
																	<Button
																		onclick={() => changes_field.removeValue(index)}
																		variant="destructive"><LucideX /> Remove Change</Button
																	>
																</div>
															</div>
														{/snippet}
													</form.Field>
												</div>
											{/each}
										</div>
									{/if}
								</div>
							{/snippet}
						</form.Field>
					</FormCardSection>
				</FormCard>
			</SettingsGroup>

			<div class="flex flex-row items-center justify-end">
				<Button onclick={() => form.handleSubmit()}><LucideCheck /> Create Release File</Button>
			</div>
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>
