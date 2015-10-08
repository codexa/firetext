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
				// Code to get dropbox files
				updateDocLists(['recents', 'cloud']);
				
				// Show UI elements
				welcomeDropboxArea.style.display = 'block';
				openDialogDropboxArea.style.display = 'block';
				locationDropbox = document.createElement('option');
				locationDropbox.textContent = 'Dropbox';
				locationDropbox.value = 'dropbox';
				locationSelect.appendChild(locationDropbox);
				
				// This is a workaround for a very weird bug...					 
				setTimeout(updateAddDialog, 1);				
			} else {
				// Hide/Remove UI elements
				welcomeDropboxArea.style.display = 'none';
				openDialogDropboxArea.style.display = 'none';
				if (locationDropbox) {
					locationSelect.removeChild(locationDropbox);
					locationDropbox = undefined;
				}
			}
		});
	} else {
		// Hide/Remove UI elements
		welcomeDropboxArea.style.display = 'none';
		openDialogDropboxArea.style.display = 'none';
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
				firetext.recents.remove([dropRecents[i][0], dropRecents[i][1], dropRecents[i][2]], dropRecents[i][3], dropRecents[i][4]);
			}
		}	 
		
		// Show connect button
		mainButtonConnectDropbox.style.display = '';
	}
	
	updateAddDialog();
};

cloud.updateDocLists = function (lists) {
	if (firetext.settings.get('dropbox.enabled') == 'true' && cloud.dropbox.client) {
		spinner();
		cloud.dropbox.enumerate('/Documents/', function(DOCS) {
			buildDocList(DOCS, [welcomeDropboxList, openDialogDropboxList], "dropbox-documents-found", 'dropbox');
			spinner('hide');
		});
	}
}
