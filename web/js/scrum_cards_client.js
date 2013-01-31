require(['js/socket_client.js'],function(cl){
});

var cli = null;
var mySid = null;
var myNick = null;
var voteValues = null;

$(document).ready(function(){
  document.addEventListener('voteOccured',voteOccured,true);
  document.addEventListener('userSignedIn',userSignedIn,true);
  document.addEventListener('clientDisconnected',clientDisconnected,true);
  document.addEventListener('clientReset',clientReset,false);
  document.addEventListener('clientReveal',clientReveal,false);
});

function signIn(){
  cli = new client();
  myNick = $('#txtName').val();
  cli.send('signIn',{ 'nickname' : myNick }, function(res,msg){
    if(!res){
      alert(msg);
    }else{
      console.log(msg);
      voteValues = msg.points;
      var imagesDiv = $('.images');
      $(voteValues).each(function(index,item){
        $(imagesDiv).append('<div style=\'display:none\' class=\'image\' onclick=\'vote(this)\'><span class=\'image-text\'>'+ item + '</span></div>');
      });

      currentUsers = msg.users;
      mySid = msg.sid; // Set "my" Socket ID
      $(currentUsers).each(function(i,e){ addUserToDiv(e.sid, e.nickname); })

      $('#dSignIn').hide();
      $('#dVote').show();
      $('#spanUser').text(myNick);
      $('#votingResult').show();
      $('#dSignIn').hide();
      showCards();
    }
  });
}
function clientReset(e){
  $('#dVote .image').removeClass('image-selected');
  $('#votingResult .vote').text('').hide();
  $('#votingResult #clients').children().removeClass('voted');
  $('.image').removeClass('image-selected');
}
function clientReveal(e){
  $('.vote').show();
}

function showCards() {
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
  cli.send('vote',{ 'sid' : mySid, 'number' : number },null);
  $(sender).addClass('image-selected');
  $('#btnVote').attr('disabled','disabled');
}

/**
 * Functions from Admin script before it was merged into the client/admin interface
 */

function addUserToDiv(sid, nickname){
  $('<div />')
    .attr('id', sid)
    .addClass('client')
    .append('<div class="nickname">'+nickname+'</div>')
    .append('<div class="vote-wrap"><span class="vote" style="display:none"></span></div>')
    .appendTo('#clients');
}

function addVote(sid,vote){
  $('.image-text').hide();
  $('#'+sid+' .vote').text(vote);
  $('#'+sid).addClass('voted');
}
function resetVote(){
  cli.send('reset',null,null);
}

function revealVotes(){
  cli.send('reveal',null,null);
}

function voteOccured(e){
    addVote(e.sid,e.number);
}
function userSignedIn(e){
    addUserToDiv(e.sid, e.nickname);
}
function clientDisconnected(e){
    $('#'+e.sid).remove();
}
