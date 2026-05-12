<script lang="ts">
	import { goto } from "$app/navigation";
	import { auth_client } from "$lib/auth-client";
	import { Avatar, AvatarFallback } from "$lib/components/ui/avatar/index.js";
	import { Button } from "$lib/components/ui/button";
	import Hashvatar from "$lib/components/utils/Hashvatar.svelte";
	import { query_client } from "$lib/queries/client.svelte.js";
	import { UserOrgDataQuery } from "$lib/queries/session.js";
	import { LucideCheck, LucideX } from "@lucide/svelte";
	import { toast } from "svelte-sonner";

	let { data } = $props();

	let disable_buttons = $state(false);

	function HandleAccept() {
		auth_client.organization.acceptInvitation({
			invitationId: data.invitation.id,
			fetchOptions: {
				onRequest: () => {
					disable_buttons = true;
				},
				onSuccess: async () => {
					query_client.invalidateQueries({ queryKey: ["user-session"] });

					await query_client.prefetchQuery(UserOrgDataQuery);

					goto("/dashboard");
				},
				onError: () => {
					disable_buttons = false;

					toast.error("Failed to accept invitation");
				},
			},
		});
	}

	function HandleDecline() {
		auth_client.organization.rejectInvitation({
			invitationId: data.invitation.id,
			fetchOptions: {
				onRequest: () => {
					disable_buttons = true;
				},
				onSuccess: async () => {
					goto("/dashboard");
				},
				onError: () => {
					disable_buttons = false;

					toast.error("Failed to decline invitation");
				},
			},
		});
	}
</script>

<div class="flex h-svh w-svw flex-col items-center justify-center gap-12 p-6">
	<Hashvatar animated={true} hash={data.workspace.name} size={96} />

	<div class="grid gap-2">
		<h1 class="text-center text-3xl font-semibold">{data.workspace.name}</h1>
		<p class="text-center text-pretty text-muted-foreground">
			You have been invited to join a new workspace
		</p>
	</div>

	<div class="flex w-full max-w-92 flex-col-reverse items-center gap-3 md:flex-row">
		<Button
			class="h-10 w-full md:flex-1"
			disabled={disable_buttons}
			onclick={HandleDecline}
			variant="outline"
		>
			<LucideX /> Decline Invitation
		</Button>

		<Button class="h-10 w-full md:flex-1" disabled={disable_buttons} onclick={HandleAccept}>
			<LucideCheck /> Accept Invitation
		</Button>
	</div>
</div>
