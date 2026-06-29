<script lang="ts">
	import { Dialog } from "$lib/components/ui/dialog";
	import { item_dialog_state, type ItemDialogMeta } from "./dialog-state.svelte";
	import AddFeeDialog from "./item-dialogs/AddFeeDialog.svelte";
	import ItemFeesDialog from "./item-dialogs/ItemFeesDialog.svelte";
	import ItemSaleDialog from "./item-dialogs/ItemSaleDialog.svelte";
	import LinkItemDialog from "./item-dialogs/LinkItemDialog.svelte";
	import ListingHistoryDialog from "./item-dialogs/ListingHistoryDialog.svelte";
	import ListItemDialog from "./item-dialogs/ListItemDialog.svelte";
	import RefundItemDialog from "./item-dialogs/RefundItemDialog.svelte";
	import UpdateListingDialog from "./item-dialogs/UpdateListingDialog.svelte";

	function RequestClose() {
		item_dialog_state.item_dialog_open = false;
	}

	function HandleOpenChangeComplete(open: boolean) {
		if (open == false) {
			item_dialog_state.item = null;
			item_dialog_state.dialog_type = null;
		}
	}
</script>

{#if item_dialog_state.item}
	<Dialog
		open={item_dialog_state.item_dialog_open}
		onOpenChangeComplete={HandleOpenChangeComplete}
	>
		{#if item_dialog_state.dialog_type == "list"}
			<ListItemDialog
				item={item_dialog_state.item}
				request_close={RequestClose}
				meta={item_dialog_state.dialog_meta as ItemDialogMeta<"list">}
			/>
		{/if}

		{#if item_dialog_state.dialog_type == "sell"}
			<ItemSaleDialog
				item={item_dialog_state.item}
				request_close={RequestClose}
				meta={item_dialog_state.dialog_meta as ItemDialogMeta<"sell">}
			/>
		{/if}

		{#if item_dialog_state.dialog_type == "refund"}
			<RefundItemDialog
				item={item_dialog_state.item}
				request_close={RequestClose}
				meta={item_dialog_state.dialog_meta as ItemDialogMeta<"refund">}
			/>
		{/if}

		{#if item_dialog_state.dialog_type == "link"}
			<LinkItemDialog
				item={item_dialog_state.item}
				request_close={RequestClose}
				meta={item_dialog_state.dialog_meta as ItemDialogMeta<"link">}
			/>
		{/if}

		{#if item_dialog_state.dialog_type == "fee-details"}
			<ItemFeesDialog
				item={item_dialog_state.item}
				request_close={RequestClose}
				meta={item_dialog_state.dialog_meta as ItemDialogMeta<"fee-details">}
			/>
		{/if}

		{#if item_dialog_state.dialog_type == "listing-history"}
			<ListingHistoryDialog
				item={item_dialog_state.item}
				request_close={RequestClose}
				meta={item_dialog_state.dialog_meta as ItemDialogMeta<"listing-history">}
			/>
		{/if}

		{#if item_dialog_state.dialog_type == "update-listing"}
			<UpdateListingDialog
				item={item_dialog_state.item}
				request_close={RequestClose}
				meta={item_dialog_state.dialog_meta as ItemDialogMeta<"update-listing">}
			/>
		{/if}

		{#if item_dialog_state.dialog_type == "add-fee"}
			<AddFeeDialog
				item={item_dialog_state.item}
				request_close={RequestClose}
				meta={item_dialog_state.dialog_meta as ItemDialogMeta<"add-fee">}
			/>
		{/if}
	</Dialog>
{/if}
