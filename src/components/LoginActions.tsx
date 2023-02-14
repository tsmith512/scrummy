import React, { useEffect, useState } from 'react';
import style from '@/styles/actionsPanel.module.scss';

interface LoginActionsProps {
  handleJoin: (nick: string, game: string) => Promise<void>;
  // handleView: (game: string) => Promise<void>;
}

export const LoginActions = (props: LoginActionsProps) => {
  const [newNick, setMyNewNick] = useState('');
  const [newGame, setMyNewGame] = useState('');

  useEffect(() => {
    if (window.location.hash) {
      setMyNewGame(window.location.hash.substring(1));
    }

    const previousNick = localStorage.getItem('nickname');
    if (previousNick) {
      setMyNewNick(previousNick);
    }
  }, []);

  return (
    <section className={style.container}>
      <h2>Welcome</h2>
      <div className={style.contents}>
        <input
          type="text"
          placeholder="Nickname?"
          value={newNick}
          onChange={(e) => { setMyNewNick(e.currentTarget.value)}}
        />
        <input
          type="text"
          placeholder="New Game!"
          value={newGame}
          onChange={(e) => { setMyNewGame(e.currentTarget.value)}}
        />
        <button
          type="button"
          disabled={!newNick}
          onClick={ (e) => {
            if (!newGame) {
              // User did not name their game nor did one come in with a url
              // fragment, so let's make one up.
              props.handleJoin(newNick, Math.random().toString(36).substring(2,10));
            } else {
              props.handleJoin(newNick, newGame);
            }
          }}
        >Play</button>
        <button
          type="button"
          disabled={!newGame}
          onClick={ (e) => {
            e.preventDefault();
            // props.handleView(newGame);
            alert("Watch mode not yet implemented.");
          }}
        >Watch</button>
      </div>
    </section>
  )
};
