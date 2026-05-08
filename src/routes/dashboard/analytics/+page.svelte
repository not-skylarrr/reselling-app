<script lang="ts">
	import {
		ItemFeesCollection,
		ItemsCollection,
		ListingsCollection,
	} from "$lib/collections/def.svelte";
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";
	import { Button } from "$lib/components/ui/button";
	import Plural from "$lib/components/utils/Plural.svelte";
	import { FormatCurrency } from "$lib/utils/formatting";
	import {
		LucideChevronRight,
		LucideIterationCw,
		LucidePackage,
		LucideRotateCcw,
	} from "@lucide/svelte";
	import { count, eq, sum, useLiveQuery } from "@tanstack/svelte-db";

	const total_items_query = useLiveQuery((q) =>
		q.from({ item: ItemsCollection }).select(({ item }) => ({
			item_count: count(item.id),
		})),
	);

	const refunded_items_query = useLiveQuery((q) =>
		q
			.from({ item: ItemsCollection })
			.where(({ item }) => eq(item.status, "refunded"))
			.select(({ item }) => ({
				item_count: count(item.id),
			})),
	);

	const sold_listings_query = useLiveQuery((q) =>
		q
			.from({ listing: ListingsCollection })
			.where(({ listing }) => eq(listing.status, "sold"))
			.select(({ listing }) => ({
				total_sale_amount: sum(listing.price),
			})),
	);

	const fees_query = useLiveQuery((q) =>
		q
			.from({ fee: ItemFeesCollection })
			.where(({ fee }) => eq(fee.buyer_paid, false))
			.select(({ fee }) => ({
				total_fee_amount: sum(fee.amount),
			})),
	);

	const total_items = $derived(
		total_items_query.data.length > 0 ? total_items_query.data[0].item_count : 0,
	);

	const total_refunded_items = $derived(
		refunded_items_query.data.length > 0 ? refunded_items_query.data[0].item_count : 0,
	);

	const total_sale_amount = $derived(
		sold_listings_query.data.length > 0 ? sold_listings_query.data[0].total_sale_amount : 0,
	);

	const total_fee_amount = $derived(
		fees_query.data.length > 0 ? fees_query.data[0].total_fee_amount : 0,
	);
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "page", text: "Analytics" },
		]}
	></DashboardHeader>

	<DashboardContent class="flex flex-col">
		<FormCard class="@container">
			<FormCardSection
				class="grid grid-cols-2 gap-0 p-0 @2xl:grid-cols-4 @2xl:*:border-t-0! @2xl:*:border-l-0 @2xl:[&>*:not(:nth-child(4n+1))]:border-l [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t"
			>
				<div class="grid p-4">
					<p class="text-2xl font-medium">{total_items}</p>
					<p class="text-sm text-muted-foreground">Items Tracked</p>
				</div>
				<div class="grid p-4">
					<p class="text-2xl font-medium">{total_refunded_items}</p>
					<p class="text-sm text-muted-foreground">Items Refunded</p>
				</div>
				<div class="grid p-4">
					<p class="text-2xl font-medium">{FormatCurrency(total_sale_amount)}</p>
					<p class="text-sm text-muted-foreground">Revenue</p>
				</div>
				<div class="grid p-4">
					<p class="text-2xl font-medium">
						{FormatCurrency(total_sale_amount - total_fee_amount)}
					</p>
					<p class="text-sm text-muted-foreground">Profit</p>
				</div>
			</FormCardSection>
		</FormCard>

		<FormCard>
			<FormCardSection>
				<div class="flex flex-row items-center gap-6">
					<div class="grid flex-1 gap-1">
						<p class="text-base font-medium">Inventory</p>

						<p class="text-sm text-muted-foreground">
							Examine your tracked purchases and financial data
						</p>
					</div>

					<Button class="w-48" href="/dashboard/analytics/inventory"
						>View Inventory Data <LucideChevronRight /></Button
					>
				</div>
			</FormCardSection>
			<FormCardSection>
				<div class="flex flex-row items-center gap-6">
					<div class="grid flex-1 gap-1">
						<p class="text-base font-medium">Refunds</p>

						<p class="text-sm text-muted-foreground">
							View the details associated with item returns
						</p>
					</div>

					<Button class="w-48" href="/dashboard/analytics/refunds"
						>View Refund Data <LucideChevronRight /></Button
					>
				</div>
			</FormCardSection>
		</FormCard>
	</DashboardContent>
</DashboardLayoutRoot>
