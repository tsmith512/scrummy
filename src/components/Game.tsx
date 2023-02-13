import React from 'react';
import { useEffect, useState } from 'react';

import style from '@/styles/game.module.scss';
import { LoginActions } from './LoginActions';
import { PlayingActions } from './PlayingActions';
import { Players } from './Players';
import { Hand } from './Hand';
import { Readme } from './Readme';

// THESE ARE COPIED FROM THE DURABLE OBJECT:
export interface Player {
  nick: string;
  id: string;
  vote: number | false | null;
}

export interface GameState {
  name: string;
  id: string;
  reveal: boolean;
  players: Player[];
}

export interface gameInit {
  name: string;
  id?: string;
}
// END.

export default function Game() {
  const [me, setMe] = useState(null as Player | null);
  // const [myNick, setMyNick] = useState(null as string | null);
  // const [myId, setMyId] = useState(null as string | null);
  // const [myGame, setMyGame] = useState(null as string | null);
  const [gameState, setGameState] = useState(null as GameState | null);
  const [gameLink, setGameLink] = useState(null as string | null);
  const [joined, setJoined] = useState(false as boolean);
  const [sizes, setSizes] = useState([] as number[]);
  // const [vote, setVote] = useState(null as number | null);

  const getGameState = async (): Promise<void> => {
    if (joined && gameState?.id) {
      await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${gameState.id}/status`)
      .then((res) => res.json())
      .then((payload: GameState) => {
        setGameState(payload);

        // If another player triggered a reset, this game state update affects
        // "me" too.
        if (me) {
          const i = payload.players.findIndex(p => p.id == me.id);
          setMe({...payload.players[i]});
        }
      })
    }
  };

  const getSizes = async (): Promise<void> => {
    await fetch(`https://scrummy.tsmithcreative.workers.dev/api/settings/sizes`)
    .then((res) => res.json())
    .then((payload: number[]) => setSizes(payload));
  }

  const handleReveal = async (): Promise<void> => {
    if (joined && gameState?.id) {
      await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${gameState.id}/reveal`, {
        method: 'POST',
        body: JSON.stringify(!gameState?.reveal),
      });

      getGameState();
    }
  };

  const handleReset = async (): Promise<void> => {
    if (joined && gameState?.id) {
      const res = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${gameState.id}/reset`, {
        method: 'POST',
      });

      if (res.status == 202) {
        setMe({...me as Player, vote: null});
        getGameState();
      }
    }
  };

  const handleVote = async (n: number): Promise<void> => {
    if (joined && gameState?.id && me?.id) {
      const newVote = (me?.vote === n) ? false : n;
      const res = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${gameState.id}/player/${me.id}/vote`,
      {
        method: 'POST',
        body: JSON.stringify(newVote),
      }
      );

      if (res.status == 202) {
        setMe({...me as Player, vote: newVote || null });
        getGameState();
      }
    }
  };

  const handleJoin = async (nick: string, gameName: string): Promise<void> => {
    localStorage.setItem('nickname', nick);

    // Step 1: Identify (either create or look up) the game
    // @TODO: It'd be great to make this a one-step.
    const lookup = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game`,
      {
        method: 'POST',
        body: JSON.stringify({ name: gameName }),
      }
    );

    if (lookup.status === 200) {
      const newGameState = await lookup.json() as GameState;
      setGameLink(`https://${window.location.host}/#${gameName}`);
      setGameState(newGameState);

      // Step 2: Add the current player to the game
      const join = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${newGameState.id}/player`, {
        method: 'POST',
        body: JSON.stringify({ name: nick }),
      });

      if (join.status === 201) {
        const player = await join.json() as Player;
        setJoined(true);
        setMe(player);
      }
    }
  };

  const handleDepart = async (): Promise<void> => {
    if (joined && gameState?.id && me?.id) {
      const res = await fetch(`https://scrummy.tsmithcreative.workers.dev/api/game/${gameState.id}/player/${me.id}`,
        {
          method: 'DELETE',
        }
      );

      if (res.status === 202) {
        setJoined(false);
        setGameState(null);
      }
    }
  };

  useEffect(() => {
    getSizes();

    const interval = setInterval(() => {
      console.log(`joined is ${joined}`);
      if (typeof window !== 'undefined' && document.visibilityState === 'visible') {
        getGameState();
      }
    }, 3000);

    return () => {
      // @TODO: This doesn't appear to work on exit/window close
      handleDepart();
      clearInterval(interval);
    }
  }, []);

  return (
    <div className={style.game}>
      {joined || (
        <>
          <LoginActions handleJoin={handleJoin} />
          <Readme />
        </>
      )}
      {joined && (
        <>
          <PlayingActions
            reveal={gameState?.reveal || false}
            handleReveal={handleReveal}
            handleReset={handleReset}
            gameLink={gameLink || undefined}
          />
          <Players players={gameState?.players || []} reveal={gameState?.reveal || false} />
          <Hand sizes={sizes} nickname={me?.nick} handleVote={handleVote} vote={me.vote} />
        </>
      )}
    </div>
  );
};
