export function GetStringArrayDiff(old_arr: string[], new_arr: string[]): [string[], string[]] {
	const old_set = new Set(old_arr);
	const new_set = new Set(new_arr);

	const insertions = new_arr.filter((str) => !old_set.has(str));
	const deletions = old_arr.filter((str) => !new_set.has(str));

	return [insertions, deletions];
}
