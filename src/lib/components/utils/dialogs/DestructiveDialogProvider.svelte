<script lang="ts">
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
	} from "$lib/components/ui/alert-dialog";
	import { Button } from "$lib/components/ui/button";
	import { Field, FieldError, FieldLabel } from "$lib/components/ui/field";
	import { Input } from "$lib/components/ui/input";
	import {
		CancelDestructiveActionDialog,
		ConfirmDestructiveActionDialog,
		SetDestructiveActionDialogOpen,
		destructive_action_dialog_state,
	} from "./destructive-dialog-state.svelte";

	const confirmation_required = $derived(
		destructive_action_dialog_state.confirmation_required_value != null,
	);

	const confirmation_valid = $derived.by(() => {
		if (!confirmation_required) return true;

		return (
			destructive_action_dialog_state.confirmation_input ==
			destructive_action_dialog_state.confirmation_required_value
		);
	});
</script>

<AlertDialog
	open={destructive_action_dialog_state.open}
	onOpenChange={(open) => SetDestructiveActionDialogOpen(open)}
>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle>{destructive_action_dialog_state.title}</AlertDialogTitle>
			<AlertDialogDescription class="text-pretty whitespace-normal"
				>{destructive_action_dialog_state.description}</AlertDialogDescription
			>
		</AlertDialogHeader>

		{#if confirmation_required}
			<div class="grid gap-2">
				<Field>
					<FieldLabel>{destructive_action_dialog_state.confirmation_label}</FieldLabel>
					<Input
						autocomplete="off"
						onchange={(ev) =>
							(destructive_action_dialog_state.confirmation_input = ev.currentTarget.value)}
						placeholder={destructive_action_dialog_state.confirmation_placeholder}
						value={destructive_action_dialog_state.confirmation_input}
					/>
				</Field>
			</div>
		{/if}

		<AlertDialogFooter>
			<Button onclick={CancelDestructiveActionDialog} variant="ghost">
				{destructive_action_dialog_state.cancel_label}</Button
			>

			<Button
				disabled={!confirmation_valid}
				onclick={ConfirmDestructiveActionDialog}
				variant="destructive"
			>
				{destructive_action_dialog_state.action_label}
			</Button>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
