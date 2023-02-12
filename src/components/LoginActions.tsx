import React, { useState } from 'react';
import style from '@/styles/actionsPanel.module.scss';

interface LoginActionsProps {
  nick?: string;
  game?: string;
  handleJoin: (nick: string, game: string) => Promise<void>;
  handleView: (game: string) => Promise<void>;
}

export const LoginActions = (props: LoginActionsProps) => {
  const [newNick, setMyNewNick] = useState(props.nick as string | null);
  const [newGame, setMyNewGame] = useState(props.game as string | null);

  return (
    <section className={style.container}>
      <h2>Welcome</h2>
      <div className={style.contents}>
        <input
          type="text"
          placeholder="Nickname?"
          value={props.nick}
          onChange={(e) => { setMyNewNick(e.target.value)}}
        />
        <input
          type="text"
          placeholder="New Game!"
          value={props.game}
          onChange={(e) => { setMyNewGame(e.target.value)}}
        />
        <input
          type="submit"
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
