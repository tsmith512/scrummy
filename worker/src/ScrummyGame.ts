import { Env } from ".";

export class ScrummyGame {
	state: DurableObjectState;

	constructor(state: DurableObjectState, env: Env) {
		this.state = state;
	}

	async fetch(request: Request) {
		return new Response(JSON.stringify(request.url));
	}
}
