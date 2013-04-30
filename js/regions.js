var regionHistory = new Array();

function nav(location) {
  if (document.getElementById(location)) { 
    if (document.querySelector('.current')) {
      if (document.querySelector('.current').getAttribute('data-state') == 'drawer') {
        document.querySelector('.current').setAttribute('data-state', 'none');
        if (document.querySelector('.sidebar-faded-button')) {
          document.querySelector('.sidebar-faded-button').classList.remove('sidebar-faded-button');
        }
      }
      if (document.getElementById(location).getAttribute('role') != 'region') {
        document.querySelector('.current').classList.add('parent');
      } else {        
        document.querySelector('.current').classList.remove('parent');
      }
      document.querySelector('.current').classList.remove('current');
    }
    if (document.querySelector('.parent') && document.getElementById(location).getAttribute('role') == 'region') {
      document.querySelector('.parent').classList.remove('parent');
    }
    regionHistory.push(location);
    document.getElementById(location).classList.add('current');
  }
  
  // Generate docs list
  updateDocLists();
}

function navBack() {
  document.querySelector('.current').classList.remove('parent');
  document.querySelector('.current').classList.remove('current');
  regionHistory.pop();
  
  // This is a weird way to do this, but I couldn't figure out a better one.
  nav(regionHistory.pop());
  
  // Generate docs list
  updateDocLists();
}

function sidebar(name) {
  if (document.getElementById('sidebar_' + name) && document.querySelector('.current')) {
    if (document.querySelector('.current').getAttribute('data-state') == 'drawer') {
      document.getElementById('sidebar_' + name).classList.remove('active');
      document.querySelector('.current').setAttribute('data-state', 'none');
      if (document.getElementById('button_' + name)) {
        document.getElementById('button_' + name).classList.remove('sidebar-faded-button');
      }
    } else {
      document.getElementById('sidebar_' + name).classList.add('active');
      document.querySelector('.current').setAttribute('data-state', 'drawer'); 
      if (document.getElementById('button_' + name)) {
        document.getElementById('button_' + name).classList.add('sidebar-faded-button');
      }
    }
  }
}
