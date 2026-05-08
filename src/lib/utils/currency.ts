import currency from "currency.js";

const GBP_CURRENCY_OPTIONS: currency.Options = {
	symbol: "£",
	separator: ",",
	decimal: ".",
	precision: 2
};

function ToCurrencyAmount(value: string | number | null | undefined) {
	return currency(value ?? 0, GBP_CURRENCY_OPTIONS);
}

export function GetCurrencyString(value: string | number | null | undefined) {
	return ToCurrencyAmount(value).format();
}

export function GetCurrencyValue(value: string | number | null | undefined) {
	return ToCurrencyAmount(value).value;
}

export function AddCurrency(...values: Array<number | null | undefined>) {
	return values.reduce((total, value) => total.add(value ?? 0), ToCurrencyAmount(0)).value;
}

export function SubtractCurrency(
	base: number | null | undefined,
	...values: Array<number | null | undefined>
) {
	return values.reduce((total, value) => total.subtract(value ?? 0), ToCurrencyAmount(base))
		.value;
}
