# scrummy &ndash; A Scrum Planning Game

This application is used during planning and estimation meetings and is useful when the team isn't at the same location.

## Requirements

* HTML5 supporting browser that supports websockets.
* node.js and npm installed
* socket.io (included in repo)
* express (npm install express)
* some kind of webserver, only tested on apache.

## Setup

* Copy webdir to a new directory where your webserver can access it.
* Adjust settings in scripts/settings.js and settings.js.
* Start the server with node scrum_cards_server.js <admin_nick>
* Browse to host/admin.html and enter your admin nick as name.
* All participants should browse to host url and just enter their name to participate in the planning poker.

## Credits

* socket.io
* express
* node.js
