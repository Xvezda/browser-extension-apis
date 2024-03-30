import type { Env } from './typings';
import { split } from 'string-ts';
import { array, string, special, safeParse } from 'valibot';
import { type ExtensionId, ExtensionIdSchema, validate } from './schemas';
import { NotFound, BadRequest } from './errors';
import { getPathsFromUrl } from './utils';
import { handleStore } from './stores';

const TargetSchema = special<`${ExtensionId}:${string}`>((value) => {
	if (typeof value !== 'string') return false;

	const [_store, id] = split(value, ':');

	return safeParse(ExtensionIdSchema, id).success;
});

const TargetsSchema = array(TargetSchema);

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext) {
		const [_version, _api, field] = getPathsFromUrl(request.url);

		if (field !== 'users') throw new NotFound();

		const params = new URL(request.url).searchParams;

		if (!params.has('targets')) throw new BadRequest('Missing targets parameter');

		const targets = validate(TargetsSchema, split(params.get('targets')!, ','));

		const results = await Promise.all(targets.map(async (target) => {
			const [store, id] = split(target, ':');
			return handleStore(store, { id, field });
		}));

		const users = results.reduce((acc, result) => acc + result.users, 0);

		return { users };
	},
};
