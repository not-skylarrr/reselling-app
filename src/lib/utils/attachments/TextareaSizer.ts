import type { Attachment } from "svelte/attachments";

export const GrowingTextarea: Attachment<HTMLTextAreaElement> = (node) => {
	function HandleNodeInput(ev: InputEvent) {
		if (!ev.currentTarget) return;

		const el = ev.currentTarget as HTMLTextAreaElement;

		node.style.height = "auto";
		el.style.height = `${el.scrollHeight}px`;
	}

	node.style.height = "auto";
	node.style.height = `${node.scrollHeight}px`;

	node.addEventListener("input", HandleNodeInput);

	return () => {
		node.removeEventListener("input", HandleNodeInput);
	};
};
