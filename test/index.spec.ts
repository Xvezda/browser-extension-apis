// test/index.spec.ts
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/index';

// For now, you'll need to do something like this to get a correctly-typed
// `Request` to pass to `worker.fetch()`.
const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

/** @see: https://developer.chrome.com/docs/extensions/reference/manifest/version */
const isValidManifestVersion = (version: string) => {
	const tokens = version.split('.');

	return (
		// The integers must be between 0 and 65535, inclusive.
		tokens.map(Number).every((n) => 0 <= n && n <= 65535) &&
		// Non-zero integers can't start with 0. For example, 032 is invalid because it begins with a zero.
		!tokens.some((token) => /^0[1-9]/.test(token)) &&
		// They must not be all zero. For example, 0 and 0.0.0.0 are invalid while 0.1.0.0 is valid.
		!tokens.every((token) => token === '0')
	);
};

describe('Whale store API', () => {
	it('responds with extension version', async () => {
		const request = new IncomingRequest('http://example.com/v1/stores/whale-store/mhekkeeijkeeadploidppfdfhafnhoho/version');
		// Create an empty context to pass to `worker.fetch()`.
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		// Wait for all `Promise`s passed to `ctx.waitUntil()` to settle before running test assertions
		await waitOnExecutionContext(ctx);

		// See: https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string
		await expect(response.clone().json()).resolves.toHaveProperty('version');

		const { version } = (await response.clone().json()) as { version: string };

		expect(version).toSatisfy(isValidManifestVersion);
	});
});
