import { describe, it, expect } from 'vitest';
import { defaultPhrases } from './phrases';

describe('defaultPhrases', () => {
	it('is a non-empty array of strings', () => {
		expect(Array.isArray(defaultPhrases)).toBe(true);
		expect(defaultPhrases.length).toBeGreaterThan(0);
		defaultPhrases.forEach((phrase) => {
			expect(typeof phrase).toBe('string');
		});
	});

	it('has more than 50 terms', () => {
		expect(defaultPhrases.length).toBeGreaterThan(50);
	});

	it('contains key IT terms', () => {
		expect(defaultPhrases).toContain('Azure');
		expect(defaultPhrases).toContain('Kubernetes');
		expect(defaultPhrases).toContain('DevOps');
		expect(defaultPhrases).toContain('Copilot');
	});

	it('has no empty strings', () => {
		defaultPhrases.forEach((phrase) => {
			expect(phrase.trim().length).toBeGreaterThan(0);
		});
	});
});
