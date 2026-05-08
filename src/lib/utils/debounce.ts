type CreateDebounceOptions<T> = {
	debounce_ms: number;
	debounce_fn: (value: T) => void;
};

export function CreateDebounceHandler<T>({
	debounce_fn,
	debounce_ms,
}: CreateDebounceOptions<T>) {
	let debounced_val: T | null = null;
	let timeout: NodeJS.Timeout | null = null;

	function mutate(val: T) {
		console.log(val);

		if (timeout != null) {
			clearTimeout(timeout);
		}

		debounced_val = val;

		timeout = setTimeout(() => debounce_fn(val), debounce_ms);
	}

	return { mutate };
}
