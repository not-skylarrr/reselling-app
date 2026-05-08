<script lang="ts">
	import LucideCheck from "@lucide/svelte/icons/check";
	import { mode } from "mode-watcher";
	import {
		CreateColourExportString,
		ParseColourExportString,
		PLACEHOLDER_COLOUR_DATA,
	} from "./lib/utils";
	import { COLOUR_MAX_LIGHT_L, COLOUR_MIN_DARK_L } from "./lib/const";

	type Props = {
		initialColour?: string;
		onColourChange: (export_string: string) => void;
	};

	let {
		initialColour = CreateColourExportString(PLACEHOLDER_COLOUR_DATA),
		onColourChange,
	}: Props = $props();

	let canvas_el = $state<HTMLCanvasElement | null>(null);
	let canvas_ctx = $derived(canvas_el ? canvas_el.getContext("2d") : null);

	let hue_canvas_el = $state<HTMLCanvasElement | null>(null);
	let hue_canvas_ctx = $derived(hue_canvas_el ? hue_canvas_el.getContext("2d") : null);

	let width = 280;
	let height = 140;

	let hue = $state(180);
	let x_pos = $state(width * 0.6);
	let y_pos = $state(height * 0.5);

	let output = $derived(GetOutputColour());

	let mode_colour_output = $derived.by(() => {
		if (mode.current == "light") {
			return {
				rgb: output.light_rgb_string,
				hex: RGBToHex(
					output.light_rgb_raw[0],
					output.light_rgb_raw[1],
					output.light_rgb_raw[2],
				),
				contrast_changed: output.light_contrast_changed,
			};
		}

		return {
			rgb: output.dark_rgb_string,
			hex: RGBToHex(output.dark_rgb_raw[0], output.dark_rgb_raw[1], output.dark_rgb_raw[2]),
			contrast_changed: output.dark_contrast_changed,
		};
	});

	function OklchToRgb(L: number, C: number, h: number) {
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

	function RGBToHex(R: number, G: number, B: number) {
		function clamp(value: number) {
			return Math.max(0, Math.min(255, Math.round(value)));
		}

		function toHex(value: number) {
			return clamp(value).toString(16).padStart(2, "0");
		}

		return `#${toHex(R)}${toHex(G)}${toHex(B)}`;
	}

	function GetPositionsFromLC(lightness: number, chroma: number) {
		let x_norm = chroma / 0.32;
		x_norm = Math.max(0, Math.min(1, x_norm));

		let y_norm = (0.95 - lightness) / (0.9 - 0.4 * x_norm);
		y_norm = Math.max(0, Math.min(1, y_norm));

		return {
			x: x_norm * width,
			y: y_norm * height,
		};
	}

	function GetOutputColour() {
		const xNorm = x_pos / width;
		const yNorm = y_pos / height;

		const L = 0.95 - yNorm * (0.9 - 0.4 * xNorm);
		const C = xNorm * 0.32;

		const DARK_L = COLOUR_MIN_DARK_L > L ? COLOUR_MIN_DARK_L : L;
		const LIGHT_L = COLOUR_MAX_LIGHT_L < L ? COLOUR_MAX_LIGHT_L : L;

		const dark_rgb = OklchToRgb(DARK_L, C, hue);
		const light_rgb = OklchToRgb(LIGHT_L, C, hue);

		const dark_rgb_string = `rgb(${dark_rgb[0]}, ${dark_rgb[1]}, ${dark_rgb[2]})`;
		const light_rgb_string = `rgb(${light_rgb[0]}, ${light_rgb[1]}, ${light_rgb[2]})`;

		return {
			raw_lch: [L, C, hue] as [number, number, number],
			light_rgb_raw: light_rgb,
			light_rgb_string: light_rgb_string,
			light_contrast_changed: L != LIGHT_L,
			dark_rgb_raw: dark_rgb,
			dark_rgb_string: dark_rgb_string,
			dark_contrast_changed: L != DARK_L,
			export: CreateColourExportString({
				raw_lch: [L, C, hue],
				light_rgb: light_rgb_string,
				dark_rgb: dark_rgb_string,
			}),
		};
	}

	function DrawPanel(ctx: CanvasRenderingContext2D) {
		const image = ctx.createImageData(width, height);
		const data = image.data;

		for (let y = 0; y < height; y++) {
			for (let x = 0; x < width; x++) {
				const i = (y * width + x) * 4;

				const y_norm = y / height;
				const x_norm = x / width;

				const L = 0.95 - y_norm * (0.9 - 0.4 * x_norm);
				const C = (x / width) * 0.32;

				const [r, g, b] = OklchToRgb(L, C, hue);

				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
				data[i + 3] = 255;
			}
		}

		ctx.putImageData(image, 0, 0);
	}

	function updateFromPointer(e: PointerEvent) {
		if (!canvas_el) return;

		const rect = canvas_el.getBoundingClientRect();

		x_pos = Math.max(0, Math.min(width, e.clientX - rect.left));
		y_pos = Math.max(0, Math.min(height, e.clientY - rect.top));
	}

	function DrawHueSlider(ctx: CanvasRenderingContext2D) {
		const image = ctx.createImageData(24, height);
		const data = image.data;

		for (let y = 0; y < height; y++) {
			const h = (y / height) * 360;

			const L = 0.75;
			const C = 0.32;

			const [r, g, b] = OklchToRgb(L, C, h);

			for (let x = 0; x < 24; x++) {
				const i = (y * 24 + x) * 4;
				data[i] = r;
				data[i + 1] = g;
				data[i + 2] = b;
				data[i + 3] = 255;
			}
		}

		ctx.putImageData(image, 0, 0);
	}

	function updateHue(e: PointerEvent) {
		if (!hue_canvas_el) return;

		const rect = hue_canvas_el.getBoundingClientRect();
		const y = Math.max(0, Math.min(height, e.clientY - rect.top));
		hue = (y / height) * 360;
	}

	$effect(() => {
		onColourChange(output.export);
	});

	$effect(() => {
		if (!hue_canvas_ctx) return;

		DrawHueSlider(hue_canvas_ctx);
	});

	$effect(() => {
		if (!canvas_ctx) return;

		DrawPanel(canvas_ctx);
	});

	$effect(() => {
		if (!initialColour) return;

		const colour_data = ParseColourExportString(initialColour);

		hue = colour_data.raw_lch[2];

		const positions = GetPositionsFromLC(colour_data.raw_lch[0], colour_data.raw_lch[1]);

		x_pos = positions.x;
		y_pos = positions.y;
	});
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-row items-center justify-between pt-1.5 pl-1.5">
		<div class="flex flex-row items-center gap-2">
			<div
				class="flex h-5 w-5 items-center justify-center rounded-full"
				style="background: {mode_colour_output.rgb};"
			>
				<LucideCheck class="size-3.5 stroke-background" />
			</div>
			<div class="flex flex-row items-center gap-1">
				<p class="text-sm text-muted-foreground/70">HEX</p>
				<p class="text-sm text-muted-foreground">{mode_colour_output.hex}</p>
			</div>
		</div>
	</div>

	<div class="flex flex-row justify-between gap-2 pr-3">
		<div class="relative">
			<canvas
				bind:this={canvas_el}
				{width}
				{height}
				class="cursor-crosshair rounded-xl shadow-md"
				onpointerdown={(e) => {
					updateFromPointer(e);

					window.addEventListener("pointermove", updateFromPointer);

					window.addEventListener(
						"pointerup",
						() => window.removeEventListener("pointermove", updateFromPointer),
						{ once: true },
					);
				}}
			></canvas>

			<div
				class="pointer-events-none absolute h-4 w-4 rounded-full border-2 border-white shadow-md"
				style="left:{x_pos - 8}px; top:{y_pos - 8}px; background: {GetOutputColour()};"
			></div>
		</div>

		<div class="relative h-full w-1.5">
			<canvas
				bind:this={hue_canvas_el}
				width={6}
				{height}
				class="cursor-pointer rounded-md"
				onpointerdown={(e) => {
					e.preventDefault();

					updateHue(e);
					window.addEventListener("pointermove", updateHue);
					window.addEventListener(
						"pointerup",
						() => window.removeEventListener("pointermove", updateHue),
						{
							once: true,
						},
					);
				}}
			></canvas>

			<div
				class="pointer-events-none absolute z-10 h-1.5 w-3 border bg-white"
				style="top:{(hue / 360) * 100}%; left: -50%;"
			></div>
		</div>
	</div>
</div>
