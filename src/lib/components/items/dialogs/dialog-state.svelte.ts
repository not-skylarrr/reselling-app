import type { FullItem, Item, ItemListing } from "$lib/server/db/schema";

type ItemDialogState = {
	item: Item | null;
	dialog_type: keyof DialogDefinitions | null;
	dialog_meta: Record<string, any> | undefined;
	item_dialog_open: boolean;
	new_item_dialog_open: boolean;
};

type DialogDefinition<T> = {
	item: Item;
	request_close: () => void;
	meta: T;
};

export type DialogDefinitions = {
	list: DialogDefinition<never>;
	sell: DialogDefinition<{ listing_id?: string }>;
	link: DialogDefinition<never>;
	"update-listing": DialogDefinition<{ listing: ItemListing }>;
	"listing-history": DialogDefinition<never>;
	"fee-details": DialogDefinition<never>;
};

export type ItemDialogProps<K extends keyof DialogDefinitions> = DialogDefinitions[K];
export type ItemDialogMeta<K extends keyof DialogDefinitions> = DialogDefinitions[K]["meta"];

export const item_dialog_state = $state<ItemDialogState>({
	item: null,
	dialog_type: null,
	dialog_meta: {},
	item_dialog_open: false,
	new_item_dialog_open: false,
});

export function OpenNewItemDialog() {
	item_dialog_state.new_item_dialog_open = true;
}

export function OpenItemDialog<K extends keyof DialogDefinitions>(
	item: Item,
	type: K,
	...meta: DialogDefinitions[K]["meta"] extends never ? [] : [DialogDefinitions[K]["meta"]]
) {
	item_dialog_state.item = item;
	item_dialog_state.dialog_type = type;
	item_dialog_state.item_dialog_open = true;
	item_dialog_state.dialog_meta = meta[0] == undefined ? undefined : meta[0];
}
