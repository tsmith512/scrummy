/**
 *
 *  ___ __ _ _ _  _ _ __  _ __ _  _
 * (_-</ _| '_| || | '  \| '  \ || |
 * /__/\__|_|  \_,_|_|_|_|_|_|_\_, |
 *                             |__/
 *
 * Worker script for Scrummy's backend. This acts as a proxy and sanitization
 * later between the client and the durable object for the game they joined.
 */

import { Router } from 'itty-router';

/**
 * Environment variables and bindings to DO, R2, KV, etc.
 */
export interface Env {
  GAME: DurableObjectNamespace;
}

/**
 * Payload used to create a new game or a new character
 */
export interface gameInit {
  name: string;
  id?: string;
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

export const safeId = /^[A-Za-z0-9-_]+$/;

const router = Router();

//          _
//  ___ ___| |_ _  _ _ __
// (_-</ -_)  _| || | '_ \
// /__/\___|\__|\_,_| .__/
//                 |_|
export const basic404 = () => new Response('Route not found', { status: 404 });

const basic200 = () =>
  new Response('Scrummy backend is running', {
    status: 200,
    headers: globalheaders,
  });

const basicCors = () =>
  new Response(null, {
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
});

/**
 * Provide the frontend a list of acceptable story point sizes
 */
router.get('/api/settings/sizes', async (request, env: Env, context: any) => {
  return new Response(JSON.stringify(sizes), {
    headers: globalheaders,
  });
});

/**
 * Create or lookup a new game from a nickname, return its id and initial state
 */
router.post('/api/game', async (request, env: Env, context: any) => {
  const payload: gameInit = await request.json();

  if (!payload?.name || !safeId.test(payload.name)) {
    return new Response('Bad game name', { status: 400 });
  }

  context.gameId = env.GAME.idFromName(payload.name);
  context.game = env.GAME.get(context.gameId);

  const res = await context.game.fetch(`${context.prefix}/status`);

  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...globalheaders },
  });
});

/**
 * Look up a game instance and add it to context; based on URL argument
 */
router.all('/api/game/:game/*', async (request, env: Env, context: any) => {
  const gameId = request.params?.game || false;

  if (!gameId || !safeId.test(gameId)) {
    return new Response('Bad game id', { status: 400 });
  }

  try {
    context.gameId = env.GAME.idFromString(gameId);
    context.game = env.GAME.get(context.gameId);
  } catch (e) {
    console.log(JSON.stringify(e));
    return new Response('Cannot look up game ID', { status: 404 });
  }
});

/**
 * Get game status
 */
router.get('/api/game/:game/status', async (request, env: Env, context: any) => {
  const res = await context.game.fetch(`${context.prefix}/status`);

  return new Response(await res.text(), {
    status: res.status,
    headers: globalheaders,
  });
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
 * Join a new player to an existing game
 */
router.post('/api/game/:game/player', async (request, env: Env, context: any) => {
  const payload: gameInit = await request.json();

  if (!payload?.name || !safeId.test(payload.name)) {
    return new Response('Bad player name', { status: 400 });
  }

  const res = await context.game.fetch(`${context.prefix}/players/new`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name: payload.name }),
  });

  return new Response(await res.text(), {
    status: res.status,
    headers: { 'Content-Type': 'application/json', ...globalheaders },
  });
});

/**
 * Validate a player ID in URL arg so we only have to do it once
 */
router.all('/api/game/:game/player/:id*', async (request, env: Env, context: any) => {
  const playerId = request.params?.id || false;

  if (!playerId || !safeId.test(playerId)) {
    return new Response('Bad player id', { status: 400 });
  }

  context.player = {
    id: playerId,
  };
});

/**
 * Pass along requests to set up a websocket for client control. This passes the
 * request as-is straight to the game instance to get the Worker out of the way.
 */
router.all(
  '/api/game/:game/player/:id/socket',
  async (request, env: Env, context: any) => {
    return context.game.fetch(request);
  }
);

router.post(
  '/api/game/:game/player/:id/vote',
  async (request, env: Env, context: any) => {
    const vote = (await request.json()) as number | false;

    // If the vote is FALSE or is a valid size, post the player to the game instance
    if (vote === false || sizes.indexOf(vote) > -1) {
      context.player.vote = vote;

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
  }
);

router.delete('/api/game/:game/player/:id', async (request, env: Env, context: any) => {
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

export { ScrummyGame } from './ScrummyGame';
