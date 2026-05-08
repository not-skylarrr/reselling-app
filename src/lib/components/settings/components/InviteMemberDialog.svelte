<script lang="ts">
	import { auth_client } from "$lib/auth-client";
	import { Button } from "$lib/components/ui/button";
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle,
	} from "$lib/components/ui/dialog";
	import { Field, FieldError, FieldLabel } from "$lib/components/ui/field";
	import { Input } from "$lib/components/ui/input";
	import { LucideCheck, LucideClipboard, LucideCopy, LucideLoaderCircle } from "@lucide/svelte";
	import { createForm } from "@tanstack/svelte-form";
	import { toast } from "svelte-sonner";
	import { PUBLIC_ORIGIN } from "$env/static/public";
	import {
		InputGroup,
		InputGroupAddon,
		InputGroupButton,
		InputGroupInput,
	} from "$lib/components/ui/input-group";

	type Props = {
		open?: boolean;
	};

	let { open = $bindable(false) }: Props = $props();

	let created_url = $state<string | null>(null);

	const form = createForm(() => ({
		defaultValues: {
			email: "",
		},
		onSubmit: async ({ value }) => {
			try {
				const invitation = await auth_client.organization.inviteMember(
					{
						email: value.email,
						role: "member",
						resend: true,
					},
					{ throw: true },
				);

				created_url = `${PUBLIC_ORIGIN}/workspaces/${invitation.org_slug}/${invitation.id}`;
			} catch (e) {
				console.error(e);

				toast.error("Failed to create invitation");
			}
		},
	}));

	function CopyInviteURL() {
		if (!created_url) return;

		window.navigator.clipboard.writeText(created_url);

		toast.success("Copied Invite URL");
	}

	function HandleOpenChangeComplete(open: boolean) {
		if (open == false) {
			form.reset();
			created_url = null;
		}
	}
</script>

<Dialog bind:open onOpenChangeComplete={HandleOpenChangeComplete}>
	<DialogContent class="sm:max-w-xl">
		<DialogHeader>
			<DialogTitle>Invite Member</DialogTitle>
			<DialogDescription>Invite a new member to your workspace</DialogDescription>
		</DialogHeader>

		<div class="flex flex-col gap-6">
			<form.Field name="email">
				{#snippet children(field)}
					<Field>
						<FieldLabel>Recepient Email Address</FieldLabel>
						<Input
							disabled={created_url != null}
							onblur={() => field.handleBlur()}
							onchange={(ev) => field.handleChange(ev.currentTarget.value)}
							placeholder="eg. johndoe@company.com"
							value={field.state.value}
						/>
						<FieldError errors={field.state.meta.errors} />
					</Field>
				{/snippet}
			</form.Field>

			{#if created_url}
				<Field>
					<FieldLabel>Invite URL</FieldLabel>
					<InputGroup>
						<InputGroupInput readonly value={created_url} />

						<InputGroupAddon align="inline-end">
							<InputGroupButton onclick={CopyInviteURL}><LucideCopy /></InputGroupButton>
						</InputGroupAddon>
					</InputGroup>
				</Field>
			{/if}
		</div>

		<DialogFooter>
			{#if created_url == null}
				<form.Subscribe selector={(state) => state.isSubmitting}>
					{#snippet children(is_submitting)}
						<Button disabled={is_submitting} onclick={() => form.handleSubmit()}>
							{#if is_submitting}
								<LucideLoaderCircle class="animate-spin" /> Creating Invitation
							{:else}
								<LucideCheck /> Create Invitation
							{/if}
						</Button>
					{/snippet}
				</form.Subscribe>
			{:else}
				<Button onclick={CopyInviteURL}>
					<LucideClipboard /> Copy Invite Link
				</Button>
			{/if}
		</DialogFooter>
	</DialogContent>
</Dialog>
