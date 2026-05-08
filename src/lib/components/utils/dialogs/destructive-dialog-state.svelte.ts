export type OpenDestructiveActionDialogOptions = {
	title: string;
	description: string;
	confirmation?: {
		required_value: string;
		label?: string;
		placeholder?: string;
	};
	action_label?: string;
	cancel_label?: string;
	onConfirm?: () => void | Promise<void>;
	onCancel?: () => void | Promise<void>;
};

type DestructiveActionDialogState = {
	open: boolean;
	title: string;
	description: string;
	action_label: string;
	cancel_label: string;
	confirmation_required_value: string | null;
	confirmation_label: string;
	confirmation_placeholder: string;
	confirmation_input: string;
};

const DEFAULT_CONFIRMATION_LABEL = "Type the confirmation value to continue";
const DEFAULT_CONFIRMATION_PLACEHOLDER = "Enter confirmation value";

export const destructive_action_dialog_state = $state<DestructiveActionDialogState>({
	open: false,
	title: "",
	description: "",
	action_label: "Delete",
	cancel_label: "Cancel",
	confirmation_required_value: null,
	confirmation_label: DEFAULT_CONFIRMATION_LABEL,
	confirmation_placeholder: DEFAULT_CONFIRMATION_PLACEHOLDER,
	confirmation_input: "",
});

let confirm_handler: (() => void | Promise<void>) | null = null;
let cancel_handler: (() => void | Promise<void>) | null = null;

function ResetDialogState() {
	destructive_action_dialog_state.open = false;
	destructive_action_dialog_state.title = "";
	destructive_action_dialog_state.description = "";
	destructive_action_dialog_state.action_label = "Delete";
	destructive_action_dialog_state.cancel_label = "Cancel";
	destructive_action_dialog_state.confirmation_required_value = null;
	destructive_action_dialog_state.confirmation_label = DEFAULT_CONFIRMATION_LABEL;
	destructive_action_dialog_state.confirmation_placeholder = DEFAULT_CONFIRMATION_PLACEHOLDER;
	destructive_action_dialog_state.confirmation_input = "";
	confirm_handler = null;
	cancel_handler = null;
}

async function RunHandler(handler: (() => void | Promise<void>) | null) {
	if (!handler) return;

	try {
		await handler();
	} catch (error) {
		console.error("Destructive dialog callback failed", error);
	}
}

export function OpenDestructiveActionDialog(options: OpenDestructiveActionDialogOptions) {
	void RunHandler(cancel_handler);

	destructive_action_dialog_state.title = options.title;
	destructive_action_dialog_state.description = options.description;
	destructive_action_dialog_state.action_label = options.action_label ?? "Delete";
	destructive_action_dialog_state.cancel_label = options.cancel_label ?? "Cancel";
	destructive_action_dialog_state.confirmation_required_value =
		options.confirmation?.required_value ?? null;
	destructive_action_dialog_state.confirmation_label =
		options.confirmation?.label ?? DEFAULT_CONFIRMATION_LABEL;
	destructive_action_dialog_state.confirmation_placeholder =
		options.confirmation?.placeholder ?? DEFAULT_CONFIRMATION_PLACEHOLDER;
	destructive_action_dialog_state.confirmation_input = "";
	confirm_handler = options.onConfirm ?? null;
	cancel_handler = options.onCancel ?? null;
	destructive_action_dialog_state.open = true;
}

export function ConfirmDestructiveActionDialog() {
	const required_value = destructive_action_dialog_state.confirmation_required_value;
	if (
		required_value != null &&
		destructive_action_dialog_state.confirmation_input != required_value
	) {
		return;
	}

	void RunHandler(confirm_handler);
	ResetDialogState();
}

export function CancelDestructiveActionDialog() {
	void RunHandler(cancel_handler);
	ResetDialogState();
}

export function SetDestructiveActionDialogOpen(open: boolean) {
	if (open) {
		destructive_action_dialog_state.open = true;
		return;
	}

	CancelDestructiveActionDialog();
}
