<script lang="ts">
	import { auth_client } from "$lib/auth-client";
	import type { AuthOrganizationRole } from "$lib/auth/permissions";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import InviteMemberDialog from "$lib/components/settings/components/InviteMemberDialog.svelte";
	import {
		SettingsDescription,
		SettingsHeader,
		SettingsHeaderActions,
		SettingsLayout,
		SettingsTitle,
	} from "$lib/components/settings/layout";
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
	import { query_client } from "$lib/queries/client.svelte.js";
	import { Alphabet, GenerateRandomString } from "$lib/utils/web-crypto.js";
	import {
		LucideCheck,
		LucideEllipsisVertical,
		LucideLoaderCircle,
		LucidePlus,
		LucideShield,
		LucideUser,
		LucideUserCog,
		LucideX,
	} from "@lucide/svelte";
	import { createQuery } from "@tanstack/svelte-query";
	import { toast } from "svelte-sonner";

	let { data } = $props();

	let show_invite_dialog = $state(false);

	const org_members_query = createQuery(() => ({
		queryKey: ["user-session", "workspace-members"],
		queryFn: async () => {
			const member_list = await auth_client.organization.listMembers({
				fetchOptions: {
					throw: true,
				},
			});

			return member_list.members;
		},
	}));

	function CanMemberManageRole(role: AuthOrganizationRole) {
		if (role == "owner") return false;
		if (role == "admin") return data.org_role == "owner";

		return data.org_role == "admin" || data.org_role == "owner";
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

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Settings", href: "/settings" },
			{ type: "page", text: "Workspace Members" },
		]}
	></DashboardHeader>

	<DashboardContent>
		<SettingsLayout size="lg">
			<SettingsHeader>
				<SettingsTitle>Manage Members</SettingsTitle>
				<SettingsDescription>Invite or manage the members in your workspace</SettingsDescription
				>

				<SettingsHeaderActions>
					<Button onclick={() => (show_invite_dialog = true)}
						><LucidePlus /> Invite Member</Button
					>
				</SettingsHeaderActions>
			</SettingsHeader>

			<div class="flex flex-1 flex-col overflow-hidden">
				{#if org_members_query.status == "pending"}
					<div class="m-auto flex flex-col items-center justify-center gap-2">
						<LucideLoaderCircle class="size-8 animate-spin" />
						<p class="text-sm text-muted-foreground">Loading Members</p>
					</div>
				{:else if org_members_query.status == "error"}
					<div class="m-auto flex flex-col items-center justify-center gap-2">
						<LucideX class="size-8" />
						<p class="text-sm text-muted-foreground">Failed to load members</p>
					</div>
				{:else}
					<div class="flex flex-col gap-3">
						<div class="group grid grid-cols-3 items-center gap-4 border-b px-4 py-3">
							<p class="text-sm text-muted-foreground">Name</p>

							<div class="flex flex-row justify-center">
								<p class="w-24 text-sm text-muted-foreground">Role</p>
							</div>
						</div>
						{#each org_members_query.data as member (member.id)}
							<div
								class="group grid h-9 grid-cols-3 items-center gap-4 px-4 hover:bg-accent/50"
							>
								<p class="text-sm">{member.user.name}</p>

								<div class="flex flex-row justify-center">
									<p class="w-24 text-sm leading-none capitalize">
										{member.role}
									</p>
								</div>

								{#if CanMemberManageRole(member.role)}
									<div class="flex flex-row items-center justify-end">
										<DropdownMenu>
											<DropdownMenuTrigger>
												{#snippet child({ props })}
													<Button {...props} size="icon-sm" variant="ghost"
														><LucideEllipsisVertical /></Button
													>
												{/snippet}
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuSub>
													<DropdownMenuSubTrigger
														><LucideUserCog /> Change Role</DropdownMenuSubTrigger
													>
													<DropdownMenuSubContent align="start" class="w-56">
														<DropdownMenuItem
															onSelect={() => UpdateMemberRole(member.id, "admin")}
														>
															<LucideShield />
															<p class="flex-1">Admin</p>
															{#if member.role == "admin"}
																<LucideCheck />
															{/if}
														</DropdownMenuItem>

														<DropdownMenuItem
															onSelect={() => UpdateMemberRole(member.id, "member")}
														>
															<LucideUser />
															<p class="flex-1">Member</p>
															{#if member.role == "member"}
																<LucideCheck />
															{/if}</DropdownMenuItem
														>
													</DropdownMenuSubContent>
												</DropdownMenuSub>

												<DropdownMenuSeparator />

												<DropdownMenuItem
													onSelect={() => KickMember(member.id)}
													variant="destructive"><LucideX /> Remove Member</DropdownMenuItem
												>
											</DropdownMenuContent>
										</DropdownMenu>
									</div>
								{/if}
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>

<InviteMemberDialog bind:open={show_invite_dialog} />
