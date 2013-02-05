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

    for ( client in bucket ) {
      if (requestedNick == bucket[client].nickname.toLowerCase() ) {
        fn( false, 'Nickname already in use.' );
        return;
      }
    }

    client = {sid: socket.id, nickname: requestedNick, game: requestedGame};
    console.log("Client %s connected. Game requested: %s", requestedNick, requestedGame);

    bucket.push(client);
    socket.broadcast.emit('userSignedIn',{'nickname' : client.nickname, 'sid' : client.sid});
    socket.join(requestedGame);
    fn(true,{
      'sid' : client.sid,
      'nick' : requestedNick,
      'points' : config.points,
      'users' : bucket,
      'game' : requestedGame
    });
  });

  socket.on('vote',function(data, fn){
    /* Check to make sure the vote provided is in the array of possible responses */
    if ( config.points.indexOf(data.number) < 0 ) {
      fn(false, 'Invalid vote');
      return false;
    }

    /* Broadcast the vote and our socket.id to everyone */
    io.sockets.emit('voteOccured', { "sid": socket.id, "number": data.number } );

    /* Tell this client the vote was accepted. */
    fn(true);
  });

  socket.on('voteRevoke',function(data, fn){
    io.sockets.emit('clientRevoke', { "sid": socket.id } );

    /* Tell this client the vote was accepted. */
    fn(true);
  });

  socket.on('reset',function(){
    io.sockets.emit('reset');
  });

  socket.on('reveal',function(){
    io.sockets.emit('reveal');
  });

  socket.on('disconnect',function(){

    /* Iterate over the bucket _backwards_ so we can cleanly remove the departing
     * client having to recalculate the length (as you would in a for loop) */
    var i = bucket.length;
    while (i--) {
      if (bucket[i].sid == socket.id) {
        var client = bucket[i];
        bucket.splice(i, 1);

        /* This data is safe to send out, it's coming from the stored bucket,
         * not the incoming socket data. */
        socket.broadcast.emit('clientDisconnect', {'nickname' : client.nickname, 'sid' : client.sid });
        console.log("Client %s disconnected. %d remaining.", client.nickname, bucket.length);
      }
    }
  });

});

