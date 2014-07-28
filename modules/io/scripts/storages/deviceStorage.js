/*
* Device Storage API
* Copyright (C) Codexa Organization.
*/

'use strict';

// Public
var deviceStorage;

(function(window, undefined) {	
	// Public API
	deviceStorage = {
		delete: function (callback) {
		
		},
		enumerate: function (callback) {
		
		},
		getStorages: function (callback) {
			getStorages(function(storages){
				callback(storages);
			});
		},
		load: function (callback) {
		
		},
		name: 'DeviceStorage',
		rename: function (callback) {
		
		},
		save: function (callback) {
		
		}
	};
	
	// Private variables and methods
	// Variables
	var sdcards;
	
	// Init
	if (io.initialized) {	
		init();
	} else {
		window.addEventListener('io.initialized', function(){
			init();
		});
	}
	
	function init() {
		io.systems.add(deviceStorage,function(){console.log('DeviceStorage!');});
	}

	// Get storages
	function getStorages(callback) {
		if (navigator.getDeviceStorage) {
			sdcards = navigator.getDeviceStorages("sdcard");
			if (!sdcards) {
				callback();
			}
			
			var storageNames = [];
			
			// Check availability
			var sdcardsLength = sdcards.length;
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
					
					// Callback when done
					if (i+1 >= sdcardsLength) {
						callback(storageNames);						
					}
				};

				request.onerror = function () {
					// sdcard is not available
					sdcards.remove(i);
				};			
			});
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
})(this);
