import type { Env, StoreParameters } from './typings';
import { NotFound, BadRequest } from './errors';
import { getPathsFromUrl } from './utils';
import { ExtensionIdSchema, safeParse } from './schemas';

export async function whaleStore({ id, field }: StoreParameters) {
	const response = await fetch(`https://store.whale.naver.com/ajax/extensions/${id}`, {
		headers: {
			Accept: 'application/json, text/plain, */*',
			'X-Requested-With': 'XMLHttpRequest',
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
			Referer: `https://store.whale.naver.com/detail/${id}`,
		},
	});
	const text = await response.text();

	const stripPreamble = (text: string) => {
		return text.replace(/^\)\]\}\'\,/, '');
	};
	const json = JSON.parse(stripPreamble(text));

	const version = json?.manifest?.version_name ?? json?.manifest?.version ?? json?.version;

	if (!version) throw new NotFound();

	switch (field) {
		case 'raw':
			return json;
		case 'version':
			return { version };
		default:
			throw new NotFound();
	}
}

export async function edgeAddons({ id, field }: StoreParameters) {
	const response = await fetch(`https://microsoftedge.microsoft.com/addons/getproductdetailsbycrxid/${id}`, {
		headers: {
			Accept: 'application/json, text/plain, */*',
			Referer: `https://microsoftedge.microsoft.com/addons/detail/${id}`,
			'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
		},
	});
	const text = await response.text();
	const json = JSON.parse(text);

	switch (field) {
		case 'raw':
			return json;
		case 'version':
			return { version: json.version };
		default:
			throw new NotFound();
	}
}

export async function webStore({ id, field }: StoreParameters) {
	let maxRedirects = 5;
	let url = `https://chromewebstore.google.com/detail/${id}`;
	let response;
	do {
		response = await fetch(url, {
			headers: {
				Accept: 'application/json, text/plain, */*',
				Referer: `https://chromewebstore.google.com/`,
				'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.159 Safari/537.36',
			},
			// UTF-8 encoding issue
			redirect: 'manual',
		});
		const location = response.headers.get('location');

		if (--maxRedirects <= 0 || !location) break;

		url = new URL(location).toString();
	} while (response.status >= 300 && response.status < 400);

	const html = await response.text();

	switch (field) {
		case 'version':
			const found = html.match(/<div class="pDlpAd">([^<]+)<\/div>/)?.[1] ?? '';
			if (!found) {
				throw new NotFound();
			}
			const json = { version: found.trim() };

			return { version: json.version };
		case 'users': {
			const found = html.match(/<div class="F9iKBc">.*?(\d+) users.*?<\/div>/)?.[1] ?? '';
			if (!found) {
				throw new NotFound();
			}
			let result = parseInt(found.replace(/,/g, ''));
			if (isNaN(result)) {
				throw new NotFound();
			}
			return { users: result };
		}
		default:
			throw new NotFound();
	}
}

export async function handleStore(target: 'whale-store' | 'edge-addons' | 'web-store' | string, { id, field }: StoreParameters) {
	let result;
	switch (target) {
		case 'whale-store':
			result = await whaleStore({ id, field });
			break;
		case 'edge-addons':
			result = await edgeAddons({ id, field });
			break;
		case 'web-store':
			result = await webStore({ id, field });
			break;
		default:
			throw new NotFound();
	}
	return result;
}

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const [_version, _api, target, ...paths] = getPathsFromUrl(request.url);

		const [rawId, field] = paths;

		const idResult = safeParse(ExtensionIdSchema, rawId);
		if (idResult.success) {
			return await handleStore(target, { id: idResult.output, field });
		}
		throw new BadRequest(idResult.issues[0].message);
	},
};
