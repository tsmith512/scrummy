# scrummy &ndash; A Scrum Planning Game

scrummy is a card game for [scrum story point estimation][poker]. Originally
forked from [simewn's project][simewn] by [tsmith512][] back in 2014 as an
experiment with Node 0.8 and now rebuilt in 2023 on Cloudflare Workers Durable
Objects and Pages!

## Features

* Hosted using Cloudflare Workers, Durable Objects, and Pages
* Multiple game hosting: users may share links to specific games, or be assigned
  a new game when signing in.
* Shared game control: any client may reveal or reset the vote cards.
* Playing clients may place and revoke their votes by clicking cards in their hand.

## Work-in-Progress

* Websockets so each client doesn't poll every 2 seconds
* Players cannot leave or get automatically garbage collected
* Games do not get cleaned up
* [Chickens and Pigs][CP] (observer and player) modes (not re-implemented yet)


[poker]: https://storypoints.info
[simewn]: https://github.com/simewn/Web-Planning-Poker
[tsmith512]: https://tsmith.com
[CP]: http://en.wikipedia.org/wiki/The_Chicken_and_the_Pig
