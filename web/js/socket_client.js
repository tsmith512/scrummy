/*******************************************************************************
 * Hook server-dispatched socket events to document events                     *
 *******************************************************************************/

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
    evt.sid = data.sid;
    document.dispatchEvent(evt);
  });
  this.socket.on('userSignedIn', function(data){
    var evt = createEvent('userSignedIn');
    evt.nickname = data.nickname;
    evt.sid = data.sid;
    evt.mode = data.mode;
    document.dispatchEvent(evt);
  });
  this.socket.on('voteOccured', function(data){
    var evt = createEvent('voteOccured');
    evt.sid = data.sid;
    evt.number = data.number;
    document.dispatchEvent(evt);
  });
  this.socket.on('clientRevoke', function(data){
    var evt = createEvent('clientRevoke');
    evt.sid = data.sid;
    document.dispatchEvent(evt);
  });
  this.socket.on('reconnect', function(data){
    var evt = createEvent('reconnect');
    evt.sid = data.sid;
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
