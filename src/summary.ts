import type { Env } from './typings';
import { NotFound, BadRequest } from './errors';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const params = new URL(request.url).searchParams;

		return {};
	},
};
