import React, { useRef } from 'react';
import { useEffect, useState } from 'react';

import style from '@/styles/game.module.scss';
import { LoginActions } from './LoginActions';
import { PlayingActions } from './PlayingActions';
import { Players } from './Players';
import { Hand } from './Hand';
import { Readme } from './Readme';

// Grab some types from the Worker codebase which we use for shaping API calls
// and WebSocket messages.
import { Player, GameState, ScrummyUpdate, gameInit } from '../../worker/src/types';

export default function Game() {
  const [me, setMe] = useState(null as Player | null);
  const [gameState, setGameState] = useState(null as GameState | null);
  const [gameLink, setGameLink] = useState(null as string | null);
  const [joined, setJoined] = useState(false as boolean);
  const [tryReconnect, setTryReconnect] = useState(0);
  const [sizes, setSizes] = useState([] as number[]);

  const socket = useRef(null as null | WebSocket);
  const interval = useRef(null as null | number);

  /**
   * Manual fetch to grab the latest game state from the durable object
   */
  const getGameState = async (): Promise<void> => {
    if (joined && gameState?.id) {
      await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/status`)
      .then((res) => res.json() as Promise<GameState>)
      .then((payload: GameState) => {
        setGameState(payload);

        // If another player triggered a reset, this game state update affects
        // "me" too. And if I'm not still in the game state, kick me out.
        // @TODO: That happened a lot with dropped connections... which I'm fixing...
        if (me) {
          const i = payload.players.findIndex(p => p.id == me.id);
          if (i === -1) {
            // I got kicked...
            setJoined(false);
          } else {
            setMe({...payload.players[i]});
          }
        }
      });
    }
  };

  /**
   * Get an array of what story point cards we support
   */
  const getSizes = async (): Promise<void> => {
    await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/settings/sizes`)
    .then((res) => res.json() as Promise<number[]>)
    .then((payload: number[]) => setSizes(payload));
  }

  /**
   * Tell the game to reveal everyone's cards
   */
  const handleReveal = async (): Promise<void> => {
    if (joined && gameState?.id) {
      await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/reveal`, {
        method: 'POST',
        body: JSON.stringify(!gameState?.reveal),
      });

      getGameState();
    }
  };

  /**
   * Tell the game to wipe everyone's hand and flip the cards
   */
  const handleReset = async (): Promise<void> => {
    if (joined && gameState?.id) {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/reset`, {
        method: 'POST',
      });

      if (res.status == 202) {
        setMe({...me as Player, vote: undefined});
        getGameState();
      }
    }
  };

  /**
   * Submit a vote
   *
   * @param n (number) story points vote
   */
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
        setMe({...me as Player, vote: newVote || undefined });
        getGameState();
      }
    }
  };

  /**
   * Join a game. Update state and UI on success; set up websocket, too.
   *
   * @TODO: Uhh, if this errors it kinda doesn't do anything.
   *
   * @param nick (string) player displayed nickname
   * @param gameName (string) game name (not Durable Object ID)
   */
  const handleJoin = async (nick: string, gameName: string): Promise<void> => {
    localStorage.setItem('nickname', nick);

    // Step 1: Identify (either create or look up) the game. We need to get the
    // Durable Object ID from the game's nickname.
    // @TODO: It'd be great to make this a one-step.
    const lookup = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game`,
      {
        method: 'POST',
        body: JSON.stringify({ name: gameName }),
      }
    );

    if (lookup.status === 200) {
      const newGameState = await lookup.json() as GameState;
      setGameLink(`${process.env.NEXT_PUBLIC_GAME_HOST}/#${gameName}`);
      setGameState(newGameState);

      // Step 2: Add the current player to the game
      const join = await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${newGameState.id}/player`, {
        method: 'POST',
        body: JSON.stringify({ name: nick }),
      });

      if (join.status === 201) {
        const player = await join.json() as Player;
        await getGameState();
        setMe(player);
        setJoined(true);
      }
    }
  };

  /**
   * Tell the game that this user is leaving.
   * (When other users leave, that's just a state update.)
   */
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

  const handlePing = async (): Promise<void> => {
    if (socket.current && socket.current.readyState === WebSocket.OPEN) {
      const message: ScrummyUpdate = {
        type: 'ping'
      }
      socket.current.send(JSON.stringify(message));
    } else {
      getGameState();
    }
  }

  /**
   * When the component loads, figure out what story point sizes we accept.
   */
  useEffect(() => {
    getSizes();
  }, []);

  /**
   * When `joined` changes or we attempt a reconnect:
   * - If true, set up the websocket, ping/poll timer -- with cleanup
   * - If false, clear all state and swap back to the readme/login UI
   */
  useEffect(() => {
    if (joined) {
      // If we have a left-over socket, close it.
      if (socket.current) {
        socket.current.close(1000);
      }

      // If we have a leftover ping interval, clear it.
      if (interval.current) {
        window.clearInterval(interval.current);
      }

      // Open a new socket to the known game and player ID
      const newSocket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_ENDPOINT}/game/${gameState?.id}/player/${me?.id}/socket`);

      newSocket.onmessage = (event: MessageEvent) => {
        const msg = JSON.parse(event.data.toString()) as ScrummyUpdate;
        if (msg?.game) {
          setGameState(msg.game);


          // If another player triggered a reset, this game state update affects
          // "me" too. And if I'm not still in the game state, kick me out.
          // @TODO: DRY -- abstract or unify with getGameState()
          if (me && msg.game) {
            const i = msg.game.players.findIndex(p => p.id == me.id);
            if (i === -1) {
              // I got kicked...
              setJoined(false);
            } else {
              setMe({...msg.game.players[i]});
            }
          }
        }
      };

      newSocket.onclose = (event: CloseEvent) => {
        // @TODO: Trigger the websocket to reconnect by firing this effect again.
        // Need to include logic to avoid a race condition if a disconnect was
        // intentional.
        if (event.code !== 1000) {
          setTryReconnect(tryReconnect + 1);
        }
      }

      newSocket.onerror = (event: Event) => {
        setTryReconnect(tryReconnect + 1);
      }

      interval.current = window.setInterval(handlePing, 10 * 1000);

      socket.current = newSocket;

    } else {
      setGameState(null);
      setMe(null);

      if (socket.current !== null) {
        socket.current.close(1000);
        socket.current = null;
      }

      if (interval.current) {
        window.clearInterval(interval.current);
        interval.current = null;
      }
    }

    return () => {
      if (socket.current !== null) {
        socket.current.close();
        socket.current = null;
      }

      if (interval.current) {
        window.clearInterval(interval.current);
        interval.current = null;
      }
    }
  }, [joined, tryReconnect]);

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
