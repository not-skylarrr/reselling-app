<script lang="ts">
	import {
		ItemAssociationsCollection,
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
	import { FormatCurrency } from "$lib/utils/formatting";
	import { LucideChevronRight } from "@lucide/svelte";
	import { count, eq, and, sum, useLiveQuery } from "@tanstack/svelte-db";

	const total_items_query = useLiveQuery((q) =>
		q.from({ item: ItemsCollection }).select(({ item }) => ({
			item_count: count(item.id),
			item_cost: sum(item.purchase_price),
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
				count: count(fee.id),
				total_fee_amount: sum(fee.amount),
			})),
	);

	const grouped_fees_query = useLiveQuery((q) =>
		q
			.from({ fee: ItemFeesCollection })
			.groupBy(({ fee }) => fee.type)
			.select(({ fee }) => ({
				type: fee.type,
				count: count(fee.id),
				amount: sum(fee.amount),
			})),
	);

	const fee_data_by_type = $derived.by(() => {
		const fee_types: Record<string, { count: number; amount: number }> = {};

		for (const fee_group of grouped_fees_query.data) {
			fee_types[fee_group.type] = {
				count: fee_group.count,
				amount: fee_group.amount,
			};
		}

		return fee_types;
	});

	const refund_fees_query = useLiveQuery((q) =>
		q
			.from({ fee: ItemFeesCollection })
			.where(({ fee }) => and(eq(fee.type, "refunded_amount"), eq(fee.buyer_paid, false)))
			.select(({ fee }) => ({
				total_refunded: sum(fee.amount),
			})),
	);

	const return_associations_query = useLiveQuery((q) =>
		q
			.from({ association: ItemAssociationsCollection })
			.where(({ association }) => eq(association.type, "returned-item"))
			.select(({ association }) => ({ total: count(association.id) })),
	);

	const total_item_cost = $derived(
		total_items_query.data.length > 0 ? total_items_query.data[0].item_cost : 0,
	);

	const total_sale_amount = $derived(
		sold_listings_query.data.length > 0 ? sold_listings_query.data[0].total_sale_amount : 0,
	);

	const total_fee_amount = $derived(
		fees_query.data.length > 0 ? fees_query.data[0].total_fee_amount : 0,
	);

	const total_profit = $derived(total_sale_amount - total_item_cost - total_fee_amount);

	const total_refunded_items = $derived(
		refunded_items_query.data.length > 0 ? refunded_items_query.data[0].item_count : 0,
	);

	const total_returned_items = $derived(
		return_associations_query.data.length > 0 ? return_associations_query.data[0].total : 0,
	);

	const total_amount_refunded = $derived(
		refund_fees_query.data.length > 0 ? refund_fees_query.data[0].total_refunded : 0,
	);
</script>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "page", text: "Analytics" },
		]}
	></DashboardHeader>

	<DashboardContent class="flex flex-col gap-8 pt-8 md:gap-12">
		<div class="@container flex flex-col gap-4">
			<div class="flex flex-row items-center justify-between px-3">
				<div class="grid">
					<p class="text-xl font-medium">Inventory Financials</p>
					<p class="text-sm text-muted-foreground">
						Get a detailed view on your inventory and purchases
					</p>
				</div>

				<Button class="hidden @xl:flex" href="/dashboard/analytics/inventory"
					>View Inventory Data <LucideChevronRight /></Button
				>
			</div>

			<FormCard>
				<FormCardSection
					class="grid grid-cols-2 gap-0 p-0 @3xl:grid-cols-4 @3xl:*:border-t-0! @3xl:*:border-l-0 @3xl:[&>*:not(:nth-child(4n+1))]:border-l [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t"
				>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">{total_items_query.data[0]?.item_count ?? 0}</p>
						<p class="text-sm text-muted-foreground">Items Tracked</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">
							{FormatCurrency(sold_listings_query.data[0]?.total_sale_amount ?? 0)}
						</p>
						<p class="text-sm text-muted-foreground">Total Revenue</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">
							{FormatCurrency(total_item_cost + total_fee_amount)}
						</p>
						<p class="text-sm text-muted-foreground">Total Costs</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">{FormatCurrency(total_profit)}</p>
						<p class="text-sm text-muted-foreground">Current Profit</p>
					</div>
				</FormCardSection>
			</FormCard>

			<Button class="@xl:hidden" href="/dashboard/analytics/inventory"
				>View Inventory Data <LucideChevronRight /></Button
			>
		</div>

		<div class="@container flex flex-col gap-4">
			<div class="flex flex-row items-center justify-between px-3">
				<div class="grid">
					<p class="text-xl font-medium">Fee Breakdown</p>
					<p class="text-sm text-muted-foreground">
						View a breakdown on all paid marketplace and postage fees
					</p>
				</div>

				<Button class="hidden @xl:flex" href="/dashboard/analytics/fees"
					>View Fee Breakdown<LucideChevronRight /></Button
				>
			</div>

			<FormCard>
				<FormCardSection
					class="grid grid-cols-2 gap-0 p-0 @3xl:grid-cols-4 @3xl:*:border-t-0! @3xl:*:border-l-0 @3xl:[&>*:not(:nth-child(4n+1))]:border-l [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t"
				>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">{fees_query.data[0]?.count ?? 0}</p>
						<p class="text-sm text-muted-foreground">Fees Tracked</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">
							{FormatCurrency(fees_query.data[0]?.total_fee_amount ?? 0)}
						</p>
						<p class="text-sm text-muted-foreground">Fees Paid</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">
							{FormatCurrency(fee_data_by_type["listing_fee"]?.amount ?? 0)}
						</p>
						<p class="text-sm text-muted-foreground">Listing Fees</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">
							{FormatCurrency(fee_data_by_type["final_fee"]?.amount ?? 0)}
						</p>
						<p class="text-sm text-muted-foreground">Sale Fees</p>
					</div>
				</FormCardSection>
			</FormCard>

			<Button class="@xl:hidden" href="/dashboard/analytics/fees"
				>View Fee Breakdown<LucideChevronRight /></Button
			>
		</div>

		<div class="@container flex flex-col gap-4">
			<div class="flex flex-row items-center justify-between px-3">
				<div class="grid">
					<p class="text-xl font-medium">Refunds & Returns</p>
					<p class="text-sm text-muted-foreground">
						View a breakdown on your refunded/returned items
					</p>
				</div>

				<Button class="hidden @xl:flex" href="/dashboard/analytics/refunds"
					>View Refund Data <LucideChevronRight /></Button
				>
			</div>

			<FormCard>
				<FormCardSection
					class="grid grid-cols-2 gap-0 p-0 @3xl:grid-cols-4 @3xl:*:border-t-0! @3xl:*:border-l-0 @3xl:[&>*:not(:nth-child(4n+1))]:border-l [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t"
				>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">{total_refunded_items}</p>
						<p class="text-sm text-muted-foreground">Items Refunded</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">{total_returned_items}</p>
						<p class="text-sm text-muted-foreground">Items Returned</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">{FormatCurrency(total_amount_refunded)}</p>
						<p class="text-sm text-muted-foreground">Amount Refunded</p>
					</div>
					<div class="flex flex-col justify-center p-6">
						<p class="text-2xl font-medium">{FormatCurrency(total_amount_refunded)}</p>
						<p class="text-sm text-muted-foreground">Amount Refunded</p>
					</div>
				</FormCardSection>
			</FormCard>

			<Button class="@xl:hidden" href="/dashboard/analytics/refunds"
				>View Refund Data <LucideChevronRight /></Button
			>
		</div>
	</DashboardContent>
</DashboardLayoutRoot>
