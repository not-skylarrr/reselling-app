<script lang="ts">
	import UpdateItemPriceInput from "$lib/components/items/item-page/UpdateItemPriceInput.svelte";
	import { Button } from "$lib/components/ui/button";
	import { GetMarketplaceData } from "$lib/data/marketplaces/utils";
	import type { FullItem } from "$lib/server/db/schema";
	import { FormatCurrency } from "$lib/utils/formatting";
	import {
		LucideEllipsisVertical,
		LucideInfo,
		LucidePackage,
		LucidePlus,
	} from "@lucide/svelte";
	import ViewFeesDialog from "./components/ViewFeesDialog.svelte";
	import { CalculateItemProfit, CalculateTotalFees } from "$lib/items/utils";
	import { Separator } from "$lib/components/ui/separator";
	import { ListingsCollection, ItemsCollection } from "$lib/collections/def.svelte";
	import FormCard from "$lib/components/settings/form/FormCard.svelte";
	import FormCardSection from "$lib/components/settings/form/FormCardSection.svelte";

	type Props = {
		item: FullItem;
	};

	let { item }: Props = $props();
</script>

<div class="flex flex-col gap-2">
	<p class="px-4 text-lg font-medium">Purchase Details</p>

	<FormCard class="divide-transparent @3xl:h-78.5">
		<FormCardSection>
			<div class="flex flex-1 flex-col gap-2">
				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Purchase Price</p>

					<UpdateItemPriceInput
						label="Update Purchase Price"
						price={item.purchase_price}
						onPriceChange={(val) => {
							ItemsCollection.update(item.id, (draft) => {
								draft.purchase_price = val;
							});
						}}
					/>
				</div>

				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Target Sale Price</p>

					<UpdateItemPriceInput
						label="Update Target Sale Price"
						price={item.target_sale_price}
						onPriceChange={(val) => {
							ItemsCollection.update(item.id, (draft) => {
								draft.target_sale_price = val;
							});
						}}
					/>
				</div>

				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Purchase Date</p>

					<UpdateItemPriceInput
						label="Update Target Sale Price"
						price={item.target_sale_price}
						onPriceChange={(val) => {
							ItemsCollection.update(item.id, (draft) => {
								draft.target_sale_price = val;
							});
						}}
					/>
				</div>

				<div class="flex flex-row items-center justify-between">
					<p class="text-sm text-muted-foreground">Register Date</p>

					<UpdateItemPriceInput
						label="Update Target Sale Price"
						price={item.target_sale_price}
						onPriceChange={(val) => {
							ItemsCollection.update(item.id, (draft) => {
								draft.target_sale_price = val;
							});
						}}
					/>
				</div>
			</div>
		</FormCardSection>
	</FormCard>
</div>
