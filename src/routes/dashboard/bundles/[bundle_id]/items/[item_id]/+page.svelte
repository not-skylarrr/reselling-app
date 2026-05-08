<script lang="ts">
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { LucidePackage } from "@lucide/svelte";

	let { data } = $props();
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "ellipsis" },
			{ type: "link", text: data.bundle.name, href: `/dashboard/bundles/${data.bundle.id}` },
			{ type: "page", text: data.bundle_item.name },
		]}
	></DashboardHeader>

	<DashboardContent class="@container p-0 md:p-0">
		<div class="flex flex-row items-center gap-6 border-b p-6">
			<div class="flex size-14 items-center justify-center rounded-lg bg-muted">
				<LucidePackage class="stroke-muted-foreground" />
			</div>
			<div class="grid flex-1">
				<p class="text-xl font-medium">{data.bundle_item.name}</p>
				<p class="text-sm text-muted-foreground">{data.bundle.name}</p>
			</div>
		</div>
	</DashboardContent>
</DashboardLayoutRoot>
