import React, { FunctionComponent } from 'react';
import style from '@/styles/container.module.scss';

export const Container: FunctionComponent<{ children: any }> = (props) => {
  return (
    <main className={style.main}>
      {props.children}
    </main>
  )
};
