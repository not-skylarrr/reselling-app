import { ItemsCollection, ItemFeesCollection } from "$lib/collections/def.svelte";
import { and, eq, toArray, useLiveQuery } from "@tanstack/svelte-db";

export function useRefundAnalytics() {
	const refunded_items_query = useLiveQuery((q) =>
		q
			.from({ items: ItemsCollection })
			.where(({ items }) => eq(items.status, "refunded"))
			.select(({ items }) => ({
				...items,
				refund_fees: toArray(
					q
						.from({ fees: ItemFeesCollection })
						.where(({ fees }) =>
							and(eq(fees.type, "refunded_amount"), eq(fees.item_id, items.id)),
						),
				),
			})),
	);

	const refunded_finance_data = $derived.by(() => {
		if (refunded_items_query.data.length == 0) return { type_breakdown: [], total_refunded: 0 };

		let total_refunded = 0;
		let amount_per_type = new Map<string, number>();
		let count_per_type = new Map<string, number>();

		for (const item of refunded_items_query.data) {
			let refund_type = item.refund_type;

			if (refund_type == null) {
				refund_type = "CUSTOM";
			}

			const item_refund_total = item.refund_fees.reduce((total, fee) => {
				return total + fee.amount;
			}, 0);

			if (count_per_type.has(refund_type)) {
				let curr_count = count_per_type.get(refund_type)!;

				count_per_type.set(refund_type, curr_count + 1);
			} else {
				count_per_type.set(refund_type, 1);
			}

			if (amount_per_type.has(refund_type)) {
				let curr_value = amount_per_type.get(refund_type)!;

				amount_per_type.set(refund_type, curr_value + item_refund_total);
			} else {
				amount_per_type.set(refund_type, item_refund_total);
			}

			total_refunded += item_refund_total;
		}

		return {
			type_breakdown: amount_per_type
				.entries()
				.toArray()
				.map(([type, total]) => ({
					type,
					count: count_per_type.get(type)!,
					total_refunded: total,
				})),
			total_refunded: total_refunded,
		};
	});

	const refund_reasons = $derived.by(() => {});

	return {
		get type_breakdown() {
			return refunded_finance_data.type_breakdown;
		},
		get total_refunded() {
			return refunded_finance_data.total_refunded;
		},
		get refunded_items() {
			return refunded_items_query.data;
		},
	};
}
