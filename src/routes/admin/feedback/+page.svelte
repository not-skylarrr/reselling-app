<script lang="ts" module>
	type TableFeedbackData = {
		feedback: UserFeedback;
		user: ServerUser;
	};

	const column = createColumnHelper<TableFeedbackData>();

	const FeedbackTableColumns = [
		column.accessor("feedback.title", {
			id: "feedback.title",
			header: "Title",
			cell: (info) => info.getValue(),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
		column.accessor("feedback.content", {
			id: "feedback.content",
			header: "Content",
			cell: (info) => info.getValue(),
			meta: {
				align: "left",
			},
			minSize: 320,
		}),
		column.accessor("user", {
			id: "user",
			header: "User",
			cell: (info) => renderComponent(CellUser, { user: info.getValue() }),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
		column.accessor("feedback.archived", {
			id: "feedback.archived",
			header: "Archived",
			cell: (info) => (info.getValue() ? "Yes" : "No"),
			meta: {
				align: "left",
			},
			minSize: 160,
		}),
	];

	const DefaultColumnVisibility: VisibilityState = {
		"feedback.title": true,
		"feedback.content": true,
		"feedback.archived": true,
		user: true,
	};
</script>

<script lang="ts">
	import { FeedbackCollection, UsersCollection } from "$lib/collections/def.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { TableBase } from "$lib/components/table";
	import { CellUser } from "$lib/components/table/cells";
	import type { ServerUser } from "$lib/server/auth";
	import type { UserFeedback } from "$lib/server/db/schema";
	import { DefaultTableProps, SetTableContext, TableState } from "$lib/table/init.svelte";
	import { useLiveQuery, eq } from "@tanstack/svelte-db";
	import {
		createColumnHelper,
		createTable,
		renderComponent,
		type VisibilityState,
	} from "@tanstack/svelte-table";

	const table_state = new TableState({
		key: "feedback-table",
		default_column_visibility: DefaultColumnVisibility,
	});

	const feedback_query = useLiveQuery((q) =>
		q
			.from({ feedback: FeedbackCollection })
			.innerJoin({ user: UsersCollection }, ({ user, feedback }) =>
				eq(feedback.created_by, user.id),
			),
	);

	const table = createTable<TableFeedbackData>({
		columns: FeedbackTableColumns,
		get data() {
			return feedback_query.data;
		},
		...DefaultTableProps(table_state),
	});

	SetTableContext(table_state);
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Admin Dashboard", href: "/admin" },
			{ type: "page", text: "View Feedback" },
		]}
	/>

	<DashboardContent class="gap-0 p-0 md:gap-0 md:p-0" disableScroll>
		<TableBase {table} getRowId={(row) => row.feedback.id} mobile_row_height={96}>
			{#snippet mobile_row({ row })}
				<div class="flex h-24 flex-col p-4">
					<p class="font-medium">{row.original.feedback.title}</p>
					<p class="text-sm text-muted-foreground">{row.original.feedback.content}</p>
				</div>
			{/snippet}
		</TableBase>
	</DashboardContent>
</DashboardLayoutRoot>
