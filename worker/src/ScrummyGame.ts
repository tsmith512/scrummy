/**
 *
 *  ___ __ _ _ _  _ _ __  _ __ _  _
 * (_-</ _| '_| || | '  \| '  \ || |
 * /__/\__|_|  \_,_|_|_|_|_|_|_\_, |
 *                             |__/
 *
 * Durable Object representing a single game instance of Scrummy.
 */

import { Router } from 'itty-router';
import { basic404 } from '.';
import { Env, gameInit, GameState, Player, ScrummyUpdate } from './types';

export class ScrummyGame {
  state: DurableObjectState;
  game!: GameState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      // We do not save games to persistent storage, so the constructor can
      // start from scratch and move on.
      this.game = {
        id: this.state.id.toString(),
        reveal: false,
        lastActive: Date.now(),
        players: [],
      };
    });
  }

  /**
   * Prep a game state clone that can be broadcast to clients (ignoring things
   * they don't care about and websockets objects)
   *
   * @returns GameState object
   */
  cleanState(): GameState {
    const newState: GameState = {
      id: this.game.id,
      reveal: this.game.reveal,
      players: this.game.players.map((p) => ({
        nick: p.nick,
        id: p.id,
        vote: p.vote,
      })),
    };
    return newState;
  }

  reveal(value: boolean) {
    this.game.reveal = value;
    this.game.lastActive = Date.now();
    this.broadcastState();
  }

  reset() {
    this.game.players.forEach((p) => (p.vote = undefined));
    this.reveal(false);
    this.game.lastActive = Date.now();
    this.broadcastState();
  }

  async playerAdd(player: Player) {
    this.game.players.push(player);
    this.game.lastActive = Date.now();
    this.broadcastState();
  }

  /**
   * Update a player object in game state; currently used to vote.
   *
   * @TODO: Could ultimately be used to update a nickname, but why?
   *
   * @param player (Player) A complete player object
   * @returns (boolean) was update successful?
   */
  playerUpdate(player: Player): boolean {
    const i = this.game.players.findIndex((p) => p.id === player.id);

    if (i < 0) {
      return false;
    }

    this.game.lastActive = Date.now();

    if (player.vote) {
      this.game.players[i].vote = player.vote;
    } else {
      this.game.players[i].vote = undefined;
    }

    this.broadcastState();
    return true;
  }

  /**
   * Remove a player from the game state. Matches on ID.
   *
   * @param player (Player) A complete player object.
   * @returns (boolean) true on success; false if player not found
   */
  async playerRemove(player: Player): Promise<boolean> {
    const i = this.game.players.findIndex((p) => p.id === player.id);

    if (i < 0) {
      return false;
    }

    this.game.players.splice(i, 1);
    this.game.lastActive = Date.now();

    this.broadcastState();
    return true;
  }

  /**
   * Handle the creation of the server-side of the websocket to facilitate state
   * updates and keepalive pings.
   *
   * @param server (WebSocket Pair) the server-side
   * @param playerId (string) the Player ID to attach this socket to
   */
  async handleSocket(server: WebSocket, playerId: string) {
    const i = this.game.players.findIndex((p) => p.id === playerId);

    if (i === -1) {
      console.log('Player ID not found when assigning websocket');
      return;
    }

    server.accept();

    // @TODO: Some tricky work for error handling, see
    // https://github.com/cloudflare/workers-chat-demo/blob/master/src/chat.mjs#L67

    this.game.players[i].socket = server;

    server.addEventListener('close', () => {
      // @TODO: If the socket closes, remove the object from the player, but
      // leave the player in the game. This allows websockets to reconnect
      // instead of kicking a player out.
      delete this.game.players[i].socket;
    });

    server.addEventListener('message', (event: MessageEvent) => {
      const msg = JSON.parse(event.data.toString()) as ScrummyUpdate;
      if (msg?.type == 'ping') {
        const response: ScrummyUpdate = { type: 'pong' };
        server.send(JSON.stringify(response));
      }
    });

    const hello: ScrummyUpdate = {
      type: 'state',
      game: this.cleanState(),
    };
    server.send(JSON.stringify(hello));
  }

  /**
   * Send the latest game state to all players. Called after any client event.
   */
  broadcastState() {
    const message: ScrummyUpdate = {
      type: 'state',
      game: this.cleanState(),
    };
    this.game.players.forEach((player) => {
      if (player.socket) {
        player.socket.send(JSON.stringify(message));
      }
    });
  }

  /**
   * Init
   *
   * @param request (Request) Inbound request object to route.
   * @returns (Promise<Request>)
   */
  async fetch(request: Request) {
    const router = Router();

    /**
     * Set up a websocket for state change events.
     *
     * NOTE: This is the only request passed directly from the Worker to the Object
     * with its original API path intact (so the Worker can bow out of the exchange).
     */
    router.all('/api/game/:game/player/:id/socket', async (request, env: Env, ctx) => {
      console.log('fired');
      if (request.headers.get('Upgrade') !== 'websocket') {
        return new Response('expected websocket', { status: 400 });
      }

      const [client, server] = Object.values(new WebSocketPair());

      await this.handleSocket(server, request.params.id);
      return new Response(null, { status: 101, webSocket: client });
    });

    /**
     * Return the entire game state object
     */
    router.get('/status', async (request, env: Env, ctx) => {
      return new Response(JSON.stringify(this.cleanState()));
    });

    /**
     * Update reveal status
     */
    router.post('/reveal', async (request, env: Env, ctx) => {
      const value = (await request.json()) as boolean;
      this.reveal(value);
      return new Response(null, { status: 204 });
    });

    /**
     * Reset game state
     */
    router.post('/reset', async (request, env: Env, ctx) => {
      this.reset();
      return new Response(null, { status: 202 });
    });

    /**
     * Add a new player
     */
    router.post('/players/new', async (request, env: Env, ctx) => {
      const newPlayer = (await request.json()) as gameInit;
      const player: Player = {
        nick: newPlayer.name,
        id: Math.random().toString(36).substring(2, 6),
      };
      await this.playerAdd(player);
      this.broadcastState();
      return new Response(JSON.stringify(player), { status: 201 });
    });

    /**
     * Record a player's vote
     */
    router.post('/players/vote', async (request, env: Env, ctx) => {
      const player = (await request.json()) as Player;
      const success = this.playerUpdate(player);

      return new Response(null, {
        status: success ? 202 : 400,
      });
    });

    /**
     * Remove a player
     */
    router.post('/players/remove', async (request, env: Env, ctx) => {
      const player = (await request.json()) as Player;
      const success = await this.playerRemove(player);
      return new Response(null, {
        status: success ? 202 : 400,
      });
    });

    router.all('*', basic404);

    return await router.handle(request);
  }
}
