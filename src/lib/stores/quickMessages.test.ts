import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

describe('quickMessages store', () => {
	beforeEach(() => {
		vi.resetModules();
		localStorage.clear();
	});

	async function loadStore() {
		const mod = await import('./quickMessages');
		return mod.quickMessages;
	}

	it('starts with 4 default messages', async () => {
		const qm = await loadStore();
		const msgs = get(qm);

		expect(msgs).toHaveLength(4);
		expect(msgs[0]).toEqual({ id: 'qm-1', text: 'Please wait...' });
		expect(msgs[1]).toEqual({ id: 'qm-2', text: "We'll resume shortly" });
		expect(msgs[2]).toEqual({ id: 'qm-3', text: 'Q&A session' });
		expect(msgs[3]).toEqual({ id: 'qm-4', text: 'Thank you!' });
	});

	describe('add', () => {
		it('appends with auto-incrementing id', async () => {
			const qm = await loadStore();
			qm.add('New message');
			const msgs = get(qm);

			expect(msgs).toHaveLength(5);
			expect(msgs[4].id).toBe('qm-5');
			expect(msgs[4].text).toBe('New message');
		});

		it('ignores empty text', async () => {
			const qm = await loadStore();
			qm.add('');
			qm.add('   ');

			expect(get(qm)).toHaveLength(4);
		});

		it('trims text', async () => {
			const qm = await loadStore();
			qm.add('  Trimmed  ');

			expect(get(qm)[4].text).toBe('Trimmed');
		});
	});

	describe('updateMessage', () => {
		it('updates text by id', async () => {
			const qm = await loadStore();
			qm.updateMessage('qm-1', 'Updated');

			expect(get(qm)[0].text).toBe('Updated');
		});

		it('ignores empty text', async () => {
			const qm = await loadStore();
			qm.updateMessage('qm-1', '   ');

			expect(get(qm)[0].text).toBe('Please wait...');
		});
	});

	describe('remove', () => {
		it('removes by id', async () => {
			const qm = await loadStore();
			qm.remove('qm-2');

			const msgs = get(qm);
			expect(msgs).toHaveLength(3);
			expect(msgs.find((m) => m.id === 'qm-2')).toBeUndefined();
		});
	});

	describe('reset', () => {
		it('restores defaults and resets counter', async () => {
			const qm = await loadStore();
			qm.add('Extra');
			qm.remove('qm-1');
			qm.reset();

			const msgs = get(qm);
			expect(msgs).toHaveLength(4);
			expect(msgs[0].id).toBe('qm-1');

			// Counter is reset — next add produces qm-5
			qm.add('After reset');
			expect(get(qm)[4].id).toBe('qm-5');
		});
	});

	describe('persistence', () => {
		it('persists to localStorage', async () => {
			const qm = await loadStore();
			qm.add('Persisted');

			const stored = JSON.parse(localStorage.getItem('livesubs-quick-messages')!);
			expect(stored).toHaveLength(5);
			expect(stored[4].text).toBe('Persisted');
		});

		it('loads from localStorage', async () => {
			localStorage.setItem(
				'livesubs-quick-messages',
				JSON.stringify([{ id: 'qm-10', text: 'Loaded' }])
			);

			const qm = await loadStore();
			const msgs = get(qm);

			expect(msgs).toHaveLength(1);
			expect(msgs[0].text).toBe('Loaded');
		});

		it('restores counter from stored IDs', async () => {
			localStorage.setItem(
				'livesubs-quick-messages',
				JSON.stringify([{ id: 'qm-10', text: 'High ID' }])
			);

			const qm = await loadStore();
			qm.add('Next');

			expect(get(qm)[1].id).toBe('qm-11');
		});
	});
});
