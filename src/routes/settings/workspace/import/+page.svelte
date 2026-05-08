<script>
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
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Settings", href: "/settings" },
			{ type: "page", text: "Import & Export Data" },
		]}
	></DashboardHeader>

	<DashboardContent>
		<SettingsLayout>
			<SettingsHeader>
				<SettingsTitle>Import & Export Data</SettingsTitle>
				<SettingsDescription
					>Import previous workspace data or export your current workspace</SettingsDescription
				>
			</SettingsHeader>

			<SettingsGroup>
				<SettingsGroupHeader>Import</SettingsGroupHeader>
				<FormCard>
					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Import Item</FieldLabel>
									<FieldDescription
										>Import a JSON item exported from this application</FieldDescription
									>
								</FieldContent>
								<FieldControl>
									<Button variant="outline">Import</Button>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>

					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Import Legacy Items</FieldLabel>
									<FieldDescription
										>Import items from a legacy version of the application</FieldDescription
									>
								</FieldContent>
								<FieldControl>
									<Button href="/settings/workspace/import/items/legacy" variant="outline"
										>Import Legacy</Button
									>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>
				</FormCard>
			</SettingsGroup>

			<SettingsGroup>
				<SettingsGroupHeader>Export</SettingsGroupHeader>
				<FormCard>
					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Export Items</FieldLabel>
									<FieldDescription
										>Export the items from your workspace into a JSON format</FieldDescription
									>
								</FieldContent>
								<FieldControl>
									<Button variant="outline">Export Items</Button>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>
					<FormCardSection>
						<FieldGroup>
							<Field orientation="responsive">
								<FieldContent>
									<FieldLabel>Export Workspace</FieldLabel>
									<FieldDescription
										>Export your entire workspace into a JSON format</FieldDescription
									>
								</FieldContent>
								<FieldControl>
									<Button variant="outline">Export Workspace</Button>
								</FieldControl>
							</Field>
						</FieldGroup>
					</FormCardSection>
				</FormCard>
			</SettingsGroup>
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>
