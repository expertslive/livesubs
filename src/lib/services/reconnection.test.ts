import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { get } from 'svelte/store';

vi.mock('$lib/services/speech', () => ({
	startRecognition: vi.fn().mockResolvedValue(undefined)
}));

describe('reconnection service', () => {
	beforeEach(() => {
		vi.resetModules();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	async function loadModules() {
		const reconnection = await import('./reconnection');
		const { subtitles } = await import('$lib/stores/subtitles');
		return { reconnection, subtitles };
	}

	it('enableAutoReconnect / disableAutoReconnect toggle state', async () => {
		const { reconnection } = await loadModules();

		expect(reconnection.isAutoReconnectEnabled()).toBe(false);
		reconnection.enableAutoReconnect();
		expect(reconnection.isAutoReconnectEnabled()).toBe(true);
		reconnection.disableAutoReconnect();
		expect(reconnection.isAutoReconnectEnabled()).toBe(false);
	});

	it('disableAutoReconnect clears pending timeout', async () => {
		const { reconnection } = await loadModules();

		reconnection.enableAutoReconnect();
		reconnection.attemptReconnect();

		// There should be a pending timeout now
		reconnection.disableAutoReconnect();

		// Advancing timers should not cause any reconnect
		await vi.advanceTimersByTimeAsync(60000);
		expect(reconnection.getAttempt()).toBe(0);
	});

	it('attemptReconnect no-ops when not enabled', async () => {
		const { reconnection, subtitles } = await loadModules();

		reconnection.attemptReconnect();
		const state = get(subtitles);
		expect(state.connectionStatus).toBe('disconnected');
	});

	it('uses exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s cap', async () => {
		const { reconnection } = await loadModules();
		reconnection.enableAutoReconnect();

		const expectedDelays = [1000, 2000, 4000, 8000, 16000, 30000];

		for (let i = 0; i < expectedDelays.length; i++) {
			const attemptBefore = reconnection.getAttempt();
			reconnection.attemptReconnect();
			expect(reconnection.getAttempt()).toBe(attemptBefore + 1);

			// Advance just short of the delay — reconnect should not have fired
			await vi.advanceTimersByTimeAsync(expectedDelays[i] - 1);

			// Advance the remaining 1ms to trigger
			await vi.advanceTimersByTimeAsync(1);
		}
	});

	it('gives up after 10 attempts with error status', async () => {
		const { reconnection, subtitles } = await loadModules();
		reconnection.enableAutoReconnect();

		for (let i = 0; i < 10; i++) {
			reconnection.attemptReconnect();
			await vi.advanceTimersByTimeAsync(30000);
		}

		// 11th attempt should set error and disable
		reconnection.attemptReconnect();
		const state = get(subtitles);
		expect(state.connectionStatus).toBe('error');
		expect(state.errorMessage).toContain('10 attempts');
		expect(reconnection.isAutoReconnectEnabled()).toBe(false);
	});

	it('does not reconnect if disabled during pending timeout', async () => {
		const { reconnection } = await loadModules();
		const speech = await import('$lib/services/speech');
		const startMock = vi.mocked(speech.startRecognition);
		startMock.mockClear();

		reconnection.enableAutoReconnect();
		reconnection.attemptReconnect();

		// Disable during the pending timeout
		reconnection.disableAutoReconnect();

		// Let the timeout fire
		await vi.advanceTimersByTimeAsync(5000);

		// startRecognition should not have been called after disabling
		expect(startMock).not.toHaveBeenCalled();
	});
});
