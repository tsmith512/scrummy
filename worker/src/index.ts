import { Router } from 'itty-router';
import { Player } from './ScrummyGame';

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
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

// @TODO: This should be ... not hardcoded.
export const sizes = [1, 2, 3, 5, 8, 13, 20];

const router = Router();

//          _
//  ___ ___| |_ _  _ _ __
// (_-</ -_)  _| || | '_ \
// /__/\___|\__|\_,_| .__/
//                 |_|
export const basic404 = () => new Response('Route not found', { status: 404 });

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

/**
 * Set up global values based on the request
 */
router.all('*', async (request, env: Env, context: any) => {
  const url = new URL(request.url);
  context.prefix = `${url.protocol}//${url.hostname}`;
})

/**
 * Provide the frontend a list of acceptable story point sizes
 */
router.get('/api/settings/sizes', async (request, env: Env, context: any) => {
  return new Response(JSON.stringify(sizes), {
    headers: globalheaders,
  })
});

/**
 * Identify the game (durable object instance) in question
 */
router.all('/api/game/:game*', async (request, env: Env, context: any) => {
  const name = request.params?.game || false;

  if (!name || name.match(/^[A-Za-z0-9-_]$/g)) {
    return;
  }

  context.id = env.GAME.idFromName(name);
  context.game = env.GAME.get(context.id);
});

/**
 * Given a game, return its status
 */
router.get('/api/game/:game', async (request, env: Env, context: any) => {
  const res = await context.game.fetch(`${context.prefix}/status`);

  return new Response(await res.text(), {
    status: res.status,
    headers: globalheaders,
  })
});


/**
 * Flip the cards, or hide them
 */
router.post('/api/game/:game/reveal', async (request, env: Env, context: any) => {
  const value = await request.json();
  const res = await context.game.fetch(`${context.prefix}/reveal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(!!value),
  });

  return new Response(null, {
    status: res.status,
    headers: globalheaders,
  });
});

/**
 * Reset all the votes
 */
router.post('/api/game/:game/reset', async (request, env: Env, context: any) => {
  const res = await context.game.fetch(`${context.prefix}/reset`, {
    method: 'POST',
  });

  return new Response(null, {
    status: res.status,
    headers: globalheaders,
  });
});

/**
 * Identify and sanitize the nickname in question
 */
router.all('/api/game/:game/player/:nick*', async (request, env: Env, context: any) => {
  const nick = request.params?.nick || false;

  if (!nick || nick.match(/^[A-Za-z0-9-_]$/g)) {
    return;
  }

  const player: Player = {
    nick
  };

  context.player = player;
});

router.put('/api/game/:game/player/:nick', async (request, env: Env, context: any) => {
  const res = await context.game.fetch(`${context.prefix}/players/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(context.player),
  });

  return new Response(null, {
    status: res.status,
    headers: globalheaders,
  });
});

router.patch('/api/game/:game/player/:nick', async (request, env: Env, context: any) => {
  const value = await request.json();
  console.log(value);
  if (value === false || sizes.indexOf(value) > -1) {
    context.player.vote = value;

    const res = await context.game.fetch(`${context.prefix}/players/vote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(context.player),
    });

    return new Response(null, {
      status: res.status,
      headers: globalheaders,
    });
  }

  return new Response('Invalid vote', {
    status: 400,
    headers: globalheaders,
  });
});

router.delete('/api/game/:game/player/:nick', async (request, env: Env, context: any) => {
  const res = await context.game.fetch(`${context.prefix}/players/remove`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(context.player),
  });

  return new Response(null, {
    status: res.status,
    headers: globalheaders,
  });
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
