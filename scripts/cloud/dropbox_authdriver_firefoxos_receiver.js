/*
* Firefox OS Popup Dropbox Receiver
* Copyright (C) Codexa Organization.
*/

if (Dropbox && Dropbox.AuthDriver) {
	Dropbox.AuthDriver.FFOSPopup = (function(superClass) {
		var allowedOrigins = ["https://codexa.github.io", "http://firetext.codexa.bugs3.com", "localhost"];

		function FFOSPopup() {
		}
		
		FFOSPopup.locationOrigin = function(location) {
			var match;
			match = /^(file:\/\/[^\?\#]*)/.exec(location);
			if (match) {
				return "file";
			}
			
			match = /^([^\:]+\:\/\/localhost(:[0-9]*){0,1}([\/]|$))/.exec(location);
			if (match) {
				return "localhost";
			}
			
			match = /^([^\:]+\:\/\/[^\/\?\#]*)/.exec(location);
			if (match) {
				return match[1];
			}
			return location;
		};

		FFOSPopup.oauthReceiver = function(inApp) {
			window.addEventListener('load', function() {
				var frameError, getOriginMessage, ieError, message, opener, pageUrl, receiveMessage;
				pageUrl = window.location.href;
				getOriginMessage = JSON.stringify({
					_dropboxjs_needs_origin: true
				});
				message = JSON.stringify({
					_dropboxjs_oauth_info: pageUrl
				});
				Dropbox.AuthDriver.BrowserBase.cleanupLocation();
				opener = window.opener;
				if (window.parent !== window.top) {
					opener || (opener = window.parent);
				}
				if (opener) {
					receiveMessage = function(e) {
						if (e.source === opener &&
								(allowedOrigins.indexOf(Dropbox.AuthDriver.FFOSPopup.locationOrigin(e.origin)) !== -1 ||
								inApp)) {
							opener.postMessage(message, e.origin);
							window.close();
						}
					};
					window.addEventListener('message', receiveMessage, false);
					try {
						opener.postMessage(getOriginMessage, "*");
					} catch (_error) {
						ieError = _error;
					}
					try {
						opener.Dropbox.AuthDriver.FFOSPopup.onMessage.dispatch(message);
						window.close();
					} catch (_error) {
						frameError = _error;
					}
				}
			});
		};

		FFOSPopup.onMessage = new Dropbox.Util.EventSource;

		return FFOSPopup;
	})(Dropbox.AuthDriver.BrowserBase);
} else {
	console.log("Dropbox.js is not present.");
}