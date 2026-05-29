import type { SystemModeValue } from "mode-watcher";
import { COLOUR_MAX_LIGHT_L, COLOUR_MIN_DARK_L } from "./const";

const OklchStringRegex =
	/oklch\(\s*([+-]?\d*\.?\d+%?)\s+([+-]?\d*\.?\d+)\s+([+-]?\d*\.?\d+)(deg|rad|grad|turn)?(?:\s*\/\s*([+-]?\d*\.?\d+%?))?\s*\)/i;

const ExportStringRegex =
	/^(rgb\(\d+(?:\.\d+)?,\s?\d+(?:\.\d+)?,\s?\d+(?:\.\d+)?\)):(rgb\(\d+(?:\.\d+)?,\s?\d+(?:\.\d+)?,\s?\d+(?:\.\d+)?\)):(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)$/;

export type ColourData = {
	light_rgb: string;
	dark_rgb: string;
	raw_lch: [number, number, number];
};

export type ColourOutputData = ColourData & {
	light_rgb_raw: number[];
	light_contrast_changed: boolean;
	dark_rgb_raw: number[];
	dark_contrast_changed: boolean;
};

export const PLACEHOLDER_COLOUR_DATA: ColourData = {
	light_rgb: "rgb(169, 151, 235)",
	dark_rgb: "rgb(169, 151, 235)",
	raw_lch: [0.7255, 0.12, 293],
};

export const DEFAULT_COLOUR_PALETTE: ColourData[] = [
	{ light_rgb: "rgb(239, 68, 68)", dark_rgb: "rgb(239, 68, 68)", raw_lch: [0.64, 0.21, 26] },
	{ light_rgb: "rgb(249, 115, 22)", dark_rgb: "rgb(249, 115, 22)", raw_lch: [0.72, 0.18, 53] },
	{ light_rgb: "rgb(234, 179, 8)", dark_rgb: "rgb(234, 179, 8)", raw_lch: [0.82, 0.15, 100] },
	{ light_rgb: "rgb(132, 204, 22)", dark_rgb: "rgb(132, 204, 22)", raw_lch: [0.79, 0.2, 128] },
	{ light_rgb: "rgb(34, 197, 94)", dark_rgb: "rgb(34, 197, 94)", raw_lch: [0.74, 0.2, 145] },
	{ light_rgb: "rgb(6, 182, 212)", dark_rgb: "rgb(6, 182, 212)", raw_lch: [0.72, 0.12, 227] },
	{ light_rgb: "rgb(59, 130, 246)", dark_rgb: "rgb(59, 130, 246)", raw_lch: [0.64, 0.2, 264] },
	{ light_rgb: "rgb(168, 85, 247)", dark_rgb: "rgb(168, 85, 247)", raw_lch: [0.62, 0.2, 312] },
	{ light_rgb: "rgb(236, 72, 153)", dark_rgb: "rgb(236, 72, 153)", raw_lch: [0.68, 0.2, 355] },
];

export function CreateColourExportString({ light_rgb, dark_rgb, raw_lch }: ColourData) {
	return `${light_rgb}:${dark_rgb}:${raw_lch[0]}_${raw_lch[1]}_${raw_lch[2]}`;
}

export function CreateColourExportStringFromRawOklch(raw_oklch: string) {
	return CreateColourExportString(CreateColourDataFromRawOklch(raw_oklch));
}

export function CreateColourDataFromRawOklch(raw_oklch: string): ColourOutputData {
	return CreateColourDataFromLch(ParseRawOklchString(raw_oklch));
}

export function CreateColourDataFromLch(raw_lch: [number, number, number]): ColourOutputData {
	const [L, C, h] = raw_lch;

	const DARK_L = COLOUR_MIN_DARK_L > L ? COLOUR_MIN_DARK_L : L;
	const LIGHT_L = COLOUR_MAX_LIGHT_L < L ? COLOUR_MAX_LIGHT_L : L;

	const dark_rgb = OklchToRgb(DARK_L, C, h);
	const light_rgb = OklchToRgb(LIGHT_L, C, h);

	return {
		raw_lch,
		light_rgb_raw: light_rgb,
		light_rgb: CreateRgbString(light_rgb),
		light_contrast_changed: L != LIGHT_L,
		dark_rgb_raw: dark_rgb,
		dark_rgb: CreateRgbString(dark_rgb),
		dark_contrast_changed: L != DARK_L,
	};
}

export function ParseColourExportString(export_string: string): ColourData {
	const parsed_regex = ExportStringRegex.exec(export_string);
	if (!parsed_regex) throw new Error("Invalid colour string");

	return {
		light_rgb: parsed_regex[1],
		dark_rgb: parsed_regex[2],
		raw_lch: [Number(parsed_regex[3]), Number(parsed_regex[4]), Number(parsed_regex[5])],
	};
}

export function ParseRawOklchString(raw_oklch: string): [number, number, number] {
	const parsed_regex = OklchStringRegex.exec(raw_oklch);
	if (!parsed_regex) throw new Error("Invalid OKLCH colour string");

	const lightness = ParseOklchNumber(parsed_regex[1], 1);
	const chroma = Number(parsed_regex[2]);
	const hue = ParseHue(parsed_regex[3], parsed_regex[4]);

	return [lightness, chroma, hue];
}

export function GetAwareColour(
	export_string: string | ColourData,
	mode: SystemModeValue,
	opacity?: number,
): string {
	const colour_data =
		typeof export_string == "string" ? ParseColourExportString(export_string) : export_string;

	const mode_colour = mode == "dark" ? colour_data.dark_rgb : colour_data.light_rgb;

	if (opacity == undefined) return mode_colour;

	const alpha = Math.max(0, Math.min(opacity, 100)) / 100;

	const match = mode_colour.match(/\d+(?:\.\d+)?/g);
	if (!match || match.length != 3) return mode_colour;

	return `rgba(${match[0]}, ${match[1]}, ${match[2]}, ${alpha})`;
}

export function GetAwareTextColour(
	export_string: string | ColourData,
	mode: SystemModeValue,
): "white" | "black" {
	const colour_data =
		typeof export_string == "string" ? ParseColourExportString(export_string) : export_string;

	let lightness = colour_data.raw_lch[0];

	if (mode == "light") {
		lightness = Math.max(lightness, COLOUR_MIN_DARK_L);
	} else {
		lightness = Math.min(lightness, COLOUR_MAX_LIGHT_L);
	}

	if (lightness > 0.7) return "black";

	return "white";
}

export function RGBToHex(R: number, G: number, B: number) {
	function clamp(value: number) {
		return Math.max(0, Math.min(255, Math.round(value)));
	}

	function toHex(value: number) {
		return clamp(value).toString(16).padStart(2, "0");
	}

	return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
}

export function OklchToRgb(L: number, C: number, h: number) {
	const hr = (h * Math.PI) / 180;
	const a = Math.cos(hr) * C;
	const b = Math.sin(hr) * C;

	const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
	const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
	const s_ = L - 0.0894841775 * a - 1.291485548 * b;

	const l = l_ * l_ * l_;
	const m = m_ * m_ * m_;
	const s = s_ * s_ * s_;

	let r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
	let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
	let b2 = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

	function gamma(c: number) {
		return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
	}

	r = gamma(r);
	g = gamma(g);
	b2 = gamma(b2);

	return [
		Number(Math.max(0, Math.min(255, r * 255)).toFixed(2)),
		Number(Math.max(0, Math.min(255, g * 255)).toFixed(2)),
		Number(Math.max(0, Math.min(255, b2 * 255)).toFixed(2)),
	];
}

function CreateRgbString(rgb: number[]) {
	return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function ParseOklchNumber(value: string, percentage_scale: number) {
	if (value.endsWith("%")) return (Number(value.slice(0, -1)) / 100) * percentage_scale;

	return Number(value);
}

function ParseHue(value: string, unit: string | undefined) {
	const hue = Number(value);

	if (unit == "rad") return (hue * 180) / Math.PI;
	if (unit == "grad") return hue * 0.9;
	if (unit == "turn") return hue * 360;

	return hue;
}
