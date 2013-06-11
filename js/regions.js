var regionHistory = new Array();
var tempLoc = '';

function nav(location) {
  tempLoc = '';
  if (document.getElementById(location)) {
    tempLoc = location;
    if (document.querySelector('.current') && document.querySelector('.current').getAttribute('data-state') == 'drawer') {
      sidebar(document.querySelector('[data-type=sidebar].active').id.replace(/sidebar_/, ''));
      setTimeout(function() {nav2();}, 500);
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
      if (getSettings('autozen') == 'true') {
        editFullScreen(true);    
      }
      
      // Lock screen in portrait
      if (screen.lockOrientation) {
        screen.lockOrientation('portrait');
      } else if (screen.mozLockOrientation) {
        screen.mozLockOrientation('portrait');
      }
    } else {
      // Unlock screen
      if (screen.unlockOrientation) {
        screen.unlockOrientation();
      } else if (screen.mozUnlockOrientation) {
        screen.mozUnlockOrientation();
      }
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
    
  /* Remove this section when porting to other projects */
  if (tempLoc == 'edit') {
    // Start Zen Mode if autozen == true
    if (getSettings('autozen') == 'true') {
      editFullScreen(true);    
    }
  }
  
  // Generate docs list
  updateDocLists();
  /* End of customized section */
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
  }
}
