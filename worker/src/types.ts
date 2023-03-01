/**
 * Environment variables and bindings to DO, R2, KV, etc.
 */
export interface Env {
  GAME: DurableObjectNamespace;
}

/**
 * Payload used to create a new game or a new player
 */
export interface gameInit {
  name: string;
  id?: string;
}

/**
 * Representation of a player
 */
 export interface Player {
  nick: string;
  id: string;
  vote?: number | false;
  socket?: WebSocket | null;
}

/**
 * Representation of game state
 */
export interface GameState {
  id: string;
  reveal: boolean;
  lastActive?: number;
  players: Player[];
}

/**
 * All WebSocket messages in either direction will use this interface.
 */
export interface ScrummyUpdate {
  type: string;
  game?: GameState;
}
