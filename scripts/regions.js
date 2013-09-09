/*
* Regions
* Navigation handler
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* RequireJS
------------------------*/
define(function (require) {

var firetext = require('firetext');
firetext.settings = require('settings');
var gcprettify = require('google-code-prettify');


/* Variables
------------------------*/
var regionHistory = new Array();
var tempLoc = '';


/* Navigation
------------------------*/
function nav(location) {
  tempLoc = '';
  if (document.getElementById(location)) {
    tempLoc = location;
    if (document.querySelector('.current') && document.querySelector('.current').getAttribute('data-state') == 'drawer') {
      sidebar(document.querySelector('[data-type=sidebar].active').id.replace(/sidebar_/, ''));
      setTimeout(function() {regions.nav2();}, 500);
    } else {
      nav2();
    }
  }
}

function nav2() {   
  if (document.getElementById(tempLoc)) { 
    if (document.querySelector('.current')) {
      if (document.getElementById(tempLoc).getAttribute('role') != 'region') {
        document.querySelector('.current').classList.add('parent');
      } else {        
        document.querySelector('.current').classList.remove('parent');
      }
      document.querySelector('.current').classList.remove('current');
    }
    if (document.querySelector('.parent') && document.getElementById(tempLoc).getAttribute('role') == 'region') {
      document.querySelector('.parent').classList.remove('parent');
    }
    regionHistory.push(tempLoc);
    document.getElementById(tempLoc).classList.add('current');
    
    /* Remove this section when porting to other projects */   
    if (tempLoc == 'edit') {    
      // Start Zen Mode if autozen == true
      if (firetext.settings.get('autozen') == 'true') {
        firetext.editFullScreen(true);    
      }
      
      // Lock screen in portrait
      if (screen.lockOrientation) {
        screen.lockOrientation('portrait');
      } else if (screen.mozLockOrientation) {
        screen.mozLockOrientation('portrait');
      }
      
      // Save edit status
      firetext.settings.save('autoload.wasEditing', 'true');
      firetext.settings.save('autoload.dir', document.getElementById('currentFileDirectory').textContent);
      firetext.settings.save('autoload.name', document.getElementById('currentFileName').textContent);
      firetext.settings.save('autoload.ext', document.getElementById('currentFileType').textContent);
      firetext.settings.save('autoload.loc', document.getElementById('currentFileLocation').textContent);  
      
    } else {
      // Unlock screen
      if (screen.unlockOrientation) {
        screen.unlockOrientation();
      } else if (screen.mozUnlockOrientation) {
        screen.mozUnlockOrientation();
      } 
      firetext.settings.save('autoload.wasEditing', 'false');
    }
  
    // Update docs lists
    if (tempLoc == 'open' | tempLoc == 'welcome') {
      firetext.updateDocLists();
    }
    /* End of customized section */
  }
}

function navBack() {
  document.querySelector('.current').classList.remove('parent');
  document.querySelector('.current').classList.remove('current');
  regionHistory.pop();
  
  // This is a weird way to do this, but I couldn't figure out a better one.
  nav(regionHistory.pop());
}

function sidebar(name) {
  if (document.getElementById('sidebar_' + name) && document.querySelector('.current')) {
    if (document.querySelector('.current').getAttribute('data-state') == 'drawer') {
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
}

function tab(list, name) {
  if (document.getElementById('tab-'+name)) {
    if (document.querySelector('.selected')) {
      document.querySelector('.selected').classList.remove('selected');
    }
    document.getElementById('tab-'+name).classList.add('selected');
    
    /* Remove this section when porting to other projects */
    if (name == 'raw') {
      gcprettify.prettyPrint();
    }
    /* End of customized section */
  }
}

});
