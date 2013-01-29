require(['scripts/socket_client.js'],function(ck){});

var cli = null;

$(document).ready(function(){
  document.addEventListener('voteOccured',voteOccured,true);
  document.addEventListener('userSignedIn',userSignedIn,true);
  document.addEventListener('clientDisconnected',clientDisconnected,true);
});

function addUserToDiv(userName){
  div = document.createElement('div');
  $(div).attr('id',userName);
  $(div).append('<span class=\'vote-username\'>'+userName+'</span>');
  $(div).append('<div class=\'clear\'></div>');
  $(div).addClass('vote-user');
  $(div).append('<div class=\'image-admin\'><span style=\'display:none\' class=\'image-text\'></span></div>');
  $('#clients').append(div);
}

function addVote(user,vote){
  $('.image-text').hide();
  $('#'+user+' .image-text').text(vote);
  $('#'+user).addClass('voted');
}
function resetVote(){
  $('.image-text').text('').hide();
  $('#clients').children().removeClass('voted');
  cli.send('resetCmd',null,null);
}

function revealVotes(){
  $('.image-text').show();
}

function signIn(){
  var uName = $('#txtName').val();
  cli = new client();
  cli.send('signIn',{ 'userName' : uName },function(res,msg){
    if(!res){
      alert(msg);
      return;
   }else{
    $('#votingResult').show();
    $('#dSignIn').hide();
    }
  });
}
function voteOccured(e){
    addVote(e.userName,e.number);
}
function userSignedIn(e){
    addUserToDiv(e.userName);
}
function clientDisconnected(e){
    $('#'+e.userName).remove();
}
