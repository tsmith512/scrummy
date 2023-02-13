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
          onChange={(e) => { setMyNewNick(e.target.value)}}
        />
        <input
          type="text"
          placeholder="New Game!"
          value={newGame}
          onChange={(e) => { setMyNewGame(e.target.value)}}
        />
        <input
          type="button"
          value="Play"
          disabled={!newNick || !newGame}
          onClick={ (e) => {
            e.preventDefault();
            props.handleJoin(newNick, newGame);
          }}
        />
        <input
          type="button"
          value="Watch"
          disabled={!newGame}
          onClick={ (e) => {
            e.preventDefault();
            props.handleView(newGame);
          }}
        />
      </div>
    </section>
  )
};
