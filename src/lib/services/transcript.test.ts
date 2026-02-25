import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('transcript service', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function loadModule() {
		return await import('./transcript');
	}

	it('startSession resets entries', async () => {
		const t = await loadModule();

		vi.setSystemTime(new Date(0));
		t.startSession();
		t.addTranscriptEntry('First');

		vi.setSystemTime(new Date(0));
		t.startSession();
		expect(t.getEntryCount()).toBe(0);
	});

	describe('addTranscriptEntry', () => {
		it('adds trimmed entry', async () => {
			const t = await loadModule();
			t.startSession();
			t.addTranscriptEntry('  Hello  ');

			expect(t.getEntryCount()).toBe(1);
		});

		it('ignores empty text', async () => {
			const t = await loadModule();
			t.startSession();
			t.addTranscriptEntry('');
			t.addTranscriptEntry('   ');

			expect(t.getEntryCount()).toBe(0);
		});
	});

	describe('updateTranscriptEntry', () => {
		it('updates most recent matching entry', async () => {
			const t = await loadModule();
			vi.setSystemTime(new Date(0));
			t.startSession();

			vi.setSystemTime(new Date(1000));
			t.addTranscriptEntry('Hello');

			vi.setSystemTime(new Date(2000));
			t.addTranscriptEntry('Hello');

			t.updateTranscriptEntry('Hello', 'Updated');

			// Export to check — the second "Hello" should be updated
			const text = t.exportAsText();
			const lines = text.split('\n');
			expect(lines[0]).toBe('[00:00:01] Hello');
			expect(lines[1]).toBe('[00:00:02] Updated');
		});

		it('no-ops if no match found', async () => {
			const t = await loadModule();
			t.startSession();
			t.addTranscriptEntry('Original');
			t.updateTranscriptEntry('NoMatch', 'Updated');

			expect(t.getEntryCount()).toBe(1);
			expect(t.exportAsText()).toContain('Original');
		});
	});

	describe('exportAsText', () => {
		it('formats as [HH:MM:SS] text relative to session start', async () => {
			const t = await loadModule();

			vi.setSystemTime(new Date(0));
			t.startSession();

			vi.setSystemTime(new Date(5000));
			t.addTranscriptEntry('Five seconds');

			vi.setSystemTime(new Date(65000));
			t.addTranscriptEntry('One minute five seconds');

			vi.setSystemTime(new Date(3661000));
			t.addTranscriptEntry('One hour one minute one second');

			const text = t.exportAsText();
			const lines = text.split('\n');

			expect(lines[0]).toBe('[00:00:05] Five seconds');
			expect(lines[1]).toBe('[00:01:05] One minute five seconds');
			expect(lines[2]).toBe('[01:01:01] One hour one minute one second');
		});
	});

	describe('exportAsSrt', () => {
		it('generates numbered entries with 3-second durations', async () => {
			const t = await loadModule();

			vi.setSystemTime(new Date(0));
			t.startSession();

			vi.setSystemTime(new Date(1000));
			t.addTranscriptEntry('First line');

			vi.setSystemTime(new Date(5000));
			t.addTranscriptEntry('Second line');

			const srt = t.exportAsSrt();
			const blocks = srt.trim().split('\n\n');

			expect(blocks).toHaveLength(2);

			const block1Lines = blocks[0].split('\n');
			expect(block1Lines[0]).toBe('1');
			expect(block1Lines[1]).toBe('00:00:01,000 --> 00:00:04,000');
			expect(block1Lines[2]).toBe('First line');

			const block2Lines = blocks[1].split('\n');
			expect(block2Lines[0]).toBe('2');
			expect(block2Lines[1]).toBe('00:00:05,000 --> 00:00:08,000');
			expect(block2Lines[2]).toBe('Second line');
		});
	});
});
