<script lang="ts">
	import DashboardContent from "$lib/components/dashboard/layout/DashboardContent.svelte";
	import DashboardHeader from "$lib/components/dashboard/layout/DashboardHeader.svelte";
	import DashboardLayoutRoot from "$lib/components/dashboard/layout/DashboardLayoutRoot.svelte";
	import { useLiveQuery, and, eq, inArray, queryOnce, toArray } from "@tanstack/svelte-db";
	import {
		BundleItemsCollection,
		BundlesCollection,
		ItemAssociationsCollection,
		ItemsCollection,
	} from "$lib/collections/def.svelte";
	import {
		LucideCheck,
		LucideEye,
		LucideLink,
		LucidePackage,
		LucideSettings,
		LucideTrash,
		LucideX,
	} from "@lucide/svelte";
	import {
		GetBundleCompletionStats,
		GetBundleItemInventoryCount,
		IsBundleItemNeeded,
	} from "$lib/components/bundles/table/lib/utils.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import {
		Item,
		ItemActions,
		ItemContent,
		ItemDescription,
		ItemMedia,
		ItemTitle,
	} from "$lib/components/ui/item/index.js";
	import { ScrollArea } from "$lib/components/ui/scroll-area/index.js";
	import type { BundleAssociationData } from "../+page.svelte";
	import { OpenDestructiveActionDialog } from "$lib/components/utils/dialogs/destructive-dialog-state.svelte";
	import { trpc_client } from "$lib/trpc/client";
	import { goto } from "$app/navigation";

	let { data } = $props();

	let bundle_query = useLiveQuery((q) =>
		q
			.from({ bundle: BundlesCollection })
			.where(({ bundle }) => eq(bundle.id, data.bundle.id))
			.select(({ bundle }) => ({
				...bundle,
				items: toArray(
					q
						.from({ bundle_item: BundleItemsCollection })
						.where(({ bundle_item }) => eq(bundle.id, bundle_item.bundle_id))
						.orderBy(({ bundle_item }) => bundle_item.name, "asc")
						.select(({ bundle_item }) => ({
							...bundle_item,
							associations: toArray(
								q
									.from({ association: ItemAssociationsCollection })
									.where(({ association }) =>
										and(
											eq(association.subject_id, bundle_item.id),
											eq(association.type, "bundle-item"),
										),
									)
									.leftJoin({ item: ItemsCollection }, ({ association, item }) =>
										eq(item.id, association.item_id),
									)
									.where(({ item }) => inArray(item.status, ["unlisted", "listed"]))
									.fn.select(
										(row): BundleAssociationData => ({
											...row.association,
											item: row.item,
										}),
									),
							),
						})),
				),
			}))
			.findOne(),
	);

	let bundle = $derived(bundle_query.data ?? data.bundle);
	// @ts-expect-error Fix this type error later
	let completion = $derived(GetBundleCompletionStats(bundle));

	let can_package = $derived(completion.total_item_count == completion.completion_count);

	// Remove the "header" items from the required items
	const items_required_for_completion = $derived.by(() => {
		const header_ids: Set<string> = new Set();

		for (const item of bundle.items) {
			if (item.parent_id) {
				header_ids.add(item.parent_id);
			}
		}

		return bundle.items.filter((item) => {
			if (header_ids.has(item.id)) return false;

			return true;
		});
	});

	let [required_items, in_stock_items] = $derived.by(() => {
		const required_items = [];
		const in_stock_items = [];

		for (const item of items_required_for_completion) {
			// @ts-expect-error Fix this type error later
			const is_required = IsBundleItemNeeded(item);

			if (is_required) {
				required_items.push(item);
			} else {
				in_stock_items.push(item);
			}
		}

		return [required_items, in_stock_items] as const;
	});

	function HandleBundleDelete(bundle_id: string) {
		OpenDestructiveActionDialog({
			title: "Are you sure?",
			description: "This bundle cannot be recovered once it has been deleted",
			onConfirm: async () => {
				const bundle_items = await queryOnce((q) =>
					q
						.from({ bundle_item: BundleItemsCollection })
						.where(({ bundle_item }) => eq(bundle_item.bundle_id, bundle_id)),
				);

				const bundle_item_ids = [...bundle_items].map((item) => item.id);

				for (const item of bundle_items) {
					BundleItemsCollection.delete(item.id);
				}

				const associations = await queryOnce((q) =>
					q
						.from({ association: ItemAssociationsCollection })
						.where(({ association }) =>
							and(
								inArray(association.subject_id, bundle_item_ids),
								eq(association.type, "bundle-item"),
							),
						),
				);

				for (const association of associations) {
					ItemAssociationsCollection.delete(association.id);
				}

				BundlesCollection.delete(bundle_id);

				goto("/dashboard/bundles");
			},
		});
	}
</script>

<svelte:head>
	<title>Bundles | {bundle.name}</title>
</svelte:head>

<DashboardLayoutRoot>
	<DashboardHeader
		breadcrumbs={[
			{ type: "link", text: "Dashboard", href: "/dashboard" },
			{ type: "link", text: "Bundles", href: "/dashboard/bundles" },
			{ type: "page", text: bundle.name },
		]}
	></DashboardHeader>

	<DashboardContent class="@container gap-0 p-0 md:gap-0 md:p-0" disableScroll>
		<div class="flex flex-row items-center gap-6 border-b p-6">
			<div class="flex size-14 items-center justify-center rounded-lg bg-muted">
				<LucidePackage class="stroke-muted-foreground" />
			</div>
			<div class="grid flex-1">
				<p class="text-xl font-medium">{bundle.name}</p>
				<p class="text-sm text-muted-foreground">{completion.completion_perc}% Completed</p>
			</div>
			<div class="hidden flex-row gap-3 @2xl:flex">
				<Button href={`/dashboard/bundles/${bundle.id}/update`} variant="outline"
					><LucideSettings /> Update Bundle</Button
				>

				{#if can_package}
					<Button><LucidePackage /> Package Items</Button>
				{/if}

				<Button onclick={() => HandleBundleDelete(bundle.id)} size="icon" variant="destructive"
					><LucideTrash /></Button
				>
			</div>
		</div>

		<div
			class="grid gap-3 border-b px-6 py-3 data-[can-package=true]:@md:grid-cols-2 @2xl:hidden"
			data-can-package={can_package}
		>
			<Button variant="outline"><LucideSettings /> Update Bundle</Button>
			{#if can_package}
				<Button><LucidePackage /> Package Items</Button>
			{/if}
		</div>

		<div class="flex flex-1 flex-col overflow-hidden">
			<ScrollArea class="min-h-0 flex-1 overflow-hidden">
				<div
					class="flex min-h-full flex-col divide-y md:grid md:grid-cols-2 md:divide-x md:divide-y-0"
				>
					<div class="flex flex-col gap-6 p-6">
						<h5 class="text-lg font-medium">Required Items</h5>

						<div class="flex flex-col gap-4">
							{#each required_items as item (item.id)}
								<Item class="p-0">
									<ItemMedia variant="icon">
										<LucideX class="stroke-destructive" />
									</ItemMedia>
									<ItemContent>
										<ItemTitle class="text-sm">{item.name}</ItemTitle>
										<ItemDescription class="text-xs">At least 1 required</ItemDescription>
									</ItemContent>

									<ItemActions>
										<Button size="xs" variant="outline"><LucideLink /> Link Item (WIP)</Button>
									</ItemActions>
								</Item>
							{/each}
						</div>
					</div>

					<div class="flex flex-col gap-6 p-6">
						<h5 class="text-lg font-medium">In Stock Items</h5>

						<div class="flex flex-col gap-4">
							{#each in_stock_items as item (item.id)}
								{@const stock_count = GetBundleItemInventoryCount(item)}

								<Item class="p-0">
									<ItemMedia variant="icon">
										<LucideCheck class="stroke-green-600 dark:stroke-green-400" />
									</ItemMedia>
									<ItemContent>
										<ItemTitle class="text-sm">{item.name}</ItemTitle>
										<ItemDescription class="text-xs">{stock_count} in stock</ItemDescription>
									</ItemContent>

									<ItemActions>
										<Button
											href={`/dashboard/bundles/${bundle.id}/items/${item.id}`}
											size="xs"
											variant="outline"><LucideEye /> View Items</Button
										>
									</ItemActions>
								</Item>
							{/each}
						</div>
					</div>
				</div>
			</ScrollArea>
		</div>
	</DashboardContent>
</DashboardLayoutRoot>
