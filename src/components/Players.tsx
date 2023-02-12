import React from 'react';
import style from '../styles/players.module.scss';
import { Player } from './Game';

export interface PlayersProps {
  players?: Player[];
  reveal: boolean;
}

export const Players = (props: PlayersProps) => {
  return (
    <div className={[style.players, (props.reveal ? style.reveal : style.hidden)].join(' ')}>
      {props.players?.map(p => (
        <div className={[style.player, (p.vote ? style.voted : style.abstained)].join(' ')}>
          <div className={style.back}>
            <div className={style.nickname}>{p.nick}</div>
          </div>
          <div className={style.front}>
            <div className={style.nickname}>{p.nick}</div>
            <div className={style.voteWrap}><span className={style.voteNumber}>{p.vote}</span></div>
          </div>
        </div>
      ))}
    </div>
  );
}
