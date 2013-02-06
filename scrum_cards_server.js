var express = require('express'),
    app     = express(),
    http    = require('http'),
    server  = http.createServer(app),
    io      = require('socket.io').listen(server),
    bucket  = [],
    config  = require('./settings.js');

app.use(express.static(__dirname + '/web'));
server.listen(config.port);

io.sockets.on('connection',function(socket){

  socket.on('signIn',function(data,fn){
    // Nicknames should be unique, are displayed in uppercase, and should only
    // contain a small set of characters.
    var requestedNick = (data.nickname) ? data.nickname.toLowerCase().replace(/[^\d\w- ]+/gi,'') : false;
    var requestedGame = (data.game) ? data.game.toLowerCase().replace(/[^\d\w]+/gi,'') : false;
    
    // Join the requested active game.
    if ( !requestedGame ) { fn(false, 'Must supply game string hash'); return }

    if ( typeof(bucket[requestedGame]) === "undefined" ) {
      // This game is new, create the array in the bucket.
      bucket[requestedGame] = [];
    } else {
      // This game exists, check for duplicate names
      for ( client in bucket[requestedGame] ) {
        if (requestedNick == bucket[requestedGame][client].nickname.toLowerCase() ) {
          fn( false, 'Nickname already in use.' );
          return;
        }
      }
    }

    /*
     * We need an easy way to know what game a client is playing, and the lookup
     * alternative appears to be `io.sockets.manager.roomClients[socket.id]` so
     * for the time being, I'm just gonna store it as a socket variable also.
     */
    socket.set('game', requestedGame, null);

    console.log("Client %s connected. Game requested: %s", requestedNick, requestedGame);

    client = {sid: socket.id, nickname: requestedNick, game: requestedGame};
    bucket[requestedGame].push(client);

    socket.join(requestedGame);

    socket.broadcast.in(requestedGame).emit('userSignedIn',
      {'nickname' : client.nickname, 'sid' : client.sid}
    );

    fn(true,{
      'sid' : client.sid,
      'nick' : requestedNick,
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

  socket.on('disconnect',function(data, fn){
    /* What's our current game? */
    game = socket.store.data.game;

    if ( !game ) {
      fn(false, 'Could not determine active game. Please reload.');
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

