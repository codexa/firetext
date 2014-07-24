/*
* Device Storage API
* Copyright (C) Codexa Organization.
*/

'use strict';

if (!io) {
	var io = {};
}

(function(window, undefined) {
	// Private variables and methods
	// Variables
	var sdcards;

	// Init
	function init(callback) {
		if (navigator.getDeviceStorage) {
			sdcards = navigator.getDeviceStorages("sdcard");
			if (!sdcards) {
				callback();
			}
			
			var storageNames = [];
		
			// Check availability
			sdcards.forEach(function(v,i){
				var request = v.available();

				request.onsuccess = function () {
					// The result is a string
					if (this.result != "available") {
						// sdcard is shared
						sdcards.remove(i);
					} else {
						// sdcard is available
						storageNames.push(v.storageName);
					}
				};

				request.onerror = function () {
					// sdcard is not available
					sdcards.remove(i);
				};			
			});
			
			callback(storageNames);
		} else {
			callback();
		}
	}
	
	// Helper functions
	// Array Remove - By John Resig (MIT Licensed)
	Array.prototype.remove = function(from, to) {
		var rest = this.slice((to || from) + 1 || this.length);
		this.length = from < 0 ? this.length + from : from;
		return this.push.apply(this, rest);
	};
	
	// Public API
	io.deviceStorage = {
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
