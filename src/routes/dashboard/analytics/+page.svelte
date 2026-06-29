<script lang="ts">
	import InventoryAnalyticsSection from "$lib/components/analytics/sections/InventoryAnalyticsSection.svelte";
	import RefundAnalyticsSection from "$lib/components/analytics/sections/RefundAnalyticsSection.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
</script>

<svelte:head>
	<title>Analytics</title>
</svelte:head>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "page", text: "Analytics" },
		]}
		class="bg-card"
	></DashboardHeader>

	<DashboardContent class="@container gap-0 p-0 md:gap-0 md:p-0">
		<RefundAnalyticsSection />
		<InventoryAnalyticsSection />
	</DashboardContent>
</DashboardLayoutRoot>
