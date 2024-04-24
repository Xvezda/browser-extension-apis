import { split } from 'string-ts';
import { array, special, safeParse } from 'valibot';
import { type ExtensionId, ExtensionIdSchema, validate } from './schemas';
import { handleStore } from './stores';

import { Hono } from 'hono';

const TargetSchema = special<`${ExtensionId}:${string}`>((value) => {
	if (typeof value !== 'string') return false;

	const [_store, id] = split(value, ':');

	return safeParse(ExtensionIdSchema, id).success;
});

const TargetsSchema = array(TargetSchema);

const app = new Hono();

app.get('/:field', async (c) => {
	const targets = validate(TargetsSchema, split(c.req.query('targets')!, ','));

	const field = c.req.param('field');

	const results = await Promise.all(targets.map(async (target) => {
		const [store, id] = split(target, ':');
		return handleStore(store, { id, field });
	}));

	let users = results.reduce((acc, result) => acc + result.users, 0);
	if (c.req.query('number')) {
		try {
			const formatter = new Intl.NumberFormat(
				c.req.query('number')!,
				Object.assign(
					{} as Intl.NumberFormatOptions,
					c.req.query('numberNotation') && { notation: c.req.query('numberNotation') },
				),
			);
			users = formatter.format(users);
		} catch (e) {}
	}

	return c.json({ users });
});

export default app;
