require(['scripts/socket_client.js','scripts/settings.js'],function(cl){
});

var cli= null;
var uName;
var voteValues = null;

$(document).ready(function(){
    document.addEventListener('clientReset',clientRes,false);
  document.addEventListener('adminDisconnected',adminDisconnected,false);
});

function signIn(){
  cli = new client(settings.server_host,settings.port);
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
