import { format, isSameMonth, isSameYear } from "date-fns";
import { GetCurrencyString } from "./currency";

export function FormatCurrency(val: number) {
	return GetCurrencyString(val);
}

export function FormatDateStd(date: Date, full_month: boolean = false) {
	if (isSameYear(date, new Date())) {
		return format(date, `do ${full_month ? "MMMM" : "MMM"}`);
	}

	return format(date, `do ${full_month ? "MMMM" : "MMM"} yyyy`);
}

export function FormatDateRange(start: Date, end: Date, full_month: boolean = false) {
	if (isSameMonth(start, end))
		return `${format(start, "do")} - ${format(end, `do ${full_month ? "MMMM" : "MMM"}`)}`;
}

export function Plural(count: number, singular: string, plural: string) {
	if (count == 1) return singular;

	return plural;
}
