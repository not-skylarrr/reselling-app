import { CreateColourDataFromRawOklch } from "$lib/components/ui/colour-picker/lib/utils";

export function GetColourFromString(input: string) {
	const h = FastHash(input) % 360;
	const l = 0.7 + ((FastHash(input) % 1000) / 1000) * 0.12;
	const c = 0.11 + ((FastHash(input) % 1000) / 1000) * 0.1;

	const oklch_string = `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;

	return CreateColourDataFromRawOklch(oklch_string);
}

// cyrb53 implementation
function FastHash(input: string, seed: number = 0) {
	let h1 = 0xdeadbeef ^ seed;
	let h2 = 0x41c6ce57 ^ seed;

	for (let i = 0; i < input.length; i++) {
		let ch = input.charCodeAt(i);

		h1 = Math.imul(h1 ^ ch, 2654435761);
		h2 = Math.imul(h2 ^ ch, 1597334677);
	}

	h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h1 >>> 13), 3266489909);
	h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

	return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
