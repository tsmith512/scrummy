import React from 'react';
import style from '../styles/hand.module.scss';
import { Player } from './Game';

export interface HandProps {
  sizes: number[];
  nickname: string | null;
  vote: number | null;
  handleVote: (n: number) => Promise<void>
}

export const Hand = (props: HandProps) => {
  return (
    <div className={style.container}>
      {props.nickname && (<h2 className={style.nickname}>{props.nickname}</h2>)}
      <div className={style.handWrap}>
        <div className={style.hand}>
          {props.sizes.map(s => (
            <div
              className={[
                style.card,
                style.loading,
                (s === props.vote ? style.selected : style.unselected)
              ].join(' ')}
              onClick={(e) => {
                e.preventDefault();
                props.handleVote(s);
              }}
            >
              <span className={style.text}>{s}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
