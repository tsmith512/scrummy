import { Router } from "itty-router";
import { basic404, Env } from ".";

export interface Player {
  nick: string;
  vote: number;
}

export interface GameState {
  name: string;
  id: string;
  reveal: boolean;
  players: Player[];
}

const sampleState: GameState = {
  name: 'Test Game',
  id: 'unknown durable object id',
  reveal: false,
  players: [
    { nick: 'Ted', vote: 5 },
    { nick: 'Linda', vote: 5 },
    { nick: 'Lem', vote: 13 },
    { nick: 'Phil', vote: 8 },
  ],
}

export class ScrummyGame {
  state: DurableObjectState;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
  }

  async fetch(request: Request) {
    const router = Router();

    router.get('/status', async (request, env: Env, ctx) => {
      return new Response(JSON.stringify(sampleState));
    });

    router.all('*', basic404);

    console.log(JSON.stringify(request));

    return await router.handle(request);
  }
}
