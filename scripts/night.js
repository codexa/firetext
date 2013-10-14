/*
* Night Mode
* Copyright (C) Codexa Organization 2013.
*/

'use strict';


/* Night Mode
------------------------*/
var ncss, dcss = document.getElementsByTagName("link")[25];

function night() {
  if (firetext.settings.get('nightmode') == 'true') {
    html.classList.add('night');
    doc.style.color = '#fff';
    
    // Add nighticons.css to DOM
    if (!ncss) {
      ncss = document.createElement("link");
      ncss.rel = "stylesheet";
      ncss.type = "text/css";
      ncss.href = "style/nighticons.css";
      head.insertBefore(ncss, dcss);
    }    
  } else if (firetext.settings.get('nightmode') == 'false') {
    html.classList.remove('night');
    doc.style.color = '#000';
    
    // Remove nighticons.css from DOM
    if (ncss) {
      head.removeChild(ncss);
      ncss = null;
    }    
  } else {
    html.classList.remove('night');
    doc.style.color = '#000';
    
    // Remove nighticons.css from DOM
    if (ncss) {
      head.removeChild(ncss);
      ncss = null;
    }
    window.addEventListener('devicelight', function(event) {
      if (firetext.settings.get('nightmode') == 'auto') {
        console.log(event.value);
        if (event.value < 5) {
          html.classList.add('night');
          doc.style.color = '#fff';
    
          // Add nighticons.css to DOM
          if (!ncss) {
            ncss = document.createElement("link");
            ncss.rel = "stylesheet";
            ncss.type = "text/css";
            ncss.href = "style/nighticons.css";
            head.insertBefore(ncss, dcss);
          }
        } else {
          html.classList.remove('night');
          doc.style.color = '#000';
    
          // Remove nighticons.css from DOM
          if (ncss) {
            head.removeChild(ncss);
            ncss = null;
          }
        }
      }
    });    
  }
}
