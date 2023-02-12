import React, { useState } from 'react';
import style from '@/styles/actionsPanel.module.scss';

interface PlayingActionsProps {
  reveal: boolean;
  handleReveal: () => Promise<void>;
  handleReset: () => Promise<void>;
}

export const PlayingActions = (props: PlayingActionsProps) => {
  const [linkVisible, setLinkVisible] = useState(false as boolean);

  return (
    <section className={style.container}>
      <div className={style.contents}>
        <input
          type="button"
          className={(props.reveal ? style.reveal : style.hidden )}
          value="Reveal"
          onClick={(e) => {
            e.preventDefault();
            props.handleReveal();
          }}
        />
        <input
          type="button"
          value="Reset"
          onClick={(e) => {
            e.preventDefault();
            props.handleReset();
          }}
        />
        <input
          type="button"
          id="btnLink"
          value="Game Link"
          onClick={(e) => {
            e.preventDefault();
            setLinkVisible(!linkVisible)
          }}
        />
      </div>
      <div className={[style.gameLink, (linkVisible ? style.visible : style.hidden)].join(' ')}>
        <input
          type="text"
          id="txtUrl"
          readOnly
          onClick={(e) => { e.target.select(); }}
        />
      </div>
    </section>
  )
};
