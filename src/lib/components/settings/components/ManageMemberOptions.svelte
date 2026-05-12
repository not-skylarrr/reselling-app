<script lang="ts">
	import { auth_client } from "$lib/auth-client";
	import type { AuthOrganizationRole } from "$lib/auth/permissions";
	import { Button } from "$lib/components/ui/button";
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuSub,
		DropdownMenuSubContent,
		DropdownMenuSubTrigger,
		DropdownMenuTrigger,
	} from "$lib/components/ui/dropdown-menu";
	import { query_client } from "$lib/queries/client.svelte";
	import type { ServerWorkspaceMember } from "$lib/server/auth";
	import { session_state } from "$lib/utils/session.svelte";
	import { Alphabet, GenerateRandomString } from "$lib/utils/web-crypto";
	import {
		LucideCheck,
		LucideEllipsisVertical,
		LucideShield,
		LucideUser,
		LucideUserCog,
		LucideX,
	} from "@lucide/svelte";
	import { toast } from "svelte-sonner";

	type Props = {
		member: ServerWorkspaceMember;
	};

	let { member }: Props = $props();

	const can_manage_member = $derived(CanMemberManageRole(member.role));

	function CanMemberManageRole(role: AuthOrganizationRole) {
		console.log(session_state);
		if (role == "owner") return false;
		if (role == "admin") return session_state.workspace_role == "owner";

		return session_state.workspace_role == "admin" || session_state.workspace_role == "owner";
	}

	async function UpdateMemberRole(member_id: string, role: AuthOrganizationRole) {
		const toast_id = GenerateRandomString(Alphabet("a-z"), 16);

		toast.loading("Updating member role...", { id: toast_id });

		try {
			await auth_client.organization.updateMemberRole({
				role: [role],
				memberId: member_id,
			});

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-members"] });

			toast.success("Member role updated!", { id: toast_id });
		} catch (e) {
			console.error(e);

			toast.error("Failed to update member role", { id: toast_id });
		}
	}

	async function KickMember(member_id: string) {
		const toast_id = GenerateRandomString(Alphabet("a-z"), 16);

		toast.loading("Removing member from workspace...", { id: toast_id });

		try {
			await auth_client.organization.removeMember({
				memberIdOrEmail: member_id,
			});

			query_client.invalidateQueries({ queryKey: ["user-session", "workspace-members"] });

			toast.success("Member removed successfully!", { id: toast_id });
		} catch (e) {
			console.error(e);

			toast.error("Failed to remove member", { id: toast_id });
		}
	}
</script>

{#if can_manage_member}
	<DropdownMenu>
		<DropdownMenuTrigger>
			{#snippet child({ props })}
				<Button {...props} size="icon-sm" variant="ghost"><LucideEllipsisVertical /></Button>
			{/snippet}
		</DropdownMenuTrigger>
		<DropdownMenuContent align="end">
			<DropdownMenuSub>
				<DropdownMenuSubTrigger><LucideUserCog /> Change Role</DropdownMenuSubTrigger>
				<DropdownMenuSubContent align="start" class="w-56">
					<DropdownMenuItem onSelect={() => UpdateMemberRole(member.id, "admin")}>
						<LucideShield />
						<p class="flex-1">Admin</p>
						{#if member.role == "admin"}
							<LucideCheck />
						{/if}
					</DropdownMenuItem>

					<DropdownMenuItem onSelect={() => UpdateMemberRole(member.id, "member")}>
						<LucideUser />
						<p class="flex-1">Member</p>
						{#if member.role == "member"}
							<LucideCheck />
						{/if}</DropdownMenuItem
					>
				</DropdownMenuSubContent>
			</DropdownMenuSub>

			<DropdownMenuSeparator />

			<DropdownMenuItem onSelect={() => KickMember(member.id)} variant="destructive"
				><LucideX /> Remove Member</DropdownMenuItem
			>
		</DropdownMenuContent>
	</DropdownMenu>
{/if}
