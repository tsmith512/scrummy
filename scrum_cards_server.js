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

    if(process.argv.length <= 2){
      fn(false,'Not enough startup arguments when starting the server app');
      return;
    }

    for(sock in sockDict){
      var name = sockDict[sock];
      if(name == data.userName){
        fn(false,"Username taken!");
        return;
      }
    }

    sockDict[socket.id] = data.userName;
    if(data.userName == process.argv[2]){
      adminSocket = socket;
    }else{
      if(adminSocket != null){
        adminSocket.emit('userSignedIn',{ 'userName' : data.userName});
      }
    }
    if(adminSocket == null){
      fn(false,'No server started, try again later');
    }
    fn(true,{ 'points' : config.points} );
  });

  socket.on('vote',function(data){
    adminSocket.emit('voteOccured', data);
  });

  socket.on('resetCmd',function(){
    if(sockDict == null) return;
    socket.broadcast.emit('reset',{ 'userName' : sockDict[socket.id] });
  });

  socket.on('disconnect',function(){
    if(adminSocket != null && socket == adminSocket){
      adminSocket = null;
      socket.broadcast.emit('adminDisconnected', { 'userName' : sockDict[socket.id] });
      sockDict = new Array();
    }else{
      adminSocket.emit('clientDisconnect', {userName : sockDict[socket.id] });
    }
    sockDict[socket.id] = null;

  });

});

