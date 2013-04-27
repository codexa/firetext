window.addEventListener('hashchange', function() {
  if (location.hash == '#back') {
    document.querySelector('.current').classList.remove('parent');
    document.querySelector('.current').classList.remove('current');  
    window.history.back();
    window.history.back();
  } else if (document.getElementById(location.hash.replace(/#/, ''))) {
    if (document.querySelector('.current')) { 
      if (document.getElementById(location.hash.replace(/#/, '')).getAttribute('role') == 'dialog') {
        document.querySelector('.current').classList.add('parent');
      } else {
        document.querySelector('.current').classList.remove('parent');      
      }
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

// Drawer/sidebar
/*
document.addEventListener("DOMContentLoaded", function(){
  document.getElementById("menu").addEventListener("click", function(){
    var region = document.getElementById("edit");
    if (region.getAttribute("data-state") == "none" ) {
        region.setAttribute("data-state", "drawer");
    } else {
        region.setAttribute("data-state", "none");
    }
  });
  return false;
});
*/
