import { Router } from 'itty-router';

/**
 * Environment variables and bindings to DO, R2, KV, etc.
 */
export interface Env {
	GAME: DurableObjectNamespace;
}

/**
 * These headers are sent back on every response
 */
 export const globalheaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};


const router = Router();

//          _
//  ___ ___| |_ _  _ _ __
// (_-</ -_)  _| || | '_ \
// /__/\___|\__|\_,_| .__/
//                 |_|
const basic404 = () => new Response('Route not found', { status: 404 });
const basic200 = () => new Response('Scrummy backend is running', {
  status: 200,
  headers: globalheaders,
});
const basicCors = () => new Response(null, {
  status: 204,
  headers: globalheaders,
});

router.get('/api', basic200);
router.options('*', basicCors);

router.get('/api/:game', async (request, env: Env, context: any) => {
	const name = request.params?.game || false;

	if (!name || name.match(/^[A-Za-z0-9-_]$/g)) {
		return;
	}

	const id = env.GAME.idFromName(name);
	const game = env.GAME.get(id);
	const url = new URL(request.url);

	return await game.fetch(`${url.protocol}//${url.hostname}/status`);
});

// Fallback: any request not already caught is a 404.
router.all('*', basic404);

//  _      _ _
// (_)_ _ (_) |_
// | | ' \| |  _|
// |_|_||_|_|\__|

export default {
  // Inbound requests pass as-is to the router.
  fetch: router.handle,

	// @TODO: scheduled jobs for garbage collecting?
};

export { ScrummyGame } from "./ScrummyGame";
