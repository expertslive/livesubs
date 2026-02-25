import { writable } from 'svelte/store';

export interface QuickMessage {
	id: string;
	text: string;
}

const defaultMessages: QuickMessage[] = [
	{ id: 'qm-1', text: 'Please wait...' },
	{ id: 'qm-2', text: "We'll resume shortly" },
	{ id: 'qm-3', text: 'Q&A session' },
	{ id: 'qm-4', text: 'Thank you!' }
];

let counter = 4;

function createQuickMessagesStore() {
	let initial = defaultMessages;

	if (typeof localStorage !== 'undefined') {
		const stored = localStorage.getItem('livesubs-quick-messages');
		if (stored) {
			try {
				const parsed = JSON.parse(stored) as QuickMessage[];
				if (Array.isArray(parsed) && parsed.length > 0) {
					initial = parsed;
					// Restore counter from stored IDs
					for (const m of parsed) {
						const num = parseInt(m.id.replace('qm-', ''), 10);
						if (num > counter) counter = num;
					}
				}
			} catch {
				// ignore corrupt data
			}
		}
	}

	const { subscribe, set, update } = writable<QuickMessage[]>(initial);

	subscribe((value) => {
		if (typeof localStorage !== 'undefined') {
			localStorage.setItem('livesubs-quick-messages', JSON.stringify(value));
		}
	});

	return {
		subscribe,

		add(text: string) {
			if (!text.trim()) return;
			update((msgs) => [...msgs, { id: `qm-${++counter}`, text: text.trim() }]);
		},

		updateMessage(id: string, text: string) {
			if (!text.trim()) return;
			update((msgs) => msgs.map((m) => (m.id === id ? { ...m, text: text.trim() } : m)));
		},

		remove(id: string) {
			update((msgs) => msgs.filter((m) => m.id !== id));
		},

		reset() {
			counter = 4;
			set([...defaultMessages]);
		}
	};
}

export const quickMessages = createQuickMessagesStore();
