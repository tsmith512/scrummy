import React, { useState } from 'react';
import style from '@/styles/actionsPanel.module.scss';

interface PlayingActionsProps {
  reveal: boolean;
  gameLink?: string;
  handleReveal: () => Promise<void>;
  handleReset: () => Promise<void>;
  handleExit: () => Promise<void>;
}

export const PlayingActions = (props: PlayingActionsProps) => {
  const [linkVisible, setLinkVisible] = useState(false as boolean);

  return (
    <section className={style.container}>
      <div className={style.contents}>
        <button
          className={(props.reveal ? style.reveal : style.hidden )}
          onClick={(e) => {
            props.handleReveal();
          }}
        >Reveal</button>
        <button
          onClick={(e) => {
            props.handleReset();
          }}
        >Reset</button>
        <button
          onClick={(e) => {
            setLinkVisible(!linkVisible)
          }}
        >Game Link</button>
        <button
          onClick={(e) => {
            props.handleExit();
          }}
        >Exit</button>
      </div>
      <div className={[style.gameLink, (linkVisible ? style.visible : style.hidden)].join(' ')}>
        <input
          type="text"
          id="txtUrl"
          value={props.gameLink}
          readOnly
          onClick={(e) => { e.currentTarget.select(); }}
        />
      </div>
    </section>
  )
};
