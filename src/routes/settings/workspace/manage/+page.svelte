<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth_client } from "$lib/auth-client.js";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import {
		SettingsDescription,
		SettingsGroup,
		SettingsGroupHeader,
		SettingsHeader,
		SettingsLayout,
		SettingsTitle,
	} from "$lib/components/settings/layout";
	import { ButtonGroup, ButtonGroupText } from "$lib/components/ui/button-group/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldLabel,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import { Input } from "$lib/components/ui/input";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte.js";
	import { query_client } from "$lib/queries/client.svelte.js";
	import { UserOrgDataQuery } from "$lib/queries/session.js";
	import { trpc_client } from "$lib/trpc/client.js";
	import { CreateDebounceHandler } from "$lib/utils/debounce";
	import { toast } from "svelte-sonner";
	import z from "zod";

	let { data } = $props();

	// svelte-ignore state_referenced_locally
	let workspace_name = $state(data.name);

	// svelte-ignore state_referenced_locally
	let workspace_slug = $state(data.slug);

	const name_debounce = CreateDebounceHandler<string>({
		debounce_ms: 500,
		debounce_fn: async (val) => {
			const name_schema = z.string().min(3, "Name must be 3+ characters");

			const parsed_name = name_schema.safeParse(val);

			if (parsed_name.success == false) {
				toast.error(parsed_name.error.message);
				return;
			}

			try {
				await auth_client.organization.update({
					data: {
						name: val,
					},
					fetchOptions: {
						throw: true,
					},
				});

				query_client.invalidateQueries({ queryKey: ["user-session", "org-data"] });

				await query_client.prefetchQuery(UserOrgDataQuery);

				toast.success("Workspace name updated!");
			} catch (e) {
				console.error(e);

				toast.error("Failed to update workspace name");
			}
		},
	});

	const slug_debounce = CreateDebounceHandler<string>({
		debounce_ms: 500,
		debounce_fn: async (val) => {
			const slug_schema = z
				.string()
				.min(3, "URL must be 3+ characters")
				.regex(
					/^[a-z0-9-]*$/,
					"Workspace URL may only contain lowercase letters, numbers and dashes",
				);

			const parsed_slug = slug_schema.safeParse(val);

			if (parsed_slug.success == false) {
				toast.error(parsed_slug.error.issues.map((issue) => issue.message).join(", "));
				return;
			}

			try {
				await auth_client.organization.update({
					data: {
						slug: val,
					},
					fetchOptions: {
						throw: true,
					},
				});

				query_client.invalidateQueries({ queryKey: ["user-session", "org-data"] });

				await query_client.prefetchQuery(UserOrgDataQuery);

				toast.success("Workspace URL Updated!");
			} catch (e) {
				console.error(e);

				toast.error("Failed To Update Workspace URL");
			}
		},
	});

	function HandleWorkspaceDeletion() {
		OpenDestructiveActionDialog({
			title: "Are you sure?",
			description:
				"This is permanent and your workspace and inventory cannot be recovered once deleted",
			action_label: "Delete Workspace",
			onConfirm: async () => {
				await trpc_client.workspace.delete.mutate();

				goto("/auth/workspace/select");
			},
		});
	}
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Settings", href: "/settings" },
			{ type: "page", text: "Manage Workspace" },
		]}
	></DashboardHeader>

	<DashboardContent>
		<SettingsLayout>
			<SettingsHeader>
				<SettingsTitle>Manage Workspace</SettingsTitle>
				<SettingsDescription
					>Manage the name, icon and other elements of your workspace</SettingsDescription
				>
			</SettingsHeader>

			<SettingsGroup>
				<SettingsGroupHeader>General</SettingsGroupHeader>
				<FormCard>
					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Name</FieldLabel>
									<FieldDescription>The name of your workspace</FieldDescription>
								</FieldContent>

								<FieldControl>
									<Input
										onchange={(e) => {
											workspace_name = e.currentTarget.value;

											name_debounce.mutate(workspace_name);
										}}
										value={workspace_name}
									/>
								</FieldControl>
							</Field>

							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>URL</FieldLabel>
									<FieldDescription>The URL used when sharing your workspace</FieldDescription>
								</FieldContent>

								<FieldControl>
									<ButtonGroup>
										<ButtonGroupText class="font-normal text-muted-foreground"
											>/workspaces/</ButtonGroupText
										>
										<Input
											onchange={(e) => {
												workspace_slug = e.currentTarget.value;

												slug_debounce.mutate(workspace_slug);
											}}
											value={workspace_slug}
										/>
									</ButtonGroup>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>
				</FormCard>
			</SettingsGroup>

			<SettingsGroup>
				<SettingsGroupHeader>Danger Zone</SettingsGroupHeader>
				<FormCard>
					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Delete Workspace</FieldLabel>
									<FieldDescription>Permanently delete this workspace</FieldDescription>
								</FieldContent>

								<FieldControl>
									<Button onclick={HandleWorkspaceDeletion} variant="destructive"
										>Delete Workspace</Button
									>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>
				</FormCard>
			</SettingsGroup>
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>
