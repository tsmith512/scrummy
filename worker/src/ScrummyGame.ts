import { Router } from "itty-router";
import { basic404, Env, gameInit } from ".";

export interface Player {
  nick: string;
  id: string;
  vote?: number | false;
  socket?: WebSocket | null;
}

export interface GameState {
  name: string;
  id: string;
  reveal: boolean;
  lastActive?: number;
  players: Player[];
}

export class ScrummyGame {
  state: DurableObjectState;
  game!: GameState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get("gameState") as GameState;
      this.game = stored || {
        name: 'unknown', // @TODO: How would we set this, and does this matter?
        id: this.state.id.toString(),
        reveal: false,
        lastActive: Date.now(),
        players: [],
      };
    });
  }

  /**
   * Prep a game state clone that we can broadcast or save to persistent storage
   *
   * @param props (array of GameState keys) what keys to keep, aside from players
   * @returns GameState object
   */
  cleanState(props: Array<keyof GameState>): GameState {
    const newState = (({ ...props }) => ({ ...props}))(this.game) as GameState;
    newState.players = this.game.players.map(p => ({
      nick: p.nick,
      id: p.id,
      vote: p.vote,
    }));
    console.log(newState);
    return newState;
  }

  reveal(value: boolean) {
    this.game.reveal = value;
    this.game.lastActive = Date.now();
    this.broadcastState();
  }

  reset() {
    this.game.players.forEach((p) => p.vote = undefined);
    this.reveal(false);
    this.game.lastActive = Date.now();
    this.broadcastState();
  }

  async playerAdd(player: Player) {
    this.game.players.push(player);
    this.game.lastActive = Date.now();
    this.broadcastState();
    // await this.state.storage.put("gameState", this.game);
  }

  /**
   * Update a player object in game state; currently used to vote.
   *
   * Could ultimately be used to update a nickname, but why?
   *
   * @param player (Player) A complete player object
   * @returns (boolean) was update successful?
   */
  playerUpdate(player: Player): boolean {
    const i = this.game.players.findIndex(p => p.id === player.id);

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

  async playerRemove(player: Player): Promise<boolean> {
    const i = this.game.players.findIndex(p => p.id === player.id);

    if (i < 0) {
      return false;
    }

    this.game.players.splice(i, 1);
    this.game.lastActive = Date.now();
    // await this.state.storage.put("gameState", this.game);

    this.broadcastState();
    return true;
  }

  async handleSocket(server: WebSocket, playerId: string) {
    const i = this.game.players.findIndex(p => p.id === playerId);

    server.accept();

    // @TODO: Some tricky work for error handling, see
    // https://github.com/cloudflare/workers-chat-demo/blob/master/src/chat.mjs#L67

    this.game.players[i].socket = server;

    server.addEventListener('close', () => { this.playerRemove(this.game.players[i]); })
    server.send(JSON.stringify(this.cleanState(['name', 'id', 'reveal'])));
  }

  broadcastState() {
    this.game.players.forEach((player) => {
      if (player.socket) {
        player.socket.send(JSON.stringify(this.cleanState(['name', 'id', 'reveal'])));
      }
    })
  }

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
      return new Response(JSON.stringify(this.game));
    });

    /**
     * Update reveal status
     */
    router.post('/reveal', async (request, env: Env, ctx) => {
      const value = await request.json() as boolean;
      this.reveal(value);
      return new Response(null, {status: 204});
    });

    /**
     * Reset game state
     */
    router.post('/reset', async (request, env: Env, ctx) => {
      this.reset();
      return new Response(null, {status: 202});
    });

    /**
     * Add a new player
     */
    router.post('/players/new', async (request, env: Env, ctx) => {
      const newPlayer = await request.json() as gameInit;
      const player: Player = {
        nick: newPlayer.name,
        id: Math.random().toString(36).substring(2,6),
      }
      await this.playerAdd(player);
      this.broadcastState();
      return new Response(JSON.stringify(player), {status: 201});
    });

    /**
     * Record a player's vote
     */
    router.post('/players/vote', async (request, env: Env, ctx) => {
      const player = await request.json() as Player;
      const success = this.playerUpdate(player);

      // Test doing an unannounced kick of a user to see if this works
      // client-side. Boot the user who sizes something a 20.
      if (player.vote === 20) {
        await this.playerRemove(player);
      }
      return new Response(null, {
        status: (success) ? 202 : 400
      });
    });

    /**
     * Remove a player
     */
    router.post('/players/remove', async (request, env: Env, ctx) => {
      const player = await request.json() as Player;
      const success = await this.playerRemove(player);
      return new Response(null, {
        status: (success) ? 202 : 400
      });
    });

    router.all('*', basic404);

    return await router.handle(request);
  }
}
