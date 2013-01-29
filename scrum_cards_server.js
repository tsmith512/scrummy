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
    for ( client in bucket ) {
      if (client.nickname == data.userName) {
        fn( false, 'Nickname already in use.' );
        return;
      }
    }

    console.log("Client %s connected", data.userName);

    bucket.push({id: socket.id, nickname: data.userName});
    socket.broadcast.emit('userSignedIn',{ 'userName' : data.userName});
    fn(true,{ 'points' : config.points, 'users' : bucket} );
  });

  socket.on('vote',function(data){
    io.sockets.emit('voteOccured', data);
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
      if (bucket[i].id == socket.id) {
        var nickname = bucket[i].nickname;
        bucket.splice(i, 1);

        socket.broadcast.emit('clientDisconnect', {userName : nickname });
        console.log("Client %s disconnected. %d remaining.", nickname, bucket.length);
      }
    }
  });

});

