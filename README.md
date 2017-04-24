# scrummy &ndash; A Scrum Planning Game

scrummy is a card game for [scrum story point estimation][poker]. Originally forked from
[simewn's project][simewn] by [tsmith512][], the Web Chefs of [Four Kitchens][4K]
have continued development to include several new features and enhancements:

## Features

* Self-contained node.js application, serving static components using [Express][]
  and leveraging [Socket.io][] for easy websockets and client/server event handling.
* Multiple game hosting: users may share links to specific games, or be assigned
  a new game when signing in.
* Customizable point card strings in server config.
* [Chickens and Pigs][CP] (observer and player) modes.
* Shared game control: any client may reveal or reset the vote cards.
* Playing clients may place and revoke their votes by clicking cards in their hand.
* Fully responsive front-end design powered by [Sass][] and [Compass][] with
  [Modernizr][] feature detection. 

## Requirements

* **Server:** Node.js and npm <br />
  _Node module dependencies installable with `npm install`_
* **Client:** HTML5 browser with support for websockets <br />
  _Currently tested in latest Chrome, Firefox, iOS 5+ Mobile Safari,
  Android 4.x Browser_

## Setup

* `npm install`
* Edit `settings.json` as necessary
* `npm start`
* Alternatively, run `scrum_cards_server.js` directly with an optional
  port override argument: `--port=9999`

## Collaboration

If you run into trouble, issues can be posted to the [project][GHP] on GitHub.
Pull requests are also welcome to add features, refactor existing code, or
tackle issues! Be sure to open requests against the _dev_ branch (or applicable
feature branch) and use Compass to recompile any style changes.

[poker]: https://luis-goncalves.com/planning-poker-scrum-poker/
[simewn]: https://github.com/simewn/Web-Planning-Poker
[tsmith512]: https://github.com/tsmith512
[4K]: http://www.fourkitchens.com
[Express]: http://expressjs.com/
[Socket.io]: http://socket.io/
[CP]: http://en.wikipedia.org/wiki/The_Chicken_and_the_Pig
[Sass]: http://sass-lang.com/
[Compass]: http://compass-style.org/
[Modernizr]: http://modernizr.com/
[GHP]: https://github.com/tsmith512/scrummy
