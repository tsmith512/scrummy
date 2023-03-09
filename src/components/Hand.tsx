import React from 'react';
import style from '../styles/hand.module.scss';

export interface HandProps {
  sizes: number[];
  nickname?: string;
  vote?: number | null | false;
  handleVote: (n: number) => Promise<void>
}

export const Hand = (props: HandProps) => {
  return (
    <section className={style.container}>
      {props.nickname && (<h2 className={style.nickname}>{props.nickname}</h2>)}
      <div className={style.handWrap}>
        <div className={style.hand}>
          {props.sizes.map(s => (
            <div
              key={s}
              className={[
                style.card,
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
    </section>
  );
}
