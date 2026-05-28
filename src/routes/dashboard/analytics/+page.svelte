<script lang="ts">
	import FeesAnalyticsCard from "$lib/components/analytics/cards/FeesAnalyticsCard.svelte";
	import ItemTypesAnalyticsCard from "$lib/components/analytics/cards/ItemTypesAnalyticsCard.svelte";
	import RefundAnalyticsCard from "$lib/components/analytics/cards/RefundAnalyticsCard.svelte";
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
	></DashboardHeader>

	<DashboardContent
		class="grid auto-rows-min grid-cols-1 gap-4 p-4 md:gap-4 md:p-4 xl:grid-cols-2"
	>
		<ItemTypesAnalyticsCard />

		<RefundAnalyticsCard />
		<FeesAnalyticsCard />
	</DashboardContent>
</DashboardLayoutRoot>
