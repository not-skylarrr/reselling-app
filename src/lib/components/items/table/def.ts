import { createColumnHelper, renderComponent } from "@tanstack/svelte-table";
import {
	CellCurrency,
	CellCurrencyRange,
	CellLabels,
	CellLocation,
	CellMarketplace,
	CellStatus,
	CellString,
} from "./components/cells";
import type { InventoryItemData } from "$lib/collections/query-collections";
import { OptionFilter, StringFilter } from "./lib/filters/lib/functions";
import {
	LucideArchive,
	LucideCircle,
	LucideCircleCheck,
	LucideDollarSign,
	LucidePackage,
	LucideTag,
	LucideTags,
	LucideType,
	LucideX,
} from "@lucide/svelte";
import { AdvancedFilter } from "./lib/filters";
import { CalculateItemProfit } from "$lib/items/utils";
import { trpc_client } from "$lib/trpc/client";
import LabelMarkers from "../../labels/LabelMarkers.svelte";
import LocationMarker from "../../locations/LocationMarker.svelte";
import type { FullItem, WorkspaceLabel } from "$lib/server/db/schema";
import { DefaultTableFeatures } from "$lib/table/init.svelte";

const column = createColumnHelper<DefaultTableFeatures, FullItem>();

export const ItemTableColumns = [
	column.accessor("name", {
		header: "Name",
		cell: (info) =>
			renderComponent(CellString, {
				value: info.getValue(),
				muted: info.cell.row.original.archived,
			}),
		meta: {
			align: "left",
			filter: StringFilter({
				icon: { component: LucideType },
				name: "Name",
			}),
		},
		minSize: 360,
		filterFn: AdvancedFilter,
	}),
	column.accessor("status", {
		header: "Status",
		cell: (info) => renderComponent(CellStatus, { value: info.getValue() }),
		meta: {
			align: "left",
			filter: OptionFilter({
				icon: { component: LucideCircle },
				name: "Status",
				multiLabel: "statuses",
				options: [
					{
						icon: { component: LucideCircleCheck, props: { class: "stroke-success" } },
						label: "Completed",
						value: "completed",
					},
					{
						icon: { component: LucideX, props: { class: "stroke-destructive" } },
						label: "Refunded",
						value: "refunded",
					},
					{
						icon: { component: LucidePackage, props: { class: "stroke-amber-500" } },
						label: "Posted",
						value: "posted",
					},
					{
						icon: { component: LucideDollarSign, props: { class: "stroke-cyan-400" } },
						label: "Sold",
						value: "sold",
					},
					{
						icon: { component: LucideTag, props: { class: "stroke-indigo-400" } },
						label: "Listed",
						value: "listed",
					},
					{
						icon: { component: LucideArchive, props: { class: "stroke-muted-foreground" } },
						label: "Unlisted",
						value: "unlisted",
					},
				],
				getKey: (status) => status as string,
			}),
		},
		minSize: 184,
		filterFn: AdvancedFilter,
		sortingFn: (a, b) => {
			return b.original.status_int - a.original.status_int;
		},
	}),
	column.accessor("labels", {
		header: "Labels",
		cell: (info) => renderComponent(CellLabels, { labels: info.getValue() }),
		minSize: 184,
		meta: {
			align: "left",
			filter: OptionFilter<WorkspaceLabel>({
				icon: { component: LucideTags },
				name: "Label",
				multiLabel: "labels",
				options: async () => {
					const labels = await trpc_client.workspace.labels.get_ts_db.query({});

					return labels.map((label) => ({
						icon: {
							component: LabelMarkers,
							props: { labels: [label] },
						},
						label: label.content,
						value: label.id,
					}));
				},
				getKey: (label) => label.id,
			}),
		},
		filterFn: AdvancedFilter,
	}),
	column.accessor("location", {
		header: "Location",
		cell: (info) => renderComponent(CellLocation, { location: info.getValue() }),
		meta: {
			align: "left",
			filter: OptionFilter({
				icon: { component: LucidePackage },
				name: "Location",
				multiLabel: "locations",
				options: async () => {
					const locations = await trpc_client.workspace.locations.get_ts_db.query({});

					return locations.map((location) => ({
						icon: {
							component: LocationMarker,
							props: { location: location },
						},
						label: location.name,
						value: location.id,
					}));
				},
				getKey: (id: string) => id,
			}),
		},
		minSize: 184,
		filterFn: AdvancedFilter,
	}),
	column.accessor(
		(row) => {
			const marketplace_ids = new Set<string>();

			for (const listing of row.listings) {
				if (listing.status == "active" || listing.status == "sold") {
					if (!marketplace_ids.has(listing.marketplace_id)) {
						marketplace_ids.add(listing.marketplace_id);
					}
				}
			}

			return marketplace_ids.values().toArray();
		},
		{
			id: "marketplaces",
			header: "Marketplaces",
			cell: (info) => renderComponent(CellMarketplace, { marketplace_ids: info.getValue() }),
			minSize: 196,
			meta: {
				align: "left",
			},
		},
	),
	column.accessor("purchase_price", {
		header: "Purchase Price",
		cell: (info) => renderComponent(CellCurrency, { value: info.getValue() }),
		minSize: 160,
	}),
	column.accessor("target_sale_price", {
		header: "Target Sale Price",
		cell: (info) => renderComponent(CellCurrency, { value: info.getValue() }),
		minSize: 160,
	}),
	column.accessor(
		(row) => {
			if (row.status_int == 0) return null;

			const listing_prices = row.listings
				.filter((listing) => listing.status == "active" || listing.status == "sold")
				.map((listing) => listing.price);

			if (listing_prices.length == 0) return null;

			const min_list_price = Math.min(...listing_prices);
			const max_list_price = Math.max(...listing_prices);

			if (min_list_price == max_list_price) return min_list_price;

			return [min_list_price, max_list_price] as const;
		},
		{
			id: "list_price",
			header: "List Price",
			cell: (info) => renderComponent(CellCurrencyRange, { value: info.getValue() }),
			minSize: 196,
		},
	),
	column.accessor(
		(row) => {
			const sold_listing = row.listings.find((l) => l.status == "sold");
			if (!sold_listing) return null;

			return sold_listing.price;
		},
		{
			id: "sale_price",
			header: "Sale Price",
			cell: (info) => renderComponent(CellCurrencyRange, { value: info.getValue() }),
			minSize: 160,
		},
	),
	column.accessor(
		(row) => {
			if (row.status_int == 0) return null;

			const total_listing_fees = row.fees
				.filter((fee) => fee.type == "listing_fee")
				.reduce((total, fee) => {
					return total + fee.amount;
				}, 0);

			return total_listing_fees;
		},
		{
			id: "listing_fees",
			header: "Listing Fees",
			cell: (info) => renderComponent(CellCurrency, { value: info.getValue() }),
			minSize: 160,
		},
	),
	column.accessor(
		(row) => {
			if (row.status_int == 0) return null;

			const total_listing_fees = row.fees
				.filter((fee) => fee.type == "final_fee")
				.reduce((total, fee) => {
					return total + fee.amount;
				}, 0);

			return total_listing_fees;
		},
		{
			id: "final_fees",
			header: "Final Fees",
			cell: (info) => renderComponent(CellCurrency, { value: info.getValue() }),
			minSize: 160,
		},
	),
	column.accessor(
		(row) => {
			if (row.status_int == 0) return null;

			const total_fees = row.fees.reduce((total, fee) => {
				if (fee.buyer_paid) return total;

				return total + fee.amount;
			}, 0);

			return total_fees;
		},
		{
			id: "total_fees",
			header: "Total Fees",
			cell: (info) => renderComponent(CellCurrency, { value: info.getValue() }),
			minSize: 160,
		},
	),
	column.accessor(
		(row) => CalculateItemProfit({ item: row, listings: row.listings, fees: row.fees }),
		{
			id: "profit",
			header: "Final Profit",
			cell: (info) =>
				renderComponent(CellCurrency, { richColours: true, value: info.getValue() }),
			minSize: 160,
		},
	),
];
