import React from 'react';
import style from '@/styles/actionsPanel.module.scss';

interface LoginActionsProps {

}

export const LoginActions = (props: LoginActionsProps) => {
  return (
    <section className={style.container}>
      <h2>Welcome</h2>
      <div className={style.contents}>
        <input type="text" id="txtNickname" placeholder="Nickname?" />
        <input type="text" id="txtGame" placeholder="New Game!" />
        <input type="submit" value="Play" id="btnSignIn" />
        <input type="button" value="Watch" id="btnObserve" />
      </div>
    </section>
  )
};
