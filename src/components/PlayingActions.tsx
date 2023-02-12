import React from 'react';
import style from '@/styles/actionsPanel.module.scss';

interface PlayingActionsProps {
  handleReveal: () => Promise<void>;
}

export const PlayingActions = (props: PlayingActionsProps) => {
  return (
    <section className={style.container}>
      <div className={style.contents}>
        <input type="button" id="btnReveal" value="Reveal" onClick={(e) => {
          e.preventDefault();
          props.handleReveal();
        }} />
        <input type="button" id="btnReset" value="Reset" />
        <input type="button" id="btnLink" value="Game Link" />
        <div id="gameLink">
          <input type="text" id="txtUrl" readOnly />
        </div>
      </div>
    </section>
  )
};
