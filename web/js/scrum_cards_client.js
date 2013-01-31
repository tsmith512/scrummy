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

  /* On form submit, execute signIn() but don't actually post/get or reload */
  $("#loginActions form").submit(function(){ signIn(); return false; })

  /* Setup the reveal and restore buttons in #votingActions */
  $("#btnReveal").click(function(){ revealVotes(); });
  $("#btnReset").click(function(){ resetVotes(); });
});

function signIn(){
  cli = new client();
  myNick = $('#txtNickname').val();

  cli.send('signIn',{ 'nickname' : myNick }, function(res,msg){
    if(!res){
      alert(msg);
    } else {
      voteValues = msg.points;
      $(voteValues).each(function(index,item){
        $('.cards')
          .append('<div style="display:none" class="card" onclick="vote(this)"><span class="card-text">'+ item + '</span></div>');
      });

      currentUsers = msg.users;
      mySid = msg.sid; // Set "my" Socket ID
      $(currentUsers).each(function(i,e){ addUserToDiv(e.sid, e.nickname); })

      $('#dSignIn').slideUp();
      $('#nickname-display').text(myNick);
      $('#votingResult, #playersHand').slideDown();
      showCards();
    }
  });
}
function clientReset(e){
  $('#playersHand .card').removeClass('selected');
  $('#votingResult .vote').text('');
  $('#votingResult .client').removeClass('voted');
  $('#votingResult').removeClass('reveal');
}
function clientReveal(e){
  $('#votingResult').addClass('reveal');
}

function showCards() {
  var newCards = $('.card:hidden');
  newCards.each(function(i){
    $(this).delay(250*i).fadeIn(300);
  });
}

function vote(sender){
  $('.card').removeClass('selected');
  var number = $(sender).children('.card-text').text();
  cli.send('vote',{ 'sid' : mySid, 'number' : number },null);
  $(sender).addClass('selected');
  $('#btnVote').attr('disabled','disabled');
}

function addUserToDiv(sid, nickname){
  $('<div />')
    .attr('id', sid)
    .addClass('client')
    .append('<div class="nickname">'+nickname+'</div>')
    .append('<div class="vote-wrap"><span class="vote"></span></div>')
    .appendTo('#clients');
}

function addVote(sid,vote){
  $('#votingResult .card-text');
  $('#'+sid+' .vote').text(vote);
  $('#'+sid).addClass('voted');
}

function resetVotes(){
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
