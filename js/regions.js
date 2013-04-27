var regionHistory = new Array();

function nav(location) {
  if (document.getElementById(location)) {
    if (document.querySelector('.current')) {
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
      document.querySelector('.current').setAttribute('data-state', 'drawer'); 
      if (document.getElementById('button_' + name)) {
        document.getElementById('button_' + name).style.transition = 'opacity .5s';
        document.getElementById('button_' + name).style.opacity = '0';
      }
    } else {
      document.querySelector('.current').setAttribute('data-state', 'none');
      if (document.getElementById('button_' + name)) {
        document.getElementById('button_' + name).style.transition = 'opacity .5s';
        document.getElementById('button_' + name).style.opacity = '1';
      }
    }
  }
}

