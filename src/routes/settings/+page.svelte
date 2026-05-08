<script lang="ts">
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
	import { Button } from "$lib/components/ui/button";
	import {
		Field,
		FieldGroup,
		FieldContent,
		FieldLabel,
		FieldDescription,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger,
	} from "$lib/components/ui/select";
	import { setMode, userPrefersMode } from "mode-watcher";

	let application_mode = $derived.by(() => userPrefersMode.current);

	const mode_options = [
		{ label: "Light", value: "light" },
		{ label: "Dark", value: "dark" },
		{ label: "System", value: "system" },
	];

	let mode_trigger_content = $derived.by(() => {
		const selected_theme = mode_options.find((t) => t.value == application_mode);
		if (!selected_theme) return mode_options[0].label;

		return selected_theme.label;
	});

	function HandleModeChange(theme_val: string) {
		switch (theme_val) {
			case "light":
				setMode("light");
				break;

			case "dark":
				setMode("dark");
				break;

			case "system":
				setMode("system");
				break;
		}
	}
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Settings", href: "/settings" },
			{ type: "page", text: "Preferences" },
		]}
	></DashboardHeader>

	<DashboardContent>
		<SettingsLayout>
			<SettingsHeader>
				<SettingsTitle>Application Preferences</SettingsTitle>
				<SettingsDescription
					>Fine tune the appearance and feel of the application</SettingsDescription
				>
			</SettingsHeader>

			<SettingsGroup>
				<SettingsGroupHeader>Appearance</SettingsGroupHeader>

				<FormCard>
					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Application Theme</FieldLabel>
									<FieldDescription>The UI theme of the application</FieldDescription>
								</FieldContent>

								<FieldControl>
									<Select
										type="single"
										value={application_mode}
										onValueChange={HandleModeChange}
									>
										<SelectTrigger class="w-full">{mode_trigger_content}</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{#each mode_options as theme (theme.value)}
													<SelectItem value={theme.value}>
														{theme.label}
													</SelectItem>
												{/each}
											</SelectGroup>
										</SelectContent>
									</Select>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>
				</FormCard>
			</SettingsGroup>

			<SettingsGroup>
				<SettingsGroupHeader>Search</SettingsGroupHeader>

				<FormCard>
					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Reset Search Ranking</FieldLabel>
									<FieldDescription
										>Reset the ranking of your searches throughout the app</FieldDescription
									>
								</FieldContent>

								<FieldControl>
									<Button variant="outline">Reset Search Ranking</Button>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>
				</FormCard>
			</SettingsGroup>
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>
