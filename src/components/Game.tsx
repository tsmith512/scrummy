import React from 'react';
import { useEffect, useState } from 'react';

import style from '@/styles/game.module.scss';

// THESE ARE COPIED FROM THE DURABLE OBJECT:
interface Player {
  nick: string;
  vote?: number;
}

interface GameState {
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

  useEffect(() => {
    getGame();
  });

  return (
    <div className={style.game}>
      { JSON.stringify(game) }
    </div>
  );
};
