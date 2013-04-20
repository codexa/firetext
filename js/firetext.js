'use strict'; 

var editor;

function init() {
  document.location.hash = 'welcome';
  editor = document.getElementById('editor');
}

window.addEventListener('hashchange', function() {
  if (location.hash == '#back') {
    window.history.back();
    window.history.back();
  } else if (document.getElementById(location.hash.replace(/#/, ''))) {
    if (document.querySelector('.current')) {    
      document.querySelector('.current').classList.remove('current');
    }
    document.getElementById(location.hash.replace(/#/, '')).classList.add('current');
  } else {
  }
});

function nav(location) {
  document.location.hash = location;
}

function navBack() {
  document.location.hash = 'back';
}
 
function formatDoc(sCmd, sValue) {
  document.execCommand(sCmd, false, sValue);
  editor.focus();
}