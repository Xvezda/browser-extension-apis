/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	// MY_KV_NAMESPACE: KVNamespace;
	//
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

function notFound() {
	return Response.json({ status: 'error', value: 'Not Found' }, { status: 404 });
}

const stripPreamble = (text: string) => {
	return text.replace(/^\)\]\}\'\,/, '');
};

const getPathsFromUrl = (url: string) => {
	return new URL(url).pathname.substring(1).split('/');
};

const formatShieldsIo = (data: { version: string }) => {
	return {
		schemaVersion: 1,
		label: 'version',
		message: `v${data.version}`,
	};
};

const stores = {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const [_version, _api, target, ...paths] = getPathsFromUrl(request.url);

		switch (target) {
			case 'whale-store':
				return whaleStore();
			case 'edge-addons':
				return edgeAddons();
			default:
				return notFound();
		}

		async function whaleStore() {
			const [id, type] = paths;
			const response = await fetch(`https://store.whale.naver.com/ajax/extensions/${id}`, {
				headers: {
					Accept: 'application/json, text/plain, */*',
					'X-Requested-With': 'XMLHttpRequest',
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
				},
			});
			const text = await response.text();
			const json = JSON.parse(stripPreamble(text));

			switch (type) {
				case 'raw':
					return Response.json(json);
				case 'version':
					if (new URL(request.url).searchParams.get('format') === 'shields-io') {
						return Response.json(formatShieldsIo(json));
					}
					return Response.json({ version: json.version });
				default:
					return notFound();
			}
		}

		async function edgeAddons() {
			const [id, type] = paths;
			const response = await fetch(`https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/${id}`, {
				headers: {
					Accept: 'application/json, text/plain, */*',
					Referer: `https://microsoftedge.microsoft.com/addons/detail/${id}`,
					'User-Agent':
						'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
				},
			});
			const text = await response.text();
			const json = JSON.parse(stripPreamble(text));

			switch (type) {
				case 'raw':
					return Response.json(json);
				case 'version':
					if (new URL(request.url).searchParams.get('format') === 'shields-io') {
						return Response.json(formatShieldsIo(json));
					}
					return Response.json({ version: json.version });
				default:
					return notFound();
			}
		}
	},
};

const handlers = {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const [_version, api] = getPathsFromUrl(request.url);

		switch (api) {
			case 'stores':
				return await stores.fetch(request, env, ctx);
			default:
				return notFound();
		}
	},
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		try {
			const [version] = getPathsFromUrl(request.url);

			if (version !== 'v1') return notFound();

			return await handlers.fetch(request, env, ctx);
		} catch (e) {
			const error = e as Error;
			return Response.json({ message: error.message }, { status: 500 });
		}
	},
};
