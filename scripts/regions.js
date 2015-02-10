/*
* Regions
* Navigation handler
* Copyright (C) Codexa Organization.
*/

'use strict';


/* Namespace Container
------------------------*/ 
var regions = {};


/* Variables
------------------------*/
regions.history = new Array();
var tempLoc = '';


/* Navigation
------------------------*/
regions.nav = function (location) {
	tempLoc = '';
	if (document.getElementById(location)) {
		tempLoc = location;
		if (document.querySelector('.current') && document.querySelector('.current').getAttribute('data-state') == 'drawer') {
			regions.sidebar(document.querySelector('[data-type=sidebar].active').id.replace(/sidebar_/, ''));
			setTimeout(function() { nav2(); }, 500);
		} else {
			nav2();
		}
	}
};

function nav2() {
	var tempElement = document.getElementById(tempLoc);
	if (tempElement) {
		var currentRegion = document.querySelector('.current');
		if (currentRegion) {
			if (tempElement.getAttribute('role') != 'region') {
				currentRegion.classList.add('parent');
			} else {				
				currentRegion.classList.remove('parent');
			}
			currentRegion.classList.remove('current');
		}
		var parentRegion = document.querySelector('.parent');
		if (parentRegion && tempElement.getAttribute('role') == 'region') {
			parentRegion.classList.remove('parent');
		}
		regions.history.push(tempLoc);
		tempElement.classList.add('current');
		
		/* Remove this section when porting to other projects */	 
		if (tempLoc == 'edit') {			
			// Save edit status
			firetext.settings.save('autoload.wasEditing', 'true');
			firetext.settings.save('autoload.dir', document.getElementById('currentFileDirectory').textContent);
			firetext.settings.save('autoload.name', document.getElementById('currentFileName').textContent);
			firetext.settings.save('autoload.ext', document.getElementById('currentFileType').textContent);
			firetext.settings.save('autoload.loc', document.getElementById('currentFileLocation').textContent);
			
			// Lock screen in portrait
			if (screen.lockOrientation) {
				screen.lockOrientation('portrait');
			} else if (screen.mozLockOrientation) {
				screen.mozLockOrientation('portrait');
			}			
		} else {
			if (tempElement.getAttribute('role') === 'region') {
				// Not editing if region
				firetext.settings.save('autoload.wasEditing', 'false');
			}
			
			// Unlock screen
			if (screen.unlockOrientation) {
				screen.unlockOrientation();
			} else if (screen.mozUnlockOrientation) {
				screen.mozUnlockOrientation();
			}
		}
	
		// Update docs lists
		if (tempLoc == 'welcome') {
			updateDocLists(['recents', 'cloud']);
		} else if (tempLoc == 'open') {
			updateDocLists(['cloud']);		
		}
		
		// Focus filename input
		if (tempLoc == 'add') {
			var onTransitionEnd = function () {
				document.getElementById('createDialogFileName').focus();
				tempElement.removeEventListener('transitionend', onTransitionEnd);
				tempElement.removeEventListener('webkitTransitionEnd', onTransitionEnd);
			};
			tempElement.addEventListener('transitionend', onTransitionEnd);
			tempElement.addEventListener('webkitTransitionEnd', onTransitionEnd);
		}
		
		// Move file location selector to active region
		if (tempLoc == 'add' || tempLoc == 'upload') {
			document.getElementById(tempLoc).getElementsByClassName('button-block')[0].appendChild(locationLegend);
		}
		/* End of customized section */
	}
}

regions.navBack = function () {
	document.querySelector('.current').classList.remove('parent');
	document.querySelector('.current').classList.remove('current');
	regions.history.pop();
	
	// This is a weird way to do this, but I couldn't figure out a better one.
	regions.nav(regions.history.pop());
}

regions.sidebar = function (name, state) {
	if (document.getElementById('sidebar_' + name) && document.querySelector('.current')) {
		if ((state && (state != 'open' || state == 'close')) || 
			(!state && document.querySelector('.current').getAttribute('data-state') == 'drawer')) {
			document.getElementById('sidebar_' + name).classList.remove('active');
			document.querySelector('.current').setAttribute('data-state', 'none');
		} else {
			document.getElementById('sidebar_' + name).classList.add('active');
			document.querySelector('.current').setAttribute('data-state', 'drawer'); 
			if (document.getElementById('sidebar_' + name).getAttribute('data-position') == 'right') {
				document.querySelector('.current').setAttribute('data-position', 'right'); 
			}
		}
	}
};

regions.tab = function (list, name) {
	if (document.getElementById('tab-'+name)) {
		// Unselect previous tab and button
		var previousTab = document.querySelector('.selected-tab');
		if (previousTab) {
			previousTab.classList.remove('selected-tab');
		}
		var previousTabButton = document.querySelector('.selected-tab-button');
		if (previousTabButton) {
			previousTabButton.classList.remove('selected-tab-button');
		}

		// Select tab
		document.getElementById('tab-'+name).classList.add('selected-tab');

		// Select tab button
		var tabButton = document.querySelector('[role="tab-button"][data-tab-id="'+name+'"]');
		if (tabButton) {
			tabButton.classList.add('selected-tab-button');                
		}

		/* Remove this section when porting to other projects */
		if (name === 'raw' && tempText) {
			((rawEditor.getSession()).getDocument()).setValue(tempText);
			tempText = undefined;
		}
		/* End of customized section */
	}
};
