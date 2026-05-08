import type { SystemModeValue } from "mode-watcher";
import { COLOUR_MAX_LIGHT_L, COLOUR_MIN_DARK_L } from "./const";

const ExportStringRegex =
	/^(rgb\(\d+(?:\.\d+)?,\s?\d+(?:\.\d+)?,\s?\d+(?:\.\d+)?\)):(rgb\(\d+(?:\.\d+)?,\s?\d+(?:\.\d+)?,\s?\d+(?:\.\d+)?\)):(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)_(\d+(?:\.\d+)?)$/;

export type ColourData = {
	light_rgb: string;
	dark_rgb: string;
	raw_lch: [number, number, number];
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

export function ParseColourExportString(export_string: string): ColourData {
	const parsed_regex = ExportStringRegex.exec(export_string);
	if (!parsed_regex) throw new Error("Invalid colour string");

	return {
		light_rgb: parsed_regex[1],
		dark_rgb: parsed_regex[2],
		raw_lch: [Number(parsed_regex[3]), Number(parsed_regex[4]), Number(parsed_regex[5])],
	};
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
