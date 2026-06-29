<script lang="ts">
	import { ScrollArea } from "$lib/components/ui/scroll-area";
	import { useRefundAnalytics } from "$lib/hooks/analytics/refunds.svelte";
	import { GetRefundTypeFriendlyName, RefundTypeIcons } from "$lib/items/utils";
	import { FormatCurrency } from "$lib/utils/formatting";
	import RefundAmountCard from "../cards/refunds/RefundAmountCard.svelte";
	import RefundCountCard from "../cards/refunds/RefundCountCard.svelte";
	import RefundTypeCard from "../cards/refunds/RefundTypeCard.svelte";
	import {
		AnalyticsCardSection,
		AnalyticsContent,
		AnalyticsHeader,
		AnalyticsLinkAction,
		AnalyticsSection,
		AnalyticsTitle,
	} from "../layout";

	const analytics = useRefundAnalytics();
</script>

<AnalyticsSection>
	<AnalyticsHeader>
		<AnalyticsTitle>Returns & Refunds</AnalyticsTitle>
		<AnalyticsLinkAction href="/dashboard/analytics/refunds" />
	</AnalyticsHeader>
	<AnalyticsContent>
		<AnalyticsCardSection>
			<RefundCountCard />
			<RefundAmountCard />
			<RefundTypeCard />
		</AnalyticsCardSection>

		<div class="flex h-96 flex-row">
			<div class="flex max-w-96 flex-1 flex-col gap-3 border-r p-6">
				<p class="font-medium">Refund Types</p>

				<ScrollArea class="flex-1 overflow-hidden">
					<div class="flex flex-col gap-2">
						{#each analytics.type_breakdown as refund_type_data}
							{@const TypeIcon =
								RefundTypeIcons[refund_type_data.type as keyof typeof RefundTypeIcons]}

							<div class="flex flex-row items-center justify-between">
								<div class="flex flex-row items-center gap-2">
									<TypeIcon class="size-4 stroke-muted-foreground" />
									<p>{GetRefundTypeFriendlyName(refund_type_data.type)}</p>
								</div>

								<p>
									{FormatCurrency(refund_type_data.total_refunded)}
								</p>
							</div>
						{/each}
					</div>
				</ScrollArea>
			</div>
		</div>
	</AnalyticsContent>
</AnalyticsSection>
