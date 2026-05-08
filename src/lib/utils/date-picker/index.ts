import {
	addDays,
	addHours,
	addMilliseconds,
	addMinutes,
	addMonths,
	addSeconds,
	addWeeks,
	addYears,
	endOfMonth,
	format,
	isValid,
	nextFriday,
	nextMonday,
	nextSaturday,
	nextSunday,
	nextThursday,
	nextTuesday,
	nextWednesday,
	parse,
	startOfDay,
	subDays,
	subHours,
	subMinutes,
	subMonths,
	subSeconds,
	subWeeks,
	subYears,
} from "date-fns";
import { computeCommandScore } from "bits-ui";

export type DatePatternMatcher = {
	keyword?: string;
	pattern: RegExp;
	get_results: (matches: (string | undefined)[], input_string: string) => DateMatch[];
};

type DateMatch = {
	date: Date;
	result_string: string;
	date_string?: string;
	score: number;
	id: string;
};

type QuantifierDefiniton<T = Date> = {
	keyword: string;
	get_match: (quantity?: number) => T;
};

function CapitalizeResult(value: string) {
	if (value.length == 0) return value;

	return value
		.split(" ")
		.map((token) => {
			if (token.length == 0) return token;
			const first_char = token.charAt(0);
			if (!/[a-zA-Z]/.test(first_char)) return token;
			return first_char.toUpperCase() + token.slice(1);
		})
		.join(" ");
}

function BuildResultId(pattern: string, date: Date, result_string: string) {
	return `${pattern}-${date.getTime()}-${result_string}`;
}

const IN_MATCH: DatePatternMatcher = {
	keyword: "in",
	pattern: /^in\s*(\d+)\s*([a-zA-Z]*)/,
	get_results: ([quantity_string, quantifier], _input_string) => {
		function GetDefaultResults(number: number = 1) {
			return [
				{
					date: addDays(new Date(), number),
					result_string: `in ${number} day${number > 1 ? "s" : ""}`,
					score: 0,
					id: BuildResultId(
						"in",
						addDays(new Date(), number),
						`in ${number} day${number > 1 ? "s" : ""}`,
					),
				},
				{
					date: addWeeks(new Date(), number),
					result_string: `in ${number} week${number > 1 ? "s" : ""}`,
					score: 0,
					id: BuildResultId(
						"in",
						addWeeks(new Date(), number),
						`in ${number} week${number > 1 ? "s" : ""}`,
					),
				},
				{
					date: addMonths(new Date(), number),
					result_string: `in ${number} month${number > 1 ? "s" : ""}`,
					score: 0,
					id: BuildResultId(
						"in",
						addMonths(new Date(), number),
						`in ${number} month${number > 1 ? "s" : ""}`,
					),
				},
			];
		}

		if (quantity_string == undefined || quantity_string.length == 0) return GetDefaultResults();

		const quantity = parseInt(quantity_string);

		if (quantifier == undefined || quantifier.length == 0) return GetDefaultResults(quantity);

		const matches: DateMatch[] = [];

		const valid_quantifiers: QuantifierDefiniton[] = [
			{ keyword: "second", get_match: (q = 1) => addSeconds(new Date(), q) },
			{ keyword: "minute", get_match: (q = 1) => addMinutes(new Date(), q) },
			{ keyword: "hour", get_match: (q = 1) => addHours(new Date(), q) },
			{ keyword: "day", get_match: (q = 1) => addDays(new Date(), q) },
			{ keyword: "week", get_match: (q = 1) => addWeeks(new Date(), q) },
			{ keyword: "month", get_match: (q = 1) => addMonths(new Date(), q) },
			{ keyword: "year", get_match: (q = 1) => addYears(new Date(), q) },
		];

		for (let option of valid_quantifiers) {
			const match_score = computeCommandScore(option.keyword + "s", quantifier, []);

			if (match_score > 0) {
				const option_date = option.get_match(quantity);
				const result_string = `in ${quantity} ${option.keyword}${quantity > 1 ? "s" : ""}`;

				matches.push({
					date: option_date,
					result_string,
					score: match_score,
					id: BuildResultId("in", option_date, result_string),
				});
			}
		}

		return matches;
	},
};

const AGO_MATCH: DatePatternMatcher = {
	pattern: /^(\d+)\s*([a-zA-Z]*)\s*(.*)?$/,
	get_results: ([quantity_string, quantifier, trailing], _input_string) => {
		function GetDefaultResults(number: number = 1) {
			return [
				{
					date: subDays(new Date(), number),
					result_string: `${number} day${number > 1 ? "s" : ""} ago`,
					score: 0,
					id: BuildResultId(
						"ago",
						subDays(new Date(), number),
						`${number} day${number > 1 ? "s" : ""} ago`,
					),
				},
				{
					date: subWeeks(new Date(), number),
					result_string: `${number} week${number > 1 ? "s" : ""} ago`,
					score: 0,
					id: BuildResultId(
						"ago",
						subWeeks(new Date(), number),
						`${number} week${number > 1 ? "s" : ""} ago`,
					),
				},
				{
					date: subMonths(new Date(), number),
					result_string: `${number} month${number > 1 ? "s" : ""} ago`,
					score: 0,
					id: BuildResultId(
						"ago",
						subMonths(new Date(), number),
						`${number} month${number > 1 ? "s" : ""} ago`,
					),
				},
			];
		}

		if (quantity_string == undefined || quantity_string.length == 0) return GetDefaultResults();

		const quantity = parseInt(quantity_string);
		if (isNaN(quantity)) return [];

		if (quantifier == undefined || quantifier.length == 0) return [];

		if (trailing && trailing.length > 0 && !trailing.startsWith("ago")) return [];

		const matches: DateMatch[] = [];

		const valid_quantifiers: QuantifierDefiniton[] = [
			{ keyword: "second", get_match: (q = 1) => subSeconds(new Date(), q) },
			{ keyword: "minute", get_match: (q = 1) => subMinutes(new Date(), q) },
			{ keyword: "hour", get_match: (q = 1) => subHours(new Date(), q) },
			{ keyword: "day", get_match: (q = 1) => subDays(new Date(), q) },
			{ keyword: "week", get_match: (q = 1) => subWeeks(new Date(), q) },
			{ keyword: "month", get_match: (q = 1) => subMonths(new Date(), q) },
			{ keyword: "year", get_match: (q = 1) => subYears(new Date(), q) },
		];

		for (let option of valid_quantifiers) {
			const match_score = computeCommandScore(option.keyword + "s", quantifier, []);

			if (match_score > 0) {
				const option_date = option.get_match(quantity);
				const result_string = `${quantity} ${option.keyword}${quantity > 1 ? "s" : ""} ago`;

				matches.push({
					date: option_date,
					result_string,
					score: match_score,
					id: BuildResultId("ago", option_date, result_string),
				});
			}
		}

		return matches;
	},
};

const exact_month_quantifiers: QuantifierDefiniton<number>[] = [
	{ keyword: "january", get_match: () => 0 },
	{ keyword: "february", get_match: () => 1 },
	{ keyword: "march", get_match: () => 2 },
	{ keyword: "april", get_match: () => 3 },
	{ keyword: "may", get_match: () => 4 },
	{ keyword: "june", get_match: () => 5 },
	{ keyword: "july", get_match: () => 6 },
	{ keyword: "august", get_match: () => 7 },
	{ keyword: "september", get_match: () => 8 },
	{ keyword: "october", get_match: () => 9 },
	{ keyword: "november", get_match: () => 10 },
	{ keyword: "december", get_match: () => 11 },
];

function GetMonthAutocomplete(
	month: number,
	format_locale: "eu" | "na",
	result_count: number = 5,
) {
	let date = new Date();

	date.setMonth(month);

	const current_day_of_month = date.getDate();
	const last_day_of_month = endOfMonth(date).getDate();

	const possible_result_count =
		last_day_of_month - current_day_of_month < result_count
			? last_day_of_month - current_day_of_month
			: result_count;

	const matches: DateMatch[] = [];

	for (let i = 1; i < possible_result_count + 1; i++) {
		const result_date = addDays(date, i);
		const result_string = format(result_date, format_locale == "eu" ? "do LLLL" : "LLLL do");

		matches.push({
			date: result_date,
			result_string,
			score: 1,
			id: BuildResultId("month-autocomplete", result_date, result_string),
		});
	}

	return matches;
}

function GetDayAutocomplete(
	day: number,
	format_locale: "eu" | "na",
	id: string,
	result_count: number = 5,
) {
	const now = new Date();
	const matches: DateMatch[] = [];

	let month_offset = 0;

	while (matches.length < result_count && month_offset < 24) {
		const candidate = new Date(now.getFullYear(), now.getMonth() + month_offset, day);

		// Skip invalid dates like 31st of February.
		if (candidate.getDate() !== day) {
			month_offset += 1;
			continue;
		}

		const result_string = format(candidate, format_locale == "eu" ? "do LLLL" : "LLLL do");

		matches.push({
			date: candidate,
			result_string,
			score: 1,
			id: BuildResultId(id, candidate, result_string),
		});

		month_offset += 1;
	}

	return matches;
}

const EXACT_DATE_MATCH: DatePatternMatcher = {
	pattern: /^(\d{1,2})\/(\d{1,2})?\/?(\d{4})?/,
	get_results: ([date_string, month_string, year_string]) => {
		if (!date_string || date_string.length == 0) return [];

		// TODO: Make sure 0 does not return 0 results

		if (!month_string || month_string.length == 0) {
			return [];
		}

		const month = parseInt(month_string);
		if (month < 1 || month > 12) return [];

		if (year_string) {
			const date = parse(
				`${date_string}/${month_string}/${year_string}`,
				"dd/MM/yyyy",
				new Date(),
			);
			if (!isValid(date)) return [];

			return [
				{
					date: date,
					date_string: format(date, "do LLLL yyyy"),
					result_string: format(date, "do LLLL yyyy"),
					score: 10,
					id: BuildResultId("exact-match", date, format(date, "do LLLL yyyy")),
				},
			];
		}

		const date = parse(`${date_string}/${month_string}`, "dd/MM", new Date());
		if (!isValid(date)) return [];

		return [
			{
				date: date,
				date_string: format(date, "do LLL"),
				result_string: format(date, "do LLLL"),
				score: 10,
				id: BuildResultId("exact-match", date, format(date, "do LLLL")),
			},
		];
	},
};

const EXACT_DATE_MATCH_EU: DatePatternMatcher = {
	pattern: /^(\d{1,2})(?:st|nd|rd|th)?\s*([a-zA-Z]*)\s*(\d{4})?/,
	get_results: ([date_string, month_string, year_string], input_string): DateMatch[] => {
		if (!date_string || date_string.length == 0) return [];

		const day = parseInt(date_string);
		if (isNaN(day) || day <= 0) return [];

		if (!month_string || month_string.length == 0) {
			if (input_string.length > 4) return [];

			return GetDayAutocomplete(day, "eu", "exact-match-eu");
		}

		const month_results = exact_month_quantifiers.reduce(
			(arr, quant) => {
				const score = computeCommandScore(quant.keyword, month_string, []);
				if (score == 0) return arr;

				if (arr.length == 0) {
					arr.push([quant, score]);

					return arr;
				}

				const insert_index = arr.findIndex(([_, q_score]) => q_score < score);

				if (insert_index == -1) {
					arr.push([quant, score]);
				} else {
					arr.splice(insert_index, 0, [quant, score]);
				}

				return arr;
			},
			[] as [QuantifierDefiniton<number>, number][],
		);

		if (month_results.length == 0) return [];

		const [month_quant, month_score] = month_results[0];
		const month = month_quant.get_match();

		if (!date_string || date_string.length == 0) {
			return GetMonthAutocomplete(month, "eu");
		}

		const now = new Date();
		let year = now.getFullYear();

		if (year_string && year_string.length > 0) {
			const parsed_year = parseInt(year_string);
			if (!isNaN(parsed_year)) {
				year = parsed_year;
			}
		}

		let result_date = new Date(year, month, day);
		if (result_date.getMonth() !== month || result_date.getDate() !== day) return [];

		if (!year_string || year_string.length == 0) {
			const today = startOfDay(now);
			if (startOfDay(result_date) < today) {
				const next_year_date = new Date(year + 1, month, day);
				if (next_year_date.getMonth() !== month || next_year_date.getDate() !== day) return [];
				result_date = next_year_date;
			}
		}

		const format_string = year_string && year_string.length > 0 ? "do LLLL yyyy" : "do LLLL";
		const score = month_score + 0.05 + (year_string && year_string.length > 0 ? 0.05 : 0);
		const result_string = format(result_date, format_string);

		return [
			{
				date: result_date,
				result_string,
				score,
				id: BuildResultId("exact-eu", result_date, result_string),
			},
		];
	},
};

const EXACT_DATE_MATCH_US: DatePatternMatcher = {
	pattern: /^([a-zA-Z]*)\s*(\d{1,2})?\s*[a-zA-Z]*\s*(\d{4})?/,
	get_results: ([month_string, date_string, year_string]): DateMatch[] => {
		if (!month_string || month_string.length == 0) return [];

		const month_results = exact_month_quantifiers.reduce(
			(arr, quant) => {
				const score = computeCommandScore(quant.keyword, month_string, []);
				if (score == 0) return arr;

				if (arr.length == 0) {
					arr.push([quant, score]);

					return arr;
				}

				const insert_index = arr.findIndex(([_, q_score]) => q_score < score);

				if (insert_index == -1) {
					arr.push([quant, score]);
				} else {
					arr.splice(insert_index, 0, [quant, score]);
				}

				return arr;
			},
			[] as [QuantifierDefiniton<number>, number][],
		);

		if (month_results.length == 0) return [];

		const month = month_results[0][0].get_match();

		if (!date_string || date_string.length == 0) {
			return GetMonthAutocomplete(month, "na");
		}

		const day = parseInt(date_string);
		if (isNaN(day) || day <= 0) return [];

		const now = new Date();
		let year = now.getFullYear();

		if (year_string && year_string.length > 0) {
			const parsed_year = parseInt(year_string);
			if (!isNaN(parsed_year)) {
				year = parsed_year;
			}
		}

		let result_date = new Date(year, month, day);
		if (result_date.getMonth() !== month || result_date.getDate() !== day) return [];

		if (!year_string || year_string.length == 0) {
			const today = startOfDay(now);
			if (startOfDay(result_date) < today) {
				const next_year_date = new Date(year + 1, month, day);
				if (next_year_date.getMonth() !== month || next_year_date.getDate() !== day) return [];
				result_date = next_year_date;
			}
		}

		const format_string = year_string && year_string.length > 0 ? "LLLL do yyyy" : "LLLL do";
		const score =
			month_results[0][1] + 0.05 + (year_string && year_string.length > 0 ? 0.05 : 0);
		const result_string = format(result_date, format_string);

		return [
			{
				date: result_date,
				result_string,
				score,
				id: BuildResultId("exact-us", result_date, result_string),
			},
		];
	},
};

const DAY_MATCH: DatePatternMatcher = {
	pattern: /^([a-zA-Z]*)/,
	get_results: ([day_input], _input) => {
		const possible_matches: QuantifierDefiniton[] = [
			{ keyword: "monday", get_match: () => nextMonday(new Date()) },
			{ keyword: "tuesday", get_match: () => nextTuesday(new Date()) },
			{ keyword: "wednesday", get_match: () => nextWednesday(new Date()) },
			{ keyword: "thursday", get_match: () => nextThursday(new Date()) },
			{ keyword: "friday", get_match: () => nextFriday(new Date()) },
			{ keyword: "saturday", get_match: () => nextSaturday(new Date()) },
			{ keyword: "sunday", get_match: () => nextSunday(new Date()) },
			{ keyword: "today", get_match: () => new Date() },
			{ keyword: "tomorrow", get_match: () => addDays(new Date(), 1) },
			{ keyword: "yesterday", get_match: () => subDays(new Date(), 1) },
		];

		const valid_matches: DateMatch[] = [];

		if (!day_input) return [];

		for (const quant of possible_matches) {
			const match_score = computeCommandScore(quant.keyword, day_input, []);

			if (match_score > 0) {
				valid_matches.push({
					date: quant.get_match(),
					result_string: quant.keyword,
					score: match_score,
					id: BuildResultId("day", quant.get_match(), quant.keyword),
				});
			}
		}

		return valid_matches;
	},
};

const NEXT_MATCH: DatePatternMatcher = {
	keyword: "next",
	pattern: /^next\s*([a-zA-Z]*)/,
	get_results: ([quantifier], _input_string) => {
		if (!quantifier)
			return [
				{
					date: addWeeks(new Date(), 1),
					result_string: "next week",
					score: 0,
					id: BuildResultId("next", addWeeks(new Date(), 1), "next week"),
				},
				{
					date: addMonths(new Date(), 2),
					result_string: "next month",
					score: 0,
					id: BuildResultId("next", addMonths(new Date(), 2), "next month"),
				},
				{
					date: addYears(new Date(), 1),
					result_string: "next year",
					score: 0,
					id: BuildResultId("next", addYears(new Date(), 1), "next year"),
				},
			];

		const day_quantifiers: QuantifierDefiniton[] = [
			{ keyword: "monday", get_match: () => nextMonday(new Date()) },
			{ keyword: "tuesday", get_match: () => nextTuesday(new Date()) },
			{ keyword: "wednesday", get_match: () => nextWednesday(new Date()) },
			{ keyword: "thursday", get_match: () => nextThursday(new Date()) },
			{ keyword: "friday", get_match: () => nextFriday(new Date()) },
			{ keyword: "saturday", get_match: () => nextSaturday(new Date()) },
			{ keyword: "sunday", get_match: () => nextSunday(new Date()) },
		];

		const other_quantifiers: QuantifierDefiniton[] = [
			{ keyword: "week", get_match: () => addWeeks(new Date(), 1) },
			{ keyword: "month", get_match: () => addMonths(new Date(), 1) },
			{ keyword: "year", get_match: () => addYears(new Date(), 1) },
		];

		const matches: DateMatch[] = [];

		for (const quant of day_quantifiers) {
			const match_score = computeCommandScore(quant.keyword, quantifier, []);

			if (match_score > 0) {
				const quant_date = quant.get_match();
				const result_string = `next ${quant.keyword}`;

				matches.push({
					date: quant_date,
					result_string,
					score: match_score,
					id: BuildResultId("next", quant_date, result_string),
				});
			}
		}

		for (const quant of other_quantifiers) {
			const match_score = computeCommandScore(quant.keyword, quantifier, []);

			if (match_score > 0) {
				const quant_date = quant.get_match();
				const result_string = `next ${quant.keyword}`;

				matches.push({
					date: quant_date,
					result_string,
					score: match_score,
					id: BuildResultId("next", quant_date, result_string),
				});
			}
		}

		return matches;
	},
};

const LAST_MATCH: DatePatternMatcher = {
	keyword: "last",
	pattern: /^last\s*([a-zA-Z]*)/,
	get_results: ([quantifier], _input_string) => {
		if (!quantifier)
			return [
				{
					date: subWeeks(new Date(), 1),
					result_string: "last week",
					score: 0,
					id: BuildResultId("last", subWeeks(new Date(), 1), "last week"),
				},
				{
					date: subMonths(new Date(), 1),
					result_string: "last month",
					score: 0,
					id: BuildResultId("last", subMonths(new Date(), 1), "last month"),
				},
				{
					date: subYears(new Date(), 1),
					result_string: "last year",
					score: 0,
					id: BuildResultId("last", subYears(new Date(), 1), "last year"),
				},
			];

		const day_quantifiers: QuantifierDefiniton[] = [
			{ keyword: "monday", get_match: () => subWeeks(nextMonday(new Date()), 1) },
			{ keyword: "tuesday", get_match: () => subWeeks(nextTuesday(new Date()), 1) },
			{ keyword: "wednesday", get_match: () => subWeeks(nextWednesday(new Date()), 1) },
			{ keyword: "thursday", get_match: () => subWeeks(nextThursday(new Date()), 1) },
			{ keyword: "friday", get_match: () => subWeeks(nextFriday(new Date()), 1) },
			{ keyword: "saturday", get_match: () => subWeeks(nextSaturday(new Date()), 1) },
			{ keyword: "sunday", get_match: () => subWeeks(nextSunday(new Date()), 1) },
		];

		const other_quantifiers: QuantifierDefiniton[] = [
			{ keyword: "week", get_match: () => subWeeks(new Date(), 1) },
			{ keyword: "month", get_match: () => subMonths(new Date(), 1) },
			{ keyword: "year", get_match: () => subYears(new Date(), 1) },
		];

		const matches: DateMatch[] = [];

		for (const quant of day_quantifiers) {
			const match_score = computeCommandScore(quant.keyword, quantifier, []);

			if (match_score > 0) {
				const quant_date = quant.get_match();
				const result_string = `last ${quant.keyword}`;

				matches.push({
					date: quant_date,
					result_string,
					score: match_score,
					id: BuildResultId("last", quant_date, result_string),
				});
			}
		}

		for (const quant of other_quantifiers) {
			const match_score = computeCommandScore(quant.keyword, quantifier, []);

			if (match_score > 0) {
				const quant_date = quant.get_match();
				const result_string = `last ${quant.keyword}`;

				matches.push({
					date: quant_date,
					result_string,
					score: match_score,
					id: BuildResultId("last", quant_date, result_string),
				});
			}
		}

		return matches;
	},
};

const DatePatterns: DatePatternMatcher[] = [
	IN_MATCH,
	AGO_MATCH,
	NEXT_MATCH,
	LAST_MATCH,
	DAY_MATCH,
	EXACT_DATE_MATCH_EU,
	EXACT_DATE_MATCH_US,
	EXACT_DATE_MATCH,
];

type TimePatternMatcher = {
	relative: boolean;
	pattern: RegExp;
	get_offset: (matches: (string | undefined)[], input: string) => number;
};

const in_time_quantifier_map = new Map<string, number>([
	["ms", 1],
	["s", 1000],
	["sec", 1000],
	["secs", 1000],
	["second", 1000],
	["seconds", 1000],
	["m", 60 * 1000],
	["mins", 60 * 1000],
	["minute", 60 * 1000],
	["minutes", 60 * 1000],
	["h", 60 * 60 * 1000],
	["hour", 60 * 60 * 1000],
	["hours", 60 * 60 * 1000],
]);

const IN_TIME_MATCH: TimePatternMatcher = {
	relative: true,
	pattern: /in\s*(\d*)\s*([a-zA-Z]*)/,
	get_offset: ([quantity_string, quantifier_string]) => {
		if (!quantity_string || !quantifier_string) return 0;

		const quantity = parseInt(quantity_string);
		if (isNaN(quantity)) return 0;

		if (in_time_quantifier_map.has(quantifier_string)) {
			const quant_value = in_time_quantifier_map.get(quantifier_string);
			if (quant_value == undefined) return 0;

			return quant_value * quantity;
		}

		return 0;
	},
};

const AT_EXACT_TIME_MATCH: TimePatternMatcher = {
	relative: false,
	pattern: /at\s*(\d{1,2})(?::(\d{2}))?\s*([a-zA-Z]{2})?/,
	get_offset: ([hour_string, minute_string, am_pm]) => {
		if (!hour_string) return 0;

		let total_offset = 0;

		const hour = parseInt(hour_string);

		if (am_pm?.toLowerCase() == "pm" && hour <= 12) {
			total_offset += (hour + 12) * 60 * 60 * 1000;
		} else {
			total_offset += hour * 60 * 60 * 1000;
		}

		if (minute_string) {
			const minutes = parseInt(minute_string);

			total_offset += minutes * 60 * 1000;
		}

		return total_offset;
	},
};

const TIME_PATTERNS: TimePatternMatcher[] = [AT_EXACT_TIME_MATCH, IN_TIME_MATCH];

function ApplyTimeOffset(input: string, matches: DateMatch[]): DateMatch[] {
	let time_offset_ms = 0;
	let is_relative = false;

	for (const time_format of TIME_PATTERNS) {
		const regex_matches = time_format.pattern.exec(input);

		if (regex_matches) {
			const pattern_offset = time_format.get_offset(regex_matches.slice(1), input);

			if (pattern_offset > 0) {
				time_offset_ms = pattern_offset;
				is_relative = time_format.relative;
				break;
			}
		}
	}

	if (time_offset_ms <= 0) return matches;

	return matches.map((match) => {
		const base_time = is_relative ? match.date : startOfDay(match.date);
		const new_match_date = addMilliseconds(base_time, time_offset_ms);

		return {
			date: new_match_date,
			date_string: format(new_match_date, "PP 'at' HH:mm"),
			result_string: match.result_string,
			score: match.score,
			id: match.id,
		};
	});
}

export function GetNaturalDateResults(input: string): DateMatch[] {
	let matches: DateMatch[] = [];

	if (input.trim().length == 0)
		return [
			{
				date: new Date(),
				result_string: "Today",
				score: 0,
				id: BuildResultId("default", new Date(), "Today"),
			},
			{
				date: addDays(new Date(), 1),
				result_string: "Tomorrow",
				score: 0,
				id: BuildResultId("default", addDays(new Date(), 1), "Tomorrow"),
			},
			{
				date: addWeeks(new Date(), 1),
				result_string: "Next Week",
				score: 0,
				id: BuildResultId("default", addWeeks(new Date(), 1), "Next Week"),
			},
			{
				date: addMonths(new Date(), 1),
				result_string: "Next Month",
				score: 0,
				id: BuildResultId("default", addMonths(new Date(), 1), "Next Month"),
			},
		];

	for (const date_format of DatePatterns) {
		const regex_matches = date_format.pattern.exec(input.toLowerCase());

		if (!regex_matches) {
			// If input starts with the start of the keyword return default values
			if (!date_format.keyword || input.length <= 0) continue;

			const keyword_with_space = `${date_format.keyword} `;
			if (!keyword_with_space.startsWith(input.toLowerCase())) continue;

			matches.push(...date_format.get_results([], input));

			continue;
		}

		const group_matches = regex_matches.slice(1);

		matches.push(...date_format.get_results(group_matches, input));
	}

	matches = ApplyTimeOffset(input, matches);

	const seen = new Set<number>();

	return matches
		.map((match) => ({
			...match,
			result_string: CapitalizeResult(match.result_string),
			id: match.id ?? BuildResultId("unknown", match.date, match.result_string),
		}))
		.sort((a, b) => b.score - a.score)
		.filter((match) => {
			const minute_key = Math.floor(match.date.getTime() / 60_000);
			if (seen.has(minute_key)) return false;
			seen.add(minute_key);
			return true;
		});
}
