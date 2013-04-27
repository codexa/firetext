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
      if (document.getElementById(location).getAttribute('role') == 'dialog') {
        document.querySelector('.current').classList.add('parent');
      } else {        
        document.querySelector('.current').classList.remove('parent');
      }
      document.querySelector('.current').classList.remove('current');
    }
    regionHistory.push(location);
    document.getElementById(location).classList.add('current');
  }
}

function navBack() {
  document.querySelector('.current').classList.remove('current');
  regionHistory.pop();
  
  // This is a weird way to do this, but I couldn't figure out a better one.
  document.getElementById(regionHistory.pop()).classList.add('current');  
  regionHistory.push(document.querySelector('.current'));
}

function sidebar(name) {
  if (document.getElementById('sidebar_' + name) && document.querySelector('.current')) {
    if (document.querySelector('.current').getAttribute('data-state') == 'none') {
      document.getElementById('sidebar_' + name).classList.add('active');
      document.querySelector('.current').setAttribute('data-state', 'drawer'); 
      if (document.getElementById('button_' + name)) {
        document.getElementById('button_' + name).classList.add('sidebar-faded-button');
      }
    } else {      
      document.getElementById('sidebar_' + name).classList.remove('active');
      document.querySelector('.current').setAttribute('data-state', 'none');
      if (document.getElementById('button_' + name)) {
        document.getElementById('button_' + name).classList.remove('sidebar-faded-button');
      }
    }
  }
}

