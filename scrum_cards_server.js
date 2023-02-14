#!/usr/bin/env node
/*

    Scrummy is a scrum planning and estimation game in Node.js
    Copyright (C) 2013  Taylor Smith, Four Kitchens

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see [http://www.gnu.org/licenses/].

*/

// Support joining a game without a room name

// WebSocket: On client join game, push update to all
// WebSocket: On client vote, push state update to all
// WebSocket: On reset or reveal, push state update to all

// There was a handdler to get player and watcher count from a game ID
// used to add some welcome text on the readme.


// ON CLIENT DISCONNECT:
// - WebSocket: Push state update to all
// - Server: If there are no players left, delete the game...
