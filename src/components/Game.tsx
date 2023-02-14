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
  const [gameState, setGameState] = useState(null as GameState | null);
  const [gameLink, setGameLink] = useState(null as string | null);
  const [socket, setSocket] = useState(null as null | WebSocket);
  const [joined, setJoined] = useState(false as boolean);
  const [sizes, setSizes] = useState([] as number[]);

  const getGameState = async (): Promise<void> => {
    if (joined && gameState?.id) {
      await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/status`)
      .then((res) => res.json())
      .then((payload: GameState) => {
        setGameState(payload);

        // If another player triggered a reset, this game state update affects
        // "me" too. And if I'm not still in the game state, kick me out.
        if (me) {
          const i = payload.players.findIndex(p => p.id == me.id);
          if (i === -1) {
            // I got kicked...
            setJoined(false);
          } else {
            setMe({...payload.players[i]});
          }
        }
      })
    }
  };

  const getSizes = async (): Promise<void> => {
    await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/settings/sizes`)
    .then((res) => res.json())
    .then((payload: number[]) => setSizes(payload));
  }

  const handleReveal = async (): Promise<void> => {
    if (joined && gameState?.id) {
      await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/reveal`, {
        method: 'POST',
        body: JSON.stringify(!gameState?.reveal),
      });

      getGameState();
    }
  };

  const handleReset = async (): Promise<void> => {
    if (joined && gameState?.id) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/reset`, {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/player/${me.id}/vote`,
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
    const lookup = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game`,
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
      const join = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${newGameState.id}/player`, {
        method: 'POST',
        body: JSON.stringify({ name: nick }),
      });

      if (join.status === 201) {
        const player = await join.json() as Player;
        setJoined(true);
        setMe(player);
        getGameState();
      }
    }
  };

  const handleDepart = async (): Promise<void> => {
    if (joined && gameState?.id && me?.id) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/player/${me.id}`,
        {
          method: 'DELETE',
        }
      );

      if (res.status === 202) {
        setJoined(false);
      }
    }
  };

  useEffect(() => {
    let pollingTimer: any;

    if (joined) {
      getSizes();

      pollingTimer = setInterval(() => {
        if (typeof window !== 'undefined' && document.visibilityState === 'visible') {
          getGameState();
        }
      }, 10 * 1000);

      if (gameState?.id) {
        const newSocket = new WebSocket(`ws://localhost:8787/api/game/${gameState.id}/player/${me?.id}/socket`);
        newSocket.addEventListener('message', (event: MessageEvent) => {
          setGameState(JSON.parse(event.data));
        });
        setSocket(newSocket);
      }

    } else {
      setGameState(null);
      setMe(null);

      if (typeof window !== 'undefined' && socket !== null) {
        socket.close();
        setSocket(null);
      }
    }

    return () => {
      clearInterval(pollingTimer);
      if (typeof window !== 'undefined' && socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [joined]);

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
            handleExit={handleDepart}
            gameLink={gameLink || undefined}
          />
          <Players players={gameState?.players || []} reveal={gameState?.reveal || false} />
          <Hand sizes={sizes} nickname={me?.nick} handleVote={handleVote} vote={me?.vote} />
        </>
      )}
    </div>
  );
};
