/*
* Cloud Storage
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Variables
------------------------*/
// Namespace
var cloud = {};


/* Cloud
------------------------*/
cloud.init = function () {
	// Dropbox
	if (firetext.settings.get('dropbox.enabled') == 'true') {
		cloud.dropbox.init(function(error){
			if (!error) {	
				// Try again to fetch previews for dropfox files
				resetPreviews('dropbox');
				
				// Code to get dropbox files
				updateDocLists(['recents', 'cloud']);
				
				// Show UI elements
				locationDropbox = document.createElement('option');
				locationDropbox.textContent = 'Dropbox';
				locationDropbox.value = 'dropbox';
				locationSelect.appendChild(locationDropbox);
				
				// This is a workaround for a very weird bug...					 
				setTimeout(updateAddDialog, 1);				
			} else {
				// Hide/Remove UI elements
				if (locationDropbox) {
					locationSelect.removeChild(locationDropbox);
					locationDropbox = undefined;
				}
			}
		});
	} else {
		// Hide/Remove UI elements
		if (locationDropbox) {
			locationSelect.removeChild(locationDropbox);
			locationDropbox = undefined;
		}
		
		// Sign out
		cloud.dropbox.signOut();
		
		// Close any open Dropbox files
		if (document.getElementById('currentFileLocation').textContent == 'dropbox') {
			regions.nav('welcome');
			regions.nav('settings');		
		}
		
		// Remove Dropbox recents
		var dropRecents = firetext.recents.get();
		for (var i = 0; i < dropRecents.length; i++) {
			if (dropRecents[i][4] == 'dropbox') {
				firetext.recents.remove(dropRecents[i]);
			}
		}	 
		
		// Update document lists
		updateDocLists(['recents', 'cloud']);
		
		// Show connect button
		mainButtonConnectDropbox.style.display = '';
	}
	
	updateAddDialog();
};
