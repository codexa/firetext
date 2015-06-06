/*
* Firefox OS Popup Dropbox Driver
* Copyright (C) Codexa Organization.
*/

if (Dropbox && Dropbox.AuthDriver) {
	var hasProp = {}.hasOwnProperty,
		indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
		extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };
	Dropbox.AuthDriver.FFOSPopup = (function(superClass) {
		extend(FFOSPopup, superClass);

		function FFOSPopup(options) {
			FFOSPopup.__super__.constructor.call(this, options);
			this.receiverUrl = this.baseUrl(options);
		}

		FFOSPopup.prototype.url = function() {
			return this.receiverUrl;
		};

		FFOSPopup.prototype.doAuthorize = function(authUrl, stateParam, client, callback) {
			this.listenForMessage(stateParam, callback);
			return this.openWindow(authUrl);
		};

		FFOSPopup.prototype.baseUrl = function(options) {
			var url;
			url = Dropbox.AuthDriver.BrowserBase.currentLocation();
			if (options) {
				if (options.receiverUrl) {
					return options.receiverUrl;
				} else if (options.receiverFile) {
					return this.replaceUrlBasename(url, options.receiverFile);
				}
			}
			return url;
		};

		FFOSPopup.prototype.openWindow = function(url) {
			return window.open(url, '_dropboxOauthSigninWindow', this.popupWindowSpec(980, 700));
		};

		FFOSPopup.prototype.popupWindowSpec = function(popupWidth, popupHeight) {
			var height, popupLeft, popupTop, ref, ref1, ref2, ref3, width, x0, y0;
			x0 = (ref = window.screenX) != null ? ref : window.screenLeft;
			y0 = (ref1 = window.screenY) != null ? ref1 : window.screenTop;
			width = (ref2 = window.outerWidth) != null ? ref2 : document.documentElement.clientWidth;
			height = (ref3 = window.outerHeight) != null ? ref3 : document.documentElement.clientHeight;
			popupLeft = Math.round(x0 + (width - popupWidth) / 2);
			popupTop = Math.round(y0 + (height - popupHeight) / 2.5);
			if (popupLeft < x0) {
				popupLeft = x0;
			}
			if (popupTop < y0) {
				popupTop = y0;
			}
			return ("width=" + popupWidth + ",height=" + popupHeight + ",") + ("left=" + popupLeft + ",top=" + popupTop) + 'dialog=yes,dependent=yes,scrollbars=yes,location=yes';
		};

		FFOSPopup.prototype.listenForMessage = function(stateParam, callback) {
			var listener;
			listener = (function(_this) {
				return function(event) {
					var data, oauthInfo, originMessage;
					if (event.data) {
						data = JSON.parse(event.data);
					} else {
						data = JSON.parse(event);
					}
					if (data.hasOwnProperty("_dropboxjs_needs_origin")) {
						originMessage = JSON.stringify({
							empty_data: true
						});
						event.source.postMessage(originMessage, event.origin);
					} else if (data.hasOwnProperty("_dropboxjs_oauth_info")) {
						oauthInfo = data._dropboxjs_oauth_info;
						if (!oauthInfo) {
							return;
						}
						if (_this.locationStateParam(oauthInfo) === stateParam) {
							stateParam = false;
							window.removeEventListener('message', listener);
							Dropbox.AuthDriver.FFOSPopup.onMessage.removeListener(listener);
							return callback(Dropbox.Util.Oauth.queryParamsFromUrl(oauthInfo));
						}
					}
				};
			})(this);
			window.addEventListener('message', listener, false);
			return Dropbox.AuthDriver.FFOSPopup.onMessage.addListener(listener);
		};

		FFOSPopup.onMessage = new Dropbox.Util.EventSource;

		return FFOSPopup;
	})(Dropbox.AuthDriver.BrowserBase);
} else {
	console.log("Dropbox.js is not present.");
}