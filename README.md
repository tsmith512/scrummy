# scrummy &ndash; A Scrum Planning Game

scrummy is a card game for [scrum story point estimation][poker]. I forked it
from [simewn's project][simewn] back in 2014 as an experiment with Node 0.8
(with Express and Socket.io). In 2023 rebuilt again using Cloudflare Workers,
Durable Objects, and Pages!

## Features

* Hosted using Cloudflare Workers, Durable Objects, and Pages
* Multiple game hosting: users may share links to specific games, or be assigned
  a new game when signing in.
* Shared game control: any client may reveal or reset the vote cards.
* Playing clients may place and revoke their votes by clicking cards in their hand.

## Work-in-Progress

* Websockets do not currently support reconnection
* Players cannot leave or get automatically garbage collected
* ~~Games do not get cleaned up~~ _(Actually, they do, because their state is not saved to storage.)_

[poker]: https://storypoints.info
[simewn]: https://github.com/simewn/Web-Planning-Poker
