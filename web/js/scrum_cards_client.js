require(['js/socket_client.js'],function(cl){
});

var cli = null;
var mySid = null;
var myNick = null;
var myGame = null;
var voteValues = null;

/*******************************************************************************
 * BASIC SETUP, READY FUNCTIONS, AND THE SIGN IN FUNCTION                      *
 *******************************************************************************/

$(document).ready(function(){
  document.addEventListener('voteOccured',voteOccured,true);
  document.addEventListener('userSignedIn',userSignedIn,true);
  document.addEventListener('clientDisconnected',clientDisconnected,true);
  document.addEventListener('clientReset',clientReset,false);
  document.addEventListener('clientRevoke',clientRevoke,false);
  document.addEventListener('clientReveal',clientReveal,false);

  /* On form submit, execute signIn() but don't actually post/get or reload */
  $("#loginActions form").submit(function(){ signIn(1); return false; })
  $("#btnObserve").click(function(){ signIn(0); return false; })

  /* If we have a game hash, put it in the "game" text field */
  if ( window.location.hash.length ) {
    $("#loginActions #txtGame").val( window.location.hash.substring(1) );
  }

  /* Setup the reveal and restore buttons in #votingActions */
  $("#btnReveal").click(function(){ revealVotes(); });
  $("#btnReset").click(function(){ resetVotes(); });

  /* Set up the button to display the game link in voting actions */
  $("#btnLink").click(function(){
    if ( $(this).hasClass('active') ) {
      $('#gameLink').slideUp();
      $(this).removeClass('active');
    } else {
      $('#gameLink').slideDown();
      $(this).addClass('active');      
    }
  });

  /* I don't want to overwrite someone's clipboard without asking, but we will
   * select the whole thing when they click on the URL. */
  $("#txtUrl").click(function(){ $(this).select(); });
});

/**
 * Handle the sign in. The 'playing' argument is 1/0 and determines whether
 * this client is a pig (committed player) or a chicken (invested observer).
 */

function signIn(mode){
  cli = new client();
  myNick = $('#txtNickname').val();

  var data = {'nickname' : myNick, 'mode' : mode};

  /* Have we requested to join a specific game? */
  if ( window.location.hash.substring(1).length ) {
    data.game = window.location.hash.substring(1);
  }

  /**
   * Handle the login action and set up local variables
   */
  cli.send('signIn', data, function(res,msg){
    /* Server returned false; alert with message and bail */
    if(!res){ alert(msg); return false; }
    
    /* Show our hand if we're a playing client, not if we're observing */
    if (mode) {
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
    } else {
      $('<h3 />').text('Observing. Reload to participate.').appendTo('#playersHand');
    }

    /* Set client Socket ID for later; it's our identifier server-side */
    mySid = msg.sid;

    /* Use the sanitized nickname from the server so it appears
     * consistently among clients. */
    myNick = msg.nickname;

    /* Use the sanitized game from the server so we can send the link to others */
    myGame = msg.game;
    window.location.hash = ('#' + myGame);

    /* Populate the Game URL field */
    $('#txtUrl').val( window.location.href );

    /* Server should respond with users already in the game, display them */
    currentUsers = msg.users;
    $(currentUsers).each(function(i,e){
      // Only display them if they're playing
      if ( e.mode ) { displayClient(e.sid, e.nickname); }
    })

    /* Hide the sign-in form, reveal the results panel and the "hand" */
    $('#nickname-display').text(myNick);
    $('#login, #readme').slideUp();
    $('#votingResult, #playersHand').slideDown();
    showCards();
  });
}

/*******************************************************************************
 * FRONT-END UTILITY FUNCTIONS                                                 *
 *******************************************************************************/

/**
 * Animate reveal the hand of cards
 */
function showCards() {
  var newCards = $('.card:hidden');
  newCards.each(function(i){
    $(this).delay(250*i).fadeIn(300);
  });
}

/**
 * Create a vote card for a given user
 */
function displayClient(sid, nickname){
  $('<div />')
    .attr('id', sid)
    .addClass('client')
    .append('<div class="nickname">'+nickname+'</div>')
    .append('<div class="vote-wrap"><span class="vote"></span></div>')
    .appendTo('#clients');
}

/**
 * Add a vote number to a client voting card and highlight it.
 */
function addVote(sid,vote){
  $('#votingResult .card-text');
  $('#' + sid + ' .vote').text(vote);
  $('#' + sid ).addClass('voted');
}


/*******************************************************************************
 * SERVER SAYS...                                                              *
 *******************************************************************************/

/**
 * The server has ordered clients to reset all votes
 */
function clientReset(e){
  $('#playersHand .card').removeClass('selected');
  $('#votingResult .vote').text('');
  $('#votingResult .client').removeClass('voted');
  $('#votingResult').removeClass('reveal');
}

/**
 * The server has indicated that a user has withdrawn his or her vote
 */
function clientRevoke(e){
  $('#votingResult .card-text');
  $('#' + e.sid + ' .vote').text('');
  $('#' + e.sid ).removeClass('voted');
}

/**
 * The server has ordered clients to reveal all votes
 */
function clientReveal(e){
  $('#votingResult').addClass('reveal');
}

/**
 * The server has indicated that a client has voted
 */
function voteOccured(e){
  addVote(e.sid,e.number);
}

/**
 * The server has indicated that a user has connected. If they're playing (not
 * observing), pass it over to displayClient();
 */
function userSignedIn(e){
  if (e.mode) {
    displayClient(e.sid, e.nickname);
  }

  /**
   * Presently, the server doesn't store votes. The easy way to get new clients
   * caught up on votes that occurred before they connected is just to rebroadcast
   * the votes.
   */

  // Get text of the new vote.
  if ( $('.cards .selected').length ) {
    var number = $('.cards .selected').children('.card-text').text();

    // Send the vote. No callback actions because this isn't a real voting action.
    cli.send('vote',{ 'number' : number }, function(res,msg){ return true; });
  }
}

function clientDisconnected(e){
  $('#'+e.sid).remove();
}

/*******************************************************************************
 * USER ACTIONS, NOTIFY SERVER                                                 *
 *******************************************************************************/

/**
 * User has clicked a card. Send vote to server for broadcasting
 */
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

/**
 * User has clicked the "reset" button; tell the server. Reset is actually handled
 * by the event action so it happens simultaneously with other clients in the game
 */
function resetVotes(){
  cli.send('reset',null, function(res,msg){
    /* Server returned false; alert with message and bail */
    if(!res){ alert(msg); return false; }
  });
}

/**
 * Like above, but with the reveal button.
 */
function revealVotes(){
  cli.send('reveal',null, function(res,msg){
    /* Server returned false; alert with message and bail */
    if(!res){ alert(msg); return false; }
  });
}
