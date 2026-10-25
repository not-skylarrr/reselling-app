const AlphabetSegments = {
	"a-z": "abcdefghijklmnopqrstuvwxyz",
	"A-Z": "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
	"0-9": "0123456789",
	_: "_",
	"-": "-",
} as const;

type AlphabetGroup = keyof typeof AlphabetSegments;

export function Alphabet(...groups: AlphabetGroup[]) {
	let alphabet_string = "";

	for (const group of groups) {
		alphabet_string += AlphabetSegments[group];
	}

	return alphabet_string;
}

export function GenerateRandomString(alphabet: string, length: number) {
	let generated_string = "";

	for (let i = 0; i < length; i++) {
		generated_string += alphabet[GenerateRandomIntNumber(alphabet.length)];
	}

	return generated_string;
}

export function GenerateQuickId() {
	return GenerateRandomString(Alphabet("a-z", "A-Z", "0-9"), 24);
}

export function GenerateSku() {
	return GenerateRandomString(Alphabet("A-Z", "0-9"), 10);
}

export function GenerateRandomIntNumber(max: number) {
	return Number(GenerateRandomInt(BigInt(max)));
}

export function GenerateRandomInt(max: bigint) {
	const max_bit_length = (max - 1n).toString(2).length;
	const shift = max_bit_length % 8;
	const bytes = new Uint8Array(Math.ceil(max_bit_length / 8));

	crypto.getRandomValues(bytes);

	if (shift != 0) {
		bytes[0] &= (1 << shift) - 1;
	}

	let result = BigintFromBytes(bytes);

	while (result >= max) {
		crypto.getRandomValues(bytes);

		if (shift != 0) {
			bytes[0] &= (1 << shift) - 1;
		}

		result = BigintFromBytes(bytes);
	}

	return result;
}

function BigintFromBytes(bytes: Uint8Array): bigint {
	if (bytes.byteLength < 1) {
		throw new TypeError("Empty Uint8Array");
	}
	let decoded = 0n;
	for (let i = 0; i < bytes.byteLength; i++) {
		decoded += BigInt(bytes[i]) << BigInt((bytes.byteLength - 1 - i) * 8);
	}
	return decoded;
}

export function GenerateAssociationId(source_id: string, subject_id: string) {
	return `${source_id}:${subject_id}`;
}
