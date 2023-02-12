/*******************************************************************************
 * BASIC SETUP, READY FUNCTIONS, AND THE SIGN IN FUNCTION                      *
 *******************************************************************************/

$(document).ready(function(){
  /* If we have a cookie set, pull the nickname: */
  if ( typeof(Cookies.get('nickname')) === "string" ) {
    $('#txtNickname').val( Cookies.get('nickname') );
  }

  /* If we have a game hash, put it in the "game" text field */
  if ( window.location.hash.length ) {
    myGame = window.location.hash.substring(1);
    $("#loginActions #txtGame").val( myGame );
  }

  updateWelcomeCount();

  /* And update this banner when the game ID field changes */
  $('#txtGame').change(function(){
    myGame = $(this).val();
    updateWelcomeCount();
  })
});

/**
 * Handle the sign in. The 'playing' argument is 1/0 and determines whether
 * this client is a pig (committed player) or a chicken (invested observer).
 */

function signIn(mode){

    /* Set client Socket ID for later; it's our identifier server-side */
    mySid = msg.sid;

    /* Use the sanitized nickname from the server so it appears
     * consistently among clients, then save it for later. */
    myNick = msg.nickname;
    Cookies.set('nickname', myNick, {expires:31536000});

    /* Use the sanitized game from the server so we can send the link to others */
    myGame = msg.game;
    window.location.hash = ('#' + myGame);

    /* Populate the Game URL field */
    $('#txtUrl').val( window.location.href );

    if ( msg.users.length < 2 ) {
      $('#btnLink').trigger('click');
    }
}

/*******************************************************************************
 * FRONT-END UTILITY FUNCTIONS                                                 *
 *******************************************************************************/

/**
 * Update the login section banner with game participants
 */
function updateWelcomeCount() {
  if (typeof(myGame) === 'string' && myGame.length) {
    cli.send('getPlayerCount', {game: myGame}, function(res,msg){
      if (res && msg > 0) {
        var verb = (msg > 1) ? 'others are' : 'other is';
        $('#login h2').text(['Welcome!', msg, verb, 'playing.'].join(' '));
      } else {
        $('#login h2').text('Welcome! "' + myGame + '" is a new game.');
      }
    });
  } else {
    $('#login h2').text('Welcome! Start a new game.');
  }

}

/*******************************************************************************
 * SERVER SAYS...                                                              *
 *******************************************************************************/


/**
 * The server has indicated that a user has withdrawn his or her vote
 */
function clientRevoke(e){
  $('#votingResult .card-text');
  $('#' + e.sid + ' .vote').text('');
  $('#' + e.sid ).removeClass('voted');
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
