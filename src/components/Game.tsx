import React from 'react';
import { useEffect, useState } from 'react';

import style from '@/styles/game.module.scss';
import { LoginActions } from './LoginActions';
import { PlayingActions } from './PlayingActions';
import { Players } from './Players';

// THESE ARE COPIED FROM THE DURABLE OBJECT:
export interface Player {
  nick: string;
  vote?: number;
}

export interface GameState {
  name: string;
  id: string;
  reveal: boolean;
  players: Player[];
}
// END.

export default function Game() {
  const [myNick, setMyNick] = useState(null);
  const [game, setGame] = useState(null as GameState | null);

  const getGame = async (): Promise<void> => {
    await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/test`)
    .then((res) => res.json())
    .then((payload: GameState) => setGame(payload));
  }

  const handleReveal = async (): Promise<void> => {
    await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/test/reveal`, {
      method: 'POST',
      body: JSON.stringify(!game?.reveal),
    });

    getGame();
  }

  useEffect(() => {
    getGame();
  }, []);



  return (
    <div className={style.game}>
      { JSON.stringify(game) }

      <LoginActions />
      <PlayingActions handleReveal={handleReveal} />
      <Players players={game?.players || []} reveal={game?.reveal || false} />
    </div>
  );
};
