import React from 'react';

import style from '../styles/footer.module.scss';

export const Footer = () => {
  return (
    <footer className={style.footer}>
      &copy; {new Date().getFullYear()} Scrummy is an experiment
      by <a href="https://tsmith.com/?utm_source=scrummy&utm_medium=website&utm_campaign=scrummy">Taylor Smith</a>.
    </footer>
  );
}
