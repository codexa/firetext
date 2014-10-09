/*
* IO Handler
* Copyright (C) Codexa Organization.
* API docs here: https://github.com/codexa/firetext/wiki/io
*/

'use strict';

if (!io) {
	var io = {};
}

(function(window, undefined) {
	// Public API
	io = {
		isInitialized: false,
		initialized: new CustomEvent('io.initialized'),
		systems: {
			add: function(system,callback,systemid) {
				// Add an io system
				addSystem(system,callback,systemid);
			},
			remove: function(systemid,callback) {
				// Remove an io system			
			}
		},
		storages: {
			add: function(systemid,name,callback,storageid){
				// Add a storage
				addStorage(systemid,name,callback,storageid);
			},
			get: function() {
				// Return storage identifiers (not systems)
			},
			remove: function(storageid,callback){
				// Remove a storage		
			}
		},
		files: {
			add: function(storageid,name,blob,callback){
				// Create a file
			},
			enumerate: function(storageid,directory,callback,deep){
				// Get files in a storage
				enumerateStorage(storageid,directory,callback,deep);
			},
			read: function(storageid,filepath,callback){
				// Read a file
			},
			remove: function(storageid,filepath,callback){
				// Remove a file
			},
			write: function(storageid,filepath,blob,callback){
				// Write a file
			}
		}
	};
	
	// Private Variables
	var storages = [], systems = [];
	
	window.addEventListener('DOMContentLoaded', function() {init(function(){})}, false);

	// General functions
	function init(callback) {
		log('Initialized IO module');
		window.dispatchEvent(io.initialized);
		io.isInitialized = true;
	}
	
	function log(message) {
		console.log('IO: '+message);
	}
	
	// Systems
	function addSystem(system, callback, systemid) {
		if (system) {
			if (!systemid) {
				systemid = generateid();
			}
			systems.push([systemid,system]);
			log('Added '+system.name+' as a storage system (ID:'+systemid+')');
			callback(null,systemid);
		} else {
			// TBD: callback(error);
		}
	}
	
	// Storages
	function addStorage(systemid,name,callback,storageid) {
		if (!storageid) {
			var storageid = generateid();
		}
		storages.push([storageid,name,systemid]);
		log('Added '+name+' as a storage (ID:'+storageid+')');
		callback(null,storageid);
	}
	
	// Basic file methods
	function enumerateStorage(storageid,directory,callback,deep) {
		// Find system id
		var systemid;
		storages.forEach(function(v){
			if (v[0] === storageid) {
				systemid = v[2];
			}
		});
		
		// Catch for nonexistent storage/system
		if (!systemid) {
			callback();
		}
		
		// Get system object
		var system;
		systems.forEach(function(v){
			if (v[0] === systemid) {
				system = v[1];
			}
		});
		
		// Enumerate
		system.enumerate(storageid,directory,function(error,files){
			if (!error) {
				callback(null,files);
			} else {
				callback(error);			
			}
		},deep);
	}
	
	// Helper functions
	function generateid() {
		return Math.floor(Math.random()*16777215).toString(16);
	}
})(this);
