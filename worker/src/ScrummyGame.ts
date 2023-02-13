import { Router } from "itty-router";
import { basic404, Env, gameInit } from ".";

export interface Player {
  nick: string;
  id: string;
  vote?: number | false;
}

export interface GameState {
  name: string;
  id: string;
  reveal: boolean;
  lastActive: number;
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

  async fetch(request: Request) {
    const router = Router();

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
      this.game.reveal = value;
      this.game.lastActive = Date.now();
      return new Response(null, {status: 204});
    });

    /**
     * Reset game state
     */
    router.post('/reset', async (request, env: Env, ctx) => {
      this.game.players.forEach((p) => p.vote = undefined);
      this.game.reveal = false;
      this.game.lastActive = Date.now();
      return new Response(null, {status: 202});
    });

    /**
     * Add a new player
     */
    router.post('/players/new', async (request, env: Env, ctx) => {
      const newPlayer = await request.json() as gameInit;
      const player: Player = {
        nick: newPlayer.name,
        id: Math.random().toString(16).substring(2),
      }
      this.game.players.push(player);
      this.game.lastActive = Date.now();
      await this.state.storage.put("gameState", this.game);
      return new Response(JSON.stringify(player), {status: 201});
    });

    /**
     * Record a player's vote
     */
    router.post('/players/vote', async (request, env: Env, ctx) => {
      const player = await request.json() as Player;

      const i = this.game.players.findIndex(p => p.id === player.id);

      if (i < 0) {
        return new Response(null, {status: 404});
      }

      if (player.vote) {
        this.game.players[i].vote = player.vote;
      } else {
        this.game.players[i].vote = undefined;
      }

      this.game.lastActive = Date.now();
      return new Response(null, {status: 202});
    });

    /**
     * Remove a player
     */
    router.post('/players/remove', async (request, env: Env, ctx) => {
      const player = await request.json() as Player;

      const i = this.game.players.findIndex(p => p.id === player.id);

      if (i < 0) {
        return new Response(null, {status: 404});
      }

      this.game.players.splice(i, 1);
      this.game.lastActive = Date.now();
      await this.state.storage.put("gameState", this.game);
      return new Response(null, {status: 202});
    });

    router.all('*', basic404);

    return await router.handle(request);
  }
}
