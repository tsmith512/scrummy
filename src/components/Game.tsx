import React from 'react';
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
  const [socket, setSocket] = useState(null as null | WebSocket);
  const [joined, setJoined] = useState(false as boolean);
  const [sizes, setSizes] = useState([] as number[]);

  /**
   * Manual fetch to grab the latest game state from the durable object
   */
  const getGameState = async (): Promise<void> => {
    if (joined && gameState?.id) {
      await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/game/${gameState.id}/status`)
      .then((res) => res.json())
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
      })
    }
  };

  /**
   * Get an array of what story point cards we support
   */
  const getSizes = async (): Promise<void> => {
    await fetch(`${process.env.NEXT_PUBLIC_API_ENDPOINT}/settings/sizes`)
    .then((res) => res.json())
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
   * @param gameName (string) game name (not DO ID)
   */
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

  /**
   * When `joined` changes:
   * - If true, set up the websocket, ping timer, and poll timer -- with cleanup
   * - If false, swap back to the readme/login UI
   */
  useEffect(() => {

    if (joined) {
      getSizes();

      setSocket(() => {
        const newSocket = new WebSocket(`${process.env.NEXT_PUBLIC_WS_ENDPOINT}/game/${gameState?.id}/player/${me?.id}/socket`);

        newSocket.onmessage = (event: MessageEvent) => {
          const msg = JSON.parse(event.data.toString()) as ScrummyUpdate;
          if (msg?.game) {
            setGameState(msg.game);
          }
        };

        newSocket.onclose = (event: CloseEvent) => {
          setJoined(false);
        }

        // This is set inside the callback so it refers to the socket isntead of
        // getting stuck referring to the init state of `socket` (null). This
        // is okay because the response to a closed/failed socket is to exit
        // the game, but I should fix this somehow...
        setInterval(() => {
          const message: ScrummyUpdate = {
            type: 'ping'
          }
          newSocket.send(JSON.stringify(message));
        }, 10 * 1000);

        return newSocket;
      });

    } else {
      setGameState(null);
      setMe(null);

      if (socket !== null) {
        socket.close();
        setSocket(null);
      }
    }

    return () => {
      if (socket !== null) {
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
