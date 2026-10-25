<script lang="ts">
	import { goto } from "$app/navigation";
	import { ItemsCollection } from "$lib/collections/def.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { SettingsGroup, SettingsLayout } from "$lib/components/settings/layout";
	import SettingsGroupHeader from "$lib/components/settings/layout/SettingsGroupHeader.svelte";
	import {
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogTitle,
	} from "$lib/components/ui/alert-dialog";
	import AlertDialogHeader from "$lib/components/ui/alert-dialog/alert-dialog-header.svelte";
	import AlertDialog from "$lib/components/ui/alert-dialog/alert-dialog.svelte";
	import Button from "$lib/components/ui/button/button.svelte";
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldGroup,
		FieldTitle,
	} from "$lib/components/ui/field";
	import FieldControl from "$lib/components/ui/field/field-control.svelte";
	import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte";
	import { GetStatusFriendlyName } from "$lib/items/utils";
	import type { ItemWithLabels } from "$lib/server/db/schema";
	import { toast } from "svelte-sonner";

	type Props = {
		item: ItemWithLabels;
	};

	let { item }: Props = $props();

	let show_warning_dialog = $state(true);

	function HandleWarningAccept() {
		show_warning_dialog = false;
	}

	function HandleWarningDecline() {
		show_warning_dialog = false;

		goto(`/dashboard/inventory/items/${item.id}`);
	}

	function HandleItemDelete() {
		OpenDestructiveActionDialog({
			title: "Are you sure?",
			description: "This action is permanent and cannot be undone",
			onConfirm: async () => {
				const deletion_promise = ItemsCollection.delete(item.id);

				try {
					await deletion_promise.isPersisted.promise;

					goto("/dashboard/inventory");

					toast.success("Item deleted successfully!");
				} catch (e) {
					console.error(e);

					toast.error("Failed to delete item");
				}
			},
		});
	}
</script>

<SettingsLayout class="p-6! pt-12!">
	<SettingsGroup>
		<SettingsGroupHeader>Destructive Item Actions</SettingsGroupHeader>

		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Override Item Status</FieldTitle>
							<FieldDescription
								>Override the automatically assigned status (Medium Risk)</FieldDescription
							>
						</FieldContent>

						<FieldControl>
							<Select type="single" onValueChange={() => {}} value={item.status}>
								<SelectTrigger class="w-full">
									{GetStatusFriendlyName(item.status)}
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unlisted">Unlisted</SelectItem>
									<SelectItem value="listed">Listed</SelectItem>
									<SelectItem value="sold">Sold</SelectItem>
									<SelectItem value="refunded">Refunded</SelectItem>
								</SelectContent>
							</Select>
						</FieldControl>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Delete Item Listings</FieldTitle>
							<FieldDescription>Delete all recorded listings for this item</FieldDescription>
						</FieldContent>

						<FieldControl>
							<Button variant="outline">Delete All Listings</Button>
						</FieldControl>
					</Field>

					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Delete Item Fees</FieldTitle>
							<FieldDescription>Delete all recorded fees for this item</FieldDescription>
						</FieldContent>

						<FieldControl>
							<Button variant="outline">Delete All Fees</Button>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>
	</SettingsGroup>

	<SettingsGroup>
		<SettingsGroupHeader>Manage Item Storage</SettingsGroupHeader>
		<FormCard>
			<FormCardSection>
				<FieldGroup>
					<Field orientation="responsive-centered">
						<FieldContent>
							<FieldTitle>Delete Item</FieldTitle>
							<FieldDescription
								>Permanently delete the item from the application</FieldDescription
							>
						</FieldContent>

						<FieldControl>
							<Button onclick={HandleItemDelete} variant="destructive">Delete Item</Button>
						</FieldControl>
					</Field>
				</FieldGroup>
			</FormCardSection>
		</FormCard>
	</SettingsGroup>
</SettingsLayout>

<AlertDialog bind:open={show_warning_dialog}>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>Entering Danger Zone</AlertDialogTitle>
			<AlertDialogDescription class="text-pretty"
				>The following actions modify or delete internal application state. Only use with
				complete understanding of the effects or under instruction.</AlertDialogDescription
			>
		</AlertDialogHeader>

		<AlertDialogFooter>
			<Button onclick={() => HandleWarningAccept()} variant="outline">I Understand</Button>
			<Button onclick={() => HandleWarningDecline()}>Return to Details</Button>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
