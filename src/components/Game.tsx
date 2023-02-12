import React from 'react';
import { useEffect, useState } from 'react';

import style from '@/styles/game.module.scss';
import { LoginActions } from './LoginActions';
import { PlayingActions } from './PlayingActions';
import { Players } from './Players';
import { Hand } from './Hand';

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
  const [myNick, setMyNick] = useState(null as string | null);
  const [myGame, setMyGame] = useState(null as string | null);
  const [joined, setJoined] = useState(false as boolean);
  const [gameState, setGameState] = useState(null as GameState | null);
  const [sizes, setSizes] = useState([] as number[]);
  const [vote, setVote] = useState(null as number | null);

  const getGameState = async (): Promise<void> => {
    await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${myGame}`)
    .then((res) => res.json())
    .then((payload: GameState) => setGameState(payload));
  };

  const getSizes = async (): Promise<void> => {
    await fetch(`https://scrummy.tsmithcreative.workers.dev/api/settings/sizes`)
    .then((res) => res.json())
    .then((payload: number[]) => setSizes(payload));
  }

  const handleReveal = async (): Promise<void> => {
    await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${myGame}/reveal`, {
      method: 'POST',
      body: JSON.stringify(!gameState?.reveal),
    });

    getGameState();
  };

  const handleReset = async (): Promise<void> => {
    const res = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${myGame}/reset`, {
      method: 'POST',
    });

    if (res.status == 202) {
      setVote(null);
      getGameState();
    }
  };

  const handleVote = async (n: number): Promise<void> => {
    console.log(n)
    console.log(sizes, sizes.indexOf(n));
    if (sizes.indexOf(n) > -1 && myGame) {
      const res = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${myGame}/player/${myNick}`,
      {
        method: 'PATCH',
        body: JSON.stringify(n),
      }
      );

      if (res.status == 202) {
        setVote(n);
        getGameState();
      }
    }
  };

  const handleJoin = async (nick: string, gameName: string): Promise<void> => {
    const res = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${gameName}/player/${nick}`,
      {
        method: 'PUT',
      }
    );

    if (res.status === 201) {
      setJoined(true);
      setMyGame(gameName);
      setMyNick(nick);
    }
  };

  const handleDepart = async (nick: string, game: string): Promise<void> => {
    const res = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${myGame}/player/${nick}`,
      {
        method: 'DELETE',
      }
    );

    if (res.status === 202) {
      setJoined(false);
      setGameState(null);
    }
  };

  useEffect(() => {
    getSizes();
  }, [myGame, myNick]);

  return (
    <div className={style.game}>
      {joined || (
        <LoginActions
          handleJoin={handleJoin}
        />
      )}
      {joined && (
        <>
          <PlayingActions reveal={gameState?.reveal || false} handleReveal={handleReveal} handleReset={handleReset} />
          <Players players={gameState?.players || []} reveal={gameState?.reveal || false} />
          <Hand sizes={sizes} nickname={myNick} handleVote={handleVote} vote={vote} />
        </>
      )}
    </div>
  );
};
