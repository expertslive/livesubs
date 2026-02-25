import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import { subtitles } from './subtitles';

describe('subtitles store', () => {
	beforeEach(() => {
		vi.useRealTimers();
		subtitles.reset();
	});

	it('has correct initial state', () => {
		const state = get(subtitles);
		expect(state.lines).toEqual([]);
		expect(state.partialText).toBe('');
		expect(state.connectionStatus).toBe('disconnected');
		expect(state.errorMessage).toBe('');
		expect(state.audioLevel).toBe(0);
		expect(state.lastActivityTimestamp).toBe(0);
		expect(state.sessionStartTime).toBe(0);
	});

	describe('addFinalLine', () => {
		it('adds a trimmed line', () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(1000));

			subtitles.addFinalLine('  Hello world  ');
			const state = get(subtitles);

			expect(state.lines).toHaveLength(1);
			expect(state.lines[0].text).toBe('Hello world');
			expect(state.lines[0].isFinal).toBe(true);
			expect(state.lines[0].id).toBe('line-1');
			expect(state.lines[0].timestamp).toBe(1000);
		});

		it('clears partialText on add', () => {
			subtitles.setPartial('typing...');
			subtitles.addFinalLine('Done');
			expect(get(subtitles).partialText).toBe('');
		});

		it('updates lastActivityTimestamp', () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(5000));

			subtitles.addFinalLine('test');
			expect(get(subtitles).lastActivityTimestamp).toBe(5000);
		});

		it('ignores empty strings', () => {
			subtitles.addFinalLine('');
			subtitles.addFinalLine('   ');
			expect(get(subtitles).lines).toHaveLength(0);
		});

		it('trims buffer to 100 lines', () => {
			for (let i = 0; i < 101; i++) {
				subtitles.addFinalLine(`Line ${i}`);
			}
			const state = get(subtitles);
			expect(state.lines).toHaveLength(100);
			expect(state.lines[0].text).toBe('Line 1');
			expect(state.lines[99].text).toBe('Line 100');
		});

		it('increments line counter across calls', () => {
			subtitles.addFinalLine('First');
			subtitles.addFinalLine('Second');
			const state = get(subtitles);
			expect(state.lines[0].id).toBe('line-1');
			expect(state.lines[1].id).toBe('line-2');
		});
	});

	describe('setPartial', () => {
		it('sets partialText', () => {
			subtitles.setPartial('typing');
			expect(get(subtitles).partialText).toBe('typing');
		});

		it('updates lastActivityTimestamp', () => {
			vi.useFakeTimers();
			vi.setSystemTime(new Date(3000));

			subtitles.setPartial('test');
			expect(get(subtitles).lastActivityTimestamp).toBe(3000);
		});
	});

	describe('setStatus', () => {
		it('sets connectionStatus', () => {
			subtitles.setStatus('connected');
			expect(get(subtitles).connectionStatus).toBe('connected');
		});

		it('sets errorMessage', () => {
			subtitles.setStatus('error', 'Something broke');
			const state = get(subtitles);
			expect(state.connectionStatus).toBe('error');
			expect(state.errorMessage).toBe('Something broke');
		});

		it('defaults errorMessage to empty string', () => {
			subtitles.setStatus('error', 'broken');
			subtitles.setStatus('connected');
			expect(get(subtitles).errorMessage).toBe('');
		});
	});

	describe('updateLine', () => {
		it('updates existing line by id', () => {
			subtitles.addFinalLine('Original');
			const id = get(subtitles).lines[0].id;
			subtitles.updateLine(id, '  Updated  ');
			expect(get(subtitles).lines[0].text).toBe('Updated');
		});

		it('ignores empty text', () => {
			subtitles.addFinalLine('Original');
			const id = get(subtitles).lines[0].id;
			subtitles.updateLine(id, '   ');
			expect(get(subtitles).lines[0].text).toBe('Original');
		});

		it('no-ops for missing id', () => {
			subtitles.addFinalLine('Original');
			subtitles.updateLine('nonexistent', 'New text');
			expect(get(subtitles).lines[0].text).toBe('Original');
		});
	});

	describe('clear', () => {
		it('clears lines and partial but preserves connectionStatus', () => {
			subtitles.addFinalLine('Line 1');
			subtitles.setPartial('partial');
			subtitles.setStatus('connected');

			subtitles.clear();
			const state = get(subtitles);

			expect(state.lines).toEqual([]);
			expect(state.partialText).toBe('');
			expect(state.connectionStatus).toBe('connected');
		});
	});

	describe('reset', () => {
		it('resets everything including lineCounter', () => {
			subtitles.addFinalLine('Line 1');
			subtitles.setStatus('connected');
			subtitles.setPartial('partial');

			subtitles.reset();
			const state = get(subtitles);

			expect(state.lines).toEqual([]);
			expect(state.partialText).toBe('');
			expect(state.connectionStatus).toBe('disconnected');
			expect(state.errorMessage).toBe('');
			expect(state.audioLevel).toBe(0);
			expect(state.lastActivityTimestamp).toBe(0);

			// lineCounter was reset — next line starts at 1
			subtitles.addFinalLine('After reset');
			expect(get(subtitles).lines[0].id).toBe('line-1');
		});
	});

	describe('setBroadcastState', () => {
		it('bulk-sets state preserving audioLevel and sessionStartTime', () => {
			subtitles.setAudioLevel(0.5);
			subtitles.setSessionStart(9999);

			subtitles.setBroadcastState({
				lines: [{ id: 'bc-1', text: 'Broadcast', isFinal: true, timestamp: 100 }],
				partialText: 'partial bc',
				connectionStatus: 'connected',
				errorMessage: '',
				lastActivityTimestamp: 200
			});

			const state = get(subtitles);
			expect(state.lines).toHaveLength(1);
			expect(state.lines[0].text).toBe('Broadcast');
			expect(state.partialText).toBe('partial bc');
			expect(state.connectionStatus).toBe('connected');
			expect(state.audioLevel).toBe(0.5);
			expect(state.sessionStartTime).toBe(9999);
		});
	});

	describe('setAudioLevel', () => {
		it('sets audioLevel', () => {
			subtitles.setAudioLevel(0.75);
			expect(get(subtitles).audioLevel).toBe(0.75);
		});
	});

	describe('setSessionStart', () => {
		it('sets sessionStartTime', () => {
			subtitles.setSessionStart(12345);
			expect(get(subtitles).sessionStartTime).toBe(12345);
		});
	});
});
