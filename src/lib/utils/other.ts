export function GetStringArrayDiff(old_arr: string[], new_arr: string[]): [string[], string[]] {
	const old_set = new Set(old_arr);
	const new_set = new Set(new_arr);

	const insertions = new_arr.filter((str) => !old_set.has(str));
	const deletions = old_arr.filter((str) => !new_set.has(str));

	return [insertions, deletions];
}

type OptionalKeys<O extends object> = {
	[K in keyof O]-?: {} extends Pick<O, K> ? K : never;
}[keyof O];

type PartialFields<O extends object> = Pick<O, OptionalKeys<O>>;

export function WithObjectDefaults<O extends object>(
	obj: O,
	defaults: PartialFields<O>,
): Required<O> {
	// @ts-expect-error idk
	return {
		...defaults,
		...obj,
	};
}
