
function addContact() {
  var contact = $('#contact').val();

  $.getJSON("addContact?contact=" + contact, function(data) {
    loadContacts();
    $('#contact').val('');
  });

}

function loadContacts() {

  $.getJSON("getContacts", function(data) {

     $.each(data.contacts, function(key, contact) {
       var user = contact.user;
       var userid = user.replace('@', '_');
       userid = userid.replace('.', '_');
       var status = '<span id="status-' + userid + '">' + contact.status + '</span>';
       var contact_id = "contact-" + user;
       var line = '<li id="' + contact_id + '">' + user + ' ['+ status +']</li>'

       if (!$('#'+contact_id).length) {
         $("#contacts").append(line );
       }
     });
  });


}

function appendLine(text) {
  var line = '\n' + text;
  $('#chat').append(line).scrollTop($('#chat').height());
}

	var signinLink = document.getElementById('signin');
	if (signinLink) {
		signinLink.onclick = function() { navigator.id.request(); };
	}

	var signoutLink = document.getElementById('signout');
	if (signoutLink) {
		signoutLink.onclick = function() { navigator.id.logout(); };
	}


    var ws = new WebSocket('ws://localhost:8080/chat');
    ws.onmessage = function(evt) {
        var data = jQuery.parseJSON(evt.data);
        var user = data.user;

        if (data.presence) {
           var user = user.replace('@', '_');
           user = user.replace('.', '_');

           var status = data.status;
           console.log($("#status-" + user))
           $("#status-" + user).text(status);
        }
        else {
        var user = data.user;
        var message = data.message;

        if (message.status) {
          if (message.status == 'online') {
             appendLine('*** ' + user + ' has entered the room');
             $("#users").append('<li id="' + user + '">' + user + '</li>');
          }
          if (message.status == 'offline') {
             appendLine('*** ' + user + ' has left the room');
             $("#" + user).remove();
          }
        }
        else {
          var msg = user + ': ' + message.message;
          appendLine(msg);
        }
        }
      };

var send = document.getElementById('send');

send.onclick = function() {
   if (currentUser) {
     var msg = $('#msg').val();
     ws.send(JSON.stringify({'user': currentUser, 'message': msg}));
     $('#msg').val("");
   }
   else {
    alert("you need to sign in");
   }
};

$("#msg").keyup(function(event){
    if(event.keyCode == 13){
      send.click();
    }
});

navigator.id.watch({
  loggedInUser: currentUser,
  onlogin: function(assertion) {
    $.ajax({
      type: 'POST',
      url: '/login',
      dataType: 'json',
      data: {assertion: assertion},
      success: function(res, status, xhr) {
        $('#signin').hide();
        $('#signout').show();
        $('#user').text(res.email);
        currentUser = res.email;
        // connect to the chat
        ws.send(JSON.stringify({'user': currentUser, 'status': 'online'}));

        // refresh the contact list
        loadContacts();
      },
      error: function(xhr, status, err) {
        navigator.id.logout();
        alert("Login failure: " + err);
      }
    });
  },
  onlogout: function() {
    $.ajax({
      type: 'POST',
      url: '/logout', // This is a URL on your website.
      success: function(res, status, xhr) {
        // disconnect from the chat
        ws.send(JSON.stringify({'user': currentUser, 'status': 'offline'}));
        //window.location.reload();
        $('#signin').show();
        $('#signout').hide();
        $('#user').text('no one');
        currentUser = null;

      },
      error: function(xhr, status, err) { alert("Logout failure: " + err); }
    });
  }
});


