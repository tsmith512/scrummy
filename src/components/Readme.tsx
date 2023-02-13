import React from 'react';

import style from '../styles/readme.module.scss';

export const Readme = (props) => {
  return (
    <section className={style.readme}>
      <h2>What's scrummy?</h2>
      <div className={style.content}>
        <p><strong>Scrummy</strong> is
          a story point estimation game for scrum teams to make it easier for
          big remote teams to point tickets together.</p>

        <p><strong>Story points</strong> are a way to estimate work by complexity
          instead of time. Check out <a href="https://storypoints.info/?utm_source=scrummy&utm_medium=website&utm_campaign=scrummy">StoryPoints.info</a> to learn more!
          </p>

        <p><strong>To begin,</strong> type a nickname and
          click <em>Play</em> or <em>Watch</em> to begin. If you received a link
          from another player, you will be added to that game. Otherwise, a new
          game will be created for you. Invite others by sharing your <em>game
          link</em>.</p>

        <p><strong>While playing,</strong> vote by clicking on a card in your
          hand. Withdraw a vote by clicking the same card; click another card to
          change your vote. The <em>Reveal</em> and <em>Reset</em> buttons affect
          everyone, so only use them when your team is ready.</p>
      </div>
    </section>
  );
}
