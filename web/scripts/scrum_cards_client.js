require(['scripts/socket_client.js'],function(cl){
});

var cli= null;
var uName;
var voteValues = null;

$(document).ready(function(){
  document.addEventListener('voteOccured',voteOccured,true);
  document.addEventListener('userSignedIn',userSignedIn,true);
  document.addEventListener('clientDisconnected',clientDisconnected,true);
  document.addEventListener('clientReset',clientRes,false);
});

function signIn(){
  cli = new client();
  uName = $('#txtName').val();
  cli.send('signIn',{ 'userName' : uName }, function(res,msg){
    if(!res){
      alert(msg);
    }else{
      console.log(msg);
      voteValues = msg.points;
      var imagesDiv = $('.images');
      $(voteValues).each(function(index,item){
        $(imagesDiv).append('<div style=\'display:none\' class=\'image\' onclick=\'vote(this)\'><span class=\'image-text\'>'+ item + '</span></div>');
      });

      $('#dSignIn').hide();
      $('#dVote').show();
      $('#spanUser').text(uName);
      $('#votingResult').show();
      $('#dSignIn').hide();
      showCards();
    }
  });
}
function clientRes(e){
  $('.image').removeClass('image-selected');
}
function adminDisconnected(e){
  alert('Admin has disconnected. Please try and reconnect');
  $('#dSignIn').show();
  $('#dVote').hide();
}

function showCards()
{
  var cardDivs = $('.image:hidden');
  if(cardDivs.length <=0)
    return;
  var item = cardDivs[0];
  $(item).animate(
    {
      opacity:'show'
    },200,function(){
      showCards();
    });
}

function vote(sender){
  $('.image').removeClass('image-selected');
  var number = $(sender).children('.image-text').text();
  var uName = $('#txtName').val();
  cli.send('vote',{ 'userName' : uName, 'number' : number },null);
  $(sender).addClass('image-selected');
  $('#btnVote').attr('disabled','disabled');
}

/**
 * Functions from Admin script before it was merged into the client/admin interface
 */

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

function voteOccured(e){
    addVote(e.userName,e.number);
}
function userSignedIn(e){
    addUserToDiv(e.userName);
}
function clientDisconnected(e){
    $('#'+e.userName).remove();
}
