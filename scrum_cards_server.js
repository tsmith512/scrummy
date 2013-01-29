var express = require('express'),
    app = express(),
    http = require('http'),
    server = http.createServer(app),
    io = require('socket.io').listen(server),
    sockDict = new Array();
    adminSocket = null,
    config  = require('./settings.js');

app.use(express.static(__dirname + '/web'));
server.listen(config.port);

io.sockets.on('connection',function(socket){

  socket.on('signIn',function(data,fn){

    for(sock in sockDict){
      var name = sockDict[sock];
      if(name == data.userName){
        fn(false,"Username taken!");
        return;
      }
    }

    sockDict[socket.id] = data.userName;
    socket.broadcast.emit('userSignedIn',{ 'userName' : data.userName});
    fn(true,{ 'points' : config.points} );
  });

  socket.on('vote',function(data){
    socket.broadcast.emit('voteOccured', data);
  });

  socket.on('resetCmd',function(){
    if(sockDict == null) return;
    socket.broadcast.emit('reset',{ 'userName' : sockDict[socket.id] });
  });

  socket.on('disconnect',function(){
    socket.broadcast.emit('clientDisconnect', {userName : sockDict[socket.id] });
    sockDict[socket.id] = null;
  });

});

