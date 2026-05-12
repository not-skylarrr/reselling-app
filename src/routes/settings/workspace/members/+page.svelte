<script lang="ts" module>
	const column = createColumnHelper<ServerWorkspaceMember>();

	const MemberTableColumns = [
		column.accessor("user", {
			header: "User",
			cell: (info) => renderComponent(CellUser, { user: info.getValue() }),
			meta: {
				align: "left",
				flex: true,
			},
			minSize: 200,
		}),
		column.accessor("role", {
			header: "Role",
			cell: (info) => GetRoleFriendlyName(info.getValue()),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
		column.accessor((row) => row, {
			id: "actions",
			header: "Actions",
			cell: (row) => renderComponent(ManageMemberOptions, { member: row.getValue() }),
			minSize: 80,
		}),
	];

	const DefaultColumnVisibility = {
		user: true,
		role: true,
	};
</script>

<script lang="ts">
	import { auth_client } from "$lib/auth-client";
	import type { AuthOrganizationRole } from "$lib/auth/permissions";
	import { GetRoleFriendlyName } from "$lib/auth/roles.js";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import InviteMemberDialog from "$lib/components/settings/components/InviteMemberDialog.svelte";
	import ManageMemberOptions from "$lib/components/settings/components/ManageMemberOptions.svelte";
	import {
		SettingsDescription,
		SettingsHeader,
		SettingsHeaderActions,
		SettingsLayout,
		SettingsTitle,
	} from "$lib/components/settings/layout";
	import { TableBase } from "$lib/components/table";
	import { CellUser } from "$lib/components/table/cells";
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
	import type { ServerWorkspaceMember } from "$lib/server/auth";
	import { DefaultTableProps, SetTableContext, TableState } from "$lib/table/init.svelte";
	import { CreateMediaQueryBreakpoint } from "$lib/utils/reactivity";
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
	import { createColumnHelper, createTable, renderComponent } from "@tanstack/svelte-table";
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

	const is_mobile = CreateMediaQueryBreakpoint("md");

	const table_state = new TableState({
		key: "member-table",
		default_column_visibility: DefaultColumnVisibility,
		selection_enabled: false,
	});

	const table = createTable<ServerWorkspaceMember>({
		columns: MemberTableColumns,
		get data() {
			return org_members_query.data ?? [];
		},
		getRowId: (row) => row.id,
		...DefaultTableProps(table_state),
	});

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

	SetTableContext(table_state);
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

			<TableBase getRowId={(row) => row.id} {table} />

			{#if is_mobile.current}
				<Button onclick={() => (show_invite_dialog = true)}><LucidePlus /> Invite Member</Button
				>
			{/if}
		</SettingsLayout>
	</DashboardContent>
</DashboardLayoutRoot>

<InviteMemberDialog bind:open={show_invite_dialog} />
