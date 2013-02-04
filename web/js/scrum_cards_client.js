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
  document.addEventListener('clientRevoke',clientRevoke,false);
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
    /* Server returned false; alert with message and bail */
    if(!res){ alert(msg); return false; }
      
    /* Create cards for each item in the Points object */
    voteValues = msg.points;
    $(voteValues).each(function(index,item){
      $('<div />')
        .hide() /* Hidden for now, showCards() reveals them in sequence */
        .addClass('card')
        .click(function(){ vote(this); })
        .append( $('<span />').addClass('card-text').text(item) )
        .appendTo('.cards');
    });

    /* Set client Socket ID for later; it's our identifier server-side */
    mySid = msg.sid;

    /* Use the sanitized nickname from the server so it appears
     * consistently among clients. */
    myNick = msg.nickname;

    /* Server should respond with users already in the game, display them */
    currentUsers = msg.users;
    $(currentUsers).each(function(i,e){ displayClient(e.sid, e.nickname); })

    /* Hide the sign-in form, reveal the results panel and the "hand" */
    $('#nickname-display').text(myNick);
    $('#dSignIn').slideUp();
    $('#votingResult, #playersHand').slideDown();
    showCards();
  });
}

function clientReset(e){
  $('#playersHand .card').removeClass('selected');
  $('#votingResult .vote').text('');
  $('#votingResult .client').removeClass('voted');
  $('#votingResult').removeClass('reveal');
}

function clientRevoke(e){
  $('#votingResult .card-text');
  $('#' + e.sid + ' .vote').text('');
  $('#' + e.sid ).removeClass('voted');
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

function vote(card){
  if ( $(card).hasClass('selected') ) {
    /* The "current" vote has been clicked. We should revoke it. */
    cli.send('voteRevoke', null, function(res,msg){
      if(!res){ alert(msg); return false; }
      $('.card.selected').removeClass('selected');
    });
  } else {
    /* This is not the "current" vote. Send the new one. */
    
    // Clear out the old vote.
    $('.card.selected').removeClass('selected');

    // Get text of the new vote.
    var number = $(card).children('.card-text').text();

    // Send the new vote.
    cli.send('vote',{ 'number' : number }, function(res,msg){
      if(!res){ alert(msg); return false; }
      $(card).addClass('selected');
    });
  }
}

function displayClient(sid, nickname){
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
    displayClient(e.sid, e.nickname);
}
function clientDisconnected(e){
    $('#'+e.sid).remove();
}
