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
  } else if (firetext.settings.get('nightmode') == 'false') {
    html.classList.remove('night');
    doc.style.color = '#000';
  } else {
    html.classList.remove('night');
    doc.style.color = '#000';
    
    window.addEventListener('devicelight', function(event) {
      if (firetext.settings.get('nightmode') == 'auto') {
        if (event.value < 5) {
          if (html.classList.contains('night') != true) {
            html.classList.add('night');
            doc.style.color = '#fff';
          }
        } else if (event.value > 10) {
          if (html.classList.contains('night')) {
            html.classList.remove('night');
            doc.style.color = '#000';
          }
        }
      }
    });    
  }
}
