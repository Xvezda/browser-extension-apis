import { Hono } from 'hono';
import { cache } from 'hono/cache';
import storesRoute from './stores';
import summaryRoute from './summary';
import { HTTPException } from 'hono/http-exception';

const app = new Hono()
	.basePath('/v1');

app.get('*',
	cache({
		cacheName: 'browser-extension-api',
		cacheControl: 'max-age=300',
	})
);

app.use(async (c, next) => {
	await next();

	if (c.req.query('format') !== 'shields-io') return;
	try {
		const json = await c.res.json() as Record<string, any>;
		let formatted;
		if ('version' in json) {
			formatted = {
				schemaVersion: 1,
				label: 'version',
				message: `v${json.version}`,
			};
		}
		if ('users' in json) {
			formatted = {
				schemaVersion: 1,
				label: 'users',
				message: `${json.users}`,
			};
		}
		if (formatted) {
			c.res = new Response(
				JSON.stringify(formatted),
				c.res,
			);
		}
	} catch (e) {
		throw new HTTPException(403);
	}
});

app.route('/stores', storesRoute);
app.route('/summary', summaryRoute);

export default app;
