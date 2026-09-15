export type ItemMetadataTypeMap = {
	string: string;
	number: number;
	currency: number;
};

export type ItemMetadataType = keyof ItemMetadataTypeMap;

export type ItemMetadataValue = {
	[K in ItemMetadataType]: {
		type: K;
		value: ItemMetadataTypeMap[K];
	};
}[ItemMetadataType];

export function GetMetadataTypeName(type: ItemMetadataType) {
	switch (type) {
		case "string":
			return "Text";

		case "number":
			return "Number";

		case "currency":
			return "Currency";

		default:
			return "Unknown";
	}
}

export const ItemMetadataParsers: {
	[K in ItemMetadataType]: (val_string: string) => ItemMetadataTypeMap[K];
} = {
	string: (val_string) => val_string,
	number: (val_string) => Number(val_string),
	currency: (val_string) => Number(val_string),
};

export function ParseItemMetadataField<T extends ItemMetadataType>(
	type: T,
	val_string: string,
): ItemMetadataTypeMap[T] {
	return ItemMetadataParsers[type](val_string);
}

export const ItemMetadataSerializers: {
	[K in ItemMetadataType]: (value: ItemMetadataTypeMap[K]) => string;
} = {
	string: (value) => value,
	number: (value) => String(value),
	currency: (value) => String(value),
};

export function SerializeItemMetadataField<T extends ItemMetadataType>(
	type: T,
	value: ItemMetadataTypeMap[T],
): string {
	return ItemMetadataSerializers[type](value);
}
