import type { Env } from './typings';
import { HttpError, NotFound } from './errors';
import stores from './stores';
import summary from './summary';
import { getPathsFromUrl, formatShieldsIo } from './utils';

const handlers = {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const [_version, api] = getPathsFromUrl(request.url);

		switch (api) {
			case 'stores': {
				return await stores.fetch(request, env, ctx);
			}
			case 'summary': {
				return await summary.fetch(request, env, ctx);
			}
			default:
				throw new NotFound();
		}
	},
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const cacheUrl = new URL(request.url);

			const cacheKey = new Request(cacheUrl.toString(), request);
			const cache = caches.default;

			let response = await cache.match(cacheKey);
			if (env.WORKER_ENV === 'development' || !response) {
				console.log(`Response for request url: ${request.url} not present in cache. Fetching and caching request.`);

				const [version] = getPathsFromUrl(request.url);

				if (version !== 'v1') throw new NotFound();

				const result = await handlers.fetch(request, env, ctx);

				const params = new URL(request.url).searchParams;
				if (params.has('format') && params.get('format') === 'shields-io') {
					response = Response.json(formatShieldsIo(result));
				} else {
					response = Response.json(result);
				}
				response.headers.set('Cache-Control', 'public, max-age=300');

				ctx.waitUntil(cache.put(cacheKey, response.clone()));
			} else {
				console.log(`Cache hit for request url: ${request.url}`);
			}
			return response;
		} catch (e) {
			const error = e as Error;

			if (error instanceof HttpError) {
				return Response.json({ message: error.message }, { status: error.status });
			}
			return Response.json({ message: error.message }, { status: 500 });
		}
	},
};
