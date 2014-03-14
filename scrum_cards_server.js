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

var express = require('express'),
    app     = express(),
    http    = require('http'),
    server  = http.createServer(app),
    io      = require('socket.io').listen(server),
    bucket  = [],
    config  = require('./settings.json'),
    argv    = require('yargs').argv,
    port    = argv.port || config.port;

app.use(express.static(__dirname + '/web'));
server.listen(port);

io.sockets.on('connection',function(socket){

  socket.on('signIn',function(data,fn){
    // Nicknames should be unique, are displayed in uppercase, and should only
    // contain a small set of characters.
    var requestedNick = (data.nickname) ? data.nickname.toLowerCase().replace(/[^\d\w- ]+/gi,'') : false;
    if ( !requestedNick ) {
      fn( false, 'Please pick a nickname.' );
      return;
    }

    // Join the requested active game. If there isn't one, make one!
    var requestedGame = (data.game) ? data.game.toLowerCase().replace(/[^\d\w]+/gi,'') : false;
    if ( !requestedGame ) {
      // Generate random strings until we have one that's no in use.
      var i = 0; // Number of attempts.
      while ( !requestedGame && (bucket[requestedGame] !== "undefined") ) {
        if ( i < 5 ) {
          // Try to get a friendly game name from the "names" config option
          // These are the valid HTML color names minus Light*, Medium*, and Dark*, to use
          // as room names. The random number generator is still a fallback but these are
          // easier to communicate verbally.
          requestedGame = config.words[Math.floor(Math.random()*config.words.length)];
        } else {
          // We've failed to get a word five times, just make a number.
          requestedGame = Math.floor(Math.random() * 100000);
        }
        i++;
      }
    }

    // Either a game was requested, or we've made a string. Set it up.
    if ( typeof(bucket[requestedGame]) === "undefined" ) {
      // This game is new, create the array in the bucket.
      bucket[requestedGame] = [];
    } else {
      // This game exists, check for duplicate names
      for ( client in bucket[requestedGame] ) {
        if (requestedNick == bucket[requestedGame][client].nickname ) {
          fn( false, 'Nickname already in use.' );
          return;
        }
      }
    }

    /*
     * We need an easy way to know what game a client is playing, and the lookup
     * alternative appears to be `io.sockets.manager.roomClients[socket.id]` so
     * for the time being, I'm just gonna store it as a socket variable also.
     * The easy way to get this back is: game = socket.store.data.game;
     * The socket.get() function is asynchronous, which we don't really need.
     */
    socket.set('game', requestedGame, null);

    console.log("Client %s connected. Game requested: %s", requestedNick, requestedGame);

    client = {
      sid: socket.id,
      nickname: requestedNick,
      game: requestedGame,
      mode: parseInt( data.mode )
    };

    bucket[requestedGame].push(client);

    socket.join(requestedGame);

    socket.broadcast.in(requestedGame).emit('userSignedIn',
      {'nickname' : client.nickname, 'sid' : client.sid, 'mode' : client.mode}
    );

    fn(true,{
      'sid' : client.sid,
      'nickname' : requestedNick,
      'points' : config.points,
      'users' : bucket[requestedGame],
      'game' : requestedGame
    });
  });

  socket.on('vote',function(data, fn){
    /* Check to make sure the vote provided is in the array of possible responses */
    if ( config.points.indexOf(data.number) < 0 ) {
      fn(false, 'Invalid vote');
      return false;
    }

    /* What's our current game? */
    game = socket.store.data.game;

    if ( !game ) {
      fn(false, 'Could not determine active game. Please reload.');
      return false;
    }

    /* Broadcast the vote and our socket.id to everyone */
    io.sockets.in(game).emit('voteOccured', { "sid": socket.id, "number": data.number } );

    /* Tell this client the vote was accepted. */
    fn(true);
  });

  socket.on('voteRevoke',function(data, fn){
    /* What's our current game? */
    game = socket.store.data.game;

    if ( !game ) {
      fn(false, 'Could not determine active game. Please reload.');
      return false;
    }

    io.sockets.in(game).emit('clientRevoke', { "sid": socket.id } );

    /* Tell this client the vote was accepted. */
    fn(true);
  });

  socket.on('reset',function(data, fn){
    /* What's our current game? */
    game = socket.store.data.game;

    if ( !game ) {
      fn(false, 'Could not determine active game. Please reload.');
      return false;
    }

    io.sockets.in(game).emit('reset');
  });

  socket.on('reveal',function(data, fn){
    /* What's our current game? */
    game = socket.store.data.game;

    if ( !game ) {
      fn(false, 'Could not determine active game. Please reload.');
      return false;
    }

    io.sockets.in(game).emit('reveal');
  });

  socket.on('getPlayerCount',function(data, fn){
    /* Which game is being investigated? */
    var requestedGame = (typeof(data.game) === 'string' && data.game.length) ?
      data.game.toLowerCase().replace(/[^\d\w]+/gi,'') : false;

    // If this game is present, return the number of players. Otherwise return false.
    if ( requestedGame && requestedGame in bucket ) {
      fn(true, bucket[requestedGame].length);
    } else {
      fn(false, 0);
    }

  });

  socket.on('disconnect',function(data){
    /* What's our current game? */
    game = socket.store.data.game;

    if ( !game ) {
      /* In testing, I determined that if we don't have a valid game, it's because
       * the server went down and came back up, so there isn't a game set. For any
       * other interaction, the player is asked to reload and start again. But in
       * the case of a disconnect, we can just let him or her go without worrying
       * about stale memebers in the bucket[game] arrays. In the future, we should
       * handle reconnections properly, which will fix this problem. */
      return false;
    }

    /* Iterate over the bucket _backwards_ so we can cleanly remove the departing
     * client having to recalculate the length (as you would in a for loop) */
    var i = bucket[game].length;
    while (i--) {
      if (bucket[game][i].sid == socket.id) {
        var client = bucket[game][i];
        bucket[game].splice(i, 1);

        /* This data is safe to send out, it's coming from the stored bucket,
         * not the incoming socket data. */
        socket.broadcast.emit('clientDisconnect', {'nickname' : client.nickname, 'sid' : client.sid });
        console.log("Client %s disconnected. %d remaining in room.", client.nickname, bucket[game].length);
      }
    }
  });

});

