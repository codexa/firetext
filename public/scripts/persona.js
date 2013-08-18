/* Sign in/Sign out buttons */
var signinLink = document.getElementById('signin');
if (signinLink) {
  signinLink.onclick = function() { navigator.id.request(); };
}

/* var signoutLink = document.getElementById('signout');
if (signoutLink) {
  signoutLink.onclick = function() { navigator.id.logout(); };
} */


/* Auth handler */
var currentUser = null;

navigator.id.watch({
  loggedInUser: currentUser,
  onlogin: function(assertion) { 
    /* Temporarily disabled
    $.ajax({
      type: 'POST',
      url: '/auth/login',
      data: {assertion: assertion},
      success: function(res, status, xhr) { window.location.reload(); },
      error: function(xhr, status, err) {
        navigator.id.logout();
        alert("Login failure: " + err);
      }
    });
    */
  },
  onlogout: function() {
    /* Temporarily disabled
    $.ajax({
      type: 'POST',
      url: '/auth/logout',
      success: function(res, status, xhr) { window.location.reload(); },
      error: function(xhr, status, err) { alert("Logout failure: " + err); }
    });
    */
  }
});
