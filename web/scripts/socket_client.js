var client = function(){
  var conStr = window.location.origin;
  this.socket = io.connect(conStr);

  this.socket.on('reset',function(data){
    var evt = createEvent('clientReset');
    document.dispatchEvent(evt);
  });
  this.socket.on('reveal',function(data){
    var evt = createEvent('clientReveal');
    document.dispatchEvent(evt);
  });
  this.socket.on('adminDisconnected', function(data){
    var evt = createEvent('adminDisconnected');
    document.dispatchEvent(evt);
  });
  this.socket.on('clientDisconnect',function(data){
    var evt = createEvent('clientDisconnected');
    evt.userName = data.userName;
    document.dispatchEvent(evt);
  });
  this.socket.on('userSignedIn', function(data){
    var evt = createEvent('userSignedIn');
    evt.userName = data.userName;
    document.dispatchEvent(evt);
  });

  this.socket.on('voteOccured', function(data){
    var evt = createEvent('voteOccured');
    evt.userName = data.userName;
    evt.number = data.number;
    document.dispatchEvent(evt);
  });

  function createEvent(name){
    var evt = document.createEvent('Event');
    evt.initEvent(name,true,true);
    return evt;
  }
}

client.prototype.send = function(cmd,data,fn){
  if(fn != null){
    this.socket.emit(cmd,data,fn);
  }else{
    this.socket.emit(cmd,data);
  }
}
