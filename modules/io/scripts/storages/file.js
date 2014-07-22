/*
* File API
* Copyright (C) Codexa Organization.
*/

'use strict';

if (!io) {
	var io = {};
}

(function(window, undefined) {
	// Private variables and methods
	// Variables
	var storage;
	
	// Init
	function init(callback) {
		// Check for File API
		window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
		if (window.requestFileSystem) {
			var onFSError = function() {
				// Could not initialize filesystem
				callback();
			}
			var requestFs = function(grantedBytes) {
				if(grantedBytes > 0) {
					requestFileSystem(PERSISTENT, grantedBytes, function(fs) {
						storage = fs;
						storage.root.getDirectory("Documents/", {create: true});
						
						// Success!
						callback();
					}, onFSError);
				} else {
					onFSError();
				}
			}
			if(navigator.webkitPersistentStorage) {
				navigator.webkitPersistentStorage.requestQuota( /*5MB*/5*1024*1024, requestFs, onFSError );
			} else if(webkitStorageInfo) {
				webkitStorageInfo.requestQuota( PERSISTENT, /*5MB*/5*1024*1024, requestFs, onFSError );
			} else {
				// Fail
				callback();
			}
		} else {
			// Fail
			callback();
		}
	}

	// Public API
	io.file = {
		delete: function (callback) {	
		},
		enumerate: function (callback) {	
		},
		init: function (callback) {
			init(function(storages){
				callback(storages);
			});
		},
		load: function (callback) {
		},
		rename: function (callback) {
		},
		save: function (callback) {
		}
	};
})(this);